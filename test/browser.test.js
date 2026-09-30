import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BN254_SCALAR_FIELD, decodeField, encodeField, poseidonBytes, poseidonPermutation,
  encodeNote, decodeNote, deriveOwner, deriveNullifierKey, noteCommitment, noteNullifier
} from '../src/browser.js';

const hex = (bytes) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
const unhex = (value) => Uint8Array.from(value.match(/../g), pair => parseInt(pair, 16));
const sample = (length) => Uint8Array.from({ length }, (_, index) => index & 255);

// Frozen independently from scripts/generate-poseidon-review-vectors.py.
test('CP1 Poseidon permutation and sponge boundaries', () => {
  assert.equal(poseidonPermutation([0n, 1n, 2n])[0].toString(16),
    '115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a');
  const vectors = [
    [0, '067761295e881eec953a764e4d72bbccedf07472b57b9a3f754dcb5012441956'],
    [1, '03e0d2ebfc1f715a436de3d6bf37c9632b33fe6a52c4127a6063ab2a6dc12926'],
    [30, '1fdba9cb5ed5f33da3b2223236cbfc355a47906a1588b6eab00933ae7a1445f5'],
    [31, '14f5046f58397839af50f7b95a50324a97a8ec182660cf85377b026b0ca6d310'],
    [32, '25b8af87ce603ad9560c89d435b1b4bdf1aa579a5136c479975db18a00d84cf9'],
    [62, '19f817a2c194fd3d02ac4b6929f40f12724279f6016b71519578a16185a1b757'],
    [63, '2752b5df09440108dda14a9180026737c45e314d89f71515d0aa53979596323b']
  ];
  for (const [length, expected] of vectors) assert.equal(hex(poseidonBytes(sample(length))), expected);
  assert.equal(decodeField(encodeField(BN254_SCALAR_FIELD - 1n)), BN254_SCALAR_FIELD - 1n);
  assert.throws(() => encodeField(BN254_SCALAR_FIELD), /noncanonical/);
  assert.throws(() => decodeField(unhex(BN254_SCALAR_FIELD.toString(16).padStart(64, '0'))), /noncanonical/);
});

// Frozen independently in NIP/bench/data/nip043_cp1_vectors.json.
test('CP1 note, owner, commitment and nullifier match independent vectors', () => {
  const domain = unhex('4f13ca23858e6eac0f315474669d8d0b19d4f2888c668bee38bb7be8e291b858');
  const assetId = unhex('e0975d65c06b978ab7a7e01f67648ebeba8c4437666b0f4b96a85abef515ec98');
  const spendSecret = unhex('35c540117b6b3775f6a44e80dea09c86c860cc9529538b70e50c6b4ac293231d');
  const viewPub = unhex('4310ee97d88cc1f088a5576c77ab0cf5c3ac797f3d95139c6c84b5429c59662a');
  const rho = Uint8Array.from({ length: 32 }, (_, index) => index + 64);
  const owner = deriveOwner(domain, spendSecret);
  assert.equal(hex(owner), '065ceba893c9462dcb95dae5d241f23d48df28d72129aaabc2a25f49903faa2b');
  assert.equal(hex(deriveNullifierKey(domain, spendSecret)),
    '071d943b5ed2a1351909142c5c251b02ffc0077e15a103f9ffd13f7639918b93');
  const note = encodeNote({ domain, assetId, owner, viewPub, amountAtomic: 100000000n, rho });
  assert.equal(note.length, 169);
  assert.equal(hex(note),
    '014f13ca23858e6eac0f315474669d8d0b19d4f2888c668bee38bb7be8e291b858' +
    'e0975d65c06b978ab7a7e01f67648ebeba8c4437666b0f4b96a85abef515ec98' +
    '065ceba893c9462dcb95dae5d241f23d48df28d72129aaabc2a25f49903faa2b' +
    '4310ee97d88cc1f088a5576c77ab0cf5c3ac797f3d95139c6c84b5429c59662a' +
    '00e1f50500000000' + '404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f');
  assert.equal(decodeNote(note).amountAtomic, 100000000n);
  assert.equal(hex(noteCommitment(note)), '0c37d0d38b0b54c36f4d82617d3b959475f652d1776418270e9af1ada4b9a4d4');
  assert.equal(hex(noteNullifier(note, spendSecret)), '2cded76d52e9674387ece44cf3b8f55c646e2faf6144b7d9b8c5d6cffd6be9ec');
  assert.throws(() => noteNullifier(note, new Uint8Array(32)), /does not own/);
  assert.throws(() => encodeNote({ domain, assetId, owner, viewPub, amountAtomic: 0n, rho }), /amount/);
  assert.throws(() => decodeNote(note.subarray(1)), /invalid CP1/);
  const invalidView = note.slice();
  invalidView.fill(0, 97, 129);
  assert.throws(() => noteCommitment(invalidView), /X25519/);
  const invalidOwner = note.slice();
  invalidOwner.fill(0, 65, 97);
  assert.throws(() => noteCommitment(invalidOwner), /owner/);
});
