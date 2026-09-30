import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BrowserTestIdentity } from '../src/browser-wallet.js';
import { scanBrowserPool } from '../src/browser-chain.js';
import { c3StateScript } from '../src/c3.js';
import { emptyPoolState, poolStateDigest } from '../src/pool-state.js';
const fixture = JSON.parse(readFileSync(new URL('./fixtures/xna-chain-small.json', import.meta.url)));
const bytes = value => Uint8Array.from(Buffer.from(value, 'hex'));
const clone = value => structuredClone(value);
function harness() {
  const blocks = clone(fixture.blocks);
  const parents = clone(fixture.parents);
  let height = 2;
  let changeTip = false;
  const rpc = async (method, args) => {
    if (method === 'getblockhash') return args[0] === 0 ? fixture.manifest.genesis : blocks[args[0]].hash;
    if (method === 'getbestblockhash') return changeTip ? 'dd'.repeat(32) : blocks[height].hash;
    if (method === 'getblockcount') return height;
    if (method === 'getblock') return Object.values(blocks).find(block => block.hash === args[0]);
    if (method === 'getrawtransaction') return parents[args[0]];
    if (method === 'gettxout') return { value: 0 };
    throw new Error('unexpected RPC ' + method);
  };
  const identity = new BrowserTestIdentity(bytes(fixture.secret.spend), bytes(fixture.secret.view),
    bytes(fixture.manifest.domain), bytes(fixture.manifest.assetId), null);
  return { rpc, identity, blocks, setHeight: value => { height = value; },
    setTipChanged: value => { changeTip = value; } };
}

test('browser scanner independently reconstructs the Python 1000-XNA deposit and rollback', async () => {
  const h = harness();
  const scan = () => scanBrowserPool({ rpc: h.rpc, manifest: fixture.manifest, identity: h.identity });
  const funded = await scan();
  assert.equal(funded.balanceAtomic.toString(), fixture.expected.balanceAtomic);
  assert.equal(funded.reserveAtomic.toString(), fixture.expected.reserveAtomic);
  assert.equal(funded.state.digest, fixture.expected.digest);
  assert.equal(funded.notes.length, 1);
  assert.equal(funded.notes[0].nf.toString(), fixture.expected.nf);
  assert.equal(funded.transitions[0].form, 'D0');
  h.setHeight(1);
  const disconnected = await scan();
  assert.equal(disconnected.balanceAtomic, 0n);
  assert.equal(disconnected.reserveAtomic, 0n);
  assert.equal(disconnected.state.reserveOutpoint, null);
  h.setHeight(2);
  const replayed = await scan();
  assert.equal(replayed.balanceAtomic, funded.balanceAtomic);
  assert.equal(replayed.state.digest, funded.state.digest);
  h.identity.lock();
});

test('browser scanner rejects wrong genesis, changed reserve, state root and stale tip', async () => {
  const h = harness();
  const scan = (manifest = fixture.manifest) =>
    scanBrowserPool({ rpc: h.rpc, manifest, identity: h.identity });
  await assert.rejects(scan({ ...fixture.manifest, genesis: '00'.repeat(32) }), /wrong genesis/);
  h.blocks[2].tx[0].vout[1].value = 1000.00000001;
  await assert.rejects(scan(), /reserve delta/);
  h.blocks[2].tx[0].vout[1].value = 1000;
  h.blocks[2].tx[0].vout[0].scriptPubKey.hex = '00';
  await assert.rejects(scan(), /state root/);
  h.blocks[2].tx[0].vout[0].scriptPubKey.hex = fixture.blocks[2].tx[0].vout[0].scriptPubKey.hex;
  h.setTipChanged(true);
  // The tip changes only on the second read, emulating a reorg during scan.
  let reads = 0;
  const reorgRpc = async (method, args) => method === 'getbestblockhash' && ++reads === 2
    ? 'dd'.repeat(32) : h.rpc(method, args);
  h.setTipChanged(false);
  await assert.rejects(scanBrowserPool({ rpc: reorgRpc, manifest: fixture.manifest,
    identity: h.identity }), /tip changed/);
  h.identity.lock();
});

