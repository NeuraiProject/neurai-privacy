/* Deterministic ZK identities and nzk addresses (NeuraiZK/v2, 2026-10-01).
 *
 * Wallet seed (BIP-39 words + passphrase) + ZK passphrase -> Argon2id root ->
 * HKDF keys per family, account, chain (0 receiving, 1 change) and address index, bound
 * to one pool instance. Each address has its own spend secret and view seed, so
 * receiving addresses can rotate without linking them. Wallet-only: no consensus,
 * circuit or note-format change. The webwallet consumes the bundled package.
 */
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { argon2idAsync } from '@noble/hashes/argon2.js';
import { extract, expand } from '@noble/hashes/hkdf.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { BrowserTestIdentity } from './browser-wallet.js';
import { sealScanCheckpoint, openScanCheckpoint } from './checkpoint-crypto.js';
import { deriveOwner } from './notes.js';
import { deriveViewPublic } from './hpke.js';

const utf8 = new TextEncoder();
const label = name => utf8.encode('NeuraiZK/v2/' + name);
export const NZK_DERIVATION = 'NeuraiZK/v2';
export const NZK_FAMILIES = Object.freeze({ legacy: 0, ecdsa: 1, pq: 2 });
function familyByte(family) {
  if (!Object.hasOwn(NZK_FAMILIES, family)) fail('family must be legacy, ecdsa or pq');
  return Uint8Array.of(NZK_FAMILIES[family]);
}
function accountScope({ family, account = 0, domain, assetId }) {
  return concat(familyByte(family), u32le(index31(account, 'account')), bytes32(domain, 'domain'), bytes32(assetId, 'assetId'));
}
export const NZK_ARGON2ID = Object.freeze({ t: 3, m: 64 * 1024, p: 1, dkLen: 64 });
export const NZK_HRP = Object.freeze({ mainnet: 'nzk', testnet: 'tnzk', regtest: 'rnzk' });
export const NZK_DEFAULT_GAP = 20;
export const NZK_MAX_GAP = 1000;
const CHAIN_RECEIVING = 0;
const CHAIN_CHANGE = 1;
const MAX_INDEX = 2 ** 31;
const PAYLOAD_BYTES = 69;
const FR = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001n;
const P25519 = 2n ** 255n - 19n;
// Canonical u-coordinates of Curve25519 and twist points of order dividing 8.
// Any clamped scalar maps them to zero, so a shared secret would be all zeros.
const SMALL_ORDER_U = new Set([0n, 1n, P25519 - 1n,
  0x00b8495f16056286fdb1329ceb8d09da6ac49ff1fae35616aeb8413b7c7aebe0n,
  0x57119fd0dd4e22d8868e1c58c45c44045bef839c55b1d0b1248c50a3bc959c5fn]);

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
function hex(bytes) { return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''); }
function bytes32(value, name) {
  if (value instanceof Uint8Array && value.length === 32) return value;
  if (typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value)) return Uint8Array.from(value.match(/../g), b => parseInt(b, 16));
  return fail(name + ' must be 32 bytes');
}
function beInt(bytes) { return BigInt('0x' + (hex(bytes) || '0')); }
function leInt(bytes) { return beInt(Uint8Array.from(bytes).reverse()); }
function index31(value, name) {
  if (!Number.isInteger(value) || value < 0 || value >= MAX_INDEX) fail(name + ' must be an integer in [0, 2^31)');
  return value;
}
function hrpFor(network) {
  const hrp = NZK_HRP[network];
  if (!hrp) fail('unknown network');
  return hrp;
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

function accountPrk(root) {
  if (!(root instanceof Uint8Array) || root.length !== 64) fail('ZK root must be 64 bytes');
  return extract(sha256, root, label('account'));
}
function fingerprintFromPrk(prk, options) {
  return hex(sha256(expand(sha256, prk, concat(label('fingerprint'), accountScope(options)), 32)).subarray(0, 4));
}

/** Local comparison hint only; never an authentication token or storage identifier. */
export function zkFingerprint(root, options) {
  const prk = accountPrk(root);
  try { return fingerprintFromPrk(prk, options); } finally { prk.fill(0); }
}

function keysFromPrk(prk, { family, account = 0, chain, index, domain, assetId }) {
  index31(account, 'account');
  index31(index, 'address index');
  if (chain !== CHAIN_RECEIVING && chain !== CHAIN_CHANGE) fail('chain must be 0 (receiving) or 1 (change)');
  const scope = concat(familyByte(family), u32le(account), u32le(chain), u32le(index), bytes32(domain, 'domain'), bytes32(assetId, 'assetId'));
  const spendSecret = expand(sha256, prk, concat(label('spend'), scope), 32);
  const viewSeed = expand(sha256, prk, concat(label('view'), scope), 32);
  if (spendSecret.every(b => b === 0)) fail('invalid derived spend secret');
  return { spendSecret, viewSeed };
}

/** Spend secret and view seed of one address. Callers must zero them after use. */
export function deriveZkAddressKeys(root, options) {
  const prk = accountPrk(root);
  try { return keysFromPrk(prk, options); } finally { prk.fill(0); }
}

/** Four-byte tag that binds an address to one pool instance; not a security control. */
export function nzkInstanceTag(domain, assetId) {
  return sha256(concat(utf8.encode('NeuraiZK/v1/instance'), bytes32(domain, 'domain'), bytes32(assetId, 'assetId'))).subarray(0, 4);
}

/** Encode a receiving descriptor {domain, asset_id, owner, view_pub} as an nzk address. */
export function encodeNzkAddress(descriptor, network) {
  if (!descriptor || typeof descriptor !== 'object') fail('descriptor required');
  const owner = bytes32(descriptor.owner, 'owner');
  const viewPub = bytes32(descriptor.view_pub, 'view_pub');
  checkOwner(owner);
  checkViewPublic(viewPub);
  const payload = concat(Uint8Array.of(1), owner, viewPub, nzkInstanceTag(descriptor.domain, descriptor.asset_id));
  return bech32mEncode(hrpFor(network), payload);
}

function checkOwner(owner) {
  const value = beInt(owner);
  if (value === 0n || value >= FR) fail('owner is not a canonical non-zero field element');
}
function checkViewPublic(viewPub) {
  const u = leInt(viewPub);
  if (u >= P25519) fail('view key is not a canonical X25519 coordinate');
  if (SMALL_ORDER_U.has(u)) fail('view key has small order');
}

/** Decode and fully validate an nzk address for one network and pool instance. */
export function decodeNzkAddress(address, { network, domain, assetId }) {
  const { hrp, bytes } = bech32mDecode(address);
  if (hrp !== hrpFor(network)) fail('address belongs to another network');
  if (bytes.length !== PAYLOAD_BYTES) fail('invalid address length');
  if (bytes[0] !== 1) fail('unsupported address version');
  const owner = bytes.subarray(1, 33), viewPub = bytes.subarray(33, 65), tag = bytes.subarray(65, 69);
  const expected = nzkInstanceTag(domain, assetId);
  if (tag.some((b, i) => b !== expected[i])) fail('address belongs to another pool instance');
  checkOwner(owner);
  checkViewPublic(viewPub);
  return { domain: hex(bytes32(domain, 'domain')), asset_id: hex(bytes32(assetId, 'assetId')),
    owner: hex(owner), view_pub: hex(viewPub) };
}

/** Validate nzk text, JSON text and descriptor objects through the same checks. */
export function parseRecipient(input, { network, domain, assetId }) {
  let descriptor;
  if (typeof input === 'string') {
    const value = input.trim();
    if (!value) fail('recipient required');
    if (value[0] !== '{') return decodeNzkAddress(value, { network, domain, assetId });
    try { descriptor = JSON.parse(value); } catch { fail('recipient is neither an nzk address nor a JSON descriptor'); }
  } else {
    descriptor = input;
  }
  if (!descriptor || typeof descriptor !== 'object' || Array.isArray(descriptor)) {
    fail('recipient must be an nzk address or a descriptor');
  }
  const normalized = { domain: hex(bytes32(descriptor.domain, 'domain')), asset_id: hex(bytes32(descriptor.asset_id, 'asset_id')),
    owner: hex(bytes32(descriptor.owner, 'owner')), view_pub: hex(bytes32(descriptor.view_pub, 'view_pub')) };
  if (normalized.domain !== hex(bytes32(domain, 'domain')) || normalized.asset_id !== hex(bytes32(assetId, 'assetId'))) {
    fail('recipient belongs to another pool instance');
  }
  checkOwner(bytes32(normalized.owner, 'owner'));
  checkViewPublic(bytes32(normalized.view_pub, 'view_pub'));
  return normalized;
}

/**
 * Multi-address identity derived from the wallet seed. It exposes the same
 * methods the pool worker uses on BrowserTestIdentity, plus address rotation.
 */
export class ZkWalletIdentity {
  #prk;
  #domain;
  #assetId;
  #account;
  #family;
  #storageId;
  #network;
  #fingerprint;
  #gap = NZK_DEFAULT_GAP;
  #issued = 0;
  #used = new Set();
  #maxUsed = -1;
  #identities = new Map();

  constructor(prk, { family, account = 0, domain, assetId, network, gap, issued }) {
    const scope = accountScope({ family, account, domain, assetId });
    this.#family = family;
    this.#prk = prk.slice();
    this.#account = index31(account, 'account');
    this.#domain = hex(bytes32(domain, 'domain'));
    this.#assetId = hex(bytes32(assetId, 'assetId'));
    hrpFor(network);
    this.#network = network;
    this.#fingerprint = fingerprintFromPrk(this.#prk, { family, account, domain, assetId });
    this.#storageId = hex(sha256(expand(sha256, this.#prk, concat(label('storage'), scope), 32)));
    if (gap !== undefined) this.setGap(gap);
    if (issued !== undefined) this.setIssued(issued);
  }

  static async fromMnemonic({ mnemonic, passphrase = '', zkPassphrase = '', ...options }) {
    accountScope(options); // Fail before running the expensive KDF.
    const seed = await walletSeedFromMnemonic(mnemonic, passphrase);
    try { return await ZkWalletIdentity.fromSeed({ seed, zkPassphrase, ...options }); } finally { seed.fill(0); }
  }

  static async fromSeed({ seed, zkPassphrase = '', ...options }) {
    accountScope(options);
    const root = await deriveZkRoot(seed, zkPassphrase);
    try { return ZkWalletIdentity.fromRoot({ root, ...options }); } finally { root.fill(0); }
  }

  /** For callers that already derived R, such as tests. */
  static fromRoot({ root, ...options }) {
    const prk = accountPrk(root);
    try { return new ZkWalletIdentity(prk, options); } finally { prk.fill(0); }
  }

  #assertOpen() { if (!this.#prk) fail('identity is locked'); }

  get derivation() { return NZK_DERIVATION; }
  get family() { return this.#family; }
  get storageId() { return this.#storageId; }
  get fingerprint() { return this.#fingerprint; }
  get account() { return this.#account; }
  get network() { return this.#network; }
  get gap() { return this.#gap; }
  get issued() { return this.#issued; }
  get maxUsed() { return this.#maxUsed; }
  get usedIndexes() { return [...this.#used].sort((a, b) => a - b); }

  setGap(gap) {
    if (!Number.isInteger(gap) || gap < 1 || gap > NZK_MAX_GAP) fail(`gap must be an integer in [1, ${NZK_MAX_GAP}]`);
    this.#gap = gap;
  }
  setIssued(index) { this.#issued = index31(index, 'issued index'); }

  /** Sub-identity for one address; created on demand and cached. */
  identityAt(chain, index) {
    this.#assertOpen();
    const key = chain + '/' + index;
    let identity = this.#identities.get(key);
    if (!identity) {
      const { spendSecret, viewSeed } = keysFromPrk(this.#prk, { family: this.#family, account: this.#account, chain, index,
        domain: this.#domain, assetId: this.#assetId });
      try {
        identity = new BrowserTestIdentity(spendSecret, viewSeed, bytes32(this.#domain), bytes32(this.#assetId), null);
      } finally { spendSecret.fill(0); viewSeed.fill(0); }
      this.#identities.set(key, identity);
    }
    return identity;
  }

  descriptorAt(chain, index) { return this.identityAt(chain, index).recipient(); }
  addressAt(chain, index) { return encodeNzkAddress(this.descriptorAt(chain, index), this.#network); }

  /** First receiving index after the highest used one, or the last one handed out if later. */
  currentIndex() { return Math.max(this.#maxUsed + 1, this.#issued); }
  /** Receiving descriptor to show and share now. */
  recipient() { return this.descriptorAt(CHAIN_RECEIVING, this.currentIndex()); }
  /** Descriptor for the wallet's own notes: deposits, change and self-assignments. */
  selfRecipient() { return this.descriptorAt(CHAIN_CHANGE, 0); }

  /** Hand out the next receiving address; beyond the gap only when forced. */
  issueNext({ force = false } = {}) {
    const next = this.currentIndex() + 1;
    if (!force && next > this.#maxUsed + this.#gap) {
      fail(`more than ${this.#gap} unused addresses would exist; recovery might not find them`);
    }
    this.#issued = index31(next, 'issued index');
    return next;
  }

  /**
   * Trial-decrypt pool records with the change address and receiving addresses,
   * extending the window until `gap` consecutive unused addresses follow the
   * highest used one. Order of records does not matter.
   */
  scanRecords(entries, knownAddresses = []) {
    this.#assertOpen();
    this.#used = new Set(knownAddresses.filter(address => address?.chain === CHAIN_RECEIVING)
      .map(address => index31(address.index, 'known address index')));
    this.#maxUsed = this.#used.size ? Math.max(...this.#used) : -1;
    const found = new Map();
    const tryAddress = (chain, index) => {
      const identity = this.identityAt(chain, index);
      entries.forEach((entry, position) => {
        if (found.has(position)) return;
        let owned = null;
        try { owned = identity.openRecord(entry.record, entry.cm); } catch { owned = null; }
        if (!owned) return;
        found.set(position, { position, owned, address: { chain, index } });
        if (chain === CHAIN_RECEIVING) {
          this.#used.add(index);
          this.#maxUsed = Math.max(this.#maxUsed, index);
        }
      });
    };
    tryAddress(CHAIN_CHANGE, 0);
    let end = Math.max(this.#gap - 1, this.#issued);
    for (let index = 0; index <= end; index++) {
      tryAddress(CHAIN_RECEIVING, index);
      end = Math.max(end, this.#maxUsed + this.#gap);
    }
    return [...found.values()].sort((a, b) => a.position - b.position);
  }

  /** Compatibility with single-key callers: try the change address, then receiving addresses. */
  openRecord(record, cm) {
    for (const [chain, index] of [[CHAIN_CHANGE, 0], ...Array.from({ length: this.currentIndex() + this.#gap }, (_, i) => [CHAIN_RECEIVING, i])]) {
      try {
        const owned = this.identityAt(chain, index).openRecord(record, cm);
        if (owned) return owned;
      } catch { /* another address */ }
    }
    return null;
  }

  createNote(recipient, amountAtomic) { return this.identityAt(CHAIN_CHANGE, 0).createNote(recipient, amountAtomic); }

  /** Spend with the key of the address that received the consumed note. */
  spendingIdentity(consumed) {
    const address = consumed?.address;
    if (!consumed) return this.identityAt(CHAIN_CHANGE, 0);
    if (!address || (address.chain !== CHAIN_RECEIVING && address.chain !== CHAIN_CHANGE)) fail('note has no known address');
    return this.identityAt(address.chain, index31(address.index, 'address index'));
  }

  prepareC3(options) { return this.spendingIdentity(options.consumed).prepareC3(options); }
  prepareC4(options) { return this.spendingIdentity(options.consumed).prepareC4(options); }

  /** Derived identities are recovered from the words; there is no file backup. */
  backupJson() { return null; }

  #checkpointKey() {
    this.#assertOpen();
    return expand(sha256, this.#prk,
      concat(label('scan-checkpoint'), accountScope({ family: this.#family, account: this.#account, domain: this.#domain, assetId: this.#assetId })), 32);
  }

  sealCheckpoint(checkpoint) {
    const key = this.#checkpointKey();
    try { return sealScanCheckpoint(checkpoint, key); } finally { key.fill(0); }
  }

  openCheckpoint(encoded) {
    const key = this.#checkpointKey();
    try { return openScanCheckpoint(encoded, key); } finally { key.fill(0); }
  }

  lock() {
    for (const identity of this.#identities.values()) identity.lock();
    this.#identities.clear();
    this.#prk?.fill(0);
    this.#prk = null;
  }
}
