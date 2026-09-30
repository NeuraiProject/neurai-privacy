import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { startPoolWorker, planC3Operation, describeReceiving, loadVerifiedArtifact, proveC3 } from '../src/worker.js';
import { PoolWorkerClient, C3_TESTNET_MANIFEST } from '../src/client.js';
import { walletSeedFromMnemonic, deriveZkRoot, ZkWalletIdentity, decodeNzkAddress } from '../src/zk-wallet.js';
import { BrowserTestIdentity } from '../src/browser-wallet.js';
import { sealNote } from '../src/hpke.js';
import { c3Chain, C3_TIP } from './helpers/c3-chain.js';

const { vectors } = JSON.parse(readFileSync(new URL('./fixtures/nzk-vectors.json', import.meta.url)));
const words = vectors[0].input;
const pool = { network: 'testnet', domain: C3_TESTNET_MANIFEST.domain, assetId: C3_TESTNET_MANIFEST.assetId };

// In-process stand-in for a Worker: messages are structured-cloned like postMessage.
function workerPair() {
  const worker = { onmessage: null, terminated: false,
    postMessage: m => queueMicrotask(() => scope.onmessage?.({ data: structuredClone(m) })), terminate() { this.terminated = true; } };
  const scope = { onmessage: null, postMessage: m => queueMicrotask(() => worker.onmessage?.({ data: structuredClone(m) })) };
  return { worker, scope };
}

test('worker and client: derive from wallet words, scan the C3 chain and rotate addresses', async () => {
  const chain = c3Chain();
  const { worker, scope } = workerPair();
  const handle = startPoolWorker({ scope, artifactBaseUrl: 'http://artifacts.test/', singleThread: false });
  const stages = [];
  const client = new PoolWorkerClient({ worker, rpc: chain.rpc, onStage: m => stages.push(m) });
  const derived = await client.derive({ mnemonic: words.mnemonic, passphrase: words.passphrase, zkPassphrase: '', account: 0 });
  assert.equal(derived.addresses.kind, 'derived');
  assert.equal(derived.addresses.fingerprint, vectors[0].output.fingerprint);
  assert.equal(derived.addresses.current.address, vectors[0].output.address);
  assert.equal(derived.backup, null);
  const scan = await client.scan({ gap: 5 });
  assert.equal(scan.result.transitions.length, 7);
  assert.equal(scan.result.balanceAtomic, '0');
  assert.equal(scan.result.height, C3_TIP);
  assert.equal(scan.addresses.gap, 5);
  assert.equal(typeof scan.checkpoint, 'string');
  const beforeResume = chain.calls.length;
  const resumed = await client.scan({ checkpoint: scan.checkpoint });
  assert.deepEqual(resumed.result, scan.result);
  assert.ok(chain.calls.length - beforeResume < 15, 'checkpoint avoids replaying the pool');
  const corrupt = scan.checkpoint.slice(0, -5) + 'xxxxx';
  const recovered = await client.scan({ checkpoint: corrupt });
  assert.deepEqual(recovered.result, scan.result);
  assert.ok(stages.some(m => m.startsWith('Reading pool operation at block')));
  assert.ok(!chain.calls.includes('getblock'), 'spent-index scan only');
  const rotated = await client.newAddress();
  assert.equal(rotated.addresses.current.index, 1);
  assert.equal(rotated.addresses.current.address, vectors[1].output.address);
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
  const pending = client.derive({ mnemonic: 'words' });
  fake.onerror({ message: 'out of memory', preventDefault() {} });
  await assert.rejects(pending, /out of memory/);
  assert.deepEqual([client.stopped, terminated, crashes], [true, 1, ['out of memory']]);
  await assert.rejects(client.scan(), /Privacy worker stopped/);
  const before = sent.length;
  await fake.onmessage({ data: { type: 'rpc', id: 3, method: 'getblockcount', params: [] } });
  await new Promise(r => setTimeout(r, 0));
  assert.equal(sent.length, before);
});

