/* NeuraiZK/v2 wallet root (2026-10-01): BIP-39 words + passphrase -> wallet
 * seed S, and S + ZK passphrase -> Argon2id root R. C7 (NeuraiZK/v3, c7.js)
 * derives its accounts and diversified nzk v3 addresses from R. Also exports the
 * bech32m codec and the HRPs of the nzk addresses. Wallet-only: no consensus,
 * circuit or note-format change.
 */
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { argon2idAsync } from '@noble/hashes/argon2.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha512 } from '@noble/hashes/sha2.js';

const utf8 = new TextEncoder();
const label = name => utf8.encode('NeuraiZK/v2/' + name);
export const NZK_DERIVATION = 'NeuraiZK/v2';
export const NZK_FAMILIES = Object.freeze({ legacy: 0, ecdsa: 1, pq: 2 });
export const NZK_ARGON2ID = Object.freeze({ t: 3, m: 64 * 1024, p: 1, dkLen: 64 });
export const NZK_HRP = Object.freeze({ mainnet: 'nzk', testnet: 'tnzk', regtest: 'rnzk' });
export const NZK_DEFAULT_GAP = 20;
export const NZK_MAX_GAP = 1000;

function fail(reason) { throw new Error('nzk: ' + reason); }
function concat(...parts) {
  const out = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  let at = 0;
  for (const part of parts) { out.set(part, at); at += part.length; }
  return out;
}
function u32le(value) {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, true);
  return out;
}

// BIP-350 bech32m without the 90-character limit of segwit addresses (as in ZIP-316).
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32M_CONST = 0x2bc830a3;
function polymod(values) {
  const gen = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const top = chk >>> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((top >>> i) & 1) chk ^= gen[i];
  }
  return chk >>> 0;
}
function expandHrp(hrp) {
  const codes = Array.from(hrp, c => c.charCodeAt(0));
  return [...codes.map(c => c >> 5), 0, ...codes.map(c => c & 31)];
}
function convertBits(data, from, to, pad) {
  let acc = 0, bits = 0;
  const out = [], max = (1 << to) - 1;
  for (const value of data) {
    acc = ((acc << from) | value) & 0xffffff;
    bits += from;
    while (bits >= to) { bits -= to; out.push((acc >> bits) & max); }
  }
  if (pad) { if (bits) out.push((acc << (to - bits)) & max); }
  else if (bits >= from || ((acc << (to - bits)) & max)) fail('invalid bit padding');
  return out;
}
/** Encode bytes as bech32m with a lower-case HRP. */
export function bech32mEncode(hrp, bytes) {
  if (!/^[a-z]{1,83}$/.test(hrp)) fail('invalid HRP');
  const data = convertBits(bytes, 8, 5, true);
  const mod = polymod([...expandHrp(hrp), ...data, 0, 0, 0, 0, 0, 0]) ^ BECH32M_CONST;
  const checksum = [0, 1, 2, 3, 4, 5].map(i => (mod >>> (5 * (5 - i))) & 31);
  return hrp + '1' + [...data, ...checksum].map(v => CHARSET[v]).join('');
}
/** Decode a bech32m string; rejects mixed case, bech32 checksums and non-zero padding. */
export function bech32mDecode(text) {
  if (typeof text !== 'string' || text.length > 1023) fail('address must be a string');
  if (text !== text.toLowerCase() && text !== text.toUpperCase()) fail('mixed-case address');
  const s = text.toLowerCase();
  const sep = s.lastIndexOf('1');
  if (sep < 1 || s.length - sep - 1 < 6) fail('malformed address');
  const hrp = s.slice(0, sep);
  const data = Array.from(s.slice(sep + 1), c => {
    const v = CHARSET.indexOf(c);
    if (v < 0) fail('invalid address character');
    return v;
  });
  if (polymod([...expandHrp(hrp), ...data]) !== BECH32M_CONST) fail('invalid bech32m checksum');
  return { hrp, bytes: Uint8Array.from(convertBits(data.slice(0, -6), 5, 8, false)) };
}

/** BIP-39 English words, validated and normalized; passphrase whitespace is significant. */
export async function walletSeedFromMnemonic(mnemonic, passphrase = '') {
  if (typeof mnemonic !== 'string' || !mnemonic.trim()) fail('mnemonic required');
  if (typeof passphrase !== 'string') fail('passphrase must be a string');
  const canonical = mnemonic.normalize('NFKD').trim().split(/\s+/u).join(' ');
  if (!validateMnemonic(canonical, wordlist)) fail('invalid English BIP39 mnemonic');
  return pbkdf2Async(sha512, utf8.encode(canonical),
    utf8.encode('mnemonic' + passphrase.normalize('NFKD')), { c: 2048, dkLen: 64 });
}

/** ZK root R = Argon2id(S || u32le(len(Z)) || Z). Memory-hard on purpose. */
export async function deriveZkRoot(seed, zkPassphrase = '') {
  if (!(seed instanceof Uint8Array) || seed.length !== 64) fail('wallet seed must be 64 bytes');
  if (typeof zkPassphrase !== 'string') fail('ZK passphrase must be a string');
  const z = utf8.encode(zkPassphrase.normalize('NFKD'));
  if (z.length > 0xffffffff) fail('ZK passphrase is too long');
  const password = concat(seed, u32le(z.length), z);
  try {
    return await argon2idAsync(password, label('root'), { ...NZK_ARGON2ID, version: 0x13, maxmem: NZK_ARGON2ID.m * 1024 });
  } finally { password.fill(0); z.fill(0); }
}
