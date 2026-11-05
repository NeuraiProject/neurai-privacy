import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const esm = await import('@neuraiproject/neurai-privacy');
const cjs = require('@neuraiproject/neurai-privacy');
const browser = await import('@neuraiproject/neurai-privacy/browser');
const client = await import('@neuraiproject/neurai-privacy/client');
const worker = await import('@neuraiproject/neurai-privacy/worker');

for (const entry of [esm, cjs, browser]) {
  assert.equal(typeof entry.poseidonBytes, 'function');
  assert.equal(typeof entry.C7WalletIdentity, 'function');
  assert.equal(typeof entry.sealC7Note, 'function');
}
for (const entry of [esm, cjs, browser, client]) {
  assert.equal(typeof entry.createWalletServiceRpc, 'function');
  assert.equal(typeof entry.C7WorkerClient, 'function');
  assert.equal(typeof entry.IndexedDbJournalStore, 'function');
  assert.equal(typeof entry.validateC7Deployment, 'function');
  assert.equal(entry.C6WorkerClient, entry.C7WorkerClient);
  assert.equal(entry.IndexedDbSponsorStore, entry.IndexedDbJournalStore);
}
for (const entry of [esm, cjs, browser, worker]) {
  for (const name of ['startC7PoolWorker', 'scanC7Pool', 'buildC7Transaction', 'readC7Packet', 'createC7JoinWallet', 'createC7OperationWallet']) {
    assert.equal(typeof entry[name], 'function', name);
    assert.equal(entry[name.replace('C7', 'C6')], entry[name], name.replace('C7', 'C6'));
  }
}
// The page entry never loads a wallet identity.
assert.equal(client.C7WalletIdentity, undefined);
// C4, C5 and C6 are gone from every entry.
for (const entry of [esm, cjs, browser, client, worker]) {
  for (const name of ['NeuraiPrivacy', 'CliTestBackend', 'BrowserTestIdentity', 'ZkWalletIdentity', 'startPoolWorker', 'PoolWorkerClient',
    'prepareC4', 'prepareC5', 'C4_TESTNET_MANIFEST', 'SponsorJournal', 'C6SponsorFlow', 'c6SponsorWalletId', 'c6AssetMetadata', 'sealNote']) {
    assert.equal(entry[name], undefined, name);
  }
}

const expected = '067761295e881eec953a764e4d72bbccedf07472b57b9a3f754dcb5012441956';
for (const entry of [esm, cjs, browser]) {
  assert.equal(Buffer.from(entry.poseidonBytes(new Uint8Array())).toString('hex'), expected);
}
// Browser files, shared chunks included, must not import Node, @noble or @scure modules.
const chunks = (await readdir('dist/chunks')).filter(name => name.endsWith('.js')).map(name => `chunks/${name}`);
const browserFiles = ['browser.js', 'client.js', 'worker.js', ...chunks];
const sources = new Map();
for (const file of browserFiles) {
  const bundle = await readFile(`dist/${file}`, 'utf8');
  assert.doesNotMatch(bundle, /from ["'](?:node:|@noble\/|@scure\/)/, file);
  sources.set(file, bundle);
}

// Shared code is emitted once: the scanner's transport tag lives in one file.
assert.equal(browserFiles.filter(file => sources.get(file).includes('Neurai/privacy-pool/transport/v1')).length, 1);

// The page entry loads no key or note cryptography: follow its static imports.
function closure(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  for (const [, target] of sources.get(file).matchAll(/(?:from|import)\s*["'](\.{1,2}\/[^"']+)["']/g)) {
    closure(join(dirname(file), target), seen);
  }
  return seen;
}
const clientCode = [...closure('client.js')].map(file => sources.get(file)).join('\n');
for (const primitive of ['chacha20poly1305', 'argon2', 'ristretto255', 'pbkdf2']) {
  assert.ok(!clientCode.includes(primitive), `client entry loads ${primitive}`);
}
console.log('Built Node, browser, client and worker entries are usable.');
