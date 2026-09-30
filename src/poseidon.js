import { POSEIDON_RC, POSEIDON_MDS } from './poseidon-constants.js';

// CP1/NIP-036 t=3 permutation over the BN254 scalar field, with the
// byte sponge used by the Neurai private-pool circuits. This is not circomlib Poseidon.
export const BN254_SCALAR_FIELD =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

function canonical(value) {
  if (typeof value !== 'bigint' || value < 0n || value >= BN254_SCALAR_FIELD) {
    throw new RangeError('noncanonical BN254 scalar field element');
  }
  return value;
}

export function encodeField(value) {
  let remaining = canonical(value);
  const bytes = new Uint8Array(32);
  for (let index = 31; index >= 0; index--) {
    bytes[index] = Number(remaining & 255n);
    remaining >>= 8n;
  }
  return bytes;
}

export function decodeField(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 32) {
    throw new TypeError('field element must contain 32 bytes');
  }
  let value = 0n;
  for (const byte of bytes) value = value * 256n + BigInt(byte);
  return canonical(value);
}

export function poseidonPermutation(input) {
  if (!Array.isArray(input) || input.length !== 3) {
    throw new TypeError('Poseidon state must have three elements');
  }
  let state = input.map(canonical);
  const field = BN254_SCALAR_FIELD;
  for (let round = 0; round < 65; round++) {
    const nonlinearity = state.map((value, index) => {
      const shifted = (value + POSEIDON_RC[round * 3 + index]) % field;
      if (index !== 0 && round >= 4 && round < 61) return shifted;
      const squared = (shifted * shifted) % field;
      return (squared * squared % field) * shifted % field;
    });
    state = [0, 1, 2].map(row =>
      (POSEIDON_MDS[row * 3] * nonlinearity[0] +
       POSEIDON_MDS[row * 3 + 1] * nonlinearity[1] +
       POSEIDON_MDS[row * 3 + 2] * nonlinearity[2]) % field);
  }
  return state;
}

/** CP1 byte sponge: 0x01 padding, 31-byte big-endian chunks, rate two. */
export function poseidonBytes(input) {
  if (!(input instanceof Uint8Array)) {
    throw new TypeError('Poseidon input must be bytes');
  }
  const size = Math.ceil((input.length + 1) / 31) * 31;
  const padded = new Uint8Array(size);
  padded.set(input);
  padded[input.length] = 1;
  let state = [0n, 0n, 0n];
  for (let offset = 0; offset < size; offset += 62) {
    for (let index = 0; index < 2; index++) {
      const start = offset + index * 31;
      if (start >= size) break;
      let element = 0n;
      for (let pos = start; pos < start + 31; pos++) {
        element = element * 256n + BigInt(padded[pos]);
      }
      state[index] = (state[index] + element) % BN254_SCALAR_FIELD;
    }
    state = poseidonPermutation(state);
  }
  return encodeField(state[0]);
}
