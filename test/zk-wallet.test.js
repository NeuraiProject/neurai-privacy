/* NeuraiZK/v2 wallet root: the seed S and the root R that C7 accounts derive
 * from, frozen by scripts/check-nzk-v2.py in test/fixtures/nzk-vectors.json. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { walletSeedFromMnemonic, deriveZkRoot, bech32mEncode, bech32mDecode, NZK_ARGON2ID, NZK_HRP } from '../src/zk-wallet.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/nzk-vectors.json', import.meta.url)));
const { vectors } = fixture;
const hex = bytes => Buffer.from(bytes).toString('hex');

test('NeuraiZK/v2 vectors: wallet seed and ZK root', async () => {
  const seen = new Map();
  for (const { name, input, output } of vectors) {
    const key = input.mnemonic + '\0' + input.passphrase + '\0' + input.zk_passphrase;
    if (seen.has(key)) { assert.equal(seen.get(key), output.zk_root, name + ' root'); continue; }
    const seed = await walletSeedFromMnemonic(input.mnemonic, input.passphrase);
    assert.equal(hex(seed), output.seed, name + ' seed');
    const root = await deriveZkRoot(seed, input.zk_passphrase);
    assert.equal(hex(root), output.zk_root, name + ' root');
    seen.set(key, output.zk_root);
  }
  assert.ok(seen.size >= 3);
});

test('Argon2id parameters and Poseidon constants match the frozen vectors', () => {
  assert.deepEqual({ ...NZK_ARGON2ID }, fixture.argon2id);
  const constants = readFileSync(new URL('./fixtures/nzk-poseidon.json', import.meta.url));
  assert.equal(createHash('sha256').update(constants).digest('hex'), fixture.poseidon_constants_sha256);
});

test('bech32m round trip, HRPs and checksum rejection', () => {
  assert.deepEqual({ ...NZK_HRP }, { mainnet: 'nzk', testnet: 'tnzk', regtest: 'rnzk' });
  const payload = Uint8Array.from({ length: 69 }, (_, i) => i);
  const text = bech32mEncode('tnzk', payload);
  const decoded = bech32mDecode(text);
  assert.equal(decoded.hrp, 'tnzk');
  assert.deepEqual(decoded.bytes, payload);
  assert.deepEqual(bech32mDecode(text.toUpperCase()).bytes, payload);
  const flipped = text.slice(0, -1) + (text.at(-1) === 'q' ? 'p' : 'q');
  assert.throws(() => bech32mDecode(flipped), /checksum/);
  assert.throws(() => bech32mDecode(text.slice(0, 8) + text.slice(8).toUpperCase()), /mixed-case/);
  assert.throws(() => bech32mEncode('TNZK', payload), /HRP/);
});

test('mnemonic validation, Unicode normalization and passphrase spaces are deterministic', async () => {
  const mnemonic = vectors[0].input.mnemonic;
  await assert.rejects(walletSeedFromMnemonic('abandon '.repeat(12)), /mnemonic/);
  await assert.rejects(walletSeedFromMnemonic('unknown words'), /mnemonic/);
  const a = await walletSeedFromMnemonic(mnemonic, 'café 🛡 ');
  const b = await walletSeedFromMnemonic('  ' + mnemonic.replaceAll(' ', '  ') + '  ', 'café 🛡 ');
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, await walletSeedFromMnemonic(mnemonic, 'café 🛡'));
  const r = await deriveZkRoot(a, 'café');
  assert.deepEqual(r, await deriveZkRoot(a, 'café'));
  assert.notDeepEqual(r, await deriveZkRoot(a, 'café '));
  await assert.rejects(deriveZkRoot(new Uint8Array(32)), /64 bytes/);
});
