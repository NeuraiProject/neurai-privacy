import { x25519 } from '@noble/curves/ed25519.js';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { encodeNote, decodeNote, deriveOwner, noteCommitment, noteNullifier } from './notes.js';
import { decodeField } from './poseidon.js';

const utf8 = new TextEncoder();
const PREFIX = utf8.encode('HPKE-v1');
const KEM = Uint8Array.of(75, 69, 77, 0, 32);
const SUITE = Uint8Array.of(72, 80, 75, 69, 0, 32, 0, 1, 0, 3);
const INFO = utf8.encode('NIP043/HPKE/CP1');
const AAD = utf8.encode('NIP043/note/CP1');
const P25519 = (1n << 255n) - 19n;

function join(...parts) {
  const out = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
  let at = 0;
  for (const part of parts) { out.set(part, at); at += part.length; }
  return out;
}

function bytes32(value, name) {
  if (!(value instanceof Uint8Array) || value.length !== 32) throw new TypeError(`${name} must contain 32 bytes`);
  return value;
}

function equal(a, b) {
  if (a.length !== b.length) return false;
  let different = 0;
  for (let i = 0; i < a.length; i++) different |= a[i] ^ b[i];
  return different === 0;
}

function hex32(value, name) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/i.test(value)) throw new TypeError(`invalid ${name}`);
  return Uint8Array.from(value.match(/../g), byte => parseInt(byte, 16));
}

function validPublic(publicKey) {
  bytes32(publicKey, 'X25519 public key');
  let number = 0n;
  for (let i = 31; i >= 0; i--) number = number * 256n + BigInt(publicKey[i]);
  if (number === 0n || number >= P25519) throw new RangeError('noncanonical X25519 public key');
  return publicKey;
}

function labeledExtract(suite, salt, label, input) {
  return hmac(sha256, salt, join(PREFIX, suite, utf8.encode(label), input));
}

function labeledExpand(suite, prk, label, context, length) {
  if (length < 1 || length > 32) throw new RangeError('unsupported HPKE expand length');
  return hmac(sha256, prk,
    join(Uint8Array.of(length >> 8, length & 255), PREFIX, suite, utf8.encode(label), context,
      Uint8Array.of(1))).slice(0, length);
}

function pair(ikm) {
  bytes32(ikm, 'HPKE seed');
  const prk = labeledExtract(KEM, new Uint8Array(), 'dkp_prk', ikm);
  const secret = labeledExpand(KEM, prk, 'sk', new Uint8Array(), 32);
  prk.fill(0);
  return { secret, publicKey: x25519.getPublicKey(secret) };
}

function shared(secret, peerPublic, encapsulated, recipientPublic) {
  validPublic(peerPublic);
  const dh = x25519.getSharedSecret(secret, peerPublic);
  const prk = labeledExtract(KEM, new Uint8Array(), 'eae_prk', dh);
  dh.fill(0);
  const result = labeledExpand(KEM, prk, 'shared_secret', join(encapsulated, recipientPublic), 32);
  prk.fill(0);
  return result;
}

function schedule(sharedSecret, info) {
  const context = join(Uint8Array.of(0),
    labeledExtract(SUITE, new Uint8Array(), 'psk_id_hash', new Uint8Array()),
    labeledExtract(SUITE, new Uint8Array(), 'info_hash', info));
  const secret = labeledExtract(SUITE, sharedSecret, 'secret', new Uint8Array());
  const key = labeledExpand(SUITE, secret, 'key', context, 32);
  const nonce = labeledExpand(SUITE, secret, 'base_nonce', context, 12);
  secret.fill(0);
  return { key, nonce };
}

export function deriveViewPublic(viewSeed) {
  const kp = pair(viewSeed);
  kp.secret.fill(0);
  return kp.publicKey;
}

/** Seal one CP1 note with fresh browser entropy. Returns public record, note and commitment. */
export function sealNote({ descriptor, amountAtomic }) {
  if (!descriptor || typeof descriptor !== 'object') throw new TypeError('recipient descriptor required');
  const domain = hex32(descriptor.domain, 'pool domain');
  const assetId = hex32(descriptor.asset_id, 'pool asset');
  const owner = hex32(descriptor.owner, 'recipient owner');
  const viewPub = validPublic(hex32(descriptor.view_pub, 'recipient view public key'));
  if (decodeField(owner) === 0n) throw new RangeError('recipient owner must be nonzero');
  if (!globalThis.crypto?.getRandomValues) throw new Error('secure browser randomness is required');
  const ikm = globalThis.crypto.getRandomValues(new Uint8Array(32));
  const rho = globalThis.crypto.getRandomValues(new Uint8Array(32));
  const eph = pair(ikm);
  ikm.fill(0);
  try {
    const note = encodeNote({ domain, assetId, owner, viewPub, amountAtomic, rho });
    const cm = noteCommitment(note);
    const ss = shared(eph.secret, viewPub, eph.publicKey, viewPub);
    const { key, nonce } = schedule(ss, join(INFO, domain, assetId));
    ss.fill(0);
    try {
      const ciphertext = chacha20poly1305(key, nonce, join(AAD, domain, cm)).encrypt(note);
      if (ciphertext.length !== 185) throw new Error('unexpected CP1 ciphertext length');
      const record = new Uint8Array(1024);
      record.set(Uint8Array.of(1, 217, 0));
      record.set(eph.publicKey, 3);
      record.set(ciphertext, 35);
      return { note, cm, record };
    } finally { key.fill(0); }
  } finally { eph.secret.fill(0); }
}

/** Decrypt a canonical 1024-byte CP1 record belonging to the supplied viewing key. */
export function openNoteRecord({ record, cm, domain, assetId, viewSeed, spendSecret }) {
  if (!(record instanceof Uint8Array) || record.length !== 1024 ||
      !equal(record.subarray(0, 3), Uint8Array.of(1, 217, 0)) ||
      record.subarray(220).some(value => value !== 0)) {
    throw new TypeError('invalid CP1 note record');
  }
  bytes32(cm, 'commitment');
  if (decodeField(cm) === 0n) throw new RangeError('commitment must be nonzero');
  bytes32(domain, 'domain');
  bytes32(assetId, 'assetId');
  const enc = validPublic(record.subarray(3, 35));
  const recipient = pair(viewSeed);
  try {
    const ss = shared(recipient.secret, enc, enc, recipient.publicKey);
    const { key, nonce } = schedule(ss, join(INFO, domain, assetId));
    ss.fill(0);
    let note;
    try {
      note = chacha20poly1305(key, nonce, join(AAD, domain, cm))
        .decrypt(record.subarray(35, 220));
    } finally { key.fill(0); }
    const parsed = decodeNote(note);
    if (!equal(parsed.domain, domain) || !equal(parsed.assetId, assetId) ||
        !equal(parsed.viewPub, recipient.publicKey) || !equal(noteCommitment(note), cm)) {
      throw new Error('CP1 note does not match pool or commitment');
    }
    if (spendSecret !== undefined) {
      bytes32(spendSecret, 'spendSecret');
      if (!equal(parsed.owner, deriveOwner(domain, spendSecret))) {
        throw new Error('spend secret does not own this note');
      }
    }
    return { note, cm: cm.slice(), amountAtomic: parsed.amountAtomic,
      ...(spendSecret === undefined ? {} : { nf: noteNullifier(note, spendSecret) }) };
  } finally { recipient.secret.fill(0); }
}

// Exported only from this internal module for fixed RFC 9180 test vectors.
export const hpkeTestInternals = { pair, shared, schedule };
