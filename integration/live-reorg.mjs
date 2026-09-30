/** Reorg the TEST pool only on a zero-peer Docker clone; never use a public node. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { work, node, rpc, walletAt } from './config.mjs';

assert.equal(process.env.NEURAI_PRIVACY_ALLOW_ISOLATED_REORG, '1',
  'explicit isolated-reorg opt-in required');
assert.equal(execFileSync('docker', ['inspect', '--format',
  '{{.HostConfig.NetworkMode}}', node], { encoding: 'utf8' }).trim(), 'none',
  'reorg test requires Docker network mode none');
const alice = walletAt('wallet', 'password.test');
const bob = walletAt('bob', 'password-bob.test');
assert.equal((await rpc('getpeerinfo')).length, 0, 'reorg test requires zero peers');
const originalTip = await rpc('getbestblockhash');
const originalHeight = await rpc('getblockcount');
assert.ok(originalHeight >= 4593, 'public TEST withdrawal block missing from clone');
const target = await rpc('getblockhash', [4593]);
const journal = JSON.parse(await readFile(work + '/flow-journal.json', 'utf8'));
const finalTxid = journal.withdrawAliceTxid;
assert.ok((await rpc('getblock', [target, 1])).tx.includes(finalTxid));
const finalRaw = await rpc('getrawtransaction', [finalTxid, false]);
const originalAlice = await alice.scan();
const originalBob = await bob.scan();
assert.equal(originalAlice.balanceAtomic, 0n);
assert.equal(originalBob.balanceAtomic, 0n);
assert.equal(originalAlice.reserveAtomic, 0n);
let disconnectedAlice, disconnectedBob;
let invalidated = false;
try {
  await rpc('invalidateblock', [target]);
  invalidated = true;
  assert.equal(await rpc('getblockcount'), 4592);
  disconnectedAlice = await alice.scan();
  disconnectedBob = await bob.scan();
  assert.equal(disconnectedAlice.balanceAtomic, 60_000_000n);
  assert.equal(disconnectedBob.balanceAtomic, 0n);
  assert.equal(disconnectedAlice.reserveAtomic, 60_000_000n);
  assert.ok(disconnectedAlice.ownedNotes.some(note => !note.spent && note.amountAtomic === 60_000_000n));
  await rpc('clearmempool');
  const published = await alice.publishPrepared({ txid: finalTxid, raw_tx: finalRaw });
  assert.equal(published.broadcast, true);
  assert.ok((await rpc('getrawmempool')).includes(finalTxid));
  await assert.rejects(alice.publishPrepared({ txid: finalTxid, raw_tx: finalRaw }),
    /prepared transaction rejected/);
} finally {
  if (invalidated) await rpc('reconsiderblock', [target]);
}
assert.equal(await rpc('getbestblockhash'), originalTip);
assert.equal(await rpc('getblockcount'), originalHeight);
assert.ok(!(await rpc('getrawmempool')).includes(finalTxid));
const restoredAlice = await alice.scan();
const restoredBob = await bob.scan();
assert.equal(restoredAlice.balanceAtomic, 0n);
assert.equal(restoredBob.balanceAtomic, 0n);
assert.equal(restoredAlice.reserveAtomic, 0n);
assert.equal(await rpc('verifychain', [4, 0]), true);
console.log(JSON.stringify({ ok: true, zero_peers: true, original_height: originalHeight,
  disconnected_height: 4592, restored_height: await rpc('getblockcount'),
  alice_rollback_sats: String(disconnectedAlice.balanceAtomic),
  reserve_rollback_sats: String(disconnectedAlice.reserveAtomic),
  final_alice_sats: String(restoredAlice.balanceAtomic),
  final_bob_sats: String(restoredBob.balanceAtomic),
  final_reserve_sats: String(restoredAlice.reserveAtomic),
  prepared_published_on_cloned_branch: true, duplicate_rejected: true, verifychain: true }));
