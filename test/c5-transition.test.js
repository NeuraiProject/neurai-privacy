import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { c5TransitionBinding, verifyC5Transition, splitC5Transition, joinC5Transition } from '../src/c5-transition.js';
import { validateC5Manifest } from '../src/c5.js';
import { C4_TESTNET_MANIFEST } from '../src/c4-testnet.js';

// Frozen production-node vectors with real TEST Groth16 proofs. This test
// exercises public paths only; proof verification is done in the node battery.
const { forms } = JSON.parse(readFileSync(new URL('./fixtures/c5-public-tree.json', import.meta.url)));
const bytes = value => Uint8Array.from(Buffer.from(value, 'hex'));
for (const fixture of forms) {
  test('C5 public transition and negative mutations: ' + fixture.form, () => {
    const raw = bytes(fixture.transcript), signals = bytes(fixture.inputs), f = fixture.form;
    const cm = f[0] === 'D' ? [raw.slice(252, 284)] : f[0] === 'T'
      ? Array.from({length:Number(f[1])}, (_, i) => signals.slice(192+i*32, 224+i*32)) : [];
    const nf = f[0] === 'D' ? new Uint8Array(32) : signals.slice(96, 128);
    const binding = c5TransitionBinding(f, signals.slice(32, 64), signals.slice(64, 96), nf, cm);
    assert.equal(verifyC5Transition(raw, binding), true);
    const chunks = splitC5Transition(raw);
    assert.equal(chunks.length, 5);
    assert.deepEqual(joinC5Transition(chunks), raw);
    for (const at of [0, 1, 2, 110, 219, raw.length-1]) {
      const bad = raw.slice(); bad[at] ^= 1;
      assert.throws(() => verifyC5Transition(bad, binding));
    }
    assert.throws(() => verifyC5Transition(raw.slice(0, -1), binding));
    assert.throws(() => verifyC5Transition(Uint8Array.from([...raw, 0]), binding));
    const badBinding = binding.slice(); badBinding[1] ^= 1;
    assert.throws(() => verifyC5Transition(raw, badBinding));
    const badChunks = chunks.map(x => x.slice());
    if (badChunks[4].length < 3072) badChunks[4] = Uint8Array.from([...badChunks[4], 0]);
    assert.throws(() => verifyC5Transition(joinC5Transition(badChunks), binding));
  });
}
test('C5 has no implicit C4 or unpinned manifest fallback', () => {
  assert.throws(() => validateC5Manifest(C4_TESTNET_MANIFEST, {expectedCommitment:C4_TESTNET_MANIFEST.commitment}), /profile-2/);
  const mislabeled = {...C4_TESTNET_MANIFEST, schema:'neurai-c5-xna-test-v1', zkProfile:2};
  assert.throws(() => validateC5Manifest(mislabeled, {expectedCommitment:mislabeled.commitment}), /profile 2/);
  assert.throws(() => validateC5Manifest(mislabeled, {}), /pinned/);
  assert.throws(() => joinC5Transition([]), /count/);
  assert.throws(() => splitC5Transition(new Uint8Array(15361)), /size/);
  assert.throws(() => joinC5Transition([new Uint8Array(3), new Uint8Array(1), ...Array.from({length:3},()=>new Uint8Array())]), /noncanonical/);
});
