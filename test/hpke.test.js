import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { hpkeTestInternals } from '../src/hpke.js';
import { deriveViewPublic, sealNote, openNoteRecord } from '../src/browser.js';

const fixture = JSON.parse(await readFile(new URL('./data/hpke-python-vector.json', import.meta.url), 'utf8'));
const unhex = value => Uint8Array.from(value.match(/../g), byte => parseInt(byte, 16));
const hex = value => Array.from(value, byte => byte.toString(16).padStart(2, '0')).join('');
const input = (overrides = {}) => ({ record: unhex(fixture.record), cm: unhex(fixture.cm),
  domain: unhex(fixture.domain), assetId: unhex(fixture.asset_id),
  viewSeed: unhex(fixture.view_seed), spendSecret: unhex(fixture.spend_secret), ...overrides });

test('RFC 9180 A.2.1 DHKEM and Base schedule', () => {
  const e = hpkeTestInternals.pair(unhex('909a9b35d3dc4713a5e72a4da274b55d3d3821a37e5d099e74a647db583a904b'));
  const r = hpkeTestInternals.pair(unhex('1ac01f181fdf9f352797655161c58b75c656a6cc2716dcb66372da835542e1df'));
  assert.equal(hex(e.secret), 'f4ec9b33b792c372c1d2c2063507b684ef925b8c75a42dbcbf57d63ccd381600');
  assert.equal(hex(e.publicKey), '1afa08d3dec047a643885163f1180476fa7ddb54c6a8029ea33f95796bf2ac4a');
  assert.equal(hex(r.secret), '8057991eef8f1f1af18f4a9491d16a1ce333f695d4db8e38da75975c4478e0fb');
  assert.equal(hex(r.publicKey), '4310ee97d88cc1f088a5576c77ab0cf5c3ac797f3d95139c6c84b5429c59662a');
  const sender = hpkeTestInternals.shared(e.secret, r.publicKey, e.publicKey, r.publicKey);
  const receiver = hpkeTestInternals.shared(r.secret, e.publicKey, e.publicKey, r.publicKey);
  assert.equal(hex(sender), hex(receiver));
  assert.equal(hex(sender), '0bbe78490412b4bbea4812666f7916932b828bba79942424abb65244930d69a7');
  const { key, nonce } = hpkeTestInternals.schedule(sender, new TextEncoder().encode('Ode on a Grecian Urn'));
  assert.equal(hex(key), 'ad2744de8e17f4ebba575b3f5f5a8fa1f69c2a07f6e7500bc60ca6e3e3ec1c91');
  assert.equal(hex(nonce), '5c4d98150661b848853b547f');
});

test('browser opens Python CP1 record and rejects mutations', () => {
  assert.equal(hex(deriveViewPublic(unhex(fixture.view_seed))), fixture.view_pub);
  const result = openNoteRecord(input());
  assert.equal(hex(result.note), fixture.note);
  assert.equal(hex(result.cm), fixture.cm);
  assert.equal(result.amountAtomic, 100000000n);
  assert.equal(hex(result.nf), '03f92104f03c9c12659836cf2174b878caa2b9e117db431613efc56a83186cb1');
  for (const index of [0, 1, 3, 35, 219, 220, 1023]) {
    const record = unhex(fixture.record);
    record[index] ^= 1;
    assert.throws(() => openNoteRecord(input({ record })), undefined, `mutation ${index}`);
  }
  assert.throws(() => openNoteRecord(input({ viewSeed: new Uint8Array(32) })));
  assert.throws(() => openNoteRecord(input({ cm: new Uint8Array(32) })));
  assert.throws(() => openNoteRecord(input({ domain: new Uint8Array(32) })));
});

test('browser creates a fresh note locally and its recipient opens it', () => {
  const descriptor = { domain: fixture.domain, asset_id: fixture.asset_id,
    owner: '065ceba893c9462dcb95dae5d241f23d48df28d72129aaabc2a25f49903faa2b',
    view_pub: fixture.view_pub };
  const sealed = sealNote({ descriptor, amountAtomic: 123n });
  assert.equal(sealed.record.length, 1024);
  assert.equal(sealed.note.length, 169);
  const opened = openNoteRecord({ record: sealed.record, cm: sealed.cm,
    domain: unhex(fixture.domain), assetId: unhex(fixture.asset_id),
    viewSeed: unhex(fixture.view_seed), spendSecret: unhex(fixture.spend_secret) });
  assert.equal(opened.amountAtomic, 123n);
  assert.equal(hex(opened.note), hex(sealed.note));
  assert.throws(() => sealNote({ descriptor: { ...descriptor, view_pub: '00'.repeat(32) }, amountAtomic: 1n }), /X25519/);
});
