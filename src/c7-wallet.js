/** C7 private wallet derived from the wallet words (NeuraiZK/v3 on the v2 root).
 * It exposes the methods the C6/C7 pool worker uses on ZkWalletIdentity, but
 * scanning costs one ristretto255 multiplication per record whatever the
 * number of addresses: there is no address window to search.
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { C7Account, C7_DERIVATION, encodeC7Address } from './c7.js';
import { walletSeedFromMnemonic, deriveZkRoot, NZK_DEFAULT_GAP, NZK_HRP, NZK_FAMILIES } from './zk-wallet.js';
import { sealScanCheckpoint, openScanCheckpoint } from './checkpoint-crypto.js';

const CHAIN_RECEIVING = 0;
const CHAIN_CHANGE = 1;
const MAX_INDEX = 0x7fffffff;
const utf8 = s => new TextEncoder().encode(s);
const hex = b => Array.from(b, v => v.toString(16).padStart(2, '0')).join('');
function index31(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_INDEX) throw new RangeError(`${label} must be in [0, 2^31 - 1]`);
  return value;
}
function concat(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}
const u32le = n => Uint8Array.of(n & 255, (n >>> 8) & 255, (n >>> 16) & 255, n >>> 24);
function bytes32(value, label) {
  const out = typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value)
    ? Uint8Array.from(value.match(/../g), v => parseInt(v, 16)) : value;
  if (!(out instanceof Uint8Array) || out.length !== 32) throw new TypeError(`${label} must be 32 bytes`);
  return out;
}

export class C7WalletIdentity {
  #account;
  #family;
  #accountIndex;
  #network;
  #scope;
  #storageId;
  #fingerprint;
  #issued = 0;
  #used = new Set();
  #maxUsed = -1;

  constructor(root, { family, account = 0, domain, assetId, network, issued }) {
    if (!NZK_HRP[network]) throw new Error('unknown network');
    this.#family = family;
    this.#accountIndex = index31(account, 'account');
    this.#network = network;
    this.#account = new C7Account(root, { family, account, domain: bytes32(domain, 'domain'), assetId: bytes32(assetId, 'assetId') });
    this.#scope = concat([NZK_FAMILIES[family]], u32le(account), this.#account.domain, this.#account.assetId);
    this.#storageId = hex(sha256(this.#account.expand32('NeuraiZK/v3/storage', this.#scope)));
    this.#fingerprint = hex(sha256(this.#account.expand32('NeuraiZK/v3/fingerprint', this.#scope)).subarray(0, 4));
    if (issued !== undefined) this.setIssued(issued);
  }

  static async fromMnemonic({ mnemonic, passphrase = '', zkPassphrase = '', ...options }) {
    const seed = await walletSeedFromMnemonic(mnemonic, passphrase);
    try { return await C7WalletIdentity.fromSeed({ seed, zkPassphrase, ...options }); } finally { seed.fill(0); }
  }

  static async fromSeed({ seed, zkPassphrase = '', ...options }) {
    const root = await deriveZkRoot(seed, zkPassphrase);
    try { return new C7WalletIdentity(root, options); } finally { root.fill(0); }
  }

  /** For callers that already derived R, such as tests. */
  static fromRoot({ root, ...options }) { return new C7WalletIdentity(root, options); }

  get generation() { return 'c7'; }
  get derivation() { return C7_DERIVATION; }
  get family() { return this.#family; }
  get account() { return this.#accountIndex; }
  get network() { return this.#network; }
  get storageId() { return this.#storageId; }
  get fingerprint() { return this.#fingerprint; }
  /** Kept for interface compatibility: C7 recovery has no address window. */
  get gap() { return NZK_DEFAULT_GAP; }
  get issued() { return this.#issued; }
  get maxUsed() { return this.#maxUsed; }
  get usedIndexes() { return [...this.#used].sort((a, b) => a - b); }

  setGap() {}
  setIssued(index) { this.#issued = index31(index, 'issued index'); }

  descriptorAt(chain, index) { return this.#account.descriptor(chain, index31(index, 'address index')); }
  addressAt(chain, index) { return encodeC7Address(this.descriptorAt(chain, index), this.#network); }

  /** First receiving index after the highest used one, or the last one handed out if later. */
  currentIndex() { return Math.max(this.#maxUsed + 1, this.#issued); }
  recipient() { return this.descriptorAt(CHAIN_RECEIVING, this.currentIndex()); }
  /** Descriptor for the wallet's own notes: deposits, change and self-assignments. */
  selfRecipient() { return this.descriptorAt(CHAIN_CHANGE, 0); }

  /** Hand out the next receiving address. Recovery does not depend on a gap, so
   * this only keeps the receiving index moving forward. */
  issueNext() {
    const next = this.currentIndex() + 1;
    this.#issued = index31(next, 'issued index');
    return next;
  }

  /** Finds this account's notes among published records with the full scanner
   * (ownership checked, nullifier computed). Order of records does not matter. */
  scanRecords(entries, knownAddresses = []) {
    for (const address of knownAddresses) {
      if (address?.chain === CHAIN_RECEIVING) this.#markUsed(address.index);
    }
    const found = [];
    entries.forEach((entry, position) => {
      const owned = this.openRecord(entry.record, entry.cm);
      if (!owned) return;
      found.push({ position, owned, address: owned.address });
      if (owned.address.chain === CHAIN_RECEIVING) this.#markUsed(owned.address.index);
    });
    return found;
  }

  #markUsed(index) {
    this.#used.add(index31(index, 'address index'));
    this.#maxUsed = Math.max(this.#maxUsed, index);
  }

  /** The owned note in a record, or null when it is not this account's. */
  openRecord(record, cm) {
    try {
      const r = this.#account.scan(record, cm, { full: true });
      return { note: r.note, cm: r.cm, amountAtomic: r.amountAtomic, nf: r.nf, address: { chain: r.chain, index: r.index } };
    } catch {
      return null;
    }
  }

  #spend(consumed) {
    const address = consumed?.address;
    if (!address || (address.chain !== CHAIN_RECEIVING && address.chain !== CHAIN_CHANGE)) {
      throw new Error('note has no known C7 address');
    }
    const keys = this.#account.spendKeys(address.chain, address.index);
    return { spendSecret: keys.spendSecret, change: this.descriptorAt(address.chain, address.index) };
  }

  /** C7 secrets stay in the proving worker; no spending-key getter is added. */
  prepareC6Deposit(wallet, options) {
    return wallet.prepareDeposit({ ...options, domain: this.#account.domain, assetId: this.#account.assetId,
      recipient: options.recipient ?? this.selfRecipient() });
  }

  prepareC6Transfer(wallet, { consumed, ...options }) {
    const { spendSecret, change } = this.#spend(consumed);
    try {
      return wallet.prepareTransfer({ ...options, domain: this.#account.domain, assetId: this.#account.assetId, change,
        root: consumed.root, spent: { note: consumed.note, index: consumed.index, path: consumed.path, spendSecret } });
    } finally { spendSecret.fill(0); }
  }

  prepareC6Withdrawal(wallet, { consumed, ...options }) {
    const { spendSecret, change } = this.#spend(consumed);
    try {
      return wallet.prepareWithdrawal({ ...options, domain: this.#account.domain, assetId: this.#account.assetId, change,
        root: consumed.root, spent: { note: consumed.note, index: consumed.index, path: consumed.path, spendSecret } });
    } finally { spendSecret.fill(0); }
  }

  /** J2 joins two owned notes; the new note goes to the address of note 0. */
  prepareC6Join(wallet, { consumed, ...options }) {
    if (!Array.isArray(consumed) || consumed.length !== 2) throw new Error('Two owned notes required');
    const spends = consumed.map(note => this.#spend(note));
    try {
      return wallet.prepare({ ...options, domain: this.#account.domain, assetId: this.#account.assetId, root: consumed[0].root,
        change: spends[0].change,
        notes: consumed.map((n, i) => ({ note: n.note, index: n.index, path: n.path, spendSecret: spends[i].spendSecret })) });
    } finally { for (const s of spends) s.spendSecret.fill(0); }
  }

  /** Derived identities are recovered from the words; there is no file backup. */
  backupJson() { return null; }

  #checkpointKey() { return this.#account.expand32('NeuraiZK/v3/scan-checkpoint', this.#scope); }

  /** Stable opaque journal namespace, never a spending or encryption key. */
  checkpointStoreId() {
    const key = this.#checkpointKey();
    try { return hex(sha256(concat(utf8('Neurai/C7/journal-id/v1'), key))); } finally { key.fill(0); }
  }

  sealCheckpoint(checkpoint) {
    const key = this.#checkpointKey();
    try { return sealScanCheckpoint(checkpoint, key); } finally { key.fill(0); }
  }

  openCheckpoint(encoded) {
    const key = this.#checkpointKey();
    try { return openScanCheckpoint(encoded, key); } finally { key.fill(0); }
  }

  lock() { this.#account.lock(); }
}
