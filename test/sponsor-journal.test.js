import test from 'node:test';
import assert from 'node:assert/strict';
import { SponsorJournal } from '../src/sponsor-journal.js';
import { prepareSponsorSweep, validateSponsorSignature } from '../src/sponsor-sweep.js';

const h = n => n.toString(16).padStart(64, '0');
const genesis = h(1), walletId = h(2), script = '76a914' + '03'.repeat(20) + '88ac';
class Store {
  rows = new Map(); writes = 0; fail = false;
  async read(k) { return this.rows.get(k) ?? null; }
  async compareAndSwap(k, previous, next) { if (this.fail) throw Error('Disk failure'); if ((this.rows.get(k) ?? null) !== previous) return false; this.rows.set(k, next); this.writes++; return true; }
}
const options = store => ({ store, genesis, walletId, budgetAtomic: '30000000' });
const note = n => ({ cm: h(n), nf: h(n + 100) });
const offer = (n = 5, s = script) => ({ outpoint: h(n) + ':1', inputAtomic: '100000000', changeAtomic: '90000000', inputScript: s, changeScript: s, index: 2, sighash: 131 });
async function setup() { const store = new Store(), j = new SponsorJournal(options(store)); await j.initialize({create:true}); await j.reserveOperation({ operationId: h(4), budgetAtomic: '30000000', notes: [note(10), note(11)] }); return { j, store }; }
async function reconcile(j, spent = {}, txid = null, spentNullifiers = []) {
  const s = await j.snapshot();
  return j.reconcile({ expectedRevision: s.revision, genesis, tip: { height: 120, hash: h(99) }, confirmedSpends: spent,
    operations: s.operations.map(o => ({ operationId: o.operationId, txid, spentNullifiers })) });
}
function signedSweep(o, type = 1) {
  const t = prepareSponsorSweep(o, '1000');
  const sig = '3006020101020101' + type.toString(16).padStart(2, '0');
  const push = '09' + sig + '21' + '02' + '04'.repeat(32);
  // Replace the empty scriptSig after version, input count and outpoint.
  const at = 5 * 2 + 36 * 2;
  return t.raw.slice(0, at) + (push.length / 2).toString(16).padStart(2, '0') + push + t.raw.slice(at + 2);
}
const rpc = async (method) => method === 'getblockhash' ? genesis : method === 'gettxout' ? { confirmations: 2, value: 1, scriptPubKey: { hex: script } } : method === 'testmempoolaccept' ? [{ allowed: true }] : method === 'decoderawtransaction' ? { txid: h(88) } : assert.fail(method);

