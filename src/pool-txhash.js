import { sha256 } from '@noble/hashes/sha2.js';
import { poseidonBytes } from './poseidon.js';

const tag = sha256(new TextEncoder().encode('NeuraiTxHash'));
const mask = Uint8Array.of(0x1f, 0x01);
const empty = new Uint8Array();
const doubleSha256 = data => sha256(sha256(data));

function concat(...parts) {
  const out = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}

function bytes(value, name) {
  if (!(value instanceof Uint8Array)) throw new TypeError(`${name} must be bytes`);
  return value;
}

/** Exact NIP-042 v2 anchor for the Neurai TEST pool transaction mask 0x011f. */
export function poolTxHash({ version, locktime, prevouts, sequences, outputs }) {
  bytes(version, 'version'); bytes(locktime, 'locktime');
  bytes(prevouts, 'prevouts'); bytes(sequences, 'sequences'); bytes(outputs, 'outputs');
  if (version.length !== 4 || locktime.length !== 4 ||
      prevouts.length === 0 || prevouts.length % 36 !== 0 ||
      sequences.length !== prevouts.length / 9 || outputs.length === 0) {
    throw new RangeError('invalid pool transaction preimage fields');
  }
  const payload = concat(mask, version, locktime, doubleSha256(prevouts),
    doubleSha256(sequences), doubleSha256(outputs), doubleSha256(empty));
  return sha256(concat(tag, tag, payload));
}

/** CP1 PoseidonBytes converts the tagged TXHASH digest into the ZK public anchor. */
export function poolTxAnchor(fields) {
  return poseidonBytes(poolTxHash(fields));
}
