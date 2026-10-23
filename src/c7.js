/** C7 (NeuraiZK/v3) notes for the XNA privacy pool: one viewing key per
 * account, unlinkable diversified nzk v3 addresses and 230-byte note records
 * with a one-byte view tag, over ristretto255 (adapted from Zcash Orchard).
 * Byte-level specification and shared vectors: Neurai-DePIN
 * contrib/privacypool/privacy-c7. TEST deployments only; not audited.
 */
import { ristretto255, ristretto255_hasher } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { blake2b } from '@noble/hashes/blake2.js';
import { extract, expand } from '@noble/hashes/hkdf.js';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { BinaryFF1 } from '@noble/ciphers/ff1.js';
import { encodeNote, decodeNote, noteCommitment } from './notes.js';
import { poseidonBytes } from './poseidon.js';
import { c4Context } from './c4-publication.js';
import { bech32mEncode, bech32mDecode, NZK_FAMILIES, NZK_HRP } from './zk-wallet.js';

export const C7_PROFILE = 'C7-XNA-TEST-v1';
export const C7_DERIVATION = 'NeuraiZK/v3';
export const C7_RECORD_BYTES = 230;
export const C7_ADDRESS_VERSION = 3;
const NOTE_BYTES = 169;
const MAX_INDEX = 0x7fffffff;
const MAX_AMOUNT = 2100000000000000000n;
const L = 2n ** 252n + 27742317777372353535851937790883648493n;
const FR = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001n;
const DST_GD = 'NeuraiZKv3-gd';
const NONCE = new Uint8Array(12);
const utf8 = s => new TextEncoder().encode(s);
const Point = ristretto255.Point;

/** Failure with the reason name used by the shared vectors (e.g. "vtag-mismatch"). */
export class C7Error extends Error {
  constructor(reason, detail = '') {
    super(detail ? `C7 ${reason}: ${detail}` : `C7 ${reason}`);
    this.reason = reason;
  }
}
const fail = (reason, detail) => { throw new C7Error(reason, detail); };

function concat(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}
const hex = b => Array.from(b, v => v.toString(16).padStart(2, '0')).join('');
function unhex(text, length, label) {
  if (typeof text !== 'string' || !/^(?:[0-9a-f]{2})*$/i.test(text) || (length !== undefined && text.length !== 2 * length)) {
    throw new TypeError(`${label} must be ${length ?? 'canonical'} bytes of hex`);
  }
  return Uint8Array.from(text.match(/../g) ?? [], v => parseInt(v, 16));
}
function bytes(value, length, label) {
  if (typeof value === 'string') return unhex(value, length, label);
  if (!(value instanceof Uint8Array) || value.length !== length) throw new TypeError(`${label} must be ${length} bytes`);
  return value;
}
const equal = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const isZero = b => b.every(v => v === 0);
const u32le = n => Uint8Array.of(n & 255, (n >>> 8) & 255, (n >>> 16) & 255, n >>> 24);
const leInt = b => b.reduceRight((acc, v) => (acc << 8n) | BigInt(v), 0n);
const beInt = b => b.reduce((acc, v) => (acc << 8n) | BigInt(v), 0n);
const leBytes = (v, n) => Uint8Array.from({ length: n }, (_, i) => Number((v >> BigInt(8 * i)) & 255n));
function personal(text) { const out = new Uint8Array(16); out.set(utf8(text)); return out; }
const blake = (data, label, size) => blake2b(data, { dkLen: size, personalization: personal(label) });
const toScalar = wide => leInt(wide) % L;
function index31(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_INDEX) throw new RangeError(`${label} must be in [0, 2^31 - 1]`);
  return value;
}
function hrpFor(network) {
  const hrp = NZK_HRP[network];
  if (!hrp) throw new Error('unknown network');
  return hrp;
}

/** Asset identifier of XNA in C7 pools. */
export function c7XnaAssetId() { return sha256(utf8('NeuraiPool/asset/XNA')); }

/** Domain of one C7 instance from its birth data; hashes in display (RPC) order,
 * emission as "txid:vout", identity as the UNIQUE name NAME#POOL. */
