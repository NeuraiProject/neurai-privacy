import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeField } from '../src/poseidon.js';
import { c4Context, encodeC4Publication, decodeC4Publication, c4PublicationHash } from '../src/c4-publication.js';
const record = () => { const r = new Uint8Array(1024); r.set([1, 217, 0]); for (let i = 3; i < 220; i++) r[i] = i % 256; return r; };
const context = { domain: Uint8Array.from({ length: 32 }, (_, i) => i), assetId: Uint8Array.from({ length: 32 }, (_, i) => i + 32), unit: 100n, registryRoot: encodeField(42n) };
test('C4 context equals the frozen Python/Circom/C++ vector', () => {
  assert.equal(Array.from(c4Context(context), x => x.toString(16).padStart(2, '0')).join(''), '26f93308376e9e5e2515cd6f9de7a233573c42f926bbec898b3067e7961049af');
  for (const unit of [0n, 3n, 10n ** 9n, 100]) assert.throws(() => c4Context({ ...context, unit }));
});
test('all six C4 publication forms roundtrip and bind the full blob', () => {
  for (const form of ['D0', 'D1', 'T1', 'T2', 'T3', 'T4']) {
    const n = form[0] === 'D' ? 1 : Number(form[1]);
    const data = { cms: Array.from({ length: n }, (_, i) => encodeField(BigInt(i + 1))), records: Array.from({ length: n }, record), nf: form[0] === 'D' ? null : encodeField(99n) };
    const blob = encodeC4Publication(form, data);
    assert.deepEqual(decodeC4Publication(form, blob), data);
    const hash = c4PublicationHash(form, blob), changed = blob.slice();
    changed[34 + 32 * n + 35] ^= 1;
    assert.notDeepEqual(c4PublicationHash(form, changed), hash);
    for (const at of [0, 1, 4095]) { const bad = blob.slice(); bad[at] ^= 1; assert.throws(() => decodeC4Publication(form, bad)); }
  }
});
test('C4 rejects old framing, duplicate fields and noncanonical padding', () => {
  const data = { cms: [encodeField(1n), encodeField(2n)], records: [record(), record()], nf: encodeField(99n) };
  assert.throws(() => encodeC4Publication('T2', { ...data, cms: [data.cms[0], data.cms[0]] }));
  assert.throws(() => encodeC4Publication('T2', { ...data, nf: encodeField(0n) }));
  const bad = record(); bad[900] = 1;
  assert.throws(() => encodeC4Publication('T2', { ...data, records: [bad, record()] }));
  const blob = encodeC4Publication('T2', data); blob[0] = 1;
  assert.throws(() => decodeC4Publication('T2', blob));
});
