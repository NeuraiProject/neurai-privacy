import { argon2idAsync } from '@noble/hashes/argon2.js';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { NEURAI_TEST_VAULT_AAD_V1 } from './protocol-constants.js';

const utf8 = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const VAULT_AAD = utf8.encode(NEURAI_TEST_VAULT_AAD_V1);
const MEMORY_KIB = 64 * 1024;
const MAX_CIPHERTEXT = 16 * 1024 * 1024;

function bytesToHex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex, length, name) {
  if (typeof hex !== 'string' || !/^(?:[0-9a-f]{2})+$/i.test(hex) ||
      (length !== null && hex.length !== length * 2)) {
    throw new TypeError(`invalid wallet vault ${name}`);
  }
  return Uint8Array.from(hex.match(/../g), pair => parseInt(pair, 16));
}

function passwordBytes(password) {
  const bytes = typeof password === 'string' ? utf8.encode(password) : password;
  if (!(bytes instanceof Uint8Array) || bytes.length === 0) {
    throw new TypeError('nonempty wallet password required');
  }
  return bytes;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === 'object' && !(value instanceof Uint8Array)) {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalJson(value[key])]));
  }
  return value;
}

async function deriveKey(password, salt) {
  const key = await argon2idAsync(passwordBytes(password), salt,
    { t: 3, m: MEMORY_KIB, p: 1, dkLen: 32, maxmem: MEMORY_KIB * 1024 });
  return key;
}

/** Encrypt a TEST wallet payload as JSON compatible with the Python wallet vault. */
export async function sealVault(payload, password) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('wallet vault payload must be an object');
  }
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('secure browser randomness is required');
  }
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const nonce = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const plaintext = utf8.encode(JSON.stringify(canonicalJson(payload)));
  if (plaintext.length > MAX_CIPHERTEXT - 16) throw new RangeError('wallet vault payload too large');
  const key = await deriveKey(password, salt);
  try {
    const ciphertext = chacha20poly1305(key, nonce, VAULT_AAD).encrypt(plaintext);
    return JSON.stringify({ version: 1, kdf: 'argon2id', memory_kib: MEMORY_KIB,
      passes: 3, lanes: 1, salt: bytesToHex(salt), nonce: bytesToHex(nonce),
      ciphertext: bytesToHex(ciphertext) }) + '\n';
  } finally {
    key.fill(0);
    plaintext.fill(0);
  }
}

/** Open a TEST wallet payload created by this module or the Python CLI. */
export async function openVault(encoded, password) {
  const raw = encoded instanceof Uint8Array ? decoder.decode(encoded) : encoded;
  if (typeof raw !== 'string' || raw.length > MAX_CIPHERTEXT * 2 + 1024) {
    throw new TypeError('invalid wallet vault JSON');
  }
  const envelope = JSON.parse(raw);
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope) ||
      envelope.version !== 1 || envelope.kdf !== 'argon2id' ||
      envelope.memory_kib !== MEMORY_KIB || envelope.passes !== 3 || envelope.lanes !== 1) {
    throw new Error('unsupported wallet vault parameters');
  }
  const salt = hexToBytes(envelope.salt, 16, 'salt');
  const nonce = hexToBytes(envelope.nonce, 12, 'nonce');
  const ciphertext = hexToBytes(envelope.ciphertext, null, 'ciphertext');
  if (ciphertext.length < 16 || ciphertext.length > MAX_CIPHERTEXT) {
    throw new RangeError('invalid wallet vault ciphertext size');
  }
  const key = await deriveKey(password, salt);
  let plaintext;
  try {
    plaintext = chacha20poly1305(key, nonce, VAULT_AAD).decrypt(ciphertext);
    const payload = JSON.parse(decoder.decode(plaintext));
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('invalid wallet vault payload');
    }
    return payload;
  } finally {
    key.fill(0);
    plaintext?.fill(0);
  }
}
