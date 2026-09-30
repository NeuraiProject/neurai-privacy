import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const esm = await import('@neuraiproject/neurai-privacy');
const cjs = require('@neuraiproject/neurai-privacy');
const browser = await import('@neuraiproject/neurai-privacy/browser');
const client = await import('@neuraiproject/neurai-privacy/client');
const worker = await import('@neuraiproject/neurai-privacy/worker');

for (const entry of [esm, cjs, browser]) {
  assert.equal(typeof entry.poseidonBytes, 'function');
  assert.equal(typeof entry.ZkWalletIdentity, 'function');
}
assert.equal(typeof esm.CliTestBackend, 'function');
assert.equal(typeof cjs.CliTestBackend, 'function');
assert.equal(browser.CliTestBackend, undefined);
assert.equal(typeof client.PoolWorkerClient, 'function');
assert.equal(client.ZkWalletIdentity, undefined);
assert.equal(typeof worker.startPoolWorker, 'function');

const expected = '067761295e881eec953a764e4d72bbccedf07472b57b9a3f754dcb5012441956';
for (const entry of [esm, cjs, browser]) {
  assert.equal(Buffer.from(entry.poseidonBytes(new Uint8Array())).toString('hex'), expected);
}
for (const name of ['browser', 'client', 'worker']) {
  const bundle = await readFile(`dist/${name}.js`, 'utf8');
  assert.doesNotMatch(bundle, /from ["'](?:node:|@noble\/)/);
}
console.log('Built Node, browser, client and worker entries are usable.');
