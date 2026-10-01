import { validateC4Manifest, c4StateScript, C4_FORMS } from './c4.js';
import { decodeC4Publication } from './c4-publication.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { decodeField } from './poseidon.js';
import { emptyPoolState, poolIndexedInsert, poolStateDigest } from './pool-state.js';

const HEX32 = /^[0-9a-f]{64}$/i;
const MAX_MONEY = 2_100_000_000_000_000_000n;
const utf8 = new TextEncoder();

function demand(ok, reason) { if (!ok) throw new Error(`pool scan: ${reason}`); }
function unhex(hex, name) {
  demand(typeof hex === 'string' && /^(?:[0-9a-f]{2})*$/i.test(hex), `${name} is not hex`);
  return Uint8Array.from(hex.match(/../g) ?? [], pair => parseInt(pair, 16));
}
function hex(bytes) { return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(''); }
function concat(...parts) {
  const out = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let at = 0;
  for (const part of parts) { out.set(part, at); at += part.length; }
  return out;
}
function sameOutpoint(vin, outpoint) {
  return vin?.txid === outpoint?.[0] && vin?.vout === outpoint?.[1];
}
function sats(value) {
  const str = typeof value === 'number' && Number.isFinite(value) ? String(value) : value;
  demand(typeof str === 'string' && /^(?:0|[1-9]\d*)(?:\.\d+)?(?:e-?\d+)?$/i.test(str), 'invalid XNA value');
  const [base, expPart] = str.toLowerCase().split('e');
  const [whole, fraction = ''] = base.split('.');
  const places = 8 - fraction.length + Number(expPart ?? 0);
  demand(Number.isSafeInteger(places) && places >= -100 && places <= 100, 'invalid XNA decimal scale');
  const digits = BigInt(whole + fraction);
  const numerator = places >= 0 ? digits * (10n ** BigInt(places)) : digits;
  const denominator = places >= 0 ? 1n : 10n ** BigInt(-places);
  demand(numerator % denominator === 0n, 'nonintegral XNA amount');
  const result = numerator / denominator;
  demand(result >= 0n && result <= MAX_MONEY, 'XNA amount out of range');
  return result;
}
function parseRecord(identity, record, cm) {
  if (!identity) return null;
  try { return identity.openRecord(record, cm); }
  catch { return null; } // AEAD failure is normal for another recipient's note.
}

function walletCheckpointTag(identity) {
  if (!identity) return null;
  return identity.fingerprint === undefined ? identity.recipient().owner
    : `${identity.derivation}:${identity.storageId}`;
}

function checkpointFor({ manifest, height, blockhash, birth, state, reserve, stateOutpoint,
  reserveOutpoint, transitions, published, spentBy, notes, identity }) {
  const indexed = tree => [...tree].map(([index, [value, next, nextIndex]]) =>
    [index, [String(value), String(next), nextIndex]]);
  return {
    version: 1, manifestId: hex(sha256(utf8.encode(JSON.stringify(manifest)))),
    height, blockhash, birth, reserveAtomic: String(reserve), stateOutpoint, reserveOutpoint,
    state: { mode: state.mode, slots: [...state.slots].map(([index, value]) => [index, hex(value)]),
      seen: indexed(state.seen), nfs: indexed(state.nfs) },
    transitions: transitions.map(t => ({ ...t, reserveAtomic: String(t.reserveAtomic) })),
    published: published.map(e => ({ ...e, cm: hex(e.cm), record: hex(e.record) })),
    spentBy: [...spentBy].map(([nf, spent]) => [String(nf), spent]),
    walletTag: walletCheckpointTag(identity),
    walletWindow: identity?.gap === undefined ? null : { gap: identity.gap, issued: identity.issued },
    owned: [...notes.values()].map(n => ({ cm: n.cm, amountAtomic: String(n.amountAtomic),
      nf: String(n.nf), note: n.note, slot: n.slot, txid: n.txid, height: n.height,
      address: n.address ?? null }))
  };
}

