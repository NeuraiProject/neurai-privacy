/* C7 notes against the vectors of the Neurai-DePIN reference (contrib/privacypool/privacy-c7,
 * src/test/data/privacy_c7_vectors.json): every intermediate value, both scanners, the
 * negative cases with their reason, nzk v3 addresses and C7 publications. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as sdk from '../src/index.js';
import { decodeC4Publication, encodeC4Publication } from '../src/c4-publication.js';

const v = JSON.parse(readFileSync(new URL('./fixtures/c7-vectors.json', import.meta.url)));
const hex = b => Buffer.from(b).toString('hex');
const unhex = s => new Uint8Array(Buffer.from(s, 'hex'));
const inst = v.instance;
const scope = { network: 'testnet', domain: inst.domain, assetId: inst.asset_id };
const accounts = Object.fromEntries(v.accounts.map(a => [a.name,
  new sdk.C7Account(unhex(a.R), { family: a.family, account: a.account, domain: inst.domain, assetId: inst.asset_id })]));
const outcome = (fn, accept) => { try { fn(); return accept; } catch (e) { if (e instanceof sdk.C7Error) return e.reason; throw e; } };

test('C7 instance derivation', () => {
  const domain = sdk.c7PoolDomain({ genesis: inst.genesis, emission: `${inst.emission_txid}:${inst.emission_vout}`, identity: inst.identity });
  assert.equal(hex(domain), inst.domain);
  assert.equal(hex(sdk.c7XnaAssetId()), inst.asset_id);
  assert.equal(hex(sdk.c7Context(domain, sdk.c7XnaAssetId())), inst.ctx);
  assert.equal(hex(sdk.c7InstanceTag(domain, sdk.c7XnaAssetId())), inst.instance_tag);
  for (const identity of ['', 'A'.repeat(65), 'C7 TEST#POOL']) {
    assert.throws(() => sdk.c7PoolDomain({ genesis: inst.genesis, emission: `${inst.emission_txid}:3`, identity }));
  }
});

test('C7 addresses: keys, diversifiers, G_d, pk_d and nzk v3 text', () => {
  for (const a of v.addresses) {
    const descriptor = accounts[a.account].descriptor(a.branch, a.index);
    assert.equal(descriptor.owner, a.owner);
    assert.equal(descriptor.d, a.d);
    assert.equal(descriptor.view_pub, a.pk_d);
    assert.equal(sdk.encodeC7Address(descriptor, 'testnet'), a.text);
    assert.deepEqual(sdk.decodeC7Address(a.text, scope), descriptor);
    assert.equal(sdk.isC7Descriptor(descriptor), true);
  }
  for (const bad of v.addresses_invalid) {
    assert.equal(outcome(() => sdk.decodeC7Address(bad.text, scope), 'accepted'), bad.reason, bad.name);
  }
  assert.throws(() => accounts.A.descriptor(2, 0));
  assert.throws(() => accounts.A.descriptor(0, 2 ** 31));
});

test('C7 notes: sealing, both scanners and nullifiers', () => {
  for (const n of v.notes) {
    const account = accounts[n.to.account], descriptor = account.descriptor(n.to.branch, n.to.index);
    const sealed = sdk.sealC7Note({ descriptor, amountAtomic: n.amount, rho: unhex(n.rho) });
    assert.equal(hex(sealed.note), n.note);
    assert.equal(hex(sealed.cm), n.cm);
    assert.equal(hex(sealed.record), n.record);
    for (const checkTag of [true, false]) {
      const received = account.scan(unhex(n.record), unhex(n.cm), { full: false, checkTag });
      assert.deepEqual([received.status, received.ownership, received.chain, received.index, String(received.amountAtomic)],
        [n.receive_scan.status, n.receive_scan.ownership, n.receive_scan.branch, n.receive_scan.index, n.receive_scan.amount]);
    }
    const owned = account.scan(unhex(n.record), unhex(n.cm));
    assert.equal(owned.status, 'owned');
    assert.equal(hex(owned.nf), n.full_scan.nf);
    for (const [name, other] of Object.entries(accounts)) {
      if (name === n.to.account) continue;
      assert.ok(['vtag-mismatch', 'aead-failed'].includes(outcome(() => other.scan(unhex(n.record), unhex(n.cm)), 'owned')));
    }
  }
});

test('C7 negatives fail for the expected reason in both scanners', () => {
  assert.ok(v.negatives.length >= 22);
  for (const n of v.negatives) {
    const account = accounts[n.account], record = unhex(n.record), cm = unhex(n.cm);
    assert.equal(outcome(() => account.scan(record, cm, { full: false }), 'received'), n.receive, n.name + ' (receive-only)');
    assert.equal(outcome(() => account.scan(record, cm), 'owned'), n.full, n.name + ' (full)');
  }
});

test('C7 publications carry 230-byte records', () => {
  const records = v.notes.map(n => unhex(n.record)), cms = v.notes.map(n => unhex(n.cm));
  const nf = new Uint8Array(32); nf[31] = 7;
  for (const [form, count] of [['D0', 1], ['T2', 2], ['T3', 3]]) {
    const publication = { cms: cms.slice(0, count), records: records.slice(0, count), ...(form === 'D0' ? {} : { nf }) };
    const blob = encodeC4Publication(form, publication, { format: 'c7' });
    for (let i = 0; i < count; i++) assert.equal(blob[34 + 32 * count + 230 * i], 2);
    assert.ok(blob.slice(34 + 262 * count).every(b => b === 0));
    const decoded = decodeC4Publication(form, blob, { format: 'c7' });
    assert.deepEqual(decoded.records.map(hex), publication.records.map(hex));
    assert.throws(() => decodeC4Publication(form, blob));
  }
});

test('C7 wallet identity recovers its notes and prepares operations', async () => {
  const a = v.accounts.find(x => x.name === 'A');
  const identity = sdk.C7WalletIdentity.fromRoot({ root: unhex(a.R), family: a.family, account: a.account,
    domain: inst.domain, assetId: inst.asset_id, network: 'testnet' });
  assert.equal(identity.generation, 'c7');
  const entries = v.notes.map(n => ({ record: unhex(n.record), cm: unhex(n.cm) }));
  const found = identity.scanRecords(entries);
  const mine = v.notes.filter(n => n.to.account === 'A');
  assert.deepEqual(found.map(f => hex(f.owned.nf)).sort(), mine.map(n => n.full_scan.nf).sort());
  // Highest used receiving index is 10^6: the next address is the one after it.
  assert.equal(identity.currentIndex(), 1_000_001);
  assert.equal(identity.addressAt(1, 0), v.addresses.find(x => x.account === 'A' && x.branch === 1 && x.index === 0).text);

  const ctx = sdk.c7Context(inst.domain, inst.asset_id);
  const manifest = { profile: sdk.C7_PROFILE, network: '11'.repeat(32), commitment: '22'.repeat(32), context: hex(ctx),
    fees: Object.fromEntries(['D', 'T1', 'T2', 'T3', 'W'].map(op => [op, ['10000000']])) };
  const wallet = sdk.createC6OperationWallet({ expectedGenesis: manifest.network, expectedCommitment: manifest.commitment });
  const D = unhex(inst.domain), AID = unhex(inst.asset_id);
  const deposit = identity.prepareC6Deposit(wallet, { manifest, fee: 10000000n, amountAtomic: 20000000000n,
    funding: new Uint8Array(36).fill(5), fundingValue: 20010000000n });
  const record = decodeC4Publication('D0', deposit.blob, { format: 'c7' }).records[0];
  assert.equal(record.length, 230);
  const self = accounts.A.scan(record, deposit.created[0].cm);
  assert.deepEqual([self.chain, self.index, self.amountAtomic], [1, 0, 20000000000n]);
  assert.throws(() => identity.prepareC6Deposit(wallet, { manifest, fee: 10000000n, amountAtomic: 20000000000n,
    funding: new Uint8Array(36).fill(5), fundingValue: 20010000000n,
    recipient: { domain: inst.domain, asset_id: inst.asset_id, owner: a.R.slice(0, 64), view_pub: '09' + '00'.repeat(31) } }), /version 3/);

  // Spend note n3 (A, change address 1/0, 21e17 atoms) from a one-leaf tree; the change goes back to that address.
  const n3 = v.notes.find(n => n.name === 'n3'), total = BigInt(n3.amount);
  const pair = (x, y) => sdk.encodeField(sdk.poseidonPermutation([0n, sdk.decodeField(x), sdk.decodeField(y)])[0]);
  const path = []; let root = unhex(n3.cm), zero = sdk.encodeField(0n);
  for (let i = 0; i < 32; i++) { path.push(zero); root = pair(root, zero); zero = pair(zero, zero); }
  const consumed = { note: unhex(n3.note), index: 0, path, root, address: { chain: 1, index: 0 } };
  const bob = sdk.decodeC7Address(v.addresses.find(x => x.account === 'B').text, scope);
  const transfer = identity.prepareC6Transfer(wallet, { manifest, fee: 10000000n, consumed, operation: 'T2',
    outputs: [{ recipient: bob, amountAtomic: 30000000000n }, { isChange: true, amountAtomic: total - 30010000000n }] });
  const records = decodeC4Publication('T2', transfer.blob, { format: 'c7' }).records;
  assert.equal(accounts.B.scan(records[0], transfer.created[0].cm).amountAtomic, 30000000000n);
  const change = accounts.A.scan(records[1], transfer.created[1].cm);
  assert.deepEqual([change.chain, change.index, change.amountAtomic], [1, 0, total - 30010000000n]);
  const withdrawal = identity.prepareC6Withdrawal(wallet, { manifest, fee: 10000000n, consumed, amountAtomic: 20000000000n,
    payoutScript: unhex('76a914' + '33'.repeat(20) + '88ac') });
  const left = decodeC4Publication('T1', withdrawal.blob, { format: 'c7' }).records[0];
  assert.equal(accounts.A.scan(left, withdrawal.created[0].cm).amountAtomic, total - 20010000000n);
  // Without the wallet's change address a C7 transfer cannot place its change.
  const keys = accounts.A.spendKeys(1, 0);
  assert.throws(() => wallet.prepareTransfer({ manifest, fee: 10000000n, domain: D, assetId: AID, root, operation: 'T2',
    spent: { note: consumed.note, index: 0, path, spendSecret: keys.spendSecret },
    outputs: [{ recipient: bob, amountAtomic: 30000000000n }, { isChange: true, amountAtomic: total - 30010000000n }] }), /C7 change address/);
  identity.lock();
});
