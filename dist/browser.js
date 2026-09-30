import {
  PoolWorkerClient,
  ROTATION_MAX_GAP,
  loadRotation,
  rotationStorageKey,
  saveRotation
} from "./chunks/chunk-KTGTCIS5.js";
import {
  BN254_SCALAR_FIELD,
  BrowserTestIdentity,
  HEX32,
  MAX_ARTIFACT_BYTES,
  NZK_ARGON2ID,
  NZK_DEFAULT_GAP,
  NZK_HRP,
  NZK_MAX_GAP,
  RESET_TESTNET_GENESIS,
  ZkWalletIdentity,
  balanceText,
  bech32mDecode,
  bech32mEncode,
  buildC3Transaction,
  decodeField,
  decodeNote,
  decodeNzkAddress,
  deriveNullifierKey,
  deriveOwner,
  deriveViewPublic,
  deriveZkAddressKeys,
  deriveZkRoot,
  describeReceiving,
  descriptor,
  encodeField,
  encodeNote,
  encodeNzkAddress,
  finishC3,
  loadVerifiedArtifact,
  noteCmText,
  noteCommitment,
  noteNullifier,
  nzkInstanceTag,
  openNoteRecord,
  openVault,
  parseRecipient,
  planC3Operation,
  poseidonBytes,
  poseidonPermutation,
  prepareC3,
  proveC3,
  scanBrowserPool,
  sealNote,
  sealVault,
  startPoolWorker,
  summarizeScan,
  validateC3Manifest,
  walletSeedFromMnemonic,
  zkFingerprint
} from "./chunks/chunk-CQXLD5NS.js";
import {
  ATOMIC_PER_XNA,
  C3_TESTNET_ARTIFACTS,
  C3_TESTNET_MANIFEST,
  C3_TESTNET_NETWORK,
  C3_TEST_DEPOSIT_LIMIT_ATOMIC,
  LEGACY_P2PKH,
  MAX_ATOMIC,
  MIN_SPONSOR_CHANGE_ATOMIC,
  POOL_READ_RPC_METHODS,
  admitTransaction,
  assertPoolChain,
  checkPoolCoin,
  confirmedPoolCoins,
  formatXna,
  inspectFundingTransaction,
  isPoolReadRpc,
  parseXna,
  publicationStatus,
  publishTransaction,
  recheckInputs,
  rpcAmountToSatoshis,
  selectPoolCoins,
  withdrawalScript
} from "./chunks/chunk-NEMIRDB4.js";

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
export {
  ATOMIC_PER_XNA,
  BN254_SCALAR_FIELD,
  BrowserTestIdentity,
  C3_TESTNET_ARTIFACTS,
  C3_TESTNET_MANIFEST,
  C3_TESTNET_NETWORK,
  C3_TEST_DEPOSIT_LIMIT_ATOMIC,
  LEGACY_P2PKH,
  MAX_ARTIFACT_BYTES,
  MAX_ATOMIC,
  MIN_SPONSOR_CHANGE_ATOMIC,
  NZK_ARGON2ID,
  NZK_DEFAULT_GAP,
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
  buildC3Transaction,
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
  finishC3,
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
  planC3Operation,
  poseidonBytes,
  poseidonPermutation,
  prepareC3,
  proveC3,
  publicationStatus,
  publishTransaction,
  recheckInputs,
  rotationStorageKey,
  rpcAmountToSatoshis,
  saveRotation,
  scanBrowserPool,
  sealNote,
  sealVault,
  selectPoolCoins,
  startPoolWorker,
  summarizeScan,
  validateC3Manifest,
  walletSeedFromMnemonic,
  withdrawalScript,
  zkFingerprint
};
//# sourceMappingURL=browser.js.map
