import { sha256 } from '@noble/hashes/sha2.js';
/* Minimal, bounded v3 wire reader. It checks the authorization envelope before
 * returning signed bytes; the node still verifies cryptographic signatures.
 * Sign callbacks must sign locally and must never publish on their own. */
import { validateSponsorOffer, sponsorAtomic } from './sponsor-journal.js';

const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const bytes = value => Uint8Array.from(value.match(/../g) ?? [], b => parseInt(b, 16));
const le = (value, size) => { let n = BigInt(value); const out = new Uint8Array(size); for (let i = 0; i < size; i++) { out[i] = Number(n & 255n); n >>= 8n; } return hex(out); };
function compact(n) { return n < 253 ? le(n, 1) : n <= 65535 ? 'fd' + le(n, 2) : 'fe' + le(n, 4); }
export function readSponsorTransaction(raw) {
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
  const version = Number(int(4)); if (version !== 3) throw new Error('C6 signing requires transaction v3');
  let marker = false;
  if (b[at] === 0) { take(1); if (Number(int(1)) !== 1) throw new Error('Unknown witness flags'); marker = true; }
  const baseStart = at;
  const inputs = [], outputs = [], refs = [];
  let n = count(); if (!n || n > 10000) throw new Error('Invalid input count');
  for (let i = 0; i < n; i++) inputs.push({ txid: hex(take(32).reverse()), vout: Number(int(4)), scriptSig: blob(), sequence: Number(int(4)), witness: [] });
  n = count(); if (!n || n > 10000) throw new Error('Invalid output count');
  for (let i = 0; i < n; i++) outputs.push({ valueAtomic: String(int(8)), script: blob() });
  n = count(); if (n > 10000) throw new Error('Invalid reference count');
  for (let i = 0; i < n; i++) refs.push({ txid: hex(take(32).reverse()), vout: Number(int(4)) });
  const baseEnd = at;
  if (marker) {
    for (const input of inputs) { n = count(); if (n > 1000) throw new Error('Invalid witness count'); for (let j = 0; j < n; j++) input.witness.push(blob()); }
    if (!inputs.some(i => i.witness.length)) throw new Error('Superfluous witness marker');
  }
  const locktime = Number(int(4)); if (at !== b.length) throw new Error('Trailing transaction bytes');
  const base = new Uint8Array(4 + baseEnd - baseStart + 4);
  base.set(b.slice(0,4)); base.set(b.slice(baseStart,baseEnd),4); base.set(b.slice(-4),base.length-4);
  const txid = hex(sha256(sha256(base)).reverse());
  return { version, inputs, outputs, refs, locktime, txid };
}
function pushes(script) {
  const b = bytes(script), result = []; let at = 0;
  while (at < b.length) {
    let n = b[at++];
    if (!n || n > 78) throw new Error('Sponsor scriptSig must contain data pushes');
    if (n === 76) { if (at >= b.length) throw new Error('Truncated push'); n = b[at++]; }
    else if (n === 77) { if (at + 2 > b.length) throw new Error('Truncated push'); n = b[at] + 256 * b[at + 1]; at += 2; }
    else if (n === 78) throw new Error('Oversized sponsor push');
    if (at + n > b.length) throw new Error('Truncated push');
    result.push(hex(b.slice(at, at + n))); at += n;
  }
  return result;
}
export function prepareSponsorSweep(value, feeAtomic) {
  const offer = validateSponsorOffer(value), fee = sponsorAtomic(feeAtomic), input = sponsorAtomic(offer.inputAtomic);
  const dust = offer.inputScript.startsWith('5220') ? 3060n : offer.inputScript.startsWith('5320') ? 336n : 546n;
  if (fee <= 0n || fee >= input || input - fee < dust) throw new Error('Invalid sponsor sweep fee or dust');
  const [txid, vout] = offer.outpoint.split(':');
  const script = offer.inputScript;
  const raw = '0300000001' + hex(bytes(txid).reverse()) + le(vout, 4) + '00ffffffff01' + le(input - fee, 8) + compact(script.length / 2) + script + '0000000000';
  return { raw, outpoint: offer.outpoint, outputAtomic: String(input - fee), outputScript: script, hashType: 1 };
}
export function validateSponsorSignature(raw, value, sweep = null) {
  const offer = validateSponsorOffer(value), tx = readSponsorTransaction(raw), index = sweep ? 0 : 2, type = sweep ? 1 : 0x83;
  const input = tx.inputs[index], output = tx.outputs[index];
  if (tx.locktime !== 0 || tx.refs.length || tx.inputs.some(i => i.sequence !== 0xffffffff) || !input || !output || `${input.txid}:${input.vout}` !== offer.outpoint) throw new Error('Signed sponsor fields changed');
  if (sweep && (tx.inputs.length !== 1 || tx.outputs.length !== 1 || sweep.outpoint !== offer.outpoint)) throw new Error('Sweep must have one input and one output');
  if (output.script !== (sweep ? sweep.outputScript : offer.changeScript) || output.valueAtomic !== (sweep ? sweep.outputAtomic : offer.changeAtomic)) throw new Error('Signed sponsor change modified');
  let signature;
  if (offer.inputScript.startsWith('76')) {
    const p = pushes(input.scriptSig);
    if (input.witness.length || p.length !== 2 || !/^(?:02|03)[0-9a-f]{64}$|^04[0-9a-f]{128}$/.test(p[1])) throw new Error('Invalid Legacy sponsor signature shape');
    signature = p[0];
  } else {
    const pq = offer.inputScript.startsWith('52'), w = input.witness;
    if (input.scriptSig || w.length !== 4 || w[0] !== (pq ? '01' : '02') || w[3] !== '51' || (pq ? w[2].length !== 2626 || !w[2].startsWith('05') : !/^(?:02|03)[0-9a-f]{64}$/.test(w[2]))) throw new Error('Invalid strict sponsor signature shape');
    signature = w[1];
    if (pq && signature.length !== 4842) throw new Error('Invalid PQ signature length');
  }
  if (signature.length < 18 || !signature.endsWith(type.toString(16).padStart(2, '0'))) throw new Error('Sponsor signer used the wrong sighash');
  return true;
}
