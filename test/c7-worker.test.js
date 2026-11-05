/* C7 proving worker and its main-thread client, wired through an in-memory
 * message channel, an in-memory CAS store and the in-memory chain. Artifacts are
 * pinned dummies and the prover is synthetic; everything else is the real code. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as sdk from '../src/index.js';
import { readC7RawTransaction } from '../src/c7-raw-transaction.js';
import { C7Chain, fakeProof } from './helpers/c7-chain.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/c7-deployment.json', import.meta.url)));
const nzk = JSON.parse(readFileSync(new URL('./fixtures/nzk-vectors.json', import.meta.url))).vectors[0].input;
const { manifest, deployment } = fixture;
const XNA = 100000000n, fee = 10000000n;
const hex = b => Buffer.from(b).toString('hex');

// Dummy proving artifacts, pinned by size and SHA-256 like real ones.
const files = {}, forms = {}, blobs = new Map();
for (const op of ['D', 'T1', 'T2', 'T3', 'W', 'J2']) {
  forms[op] = { wasm: op + '.wasm', zkey: op + '.zkey', vk: op + '.vk.json' };
  for (const [path, body] of [[op + '.wasm', 'wasm ' + op], [op + '.zkey', 'zkey ' + op], [op + '.vk.json', JSON.stringify({ op })]]) {
    const bytes = new TextEncoder().encode(body);
    blobs.set(path, bytes); files[path] = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  }
}
const artifacts = { files, forms };
const fetchArtifact = async path => ({ ok: blobs.has(path), arrayBuffer: async () => blobs.get(path).slice().buffer });
// The public signals of each circuit, in order, from its private input.
const publicsOf = i => 'nf_0' in i ? [i.ctx, i.R, i.nf_0, i.nf_1, i.data_hash, i.fee, i.cm]
  : 'dep' in i ? [i.ctx, i.dep, i.data_hash, i.amount, i.fee]
  : 'pay' in i ? [i.ctx, i.R, i.nf, i.amount, i.fee, i.pay, i.cm_change, i.data_hash]
  : [i.ctx, i.R, i.nf, i.data_hash, i.fee, ...i.cms];
const snarkjs = { wtns: { calculate: async (input, _wasm, witness) => { witness.publics = publicsOf(input).map(String); } },
  groth16: { prove: async (_zkey, witness) => ({ proof: structuredClone(fakeProof), publicSignals: witness.publics }), verify: async () => true } };

function memoryStore() {
  const values = new Map();
  return { values, read: async key => values.get(key) ?? null,
    compareAndSwap: async (key, expected, replacement) => { if ((values.get(key) ?? null) !== expected) return false; values.set(key, replacement); return true; } };
}
function connect(chain, store, overrides = {}) {
  const scope = { navigator: {}, onmessage: null, postMessage: m => queueMicrotask(() => worker.onmessage?.({ data: structuredClone(m) })) };
  const worker = { onmessage: null, terminate() {}, postMessage: m => queueMicrotask(() => scope.onmessage?.({ data: structuredClone(m) })) };
  const handle = sdk.startC7PoolWorker({ scope, snarkjs, manifest, deployment, domain: fixture.domain, assetId: fixture.assetId,
    network: 'testnet', expectedGenesis: manifest.network, expectedCommitment: manifest.commitment, artifacts, fetchArtifact,
    reservations: [], buildTransactions: true, durableJournal: true, ...overrides });
  const stages = [], client = new sdk.C7WorkerClient({ worker, rpc: chain.rpc, store, onStage: m => stages.push(m) });
  return { client, handle, stages };
}
/** Fill the funding input with a Legacy SIGHASH_ALL signature shape, as the host signer would. */
function signFunding(raw, index, hashType = '01') {
  const tx = readC7RawTransaction(raw), le = (n, size) => Buffer.from(BigInt(n).toString(16).padStart(size * 2, '0'), 'hex').reverse().toString('hex');
  const compact = n => n < 253 ? le(n, 1) : 'fd' + le(n, 2), blob = h => compact(h.length / 2) + h;
  tx.inputs[index].scriptSig = '47' + '30'.repeat(70) + hashType + '21' + '02' + '11'.repeat(32);
  return le(3, 4) + '0001' + compact(tx.inputs.length) + tx.inputs.map(i => Buffer.from(i.txid, 'hex').reverse().toString('hex') + le(i.vout, 4) + blob(i.scriptSig) + le(i.sequence, 4)).join('')
    + compact(tx.outputs.length) + tx.outputs.map(o => le(o.valueAtomic, 8) + blob(o.script)).join('')
    + tx.inputs.map(i => compact(i.witness.length) + i.witness.map(blob).join('')).join('') + le(tx.locktime, 4);
}