test('persist exposure before signer, preserve after failure and restart', async () => {
  const { j, store } = await setup();
  await assert.rejects(j.signAuthorization(h(4), offer(), { rpc, sign: async () => { assert.deepEqual((await j.snapshot()).operations[0].exposedOutpoints, [offer().outpoint]); throw Error('Signer crashed'); } }), /Signer crashed/);
  const restored = new SponsorJournal(options(store)); await restored.initialize();
  assert.deepEqual(await restored.snapshot(), await j.snapshot());
  await assert.rejects(restored.exposeAuthorization(h(4), offer(6)), /reconciliation/);
  await reconcile(restored);
  await assert.rejects(restored.exposeAuthorization(h(4), offer(6)), /still exposed/);
  await assert.rejects(restored.abandonUnexposed(h(4)), /cannot be released/);
});
test('restored freshness cannot be bypassed through another mutation', async () => {
  const { j, store } = await setup(); await j.exposeAuthorization(h(4), offer()); await reconcile(j, { [offer().outpoint]: h(55) });
  const restored = new SponsorJournal(options(store)); await restored.initialize();
  await restored.reserveOperation({ operationId: h(40), budgetAtomic: '1000', notes: [note(30)] });
  await assert.rejects(restored.exposeAuthorization(h(4), offer(6)), /reconciliation/);
});
test('budgets accumulate, stolen sponsor does not confirm payment, reorg reopens all', async () => {
  const { j } = await setup(); await j.exposeAuthorization(h(4), offer());
  let s = await reconcile(j, { [offer().outpoint]: h(51) });
  assert.equal(s.operations[0].privateOperation, 'pending'); assert.equal(s.operations[0].reservationClosed, false);
  await j.exposeAuthorization(h(4), offer(6));
  s = await reconcile(j, {}, null);
  assert.equal(s.operations[0].exposedOutpoints.length, 2);
  await assert.rejects(j.exposeAuthorization(h(4), offer(7)), /still exposed/);
  await reconcile(j, { [offer().outpoint]: h(51), [offer(6).outpoint]: h(52) }); await j.exposeAuthorization(h(4), offer(7));
  await reconcile(j, Object.fromEntries([5,6,7].map(n => [offer(n).outpoint, h(50+n)])));
  await assert.rejects(j.exposeAuthorization(h(4), offer(8)), /budget/);
  assert.equal((await j.snapshot()).authorizedAtomic, '30000000');
});
test('confirmation with another sponsor does not revoke old authorization; rollback reopens notes', async () => {
  const { j } = await setup(); await j.exposeAuthorization(h(4), offer());
  let s = await reconcile(j, {}, h(77), [note(10).nf, note(11).nf]);
  assert.equal(s.operations[0].reservationClosed, true); assert.equal(s.operations[0].exposedOutpoints.length, 1);
  await assert.rejects(j.exposeAuthorization(h(4), offer(6)), /confirmed/);
  s = await reconcile(j);
  assert.equal(s.operations[0].privateOperation, 'pending'); assert.equal(s.operations[0].reservationClosed, false);
  await assert.rejects(j.abandonUnexposed(h(4)), /cannot be released/);
});
test('global coin and private resource guards cover operations and pools', async () => {
  const { j } = await setup(); await j.exposeAuthorization(h(4), offer());
  await assert.rejects(j.reserveOperation({ operationId: h(20), budgetAtomic: '1000', notes: [note(10)] }), /resources reused/);
  await j.reserveOperation({ operationId: h(20), budgetAtomic: '20000000', notes: [note(21)] });
  await assert.rejects(j.exposeAuthorization(h(20), offer()), /already authorized/);
  await reconcile(j, { [offer().outpoint]: h(55) });
  await assert.rejects(j.exposeAuthorization(h(20), offer()), /already authorized/);
});
test('two concurrent managers cannot authorize one coin twice', async () => {
  const { j, store } = await setup(); await j.reserveOperation({ operationId: h(20), budgetAtomic: '20000000', notes: [note(21)] });
  const second = new SponsorJournal(options(store)); await second.initialize(); await reconcile(second);
  await reconcile(j);
  // The second manager is now stale: only one commit can win, including races after scanning.
  const outcomes = await Promise.allSettled([j.exposeAuthorization(h(4), offer()), second.exposeAuthorization(h(20), offer())]);
  assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal((await j.snapshot()).authorizedAtomic, '10000000');
});
test('corrupt or missing storage, immutable scope and IO errors fail closed', async () => {
  const { j, store } = await setup(); const key = [...store.rows.keys()][0], original = store.rows.get(key);
  store.rows.set(key, '{'); await assert.rejects(j.snapshot()); await assert.rejects(j.initialize());
  store.rows.set(key, original.replace('test-v1', 'test-v2')); await assert.rejects(j.snapshot(), /restoration/);
  store.rows.set(key, original); await assert.rejects(new SponsorJournal({ ...options(store), budgetAtomic: '40000000' }).initialize(), /restoration/);
  store.fail = true; let calls = 0;
  await assert.rejects(j.signAuthorization(h(4), offer(), { rpc, sign: async () => { calls++; return ''; } }), /Disk failure/); assert.equal(calls, 0);
  store.fail = false; store.rows.delete(key); await assert.rejects(j.exposeAuthorization(h(4), offer()), /missing/);
  await assert.rejects(j.initialize(), /missing/);
});
test('stale, incomplete and forged-shape observations do not mutate the ledger', async () => {
  const { j } = await setup(); await j.exposeAuthorization(h(4), offer()); const original = await j.export(), revision = (await j.snapshot()).revision;
  for (const alteration of [{ expectedRevision: revision-1 }, { genesis: h(9) }, { operations: [] }, { confirmedSpends: { [offer(9).outpoint]: h(55) } },
    { operations: [{ operationId: h(4), txid: h(77), spentNullifiers: [note(10).nf] }] }]) {
    await assert.rejects(j.reconcile({ expectedRevision: revision, genesis, tip: { height: 120, hash: h(99) }, confirmedSpends: {}, operations: [{ operationId: h(4), txid: null, spentNullifiers: [] }], ...alteration }));
    assert.equal(await j.export(), original);
  }
});
test('numeric, dust, shape and resource limits', async () => {
  const { j } = await setup();
  for (const changed of [{ changeAtomic: '1' }, { inputAtomic: 100000000 }, { inputAtomic: '0100000000' }, { inputAtomic: '2100000000000000001' }, { changeScript: '51' }, { inputScript: '5120'+h(1) }, { index: 0 }, { sighash: 1 }, { extra: true }]) await assert.rejects(j.exposeAuthorization(h(4), { ...offer(), ...changed }));
  await assert.rejects(j.reserveOperation({ operationId: h(20), budgetAtomic: '1000', notes: [note(21), note(21)] }), /Duplicate/);
});
test('ALL sweep envelope and pending state; wrong signer never closes exposure', async () => {
  const { j } = await setup(); await j.exposeAuthorization(h(4), offer());
  const template = prepareSponsorSweep(offer(), '1000'); assert.equal(template.hashType, 1); assert.equal(template.outputAtomic, '99999000');
  assert.equal(validateSponsorSignature(signedSweep(offer()), offer(), template), true);
  assert.throws(() => validateSponsorSignature(signedSweep(offer(), 131), offer(), template), /wrong sighash/);
  assert.throws(() => validateSponsorSignature(signedSweep(offer())+'00', offer(), template), /Trailing/);
  await assert.rejects(j.prepareSweep(offer().outpoint, { rpc, feeAtomic: '1000', sign: async () => signedSweep(offer(), 131) }), /wrong sighash/);
  let calls = 0;
  const swept = await j.prepareSweep(offer().outpoint, { rpc, feeAtomic: '1000', sign: async request => { calls++; assert.equal(request.hashType, 1); assert.equal(request.raw, template.raw); return signedSweep(offer()); } });
  assert.equal(calls, 1); assert.equal(swept.txid, h(88));
  let s = await j.snapshot(); assert.equal(s.operations[0].sponsors[0].sweepTxid, h(88)); assert.equal(s.operations[0].exposedOutpoints.length, 1);
  await assert.rejects(j.exposeAuthorization(h(4), offer(6)), /still exposed/);
  s = await reconcile(j, { [offer().outpoint]: swept.txid }); assert.equal(s.operations[0].exposedOutpoints.length, 0);
  s = await reconcile(j); assert.equal(s.operations[0].exposedOutpoints.length, 1);
});
test('sweep fee, unchanged fields, unsupported types and RPC failures', async () => {
  const { j } = await setup(); await j.exposeAuthorization(h(4), offer());
  for (const f of ['0', '100000000', '99999999', '1.5', 'NaN']) assert.throws(() => prepareSponsorSweep(offer(), f));
  const raw = signedSweep(offer()), t = prepareSponsorSweep(offer(), '1000');
  assert.throws(() => validateSponsorSignature('02000000'+raw.slice(8), offer(), t), /v3/);
  assert.throws(() => validateSponsorSignature(raw.slice(0,-8)+'01000000', offer(), t), /fields changed/);
  for (const answer of [null, { confirmations: 0 }, { confirmations: 2, value: 2, scriptPubKey: { hex: script } }]) {
    let called = false;
    await assert.rejects(j.prepareSweep(offer().outpoint, { rpc: async method => method === 'getblockhash' ? genesis : answer, feeAtomic: '1000', sign: async () => { called = true; return raw; } }));
    assert.equal(called, false);
  }
});
test('partial private double spend stays reserved as conflicted', async () => {
  const { j } = await setup(); await j.exposeAuthorization(h(4), offer());
  const s = await reconcile(j, {}, null, [note(10).nf]); assert.equal(s.operations[0].privateOperation, 'conflicted'); assert.equal(s.operations[0].reservationClosed, false);
  await assert.rejects(j.exposeAuthorization(h(4), offer(6)), /conflicted/);
});

