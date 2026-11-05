/* C7 runtime end to end on an in-memory chain: the real C7 deployment of the
 * testnet of 2026-09-26 (test/fixtures/c7-deployment.json), real C7 notes,
 * publications, public trees, MAST paths and transactions, and a synthetic
 * prover. The chain does not verify scripts or proofs; the node does that. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as sdk from '../src/index.js';
import { C7Chain, P2PKH, fakeProver } from './helpers/c7-chain.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/c7-deployment.json', import.meta.url)));
const vectors = JSON.parse(readFileSync(new URL('./fixtures/c7-vectors.json', import.meta.url)));
const { manifest, deployment } = fixture;
const unhex = s => new Uint8Array(Buffer.from(s, 'hex'));
const XNA = 100000000n, fee = 10000000n;
const identity = name => {
  const a = vectors.accounts.find(x => x.name === name);
  return sdk.C7WalletIdentity.fromRoot({ root: unhex(a.R), family: a.family, account: a.account,
    domain: fixture.domain, assetId: fixture.assetId, network: 'testnet' });
};
const wallet = sdk.createC7OperationWallet({ expectedGenesis: manifest.network, expectedCommitment: manifest.commitment });
const joiner = sdk.createC7JoinWallet({ expectedGenesis: manifest.network, expectedCommitment: manifest.commitment });
const outpoint = point => { const [txid, vout] = point.split(':'); const b = new Uint8Array(36); b.set(unhex(txid).reverse()); new DataView(b.buffer).setUint32(32, Number(vout), true); return b; };
const prove = async (w, plan) => (await w.prove(plan, { api: fakeProver(plan) })).packet;
const sum = notes => notes.reduce((n, row) => n + BigInt(row.amountAtomic), 0n);

async function scanAll(chain, who) {
  const results = [];
  for (const strategy of ['blocks', 'spent-index', 'auto']) {
    results.push(await sdk.scanC7Pool({ rpc: chain.rpc, deployment, identity: who, strategy }));
  }
  const shape = r => JSON.stringify({ opening: r.opening, statePoint: r.statePoint, reserve: r.reserveAtomic, events: r.events,
    notes: r.notes.map(n => [Buffer.from(n.cm).toString('hex'), n.amountAtomic, n.spendable]) });
  assert.equal(shape(results[1]), shape(results[0]), 'spent-index scan equals block replay');
  assert.equal(shape(results[2]), shape(results[0]), 'auto scan equals block replay');
  return results[0];
}

test('C7 deployment pins derive from its birth', () => {
  assert.equal(Buffer.from(sdk.c7PoolDomain({ genesis: deployment.genesis, emission: deployment.emission, identity: manifest.identity })).toString('hex'), fixture.domain);
  assert.equal(Buffer.from(sdk.c7XnaAssetId()).toString('hex'), fixture.assetId);
  assert.equal(Buffer.from(sdk.c7Context(unhex(fixture.domain), unhex(fixture.assetId))).toString('hex'), manifest.context);
  assert.equal(sdk.validateC7Deployment(deployment), deployment);
  assert.throws(() => sdk.validateC7Deployment({ ...deployment, emission: undefined }), /Pinned C7 deployment/);
  assert.throws(() => sdk.validateC7Deployment({ ...deployment, kind: 'asset' }), /Pinned C7 deployment/);
});

test('C7 deposit, transfer, join and withdrawal relocate, scan and conserve the reserve', async () => {
  const chain = new C7Chain({ deployment, manifest });
  const A = identity('A'), B = identity('B');

  // D0: 500 XNA into A's own address.
  const coin = chain.fund(500n * XNA + fee);
  const deposit = A.prepareC7Deposit(wallet, { manifest, fee, amountAtomic: 500n * XNA, funding: outpoint(coin.point), fundingValue: 500n * XNA + fee });
  const birth = { events: [], opening: deployment.anchor.opening, statePoint: deployment.anchor.outpoint, reserveAtomic: '0', reservePoint: null, reserveScript: null };
  const depositPacket = await prove(wallet, deposit);
  const d0 = sdk.buildC7Transaction({ packet: depositPacket, scan: birth, manifest, deployment, funding: coin });
  assert.equal(d0.form, 'D0'); assert.equal(d0.reserveAtomic, String(500n * XNA)); assert.equal(d0.funding.index, 1);
  assert.deepEqual(d0.intent, sdk.c7Intent(d0.raw, deployment));
  assert.throws(() => sdk.buildC7Transaction({ packet: depositPacket, scan: birth, manifest, deployment, funding: { ...coin, valueAtomic: String(500n * XNA) } }), /funding binding/);
  chain.mine({ raws: [d0.raw] });
  let scanA = await scanAll(chain, A);
  assert.equal(scanA.events.length, 1); assert.equal(scanA.events[0].intentId, d0.intent.operationId);
  assert.equal(scanA.notes.length, 1); assert.equal(scanA.notes[0].spendable, false, 'one confirmation is not mature');
  chain.mine();
  scanA = await scanAll(chain, A);
  assert.equal(scanA.balanceAtomic, String(500n * XNA)); assert.equal(scanA.spendableAtomic, String(500n * XNA));
  assert.equal(scanA.reserveAtomic, String(500n * XNA)); assert.equal(scanA.profile, sdk.C7_PROFILE);

  // T2: 200 XNA to B, change back to the spent note's address.
  const transfer = A.prepareC7Transfer(wallet, { manifest, fee, consumed: scanA.notes[0], operation: 'T2',
    outputs: [{ recipient: B.recipient(), amountAtomic: 200n * XNA }, { isChange: true, amountAtomic: 300n * XNA - fee }] });
  const t2 = sdk.buildC7Transaction({ packet: await prove(wallet, transfer), scan: scanA, manifest, deployment });
  assert.equal(t2.form, 'T2'); assert.equal(t2.reserveAtomic, String(500n * XNA - fee));
  chain.mine({ raws: [t2.raw] }); chain.mine();
  scanA = await scanAll(chain, A);
  let scanB = await scanAll(chain, B);
  assert.equal(scanA.balanceAtomic, String(300n * XNA - fee)); assert.equal(scanB.balanceAtomic, String(200n * XNA));
  assert.equal(scanA.events[1].intentId, t2.intent.operationId);

  // D1: 100 XNA more for A, so that A holds two notes under one root.
  const coin2 = chain.fund(100n * XNA + fee);
  const deposit2 = A.prepareC7Deposit(wallet, { manifest, fee, amountAtomic: 100n * XNA, funding: outpoint(coin2.point), fundingValue: 100n * XNA + fee });
  const d1 = sdk.buildC7Transaction({ packet: await prove(wallet, deposit2), scan: scanA, manifest, deployment, funding: coin2 });
  assert.equal(d1.form, 'D1'); assert.equal(d1.funding.index, 2, 'state, reserve, funding');
  chain.mine({ raws: [d1.raw] }); chain.mine();
  scanA = await scanAll(chain, A);
  assert.equal(scanA.notes.length, 2); assert.ok(scanA.notes.every(n => n.spendable));

  // J2: join both notes; the result goes to the address of note 0.
  const join = A.prepareC7Join(joiner, { manifest, fee, consumed: scanA.notes });
  const j2 = sdk.buildC7Transaction({ packet: (await joiner.prove(join, { api: fakeProver(join) })).packet, scan: scanA, manifest, deployment });
  assert.equal(j2.form, 'J2');
  chain.mine({ raws: [j2.raw] }); chain.mine();
  scanA = await scanAll(chain, A);
  assert.equal(scanA.notes.length, 1); assert.equal(scanA.balanceAtomic, String(400n * XNA - 2n * fee), 'deposit fees are paid by the funding coin');
  assert.deepEqual(scanA.notes[0].address, { chain: 1, index: 0 });

  // W_partial_change: 100 XNA out to a Legacy address.
  const withdrawal = A.prepareC7Withdrawal(wallet, { manifest, fee, consumed: scanA.notes[0], amountAtomic: 100n * XNA, payoutScript: unhex(P2PKH) });
  const w = sdk.buildC7Transaction({ packet: await prove(wallet, withdrawal), scan: scanA, manifest, deployment });
  assert.equal(w.form, 'W_partial_change');
  assert.equal(sdk.c7Intent(w.raw, deployment).nullifiers.length, 1);
  chain.mine({ raws: [w.raw] }); chain.mine();
  scanA = await scanAll(chain, A); scanB = await scanAll(chain, B);
  assert.equal(scanA.balanceAtomic, String(300n * XNA - 3n * fee));
  // Every fee leaves the reserve together with the notes that paid it.
  assert.equal(BigInt(scanA.reserveAtomic), sum(scanA.notes) + sum(scanB.notes));
  assert.deepEqual(scanA.events.map(e => e.form), ['D0', 'T2', 'D1', 'J2', 'W_partial_change']);

  // A relocation built against an old scan no longer matches the state.
  const stale = A.prepareC7Withdrawal(wallet, { manifest, fee, consumed: scanA.notes[0], amountAtomic: 100n * XNA, payoutScript: unhex(P2PKH) });
  const old = { ...scanA, opening: deployment.anchor.opening }, stalePacket = await prove(wallet, stale);
  assert.throws(() => sdk.buildC7Transaction({ packet: stalePacket, scan: old, manifest, deployment }), /state opening/);
  assert.throws(() => sdk.buildC7Transaction({ packet: stalePacket, scan: scanA, manifest: { ...manifest, profile: 'C6-XNA-TEST-J2-v2' }, deployment }), /C7 manifest required/);
});

test('C7 scanner refuses other identities, other chains and a wrong birth', async () => {
  const chain = new C7Chain({ deployment, manifest });
  await assert.rejects(sdk.scanC7Pool({ rpc: chain.rpc, deployment, identity: { generation: 'c6', recipient() {} }, strategy: 'blocks' }), /C7 wallet identity/);
  const other = async (method, params) => method === 'getblockhash' && params[0] === 0 ? '00'.repeat(32) : chain.rpc(method, params);
  await assert.rejects(sdk.scanC7Pool({ rpc: other, deployment, identity: identity('A'), strategy: 'blocks' }), /wrong genesis/);
  const noBurn = async (method, params) => { const r = await chain.rpc(method, params); if (method === 'getblock' && r.height === deployment.anchor.height) r.tx[0].vout.pop(); return r; };
  await assert.rejects(sdk.scanC7Pool({ rpc: noBurn, deployment, identity: identity('A'), strategy: 'blocks' }), /must burn/);
});
