/** Read-only TEST integration against a pinned pool instance and local Docker node. */
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { work, rpc, walletAt } from './config.mjs';

const wallet = walletAt('wallet', 'password.test');
const status = await wallet.networkStatus();
const recipient = await wallet.recipient();
const snapshot = await wallet.scan();
assert.ok(snapshot.height >= status.height);
if (snapshot.height === status.height) assert.equal(snapshot.blockhash, status.blockhash);
assert.equal(snapshot.birth.height, 3002);
assert.ok(snapshot.history.length >= 13);
assert.equal(snapshot.history.at(-1).reserveAtomic, snapshot.reserveAtomic);
assert.equal(snapshot.ownedNotes.filter(note => !note.spent).length, 0);
assert.equal(snapshot.balanceAtomic, 0n);
assert.deepEqual(await wallet.listNotes(), snapshot.ownedNotes);
assert.deepEqual(await wallet.history(), snapshot.history);

const funding = await wallet.fundingStatus({ amountSats: 100_000_000n });
assert.equal(funding.amount_sats, '100000000');
assert.equal(funding.created_txid, null);
const confirmed = await wallet.transactionStatus(snapshot.birth.txid);
assert.equal(confirmed.state, 'confirmed');
assert.equal(confirmed.height, snapshot.birth.height);
const historicalRaw = await rpc('getrawtransaction', [snapshot.birth.txid, false]);
await assert.rejects(wallet.publishPrepared({ txid: snapshot.birth.txid,
  raw_tx: historicalRaw }), /prepared transaction rejected/);

const recoveryDir = await mkdtemp(join(work, 'recovery-'));
const backup = await wallet.backupWallet(recoveryDir + '/backup.enc');
assert.equal(backup.operation, 'backup');
const restored = walletAt(recoveryDir + '/restored', 'password.test');
await restored.restoreWallet(recoveryDir + '/backup.enc');
assert.deepEqual(await restored.recipient(), recipient);
const recovered = await restored.scan();
assert.ok(recovered.height >= snapshot.height);
assert.deepEqual(recovered.history.slice(0, snapshot.history.length), snapshot.history);
assert.equal(recovered.balanceAtomic, snapshot.balanceAtomic);
await rm(recoveryDir, { recursive: true, force: true });
console.log(JSON.stringify({ ok: true, height: status.height,
  transitions: snapshot.history.length, balance_sats: String(snapshot.balanceAtomic),
  funding_ready: funding.ready, recipient_match: true, backup_restored: true,
  genesis_checked: true, history_checked: true }));