test('a separately delivered proof keeps notes reserved without a sponsor', async () => {
  const { j } = await setup(); await j.markPrivateExposure(h(4));
  await assert.rejects(j.abandonUnexposed(h(4)), /cannot be released/);
  await reconcile(j); assert.equal((await j.snapshot()).operations[0].privateExposed, true);
});

test('authenticated backup restores missing storage without overwriting live history', async () => {
  const { j } = await setup(); await j.exposeAuthorization(h(4), offer());
  const backup = await j.export(), restored = new SponsorJournal(options(new Store()));
  const state = await restored.restore(backup);
  assert.deepEqual(state, await j.snapshot());
  await assert.rejects(restored.restore(backup), /overwrite/);
  await assert.rejects(restored.exposeAuthorization(h(4), offer(6)), /reconciliation/);
  const wrong = new SponsorJournal({...options(new Store()),walletId:h(999)});
  await assert.rejects(wrong.restore(backup), /restoration/);
  await reconcile(restored); await assert.rejects(restored.exposeAuthorization(h(4), offer(6)), /still exposed/);
});
test('wallet-wide budget cannot be bypassed with a second operation', async () => {
  const { j } = await setup(); await j.exposeAuthorization(h(4), offer());
  await j.reserveOperation({operationId:h(20),budgetAtomic:'30000000',notes:[note(21)]});
  const prior=await j.export();
  await assert.rejects(j.exposeAuthorization(h(20), {...offer(6),changeAtomic:'75000000'}), /Wallet sponsor budget/);
  assert.equal(await j.export(), prior);
  await j.exposeAuthorization(h(20), {...offer(6),changeAtomic:'80000000'});
  assert.equal((await j.snapshot()).authorizedAtomic,'30000000');
});
