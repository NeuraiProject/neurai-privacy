import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parsePoolStateOpening } from '../src/pool-state.js';
const cases = JSON.parse(readFileSync(new URL('./fixtures/pool-state-six.json', import.meta.url)));
const bytes = hex => Uint8Array.from(Buffer.from(hex, 'hex'));
const asDecimal = buffer => BigInt('0x' + Buffer.from(buffer).toString('hex')).toString();

test('six TEST circuit state openings agree with JavaScript CP1 and form a chain', () => {
  assert.deepEqual(cases.map(c => c.form), ['T1', 'W_full', 'D0', 'D1', 'T2', 'W_partial']);
  for (let i = 0; i < cases.length; i++) {
    const entry = cases[i];
    const old = parsePoolStateOpening(bytes(entry.oldState));
    const fresh = parsePoolStateOpening(bytes(entry.newState));
    assert.equal(asDecimal(old.digest), entry.S_old, `${entry.form} old`);
    assert.equal(asDecimal(fresh.digest), entry.S_new, `${entry.form} new`);
    if (i) assert.equal(entry.S_old, cases[i - 1].S_new, `${entry.form} links to prior`);
  }
  const altered = bytes(cases[0].newState);
  altered[108] = 2;
  assert.throws(() => parsePoolStateOpening(altered), /mode/);
  assert.throws(() => parsePoolStateOpening(altered.slice(1)), /109 bytes/);
});
