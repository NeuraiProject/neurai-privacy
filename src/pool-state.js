/* CP1 public-tree primitives (NIP-043) that the C7 public world is built from. */
import { decodeField, encodeField, poseidonBytes, poseidonPermutation } from './poseidon.js';

const encoder = new TextEncoder();
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

/** Indexed-tree leaf with separate cm/nf domain. */
export function poolIndexedLeaf(kind, value, nextValue, nextIndex) {
  if (kind !== 'cm' && kind !== 'nf') throw new TypeError('indexed kind must be cm or nf');
  return poseidonBytes(concat(encoder.encode(`NIP043/${kind}leaf`),
    encodeField(value), encodeField(nextValue), uint32(nextIndex, 'next index')));
}
