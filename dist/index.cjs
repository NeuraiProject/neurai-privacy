"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);

// src/index.js
var index_exports = {};
__export(index_exports, {
  ATOMIC_PER_XNA: () => ATOMIC_PER_XNA,
  BN254_SCALAR_FIELD: () => BN254_SCALAR_FIELD,
  BrowserTestIdentity: () => BrowserTestIdentity,
  C4_FORMS: () => C4_FORMS,
  C4_TESTNET_ARTIFACTS: () => C4_TESTNET_ARTIFACTS,
  C4_TESTNET_COMMITMENT: () => C4_TESTNET_COMMITMENT,
  C4_TESTNET_MANIFEST: () => C4_TESTNET_MANIFEST,
  C4_TESTNET_NETWORK: () => C4_TESTNET_NETWORK,
  CliTestBackend: () => CliTestBackend,
  LEGACY_P2PKH: () => LEGACY_P2PKH,
  MAX_ARTIFACT_BYTES: () => MAX_ARTIFACT_BYTES,
  MAX_ATOMIC: () => MAX_ATOMIC,
  MIN_SPONSOR_CHANGE_ATOMIC: () => MIN_SPONSOR_CHANGE_ATOMIC,
  NZK_ARGON2ID: () => NZK_ARGON2ID,
  NZK_DEFAULT_GAP: () => NZK_DEFAULT_GAP,
  NZK_DERIVATION: () => NZK_DERIVATION,
  NZK_FAMILIES: () => NZK_FAMILIES,
  NZK_HRP: () => NZK_HRP,
  NZK_MAX_GAP: () => NZK_MAX_GAP,
  NeuraiPrivacy: () => NeuraiPrivacy,
  POOL_READ_RPC_METHODS: () => POOL_READ_RPC_METHODS,
  PoolWorkerClient: () => PoolWorkerClient,
  RESET_TESTNET_GENESIS: () => RESET_TESTNET_GENESIS,
  ROTATION_MAX_GAP: () => ROTATION_MAX_GAP,
  ZkWalletIdentity: () => ZkWalletIdentity,
  admitTransaction: () => admitTransaction,
  assertPoolChain: () => assertPoolChain,
  bech32mDecode: () => bech32mDecode,
  bech32mEncode: () => bech32mEncode,
  buildC4Transaction: () => buildC4Transaction,
  c4DustAtomic: () => c4DustAtomic,
  checkPoolCoin: () => checkPoolCoin,
  confirmedPoolCoins: () => confirmedPoolCoins,
  decodeField: () => decodeField,
  decodeNote: () => decodeNote,
  decodeNzkAddress: () => decodeNzkAddress,
  deriveNullifierKey: () => deriveNullifierKey,
  deriveOwner: () => deriveOwner,
  deriveViewPublic: () => deriveViewPublic,
  deriveZkAddressKeys: () => deriveZkAddressKeys,
  deriveZkRoot: () => deriveZkRoot,
  describeReceiving: () => describeReceiving,
  encodeField: () => encodeField,
  encodeNote: () => encodeNote,
  encodeNzkAddress: () => encodeNzkAddress,
  finishC4: () => finishC4,
  formatXna: () => formatXna,
  inspectFundingTransaction: () => inspectFundingTransaction,
  isPoolReadRpc: () => isPoolReadRpc,
  loadRotation: () => loadRotation,
  loadVerifiedArtifact: () => loadVerifiedArtifact,
  noteCommitment: () => noteCommitment,
  noteNullifier: () => noteNullifier,
  nzkInstanceTag: () => nzkInstanceTag,
  openNoteRecord: () => openNoteRecord,
  openVault: () => openVault,
  parseRecipient: () => parseRecipient,
  parseXna: () => parseXna,
  planC4Operation: () => planC4Operation,
  poseidonBytes: () => poseidonBytes,
  poseidonPermutation: () => poseidonPermutation,
  prepareC4: () => prepareC4,
  proveC4: () => proveC4,
  publicationStatus: () => publicationStatus,
  publishTransaction: () => publishTransaction,
  recheckInputs: () => recheckInputs,
  rotationStorageKey: () => rotationStorageKey,
  rpcAmountToSatoshis: () => rpcAmountToSatoshis,
  saveRotation: () => saveRotation,
  sealNote: () => sealNote,
  sealVault: () => sealVault,
  selectPoolCoins: () => selectPoolCoins,
  startPoolWorker: () => startPoolWorker,
  summarizeScan: () => summarizeScan,
  validateC4Manifest: () => validateC4Manifest,
  walletSeedFromMnemonic: () => walletSeedFromMnemonic,
  withdrawalScript: () => withdrawalScript,
  zkFingerprint: () => zkFingerprint
});
module.exports = __toCommonJS(index_exports);

// src/shared.js
var RESET_TESTNET_GENESIS = "0000008b384aeffecdab182575dc4e86c9f07f90318c65088532660ed9a8a021";
var HEX32 = /^[0-9a-f]{64}$/i;
var FORMS = /* @__PURE__ */ new Set(["D0", "D1", "T1", "T2", "W_partial", "W_full"]);
var MAX_MONEY_SATS = 2100000000000000000n;
var BN254_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
function satoshiText(value, name) {
  if (typeof value !== "bigint" && typeof value !== "string") {
    throw new TypeError(name + " must be a decimal string or bigint");
  }
  const text2 = String(value);
  if (!/^[1-9][0-9]*$/.test(text2) || BigInt(text2) > MAX_MONEY_SATS) {
    throw new RangeError(name + " must be an exact positive XNA satoshi amount");
  }
  return text2;
}
function noteCmText(value) {
  if (typeof value !== "bigint" && typeof value !== "string") {
    throw new TypeError("noteCm must be a decimal string or bigint");
  }
  const text2 = String(value);
  if (!/^[1-9][0-9]*$/.test(text2) || BigInt(text2) >= BN254_FIELD) {
    throw new RangeError("noteCm must be a canonical BN254 field element");
  }
  return text2;
}
function balanceText(value, name) {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]*)$/.test(value) || BigInt(value) > MAX_MONEY_SATS) {
    throw new Error("invalid or unsafe TEST wallet " + name);
  }
  return BigInt(value);
}
function nonempty(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(name + " must be a nonempty string");
  }
  return value;
}
function unit(value) {
  if (!Number.isSafeInteger(value) || ![1, 2].includes(value)) {
    throw new RangeError("TEST deposit amountUnits must be 1 or 2 atomic RWAX units");
  }
  return value;
}
function descriptor(value) {
  if (!value || typeof value !== "object" || !HEX32.test(value.domain) || !HEX32.test(value.asset_id) || !HEX32.test(value.owner) || !HEX32.test(value.view_pub)) {
    throw new TypeError("invalid TEST shielded recipient descriptor");
  }
  if (BigInt("0x" + value.owner) === 0n || BigInt("0x" + value.owner) >= BN254_FIELD) {
    throw new TypeError("noncanonical TEST shielded recipient owner");
  }
  return {
    domain: value.domain.toLowerCase(),
    asset_id: value.asset_id.toLowerCase(),
    owner: value.owner.toLowerCase(),
    view_pub: value.view_pub.toLowerCase()
  };
}

// src/core.js
var NeuraiPrivacy = class {
  constructor({ rpc, backend, expectedGenesis = RESET_TESTNET_GENESIS }) {
    if (typeof rpc !== "function") throw new TypeError("rpc function is required");
    if (!backend || typeof backend.scan !== "function" || typeof backend.transact !== "function") {
      throw new TypeError("privacy backend is required");
    }
    if (!HEX32.test(expectedGenesis)) throw new TypeError("invalid genesis hash");
    this.rpc = rpc;
    this.backend = backend;
    this.profile = backend.profile ?? "rwax";
    this.expectedGenesis = expectedGenesis.toLowerCase();
    this._operation = Promise.resolve();
  }
  async assertNetwork() {
    const genesis = await this.rpc("getblockhash", [0]);
    if (typeof genesis !== "string" || genesis.toLowerCase() !== this.expectedGenesis) {
      throw new Error("unexpected Neurai genesis: " + String(genesis));
    }
  }
  async networkStatus() {
    await this.assertNetwork();
    const height = await this.rpc("getblockcount", []);
    const blockhash = await this.rpc("getbestblockhash", []);
    if (!Number.isSafeInteger(height) || height < 0 || !HEX32.test(blockhash)) {
      throw new Error("invalid node status");
    }
    return { height, blockhash };
  }
  createWallet() {
    return this.backend.init();
  }
  backupWallet(file) {
    return this.backend.backup(file);
  }
  restoreWallet(file) {
    return this.backend.restore(file);
  }
  async fundingStatus({ amountSats, feeSats } = {}) {
    await this.assertNetwork();
    return this.backend.funding({ amountSats, feeSats });
  }
  async createFundingUtxo({ amountSats, feeSats } = {}) {
    await this.assertNetwork();
    return this.backend.funding({ amountSats, feeSats, create: true });
  }
  async recipient() {
    await this.assertNetwork();
    return descriptor(await this.backend.recipient());
  }
  async scan(options) {
    await this.assertNetwork();
    const result = await this.backend.scan(options);
    if (result.test_only !== true) throw new Error("invalid TEST wallet result");
    if (this.backend.requiresBlockVerification === true || result.height !== void 0 || result.blockhash !== void 0) {
      if (!Number.isSafeInteger(result.height) || result.height < 1 || !HEX32.test(result.blockhash)) {
        throw new Error("invalid TEST wallet scan block");
      }
      const rpcBlockhash = await this.rpc("getblockhash", [result.height]);
      if (typeof rpcBlockhash !== "string" || rpcBlockhash.toLowerCase() !== result.blockhash.toLowerCase()) {
        throw new Error("wallet scanner and RPC node disagree at scanned height; retry after synchronization");
      }
    }
    const ownedNotes = (result.owned_notes ?? []).map((note) => ({
      cm: noteCmText(note.cm),
      amountAtomic: balanceText(note.amount_sats, "note amount"),
      spent: note.spent === true,
      createdTxid: note.created_txid,
      createdHeight: note.created_height,
      spentTxid: note.spent_txid,
      spentHeight: note.spent_height,
      slot: note.slot
    }));
    const history = (result.history ?? []).map((event) => ({
      txid: event.txid,
      height: event.height,
      form: event.form,
      reserveAtomic: balanceText(event.reserve_sats, "event reserve")
    }));
    if (this.profile === "xna") {
      const { reserve_amount, balance_units, owned_notes, ...safe } = result;
      return {
        ...safe,
        ownedNotes,
        history,
        balanceAtomic: balanceText(result.balance_sats, "balance"),
        reserveAtomic: balanceText(result.reserve_sats, "reserve")
      };
    }
    if (!Number.isSafeInteger(result.balance_units) || result.balance_units < 0 || !Number.isSafeInteger(result.reserve_amount) || result.reserve_amount < 0) {
      throw new Error("invalid or unsafe TEST wallet balance");
    }
    return {
      ...result,
      ownedNotes,
      history,
      balanceAtomic: BigInt(result.balance_units),
      reserveAtomic: BigInt(result.reserve_amount)
    };
  }
  async listNotes(options) {
    return (await this.scan(options)).ownedNotes;
  }
  async history(options) {
    return (await this.scan(options)).history;
  }
  async #spend(options) {
    const perform = async () => {
      await this.assertNetwork();
      const maxRebuilds = options.maxRebuilds ?? 1;
      if (!Number.isSafeInteger(maxRebuilds) || maxRebuilds < 0 || maxRebuilds > 3) {
        throw new RangeError("maxRebuilds must be between 0 and 3");
      }
      for (let attempt = 0; ; attempt++) {
        try {
          const result = await this.backend.transact(options);
          if (this.profile !== "xna") return result;
          const { reserve_after, ...safe } = result;
          return { ...safe, reserveAtomic: balanceText(result.reserve_sats, "reserve") };
        } catch (error) {
          const stale = /txn-mempool-conflict|bad-txns-inputs-missingorspent|missing or spent/i.test(String(error));
          if (!stale || attempt >= maxRebuilds) throw error;
          options.onProgress?.({ stage: "rebuild", attempt: attempt + 1 });
        }
      }
    };
    const task = this._operation.then(perform, perform);
    this._operation = task.catch(() => {
    });
    return task;
  }
  /** Deposit an existing RWAX or native-XNA TEST UTXO into this wallet. */
  deposit({ amountUnits, amountSats, broadcast = false, mine = false, feeSats, onProgress, maxRebuilds } = {}) {
    if (this.profile === "rwax" && amountSats !== void 0) throw new TypeError("RWAX uses amountUnits");
    if (this.profile === "xna" && amountUnits !== void 0) throw new TypeError("XNA uses amountSats");
    return this.#spend({
      kind: "deposit",
      ...this.profile === "rwax" ? { amountUnits: amountUnits ?? 1 } : { amountSats },
      broadcast,
      mine,
      feeSats,
      onProgress,
      maxRebuilds
    });
  }
  /** Spend this wallet's private note to one or two shielded recipients. */
  transfer({ recipients, splitSats, noteCm, broadcast = false, mine = false, feeSats, onProgress, maxRebuilds }) {
    return this.#spend({
      kind: "transfer",
      recipients,
      splitSats,
      noteCm,
      broadcast,
      mine,
      feeSats,
      onProgress,
      maxRebuilds
    });
  }
  /** Withdraw an owned TEST note to a transparent output. */
  withdraw({ recipient, noteCm, broadcast = false, mine = false, feeSats, onProgress, maxRebuilds } = {}) {
    return this.#spend({
      kind: "withdraw",
      recipient,
      noteCm,
      broadcast,
      mine,
      feeSats,
      onProgress,
      maxRebuilds
    });
  }
  async publishPrepared(candidate) {
    if (!candidate || !HEX32.test(candidate.txid) || typeof candidate.raw_tx !== "string" || !/^(?:[0-9a-f]{2})+$/i.test(candidate.raw_tx)) {
      throw new TypeError("valid prepared transaction required");
    }
    await this.assertNetwork();
    const decoded = await this.rpc("decoderawtransaction", [candidate.raw_tx]);
    if (decoded?.txid !== candidate.txid) throw new Error("prepared txid mismatch");
    const [check] = await this.rpc("testmempoolaccept", [[candidate.raw_tx], true]);
    if (check?.allowed !== true && check?.allowed !== 1) throw new Error("prepared transaction rejected: " + String(check?.["reject-reason"] ?? "unknown"));
    const sent = await this.rpc("sendrawtransaction", [candidate.raw_tx, true]);
    if (sent !== candidate.txid) throw new Error("broadcast returned another txid");
    return { ...candidate, raw_tx: void 0, broadcast: true };
  }
  async transactionStatus(txid) {
    let tx;
    try {
      tx = await this.transaction(txid);
    } catch (error) {
      if (/No such mempool|No such transaction|not found/i.test(String(error))) {
        return {
          txid,
          state: "unknown",
          confirmations: 0,
          height: null,
          blockhash: null
        };
      }
      throw error;
    }
    const confirmations = tx?.confirmations ?? 0;
    const blockhash = tx?.blockhash ?? null;
    let height = tx?.height ?? null;
    if (confirmations > 0 && height === null && HEX32.test(blockhash)) {
      const header = await this.rpc("getblockheader", [blockhash]);
      height = header?.height;
      if (!Number.isSafeInteger(height) || height < 0) {
        throw new Error("invalid confirmed transaction height");
      }
    }
    return {
      txid,
      state: confirmations > 0 ? "confirmed" : "mempool",
      confirmations,
      height,
      blockhash
    };
  }
  async transaction(txid) {
    if (!HEX32.test(txid)) throw new TypeError("invalid transaction ID");
    await this.assertNetwork();
    return this.rpc("getrawtransaction", [txid, true]);
  }
};

// src/node-cli-backend.js
var import_node_child_process = require("node:child_process");
var import_promises = require("node:fs/promises");
var import_node_os = require("node:os");
var import_node_path = require("node:path");

// src/protocol-constants.js
var NEURAI_POOL_HASH_LABELS = Object.freeze({
  deposit: "NIP045/dep",
  withdrawal: "NIP045/wdr\0",
  request: "NIP045/req\0",
  data: "NIP045/dat"
});
var NEURAI_TEST_VAULT_AAD_V1 = "Neurai/NIP045/testnet-wallet/vault/v1";
var NEURAI_PYTHON_CLI_MODULE = "contrib.nip045_wallet.cli";
var NEURAI_PYTHON_PROGRESS_PREFIX = "NIP045_PROGRESS:";

// src/node-cli-backend.js
function resultObject(text2, command) {
  const lines = text2.trim().split(/\r?\n/);
  if (lines.length === 0 || !lines.at(-1)) {
    throw new Error("wallet CLI returned no JSON result");
  }
  const result = JSON.parse(lines.at(-1));
  if (!result || typeof result !== "object" || command !== "recipient" && result.test_only !== true) {
    throw new Error("wallet CLI returned an invalid TEST result");
  }
  return result;
}
var CliTestBackend = class {
  constructor(options) {
    if (!options || typeof options.getPassword !== "function") {
      throw new TypeError("getPassword callback is required");
    }
    this.python = nonempty(options.python ?? "python3", "python");
    this.requiresBlockVerification = true;
    this.profile = options.profile ?? "rwax";
    if (!["rwax", "xna"].includes(this.profile)) throw new TypeError("invalid TEST profile");
    this.manifestSha256 = options.manifestSha256;
    if (this.profile === "xna" && !HEX32.test(this.manifestSha256)) {
      throw new TypeError("XNA profile requires pinned manifestSha256");
    }
    this.repository = (0, import_node_path.resolve)(nonempty(options.repository, "repository"));
    this.wallet = (0, import_node_path.resolve)(nonempty(options.wallet, "wallet"));
    this.artifacts = (0, import_node_path.resolve)(nonempty(options.artifacts, "artifacts"));
    this.node = nonempty(options.node, "node");
    this.source = options.source ? (0, import_node_path.resolve)(options.source) : void 0;
    this.proverCode = options.proverCode ? (0, import_node_path.resolve)(options.proverCode) : void 0;
    this.getPassword = options.getPassword;
    this.environment = { ...options.environment };
    this.timeoutMs = options.timeoutMs ?? 36e5;
    if (!Number.isSafeInteger(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new RangeError("invalid timeoutMs");
    }
  }
  async #run(command, arguments_, onProgress) {
    const supplied = await this.getPassword();
    if (!(typeof supplied === "string" || Buffer.isBuffer(supplied))) {
      throw new TypeError("getPassword must return a string or Buffer");
    }
    const password = Buffer.from(supplied);
    if (password.length < 12 || password.length > 4096 || password.includes(10) || password.includes(13)) {
      password.fill(0);
      throw new RangeError("wallet password must contain 12-4096 bytes, without newline");
    }
    const input = Buffer.concat([password, Buffer.from("\n")]);
    password.fill(0);
    const argv = [
      "-m",
      NEURAI_PYTHON_CLI_MODULE,
      command,
      "--wallet",
      this.wallet,
      "--password-fd",
      "0",
      "--profile",
      this.profile,
      ...this.profile === "xna" && !["init", "backup", "restore"].includes(command) ? ["--manifest-sha256", this.manifestSha256] : [],
      ...arguments_
    ];
    try {
      return await new Promise((resolveResult, rejectResult) => {
        const child = (0, import_node_child_process.spawn)(this.python, argv, {
          cwd: this.repository,
          env: { ...process.env, ...this.environment },
          stdio: ["pipe", "pipe", "pipe"]
        });
        let stdout = "";
        let stderr = "";
        let progressBuffer = "";
        let settled = false;
        const fail2 = (error) => {
          if (!settled) {
            settled = true;
            rejectResult(error);
          }
        };
        const timer = setTimeout(() => {
          child.kill("SIGKILL");
          fail2(new Error("wallet CLI timed out"));
        }, this.timeoutMs);
        child.stdout.on("data", (chunk) => {
          stdout += chunk.toString();
          if (stdout.length > 1e6) {
            child.kill("SIGKILL");
            fail2(new Error("wallet CLI output limit exceeded"));
          }
        });
        child.stderr.on("data", (chunk) => {
          const value = chunk.toString();
          stderr += value;
          progressBuffer += value;
          let end;
          while ((end = progressBuffer.indexOf("\n")) !== -1) {
            const line = progressBuffer.slice(0, end).trim();
            progressBuffer = progressBuffer.slice(end + 1);
            if (line.startsWith(NEURAI_PYTHON_PROGRESS_PREFIX) && typeof onProgress === "function") {
              try {
                onProgress({ stage: line.slice(NEURAI_PYTHON_PROGRESS_PREFIX.length) });
              } catch {
              }
            }
          }
          if (stderr.length > 1e6) {
            child.kill("SIGKILL");
            fail2(new Error("wallet CLI error output limit exceeded"));
          }
        });
        child.on("error", fail2);
        child.on("close", (code) => {
          clearTimeout(timer);
          if (settled) return;
          if (code !== 0) {
            fail2(new Error("wallet CLI failed: " + stderr.trim().slice(-1200)));
            return;
          }
          try {
            const parsed = resultObject(stdout, command);
            settled = true;
            resolveResult(parsed);
          } catch (error) {
            fail2(error);
          }
        });
        child.stdin.on("error", fail2);
        child.stdin.end(input, () => input.fill(0));
      });
    } finally {
      input.fill(0);
    }
  }
  init() {
    return this.#run("init", []);
  }
  backup(file) {
    return this.#run("backup", ["--file", (0, import_node_path.resolve)(nonempty(file, "backup file"))]);
  }
  restore(file) {
    return this.#run("restore", ["--file", (0, import_node_path.resolve)(nonempty(file, "backup file"))]);
  }
  funding({ amountSats, feeSats = 1e7, create = false } = {}) {
    if (this.profile !== "xna") throw new Error("funding helper is for XNA TEST only");
    if (!Number.isSafeInteger(feeSats) || feeSats < 1 || feeSats > 1e7) {
      throw new RangeError("invalid TEST feeSats");
    }
    return this.#run("funding", [
      "--artifacts",
      this.artifacts,
      "--node",
      this.node,
      "--amount-sats",
      satoshiText(amountSats, "amountSats"),
      "--fee-sats",
      String(feeSats),
      ...create ? ["--create"] : []
    ]);
  }
  recipient() {
    return this.#run("recipient", [
      "--artifacts",
      this.artifacts,
      "--node",
      this.node
    ]).then(descriptor);
  }
  scan({ fromHeight = 1, toHeight } = {}) {
    if (!Number.isSafeInteger(fromHeight) || fromHeight < 1) {
      throw new RangeError("fromHeight must be a positive safe integer");
    }
    if (toHeight !== void 0 && (!Number.isSafeInteger(toHeight) || toHeight < fromHeight)) {
      throw new RangeError("invalid toHeight");
    }
    const args = [
      "--artifacts",
      this.artifacts,
      "--node",
      this.node,
      "--from-height",
      String(fromHeight)
    ];
    if (toHeight !== void 0) args.push("--to-height", String(toHeight));
    return this.#run("scan", args);
  }
  async transact({
    kind,
    amountUnits,
    amountSats,
    splitSats,
    noteCm,
    recipients = [],
    recipient,
    broadcast = false,
    mine = false,
    feeSats,
    onProgress
  } = {}) {
    if (!["deposit", "transfer", "withdraw"].includes(kind)) {
      throw new TypeError("kind must be deposit, transfer or withdraw");
    }
    if (mine && !broadcast) {
      throw new RangeError("mine requires broadcast");
    }
    if (!this.source || !this.proverCode) {
      throw new Error("source and proverCode are needed for proof generation");
    }
    if (feeSats !== void 0 && (!Number.isSafeInteger(feeSats) || feeSats < 1 || feeSats > 1e7)) {
      throw new RangeError("feeSats must be between 1 and 10000000");
    }
    if (kind === "deposit") {
      if (this.profile === "xna") {
        if (amountUnits !== void 0) throw new TypeError("XNA uses amountSats");
        satoshiText(amountSats, "amountSats");
      } else {
        if (amountSats !== void 0) throw new TypeError("RWAX uses amountUnits");
        unit(amountUnits);
      }
    } else if (amountUnits !== void 0 || amountSats !== void 0) {
      throw new TypeError("amount is only for deposit");
    }
    if (kind === "transfer" && (!Array.isArray(recipients) || ![1, 2].includes(recipients.length))) {
      throw new RangeError("TEST transfer needs one or two shielded recipients");
    }
    if (this.profile === "xna" && kind === "transfer" && (!Array.isArray(splitSats) || splitSats.length !== recipients.length)) {
      throw new RangeError("XNA transfer needs one splitSats value per recipient");
    }
    if (this.profile === "rwax" && splitSats !== void 0) {
      throw new TypeError("splitSats only applies to XNA");
    }
    if (kind !== "transfer" && splitSats !== void 0) {
      throw new TypeError("splitSats only applies to transfer");
    }
    if (kind !== "transfer" && recipients.length !== 0) {
      throw new TypeError("recipients are only for transfer");
    }
    if (kind !== "withdraw" && recipient !== void 0) {
      throw new TypeError("transparent recipient is only for withdraw");
    }
    const args = [
      "--artifacts",
      this.artifacts,
      "--node",
      this.node,
      "--source",
      this.source,
      "--prover-code",
      this.proverCode,
      "--kind",
      kind
    ];
    if (kind === "deposit") {
      if (this.profile === "xna") args.push("--amount-sats", satoshiText(amountSats, "amountSats"));
      else args.push("--amount-units", String(amountUnits));
    }
    if (kind === "transfer" && this.profile === "xna") {
      for (const amount of splitSats) args.push("--split-sats", satoshiText(amount, "splitSats"));
    }
    if (noteCm !== void 0) args.push("--note-cm", noteCmText(noteCm));
    if (recipient !== void 0) args.push("--recipient", nonempty(recipient, "recipient"));
    if (feeSats !== void 0) args.push("--fee-sats", String(feeSats));
    if (broadcast) args.push("--broadcast");
    if (mine) args.push("--mine");
    let folder;
    try {
      if (kind === "transfer") {
        folder = await (0, import_promises.mkdtemp)((0, import_node_path.join)((0, import_node_os.tmpdir)(), "neurai-privacy-"));
        for (let i = 0; i < recipients.length; i++) {
          const path = (0, import_node_path.join)(folder, "recipient-" + i + ".json");
          await (0, import_promises.writeFile)(path, JSON.stringify(descriptor(recipients[i])), { mode: 384 });
          args.push("--shield-recipient", path);
        }
      }
      const result = await this.#run("transact", args, onProgress);
      if (!FORMS.has(result.form) || !HEX32.test(result.txid)) {
        throw new Error("wallet CLI returned an invalid transaction result");
      }
      return result;
    } finally {
      if (folder) await (0, import_promises.rm)(folder, { recursive: true, force: true });
    }
  }
};

// src/poseidon-constants.js
var POSEIDON_RC = [
  6745197990210204598374042828761989596302876299545964402857411729872131034734n,
  426281677759936592021316809065178817848084678679510574715894138690250139748n,
  4014188762916583598888942667424965430287497824629657219807941460227372577781n,
  21328925083209914769191926116470334003273872494252651254811226518870906634704n,
  19525217621804205041825319248827370085205895195618474548469181956339322154226n,
  1402547928439424661186498190603111095981986484908825517071607587179649375482n,
  18320863691943690091503704046057443633081959680694199244583676572077409194605n,
  17709820605501892134371743295301255810542620360751268064484461849423726103416n,
  15970119011175710804034336110979394557344217932580634635707518729185096681010n,
  9818625905832534778628436765635714771300533913823445439412501514317783880744n,
  6235167673500273618358172865171408902079591030551453531218774338170981503478n,
  12575685815457815780909564540589853169226710664203625668068862277336357031324n,
  7381963244739421891665696965695211188125933529845348367882277882370864309593n,
  14214782117460029685087903971105962785460806586237411939435376993762368956406n,
  13382692957873425730537487257409819532582973556007555550953772737680185788165n,
  2203881792421502412097043743980777162333765109810562102330023625047867378813n,
  2916799379096386059941979057020673941967403377243798575982519638429287573544n,
  4341714036313630002881786446132415875360643644216758539961571543427269293497n,
  2340590164268886572738332390117165591168622939528604352383836760095320678310n,
  5222233506067684445011741833180208249846813936652202885155168684515636170204n,
  7963328565263035669460582454204125526132426321764384712313576357234706922961n,
  1394121618978136816716817287892553782094854454366447781505650417569234586889n,
  20251767894547536128245030306810919879363877532719496013176573522769484883301n,
  141695147295366035069589946372747683366709960920818122842195372849143476473n,
  15919677773886738212551540894030218900525794162097204800782557234189587084981n,
  2616624285043480955310772600732442182691089413248613225596630696960447611520n,
  4740655602437503003625476760295930165628853341577914460831224100471301981787n,
  19201590924623513311141753466125212569043677014481753075022686585593991810752n,
  12116486795864712158501385780203500958268173542001460756053597574143933465696n,
  8481222075475748672358154589993007112877289817336436741649507712124418867136n,
  5181207870440376967537721398591028675236553829547043817076573656878024336014n,
  1576305643467537308202593927724028147293702201461402534316403041563704263752n,
  2555752030748925341265856133642532487884589978209403118872788051695546807407n,
  18840924862590752659304250828416640310422888056457367520753407434927494649454n,
  14593453114436356872569019099482380600010961031449147888385564231161572479535n,
  20826991704411880672028799007667199259549645488279985687894219600551387252871n,
  9159011389589751902277217485643457078922343616356921337993871236707687166408n,
  5605846325255071220412087261490782205304876403716989785167758520729893194481n,
  1148784255964739709393622058074925404369763692117037208398835319441214134867n,
  20945896491956417459309978192328611958993484165135279604807006821513499894540n,
  229312996389666104692157009189660162223783309871515463857687414818018508814n,
  21184391300727296923488439338697060571987191396173649012875080956309403646776n,
  21853424399738097885762888601689700621597911601971608617330124755808946442758n,
  12776298811140222029408960445729157525018582422120161448937390282915768616621n,
  7556638921712565671493830639474905252516049452878366640087648712509680826732n,
  19042212131548710076857572964084011858520620377048961573689299061399932349935n,
  12871359356889933725034558434803294882039795794349132643274844130484166679697n,
  3313271555224009399457959221795880655466141771467177849716499564904543504032n,
  15080780006046305940429266707255063673138269243146576829483541808378091931472n,
  21300668809180077730195066774916591829321297484129506780637389508430384679582n,
  20480395468049323836126447690964858840772494303543046543729776750771407319822n,
  10034492246236387932307199011778078115444704411143703430822959320969550003883n,
  19584962776865783763416938001503258436032522042569001300175637333222729790225n,
  20155726818439649091211122042505326538030503429443841583127932647435472711802n,
  13313554736139368941495919643765094930693458639277286513236143495391474916777n,
  14606609055603079181113315307204024259649959674048912770003912154260692161833n,
  5563317320536360357019805881367133322562055054443943486481491020841431450882n,
  10535419877021741166931390532371024954143141727751832596925779759801808223060n,
  12025323200952647772051708095132262602424463606315130667435888188024371598063n,
  2906495834492762782415522961458044920178260121151056598901462871824771097354n,
  19131970618309428864375891649512521128588657129006772405220584460225143887876n,
  8896386073442729425831367074375892129571226824899294414632856215758860965449n,
  7748212315898910829925509969895667732958278025359537472413515465768989125274n,
  422974903473869924285294686399247660575841594104291551918957116218939002865n,
  6398251826151191010634405259351528880538837895394722626439957170031528482771n,
  18978082967849498068717608127246258727629855559346799025101476822814831852169n,
  19150742296744826773994641927898928595714611370355487304294875666791554590142n,
  12896891575271590393203506752066427004153880610948642373943666975402674068209n,
  9546270356416926575977159110423162512143435321217584886616658624852959369669n,
  2159256158967802519099187112783460402410585039950369442740637803310736339200n,
  8911064487437952102278704807713767893452045491852457406400757953039127292263n,
  745203718271072817124702263707270113474103371777640557877379939715613501668n,
  19313999467876585876087962875809436559985619524211587308123441305315685710594n,
  13254105126478921521101199309550428567648131468564858698707378705299481802310n,
  1842081783060652110083740461228060164332599013503094142244413855982571335453n,
  9630707582521938235113899367442877106957117302212260601089037887382200262598n,
  5066637850921463603001689152130702510691309665971848984551789224031532240292n,
  4222575506342961001052323857466868245596202202118237252286417317084494678062n,
  2919565560395273474653456663643621058897649501626354982855207508310069954086n,
  6828792324689892364977311977277548750189770865063718432946006481461319858171n,
  2245543836264212411244499299744964607957732316191654500700776604707526766099n,
  19602444885919216544870739287153239096493385668743835386720501338355679311704n,
  8239538512351936341605373169291864076963368674911219628966947078336484944367n,
  15053013456316196458870481299866861595818749671771356646798978105863499965417n,
  7173615418515925804810790963571435428017065786053377450925733428353831789901n,
  8239211677777829016346247446855147819062679124993100113886842075069166957042n,
  15330855478780269194281285878526984092296288422420009233557393252489043181621n,
  10014883178425964324400942419088813432808659204697623248101862794157084619079n,
  14014440630268834826103915635277409547403899966106389064645466381170788813506n,
  3580284508947993352601712737893796312152276667249521401778537893620670305946n,
  2559754020964039399020874042785294258009596917335212876725104742182177996988n,
  14898657953331064524657146359621913343900897440154577299309964768812788279359n,
  2094037260225570753385567402013028115218264157081728958845544426054943497065n,
  18051086536715129874440142649831636862614413764019212222493256578581754875930n,
  21680659279808524976004872421382255670910633119979692059689680820959727969489n,
  13950668739013333802529221454188102772764935019081479852094403697438884885176n,
  9703845704528288130475698300068368924202959408694460208903346143576482802458n,
  12064310080154762977097567536495874701200266107682637369509532768346427148165n,
  16970760937630487134309762150133050221647250855182482010338640862111040175223n,
  9790997389841527686594908620011261506072956332346095631818178387333642218087n,
  16314772317774781682315680698375079500119933343877658265473913556101283387175n,
  82044870826814863425230825851780076663078706675282523830353041968943811739n,
  21696416499108261787701615667919260888528264686979598953977501999747075085778n,
  327771579314982889069767086599893095509690747425186236545716715062234528958n,
  4606746338794869835346679399457321301521448510419912225455957310754258695442n,
  64499140292086295251085369317820027058256893294990556166497635237544139149n,
  10455028514626281809317431738697215395754892241565963900707779591201786416553n,
  10421411526406559029881814534127830959833724368842872558146891658647152404488n,
  18848084335930758908929996602136129516563864917028006334090900573158639401697n,
  13844582069112758573505569452838731733665881813247931940917033313637916625267n,
  13488838454403536473492810836925746129625931018303120152441617863324950564617n,
  15742141787658576773362201234656079648895020623294182888893044264221895077688n,
  6756884846734501741323584200608866954194124526254904154220230538416015199997n,
  7860026400080412708388991924996537435137213401947704476935669541906823414404n,
  7871040688194276447149361970364037034145427598711982334898258974993423182255n,
  20758972836260983284101736686981180669442461217558708348216227791678564394086n,
  21723241881201839361054939276225528403036494340235482225557493179929400043949n,
  19428469330241922173653014973246050805326196062205770999171646238586440011910n,
  7969200143746252148180468265998213908636952110398450526104077406933642389443n,
  10950417916542216146808986264475443189195561844878185034086477052349738113024n,
  18149233917533571579549129116652755182249709970669448788972210488823719849654n,
  3729796741814967444466779622727009306670204996071028061336690366291718751463n,
  5172504399789702452458550583224415301790558941194337190035441508103183388987n,
  6686473297578275808822003704722284278892335730899287687997898239052863590235n,
  19426913098142877404613120616123695099909113097119499573837343516470853338513n,
  5120337081764243150760446206763109494847464512045895114970710519826059751800n,
  5055737465570446530938379301905385631528718027725177854815404507095601126720n,
  14235578612970484492268974539959119923625505766550088220840324058885914976980n,
  653592517890187950103239281291172267359747551606210609563961204572842639923n,
  5507360526092411682502736946959369987101940689834541471605074817375175870579n,
  7864202866011437199771472205361912625244234597659755013419363091895334445453n,
  21294659996736305811805196472076519801392453844037698272479731199885739891648n,
  13767183507040326119772335839274719411331242166231012705169069242737428254651n,
  810181532076738148308457416289197585577119693706380535394811298325092337781n,
  14232321930654703053193240133923161848171310212544136614525040874814292190478n,
  16796904728299128263054838299534612533844352058851230375569421467352578781209n,
  16256310366973209550759123431979563367001604350120872788217761535379268327259n,
  19791658638819031543640174069980007021961272701723090073894685478509001321817n,
  7046232469803978873754056165670086532908888046886780200907660308846356865119n,
  16001732848952745747636754668380555263330934909183814105655567108556497219752n,
  9737276123084413897604802930591512772593843242069849260396983774140735981896n,
  11410895086919039954381533622971292904413121053792570364694836768885182251535n,
  19098362474249267294548762387533474746422711206129028436248281690105483603471n,
  11013788190750472643548844759298623898218957233582881400726340624764440203586n,
  2206958256327295151076063922661677909471794458896944583339625762978736821035n,
  7171889270225471948987523104033632910444398328090760036609063776968837717795n,
  2510237900514902891152324520472140114359583819338640775472608119384714834368n,
  8825275525296082671615660088137472022727508654813239986303576303490504107418n,
  1481125575303576470988538039195271612778457110700618040436600537924912146613n,
  16268684562967416784133317570130804847322980788316762518215429249893668424280n,
  4681491452239189664806745521067158092729838954919425311759965958272644506354n,
  3131438137839074317765338377823608627360421824842227925080193892542578675835n,
  7930402370812046914611776451748034256998580373012248216998696754202474945793n,
  8973151117361309058790078507956716669068786070949641445408234962176963060145n,
  10223139291409280771165469989652431067575076252562753663259473331031932716923n,
  2232089286698717316374057160056566551249777684520809735680538268209217819725n,
  16930089744400890347392540468934821520000065594669279286854302439710657571308n,
  21739597952486540111798430281275997558482064077591840966152905690279247146674n,
  7508315029150148468008716674010060103310093296969466203204862163743615534994n,
  11418894863682894988747041469969889669847284797234703818032750410328384432224n,
  10895338268862022698088163806301557188640023613155321294365781481663489837917n,
  18644184384117747990653304688839904082421784959872380449968500304556054962449n,
  7414443845282852488299349772251184564170443662081877445177167932875038836497n,
  5391299369598751507276083947272874512197023231529277107201098701900193273851n,
  10329906873896253554985208009869159014028187242848161393978194008068001342262n,
  4711719500416619550464783480084256452493890461073147512131129596065578741786n,
  11943219201565014805519989716407790139241726526989183705078747065985453201504n,
  4298705349772984837150885571712355513879480272326239023123910904259614053334n,
  9999044003322463509208400801275356671266978396985433172455084837770460579627n,
  4908416131442887573991189028182614782884545304889259793974797565686968097291n,
  11963412684806827200577486696316210731159599844307091475104710684559519773777n,
  20129916000261129180023520480843084814481184380399868943565043864970719708502n,
  12884788430473747619080473633364244616344003003135883061507342348586143092592n,
  20286808211545908191036106582330883564479538831989852602050135926112143921015n,
  16282045180030846845043407450751207026423331632332114205316676731302016331498n,
  4332932669439410887701725251009073017227450696965904037736403407953448682093n,
  11105712698773407689561953778861118250080830258196150686012791790342360778288n,
  21853934471586954540926699232107176721894655187276984175226220218852955976831n,
  9807888223112768841912392164376763820266226276821186661925633831143729724792n,
  13411808896854134882869416756427789378942943805153730705795307450368858622668n,
  17906847067500673080192335286161014930416613104209700445088168479205894040011n,
  14554387648466176616800733804942239711702169161888492380425023505790070369632n,
  4264116751358967409634966292436919795665643055548061693088119780787376143967n,
  2401104597023440271473786738539405349187326308074330930748109868990675625380n,
  12251645483867233248963286274239998200789646392205783056343767189806123148785n,
  15331181254680049984374210433775713530849624954688899814297733641575188164316n,
  13108834590369183125338853868477110922788848506677889928217413952560148766472n,
  6843160824078397950058285123048455551935389277899379615286104657075620692224n,
  10151103286206275742153883485231683504642432930275602063393479013696349676320n,
  7074320081443088514060123546121507442501369977071685257650287261047855962224n,
  11413928794424774638606755585641504971720734248726394295158115188173278890938n,
  7312756097842145322667451519888915975561412209738441762091369106604423801080n,
  7181677521425162567568557182629489303281861794357882492140051324529826589361n,
  15123155547166304758320442783720138372005699143801247333941013553002921430306n,
  13409242754315411433193860530743374419854094495153957441316635981078068351329n
];
var POSEIDON_MDS = [
  7511745149465107256748700652201246547602992235352608707588321460060273774987n,
  10370080108974718697676803824769673834027675643658433702224577712625900127200n,
  19705173408229649878903981084052839426532978878058043055305024233888854471533n,
  18732019378264290557468133440468564866454307626475683536618613112504878618481n,
  20870176810702568768751421378473869562658540583882454726129544628203806653987n,
  7266061498423634438633389053804536045105766754026813321943009179476902321146n,
  9131299761947733513298312097611845208338517739621853568979632113419485819303n,
  10595341252162738537912664445405114076324478519622938027420701542910180337937n,
  11597556804922396090267472882856054602429588299176362916247939723151043581408n
];

// src/poseidon.js
var BN254_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
function canonical(value) {
  if (typeof value !== "bigint" || value < 0n || value >= BN254_SCALAR_FIELD) {
    throw new RangeError("noncanonical BN254 scalar field element");
  }
  return value;
}
function encodeField(value) {
  let remaining = canonical(value);
  const bytes4 = new Uint8Array(32);
  for (let index = 31; index >= 0; index--) {
    bytes4[index] = Number(remaining & 255n);
    remaining >>= 8n;
  }
  return bytes4;
}
function decodeField(bytes4) {
  if (!(bytes4 instanceof Uint8Array) || bytes4.length !== 32) {
    throw new TypeError("field element must contain 32 bytes");
  }
  let value = 0n;
  for (const byte of bytes4) value = value * 256n + BigInt(byte);
  return canonical(value);
}
function poseidonPermutation(input) {
  if (!Array.isArray(input) || input.length !== 3) {
    throw new TypeError("Poseidon state must have three elements");
  }
  let state = input.map(canonical);
  const field = BN254_SCALAR_FIELD;
  for (let round = 0; round < 65; round++) {
    const nonlinearity = state.map((value, index) => {
      const shifted = (value + POSEIDON_RC[round * 3 + index]) % field;
      if (index !== 0 && round >= 4 && round < 61) return shifted;
      const squared = shifted * shifted % field;
      return squared * squared % field * shifted % field;
    });
    state = [0, 1, 2].map((row) => (POSEIDON_MDS[row * 3] * nonlinearity[0] + POSEIDON_MDS[row * 3 + 1] * nonlinearity[1] + POSEIDON_MDS[row * 3 + 2] * nonlinearity[2]) % field);
  }
  return state;
}
function poseidonBytes(input) {
  if (!(input instanceof Uint8Array)) {
    throw new TypeError("Poseidon input must be bytes");
  }
  const size = Math.ceil((input.length + 1) / 31) * 31;
  const padded = new Uint8Array(size);
  padded.set(input);
  padded[input.length] = 1;
  let state = [0n, 0n, 0n];
  for (let offset = 0; offset < size; offset += 62) {
    for (let index = 0; index < 2; index++) {
      const start = offset + index * 31;
      if (start >= size) break;
      let element = 0n;
      for (let pos = start; pos < start + 31; pos++) {
        element = element * 256n + BigInt(padded[pos]);
      }
      state[index] = (state[index] + element) % BN254_SCALAR_FIELD;
    }
    state = poseidonPermutation(state);
  }
  return encodeField(state[0]);
}

// src/notes.js
var text = new TextEncoder();
var MAX_MONEY_SATS2 = 2100000000000000000n;
var X25519_FIELD = (1n << 255n) - 19n;
var OWNER_TAG = text.encode("NIP043/owner/CP1");
var NK_TAG = text.encode("NIP043/nk/CP1");
var CM_TAG = text.encode("NIP043/cm/CP1");
var NF_TAG = text.encode("NIP043/nf/CP1");
function bytes32(value, name) {
  if (!(value instanceof Uint8Array) || value.length !== 32) {
    throw new TypeError(`${name} must contain 32 bytes`);
  }
  return value;
}
function join2(...parts) {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}
function validViewPublic(value) {
  bytes32(value, "viewPub");
  let element = 0n;
  for (let i = 31; i >= 0; i--) element = element * 256n + BigInt(value[i]);
  if (element === 0n || element >= X25519_FIELD) {
    throw new RangeError("noncanonical X25519 view public key");
  }
  return value;
}
function amountValue(amount) {
  if (typeof amount !== "bigint" && !(typeof amount === "string" && /^[1-9][0-9]*$/.test(amount))) {
    throw new TypeError("amount must be an exact positive bigint or decimal string");
  }
  const value = BigInt(amount);
  if (value < 1n || value > MAX_MONEY_SATS2) {
    throw new RangeError("amount exceeds allowed atomic value");
  }
  return value;
}
function encodeNote({ domain, assetId, owner, viewPub, amountAtomic, rho }) {
  bytes32(domain, "domain");
  bytes32(assetId, "assetId");
  bytes32(owner, "owner");
  validViewPublic(viewPub);
  bytes32(rho, "rho");
  if (decodeField(owner) === 0n) throw new RangeError("owner must be nonzero");
  const amount = amountValue(amountAtomic);
  const littleEndian = new Uint8Array(8);
  let remaining = amount;
  for (let i = 0; i < 8; i++) {
    littleEndian[i] = Number(remaining & 255n);
    remaining >>= 8n;
  }
  return join2(Uint8Array.of(1), domain, assetId, owner, viewPub, littleEndian, rho);
}
function decodeNote(note) {
  if (!(note instanceof Uint8Array) || note.length !== 169 || note[0] !== 1) {
    throw new TypeError("invalid CP1 note encoding");
  }
  const domain = note.slice(1, 33);
  const assetId = note.slice(33, 65);
  const owner = note.slice(65, 97);
  const viewPub = validViewPublic(note.slice(97, 129));
  const rho = note.slice(137, 169);
  if (decodeField(owner) === 0n) throw new RangeError("owner must be nonzero");
  let amountAtomic = 0n;
  for (let i = 7; i >= 0; i--) amountAtomic = amountAtomic * 256n + BigInt(note[129 + i]);
  amountValue(amountAtomic);
  return { domain, assetId, owner, viewPub, amountAtomic, rho };
}
function deriveOwner(domain, spendSecret) {
  return poseidonBytes(join2(OWNER_TAG, bytes32(domain, "domain"), bytes32(spendSecret, "spendSecret")));
}
function deriveNullifierKey(domain, spendSecret) {
  return poseidonBytes(join2(NK_TAG, bytes32(domain, "domain"), bytes32(spendSecret, "spendSecret")));
}
function noteCommitment(note) {
  decodeNote(note);
  const cm = poseidonBytes(join2(CM_TAG, note));
  if (decodeField(cm) === 0n) throw new RangeError("note commitment must be nonzero");
  return cm;
}
function noteNullifier(note, spendSecret) {
  const { domain, owner, rho } = decodeNote(note);
  const derivedOwner = deriveOwner(domain, spendSecret);
  let different = 0;
  for (let i = 0; i < 32; i++) different |= owner[i] ^ derivedOwner[i];
  if (different !== 0) {
    throw new Error("spend secret does not own this note");
  }
  return poseidonBytes(join2(
    NF_TAG,
    domain,
    deriveNullifierKey(domain, spendSecret),
    rho,
    noteCommitment(note)
  ));
}

// node_modules/@noble/hashes/_u64.js
var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
var _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le2 = false) {
  if (le2)
    return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
  return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
function split(lst, le2 = false) {
  const len = lst.length;
  let Ah = new Uint32Array(len);
  let Al = new Uint32Array(len);
  for (let i = 0; i < len; i++) {
    const { h, l } = fromBig(lst[i], le2);
    [Ah[i], Al[i]] = [h, l];
  }
  return [Ah, Al];
}
var shrSH = (h, _l, s) => h >>> s;
var shrSL = (h, l, s) => h << 32 - s | l >>> s;
var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
var rotr32H = (_h, l) => l;
var rotr32L = (h, _l) => h;
function add(Ah, Al, Bh, Bl) {
  const l = (Al >>> 0) + (Bl >>> 0);
  return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
}
var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;

// node_modules/@noble/hashes/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
function anumber(n, title = "") {
  if (typeof n !== "number") {
    const prefix = title && `"${title}" `;
    throw new TypeError(`${prefix}expected number, got ${typeof n}`);
  }
  if (!Number.isSafeInteger(n) || n < 0) {
    const prefix = title && `"${title}" `;
    throw new RangeError(`${prefix}expected integer >= 0, got ${n}`);
  }
}
function abytes(value, length, title = "") {
  const bytes4 = isBytes(value);
  const len = value?.length;
  const needsLen = length !== void 0;
  if (!bytes4 || needsLen && len !== length) {
    const prefix = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes4 ? `length=${len}` : `type=${typeof value}`;
    const message2 = prefix + "expected Uint8Array" + ofLen + ", got " + got;
    if (!bytes4)
      throw new TypeError(message2);
    throw new RangeError(message2);
  }
  return value;
}
function ahash(h) {
  if (typeof h !== "function" || typeof h.create !== "function")
    throw new TypeError("Hash must wrapped by utils.createHasher");
  anumber(h.outputLen);
  anumber(h.blockLen);
  if (h.outputLen < 1)
    throw new Error('"outputLen" must be >= 1');
  if (h.blockLen < 1)
    throw new Error('"blockLen" must be >= 1');
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out, void 0, "digestInto() output");
  const min = instance.outputLen;
  if (out.length < min) {
    throw new RangeError('"digestInto() output" expected to be of length >=' + min);
  }
}
function u8(arr) {
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}
function u32(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
function byteSwap(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
var swap8IfBE = isLE ? (n) => n : (n) => byteSwap(n) >>> 0;
function byteSwap32(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = byteSwap(arr[i]);
  }
  return arr;
}
var swap32IfBE = isLE ? (u) => u : byteSwap32;
var hasHexBuiltin = /* @__PURE__ */ (() => (
  // @ts-ignore
  typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
))();
var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
function bytesToHex(bytes4) {
  abytes(bytes4);
  if (hasHexBuiltin)
    return bytes4.toHex();
  let hex7 = "";
  for (let i = 0; i < bytes4.length; i++) {
    hex7 += hexes[bytes4[i]];
  }
  return hex7;
}
var asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
function asciiToBase16(ch) {
  if (ch >= asciis._0 && ch <= asciis._9)
    return ch - asciis._0;
  if (ch >= asciis.A && ch <= asciis.F)
    return ch - (asciis.A - 10);
  if (ch >= asciis.a && ch <= asciis.f)
    return ch - (asciis.a - 10);
  return;
}
function hexToBytes(hex7) {
  if (typeof hex7 !== "string")
    throw new TypeError("hex string expected, got " + typeof hex7);
  if (hasHexBuiltin) {
    try {
      return Uint8Array.fromHex(hex7);
    } catch (error) {
      if (error instanceof SyntaxError)
        throw new RangeError(error.message);
      throw error;
    }
  }
  const hl = hex7.length;
  const al = hl / 2;
  if (hl % 2)
    throw new RangeError("hex string expected, got unpadded hex of length " + hl);
  const array = new Uint8Array(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex7.charCodeAt(hi));
    const n2 = asciiToBase16(hex7.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0) {
      const char = hex7[hi] + hex7[hi + 1];
      throw new RangeError('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array[ai] = n1 * 16 + n2;
  }
  return array;
}
var nextTick = async () => {
};
async function asyncLoop(iters, tick, cb) {
  let ts = Date.now();
  for (let i = 0; i < iters; i++) {
    cb(i);
    const diff = Date.now() - ts;
    if (diff >= 0 && diff < tick)
      continue;
    await nextTick();
    ts += diff;
  }
}
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new TypeError("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function kdfInputToBytes(data, errorTitle = "") {
  if (typeof data === "string")
    return utf8ToBytes(data);
  return abytes(data, void 0, errorTitle);
}
function concatBytes(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    abytes(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad);
    pad += a.length;
  }
  return res;
}
function checkOpts(defaults, opts) {
  if (opts !== void 0 && {}.toString.call(opts) !== "[object Object]")
    throw new TypeError("options must be object or undefined");
  const merged = Object.assign(defaults, opts);
  return merged;
}
function createHasher(hashCons, info = {}) {
  const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
  const tmp = hashCons(void 0);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.canXOF = tmp.canXOF;
  hashC.create = (opts) => hashCons(opts);
  Object.assign(hashC, info);
  return Object.freeze(hashC);
}
function randomBytes(bytesLength = 32) {
  anumber(bytesLength, "bytesLength");
  const cr = typeof globalThis === "object" ? globalThis.crypto : null;
  if (typeof cr?.getRandomValues !== "function")
    throw new Error("crypto.getRandomValues must be defined");
  if (bytesLength > 65536)
    throw new RangeError(`"bytesLength" expected <= 65536, got ${bytesLength}`);
  return cr.getRandomValues(new Uint8Array(bytesLength));
}
var oidNist = (suffix) => ({
  // Current NIST hashAlgs suffixes used here fit in one DER subidentifier octet.
  // Larger suffix values would need base-128 OID encoding and a different length byte.
  oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
});

// node_modules/@noble/hashes/_blake.js
var BSIGMA = /* @__PURE__ */ Uint8Array.from([
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3,
  11,
  8,
  12,
  0,
  5,
  2,
  15,
  13,
  10,
  14,
  3,
  6,
  7,
  1,
  9,
  4,
  7,
  9,
  3,
  1,
  13,
  12,
  11,
  14,
  2,
  6,
  5,
  10,
  4,
  0,
  15,
  8,
  9,
  0,
  5,
  7,
  2,
  4,
  10,
  15,
  14,
  1,
  11,
  12,
  6,
  8,
  3,
  13,
  2,
  12,
  6,
  10,
  0,
  11,
  8,
  3,
  4,
  13,
  7,
  5,
  15,
  14,
  1,
  9,
  12,
  5,
  1,
  15,
  14,
  13,
  4,
  10,
  0,
  7,
  6,
  3,
  9,
  2,
  8,
  11,
  13,
  11,
  7,
  14,
  12,
  1,
  3,
  9,
  5,
  0,
  15,
  4,
  8,
  6,
  2,
  10,
  6,
  15,
  14,
  9,
  11,
  3,
  0,
  8,
  12,
  2,
  13,
  7,
  1,
  4,
  10,
  5,
  10,
  2,
  8,
  4,
  7,
  6,
  1,
  5,
  15,
  11,
  9,
  14,
  3,
  12,
  13,
  0,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3,
  // Blake1, unused in others
  11,
  8,
  12,
  0,
  5,
  2,
  15,
  13,
  10,
  14,
  3,
  6,
  7,
  1,
  9,
  4,
  7,
  9,
  3,
  1,
  13,
  12,
  11,
  14,
  2,
  6,
  5,
  10,
  4,
  0,
  15,
  8,
  9,
  0,
  5,
  7,
  2,
  4,
  10,
  15,
  14,
  1,
  11,
  12,
  6,
  8,
  3,
  13,
  2,
  12,
  6,
  10,
  0,
  11,
  8,
  3,
  4,
  13,
  7,
  5,
  15,
  14,
  1,
  9
]);

// node_modules/@noble/hashes/_md.js
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD = class {
  blockLen;
  outputLen;
  canXOF = false;
  padOffset;
  isLE;
  // For partial updates less than block size
  buffer;
  view;
  finished = false;
  length = 0;
  pos = 0;
  destroyed = false;
  constructor(blockLen, outputLen, padOffset, isLE3) {
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE3;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    aexists(this);
    abytes(data);
    const { view, buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE: isLE3 } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++)
      buffer[i] = 0;
    view.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE3);
    this.process(view, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen must be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE3);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to ||= new this.constructor();
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (length % blockLen)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);
var SHA512_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  4089235720,
  3144134277,
  2227873595,
  1013904242,
  4271175723,
  2773480762,
  1595750129,
  1359893119,
  2917565137,
  2600822924,
  725511199,
  528734635,
  4215389547,
  1541459225,
  327033209
]);

// node_modules/@noble/hashes/blake2.js
var B2B_IV = /* @__PURE__ */ Uint32Array.from([
  4089235720,
  1779033703,
  2227873595,
  3144134277,
  4271175723,
  1013904242,
  1595750129,
  2773480762,
  2917565137,
  1359893119,
  725511199,
  2600822924,
  4215389547,
  528734635,
  327033209,
  1541459225
]);
var BBUF = /* @__PURE__ */ new Uint32Array(32);
function G1b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  let ll = add3L(Al, Bl, Xl);
  Ah = add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotr32H(Dh, Dl), Dl: rotr32L(Dh, Dl) });
  ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrSH(Bh, Bl, 24), Bl: rotrSL(Bh, Bl, 24) });
  BBUF[2 * a] = Al, BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl, BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl, BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl, BBUF[2 * d + 1] = Dh;
}
function G2b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  let ll = add3L(Al, Bl, Xl);
  Ah = add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotrSH(Dh, Dl, 16), Dl: rotrSL(Dh, Dl, 16) });
  ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrBH(Bh, Bl, 63), Bl: rotrBL(Bh, Bl, 63) });
  BBUF[2 * a] = Al, BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl, BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl, BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl, BBUF[2 * d + 1] = Dh;
}
function checkBlake2Opts(outputLen, opts = {}, keyLen, saltLen, persLen) {
  anumber(keyLen);
  if (outputLen <= 0 || outputLen > keyLen)
    throw new Error("outputLen bigger than keyLen");
  const { key, salt, personalization } = opts;
  if (key !== void 0 && (key.length < 1 || key.length > keyLen))
    throw new Error('"key" expected to be undefined or of length=1..' + keyLen);
  if (salt !== void 0)
    abytes(salt, saltLen, "salt");
  if (personalization !== void 0)
    abytes(personalization, persLen, "personalization");
}
var _BLAKE2 = class {
  buffer;
  buffer32;
  finished = false;
  destroyed = false;
  length = 0;
  pos = 0;
  blockLen;
  outputLen;
  canXOF = false;
  constructor(blockLen, outputLen) {
    anumber(blockLen);
    anumber(outputLen);
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.buffer = new Uint8Array(blockLen);
    this.buffer32 = u32(this.buffer);
  }
  update(data) {
    aexists(this);
    abytes(data);
    const { blockLen, buffer, buffer32 } = this;
    const len = data.length;
    const offset = data.byteOffset;
    const buf = data.buffer;
    for (let pos = 0; pos < len; ) {
      if (this.pos === blockLen) {
        swap32IfBE(buffer32);
        this.compress(buffer32, 0, false);
        swap32IfBE(buffer32);
        this.pos = 0;
      }
      const take = Math.min(blockLen - this.pos, len - pos);
      const dataOffset = offset + pos;
      if (take === blockLen && !(dataOffset % 4) && pos + take < len) {
        const data32 = new Uint32Array(buf, dataOffset, Math.floor((len - pos) / 4));
        swap32IfBE(data32);
        for (let pos32 = 0; pos + blockLen < len; pos32 += buffer32.length, pos += blockLen) {
          this.length += blockLen;
          this.compress(data32, pos32, false);
        }
        swap32IfBE(data32);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      this.length += take;
      pos += take;
    }
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    const { pos, buffer32 } = this;
    this.finished = true;
    clean(this.buffer.subarray(pos));
    swap32IfBE(buffer32);
    this.compress(buffer32, 0, true);
    swap32IfBE(buffer32);
    if (out.byteOffset & 3)
      throw new RangeError('"digestInto() output" expected 4-byte aligned byteOffset, got ' + out.byteOffset);
    const state = this.get();
    const out32 = u32(out);
    const full = Math.floor(this.outputLen / 4);
    for (let i = 0; i < full; i++)
      out32[i] = swap8IfBE(state[i]);
    const tail = this.outputLen % 4;
    if (!tail)
      return;
    const off = full * 4;
    const word = state[full];
    for (let i = 0; i < tail; i++)
      out[off + i] = word >>> 8 * i;
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    const { buffer, length, finished, destroyed, outputLen, pos } = this;
    to ||= new this.constructor({ dkLen: outputLen });
    to.set(...this.get());
    to.buffer.set(buffer);
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    to.outputLen = outputLen;
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var _BLAKE2b = class extends _BLAKE2 {
  // Same IV words as SHA-512 / BLAKE2b, encoded as LE u32 low/high halves.
  v0l = B2B_IV[0] | 0;
  v0h = B2B_IV[1] | 0;
  v1l = B2B_IV[2] | 0;
  v1h = B2B_IV[3] | 0;
  v2l = B2B_IV[4] | 0;
  v2h = B2B_IV[5] | 0;
  v3l = B2B_IV[6] | 0;
  v3h = B2B_IV[7] | 0;
  v4l = B2B_IV[8] | 0;
  v4h = B2B_IV[9] | 0;
  v5l = B2B_IV[10] | 0;
  v5h = B2B_IV[11] | 0;
  v6l = B2B_IV[12] | 0;
  v6h = B2B_IV[13] | 0;
  v7l = B2B_IV[14] | 0;
  v7h = B2B_IV[15] | 0;
  constructor(opts = {}) {
    const olen = opts.dkLen === void 0 ? 64 : opts.dkLen;
    super(128, olen);
    checkBlake2Opts(olen, opts, 64, 16, 16);
    let { key, personalization, salt } = opts;
    let keyLength = 0;
    if (key !== void 0) {
      abytes(key, void 0, "key");
      keyLength = key.length;
    }
    this.v0l ^= this.outputLen | keyLength << 8 | 1 << 16 | 1 << 24;
    if (salt !== void 0) {
      abytes(salt, void 0, "salt");
      const slt = u32(salt);
      this.v4l ^= swap8IfBE(slt[0]);
      this.v4h ^= swap8IfBE(slt[1]);
      this.v5l ^= swap8IfBE(slt[2]);
      this.v5h ^= swap8IfBE(slt[3]);
    }
    if (personalization !== void 0) {
      abytes(personalization, void 0, "personalization");
      const pers = u32(personalization);
      this.v6l ^= swap8IfBE(pers[0]);
      this.v6h ^= swap8IfBE(pers[1]);
      this.v7l ^= swap8IfBE(pers[2]);
      this.v7h ^= swap8IfBE(pers[3]);
    }
    if (key !== void 0) {
      const tmp = new Uint8Array(this.blockLen);
      tmp.set(key);
      this.update(tmp);
    }
  }
  // prettier-ignore
  get() {
    let { v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h } = this;
    return [v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h];
  }
  // prettier-ignore
  set(v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h) {
    this.v0l = v0l | 0;
    this.v0h = v0h | 0;
    this.v1l = v1l | 0;
    this.v1h = v1h | 0;
    this.v2l = v2l | 0;
    this.v2h = v2h | 0;
    this.v3l = v3l | 0;
    this.v3h = v3h | 0;
    this.v4l = v4l | 0;
    this.v4h = v4h | 0;
    this.v5l = v5l | 0;
    this.v5h = v5h | 0;
    this.v6l = v6l | 0;
    this.v6h = v6h | 0;
    this.v7l = v7l | 0;
    this.v7h = v7h | 0;
  }
  compress(msg, offset, isLast) {
    this.get().forEach((v, i) => BBUF[i] = v);
    BBUF.set(B2B_IV, 16);
    let { h, l } = fromBig(BigInt(this.length));
    BBUF[24] = B2B_IV[8] ^ l;
    BBUF[25] = B2B_IV[9] ^ h;
    if (isLast) {
      BBUF[28] = ~BBUF[28];
      BBUF[29] = ~BBUF[29];
    }
    let j = 0;
    const s = BSIGMA;
    for (let i = 0; i < 12; i++) {
      G1b(0, 4, 8, 12, msg, offset + 2 * s[j++]);
      G2b(0, 4, 8, 12, msg, offset + 2 * s[j++]);
      G1b(1, 5, 9, 13, msg, offset + 2 * s[j++]);
      G2b(1, 5, 9, 13, msg, offset + 2 * s[j++]);
      G1b(2, 6, 10, 14, msg, offset + 2 * s[j++]);
      G2b(2, 6, 10, 14, msg, offset + 2 * s[j++]);
      G1b(3, 7, 11, 15, msg, offset + 2 * s[j++]);
      G2b(3, 7, 11, 15, msg, offset + 2 * s[j++]);
      G1b(0, 5, 10, 15, msg, offset + 2 * s[j++]);
      G2b(0, 5, 10, 15, msg, offset + 2 * s[j++]);
      G1b(1, 6, 11, 12, msg, offset + 2 * s[j++]);
      G2b(1, 6, 11, 12, msg, offset + 2 * s[j++]);
      G1b(2, 7, 8, 13, msg, offset + 2 * s[j++]);
      G2b(2, 7, 8, 13, msg, offset + 2 * s[j++]);
      G1b(3, 4, 9, 14, msg, offset + 2 * s[j++]);
      G2b(3, 4, 9, 14, msg, offset + 2 * s[j++]);
    }
    this.v0l ^= BBUF[0] ^ BBUF[16];
    this.v0h ^= BBUF[1] ^ BBUF[17];
    this.v1l ^= BBUF[2] ^ BBUF[18];
    this.v1h ^= BBUF[3] ^ BBUF[19];
    this.v2l ^= BBUF[4] ^ BBUF[20];
    this.v2h ^= BBUF[5] ^ BBUF[21];
    this.v3l ^= BBUF[6] ^ BBUF[22];
    this.v3h ^= BBUF[7] ^ BBUF[23];
    this.v4l ^= BBUF[8] ^ BBUF[24];
    this.v4h ^= BBUF[9] ^ BBUF[25];
    this.v5l ^= BBUF[10] ^ BBUF[26];
    this.v5h ^= BBUF[11] ^ BBUF[27];
    this.v6l ^= BBUF[12] ^ BBUF[28];
    this.v6h ^= BBUF[13] ^ BBUF[29];
    this.v7l ^= BBUF[14] ^ BBUF[30];
    this.v7h ^= BBUF[15] ^ BBUF[31];
    clean(BBUF);
  }
  destroy() {
    this.destroyed = true;
    clean(this.buffer32);
    this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
};
var blake2b = /* @__PURE__ */ createHasher((opts) => new _BLAKE2b(opts));

// node_modules/@noble/hashes/argon2.js
var AT = { Argond2d: 0, Argon2i: 1, Argon2id: 2 };
var ARGON2_SYNC_POINTS = 4;
var abytesOrZero = (buf, errorTitle = "") => {
  if (buf === void 0)
    return Uint8Array.of();
  return kdfInputToBytes(buf, errorTitle);
};
function mul(a, b) {
  const aL = a & 65535;
  const aH = a >>> 16;
  const bL = b & 65535;
  const bH = b >>> 16;
  const ll = Math.imul(aL, bL);
  const hl = Math.imul(aH, bL);
  const lh = Math.imul(aL, bH);
  const hh = Math.imul(aH, bH);
  const carry = (ll >>> 16) + (hl & 65535) + lh;
  const high = hh + (hl >>> 16) + (carry >>> 16) | 0;
  const low = carry << 16 | ll & 65535;
  return { h: high, l: low };
}
function mul2(a, b) {
  const { h, l } = mul(a, b);
  return { h: (h << 1 | l >>> 31) & 4294967295, l: l << 1 & 4294967295 };
}
function blamka(Ah, Al, Bh, Bl) {
  const { h: Ch, l: Cl } = mul2(Al, Bl);
  const Rll = add3L(Al, Bl, Cl);
  return { h: add3H(Rll, Ah, Bh, Ch), l: Rll | 0 };
}
var A2_BUF = new Uint32Array(256);
function G(a, b, c, d) {
  let Al = A2_BUF[2 * a], Ah = A2_BUF[2 * a + 1];
  let Bl = A2_BUF[2 * b], Bh = A2_BUF[2 * b + 1];
  let Cl = A2_BUF[2 * c], Ch = A2_BUF[2 * c + 1];
  let Dl = A2_BUF[2 * d], Dh = A2_BUF[2 * d + 1];
  ({ h: Ah, l: Al } = blamka(Ah, Al, Bh, Bl));
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotr32H(Dh, Dl), Dl: rotr32L(Dh, Dl) });
  ({ h: Ch, l: Cl } = blamka(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrSH(Bh, Bl, 24), Bl: rotrSL(Bh, Bl, 24) });
  ({ h: Ah, l: Al } = blamka(Ah, Al, Bh, Bl));
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotrSH(Dh, Dl, 16), Dl: rotrSL(Dh, Dl, 16) });
  ({ h: Ch, l: Cl } = blamka(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrBH(Bh, Bl, 63), Bl: rotrBL(Bh, Bl, 63) });
  A2_BUF[2 * a] = Al, A2_BUF[2 * a + 1] = Ah;
  A2_BUF[2 * b] = Bl, A2_BUF[2 * b + 1] = Bh;
  A2_BUF[2 * c] = Cl, A2_BUF[2 * c + 1] = Ch;
  A2_BUF[2 * d] = Dl, A2_BUF[2 * d + 1] = Dh;
}
function P(v00, v01, v02, v03, v04, v05, v06, v07, v08, v09, v10, v11, v12, v13, v14, v15) {
  G(v00, v04, v08, v12);
  G(v01, v05, v09, v13);
  G(v02, v06, v10, v14);
  G(v03, v07, v11, v15);
  G(v00, v05, v10, v15);
  G(v01, v06, v11, v12);
  G(v02, v07, v08, v13);
  G(v03, v04, v09, v14);
}
function block(x, xPos, yPos, outPos, needXor) {
  for (let i = 0; i < 256; i++)
    A2_BUF[i] = x[xPos + i] ^ x[yPos + i];
  for (let i = 0; i < 128; i += 16) {
    P(i, i + 1, i + 2, i + 3, i + 4, i + 5, i + 6, i + 7, i + 8, i + 9, i + 10, i + 11, i + 12, i + 13, i + 14, i + 15);
  }
  for (let i = 0; i < 16; i += 2) {
    P(i, i + 1, i + 16, i + 17, i + 32, i + 33, i + 48, i + 49, i + 64, i + 65, i + 80, i + 81, i + 96, i + 97, i + 112, i + 113);
  }
  if (needXor)
    for (let i = 0; i < 256; i++)
      x[outPos + i] ^= A2_BUF[i] ^ x[xPos + i] ^ x[yPos + i];
  else
    for (let i = 0; i < 256; i++)
      x[outPos + i] = A2_BUF[i] ^ x[xPos + i] ^ x[yPos + i];
  clean(A2_BUF);
}
function Hp(A, dkLen) {
  const A8 = u8(A);
  const T = new Uint32Array(1);
  const T8 = u8(T);
  T[0] = swap8IfBE(dkLen);
  if (dkLen <= 64)
    return blake2b.create({ dkLen }).update(T8).update(A8).digest();
  const out = new Uint8Array(dkLen);
  let V = blake2b.create({}).update(T8).update(A8).digest();
  let pos = 0;
  out.set(V.subarray(0, 32));
  pos += 32;
  for (; dkLen - pos > 64; pos += 32) {
    const Vh = blake2b.create({}).update(V);
    Vh.digestInto(V);
    Vh.destroy();
    out.set(V.subarray(0, 32), pos);
  }
  out.set(blake2b(V, { dkLen: dkLen - pos }), pos);
  clean(V, T);
  return out;
}
function indexAlpha(r, s, laneLen, segmentLen, index, randL, sameLane = false) {
  let area;
  if (r === 0) {
    if (s === 0)
      area = index - 1;
    else if (sameLane)
      area = s * segmentLen + index - 1;
    else
      area = s * segmentLen + (index == 0 ? -1 : 0);
  } else if (sameLane)
    area = laneLen - segmentLen + index - 1;
  else
    area = laneLen - segmentLen + (index == 0 ? -1 : 0);
  const startPos = r !== 0 && s !== ARGON2_SYNC_POINTS - 1 ? (s + 1) * segmentLen : 0;
  const rel = area - 1 - mul(area, mul(randL, randL).h).h;
  return (startPos + rel) % laneLen;
}
var maxUint32 = Math.pow(2, 32);
function isU32(num) {
  return Number.isSafeInteger(num) && num >= 0 && num < maxUint32;
}
function argon2Opts(opts) {
  const merged = {
    version: 19,
    dkLen: 32,
    maxmem: maxUint32 - 1,
    asyncTick: 10
  };
  for (let [k, v] of Object.entries(opts))
    if (v !== void 0)
      merged[k] = v;
  const { dkLen, p, m, t, version, onProgress, asyncTick } = merged;
  if (!isU32(dkLen) || dkLen < 4)
    throw new Error('"dkLen" must be 4..');
  if (!isU32(p) || p < 1 || p >= Math.pow(2, 24))
    throw new Error('"p" must be 1..2^24');
  if (!isU32(m))
    throw new Error('"m" must be 0..2^32');
  if (!isU32(t) || t < 1)
    throw new Error('"t" (iterations) must be 1..2^32');
  if (onProgress !== void 0 && typeof onProgress !== "function")
    throw new Error('"progressCb" must be a function');
  anumber(asyncTick, "asyncTick");
  if (!isU32(m) || m < 8 * p)
    throw new Error('"m" (memory) must be at least 8*p bytes');
  if (version !== 16 && version !== 19)
    throw new Error('"version" must be 0x10 or 0x13, got ' + version);
  return merged;
}
function argon2Init(password, salt, type, opts) {
  password = kdfInputToBytes(password, "password");
  salt = kdfInputToBytes(salt, "salt");
  if (!isU32(password.length))
    throw new Error('"password" must be less of length 1..4Gb');
  if (!isU32(salt.length) || salt.length < 8)
    throw new Error('"salt" must be of length 8..4Gb');
  if (!Object.values(AT).includes(type))
    throw new Error('"type" was invalid');
  let { p, dkLen, m, t, version, key, personalization, maxmem, onProgress, asyncTick } = argon2Opts(opts);
  key = abytesOrZero(key, "key");
  personalization = abytesOrZero(personalization, "personalization");
  const h = blake2b.create();
  const BUF = new Uint32Array(1);
  const BUF8 = u8(BUF);
  for (let item of [p, dkLen, m, t, version, type]) {
    BUF[0] = swap8IfBE(item);
    h.update(BUF8);
  }
  for (let i of [password, salt, key, personalization]) {
    BUF[0] = swap8IfBE(i.length);
    h.update(BUF8).update(i);
  }
  const H0 = new Uint32Array(18);
  const H0_8 = u8(H0);
  h.digestInto(H0_8);
  const lanes = p;
  const mP = 4 * p * Math.floor(m / (ARGON2_SYNC_POINTS * p));
  const laneLen = Math.floor(mP / p);
  const segmentLen = Math.floor(laneLen / ARGON2_SYNC_POINTS);
  const memUsed = mP * 1024;
  if (!isU32(maxmem))
    throw new Error('"maxmem" expected <2**32, got ' + maxmem);
  if (memUsed > maxmem)
    throw new Error('"maxmem" limit was hit: memUsed(mP*1024)=' + memUsed + ", maxmem=" + maxmem);
  const B = new Uint32Array(memUsed / 4);
  for (let l = 0; l < p; l++) {
    const i = 256 * laneLen * l;
    H0[17] = swap8IfBE(l);
    H0[16] = swap8IfBE(0);
    B.set(swap32IfBE(u32(Hp(H0, 1024))), i);
    H0[16] = swap8IfBE(1);
    B.set(swap32IfBE(u32(Hp(H0, 1024))), i + 256);
  }
  let perBlock = () => {
  };
  if (onProgress) {
    const totalBlock = t * ARGON2_SYNC_POINTS * p * segmentLen - 2 * p;
    const callbackPer = Math.max(Math.floor(totalBlock / 1e4), 1);
    let blockCnt = 0;
    perBlock = () => {
      blockCnt++;
      if (onProgress && (!(blockCnt % callbackPer) || blockCnt === totalBlock))
        onProgress(blockCnt / totalBlock);
    };
  }
  clean(BUF, H0);
  return { type, mP, p, t, version, B, laneLen, lanes, segmentLen, dkLen, perBlock, asyncTick };
}
function argon2Output(B, p, laneLen, dkLen) {
  const B_final = new Uint32Array(256);
  for (let l = 0; l < p; l++)
    for (let j = 0; j < 256; j++)
      B_final[j] ^= B[256 * (laneLen * l + laneLen - 1) + j];
  const res = Hp(swap32IfBE(B_final), dkLen);
  clean(B, B_final);
  return res;
}
function processBlock(B, address, l, r, s, index, laneLen, segmentLen, lanes, offset, prev, dataIndependent, needXor) {
  if (offset % laneLen)
    prev = offset - 1;
  let randL, randH;
  if (dataIndependent) {
    let i128 = index % 128;
    if (i128 === 0) {
      address[256 + 12]++;
      block(address, 256, 2 * 256, 0, false);
      block(address, 0, 2 * 256, 0, false);
    }
    randL = address[2 * i128];
    randH = address[2 * i128 + 1];
  } else {
    const T = 256 * prev;
    randL = B[T];
    randH = B[T + 1];
  }
  const refLane = r === 0 && s === 0 ? l : randH % lanes;
  const refPos = indexAlpha(r, s, laneLen, segmentLen, index, randL, refLane == l);
  const refBlock = laneLen * refLane + refPos;
  block(B, 256 * prev, 256 * refBlock, offset * 256, needXor);
}
async function argon2Async(type, password, salt, opts) {
  const { mP, p, t, version, B, laneLen, lanes, segmentLen, dkLen, perBlock, asyncTick } = argon2Init(password, salt, type, opts);
  const address = new Uint32Array(3 * 256);
  address[256 + 6] = mP;
  address[256 + 8] = t;
  address[256 + 10] = type;
  let ts = Date.now();
  for (let r = 0; r < t; r++) {
    const needXor = r !== 0 && version === 19;
    address[256 + 0] = r;
    for (let s = 0; s < ARGON2_SYNC_POINTS; s++) {
      address[256 + 4] = s;
      const dataIndependent = type == AT.Argon2i || type == AT.Argon2id && r === 0 && s < 2;
      for (let l = 0; l < p; l++) {
        address[256 + 2] = l;
        address[256 + 12] = 0;
        let startPos = 0;
        if (r === 0 && s === 0) {
          startPos = 2;
          if (dataIndependent) {
            address[256 + 12]++;
            block(address, 256, 2 * 256, 0, false);
            block(address, 0, 2 * 256, 0, false);
          }
        }
        let offset = l * laneLen + s * segmentLen + startPos;
        let prev = offset % laneLen ? offset - 1 : offset + laneLen - 1;
        for (let index = startPos; index < segmentLen; index++, offset++, prev++) {
          perBlock();
          processBlock(B, address, l, r, s, index, laneLen, segmentLen, lanes, offset, prev, dataIndependent, needXor);
          const diff = Date.now() - ts;
          if (!(diff >= 0 && diff < asyncTick)) {
            await nextTick();
            ts += diff;
          }
        }
      }
    }
  }
  clean(address);
  return argon2Output(B, p, laneLen, dkLen);
}
var argon2idAsync = (password, salt, opts) => argon2Async(AT.Argon2id, password, salt, opts);

// node_modules/@noble/ciphers/utils.js
function isBytes2(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
function abool(b) {
  if (typeof b !== "boolean")
    throw new TypeError(`boolean expected, not ${b}`);
}
function anumber2(n) {
  if (typeof n !== "number")
    throw new TypeError("number expected, got " + typeof n);
  if (!Number.isSafeInteger(n) || n < 0)
    throw new RangeError("positive integer expected, got " + n);
}
function abytes2(value, length, title = "") {
  const bytes4 = isBytes2(value);
  const len = value?.length;
  const needsLen = length !== void 0;
  if (!bytes4 || needsLen && len !== length) {
    const prefix = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes4 ? `length=${len}` : `type=${typeof value}`;
    const message2 = prefix + "expected Uint8Array" + ofLen + ", got " + got;
    if (!bytes4)
      throw new TypeError(message2);
    throw new RangeError(message2);
  }
  return value;
}
function aexists2(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput2(out, instance, onlyAligned = false) {
  abytes2(out, void 0, "output");
  const min = instance.outputLen;
  if (out.length < min) {
    throw new RangeError("digestInto() expects output buffer of length at least " + min);
  }
  if (onlyAligned && !isAligned32(out))
    throw new Error("invalid output, must be aligned");
}
function u322(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean2(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView2(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
var isLE2 = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
var byteSwap2 = (word) => word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
var byteSwap322 = (arr) => {
  for (let i = 0; i < arr.length; i++)
    arr[i] = byteSwap2(arr[i]);
  return arr;
};
var swap32IfBE2 = isLE2 ? (u) => u : byteSwap322;
function checkOpts2(defaults, opts) {
  if (opts == null || typeof opts !== "object")
    throw new Error("options must be defined");
  const merged = Object.assign(defaults, opts);
  return merged;
}
function equalBytes(a, b) {
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++)
    diff |= a[i] ^ b[i];
  return diff === 0;
}
function wrapMacConstructor(keyLen, macCons, fromMsg) {
  const mac = macCons;
  const getArgs = fromMsg || (() => []);
  const macC = (msg, key) => mac(key, ...getArgs(msg)).update(msg).digest();
  const tmp = mac(new Uint8Array(keyLen), ...getArgs(new Uint8Array(0)));
  macC.outputLen = tmp.outputLen;
  macC.blockLen = tmp.blockLen;
  macC.create = (key, ...args) => mac(key, ...args);
  return macC;
}
var wrapCipher = /* @__NO_SIDE_EFFECTS__ */ (params, constructor) => {
  function wrappedCipher(key, ...args) {
    abytes2(key, void 0, "key");
    if (params.nonceLength !== void 0) {
      const nonce = args[0];
      abytes2(nonce, params.varSizeNonce ? void 0 : params.nonceLength, "nonce");
    }
    const tagl = params.tagLength;
    if (tagl && args[1] !== void 0)
      abytes2(args[1], void 0, "AAD");
    const cipher = constructor(key, ...args);
    const checkOutput = (fnLength, output) => {
      if (output !== void 0) {
        if (fnLength !== 2)
          throw new Error("cipher output not supported");
        abytes2(output, void 0, "output");
      }
    };
    let called = false;
    const wrCipher = {
      encrypt(data, output) {
        if (called)
          throw new Error("cannot encrypt() twice with same key + nonce");
        called = true;
        abytes2(data);
        checkOutput(cipher.encrypt.length, output);
        return cipher.encrypt(data, output);
      },
      decrypt(data, output) {
        abytes2(data);
        if (tagl && data.length < tagl)
          throw new Error('"ciphertext" expected length bigger than tagLength=' + tagl);
        checkOutput(cipher.decrypt.length, output);
        return cipher.decrypt(data, output);
      }
    };
    return wrCipher;
  }
  Object.assign(wrappedCipher, params);
  return wrappedCipher;
};
function getOutput(expectedLength, out, onlyAligned = true) {
  if (out === void 0)
    return new Uint8Array(expectedLength);
  abytes2(out, void 0, "output");
  if (out.length !== expectedLength)
    throw new Error('"output" expected Uint8Array of length ' + expectedLength + ", got: " + out.length);
  if (onlyAligned && !isAligned32(out))
    throw new Error("invalid output, must be aligned");
  return out;
}
function u64Lengths(dataLength, aadLength, isLE3) {
  anumber2(dataLength);
  anumber2(aadLength);
  abool(isLE3);
  const num = new Uint8Array(16);
  const view = createView2(num);
  view.setBigUint64(0, BigInt(aadLength), isLE3);
  view.setBigUint64(8, BigInt(dataLength), isLE3);
  return num;
}
function isAligned32(bytes4) {
  return bytes4.byteOffset % 4 === 0;
}
function copyBytes(bytes4) {
  return Uint8Array.from(abytes2(bytes4));
}

// node_modules/@noble/ciphers/_arx.js
var encodeStr = (str) => Uint8Array.from(str.split(""), (c) => c.charCodeAt(0));
var sigma16_32 = /* @__PURE__ */ (() => swap32IfBE2(u322(encodeStr("expand 16-byte k"))))();
var sigma32_32 = /* @__PURE__ */ (() => swap32IfBE2(u322(encodeStr("expand 32-byte k"))))();
function rotl(a, b) {
  return a << b | a >>> 32 - b;
}
var BLOCK_LEN = 64;
var BLOCK_LEN32 = 16;
var MAX_COUNTER = /* @__PURE__ */ (() => 2 ** 32 - 1)();
var U32_EMPTY = /* @__PURE__ */ Uint32Array.of();
function runCipher(core, sigma, key, nonce, data, output, counter, rounds) {
  const len = data.length;
  const block2 = new Uint8Array(BLOCK_LEN);
  const b32 = u322(block2);
  const isAligned = isLE2 && isAligned32(data) && isAligned32(output);
  const d32 = isAligned ? u322(data) : U32_EMPTY;
  const o32 = isAligned ? u322(output) : U32_EMPTY;
  if (!isLE2) {
    for (let pos = 0; pos < len; counter++) {
      core(sigma, key, nonce, b32, counter, rounds);
      swap32IfBE2(b32);
      if (counter >= MAX_COUNTER)
        throw new Error("arx: counter overflow");
      const take = Math.min(BLOCK_LEN, len - pos);
      for (let j = 0, posj; j < take; j++) {
        posj = pos + j;
        output[posj] = data[posj] ^ block2[j];
      }
      pos += take;
    }
    return;
  }
  for (let pos = 0; pos < len; counter++) {
    core(sigma, key, nonce, b32, counter, rounds);
    if (counter >= MAX_COUNTER)
      throw new Error("arx: counter overflow");
    const take = Math.min(BLOCK_LEN, len - pos);
    if (isAligned && take === BLOCK_LEN) {
      const pos32 = pos / 4;
      if (pos % 4 !== 0)
        throw new Error("arx: invalid block position");
      for (let j = 0, posj; j < BLOCK_LEN32; j++) {
        posj = pos32 + j;
        o32[posj] = d32[posj] ^ b32[j];
      }
      pos += BLOCK_LEN;
      continue;
    }
    for (let j = 0, posj; j < take; j++) {
      posj = pos + j;
      output[posj] = data[posj] ^ block2[j];
    }
    pos += take;
  }
}
function createCipher(core, opts) {
  const { allowShortKeys, extendNonceFn, counterLength, counterRight, rounds } = checkOpts2({ allowShortKeys: false, counterLength: 8, counterRight: false, rounds: 20 }, opts);
  if (typeof core !== "function")
    throw new Error("core must be a function");
  anumber2(counterLength);
  anumber2(rounds);
  abool(counterRight);
  abool(allowShortKeys);
  return (key, nonce, data, output, counter = 0) => {
    abytes2(key, void 0, "key");
    abytes2(nonce, void 0, "nonce");
    abytes2(data, void 0, "data");
    const len = data.length;
    output = getOutput(len, output, false);
    anumber2(counter);
    if (counter < 0 || counter >= MAX_COUNTER)
      throw new Error("arx: counter overflow");
    const toClean = [];
    let l = key.length;
    let k;
    let sigma;
    if (l === 32) {
      toClean.push(k = copyBytes(key));
      sigma = sigma32_32;
    } else if (l === 16 && allowShortKeys) {
      k = new Uint8Array(32);
      k.set(key);
      k.set(key, 16);
      sigma = sigma16_32;
      toClean.push(k);
    } else {
      abytes2(key, 32, "arx key");
      throw new Error("invalid key size");
    }
    if (!isLE2 || !isAligned32(nonce))
      toClean.push(nonce = copyBytes(nonce));
    let k32 = u322(k);
    if (extendNonceFn) {
      if (nonce.length !== 24)
        throw new Error(`arx: extended nonce must be 24 bytes`);
      const n16 = nonce.subarray(0, 16);
      if (isLE2)
        extendNonceFn(sigma, k32, u322(n16), k32);
      else {
        const sigmaRaw = swap32IfBE2(Uint32Array.from(sigma));
        extendNonceFn(sigmaRaw, k32, u322(n16), k32);
        clean2(sigmaRaw);
        swap32IfBE2(k32);
      }
      nonce = nonce.subarray(16);
    } else if (!isLE2)
      swap32IfBE2(k32);
    const nonceNcLen = 16 - counterLength;
    if (nonceNcLen !== nonce.length)
      throw new Error(`arx: nonce must be ${nonceNcLen} or 16 bytes`);
    if (nonceNcLen !== 12) {
      const nc = new Uint8Array(12);
      nc.set(nonce, counterRight ? 0 : 12 - nonce.length);
      nonce = nc;
      toClean.push(nonce);
    }
    const n32 = swap32IfBE2(u322(nonce));
    try {
      runCipher(core, sigma, k32, n32, data, output, counter, rounds);
      return output;
    } finally {
      clean2(...toClean);
    }
  };
}

// node_modules/@noble/ciphers/_poly1305.js
function u8to16(a, i) {
  return a[i++] & 255 | (a[i++] & 255) << 8;
}
var Poly1305 = class {
  blockLen = 16;
  outputLen = 16;
  buffer = new Uint8Array(16);
  r = new Uint16Array(10);
  // Allocating 1 array with .subarray() here is slower than 3
  h = new Uint16Array(10);
  pad = new Uint16Array(8);
  pos = 0;
  finished = false;
  destroyed = false;
  // Can be speed-up using BigUint64Array, at the cost of complexity
  constructor(key) {
    key = copyBytes(abytes2(key, 32, "key"));
    const t0 = u8to16(key, 0);
    const t1 = u8to16(key, 2);
    const t2 = u8to16(key, 4);
    const t3 = u8to16(key, 6);
    const t4 = u8to16(key, 8);
    const t5 = u8to16(key, 10);
    const t6 = u8to16(key, 12);
    const t7 = u8to16(key, 14);
    this.r[0] = t0 & 8191;
    this.r[1] = (t0 >>> 13 | t1 << 3) & 8191;
    this.r[2] = (t1 >>> 10 | t2 << 6) & 7939;
    this.r[3] = (t2 >>> 7 | t3 << 9) & 8191;
    this.r[4] = (t3 >>> 4 | t4 << 12) & 255;
    this.r[5] = t4 >>> 1 & 8190;
    this.r[6] = (t4 >>> 14 | t5 << 2) & 8191;
    this.r[7] = (t5 >>> 11 | t6 << 5) & 8065;
    this.r[8] = (t6 >>> 8 | t7 << 8) & 8191;
    this.r[9] = t7 >>> 5 & 127;
    for (let i = 0; i < 8; i++)
      this.pad[i] = u8to16(key, 16 + 2 * i);
  }
  process(data, offset, isLast = false) {
    const hibit = isLast ? 0 : 1 << 11;
    const { h, r } = this;
    const r0 = r[0];
    const r1 = r[1];
    const r2 = r[2];
    const r3 = r[3];
    const r4 = r[4];
    const r5 = r[5];
    const r6 = r[6];
    const r7 = r[7];
    const r8 = r[8];
    const r9 = r[9];
    const t0 = u8to16(data, offset + 0);
    const t1 = u8to16(data, offset + 2);
    const t2 = u8to16(data, offset + 4);
    const t3 = u8to16(data, offset + 6);
    const t4 = u8to16(data, offset + 8);
    const t5 = u8to16(data, offset + 10);
    const t6 = u8to16(data, offset + 12);
    const t7 = u8to16(data, offset + 14);
    let h0 = h[0] + (t0 & 8191);
    let h1 = h[1] + ((t0 >>> 13 | t1 << 3) & 8191);
    let h2 = h[2] + ((t1 >>> 10 | t2 << 6) & 8191);
    let h3 = h[3] + ((t2 >>> 7 | t3 << 9) & 8191);
    let h4 = h[4] + ((t3 >>> 4 | t4 << 12) & 8191);
    let h5 = h[5] + (t4 >>> 1 & 8191);
    let h6 = h[6] + ((t4 >>> 14 | t5 << 2) & 8191);
    let h7 = h[7] + ((t5 >>> 11 | t6 << 5) & 8191);
    let h8 = h[8] + ((t6 >>> 8 | t7 << 8) & 8191);
    let h9 = h[9] + (t7 >>> 5 | hibit);
    let c = 0;
    let d0 = c + h0 * r0 + h1 * (5 * r9) + h2 * (5 * r8) + h3 * (5 * r7) + h4 * (5 * r6);
    c = d0 >>> 13;
    d0 &= 8191;
    d0 += h5 * (5 * r5) + h6 * (5 * r4) + h7 * (5 * r3) + h8 * (5 * r2) + h9 * (5 * r1);
    c += d0 >>> 13;
    d0 &= 8191;
    let d1 = c + h0 * r1 + h1 * r0 + h2 * (5 * r9) + h3 * (5 * r8) + h4 * (5 * r7);
    c = d1 >>> 13;
    d1 &= 8191;
    d1 += h5 * (5 * r6) + h6 * (5 * r5) + h7 * (5 * r4) + h8 * (5 * r3) + h9 * (5 * r2);
    c += d1 >>> 13;
    d1 &= 8191;
    let d2 = c + h0 * r2 + h1 * r1 + h2 * r0 + h3 * (5 * r9) + h4 * (5 * r8);
    c = d2 >>> 13;
    d2 &= 8191;
    d2 += h5 * (5 * r7) + h6 * (5 * r6) + h7 * (5 * r5) + h8 * (5 * r4) + h9 * (5 * r3);
    c += d2 >>> 13;
    d2 &= 8191;
    let d3 = c + h0 * r3 + h1 * r2 + h2 * r1 + h3 * r0 + h4 * (5 * r9);
    c = d3 >>> 13;
    d3 &= 8191;
    d3 += h5 * (5 * r8) + h6 * (5 * r7) + h7 * (5 * r6) + h8 * (5 * r5) + h9 * (5 * r4);
    c += d3 >>> 13;
    d3 &= 8191;
    let d4 = c + h0 * r4 + h1 * r3 + h2 * r2 + h3 * r1 + h4 * r0;
    c = d4 >>> 13;
    d4 &= 8191;
    d4 += h5 * (5 * r9) + h6 * (5 * r8) + h7 * (5 * r7) + h8 * (5 * r6) + h9 * (5 * r5);
    c += d4 >>> 13;
    d4 &= 8191;
    let d5 = c + h0 * r5 + h1 * r4 + h2 * r3 + h3 * r2 + h4 * r1;
    c = d5 >>> 13;
    d5 &= 8191;
    d5 += h5 * r0 + h6 * (5 * r9) + h7 * (5 * r8) + h8 * (5 * r7) + h9 * (5 * r6);
    c += d5 >>> 13;
    d5 &= 8191;
    let d6 = c + h0 * r6 + h1 * r5 + h2 * r4 + h3 * r3 + h4 * r2;
    c = d6 >>> 13;
    d6 &= 8191;
    d6 += h5 * r1 + h6 * r0 + h7 * (5 * r9) + h8 * (5 * r8) + h9 * (5 * r7);
    c += d6 >>> 13;
    d6 &= 8191;
    let d7 = c + h0 * r7 + h1 * r6 + h2 * r5 + h3 * r4 + h4 * r3;
    c = d7 >>> 13;
    d7 &= 8191;
    d7 += h5 * r2 + h6 * r1 + h7 * r0 + h8 * (5 * r9) + h9 * (5 * r8);
    c += d7 >>> 13;
    d7 &= 8191;
    let d8 = c + h0 * r8 + h1 * r7 + h2 * r6 + h3 * r5 + h4 * r4;
    c = d8 >>> 13;
    d8 &= 8191;
    d8 += h5 * r3 + h6 * r2 + h7 * r1 + h8 * r0 + h9 * (5 * r9);
    c += d8 >>> 13;
    d8 &= 8191;
    let d9 = c + h0 * r9 + h1 * r8 + h2 * r7 + h3 * r6 + h4 * r5;
    c = d9 >>> 13;
    d9 &= 8191;
    d9 += h5 * r4 + h6 * r3 + h7 * r2 + h8 * r1 + h9 * r0;
    c += d9 >>> 13;
    d9 &= 8191;
    c = (c << 2) + c | 0;
    c = c + d0 | 0;
    d0 = c & 8191;
    c = c >>> 13;
    d1 += c;
    h[0] = d0;
    h[1] = d1;
    h[2] = d2;
    h[3] = d3;
    h[4] = d4;
    h[5] = d5;
    h[6] = d6;
    h[7] = d7;
    h[8] = d8;
    h[9] = d9;
  }
  finalize() {
    const { h, pad } = this;
    const g = new Uint16Array(10);
    let c = h[1] >>> 13;
    h[1] &= 8191;
    for (let i = 2; i < 10; i++) {
      h[i] += c;
      c = h[i] >>> 13;
      h[i] &= 8191;
    }
    h[0] += c * 5;
    c = h[0] >>> 13;
    h[0] &= 8191;
    h[1] += c;
    c = h[1] >>> 13;
    h[1] &= 8191;
    h[2] += c;
    g[0] = h[0] + 5;
    c = g[0] >>> 13;
    g[0] &= 8191;
    for (let i = 1; i < 10; i++) {
      g[i] = h[i] + c;
      c = g[i] >>> 13;
      g[i] &= 8191;
    }
    g[9] -= 1 << 13;
    let mask2 = (c ^ 1) - 1;
    for (let i = 0; i < 10; i++)
      g[i] &= mask2;
    mask2 = ~mask2;
    for (let i = 0; i < 10; i++)
      h[i] = h[i] & mask2 | g[i];
    h[0] = (h[0] | h[1] << 13) & 65535;
    h[1] = (h[1] >>> 3 | h[2] << 10) & 65535;
    h[2] = (h[2] >>> 6 | h[3] << 7) & 65535;
    h[3] = (h[3] >>> 9 | h[4] << 4) & 65535;
    h[4] = (h[4] >>> 12 | h[5] << 1 | h[6] << 14) & 65535;
    h[5] = (h[6] >>> 2 | h[7] << 11) & 65535;
    h[6] = (h[7] >>> 5 | h[8] << 8) & 65535;
    h[7] = (h[8] >>> 8 | h[9] << 5) & 65535;
    let f = h[0] + pad[0];
    h[0] = f & 65535;
    for (let i = 1; i < 8; i++) {
      f = (h[i] + pad[i] | 0) + (f >>> 16) | 0;
      h[i] = f & 65535;
    }
    clean2(g);
  }
  update(data) {
    aexists2(this);
    abytes2(data);
    data = copyBytes(data);
    const { buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(data, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(buffer, 0, false);
        this.pos = 0;
      }
    }
    return this;
  }
  destroy() {
    this.destroyed = true;
    clean2(this.h, this.r, this.buffer, this.pad);
  }
  digestInto(out) {
    aexists2(this);
    aoutput2(out, this);
    this.finished = true;
    const { buffer, h } = this;
    let { pos } = this;
    if (pos) {
      buffer[pos++] = 1;
      for (; pos < 16; pos++)
        buffer[pos] = 0;
      this.process(buffer, 0, true);
    }
    this.finalize();
    let opos = 0;
    for (let i = 0; i < 8; i++) {
      out[opos++] = h[i] >>> 0;
      out[opos++] = h[i] >>> 8;
    }
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
};
var poly1305 = /* @__PURE__ */ wrapMacConstructor(32, (key) => new Poly1305(key));

// node_modules/@noble/ciphers/chacha.js
function chachaCore(s, k, n, out, cnt, rounds = 20) {
  let y00 = s[0], y01 = s[1], y02 = s[2], y03 = s[3], y04 = k[0], y05 = k[1], y06 = k[2], y07 = k[3], y08 = k[4], y09 = k[5], y10 = k[6], y11 = k[7], y12 = cnt, y13 = n[0], y14 = n[1], y15 = n[2];
  let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
  for (let r = 0; r < rounds; r += 2) {
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 16);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 12);
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 8);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 7);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 16);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 12);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 8);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 7);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 16);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 12);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 8);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 7);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 16);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 12);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 8);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 7);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 16);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 12);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 8);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 7);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 16);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 12);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 8);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 7);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 16);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 12);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 8);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 7);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 16);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 12);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 8);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 7);
  }
  let oi = 0;
  out[oi++] = y00 + x00 | 0;
  out[oi++] = y01 + x01 | 0;
  out[oi++] = y02 + x02 | 0;
  out[oi++] = y03 + x03 | 0;
  out[oi++] = y04 + x04 | 0;
  out[oi++] = y05 + x05 | 0;
  out[oi++] = y06 + x06 | 0;
  out[oi++] = y07 + x07 | 0;
  out[oi++] = y08 + x08 | 0;
  out[oi++] = y09 + x09 | 0;
  out[oi++] = y10 + x10 | 0;
  out[oi++] = y11 + x11 | 0;
  out[oi++] = y12 + x12 | 0;
  out[oi++] = y13 + x13 | 0;
  out[oi++] = y14 + x14 | 0;
  out[oi++] = y15 + x15 | 0;
}
var chacha20 = /* @__PURE__ */ createCipher(chachaCore, {
  counterRight: false,
  counterLength: 4,
  allowShortKeys: false
});
var ZEROS16 = /* @__PURE__ */ new Uint8Array(16);
var updatePadded = (h, msg) => {
  h.update(msg);
  const leftover = msg.length % 16;
  if (leftover)
    h.update(ZEROS16.subarray(leftover));
};
var ZEROS32 = /* @__PURE__ */ new Uint8Array(32);
function computeTag(fn, key, nonce, ciphertext, AAD3) {
  if (AAD3 !== void 0)
    abytes2(AAD3, void 0, "AAD");
  const authKey = fn(key, nonce, ZEROS32);
  const lengths = u64Lengths(ciphertext.length, AAD3 ? AAD3.length : 0, true);
  const h = poly1305.create(authKey);
  if (AAD3)
    updatePadded(h, AAD3);
  updatePadded(h, ciphertext);
  h.update(lengths);
  const res = h.digest();
  clean2(authKey, lengths);
  return res;
}
var _poly1305_aead = (xorStream) => (key, nonce, AAD3) => {
  const tagLength = 16;
  return {
    encrypt(plaintext, output) {
      const plength = plaintext.length;
      output = getOutput(plength + tagLength, output, false);
      output.set(plaintext);
      const oPlain = output.subarray(0, -tagLength);
      xorStream(key, nonce, oPlain, oPlain, 1);
      const tag2 = computeTag(xorStream, key, nonce, oPlain, AAD3);
      output.set(tag2, plength);
      clean2(tag2);
      return output;
    },
    decrypt(ciphertext, output) {
      output = getOutput(ciphertext.length - tagLength, output, false);
      const data = ciphertext.subarray(0, -tagLength);
      const passedTag = ciphertext.subarray(-tagLength);
      const tag2 = computeTag(xorStream, key, nonce, data, AAD3);
      if (!equalBytes(passedTag, tag2)) {
        clean2(tag2);
        throw new Error("invalid tag");
      }
      output.set(ciphertext.subarray(0, -tagLength));
      xorStream(key, nonce, output, output, 1);
      clean2(tag2);
      return output;
    }
  };
};
var chacha20poly1305 = /* @__PURE__ */ wrapCipher(
  { blockSize: 64, nonceLength: 12, tagLength: 16 },
  /* @__PURE__ */ _poly1305_aead(chacha20)
);

// src/vault.js
var utf8 = new TextEncoder();
var decoder = new TextDecoder("utf-8", { fatal: true });
var VAULT_AAD = utf8.encode(NEURAI_TEST_VAULT_AAD_V1);
var MEMORY_KIB = 64 * 1024;
var MAX_CIPHERTEXT = 16 * 1024 * 1024;
function bytesToHex3(bytes4) {
  return Array.from(bytes4, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function hexToBytes2(hex7, length, name) {
  if (typeof hex7 !== "string" || !/^(?:[0-9a-f]{2})+$/i.test(hex7) || length !== null && hex7.length !== length * 2) {
    throw new TypeError(`invalid wallet vault ${name}`);
  }
  return Uint8Array.from(hex7.match(/../g), (pair2) => parseInt(pair2, 16));
}
function passwordBytes(password) {
  const bytes4 = typeof password === "string" ? utf8.encode(password) : password;
  if (!(bytes4 instanceof Uint8Array) || bytes4.length === 0) {
    throw new TypeError("nonempty wallet password required");
  }
  return bytes4;
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
      salt: bytesToHex3(salt),
      nonce: bytesToHex3(nonce),
      ciphertext: bytesToHex3(ciphertext)
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
  const salt = hexToBytes2(envelope.salt, 16, "salt");
  const nonce = hexToBytes2(envelope.nonce, 12, "nonce");
  const ciphertext = hexToBytes2(envelope.ciphertext, null, "ciphertext");
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

// node_modules/@noble/hashes/sha2.js
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA2_32B = class extends HashMD {
  constructor(outputLen) {
    super(64, outputLen, 8, false);
  }
  get() {
    const { A, B, C, D, E, F, G: G2, H } = this;
    return [A, B, C, D, E, F, G2, H];
  }
  // prettier-ignore
  set(A, B, C, D, E, F, G2, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G2 | 0;
    this.H = H | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W[i] = view.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G: G2, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G2) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma0 + Maj(A, B, C) | 0;
      H = G2;
      G2 = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G2 = G2 + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G2, H);
  }
  roundClean() {
    clean(SHA256_W);
  }
  destroy() {
    this.destroyed = true;
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean(this.buffer);
  }
};
var _SHA256 = class extends SHA2_32B {
  // We cannot use array here since array allows indexing by variable
  // which means optimizer/compiler cannot use registers.
  A = SHA256_IV[0] | 0;
  B = SHA256_IV[1] | 0;
  C = SHA256_IV[2] | 0;
  D = SHA256_IV[3] | 0;
  E = SHA256_IV[4] | 0;
  F = SHA256_IV[5] | 0;
  G = SHA256_IV[6] | 0;
  H = SHA256_IV[7] | 0;
  constructor() {
    super(32);
  }
};
var K512 = /* @__PURE__ */ (() => split([
  "0x428a2f98d728ae22",
  "0x7137449123ef65cd",
  "0xb5c0fbcfec4d3b2f",
  "0xe9b5dba58189dbbc",
  "0x3956c25bf348b538",
  "0x59f111f1b605d019",
  "0x923f82a4af194f9b",
  "0xab1c5ed5da6d8118",
  "0xd807aa98a3030242",
  "0x12835b0145706fbe",
  "0x243185be4ee4b28c",
  "0x550c7dc3d5ffb4e2",
  "0x72be5d74f27b896f",
  "0x80deb1fe3b1696b1",
  "0x9bdc06a725c71235",
  "0xc19bf174cf692694",
  "0xe49b69c19ef14ad2",
  "0xefbe4786384f25e3",
  "0x0fc19dc68b8cd5b5",
  "0x240ca1cc77ac9c65",
  "0x2de92c6f592b0275",
  "0x4a7484aa6ea6e483",
  "0x5cb0a9dcbd41fbd4",
  "0x76f988da831153b5",
  "0x983e5152ee66dfab",
  "0xa831c66d2db43210",
  "0xb00327c898fb213f",
  "0xbf597fc7beef0ee4",
  "0xc6e00bf33da88fc2",
  "0xd5a79147930aa725",
  "0x06ca6351e003826f",
  "0x142929670a0e6e70",
  "0x27b70a8546d22ffc",
  "0x2e1b21385c26c926",
  "0x4d2c6dfc5ac42aed",
  "0x53380d139d95b3df",
  "0x650a73548baf63de",
  "0x766a0abb3c77b2a8",
  "0x81c2c92e47edaee6",
  "0x92722c851482353b",
  "0xa2bfe8a14cf10364",
  "0xa81a664bbc423001",
  "0xc24b8b70d0f89791",
  "0xc76c51a30654be30",
  "0xd192e819d6ef5218",
  "0xd69906245565a910",
  "0xf40e35855771202a",
  "0x106aa07032bbd1b8",
  "0x19a4c116b8d2d0c8",
  "0x1e376c085141ab53",
  "0x2748774cdf8eeb99",
  "0x34b0bcb5e19b48a8",
  "0x391c0cb3c5c95a63",
  "0x4ed8aa4ae3418acb",
  "0x5b9cca4f7763e373",
  "0x682e6ff3d6b2b8a3",
  "0x748f82ee5defb2fc",
  "0x78a5636f43172f60",
  "0x84c87814a1f0ab72",
  "0x8cc702081a6439ec",
  "0x90befffa23631e28",
  "0xa4506cebde82bde9",
  "0xbef9a3f7b2c67915",
  "0xc67178f2e372532b",
  "0xca273eceea26619c",
  "0xd186b8c721c0c207",
  "0xeada7dd6cde0eb1e",
  "0xf57d4f7fee6ed178",
  "0x06f067aa72176fba",
  "0x0a637dc5a2c898a6",
  "0x113f9804bef90dae",
  "0x1b710b35131c471b",
  "0x28db77f523047d84",
  "0x32caab7b40c72493",
  "0x3c9ebe0a15c9bebc",
  "0x431d67c49c100d4c",
  "0x4cc5d4becb3e42b6",
  "0x597f299cfc657e2a",
  "0x5fcb6fab3ad6faec",
  "0x6c44198c4a475817"
].map((n) => BigInt(n))))();
var SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
var SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
var SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
var SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
var SHA2_64B = class extends HashMD {
  constructor(outputLen) {
    super(128, outputLen, 16, false);
  }
  // prettier-ignore
  get() {
    const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
    return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
  }
  // prettier-ignore
  set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
    this.Ah = Ah | 0;
    this.Al = Al | 0;
    this.Bh = Bh | 0;
    this.Bl = Bl | 0;
    this.Ch = Ch | 0;
    this.Cl = Cl | 0;
    this.Dh = Dh | 0;
    this.Dl = Dl | 0;
    this.Eh = Eh | 0;
    this.El = El | 0;
    this.Fh = Fh | 0;
    this.Fl = Fl | 0;
    this.Gh = Gh | 0;
    this.Gl = Gl | 0;
    this.Hh = Hh | 0;
    this.Hl = Hl | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4) {
      SHA512_W_H[i] = view.getUint32(offset);
      SHA512_W_L[i] = view.getUint32(offset += 4);
    }
    for (let i = 16; i < 80; i++) {
      const W15h = SHA512_W_H[i - 15] | 0;
      const W15l = SHA512_W_L[i - 15] | 0;
      const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
      const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
      const W2h = SHA512_W_H[i - 2] | 0;
      const W2l = SHA512_W_L[i - 2] | 0;
      const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
      const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
      const SUMl = add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
      const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
      SHA512_W_H[i] = SUMh | 0;
      SHA512_W_L[i] = SUMl | 0;
    }
    let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
    for (let i = 0; i < 80; i++) {
      const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
      const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
      const CHIh = Eh & Fh ^ ~Eh & Gh;
      const CHIl = El & Fl ^ ~El & Gl;
      const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
      const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
      const T1l = T1ll | 0;
      const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
      const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
      const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
      const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
      Hh = Gh | 0;
      Hl = Gl | 0;
      Gh = Fh | 0;
      Gl = Fl | 0;
      Fh = Eh | 0;
      Fl = El | 0;
      ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
      Dh = Ch | 0;
      Dl = Cl | 0;
      Ch = Bh | 0;
      Cl = Bl | 0;
      Bh = Ah | 0;
      Bl = Al | 0;
      const All = add3L(T1l, sigma0l, MAJl);
      Ah = add3H(All, T1h, sigma0h, MAJh);
      Al = All | 0;
    }
    ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
    ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
    ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
    ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
    ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
    ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
    ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
    ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
    this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
  }
  roundClean() {
    clean(SHA512_W_H, SHA512_W_L);
  }
  destroy() {
    this.destroyed = true;
    clean(this.buffer);
    this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
};
var _SHA512 = class extends SHA2_64B {
  Ah = SHA512_IV[0] | 0;
  Al = SHA512_IV[1] | 0;
  Bh = SHA512_IV[2] | 0;
  Bl = SHA512_IV[3] | 0;
  Ch = SHA512_IV[4] | 0;
  Cl = SHA512_IV[5] | 0;
  Dh = SHA512_IV[6] | 0;
  Dl = SHA512_IV[7] | 0;
  Eh = SHA512_IV[8] | 0;
  El = SHA512_IV[9] | 0;
  Fh = SHA512_IV[10] | 0;
  Fl = SHA512_IV[11] | 0;
  Gh = SHA512_IV[12] | 0;
  Gl = SHA512_IV[13] | 0;
  Hh = SHA512_IV[14] | 0;
  Hl = SHA512_IV[15] | 0;
  constructor() {
    super(64);
  }
};
var sha256 = /* @__PURE__ */ createHasher(
  () => new _SHA256(),
  /* @__PURE__ */ oidNist(1)
);
var sha512 = /* @__PURE__ */ createHasher(
  () => new _SHA512(),
  /* @__PURE__ */ oidNist(3)
);

// node_modules/@noble/curves/utils.js
var abytes3 = (value, length, title) => abytes(value, length, title);
var anumber3 = anumber;
var bytesToHex4 = bytesToHex;
var concatBytes3 = (...arrays) => concatBytes(...arrays);
var hexToBytes3 = (hex7) => hexToBytes(hex7);
var isBytes3 = isBytes;
var randomBytes3 = (bytesLength) => randomBytes(bytesLength);
var _0n = /* @__PURE__ */ BigInt(0);
var _1n = /* @__PURE__ */ BigInt(1);
function abool2(value, title = "") {
  if (typeof value !== "boolean") {
    const prefix = title && `"${title}" `;
    throw new TypeError(prefix + "expected boolean, got type=" + typeof value);
  }
  return value;
}
function abignumber(n) {
  if (typeof n === "bigint") {
    if (!isPosBig(n))
      throw new RangeError("positive bigint expected, got " + n);
  } else
    anumber3(n);
  return n;
}
function asafenumber(value, title = "") {
  if (typeof value !== "number") {
    const prefix = title && `"${title}" `;
    throw new TypeError(prefix + "expected number, got type=" + typeof value);
  }
  if (!Number.isSafeInteger(value)) {
    const prefix = title && `"${title}" `;
    throw new RangeError(prefix + "expected safe integer, got " + value);
  }
}
function hexToNumber2(hex7) {
  if (typeof hex7 !== "string")
    throw new TypeError("hex string expected, got " + typeof hex7);
  return hex7 === "" ? _0n : BigInt("0x" + hex7);
}
function bytesToNumberBE(bytes4) {
  return hexToNumber2(bytesToHex(bytes4));
}
function bytesToNumberLE(bytes4) {
  return hexToNumber2(bytesToHex(copyBytes2(abytes(bytes4)).reverse()));
}
function numberToBytesBE2(n, len) {
  anumber(len);
  if (len === 0)
    throw new RangeError("zero length");
  n = abignumber(n);
  const hex7 = n.toString(16);
  if (hex7.length > len * 2)
    throw new RangeError("number too large");
  return hexToBytes(hex7.padStart(len * 2, "0"));
}
function numberToBytesLE(n, len) {
  return numberToBytesBE2(n, len).reverse();
}
function equalBytes2(a, b) {
  a = abytes3(a);
  b = abytes3(b);
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++)
    diff |= a[i] ^ b[i];
  return diff === 0;
}
function copyBytes2(bytes4) {
  return Uint8Array.from(abytes3(bytes4));
}
function asciiToBytes(ascii) {
  if (typeof ascii !== "string")
    throw new TypeError("ascii string expected, got " + typeof ascii);
  return Uint8Array.from(ascii, (c, i) => {
    const charCode = c.charCodeAt(0);
    if (c.length !== 1 || charCode > 127) {
      throw new RangeError(`string contains non-ASCII character "${ascii[i]}" with code ${charCode} at position ${i}`);
    }
    return charCode;
  });
}
var isPosBig = (n) => typeof n === "bigint" && _0n <= n;
function inRange(n, min, max) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
function aInRange(title, n, min, max) {
  if (!inRange(n, min, max))
    throw new RangeError("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
function bitLen(n) {
  if (n < _0n)
    throw new Error("expected non-negative bigint, got " + n);
  let len;
  for (len = 0; n > _0n; n >>= _1n, len += 1)
    ;
  return len;
}
var bitMask = (n) => (_1n << BigInt(n)) - _1n;
function validateObject(object, fields = {}, optFields = {}) {
  if (Object.prototype.toString.call(object) !== "[object Object]")
    throw new TypeError("expected valid options object");
  function checkField(fieldName, expectedType, isOpt) {
    if (!isOpt && expectedType !== "function" && !Object.hasOwn(object, fieldName))
      throw new TypeError(`param "${fieldName}" is invalid: expected own property`);
    const val = object[fieldName];
    if (isOpt && val === void 0)
      return;
    const current = typeof val;
    if (current !== expectedType || val === null)
      throw new TypeError(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current}`);
  }
  const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
  iter(fields, false);
  iter(optFields, true);
}
var notImplemented = () => {
  throw new Error("not implemented");
};

// node_modules/@noble/curves/abstract/modular.js
var _0n2 = /* @__PURE__ */ BigInt(0);
var _1n2 = /* @__PURE__ */ BigInt(1);
var _2n = /* @__PURE__ */ BigInt(2);
var _3n = /* @__PURE__ */ BigInt(3);
var _4n = /* @__PURE__ */ BigInt(4);
var _5n = /* @__PURE__ */ BigInt(5);
var _7n = /* @__PURE__ */ BigInt(7);
var _8n = /* @__PURE__ */ BigInt(8);
var _9n = /* @__PURE__ */ BigInt(9);
var _16n = /* @__PURE__ */ BigInt(16);
function mod(a, b) {
  if (b <= _0n2)
    throw new Error("mod: expected positive modulus, got " + b);
  const result = a % b;
  return result >= _0n2 ? result : b + result;
}
function pow2(x, power, modulo) {
  if (power < _0n2)
    throw new Error("pow2: expected non-negative exponent, got " + power);
  let res = x;
  while (power-- > _0n2) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number, modulo) {
  if (number === _0n2)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _0n2)
    throw new Error("invert: expected positive modulus, got " + modulo);
  let a = mod(number, modulo);
  let b = modulo;
  let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
  while (a !== _0n2) {
    const q = b / a;
    const r = b - a * q;
    const m = x - u * q;
    const n = y - v * q;
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  const gcd2 = b;
  if (gcd2 !== _1n2)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function assertIsSquare(Fp2, root, n) {
  const F = Fp2;
  if (!F.eql(F.sqr(root), n))
    throw new Error("Cannot find square root");
}
function sqrt3mod4(Fp2, n) {
  const F = Fp2;
  const p1div4 = (F.ORDER + _1n2) / _4n;
  const root = F.pow(n, p1div4);
  assertIsSquare(F, root, n);
  return root;
}
function sqrt5mod8(Fp2, n) {
  const F = Fp2;
  const p5div8 = (F.ORDER - _5n) / _8n;
  const n2 = F.mul(n, _2n);
  const v = F.pow(n2, p5div8);
  const nv = F.mul(n, v);
  const i = F.mul(F.mul(nv, _2n), v);
  const root = F.mul(nv, F.sub(i, F.ONE));
  assertIsSquare(F, root, n);
  return root;
}
function sqrt9mod16(P2) {
  const Fp_ = Field(P2);
  const tn = tonelliShanks(P2);
  const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
  const c2 = tn(Fp_, c1);
  const c3 = tn(Fp_, Fp_.neg(c1));
  const c4 = (P2 + _7n) / _16n;
  return ((Fp2, n) => {
    const F = Fp2;
    let tv1 = F.pow(n, c4);
    let tv2 = F.mul(tv1, c1);
    const tv3 = F.mul(tv1, c2);
    const tv4 = F.mul(tv1, c3);
    const e1 = F.eql(F.sqr(tv2), n);
    const e2 = F.eql(F.sqr(tv3), n);
    tv1 = F.cmov(tv1, tv2, e1);
    tv2 = F.cmov(tv4, tv3, e2);
    const e3 = F.eql(F.sqr(tv2), n);
    const root = F.cmov(tv1, tv2, e3);
    assertIsSquare(F, root, n);
    return root;
  });
}
function tonelliShanks(P2) {
  if (P2 < _3n)
    throw new Error("sqrt is not defined for small field");
  let Q = P2 - _1n2;
  let S = 0;
  while (Q % _2n === _0n2) {
    Q /= _2n;
    S++;
  }
  let Z = _2n;
  const _Fp = Field(P2);
  while (FpLegendre(_Fp, Z) === 1) {
    if (Z++ > 1e3)
      throw new Error("Cannot find square root: probably non-prime P");
  }
  if (S === 1)
    return sqrt3mod4;
  let cc = _Fp.pow(Z, Q);
  const Q1div2 = (Q + _1n2) / _2n;
  return function tonelliSlow(Fp2, n) {
    const F = Fp2;
    if (F.is0(n))
      return n;
    if (FpLegendre(F, n) !== 1)
      throw new Error("Cannot find square root");
    let M = S;
    let c = F.mul(F.ONE, cc);
    let t = F.pow(n, Q);
    let R = F.pow(n, Q1div2);
    while (!F.eql(t, F.ONE)) {
      if (F.is0(t))
        return F.ZERO;
      let i = 1;
      let t_tmp = F.sqr(t);
      while (!F.eql(t_tmp, F.ONE)) {
        i++;
        t_tmp = F.sqr(t_tmp);
        if (i === M)
          throw new Error("Cannot find square root");
      }
      const exponent = _1n2 << BigInt(M - i - 1);
      const b = F.pow(c, exponent);
      M = i;
      c = F.sqr(b);
      t = F.mul(t, c);
      R = F.mul(R, b);
    }
    return R;
  };
}
function FpSqrt(P2) {
  if (P2 % _4n === _3n)
    return sqrt3mod4;
  if (P2 % _8n === _5n)
    return sqrt5mod8;
  if (P2 % _16n === _9n)
    return sqrt9mod16(P2);
  return tonelliShanks(P2);
}
var isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n2) === _1n2;
var FIELD_FIELDS = [
  "create",
  "isValid",
  "is0",
  "neg",
  "inv",
  "sqrt",
  "sqr",
  "eql",
  "add",
  "sub",
  "mul",
  "pow",
  "div",
  "addN",
  "subN",
  "mulN",
  "sqrN"
];
function validateField(field) {
  const initial = {
    ORDER: "bigint",
    BYTES: "number",
    BITS: "number"
  };
  const opts = FIELD_FIELDS.reduce((map, val) => {
    map[val] = "function";
    return map;
  }, initial);
  validateObject(field, opts);
  asafenumber(field.BYTES, "BYTES");
  asafenumber(field.BITS, "BITS");
  if (field.BYTES < 1 || field.BITS < 1)
    throw new Error("invalid field: expected BYTES/BITS > 0");
  if (field.ORDER <= _1n2)
    throw new Error("invalid field: expected ORDER > 1, got " + field.ORDER);
  return field;
}
function FpPow(Fp2, num, power) {
  const F = Fp2;
  if (power < _0n2)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n2)
    return F.ONE;
  if (power === _1n2)
    return num;
  let p = F.ONE;
  let d = num;
  while (power > _0n2) {
    if (power & _1n2)
      p = F.mul(p, d);
    d = F.sqr(d);
    power >>= _1n2;
  }
  return p;
}
function FpInvertBatch(Fp2, nums, passZero = false) {
  const F = Fp2;
  const inverted = new Array(nums.length).fill(passZero ? F.ZERO : void 0);
  const multipliedAcc = nums.reduce((acc, num, i) => {
    if (F.is0(num))
      return acc;
    inverted[i] = acc;
    return F.mul(acc, num);
  }, F.ONE);
  const invertedAcc = F.inv(multipliedAcc);
  nums.reduceRight((acc, num, i) => {
    if (F.is0(num))
      return acc;
    inverted[i] = F.mul(acc, inverted[i]);
    return F.mul(acc, num);
  }, invertedAcc);
  return inverted;
}
function FpLegendre(Fp2, n) {
  const F = Fp2;
  const p1mod2 = (F.ORDER - _1n2) / _2n;
  const powered = F.pow(n, p1mod2);
  const yes = F.eql(powered, F.ONE);
  const zero = F.eql(powered, F.ZERO);
  const no = F.eql(powered, F.neg(F.ONE));
  if (!yes && !zero && !no)
    throw new Error("invalid Legendre symbol result");
  return yes ? 1 : zero ? 0 : -1;
}
function nLength(n, nBitLength) {
  if (nBitLength !== void 0)
    anumber3(nBitLength);
  if (n <= _0n2)
    throw new Error("invalid n length: expected positive n, got " + n);
  if (nBitLength !== void 0 && nBitLength < 1)
    throw new Error("invalid n length: expected positive bit length, got " + nBitLength);
  const bits = bitLen(n);
  if (nBitLength !== void 0 && nBitLength < bits)
    throw new Error(`invalid n length: expected bit length (${bits}) >= n.length (${nBitLength})`);
  const _nBitLength = nBitLength !== void 0 ? nBitLength : bits;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}
var FIELD_SQRT = /* @__PURE__ */ new WeakMap();
var _Field = class {
  ORDER;
  BITS;
  BYTES;
  isLE;
  ZERO = _0n2;
  ONE = _1n2;
  _lengths;
  _mod;
  constructor(ORDER, opts = {}) {
    if (ORDER <= _1n2)
      throw new Error("invalid field: expected ORDER > 1, got " + ORDER);
    let _nbitLength = void 0;
    this.isLE = false;
    if (opts != null && typeof opts === "object") {
      if (typeof opts.BITS === "number")
        _nbitLength = opts.BITS;
      if (typeof opts.sqrt === "function")
        Object.defineProperty(this, "sqrt", { value: opts.sqrt, enumerable: true });
      if (typeof opts.isLE === "boolean")
        this.isLE = opts.isLE;
      if (opts.allowedLengths)
        this._lengths = Object.freeze(opts.allowedLengths.slice());
      if (typeof opts.modFromBytes === "boolean")
        this._mod = opts.modFromBytes;
    }
    const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
    if (nByteLength > 2048)
      throw new Error("invalid field: expected ORDER of <= 2048 bytes");
    this.ORDER = ORDER;
    this.BITS = nBitLength;
    this.BYTES = nByteLength;
    Object.freeze(this);
  }
  create(num) {
    return mod(num, this.ORDER);
  }
  isValid(num) {
    if (typeof num !== "bigint")
      throw new TypeError("invalid field element: expected bigint, got " + typeof num);
    return _0n2 <= num && num < this.ORDER;
  }
  is0(num) {
    return num === _0n2;
  }
  // is valid and invertible
  isValidNot0(num) {
    return !this.is0(num) && this.isValid(num);
  }
  isOdd(num) {
    return (num & _1n2) === _1n2;
  }
  neg(num) {
    return mod(-num, this.ORDER);
  }
  eql(lhs, rhs) {
    return lhs === rhs;
  }
  sqr(num) {
    return mod(num * num, this.ORDER);
  }
  add(lhs, rhs) {
    return mod(lhs + rhs, this.ORDER);
  }
  sub(lhs, rhs) {
    return mod(lhs - rhs, this.ORDER);
  }
  mul(lhs, rhs) {
    return mod(lhs * rhs, this.ORDER);
  }
  pow(num, power) {
    return FpPow(this, num, power);
  }
  div(lhs, rhs) {
    return mod(lhs * invert(rhs, this.ORDER), this.ORDER);
  }
  // Same as above, but doesn't normalize
  sqrN(num) {
    return num * num;
  }
  addN(lhs, rhs) {
    return lhs + rhs;
  }
  subN(lhs, rhs) {
    return lhs - rhs;
  }
  mulN(lhs, rhs) {
    return lhs * rhs;
  }
  inv(num) {
    return invert(num, this.ORDER);
  }
  sqrt(num) {
    let sqrt = FIELD_SQRT.get(this);
    if (!sqrt)
      FIELD_SQRT.set(this, sqrt = FpSqrt(this.ORDER));
    return sqrt(this, num);
  }
  toBytes(num) {
    return this.isLE ? numberToBytesLE(num, this.BYTES) : numberToBytesBE2(num, this.BYTES);
  }
  fromBytes(bytes4, skipValidation = false) {
    abytes3(bytes4);
    const { _lengths: allowedLengths, BYTES, isLE: isLE3, ORDER, _mod: modFromBytes } = this;
    if (allowedLengths) {
      if (bytes4.length < 1 || !allowedLengths.includes(bytes4.length) || bytes4.length > BYTES) {
        throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes4.length);
      }
      const padded = new Uint8Array(BYTES);
      padded.set(bytes4, isLE3 ? 0 : padded.length - bytes4.length);
      bytes4 = padded;
    }
    if (bytes4.length !== BYTES)
      throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes4.length);
    let scalar = isLE3 ? bytesToNumberLE(bytes4) : bytesToNumberBE(bytes4);
    if (modFromBytes)
      scalar = mod(scalar, ORDER);
    if (!skipValidation) {
      if (!this.isValid(scalar))
        throw new Error("invalid field element: outside of range 0..ORDER");
    }
    return scalar;
  }
  // TODO: we don't need it here, move out to separate fn
  invertBatch(lst) {
    return FpInvertBatch(this, lst);
  }
  // We can't move this out because Fp6, Fp12 implement it
  // and it's unclear what to return in there.
  cmov(a, b, condition) {
    abool2(condition, "condition");
    return condition ? b : a;
  }
};
Object.freeze(_Field.prototype);
function Field(ORDER, opts = {}) {
  return new _Field(ORDER, opts);
}

// node_modules/@noble/curves/abstract/curve.js
var _0n3 = /* @__PURE__ */ BigInt(0);
var _1n3 = /* @__PURE__ */ BigInt(1);
function negateCt(condition, item) {
  const neg = item.negate();
  return condition ? neg : item;
}
function normalizeZ(c, points) {
  const invertedZs = FpInvertBatch(c.Fp, points.map((p) => p.Z));
  return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
}
function validateW(W, bits) {
  if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
    throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
}
function calcWOpts(W, scalarBits) {
  validateW(W, scalarBits);
  const windows = Math.ceil(scalarBits / W) + 1;
  const windowSize = 2 ** (W - 1);
  const maxNumber = 2 ** W;
  const mask2 = bitMask(W);
  const shiftBy = BigInt(W);
  return { windows, windowSize, mask: mask2, maxNumber, shiftBy };
}
function calcOffsets(n, window, wOpts) {
  const { windowSize, mask: mask2, maxNumber, shiftBy } = wOpts;
  let wbits = Number(n & mask2);
  let nextN = n >> shiftBy;
  if (wbits > windowSize) {
    wbits -= maxNumber;
    nextN += _1n3;
  }
  const offsetStart = window * windowSize;
  const offset = offsetStart + Math.abs(wbits) - 1;
  const isZero = wbits === 0;
  const isNeg = wbits < 0;
  const isNegF = window % 2 !== 0;
  const offsetF = offsetStart;
  return { nextN, offset, isZero, isNeg, isNegF, offsetF };
}
var pointPrecomputes = /* @__PURE__ */ new WeakMap();
var pointWindowSizes = /* @__PURE__ */ new WeakMap();
function getW(P2) {
  return pointWindowSizes.get(P2) || 1;
}
function assert0(n) {
  if (n !== _0n3)
    throw new Error("invalid wNAF");
}
var wNAF = class {
  BASE;
  ZERO;
  Fn;
  bits;
  // Parametrized with a given Point class (not individual point)
  constructor(Point, bits) {
    this.BASE = Point.BASE;
    this.ZERO = Point.ZERO;
    this.Fn = Point.Fn;
    this.bits = bits;
  }
  // non-const time multiplication ladder
  _unsafeLadder(elm, n, p = this.ZERO) {
    let d = elm;
    while (n > _0n3) {
      if (n & _1n3)
        p = p.add(d);
      d = d.double();
      n >>= _1n3;
    }
    return p;
  }
  /**
   * Creates a wNAF precomputation window. Used for caching.
   * Default window size is set by `utils.precompute()` and is equal to 8.
   * Number of precomputed points depends on the curve size:
   * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
   * - 𝑊 is the window size
   * - 𝑛 is the bitlength of the curve order.
   * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
   * @param point - Point instance
   * @param W - window size
   * @returns precomputed point tables flattened to a single array
   */
  precomputeWindow(point, W) {
    const { windows, windowSize } = calcWOpts(W, this.bits);
    const points = [];
    let p = point;
    let base = p;
    for (let window = 0; window < windows; window++) {
      base = p;
      points.push(base);
      for (let i = 1; i < windowSize; i++) {
        base = base.add(p);
        points.push(base);
      }
      p = base.double();
    }
    return points;
  }
  /**
   * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
   * More compact implementation:
   * https://github.com/paulmillr/noble-secp256k1/blob/47cb1669b6e506ad66b35fe7d76132ae97465da2/index.ts#L502-L541
   * @returns real and fake (for const-time) points
   */
  wNAF(W, precomputes, n) {
    if (!this.Fn.isValid(n))
      throw new Error("invalid scalar");
    let p = this.ZERO;
    let f = this.BASE;
    const wo = calcWOpts(W, this.bits);
    for (let window = 0; window < wo.windows; window++) {
      const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window, wo);
      n = nextN;
      if (isZero) {
        f = f.add(negateCt(isNegF, precomputes[offsetF]));
      } else {
        p = p.add(negateCt(isNeg, precomputes[offset]));
      }
    }
    assert0(n);
    return { p, f };
  }
  /**
   * Implements unsafe EC multiplication using precomputed tables
   * and w-ary non-adjacent form.
   * @param acc - accumulator point to add result of multiplication
   * @returns point
   */
  wNAFUnsafe(W, precomputes, n, acc = this.ZERO) {
    const wo = calcWOpts(W, this.bits);
    for (let window = 0; window < wo.windows; window++) {
      if (n === _0n3)
        break;
      const { nextN, offset, isZero, isNeg } = calcOffsets(n, window, wo);
      n = nextN;
      if (isZero) {
        continue;
      } else {
        const item = precomputes[offset];
        acc = acc.add(isNeg ? item.negate() : item);
      }
    }
    assert0(n);
    return acc;
  }
  getPrecomputes(W, point, transform) {
    let comp = pointPrecomputes.get(point);
    if (!comp) {
      comp = this.precomputeWindow(point, W);
      if (W !== 1) {
        if (typeof transform === "function")
          comp = transform(comp);
        pointPrecomputes.set(point, comp);
      }
    }
    return comp;
  }
  cached(point, scalar, transform) {
    const W = getW(point);
    return this.wNAF(W, this.getPrecomputes(W, point, transform), scalar);
  }
  unsafe(point, scalar, transform, prev) {
    const W = getW(point);
    if (W === 1)
      return this._unsafeLadder(point, scalar, prev);
    return this.wNAFUnsafe(W, this.getPrecomputes(W, point, transform), scalar, prev);
  }
  // We calculate precomputes for elliptic curve point multiplication
  // using windowed method. This specifies window size and
  // stores precomputed values. Usually only base point would be precomputed.
  createCache(P2, W) {
    validateW(W, this.bits);
    pointWindowSizes.set(P2, W);
    pointPrecomputes.delete(P2);
  }
  hasCache(elm) {
    return getW(elm) !== 1;
  }
};
function createField(order, field, isLE3) {
  if (field) {
    if (field.ORDER !== order)
      throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
    validateField(field);
    return field;
  } else {
    return Field(order, { isLE: isLE3 });
  }
}
function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
  if (FpFnLE === void 0)
    FpFnLE = type === "edwards";
  if (!CURVE || typeof CURVE !== "object")
    throw new Error(`expected valid ${type} CURVE object`);
  for (const p of ["p", "n", "h"]) {
    const val = CURVE[p];
    if (!(typeof val === "bigint" && val > _0n3))
      throw new Error(`CURVE.${p} must be positive bigint`);
  }
  const Fp2 = createField(CURVE.p, curveOpts.Fp, FpFnLE);
  const Fn2 = createField(CURVE.n, curveOpts.Fn, FpFnLE);
  const _b = type === "weierstrass" ? "b" : "d";
  const params = ["Gx", "Gy", "a", _b];
  for (const p of params) {
    if (!Fp2.isValid(CURVE[p]))
      throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
  }
  CURVE = Object.freeze(Object.assign({}, CURVE));
  return { CURVE, Fp: Fp2, Fn: Fn2 };
}
function createKeygen(randomSecretKey, getPublicKey) {
  return function keygen(seed) {
    const secretKey = randomSecretKey(seed);
    return { secretKey, publicKey: getPublicKey(secretKey) };
  };
}

// node_modules/@noble/curves/abstract/edwards.js
var _0n4 = /* @__PURE__ */ BigInt(0);
var _1n4 = /* @__PURE__ */ BigInt(1);
var _2n2 = /* @__PURE__ */ BigInt(2);
var _8n2 = /* @__PURE__ */ BigInt(8);
function isEdValidXY(Fp2, CURVE, x, y) {
  const x2 = Fp2.sqr(x);
  const y2 = Fp2.sqr(y);
  const left = Fp2.add(Fp2.mul(CURVE.a, x2), y2);
  const right = Fp2.add(Fp2.ONE, Fp2.mul(CURVE.d, Fp2.mul(x2, y2)));
  return Fp2.eql(left, right);
}
function edwards(params, extraOpts = {}) {
  const opts = extraOpts;
  const validated = createCurveFields("edwards", params, opts, opts.FpFnLE);
  const { Fp: Fp2, Fn: Fn2 } = validated;
  let CURVE = validated.CURVE;
  const { h: cofactor } = CURVE;
  validateObject(opts, {}, { uvRatio: "function" });
  const MASK = _2n2 << BigInt(Fn2.BYTES * 8) - _1n4;
  const modP = (n) => Fp2.create(n);
  const uvRatio2 = opts.uvRatio === void 0 ? (u, v) => {
    try {
      return { isValid: true, value: Fp2.sqrt(Fp2.div(u, v)) };
    } catch (e) {
      return { isValid: false, value: _0n4 };
    }
  } : opts.uvRatio;
  if (!isEdValidXY(Fp2, CURVE, CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  function acoord(title, n, banZero = false) {
    const min = banZero ? _1n4 : _0n4;
    aInRange("coordinate " + title, n, min, MASK);
    return n;
  }
  function aedpoint(other) {
    if (!(other instanceof Point))
      throw new Error("EdwardsPoint expected");
  }
  class Point {
    // base / generator point
    static BASE = new Point(CURVE.Gx, CURVE.Gy, _1n4, modP(CURVE.Gx * CURVE.Gy));
    // zero / infinity / identity point
    static ZERO = new Point(_0n4, _1n4, _1n4, _0n4);
    // 0, 1, 1, 0
    // math field
    static Fp = Fp2;
    // scalar field
    static Fn = Fn2;
    X;
    Y;
    Z;
    T;
    constructor(X, Y, Z, T) {
      this.X = acoord("x", X);
      this.Y = acoord("y", Y);
      this.Z = acoord("z", Z, true);
      this.T = acoord("t", T);
      Object.freeze(this);
    }
    static CURVE() {
      return CURVE;
    }
    /**
     * Create one extended Edwards point from affine coordinates.
     * Does NOT validate that the point is on-curve or torsion-free.
     * Use `.assertValidity()` on adversarial inputs.
     */
    static fromAffine(p) {
      if (p instanceof Point)
        throw new Error("extended point not allowed");
      const { x, y } = p || {};
      acoord("x", x);
      acoord("y", y);
      return new Point(x, y, _1n4, modP(x * y));
    }
    // Uses algo from RFC8032 5.1.3.
    static fromBytes(bytes4, zip215 = false) {
      const len = Fp2.BYTES;
      const { a, d } = CURVE;
      bytes4 = copyBytes2(abytes3(bytes4, len, "point"));
      abool2(zip215, "zip215");
      const normed = copyBytes2(bytes4);
      const lastByte = bytes4[len - 1];
      normed[len - 1] = lastByte & ~128;
      const y = bytesToNumberLE(normed);
      const max = zip215 ? MASK : Fp2.ORDER;
      aInRange("point.y", y, _0n4, max);
      const y2 = modP(y * y);
      const u = modP(y2 - _1n4);
      const v = modP(d * y2 - a);
      let { isValid, value: x } = uvRatio2(u, v);
      if (!isValid)
        throw new Error("bad point: invalid y coordinate");
      const isXOdd = (x & _1n4) === _1n4;
      const isLastByteOdd = (lastByte & 128) !== 0;
      if (!zip215 && x === _0n4 && isLastByteOdd)
        throw new Error("bad point: x=0 and x_0=1");
      if (isLastByteOdd !== isXOdd)
        x = modP(-x);
      return Point.fromAffine({ x, y });
    }
    static fromHex(hex7, zip215 = false) {
      return Point.fromBytes(hexToBytes3(hex7), zip215);
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    precompute(windowSize = 8, isLazy = true) {
      wnaf.createCache(this, windowSize);
      if (!isLazy)
        this.multiply(_2n2);
      return this;
    }
    // Useful in fromAffine() - not for fromBytes(), which always created valid points.
    assertValidity() {
      const p = this;
      const { a, d } = CURVE;
      if (p.is0())
        throw new Error("bad point: ZERO");
      const { X, Y, Z, T } = p;
      const X2 = modP(X * X);
      const Y2 = modP(Y * Y);
      const Z2 = modP(Z * Z);
      const Z4 = modP(Z2 * Z2);
      const aX2 = modP(X2 * a);
      const left = modP(Z2 * modP(aX2 + Y2));
      const right = modP(Z4 + modP(d * modP(X2 * Y2)));
      if (left !== right)
        throw new Error("bad point: equation left != right (1)");
      const XY = modP(X * Y);
      const ZT = modP(Z * T);
      if (XY !== ZT)
        throw new Error("bad point: equation left != right (2)");
    }
    // Compare one point to another.
    equals(other) {
      aedpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      const X1Z2 = modP(X1 * Z2);
      const X2Z1 = modP(X2 * Z1);
      const Y1Z2 = modP(Y1 * Z2);
      const Y2Z1 = modP(Y2 * Z1);
      return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
    }
    is0() {
      return this.equals(Point.ZERO);
    }
    negate() {
      return new Point(modP(-this.X), this.Y, this.Z, modP(-this.T));
    }
    // Fast algo for doubling Extended Point.
    // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#doubling-dbl-2008-hwcd
    // Cost: 4M + 4S + 1*a + 6add + 1*2.
    double() {
      const { a } = CURVE;
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const A = modP(X1 * X1);
      const B = modP(Y1 * Y1);
      const C = modP(_2n2 * modP(Z1 * Z1));
      const D = modP(a * A);
      const x1y1 = X1 + Y1;
      const E = modP(modP(x1y1 * x1y1) - A - B);
      const G2 = D + B;
      const F = G2 - C;
      const H = D - B;
      const X3 = modP(E * F);
      const Y3 = modP(G2 * H);
      const T3 = modP(E * H);
      const Z3 = modP(F * G2);
      return new Point(X3, Y3, Z3, T3);
    }
    // Fast algo for adding 2 Extended Points.
    // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#addition-add-2008-hwcd
    // Cost: 9M + 1*a + 1*d + 7add.
    add(other) {
      aedpoint(other);
      const { a, d } = CURVE;
      const { X: X1, Y: Y1, Z: Z1, T: T1 } = this;
      const { X: X2, Y: Y2, Z: Z2, T: T2 } = other;
      const A = modP(X1 * X2);
      const B = modP(Y1 * Y2);
      const C = modP(T1 * d * T2);
      const D = modP(Z1 * Z2);
      const E = modP((X1 + Y1) * (X2 + Y2) - A - B);
      const F = D - C;
      const G2 = D + C;
      const H = modP(B - a * A);
      const X3 = modP(E * F);
      const Y3 = modP(G2 * H);
      const T3 = modP(E * H);
      const Z3 = modP(F * G2);
      return new Point(X3, Y3, Z3, T3);
    }
    subtract(other) {
      aedpoint(other);
      return this.add(other.negate());
    }
    // Constant-time multiplication.
    multiply(scalar) {
      if (!Fn2.isValidNot0(scalar))
        throw new RangeError("invalid scalar: expected 1 <= sc < curve.n");
      const { p, f } = wnaf.cached(this, scalar, (p2) => normalizeZ(Point, p2));
      return normalizeZ(Point, [p, f])[0];
    }
    // Non-constant-time multiplication. Uses double-and-add algorithm.
    // It's faster, but should only be used when you don't care about
    // an exposed private key e.g. sig verification.
    // Keeps the same subgroup-scalar contract: 0 is allowed for public-scalar callers, but
    // n and larger values are rejected instead of being reduced mod n to the identity point.
    multiplyUnsafe(scalar) {
      if (!Fn2.isValid(scalar))
        throw new RangeError("invalid scalar: expected 0 <= sc < curve.n");
      if (scalar === _0n4)
        return Point.ZERO;
      if (this.is0() || scalar === _1n4)
        return this;
      return wnaf.unsafe(this, scalar, (p) => normalizeZ(Point, p));
    }
    // Checks if point is of small order.
    // If you add something to small order point, you will have "dirty"
    // point with torsion component.
    // Clears cofactor and checks if the result is 0.
    isSmallOrder() {
      return this.clearCofactor().is0();
    }
    // Multiplies point by curve order and checks if the result is 0.
    // Returns `false` is the point is dirty.
    isTorsionFree() {
      return wnaf.unsafe(this, CURVE.n).is0();
    }
    // Converts Extended point to default (x, y) coordinates.
    // Can accept precomputed Z^-1 - for example, from invertBatch.
    toAffine(invertedZ) {
      const p = this;
      let iz = invertedZ;
      const { X, Y, Z } = p;
      const is0 = p.is0();
      if (iz == null)
        iz = is0 ? _8n2 : Fp2.inv(Z);
      const x = modP(X * iz);
      const y = modP(Y * iz);
      const zz = Fp2.mul(Z, iz);
      if (is0)
        return { x: _0n4, y: _1n4 };
      if (zz !== _1n4)
        throw new Error("invZ was invalid");
      return { x, y };
    }
    clearCofactor() {
      if (cofactor === _1n4)
        return this;
      return this.multiplyUnsafe(cofactor);
    }
    toBytes() {
      const { x, y } = this.toAffine();
      const bytes4 = Fp2.toBytes(y);
      bytes4[bytes4.length - 1] |= x & _1n4 ? 128 : 0;
      return bytes4;
    }
    toHex() {
      return bytesToHex4(this.toBytes());
    }
    toString() {
      return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
    }
  }
  const wnaf = new wNAF(Point, Fn2.BITS);
  if (Fn2.BITS >= 8)
    Point.BASE.precompute(8);
  Object.freeze(Point.prototype);
  Object.freeze(Point);
  return Point;
}
var PrimeEdwardsPoint = class {
  static BASE;
  static ZERO;
  static Fp;
  static Fn;
  ep;
  /**
   * Wrap one internal Edwards representative directly.
   * This is not a canonical encoding boundary: alternate Edwards
   * representatives may still describe the same abstract wrapper element.
   */
  constructor(ep) {
    this.ep = ep;
  }
  // Static methods that must be implemented by subclasses
  static fromBytes(_bytes) {
    notImplemented();
  }
  static fromHex(_hex) {
    notImplemented();
  }
  get x() {
    return this.toAffine().x;
  }
  get y() {
    return this.toAffine().y;
  }
  // Common implementations
  clearCofactor() {
    return this;
  }
  assertValidity() {
    this.ep.assertValidity();
  }
  /**
   * Return affine coordinates of the current internal Edwards representative.
   * This is a convenience helper, not a canonical Ristretto/Decaf encoding.
   * Equal abstract elements may expose different `x` / `y`; use
   * `toBytes()` / `fromBytes()` for canonical roundtrips.
   */
  toAffine(invertedZ) {
    return this.ep.toAffine(invertedZ);
  }
  toHex() {
    return bytesToHex4(this.toBytes());
  }
  toString() {
    return this.toHex();
  }
  isTorsionFree() {
    return true;
  }
  isSmallOrder() {
    return false;
  }
  add(other) {
    this.assertSame(other);
    return this.init(this.ep.add(other.ep));
  }
  subtract(other) {
    this.assertSame(other);
    return this.init(this.ep.subtract(other.ep));
  }
  multiply(scalar) {
    return this.init(this.ep.multiply(scalar));
  }
  multiplyUnsafe(scalar) {
    return this.init(this.ep.multiplyUnsafe(scalar));
  }
  double() {
    return this.init(this.ep.double());
  }
  negate() {
    return this.init(this.ep.negate());
  }
  precompute(windowSize, isLazy) {
    this.ep.precompute(windowSize, isLazy);
    return this;
  }
};

// node_modules/@noble/curves/abstract/hash-to-curve.js
function i2osp(value, length) {
  asafenumber(value);
  asafenumber(length);
  if (length < 0 || length > 4)
    throw new Error("invalid I2OSP length: " + length);
  if (value < 0 || value > 2 ** (8 * length) - 1)
    throw new Error("invalid I2OSP input: " + value);
  const res = Array.from({ length }).fill(0);
  for (let i = length - 1; i >= 0; i--) {
    res[i] = value & 255;
    value >>>= 8;
  }
  return new Uint8Array(res);
}
function strxor(a, b) {
  const arr = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    arr[i] = a[i] ^ b[i];
  }
  return arr;
}
function normDST(DST) {
  if (!isBytes3(DST) && typeof DST !== "string")
    throw new Error("DST must be Uint8Array or ascii string");
  const dst = typeof DST === "string" ? asciiToBytes(DST) : DST;
  if (dst.length === 0)
    throw new Error("DST must be non-empty");
  return dst;
}
function expand_message_xmd(msg, DST, lenInBytes, H) {
  abytes3(msg);
  asafenumber(lenInBytes);
  DST = normDST(DST);
  if (DST.length > 255)
    DST = H(concatBytes3(asciiToBytes("H2C-OVERSIZE-DST-"), DST));
  const { outputLen: b_in_bytes, blockLen: r_in_bytes } = H;
  const ell = Math.ceil(lenInBytes / b_in_bytes);
  if (lenInBytes > 65535 || ell > 255)
    throw new Error("expand_message_xmd: invalid lenInBytes");
  const DST_prime = concatBytes3(DST, i2osp(DST.length, 1));
  const Z_pad = new Uint8Array(r_in_bytes);
  const l_i_b_str = i2osp(lenInBytes, 2);
  const b = new Array(ell);
  const b_0 = H(concatBytes3(Z_pad, msg, l_i_b_str, i2osp(0, 1), DST_prime));
  b[0] = H(concatBytes3(b_0, i2osp(1, 1), DST_prime));
  for (let i = 1; i < ell; i++) {
    const args = [strxor(b_0, b[i - 1]), i2osp(i + 1, 1), DST_prime];
    b[i] = H(concatBytes3(...args));
  }
  const pseudo_random_bytes = concatBytes3(...b);
  return pseudo_random_bytes.slice(0, lenInBytes);
}
var _DST_scalar = "HashToScalar-";

// node_modules/@noble/curves/abstract/montgomery.js
var _0n5 = BigInt(0);
var _1n5 = BigInt(1);
var _2n3 = BigInt(2);
function validateOpts(curve) {
  validateObject(curve, {
    P: "bigint",
    type: "string",
    adjustScalarBytes: "function",
    powPminus2: "function"
  }, {
    randomBytes: "function"
  });
  return Object.freeze({ ...curve });
}
function montgomery(curveDef) {
  const CURVE = validateOpts(curveDef);
  const { P: P2, type, adjustScalarBytes: adjustScalarBytes2, powPminus2, randomBytes: rand } = CURVE;
  const is25519 = type === "x25519";
  if (!is25519 && type !== "x448")
    throw new Error("invalid type");
  const randomBytes_ = rand === void 0 ? randomBytes3 : rand;
  const montgomeryBits = is25519 ? 255 : 448;
  const fieldLen = is25519 ? 32 : 56;
  const Gu = is25519 ? BigInt(9) : BigInt(5);
  const a24 = is25519 ? BigInt(121665) : BigInt(39081);
  const minScalar = is25519 ? _2n3 ** BigInt(254) : _2n3 ** BigInt(447);
  const maxAdded = is25519 ? BigInt(8) * _2n3 ** BigInt(251) - _1n5 : BigInt(4) * _2n3 ** BigInt(445) - _1n5;
  const maxScalar = minScalar + maxAdded + _1n5;
  const modP = (n) => mod(n, P2);
  const GuBytes = encodeU(Gu);
  function encodeU(u) {
    return numberToBytesLE(modP(u), fieldLen);
  }
  function decodeU(u) {
    const _u = copyBytes2(abytes3(u, fieldLen, "uCoordinate"));
    if (is25519)
      _u[31] &= 127;
    return modP(bytesToNumberLE(_u));
  }
  function decodeScalar(scalar) {
    return bytesToNumberLE(adjustScalarBytes2(copyBytes2(abytes3(scalar, fieldLen, "scalar"))));
  }
  function scalarMult(scalar, u) {
    const pu = montgomeryLadder(decodeU(u), decodeScalar(scalar));
    if (pu === _0n5)
      throw new Error("invalid private or public key received");
    return encodeU(pu);
  }
  function scalarMultBase(scalar) {
    return scalarMult(scalar, GuBytes);
  }
  const getPublicKey = scalarMultBase;
  const getSharedSecret = scalarMult;
  function cswap(swap, x_2, x_3) {
    const dummy = modP(swap * (x_2 - x_3));
    x_2 = modP(x_2 - dummy);
    x_3 = modP(x_3 + dummy);
    return { x_2, x_3 };
  }
  function montgomeryLadder(u, scalar) {
    aInRange("u", u, _0n5, P2);
    aInRange("scalar", scalar, minScalar, maxScalar);
    const k = scalar;
    const x_1 = u;
    let x_2 = _1n5;
    let z_2 = _0n5;
    let x_3 = u;
    let z_3 = _1n5;
    let swap = _0n5;
    for (let t = BigInt(montgomeryBits - 1); t >= _0n5; t--) {
      const k_t = k >> t & _1n5;
      swap ^= k_t;
      ({ x_2, x_3 } = cswap(swap, x_2, x_3));
      ({ x_2: z_2, x_3: z_3 } = cswap(swap, z_2, z_3));
      swap = k_t;
      const A = x_2 + z_2;
      const AA = modP(A * A);
      const B = x_2 - z_2;
      const BB = modP(B * B);
      const E = AA - BB;
      const C = x_3 + z_3;
      const D = x_3 - z_3;
      const DA = modP(D * A);
      const CB = modP(C * B);
      const dacb = DA + CB;
      const da_cb = DA - CB;
      x_3 = modP(dacb * dacb);
      z_3 = modP(x_1 * modP(da_cb * da_cb));
      x_2 = modP(AA * BB);
      z_2 = modP(E * (AA + modP(a24 * E)));
    }
    ({ x_2, x_3 } = cswap(swap, x_2, x_3));
    ({ x_2: z_2, x_3: z_3 } = cswap(swap, z_2, z_3));
    const z2 = powPminus2(z_2);
    return modP(x_2 * z2);
  }
  const lengths = {
    secretKey: fieldLen,
    publicKey: fieldLen,
    seed: fieldLen
  };
  const randomSecretKey = (seed) => {
    seed = seed === void 0 ? randomBytes_(fieldLen) : seed;
    abytes3(seed, lengths.seed, "seed");
    return seed;
  };
  const utils2 = { randomSecretKey };
  Object.freeze(lengths);
  Object.freeze(utils2);
  return Object.freeze({
    keygen: createKeygen(randomSecretKey, getPublicKey),
    getSharedSecret,
    getPublicKey,
    scalarMult,
    scalarMultBase,
    utils: utils2,
    GuBytes: GuBytes.slice(),
    lengths
  });
}

// node_modules/@noble/curves/ed25519.js
var _0n6 = /* @__PURE__ */ BigInt(0);
var _1n6 = /* @__PURE__ */ BigInt(1);
var _2n4 = /* @__PURE__ */ BigInt(2);
var _3n2 = /* @__PURE__ */ BigInt(3);
var _5n2 = /* @__PURE__ */ BigInt(5);
var _8n3 = /* @__PURE__ */ BigInt(8);
var ed25519_CURVE_p = /* @__PURE__ */ BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed");
var ed25519_CURVE = /* @__PURE__ */ (() => ({
  p: ed25519_CURVE_p,
  n: BigInt("0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed"),
  h: _8n3,
  a: BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec"),
  d: BigInt("0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3"),
  Gx: BigInt("0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a"),
  Gy: BigInt("0x6666666666666666666666666666666666666666666666666666666666666658")
}))();
function ed25519_pow_2_252_3(x) {
  const _10n = BigInt(10), _20n = BigInt(20), _40n = BigInt(40), _80n = BigInt(80);
  const P2 = ed25519_CURVE_p;
  const x2 = x * x % P2;
  const b2 = x2 * x % P2;
  const b4 = pow2(b2, _2n4, P2) * b2 % P2;
  const b5 = pow2(b4, _1n6, P2) * x % P2;
  const b10 = pow2(b5, _5n2, P2) * b5 % P2;
  const b20 = pow2(b10, _10n, P2) * b10 % P2;
  const b40 = pow2(b20, _20n, P2) * b20 % P2;
  const b80 = pow2(b40, _40n, P2) * b40 % P2;
  const b160 = pow2(b80, _80n, P2) * b80 % P2;
  const b240 = pow2(b160, _80n, P2) * b80 % P2;
  const b250 = pow2(b240, _10n, P2) * b10 % P2;
  const pow_p_5_8 = pow2(b250, _2n4, P2) * x % P2;
  return { pow_p_5_8, b2 };
}
function adjustScalarBytes(bytes4) {
  bytes4[0] &= 248;
  bytes4[31] &= 127;
  bytes4[31] |= 64;
  return bytes4;
}
var ED25519_SQRT_M1 = /* @__PURE__ */ BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752");
function uvRatio(u, v) {
  const P2 = ed25519_CURVE_p;
  const v3 = mod(v * v * v, P2);
  const v7 = mod(v3 * v3 * v, P2);
  const pow = ed25519_pow_2_252_3(u * v7).pow_p_5_8;
  let x = mod(u * v3 * pow, P2);
  const vx2 = mod(v * x * x, P2);
  const root1 = x;
  const root2 = mod(x * ED25519_SQRT_M1, P2);
  const useRoot1 = vx2 === u;
  const useRoot2 = vx2 === mod(-u, P2);
  const noRoot = vx2 === mod(-u * ED25519_SQRT_M1, P2);
  if (useRoot1)
    x = root1;
  if (useRoot2 || noRoot)
    x = root2;
  if (isNegativeLE(x, P2))
    x = mod(-x, P2);
  return { isValid: useRoot1 || useRoot2, value: x };
}
var ed25519_Point = /* @__PURE__ */ edwards(ed25519_CURVE, { uvRatio });
var Fp = /* @__PURE__ */ (() => ed25519_Point.Fp)();
var Fn = /* @__PURE__ */ (() => ed25519_Point.Fn)();
var x25519 = /* @__PURE__ */ (() => {
  const P2 = ed25519_CURVE_p;
  return montgomery({
    P: P2,
    type: "x25519",
    powPminus2: (x) => {
      const { pow_p_5_8, b2 } = ed25519_pow_2_252_3(x);
      return mod(pow2(pow_p_5_8, _3n2, P2) * b2, P2);
    },
    adjustScalarBytes
  });
})();
var SQRT_M1 = ED25519_SQRT_M1;
var SQRT_AD_MINUS_ONE = /* @__PURE__ */ BigInt("25063068953384623474111414158702152701244531502492656460079210482610430750235");
var INVSQRT_A_MINUS_D = /* @__PURE__ */ BigInt("54469307008909316920995813868745141605393597292927456921205312896311721017578");
var ONE_MINUS_D_SQ = /* @__PURE__ */ BigInt("1159843021668779879193775521855586647937357759715417654439879720876111806838");
var D_MINUS_ONE_SQ = /* @__PURE__ */ BigInt("40440834346308536858101042469323190826248399146238708352240133220865137265952");
var invertSqrt = (number) => uvRatio(_1n6, number);
var MAX_255B = /* @__PURE__ */ BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
var bytes255ToNumberLE = (bytes4) => Fp.create(bytesToNumberLE(bytes4) & MAX_255B);
function calcElligatorRistrettoMap(r0) {
  const { d } = ed25519_CURVE;
  const P2 = ed25519_CURVE_p;
  const mod2 = (n) => Fp.create(n);
  const r = mod2(SQRT_M1 * r0 * r0);
  const Ns = mod2((r + _1n6) * ONE_MINUS_D_SQ);
  let c = BigInt(-1);
  const D = mod2((c - d * r) * mod2(r + d));
  let { isValid: Ns_D_is_sq, value: s } = uvRatio(Ns, D);
  let s_ = mod2(s * r0);
  if (!isNegativeLE(s_, P2))
    s_ = mod2(-s_);
  if (!Ns_D_is_sq)
    s = s_;
  if (!Ns_D_is_sq)
    c = r;
  const Nt = mod2(c * (r - _1n6) * D_MINUS_ONE_SQ - D);
  const s2 = s * s;
  const W0 = mod2((s + s) * D);
  const W1 = mod2(Nt * SQRT_AD_MINUS_ONE);
  const W2 = mod2(_1n6 - s2);
  const W3 = mod2(_1n6 + s2);
  return new ed25519_Point(mod2(W0 * W3), mod2(W2 * W1), mod2(W1 * W3), mod2(W0 * W2));
}
var _RistrettoPoint = class __RistrettoPoint extends PrimeEdwardsPoint {
  // Do NOT change syntax: the following gymnastics is done,
  // because typescript strips comments, which makes bundlers disable tree-shaking.
  // prettier-ignore
  static BASE = /* @__PURE__ */ (() => new __RistrettoPoint(ed25519_Point.BASE))();
  // prettier-ignore
  static ZERO = /* @__PURE__ */ (() => new __RistrettoPoint(ed25519_Point.ZERO))();
  // prettier-ignore
  static Fp = /* @__PURE__ */ (() => Fp)();
  // prettier-ignore
  static Fn = /* @__PURE__ */ (() => Fn)();
  constructor(ep) {
    super(ep);
  }
  /**
   * Create one Ristretto255 point from affine Edwards coordinates.
   * This wraps the internal Edwards representative directly and is not a
   * canonical ristretto255 decoding path.
   * Use `toBytes()` / `fromBytes()` if canonical ristretto255 bytes matter.
   */
  static fromAffine(ap) {
    return new __RistrettoPoint(ed25519_Point.fromAffine(ap));
  }
  assertSame(other) {
    if (!(other instanceof __RistrettoPoint))
      throw new Error("RistrettoPoint expected");
  }
  init(ep) {
    return new __RistrettoPoint(ep);
  }
  static fromBytes(bytes4) {
    abytes(bytes4, 32);
    const { a, d } = ed25519_CURVE;
    const P2 = ed25519_CURVE_p;
    const mod2 = (n) => Fp.create(n);
    const s = bytes255ToNumberLE(bytes4);
    if (!equalBytes2(Fp.toBytes(s), bytes4) || isNegativeLE(s, P2))
      throw new Error("invalid ristretto255 encoding 1");
    const s2 = mod2(s * s);
    const u1 = mod2(_1n6 + a * s2);
    const u2 = mod2(_1n6 - a * s2);
    const u1_2 = mod2(u1 * u1);
    const u2_2 = mod2(u2 * u2);
    const v = mod2(a * d * u1_2 - u2_2);
    const { isValid, value: I } = invertSqrt(mod2(v * u2_2));
    const Dx = mod2(I * u2);
    const Dy = mod2(I * Dx * v);
    let x = mod2((s + s) * Dx);
    if (isNegativeLE(x, P2))
      x = mod2(-x);
    const y = mod2(u1 * Dy);
    const t = mod2(x * y);
    if (!isValid || isNegativeLE(t, P2) || y === _0n6)
      throw new Error("invalid ristretto255 encoding 2");
    return new __RistrettoPoint(new ed25519_Point(x, y, _1n6, t));
  }
  /**
   * Converts ristretto-encoded string to ristretto point.
   * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-decode).
   * @param hex - Ristretto-encoded 32 bytes. Not every 32-byte string is valid ristretto encoding
   */
  static fromHex(hex7) {
    return __RistrettoPoint.fromBytes(hexToBytes(hex7));
  }
  /**
   * Encodes ristretto point to Uint8Array.
   * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-encode).
   */
  toBytes() {
    let { X, Y, Z, T } = this.ep;
    const P2 = ed25519_CURVE_p;
    const mod2 = (n) => Fp.create(n);
    const u1 = mod2(mod2(Z + Y) * mod2(Z - Y));
    const u2 = mod2(X * Y);
    const u2sq = mod2(u2 * u2);
    const { value: invsqrt } = invertSqrt(mod2(u1 * u2sq));
    const D1 = mod2(invsqrt * u1);
    const D2 = mod2(invsqrt * u2);
    const zInv = mod2(D1 * D2 * T);
    let D;
    if (isNegativeLE(T * zInv, P2)) {
      let _x = mod2(Y * SQRT_M1);
      let _y = mod2(X * SQRT_M1);
      X = _x;
      Y = _y;
      D = mod2(D1 * INVSQRT_A_MINUS_D);
    } else {
      D = D2;
    }
    if (isNegativeLE(X * zInv, P2))
      Y = mod2(-Y);
    let s = mod2((Z - Y) * D);
    if (isNegativeLE(s, P2))
      s = mod2(-s);
    return Fp.toBytes(s);
  }
  /**
   * Compares two Ristretto points.
   * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-equals).
   */
  equals(other) {
    this.assertSame(other);
    const { X: X1, Y: Y1 } = this.ep;
    const { X: X2, Y: Y2 } = other.ep;
    const mod2 = (n) => Fp.create(n);
    const one = mod2(X1 * Y2) === mod2(Y1 * X2);
    const two = mod2(Y1 * Y2) === mod2(X1 * X2);
    return one || two;
  }
  is0() {
    return this.equals(__RistrettoPoint.ZERO);
  }
};
Object.freeze(_RistrettoPoint.BASE);
Object.freeze(_RistrettoPoint.ZERO);
Object.freeze(_RistrettoPoint.prototype);
Object.freeze(_RistrettoPoint);
var ristretto255_hasher = Object.freeze({
  Point: _RistrettoPoint,
  /**
  * Spec: https://www.rfc-editor.org/rfc/rfc9380.html#name-hashing-to-ristretto255. Caveats:
  * * There are no test vectors
  * * encodeToCurve / mapToCurve is undefined
  * * mapToCurve would be `calcElligatorRistrettoMap(scalars[0])`, not ristretto255_map!
  * * hashToScalar is undefined too, so we just use OPRF implementation
  * * We cannot re-use 'createHasher', because ristretto255_map is different algorithm/RFC
    (os2ip -> bytes255ToNumberLE)
  * * mapToCurve == calcElligatorRistrettoMap, hashToCurve == ristretto255_map
  * * hashToScalar is undefined in RFC9380 for ristretto, so we use the OPRF
    version here. Using `bytes255ToNumblerLE` will create a different result
    if we use `bytes255ToNumberLE` as os2ip
  * * current version is closest to spec.
  */
  hashToCurve(msg, options) {
    const DST = options?.DST === void 0 ? "ristretto255_XMD:SHA-512_R255MAP_RO_" : options.DST;
    const xmd = expand_message_xmd(msg, DST, 64, sha512);
    return ristretto255_hasher.deriveToCurve(xmd);
  },
  hashToScalar(msg, options = { DST: _DST_scalar }) {
    const xmd = expand_message_xmd(msg, options.DST, 64, sha512);
    return Fn.create(bytesToNumberLE(xmd));
  },
  /**
   * HashToCurve-like construction based on RFC 9496 (Element Derivation).
   * Converts 64 uniform random bytes into a curve point.
   *
   * WARNING: This represents an older hash-to-curve construction from before
   * RFC 9380 was finalized.
   * It was later reused as a component in the newer
   * `hash_to_ristretto255` function defined in RFC 9380.
   */
  deriveToCurve(bytes4) {
    abytes(bytes4, 64);
    const r1 = bytes255ToNumberLE(bytes4.subarray(0, 32));
    const R1 = calcElligatorRistrettoMap(r1);
    const r2 = bytes255ToNumberLE(bytes4.subarray(32, 64));
    const R2 = calcElligatorRistrettoMap(r2);
    return new _RistrettoPoint(R1.add(R2));
  }
});

// node_modules/@noble/hashes/hmac.js
var _HMAC = class {
  oHash;
  iHash;
  blockLen;
  outputLen;
  canXOF = false;
  finished = false;
  destroyed = false;
  constructor(hash, key) {
    ahash(hash);
    abytes(key, void 0, "key");
    this.iHash = hash.create();
    if (typeof this.iHash.update !== "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen;
    this.outputLen = this.iHash.outputLen;
    const blockLen = this.blockLen;
    const pad = new Uint8Array(blockLen);
    pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
    for (let i = 0; i < pad.length; i++)
      pad[i] ^= 54;
    this.iHash.update(pad);
    this.oHash = hash.create();
    for (let i = 0; i < pad.length; i++)
      pad[i] ^= 54 ^ 92;
    this.oHash.update(pad);
    clean(pad);
  }
  update(buf) {
    aexists(this);
    this.iHash.update(buf);
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const buf = out.subarray(0, this.outputLen);
    this.iHash.digestInto(buf);
    this.oHash.update(buf);
    this.oHash.digestInto(buf);
    this.destroy();
  }
  digest() {
    const out = new Uint8Array(this.oHash.outputLen);
    this.digestInto(out);
    return out;
  }
  _cloneInto(to) {
    to ||= Object.create(Object.getPrototypeOf(this), {});
    const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
    to = to;
    to.finished = finished;
    to.destroyed = destroyed;
    to.blockLen = blockLen;
    to.outputLen = outputLen;
    to.oHash = oHash._cloneInto(to.oHash);
    to.iHash = iHash._cloneInto(to.iHash);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = true;
    this.oHash.destroy();
    this.iHash.destroy();
  }
};
var hmac = /* @__PURE__ */ (() => {
  const hmac_ = ((hash, key, message2) => new _HMAC(hash, key).update(message2).digest());
  hmac_.create = (hash, key) => new _HMAC(hash, key);
  return hmac_;
})();

// src/hpke.js
var utf82 = new TextEncoder();
var PREFIX = utf82.encode("HPKE-v1");
var KEM = Uint8Array.of(75, 69, 77, 0, 32);
var SUITE = Uint8Array.of(72, 80, 75, 69, 0, 32, 0, 1, 0, 3);
var INFO = utf82.encode("NIP043/HPKE/CP1");
var AAD = utf82.encode("NIP043/note/CP1");
var P25519 = (1n << 255n) - 19n;
function join3(...parts) {
  const out = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}
function bytes322(value, name) {
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
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/i.test(value)) throw new TypeError(`invalid ${name}`);
  return Uint8Array.from(value.match(/../g), (byte) => parseInt(byte, 16));
}
function validPublic(publicKey) {
  bytes322(publicKey, "X25519 public key");
  let number = 0n;
  for (let i = 31; i >= 0; i--) number = number * 256n + BigInt(publicKey[i]);
  if (number === 0n || number >= P25519) throw new RangeError("noncanonical X25519 public key");
  return publicKey;
}
function labeledExtract(suite, salt, label2, input) {
  return hmac(sha256, salt, join3(PREFIX, suite, utf82.encode(label2), input));
}
function labeledExpand(suite, prk, label2, context, length) {
  if (length < 1 || length > 32) throw new RangeError("unsupported HPKE expand length");
  return hmac(
    sha256,
    prk,
    join3(
      Uint8Array.of(length >> 8, length & 255),
      PREFIX,
      suite,
      utf82.encode(label2),
      context,
      Uint8Array.of(1)
    )
  ).slice(0, length);
}
function pair(ikm) {
  bytes322(ikm, "HPKE seed");
  const prk = labeledExtract(KEM, new Uint8Array(), "dkp_prk", ikm);
  const secret = labeledExpand(KEM, prk, "sk", new Uint8Array(), 32);
  prk.fill(0);
  return { secret, publicKey: x25519.getPublicKey(secret) };
}
function shared(secret, peerPublic, encapsulated, recipientPublic) {
  validPublic(peerPublic);
  const dh = x25519.getSharedSecret(secret, peerPublic);
  const prk = labeledExtract(KEM, new Uint8Array(), "eae_prk", dh);
  dh.fill(0);
  const result = labeledExpand(KEM, prk, "shared_secret", join3(encapsulated, recipientPublic), 32);
  prk.fill(0);
  return result;
}
function schedule(sharedSecret, info) {
  const context = join3(
    Uint8Array.of(0),
    labeledExtract(SUITE, new Uint8Array(), "psk_id_hash", new Uint8Array()),
    labeledExtract(SUITE, new Uint8Array(), "info_hash", info)
  );
  const secret = labeledExtract(SUITE, sharedSecret, "secret", new Uint8Array());
  const key = labeledExpand(SUITE, secret, "key", context, 32);
  const nonce = labeledExpand(SUITE, secret, "base_nonce", context, 12);
  secret.fill(0);
  return { key, nonce };
}
function deriveViewPublic(viewSeed) {
  const kp = pair(viewSeed);
  kp.secret.fill(0);
  return kp.publicKey;
}
function sealNote({ descriptor: descriptor2, amountAtomic }) {
  if (!descriptor2 || typeof descriptor2 !== "object") throw new TypeError("recipient descriptor required");
  const domain = hex32(descriptor2.domain, "pool domain");
  const assetId = hex32(descriptor2.asset_id, "pool asset");
  const owner = hex32(descriptor2.owner, "recipient owner");
  const viewPub = validPublic(hex32(descriptor2.view_pub, "recipient view public key"));
  if (decodeField(owner) === 0n) throw new RangeError("recipient owner must be nonzero");
  if (!globalThis.crypto?.getRandomValues) throw new Error("secure browser randomness is required");
  const ikm = globalThis.crypto.getRandomValues(new Uint8Array(32));
  const rho = globalThis.crypto.getRandomValues(new Uint8Array(32));
  const eph = pair(ikm);
  ikm.fill(0);
  try {
    const note = encodeNote({ domain, assetId, owner, viewPub, amountAtomic, rho });
    const cm = noteCommitment(note);
    const ss = shared(eph.secret, viewPub, eph.publicKey, viewPub);
    const { key, nonce } = schedule(ss, join3(INFO, domain, assetId));
    ss.fill(0);
    try {
      const ciphertext = chacha20poly1305(key, nonce, join3(AAD, domain, cm)).encrypt(note);
      if (ciphertext.length !== 185) throw new Error("unexpected CP1 ciphertext length");
      const record = new Uint8Array(1024);
      record.set(Uint8Array.of(1, 217, 0));
      record.set(eph.publicKey, 3);
      record.set(ciphertext, 35);
      return { note, cm, record };
    } finally {
      key.fill(0);
    }
  } finally {
    eph.secret.fill(0);
  }
}
function openNoteRecord({ record, cm, domain, assetId, viewSeed, spendSecret }) {
  if (!(record instanceof Uint8Array) || record.length !== 1024 || !equal(record.subarray(0, 3), Uint8Array.of(1, 217, 0)) || record.subarray(220).some((value) => value !== 0)) {
    throw new TypeError("invalid CP1 note record");
  }
  bytes322(cm, "commitment");
  if (decodeField(cm) === 0n) throw new RangeError("commitment must be nonzero");
  bytes322(domain, "domain");
  bytes322(assetId, "assetId");
  const enc = validPublic(record.subarray(3, 35));
  const recipient = pair(viewSeed);
  try {
    const ss = shared(recipient.secret, enc, enc, recipient.publicKey);
    const { key, nonce } = schedule(ss, join3(INFO, domain, assetId));
    ss.fill(0);
    let note;
    try {
      note = chacha20poly1305(key, nonce, join3(AAD, domain, cm)).decrypt(record.subarray(35, 220));
    } finally {
      key.fill(0);
    }
    const parsed = decodeNote(note);
    if (!equal(parsed.domain, domain) || !equal(parsed.assetId, assetId) || !equal(parsed.viewPub, recipient.publicKey) || !equal(noteCommitment(note), cm)) {
      throw new Error("CP1 note does not match pool or commitment");
    }
    if (spendSecret !== void 0) {
      bytes322(spendSecret, "spendSecret");
      if (!equal(parsed.owner, deriveOwner(domain, spendSecret))) {
        throw new Error("spend secret does not own this note");
      }
    }
    return {
      note,
      cm: cm.slice(),
      amountAtomic: parsed.amountAtomic,
      ...spendSecret === void 0 ? {} : { nf: noteNullifier(note, spendSecret) }
    };
  } finally {
    recipient.secret.fill(0);
  }
}

// src/c4-publication.js
var utf83 = (value) => new TextEncoder().encode(value);
var demand = (condition, message2) => {
  if (!condition) throw new Error(message2);
};
function bytes(value, size, label2) {
  demand(value instanceof Uint8Array && value.length === size, `${label2} must be ${size} bytes`);
  return value;
}
function concat(...items) {
  const result = new Uint8Array(items.reduce((n, x) => n + x.length, 0));
  let offset = 0;
  for (const item of items) {
    result.set(item, offset);
    offset += item.length;
  }
  return result;
}
function le64(value) {
  demand(typeof value === "bigint" && value >= 0n && value < 1n << 64n, "Expected unsigned 64-bit bigint");
  const result = new Uint8Array(8);
  for (let i = 0; i < 8; i++, value >>= 8n) result[i] = Number(value & 255n);
  return result;
}
var same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
function layout(form) {
  const deposit = form === "D0" || form === "D1";
  demand(deposit || /^T[1-4]$/.test(form), "Unsupported C4 publication form");
  const count = deposit ? 1 : Number(form[1]);
  return { deposit, count, recordsAt: 34 + count * 32, end: 34 + count * 252 };
}
function compactRecord(record) {
  bytes(record, 1024, "HPKE record");
  demand(same(record.slice(0, 3), Uint8Array.of(1, 217, 0)) && record.slice(220).every((x) => x === 0), "Noncanonical HPKE record");
  return record.slice(0, 220);
}
function c4Context({ domain, assetId, unit: unit2, registryRoot = new Uint8Array(32) }) {
  bytes(domain, 32, "Domain");
  bytes(assetId, 32, "Asset ID");
  bytes(registryRoot, 32, "Registry root");
  decodeField(registryRoot);
  demand(typeof unit2 === "bigint" && Array.from({ length: 9 }, (_, i) => 10n ** BigInt(i)).includes(unit2), "Invalid asset quantum");
  return poseidonBytes(concat(utf83("NeuraiPoolCtx"), Uint8Array.of(1), domain, assetId, le64(unit2), registryRoot));
}
function decodeC4Publication(form, blob) {
  bytes(blob, 4096, "C4 publication");
  const spec = layout(form);
  demand(blob[0] === 2 && blob[1] === spec.count, "C4 version/count mismatch");
  demand(blob.slice(spec.end).every((x) => x === 0), "Noncanonical C4 padding");
  const nf = spec.deposit ? null : blob.slice(2, 34);
  if (spec.deposit) demand(blob.slice(2, 34).every((x) => x === 0), "Deposit cannot carry a nullifier");
  else demand(decodeField(nf) !== 0n, "Zero nullifier");
  const cms = [], records = [];
  for (let i = 0; i < spec.count; i++) {
    const cm = blob.slice(34 + i * 32, 66 + i * 32);
    demand(decodeField(cm) !== 0n && !cms.some((other) => same(other, cm)), "Zero or duplicate commitment");
    cms.push(cm);
    const record = new Uint8Array(1024);
    record.set(blob.slice(spec.recordsAt + i * 220, spec.recordsAt + (i + 1) * 220));
    compactRecord(record);
    records.push(record);
  }
  return { cms, records, nf };
}
function encodeC4Publication(form, { cms, records, nf = null }) {
  const spec = layout(form);
  demand(Array.isArray(cms) && Array.isArray(records) && cms.length === spec.count && records.length === spec.count, "Wrong note count");
  demand(spec.deposit ? nf === null : nf instanceof Uint8Array, "Wrong nullifier presence");
  const result = new Uint8Array(4096);
  result.set([2, spec.count]);
  if (!spec.deposit) result.set(bytes(nf, 32, "Nullifier"), 2);
  cms.forEach((cm, i) => result.set(bytes(cm, 32, "Commitment"), 34 + i * 32));
  records.forEach((record, i) => result.set(compactRecord(record), spec.recordsAt + i * 220));
  decodeC4Publication(form, result);
  return result;
}
function c4PublicationHash(form, blob) {
  decodeC4Publication(form, blob);
  const seed = poseidonBytes(utf83("NIP045/dat"));
  return poseidonBytes(concat(poseidonBytes(concat(seed, blob.slice(0, 2048))), blob.slice(2048)));
}

// src/pool-state.js
var encoder = new TextEncoder();
var ZERO = new Uint8Array(32);
var MAX_INDEX = 4294967295;
function bytes323(value, name) {
  if (!(value instanceof Uint8Array) || value.length !== 32) {
    throw new TypeError(`${name} must be 32 bytes`);
  }
  decodeField(value);
  return value;
}
function uint32(value, name) {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_INDEX) {
    throw new RangeError(`${name} is not a uint32`);
  }
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, true);
  return out;
}
function concat2(...parts) {
  const out = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
function poolTreeNode(left, right) {
  return encodeField(poseidonPermutation([
    0n,
    decodeField(bytes323(left, "left")),
    decodeField(bytes323(right, "right"))
  ])[0]);
}
function poolTreeRoot(slots) {
  if (!(slots instanceof Map)) throw new TypeError("slots must be a Map");
  let layer = /* @__PURE__ */ new Map();
  for (const [index, value] of slots) {
    uint32(index, "slot index");
    layer.set(index, bytes323(value, "slot value"));
  }
  let empty2 = ZERO;
  for (let depth = 0; depth < 32; depth++) {
    const parents = /* @__PURE__ */ new Map();
    for (const index of layer.keys()) parents.set(Math.floor(index / 2), true);
    const next = /* @__PURE__ */ new Map();
    for (const index of parents.keys()) {
      next.set(index, poolTreeNode(
        layer.get(index * 2) ?? empty2,
        layer.get(index * 2 + 1) ?? empty2
      ));
    }
    layer = next;
    empty2 = poolTreeNode(empty2, empty2);
  }
  return layer.get(0) ?? empty2;
}
function poolIndexedLeaf(kind, value, nextValue, nextIndex) {
  if (kind !== "cm" && kind !== "nf") throw new TypeError("indexed kind must be cm or nf");
  return poseidonBytes(concat2(
    encoder.encode(`NIP043/${kind}leaf`),
    encodeField(value),
    encodeField(nextValue),
    uint32(nextIndex, "next index")
  ));
}
function poolIndexedInsert(kind, entries, value) {
  if (!(entries instanceof Map) || !entries.has(0)) throw new TypeError("missing sentinel");
  if (typeof value !== "bigint" || value <= 0n) throw new RangeError("indexed value must be positive");
  encodeField(value);
  if (entries.size >= MAX_INDEX) throw new RangeError("indexed tree is full");
  let predIndex = -1;
  let predValue = -1n;
  for (const [index2, entry] of entries) {
    uint32(index2, "entry index");
    if (!Array.isArray(entry) || entry.length !== 3) throw new TypeError("bad indexed entry");
    if (entry[0] === value) throw new RangeError("duplicate indexed value");
    if (entry[0] < value && entry[0] > predValue) {
      predIndex = index2;
      predValue = entry[0];
    }
  }
  if (predIndex < 0) throw new Error("indexed predecessor missing");
  const [oldValue, nextValue, nextIndex] = entries.get(predIndex);
  if (nextValue !== 0n && value >= nextValue) throw new Error("indexed predecessor link invalid");
  const index = entries.size;
  if (entries.has(index)) throw new Error("indexed append slot occupied");
  const updated = new Map(entries);
  updated.set(predIndex, [oldValue, value, index]);
  updated.set(index, [value, nextValue, nextIndex]);
  return updated;
}
function poolIndexedRoot(kind, entries) {
  if (!(entries instanceof Map) || !entries.has(0)) throw new TypeError("missing sentinel");
  return poolTreeRoot(new Map(Array.from(entries, ([index, entry]) => [index, poolIndexedLeaf(kind, ...entry)])));
}
function poolStateOpening({ slots, seen, nfs, mode }) {
  if (mode !== 0 && mode !== 1) throw new RangeError("invalid pool mode");
  if (!(slots instanceof Map) || !(seen instanceof Map) || !(nfs instanceof Map)) {
    throw new TypeError("state trees must be Maps");
  }
  return concat2(
    poolTreeRoot(slots),
    poolIndexedRoot("nf", nfs),
    poolIndexedRoot("cm", seen),
    uint32(slots.size, "note count"),
    uint32(nfs.size, "nullifier count"),
    uint32(seen.size, "seen count"),
    Uint8Array.of(mode)
  );
}
function poolStateDigest(state) {
  return poseidonBytes(poolStateOpening(state));
}
function emptyPoolState() {
  return {
    slots: /* @__PURE__ */ new Map(),
    seen: /* @__PURE__ */ new Map([[0, [0n, 0n, 0]]]),
    nfs: /* @__PURE__ */ new Map([[0, [0n, 0n, 0]]]),
    mode: 0
  };
}

// src/pool-txhash.js
var tag = sha256(new TextEncoder().encode("NeuraiTxHash"));
var mask = Uint8Array.of(31, 1);
var empty = new Uint8Array();
var doubleSha256 = (data) => sha256(sha256(data));
function concat3(...parts) {
  const out = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
function bytes2(value, name) {
  if (!(value instanceof Uint8Array)) throw new TypeError(`${name} must be bytes`);
  return value;
}
function poolTxHash({ version, locktime, prevouts, sequences, outputs }) {
  bytes2(version, "version");
  bytes2(locktime, "locktime");
  bytes2(prevouts, "prevouts");
  bytes2(sequences, "sequences");
  bytes2(outputs, "outputs");
  if (version.length !== 4 || locktime.length !== 4 || prevouts.length === 0 || prevouts.length % 36 !== 0 || sequences.length !== prevouts.length / 9 || outputs.length === 0) {
    throw new RangeError("invalid pool transaction preimage fields");
  }
  const payload = concat3(
    mask,
    version,
    locktime,
    doubleSha256(prevouts),
    doubleSha256(sequences),
    doubleSha256(outputs),
    doubleSha256(empty)
  );
  return sha256(concat3(tag, tag, payload));
}
function poolTxAnchor(fields) {
  return poseidonBytes(poolTxHash(fields));
}

// src/pool-transaction.js
var MAX_MONEY = 2100000000000000000n;
function bytes3(hex7, name) {
  if (typeof hex7 !== "string" || hex7.length % 2 || !/^[0-9a-f]*$/i.test(hex7)) {
    throw new TypeError(`${name} must be even-length hex`);
  }
  return Uint8Array.from(hex7.match(/../g) ?? [], (pair2) => parseInt(pair2, 16));
}
function concat4(...parts) {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let at = 0;
  for (const part of parts) {
    result.set(part, at);
    at += part.length;
  }
  return result;
}
function u323(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 4294967295) throw new RangeError("vout is not uint32");
  const result = new Uint8Array(4);
  new DataView(result.buffer).setUint32(0, value, true);
  return result;
}
function u64(value) {
  if (typeof value !== "bigint" && !(typeof value === "string" && /^\d+$/.test(value)) || BigInt(value) < 0n || BigInt(value) > MAX_MONEY) throw new RangeError("invalid atomic XNA value");
  const result = new Uint8Array(8);
  let remaining = BigInt(value);
  for (let i = 0; i < 8; i++) {
    result[i] = Number(remaining & 255n);
    remaining >>= 8n;
  }
  return result;
}
function compactSize(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 4294967295) throw new RangeError("invalid script size");
  if (value < 253) return Uint8Array.of(value);
  if (value <= 65535) return Uint8Array.of(253, value & 255, value >>> 8);
  return concat4(Uint8Array.of(254), u323(value));
}
function serializePoolTemplate({ inputs, outputs }) {
  if (!Array.isArray(inputs) || !inputs.length || !Array.isArray(outputs) || !outputs.length) {
    throw new TypeError("nonempty pool inputs and outputs required");
  }
  const prevouts = concat4(...inputs.map(({ txid, vout }) => {
    const hash = bytes3(txid, "txid");
    if (hash.length !== 32) throw new TypeError("txid must be 32 bytes");
    return concat4(hash.reverse(), u323(vout));
  }));
  const serializedOutputs = concat4(...outputs.map(({ valueSats, scriptHex }) => {
    const script = bytes3(scriptHex, "script");
    return concat4(u64(valueSats), compactSize(script.length), script);
  }));
  const fields = {
    version: Uint8Array.of(3, 0, 0, 0),
    locktime: new Uint8Array(4),
    prevouts,
    sequences: new Uint8Array(inputs.length * 4).fill(255),
    outputs: serializedOutputs
  };
  return { ...fields, anchor: poolTxAnchor(fields) };
}

// src/c4.js
var C4_FORMS = ["D0", "D1", "T1", "T2", "T3", "T4", "W_partial", "W_full"];
var hex = (x) => Array.from(x, (b) => b.toString(16).padStart(2, "0")).join("");
function unhex(x) {
  if (typeof x !== "string" || !/^(?:[0-9a-f]{2})*$/i.test(x)) throw new Error("Invalid hex");
  return Uint8Array.from(x.match(/../g) ?? [], (b) => parseInt(b, 16));
}
function cat(...xs) {
  const r = new Uint8Array(xs.reduce((n, x) => n + x.length, 0));
  let i = 0;
  for (const x of xs) {
    r.set(x, i);
    i += x.length;
  }
  return r;
}
var utf84 = (x) => new TextEncoder().encode(x);
var demand2 = (ok, why) => {
  if (!ok) throw new Error(why);
};
function le(x, size) {
  let n = BigInt(x);
  demand2(n >= 0n && n < 1n << BigInt(size * 8), "Integer overflow");
  const b = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    b[i] = Number(n & 255n);
    n >>= 8n;
  }
  return b;
}
function compact(n) {
  return n < 253 ? le(n, 1) : n <= 65535 ? cat(le(253, 1), le(n, 2)) : cat(le(254, 1), le(n, 4));
}
var variable = (b) => cat(compact(b.length), b);
function push(b) {
  return cat(b.length < 76 ? le(b.length, 1) : b.length <= 255 ? cat(le(76, 1), le(b.length, 1)) : cat(le(77, 1), le(b.length, 2)), b);
}
function tagged(tag2, data) {
  const t = sha256(utf84(tag2));
  return sha256(cat(t, t, data));
}
var p2pkh = (x) => /^76a914[0-9a-f]{40}88ac$/.test(x);
var transparent = (x) => p2pkh(x) || /^(?:52|53)20[0-9a-f]{64}$/.test(x);
function c4DustAtomic(scriptHex, feePerKb = "3000") {
  demand2((transparent(scriptHex) || /^5120[0-9a-f]{64}$/.test(scriptHex)) && typeof feePerKb === "string" && /^(0|[1-9][0-9]*)$/.test(feePerKb), "Invalid dust policy input");
  const size = p2pkh(scriptHex) ? 182n : /^(?:51|52)/.test(scriptHex) ? 1020n : 112n;
  const rate = BigInt(feePerKb), fee = size * rate / 1000n;
  return fee === 0n && rate > 0n ? 1n : fee;
}
var decimal = (x) => typeof x === "bigint" ? x.toString() : Array.isArray(x) ? x.map(decimal) : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, decimal(v)])) : x;
function validateC4Manifest(m, { expectedGenesis = RESET_TESTNET_GENESIS, expectedCommitment } = {}) {
  demand2(typeof expectedCommitment === "string" && /^[0-9a-f]{64}$/.test(expectedCommitment) && m?.commitment === expectedCommitment, "An independently pinned pool commitment is required");
  demand2(m?.schema === "neurai-c4-xna-test-v1" && m.testOnly === true && m.profile === "xna", "Only experimental C4 XNA is supported");
  demand2(/^[0-9a-f]{64}$/.test(expectedGenesis) && m.genesis === expectedGenesis, "Unexpected chain genesis");
  demand2(m.unit === "1" && m.registryRoot === "00".repeat(32), "XNA context must have unit one and no registry");
  demand2(/^[A-Z0-9_]+#POOL$/.test(m.identity) && m.identity.length <= 30, "Invalid UNIQUE identity");
  demand2(/^[0-9a-f]{64}$/.test(m.issuance?.txid) && Number.isSafeInteger(m.issuance?.vout) && m.issuance.vout >= 0 && m.issuance.vout <= 4294967295, "Pinned issuance outpoint required");
  const domain = sha256(cat(utf84("NIP043/instance/v3"), unhex(m.genesis).reverse(), unhex(m.issuance.txid).reverse(), le(m.issuance.vout, 4), variable(utf84(m.identity))));
  const assetId = sha256(cat(utf84("NeuraiPoolAsset/v2"), Uint8Array.of(0, 0)));
  demand2(hex(domain) === m.domain && hex(assetId) === m.assetId, "Wrong instance domain or native asset ID");
  demand2(hex(c4Context({ domain, assetId, unit: 1n })) === m.context, "Context mismatch");
  demand2(/^[0-9a-f]{64}$/.test(m.birth) && Number.isSafeInteger(m.birthHeight) && m.birthHeight > 0, "Pinned birth required");
  demand2(/^[0-9a-f]{64}$/.test(m.commitment) && /^[0-9a-f]{64}$/.test(m.reserveCommitment), "Bad commitments");
  demand2(C4_FORMS.every((f) => m.forms?.[f]) && Object.keys(m.forms).length === 8, "Eight circuit forms required");
  for (const f of C4_FORMS) {
    const entry = m.forms[f], script = unhex(entry.script), control = unhex(entry.control), vk = unhex(entry.vk);
    demand2(script.length > 0 && script.length <= 1e4 && control[0] === 1 && (control.length - 1) % 32 === 0, "Invalid MAST leaf");
    let root = tagged("NeuraiAuthLeaf", cat(le(1, 1), variable(script)));
    for (let at = 1; at < control.length; at += 32) {
      const sibling = control.slice(at, at + 32);
      root = tagged("NeuraiAuthBranch", hex(root) < hex(sibling) ? cat(root, sibling) : cat(sibling, root));
    }
    demand2(hex(tagged("NeuraiAuthScript", cat(le(4, 1), le(0, 1), root))) === m.commitment, "MAST commitment mismatch");
    demand2(hex(sha256(vk)) === entry.vkHash && entry.script.includes(entry.vkHash), "VK commitment mismatch");
    demand2(entry.script.includes(m.context), "Missing pinned context in leaf");
  }
  demand2(hex(tagged("NeuraiAuthScript", cat(le(1, 1), le(0, 1), sha256(unhex(m.guard))))) === m.reserveCommitment, "Reserve commitment mismatch");
  return m;
}
function c4StateScript(m, digest) {
  const payload = cat(utf84("xnat"), variable(utf84(m.identity)), le(1e8, 8), unhex("5420"), digest);
  return hex(cat(unhex("5120" + m.commitment + "c0"), push(payload), unhex("75")));
}
function c4Path(slots, index) {
  let empty2 = new Uint8Array(32), layer = new Map(slots);
  const siblings = [];
  for (let d = 0; d < 32; d++) {
    siblings.push(decodeField(layer.get(index ^ 1) ?? empty2));
    layer = new Map([...new Set([...layer.keys()].map((i) => Math.floor(i / 2)))].map((i) => [i, poolTreeNode(layer.get(i * 2) ?? empty2, layer.get(i * 2 + 1) ?? empty2)]));
    empty2 = poolTreeNode(empty2, empty2);
    index = Math.floor(index / 2);
  }
  return siblings;
}
function insert(kind, entries, value) {
  const updated = poolIndexedInsert(kind, entries, value);
  const index = entries.size;
  let pred = -1, pv = -1n;
  for (const [i, e] of entries) if (e[0] < value && e[0] > pv) {
    pred = i;
    pv = e[0];
  }
  const [predValue, predNextValue, predNextIndex] = entries.get(pred);
  const slots = new Map([...entries].map(([i, e]) => [i, poolIndexedLeaf(kind, ...e)]));
  const predPath = c4Path(slots, pred);
  slots.set(pred, poolIndexedLeaf(kind, predValue, value, index));
  return [{ predIndex: pred, predValue, predNextValue, predNextIndex, predPath, emptyPath: c4Path(slots, index) }, updated];
}
function add2(state, note) {
  const cm = noteCommitment(note), notePath = c4Path(state.slots, state.slots.size);
  const [fields, seen] = insert("cm", state.seen, decodeField(cm));
  state.seen = seen;
  state.slots.set(state.slots.size, cm);
  state.mode = 1;
  return { notePath, ...fields };
}
function spend(state, note, secret) {
  const cm = hex(noteCommitment(note));
  const noteIndex = [...state.slots].find(([, c]) => hex(c) === cm)?.[0];
  demand2(noteIndex !== void 0, "Note is not in the confirmed pool");
  const nf = decodeField(noteNullifier(note, secret));
  const notePath = c4Path(state.slots, noteIndex);
  const [fields, nfs] = insert("nf", state.nfs, nf);
  state.nfs = nfs;
  return { noteIndex, notePath, nf, ...fields };
}
function states(old, state) {
  return { oldState: Array.from(poolStateOpening(old)), newState: Array.from(poolStateOpening(state)), S_old: decodeField(poolStateDigest(old)), S_new: decodeField(poolStateDigest(state)) };
}
function c4Publication(form, created, nf) {
  return encodeC4Publication(form, { cms: created.map((x) => x.cm), records: created.map((x) => x.record), nf: form[0] === "D" ? null : encodeField(nf) });
}
function coin(u) {
  demand2(u && /^[0-9a-f]{64}$/.test(u.txid) && Number.isSafeInteger(u.vout) && u.vout >= 0 && u.vout <= 4294967295 && transparent(u.scriptHex), "A confirmed Legacy/PQ/ECDSA XNA coin is required");
  demand2(typeof u.valueSats === "string" && /^[1-9][0-9]*$/.test(u.valueSats), "Exact coin value required");
  return u;
}
function prepareC4({ manifest, scan, form, created = [], consumed, secret, funding, sponsor, payout, feeAtomic, dustRelayFeePerKb = "3000", expectedGenesis = RESET_TESTNET_GENESIS, expectedCommitment }) {
  const m = validateC4Manifest(manifest, { expectedGenesis, expectedCommitment });
  demand2(C4_FORMS.includes(form), "Unknown form");
  const old = scan.state, state = { slots: new Map(old.slots), seen: new Map(old.seen), nfs: new Map(old.nfs), mode: old.mode };
  const reserve = BigInt(scan.reserveAtomic);
  let nextReserve = reserve, amount = 0n, data;
  demand2(form === "D0" === (reserve === 0n), "Pool state changed: rescan required");
  demand2(form !== "D0" || old.mode === 0, "Pool mode mismatch");
  for (const fresh of created) {
    demand2(hex(noteCommitment(fresh.note)) === hex(fresh.cm), "Note commitment mismatch");
    const p = decodeNote(fresh.note);
    demand2(hex(p.domain) === m.domain && hex(p.assetId) === m.assetId, "Note belongs to another domain");
  }
  if (form[0] === "D") {
    demand2(created.length === 1 && !consumed, "Invalid deposit notes");
    const x = created[0];
    amount = decodeNote(x.note).amountAtomic;
    data = {
      ...add2(state, x.note),
      ...states(old, state),
      note: Array.from(x.note),
      cm: decodeField(x.cm),
      amount,
      dep: decodeField(poseidonBytes(cat(utf84(NEURAI_POOL_HASH_LABELS.deposit), le(amount, 8), x.cm))),
      wdr: decodeField(poseidonBytes(utf84(NEURAI_POOL_HASH_LABELS.withdrawal))),
      req: decodeField(poseidonBytes(utf84(NEURAI_POOL_HASH_LABELS.request)))
    };
    coin(funding);
    demand2(BigInt(funding.valueSats) === amount, "Deposit input must match the note amount exactly");
    nextReserve += amount;
  } else {
    demand2(consumed?.note && !consumed.spent, "Select an unspent owned note");
    const note = typeof consumed.note === "string" ? unhex(consumed.note) : consumed.note;
    const parsed = decodeNote(note);
    demand2(hex(parsed.domain) === m.domain && hex(parsed.assetId) === m.assetId, "Consumed note domain mismatch");
    const spent = spend(state, note, secret);
    amount = parsed.amountAtomic;
    if (form[0] === "T") {
      demand2(created.length === Number(form[1]) && created.reduce((sum, x) => sum + decodeNote(x.note).amountAtomic, 0n) === amount, "Transfer amounts must conserve the selected note");
      data = { oldState: Array.from(poolStateOpening(old)), S_old: decodeField(poolStateDigest(old)), states: [Array.from(poolStateOpening(state))], sk: Array.from(secret), spentNote: Array.from(note), spentCm: decodeField(noteCommitment(note)), spentIndex: spent.noteIndex, spentPath: spent.notePath, nf: spent.nf, cms: [], notes: [], amounts: [], notePaths: [], predIndices: [], predValues: [], predNextValues: [], predNextIndices: [], predPaths: [], emptyPaths: [] };
      for (const k of ["predIndex", "predValue", "predNextValue", "predNextIndex", "predPath", "emptyPath"]) data["nf" + k[0].toUpperCase() + k.slice(1)] = spent[k];
      const mapping = { notePath: "notePaths", predIndex: "predIndices", predValue: "predValues", predNextValue: "predNextValues", predNextIndex: "predNextIndices", predPath: "predPaths", emptyPath: "emptyPaths" };
      for (const fresh of created) {
        const fields = add2(state, fresh.note);
        for (const [k, v] of Object.entries(fields)) data[mapping[k]].push(v);
        data.cms.push(decodeField(fresh.cm));
        data.notes.push(Array.from(fresh.note));
        data.amounts.push(decodeNote(fresh.note).amountAtomic);
        data.states.push(Array.from(poolStateOpening(state)));
      }
      data.S_new = decodeField(poolStateDigest(state));
    } else {
      demand2(created.length === 0 && transparent(payout), "Withdrawal requires a Legacy/PQ/ECDSA destination");
      nextReserve -= amount;
      demand2(nextReserve >= 0n && form === "W_full" === (nextReserve === 0n), "Wrong withdrawal form");
      if (form === "W_full") state.mode = 0;
      data = { ...spent, ...states(old, state), note: Array.from(note), sk: Array.from(secret), cm: decodeField(noteCommitment(note)), amount, reserve_in: reserve, reserve_out: nextReserve };
    }
  }
  demand2(nextReserve <= 2100000000000000000n, "Reserve exceeds money range");
  data.ctx = decodeField(unhex(m.context));
  data.D = Array.from(unhex(m.domain));
  data.AID = Array.from(unhex(m.assetId));
  data.unit = 1n;
  data.registryRoot = Array(32).fill(0);
  let blob;
  if ("DT".includes(form[0])) {
    blob = c4Publication(form, created, data.nf);
    data.data_hash = decodeField(c4PublicationHash(form, blob));
  }
  coin(sponsor);
  demand2(typeof feeAtomic === "string" && /^[1-9][0-9]*$/.test(feeAtomic), "Exact positive fee required");
  const fee = BigInt(feeAtomic);
  demand2(fee <= 100000000n && BigInt(sponsor.valueSats) - fee >= c4DustAtomic(sponsor.scriptHex, dustRelayFeePerKb), "Fee must be at most 1 XNA and leave non-dust sponsor change");
  const inputs = [{ txid: old.stateOutpoint[0], vout: 0 }];
  if (form !== "D0") {
    demand2(old.reserveOutpoint?.[0] === old.stateOutpoint[0] && old.reserveOutpoint[1] === 1, "Noncanonical reserve");
    inputs.push({ txid: old.reserveOutpoint[0], vout: 1 });
  }
  if (form[0] === "D") inputs.push(funding);
  inputs.push(sponsor);
  demand2(new Set(inputs.map((x) => x.txid + ":" + x.vout)).size === inputs.length, "Duplicate transaction input");
  const outputs = [{ valueSats: 0n, scriptHex: c4StateScript(m, encodeField(data.S_new)) }];
  if (form !== "W_full") {
    demand2(nextReserve >= c4DustAtomic("5120" + m.reserveCommitment, dustRelayFeePerKb), "Reserve output would be dust under the selected policy");
    outputs.push({ valueSats: nextReserve, scriptHex: "5120" + m.reserveCommitment });
  }
  if (form[0] === "W") {
    demand2(amount >= c4DustAtomic(payout, dustRelayFeePerKb), "Withdrawal would be dust under the selected policy");
    outputs.push({ valueSats: amount, scriptHex: payout });
  }
  outputs.push({ valueSats: BigInt(sponsor.valueSats) - fee, scriptHex: sponsor.scriptHex });
  const template = serializePoolTemplate({ inputs, outputs });
  data.anchor = decodeField(template.anchor);
  const publics = [data.ctx, data.S_old, data.S_new];
  if (form[0] === "D") publics.push(data.dep, data.wdr, data.req, data.data_hash, data.anchor, amount);
  else if (form[0] === "T") publics.push(data.nf, data.data_hash, data.anchor, ...created.map((x) => decodeField(x.cm)));
  else publics.push(data.nf, data.anchor, amount, reserve, nextReserve);
  return { state, form, inputs, outputs, template, input: decimal(data), publicSignals: publics.map(String), blob, nf: data.nf === void 0 ? void 0 : encodeField(data.nf), feeAtomic, manifest: m };
}
var FP = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
function g1(p) {
  const [x, y] = p.map(BigInt);
  demand2(x >= 0n && x < FP && y >= 0n && y < FP && y * y % FP === (x * x % FP * x + 3n) % FP, "Invalid G1 proof point");
  return le(x | (y > FP - y ? 1n << 255n : 0n), 32);
}
function g2(p) {
  const [x, y] = p.map((q) => q.map(BigInt));
  demand2([...x, ...y].every((v) => v >= 0n && v < FP), "Invalid G2 coordinate");
  const n = y.map((v) => (FP - v) % FP);
  const sign = y[1] > n[1] || y[1] === n[1] && y[0] > n[0];
  return cat(le(x[0], 32), le(x[1] | (sign ? 1n << 255n : 0n), 32));
}
function c4ProofBytes(proof) {
  return cat(g1(proof.pi_a), g2(proof.pi_b), g1(proof.pi_c));
}
function finishC4(prepared, proof, publicSignals) {
  demand2(JSON.stringify(publicSignals.map(String)) === JSON.stringify(prepared.publicSignals), "Proof public inputs differ from the transaction");
  const { form, inputs, outputs, template, manifest: m } = prepared, entry = m.forms[form];
  const args = prepared.blob ? [prepared.blob.slice(0, 2048), prepared.blob.slice(2048)] : [prepared.nf];
  const own = [unhex("10"), c4ProofBytes(proof), unhex(entry.vk), ...args, template.prevouts, unhex(entry.script), unhex(entry.control)];
  const witnesses = [own, ...form === "D0" ? [] : [[unhex("00"), unhex(m.guard)]], ...form[0] === "D" ? [[]] : [], []];
  demand2(witnesses.length === inputs.length, "Witness count mismatch");
  return hex(cat(le(3, 4), unhex("0001"), compact(inputs.length), ...inputs.map((x) => cat(unhex(x.txid).reverse(), le(x.vout, 4), le(0, 1), unhex("ffffffff"))), compact(outputs.length), template.outputs, le(0, 1), ...witnesses.map((w) => cat(compact(w.length), ...w.map(variable))), le(0, 4)));
}

// src/checkpoint-crypto.js
var encoder2 = new TextEncoder();
var decoder2 = new TextDecoder("utf-8", { fatal: true });
var AAD2 = encoder2.encode("Neurai/privacy/scan-checkpoint/v1");
var MAX_BYTES = 32 * 1024 * 1024;
var hex2 = (bytes4) => Array.from(bytes4, (byte) => byte.toString(16).padStart(2, "0")).join("");
function unhex2(value) {
  if (typeof value !== "string" || !/^(?:[0-9a-f]{2})+$/i.test(value)) throw new Error("Invalid scan checkpoint");
  return Uint8Array.from(value.match(/../g), (pair2) => parseInt(pair2, 16));
}
function sealScanCheckpoint(checkpoint, key) {
  if (!globalThis.crypto?.getRandomValues) throw new Error("Secure randomness is required");
  const plaintext = encoder2.encode(JSON.stringify(checkpoint));
  if (plaintext.length > MAX_BYTES) throw new RangeError("Scan checkpoint is too large");
  const nonce = globalThis.crypto.getRandomValues(new Uint8Array(12));
  try {
    return JSON.stringify({ version: 1, nonce: hex2(nonce), ciphertext: hex2(chacha20poly1305(key, nonce, AAD2).encrypt(plaintext)) });
  } finally {
    plaintext.fill(0);
  }
}
function openScanCheckpoint(encoded, key) {
  if (typeof encoded !== "string" || encoded.length > (MAX_BYTES + 16) * 2 + 100) throw new Error("Invalid scan checkpoint");
  const envelope = JSON.parse(encoded);
  if (envelope?.version !== 1) throw new Error("Unsupported scan checkpoint");
  const nonce = unhex2(envelope.nonce);
  const ciphertext = unhex2(envelope.ciphertext);
  if (nonce.length !== 12 || ciphertext.length < 16 || ciphertext.length > MAX_BYTES + 16) throw new Error("Invalid scan checkpoint");
  const plaintext = chacha20poly1305(key, nonce, AAD2).decrypt(ciphertext);
  try {
    return JSON.parse(decoder2.decode(plaintext));
  } finally {
    plaintext.fill(0);
  }
}

// src/browser-wallet.js
function bytesFromHex(value, name) {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/i.test(value)) {
    throw new TypeError(`${name} must be 32 hex bytes`);
  }
  return Uint8Array.from(value.match(/../g), (byte) => parseInt(byte, 16));
}
function hex3(bytes4) {
  return Array.from(bytes4, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function equal2(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}
var BrowserTestIdentity = class _BrowserTestIdentity {
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
    if (!globalThis.crypto?.getRandomValues) throw new Error("secure browser randomness is required");
    const d = bytesFromHex(domain, "domain");
    const asset = bytesFromHex(assetId, "assetId");
    const spendSecret = globalThis.crypto.getRandomValues(new Uint8Array(32));
    const viewSeed = globalThis.crypto.getRandomValues(new Uint8Array(32));
    try {
      const backup = await sealVault({ spend_key: hex3(spendSecret), view_seed: hex3(viewSeed) }, password);
      return new _BrowserTestIdentity(spendSecret, viewSeed, d, asset, backup);
    } finally {
      spendSecret.fill(0);
      viewSeed.fill(0);
    }
  }
  static async fromBackup({ backup, password, domain, assetId }) {
    const d = bytesFromHex(domain, "domain");
    const asset = bytesFromHex(assetId, "assetId");
    const payload = await openVault(backup, password);
    const spendSecret = bytesFromHex(payload.spend_key, "spend_key");
    const viewSeed = bytesFromHex(payload.view_seed, "view_seed");
    try {
      return new _BrowserTestIdentity(spendSecret, viewSeed, d, asset, backup);
    } finally {
      spendSecret.fill(0);
      viewSeed.fill(0);
    }
  }
  #assertOpen() {
    if (this.#spendSecret === null) throw new Error("wallet identity is locked");
  }
  recipient() {
    this.#assertOpen();
    return {
      domain: hex3(this.#domain),
      asset_id: hex3(this.#assetId),
      owner: hex3(deriveOwner(this.#domain, this.#spendSecret)),
      view_pub: hex3(deriveViewPublic(this.#viewSeed))
    };
  }
  /** Return the existing encrypted JSON backup; the plaintext keys never leave this class. */
  backupJson() {
    this.#assertOpen();
    return this.#backup;
  }
  /** Seal a note for a descriptor in this exact pool instance. No transaction is created. */
  createNote(recipient, amountAtomic) {
    this.#assertOpen();
    if (!recipient || typeof recipient !== "object" || !equal2(bytesFromHex(recipient.domain, "recipient domain"), this.#domain) || !equal2(bytesFromHex(recipient.asset_id, "recipient asset"), this.#assetId)) {
      throw new Error("recipient belongs to another pool instance");
    }
    return sealNote({ descriptor: recipient, amountAtomic });
  }
  /** Decrypt a candidate record and verify ownership/commitment, not chain inclusion. */
  openRecord(record, commitment) {
    this.#assertOpen();
    return openNoteRecord({
      record,
      cm: commitment,
      domain: this.#domain,
      assetId: this.#assetId,
      viewSeed: this.#viewSeed,
      spendSecret: this.#spendSecret
    });
  }
  /** Build private circuit inputs locally; call only from the dedicated wallet worker. */
  prepareC4(options) {
    this.#assertOpen();
    if (options.manifest.domain !== hex3(this.#domain) || options.manifest.assetId !== hex3(this.#assetId)) {
      throw new Error("wallet belongs to another pool instance");
    }
    return prepareC4({ ...options, secret: this.#spendSecret });
  }
  #checkpointKey() {
    this.#assertOpen();
    const label2 = new TextEncoder().encode("Neurai/privacy/checkpoint/file/v1");
    const material = new Uint8Array(label2.length + 128);
    material.set(label2);
    material.set(this.#domain, label2.length);
    material.set(this.#assetId, label2.length + 32);
    material.set(this.#spendSecret, label2.length + 64);
    material.set(this.#viewSeed, label2.length + 96);
    try {
      return sha256(material);
    } finally {
      material.fill(0);
    }
  }
  sealCheckpoint(checkpoint) {
    const key = this.#checkpointKey();
    try {
      return sealScanCheckpoint(checkpoint, key);
    } finally {
      key.fill(0);
    }
  }
  openCheckpoint(encoded) {
    const key = this.#checkpointKey();
    try {
      return openScanCheckpoint(encoded, key);
    } finally {
      key.fill(0);
    }
  }
  lock() {
    this.#spendSecret?.fill(0);
    this.#viewSeed?.fill(0);
    this.#spendSecret = null;
    this.#viewSeed = null;
    this.#backup = null;
  }
};

// node_modules/@scure/bip39/node_modules/@noble/hashes/utils.js
function isBytes4(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes4(value, length, title = "") {
  const bytes4 = isBytes4(value);
  const len = value?.length;
  const needsLen = length !== void 0;
  if (!bytes4 || needsLen && len !== length) {
    const prefix = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes4 ? `length=${len}` : `type=${typeof value}`;
    throw new Error(prefix + "expected Uint8Array" + ofLen + ", got " + got);
  }
  return value;
}
function aexists3(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput3(out, instance) {
  abytes4(out, void 0, "digestInto() output");
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error('"digestInto() output" expected to be of length >=' + min);
  }
}
function clean3(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView3(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr2(word, shift) {
  return word << 32 - shift | word >>> shift;
}
function createHasher3(hashCons, info = {}) {
  const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
  const tmp = hashCons(void 0);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (opts) => hashCons(opts);
  Object.assign(hashC, info);
  return Object.freeze(hashC);
}
var oidNist2 = (suffix) => ({
  oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
});

// node_modules/@scure/bip39/node_modules/@noble/hashes/_md.js
function Chi2(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj2(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD2 = class {
  blockLen;
  outputLen;
  padOffset;
  isLE;
  // For partial updates less than block size
  buffer;
  view;
  finished = false;
  length = 0;
  pos = 0;
  destroyed = false;
  constructor(blockLen, outputLen, padOffset, isLE3) {
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE3;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView3(this.buffer);
  }
  update(data) {
    aexists3(this);
    abytes4(data);
    const { view, buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView3(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists3(this);
    aoutput3(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE: isLE3 } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean3(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++)
      buffer[i] = 0;
    view.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE3);
    this.process(view, 0);
    const oview = createView3(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen must be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE3);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to ||= new this.constructor();
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (length % blockLen)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var SHA256_IV2 = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);

// node_modules/@scure/bip39/node_modules/@noble/hashes/sha2.js
var SHA256_K2 = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W2 = /* @__PURE__ */ new Uint32Array(64);
var SHA2_32B2 = class extends HashMD2 {
  constructor(outputLen) {
    super(64, outputLen, 8, false);
  }
  get() {
    const { A, B, C, D, E, F, G: G2, H } = this;
    return [A, B, C, D, E, F, G2, H];
  }
  // prettier-ignore
  set(A, B, C, D, E, F, G2, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G2 | 0;
    this.H = H | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W2[i] = view.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W2[i - 15];
      const W2 = SHA256_W2[i - 2];
      const s0 = rotr2(W15, 7) ^ rotr2(W15, 18) ^ W15 >>> 3;
      const s1 = rotr2(W2, 17) ^ rotr2(W2, 19) ^ W2 >>> 10;
      SHA256_W2[i] = s1 + SHA256_W2[i - 7] + s0 + SHA256_W2[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G: G2, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr2(E, 6) ^ rotr2(E, 11) ^ rotr2(E, 25);
      const T1 = H + sigma1 + Chi2(E, F, G2) + SHA256_K2[i] + SHA256_W2[i] | 0;
      const sigma0 = rotr2(A, 2) ^ rotr2(A, 13) ^ rotr2(A, 22);
      const T2 = sigma0 + Maj2(A, B, C) | 0;
      H = G2;
      G2 = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G2 = G2 + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G2, H);
  }
  roundClean() {
    clean3(SHA256_W2);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean3(this.buffer);
  }
};
var _SHA2562 = class extends SHA2_32B2 {
  // We cannot use array here since array allows indexing by variable
  // which means optimizer/compiler cannot use registers.
  A = SHA256_IV2[0] | 0;
  B = SHA256_IV2[1] | 0;
  C = SHA256_IV2[2] | 0;
  D = SHA256_IV2[3] | 0;
  E = SHA256_IV2[4] | 0;
  F = SHA256_IV2[5] | 0;
  G = SHA256_IV2[6] | 0;
  H = SHA256_IV2[7] | 0;
  constructor() {
    super(32);
  }
};
var sha2562 = /* @__PURE__ */ createHasher3(
  () => new _SHA2562(),
  /* @__PURE__ */ oidNist2(1)
);

// node_modules/@scure/base/index.js
function isBytes5(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function isArrayOf(isString, arr) {
  if (!Array.isArray(arr))
    return false;
  if (arr.length === 0)
    return true;
  if (isString) {
    return arr.every((item) => typeof item === "string");
  } else {
    return arr.every((item) => Number.isSafeInteger(item));
  }
}
function afn(input) {
  if (typeof input !== "function")
    throw new Error("function expected");
  return true;
}
function astr(label2, input) {
  if (typeof input !== "string")
    throw new Error(`${label2}: string expected`);
  return true;
}
function anumber4(n) {
  if (!Number.isSafeInteger(n))
    throw new Error(`invalid integer: ${n}`);
}
function aArr(input) {
  if (!Array.isArray(input))
    throw new Error("array expected");
}
function astrArr(label2, input) {
  if (!isArrayOf(true, input))
    throw new Error(`${label2}: array of strings expected`);
}
function anumArr(label2, input) {
  if (!isArrayOf(false, input))
    throw new Error(`${label2}: array of numbers expected`);
}
// @__NO_SIDE_EFFECTS__
function chain(...args) {
  const id = (a) => a;
  const wrap = (a, b) => (c) => a(b(c));
  const encode = args.map((x) => x.encode).reduceRight(wrap, id);
  const decode = args.map((x) => x.decode).reduce(wrap, id);
  return { encode, decode };
}
// @__NO_SIDE_EFFECTS__
function alphabet(letters) {
  const lettersA = typeof letters === "string" ? letters.split("") : letters;
  const len = lettersA.length;
  astrArr("alphabet", lettersA);
  const indexes = new Map(lettersA.map((l, i) => [l, i]));
  return {
    encode: (digits) => {
      aArr(digits);
      return digits.map((i) => {
        if (!Number.isSafeInteger(i) || i < 0 || i >= len)
          throw new Error(`alphabet.encode: digit index outside alphabet "${i}". Allowed: ${letters}`);
        return lettersA[i];
      });
    },
    decode: (input) => {
      aArr(input);
      return input.map((letter) => {
        astr("alphabet.decode", letter);
        const i = indexes.get(letter);
        if (i === void 0)
          throw new Error(`Unknown letter: "${letter}". Allowed: ${letters}`);
        return i;
      });
    }
  };
}
// @__NO_SIDE_EFFECTS__
function join4(separator = "") {
  astr("join", separator);
  return {
    encode: (from) => {
      astrArr("join.decode", from);
      return from.join(separator);
    },
    decode: (to) => {
      astr("join.decode", to);
      return to.split(separator);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function padding(bits, chr = "=") {
  anumber4(bits);
  astr("padding", chr);
  return {
    encode(data) {
      astrArr("padding.encode", data);
      while (data.length * bits % 8)
        data.push(chr);
      return data;
    },
    decode(input) {
      astrArr("padding.decode", input);
      let end = input.length;
      if (end * bits % 8)
        throw new Error("padding: invalid, string should have whole number of bytes");
      for (; end > 0 && input[end - 1] === chr; end--) {
        const last = end - 1;
        const byte = last * bits;
        if (byte % 8 === 0)
          throw new Error("padding: invalid, string has too much padding");
      }
      return input.slice(0, end);
    }
  };
}
function convertRadix(data, from, to) {
  if (from < 2)
    throw new Error(`convertRadix: invalid from=${from}, base cannot be less than 2`);
  if (to < 2)
    throw new Error(`convertRadix: invalid to=${to}, base cannot be less than 2`);
  aArr(data);
  if (!data.length)
    return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data, (d) => {
    anumber4(d);
    if (d < 0 || d >= from)
      throw new Error(`invalid integer: ${d}`);
    return d;
  });
  const dlen = digits.length;
  while (true) {
    let carry = 0;
    let done = true;
    for (let i = pos; i < dlen; i++) {
      const digit = digits[i];
      const fromCarry = from * carry;
      const digitBase = fromCarry + digit;
      if (!Number.isSafeInteger(digitBase) || fromCarry / from !== carry || digitBase - digit !== fromCarry) {
        throw new Error("convertRadix: carry overflow");
      }
      const div = digitBase / to;
      carry = digitBase % to;
      const rounded = Math.floor(div);
      digits[i] = rounded;
      if (!Number.isSafeInteger(rounded) || rounded * to + carry !== digitBase)
        throw new Error("convertRadix: carry overflow");
      if (!done)
        continue;
      else if (!rounded)
        pos = i;
      else
        done = false;
    }
    res.push(carry);
    if (done)
      break;
  }
  for (let i = 0; i < data.length - 1 && data[i] === 0; i++)
    res.push(0);
  return res.reverse();
}
var gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
var radix2carry = /* @__NO_SIDE_EFFECTS__ */ (from, to) => from + (to - gcd(from, to));
var powers = /* @__PURE__ */ (() => {
  let res = [];
  for (let i = 0; i < 40; i++)
    res.push(2 ** i);
  return res;
})();
function convertRadix2(data, from, to, padding2) {
  aArr(data);
  if (from <= 0 || from > 32)
    throw new Error(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32)
    throw new Error(`convertRadix2: wrong to=${to}`);
  if (/* @__PURE__ */ radix2carry(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${/* @__PURE__ */ radix2carry(from, to)}`);
  }
  let carry = 0;
  let pos = 0;
  const max = powers[from];
  const mask2 = powers[to] - 1;
  const res = [];
  for (const n of data) {
    anumber4(n);
    if (n >= max)
      throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32)
      throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;
    for (; pos >= to; pos -= to)
      res.push((carry >> pos - to & mask2) >>> 0);
    const pow = powers[pos];
    if (pow === void 0)
      throw new Error("invalid carry");
    carry &= pow - 1;
  }
  carry = carry << to - pos & mask2;
  if (!padding2 && pos >= from)
    throw new Error("Excess padding");
  if (!padding2 && carry > 0)
    throw new Error(`Non-zero padding: ${carry}`);
  if (padding2 && pos > 0)
    res.push(carry >>> 0);
  return res;
}
// @__NO_SIDE_EFFECTS__
function radix(num) {
  anumber4(num);
  const _256 = 2 ** 8;
  return {
    encode: (bytes4) => {
      if (!isBytes5(bytes4))
        throw new Error("radix.encode input should be Uint8Array");
      return convertRadix(Array.from(bytes4), _256, num);
    },
    decode: (digits) => {
      anumArr("radix.decode", digits);
      return Uint8Array.from(convertRadix(digits, num, _256));
    }
  };
}
// @__NO_SIDE_EFFECTS__
function radix2(bits, revPadding = false) {
  anumber4(bits);
  if (bits <= 0 || bits > 32)
    throw new Error("radix2: bits should be in (0..32]");
  if (/* @__PURE__ */ radix2carry(8, bits) > 32 || /* @__PURE__ */ radix2carry(bits, 8) > 32)
    throw new Error("radix2: carry overflow");
  return {
    encode: (bytes4) => {
      if (!isBytes5(bytes4))
        throw new Error("radix2.encode input should be Uint8Array");
      return convertRadix2(Array.from(bytes4), 8, bits, !revPadding);
    },
    decode: (digits) => {
      anumArr("radix2.decode", digits);
      return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
    }
  };
}
function checksum(len, fn) {
  anumber4(len);
  afn(fn);
  return {
    encode(data) {
      if (!isBytes5(data))
        throw new Error("checksum.encode: input should be Uint8Array");
      const sum = fn(data).slice(0, len);
      const res = new Uint8Array(data.length + len);
      res.set(data);
      res.set(sum, data.length);
      return res;
    },
    decode(data) {
      if (!isBytes5(data))
        throw new Error("checksum.decode: input should be Uint8Array");
      const payload = data.slice(0, -len);
      const oldChecksum = data.slice(-len);
      const newChecksum = fn(payload).slice(0, len);
      for (let i = 0; i < len; i++)
        if (newChecksum[i] !== oldChecksum[i])
          throw new Error("Invalid checksum");
      return payload;
    }
  };
}
var utils = {
  alphabet,
  chain,
  checksum,
  convertRadix,
  convertRadix2,
  radix,
  radix2,
  join: join4,
  padding
};

// node_modules/@scure/bip39/index.js
function nfkd(str) {
  if (typeof str !== "string")
    throw new TypeError("invalid mnemonic type: " + typeof str);
  return str.normalize("NFKD");
}
function normalize(str) {
  const norm = nfkd(str);
  const words = norm.split(" ");
  if (![12, 15, 18, 21, 24].includes(words.length))
    throw new Error("Invalid mnemonic");
  return { nfkd: norm, words };
}
function aentropy(ent) {
  abytes4(ent);
  if (![16, 20, 24, 28, 32].includes(ent.length))
    throw new Error("invalid entropy length");
}
var calcChecksum = (entropy) => {
  const bitsLeft = 8 - entropy.length / 4;
  return new Uint8Array([sha2562(entropy)[0] >> bitsLeft << bitsLeft]);
};
function getCoder(wordlist2) {
  if (!Array.isArray(wordlist2) || wordlist2.length !== 2048 || typeof wordlist2[0] !== "string")
    throw new Error("Wordlist: expected array of 2048 strings");
  wordlist2.forEach((i) => {
    if (typeof i !== "string")
      throw new Error("wordlist: non-string element: " + i);
  });
  return utils.chain(utils.checksum(1, calcChecksum), utils.radix2(11, true), utils.alphabet(wordlist2));
}
function mnemonicToEntropy(mnemonic, wordlist2) {
  const { words } = normalize(mnemonic);
  const entropy = getCoder(wordlist2).decode(words);
  aentropy(entropy);
  return entropy;
}
function validateMnemonic(mnemonic, wordlist2) {
  try {
    mnemonicToEntropy(mnemonic, wordlist2);
  } catch (e) {
    return false;
  }
  return true;
}

// node_modules/@scure/bip39/wordlists/english.js
var wordlist = `abandon
ability
able
about
above
absent
absorb
abstract
absurd
abuse
access
accident
account
accuse
achieve
acid
acoustic
acquire
across
act
action
actor
actress
actual
adapt
add
addict
address
adjust
admit
adult
advance
advice
aerobic
affair
afford
afraid
again
age
agent
agree
ahead
aim
air
airport
aisle
alarm
album
alcohol
alert
alien
all
alley
allow
almost
alone
alpha
already
also
alter
always
amateur
amazing
among
amount
amused
analyst
anchor
ancient
anger
angle
angry
animal
ankle
announce
annual
another
answer
antenna
antique
anxiety
any
apart
apology
appear
apple
approve
april
arch
arctic
area
arena
argue
arm
armed
armor
army
around
arrange
arrest
arrive
arrow
art
artefact
artist
artwork
ask
aspect
assault
asset
assist
assume
asthma
athlete
atom
attack
attend
attitude
attract
auction
audit
august
aunt
author
auto
autumn
average
avocado
avoid
awake
aware
away
awesome
awful
awkward
axis
baby
bachelor
bacon
badge
bag
balance
balcony
ball
bamboo
banana
banner
bar
barely
bargain
barrel
base
basic
basket
battle
beach
bean
beauty
because
become
beef
before
begin
behave
behind
believe
below
belt
bench
benefit
best
betray
better
between
beyond
bicycle
bid
bike
bind
biology
bird
birth
bitter
black
blade
blame
blanket
blast
bleak
bless
blind
blood
blossom
blouse
blue
blur
blush
board
boat
body
boil
bomb
bone
bonus
book
boost
border
boring
borrow
boss
bottom
bounce
box
boy
bracket
brain
brand
brass
brave
bread
breeze
brick
bridge
brief
bright
bring
brisk
broccoli
broken
bronze
broom
brother
brown
brush
bubble
buddy
budget
buffalo
build
bulb
bulk
bullet
bundle
bunker
burden
burger
burst
bus
business
busy
butter
buyer
buzz
cabbage
cabin
cable
cactus
cage
cake
call
calm
camera
camp
can
canal
cancel
candy
cannon
canoe
canvas
canyon
capable
capital
captain
car
carbon
card
cargo
carpet
carry
cart
case
cash
casino
castle
casual
cat
catalog
catch
category
cattle
caught
cause
caution
cave
ceiling
celery
cement
census
century
cereal
certain
chair
chalk
champion
change
chaos
chapter
charge
chase
chat
cheap
check
cheese
chef
cherry
chest
chicken
chief
child
chimney
choice
choose
chronic
chuckle
chunk
churn
cigar
cinnamon
circle
citizen
city
civil
claim
clap
clarify
claw
clay
clean
clerk
clever
click
client
cliff
climb
clinic
clip
clock
clog
close
cloth
cloud
clown
club
clump
cluster
clutch
coach
coast
coconut
code
coffee
coil
coin
collect
color
column
combine
come
comfort
comic
common
company
concert
conduct
confirm
congress
connect
consider
control
convince
cook
cool
copper
copy
coral
core
corn
correct
cost
cotton
couch
country
couple
course
cousin
cover
coyote
crack
cradle
craft
cram
crane
crash
crater
crawl
crazy
cream
credit
creek
crew
cricket
crime
crisp
critic
crop
cross
crouch
crowd
crucial
cruel
cruise
crumble
crunch
crush
cry
crystal
cube
culture
cup
cupboard
curious
current
curtain
curve
cushion
custom
cute
cycle
dad
damage
damp
dance
danger
daring
dash
daughter
dawn
day
deal
debate
debris
decade
december
decide
decline
decorate
decrease
deer
defense
define
defy
degree
delay
deliver
demand
demise
denial
dentist
deny
depart
depend
deposit
depth
deputy
derive
describe
desert
design
desk
despair
destroy
detail
detect
develop
device
devote
diagram
dial
diamond
diary
dice
diesel
diet
differ
digital
dignity
dilemma
dinner
dinosaur
direct
dirt
disagree
discover
disease
dish
dismiss
disorder
display
distance
divert
divide
divorce
dizzy
doctor
document
dog
doll
dolphin
domain
donate
donkey
donor
door
dose
double
dove
draft
dragon
drama
drastic
draw
dream
dress
drift
drill
drink
drip
drive
drop
drum
dry
duck
dumb
dune
during
dust
dutch
duty
dwarf
dynamic
eager
eagle
early
earn
earth
easily
east
easy
echo
ecology
economy
edge
edit
educate
effort
egg
eight
either
elbow
elder
electric
elegant
element
elephant
elevator
elite
else
embark
embody
embrace
emerge
emotion
employ
empower
empty
enable
enact
end
endless
endorse
enemy
energy
enforce
engage
engine
enhance
enjoy
enlist
enough
enrich
enroll
ensure
enter
entire
entry
envelope
episode
equal
equip
era
erase
erode
erosion
error
erupt
escape
essay
essence
estate
eternal
ethics
evidence
evil
evoke
evolve
exact
example
excess
exchange
excite
exclude
excuse
execute
exercise
exhaust
exhibit
exile
exist
exit
exotic
expand
expect
expire
explain
expose
express
extend
extra
eye
eyebrow
fabric
face
faculty
fade
faint
faith
fall
false
fame
family
famous
fan
fancy
fantasy
farm
fashion
fat
fatal
father
fatigue
fault
favorite
feature
february
federal
fee
feed
feel
female
fence
festival
fetch
fever
few
fiber
fiction
field
figure
file
film
filter
final
find
fine
finger
finish
fire
firm
first
fiscal
fish
fit
fitness
fix
flag
flame
flash
flat
flavor
flee
flight
flip
float
flock
floor
flower
fluid
flush
fly
foam
focus
fog
foil
fold
follow
food
foot
force
forest
forget
fork
fortune
forum
forward
fossil
foster
found
fox
fragile
frame
frequent
fresh
friend
fringe
frog
front
frost
frown
frozen
fruit
fuel
fun
funny
furnace
fury
future
gadget
gain
galaxy
gallery
game
gap
garage
garbage
garden
garlic
garment
gas
gasp
gate
gather
gauge
gaze
general
genius
genre
gentle
genuine
gesture
ghost
giant
gift
giggle
ginger
giraffe
girl
give
glad
glance
glare
glass
glide
glimpse
globe
gloom
glory
glove
glow
glue
goat
goddess
gold
good
goose
gorilla
gospel
gossip
govern
gown
grab
grace
grain
grant
grape
grass
gravity
great
green
grid
grief
grit
grocery
group
grow
grunt
guard
guess
guide
guilt
guitar
gun
gym
habit
hair
half
hammer
hamster
hand
happy
harbor
hard
harsh
harvest
hat
have
hawk
hazard
head
health
heart
heavy
hedgehog
height
hello
helmet
help
hen
hero
hidden
high
hill
hint
hip
hire
history
hobby
hockey
hold
hole
holiday
hollow
home
honey
hood
hope
horn
horror
horse
hospital
host
hotel
hour
hover
hub
huge
human
humble
humor
hundred
hungry
hunt
hurdle
hurry
hurt
husband
hybrid
ice
icon
idea
identify
idle
ignore
ill
illegal
illness
image
imitate
immense
immune
impact
impose
improve
impulse
inch
include
income
increase
index
indicate
indoor
industry
infant
inflict
inform
inhale
inherit
initial
inject
injury
inmate
inner
innocent
input
inquiry
insane
insect
inside
inspire
install
intact
interest
into
invest
invite
involve
iron
island
isolate
issue
item
ivory
jacket
jaguar
jar
jazz
jealous
jeans
jelly
jewel
job
join
joke
journey
joy
judge
juice
jump
jungle
junior
junk
just
kangaroo
keen
keep
ketchup
key
kick
kid
kidney
kind
kingdom
kiss
kit
kitchen
kite
kitten
kiwi
knee
knife
knock
know
lab
label
labor
ladder
lady
lake
lamp
language
laptop
large
later
latin
laugh
laundry
lava
law
lawn
lawsuit
layer
lazy
leader
leaf
learn
leave
lecture
left
leg
legal
legend
leisure
lemon
lend
length
lens
leopard
lesson
letter
level
liar
liberty
library
license
life
lift
light
like
limb
limit
link
lion
liquid
list
little
live
lizard
load
loan
lobster
local
lock
logic
lonely
long
loop
lottery
loud
lounge
love
loyal
lucky
luggage
lumber
lunar
lunch
luxury
lyrics
machine
mad
magic
magnet
maid
mail
main
major
make
mammal
man
manage
mandate
mango
mansion
manual
maple
marble
march
margin
marine
market
marriage
mask
mass
master
match
material
math
matrix
matter
maximum
maze
meadow
mean
measure
meat
mechanic
medal
media
melody
melt
member
memory
mention
menu
mercy
merge
merit
merry
mesh
message
metal
method
middle
midnight
milk
million
mimic
mind
minimum
minor
minute
miracle
mirror
misery
miss
mistake
mix
mixed
mixture
mobile
model
modify
mom
moment
monitor
monkey
monster
month
moon
moral
more
morning
mosquito
mother
motion
motor
mountain
mouse
move
movie
much
muffin
mule
multiply
muscle
museum
mushroom
music
must
mutual
myself
mystery
myth
naive
name
napkin
narrow
nasty
nation
nature
near
neck
need
negative
neglect
neither
nephew
nerve
nest
net
network
neutral
never
news
next
nice
night
noble
noise
nominee
noodle
normal
north
nose
notable
note
nothing
notice
novel
now
nuclear
number
nurse
nut
oak
obey
object
oblige
obscure
observe
obtain
obvious
occur
ocean
october
odor
off
offer
office
often
oil
okay
old
olive
olympic
omit
once
one
onion
online
only
open
opera
opinion
oppose
option
orange
orbit
orchard
order
ordinary
organ
orient
original
orphan
ostrich
other
outdoor
outer
output
outside
oval
oven
over
own
owner
oxygen
oyster
ozone
pact
paddle
page
pair
palace
palm
panda
panel
panic
panther
paper
parade
parent
park
parrot
party
pass
patch
path
patient
patrol
pattern
pause
pave
payment
peace
peanut
pear
peasant
pelican
pen
penalty
pencil
people
pepper
perfect
permit
person
pet
phone
photo
phrase
physical
piano
picnic
picture
piece
pig
pigeon
pill
pilot
pink
pioneer
pipe
pistol
pitch
pizza
place
planet
plastic
plate
play
please
pledge
pluck
plug
plunge
poem
poet
point
polar
pole
police
pond
pony
pool
popular
portion
position
possible
post
potato
pottery
poverty
powder
power
practice
praise
predict
prefer
prepare
present
pretty
prevent
price
pride
primary
print
priority
prison
private
prize
problem
process
produce
profit
program
project
promote
proof
property
prosper
protect
proud
provide
public
pudding
pull
pulp
pulse
pumpkin
punch
pupil
puppy
purchase
purity
purpose
purse
push
put
puzzle
pyramid
quality
quantum
quarter
question
quick
quit
quiz
quote
rabbit
raccoon
race
rack
radar
radio
rail
rain
raise
rally
ramp
ranch
random
range
rapid
rare
rate
rather
raven
raw
razor
ready
real
reason
rebel
rebuild
recall
receive
recipe
record
recycle
reduce
reflect
reform
refuse
region
regret
regular
reject
relax
release
relief
rely
remain
remember
remind
remove
render
renew
rent
reopen
repair
repeat
replace
report
require
rescue
resemble
resist
resource
response
result
retire
retreat
return
reunion
reveal
review
reward
rhythm
rib
ribbon
rice
rich
ride
ridge
rifle
right
rigid
ring
riot
ripple
risk
ritual
rival
river
road
roast
robot
robust
rocket
romance
roof
rookie
room
rose
rotate
rough
round
route
royal
rubber
rude
rug
rule
run
runway
rural
sad
saddle
sadness
safe
sail
salad
salmon
salon
salt
salute
same
sample
sand
satisfy
satoshi
sauce
sausage
save
say
scale
scan
scare
scatter
scene
scheme
school
science
scissors
scorpion
scout
scrap
screen
script
scrub
sea
search
season
seat
second
secret
section
security
seed
seek
segment
select
sell
seminar
senior
sense
sentence
series
service
session
settle
setup
seven
shadow
shaft
shallow
share
shed
shell
sheriff
shield
shift
shine
ship
shiver
shock
shoe
shoot
shop
short
shoulder
shove
shrimp
shrug
shuffle
shy
sibling
sick
side
siege
sight
sign
silent
silk
silly
silver
similar
simple
since
sing
siren
sister
situate
six
size
skate
sketch
ski
skill
skin
skirt
skull
slab
slam
sleep
slender
slice
slide
slight
slim
slogan
slot
slow
slush
small
smart
smile
smoke
smooth
snack
snake
snap
sniff
snow
soap
soccer
social
sock
soda
soft
solar
soldier
solid
solution
solve
someone
song
soon
sorry
sort
soul
sound
soup
source
south
space
spare
spatial
spawn
speak
special
speed
spell
spend
sphere
spice
spider
spike
spin
spirit
split
spoil
sponsor
spoon
sport
spot
spray
spread
spring
spy
square
squeeze
squirrel
stable
stadium
staff
stage
stairs
stamp
stand
start
state
stay
steak
steel
stem
step
stereo
stick
still
sting
stock
stomach
stone
stool
story
stove
strategy
street
strike
strong
struggle
student
stuff
stumble
style
subject
submit
subway
success
such
sudden
suffer
sugar
suggest
suit
summer
sun
sunny
sunset
super
supply
supreme
sure
surface
surge
surprise
surround
survey
suspect
sustain
swallow
swamp
swap
swarm
swear
sweet
swift
swim
swing
switch
sword
symbol
symptom
syrup
system
table
tackle
tag
tail
talent
talk
tank
tape
target
task
taste
tattoo
taxi
teach
team
tell
ten
tenant
tennis
tent
term
test
text
thank
that
theme
then
theory
there
they
thing
this
thought
three
thrive
throw
thumb
thunder
ticket
tide
tiger
tilt
timber
time
tiny
tip
tired
tissue
title
toast
tobacco
today
toddler
toe
together
toilet
token
tomato
tomorrow
tone
tongue
tonight
tool
tooth
top
topic
topple
torch
tornado
tortoise
toss
total
tourist
toward
tower
town
toy
track
trade
traffic
tragic
train
transfer
trap
trash
travel
tray
treat
tree
trend
trial
tribe
trick
trigger
trim
trip
trophy
trouble
truck
true
truly
trumpet
trust
truth
try
tube
tuition
tumble
tuna
tunnel
turkey
turn
turtle
twelve
twenty
twice
twin
twist
two
type
typical
ugly
umbrella
unable
unaware
uncle
uncover
under
undo
unfair
unfold
unhappy
uniform
unique
unit
universe
unknown
unlock
until
unusual
unveil
update
upgrade
uphold
upon
upper
upset
urban
urge
usage
use
used
useful
useless
usual
utility
vacant
vacuum
vague
valid
valley
valve
van
vanish
vapor
various
vast
vault
vehicle
velvet
vendor
venture
venue
verb
verify
version
very
vessel
veteran
viable
vibrant
vicious
victory
video
view
village
vintage
violin
virtual
virus
visa
visit
visual
vital
vivid
vocal
voice
void
volcano
volume
vote
voyage
wage
wagon
wait
walk
wall
walnut
want
warfare
warm
warrior
wash
wasp
waste
water
wave
way
wealth
weapon
wear
weasel
weather
web
wedding
weekend
weird
welcome
west
wet
whale
what
wheat
wheel
when
where
whip
whisper
wide
width
wife
wild
will
win
window
wine
wing
wink
winner
winter
wire
wisdom
wise
wish
witness
wolf
woman
wonder
wood
wool
word
work
world
worry
worth
wrap
wreck
wrestle
wrist
write
wrong
yard
year
yellow
you
young
youth
zebra
zero
zone
zoo`.split("\n");

// node_modules/@noble/hashes/hkdf.js
function extract(hash, ikm, salt) {
  ahash(hash);
  if (salt === void 0)
    salt = new Uint8Array(hash.outputLen);
  return hmac(hash, salt, ikm);
}
var HKDF_COUNTER = /* @__PURE__ */ Uint8Array.of(0);
var EMPTY_BUFFER = /* @__PURE__ */ Uint8Array.of();
function expand(hash, prk, info, length = 32) {
  ahash(hash);
  anumber(length, "length");
  abytes(prk, void 0, "prk");
  const olen = hash.outputLen;
  if (prk.length < olen)
    throw new Error('"prk" must be at least HashLen octets');
  if (length > 255 * olen)
    throw new Error("Length must be <= 255*HashLen");
  const blocks = Math.ceil(length / olen);
  if (info === void 0)
    info = EMPTY_BUFFER;
  else
    abytes(info, void 0, "info");
  const okm = new Uint8Array(blocks * olen);
  const HMAC = hmac.create(hash, prk);
  const HMACTmp = HMAC._cloneInto();
  const T = new Uint8Array(HMAC.outputLen);
  for (let counter = 0; counter < blocks; counter++) {
    HKDF_COUNTER[0] = counter + 1;
    HMACTmp.update(counter === 0 ? EMPTY_BUFFER : T).update(info).update(HKDF_COUNTER).digestInto(T);
    okm.set(T, olen * counter);
    HMAC._cloneInto(HMACTmp);
  }
  HMAC.destroy();
  HMACTmp.destroy();
  clean(T, HKDF_COUNTER);
  return okm.slice(0, length);
}

// node_modules/@noble/hashes/pbkdf2.js
function pbkdf2Init(hash, _password, _salt, _opts) {
  ahash(hash);
  const opts = checkOpts({ dkLen: 32, asyncTick: 10 }, _opts);
  const { c, dkLen, asyncTick } = opts;
  anumber(c, "c");
  anumber(dkLen, "dkLen");
  anumber(asyncTick, "asyncTick");
  if (c < 1)
    throw new Error("iterations (c) must be >= 1");
  if (dkLen < 1)
    throw new Error('"dkLen" must be >= 1');
  if (dkLen > (2 ** 32 - 1) * hash.outputLen)
    throw new Error("derived key too long");
  const password = kdfInputToBytes(_password, "password");
  const salt = kdfInputToBytes(_salt, "salt");
  const DK = new Uint8Array(dkLen);
  const PRF = hmac.create(hash, password);
  const PRFSalt = PRF._cloneInto().update(salt);
  return { c, dkLen, asyncTick, DK, PRF, PRFSalt };
}
function pbkdf2Output(PRF, PRFSalt, DK, prfW, u) {
  PRF.destroy();
  PRFSalt.destroy();
  if (prfW)
    prfW.destroy();
  clean(u);
  return DK;
}
async function pbkdf2Async(hash, password, salt, opts) {
  const { c, dkLen, asyncTick, DK, PRF, PRFSalt } = pbkdf2Init(hash, password, salt, opts);
  let prfW;
  const arr = new Uint8Array(4);
  const view = createView(arr);
  const u = new Uint8Array(PRF.outputLen);
  for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += PRF.outputLen) {
    const Ti = DK.subarray(pos, pos + PRF.outputLen);
    view.setInt32(0, ti, false);
    (prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
    Ti.set(u.subarray(0, Ti.length));
    await asyncLoop(c - 1, asyncTick, () => {
      PRF._cloneInto(prfW).update(u).digestInto(u);
      for (let i = 0; i < Ti.length; i++)
        Ti[i] ^= u[i];
    });
  }
  return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
}

// src/zk-wallet.js
var utf85 = new TextEncoder();
var label = (name) => utf85.encode("NeuraiZK/v2/" + name);
var NZK_DERIVATION = "NeuraiZK/v2";
var NZK_FAMILIES = Object.freeze({ legacy: 0, ecdsa: 1, pq: 2 });
function familyByte(family) {
  if (!Object.hasOwn(NZK_FAMILIES, family)) fail("family must be legacy, ecdsa or pq");
  return Uint8Array.of(NZK_FAMILIES[family]);
}
function accountScope({ family, account = 0, domain, assetId }) {
  return concat5(familyByte(family), u32le(index31(account, "account")), bytes324(domain, "domain"), bytes324(assetId, "assetId"));
}
var NZK_ARGON2ID = Object.freeze({ t: 3, m: 64 * 1024, p: 1, dkLen: 64 });
var NZK_HRP = Object.freeze({ mainnet: "nzk", testnet: "tnzk", regtest: "rnzk" });
var NZK_DEFAULT_GAP = 20;
var NZK_MAX_GAP = 1e3;
var CHAIN_RECEIVING = 0;
var CHAIN_CHANGE = 1;
var MAX_INDEX2 = 2 ** 31;
var PAYLOAD_BYTES = 69;
var FR = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001n;
var P255192 = 2n ** 255n - 19n;
var SMALL_ORDER_U = /* @__PURE__ */ new Set([
  0n,
  1n,
  P255192 - 1n,
  0x00b8495f16056286fdb1329ceb8d09da6ac49ff1fae35616aeb8413b7c7aebe0n,
  0x57119fd0dd4e22d8868e1c58c45c44045bef839c55b1d0b1248c50a3bc959c5fn
]);
function fail(reason) {
  throw new Error("nzk: " + reason);
}
function concat5(...parts) {
  const out = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}
function u32le(value) {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, true);
  return out;
}
function hex4(bytes4) {
  return Array.from(bytes4, (b) => b.toString(16).padStart(2, "0")).join("");
}
function bytes324(value, name) {
  if (value instanceof Uint8Array && value.length === 32) return value;
  if (typeof value === "string" && /^[0-9a-f]{64}$/i.test(value)) return Uint8Array.from(value.match(/../g), (b) => parseInt(b, 16));
  return fail(name + " must be 32 bytes");
}
function beInt(bytes4) {
  return BigInt("0x" + (hex4(bytes4) || "0"));
}
function leInt(bytes4) {
  return beInt(Uint8Array.from(bytes4).reverse());
}
function index31(value, name) {
  if (!Number.isInteger(value) || value < 0 || value >= MAX_INDEX2) fail(name + " must be an integer in [0, 2^31)");
  return value;
}
function hrpFor(network) {
  const hrp = NZK_HRP[network];
  if (!hrp) fail("unknown network");
  return hrp;
}
var CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
var BECH32M_CONST = 734539939;
function polymod(values) {
  const gen = [996825010, 642813549, 513874426, 1027748829, 705979059];
  let chk = 1;
  for (const v of values) {
    const top = chk >>> 25;
    chk = (chk & 33554431) << 5 ^ v;
    for (let i = 0; i < 5; i++) if (top >>> i & 1) chk ^= gen[i];
  }
  return chk >>> 0;
}
function expandHrp(hrp) {
  const codes = Array.from(hrp, (c) => c.charCodeAt(0));
  return [...codes.map((c) => c >> 5), 0, ...codes.map((c) => c & 31)];
}
function convertBits(data, from, to, pad) {
  let acc = 0, bits = 0;
  const out = [], max = (1 << to) - 1;
  for (const value of data) {
    acc = (acc << from | value) & 16777215;
    bits += from;
    while (bits >= to) {
      bits -= to;
      out.push(acc >> bits & max);
    }
  }
  if (pad) {
    if (bits) out.push(acc << to - bits & max);
  } else if (bits >= from || acc << to - bits & max) fail("invalid bit padding");
  return out;
}
function bech32mEncode(hrp, bytes4) {
  if (!/^[a-z]{1,83}$/.test(hrp)) fail("invalid HRP");
  const data = convertBits(bytes4, 8, 5, true);
  const mod2 = polymod([...expandHrp(hrp), ...data, 0, 0, 0, 0, 0, 0]) ^ BECH32M_CONST;
  const checksum2 = [0, 1, 2, 3, 4, 5].map((i) => mod2 >>> 5 * (5 - i) & 31);
  return hrp + "1" + [...data, ...checksum2].map((v) => CHARSET[v]).join("");
}
function bech32mDecode(text2) {
  if (typeof text2 !== "string" || text2.length > 1023) fail("address must be a string");
  if (text2 !== text2.toLowerCase() && text2 !== text2.toUpperCase()) fail("mixed-case address");
  const s = text2.toLowerCase();
  const sep = s.lastIndexOf("1");
  if (sep < 1 || s.length - sep - 1 < 6) fail("malformed address");
  const hrp = s.slice(0, sep);
  const data = Array.from(s.slice(sep + 1), (c) => {
    const v = CHARSET.indexOf(c);
    if (v < 0) fail("invalid address character");
    return v;
  });
  if (polymod([...expandHrp(hrp), ...data]) !== BECH32M_CONST) fail("invalid bech32m checksum");
  return { hrp, bytes: Uint8Array.from(convertBits(data.slice(0, -6), 5, 8, false)) };
}
async function walletSeedFromMnemonic(mnemonic, passphrase = "") {
  if (typeof mnemonic !== "string" || !mnemonic.trim()) fail("mnemonic required");
  if (typeof passphrase !== "string") fail("passphrase must be a string");
  const canonical2 = mnemonic.normalize("NFKD").trim().split(/\s+/u).join(" ");
  if (!validateMnemonic(canonical2, wordlist)) fail("invalid English BIP39 mnemonic");
  return pbkdf2Async(
    sha512,
    utf85.encode(canonical2),
    utf85.encode("mnemonic" + passphrase.normalize("NFKD")),
    { c: 2048, dkLen: 64 }
  );
}
async function deriveZkRoot(seed, zkPassphrase = "") {
  if (!(seed instanceof Uint8Array) || seed.length !== 64) fail("wallet seed must be 64 bytes");
  if (typeof zkPassphrase !== "string") fail("ZK passphrase must be a string");
  const z = utf85.encode(zkPassphrase.normalize("NFKD"));
  if (z.length > 4294967295) fail("ZK passphrase is too long");
  const password = concat5(seed, u32le(z.length), z);
  try {
    return await argon2idAsync(password, label("root"), { ...NZK_ARGON2ID, version: 19, maxmem: NZK_ARGON2ID.m * 1024 });
  } finally {
    password.fill(0);
    z.fill(0);
  }
}
function accountPrk(root) {
  if (!(root instanceof Uint8Array) || root.length !== 64) fail("ZK root must be 64 bytes");
  return extract(sha256, root, label("account"));
}
function fingerprintFromPrk(prk, options) {
  return hex4(sha256(expand(sha256, prk, concat5(label("fingerprint"), accountScope(options)), 32)).subarray(0, 4));
}
function zkFingerprint(root, options) {
  const prk = accountPrk(root);
  try {
    return fingerprintFromPrk(prk, options);
  } finally {
    prk.fill(0);
  }
}
function keysFromPrk(prk, { family, account = 0, chain: chain2, index, domain, assetId }) {
  index31(account, "account");
  index31(index, "address index");
  if (chain2 !== CHAIN_RECEIVING && chain2 !== CHAIN_CHANGE) fail("chain must be 0 (receiving) or 1 (change)");
  const scope = concat5(familyByte(family), u32le(account), u32le(chain2), u32le(index), bytes324(domain, "domain"), bytes324(assetId, "assetId"));
  const spendSecret = expand(sha256, prk, concat5(label("spend"), scope), 32);
  const viewSeed = expand(sha256, prk, concat5(label("view"), scope), 32);
  if (spendSecret.every((b) => b === 0)) fail("invalid derived spend secret");
  return { spendSecret, viewSeed };
}
function deriveZkAddressKeys(root, options) {
  const prk = accountPrk(root);
  try {
    return keysFromPrk(prk, options);
  } finally {
    prk.fill(0);
  }
}
function nzkInstanceTag(domain, assetId) {
  return sha256(concat5(utf85.encode("NeuraiZK/v1/instance"), bytes324(domain, "domain"), bytes324(assetId, "assetId"))).subarray(0, 4);
}
function encodeNzkAddress(descriptor2, network) {
  if (!descriptor2 || typeof descriptor2 !== "object") fail("descriptor required");
  const owner = bytes324(descriptor2.owner, "owner");
  const viewPub = bytes324(descriptor2.view_pub, "view_pub");
  checkOwner(owner);
  checkViewPublic(viewPub);
  const payload = concat5(Uint8Array.of(1), owner, viewPub, nzkInstanceTag(descriptor2.domain, descriptor2.asset_id));
  return bech32mEncode(hrpFor(network), payload);
}
function checkOwner(owner) {
  const value = beInt(owner);
  if (value === 0n || value >= FR) fail("owner is not a canonical non-zero field element");
}
function checkViewPublic(viewPub) {
  const u = leInt(viewPub);
  if (u >= P255192) fail("view key is not a canonical X25519 coordinate");
  if (SMALL_ORDER_U.has(u)) fail("view key has small order");
}
function decodeNzkAddress(address, { network, domain, assetId }) {
  const { hrp, bytes: bytes4 } = bech32mDecode(address);
  if (hrp !== hrpFor(network)) fail("address belongs to another network");
  if (bytes4.length !== PAYLOAD_BYTES) fail("invalid address length");
  if (bytes4[0] !== 1) fail("unsupported address version");
  const owner = bytes4.subarray(1, 33), viewPub = bytes4.subarray(33, 65), tag2 = bytes4.subarray(65, 69);
  const expected = nzkInstanceTag(domain, assetId);
  if (tag2.some((b, i) => b !== expected[i])) fail("address belongs to another pool instance");
  checkOwner(owner);
  checkViewPublic(viewPub);
  return {
    domain: hex4(bytes324(domain, "domain")),
    asset_id: hex4(bytes324(assetId, "assetId")),
    owner: hex4(owner),
    view_pub: hex4(viewPub)
  };
}
function parseRecipient(input, { network, domain, assetId }) {
  let descriptor2;
  if (typeof input === "string") {
    const value = input.trim();
    if (!value) fail("recipient required");
    if (value[0] !== "{") return decodeNzkAddress(value, { network, domain, assetId });
    try {
      descriptor2 = JSON.parse(value);
    } catch {
      fail("recipient is neither an nzk address nor a JSON descriptor");
    }
  } else {
    descriptor2 = input;
  }
  if (!descriptor2 || typeof descriptor2 !== "object" || Array.isArray(descriptor2)) {
    fail("recipient must be an nzk address or a descriptor");
  }
  const normalized = {
    domain: hex4(bytes324(descriptor2.domain, "domain")),
    asset_id: hex4(bytes324(descriptor2.asset_id, "asset_id")),
    owner: hex4(bytes324(descriptor2.owner, "owner")),
    view_pub: hex4(bytes324(descriptor2.view_pub, "view_pub"))
  };
  if (normalized.domain !== hex4(bytes324(domain, "domain")) || normalized.asset_id !== hex4(bytes324(assetId, "assetId"))) {
    fail("recipient belongs to another pool instance");
  }
  checkOwner(bytes324(normalized.owner, "owner"));
  checkViewPublic(bytes324(normalized.view_pub, "view_pub"));
  return normalized;
}
var ZkWalletIdentity = class _ZkWalletIdentity {
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
  #used = /* @__PURE__ */ new Set();
  #maxUsed = -1;
  #identities = /* @__PURE__ */ new Map();
  constructor(prk, { family, account = 0, domain, assetId, network, gap, issued }) {
    const scope = accountScope({ family, account, domain, assetId });
    this.#family = family;
    this.#prk = prk.slice();
    this.#account = index31(account, "account");
    this.#domain = hex4(bytes324(domain, "domain"));
    this.#assetId = hex4(bytes324(assetId, "assetId"));
    hrpFor(network);
    this.#network = network;
    this.#fingerprint = fingerprintFromPrk(this.#prk, { family, account, domain, assetId });
    this.#storageId = hex4(sha256(expand(sha256, this.#prk, concat5(label("storage"), scope), 32)));
    if (gap !== void 0) this.setGap(gap);
    if (issued !== void 0) this.setIssued(issued);
  }
  static async fromMnemonic({ mnemonic, passphrase = "", zkPassphrase = "", ...options }) {
    accountScope(options);
    const seed = await walletSeedFromMnemonic(mnemonic, passphrase);
    try {
      return await _ZkWalletIdentity.fromSeed({ seed, zkPassphrase, ...options });
    } finally {
      seed.fill(0);
    }
  }
  static async fromSeed({ seed, zkPassphrase = "", ...options }) {
    accountScope(options);
    const root = await deriveZkRoot(seed, zkPassphrase);
    try {
      return _ZkWalletIdentity.fromRoot({ root, ...options });
    } finally {
      root.fill(0);
    }
  }
  /** For callers that already derived R, such as tests. */
  static fromRoot({ root, ...options }) {
    const prk = accountPrk(root);
    try {
      return new _ZkWalletIdentity(prk, options);
    } finally {
      prk.fill(0);
    }
  }
  #assertOpen() {
    if (!this.#prk) fail("identity is locked");
  }
  get derivation() {
    return NZK_DERIVATION;
  }
  get family() {
    return this.#family;
  }
  get storageId() {
    return this.#storageId;
  }
  get fingerprint() {
    return this.#fingerprint;
  }
  get account() {
    return this.#account;
  }
  get network() {
    return this.#network;
  }
  get gap() {
    return this.#gap;
  }
  get issued() {
    return this.#issued;
  }
  get maxUsed() {
    return this.#maxUsed;
  }
  get usedIndexes() {
    return [...this.#used].sort((a, b) => a - b);
  }
  setGap(gap) {
    if (!Number.isInteger(gap) || gap < 1 || gap > NZK_MAX_GAP) fail(`gap must be an integer in [1, ${NZK_MAX_GAP}]`);
    this.#gap = gap;
  }
  setIssued(index) {
    this.#issued = index31(index, "issued index");
  }
  /** Sub-identity for one address; created on demand and cached. */
  identityAt(chain2, index) {
    this.#assertOpen();
    const key = chain2 + "/" + index;
    let identity = this.#identities.get(key);
    if (!identity) {
      const { spendSecret, viewSeed } = keysFromPrk(this.#prk, {
        family: this.#family,
        account: this.#account,
        chain: chain2,
        index,
        domain: this.#domain,
        assetId: this.#assetId
      });
      try {
        identity = new BrowserTestIdentity(spendSecret, viewSeed, bytes324(this.#domain), bytes324(this.#assetId), null);
      } finally {
        spendSecret.fill(0);
        viewSeed.fill(0);
      }
      this.#identities.set(key, identity);
    }
    return identity;
  }
  descriptorAt(chain2, index) {
    return this.identityAt(chain2, index).recipient();
  }
  addressAt(chain2, index) {
    return encodeNzkAddress(this.descriptorAt(chain2, index), this.#network);
  }
  /** First receiving index after the highest used one, or the last one handed out if later. */
  currentIndex() {
    return Math.max(this.#maxUsed + 1, this.#issued);
  }
  /** Receiving descriptor to show and share now. */
  recipient() {
    return this.descriptorAt(CHAIN_RECEIVING, this.currentIndex());
  }
  /** Descriptor for the wallet's own notes: deposits, change and self-assignments. */
  selfRecipient() {
    return this.descriptorAt(CHAIN_CHANGE, 0);
  }
  /** Hand out the next receiving address; beyond the gap only when forced. */
  issueNext({ force = false } = {}) {
    const next = this.currentIndex() + 1;
    if (!force && next > this.#maxUsed + this.#gap) {
      fail(`more than ${this.#gap} unused addresses would exist; recovery might not find them`);
    }
    this.#issued = index31(next, "issued index");
    return next;
  }
  /**
   * Trial-decrypt pool records with the change address and receiving addresses,
   * extending the window until `gap` consecutive unused addresses follow the
   * highest used one. Order of records does not matter.
   */
  scanRecords(entries, knownAddresses = []) {
    this.#assertOpen();
    this.#used = new Set(knownAddresses.filter((address) => address?.chain === CHAIN_RECEIVING).map((address) => index31(address.index, "known address index")));
    this.#maxUsed = this.#used.size ? Math.max(...this.#used) : -1;
    const found = /* @__PURE__ */ new Map();
    const tryAddress = (chain2, index) => {
      const identity = this.identityAt(chain2, index);
      entries.forEach((entry, position) => {
        if (found.has(position)) return;
        let owned = null;
        try {
          owned = identity.openRecord(entry.record, entry.cm);
        } catch {
          owned = null;
        }
        if (!owned) return;
        found.set(position, { position, owned, address: { chain: chain2, index } });
        if (chain2 === CHAIN_RECEIVING) {
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
    for (const [chain2, index] of [[CHAIN_CHANGE, 0], ...Array.from({ length: this.currentIndex() + this.#gap }, (_, i) => [CHAIN_RECEIVING, i])]) {
      try {
        const owned = this.identityAt(chain2, index).openRecord(record, cm);
        if (owned) return owned;
      } catch {
      }
    }
    return null;
  }
  createNote(recipient, amountAtomic) {
    return this.identityAt(CHAIN_CHANGE, 0).createNote(recipient, amountAtomic);
  }
  /** Spend with the key of the address that received the consumed note. */
  spendingIdentity(consumed) {
    const address = consumed?.address;
    if (!consumed) return this.identityAt(CHAIN_CHANGE, 0);
    if (!address || address.chain !== CHAIN_RECEIVING && address.chain !== CHAIN_CHANGE) fail("note has no known address");
    return this.identityAt(address.chain, index31(address.index, "address index"));
  }
  prepareC4(options) {
    return this.spendingIdentity(options.consumed).prepareC4(options);
  }
  /** Derived identities are recovered from the words; there is no file backup. */
  backupJson() {
    return null;
  }
  #checkpointKey() {
    this.#assertOpen();
    return expand(
      sha256,
      this.#prk,
      concat5(label("scan-checkpoint"), accountScope({ family: this.#family, account: this.#account, domain: this.#domain, assetId: this.#assetId })),
      32
    );
  }
  sealCheckpoint(checkpoint) {
    const key = this.#checkpointKey();
    try {
      return sealScanCheckpoint(checkpoint, key);
    } finally {
      key.fill(0);
    }
  }
  openCheckpoint(encoded) {
    const key = this.#checkpointKey();
    try {
      return openScanCheckpoint(encoded, key);
    } finally {
      key.fill(0);
    }
  }
  lock() {
    for (const identity of this.#identities.values()) identity.lock();
    this.#identities.clear();
    this.#prk?.fill(0);
    this.#prk = null;
  }
};

// src/amounts.js
var ATOMIC_PER_XNA = 100000000n;
var MAX_ATOMIC = 2100000000000000000n;
var DECIMAL = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i;
function rpcAmountToSatoshis(value) {
  if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Invalid RPC amount");
  const text2 = typeof value === "number" ? String(value) : value;
  if (typeof text2 !== "string") throw new Error("Invalid RPC amount");
  const match = DECIMAL.exec(text2);
  if (!match) throw new Error("Invalid RPC amount");
  const fraction = match[2] ?? "";
  const exponent = Number(match[3] ?? 0);
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) throw new Error("Invalid RPC amount");
  const digits = BigInt(match[1] + fraction);
  const scale = 8 - fraction.length + exponent;
  let satoshis;
  if (scale >= 0) satoshis = digits * 10n ** BigInt(scale);
  else {
    const divisor = 10n ** BigInt(-scale);
    if (digits % divisor !== 0n) throw new Error("RPC amount has more than 8 decimals");
    satoshis = digits / divisor;
  }
  if (satoshis > MAX_ATOMIC) throw new Error("RPC amount out of range");
  return satoshis;
}
function parseXna(text2, { allowZero = false } = {}) {
  const value = typeof text2 === "string" ? text2.trim() : "";
  const match = /^(\d+)(?:\.(\d{1,8}))?$/.exec(value);
  if (!match) throw new Error("Enter a decimal XNA amount with at most 8 decimal places");
  const satoshis = BigInt(match[1]) * ATOMIC_PER_XNA + BigInt((match[2] ?? "").padEnd(8, "0"));
  if (satoshis > MAX_ATOMIC) throw new Error("Amount is outside the supported range");
  if (!allowZero && satoshis === 0n) throw new Error("Amount must be greater than zero");
  return satoshis;
}
function formatXna(satoshis) {
  const value = BigInt(satoshis);
  if (value < 0n) return "-" + formatXna(-value);
  const whole = value / ATOMIC_PER_XNA;
  const fraction = (value % ATOMIC_PER_XNA).toString().padStart(8, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}

// src/pool-client.js
var LEGACY_P2PKH = /^76a914[0-9a-f]{40}88ac$/;
var STRICT_SCRIPT = /^(?:52|53)20[0-9a-f]{64}$/;
var accepts = (script) => LEGACY_P2PKH.test(script) || STRICT_SCRIPT.test(script);
var MIN_SPONSOR_CHANGE_ATOMIC = 546n;
var minimumChange = (script) => script.startsWith("5220") ? 3060n : script.startsWith("5320") ? 336n : MIN_SPONSOR_CHANGE_ATOMIC;
var POOL_READ_RPC_METHODS = Object.freeze([
  "getblockhash",
  "getbestblockhash",
  "getblockcount",
  "getblock",
  "getrawtransaction",
  "gettxout",
  "getspentinfo"
]);
function isPoolReadRpc(method) {
  return POOL_READ_RPC_METHODS.includes(method);
}
function message(error) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") return error.description ?? error.error?.message ?? JSON.stringify(error);
  return String(error);
}
async function assertPoolChain(rpc, manifest) {
  if (await rpc("getblockhash", [0]) !== manifest.genesis) throw new Error("RPC node is not on the network of this pool");
}
async function confirmedPoolCoins(rpc, utxos, { baseCurrency }) {
  const coins = [];
  for (const row of utxos) {
    if (!accepts(row.script) || row.assetName !== baseCurrency) continue;
    const live = await rpc("gettxout", [row.txid, row.outputIndex, true]);
    if (!live || live.confirmations < 1) continue;
    const coin2 = { ...row, vout: row.outputIndex, valueSats: String(row.satoshis), scriptHex: row.script };
    coins.push(coin2);
  }
  return coins;
}
function selectPoolCoins(coins, { action, amountAtomic, feeAtomic }) {
  const fee = BigInt(feeAtomic);
  if (fee < 0n) throw new Error("Fee must not be negative");
  coins = coins.filter((c) => accepts(c.scriptHex));
  let funding;
  if (action === "deposit") {
    const wanted = String(BigInt(amountAtomic));
    funding = coins.find((c) => c.valueSats === wanted);
    if (!funding) throw new Error("No confirmed coin matches this deposit. Prepare an exact deposit coin, wait for its confirmation and retry.");
  }
  const sponsor = coins.find((c) => c !== funding && BigInt(c.valueSats) >= fee + minimumChange(c.scriptHex));
  if (!sponsor) throw new Error("A separate confirmed supported XNA coin is needed for the fee");
  return { funding, sponsor };
}
async function checkPoolCoin(rpc, coin2) {
  const live = await rpc("gettxout", [coin2.txid, coin2.vout, true]);
  if (!live || live.confirmations < 1 || live.scriptPubKey?.hex !== coin2.scriptHex || !accepts(coin2.scriptHex)) {
    throw new Error("Funding coin is spent, unconfirmed or unsupported");
  }
  if (rpcAmountToSatoshis(live.value).toString() !== String(coin2.valueSats)) throw new Error("Funding value mismatch");
}
async function withdrawalScript(rpc, address) {
  const result = await rpc("validateaddress", [String(address ?? "").trim()]);
  if (!result?.isvalid || !accepts(result.scriptPubKey ?? "")) throw new Error("Withdrawals from this pool require a Legacy, PQ or ECDSA address");
  return result.scriptPubKey;
}
async function recheckInputs(rpc, manifest, points) {
  await assertPoolChain(rpc, manifest);
  for (const p of points) {
    if (!await rpc("gettxout", [p.txid, p.vout, true])) throw new Error("An input was spent while preparing. Refresh and rebuild the proof.");
  }
}
async function admitTransaction(rpc, raw) {
  const check = await rpc("testmempoolaccept", [[raw]]);
  if (!check?.[0]?.allowed) throw new Error(check?.[0]?.["reject-reason"] ?? "Node did not accept the prepared transaction");
  const decoded = await rpc("decoderawtransaction", [raw]);
  return { txid: decoded.txid, decoded };
}
async function inspectFundingTransaction(rpc, raw) {
  const tx = await rpc("decoderawtransaction", [raw]);
  const check = await rpc("testmempoolaccept", [[raw]]);
  if (!check?.[0]?.allowed) throw new Error(check?.[0]?.["reject-reason"] ?? "Funding transaction rejected");
  let inputs = 0n;
  for (const input of tx.vin) {
    const live = await rpc("gettxout", [input.txid, input.vout, true]);
    if (!live) throw new Error("Funding input already spent");
    inputs += rpcAmountToSatoshis(live.value);
  }
  const outputs = tx.vout.reduce((sum, output) => sum + rpcAmountToSatoshis(output.value), 0n);
  return { txid: tx.txid, feeAtomic: inputs - outputs, points: tx.vin.map((input) => ({ txid: input.txid, vout: input.vout })) };
}
async function publishTransaction(rpc, manifest, { raw, txid, points }, { onBroadcast } = {}) {
  await recheckInputs(rpc, manifest, points);
  const check = await rpc("testmempoolaccept", [[raw]]);
  if (!check?.[0]?.allowed) throw new Error(check?.[0]?.["reject-reason"] ?? "Transaction is no longer admissible");
  const decoded = await rpc("decoderawtransaction", [raw]);
  if (decoded?.txid !== txid) throw new Error("Prepared transaction ID does not match its bytes");
  onBroadcast?.(txid);
  let sent;
  try {
    sent = await rpc("sendrawtransaction", [raw]);
  } catch (error) {
    throw Object.assign(new Error("Publication result is uncertain: " + message(error)), { uncertain: true });
  }
  if (sent !== txid) throw Object.assign(new Error("Unexpected transaction ID; check the explorer before retrying"), { uncertain: true });
  return sent;
}
async function publicationStatus(rpc, manifest, { txid, raw, points = [] }) {
  await assertPoolChain(rpc, manifest);
  let tx = null;
  try {
    tx = await rpc("getrawtransaction", [txid, true]);
  } catch {
    tx = null;
  }
  if (tx) {
    if (tx.txid !== txid) throw new Error("RPC returned another transaction");
    return tx.confirmations > 0 ? "confirmed" : "mempool";
  }
  if (!raw) throw new Error("Transaction status is unavailable. Keep its ID and check the explorer.");
  await recheckInputs(rpc, manifest, points);
  const acceptance = await rpc("testmempoolaccept", [[raw]]);
  if (!acceptance?.[0]?.allowed) throw new Error("Publication remains uncertain. Do not build a replacement yet.");
  return "retryable";
}

// src/rotation-store.js
var ROTATION_MAX_GAP = 1e3;
function rotationStorageKey({ network, walletId = "", derivation, family, storageId, account }) {
  if (derivation !== "NeuraiZK/v2") throw new Error("unsupported derivation");
  if (!["legacy", "ecdsa", "pq"].includes(family)) throw new Error("invalid family");
  if (typeof storageId !== "string" || !/^[0-9a-f]{64}$/.test(storageId)) throw new Error("storageId must be 32 bytes in hex");
  if (!Number.isInteger(account) || account < 0 || account >= 2 ** 31) throw new Error("invalid account");
  return "neurai-privacy-zk:v2:" + JSON.stringify([network, walletId, family, account, storageId]);
}
function loadRotation(storage, key) {
  try {
    const value = JSON.parse(storage?.getItem(key) ?? "null");
    if (value && Number.isInteger(value.issued) && value.issued >= 0 && value.issued < 2 ** 31 && Number.isInteger(value.gap) && value.gap >= 1 && value.gap <= ROTATION_MAX_GAP) {
      return { gap: value.gap, issued: value.issued };
    }
  } catch {
  }
  return null;
}
function saveRotation(storage, key, { gap, issued }) {
  if (!storage || typeof storage.setItem !== "function") return false;
  try {
    storage.setItem(key, JSON.stringify({ gap, issued }));
    return true;
  } catch {
    return false;
  }
}

// src/c4-testnet.js
function deepFreeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
var C4_TESTNET_NETWORK = "testnet";
var C4_TESTNET_COMMITMENT = "a627eac63b0817abe9d07584690d4b418325ed00df08f5f18e2ac0ab58ff5ae4";
var C4_TESTNET_MANIFEST = deepFreeze({
  "schema": "neurai-c4-xna-test-v1",
  "testOnly": true,
  "profile": "xna",
  "genesis": "0000008b384aeffecdab182575dc4e86c9f07f90318c65088532660ed9a8a021",
  "unit": "1",
  "registryRoot": "0000000000000000000000000000000000000000000000000000000000000000",
  "identity": "C4TESTX260930A#POOL",
  "issuance": {
    "txid": "42a607fe7f5e7134f0f3b033c4989ebbc8cf24889c9cc0a17660bdbdc071401d",
    "vout": 3
  },
  "domain": "a6897e07f5b084c97f3d55ff0ffa5e07e55fffd5858c95f576c5ace1123efe0f",
  "assetId": "4c2f545490a62c5f534981996a8b140fd28dfab8aa051e86da40248bdd687bff",
  "context": "1a145315ccbf33410a65d719312c332522c5cbb2cb5d0b62483390238110016f",
  "birth": "6985d9a0e71cfec44b4effd86f72b08d79191bfdb14fd5238d187390f021aac2",
  "birthHeight": 11540,
  "commitment": "a627eac63b0817abe9d07584690d4b418325ed00df08f5f18e2ac0ab58ff5ae4",
  "address": "tnc1p5cn7433mpqt6h6wswkzxjr2tgxpjtmgqmuy0tuvw9tq2kk8lttjqxvdz4w",
  "reserveCommitment": "1b6f93cb51fb572f16dfb924c7fdaee4ffa1fe635f2e92bf3c848c797078778e",
  "guard": "0052c420a627eac63b0817abe9d07584690d4b418325ed00df08f5f18e2ac0ab58ff5ae4880051cf13433454455354583236303933304123504f4f4c880051ce13433454455354583236303933304123504f4f4c8800d50052c48851",
  "forms": {
    "D0": {
      "script": "52b60058cf827701208853b602512052797e02c0427e18786e617413433454455354583236303933304123504f4f4c0400e1f5050800000000000000007e00b77758b7757e0254207e0058cf7e7e01757e8800d600880058ce827701208800cd02512052797e02c0427e18786e617413433454455354583236303933304123504f4f4c0400e1f5050800000000000000007e00b77758b7757e0254207e0058ce7e7e01757e8800cc0088d05388d1538851798277016c8842618cd8231ef0cfb834a51353a65ca5a7442562307a1855525e894a2dd1dcddee618cd8231ef0cfb834a51353a65ca5a7442562307a1855525e894a2dd1dcddee04005279aa7ea8020400b58851790120b77754b775040000000088020001b520308542cb639a0e6ac414070f3be7c7e13827c7dde337c4d1202853376519fab18842392c8f40e348d26fd6d921326074e0f368ffd896785e41e32382f9ff114e6f44392c8f40e348d26fd6d921326074e0f368ffd896785e41e32382f9ff114e6f440100040052c42052797e38880051cf13433454455354583236303933304123504f4f4c880051ce13433454455354583236303933304123504f4f4c8800d50052c488517ea87ea85153c4007982770119876300798277011988007900b77753b7750376a9148800790117b77752b7750288ac886700798277012288007900b77752b77502522087517900b77752b775025320879b696851d600a06951cd02512053797e8851cc00a06951cc08000052acdfb2241da16951cc51d6885253c4007982770119876300798277011988007900b77753b7750376a9148800790117b77752b7750288ac886700798277012288007900b77752b77502522087517900b77752b775025320879b696852cd51798852cc00a26952cc52d6a16956798277020008885579827702000888567900b77752b775020201885679021e01b77702e206b7754de2060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000088557900b777020008b7754d0008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000088567952b7770120b7752000000000000000000000000000000000000000000000000000000000000000008856790142b77753b7750301d900885779a82033a67f8c27fb6efa756547d85b76c170e2de787138ccb78e62ce8ae11efa8bdf8858795879201a145315ccbf33410a65d719312c332522c5cbb2cb5d0b62483390238110016f0058cf0058ce0b4e49503034352f6465700151d60800000000000000007e00b77758b7757e5c790122b7770120b7757ec90b4e49503034352f77647200c90b4e49503034352f72657100c90b4e49503034352f64617403c95f797ec95e797ec9021f01b5c91800000000000000000000000000000000000000000000000051d60800000000000000007e00b77758b775bc7e5951c3696d6d6d6d7551",
      "control": "01cc6e6fed1aed7e7dd8dd3b54258f1562eda483aaab380f3fbcba5296d09948286498ebbdade38d1f6f7e8f111f3f8ab6dcd2fac9f3e81a1cc08fba1351f414d5743f1484ce7ebe8bec8a17ad89bf7fe098a17455f9a2e54b212a76e0cbfe0dce",
      "vk": "c7e253d6dbb0b365b15775ae9f8aa0ffcc1c8cde0bd7a4e8c0b376b0d92952a444d2615ebda233e141f4ca0a1270e1269680b20507d55f6872540af6c1bc2424dba1298a9727ff392b6f7f48b3e88e20cf925b7024be9992d3bbfae8820a0907edf692d95cbdde46ddda5ef7d422436779445c5e66006a42761e1f12efde0018c212f3aeb785e49712e7a9353349aaf1255dfb31b7bf60723a480d9293938e190c268c82003090d037ceef20957335635c05463ab01fec4bd45549189dd2cf0472b75a647498668a968e008458d4b5256972a4b4a8974e57bdb729b9fb596a100a00000000000000756df467f9bb357c2332d6f05dfe1628947c9c77671a75bcc15213bb89bb2e853ffb77e1afe3792c6f07af28e1dde8087ba6fb2f4eb8e0dca9f6782ed1ad981e5e3f36a48fb4d93dd7d943146ebfe50f3b6ce904c1935f035982e140fedb1ba355b243e1531dfcd4bfd7a91854f694de1a4d87ac46083297cb76bb3a9dc4fa98ca356c11c34ece2d05752a169dee23ec6b9cc76d04551d68fd4f17bde2ac46217d7f10f702822b9e58145e2677194b2e278a7072041ae27d313d44a066cc329f37c8982e827e548a374d28eee8981f0ad8f4d3406fe5d2fdc305a08cf49efe94d44f335aa41200f8669ac7bb070c008dea7acbd453d7f94fc65c832e9c1ab8a564f1fb2bedc9b065919351c8ae820340962708749e5f4ba725b44dab5c5403a354391e8c2d4ec8553a53b57de90e3f38888e6fd1cbf2188680d7cec9e0c3fc29",
      "vkHash": "33a67f8c27fb6efa756547d85b76c170e2de787138ccb78e62ce8ae11efa8bdf"
    },
    "D1": {
      "script": "52b60058cf827701208853b602512052797e02c0427e18786e617413433454455354583236303933304123504f4f4c0400e1f5050800000000000000007e00b77758b7757e0254207e0058cf7e7e01757e8800d600880058ce827701208800cd02512052797e02c0427e18786e617413433454455354583236303933304123504f4f4c0400e1f5050800000000000000007e00b77758b7757e0254207e0058ce7e7e01757e8800cc0088d05488d15388517982770290008842618cd8231ef0cfb834a51353a65ca5a7442562307a1855525e894a2dd1dcddee618cd8231ef0cfb834a51353a65ca5a7442562307a1855525e894a2dd1dcddee04005279aa7ea8020400b58851790120b77754b775040000000088517900b7770120b77552790124b7770120b7758851790144b77754b775040100000088020001b520308542cb639a0e6ac414070f3be7c7e13827c7dde337c4d1202853376519fab18842392c8f40e348d26fd6d921326074e0f368ffd896785e41e32382f9ff114e6f44392c8f40e348d26fd6d921326074e0f368ffd896785e41e32382f9ff114e6f440100040052c42052797e38880051cf13433454455354583236303933304123504f4f4c880051ce13433454455354583236303933304123504f4f4c8800d50052c488517ea87ea85153c402512052797e8851d600a06951d608000052acdfb2241da1695253c4007982770119876300798277011988007900b77753b7750376a9148800790117b77752b7750288ac886700798277012288007900b77752b77502522087517900b77752b775025320879b696852d600a06951cd02512053797e8851cc00a06951cc08000052acdfb2241da16951cc51d652d693885353c4007982770119876300798277011988007900b77753b7750376a9148800790117b77752b7750288ac886700798277012288007900b77752b77502522087517900b77752b775025320879b696852cd51798852cc00a26952cc53d6a16956798277020008885579827702000888567900b77752b775020201885679021e01b77702e206b7754de2060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000088557900b777020008b7754d0008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000088567952b7770120b7752000000000000000000000000000000000000000000000000000000000000000008856790142b77753b7750301d900885779a820187c179623e7a6438882ae30dd8bfc8a6c8ad9c08fccb6eb1572cb92b158bd4d8858795879201a145315ccbf33410a65d719312c332522c5cbb2cb5d0b62483390238110016f0058cf0058ce0b4e49503034352f6465700152d60800000000000000007e00b77758b7757e5c790122b7770120b7757ec90b4e49503034352f77647200c90b4e49503034352f72657100c90b4e49503034352f64617403c95f797ec95e797ec9021f01b5c91800000000000000000000000000000000000000000000000052d60800000000000000007e00b77758b775bc7e5951c3696d6d6d6d7551",
      "control": "014737a9a4d834842f69a01c441799b0811cd8a56019d9a75135bccf8abd3fbdaa6498ebbdade38d1f6f7e8f111f3f8ab6dcd2fac9f3e81a1cc08fba1351f414d5743f1484ce7ebe8bec8a17ad89bf7fe098a17455f9a2e54b212a76e0cbfe0dce",
      "vk": "c7e253d6dbb0b365b15775ae9f8aa0ffcc1c8cde0bd7a4e8c0b376b0d92952a444d2615ebda233e141f4ca0a1270e1269680b20507d55f6872540af6c1bc2424dba1298a9727ff392b6f7f48b3e88e20cf925b7024be9992d3bbfae8820a0907edf692d95cbdde46ddda5ef7d422436779445c5e66006a42761e1f12efde0018c212f3aeb785e49712e7a9353349aaf1255dfb31b7bf60723a480d9293938e191aa502c3c5bf7bb8ddf8824d4bdaa01a732eb3dd8f2d44425bcf74e23fbf111595e55905e21874d6e4eb9b9d1e136a425a358ff435dc1066edf2bc642f1373180a000000000000000dcaf958da6f542d5c07886fe7436eb0ac03da1afc22893060c9ba6911fe63883ffb77e1afe3792c6f07af28e1dde8087ba6fb2f4eb8e0dca9f6782ed1ad981e5e3f36a48fb4d93dd7d943146ebfe50f3b6ce904c1935f035982e140fedb1ba355b243e1531dfcd4bfd7a91854f694de1a4d87ac46083297cb76bb3a9dc4fa98ca356c11c34ece2d05752a169dee23ec6b9cc76d04551d68fd4f17bde2ac4621c6b107ac6c76b874514ec96b0b43d2b64e7fc777269e09b286bfe849ac729421e89fcf20810c0250428711081b6eed4d75ba0e2abcdf00e661c9fdbd523bbfa3d44f335aa41200f8669ac7bb070c008dea7acbd453d7f94fc65c832e9c1ab8a564f1fb2bedc9b065919351c8ae820340962708749e5f4ba725b44dab5c5403a354391e8c2d4ec8553a53b57de90e3f38888e6fd1cbf2188680d7cec9e0c3fc29",
      "vkHash": "187c179623e7a6438882ae30dd8bfc8a6c8ad9c08fccb6eb1572cb92b158bd4d"
    },
    "T1": {
      "script": "52b60058cf827701208853b602512052797e02c0427e18786e617413433454455354583236303933304123504f4f4c0400e1f5050800000000000000007e00b77758b7757e0254207e0058cf7e7e01757e8800d600880058ce827701208800cd02512052797e02c0427e18786e617413433454455354583236303933304123504f4f4c0400e1f5050800000000000000007e00b77758b7757e0254207e0058ce7e7e01757e8800cc0088d05388d1538851798277016c8842618cd8231ef0cfb834a51353a65ca5a7442562307a1855525e894a2dd1dcddee618cd8231ef0cfb834a51353a65ca5a7442562307a1855525e894a2dd1dcddee04005279aa7ea8020400b58851790120b77754b775040000000088517900b7770120b77552790124b7770120b7758851790144b77754b775040100000088020001b520308542cb639a0e6ac414070f3be7c7e13827c7dde337c4d1202853376519fab18842392c8f40e348d26fd6d921326074e0f368ffd896785e41e32382f9ff114e6f44392c8f40e348d26fd6d921326074e0f368ffd896785e41e32382f9ff114e6f440100040052c42052797e38880051cf13433454455354583236303933304123504f4f4c880051ce13433454455354583236303933304123504f4f4c8800d50052c488517ea87ea85153c402512052797e8851d600a06951d608000052acdfb2241da16951cd02512052797e8851cc00a06951cc08000052acdfb2241da16951cc51d6885253c4007982770119876300798277011988007900b77753b7750376a9148800790117b77752b7750288ac886700798277012288007900b77752b77502522087517900b77752b775025320879b696852cd51798852cc00a26952cc52d6a16955798277020008885479827702000888557900b77752b775020201885579021e01b77702e206b7754de2060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000088547900b777020008b7754d000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008855790142b77753b7750301d900885679a8200dd8efed2a27db9a33fadec570f8e994140b49a047dcc810a0f932a85065f49d8857795779201a145315ccbf33410a65d719312c332522c5cbb2cb5d0b62483390238110016f0058cf0058ce5a7952b7770120b7750b4e49503034352f64617403c95c797ec95b797ec9021f01b5c95d790122b7770120b7755751c3696d6d6d6d51",
      "control": "01a601fb4361052409479cb96b75cfed3586c0d9e5821f8caf8883f528aca69a94630092b577e38642d38e7446d8239b656a16afd945684deb206033430f4d7f7d743f1484ce7ebe8bec8a17ad89bf7fe098a17455f9a2e54b212a76e0cbfe0dce",
      "vk": "c7e253d6dbb0b365b15775ae9f8aa0ffcc1c8cde0bd7a4e8c0b376b0d92952a444d2615ebda233e141f4ca0a1270e1269680b20507d55f6872540af6c1bc2424dba1298a9727ff392b6f7f48b3e88e20cf925b7024be9992d3bbfae8820a0907edf692d95cbdde46ddda5ef7d422436779445c5e66006a42761e1f12efde0018c212f3aeb785e49712e7a9353349aaf1255dfb31b7bf60723a480d9293938e19fc6a279e5053822c63b2545b1c3a47f9f977d02010ae788279d2a385e21ba1111d9ea7a2877107d09bb95c175547e6658abf3339bdde20f54177781994b6f71d0800000000000000043331cdecd2620063e4f53bf14f70f083a6e8894fb3d2e6f44c561d3422710c801d2825edecf3f135f9663c34719eecf225f3006f27050a12edccc9f0aef299906a6a7d3c66d788f4bd1fdef78c41619f000c2979217c16fad941d1ac69ad997bcaff002301e7398b3e2adbcceb6f8dc86282ea21d255088cbb19a9ed56ef8ea04b2004315a0c3ffbcf7604051e042c9792dc8fdc8247caf31b014976952d0a7ac86df441b011c7b7f9544d83b0889af852d8e19e2c4631858e15f4142cba1534f8084937b05d52df746b144412fd9032ade85fdf72f583bd33eabbe065ee8ef982891b52d8856615d252bfdd9400983fcd7a9bbe32637a554074f4c31e5a22",
      "vkHash": "0dd8efed2a27db9a33fadec570f8e994140b49a047dcc810a0f932a85065f49d"
    },
    "T2": {
      "script": "52b60058cf827701208853b602512052797e02c0427e18786e617413433454455354583236303933304123504f4f4c0400e1f5050800000000000000007e00b77758b7757e0254207e0058cf7e7e01757e8800d600880058ce827701208800cd02512052797e02c0427e18786e617413433454455354583236303933304123504f4f4c0400e1f5050800000000000000007e00b77758b7757e0254207e0058ce7e7e01757e8800cc0088d05388d1538851798277016c8842618cd8231ef0cfb834a51353a65ca5a7442562307a1855525e894a2dd1dcddee618cd8231ef0cfb834a51353a65ca5a7442562307a1855525e894a2dd1dcddee04005279aa7ea8020400b58851790120b77754b775040000000088517900b7770120b77552790124b7770120b7758851790144b77754b775040100000088020001b520308542cb639a0e6ac414070f3be7c7e13827c7dde337c4d1202853376519fab18842392c8f40e348d26fd6d921326074e0f368ffd896785e41e32382f9ff114e6f44392c8f40e348d26fd6d921326074e0f368ffd896785e41e32382f9ff114e6f440100040052c42052797e38880051cf13433454455354583236303933304123504f4f4c880051ce13433454455354583236303933304123504f4f4c8800d50052c488517ea87ea85153c402512052797e8851d600a06951d608000052acdfb2241da16951cd02512052797e8851cc00a06951cc08000052acdfb2241da16951cc51d6885253c4007982770119876300798277011988007900b77753b7750376a9148800790117b77752b7750288ac886700798277012288007900b77752b77502522087517900b77752b775025320879b696852cd51798852cc00a26952cc52d6a16955798277020008885479827702000888557900b77752b775020202885579021a02b77702e605b7754de6050000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000088547900b777020008b7754d000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008855790162b77753b7750301d900885579023e01b77753b7750301d900885679a820033f70de5bb6dcf35aef202ff9a7af1eb4729e1fb543b9ce39a8114a53cf1d9a8857795779201a145315ccbf33410a65d719312c332522c5cbb2cb5d0b62483390238110016f0058cf0058ce5a7952b7770120b7750b4e49503034352f64617403c95c797ec95b797ec9021f01b5c95d790122b7770120b7755e790142b7770120b7755851c3696d6d6d6d51",
      "control": "01e38bcfb1fc9f59a955f4ac4079710ba3df1a999d7b860af1f845f0238dad1824630092b577e38642d38e7446d8239b656a16afd945684deb206033430f4d7f7d743f1484ce7ebe8bec8a17ad89bf7fe098a17455f9a2e54b212a76e0cbfe0dce",
      "vk": "c7e253d6dbb0b365b15775ae9f8aa0ffcc1c8cde0bd7a4e8c0b376b0d92952a444d2615ebda233e141f4ca0a1270e1269680b20507d55f6872540af6c1bc2424dba1298a9727ff392b6f7f48b3e88e20cf925b7024be9992d3bbfae8820a0907edf692d95cbdde46ddda5ef7d422436779445c5e66006a42761e1f12efde0018c212f3aeb785e49712e7a9353349aaf1255dfb31b7bf60723a480d9293938e19491fa03ebe18219250ed5f1b3c8504dcd18da09c55243285a7f347859361bd135578b2434ff654a491c98a9fbba6f444714f50683dd6df83fd0c07c8e6f4f2010900000000000000f1bf0e236a47633b1c70e76f0fda4b3cc89f8d372e36bfc5059c1da955d03c074f9d22a947a1fd7d85c3e9173d05398c947eba3aa809b051e8834db83c9b578e4488e401f40904f8234dd896796e353dacde5d5818cb097f1261df1dd69482113cbf0f1c2eead793628b9a2923449747263fe6866f3ad457cceec9aebbf1368422b0a028c2f21a5f09d4e6855c56462555327b353a06c7004877f76ec0e49d130fc413b6185d86195d665726812cbe31008e32fbe57003b8d25288a92b419f29ef6725906abdd512d24336fb47434a7ee121178b9639a6bcafeef259bbf83019be64baa219bb8642435a55df7ee3ed21dac20c2998ad49d56b146af9e48f37a0fa657f62581a48c1a06f0156452d46d9c92d7149b08ffe1ffa2d2ffff80f9597",
      "vkHash": "033f70de5bb6dcf35aef202ff9a7af1eb4729e1fb543b9ce39a8114a53cf1d9a"
    },
    "T3": {
      "script": "52b60058cf827701208853b602512052797e02c0427e18786e617413433454455354583236303933304123504f4f4c0400e1f5050800000000000000007e00b77758b7757e0254207e0058cf7e7e01757e8800d600880058ce827701208800cd02512052797e02c0427e18786e617413433454455354583236303933304123504f4f4c0400e1f5050800000000000000007e00b77758b7757e0254207e0058ce7e7e01757e8800cc0088d05388d1538851798277016c8842618cd8231ef0cfb834a51353a65ca5a7442562307a1855525e894a2dd1dcddee618cd8231ef0cfb834a51353a65ca5a7442562307a1855525e894a2dd1dcddee04005279aa7ea8020400b58851790120b77754b775040000000088517900b7770120b77552790124b7770120b7758851790144b77754b775040100000088020001b520308542cb639a0e6ac414070f3be7c7e13827c7dde337c4d1202853376519fab18842392c8f40e348d26fd6d921326074e0f368ffd896785e41e32382f9ff114e6f44392c8f40e348d26fd6d921326074e0f368ffd896785e41e32382f9ff114e6f440100040052c42052797e38880051cf13433454455354583236303933304123504f4f4c880051ce13433454455354583236303933304123504f4f4c8800d50052c488517ea87ea85153c402512052797e8851d600a06951d608000052acdfb2241da16951cd02512052797e8851cc00a06951cc08000052acdfb2241da16951cc51d6885253c4007982770119876300798277011988007900b77753b7750376a9148800790117b77752b7750288ac886700798277012288007900b77752b77502522087517900b77752b775025320879b696852cd51798852cc00a26952cc52d6a16955798277020008885479827702000888557900b77752b775020203885579021603b77702ea04b7754dea040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000088547900b777020008b7754d00080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000885579028200b77753b7750301d900885579025e01b77753b7750301d900885579023a02b77753b7750301d900885679a82037862db47d76de0d7027bbb5a2b6be0073222f048e87a98d8b42937884c06bd68857795779201a145315ccbf33410a65d719312c332522c5cbb2cb5d0b62483390238110016f0058cf0058ce5a7952b7770120b7750b4e49503034352f64617403c95c797ec95b797ec9021f01b5c95d790122b7770120b7755e790142b7770120b7755f790162b7770120b7755951c3696d6d6d6d51",
      "control": "0135bd33a21b3f791688e6f91228a944d7901eba09b1077173d594fdd2c9a24cf9d2fc0bdfe7b539c3846aedc1865e11b27a8907d40a7e59dad94690a898b548e622798b2fb2e057ca5b3646d1efb74a383dd1b9a9838b05f3358614bab1d00165",
      "vk": "c7e253d6dbb0b365b15775ae9f8aa0ffcc1c8cde0bd7a4e8c0b376b0d92952a444d2615ebda233e141f4ca0a1270e1269680b20507d55f6872540af6c1bc2424dba1298a9727ff392b6f7f48b3e88e20cf925b7024be9992d3bbfae8820a0907edf692d95cbdde46ddda5ef7d422436779445c5e66006a42761e1f12efde0018c212f3aeb785e49712e7a9353349aaf1255dfb31b7bf60723a480d9293938e19780c5e3f44e138b405e5492d714bb23fd2d38d5a9c3792fdbebc818fede2f6049e698edab260e6ca5984d3876f5976293b93f9f2f52aecb4c7039ace2263ffab0a000000000000004f096a138b65445cec6c58d708a911217d53aad41d48b362b560af321ca0c80d576061a6ce14fd3ecaeb4d615c477912c80d2f48848bf7a6acfd939a2ac351a83837dffd9e1fa40e2da9b45e3930f2e94adc7227422eee66feeeb04be6dc6d1f36089af3dc5bc502efec7e423ec1698718f825396b9d59cf7dc327eb83eb2b895aaaa4793125da8e1eb488e62deab0a6442e58259cf63d0be19c83c01140090015ae5a029d421b435675d94850f81293a66fe19cb24e7e07b6be4fa139fbfe1a189ab08386c52fc64a26c3f9fd490f2780dfc18fa17c6369e528744aaef74510b052d88e03f1fae71a201bb0582d741730c3e98e0105e94cc6be291eb04b0727ee4322b6a8d083da5c3d4a8814ee7c102473a6fee71e443f8d5a46e57c01e41197d7181f58a9db6b7e8fde1811f217b74f835db5b3626a99a32cf77f665f822e",
      "vkHash": "37862db47d76de0d7027bbb5a2b6be0073222f048e87a98d8b42937884c06bd6"
    },
    "T4": {
      "script": "52b60058cf827701208853b602512052797e02c0427e18786e617413433454455354583236303933304123504f4f4c0400e1f5050800000000000000007e00b77758b7757e0254207e0058cf7e7e01757e8800d600880058ce827701208800cd02512052797e02c0427e18786e617413433454455354583236303933304123504f4f4c0400e1f5050800000000000000007e00b77758b7757e0254207e0058ce7e7e01757e8800cc0088d05388d1538851798277016c8842618cd8231ef0cfb834a51353a65ca5a7442562307a1855525e894a2dd1dcddee618cd8231ef0cfb834a51353a65ca5a7442562307a1855525e894a2dd1dcddee04005279aa7ea8020400b58851790120b77754b775040000000088517900b7770120b77552790124b7770120b7758851790144b77754b775040100000088020001b520308542cb639a0e6ac414070f3be7c7e13827c7dde337c4d1202853376519fab18842392c8f40e348d26fd6d921326074e0f368ffd896785e41e32382f9ff114e6f44392c8f40e348d26fd6d921326074e0f368ffd896785e41e32382f9ff114e6f440100040052c42052797e38880051cf13433454455354583236303933304123504f4f4c880051ce13433454455354583236303933304123504f4f4c8800d50052c488517ea87ea85153c402512052797e8851d600a06951d608000052acdfb2241da16951cd02512052797e8851cc00a06951cc08000052acdfb2241da16951cc51d6885253c4007982770119876300798277011988007900b77753b7750376a9148800790117b77752b7750288ac886700798277012288007900b77752b77502522087517900b77752b775025320879b696852cd51798852cc00a26952cc52d6a16955798277020008885479827702000888557900b77752b775020204885579021204b77702ee03b7754dee030000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000088547900b777020008b7754d0008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000088557902a200b77753b7750301d900885579027e01b77753b7750301d900885579025a02b77753b7750301d900885579023603b77753b7750301d900885679a820fdf008981bdb001ab52cc8b3be1ebaf8a3e8493956ada9bfe2b111e22b76bc428857795779201a145315ccbf33410a65d719312c332522c5cbb2cb5d0b62483390238110016f0058cf0058ce5a7952b7770120b7750b4e49503034352f64617403c95c797ec95b797ec9021f01b5c95d790122b7770120b7755e790142b7770120b7755f790162b7770120b7756079028200b7770120b7755a51c3696d6d6d6d51",
      "control": "0124f1b604f7e8f4af7754d81845f41312f760360120836d5d0f57305011865f0ed2fc0bdfe7b539c3846aedc1865e11b27a8907d40a7e59dad94690a898b548e622798b2fb2e057ca5b3646d1efb74a383dd1b9a9838b05f3358614bab1d00165",
      "vk": "c7e253d6dbb0b365b15775ae9f8aa0ffcc1c8cde0bd7a4e8c0b376b0d92952a444d2615ebda233e141f4ca0a1270e1269680b20507d55f6872540af6c1bc2424dba1298a9727ff392b6f7f48b3e88e20cf925b7024be9992d3bbfae8820a0907edf692d95cbdde46ddda5ef7d422436779445c5e66006a42761e1f12efde0018c212f3aeb785e49712e7a9353349aaf1255dfb31b7bf60723a480d9293938e19e93a767fcef270aa25cb831a7fb33dee3ec3094985609461412e03c3ad1a1a024a053648396ed352923a1de33b211962a4d7e9dde686ff36be5d04c9329941180b00000000000000df95e08f2b9b81b5689bbc45f4309eca548c4868f99385537d2c1d25be04e81ac53f22977dcca5f22e005a98e87ab105ea851d47dc298ed6d3eb76b65db7f29a8f72b1d76bf76bc36e51e89439532c77e611f180e7c2a5df9d8a1e865a0fbf1cf66c5e9fee6e4aa3fe19dbb684e8b319faf04520b8e38e3ace2d83d10a0e2a9a8cfadf04dd23dc00cf1054cd8d80bf7b623296a42dd95920701c3b38b5f41483e8743f9270e587f8107d998235fe25d98af51283bf3a9d0f893754c5239e719bcd1922b4e5261af06aae85fbdc602da655b378eae3f3263d02d3399adddf5f243ec817a1898f90346dce4b2f6bb5d118155b6a10c06b84203471f7c00cf8a4878f3a54263ace3c1ee5545f65a3c16b92ff787011364edefb8f0190e622d003af1dd9ffa9ffbbed1b3310181b3362a6891a7042148fbee9682221507f45ee900ca313c9855df2584eb59bec995b7d19d2814e273cb8cb62d3dceae9237debef9f",
      "vkHash": "fdf008981bdb001ab52cc8b3be1ebaf8a3e8493956ada9bfe2b111e22b76bc42"
    },
    "W_partial": {
      "script": "52b60058cf827701208853b602512052797e02c0427e18786e617413433454455354583236303933304123504f4f4c0400e1f5050800000000000000007e00b77758b7757e0254207e0058cf7e7e01757e8800d600880058ce827701208800cd02512052797e02c0427e18786e617413433454455354583236303933304123504f4f4c0400e1f5050800000000000000007e00b77758b7757e0254207e0058ce7e7e01757e8800cc0088d05388d1548851798277016c8842618cd8231ef0cfb834a51353a65ca5a7442562307a1855525e894a2dd1dcddee618cd8231ef0cfb834a51353a65ca5a7442562307a1855525e894a2dd1dcddee04005279aa7ea8020400b58851790120b77754b775040000000088517900b7770120b77552790124b7770120b7758851790144b77754b775040100000088020001b520308542cb639a0e6ac414070f3be7c7e13827c7dde337c4d1202853376519fab18842392c8f40e348d26fd6d921326074e0f368ffd896785e41e32382f9ff114e6f44392c8f40e348d26fd6d921326074e0f368ffd896785e41e32382f9ff114e6f440100040052c42052797e38880051cf13433454455354583236303933304123504f4f4c880051ce13433454455354583236303933304123504f4f4c8800d50052c488517ea87ea85153c402512052797e8851d600a06951d608000052acdfb2241da16951cd02512052797e8851cc00a06951cc08000052acdfb2241da16952cd007982770119876300798277011988007900b77753b7750376a9148800790117b77752b7750288ac886700798277012288007900b77752b77502522087517900b77752b775025320879b696852cc00a06951d652cc51cc93885253c4007982770119876300798277011988007900b77753b7750376a9148800790117b77752b7750288ac886700798277012288007900b77752b77502522087517900b77752b775025320879b696853cd51798853cc00a26953cc52d6a1695679a82039640cf0b0352b1f0f4a66eed4a8bb15f13fccb5998c11a6f3aa537760d1c5538857795779201a145315ccbf33410a65d719312c332522c5cbb2cb5d0b62483390238110016f0058cf0058ce5a79021f01b5c91800000000000000000000000000000000000000000000000052cc0800000000000000007e00b77758b775bc7e1800000000000000000000000000000000000000000000000051d60800000000000000007e00b77758b775bc7e1800000000000000000000000000000000000000000000000051cc0800000000000000007e00b77758b775bc7e5851c3696d6d6d6d51",
      "control": "018920689337c56bf2580d3e15814e1f40bbff988a2e656ccf2d2251da50248db1547bce3fbff66083a0015a93883a6d4958895a5d4918bcdf709dbe818a8f846622798b2fb2e057ca5b3646d1efb74a383dd1b9a9838b05f3358614bab1d00165",
      "vk": "c7e253d6dbb0b365b15775ae9f8aa0ffcc1c8cde0bd7a4e8c0b376b0d92952a444d2615ebda233e141f4ca0a1270e1269680b20507d55f6872540af6c1bc2424dba1298a9727ff392b6f7f48b3e88e20cf925b7024be9992d3bbfae8820a0907edf692d95cbdde46ddda5ef7d422436779445c5e66006a42761e1f12efde0018c212f3aeb785e49712e7a9353349aaf1255dfb31b7bf60723a480d9293938e1975abf4b67f0899507e68381095cd5133756b6bd09524da07097822af81376316144558ab94d34d8647ef52a0b53d361c980562f3eaf8e1e570c06953f2b415860900000000000000f9e417d91bdda73dfddff07401576a4322fc430876ef8fa291747fd1c00b1501702244551e765b2c3624a0fdf9da58365d5044ae0097d5ab26aede004ef84405e517784f3335ac48de9ed6b8a4737797d6d383d5d20f32070e4ed6947b009ba404239452a80fb015535ae1694c3f1782a609ea6e3836e924e1b3af8603d9d9a0070badbf96cf72cde65a299ae3e581fe631ff519cb19d179d1a1ffc7cbef3caf07ceaad4fec07b63546308c9cd27370b1af4946b7eda38b056309fb1943a3f95c4b27e6e6844863847ab521e60aeeb441052ebf3b71eaece4238bac46e2db8a92b2772dbc8f8329355f2c03f2ee7fd04151e79777879fd74004f9ec1a1222319015ca9e3b14f0e45a697f901db206308f888240926741b676ca7e19a497387a5",
      "vkHash": "39640cf0b0352b1f0f4a66eed4a8bb15f13fccb5998c11a6f3aa537760d1c553"
    },
    "W_full": {
      "script": "52b60058cf827701208853b602512052797e02c0427e18786e617413433454455354583236303933304123504f4f4c0400e1f5050800000000000000007e00b77758b7757e0254207e0058cf7e7e01757e8800d600880058ce827701208800cd02512052797e02c0427e18786e617413433454455354583236303933304123504f4f4c0400e1f5050800000000000000007e00b77758b7757e0254207e0058ce7e7e01757e8800cc0088d05388d1538851798277016c8842618cd8231ef0cfb834a51353a65ca5a7442562307a1855525e894a2dd1dcddee618cd8231ef0cfb834a51353a65ca5a7442562307a1855525e894a2dd1dcddee04005279aa7ea8020400b58851790120b77754b775040000000088517900b7770120b77552790124b7770120b7758851790144b77754b775040100000088020001b520308542cb639a0e6ac414070f3be7c7e13827c7dde337c4d1202853376519fab18842392c8f40e348d26fd6d921326074e0f368ffd896785e41e32382f9ff114e6f44392c8f40e348d26fd6d921326074e0f368ffd896785e41e32382f9ff114e6f440100040052c42052797e38880051cf13433454455354583236303933304123504f4f4c880051ce13433454455354583236303933304123504f4f4c8800d50052c488517ea87ea85153c402512052797e8851d600a06951d608000052acdfb2241da16951cd007982770119876300798277011988007900b77753b7750376a9148800790117b77752b7750288ac886700798277012288007900b77752b77502522087517900b77752b775025320879b696851cc00a06951d651cc0093885253c4007982770119876300798277011988007900b77753b7750376a9148800790117b77752b7750288ac886700798277012288007900b77752b77502522087517900b77752b775025320879b696852cd51798852cc00a26952cc52d6a1695679a8203d54391fb4ed9a2cb5d31524929c96cf64eb9b1074fbec522855c86d5bcdcd8c8857795779201a145315ccbf33410a65d719312c332522c5cbb2cb5d0b62483390238110016f0058cf0058ce5a79021f01b5c91800000000000000000000000000000000000000000000000051cc0800000000000000007e00b77758b775bc7e1800000000000000000000000000000000000000000000000051d60800000000000000007e00b77758b775bc7e18000000000000000000000000000000000000000000000000000800000000000000007e00b77758b775bc7e5851c3696d6d6d6d51",
      "control": "01c3d74bf50854964abe31fc704b701577bdcfc63c4ed3363213108d43d28ad527547bce3fbff66083a0015a93883a6d4958895a5d4918bcdf709dbe818a8f846622798b2fb2e057ca5b3646d1efb74a383dd1b9a9838b05f3358614bab1d00165",
      "vk": "c7e253d6dbb0b365b15775ae9f8aa0ffcc1c8cde0bd7a4e8c0b376b0d92952a444d2615ebda233e141f4ca0a1270e1269680b20507d55f6872540af6c1bc2424dba1298a9727ff392b6f7f48b3e88e20cf925b7024be9992d3bbfae8820a0907edf692d95cbdde46ddda5ef7d422436779445c5e66006a42761e1f12efde0018c212f3aeb785e49712e7a9353349aaf1255dfb31b7bf60723a480d9293938e193ef8a08966d5ac6c99906f73caadd2b2a40ebbc4f17ec3776890a4ce49a1ec067af9fa310a3edda25d9a0bfbe144461f42dc386c8b1d84d02e14fa1951f2632209000000000000005f99c5377477775bceed64339b7c3a8363bf0d292a4a849a4b9906e8eec20b05702244551e765b2c3624a0fdf9da58365d5044ae0097d5ab26aede004ef84405e517784f3335ac48de9ed6b8a4737797d6d383d5d20f32070e4ed6947b009ba404239452a80fb015535ae1694c3f1782a609ea6e3836e924e1b3af8603d9d9a0070badbf96cf72cde65a299ae3e581fe631ff519cb19d179d1a1ffc7cbef3caf07ceaad4fec07b63546308c9cd27370b1af4946b7eda38b056309fb1943a3f95f92fbe3b23d0531ae0d505a32051071163ee3b1afc3921863a8d0c6125c7a9125994a1c0a00ce58102d127a51f437fe42805bdb21e738b8c6d277080b5a0962d047cdc61f36f8d32a5033cc58e42b153951477568c3b931cc3148eaf2460eca1",
      "vkHash": "3d54391fb4ed9a2cb5d31524929c96cf64eb9b1074fbec522855c86d5bcdcd8c"
    }
  }
});
var C4_TESTNET_ARTIFACTS = deepFreeze({
  "schema": "C4-browser-TEST",
  "id": "a627eac63b0817abe9d07584690d4b418325ed00df08f5f18e2ac0ab58ff5ae4",
  "warning": "PUBLIC TEST keys only",
  "snarkjs": "0.7.6",
  "forms": {
    "D0": {
      "wasm": "D0/D0.wasm",
      "zkey": "D0/final.zkey",
      "vk": "D0/vk.json"
    },
    "D1": {
      "wasm": "D1/D1.wasm",
      "zkey": "D1/final.zkey",
      "vk": "D1/vk.json"
    },
    "T1": {
      "wasm": "T1/T1.wasm",
      "zkey": "T1/final.zkey",
      "vk": "T1/vk.json"
    },
    "T2": {
      "wasm": "T2/T2.wasm",
      "zkey": "T2/final.zkey",
      "vk": "T2/vk.json"
    },
    "T3": {
      "wasm": "T3/T3.wasm",
      "zkey": "T3/final.zkey",
      "vk": "T3/vk.json"
    },
    "T4": {
      "wasm": "T4/T4.wasm",
      "zkey": "T4/final.zkey",
      "vk": "T4/vk.json"
    },
    "W_partial": {
      "wasm": "W_partial/W_partial.wasm",
      "zkey": "W_partial/final.zkey",
      "vk": "W_partial/vk.json"
    },
    "W_full": {
      "wasm": "W_full/W_full.wasm",
      "zkey": "W_full/final.zkey",
      "vk": "W_full/vk.json"
    }
  },
  "files": {
    "D0/D0.wasm": {
      "bytes": 388796,
      "sha256": "2b78805c590ef8c23307ca8f7fc4ee64af230a5f9cd8e8227f267daf12751f7b"
    },
    "D0/final.zkey": {
      "bytes": 43933874,
      "sha256": "dd122d025ecca402f1de2f46df4cda243188c2c5481694ada4e303595409f0d1"
    },
    "D0/vk.json": {
      "bytes": 4393,
      "sha256": "fdee18285ea0246e4624c9032d22c1983efe959f180991da8516cc680d58524d"
    },
    "D1/D1.wasm": {
      "bytes": 387224,
      "sha256": "9dd4e3baa5ef4196d079f12ba0bdf35c518bfc85db03adb570f4bc8514183012"
    },
    "D1/final.zkey": {
      "bytes": 43933918,
      "sha256": "81e99cca1664375e0a2e1058cdf06452847a8df945fa55b017b979678a1fedd3"
    },
    "D1/vk.json": {
      "bytes": 4395,
      "sha256": "2c56a8538af91f19364cab8ba08be3428d255a37e4ea5f11df6a0c5d13ee13fa"
    },
    "T1/T1.wasm": {
      "bytes": 647177,
      "sha256": "8c22d0ac648b49a0b7d028ba60240a66d1ebac58dea6a6ee32aab0748daa2e1f"
    },
    "T1/final.zkey": {
      "bytes": 75484846,
      "sha256": "715667541c918a8ef669f08d76f58cad2735c285791523e3cfc0ab388a67ebdf"
    },
    "T1/vk.json": {
      "bytes": 4022,
      "sha256": "4167a808382ffc0195918ffe5bc9d1aa8507284749ae41b27b32e74b6adb61e8"
    },
    "T2/T2.wasm": {
      "bytes": 906088,
      "sha256": "4f6ed8ca6aa568fc469cffafcb179ae7001d360e0ae415d00096d860f153cf69"
    },
    "T2/final.zkey": {
      "bytes": 117608582,
      "sha256": "a247a9ade0625d723d2168c641c252132d79eb718a3f71b0cb08730eec39746c"
    },
    "T2/vk.json": {
      "bytes": 4202,
      "sha256": "98a8f9c1374b64c741c90d98cad64a40e50fcef0f34961e8e0e46c2d748e72bf"
    },
    "T3/T3.wasm": {
      "bytes": 1164406,
      "sha256": "50dcc25025593e407be0316d02e23e3fcc8a198216e46bdcf98d01c51c1a939e"
    },
    "T3/final.zkey": {
      "bytes": 151323998,
      "sha256": "df4c7f962fff5a4192e215bc1736d46534ee24b166493156df606f2a4f250083"
    },
    "T3/vk.json": {
      "bytes": 4385,
      "sha256": "7dc85f1da8b0db4800b14ffcc5afd9f0a8c44599a262edb513efc93c06bbaf14"
    },
    "T4/T4.wasm": {
      "bytes": 1422682,
      "sha256": "6b3d5277e76640147197b4e37d58c20dee771d153aa13e4724bde49bd2b318d1"
    },
    "T4/final.zkey": {
      "bytes": 201816630,
      "sha256": "71f431c6fbb4c654a2cca397aa2f3c8ec718408fc7c425b8fadb32e9c704fb9a"
    },
    "T4/vk.json": {
      "bytes": 4574,
      "sha256": "774c45232a4a186777ebe33b1a33a4211be1e52881f2bc2789aad348b329d527"
    },
    "W_partial/W_partial.wasm": {
      "bytes": 377728,
      "sha256": "6aca70bdd9df28c6e8f0024a9ef46775728800f48cf0102b53a6c9af7857166b"
    },
    "W_partial/final.zkey": {
      "bytes": 42151010,
      "sha256": "2cb610f712bbd7dcad0bb33399891d1e054a2d3c5b0e59ace009e9bfb7790ee2"
    },
    "W_partial/vk.json": {
      "bytes": 4210,
      "sha256": "97c1218a2db0ffd67958662e01e42940fe6d0e4ebd783470236371b838bfc3cc"
    },
    "W_full/W_full.wasm": {
      "bytes": 379232,
      "sha256": "2879967a6af5463b13b48661ea066ccba7a88efc14e0059ffaabe6e87329ad9e"
    },
    "W_full/final.zkey": {
      "bytes": 42150558,
      "sha256": "f72dc97fd3df79c8120836b80136c20855aa3b4fa7ebeeb17adfe7a328586a9e"
    },
    "W_full/vk.json": {
      "bytes": 4208,
      "sha256": "b1a11dd2995f6c09db0a5df685518918506fb86a9ab3db1fc9194030df26f730"
    }
  }
});

// src/pool-worker-client.js
var PoolWorkerClient = class {
  #worker;
  #rpc;
  #onStage;
  #isReadRpc;
  #onCrash;
  #pending = null;
  #stopped = false;
  /**
   * worker: a Worker running startPoolWorker; rpc(method, params) as in @neuraiproject/neurai-rpc.
   * onCrash(error) runs when the worker fails outside a request too, so the host can lock its UI.
   */
  constructor({ worker, rpc, onStage, onCrash, isReadRpc = isPoolReadRpc }) {
    if (!worker || typeof rpc !== "function") throw new Error("PoolWorkerClient needs a worker and an rpc function");
    this.#worker = worker;
    this.#rpc = rpc;
    this.#onStage = onStage;
    this.#isReadRpc = isReadRpc;
    this.#onCrash = onCrash;
    worker.onmessage = (event) => {
      void this.#handle(event.data);
    };
    worker.onerror = (event) => {
      event?.preventDefault?.();
      const error = new Error(event?.message || "Privacy worker stopped");
      this.#stop(error);
      this.#onCrash?.(error);
    };
  }
  get busy() {
    return this.#pending !== null;
  }
  /** True after terminate() or a worker crash; create a new client to continue. */
  get stopped() {
    return this.#stopped;
  }
  #stop(error) {
    this.#stopped = true;
    this.#worker.terminate?.();
    this.#settle((p) => p.reject(error));
  }
  #settle(action) {
    const pending = this.#pending;
    this.#pending = null;
    if (pending) action(pending);
  }
  async #handle(data) {
    if (this.#stopped) return;
    if (data?.type === "rpc") {
      let reply;
      try {
        if (!this.#isReadRpc(data.method)) throw new Error("Worker RPC is not read-only");
        reply = { type: "rpc-result", id: data.id, result: await this.#rpc(data.method, data.params) };
      } catch (error) {
        const message2 = error instanceof Error ? error.message : error?.description ?? String(error);
        reply = { type: "rpc-result", id: data.id, error: message2 };
      }
      if (!this.#stopped) this.#worker.postMessage(reply);
      return;
    }
    if (data?.type === "stage") {
      this.#onStage?.(data.message);
      return;
    }
    if (!this.#pending) return;
    if (data.type === "error") this.#settle((p) => p.reject(new Error(data.message)));
    else if (data.type === "done") this.#settle((p) => p.resolve(p.result));
    else this.#pending.result[data.type] = data;
  }
  #request(type, payload = {}) {
    if (this.#stopped) return Promise.reject(new Error("Privacy worker stopped"));
    if (this.#pending) return Promise.reject(new Error("A pool operation is already running"));
    return new Promise((resolve2, reject) => {
      this.#pending = { resolve: resolve2, reject, result: {} };
      this.#worker.postMessage({ type, ...payload });
    });
  }
  /** New random identity protected by an encrypted JSON backup. */
  async create({ password }) {
    return (await this.#request("create", { password })).identity;
  }
  async restore({ backup, password }) {
    return (await this.#request("restore", { backup, password })).identity;
  }
  /** Identity derived from the wallet words (NeuraiZK/v2). */
  async derive({ family, mnemonic, passphrase = "", zkPassphrase = "", account = 0, gap, issued }) {
    return (await this.#request("derive", { family, mnemonic, passphrase, zkPassphrase, account, gap, issued })).identity;
  }
  /** Rebuild pool state and own notes; returns {result, recipient, addresses}. */
  async scan({ gap, issued, checkpoint } = {}) {
    return (await this.#request("scan", { gap, issued, checkpoint })).scan;
  }
  /** Hand out the next receiving address; returns {recipient, addresses}. */
  async newAddress({ force = false } = {}) {
    return (await this.#request("new-address", { force })).addresses;
  }
  /**
   * Build and verify one pool transaction: {action, amountAtomic, feeAtomic,
   * funding, sponsor, payout, note, recipient}. Funding inputs stay unsigned.
   */
  async prepare(request) {
    return (await this.#request("prepare", request)).prepared.result;
  }
  async lock() {
    await this.#request("lock");
  }
  terminate() {
    this.#stop(new Error("Privacy worker terminated"));
  }
};

// src/browser-chain.js
var HEX322 = /^[0-9a-f]{64}$/i;
var MAX_MONEY2 = 2100000000000000000n;
var utf86 = new TextEncoder();
function demand3(ok, reason) {
  if (!ok) throw new Error(`pool scan: ${reason}`);
}
function unhex3(hex7, name) {
  demand3(typeof hex7 === "string" && /^(?:[0-9a-f]{2})*$/i.test(hex7), `${name} is not hex`);
  return Uint8Array.from(hex7.match(/../g) ?? [], (pair2) => parseInt(pair2, 16));
}
function hex5(bytes4) {
  return Array.from(bytes4, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function concat6(...parts) {
  const out = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}
function sameOutpoint(vin, outpoint) {
  return vin?.txid === outpoint?.[0] && vin?.vout === outpoint?.[1];
}
function sats(value) {
  const str = typeof value === "number" && Number.isFinite(value) ? String(value) : value;
  demand3(typeof str === "string" && /^(?:0|[1-9]\d*)(?:\.\d+)?(?:e-?\d+)?$/i.test(str), "invalid XNA value");
  const [base, expPart] = str.toLowerCase().split("e");
  const [whole, fraction = ""] = base.split(".");
  const places = 8 - fraction.length + Number(expPart ?? 0);
  demand3(Number.isSafeInteger(places) && places >= -100 && places <= 100, "invalid XNA decimal scale");
  const digits = BigInt(whole + fraction);
  const numerator = places >= 0 ? digits * 10n ** BigInt(places) : digits;
  const denominator = places >= 0 ? 1n : 10n ** BigInt(-places);
  demand3(numerator % denominator === 0n, "nonintegral XNA amount");
  const result = numerator / denominator;
  demand3(result >= 0n && result <= MAX_MONEY2, "XNA amount out of range");
  return result;
}
function parseRecord(identity, record, cm) {
  if (!identity) return null;
  try {
    return identity.openRecord(record, cm);
  } catch {
    return null;
  }
}
function walletCheckpointTag(identity) {
  if (!identity) return null;
  return identity.fingerprint === void 0 ? identity.recipient().owner : `${identity.derivation}:${identity.storageId}`;
}
function checkpointFor({
  manifest,
  height,
  blockhash,
  birth,
  state,
  reserve,
  stateOutpoint,
  reserveOutpoint,
  transitions,
  published,
  spentBy,
  notes,
  identity
}) {
  const indexed = (tree) => [...tree].map(([index, [value, next, nextIndex]]) => [index, [String(value), String(next), nextIndex]]);
  return {
    version: 1,
    manifestId: hex5(sha256(utf86.encode(JSON.stringify(manifest)))),
    height,
    blockhash,
    birth,
    reserveAtomic: String(reserve),
    stateOutpoint,
    reserveOutpoint,
    state: {
      mode: state.mode,
      slots: [...state.slots].map(([index, value]) => [index, hex5(value)]),
      seen: indexed(state.seen),
      nfs: indexed(state.nfs)
    },
    transitions: transitions.map((t) => ({ ...t, reserveAtomic: String(t.reserveAtomic) })),
    published: published.map((e) => ({ ...e, cm: hex5(e.cm), record: hex5(e.record) })),
    spentBy: [...spentBy].map(([nf, spent]) => [String(nf), spent]),
    walletTag: walletCheckpointTag(identity),
    walletWindow: identity?.gap === void 0 ? null : { gap: identity.gap, issued: identity.issued },
    owned: [...notes.values()].map((n) => ({
      cm: n.cm,
      amountAtomic: String(n.amountAtomic),
      nf: String(n.nf),
      note: n.note,
      slot: n.slot,
      txid: n.txid,
      height: n.height,
      address: n.address ?? null
    }))
  };
}
function restoreCheckpoint(saved, manifest, limit) {
  if (saved?.version !== 1 || saved.manifestId !== hex5(sha256(utf86.encode(JSON.stringify(manifest)))) || !Number.isSafeInteger(saved.height) || saved.height < 1 || saved.height > limit || !HEX322.test(saved.blockhash) || !saved.birth || !Array.isArray(saved.stateOutpoint) || !Array.isArray(saved.transitions) || !Array.isArray(saved.published) || !Array.isArray(saved.spentBy) || !Array.isArray(saved.owned)) return null;
  try {
    const indexed = (rows) => new Map(rows.map(([index, [value, next, nextIndex]]) => [index, [BigInt(value), BigInt(next), nextIndex]]));
    const state = {
      mode: saved.state.mode,
      slots: new Map(saved.state.slots.map(([index, value]) => [index, unhex3(value, "cached note")])),
      seen: indexed(saved.state.seen),
      nfs: indexed(saved.state.nfs)
    };
    if (!state.seen.has(0) || !state.nfs.has(0) || state.slots.size !== saved.published.length || saved.stateOutpoint[1] !== 0 || !HEX322.test(saved.stateOutpoint[0])) return null;
    const transitions = saved.transitions.map((t) => ({ ...t, reserveAtomic: BigInt(t.reserveAtomic) }));
    const published = saved.published.map((e) => ({
      ...e,
      cm: unhex3(e.cm, "cached commitment"),
      record: unhex3(e.record, "cached record")
    }));
    if (published.some((e) => e.cm.length !== 32 || e.record.length !== 1024 || !Number.isSafeInteger(e.slot) || e.slot < 0 || !HEX322.test(e.txid))) return null;
    const spentBy = new Map(saved.spentBy.map(([nf, spent]) => [BigInt(nf), spent]));
    const reserve = BigInt(saved.reserveAtomic);
    const digest = poolStateDigest(state);
    return {
      state,
      digest,
      birth: saved.birth,
      stateOutpoint: saved.stateOutpoint,
      reserveOutpoint: saved.reserveOutpoint,
      reserve,
      transitions,
      published,
      spentBy,
      height: saved.height,
      blockhash: saved.blockhash,
      owned: saved.owned,
      walletWindow: saved.walletWindow,
      walletTag: saved.walletTag
    };
  } catch {
    return null;
  }
}
async function scanBrowserPool({
  rpc,
  manifest,
  identity,
  stopHeight,
  onProgress = () => {
  },
  strategy = "spent-index",
  checkpoint,
  expectedGenesis,
  expectedCommitment
}) {
  validateC4Manifest(manifest, { expectedGenesis, expectedCommitment });
  const forms = C4_FORMS;
  const vkHashes = Object.fromEntries(forms.map((f) => [f, manifest.forms[f].vkHash]));
  const mode = strategy;
  demand3(mode === "blocks" || mode === "spent-index", "unknown scan strategy");
  const makeStateScript = (digest2) => c4StateScript(manifest, digest2);
  demand3(typeof rpc === "function", "RPC function required");
  demand3(new Set(Object.values(vkHashes)).size === forms.length, "duplicate VK registry");
  const call = (method, ...params) => rpc(method, params);
  demand3(await call("getblockhash", 0) === manifest.genesis, "wrong genesis");
  const tip = await call("getbestblockhash");
  const currentHeight = await call("getblockcount");
  const height = stopHeight ?? currentHeight;
  demand3(Number.isSafeInteger(currentHeight) && Number.isSafeInteger(height) && currentHeight >= height && height >= 1, "invalid scan height");
  if (identity) {
    const recipient = identity.recipient();
    demand3(
      recipient.domain === manifest.domain && recipient.asset_id === manifest.assetId,
      "wallet belongs to another pool instance"
    );
  }
  let restored = checkpoint && mode === "spent-index" ? restoreCheckpoint(checkpoint, manifest, height) : null;
  if (restored && await call("getblockhash", restored.height) !== restored.blockhash) restored = null;
  const state = restored?.state ?? emptyPoolState();
  let digest = restored?.digest ?? poolStateDigest(state);
  const initialScript = makeStateScript(digest);
  let birth = restored?.birth ?? null;
  let stateOutpoint = restored?.stateOutpoint ?? null;
  let reserveOutpoint = restored?.reserveOutpoint ?? null;
  let reserve = restored?.reserve ?? 0n;
  const notes = /* @__PURE__ */ new Map();
  const transitions = restored?.transitions ?? [];
  const published = restored?.published ?? [];
  const cachedPublishedCount = published.length;
  const spentBy = restored?.spentBy ?? /* @__PURE__ */ new Map();
  async function applyBirth(tx, blockHeight) {
    demand3(!birth, "multiple pool births");
    let uniqueConsumed = false;
    for (const vin of tx.vin ?? []) {
      if (!vin.txid) continue;
      const parent = await call("getrawtransaction", vin.txid, true);
      const script = parent?.vout?.[vin.vout]?.scriptPubKey?.hex;
      if (typeof script === "string" && script.includes(hex5(utf86.encode(manifest.identity)))) {
        uniqueConsumed = true;
        break;
      }
    }
    demand3(uniqueConsumed, "birth did not consume UNIQUE");
    birth = { txid: tx.txid, height: blockHeight };
    stateOutpoint = [tx.txid, 0];
  }
  async function applyTransition(tx, blockHeight) {
    const vin = tx.vin ?? [];
    const witness = vin[0].txinwitness;
    demand3(
      Array.isArray(witness) && witness.length >= 5 && witness[0] === "10",
      "state spend is not MAST"
    );
    const vkHash = hex5(sha256(unhex3(witness[2], "VK")));
    const form = forms.find((name) => vkHashes[name] === vkHash);
    demand3(form, "unknown pool VK");
    const expected = manifest.forms[form];
    demand3(
      witness.length === (form.startsWith("W") ? 7 : 8) && witness[witness.length - 2] === expected.script && witness[witness.length - 1] === expected.control && witness[2] === expected.vk,
      "unexpected pool leaf, control or VK"
    );
    const expectReserve = form !== "D0";
    demand3(reserve > 0n === expectReserve, "unexpected reserve/form combination");
    if (reserveOutpoint) demand3(
      sameOutpoint(vin[1], reserveOutpoint),
      "transition skipped canonical reserve"
    );
    if (form.startsWith("D") || form.startsWith("T")) {
      demand3(witness.length >= 7, "missing publication");
      const blob = concat6(
        unhex3(witness[3], "blob first half"),
        unhex3(witness[4], "blob second half")
      );
      demand3(blob.length === 4096, "bad publication size");
      const publication = decodeC4Publication(form, blob);
      if (publication.nf) {
        const nf = decodeField(publication.nf);
        state.nfs = poolIndexedInsert("nf", state.nfs, nf);
        spentBy.set(nf, { txid: tx.txid, height: blockHeight });
      }
      const entries = publication.cms.map((cm, i) => [cm, publication.records[i]]);
      for (const [cm, record] of entries) {
        demand3(record.length === 1024, "bad encrypted record");
        const slot = state.slots.size;
        state.slots.set(slot, cm);
        state.seen = poolIndexedInsert("cm", state.seen, decodeField(cm));
        published.push({ cm, record, slot, txid: tx.txid, height: blockHeight });
      }
      state.mode = 1;
    } else {
      const nf = decodeField(unhex3(witness[3], "nullifier"));
      state.nfs = poolIndexedInsert("nf", state.nfs, nf);
      spentBy.set(nf, { txid: tx.txid, height: blockHeight });
      state.mode = form === "W_full" ? 0 : 1;
    }
    digest = poolStateDigest(state);
    demand3(
      tx.vout?.[0]?.scriptPubKey?.hex === makeStateScript(digest),
      "pool state root disagrees with block"
    );
    let newReserve = 0n;
    let newReserveOutpoint = null;
    if (form === "W_full") {
      demand3(reserveOutpoint, "empty full withdrawal");
      demand3(
        !(tx.vout ?? []).slice(1).some((v) => v.scriptPubKey?.hex?.startsWith("5120" + manifest.reserveCommitment)),
        "full withdrawal left a reserve"
      );
    } else {
      const output = tx.vout?.[1];
      demand3(
        output?.scriptPubKey?.hex === "5120" + manifest.reserveCommitment,
        "wrong reserve output"
      );
      newReserve = sats(output.value);
      demand3(newReserve > 0n, "empty reserve");
      newReserveOutpoint = [tx.txid, 1];
    }
    if (form.startsWith("T")) demand3(newReserve === reserve, "transfer changed reserve");
    else if (form.startsWith("D")) {
      demand3(newReserve > reserve, "deposit did not increase reserve");
      const previous = vin[form === "D0" ? 1 : 2];
      const spent = await call("getrawtransaction", previous.txid, true);
      demand3(
        newReserve - reserve === sats(spent?.vout?.[previous.vout]?.value),
        "reserve delta differs from deposit"
      );
    } else {
      demand3(newReserve < reserve, "withdrawal did not decrease reserve");
      const outputIndex = form === "W_full" ? 1 : 2;
      demand3(
        reserve - newReserve === sats(tx.vout?.[outputIndex]?.value),
        "reserve delta differs from withdrawal"
      );
    }
    reserve = newReserve;
    reserveOutpoint = newReserveOutpoint;
    stateOutpoint = [tx.txid, 0];
    transitions.push({
      txid: tx.txid,
      height: blockHeight,
      form,
      digest: decodeField(digest).toString(),
      reserveAtomic: reserve
    });
  }
  let scannedHeight = height;
  let finalTip = tip;
  if (mode === "blocks") {
    for (let blockHeight = manifest.birthHeight; blockHeight <= height; blockHeight++) {
      onProgress({ height: blockHeight, total: height });
      const blockHash = await call("getblockhash", blockHeight);
      const block2 = await call("getblock", blockHash, 2);
      demand3(block2?.hash === blockHash && block2?.height === blockHeight && Array.isArray(block2.tx), "block RPC mismatch");
      for (const tx of block2.tx) {
        if (!stateOutpoint) {
          if (tx.txid !== manifest.birth) continue;
          if (tx.vout?.[0]?.scriptPubKey?.hex !== initialScript) continue;
          await applyBirth(tx, blockHeight);
          continue;
        }
        if (!sameOutpoint(tx.vin?.[0], stateOutpoint)) continue;
        await applyTransition(tx, blockHeight);
      }
    }
    demand3(birth, "pool birth not found");
    demand3(await call("getbestblockhash") === tip, "tip changed during scan; retry");
    if (height === currentHeight) {
      demand3(
        await call("gettxout", ...stateOutpoint, false) !== null,
        "reconstructed state already spent"
      );
      if (reserveOutpoint) demand3(
        await call("gettxout", ...reserveOutpoint, false) !== null,
        "reconstructed reserve already spent"
      );
    }
  } else {
    const bounded = stopHeight !== void 0;
    const anchors = new Map(restored ? [[restored.height, restored.blockhash]] : []);
    async function confirmed(txid, blockHeight) {
      const tx = await call("getrawtransaction", txid, true);
      demand3(
        tx?.txid === txid && typeof tx.blockhash === "string" && tx.confirmations >= 1 && (tx.height === void 0 || tx.height === blockHeight),
        "transaction is not confirmed at the expected height"
      );
      demand3(
        await call("getblockhash", blockHeight) === tx.blockhash,
        "transaction is not in the active chain"
      );
      anchors.set(blockHeight, tx.blockhash);
      return tx;
    }
    demand3(
      Number.isSafeInteger(manifest.birthHeight) && manifest.birthHeight <= height,
      "pool birth not found"
    );
    if (!restored) {
      onProgress({ height: manifest.birthHeight, total: height });
      const born = await confirmed(manifest.birth, manifest.birthHeight);
      demand3(born.vout?.[0]?.scriptPubKey?.hex === initialScript, "pool birth not found");
      await applyBirth(born, manifest.birthHeight);
    }
    let last = restored?.transitions.at(-1)?.height ?? manifest.birthHeight;
    let unresolved = 0;
    for (; ; ) {
      let spent = null;
      try {
        spent = await call("getspentinfo", { txid: stateOutpoint[0], index: stateOutpoint[1] });
      } catch {
        spent = null;
      }
      if (spent && spent.height !== -1) {
        demand3(
          Number.isSafeInteger(spent.height) && spent.height >= last,
          "invalid or out-of-order spent index entry"
        );
        if (bounded && spent.height > height) break;
        demand3(
          spent.index === 0 && typeof spent.txid === "string",
          "state spent outside the pool contract"
        );
        const tx = await confirmed(spent.txid, spent.height);
        demand3(sameOutpoint(tx.vin?.[0], stateOutpoint), "spent index disagrees with transaction");
        onProgress({ height: spent.height, total: Math.max(height, spent.height) });
        await applyTransition(tx, spent.height);
        last = spent.height;
        unresolved = 0;
        continue;
      }
      if (bounded) break;
      const through = await call("getblockcount");
      const reserveLive = !reserveOutpoint || await call("gettxout", ...reserveOutpoint, false) !== null;
      if (await call("gettxout", ...stateOutpoint, false) !== null) {
        demand3(reserveLive, "reconstructed reserve already spent");
        demand3(Number.isSafeInteger(through) && through >= last, "invalid scan height");
        scannedHeight = through;
        break;
      }
      demand3(
        ++unresolved < 2,
        "state spend missing from the spent index; the RPC node needs -spentindex"
      );
    }
    for (const [blockHeight, blockHash] of anchors) {
      demand3(
        await call("getblockhash", blockHeight) === blockHash,
        "chain reorganized during scan; retry"
      );
    }
    if (!bounded) finalTip = await call("getbestblockhash");
  }
  if (identity) {
    const window = identity.gap === void 0 ? null : { gap: identity.gap, issued: identity.issued };
    const cached = restored && restored.walletTag === walletCheckpointTag(identity) && JSON.stringify(restored.walletWindow) === JSON.stringify(window) ? restored.owned : null;
    const oldCount = cached ? cachedPublishedCount : 0;
    if (cached) for (const item of cached) {
      const nf = BigInt(item.nf);
      const spent = spentBy.get(nf);
      notes.set(item.cm, {
        cm: item.cm,
        amountAtomic: BigInt(item.amountAtomic),
        nf,
        note: item.note,
        slot: item.slot,
        txid: item.txid,
        height: item.height,
        ...item.address ? { address: item.address } : {},
        spent: !!spent,
        ...spent ? { spentTxid: spent.txid, spentHeight: spent.height } : {}
      });
    }
    const remaining = published.slice(oldCount);
    const owned = typeof identity.scanRecords === "function" ? identity.scanRecords(remaining, cached?.map((item) => item.address).filter(Boolean)) : remaining.map((entry, position) => ({ position, owned: parseRecord(identity, entry.record, entry.cm) })).filter((x) => x.owned);
    for (const { position, owned: found, address } of owned) {
      const entry = remaining[position];
      const nf = decodeField(found.nf);
      const spent = spentBy.get(nf);
      notes.set(hex5(entry.cm), {
        cm: hex5(entry.cm),
        amountAtomic: found.amountAtomic,
        nf,
        note: hex5(found.note),
        spent: !!spent,
        ...spent ? { spentTxid: spent.txid, spentHeight: spent.height } : {},
        slot: entry.slot,
        txid: entry.txid,
        height: entry.height,
        ...address ? { address } : {}
      });
    }
  }
  const blockhash = await call("getblockhash", scannedHeight);
  const result = {
    birth,
    transitions,
    notes: Array.from(notes.values()),
    balanceAtomic: Array.from(notes.values()).reduce((sum, note) => sum + (note.spent ? 0n : note.amountAtomic), 0n),
    reserveAtomic: reserve,
    state: {
      mode: state.mode,
      slots: state.slots,
      seen: state.seen,
      nfs: state.nfs,
      digest: decodeField(digest).toString(),
      stateOutpoint,
      reserveOutpoint
    },
    height: scannedHeight,
    blockhash,
    currentTip: finalTip
  };
  result.checkpoint = checkpointFor({
    manifest,
    height: scannedHeight,
    blockhash,
    birth,
    state,
    reserve,
    stateOutpoint,
    reserveOutpoint,
    transitions,
    published,
    spentBy,
    notes,
    identity
  });
  return result;
}

// src/pool-operations.js
var hex6 = (bytes4) => Array.from(bytes4, (b) => b.toString(16).padStart(2, "0")).join("");
var MAX_ARTIFACT_BYTES = 256 * 1048576;
function summarizeScan(scan) {
  return {
    balanceAtomic: String(scan.balanceAtomic),
    reserveAtomic: String(scan.reserveAtomic),
    height: scan.height,
    notes: scan.notes.filter((n) => !n.spent).map((n) => ({ cm: n.cm, amountAtomic: String(n.amountAtomic), address: n.address ?? null })),
    transitions: scan.transitions.map((t) => ({ txid: t.txid, form: t.form, height: t.height }))
  };
}
function describeReceiving(identity, scan, { network }) {
  if (!(identity instanceof ZkWalletIdentity)) {
    return { kind: "file", current: { index: 0, address: encodeNzkAddress(identity.recipient(), network) }, used: [] };
  }
  const received = /* @__PURE__ */ new Map();
  for (const note of scan?.notes ?? []) {
    if (note.address?.chain === 0) received.set(note.address.index, (received.get(note.address.index) ?? 0n) + BigInt(note.amountAtomic));
  }
  const current = identity.currentIndex();
  return {
    kind: "derived",
    derivation: identity.derivation,
    family: identity.family,
    storageId: identity.storageId,
    fingerprint: identity.fingerprint,
    account: identity.account,
    gap: identity.gap,
    issued: identity.issued,
    maxUsed: identity.maxUsed,
    current: { index: current, address: identity.addressAt(0, current) },
    used: identity.usedIndexes.map((index) => ({ index, address: identity.addressAt(0, index), receivedAtomic: String(received.get(index) ?? 0n) }))
  };
}
var selfRecipient = (identity) => identity.selfRecipient?.() ?? identity.recipient();
function planC4Operation({
  identity,
  scan,
  action,
  amountAtomic,
  note,
  recipient,
  recipients,
  pool,
  depositLimitAtomic = MAX_ATOMIC
}) {
  if (!identity) throw new Error("Unlock the private wallet first");
  if (action === "deposit") {
    const amount2 = BigInt(amountAtomic);
    if (amount2 <= 0n || amount2 > depositLimitAtomic) throw new Error(`Deposit must be more than 0 and at most ${formatXna(depositLimitAtomic)} XNA`);
    return {
      form: scan.reserveAtomic === 0n ? "D0" : "D1",
      created: [identity.createNote(selfRecipient(identity), String(amount2))],
      consumed: void 0,
      amountAtomic: String(amount2)
    };
  }
  const consumed = scan.notes.find((n) => n.cm === note && !n.spent);
  if (!consumed) throw new Error("Selected note is no longer spendable");
  if (action === "withdraw") {
    return {
      form: BigInt(consumed.amountAtomic) === BigInt(scan.reserveAtomic) ? "W_full" : "W_partial",
      created: [],
      consumed,
      amountAtomic: String(consumed.amountAtomic)
    };
  }
  if (action !== "transfer") throw new Error("Unknown pool action");
  const targets = recipients ?? [{ recipient, amountAtomic }];
  if (!Array.isArray(targets) || targets.length < 1 || targets.length > 4) {
    throw new Error("A transfer needs between one and four private recipients");
  }
  const validated = targets.map((target) => {
    if (typeof target?.amountAtomic !== "string" || !/^[1-9][0-9]*$/.test(target.amountAtomic)) {
      throw new Error("Recipient amounts must be exact positive atomic strings");
    }
    return { descriptor: parseRecipient(target.recipient, pool), amount: BigInt(target.amountAtomic) };
  });
  const amount = validated.reduce((sum, x) => sum + x.amount, 0n);
  const total = BigInt(consumed.amountAtomic);
  if (amount > total) throw new Error("Recipient total exceeds the selected note");
  if (amount < total && targets.length === 4) throw new Error("A transfer creates at most four notes including change");
  const created = validated.map((x) => identity.createNote(x.descriptor, String(x.amount)));
  if (amount < total) created.push(identity.createNote(selfRecipient(identity), String(total - amount)));
  return { form: `T${created.length}`, created, consumed, amountAtomic: String(amount) };
}
async function loadVerifiedArtifact({
  path,
  artifacts,
  fetchArtifact,
  onProgress,
  maxBytes = MAX_ARTIFACT_BYTES,
  missingMessage = "Pool proving parameters are not available"
}) {
  const meta = artifacts.files[path];
  if (!meta || meta.bytes > maxBytes) throw new Error("Unsupported pool artifact");
  const response = await fetchArtifact(path);
  if (!response?.ok) throw new Error(missingMessage);
  const bytes4 = new Uint8Array(meta.bytes);
  let at = 0;
  if (response.body?.getReader) {
    const reader = response.body.getReader();
    let last = -1;
    for (; ; ) {
      const { value, done } = await reader.read();
      if (done) break;
      if (at + value.length > bytes4.length) throw new Error("Artifact exceeds pinned size");
      bytes4.set(value, at);
      at += value.length;
      const percent = Math.floor(at / bytes4.length * 20) * 5;
      if (percent !== last) {
        last = percent;
        onProgress?.(percent);
      }
    }
  } else {
    const whole = new Uint8Array(await response.arrayBuffer());
    if (whole.length > bytes4.length) throw new Error("Artifact exceeds pinned size");
    bytes4.set(whole);
    at = whole.length;
    onProgress?.(100);
  }
  if (at !== bytes4.length || hex6(sha256(bytes4)) !== meta.sha256) throw new Error("Pool artifact integrity mismatch");
  return bytes4;
}
async function proveC4({ form, prepared, artifacts, loadArtifact, snarkjs, onStage = () => {
} }) {
  const entry = artifacts.forms[form];
  if (!entry) throw new Error("Unknown C4 form");
  const wasm = await loadArtifact(entry.wasm);
  const zkey = await loadArtifact(entry.zkey);
  const vk = JSON.parse(new TextDecoder().decode(await loadArtifact(entry.vk)));
  onStage("Calculating private witness");
  const witness = { type: "mem" };
  await snarkjs.wtns.calculate(prepared.input, wasm, witness);
  onStage(`Generating ${form} proof locally \xB7 one thread`);
  const { proof, publicSignals } = await snarkjs.groth16.prove(zkey, witness, void 0, { singleThread: true });
  onStage("Verifying proof and transaction binding");
  if (!await snarkjs.groth16.verify(vk, publicSignals, proof)) throw new Error("Local proof verification failed");
  return { proof, publicSignals };
}
async function buildC4Transaction({
  identity,
  scan,
  manifest,
  artifacts,
  loadArtifact,
  snarkjs,
  pool,
  request,
  expectedGenesis,
  expectedCommitment,
  depositLimitAtomic,
  onStage = () => {
  }
}) {
  const plan = planC4Operation({
    identity,
    scan,
    pool,
    action: request.action,
    amountAtomic: request.amountAtomic,
    note: request.note,
    recipient: request.recipient,
    recipients: request.recipients,
    ...depositLimitAtomic === void 0 ? {} : { depositLimitAtomic }
  });
  onStage("Building note paths and transaction witness");
  const prepared = identity.prepareC4({
    manifest,
    scan,
    form: plan.form,
    created: plan.created,
    consumed: plan.consumed,
    funding: request.funding,
    sponsor: request.sponsor,
    payout: request.payout,
    feeAtomic: request.feeAtomic,
    expectedGenesis,
    expectedCommitment
  });
  const { proof, publicSignals } = await proveC4({ form: plan.form, prepared, artifacts, loadArtifact, snarkjs, onStage });
  return {
    raw: finishC4(prepared, proof, publicSignals),
    form: plan.form,
    feeAtomic: request.feeAtomic,
    stateOutpoint: scan.state.stateOutpoint,
    inputPoints: prepared.inputs.map((x) => ({ txid: x.txid, vout: x.vout })),
    amountAtomic: plan.amountAtomic
  };
}

// src/pool-worker.js
function startPoolWorker({
  scope = globalThis,
  snarkjs,
  artifactBaseUrl,
  fetchArtifact,
  manifest,
  artifacts = C4_TESTNET_ARTIFACTS,
  network = C4_TESTNET_NETWORK,
  singleThread = true,
  missingArtifactMessage,
  depositLimitAtomic,
  expectedGenesis,
  expectedCommitment,
  maxArtifactBytes = MAX_ARTIFACT_BYTES
} = {}) {
  if (!fetchArtifact && !artifactBaseUrl) throw new Error("startPoolWorker needs artifactBaseUrl or fetchArtifact");
  if (depositLimitAtomic !== void 0 && (typeof depositLimitAtomic !== "bigint" || depositLimitAtomic <= 0n)) {
    throw new Error("depositLimitAtomic must be a positive bigint");
  }
  if (manifest === void 0) {
    manifest = C4_TESTNET_MANIFEST;
    expectedCommitment ??= C4_TESTNET_COMMITMENT;
  }
  validateC4Manifest(manifest, { expectedGenesis, expectedCommitment });
  if (!Number.isSafeInteger(maxArtifactBytes) || maxArtifactBytes <= 0 || maxArtifactBytes > 256 * 1048576) {
    throw new Error("Artifact limit must be a positive integer of at most 256 MiB");
  }
  const missing = missingArtifactMessage ?? (artifactBaseUrl ? "Pool proving parameters are not available at " + artifactBaseUrl : "Pool proving parameters are not available");
  const pool = { network, domain: manifest.domain, assetId: manifest.assetId };
  const fetcher = fetchArtifact ?? ((path) => fetch(new URL(path, artifactBaseUrl)));
  let identity = null;
  let scan = null;
  let active = false;
  let rpcId = 0;
  const calls = /* @__PURE__ */ new Map();
  const post = (message2) => scope.postMessage(message2);
  const stage = (message2) => post({ type: "stage", message: message2 });
  const rpc = (method, params) => new Promise((resolve2, reject) => {
    const id = ++rpcId;
    calls.set(id, { resolve: resolve2, reject });
    post({ type: "rpc", id, method, params });
  });
  const loadArtifact = (path) => {
    const name = path.split("/").slice(-1)[0];
    stage(`Loading ${name}`);
    return loadVerifiedArtifact({
      path,
      artifacts,
      fetchArtifact: fetcher,
      missingMessage: missing,
      maxBytes: maxArtifactBytes,
      onProgress: (percent) => stage(`Loading ${name} \xB7 ${percent}%`)
    });
  };
  const receiving = () => describeReceiving(identity, scan, { network });
  const identityMessage = () => ({ type: "identity", recipient: identity.recipient(), backup: identity.backupJson(), addresses: receiving() });
  async function refresh(encodedCheckpoint) {
    let previous = scan?.checkpoint;
    if (encodedCheckpoint) {
      try {
        previous = identity.openCheckpoint(encodedCheckpoint);
      } catch {
        previous = null;
      }
    }
    stage("Reading confirmed pool state");
    scan = await scanBrowserPool({ rpc, manifest, identity, expectedGenesis, expectedCommitment, checkpoint: previous, onProgress: ({ height }) => stage(`Reading pool operation at block ${height}`) });
    let checkpoint = null;
    try {
      checkpoint = identity.sealCheckpoint(scan.checkpoint);
    } catch {
    }
    post({ type: "scan", result: summarizeScan(scan), recipient: identity.recipient(), addresses: receiving(), checkpoint });
  }
  async function prepare(data) {
    if (!identity) throw new Error("Unlock the private wallet first");
    if (!snarkjs) throw new Error("This worker was started without snarkjs, so it cannot prove");
    await refresh();
    for (const coin2 of [data.sponsor, data.funding].filter(Boolean)) await checkPoolCoin(rpc, coin2);
    const result = await buildC4Transaction({
      identity,
      scan,
      manifest,
      artifacts,
      loadArtifact,
      snarkjs,
      pool,
      request: data,
      depositLimitAtomic,
      expectedGenesis,
      expectedCommitment,
      onStage: stage
    });
    post({ type: "prepared", result });
  }
  scope.onmessage = async ({ data }) => {
    if (data?.type === "rpc-result") {
      const call = calls.get(data.id);
      if (call) {
        calls.delete(data.id);
        data.error ? call.reject(new Error(data.error)) : call.resolve(data.result);
      }
      return;
    }
    if (active) return;
    active = true;
    try {
      if (singleThread) {
        Object.defineProperty(scope.navigator ?? {}, "hardwareConcurrency", { value: 1, configurable: true });
        scope.Worker = void 0;
      }
      if (data.type === "create" || data.type === "restore") {
        identity?.lock();
        identity = null;
        scan = null;
        stage(data.type === "create" ? "Encrypting new privacy JSON" : "Unlocking privacy JSON");
        const options = { domain: manifest.domain, assetId: manifest.assetId, password: data.password };
        identity = data.type === "create" ? await BrowserTestIdentity.create(options) : await BrowserTestIdentity.fromBackup({ ...options, backup: data.backup });
        post(identityMessage());
      } else if (data.type === "derive") {
        identity?.lock();
        identity = null;
        scan = null;
        stage("Deriving the private wallet from the wallet words");
        identity = await ZkWalletIdentity.fromMnemonic({
          mnemonic: data.mnemonic,
          passphrase: data.passphrase ?? "",
          family: data.family,
          zkPassphrase: data.zkPassphrase ?? "",
          account: data.account,
          gap: data.gap,
          issued: data.issued,
          ...pool
        });
        post(identityMessage());
      } else if (data.type === "scan") {
        if (!identity) throw new Error("Unlock the private wallet first");
        if (identity instanceof ZkWalletIdentity) {
          if (data.gap !== void 0) identity.setGap(data.gap);
          if (data.issued !== void 0) identity.setIssued(data.issued);
        }
        await refresh(data.checkpoint);
      } else if (data.type === "new-address") {
        if (!(identity instanceof ZkWalletIdentity)) throw new Error("Only a wallet opened from its words can rotate addresses");
        identity.issueNext({ force: !!data.force });
        post({ type: "addresses", recipient: identity.recipient(), addresses: receiving() });
      } else if (data.type === "prepare") {
        await prepare(data);
      } else if (data.type === "lock") {
        identity?.lock();
        identity = null;
        scan = null;
      } else {
        throw new Error("Unknown worker request");
      }
      post({ type: "done" });
    } catch (error) {
      post({ type: "error", message: error instanceof Error ? error.message : String(error) });
    } finally {
      active = false;
    }
  };
  return { stop() {
    identity?.lock();
    identity = null;
    scan = null;
    scope.onmessage = null;
  } };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ATOMIC_PER_XNA,
  BN254_SCALAR_FIELD,
  BrowserTestIdentity,
  C4_FORMS,
  C4_TESTNET_ARTIFACTS,
  C4_TESTNET_COMMITMENT,
  C4_TESTNET_MANIFEST,
  C4_TESTNET_NETWORK,
  CliTestBackend,
  LEGACY_P2PKH,
  MAX_ARTIFACT_BYTES,
  MAX_ATOMIC,
  MIN_SPONSOR_CHANGE_ATOMIC,
  NZK_ARGON2ID,
  NZK_DEFAULT_GAP,
  NZK_DERIVATION,
  NZK_FAMILIES,
  NZK_HRP,
  NZK_MAX_GAP,
  NeuraiPrivacy,
  POOL_READ_RPC_METHODS,
  PoolWorkerClient,
  RESET_TESTNET_GENESIS,
  ROTATION_MAX_GAP,
  ZkWalletIdentity,
  admitTransaction,
  assertPoolChain,
  bech32mDecode,
  bech32mEncode,
  buildC4Transaction,
  c4DustAtomic,
  checkPoolCoin,
  confirmedPoolCoins,
  decodeField,
  decodeNote,
  decodeNzkAddress,
  deriveNullifierKey,
  deriveOwner,
  deriveViewPublic,
  deriveZkAddressKeys,
  deriveZkRoot,
  describeReceiving,
  encodeField,
  encodeNote,
  encodeNzkAddress,
  finishC4,
  formatXna,
  inspectFundingTransaction,
  isPoolReadRpc,
  loadRotation,
  loadVerifiedArtifact,
  noteCommitment,
  noteNullifier,
  nzkInstanceTag,
  openNoteRecord,
  openVault,
  parseRecipient,
  parseXna,
  planC4Operation,
  poseidonBytes,
  poseidonPermutation,
  prepareC4,
  proveC4,
  publicationStatus,
  publishTransaction,
  recheckInputs,
  rotationStorageKey,
  rpcAmountToSatoshis,
  saveRotation,
  sealNote,
  sealVault,
  selectPoolCoins,
  startPoolWorker,
  summarizeScan,
  validateC4Manifest,
  walletSeedFromMnemonic,
  withdrawalScript,
  zkFingerprint
});
/*! Bundled license information:

@noble/ciphers/utils.js:
  (*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) *)

@noble/curves/utils.js:
@noble/curves/abstract/modular.js:
@noble/curves/abstract/curve.js:
@noble/curves/abstract/edwards.js:
@noble/curves/abstract/montgomery.js:
@noble/curves/ed25519.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/hashes/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@scure/base/index.js:
  (*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@scure/bip39/index.js:
  (*! scure-bip39 - MIT License (c) 2022 Patricio Palladino, Paul Miller (paulmillr.com) *)
*/
//# sourceMappingURL=index.cjs.map
