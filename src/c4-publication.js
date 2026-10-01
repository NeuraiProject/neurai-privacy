/** Experimental C4 byte codec. No RPC, Node, Python, or ciphertext-validity claim. */
import { decodeField, poseidonBytes } from './poseidon.js';

const utf8 = value => new TextEncoder().encode(value);
const demand = (condition, message) => { if (!condition) throw new Error(message); };
function bytes(value, size, label) {
  demand(value instanceof Uint8Array && value.length === size, `${label} must be ${size} bytes`);
  return value;
}
function concat(...items) {
  const result = new Uint8Array(items.reduce((n, x) => n + x.length, 0));
  let offset = 0;
  for (const item of items) { result.set(item, offset); offset += item.length; }
  return result;
}
function le64(value) {
  demand(typeof value === 'bigint' && value >= 0n && value < (1n << 64n), 'Expected unsigned 64-bit bigint');
  const result = new Uint8Array(8);
  for (let i = 0; i < 8; i++, value >>= 8n) result[i] = Number(value & 255n);
  return result;
}
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
function layout(form) {
  const deposit = form === 'D0' || form === 'D1';
  demand(deposit || /^T[1-4]$/.test(form), 'Unsupported C4 publication form');
  const count = deposit ? 1 : Number(form[1]);
  return { deposit, count, recordsAt: 34 + count * 32, end: 34 + count * 252 };
}
function compactRecord(record) {
  bytes(record, 1024, 'HPKE record');
  demand(same(record.slice(0, 3), Uint8Array.of(1, 217, 0)) && record.slice(220).every(x => x === 0), 'Noncanonical HPKE record');
  return record.slice(0, 220);
}

/** Hashing only: the caller must authenticate all context fields against the contract. */
export function c4Context({ domain, assetId, unit, registryRoot = new Uint8Array(32) }) {
  bytes(domain, 32, 'Domain'); bytes(assetId, 32, 'Asset ID'); bytes(registryRoot, 32, 'Registry root');
  decodeField(registryRoot);
  demand(typeof unit === 'bigint' && Array.from({ length: 9 }, (_, i) => 10n ** BigInt(i)).includes(unit), 'Invalid asset quantum');
  return poseidonBytes(concat(utf8('NeuraiPoolCtx'), Uint8Array.of(1), domain, assetId, le64(unit), registryRoot));
}

export function decodeC4Publication(form, blob) {
  bytes(blob, 4096, 'C4 publication');
  const spec = layout(form);
  demand(blob[0] === 2 && blob[1] === spec.count, 'C4 version/count mismatch');
  demand(blob.slice(spec.end).every(x => x === 0), 'Noncanonical C4 padding');
  const nf = spec.deposit ? null : blob.slice(2, 34);
  if (spec.deposit) demand(blob.slice(2, 34).every(x => x === 0), 'Deposit cannot carry a nullifier');
  else demand(decodeField(nf) !== 0n, 'Zero nullifier');
  const cms = [], records = [];
  for (let i = 0; i < spec.count; i++) {
    const cm = blob.slice(34 + i * 32, 66 + i * 32);
    demand(decodeField(cm) !== 0n && !cms.some(other => same(other, cm)), 'Zero or duplicate commitment');
    cms.push(cm);
    const record = new Uint8Array(1024);
    record.set(blob.slice(spec.recordsAt + i * 220, spec.recordsAt + (i + 1) * 220));
    compactRecord(record); records.push(record);
  }
  return { cms, records, nf };
}

export function encodeC4Publication(form, { cms, records, nf = null }) {
  const spec = layout(form);
  demand(Array.isArray(cms) && Array.isArray(records) && cms.length === spec.count && records.length === spec.count, 'Wrong note count');
  demand(spec.deposit ? nf === null : nf instanceof Uint8Array, 'Wrong nullifier presence');
  const result = new Uint8Array(4096); result.set([2, spec.count]);
  if (!spec.deposit) result.set(bytes(nf, 32, 'Nullifier'), 2);
  cms.forEach((cm, i) => result.set(bytes(cm, 32, 'Commitment'), 34 + i * 32));
  records.forEach((record, i) => result.set(compactRecord(record), spec.recordsAt + i * 220));
  decodeC4Publication(form, result);
  return result;
}

export function c4PublicationHash(form, blob) {
  decodeC4Publication(form, blob);
  const seed = poseidonBytes(utf8('NIP045/dat\x03'));
  return poseidonBytes(concat(poseidonBytes(concat(seed, blob.slice(0, 2048))), blob.slice(2048)));
}