test('browser scanner refuses unknown verification key, malformed publication and bad MAST marker', async () => {
  for (const [mutate, expected] of [
    [h => { h.blocks[2].tx[0].vin[0].txinwitness[2] = 'ff'; }, /unknown pool VK/],
    [h => { h.blocks[2].tx[0].vin[0].txinwitness[3] = '00'; }, /publication size/],
    [h => { h.blocks[2].tx[0].vin[0].txinwitness[0] = '00'; }, /not MAST/]
  ]) {
    const h = harness();
    mutate(h);
    await assert.rejects(scanBrowserPool({ rpc: h.rpc, manifest: fixture.manifest,
      identity: h.identity }), expected);
    h.identity.lock();
  }
});

test('browser scanner refuses an identity derived for another pool', async () => {
  const h = harness();
  const wrong = new BrowserTestIdentity(bytes(fixture.secret.spend), bytes(fixture.secret.view),
    bytes('01'.repeat(32)), bytes(fixture.manifest.assetId), null);
  await assert.rejects(scanBrowserPool({ rpc: h.rpc, manifest: fixture.manifest,
    identity: wrong }), /another pool instance/);
  wrong.lock();
  h.identity.lock();
});

// C3 public chain: birth plus seven confirmed operations of the pinned TEST instance.
const c3 = JSON.parse(readFileSync(new URL('./fixtures/c3/public-chain.json', import.meta.url)));
const C3_TIP = 7790;
const PARENT = 'ab'.repeat(32);
function xna(atomic) {
  const value = BigInt(atomic);
  return `${value / 100000000n}.${(value % 100000000n).toString().padStart(8, '0')}`;
}
function c3Harness() {
  const manifest = c3.manifest;
  const vectors = clone(c3.vectors);
  const hashes = new Map(vectors.map(v => [v.tx.height, v.tx.blockhash]));
  const hashAt = height => height === 0 ? manifest.genesis
    : hashes.get(height) ?? height.toString(16).padStart(64, '0');
  const birth = { txid: manifest.birth, blockhash: hashAt(manifest.birthHeight),
    height: manifest.birthHeight, confirmations: C3_TIP - manifest.birthHeight + 1,
    vin: [{ txid: PARENT, vout: 0 }],
    vout: [{ value: 0, scriptPubKey: { hex: c3StateScript(manifest, poolStateDigest(emptyPoolState())) } }] };
  const txs = new Map([[birth.txid, birth], [PARENT, { txid: PARENT,
    vout: [{ scriptPubKey: { hex: '00' + Buffer.from(manifest.identity).toString('hex') } }] }]]);
  for (const { form, input, tx } of vectors) {
    txs.set(tx.txid, tx);
    if (form[0] !== 'D') continue;
    const funding = tx.vin[form === 'D0' ? 1 : 2];
    const parent = txs.get(funding.txid) ?? { txid: funding.txid, vout: [] };
    parent.vout[funding.vout] = { value: xna(input.amount) };
    txs.set(funding.txid, parent);
  }
  const spends = new Map();
  let previous = manifest.birth;
  for (const { tx } of vectors) {
    spends.set(previous + ':0', { txid: tx.txid, index: 0, height: tx.height });
    previous = tx.txid;
  }
  const h = { calls: [], txs, spends, hashAt, finalState: previous, unspent: new Set([previous + ':0']),
    tip: () => hashAt(C3_TIP), hook: null };
  h.rpc = async (method, args) => {
    h.calls.push(method);
    const hooked = h.hook?.(method, args);
    if (hooked !== undefined) return hooked;
    if (method === 'getblockhash') return hashAt(args[0]);
    if (method === 'getbestblockhash') return h.tip();
    if (method === 'getblockcount') return C3_TIP;
    if (method === 'getrawtransaction') return txs.get(args[0]);
    if (method === 'getblock') {
      const height = [...Array(C3_TIP + 1).keys()].find(x => x > 0 && hashAt(x) === args[0]);
      return { hash: args[0], height, tx: [...txs.values()].filter(tx => tx.height === height) };
    }
    if (method === 'getspentinfo') {
      const spent = spends.get(args[0].txid + ':' + args[0].index);
      if (!spent) throw new Error('Unable to get spent info');
      return spent;
    }
    if (method === 'gettxout') return h.unspent.has(args[0] + ':' + args[1]) ? { value: 0 } : null;
    throw new Error('unexpected RPC ' + method);
  };
  return h;
}
const c3Scan = (h, options = {}) => scanBrowserPool({ rpc: h.rpc, manifest: c3.manifest, ...options });
const comparable = scan => ({ birth: scan.birth, transitions: scan.transitions,
  reserveAtomic: scan.reserveAtomic, height: scan.height, state: scan.state });