export function c7PoolDomain({ genesis, emission, identity }) {
  const match = /^([0-9a-f]{64}):(\d{1,10})$/.exec(emission ?? '');
  if (!match || Number(match[2]) > 0xffffffff) throw new TypeError('emission must be "txid:vout"');
  const name = utf8(identity ?? '');
  if (name.length < 1 || name.length > 64 || name.some(c => c < 0x21 || c > 0x7e)) throw new TypeError('invalid pool identity');
  return sha256(concat(utf8('NeuraiPoolC7/domain'), [1], unhex(genesis, 32, 'genesis').reverse(),
    unhex(match[1], 32, 'emission txid').reverse(), u32le(Number(match[2])), [name.length], name));
}

/** Public input 0 of every proof (same construction as C6). */
export function c7Context(domain, assetId) {
  return c4Context({ domain: bytes(domain, 32, 'domain'), assetId: bytes(assetId, 32, 'assetId'), unit: 1n });
}

export function c7InstanceTag(domain, assetId) {
  return sha256(concat(utf8('NeuraiZK/v3/instance'), bytes(domain, 32, 'domain'), bytes(assetId, 32, 'assetId'))).slice(0, 4);
}

const ff1Keys = new Map();
function ff1(dk) {
  const id = hex(dk);
  if (!ff1Keys.has(id)) ff1Keys.set(id, BinaryFF1(dk));
  return ff1Keys.get(id);
}
/** d = LEBS2OSP_88(FF1-AES256(dk, "", radix 2, I2LEBSP_88(j))), as Zcash diversifiers. */
export const c7Diversifier = (dk, j) => ff1(dk).encrypt(leBytes(BigInt(j), 11));
export const c7DiversifierIndex = (dk, d) => leInt(ff1(dk).decrypt(d));

/** G_d = hash_to_ristretto255(d || domain || assetId, "NeuraiZKv3-gd"). */
function diversifyHash(d, domain, assetId) {
  const point = ristretto255_hasher.hashToCurve(concat(d, domain, assetId), { DST: DST_GD });
  if (point.equals(Point.ZERO)) fail('diversifier-identity');
  return point;
}
function decodePoint(encoded) {
  try { return Point.fromBytes(encoded); } catch { return null; }
}
function tagAndKey(shared, epk) {
  const input = concat(shared, epk);
  return { vtag: blake(input, 'NeuraiZKv3_vtag', 32)[0], key: blake(input, 'NeuraiZKv3_KDF', 32) };
}
const esk = (rho, domain, assetId) => toScalar(blake(concat(rho, domain, assetId), 'NeuraiZKv3_esk', 64));
const noteAad = (domain, cm) => concat(utf8('NIP043/note/CP2'), domain, cm);
const canonicalOwner = owner => { const v = beInt(owner); return v !== 0n && v < FR; };

/** True for a C7 receiving descriptor {domain, asset_id, owner, view_pub (= pk_d), d}. */
export const isC7Descriptor = value => !!value && typeof value === 'object' && typeof value.d === 'string';

function checkDescriptor(descriptor) {
  if (!isC7Descriptor(descriptor)) throw new TypeError('C7 receiving descriptor required');
  const owner = bytes(descriptor.owner, 32, 'owner'), pkd = bytes(descriptor.view_pub, 32, 'pk_d');
  if (!canonicalOwner(owner)) fail('owner-invalid');
  const point = decodePoint(pkd);
  if (!point || point.equals(Point.ZERO)) fail('pk_d-invalid');
  return { domain: bytes(descriptor.domain, 32, 'domain'), assetId: bytes(descriptor.asset_id, 32, 'asset_id'), owner,
    d: bytes(descriptor.d, 11, 'diversifier'), pkd, pkdPoint: point };
}

/** nzk v3 address: Bech32m of 0x03 || owner || d || pk_d || instance tag (80 bytes). */
export function encodeC7Address(descriptor, network) {
  const r = checkDescriptor(descriptor);
  return bech32mEncode(hrpFor(network), concat([C7_ADDRESS_VERSION], r.owner, r.d, r.pkd, c7InstanceTag(r.domain, r.assetId)));
}

