import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { openVault, sealVault } from '../src/browser.js';

const fixture = JSON.parse(await readFile(new URL('./data/vault-python-vector.json', import.meta.url), 'utf8'));

test('JS opens a Python cryptography TEST vault and rejects modified ciphertext', async () => {
  assert.deepEqual(await openVault(JSON.stringify(fixture.envelope), fixture.password), fixture.payload);
  await assert.rejects(openVault(JSON.stringify(fixture.envelope), 'wrong password'));
  const tampered = { ...fixture.envelope, ciphertext: fixture.envelope.ciphertext.slice(0, -2) + '00' };
  await assert.rejects(openVault(JSON.stringify(tampered), fixture.password));
  await assert.rejects(openVault(JSON.stringify({ ...fixture.envelope, memory_kib: 1 }), fixture.password), /unsupported/);
});

test('JS seals and reopens TEST JSON without exposing plaintext', async () => {
  const encoded = await sealVault(fixture.payload, fixture.password);
  assert.deepEqual(await openVault(encoded, fixture.password), fixture.payload);
  const envelope = JSON.parse(encoded);
  assert.equal(envelope.kdf, 'argon2id');
  assert.equal(envelope.memory_kib, 65536);
  assert.equal(envelope.passes, 3);
  assert.equal(envelope.lanes, 1);
  assert.equal(envelope.salt.length, 32);
  assert.equal(envelope.nonce.length, 24);
  assert.equal(encoded.includes(fixture.payload.spend_key), false);
});
