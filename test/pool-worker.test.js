import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { startPoolWorker, planC4Operation, describeReceiving, loadVerifiedArtifact, proveC4 } from '../src/worker.js';
import { PoolWorkerClient, C4_TESTNET_MANIFEST } from '../src/client.js';
import { ZkWalletIdentity, decodeNzkAddress } from '../src/zk-wallet.js';
import { BrowserTestIdentity } from '../src/browser-wallet.js';
import { sealNote } from '../src/hpke.js';
import { chain, c4Harness, decodeTransaction, pool, PLACEHOLDER_PROOF, SCRIPTS, xna } from './helpers/c4-chain.js';

const { vectors } = JSON.parse(readFileSync(new URL('./fixtures/nzk-vectors.json', import.meta.url)));
const words = vectors[0].input;
// The frozen vectors use another pool domain; their root derives this pool's wallet without running Argon2 again.
const vectorWallet = () => ZkWalletIdentity.fromRoot({ root: Uint8Array.from(Buffer.from(vectors[0].output.zk_root, 'hex')),
  family: 'legacy', account: 0, ...pool });

// In-process stand-in for a Worker: messages are structured-cloned like postMessage.
function workerPair() {
  const worker = { onmessage: null, terminated: false,
    postMessage: m => queueMicrotask(() => scope.onmessage?.({ data: structuredClone(m) })), terminate() { this.terminated = true; } };
  const scope = { onmessage: null, postMessage: m => queueMicrotask(() => worker.onmessage?.({ data: structuredClone(m) })) };
  return { worker, scope };
}

test('worker and client: derive from wallet words, scan the bundled C4 pool and rotate addresses', async () => {
  const node = c4Harness(chain);
  const { worker, scope } = workerPair();
  assert.throws(() => startPoolWorker({ scope: workerPair().scope, artifactBaseUrl: 'http://artifacts.test/', depositLimitAtomic: 5 }), /positive bigint/);
  // An application-supplied manifest needs its own pinned commitment.
  assert.throws(() => startPoolWorker({ scope: workerPair().scope, artifactBaseUrl: 'http://artifacts.test/', manifest: C4_TESTNET_MANIFEST }), /independently pinned/);
  const handle = startPoolWorker({ scope, artifactBaseUrl: 'http://artifacts.test/', singleThread: false, depositLimitAtomic: 100000000000n });
  const stages = [];
  const client = new PoolWorkerClient({ worker, rpc: node.rpc, onStage: m => stages.push(m) });
  await assert.rejects(client.derive({ mnemonic: words.mnemonic }), /family/);
  const derived = await client.derive({ family: 'legacy', mnemonic: words.mnemonic, passphrase: words.passphrase, zkPassphrase: '', account: 0 });
  const expected = vectorWallet();
  assert.equal(derived.addresses.kind, 'derived');
  assert.equal(derived.addresses.fingerprint, expected.fingerprint);
  assert.equal(derived.addresses.current.address, expected.addressAt(0, 0));
  assert.equal(derived.backup, null);
  const scan = await client.scan({ gap: 5 });
  assert.equal(scan.result.transitions.length, chain.ops.length);
  assert.equal(scan.result.balanceAtomic, '0');
  assert.equal(scan.result.height, chain.tip);
  assert.equal(scan.addresses.gap, 5);
  assert.equal(typeof scan.checkpoint, 'string');
  const beforeResume = node.calls.length;
  const resumed = await client.scan({ checkpoint: scan.checkpoint });
  assert.deepEqual(resumed.result, scan.result);
  assert.ok(node.calls.length - beforeResume < 15, 'checkpoint avoids replaying the pool');
  const corrupt = scan.checkpoint.slice(0, -5) + 'xxxxx';
  const recovered = await client.scan({ checkpoint: corrupt });
  assert.deepEqual(recovered.result, scan.result);
  assert.ok(stages.some(m => m.startsWith('Reading pool operation at block')));
  assert.ok(!node.calls.includes('getblock'), 'spent-index scan only');
  const rotated = await client.newAddress();
  assert.equal(rotated.addresses.current.index, 1);
  assert.equal(rotated.addresses.current.address, expected.addressAt(0, 1));
  expected.lock();
  assert.deepEqual(decodeNzkAddress(rotated.addresses.current.address, pool), rotated.recipient);
  const file = await client.create({ password: 'long enough TEST password' });
  assert.equal(file.addresses.kind, 'file');
  assert.deepEqual(decodeNzkAddress(file.addresses.current.address, pool), file.recipient);
  assert.equal(typeof file.backup, 'string');
  await assert.rejects(client.newAddress(), /opened from its words/);
  await assert.rejects(client.prepare({ action: 'deposit' }), /without snarkjs/);
  handle.stop();
});

