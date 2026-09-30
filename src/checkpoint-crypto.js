import { chacha20poly1305 } from '@noble/ciphers/chacha.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const AAD = encoder.encode('Neurai/privacy/scan-checkpoint/v1');
const MAX_BYTES = 32 * 1024 * 1024;
const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
function unhex(value) {
  if (typeof value !== 'string' || !/^(?:[0-9a-f]{2})+$/i.test(value)) throw new Error('Invalid scan checkpoint');
  return Uint8Array.from(value.match(/../g), pair => parseInt(pair, 16));
}

/** Encrypt and authenticate a public-chain checkpoint with a wallet-derived key. */
export function sealScanCheckpoint(checkpoint, key) {
  if (!globalThis.crypto?.getRandomValues) throw new Error('Secure randomness is required');
  const plaintext = encoder.encode(JSON.stringify(checkpoint));
  if (plaintext.length > MAX_BYTES) throw new RangeError('Scan checkpoint is too large');
  const nonce = globalThis.crypto.getRandomValues(new Uint8Array(12));
  try {
    return JSON.stringify({ version: 1, nonce: hex(nonce), ciphertext: hex(chacha20poly1305(key, nonce, AAD).encrypt(plaintext)) });
  } finally { plaintext.fill(0); }
}

export function openScanCheckpoint(encoded, key) {
  if (typeof encoded !== 'string' || encoded.length > (MAX_BYTES + 16) * 2 + 100) throw new Error('Invalid scan checkpoint');
  const envelope = JSON.parse(encoded);
  if (envelope?.version !== 1) throw new Error('Unsupported scan checkpoint');
  const nonce = unhex(envelope.nonce);
  const ciphertext = unhex(envelope.ciphertext);
  if (nonce.length !== 12 || ciphertext.length < 16 || ciphertext.length > MAX_BYTES + 16) throw new Error('Invalid scan checkpoint');
  const plaintext = chacha20poly1305(key, nonce, AAD).decrypt(ciphertext);
  try { return JSON.parse(decoder.decode(plaintext)); }
  finally { plaintext.fill(0); }
}
