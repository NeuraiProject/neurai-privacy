import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { poolTxHash, poolTxAnchor } from '../src/pool-txhash.js';
const fixtures = JSON.parse(readFileSync(new URL('./fixtures/pool-txhash-six.json', import.meta.url)));
const bytes = hex => Uint8Array.from(Buffer.from(hex, 'hex'));
const decimal = value => BigInt('0x' + Buffer.from(value).toString('hex')).toString();

test('six TEST D/T/W anchors match independently serialized Python transaction fields', () => {
  for (const fixture of fixtures) {
    const fields = Object.fromEntries(['version', 'locktime', 'prevouts', 'sequences', 'outputs']
      .map(key => [key, bytes(fixture[key])]));
    assert.equal(decimal(poolTxAnchor(fields)), fixture.anchor, fixture.form);
    const changed = { ...fields, outputs: fields.outputs.slice() };
    changed.outputs[changed.outputs.length - 1] ^= 1;
    assert.notEqual(decimal(poolTxAnchor(changed)), fixture.anchor, fixture.form + ' output mutation');
    assert.equal(poolTxHash(fields).length, 32);
  }
});

test('TXHASH refuses malformed prevouts and sequences', () => {
  const f = fixtures[0];
  const fields = Object.fromEntries(['version', 'locktime', 'prevouts', 'sequences', 'outputs']
    .map(key => [key, bytes(f[key])]));
  assert.throws(() => poolTxAnchor({ ...fields, prevouts: fields.prevouts.slice(1) }), /preimage/);
  assert.throws(() => poolTxAnchor({ ...fields, sequences: fields.sequences.slice(1) }), /preimage/);
});
