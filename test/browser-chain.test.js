import test from 'node:test';
import assert from 'node:assert/strict';
import { scanBrowserPool } from '../src/browser-chain.js';
import { decodeC4Publication } from '../src/c4-publication.js';
import { BrowserTestIdentity } from '../src/browser-wallet.js';
import { chain, c4Harness, wallets, manifest, commitment, hashAt, XNA } from './helpers/c4-chain.js';

const scan = (h, options = {}) => scanBrowserPool({ rpc: h.rpc, manifest, expectedCommitment: commitment, ...options });
const comparable = result => ({ birth: result.birth, transitions: result.transitions,
  reserveAtomic: result.reserveAtomic, height: result.height, state: result.state });
const FORMS = ['D0', 'T1', 'W_full', 'D0', 'D1', 'T2', 'T3', 'T4', 'W_partial'];
const op = form => chain.ops.find(o => o.form === form);
const count = (h, method) => h.calls.filter(m => m === method).length;
function publication(h, { txid, form }) {
  const witness = h.txs.get(txid).vin[0].txinwitness;
  return decodeC4Publication(form, Buffer.from(witness[3] + witness[4], 'hex'));
}

test('scanner rebuilds every form and finds each wallet’s notes on every address', async () => {
  assert.deepEqual(chain.ops.map(o => o.form), FORMS);
  const results = {};
  for (const who of ['alice', 'bob', 'carol']) {
    const identity = wallets[who]();
    try { results[who] = await scan(c4Harness(chain), { identity }); } finally { identity.lock(); }
    assert.deepEqual(results[who].transitions.map(t => t.form), FORMS);
    assert.equal(results[who].reserveAtomic, 15n * XNA);
  }
  assert.deepEqual(Object.values(results).map(r => r.balanceAtomic / XNA), [5n, 9n, 1n]);
  const unspent = who => results[who].notes.filter(n => !n.spent).map(n => [n.amountAtomic / XNA, n.address ?? null]);
  assert.deepEqual(unspent('alice'), [[3n, { chain: 1, index: 0 }], [1n, { chain: 0, index: 0 }], [1n, { chain: 0, index: 2 }]]);
  assert.deepEqual(unspent('bob'), [[4n, { chain: 0, index: 1 }], [2n, { chain: 0, index: 1 }], [3n, { chain: 1, index: 0 }]]);
  assert.deepEqual(unspent('carol'), [[1n, null]]);
  // W_full empties the pool and removes the reserve; the next deposit is a D0 again.
  assert.deepEqual(results.alice.transitions.slice(1, 4).map(t => t.reserveAtomic / XNA), [10n, 0n, 10n]);
});

test('a disconnected block restores the spent note and a later scan spends it again', async () => {
  const carol = wallets.carol();
  try {
    const disconnected = c4Harness(chain);
    disconnected.disconnect(1);
    const before = await scan(disconnected, { identity: carol });
    assert.deepEqual([before.transitions.length, before.balanceAtomic, before.reserveAtomic], [8, 2n * XNA, 16n * XNA]);
    const after = await scan(c4Harness(chain), { identity: carol, checkpoint: before.checkpoint });
    assert.equal(after.balanceAtomic, 1n * XNA);
    // A checkpoint above the active tip is discarded and the scan starts from the pool birth.
    const reorganized = c4Harness(chain);
    reorganized.disconnect(1);
    const rebuilt = await scan(reorganized, { identity: carol, checkpoint: after.checkpoint });
    assert.deepEqual(comparable(rebuilt), comparable(before));
    assert.equal(rebuilt.balanceAtomic, 2n * XNA);
  } finally { carol.lock(); }
});

test('scanner rejects an unpinned manifest, wrong genesis, changed reserve, state root and moving tip', async () => {
  await assert.rejects(scanBrowserPool({ rpc: c4Harness(chain).rpc, manifest }), /independently pinned/);
  await assert.rejects(scanBrowserPool({ rpc: c4Harness(chain).rpc, manifest, expectedCommitment: '00'.repeat(32) }),
    /independently pinned/);
  await assert.rejects(scan(c4Harness(chain), { strategy: 'mempool' }), /unknown scan strategy/);
  const genesis = c4Harness(chain);
  genesis.hook = (method, args) => method === 'getblockhash' && args[0] === 0 ? '00'.repeat(32) : undefined;
  await assert.rejects(scan(genesis), /wrong genesis/);
  const reserve = c4Harness(chain);
  reserve.txs.get(op('D1').txid).vout[1].value = '16.00000001';
  await assert.rejects(scan(reserve), /reserve delta/);
  const root = c4Harness(chain);
  root.txs.get(op('T2').txid).vout[0].scriptPubKey.hex = '00';
  await assert.rejects(scan(root), /state root/);
  // The tip changes only on the second read, emulating a reorganization during a block replay.
  const moving = c4Harness(chain);
  let reads = 0;
  moving.tip = () => ++reads === 2 ? 'dd'.repeat(32) : hashAt(moving.tipHeight);
  await assert.rejects(scan(moving, { strategy: 'blocks' }), /tip changed/);
});