function restoreCheckpoint(saved, manifest, limit) {
  if (saved?.version !== 1 || saved.manifestId !== hex(sha256(utf8.encode(JSON.stringify(manifest)))) ||
      !Number.isSafeInteger(saved.height) || saved.height < 1 || saved.height > limit ||
      !HEX32.test(saved.blockhash) || !saved.birth || !Array.isArray(saved.stateOutpoint) ||
      !Array.isArray(saved.transitions) || !Array.isArray(saved.published) || !Array.isArray(saved.spentBy) ||
      !Array.isArray(saved.owned)) return null;
  try {
    const indexed = rows => new Map(rows.map(([index, [value, next, nextIndex]]) =>
      [index, [BigInt(value), BigInt(next), nextIndex]]));
    const state = { mode: saved.state.mode,
      slots: new Map(saved.state.slots.map(([index, value]) => [index, unhex(value, 'cached note')])),
      seen: indexed(saved.state.seen), nfs: indexed(saved.state.nfs) };
    if (!state.seen.has(0) || !state.nfs.has(0) ||
        state.slots.size !== saved.published.length ||
        saved.stateOutpoint[1] !== 0 || !HEX32.test(saved.stateOutpoint[0])) return null;
    const transitions = saved.transitions.map(t => ({ ...t, reserveAtomic: BigInt(t.reserveAtomic) }));
    const published = saved.published.map(e => ({ ...e, cm: unhex(e.cm, 'cached commitment'),
      record: unhex(e.record, 'cached record') }));
    if (published.some(e => e.cm.length !== 32 || e.record.length !== 1024 ||
        !Number.isSafeInteger(e.slot) || e.slot < 0 || !HEX32.test(e.txid))) return null;
    const spentBy = new Map(saved.spentBy.map(([nf, spent]) => [BigInt(nf), spent]));
    const reserve = BigInt(saved.reserveAtomic);
    const digest = poolStateDigest(state);
    return { state, digest, birth: saved.birth, stateOutpoint: saved.stateOutpoint,
      reserveOutpoint: saved.reserveOutpoint, reserve, transitions, published, spentBy,
      height: saved.height, blockhash: saved.blockhash, owned: saved.owned,
      walletWindow: saved.walletWindow, walletTag: saved.walletTag };
  } catch { return null; }
}

/** Rebuilds the pool state, trees and owned notes from confirmed transactions.
 * rpc(method, params) must address a fully validating node. The manifest must
 * match an independently pinned commitment (expectedCommitment). Persisted
 * checkpoints must be authenticated by the wallet before passing them here.
 *
 * strategy 'spent-index' (default) follows the state UTXO from its birth with
 * getspentinfo, so its cost grows with pool operations, not with blocks.
 * It needs a node started with -spentindex and -txindex. Each spender must be
 * confirmed in the active chain at the reported height and spend the state as
 * input 0; every block used is checked again at the end to detect a reorg.
 * strategy 'blocks' replays every block from the birth and requires the tip to
 * stay unchanged; it does not need the spent index.
 */
