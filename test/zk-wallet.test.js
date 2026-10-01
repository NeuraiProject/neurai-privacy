import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sealNote } from '../src/hpke.js';
import {
  walletSeedFromMnemonic, deriveZkRoot, zkFingerprint, deriveZkAddressKeys, nzkInstanceTag,
  encodeNzkAddress, decodeNzkAddress, parseRecipient, bech32mEncode, bech32mDecode, ZkWalletIdentity,
} from '../src/zk-wallet.js';

const { vectors } = JSON.parse(readFileSync(new URL('./fixtures/nzk-vectors.json', import.meta.url)));
const hex = bytes => Buffer.from(bytes).toString('hex');
const bytes = value => Uint8Array.from(Buffer.from(value, 'hex'));
const scope = { network: 'testnet', domain: vectors[0].input.domain, assetId: vectors[0].input.asset_id };
const roots = new Map();
async function rootFor(input) {
  const key = input.zk_passphrase;
  if (!roots.has(key)) {
    const seed = await walletSeedFromMnemonic(input.mnemonic, input.passphrase);
    assert.equal(hex(seed), vectors[0].output.seed);
    roots.set(key, await deriveZkRoot(seed, key));
  }
  return roots.get(key);
}

test('NeuraiZK/v2 vectors: seed, root, keys, public data, fingerprint and address', async () => {
  for (const { name, input, output } of vectors) {
    const root = await rootFor(input);
    assert.equal(hex(root), output.zk_root, name + ' root');
    assert.equal(zkFingerprint(root, { family: input.family, account: input.account, domain: input.domain, assetId: input.asset_id }), output.fingerprint, name + ' fingerprint');
    const keys = deriveZkAddressKeys(root, { family: input.family, account: input.account, chain: input.chain, index: input.index,
      domain: input.domain, assetId: input.asset_id });
    assert.equal(hex(keys.spendSecret), output.spend_secret, name + ' spend');
    assert.equal(hex(keys.viewSeed), output.view_seed, name + ' view');
    const wallet = ZkWalletIdentity.fromRoot({ root, family: input.family, account: input.account, domain: input.domain,
      assetId: input.asset_id, network: 'testnet' });
    const descriptor = wallet.descriptorAt(input.chain, input.index);
    assert.equal(descriptor.owner, output.owner, name + ' owner');
    assert.equal(descriptor.view_pub, output.view_pub, name + ' view_pub');
    assert.equal(hex(nzkInstanceTag(input.domain, input.asset_id)), output.instance_tag);
    assert.equal(wallet.addressAt(input.chain, input.index), output.address, name + ' address');
    assert.equal(encodeNzkAddress(descriptor, 'testnet'), output.address);
    assert.deepEqual(decodeNzkAddress(output.address, scope), descriptor);
    assert.deepEqual(decodeNzkAddress(output.address.toUpperCase(), scope), descriptor);
    assert.equal(wallet.fingerprint, output.fingerprint);
    assert.equal(wallet.storageId, output.storage_id);
    assert.equal(wallet.family, input.family);
    wallet.lock();
  }
});

// Reference bech32 checksum with a chosen constant and raw 5-bit data, for negative cases only.
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
function rawEncode(hrp, words, constant) {
  const polymod = values => {
    const gen = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    let chk = 1;
    for (const v of values) { const top = chk >>> 25; chk = ((chk & 0x1ffffff) << 5) ^ v; for (let i = 0; i < 5; i++) if ((top >>> i) & 1) chk ^= gen[i]; }
    return chk >>> 0;
  };
  const expand = [...[...hrp].map(c => c.charCodeAt(0) >> 5), 0, ...[...hrp].map(c => c.charCodeAt(0) & 31)];
  const mod = polymod([...expand, ...words, 0, 0, 0, 0, 0, 0]) ^ constant;
  return hrp + '1' + [...words, ...[0, 1, 2, 3, 4, 5].map(i => (mod >>> (5 * (5 - i))) & 31)].map(v => CHARSET[v]).join('');
}
function words(data) {
  let acc = 0, bits = 0; const out = [];
  for (const v of data) { acc = (acc << 8) | v; bits += 8; while (bits >= 5) { bits -= 5; out.push((acc >> bits) & 31); } }
  if (bits) out.push((acc << (5 - bits)) & 31);
  return out;
}

