import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { poolIndexedLeaf, poolTreeNode } from '../src/pool-state.js';
import { C7PublicWorld } from '../src/c7-transaction.js';

const hex = bytes => Buffer.from(bytes).toString('hex');
const field = value => Uint8Array.from(Buffer.from(value.toString(16).padStart(64, '0'), 'hex'));
const deployment = JSON.parse(readFileSync(new URL('./fixtures/c7-deployment.json', import.meta.url))).deployment;

// CP1 roots frozen independently by NIP/bench/nip043_crypto_profile.py, including
// two nonzero leaves and an indexed tree whose insertion order is not sorted.
test('CP1 public trees of the C7 world match the independent vectors', () => {
  const world = new C7PublicWorld();
  assert.equal(hex(world.notes.root), '2f68a1c58e257e42a17a6c61dff5551ed560b9922ab119d5ac8e184c9734ead9');
  assert.equal(hex(world.nfs.tree.root), '14203f41551cb6fcd89b5d55a6f185dd280294c720c6e036ce61f9c0486306ab');
  assert.equal(hex(world.seen.tree.root), '0be6babfe208aa2911f64e3dfa993d5d0a3e7047522217249634d62d3998155b');
  // The empty world is the birth state of a C7 deployment.
  assert.equal(hex(world.opening()), deployment.anchor.opening);
  const first = 0x0c37d0d38b0b54c36f4d82617d3b959475f652d1776418270e9af1ada4b9a4d4n;
  const second = 0x18ae717ad62da856c8e3ed752eab5633c7c988c57d8f2298e1cba067b8857761n;
  world.transition({ form: 'D0', cms: [field(first)], nfs: [], rootIndex: null });
  world.transition({ form: 'D1', cms: [field(second)], nfs: [], rootIndex: null });
  assert.equal(hex(world.notes.root), '18411515318a26ebb43bda66b90d3ef85052107f7a872ed26bf60a85be81382f');
  assert.equal(hex(world.seen.tree.root), '08c3b82c2bf05a94273ed31521a232a17caf31484c37c0589809d38b59a5545f');
});

test('tree primitives reject malformed inputs and the world rejects bad transitions', () => {
  assert.throws(() => poolTreeNode(new Uint8Array(31), new Uint8Array(32)), /32 bytes/);
  assert.throws(() => poolIndexedLeaf('xx', 0n, 0n, 0), /cm or nf/);
  assert.throws(() => poolIndexedLeaf('nf', 0n, 0n, 0x100000000), /uint32/);
  const world = new C7PublicWorld();
  assert.throws(() => world.transition({ form: 'D1', cms: [field(7n)], nfs: [], rootIndex: null }), /mode/);
  world.transition({ form: 'D0', cms: [field(7n)], nfs: [], rootIndex: null });
  assert.throws(() => world.transition({ form: 'D1', cms: [field(7n)], nfs: [], rootIndex: null }), /indexed duplicate/);
  assert.throws(() => world.transition({ form: 'T1', cms: [field(8n)], nfs: [field(9n)], rootIndex: 1 }), /historical root/);
  assert.throws(() => world.transition({ form: 'T2', cms: [field(8n)], nfs: [field(9n)], rootIndex: 0 }), /transition shape/);
});