export async function scanBrowserPool({ rpc, manifest, identity, stopHeight, onProgress = () => {},
  strategy = 'spent-index', checkpoint, expectedGenesis, expectedCommitment }) {
  validateC4Manifest(manifest, { expectedGenesis, expectedCommitment });
  const forms = C4_FORMS;
  const vkHashes = Object.fromEntries(forms.map(f => [f, manifest.forms[f].vkHash]));
  const mode = strategy;
  demand(mode === 'blocks' || mode === 'spent-index', 'unknown scan strategy');
  const makeStateScript = digest => c4StateScript(manifest, digest);
  demand(typeof rpc === 'function', 'RPC function required');
  demand(new Set(Object.values(vkHashes)).size === forms.length, 'duplicate VK registry');
  const call = (method, ...params) => rpc(method, params);
  demand(await call('getblockhash', 0) === manifest.genesis, 'wrong genesis');
  const tip = await call('getbestblockhash');
  const currentHeight = await call('getblockcount');
  const height = stopHeight ?? currentHeight;
  demand(Number.isSafeInteger(currentHeight) && Number.isSafeInteger(height) &&
    currentHeight >= height && height >= 1, 'invalid scan height');
  if (identity) {
    const recipient = identity.recipient();
    demand(recipient.domain === manifest.domain && recipient.asset_id === manifest.assetId,
      'wallet belongs to another pool instance');
  }
  let restored = checkpoint && mode === 'spent-index' ? restoreCheckpoint(checkpoint, manifest, height) : null;
  if (restored && await call('getblockhash', restored.height) !== restored.blockhash) restored = null;
  const state = restored?.state ?? emptyPoolState();
  let digest = restored?.digest ?? poolStateDigest(state);
  const initialScript = makeStateScript(digest);
  let birth = restored?.birth ?? null;
  let stateOutpoint = restored?.stateOutpoint ?? null;
  let reserveOutpoint = restored?.reserveOutpoint ?? null;
  let reserve = restored?.reserve ?? 0n;
  const notes = new Map();
  const transitions = restored?.transitions ?? [];
  // Published note records and nullifiers; ownership is resolved after the walk,
  // so a multi-address identity can widen its search window over all records.
  const published = restored?.published ?? [];
  const cachedPublishedCount = published.length;
  const spentBy = restored?.spentBy ?? new Map();
  async function applyBirth(tx, blockHeight) {
    demand(!birth, 'multiple pool births');
    let uniqueConsumed = false;
    for (const vin of tx.vin ?? []) {
      if (!vin.txid) continue;
      const parent = await call('getrawtransaction', vin.txid, true);
      const script = parent?.vout?.[vin.vout]?.scriptPubKey?.hex;
      if (typeof script === 'string' && script.includes(hex(utf8.encode(manifest.identity)))) {
        uniqueConsumed = true; break;
      }
    }
    demand(uniqueConsumed, 'birth did not consume UNIQUE');
    birth = { txid: tx.txid, height: blockHeight };
    stateOutpoint = [tx.txid, 0];
  }
  async function applyTransition(tx, blockHeight) {
    const vin = tx.vin ?? [];
    const witness = vin[0].txinwitness;
    demand(Array.isArray(witness) && witness.length >= 5 && witness[0] === '10',
      'state spend is not MAST');
    const vkHash = hex(sha256(unhex(witness[2], 'VK')));
    const form = forms.find(name => vkHashes[name] === vkHash);
    demand(form, 'unknown pool VK');
    const expected = manifest.forms[form];
    demand(witness.length === (form.startsWith('W') ? 7 : 8) &&
      witness[witness.length - 2] === expected.script &&
      witness[witness.length - 1] === expected.control && witness[2] === expected.vk,
      'unexpected pool leaf, control or VK');
    const expectReserve = form !== 'D0';
    demand((reserve > 0n) === expectReserve, 'unexpected reserve/form combination');
    if (reserveOutpoint) demand(sameOutpoint(vin[1], reserveOutpoint),
      'transition skipped canonical reserve');
    if (form.startsWith('D') || form.startsWith('T')) {
      demand(witness.length >= 7, 'missing publication');
      const blob = concat(unhex(witness[3], 'blob first half'),
        unhex(witness[4], 'blob second half'));
      demand(blob.length === 4096, 'bad publication size');
      const publication = decodeC4Publication(form, blob);
      if (publication.nf) {
        const nf = decodeField(publication.nf);
        state.nfs = poolIndexedInsert('nf', state.nfs, nf);
        spentBy.set(nf, { txid: tx.txid, height: blockHeight });
      }
      const entries = publication.cms.map((cm, i) => [cm, publication.records[i]]);
      for (const [cm, record] of entries) {
        demand(record.length === 1024, 'bad encrypted record');
        const slot = state.slots.size;
        state.slots.set(slot, cm);
        state.seen = poolIndexedInsert('cm', state.seen, decodeField(cm));
        published.push({ cm, record, slot, txid: tx.txid, height: blockHeight });
      }
      state.mode = 1;
    } else {
      const nf = decodeField(unhex(witness[3], 'nullifier'));
      state.nfs = poolIndexedInsert('nf', state.nfs, nf);
      spentBy.set(nf, { txid: tx.txid, height: blockHeight });
      state.mode = form === 'W_full' ? 0 : 1;
    }
    digest = poolStateDigest(state);
    demand(tx.vout?.[0]?.scriptPubKey?.hex === makeStateScript(digest),
      'pool state root disagrees with block');
    let newReserve = 0n;
    let newReserveOutpoint = null;
    if (form === 'W_full') {
      demand(reserveOutpoint, 'empty full withdrawal');
      demand(!(tx.vout ?? []).slice(1).some(v =>
        v.scriptPubKey?.hex?.startsWith('5120' + manifest.reserveCommitment)),
      'full withdrawal left a reserve');
    } else {
      const output = tx.vout?.[1];
      demand(output?.scriptPubKey?.hex === '5120' + manifest.reserveCommitment,
        'wrong reserve output');
      newReserve = sats(output.value);
      demand(newReserve > 0n, 'empty reserve');
      newReserveOutpoint = [tx.txid, 1];
    }
    if (form.startsWith('T')) demand(newReserve === reserve, 'transfer changed reserve');
    else if (form.startsWith('D')) {
      demand(newReserve > reserve, 'deposit did not increase reserve');
      const previous = vin[form === 'D0' ? 1 : 2];
      const spent = await call('getrawtransaction', previous.txid, true);
      demand(newReserve - reserve === sats(spent?.vout?.[previous.vout]?.value),
        'reserve delta differs from deposit');
    } else {
      demand(newReserve < reserve, 'withdrawal did not decrease reserve');
      const outputIndex = form === 'W_full' ? 1 : 2;
      demand(reserve - newReserve === sats(tx.vout?.[outputIndex]?.value),
        'reserve delta differs from withdrawal');
    }
    reserve = newReserve;
    reserveOutpoint = newReserveOutpoint;
    stateOutpoint = [tx.txid, 0];
    transitions.push({ txid: tx.txid, height: blockHeight, form,
      digest: decodeField(digest).toString(), reserveAtomic: reserve });
  }
  let scannedHeight = height;
  let finalTip = tip;
  if (mode === 'blocks') {
    for (let blockHeight = manifest.birthHeight; blockHeight <= height; blockHeight++) {
      onProgress({ height: blockHeight, total: height });
      const blockHash = await call('getblockhash', blockHeight);
      const block = await call('getblock', blockHash, 2);
      demand(block?.hash === blockHash && block?.height === blockHeight &&
        Array.isArray(block.tx), 'block RPC mismatch');
      for (const tx of block.tx) {
        if (!stateOutpoint) {
          if (tx.txid !== manifest.birth) continue;
          if (tx.vout?.[0]?.scriptPubKey?.hex !== initialScript) continue;
          await applyBirth(tx, blockHeight);
          continue;
        }
        if (!sameOutpoint(tx.vin?.[0], stateOutpoint)) continue;
        await applyTransition(tx, blockHeight);
      }
    }
    demand(birth, 'pool birth not found');
    demand(await call('getbestblockhash') === tip, 'tip changed during scan; retry');
    if (height === currentHeight) {
      demand(await call('gettxout', ...stateOutpoint, false) !== null,
        'reconstructed state already spent');
      if (reserveOutpoint) demand(await call('gettxout', ...reserveOutpoint, false) !== null,
        'reconstructed reserve already spent');
    }
  } else {
    // Without stopHeight the scan follows the state to its current unspent output,
    // even past the height read at the start; with stopHeight it stops there.
    const bounded = stopHeight !== undefined;
    const anchors = new Map(restored ? [[restored.height, restored.blockhash]] : []);
    async function confirmed(txid, blockHeight) {
      const tx = await call('getrawtransaction', txid, true);
      demand(tx?.txid === txid && typeof tx.blockhash === 'string' && tx.confirmations >= 1 &&
        (tx.height === undefined || tx.height === blockHeight),
      'transaction is not confirmed at the expected height');
      demand(await call('getblockhash', blockHeight) === tx.blockhash,
        'transaction is not in the active chain');
      anchors.set(blockHeight, tx.blockhash);
      return tx;
    }
    demand(Number.isSafeInteger(manifest.birthHeight) && manifest.birthHeight <= height,
      'pool birth not found');
    if (!restored) {
      onProgress({ height: manifest.birthHeight, total: height });
      const born = await confirmed(manifest.birth, manifest.birthHeight);
      demand(born.vout?.[0]?.scriptPubKey?.hex === initialScript, 'pool birth not found');
      await applyBirth(born, manifest.birthHeight);
    }
    let last = restored?.transitions.at(-1)?.height ?? manifest.birthHeight;
    let unresolved = 0;
    for (;;) {
      let spent = null;
      // The node reports an unspent output, or a disabled index, as an RPC error.
      try { spent = await call('getspentinfo', { txid: stateOutpoint[0], index: stateOutpoint[1] }); }
      catch { spent = null; }
      // Height -1 marks a spender that is only in the mempool.
      if (spent && spent.height !== -1) {
        demand(Number.isSafeInteger(spent.height) && spent.height >= last,
          'invalid or out-of-order spent index entry');
        if (bounded && spent.height > height) break;
        demand(spent.index === 0 && typeof spent.txid === 'string',
          'state spent outside the pool contract');
        const tx = await confirmed(spent.txid, spent.height);
        demand(sameOutpoint(tx.vin?.[0], stateOutpoint), 'spent index disagrees with transaction');
        onProgress({ height: spent.height, total: Math.max(height, spent.height) });
        await applyTransition(tx, spent.height);
        last = spent.height;
        unresolved = 0;
        continue;
      }
      if (bounded) break;
      const through = await call('getblockcount');
      // Read the reserve first: a later spend of both is caught by the state read.
      const reserveLive = !reserveOutpoint ||
        await call('gettxout', ...reserveOutpoint, false) !== null;
      if (await call('gettxout', ...stateOutpoint, false) !== null) {
        demand(reserveLive, 'reconstructed reserve already spent');
        demand(Number.isSafeInteger(through) && through >= last, 'invalid scan height');
        scannedHeight = through;
        break;
      }
      // A block may have spent the state between the two reads; ask once more.
      demand(++unresolved < 2,
        'state spend missing from the spent index; the RPC node needs -spentindex');
    }
    for (const [blockHeight, blockHash] of anchors) {
      demand(await call('getblockhash', blockHeight) === blockHash,
        'chain reorganized during scan; retry');
    }
    if (!bounded) finalTip = await call('getbestblockhash');
  }
  if (identity) {
    // The encrypted checkpoint may keep already discovered notes. A changed gap
    // or issued index can expose older records, so search all of them then.
    const window = identity.gap === undefined ? null : { gap: identity.gap, issued: identity.issued };
    const cached = restored && restored.walletTag === walletCheckpointTag(identity) &&
      JSON.stringify(restored.walletWindow) === JSON.stringify(window)
      ? restored.owned : null;
    const oldCount = cached ? cachedPublishedCount : 0;
    if (cached) for (const item of cached) {
      const nf = BigInt(item.nf);
      const spent = spentBy.get(nf);
      notes.set(item.cm, { cm: item.cm, amountAtomic: BigInt(item.amountAtomic), nf,
        note: item.note, slot: item.slot, txid: item.txid, height: item.height,
        ...(item.address ? { address: item.address } : {}), spent: !!spent,
        ...(spent ? { spentTxid: spent.txid, spentHeight: spent.height } : {}) });
    }
    const remaining = published.slice(oldCount);
    const owned = typeof identity.scanRecords === 'function'
      ? identity.scanRecords(remaining, cached?.map(item => item.address).filter(Boolean))
      : remaining.map((entry, position) => ({ position, owned: parseRecord(identity, entry.record, entry.cm) }))
        .filter(x => x.owned);
    for (const { position, owned: found, address } of owned) {
      const entry = remaining[position];
      const nf = decodeField(found.nf);
      const spent = spentBy.get(nf);
      notes.set(hex(entry.cm), { cm: hex(entry.cm), amountAtomic: found.amountAtomic, nf, note: hex(found.note),
        spent: !!spent, ...(spent ? { spentTxid: spent.txid, spentHeight: spent.height } : {}),
        slot: entry.slot, txid: entry.txid, height: entry.height, ...(address ? { address } : {}) });
    }
  }
  const blockhash = await call('getblockhash', scannedHeight);
  const result = { birth, transitions, notes: Array.from(notes.values()),
    balanceAtomic: Array.from(notes.values()).reduce((sum, note) =>
      sum + (note.spent ? 0n : note.amountAtomic), 0n),
    reserveAtomic: reserve,
    state: { mode: state.mode, slots: state.slots, seen: state.seen,
      nfs: state.nfs, digest: decodeField(digest).toString(),
      stateOutpoint, reserveOutpoint },
    height: scannedHeight, blockhash, currentTip: finalTip };
  result.checkpoint = checkpointFor({ manifest, height: scannedHeight, blockhash, birth, state, reserve,
    stateOutpoint, reserveOutpoint, transitions, published, spentBy, notes, identity });
  return result;
}
