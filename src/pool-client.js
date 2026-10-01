/* Main-thread helpers for pool operations: RPC checks, coin selection and
 * publication. No private keys, notes or circuit inputs pass through here.
 * `rpc(method, params)` has the shape of @neuraiproject/neurai-rpc getRPC.
 */
import { rpcAmountToSatoshis } from './amounts.js';

const strictScript = /^(?:52|53)20[0-9a-f]{64}$/;
function accepts(script, profile) {
  if (profile !== 'C3' && profile !== 'C4') throw new Error('Unknown pool profile');
  return LEGACY_P2PKH.test(script) || (profile === 'C4' && strictScript.test(script));
}
export const LEGACY_P2PKH = /^76a914[0-9a-f]{40}88ac$/;
/** Minimum change left in the fee coin, so its change output is not dust. */
export const MIN_SPONSOR_CHANGE_ATOMIC = 546n;
/** Read-only methods the pool worker may ask the main thread to forward. */
export const POOL_READ_RPC_METHODS = Object.freeze(['getblockhash', 'getbestblockhash', 'getblockcount', 'getblock',
  'getrawtransaction', 'gettxout', 'getspentinfo']);
export function isPoolReadRpc(method) { return POOL_READ_RPC_METHODS.includes(method); }

function message(error) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') return error.description ?? error.error?.message ?? JSON.stringify(error);
  return String(error);
}

/** Refuse RPC nodes of another chain before trusting any answer. */
export async function assertPoolChain(rpc, manifest) {
  if (await rpc('getblockhash', [0]) !== manifest.genesis) throw new Error('RPC node is not on the network of this pool');
}

/**
 * Confirmed Legacy P2PKH coins of the base currency, in the shape the pool
 * worker expects. `utxos` are wallet rows {txid, outputIndex, script, satoshis, assetName, address}.
 */
export async function confirmedPoolCoins(rpc, utxos, { baseCurrency, profile = 'C3' }) {
  const coins = [];
  for (const row of utxos) {
    if (!accepts(row.script, profile) || row.assetName !== baseCurrency) continue;
    const live = await rpc('gettxout', [row.txid, row.outputIndex, true]);
    if (!live || live.confirmations < 1) continue;
    const coin = { ...row, vout: row.outputIndex, valueSats: String(row.satoshis), scriptHex: row.script };
    coins.push(coin);
  }
  return coins;
}

/** Pick the exact-value deposit coin (deposits only) and a separate coin that pays the public fee. */
export function selectPoolCoins(coins, { action, amountAtomic, feeAtomic, profile = 'C3' }) {
  const fee = BigInt(feeAtomic);
  if (fee < 0n) throw new Error('Fee must not be negative');
  coins = coins.filter(c => accepts(c.scriptHex, profile));
  let funding;
  if (action === 'deposit') {
    const wanted = String(BigInt(amountAtomic));
    funding = coins.find(c => c.valueSats === wanted);
    if (!funding) throw new Error('No confirmed coin matches this deposit. Prepare an exact deposit coin, wait for its confirmation and retry.');
  }
  const sponsor = coins.find(c => c !== funding && BigInt(c.valueSats) >= fee + (profile === 'C4' ? (c.scriptHex.startsWith('5220') ? 3060n : c.scriptHex.startsWith('5320') ? 336n : 546n) : MIN_SPONSOR_CHANGE_ATOMIC));
  if (!sponsor) throw new Error('A separate confirmed supported XNA coin is needed for the fee');
  return { funding, sponsor };
}

/** Recheck a funding or fee coin against the node: unspent, confirmed, Legacy and exact value. */
export async function checkPoolCoin(rpc, coin, { profile = 'C3' } = {}) {
  const live = await rpc('gettxout', [coin.txid, coin.vout, true]);
  if (!live || live.confirmations < 1 || live.scriptPubKey?.hex !== coin.scriptHex || !accepts(coin.scriptHex, profile)) {
    throw new Error('Funding coin is spent, unconfirmed or unsupported');
  }
  if (rpcAmountToSatoshis(live.value).toString() !== String(coin.valueSats)) throw new Error('Funding value mismatch');
}