test('C3 spent-index scan equals a full block replay with far fewer RPC calls', async () => {
  const follow = c3Harness();
  const followed = await c3Scan(follow);
  const replay = c3Harness();
  const replayed = await c3Scan(replay, { strategy: 'blocks' });
  assert.deepEqual(followed.transitions.map(x => x.form),
    ['D0', 'D1', 'T2', 'T1', 'W_partial', 'W_partial', 'W_full']);
  assert.deepEqual(comparable(followed), comparable(replayed));
  assert.equal(followed.reserveAtomic, 0n);
  assert.deepEqual(followed.state.stateOutpoint, [follow.finalState, 0]);
  assert.equal(follow.calls.includes('getblock'), false);
  assert.ok(follow.calls.length < 45, 'spent-index calls: ' + follow.calls.length);
  assert.ok(replay.calls.length > 2 * (C3_TIP - c3.manifest.birthHeight), 'block replay calls');
});

test('C3 scan resumes from a checkpoint and rebuilds after a reorganization', async () => {
  const partial = await c3Scan(c3Harness(), { stopHeight: 7771 });
  const resumedNode = c3Harness();
  const resumed = await c3Scan(resumedNode, { checkpoint: partial.checkpoint });
  const fullNode = c3Harness();
  const full = await c3Scan(fullNode);
  assert.deepEqual(comparable(resumed), comparable(full));
  assert.ok(resumedNode.calls.filter(method => method === 'getrawtransaction').length <
    fullNode.calls.filter(method => method === 'getrawtransaction').length);
  const reorganized = c3Harness();
  const stale = { ...partial.checkpoint, blockhash: 'ee'.repeat(32) };
  const recovered = await c3Scan(reorganized, { checkpoint: stale });
  assert.deepEqual(comparable(recovered), comparable(full));
  assert.ok(reorganized.calls.filter(method => method === 'getrawtransaction').length >=
    fullNode.calls.filter(method => method === 'getrawtransaction').length);
});

test('C3 spent-index scan tolerates new tips and ignores mempool spenders', async () => {
  const h = c3Harness();
  let tips = 0;
  h.tip = () => (++tips).toString(16).padStart(64, '0');
  h.spends.set(h.finalState + ':0', { txid: 'cd'.repeat(32), index: 0, height: -1 });
  const scan = await c3Scan(h);
  assert.equal(scan.transitions.length, 7);
  assert.deepEqual(scan.state.stateOutpoint, [h.finalState, 0]);
  const moving = c3Harness();
  let reads = 0;
  moving.tip = () => (++reads).toString(16).padStart(64, '0');
  await assert.rejects(c3Scan(moving, { strategy: 'blocks' }), /tip changed/);
});

test('C3 spent-index scan with stopHeight equals the bounded block replay', async () => {
  const followed = await c3Scan(c3Harness(), { stopHeight: 7771 });
  const replayed = await c3Scan(c3Harness(), { stopHeight: 7771, strategy: 'blocks' });
  assert.deepEqual(followed.transitions.map(x => x.form), ['D0', 'D1', 'T2']);
  assert.deepEqual(comparable(followed), comparable(replayed));
  assert.equal(followed.height, 7771);
});

test('C3 spent-index scan asks again when a block spends the state between reads', async () => {
  const h = c3Harness();
  const penultimate = c3.vectors[5].tx.txid + ':0';
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
  const scan = await c3Scan(h);
  assert.equal(raced, true);
  assert.equal(scan.transitions.length, 7);
});