test('nzk decoding rejects every malformed or foreign address', () => {
  assert.equal(bech32mEncode('a', new Uint8Array()), 'a1lqfn3a');
  assert.deepEqual(bech32mDecode('A1LQFN3A').bytes, new Uint8Array());
  assert.throws(() => bech32mDecode('a12uel5l'), /bech32m checksum/, 'bech32 constant is not bech32m');
  const good = vectors[0].output.address;
  const payload = bytes(vectors[0].output.payload);
  const mutate = f => { const p = payload.slice(); f(p); return p; };
  const le = n => { const b = new Uint8Array(32); for (let i = 0; i < 32; i++) { b[i] = Number(n & 255n); n >>= 8n; } return b; };
  const P = 2n ** 255n - 19n;
  const cases = [
    [good.slice(0, 10) + good[10].toUpperCase() + good.slice(11), /mixed-case/],
    [good.slice(0, -1) + (good.at(-1) === 'q' ? 'p' : 'q'), /checksum/],
    [bech32mEncode('nzk', payload), /another network/],
    [bech32mEncode('tnzk', mutate(p => { p[0] = 2; })), /version/],
    [bech32mEncode('tnzk', payload.subarray(0, 68)), /length/],
    [bech32mEncode('tnzk', Uint8Array.from([...payload, 0])), /length/],
    [bech32mEncode('tnzk', mutate(p => { p[68] ^= 1; })), /another pool instance/],
    [bech32mEncode('tnzk', mutate(p => { p.fill(0, 1, 33); })), /owner/],
    [bech32mEncode('tnzk', mutate(p => { p.set(bytes('30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001'), 1); })), /owner/],
    ...[0n, 1n, P - 1n, 325606250916557431795983626356110631294008115727848805560023387167927233504n,
      39382357235489614581723060781553021112529911719440698176882885853963445705823n]
      .map(u => [bech32mEncode('tnzk', mutate(p => { p.set(le(u), 33); })), /small order/]),
    [bech32mEncode('tnzk', mutate(p => { p.set(le(P), 33); })), /canonical X25519/],
  ];
  const padded = words(payload); padded[padded.length - 1] |= 1;
  cases.push([rawEncode('tnzk', padded, 0x2bc830a3), /padding/]);
  for (const [address, expected] of cases) assert.throws(() => decodeNzkAddress(address, scope), expected, address);
  assert.throws(() => decodeNzkAddress(good, { ...scope, domain: '11'.repeat(32) }), /another pool instance/);
});

test('recipients may be nzk addresses or JSON descriptors, validated the same way', async () => {
  const descriptor = decodeNzkAddress(vectors[0].output.address, scope);
  assert.deepEqual(parseRecipient(vectors[0].output.address, scope), descriptor);
  assert.deepEqual(parseRecipient(JSON.stringify(descriptor), scope), descriptor);
  assert.throws(() => parseRecipient(JSON.stringify({ ...descriptor, domain: '11'.repeat(32) }), scope), /another pool instance/);
  assert.throws(() => parseRecipient(JSON.stringify({ ...descriptor, view_pub: '01' + '00'.repeat(31) }), scope), /small order/);
  assert.throws(() => parseRecipient('tnzk1notanaddress', scope), /checksum|character|malformed/);
});