test('planning chooses the C3 form, sends own notes to the change address and parses nzk recipients', async () => {
  const root = await deriveZkRoot(await walletSeedFromMnemonic(words.mnemonic, words.passphrase), '');
  const identity = ZkWalletIdentity.fromRoot({ root, account: 0, ...pool });
  const other = ZkWalletIdentity.fromRoot({ root, account: 1, ...pool });
  const note = { cm: 'aa'.repeat(32), amountAtomic: 500n, spent: false, address: { chain: 0, index: 2 } };
  const scan = reserve => ({ reserveAtomic: reserve, notes: [note, { ...note, cm: 'bb'.repeat(32), spent: true }] });
  const own = identity.selfRecipient();
  const opened = created => identity.identityAt(1, 0).openRecord(created.record, created.cm);
  const d0 = planC3Operation({ identity, scan: scan(0n), action: 'deposit', amountAtomic: '100', pool });
  assert.equal(d0.form, 'D0');
  assert.equal(opened(d0.created[0]).amountAtomic, 100n);
  assert.equal(planC3Operation({ identity, scan: scan(5n), action: 'deposit', amountAtomic: 100n, pool }).form, 'D1');
  assert.throws(() => planC3Operation({ identity, scan: scan(0n), action: 'deposit', amountAtomic: 100000000001n, pool }), /at most 1000 XNA/);
  const to = other.addressAt(0, 0);
  const t2 = planC3Operation({ identity, scan: scan(900n), action: 'transfer', amountAtomic: '200', note: note.cm, recipient: to, pool });
  assert.equal(t2.form, 'T2');
  assert.equal(other.identityAt(0, 0).openRecord(t2.created[0].record, t2.created[0].cm).amountAtomic, 200n);
  assert.equal(opened(t2.created[1]).amountAtomic, 300n);
  assert.equal(own.owner, identity.descriptorAt(1, 0).owner);
  assert.equal(planC3Operation({ identity, scan: scan(900n), action: 'transfer', amountAtomic: '500', note: note.cm, recipient: to, pool }).form, 'T1');
  assert.throws(() => planC3Operation({ identity, scan: scan(900n), action: 'transfer', amountAtomic: '501', note: note.cm, recipient: to, pool }), /exceeds/);
  assert.throws(() => planC3Operation({ identity, scan: scan(900n), action: 'transfer', amountAtomic: '1', note: 'bb'.repeat(32), recipient: to, pool }), /no longer spendable/);
  assert.throws(() => planC3Operation({ identity, scan: scan(900n), action: 'transfer', amountAtomic: '1', note: note.cm, recipient: 'tnzk1bad', pool }), /nzk/);
  assert.equal(planC3Operation({ identity, scan: scan(500n), action: 'withdraw', note: note.cm, pool }).form, 'W_full');
  const partial = planC3Operation({ identity, scan: scan(900n), action: 'withdraw', note: note.cm, pool });
  assert.deepEqual([partial.form, partial.amountAtomic], ['W_partial', '500']);
  assert.throws(() => planC3Operation({ identity, scan: scan(900n), action: 'burn', note: note.cm, pool }), /Unknown pool action/);
  for (const w of [identity, other]) w.lock();
});

test('receiving summary lists used addresses with received totals', async () => {
  const root = await deriveZkRoot(await walletSeedFromMnemonic(words.mnemonic, words.passphrase), '');
  const identity = ZkWalletIdentity.fromRoot({ root, account: 0, ...pool, gap: 4 });
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
  const out = await proveC3({ form: 'D0', prepared: { input: {} }, artifacts: { forms }, loadArtifact, snarkjs: fakeSnarkjs(true), onStage: s => stages.push(s) });
  assert.deepEqual(out.publicSignals, ['1']);
  assert.deepEqual(calls, [['wtns', 2, 'mem'], ['prove', true], ['verify']]);
  assert.deepEqual(stages, ['Calculating private witness', 'Generating D0 proof locally · one thread', 'Verifying proof and transaction binding']);
  await assert.rejects(proveC3({ form: 'D0', prepared: { input: {} }, artifacts: { forms }, loadArtifact, snarkjs: fakeSnarkjs(false) }), /verification failed/);
  await assert.rejects(proveC3({ form: 'T9', prepared: { input: {} }, artifacts: { forms }, loadArtifact, snarkjs: fakeSnarkjs(true) }), /Unknown C3 form/);
});
