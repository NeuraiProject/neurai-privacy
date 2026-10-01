import { prepareC3 } from './c3.js';
import { prepareC4 } from './c4.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { sealScanCheckpoint, openScanCheckpoint } from './checkpoint-crypto.js';
import { sealVault, openVault } from './vault.js';
import { deriveOwner } from './notes.js';
import { deriveViewPublic, openNoteRecord, sealNote } from './hpke.js';

function bytesFromHex(value, name) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/i.test(value)) {
    throw new TypeError(`${name} must be 32 hex bytes`);
  }
  return Uint8Array.from(value.match(/../g), byte => parseInt(byte, 16));
}

function hex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function equal(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}

/** Local TEST identity. It reads authenticated note records; chain state is not verified here. */
export class BrowserTestIdentity {
  #spendSecret;
  #viewSeed;
  #domain;
  #assetId;
  #backup;

  constructor(spendSecret, viewSeed, domain, assetId, backup) {
    this.#spendSecret = spendSecret.slice();
    this.#viewSeed = viewSeed.slice();
    this.#domain = domain.slice();
    this.#assetId = assetId.slice();
    this.#backup = backup;
  }

  static async create({ domain, assetId, password }) {
    if (!globalThis.crypto?.getRandomValues) throw new Error('secure browser randomness is required');
    const d = bytesFromHex(domain, 'domain');
    const asset = bytesFromHex(assetId, 'assetId');
    const spendSecret = globalThis.crypto.getRandomValues(new Uint8Array(32));
    const viewSeed = globalThis.crypto.getRandomValues(new Uint8Array(32));
    try {
      const backup = await sealVault({ spend_key: hex(spendSecret), view_seed: hex(viewSeed) }, password);
      return new BrowserTestIdentity(spendSecret, viewSeed, d, asset, backup);
    } finally {
      spendSecret.fill(0);
      viewSeed.fill(0);
    }
  }

  static async fromBackup({ backup, password, domain, assetId }) {
    const d = bytesFromHex(domain, 'domain');
    const asset = bytesFromHex(assetId, 'assetId');
    const payload = await openVault(backup, password);
    const spendSecret = bytesFromHex(payload.spend_key, 'spend_key');
    const viewSeed = bytesFromHex(payload.view_seed, 'view_seed');
    try {
      return new BrowserTestIdentity(spendSecret, viewSeed, d, asset, backup);
    } finally {
      spendSecret.fill(0);
      viewSeed.fill(0);
    }
  }

  #assertOpen() {
    if (this.#spendSecret === null) throw new Error('wallet identity is locked');
  }

  recipient() {
    this.#assertOpen();
    return { domain: hex(this.#domain), asset_id: hex(this.#assetId),
      owner: hex(deriveOwner(this.#domain, this.#spendSecret)),
      view_pub: hex(deriveViewPublic(this.#viewSeed)) };
  }

  /** Return the existing encrypted JSON backup; the plaintext keys never leave this class. */
  backupJson() {
    this.#assertOpen();
    return this.#backup;
  }

  /** Seal a note for a descriptor in this exact pool instance. No transaction is created. */
  createNote(recipient, amountAtomic) {
    this.#assertOpen();
    if (!recipient || typeof recipient !== 'object' ||
        !equal(bytesFromHex(recipient.domain, 'recipient domain'), this.#domain) ||
        !equal(bytesFromHex(recipient.asset_id, 'recipient asset'), this.#assetId)) {
      throw new Error('recipient belongs to another pool instance');
    }
    return sealNote({ descriptor: recipient, amountAtomic });
  }

  /** Decrypt a candidate record and verify ownership/commitment, not chain inclusion. */
  openRecord(record, commitment) {
    this.#assertOpen();
    return openNoteRecord({ record, cm: commitment, domain: this.#domain,
      assetId: this.#assetId, viewSeed: this.#viewSeed, spendSecret: this.#spendSecret });
  }

  /** Build private circuit inputs locally; call only from the dedicated wallet worker. */
  prepareC3(options) {
    this.#assertOpen();
    if (options.manifest.domain !== hex(this.#domain) || options.manifest.assetId !== hex(this.#assetId)) {
      throw new Error('wallet belongs to another pool instance');
    }
    return prepareC3({ ...options, secret: this.#spendSecret });
  }

  /** Build private circuit inputs locally; call only from the dedicated wallet worker. */
  prepareC4(options) {
    this.#assertOpen();
    if (options.manifest.domain !== hex(this.#domain) || options.manifest.assetId !== hex(this.#assetId)) {
      throw new Error('wallet belongs to another pool instance');
    }
    return prepareC4({ ...options, secret: this.#spendSecret });
  }

  #checkpointKey() {
    this.#assertOpen();
    const label = new TextEncoder().encode('Neurai/privacy/checkpoint/file/v1');
    const material = new Uint8Array(label.length + 128);
    material.set(label);
    material.set(this.#domain, label.length);
    material.set(this.#assetId, label.length + 32);
    material.set(this.#spendSecret, label.length + 64);
    material.set(this.#viewSeed, label.length + 96);
    try { return sha256(material); } finally { material.fill(0); }
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
    this.#spendSecret?.fill(0);
    this.#viewSeed?.fill(0);
    this.#spendSecret = null;
    this.#viewSeed = null;
    this.#backup = null;
  }
}