test('receiving addresses rotate and recovery honours the gap limit in any record order', async () => {
  const root = await rootFor(vectors[0].input);
  const options = { root, family: 'legacy', account: 0, domain: scope.domain, assetId: scope.assetId, network: 'testnet', gap: 3 };
  const sender = ZkWalletIdentity.fromRoot({ ...options, account: 9 });
  const note = (descriptor, amount) => { const s = sealNote({ descriptor, amountAtomic: amount }); return { record: s.record, cm: s.cm }; };
  const wallet = ZkWalletIdentity.fromRoot(options);
  const entries = [note(wallet.descriptorAt(0, 5), '500'), note(sender.descriptorAt(0, 0), '7'),
    note(wallet.descriptorAt(0, 2), '200'), note(wallet.selfRecipient(), '30')];
  const found = wallet.scanRecords(entries);
  assert.deepEqual(found.map(x => [x.position, x.address.chain, x.address.index, String(x.owned.amountAtomic)]),
    [[0, 0, 5, '500'], [2, 0, 2, '200'], [3, 1, 0, '30']]);
  assert.deepEqual(wallet.usedIndexes, [2, 5]);
  assert.equal(wallet.currentIndex(), 6);
  assert.equal(wallet.recipient().owner, wallet.descriptorAt(0, 6).owner);
  // Each note is spent with the key of the address that received it.
  const spender = wallet.spendingIdentity({ address: found[1].address });
  assert.equal(spender.recipient().owner, hex(found[1].owned.note.subarray(65, 97)));
  // A note beyond the gap is only found with a larger gap.
  const far = ZkWalletIdentity.fromRoot(options);
  const beyond = [note(far.descriptorAt(0, 6), '1')];
  assert.equal(far.scanRecords(beyond).length, 0);
  far.setGap(7);
  assert.equal(far.scanRecords(beyond).length, 1);
  const resumed = ZkWalletIdentity.fromRoot(options);
  assert.equal(resumed.scanRecords([note(resumed.descriptorAt(0, 5), '1')]).length, 0);
  assert.equal(resumed.scanRecords([note(resumed.descriptorAt(0, 5), '1')],
    [{ chain: 0, index: 2 }]).length, 1);
  resumed.lock();
  // Handing out new addresses stops at the gap unless forced.
  assert.equal(wallet.issueNext(), 7);
  assert.equal(wallet.issueNext(), 8);
  assert.throws(() => wallet.issueNext(), /unused addresses/);
  assert.equal(wallet.issueNext({ force: true }), 9);
  assert.equal(wallet.currentIndex(), 9);
  assert.throws(() => wallet.createNote({ ...sender.descriptorAt(0, 0), domain: '11'.repeat(32) }, '1'), /another pool/);
  for (const w of [wallet, far, sender]) w.lock();
  assert.throws(() => wallet.identityAt(0, 0), /locked/);
});

test('derivation rejects invalid account, chain, index and gap values', async () => {
  const root = await rootFor(vectors[0].input);
  const base = { family: 'legacy', domain: scope.domain, assetId: scope.assetId };
  for (const bad of [{ account: -1, chain: 0, index: 0 }, { account: 2 ** 31, chain: 0, index: 0 },
    { family: 'legacy', account: 0, chain: 2, index: 0 }, { family: 'legacy', account: 0, chain: 0, index: 1.5 }]) {
    assert.throws(() => deriveZkAddressKeys(root, { ...base, ...bad }), /account|chain|index/);
  }
  const wallet = ZkWalletIdentity.fromRoot({ root, family: 'legacy', account: 0, ...base, network: 'testnet' });
  assert.throws(() => wallet.setGap(0), /gap/);
  assert.throws(() => wallet.setGap(1001), /gap/);
  assert.throws(() => ZkWalletIdentity.fromRoot({ root, family: 'legacy', account: 0, ...base, network: 'signet' }), /network/);
  wallet.lock();
});