test('client forwards only read-only RPC and runs one operation at a time', async () => {
  const sent = [];
  const fake = { onmessage: null, postMessage: m => sent.push(m) };
  const rpcCalls = [];
  const crashes = [];
  const client = new PoolWorkerClient({ worker: fake, rpc: async (method) => { rpcCalls.push(method); return 'ok'; },
    onCrash: error => crashes.push(error.message) });
  await fake.onmessage({ data: { type: 'rpc', id: 1, method: 'sendrawtransaction', params: ['raw'] } });
  await new Promise(r => setTimeout(r, 0));
  assert.deepEqual(rpcCalls, []);
  assert.deepEqual(sent.pop(), { type: 'rpc-result', id: 1, error: 'Worker RPC is not read-only' });
  await fake.onmessage({ data: { type: 'rpc', id: 2, method: 'getblockcount', params: [] } });
  await new Promise(r => setTimeout(r, 0));
  assert.deepEqual(sent.pop(), { type: 'rpc-result', id: 2, result: 'ok' });
  const first = client.scan();
  await assert.rejects(client.scan(), /already running/);
  assert.equal(client.busy, true);
  await fake.onmessage({ data: { type: 'error', message: 'TEST failure' } });
  await assert.rejects(first, /TEST failure/);
  assert.equal(client.busy, false);
  // A crash stops the client: pending work fails, later requests fail fast and nothing more is sent.
  let terminated = 0;
  fake.terminate = () => { terminated++; };
  const pending = client.derive({ family: 'legacy', mnemonic: 'words' });
  fake.onerror({ message: 'out of memory', preventDefault() {} });
  await assert.rejects(pending, /out of memory/);
  assert.deepEqual([client.stopped, terminated, crashes], [true, 1, ['out of memory']]);
  await assert.rejects(client.scan(), /Privacy worker stopped/);
  const before = sent.length;
  await fake.onmessage({ data: { type: 'rpc', id: 3, method: 'getblockcount', params: [] } });
  await new Promise(r => setTimeout(r, 0));
  assert.equal(sent.length, before);
});

test('planning chooses the form, sends own notes to the change address and parses nzk recipients', async () => {
  const root = Uint8Array.from(Buffer.from(vectors[0].output.zk_root, 'hex'));
  const identity = ZkWalletIdentity.fromRoot({ root, family: 'legacy', account: 0, ...pool });
  const other = ZkWalletIdentity.fromRoot({ root, family: 'legacy', account: 1, ...pool });
  const note = { cm: 'aa'.repeat(32), amountAtomic: 500n, spent: false, address: { chain: 0, index: 2 } };
  const scan = reserve => ({ reserveAtomic: reserve, notes: [note, { ...note, cm: 'bb'.repeat(32), spent: true }] });
  const own = identity.selfRecipient();
  const opened = created => identity.identityAt(1, 0).openRecord(created.record, created.cm);
  const d0 = planC4Operation({ identity, scan: scan(0n), action: 'deposit', amountAtomic: '100', pool });
  assert.equal(d0.form, 'D0');
  assert.equal(opened(d0.created[0]).amountAtomic, 100n);
  assert.equal(planC4Operation({ identity, scan: scan(5n), action: 'deposit', amountAtomic: 100n, pool }).form, 'D1');
  // The default limit is the money range: a 1,000,000 XNA deposit is built, a larger total is rejected.
  assert.equal(planC4Operation({ identity, scan: scan(0n), action: 'deposit', amountAtomic: 100000000000000n, pool }).amountAtomic, '100000000000000');
  assert.throws(() => planC4Operation({ identity, scan: scan(0n), action: 'deposit', amountAtomic: 2100000000000000001n, pool }), /at most 21000000000 XNA/);
  assert.throws(() => planC4Operation({ identity, scan: scan(0n), action: 'deposit', amountAtomic: 100000000001n, pool,
    depositLimitAtomic: 100000000000n }), /at most 1000 XNA/);
  const to = other.addressAt(0, 0);
  const t2 = planC4Operation({ identity, scan: scan(900n), action: 'transfer', amountAtomic: '200', note: note.cm, recipient: to, pool });
  assert.equal(t2.form, 'T2');
  assert.equal(other.identityAt(0, 0).openRecord(t2.created[0].record, t2.created[0].cm).amountAtomic, 200n);
  assert.equal(opened(t2.created[1]).amountAtomic, 300n);
  assert.equal(own.owner, identity.descriptorAt(1, 0).owner);
  assert.equal(planC4Operation({ identity, scan: scan(900n), action: 'transfer', amountAtomic: '500', note: note.cm, recipient: to, pool }).form, 'T1');
  assert.throws(() => planC4Operation({ identity, scan: scan(900n), action: 'transfer', amountAtomic: '501', note: note.cm, recipient: to, pool }), /exceeds/);
  assert.throws(() => planC4Operation({ identity, scan: scan(900n), action: 'transfer', amountAtomic: '1', note: 'bb'.repeat(32), recipient: to, pool }), /no longer spendable/);
  assert.throws(() => planC4Operation({ identity, scan: scan(900n), action: 'transfer', amountAtomic: '1', note: note.cm, recipient: 'tnzk1bad', pool }), /nzk/);
  assert.equal(planC4Operation({ identity, scan: scan(500n), action: 'withdraw', note: note.cm, pool }).form, 'W_full');
  const partial = planC4Operation({ identity, scan: scan(900n), action: 'withdraw', note: note.cm, pool });
  assert.deepEqual([partial.form, partial.amountAtomic], ['W_partial', '500']);
  assert.throws(() => planC4Operation({ identity, scan: scan(900n), action: 'burn', note: note.cm, pool }), /Unknown pool action/);
  for (const w of [identity, other]) w.lock();
});

