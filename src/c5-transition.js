/** Public C5 tree transitions, browser-safe and independent of the prover.
 * The binding must come from the authenticated operation, not its transcript.
 * This is not an authorization or an independent chain/proof verifier.
 */
import { encodeField, decodeField, poseidonBytes } from './poseidon.js';
import { poolTreeNode, poolIndexedLeaf, parsePoolStateOpening } from './pool-state.js';
import { C4_FORMS, cat, le } from './c4.js';

export const C5_CHUNK_BYTES = 3072;
export const C5_CHUNKS = 5;
const ZERO = new Uint8Array(32);
const equal = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const need = (ok, message) => { if (!ok) throw new Error('C5 transition: ' + message); };
const outputs = form => form[0] === 'D' ? 1 : form[0] === 'T' ? Number(form[1]) : 0;

export function c5TransitionBinding(form, oldHash, newHash, nf, cms) {
  need(C4_FORMS.includes(form), 'unknown form');
  need(cms.length === outputs(form), 'output count');
  for (const field of [oldHash, newHash, nf, ...cms]) decodeField(field);
  return cat(Uint8Array.of(C4_FORMS.indexOf(form)), oldHash, newHash, nf, ...cms);
}

export function splitC5Transition(raw) {
  need(raw instanceof Uint8Array && raw.length > 0 && raw.length <= C5_CHUNK_BYTES * C5_CHUNKS, 'size');
  return Array.from({ length: C5_CHUNKS }, (_, i) => raw.slice(i * C5_CHUNK_BYTES, (i + 1) * C5_CHUNK_BYTES));
}
export function joinC5Transition(chunks) {
  need(Array.isArray(chunks) && chunks.length === C5_CHUNKS, 'chunk count');
  let short = false;
  for (const chunk of chunks) {
    need(chunk instanceof Uint8Array && chunk.length <= C5_CHUNK_BYTES && !(short && chunk.length), 'noncanonical chunks');
    if (chunk.length < C5_CHUNK_BYTES) short = true;
  }
  const raw = cat(...chunks); need(raw.length > 0, 'empty transcript'); return raw;
}

function pathRoot(leaf, index, path) {
  need(Number.isSafeInteger(index) && index >= 0 && index <= 0xffffffff && path.length === 32, 'path shape');
  decodeField(leaf);
  for (const sibling of path) {
    decodeField(sibling);
    leaf = index % 2 ? poolTreeNode(sibling, leaf) : poolTreeNode(leaf, sibling);
    index = Math.floor(index / 2);
  }
  return leaf;
}
class Reader {
  constructor(raw) { need(raw instanceof Uint8Array && raw.length <= 15360, 'size'); this.raw = raw; this.pos = 0; }
  take(n) { const raw = this.raw.slice(this.pos, this.pos + n); need(raw.length === n, 'truncated'); this.pos += n; return raw; }
  u32() { const b = this.take(4); return new DataView(b.buffer, b.byteOffset, 4).getUint32(0, true); }
  field() { const b = this.take(32); decodeField(b); return b; }
  path() { return Array.from({ length: 32 }, () => this.field()); }
}
function indexed(reader, kind, oldRoot, next, value) {
  const pred = reader.u32(), pv = decodeField(reader.field()), nv = decodeField(reader.field()), ni = reader.u32();
  const predPath = reader.path(), emptyPath = reader.path();
  need(next >= 1 && next <= 0xfffffffe && pred < next && ni < next, 'allocation');
  need((nv === 0n) === (ni === 0) && (pv === 0n) === (pred === 0), 'sentinel');
  need(value > pv && (nv === 0n || value < nv), 'ordering');
  need(equal(pathRoot(poolIndexedLeaf(kind, pv, nv, ni), pred, predPath), oldRoot), 'old predecessor');
  const mid = pathRoot(poolIndexedLeaf(kind, pv, value, next), pred, predPath);
  need(equal(pathRoot(ZERO, next, emptyPath), mid), 'empty indexed slot');
  return pathRoot(poolIndexedLeaf(kind, value, nv, ni), next, emptyPath);
}

