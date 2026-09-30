import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyPoolState, poolIndexedInsert, poolIndexedRoot, poolStateDigest,
  poolStateOpening, poolTreeRoot } from '../src/pool-state.js';

const hex = bytes => Buffer.from(bytes).toString('hex');
const field = value => Uint8Array.from(Buffer.from(value, 'hex'));

// Frozen independently by NIP/bench/nip043_crypto_profile.py, including two
// nonzero leaves and an indexed tree whose insertion order is not sorted.
test('CP1 public state and tree vectors', () => {
  const state = emptyPoolState();
  assert.equal(hex(poolTreeRoot(state.slots)),
    '2f68a1c58e257e42a17a6c61dff5551ed560b9922ab119d5ac8e184c9734ead9');
  assert.equal(hex(poolIndexedRoot('nf', state.nfs)),
    '14203f41551cb6fcd89b5d55a6f185dd280294c720c6e036ce61f9c0486306ab');
  assert.equal(hex(poolIndexedRoot('cm', state.seen)),
    '0be6babfe208aa2911f64e3dfa993d5d0a3e7047522217249634d62d3998155b');
  assert.equal(hex(poolStateDigest(state)),
    '0db2113b3f2a947e4abff06ed52f52979e8b454efb5f030c9d2ca388edf64bf9');
  assert.equal(poolStateOpening(state).length, 109);
  const first = BigInt('0x0c37d0d38b0b54c36f4d82617d3b959475f652d1776418270e9af1ada4b9a4d4');
  const second = BigInt('0x18ae717ad62da856c8e3ed752eab5633c7c988c57d8f2298e1cba067b8857761');
  state.slots.set(0, field(first.toString(16).padStart(64, '0')));
  state.slots.set(1, field(second.toString(16).padStart(64, '0')));
  state.seen = poolIndexedInsert('cm', state.seen, first);
  state.seen = poolIndexedInsert('cm', state.seen, second);
  assert.equal(hex(poolTreeRoot(state.slots)),
    '18411515318a26ebb43bda66b90d3ef85052107f7a872ed26bf60a85be81382f');
  assert.equal(hex(poolIndexedRoot('cm', state.seen)),
    '08c3b82c2bf05a94273ed31521a232a17caf31484c37c0589809d38b59a5545f');
});

test('indexed tree rejects duplicate, noncanonical and malformed state', () => {
  const state = emptyPoolState();
  const inserted = poolIndexedInsert('nf', state.nfs, 7n);
  assert.throws(() => poolIndexedInsert('nf', inserted, 7n), /duplicate/);
  assert.throws(() => poolIndexedInsert('nf', state.nfs, 0n), /positive/);
  assert.throws(() => poolIndexedInsert('nf', state.nfs,
    21888242871839275222246405745257275088548364400416034343698204186575808495617n), /noncanonical/);
  assert.throws(() => poolStateOpening({ ...state, mode: 2 }), /mode/);
  assert.throws(() => poolTreeRoot(new Map([[0x100000000, new Uint8Array(32)]])), /uint32/);
});
