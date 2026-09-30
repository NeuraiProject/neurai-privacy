import { BrowserTestIdentity, poseidonBytes } from '../src/browser.js';

const button = document.querySelector('#run');
const status = document.querySelector('#status');
const results = document.querySelector('#results');
const domain = '01'.repeat(32);
const assetId = '02'.repeat(32);

function heapBytes() {
  // Chromium-only JS heap estimate. It excludes WebAssembly, native allocations and the browser itself.
  return performance.memory?.usedJSHeapSize ?? null;
}

async function measure(name, operation) {
  const beforeHeap = heapBytes();
  const started = performance.now();
  const value = await operation();
  return {
    name,
    milliseconds: Math.round((performance.now() - started) * 100) / 100,
    jsHeapDeltaBytes: beforeHeap === null ? null : heapBytes() - beforeHeap,
    value,
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

async function repeated(name, count, operation) {
  // Each item is a real independent operation; the first run is separately warmed up.
  await operation();
  const samples = [];
  for (let i = 0; i < count; i++) {
    const started = performance.now();
    operation();
    samples.push(performance.now() - started);
    if (i % 10 === 9) await new Promise(resolve => setTimeout(resolve, 0));
  }
  return { name, count, medianMs: Math.round(median(samples) * 100) / 100,
    minMs: Math.round(Math.min(...samples) * 100) / 100,
    maxMs: Math.round(Math.max(...samples) * 100) / 100 };
}

async function run() {
  button.disabled = true;
  status.textContent = 'Running locally; Argon2id can briefly make this tab unresponsive…';
  results.textContent = '';
  let wallet;
  let recovered;
  try {
    // Random, ephemeral TEST secrets. Never put a real backup or password in a benchmark.
    const password = Array.from(crypto.getRandomValues(new Uint8Array(32)), x =>
      x.toString(16).padStart(2, '0')).join('');
    const created = await measure('create TEST identity + Argon2id vault (64 MiB, 3 passes)',
      () => BrowserTestIdentity.create({ domain, assetId, password }));
    wallet = created.value;
    const recipient = wallet.recipient();
    const sealed = await repeated('encrypt note + Poseidon commitment', 20,
      () => wallet.createNote(recipient, 100_000_000n));
    const { cm, record } = wallet.createNote(recipient, 100_000_000n);
    const opened = await repeated('decrypt + validate note + nullifier', 20,
      () => wallet.openRecord(record, cm));
    const poseidon = await repeated('Poseidon hash of 169 bytes', 100,
      () => poseidonBytes(new Uint8Array(169)));
    const restored = await measure('Argon2id vault open + identity restore',
      () => BrowserTestIdentity.fromBackup({ backup: wallet.backupJson(), password,
        domain, assetId }));
    recovered = restored.value;
    if (recovered.openRecord(record, cm).amountAtomic !== 100_000_000n) {
      throw new Error('round-trip validation failed');
    }
    const report = {
      kind: 'neurai-privacy-browser-foundation-v1',
      measuredAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      hardwareConcurrencyHint: navigator.hardwareConcurrency ?? null,
      deviceMemoryGiBHint: navigator.deviceMemory ?? null,
      jsHeapBytesAfter: heapBytes(),
      warning: 'JS heap is not process peak RSS; Groth16 witness/proof generation was not measured',
      results: [
        { name: created.name, milliseconds: created.milliseconds,
          jsHeapDeltaBytes: created.jsHeapDeltaBytes },
        sealed, opened, poseidon,
        { name: restored.name, milliseconds: restored.milliseconds,
          jsHeapDeltaBytes: restored.jsHeapDeltaBytes },
      ],
    };
    results.textContent = JSON.stringify(report, null, 2);
    status.textContent = 'Completed';
  } catch (error) {
    status.textContent = `Failed: ${error.message}`;
  } finally {
    recovered?.lock();
    wallet?.lock();
    button.disabled = false;
  }
}

button.addEventListener('click', run);

if (new URLSearchParams(location.search).has('autorun')) run();
