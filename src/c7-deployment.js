/* Application-pinned C7 deployment and the public intent of a pool transaction.
 * Deployment anchors and leaves come from the application, never from the RPC.
 * No private data is read here. */
import { sha256 } from '@noble/hashes/sha2.js';
import { poseidonBytes } from './poseidon.js';
import { readC7RawTransaction } from './c7-raw-transaction.js';

const hex = b => Array.from(b, n => n.toString(16).padStart(2, '0')).join('');
const unhex = s => Uint8Array.from(s.match(/../g) ?? [], n => parseInt(n, 16));
const hash = s => hex(sha256(new TextEncoder().encode(s)));
const point = i => `${i.txid}:${i.vout}`;
const HASH = /^[0-9a-f]{64}$/;
const FR = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const forms = ['D0', 'D1', 'T1', 'T2', 'T3', 'W_partial_no_change', 'W_partial_change', 'W_full_no_change', 'J2'];
function field(s) { if (!HASH.test(s) || BigInt('0x' + s) >= FR) throw Error('Noncanonical C7 field'); return s; }
function stateTemplate(s) {
  if (typeof s !== 'string' || !/^5120[0-9a-f]+75$/.test(s) || s.length < 140) throw Error('C7 state asset script required');
  return s.slice(0, -66); // Exact pinned transfer serialization except its 32-byte state message.
}

/** Checks the shape of a pinned C7 XNA deployment and returns it. The C7 birth
 * spends a unique emission, from which the pool domain derives. */
export function validateC7Deployment(d) {
  if (!d || !HASH.test(d.genesis) || !HASH.test(d.commitment) || d.kind !== 'xna' || typeof d.emission !== 'string' ||
      !/^[0-9a-f]{64}:\d{1,10}$/.test(d.emission) || !Number.isSafeInteger(d.anchor?.height) || d.anchor.height < 0 ||
      !HASH.test(d.anchor.hash) || !/^[0-9a-f]{64}:0$/.test(d.anchor.outpoint) || !/^[0-9a-f]{290}$/.test(d.anchor.opening) ||
      !Array.isArray(d.leaves) || !d.leaves.length || d.leaves.length > 64) throw Error('Pinned C7 deployment required');
  if (!d.anchor.script.startsWith('5120' + d.commitment) ||
      hex(poseidonBytes(unhex(d.anchor.opening))) !== d.anchor.script.slice(-66, -2)) throw Error('Pinned state opening mismatch');
  stateTemplate(d.anchor.script);
  const scripts = new Set();
  for (const l of d.leaves) {
    if (!forms.includes(l.form) || typeof l.script !== 'string' || !/^(?:[0-9a-f]{2})+$/.test(l.script) || l.script.length > 20000 ||
        scripts.has(l.script) || !Array.isArray(l.args) || new Set(l.args).size !== l.args.length ||
        l.args.some(a => typeof a !== 'string') || ['proof', 'vk', ...[0,1,2,3,4].map(i => 'tree'+i)].some(a => !l.args.includes(a))) throw Error('Pinned C7 leaf specification required');
    scripts.add(l.script);
  }
  return d;
}
function describe(tx, d) {
  const w = tx.inputs[0]?.witness;
  if (!w || w[0] !== '10') throw Error('C7 NoAuth MAST witness required');
  const leaf = d.leaves.find(l => l.script === w.at(-2));
  if (!leaf || w.length !== leaf.args.length + 3) throw Error('Unknown C7 leaf or witness shape');
  const args = Object.fromEntries(leaf.args.map((name, i) => [name, w[i+1]]));
  const transcript = [0,1,2,3,4].map(i => args['tree'+i]).join('');
  if (transcript.slice(0,4) !== (leaf.form==='J2'?'03':'02') + forms.indexOf(leaf.form).toString(16).padStart(2,'0') || transcript.length < 648 || transcript.length > 32768) throw Error('C7 transcript profile/form mismatch');
  const nfs = leaf.form.startsWith('D') ? [] : [field(transcript.slice(584,648)), ...(leaf.form === 'J2' ? [field(transcript.slice(648,712))] : [])];
  if (nfs.some(s => /^0+$/.test(s)) || new Set(nfs).size !== nfs.length) throw Error('Invalid C7 nullifiers');
  // These args remain invariant when the public tree transition is relocated.
  const stable = Object.fromEntries(Object.entries(args).filter(([k]) => !/^tree[0-4]$/.test(k) && k !== 'prevouts').sort());
  const payout = leaf.form.startsWith('W') ? tx.outputs[leaf.form === 'W_full_no_change' ? 1 : 2] : null;
  const funding = leaf.form.startsWith('D') ? tx.inputs[tx.inputs.length-1] : null;
  const operation = leaf.form.startsWith('W') ? 'W' : leaf.form.startsWith('D') ? 'D' : leaf.form;
  // The intent tag is the one C6 introduced; journals key their operations by it.
  return { nfs, operationId: hash(JSON.stringify(['NeuraiC6Intent/v1', d.genesis, d.commitment, operation, stable,
    payout ? [payout.valueAtomic, payout.script] : null, funding ? point(funding) : null])) };
}

/** Public intent of a pool transaction, derived before signing. It contains no
 * mutable tree paths, private witnesses or plaintext notes. */
export function c7Intent(raw, deployment) {
  const d = validateC7Deployment(deployment), tx = readC7RawTransaction(raw), parsed = describe(tx, d);
  if (tx.locktime || tx.refs.length || tx.inputs.some(i => i.sequence !== 0xffffffff)) throw Error('C7 transaction fixed fields changed');
  return { operationId: parsed.operationId, pool: d.commitment, nullifiers: parsed.nfs };
}