test('v2 separates all families, accounts and pools, including checkpoints and storage', async () => {
  const root = await rootFor(vectors[0].input);
  const make = extra => ZkWalletIdentity.fromRoot({ root, account: 0, family: 'legacy', ...scope, ...extra });
  const wallets = ['legacy', 'ecdsa', 'pq'].map(family => make({family}));
  wallets.push(make({account:1}),make({domain:'11'.repeat(32)}),make({assetId:'22'.repeat(32)}));
  assert.equal(new Set(wallets.map(w=>w.addressAt(0,0))).size, wallets.length);
  assert.equal(new Set(wallets.map(w=>w.storageId)).size, wallets.length);
  const encrypted=wallets[0].sealCheckpoint({test:true});
  for(const wallet of wallets.slice(1)) assert.throws(()=>wallet.openCheckpoint(encrypted));
  const restored=make({});
  assert.deepEqual(restored.openCheckpoint(encrypted),{test:true});
  assert.equal(restored.storageId,wallets[0].storageId);
  assert.equal(restored.family,'legacy');assert.equal(restored.derivation,'NeuraiZK/v2');
  for(const invalid of [undefined,null,'PQ','authscript','toString',0]) {
    assert.throws(()=>make({family:invalid}),/family/);
    await assert.rejects(ZkWalletIdentity.fromSeed({seed:new Uint8Array(64),...scope,family:invalid}),/family/);
  }
  for(const w of [...wallets,restored]) w.lock();
});

test('all nine sender/receiver family pairs recover notes with a fresh wallet', async () => {
  const root=await rootFor(vectors[0].input);
  for(const from of ['legacy','ecdsa','pq']) for(const to of ['legacy','ecdsa','pq']) {
    const sender=ZkWalletIdentity.fromRoot({root,...scope,family:from});
    const receiver=ZkWalletIdentity.fromRoot({root,...scope,family:to});
    const record=sender.createNote(receiver.descriptorAt(0,1),'1000000000');
    receiver.lock();
    const fresh=ZkWalletIdentity.fromRoot({root,...scope,family:to});
    const [found]=fresh.scanRecords([record]);
    assert.equal(found.owned.amountAtomic,1000000000n,`${from} -> ${to}`);
    assert.deepEqual(found.address,{chain:0,index:1});
    const keys=deriveZkAddressKeys(root,{...scope,family:to,chain:0,index:1});
    const independent=new (await import('../src/browser-wallet.js')).BrowserTestIdentity(keys.spendSecret,keys.viewSeed,bytes(scope.domain),bytes(scope.assetId),null);
    assert.deepEqual(independent.openRecord(record.record,record.cm).nf,found.owned.nf);
    if(from!==to) assert.equal(sender.scanRecords([record]).length,0);
    sender.lock();fresh.lock();independent.lock();keys.spendSecret.fill(0);keys.viewSeed.fill(0);
  }
});

test('mnemonic validation, Unicode normalization and passphrase spaces are deterministic', async () => {
  const mnemonic=vectors[0].input.mnemonic;
  await assert.rejects(walletSeedFromMnemonic('abandon '.repeat(12)),/mnemonic/);
  await assert.rejects(walletSeedFromMnemonic('unknown words'),/mnemonic/);
  const a=await walletSeedFromMnemonic(mnemonic,'café 🛡 ');
  const b=await walletSeedFromMnemonic('  '+mnemonic.replaceAll(' ','  ')+'  ','cafe\u0301 🛡 ');
  assert.deepEqual(a,b);
  assert.notDeepEqual(a,await walletSeedFromMnemonic(mnemonic,'café 🛡'));
  const r=await deriveZkRoot(a,'café');
  assert.deepEqual(r,await deriveZkRoot(a,'cafe\u0301'));
  assert.notDeepEqual(r,await deriveZkRoot(a,'café '));
});

test('v2 frozen storage and checkpoint keys use full account scope', async () => {
  const { sealScanCheckpoint }=await import('../src/checkpoint-crypto.js');
  for(const {input,output} of vectors) {
    const wallet=ZkWalletIdentity.fromRoot({root:await rootFor(input),family:input.family,account:input.account,domain:input.domain,assetId:input.asset_id,network:input.network});
    assert.equal(wallet.storageId,output.storage_id);
    assert.deepEqual(wallet.openCheckpoint(sealScanCheckpoint({vector:input.family},bytes(output.checkpoint_key))),{vector:input.family});
    wallet.lock();
  }
});
