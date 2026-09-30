import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { BrowserTestIdentity } from '../src/browser.js';

const vector = JSON.parse(await readFile(new URL('./data/hpke-python-vector.json', import.meta.url), 'utf8'));
const vaultVector = JSON.parse(await readFile(new URL('./data/vault-python-vector.json', import.meta.url), 'utf8'));
const unhex = value => Uint8Array.from(value.match(/../g), byte => parseInt(byte, 16));

test('browser TEST identity creates, backs up, restores and reads only its own note', async () => {
  const wallet = await BrowserTestIdentity.create({ domain: vector.domain, assetId: vector.asset_id,
    password: 'TEST-browser-password' });
  const descriptor = wallet.recipient();
  assert.equal(descriptor.domain, vector.domain);
  assert.equal(descriptor.asset_id, vector.asset_id);
  const sealed = wallet.createNote(descriptor, 1000n);
  assert.equal(wallet.openRecord(sealed.record, sealed.cm).amountAtomic, 1000n);
  const backup = wallet.backupJson();
  assert.equal(backup.includes('spend_key'), false);
  await assert.rejects(BrowserTestIdentity.fromBackup({ backup, password: 'wrong',
    domain: vector.domain, assetId: vector.asset_id }));
  const restored = await BrowserTestIdentity.fromBackup({ backup,
    password: 'TEST-browser-password', domain: vector.domain, assetId: vector.asset_id });
  assert.deepEqual(restored.recipient(), descriptor);
  assert.equal(restored.openRecord(sealed.record, sealed.cm).amountAtomic, 1000n);
  const wrongPool = { ...descriptor, domain: '00'.repeat(32) };
  assert.throws(() => wallet.createNote(wrongPool, 1n), /another pool/);
  const stranger = await BrowserTestIdentity.fromBackup({ backup: JSON.stringify(vaultVector.envelope),
    password: vaultVector.password, domain: vector.domain, assetId: vector.asset_id });
  assert.throws(() => stranger.openRecord(sealed.record, sealed.cm));
  stranger.lock();
  wallet.lock();
  restored.lock();
  assert.throws(() => wallet.recipient(), /locked/);
  assert.throws(() => restored.backupJson(), /locked/);
});

test('browser imports Python TEST vault and recovers its Python CP1 note', async () => {
  const wallet = await BrowserTestIdentity.fromBackup({ backup: JSON.stringify(vector.wallet_envelope),
    password: vector.wallet_password, domain: vector.domain, assetId: vector.asset_id });
  assert.equal(wallet.recipient().view_pub, vector.view_pub);
  const recovered = wallet.openRecord(unhex(vector.record), unhex(vector.cm));
  assert.equal(recovered.amountAtomic, 100000000n);
  const note = wallet.createNote(wallet.recipient(), 42n);
  assert.equal(wallet.openRecord(note.record, note.cm).amountAtomic, 42n);
  wallet.lock();
});


test('file identity authenticates local scan checkpoints and rejects other keys', () => {
  const domain = new Uint8Array(32).fill(1);
  const asset = new Uint8Array(32).fill(2);
  const wallet = new BrowserTestIdentity(new Uint8Array(32).fill(3), new Uint8Array(32).fill(4), domain, asset, null);
  const other = new BrowserTestIdentity(new Uint8Array(32).fill(5), new Uint8Array(32).fill(4), domain, asset, null);
  const checkpoint = { version: 1, height: 17, owned: [{ amountAtomic: '42' }] };
  const encoded = wallet.sealCheckpoint(checkpoint);
  assert.deepEqual(wallet.openCheckpoint(encoded), checkpoint);
  assert.throws(() => other.openCheckpoint(encoded));
  assert.throws(() => wallet.openCheckpoint(encoded.slice(0, -5) + 'xxxxx'));
  wallet.lock(); other.lock();
});
