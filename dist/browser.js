import {
  C7WorkerClient,
  IndexedDbJournalStore,
  LEGACY_P2PKH,
  POOL_READ_RPC_METHODS,
  admitTransaction,
  assertPoolChain,
  checkPoolCoin,
  confirmedPoolCoins,
  createWalletServiceRpc,
  inspectFundingTransaction,
  isPoolReadRpc,
  publicationStatus,
  publishTransaction,
  recheckInputs,
  withdrawalScript
} from "./chunks/chunk-Y3V4NVG2.js";
import {
  C7Account,
  C7Error,
  C7WalletIdentity,
  C7_DERIVATION,
  C7_PROFILE,
  C7_RECORD_BYTES,
  MAX_ARTIFACT_BYTES,
  NZK_ARGON2ID,
  NZK_DEFAULT_GAP,
  NZK_DERIVATION,
  NZK_FAMILIES,
  NZK_HRP,
  NZK_MAX_GAP,
  argon2idAsync,
  bech32mDecode,
  bech32mEncode,
  buildC7Transaction,
  c7Context,
  c7InstanceTag,
  c7PoolDomain,
  c7XnaAssetId,
  chacha20poly1305,
  createC7JoinWallet,
  createC7OperationWallet,
  decodeC7Address,
  decodeNote,
  deriveNullifierKey,
  deriveOwner,
  deriveZkRoot,
  describeReceiving,
  encodeC7Address,
  encodeNote,
  isC7Descriptor,
  loadVerifiedArtifact,
  noteCommitment,
  noteNullifier,
  readC7Packet,
  scanC7Pool,
  sealC7Note,
  startC7PoolWorker,
  walletSeedFromMnemonic
} from "./chunks/chunk-TGJJTLQZ.js";
import {
  ATOMIC_PER_XNA,
  BN254_SCALAR_FIELD,
  MAX_ATOMIC,
  c7Intent,
  decodeField,
  encodeField,
  formatXna,
  parseXna,
  poseidonBytes,
  poseidonPermutation,
  rpcAmountToSatoshis,
  validateC7Deployment
} from "./chunks/chunk-WIDDQ5UR.js";

// src/shared.js
var RESET_TESTNET_GENESIS = "000000c710413a4265a996d30c86043aedef6a563900f1bc43fea61d5b2dc77d";

// src/protocol-constants.js
var NEURAI_TEST_VAULT_AAD_V1 = "Neurai/NIP045/testnet-wallet/vault/v1";

