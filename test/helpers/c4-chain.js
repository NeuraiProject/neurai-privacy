/* Synthetic chain of the bundled C4 TEST instance, built with this library:
 * real notes and encrypted records, Merkle paths and transaction templates from
 * planC4Operation and prepareC4, serialized by finishC4 with a placeholder
 * proof. Consensus would reject the placeholder; the scanner does not verify
 * proofs, so it reads these transactions like confirmed ones.
 *
 * Scenario, amounts in XNA (r = receiving address index, c = change address):
 *   D0 Alice 10 · T1 Alice → Bob r0 10 · W_full Bob 10 · D0 Alice 10 · D1 Bob 6
 *   T2 Alice → Bob r1 4, change 6 · T3 Alice → Carol 1, Bob r1 2, change 3
 *   T4 Bob → Alice r0 1, Alice r2 1, Carol 1, change 3 · W_partial Carol 1
 * Final balances: Alice 5, Bob 9, Carol 1; reserve 15.
 */
import { createHash } from 'node:crypto';
import { C4_TESTNET_MANIFEST as manifest, C4_TESTNET_COMMITMENT as commitment } from '../../src/c4-testnet.js';
import { c4StateScript, finishC4 } from '../../src/c4.js';
import { scanBrowserPool } from '../../src/browser-chain.js';
import { planC4Operation } from '../../src/pool-operations.js';
import { emptyPoolState, poolStateDigest } from '../../src/pool-state.js';
import { BrowserTestIdentity } from '../../src/browser-wallet.js';
import { ZkWalletIdentity } from '../../src/zk-wallet.js';

export { manifest, commitment };
export const pool = { network: 'testnet', domain: manifest.domain, assetId: manifest.assetId };
export const XNA = 100000000n;
export const SCRIPTS = { legacy: '76a914' + '11'.repeat(20) + '88ac', pq: '5220' + '22'.repeat(32), ecdsa: '5320' + '33'.repeat(32) };
const sha256 = data => createHash('sha256').update(data).digest();
const tag = text => sha256(text).toString('hex');
export const xna = atomic => { const v = BigInt(atomic); return `${v / XNA}.${(v % XNA).toString().padStart(8, '0')}`; };
export const hashAt = height => height === 0 ? manifest.genesis : tag('c4-test-block:' + height);
/** Valid curve points standing in for a Groth16 proof. */
export const PLACEHOLDER_PROOF = { pi_a: ['1', '2', '1'], pi_b: [['1', '0'], ['2', '0'], ['1', '0']], pi_c: ['1', '2', '1'] };
const bytes = text => Uint8Array.from(Buffer.from(text, 'hex'));

/** Fresh identities: Alice and Bob derived with many addresses, Carol a single-key file identity. */
export const wallets = {
  alice: () => ZkWalletIdentity.fromRoot({ root: new Uint8Array(64).fill(1), family: 'legacy', account: 0, ...pool }),
  bob: () => ZkWalletIdentity.fromRoot({ root: new Uint8Array(64).fill(2), family: 'pq', account: 0, ...pool }),
  carol: () => new BrowserTestIdentity(new Uint8Array(32).fill(3), new Uint8Array(32).fill(4),
    bytes(manifest.domain), bytes(manifest.assetId), null),
};
function pay(who, index, amount) {
  const identity = wallets[who]();
  try {
    const recipient = index === undefined ? identity.recipient() : identity.descriptorAt(0, index);
    return { recipient, amountAtomic: String(BigInt(amount) * XNA) };
  } finally { identity.lock(); }
}
const holding = amount => note => note.amountAtomic === BigInt(amount) * XNA;