test('C3 spent-index scan rejects missing, inconsistent or reorganized index data', async () => {
  const cases = [
    [h => { h.spends.clear(); }, /needs -spentindex/],
    [h => { h.spends.get(c3.manifest.birth + ':0').height = 7765; }, /expected height/],
    [h => { h.spends.get(c3.manifest.birth + ':0').index = 1; }, /outside the pool contract/],
    [h => { h.spends.set(c3.manifest.birth + ':0', { txid: c3.vectors[1].tx.txid, index: 0,
      height: c3.vectors[1].tx.height }); }, /disagrees with transaction/],
    [h => { h.unspent.clear(); h.spends.delete(h.finalState + ':0'); }, /needs -spentindex/]
  ];
  for (const [mutate, expected] of cases) {
    const h = c3Harness();
    mutate(h);
    await assert.rejects(c3Scan(h), expected);
  }
  // The block of D1 changes after it was used: the final anchor check must notice.
  const moved = c3Harness();
  let d1Reads = 0;
  moved.hook = (method, args) => method === 'getblockhash' && args[0] === 7767 &&
    ++d1Reads > 1 ? 'ee'.repeat(32) : undefined;
  await assert.rejects(c3Scan(moved), /reorganized during scan/);
  const outside = c3Harness();
  outside.hook = (method, args) => method === 'getblockhash' && args[0] === 7767 ? 'ee'.repeat(32) : undefined;
  await assert.rejects(c3Scan(outside), /not in the active chain/);
  await assert.rejects(scanBrowserPool({ rpc: c3Harness().rpc, manifest: fixture.manifest,
    strategy: 'spent-index' }), /requires a C3 manifest/);
});

test('C3 scan resolves ownership after the walk: later nullifiers mark notes spent', async () => {
  const blobOf = tx => Buffer.from(tx.vin[0].txinwitness[3] + tx.vin[0].txinwitness[4], 'hex');
  const depositCm = blobOf(c3.vectors[0].tx).subarray(6, 38);
  const t2 = c3.vectors[2].tx;
  const nf = blobOf(t2).subarray(2, 34);
  const owned = { amountAtomic: 5n, nf, note: new Uint8Array(169) };
  const recipient = () => ({ domain: c3.manifest.domain, asset_id: c3.manifest.assetId });
  let decryptions = 0;
  const single = { recipient: () => ({ ...recipient(), owner: '11'.repeat(32) }),
    openRecord: (record, cm) => { decryptions++; return Buffer.from(cm).equals(depositCm) ? owned : null; } };
  const scan = await c3Scan(c3Harness(), { identity: single });
  assert.equal(scan.notes.length, 1);
  assert.equal(scan.notes[0].cm, depositCm.toString('hex'));
  assert.equal(scan.notes[0].spent, true);
  assert.equal(scan.notes[0].spentTxid, t2.txid);
  assert.equal(scan.notes[0].spentHeight, t2.height);
  assert.equal(scan.notes[0].height, c3.vectors[0].tx.height);
  assert.equal(scan.balanceAtomic, 0n);
  const firstDecryptions = decryptions;
  const resumed = await c3Scan(c3Harness(), { identity: single, checkpoint: scan.checkpoint });
  assert.deepEqual(resumed.notes, scan.notes);
  assert.equal(decryptions, firstDecryptions, 'old records are not decrypted again');
  const early = await c3Scan(c3Harness(), { identity: single, stopHeight: 7764 });
  assert.equal(early.notes[0].spent, false);
  const beforeNewBlocks = decryptions;
  const advanced = await c3Scan(c3Harness(), { identity: single, checkpoint: early.checkpoint });
  assert.deepEqual(advanced.notes, scan.notes);
  assert.equal(decryptions - beforeNewBlocks, 4, 'only four later records are decrypted');
  // Multi-address identities receive every published record at once and report the address.
  let seen = 0;
  const multi = { recipient, scanRecords: entries => { seen = entries.length; return [{ position: 0, owned, address: { chain: 0, index: 4 } }]; } };
  const multiScan = await c3Scan(c3Harness(), { identity: multi });
  assert.equal(seen, 5); // D0, D1, two from T2 and T1; withdrawals publish no notes.
  assert.deepEqual(multiScan.notes[0].address, { chain: 0, index: 4 });
  assert.equal(multiScan.notes[0].spent, true);
});
