import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { serializePoolTemplate } from '../src/pool-transaction.js';
const cases = JSON.parse(readFileSync(new URL('./fixtures/pool-templates-six.json', import.meta.url)));
const hex = buffer => Buffer.from(buffer).toString('hex');
const decimal = buffer => BigInt('0x' + hex(buffer)).toString();

test('six D/T/W transaction templates match Python bytes and anchors', () => {
  for (const entry of cases) {
    const actual = serializePoolTemplate(entry);
    assert.equal(hex(actual.prevouts), entry.expectedPrevouts, entry.form + ' outpoints');
    assert.equal(hex(actual.outputs), entry.expectedOutputs, entry.form + ' outputs');
    assert.equal(decimal(actual.anchor), entry.anchor, entry.form + ' anchor');
  }
});

test('pool template rejects value rounding, outpoint and script encoding errors', () => {
  const original = cases[0];
  assert.throws(() => serializePoolTemplate({ ...original, outputs: [{ ...original.outputs[0],
    valueSats: 0.1 }] }), /atomic XNA/);
  assert.throws(() => serializePoolTemplate({ ...original, inputs: [{ ...original.inputs[0],
    txid: 'ff' }] }), /32 bytes/);
  assert.throws(() => serializePoolTemplate({ ...original, outputs: [{ ...original.outputs[0],
    scriptHex: '0' }] }), /even-length/);
});