/** Verify every public path against independently obtained public inputs. */
export function verifyC5Transition(raw, expectedBinding) {
  const reader = new Reader(raw);
  need(reader.take(1)[0] === 1, 'version');
  const code = reader.take(1)[0], form = C4_FORMS[code]; need(form, 'form');
  const oldRaw = reader.take(109), newRaw = reader.take(109);
  const old = parsePoolStateOpening(oldRaw), fresh = parsePoolStateOpening(newRaw);
  need(old.seenCount === old.noteCount + 1 && fresh.seenCount === fresh.noteCount + 1, 'state counts');
  const nf = reader.field(), cms = Array.from({ length: outputs(form) }, () => reader.field());
  need(equal(c5TransitionBinding(form, old.digest, fresh.digest, nf, cms), expectedBinding), 'transaction/ZK binding');
  need(old.mode === Number(form !== 'D0'), 'old mode');
  let noteRoot = old.noteRoot, nfRoot = old.nullifierRoot, seenRoot = old.seenRoot;
  let noteCount = old.noteCount, nfCount = old.nullifierCount, seenCount = old.seenCount;
  if (form[0] === 'D') need(equal(nf, ZERO), 'deposit nullifier');
  else { nfRoot = indexed(reader, 'nf', nfRoot, nfCount, decodeField(nf)); nfCount++; }
  for (const cm of cms) {
    need(decodeField(cm) > 0n && noteCount <= 0xfffffffd, 'append capacity/value');
    const path = reader.path(); need(equal(pathRoot(ZERO, noteCount, path), noteRoot), 'old append slot');
    noteRoot = pathRoot(cm, noteCount, path);
    seenRoot = indexed(reader, 'cm', seenRoot, seenCount, decodeField(cm));
    noteCount++; seenCount++;
  }
  const computed = cat(noteRoot, nfRoot, seenRoot, le(noteCount, 4), le(nfCount, 4), le(seenCount, 4), Uint8Array.of(Number(form !== 'W_full')));
  need(equal(computed, newRaw), 'new state');
  need(reader.pos === raw.length, 'trailing bytes');
  return true;
}

/** Serialize only public insertions from a locally prepared circuit witness. */
export function encodeC5Transition(form, data) {
  need(C4_FORMS.includes(form), 'unknown form');
  const old = Uint8Array.from(data.oldState), fresh = Uint8Array.from(form[0] === 'T' ? data.states.at(-1) : data.newState);
  const nf = form[0] === 'D' ? ZERO : encodeField(BigInt(data.nf));
  const cms = form[0] === 'T' ? data.cms.map(x => encodeField(BigInt(x))) : form[0] === 'D' ? [encodeField(BigInt(data.cm))] : [];
  const parts = [Uint8Array.of(1, C4_FORMS.indexOf(form)), old, fresh, nf, ...cms];
  const path = values => { need(values.length === 32, 'path length'); parts.push(...values.map(x => encodeField(BigInt(x)))); };
  const insert = get => {
    parts.push(le(get('predIndex'), 4), encodeField(BigInt(get('predValue'))), encodeField(BigInt(get('predNextValue'))), le(get('predNextIndex'), 4));
    path(get('predPath')); path(get('emptyPath'));
  };
  if (form[0] === 'T') insert(k => data['nf' + k[0].toUpperCase() + k.slice(1)]);
  else if (form[0] === 'W') insert(k => data[k]);
  for (let i = 0; i < cms.length; i++) {
    if (form[0] === 'T') {
      path(data.notePaths[i]);
      const names = { predIndex: 'predIndices', predValue: 'predValues', predNextValue: 'predNextValues', predNextIndex: 'predNextIndices', predPath: 'predPaths', emptyPath: 'emptyPaths' };
      insert(k => data[names[k]][i]);
    } else { path(data.notePath); insert(k => data[k]); }
  }
  const raw = cat(...parts);
  verifyC5Transition(raw, c5TransitionBinding(form, encodeField(BigInt(data.S_old)), encodeField(BigInt(data.S_new)), nf, cms));
  return raw;
}