test('receiving summary lists used addresses with received totals', async () => {
  const root = Uint8Array.from(Buffer.from(vectors[0].output.zk_root, 'hex'));
  const identity = ZkWalletIdentity.fromRoot({ root, family: 'legacy', account: 0, ...pool, gap: 4 });
  const entries = [0, 2, 2].map((index, i) => { const s = sealNote({ descriptor: identity.descriptorAt(0, index), amountAtomic: String(100 + i) }); return { record: s.record, cm: s.cm }; });
  const found = identity.scanRecords(entries);
  const scan = { notes: found.map(f => ({ amountAtomic: f.owned.amountAtomic, address: f.address })) };
  const info = describeReceiving(identity, scan, { network: 'testnet' });
  assert.equal(info.current.index, 3);
  assert.deepEqual(info.used.map(u => [u.index, u.receivedAtomic]), [[0, '100'], [2, '203']]);
  assert.equal(info.used[1].address, identity.addressAt(0, 2));
  const file = await BrowserTestIdentity.create({ domain: pool.domain, assetId: pool.assetId, password: 'long enough TEST password' });
  assert.equal(describeReceiving(file, null, { network: 'testnet' }).kind, 'file');
  identity.lock(); file.lock();
});

test('artifacts are checked against pinned size and SHA-256, and proofs are verified locally', async () => {
  const body = Uint8Array.from([97, 98, 99]);
  const artifacts = { files: { 'x/a.bin': { bytes: 3, sha256: createHash('sha256').update(body).digest('hex') },
    'x/big.bin': { bytes: 10, sha256: '00'.repeat(32) } } };
  const progress = [];
  const ok = path => Promise.resolve(new Response(body));
  assert.deepEqual(await loadVerifiedArtifact({ path: 'x/a.bin', artifacts, fetchArtifact: ok, onProgress: p => progress.push(p) }), body);
  assert.equal(progress.at(-1), 100);
  await assert.rejects(loadVerifiedArtifact({ path: 'x/other', artifacts, fetchArtifact: ok }), /Unsupported/);
  await assert.rejects(loadVerifiedArtifact({ path: 'x/big.bin', artifacts, fetchArtifact: ok, maxBytes: 5 }), /Unsupported/);
  await assert.rejects(loadVerifiedArtifact({ path: 'x/a.bin', artifacts, fetchArtifact: () => Promise.resolve(new Response('', { status: 404 })), missingMessage: 'install them' }), /install them/);
  await assert.rejects(loadVerifiedArtifact({ path: 'x/a.bin', artifacts, fetchArtifact: () => Promise.resolve(new Response('abd')) }), /integrity/);
  await assert.rejects(loadVerifiedArtifact({ path: 'x/a.bin', artifacts, fetchArtifact: () => Promise.resolve(new Response('abcd')) }), /exceeds/);
  const calls = [];
  const fakeSnarkjs = verified => ({
    wtns: { calculate: async (input, wasm, witness) => { calls.push(['wtns', wasm.length, witness.type]); } },
    groth16: { prove: async (zkey, witness, logger, options) => { calls.push(['prove', options.singleThread]); return { proof: { pi_a: [], pi_b: [], pi_c: [] }, publicSignals: ['1'] }; },
      verify: async () => { calls.push(['verify']); return verified; } } });
  const forms = { D0: { wasm: 'w', zkey: 'z', vk: 'v' } };
  const loadArtifact = async path => path === 'v' ? new TextEncoder().encode('{"k":1}') : new Uint8Array(path === 'w' ? 2 : 1);
  const stages = [];
  const out = await proveC4({ form: 'D0', prepared: { input: {} }, artifacts: { forms }, loadArtifact, snarkjs: fakeSnarkjs(true), onStage: s => stages.push(s) });
  assert.deepEqual(out.publicSignals, ['1']);
  assert.deepEqual(calls, [['wtns', 2, 'mem'], ['prove', true], ['verify']]);
  assert.deepEqual(stages, ['Calculating private witness', 'Generating D0 proof locally · one thread', 'Verifying proof and transaction binding']);
  await assert.rejects(proveC4({ form: 'D0', prepared: { input: {} }, artifacts: { forms }, loadArtifact, snarkjs: fakeSnarkjs(false) }), /verification failed/);
  await assert.rejects(proveC4({ form: 'T9', prepared: { input: {} }, artifacts: { forms }, loadArtifact, snarkjs: fakeSnarkjs(true) }), /Unknown C4 form/);
});