test('scanner refuses unknown verification key, malformed publication, foreign leaf and bad MAST marker', async () => {
  for (const [mutate, expected] of [
    [w => { w[2] = 'ff'; }, /unknown pool VK/],
    [w => { w[3] = '00'; }, /publication size/],
    [w => { w[3] = w[3].slice(0, -2) + '01'; }, /padding/],
    [w => { w[w.length - 2] += '51'; }, /unexpected pool leaf/],
    [w => { w[0] = '00'; }, /not MAST/],
  ]) {
    const h = c4Harness(chain);
    mutate(h.txs.get(op('T3').txid).vin[0].txinwitness);
    await assert.rejects(scan(h), expected);
  }
});

test('scanner refuses an identity derived for another pool', async () => {
  const wrong = new BrowserTestIdentity(new Uint8Array(32).fill(3), new Uint8Array(32).fill(4),
    new Uint8Array(32).fill(1), Uint8Array.from(Buffer.from(manifest.assetId, 'hex')), null);
  try { await assert.rejects(scan(c4Harness(chain), { identity: wrong }), /another pool instance/); } finally { wrong.lock(); }
});

test('spent-index scan equals a full block replay with far fewer RPC calls', async () => {
  const follow = c4Harness(chain);
  const followed = await scan(follow);
  const replay = c4Harness(chain);
  const replayed = await scan(replay, { strategy: 'blocks' });
  assert.deepEqual(comparable(followed), comparable(replayed));
  assert.deepEqual(followed.state.stateOutpoint, [follow.finalState, 0]);
  assert.equal(follow.calls.includes('getblock'), false);
  assert.ok(follow.calls.length < 60, 'spent-index calls: ' + follow.calls.length);
  assert.ok(replay.calls.length > 2 * (chain.tip - manifest.birthHeight), 'block replay calls: ' + replay.calls.length);
});

test('scan resumes from a checkpoint and rebuilds after a reorganization', async () => {
  const partial = await scan(c4Harness(chain), { stopHeight: op('D1').height });
  const resumedNode = c4Harness(chain);
  const resumed = await scan(resumedNode, { checkpoint: partial.checkpoint });
  const fullNode = c4Harness(chain);
  const full = await scan(fullNode);
  assert.deepEqual(comparable(resumed), comparable(full));
  assert.ok(count(resumedNode, 'getrawtransaction') < count(fullNode, 'getrawtransaction'));
  const reorganized = c4Harness(chain);
  const recovered = await scan(reorganized, { checkpoint: { ...partial.checkpoint, blockhash: 'ee'.repeat(32) } });
  assert.deepEqual(comparable(recovered), comparable(full));
  assert.ok(count(reorganized, 'getrawtransaction') >= count(fullNode, 'getrawtransaction'));
});

test('spent-index scan tolerates new tips and ignores mempool spenders', async () => {
  const h = c4Harness(chain);
  let tips = 0;
  h.tip = () => (++tips).toString(16).padStart(64, '0');
  h.spends.set(h.finalState + ':0', { txid: 'cd'.repeat(32), index: 0, height: -1 });
  const result = await scan(h);
  assert.equal(result.transitions.length, FORMS.length);
  assert.deepEqual(result.state.stateOutpoint, [h.finalState, 0]);
});

test('spent-index scan with stopHeight equals the bounded block replay', async () => {
  const stopHeight = op('T2').height;
  const followed = await scan(c4Harness(chain), { stopHeight });
  const replayed = await scan(c4Harness(chain), { stopHeight, strategy: 'blocks' });
  assert.deepEqual(followed.transitions.map(x => x.form), FORMS.slice(0, 6));
  assert.deepEqual(comparable(followed), comparable(replayed));
  assert.equal(followed.height, stopHeight);
});