/** Decodes and validates an nzk v3 address of one network and pool instance. */
export function decodeC7Address(address, { network, domain, assetId }) {
  let decoded;
  try { decoded = bech32mDecode(address); } catch { fail('address-encoding'); }
  if (decoded.hrp !== hrpFor(network)) fail('address-hrp');
  const p = decoded.bytes;
  if (p.length !== 80) fail('address-length');
  if (p[0] !== C7_ADDRESS_VERSION) fail('address-version');
  if (!equal(p.subarray(76), c7InstanceTag(domain, assetId))) fail('address-instance');
  const descriptor = { domain: hex(bytes(domain, 32, 'domain')), asset_id: hex(bytes(assetId, 32, 'assetId')),
    owner: hex(p.subarray(1, 33)), view_pub: hex(p.subarray(44, 76)), d: hex(p.subarray(33, 44)) };
  if (!canonicalOwner(p.subarray(1, 33))) fail('owner-invalid');
  const point = decodePoint(p.subarray(44, 76));
  if (!point || point.equals(Point.ZERO)) fail('pk_d-invalid');
  return descriptor;
}

/** Sender side: the 230-byte record of a new note. rho must be fresh and secret
 * (random by default); it fixes esk, the commitment and the nullifier. */
export function sealC7Note({ descriptor, amountAtomic, rho }) {
  const r = checkDescriptor(descriptor);
  for (let attempt = 0; attempt < 4; attempt++) {
    const seed = rho ? bytes(rho, 32, 'rho') : globalThis.crypto.getRandomValues(new Uint8Array(32));
    const note = encodeNote({ domain: r.domain, assetId: r.assetId, owner: r.owner, viewPub: r.pkd, amountAtomic, rho: seed });
    const cm = noteCommitment(note);
    const k = esk(seed, r.domain, r.assetId);
    if (k === 0n) { if (rho) fail('esk-zero'); continue; }
    const gd = diversifyHash(r.d, r.domain, r.assetId);
    const epk = gd.multiply(k).toBytes();
    const { vtag, key } = tagAndKey(r.pkdPoint.multiply(k).toBytes(), epk);
    const ct = chacha20poly1305(key, NONCE, noteAad(r.domain, cm)).encrypt(concat(note, r.d));
    key.fill(0);
    return { note, cm, record: concat([2, vtag], epk, ct) };
  }
  fail('esk-zero');
}

/** Keys of one (family, account) for one C7 instance, from the NeuraiZK/v2
 * private root R: ivk and dk for the account, spendSecret per address. */
export class C7Account {
  #prk;
  #q;
  #ivk;
  #dk;
  #family;
  #account;
  #domain;
  #assetId;

