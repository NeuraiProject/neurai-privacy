/** Full native-XNA TEST wallet flow. Only run with an explicit funded test node. */
import assert from 'node:assert/strict';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { work, rpc, walletAt } from './config.mjs';

const alice = walletAt('wallet', 'password.test');
const bob = walletAt('bob', 'password-bob.test');
try { await stat(work + '/bob/secrets.json.enc'); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  await bob.createWallet();
}
const amount = 100_000_000n;
const journalFile = work + '/flow-journal.json';
let journal = {};
try { journal = JSON.parse(await readFile(journalFile, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
async function record(name, value) {
  journal[name] = value;
  await writeFile(journalFile, JSON.stringify(journal) + '\n', { mode: 0o600 });
}
function log(stage, detail) { console.error(stage + (detail ? ' ' + detail : '')); }
async function waitFor(stage, check, timeoutMs = 600_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const result = await check();
    if (result) return result;
    if (Date.now() >= deadline) throw new Error(stage + ' did not confirm within ten minutes');
    await new Promise(resolve => setTimeout(resolve, 10_000));
  }
}
async function confirmed(txid) {
  return waitFor('confirmation ' + txid, async () => {
    const tx = await alice.transactionStatus(txid);
    return tx.state === 'confirmed' ? tx : null;
  });
}
const before = await alice.fundingStatus({ amountSats: amount });
if (!before.ready) {
  if (!journal.fundingTxid) {
    const funding = await alice.createFundingUtxo({ amountSats: amount });
    assert.match(funding.created_txid, /^[0-9a-f]{64}$/i);
    await record('fundingTxid', funding.created_txid);
    log('funding-broadcast', funding.created_txid);
  }
  await confirmed(journal.fundingTxid);
  await waitFor('funding UTXO', async () =>
    (await alice.fundingStatus({ amountSats: amount })).ready);
}
let aliceScan = await alice.scan();
let bobScan = await bob.scan();
if (!journal.depositTxid) {
  log('deposit-start');
  const tx = await alice.deposit({ amountSats: amount, broadcast: true,
    onProgress: event => log('deposit-' + event.stage) });
  assert.ok(['D0', 'D1'].includes(tx.form));
  await record('depositTxid', tx.txid);
  log('deposit-broadcast', tx.txid);
}
await confirmed(journal.depositTxid);
aliceScan = await alice.scan();
assert.ok(aliceScan.ownedNotes.some(note => !note.spent && note.amountAtomic === amount));
if (!journal.transferTxid) {
  const note = aliceScan.ownedNotes.find(item => !item.spent && item.amountAtomic === amount);
  log('transfer-start');
  const tx = await alice.transfer({ noteCm: note.cm,
    recipients: [await alice.recipient(), await bob.recipient()],
    splitSats: [60_000_000n, 40_000_000n], broadcast: true,
    onProgress: event => log('transfer-' + event.stage) });
  assert.equal(tx.form, 'T2');
  await record('transferTxid', tx.txid);
  log('transfer-broadcast', tx.txid);
}
await confirmed(journal.transferTxid);
aliceScan = await alice.scan();
bobScan = await bob.scan();
assert.ok(aliceScan.ownedNotes.some(note => !note.spent && note.amountAtomic === 60_000_000n));
assert.ok(bobScan.ownedNotes.some(note => !note.spent && note.amountAtomic === 40_000_000n));
if (!journal.withdrawBobTxid) {
  const note = bobScan.ownedNotes.find(item => !item.spent && item.amountAtomic === 40_000_000n);
  journal.bobAddress ??= await rpc('getnewaddress', ['neurai-privacy-bob-withdraw', 'legacy']);
  await record('bobAddress', journal.bobAddress);
  log('withdraw-bob-start');
  const tx = await bob.withdraw({ noteCm: note.cm, recipient: journal.bobAddress,
    broadcast: true, onProgress: event => log('withdraw-bob-' + event.stage) });
  assert.equal(tx.form, 'W_partial');
  await record('withdrawBobTxid', tx.txid);
  log('withdraw-bob-broadcast', tx.txid);
}
await confirmed(journal.withdrawBobTxid);
bobScan = await bob.scan();
assert.equal(bobScan.balanceAtomic, 0n);
if (!journal.withdrawAliceTxid) {
  aliceScan = await alice.scan();
  const note = aliceScan.ownedNotes.find(item => !item.spent && item.amountAtomic === 60_000_000n);
  assert.ok(note);
  journal.aliceAddress ??= await rpc('getnewaddress', ['neurai-privacy-alice-withdraw', 'legacy']);
  await record('aliceAddress', journal.aliceAddress);
  log('withdraw-alice-start');
  const tx = await alice.withdraw({ noteCm: note.cm, recipient: journal.aliceAddress,
    broadcast: true, onProgress: event => log('withdraw-alice-' + event.stage) });
  assert.equal(tx.form, 'W_full');
  await record('withdrawAliceTxid', tx.txid);
  log('withdraw-alice-broadcast', tx.txid);
}
await confirmed(journal.withdrawAliceTxid);
aliceScan = await alice.scan();
bobScan = await bob.scan();
assert.equal(aliceScan.balanceAtomic, 0n);
assert.equal(bobScan.balanceAtomic, 0n);
assert.equal(aliceScan.reserveAtomic, 0n);
assert.ok(aliceScan.ownedNotes.some(note => note.spent && note.spentTxid === journal.transferTxid));
assert.ok(bobScan.ownedNotes.some(note => note.spent && note.spentTxid === journal.withdrawBobTxid));
console.log(JSON.stringify({ ok: true, amount_sats: String(amount),
  funding_txid: journal.fundingTxid, deposit_txid: journal.depositTxid,
  transfer_txid: journal.transferTxid, withdraw_bob_txid: journal.withdrawBobTxid,
  withdraw_alice_txid: journal.withdrawAliceTxid,
  alice_final_balance_sats: String(aliceScan.balanceAtomic),
  bob_final_balance_sats: String(bobScan.balanceAtomic),
  reserve_sats: String(aliceScan.reserveAtomic) }));