test('spent-index scan asks again when a block spends the state between reads', async () => {
  const h = c4Harness(chain);
  const penultimate = chain.ops.at(-2).txid + ':0';
  const last = h.spends.get(penultimate);
  h.spends.delete(penultimate);
  let raced = false;
  h.hook = (method, args) => {
    if (method === 'gettxout' && args[0] + ':' + args[1] === penultimate && !raced) {
      raced = true;
      h.spends.set(penultimate, last);
      return null;
    }
    return undefined;
  };
  const result = await scan(h);
  assert.equal(raced, true);
  assert.equal(result.transitions.length, FORMS.length);
});

test('spent-index scan rejects missing, inconsistent or reorganized index data', async () => {
  const [first, second] = chain.ops;
  const birth = manifest.birth + ':0';
  for (const [mutate, expected] of [
    [h => { h.spends.clear(); }, /needs -spentindex/],
    [h => { h.spends.get(birth).height = first.height - 1; }, /expected height/],
    [h => { h.spends.get(birth).index = 1; }, /outside the pool contract/],
    [h => { h.spends.set(birth, { txid: second.txid, index: 0, height: second.height }); }, /disagrees with transaction/],
    [h => { h.unspent.clear(); }, /needs -spentindex/],
  ]) {
    const h = c4Harness(chain);
    mutate(h);
    await assert.rejects(scan(h), expected);
  }
  // The block of the second operation changes after it was used: the final anchor check must notice.
  const moved = c4Harness(chain);
  let reads = 0;
  moved.hook = (method, args) => method === 'getblockhash' && args[0] === second.height &&
    ++reads > 1 ? 'ee'.repeat(32) : undefined;
  await assert.rejects(scan(moved), /reorganized during scan/);
  const outside = c4Harness(chain);
  outside.hook = (method, args) => method === 'getblockhash' && args[0] === second.height ? 'ee'.repeat(32) : undefined;
  await assert.rejects(scan(outside), /not in the active chain/);
});

test('scan resolves ownership after the walk: later nullifiers mark notes spent', async () => {
  const h = c4Harness(chain);
  const [first, second] = chain.ops;
  const depositCm = Buffer.from(publication(h, first).cms[0]);
  const owned = { amountAtomic: 5n, nf: publication(h, second).nf, note: new Uint8Array(169) };
  const recipient = () => ({ domain: manifest.domain, asset_id: manifest.assetId });
  let decryptions = 0;
  const single = { recipient: () => ({ ...recipient(), owner: '11'.repeat(32) }),
    openRecord: (record, cm) => { decryptions++; return Buffer.from(cm).equals(depositCm) ? owned : null; } };
  const result = await scan(c4Harness(chain), { identity: single });
  assert.equal(result.notes.length, 1);
  assert.deepEqual([result.notes[0].cm, result.notes[0].spent, result.notes[0].spentTxid, result.notes[0].spentHeight,
    result.notes[0].height], [depositCm.toString('hex'), true, second.txid, second.height, first.height]);
  assert.equal(result.balanceAtomic, 0n);
  assert.equal(decryptions, 13, 'D0, T1, D0, D1 and the 2 + 3 + 4 notes of T2, T3 and T4');
  const resumed = await scan(c4Harness(chain), { identity: single, checkpoint: result.checkpoint });
  assert.deepEqual(resumed.notes, result.notes);
  assert.equal(decryptions, 13, 'old records are not decrypted again');
  const early = await scan(c4Harness(chain), { identity: single, stopHeight: first.height });
  assert.equal(early.notes[0].spent, false);
  const beforeNewBlocks = decryptions;
  const advanced = await scan(c4Harness(chain), { identity: single, checkpoint: early.checkpoint });
  assert.deepEqual(advanced.notes, result.notes);
  assert.equal(decryptions - beforeNewBlocks, 12, 'only the later records are decrypted');
  // Multi-address identities receive every published record at once and report the address.
  let seen = 0;
  const multi = { recipient, scanRecords: entries => { seen = entries.length; return [{ position: 0, owned, address: { chain: 0, index: 4 } }]; } };
  const multiScan = await scan(c4Harness(chain), { identity: multi });
  assert.equal(seen, 13);
  assert.deepEqual(multiScan.notes[0].address, { chain: 0, index: 4 });
  assert.equal(multiScan.notes[0].spent, true);
});