test('C7 worker refuses foreign pins and non-derived wallets', async () => {
  const chain = new C7Chain({ deployment, manifest });
  assert.throws(() => connect(chain, memoryStore(), { manifest: { ...manifest, profile: 'C6-XNA-TEST-J2-v2' } }), /pinned instance mismatch/);
  assert.throws(() => connect(chain, memoryStore(), { domain: '00'.repeat(32) }), /does not derive/);
  assert.throws(() => connect(chain, memoryStore(), { network: 'mainnet' }), /TEST networks only/);
  assert.throws(() => connect(chain, memoryStore(), { deployment: { ...deployment, emission: undefined } }), /Pinned C7 deployment/);
  const { client } = connect(chain, memoryStore());
  await assert.rejects(client.request('create', { password: 'x' }), /derived from the wallet words/);
  await assert.rejects(client.scan(), /unlock first/);
  // NeuraiWallet and the web wallet create a history when they see this text.
  await client.derive({ family: 'legacy', mnemonic: nzk.mnemonic, passphrase: nzk.passphrase });
  await assert.rejects(client.openJournal(), /^Error: C6 private journal missing/);
  client.terminate();
});

test('C7 worker derives, keeps a durable journal, prepares, signs and reconciles a deposit and a transfer', async () => {
  const chain = new C7Chain({ deployment, manifest }), store = memoryStore();
  const { client, stages } = connect(chain, store);
  const derived = await client.derive({ family: 'legacy', mnemonic: nzk.mnemonic, passphrase: nzk.passphrase });
  assert.equal(derived.identity.addresses.kind, 'derived'); assert.match(derived.identity.addresses.current.address, /^tnzk1/);
  await client.openJournal({ create: true });
  let scan = (await client.scan()).scan.result;
  assert.equal(scan.balanceAtomic, '0'); assert.ok(stages.some(m => m.startsWith('C7 synchronized through block')));

  const coin = chain.fund(500n * XNA + fee);
  const [txid, vout] = coin.point.split(':'), funding = hex(Buffer.from(txid, 'hex').reverse()) + Buffer.from(Uint32Array.of(Number(vout)).buffer).toString('hex');
  const prepared = await client.prepare({ action: 'deposit', amountAtomic: String(500n * XNA), fee: String(fee), funding, fundingValue: String(500n * XNA + fee), fundingPoint: coin.point });
  assert.equal(prepared.transaction.form, 'D0'); assert.equal(prepared.transaction.funding.point, coin.point);
  await assert.rejects(client.recordSigned(prepared.operationId, prepared.transaction.raw), /canonical hex/);
  await assert.rejects(client.recordSigned(prepared.operationId, signFunding(prepared.transaction.raw, prepared.transaction.funding.index, '81')), /SIGHASH_ALL/);
  const signed = signFunding(prepared.transaction.raw, prepared.transaction.funding.index);
  const recorded = await client.recordSigned(prepared.operationId, signed);
  assert.equal(recorded.txid, readC7RawTransaction(signed).txid); assert.notEqual(recorded.txid, prepared.transaction.txid);
  await client.broadcastAttempt(prepared.operationId);
  chain.mine({ raws: [signed] }); chain.mine();
  const reply = await client.scan();
  scan = reply.scan.result;
  assert.equal(scan.balanceAtomic, String(500n * XNA)); assert.equal(scan.spendableAtomic, String(500n * XNA));
  assert.deepEqual(reply.journal.operations.map(o => [o.action, o.outcome]), [['deposit', 'confirmed']]);
  assert.equal(scan.notes[0].cm.length, 64); assert.equal('note' in scan.notes[0] || 'path' in scan.notes[0], false, 'no private data leaves the worker');

  // Transfer 200 XNA to account B of the C7 vectors; the change stays with the wallet.
  const vectors = JSON.parse(readFileSync(new URL('./fixtures/c7-vectors.json', import.meta.url)));
  const b = vectors.accounts.find(x => x.name === 'B');
  const B = sdk.C7WalletIdentity.fromRoot({ root: Buffer.from(b.R, 'hex'), family: b.family, account: b.account, domain: fixture.domain, assetId: fixture.assetId, network: 'testnet' });
  const sent = await client.prepare({ action: 'transfer', note: scan.notes[0].cm, fee: String(fee), recipients: [{ recipient: B.addressAt(0, 0), amountAtomic: String(200n * XNA) }] });
  assert.equal(sent.transaction.form, 'T2'); assert.equal(sent.transaction.funding, null);
  await assert.rejects(client.recordSigned(sent.operationId, signFunding(sent.transaction.raw, 0)), /changed private intent/);
  await client.recordSigned(sent.operationId, sent.transaction.raw);
  chain.mine({ raws: [sent.transaction.raw] }); chain.mine();
  const after = await client.scan();
  assert.equal(after.scan.result.balanceAtomic, String(300n * XNA - fee));
  assert.deepEqual(after.journal.operations.map(o => o.outcome), ['confirmed', 'confirmed']);
  const theirs = await sdk.scanC7Pool({ rpc: chain.rpc, deployment, identity: B, strategy: 'spent-index' });
  assert.equal(theirs.balanceAtomic, String(200n * XNA));

  // The encrypted journal reopens in a new worker from the same store.
  const backup = await client.backup();
  assert.equal(backup.type, 'neurai-c6-private-journal-v1');
  client.terminate();
  const again = connect(chain, store);
  await again.client.derive({ family: 'legacy', mnemonic: nzk.mnemonic, passphrase: nzk.passphrase });
  const reopened = await again.client.openJournal();
  assert.equal(reopened.journal.operations.length, 2);
  const next = (await again.client.newAddress()).addresses;
  assert.match(next.addresses.current.address, /^tnzk1/); assert.equal(next.addresses.issued, 1);
  again.client.terminate();
});
