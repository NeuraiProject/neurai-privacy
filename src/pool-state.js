import { decodeField, encodeField, poseidonBytes, poseidonPermutation } from './poseidon.js';

const encoder = new TextEncoder();
const ZERO = new Uint8Array(32);
const MAX_INDEX = 0xffffffff;

function bytes32(value, name) {
  if (!(value instanceof Uint8Array) || value.length !== 32) {
    throw new TypeError(`${name} must be 32 bytes`);
  }
  decodeField(value);
  return value;
}

function uint32(value, name) {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_INDEX) {
    throw new RangeError(`${name} is not a uint32`);
  }
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, true);
  return out;
}

function concat(...parts) {
  const out = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}

/** NIP-043 CP1 sparse-tree node: Poseidon permutation (0, left, right). */
export function poolTreeNode(left, right) {
  return encodeField(poseidonPermutation([0n, decodeField(bytes32(left, 'left')),
    decodeField(bytes32(right, 'right'))])[0]);
}

/** Exactly 32 levels; omitted leaves are zero, not an implicit nonzero leaf. */
export function poolTreeRoot(slots) {
  if (!(slots instanceof Map)) throw new TypeError('slots must be a Map');
  let layer = new Map();
  for (const [index, value] of slots) {
    uint32(index, 'slot index');
    layer.set(index, bytes32(value, 'slot value'));
  }
  let empty = ZERO;
  for (let depth = 0; depth < 32; depth++) {
    const parents = new Map();
    for (const index of layer.keys()) parents.set(Math.floor(index / 2), true);
    const next = new Map();
    for (const index of parents.keys()) {
      next.set(index, poolTreeNode(layer.get(index * 2) ?? empty,
        layer.get(index * 2 + 1) ?? empty));
    }
    layer = next;
    empty = poolTreeNode(empty, empty);
  }
  return layer.get(0) ?? empty;
}

/** Indexed-tree leaf with separate cm/nf domain. */
export function poolIndexedLeaf(kind, value, nextValue, nextIndex) {
  if (kind !== 'cm' && kind !== 'nf') throw new TypeError('indexed kind must be cm or nf');
  return poseidonBytes(concat(encoder.encode(`NIP043/${kind}leaf`),
    encodeField(value), encodeField(nextValue), uint32(nextIndex, 'next index')));
}

/** Return a new, validated indexed tree. Entry zero is the sentinel. */
export function poolIndexedInsert(kind, entries, value) {
  if (!(entries instanceof Map) || !entries.has(0)) throw new TypeError('missing sentinel');
  if (typeof value !== 'bigint' || value <= 0n) throw new RangeError('indexed value must be positive');
  encodeField(value);
  if (entries.size >= MAX_INDEX) throw new RangeError('indexed tree is full');
  let predIndex = -1;
  let predValue = -1n;
  for (const [index, entry] of entries) {
    uint32(index, 'entry index');
    if (!Array.isArray(entry) || entry.length !== 3) throw new TypeError('bad indexed entry');
    if (entry[0] === value) throw new RangeError('duplicate indexed value');
    if (entry[0] < value && entry[0] > predValue) {
      predIndex = index;
      predValue = entry[0];
    }
  }
  if (predIndex < 0) throw new Error('indexed predecessor missing');
  const [oldValue, nextValue, nextIndex] = entries.get(predIndex);
  if (nextValue !== 0n && value >= nextValue) throw new Error('indexed predecessor link invalid');
  const index = entries.size;
  if (entries.has(index)) throw new Error('indexed append slot occupied');
  const updated = new Map(entries);
  updated.set(predIndex, [oldValue, value, index]);
  updated.set(index, [value, nextValue, nextIndex]);
  return updated;
}

export function poolIndexedRoot(kind, entries) {
  if (!(entries instanceof Map) || !entries.has(0)) throw new TypeError('missing sentinel');
  return poolTreeRoot(new Map(Array.from(entries, ([index, entry]) =>
    [index, poolIndexedLeaf(kind, ...entry)])));
}

/** Public 109-byte state opening and its CP1 Poseidon digest. */
export function poolStateOpening({ slots, seen, nfs, mode }) {
  if (mode !== 0 && mode !== 1) throw new RangeError('invalid pool mode');
  if (!(slots instanceof Map) || !(seen instanceof Map) || !(nfs instanceof Map)) {
    throw new TypeError('state trees must be Maps');
  }
  return concat(poolTreeRoot(slots), poolIndexedRoot('nf', nfs),
    poolIndexedRoot('cm', seen), uint32(slots.size, 'note count'),
    uint32(nfs.size, 'nullifier count'), uint32(seen.size, 'seen count'),
    Uint8Array.of(mode));
}

export function poolStateDigest(state) {
  return poseidonBytes(poolStateOpening(state));
}

export function emptyPoolState() {
  return { slots: new Map(), seen: new Map([[0, [0n, 0n, 0]]]),
    nfs: new Map([[0, [0n, 0n, 0]]]), mode: 0 };
}

/** Validate a 109-byte state opening received from a circuit or block witness. */
export function parsePoolStateOpening(opening) {
  if (!(opening instanceof Uint8Array) || opening.length !== 109) {
    throw new TypeError('pool state opening must be 109 bytes');
  }
  const noteRoot = opening.slice(0, 32);
  const nullifierRoot = opening.slice(32, 64);
  const seenRoot = opening.slice(64, 96);
  bytes32(noteRoot, 'note root');
  bytes32(nullifierRoot, 'nullifier root');
  bytes32(seenRoot, 'seen root');
  const view = new DataView(opening.buffer, opening.byteOffset, opening.byteLength);
  const noteCount = view.getUint32(96, true);
  const nullifierCount = view.getUint32(100, true);
  const seenCount = view.getUint32(104, true);
  const mode = opening[108];
  if (nullifierCount === 0 || seenCount === 0 || mode > 1) {
    throw new RangeError('invalid pool state opening counters or mode');
  }
  return { noteRoot, nullifierRoot, seenRoot, noteCount, nullifierCount, seenCount,
    mode, digest: poseidonBytes(opening) };
}