/** Output script of a Legacy withdrawal address, validated by the node. */
export async function withdrawalScript(rpc, address, { profile = 'C3' } = {}) {
  const result = await rpc('validateaddress', [String(address ?? '').trim()]);
  if (!result?.isvalid || !accepts(result.scriptPubKey ?? '', profile)) throw new Error(profile === 'C3' ? 'Withdrawals from this pool require a Legacy address'
    : 'Withdrawals from this pool require a Legacy, PQ or ECDSA address');
  return result.scriptPubKey;
}

/** Inputs still unspent on the pool's chain; call again right before publishing. */
export async function recheckInputs(rpc, manifest, points) {
  await assertPoolChain(rpc, manifest);
  for (const p of points) {
    if (!await rpc('gettxout', [p.txid, p.vout, true])) throw new Error('An input was spent while preparing. Refresh and rebuild the proof.');
  }
}

/** testmempoolaccept, then decode. Nothing is broadcast. */
export async function admitTransaction(rpc, raw) {
  const check = await rpc('testmempoolaccept', [[raw]]);
  if (!check?.[0]?.allowed) throw new Error(check?.[0]?.['reject-reason'] ?? 'Node did not accept the prepared transaction');
  const decoded = await rpc('decoderawtransaction', [raw]);
  return { txid: decoded.txid, decoded };
}

/** A self-transfer that creates an exact deposit coin: admission, fee and inputs. Nothing is broadcast. */
export async function inspectFundingTransaction(rpc, raw) {
  const tx = await rpc('decoderawtransaction', [raw]);
  const check = await rpc('testmempoolaccept', [[raw]]);
  if (!check?.[0]?.allowed) throw new Error(check?.[0]?.['reject-reason'] ?? 'Funding transaction rejected');
  let inputs = 0n;
  for (const input of tx.vin) {
    const live = await rpc('gettxout', [input.txid, input.vout, true]);
    if (!live) throw new Error('Funding input already spent');
    inputs += rpcAmountToSatoshis(live.value);
  }
  const outputs = tx.vout.reduce((sum, output) => sum + rpcAmountToSatoshis(output.value), 0n);
  return { txid: tx.txid, feeAtomic: inputs - outputs, points: tx.vin.map(input => ({ txid: input.txid, vout: input.vout })) };
}

/**
 * Recheck, admit and broadcast. `onBroadcast(txid)` runs just before sending, so
 * the caller can record the txid. If sending fails the outcome is unknown and
 * the error has `uncertain: true`: check publicationStatus before rebuilding.
 */
export async function publishTransaction(rpc, manifest, { raw, txid, points }, { onBroadcast } = {}) {
  await recheckInputs(rpc, manifest, points);
  const check = await rpc('testmempoolaccept', [[raw]]);
  if (!check?.[0]?.allowed) throw new Error(check?.[0]?.['reject-reason'] ?? 'Transaction is no longer admissible');
  const decoded = await rpc('decoderawtransaction', [raw]);
  if (decoded?.txid !== txid) throw new Error('Prepared transaction ID does not match its bytes');
  onBroadcast?.(txid);
  let sent;
  try { sent = await rpc('sendrawtransaction', [raw]); }
  catch (error) { throw Object.assign(new Error('Publication result is uncertain: ' + message(error)), { uncertain: true }); }
  if (sent !== txid) throw Object.assign(new Error('Unexpected transaction ID; check the explorer before retrying'), { uncertain: true });
  return sent;
}

/**
 * Status after an uncertain publication: 'confirmed', 'mempool', or 'retryable'
 * when the node has not seen it and the same bytes are still admissible.
 * Throws while the outcome stays uncertain.
 */
export async function publicationStatus(rpc, manifest, { txid, raw, points = [] }) {
  await assertPoolChain(rpc, manifest);
  let tx = null;
  try { tx = await rpc('getrawtransaction', [txid, true]); } catch { tx = null; }
  if (tx) {
    if (tx.txid !== txid) throw new Error('RPC returned another transaction');
    return tx.confirmations > 0 ? 'confirmed' : 'mempool';
  }
  if (!raw) throw new Error('Transaction status is unavailable. Keep its ID and check the explorer.');
  await recheckInputs(rpc, manifest, points);
  const acceptance = await rpc('testmempoolaccept', [[raw]]);
  if (!acceptance?.[0]?.allowed) throw new Error('Publication remains uncertain. Do not build a replacement yet.');
  return 'retryable';
}