  constructor(root, { family, account = 0, domain, assetId }) {
    if (!(root instanceof Uint8Array) || root.length !== 64) throw new TypeError('ZK root must be 64 bytes');
    if (!Object.hasOwn(NZK_FAMILIES, family)) throw new TypeError('family must be legacy, ecdsa or pq');
    this.#family = NZK_FAMILIES[family];
    this.#account = index31(account, 'account');
    this.#domain = bytes(domain, 32, 'domain').slice();
    this.#assetId = bytes(assetId, 32, 'assetId').slice();
    this.#prk = extract(sha256, root, utf8('NeuraiZK/v2/account'));
    this.#q = concat([this.#family], u32le(this.#account), this.#domain, this.#assetId);
    const seed = this.expand32('NeuraiZK/v3/ivk', this.#q);
    this.#ivk = toScalar(blake(seed, 'NeuraiZKv3_ivk', 64));
    seed.fill(0);
    if (this.#ivk === 0n) fail('ivk-zero', 'derivation fails without retrying');
    this.#dk = this.expand32('NeuraiZK/v3/dk', this.#q);
  }

  get domain() { return this.#domain.slice(); }
  get assetId() { return this.#assetId.slice(); }

  expand32(label, scope) { this.#assertOpen(); return expand(sha256, this.#prk, concat(utf8(label), scope), 32); }

  #assertOpen() { if (!this.#prk) throw new Error('C7 account is locked'); }

  #scope(chain, index) {
    if (chain !== 0 && chain !== 1) fail('index-out-of-range');
    index31(index, 'address index');
    return concat([this.#family], u32le(this.#account), u32le(chain), u32le(index), this.#domain, this.#assetId);
  }

  /** spendSecret, owner and nk of one address. Callers must zero spendSecret. */
  spendKeys(chain, index) {
    const spendSecret = this.expand32('NeuraiZK/v3/spend', this.#scope(chain, index));
    if (isZero(spendSecret)) fail('spend-secret-zero');
    const owner = poseidonBytes(concat(utf8('NIP043/owner/CP1'), this.#domain, spendSecret));
    const nk = poseidonBytes(concat(utf8('NIP043/nk/CP1'), this.#domain, spendSecret));
    return { spendSecret, owner, nk };
  }

  /** Receiving descriptor of address (chain, index). */
  descriptor(chain, index) {
    const keys = this.spendKeys(chain, index);
    keys.spendSecret.fill(0);
    const d = c7Diversifier(this.#dk, BigInt(chain) * 2n ** 32n + BigInt(index));
    const pkd = diversifyHash(d, this.#domain, this.#assetId).multiply(this.#ivk);
    if (pkd.equals(Point.ZERO)) fail('pk_d-identity');
    return { domain: hex(this.#domain), asset_id: hex(this.#assetId), owner: hex(keys.owner),
      view_pub: hex(pkd.toBytes()), d: hex(d) };
  }

  /** Receive-only scan (steps 1 to 8); full=true adds ownership and nullifier
   * (steps 9 and 10). Throws C7Error with the reason of the first failed step. */
  scan(record, cm, { full = true, checkTag = true } = {}) {
    this.#assertOpen();
    if (!(record instanceof Uint8Array) || record.length !== C7_RECORD_BYTES) fail('record-length');
    if (record[0] !== 2) fail('record-version');
    bytes(cm, 32, 'commitment');
    const epk = record.subarray(2, 34), epkPoint = decodePoint(epk);
    if (!epkPoint) fail('epk-invalid');
    if (epkPoint.equals(Point.ZERO)) fail('epk-identity');
    const { vtag, key } = tagAndKey(epkPoint.multiply(this.#ivk).toBytes(), epk);
    if (checkTag && vtag !== record[1]) { key.fill(0); fail('vtag-mismatch'); }
    let plain;
    try { plain = chacha20poly1305(key, NONCE, noteAad(this.#domain, cm)).decrypt(record.subarray(34)); }
    catch { fail('aead-failed'); }
    finally { key.fill(0); }
    const note = plain.slice(0, NOTE_BYTES), d = plain.slice(NOTE_BYTES);
    if (note[0] !== 1) fail('note-malformed');
    if (!equal(note.subarray(1, 33), this.#domain) || !equal(note.subarray(33, 65), this.#assetId)) fail('note-instance');
    let decoded;
    try { decoded = decodeNote(note); } catch { fail('note-malformed'); }
    if (!canonicalOwner(decoded.owner) || decoded.amountAtomic < 1n || decoded.amountAtomic > MAX_AMOUNT) fail('note-malformed');
    const j = c7DiversifierIndex(this.#dk, d), chain = j >> 32n, index = j & 0xffffffffn;
    if (chain > 1n || index > BigInt(MAX_INDEX)) fail('index-out-of-range');
    const gd = diversifyHash(d, this.#domain, this.#assetId);
    if (!equal(gd.multiply(this.#ivk).toBytes(), decoded.viewPub)) fail('pk_d-mismatch');
    const k = esk(decoded.rho, this.#domain, this.#assetId);
    if (k === 0n || !equal(gd.multiply(k).toBytes(), epk)) fail('epk-mismatch');
    if (!equal(noteCommitment(note), cm)) fail('cm-mismatch');
    const found = { status: 'received', ownership: 'unverified', chain: Number(chain), index: Number(index),
      amountAtomic: decoded.amountAtomic, note, d, cm: cm.slice() };
    if (!full) return found;
    const keys = this.spendKeys(found.chain, found.index);
    try {
      if (!equal(keys.owner, decoded.owner)) fail('owner-mismatch');
      const nf = poseidonBytes(concat(utf8('NIP043/nf/CP1'), this.#domain, keys.nk, decoded.rho, cm));
      return { ...found, status: 'owned', ownership: 'verified', nf };
    } finally { keys.spendSecret.fill(0); }
  }

  lock() {
    this.#prk?.fill(0);
    this.#dk?.fill(0);
    this.#prk = null;
    this.#dk = null;
    this.#ivk = 0n;
  }
}

/** Format of note records in a publication: 230 bytes with version byte 0x02. */
export function isC7Record(record) {
  return record instanceof Uint8Array && record.length === C7_RECORD_BYTES && record[0] === 2;
}
