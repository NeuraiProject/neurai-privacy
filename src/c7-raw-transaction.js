import { sha256 } from '@noble/hashes/sha2.js';
/* Minimal, bounded reader of the version 3 transactions the C7 pool uses. It
 * checks the wire format and computes the txid; the node still verifies every
 * script and proof. */

const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const bytes = value => Uint8Array.from(value.match(/../g) ?? [], b => parseInt(b, 16));

export function readC7RawTransaction(raw) {
  if (typeof raw !== 'string' || !/^(?:[0-9a-f]{2})+$/.test(raw) || raw.length > 800000) throw new Error('Canonical bounded transaction hex required');
  const b = bytes(raw); let at = 0;
  function take(n) { if (!Number.isSafeInteger(n) || n < 0 || at + n > b.length) throw new Error('Truncated transaction'); const out = b.slice(at, at + n); at += n; return out; }
  const int = n => { let v = 0n; const a = take(n); for (let i = n - 1; i >= 0; i--) v = (v << 8n) + BigInt(a[i]); return v; };
  function count() {
    const f = Number(int(1)); if (f < 253) return f;
    const v = int(f === 253 ? 2 : f === 254 ? 4 : 8);
    if (v < (f === 253 ? 253n : f === 254 ? 65536n : 4294967296n) || v > BigInt(b.length)) throw new Error('Invalid CompactSize');
    return Number(v);
  }
  const blob = () => hex(take(count()));
  const version = Number(int(4)); if (version !== 3) throw new Error('C7 pool transactions are version 3');
  // Extended format flags: 0x01 witness, 0x02 NIP-014 reference inputs.
  let flags = 0;
  if (b[at] === 0) { take(1); flags = Number(int(1)); if (!flags || flags & ~3) throw new Error('Unknown witness flags'); }
  const baseStart = at;
  const inputs = [], outputs = [], refs = [];
  let n = count(); if (!n || n > 10000) throw new Error('Invalid input count');
  for (let i = 0; i < n; i++) inputs.push({ txid: hex(take(32).reverse()), vout: Number(int(4)), scriptSig: blob(), sequence: Number(int(4)), witness: [] });
  n = count(); if (!n || n > 10000) throw new Error('Invalid output count');
  for (let i = 0; i < n; i++) outputs.push({ valueAtomic: String(int(8)), script: blob() });
  if (flags & 2) {
    n = count(); if (!n || n > 10000) throw new Error('Invalid reference count');
    for (let i = 0; i < n; i++) refs.push({ txid: hex(take(32).reverse()), vout: Number(int(4)) });
  }
  const baseEnd = at;
  if (flags & 1) {
    for (const input of inputs) { n = count(); if (n > 1000) throw new Error('Invalid witness count'); for (let j = 0; j < n; j++) input.witness.push(blob()); }
    if (!inputs.some(i => i.witness.length)) throw new Error('Superfluous witness marker');
  }
  const locktime = Number(int(4)); if (at !== b.length) throw new Error('Trailing transaction bytes');
  // The txid commits to reference inputs, so they keep the 00 02 marker there.
  const marker = flags & 2 ? Uint8Array.of(0, 2) : new Uint8Array(0);
  const base = new Uint8Array(4 + marker.length + baseEnd - baseStart + 4);
  base.set(b.slice(0, 4)); base.set(marker, 4); base.set(b.slice(baseStart, baseEnd), 4 + marker.length); base.set(b.slice(-4), base.length - 4);
  const txid = hex(sha256(sha256(base)).reverse());
  return { version, inputs, outputs, refs, locktime, txid };
}
