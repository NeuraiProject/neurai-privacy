import { poseidonBytes, decodeField } from './poseidon.js';

const text = new TextEncoder();
const MAX_MONEY_SATS = 2_100_000_000_000_000_000n;
const X25519_FIELD = (1n << 255n) - 19n;
const OWNER_TAG = text.encode('NIP043/owner/CP1');
const NK_TAG = text.encode('NIP043/nk/CP1');
const CM_TAG = text.encode('NIP043/cm/CP1');
const NF_TAG = text.encode('NIP043/nf/CP1');

function bytes32(value, name) {
  if (!(value instanceof Uint8Array) || value.length !== 32) {
    throw new TypeError(`${name} must contain 32 bytes`);
  }
  return value;
}

function join(...parts) {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function validViewPublic(value) {
  bytes32(value, 'viewPub');
  let element = 0n;
  for (let i = 31; i >= 0; i--) element = element * 256n + BigInt(value[i]);
  if (element === 0n || element >= X25519_FIELD) {
    throw new RangeError('noncanonical X25519 view public key');
  }
  return value;
}

function amountValue(amount) {
  if (typeof amount !== 'bigint' &&
      !(typeof amount === 'string' && /^[1-9][0-9]*$/.test(amount))) {
    throw new TypeError('amount must be an exact positive bigint or decimal string');
  }
  const value = BigInt(amount);
  if (value < 1n || value > MAX_MONEY_SATS) {
    throw new RangeError('amount exceeds allowed atomic value');
  }
  return value;
}

/** NIP-043 CP1 note: version || domain || asset || owner || view pubkey || u64LE amount || rho. */
export function encodeNote({ domain, assetId, owner, viewPub, amountAtomic, rho }) {
  bytes32(domain, 'domain');
  bytes32(assetId, 'assetId');
  bytes32(owner, 'owner');
  validViewPublic(viewPub);
  bytes32(rho, 'rho');
  if (decodeField(owner) === 0n) throw new RangeError('owner must be nonzero');
  const amount = amountValue(amountAtomic);
  const littleEndian = new Uint8Array(8);
  let remaining = amount;
  for (let i = 0; i < 8; i++) {
    littleEndian[i] = Number(remaining & 255n);
    remaining >>= 8n;
  }
  return join(Uint8Array.of(1), domain, assetId, owner, viewPub, littleEndian, rho);
}

export function decodeNote(note) {
  if (!(note instanceof Uint8Array) || note.length !== 169 || note[0] !== 1) {
    throw new TypeError('invalid CP1 note encoding');
  }
  const domain = note.slice(1, 33);
  const assetId = note.slice(33, 65);
  const owner = note.slice(65, 97);
  const viewPub = validViewPublic(note.slice(97, 129));
  const rho = note.slice(137, 169);
  if (decodeField(owner) === 0n) throw new RangeError('owner must be nonzero');
  let amountAtomic = 0n;
  for (let i = 7; i >= 0; i--) amountAtomic = amountAtomic * 256n + BigInt(note[129 + i]);
  amountValue(amountAtomic);
  return { domain, assetId, owner, viewPub, amountAtomic, rho };
}

export function deriveOwner(domain, spendSecret) {
  return poseidonBytes(join(OWNER_TAG, bytes32(domain, 'domain'), bytes32(spendSecret, 'spendSecret')));
}

export function deriveNullifierKey(domain, spendSecret) {
  return poseidonBytes(join(NK_TAG, bytes32(domain, 'domain'), bytes32(spendSecret, 'spendSecret')));
}

export function noteCommitment(note) {
  decodeNote(note);
  const cm = poseidonBytes(join(CM_TAG, note));
  if (decodeField(cm) === 0n) throw new RangeError('note commitment must be nonzero');
  return cm;
}

/** Refuses to compute a nullifier for a note that the supplied secret does not own. */
export function noteNullifier(note, spendSecret) {
  const { domain, owner, rho } = decodeNote(note);
  const derivedOwner = deriveOwner(domain, spendSecret);
  let different = 0;
  for (let i = 0; i < 32; i++) different |= owner[i] ^ derivedOwner[i];
  if (different !== 0) {
    throw new Error('spend secret does not own this note');
  }
  return poseidonBytes(join(NF_TAG, domain, deriveNullifierKey(domain, spendSecret), rho,
    noteCommitment(note)));
}
