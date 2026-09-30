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
// Browser files, shared chunks included, must not import Node or @noble modules.
const chunks = (await readdir('dist/chunks')).filter(name => name.endsWith('.js')).map(name => `chunks/${name}`);
const browserFiles = ['browser.js', 'client.js', 'worker.js', ...chunks];
const sources = new Map();
for (const file of browserFiles) {
  const bundle = await readFile(`dist/${file}`, 'utf8');
  assert.doesNotMatch(bundle, /from ["'](?:node:|@noble\/)/, file);
  sources.set(file, bundle);
}

// Shared code is emitted once: the pinned pool manifest lives in one file.
assert.equal(browserFiles.filter(file => sources.get(file).includes('"C3-complete-custody-TEST-')).length, 1);

// The page entry loads no cryptography: follow its static imports.
function closure(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  for (const [, target] of sources.get(file).matchAll(/(?:from|import)\s*["'](\.{1,2}\/[^"']+)["']/g)) {
    closure(join(dirname(file), target), seen);
  }
  return seen;
}
const clientCode = [...closure('client.js')].map(file => sources.get(file)).join('\n');
for (const primitive of ['chacha20poly1305', 'argon2', 'x25519']) {
  assert.ok(!clientCode.includes(primitive), `client entry loads ${primitive}`);
}
console.log('Built Node, browser, client and worker entries are usable.');