// src/vault.js
var utf8 = new TextEncoder();
var decoder = new TextDecoder("utf-8", { fatal: true });
var VAULT_AAD = utf8.encode(NEURAI_TEST_VAULT_AAD_V1);
var MEMORY_KIB = 64 * 1024;
var MAX_CIPHERTEXT = 16 * 1024 * 1024;
function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex, length, name) {
  if (typeof hex !== "string" || !/^(?:[0-9a-f]{2})+$/i.test(hex) || length !== null && hex.length !== length * 2) {
    throw new TypeError(`invalid wallet vault ${name}`);
  }
  return Uint8Array.from(hex.match(/../g), (pair) => parseInt(pair, 16));
}
function passwordBytes(password) {
  const bytes = typeof password === "string" ? utf8.encode(password) : password;
  if (!(bytes instanceof Uint8Array) || bytes.length === 0) {
    throw new TypeError("nonempty wallet password required");
  }
  return bytes;
}
function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === "object" && !(value instanceof Uint8Array)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalJson(value[key])]));
  }
  return value;
}
async function deriveKey(password, salt) {
  const key = await argon2idAsync(
    passwordBytes(password),
    salt,
    { t: 3, m: MEMORY_KIB, p: 1, dkLen: 32, maxmem: MEMORY_KIB * 1024 }
  );
  return key;
}
async function sealVault(payload, password) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError("wallet vault payload must be an object");
  }
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("secure browser randomness is required");
  }
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const nonce = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const plaintext = utf8.encode(JSON.stringify(canonicalJson(payload)));
  if (plaintext.length > MAX_CIPHERTEXT - 16) throw new RangeError("wallet vault payload too large");
  const key = await deriveKey(password, salt);
  try {
    const ciphertext = chacha20poly1305(key, nonce, VAULT_AAD).encrypt(plaintext);
    return JSON.stringify({
      version: 1,
      kdf: "argon2id",
      memory_kib: MEMORY_KIB,
      passes: 3,
      lanes: 1,
      salt: bytesToHex(salt),
      nonce: bytesToHex(nonce),
      ciphertext: bytesToHex(ciphertext)
    }) + "\n";
  } finally {
    key.fill(0);
    plaintext.fill(0);
  }
}
async function openVault(encoded, password) {
  const raw = encoded instanceof Uint8Array ? decoder.decode(encoded) : encoded;
  if (typeof raw !== "string" || raw.length > MAX_CIPHERTEXT * 2 + 1024) {
    throw new TypeError("invalid wallet vault JSON");
  }
  const envelope = JSON.parse(raw);
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope) || envelope.version !== 1 || envelope.kdf !== "argon2id" || envelope.memory_kib !== MEMORY_KIB || envelope.passes !== 3 || envelope.lanes !== 1) {
    throw new Error("unsupported wallet vault parameters");
  }
  const salt = hexToBytes(envelope.salt, 16, "salt");
  const nonce = hexToBytes(envelope.nonce, 12, "nonce");
  const ciphertext = hexToBytes(envelope.ciphertext, null, "ciphertext");
  if (ciphertext.length < 16 || ciphertext.length > MAX_CIPHERTEXT) {
    throw new RangeError("invalid wallet vault ciphertext size");
  }
  const key = await deriveKey(password, salt);
  let plaintext;
  try {
    plaintext = chacha20poly1305(key, nonce, VAULT_AAD).decrypt(ciphertext);
    const payload = JSON.parse(decoder.decode(plaintext));
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("invalid wallet vault payload");
    }
    return payload;
  } finally {
    key.fill(0);
    plaintext?.fill(0);
  }
}
export {
  ATOMIC_PER_XNA,
  BN254_SCALAR_FIELD,
  C7WorkerClient as C6WorkerClient,
  C7Account,
  C7Error,
  C7WalletIdentity,
  C7WorkerClient,
  C7_DERIVATION,
  C7_PROFILE,
  C7_RECORD_BYTES,
  IndexedDbJournalStore,
  IndexedDbJournalStore as IndexedDbSponsorStore,
  LEGACY_P2PKH,
  MAX_ARTIFACT_BYTES,
  MAX_ATOMIC,
  NZK_ARGON2ID,
  NZK_DEFAULT_GAP,
  NZK_DERIVATION,
  NZK_FAMILIES,
  NZK_HRP,
  NZK_MAX_GAP,
  POOL_READ_RPC_METHODS,
  RESET_TESTNET_GENESIS,
  admitTransaction,
  assertPoolChain,
  bech32mDecode,
  bech32mEncode,
  buildC7Transaction as buildC6Transaction,
  buildC7Transaction,
  c7Context,
  c7InstanceTag,
  c7Intent,
  c7PoolDomain,
  c7XnaAssetId,
  checkPoolCoin,
  confirmedPoolCoins,
  createC7JoinWallet as createC6JoinWallet,
  createC7OperationWallet as createC6OperationWallet,
  createC7JoinWallet,
  createC7OperationWallet,
  createWalletServiceRpc,
  decodeC7Address,
  decodeField,
  decodeNote,
  deriveNullifierKey,
  deriveOwner,
  deriveZkRoot,
  describeReceiving,
  encodeC7Address,
  encodeField,
  encodeNote,
  formatXna,
  inspectFundingTransaction,
  isC7Descriptor,
  isPoolReadRpc,
  loadVerifiedArtifact,
  noteCommitment,
  noteNullifier,
  openVault,
  parseXna,
  poseidonBytes,
  poseidonPermutation,
  publicationStatus,
  publishTransaction,
  readC7Packet as readC6Packet,
  readC7Packet,
  recheckInputs,
  rpcAmountToSatoshis,
  scanC7Pool as scanC6Pool,
  scanC7Pool,
  sealC7Note,
  sealVault,
  startC7PoolWorker as startC6PoolWorker,
  startC7PoolWorker,
  validateC7Deployment,
  walletSeedFromMnemonic,
  withdrawalScript
};
//# sourceMappingURL=browser.js.map