const SCENARIO = [
  { by: 'alice', action: 'deposit', amount: 10 },
  { by: 'alice', action: 'transfer', note: holding(10), recipients: () => [pay('bob', 0, 10)] },
  { by: 'bob', action: 'withdraw', note: holding(10), payout: SCRIPTS.pq, sponsor: 'pq' },
  { by: 'alice', action: 'deposit', amount: 10, sponsor: 'ecdsa' },
  { by: 'bob', action: 'deposit', amount: 6, sponsor: 'pq' },
  { by: 'alice', action: 'transfer', note: holding(10), recipients: () => [pay('bob', 1, 4)] },
  { by: 'alice', action: 'transfer', note: holding(6), recipients: () => [pay('carol', undefined, 1), pay('bob', 1, 2)] },
  { by: 'bob', action: 'transfer', note: holding(6), sponsor: 'ecdsa',
    recipients: () => [pay('alice', 0, 1), pay('alice', 2, 1), pay('carol', undefined, 1)] },
  { by: 'carol', action: 'withdraw', note: holding(1), payout: SCRIPTS.ecdsa },
];

/** Decode a serialized witness transaction into the shape of getrawtransaction verbose output. */
export function decodeTransaction(raw) {
  const b = Buffer.from(raw, 'hex');
  let at = 0;
  const take = n => { at += n; return b.subarray(at - n, at); };
  const varint = () => {
    const first = b[at++];
    if (first < 253) return first;
    return first === 253 ? take(2).readUInt16LE(0) : take(4).readUInt32LE(0);
  };
  take(4);
  if (b[at] !== 0 || b[at + 1] !== 1) throw new Error('expected a witness transaction');
  at += 2;
  const bodyStart = at;
  const vin = Array.from({ length: varint() }, () => {
    const txid = Buffer.from(take(32)).reverse().toString('hex');
    const vout = take(4).readUInt32LE(0);
    take(varint());
    take(4);
    return { txid, vout };
  });
  const vout = Array.from({ length: varint() }, (_, n) => {
    const value = take(8).readBigUInt64LE(0);
    return { n, value: xna(value), scriptPubKey: { hex: take(varint()).toString('hex') } };
  });
  take(varint() * 36); // NIP-014 reference inputs (vrefin) of a version 3 transaction
  const bodyEnd = at;
  for (const input of vin) input.txinwitness = Array.from({ length: varint() }, () => take(varint()).toString('hex'));
  const stripped = Buffer.concat([b.subarray(0, 4), b.subarray(bodyStart, bodyEnd), take(4)]);
  return { txid: sha256(sha256(stripped)).reverse().toString('hex'), vin, vout };
}

/** RPC stub over a chain; tests mutate the returned copy freely. */
export function c4Harness(chain) {
  const h = {
    calls: [], hook: null, tipHeight: chain.tip,
    txs: new Map([...chain.txs].map(([txid, tx]) => [txid, structuredClone(tx)])),
    spends: new Map([...chain.spends].map(([point, spent]) => [point, { ...spent }])),
    unspent: new Set(chain.outputsAfter.at(-1)),
    finalState: chain.ops.at(-1)?.txid ?? manifest.birth,
  };
  h.tip = () => hashAt(h.tipHeight);
  /** Disconnect the last `count` pool operations and the blocks after them. */
  h.disconnect = count => {
    const first = chain.ops.length - count;
    h.tipHeight = chain.ops[first].height - 1;
    for (const op of chain.ops.slice(first)) {
      for (const [point, spent] of h.spends) if (spent.txid === op.txid) h.spends.delete(point);
    }
    h.unspent = new Set(chain.outputsAfter[first]);
  };
  const heights = new Map(Array.from({ length: chain.tip + 1 - manifest.birthHeight },
    (_, i) => [hashAt(manifest.birthHeight + i), manifest.birthHeight + i]));
  h.rpc = async (method, args) => {
    h.calls.push(method);
    const hooked = h.hook?.(method, args);
    if (hooked !== undefined) return hooked;
    if (method === 'getblockhash') {
      if (args[0] > h.tipHeight) throw new Error('Block height out of range');
      return hashAt(args[0]);
    }
    if (method === 'getbestblockhash') return h.tip();
    if (method === 'getblockcount') return h.tipHeight;
    if (method === 'getrawtransaction') {
      const tx = h.txs.get(args[0]);
      if (!tx) throw new Error('No such mempool or blockchain transaction');
      return tx.height === undefined ? tx : { ...tx, confirmations: h.tipHeight - tx.height + 1 };
    }
    if (method === 'getblock') {
      const height = heights.get(args[0]);
      return { hash: args[0], height, tx: [...h.txs.values()].filter(tx => tx.height === height) };
    }
    if (method === 'getspentinfo') {
      const spent = h.spends.get(args[0].txid + ':' + args[0].index);
      if (!spent) throw new Error('Unable to get spent info');
      return spent;
    }
    if (method === 'gettxout') return h.unspent.has(args[0] + ':' + args[1]) ? { value: 0, confirmations: 1 } : null;
    throw new Error('unexpected RPC ' + method);
  };
  return h;
}