test('worker prepares a verified deposit and leaves the funding and fee inputs unsigned', async () => {
  const node = c4Harness(chain);
  const sponsor = { txid: 'aa'.repeat(32), vout: 0, valueSats: '100000000', scriptHex: SCRIPTS.pq };
  const funding = { txid: 'bb'.repeat(32), vout: 1, valueSats: '500000000', scriptHex: SCRIPTS.legacy };
  const coins = new Map([sponsor, funding].map(coin => [coin.txid, coin]));
  node.hook = (method, args) => {
    const coin = method === 'gettxout' ? coins.get(args[0]) : undefined;
    return coin && { confirmations: 1, value: xna(coin.valueSats), scriptPubKey: { hex: coin.scriptHex } };
  };
  // Stand-in artifacts and prover: the worker still checks hashes and verifies before serializing.
  const files = new Map([['D1/D1.wasm', Uint8Array.of(1, 2)], ['D1/final.zkey', Uint8Array.of(3)],
    ['D1/vk.json', new TextEncoder().encode('{"pinned":true}')]]);
  const artifacts = { forms: { D1: { wasm: 'D1/D1.wasm', zkey: 'D1/final.zkey', vk: 'D1/vk.json' } },
    files: Object.fromEntries([...files].map(([path, body]) => [path, { bytes: body.length, sha256: createHash('sha256').update(body).digest('hex') }])) };
  let input;
  const snarkjs = {
    wtns: { calculate: async witnessInput => { input = witnessInput; } },
    groth16: {
      prove: async () => ({ proof: PLACEHOLDER_PROOF,
        publicSignals: ['ctx', 'S_old', 'S_new', 'dep', 'wdr', 'req', 'data_hash', 'anchor', 'amount'].map(key => String(input[key])) }),
      verify: async (vk, publicSignals) => vk.pinned === true && publicSignals.length === 9,
    },
  };
  const { worker, scope } = workerPair();
  const handle = startPoolWorker({ scope, snarkjs, artifacts, fetchArtifact: path => Promise.resolve(new Response(files.get(path))) });
  const stages = [];
  const client = new PoolWorkerClient({ worker, rpc: node.rpc, onStage: m => stages.push(m) });
  await client.derive({ family: 'legacy', mnemonic: words.mnemonic, passphrase: words.passphrase });
  const prepared = await client.prepare({ action: 'deposit', amountAtomic: '500000000', feeAtomic: '10000000', funding, sponsor });
  const tx = decodeTransaction(prepared.raw);
  assert.equal(prepared.form, 'D1');
  assert.deepEqual(prepared.stateOutpoint, [node.finalState, 0]);
  assert.deepEqual(prepared.inputPoints, tx.vin.map(({ txid, vout }) => ({ txid, vout })));
  assert.deepEqual(tx.vin.map(x => x.txid + ':' + x.vout), [node.finalState + ':0', node.finalState + ':1', funding.txid + ':1', sponsor.txid + ':0']);
  assert.deepEqual(tx.vout.map(x => x.value), ['0.00000000', '20.00000000', '0.90000000']);
  assert.deepEqual(tx.vout.at(-1).scriptPubKey.hex, sponsor.scriptHex);
  assert.deepEqual(tx.vin.slice(2).map(x => x.txinwitness), [[], []]);
  assert.equal(input.amount, '500000000');
  assert.ok(stages.includes('Verifying proof and transaction binding'));
  // A coin that changed after selection stops the worker before proving.
  coins.set(funding.txid, { ...funding, valueSats: '500000001' });
  await assert.rejects(client.prepare({ action: 'deposit', amountAtomic: '500000000', feeAtomic: '10000000', funding, sponsor }), /value mismatch/);
  handle.stop();
});