async function build() {
  const parent = tag('c4-test-unique-parent');
  const birth = { txid: manifest.birth, blockhash: hashAt(manifest.birthHeight), height: manifest.birthHeight,
    vin: [{ txid: parent, vout: 0 }],
    vout: [{ n: 0, value: '0.00000000', scriptPubKey: { hex: c4StateScript(manifest, poolStateDigest(emptyPoolState())) } }] };
  const chain = {
    tip: manifest.birthHeight, ops: [], spends: new Map(), outputsAfter: [[manifest.birth + ':0']],
    txs: new Map([[birth.txid, birth], [parent, { txid: parent,
      vout: [{ n: 0, value: '0.00000000', scriptPubKey: { hex: '00' + Buffer.from(manifest.identity).toString('hex') } }] }]]),
  };
  for (const [i, step] of SCENARIO.entries()) {
    const identity = wallets[step.by]();
    try {
      const scan = await scanBrowserPool({ rpc: c4Harness(chain).rpc, manifest, expectedCommitment: commitment, identity });
      const note = step.note && scan.notes.find(n => !n.spent && step.note(n));
      if (step.note && !note) throw new Error(`scenario step ${i}: note not found`);
      const plan = planC4Operation({ identity, scan, action: step.action, note: note?.cm, pool,
        amountAtomic: step.amount && String(BigInt(step.amount) * XNA), recipients: step.recipients?.() });
      const sponsor = { txid: tag('sponsor:' + i), vout: 0, valueSats: '100000000', scriptHex: SCRIPTS[step.sponsor ?? 'legacy'] };
      const funding = step.action === 'deposit'
        ? { txid: tag('funding:' + i), vout: 1, valueSats: plan.amountAtomic, scriptHex: SCRIPTS.legacy } : undefined;
      const prepared = identity.prepareC4({ manifest, scan, form: plan.form, created: plan.created, consumed: plan.consumed,
        funding, sponsor, payout: step.payout, feeAtomic: '10000000', expectedCommitment: commitment });
      const tx = decodeTransaction(finishC4(prepared, PLACEHOLDER_PROOF, prepared.publicSignals));
      const height = chain.tip + 10;
      Object.assign(tx, { blockhash: hashAt(height), height });
      chain.txs.set(tx.txid, tx);
      if (funding) {
        chain.txs.set(funding.txid, { txid: funding.txid, vout: [{ n: 0, value: '0.00000000', scriptPubKey: { hex: SCRIPTS.legacy } },
          { n: 1, value: xna(funding.valueSats), scriptPubKey: { hex: funding.scriptHex } }] });
      }
      chain.spends.set(chain.outputsAfter.at(-1)[0], { txid: tx.txid, index: 0, height });
      chain.outputsAfter.push([tx.txid + ':0', ...(plan.form === 'W_full' ? [] : [tx.txid + ':1'])]);
      chain.ops.push({ form: plan.form, txid: tx.txid, height });
      chain.tip = height;
    } finally { identity.lock(); }
  }
  chain.tip += 2;
  return chain;
}

/** The scenario chain, built once per test file. */
export const chain = await build();
