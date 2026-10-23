import {
  C6SponsorScanCheckpoint,
  SponsorJournal,
  admitTransaction,
  assertPoolChain,
  c6SponsorIntent,
  isPoolReadRpc,
  prepareSponsorSweep,
  readSponsorTransaction,
  scanC6SponsorChain,
  validateC6SponsorDeployment,
  validateSponsorSignature
} from "./chunk-YYD6OW57.js";

// src/wallet-service-rpc.js
var HASH = /^[0-9a-f]{64}$/;
var own = (object2, key) => Object.prototype.hasOwnProperty.call(object2, key);
var object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var READ_METHODS = /* @__PURE__ */ new Set([
  "getblockchaininfo",
  "getblockcount",
  "getblockhash",
  "getblockheader",
  "getbestblockhash",
  "getblock",
  "getspentinfo",
  "getrawmempool",
  "decoderawtransaction",
  "getprivacypoolinfo",
  "getprivacypoolupdates",
  "getaddressbalance",
  "getaddressdeltas",
  "getaddressutxos",
  "getaddressmempool",
  "getrawtransaction",
  "gettxout",
  "estimatesmartfee",
  "getassetdata",
  "listassets",
  "listassetbalancesbyaddress",
  "listaddressesbyasset",
  "checkaddresstag",
  "listtagsforaddress",
  "listaddressesfortag",
  "checkaddressrestriction",
  "checkglobalrestriction",
  "getverifierstring",
  "isvalidverifierstring",
  "listdepinaddresses",
  "listdepinholders",
  "checkdepinvalidity",
  "validateaddress",
  "getpubkey",
  "testmempoolaccept"
]);
function createWalletServiceRpc({ request, hello, expectedGenesis, expectedServiceId } = {}) {
  if (typeof request !== "function") throw new TypeError("A correlated WSS request function is required");
  if (typeof expectedGenesis !== "string" || !HASH.test(expectedGenesis)) throw new Error("Pin the expected wallet-service genesis");
  if (!object(hello) || hello.protocol !== "wss/2" || hello.exact_amounts !== true || hello.wallet_rpc?.amounts !== "rpc-native-units" || hello.wallet_rpc?.numeric_encoding !== "safe-number-or-string" || !Array.isArray(hello.wallet_rpc?.methods) || hello.wallet_rpc.methods.some((m) => typeof m !== "string")) {
    throw new Error("The wallet service must negotiate wss/2 with native exact wallet RPC");
  }
  if (hello.genesis_hash !== expectedGenesis) throw new Error("Wallet-service genesis mismatch");
  if (expectedServiceId !== void 0 && (typeof expectedServiceId !== "string" || !expectedServiceId || hello.service_id !== expectedServiceId)) {
    throw new Error("Wallet-service identity mismatch");
  }
  const advertised = new Set(hello.wallet_rpc.methods);
  return async (method, params = []) => {
    if (!Array.isArray(params)) throw new TypeError("RPC params must be an array");
    const broadcast = method === "sendrawtransaction";
    if (broadcast) {
      if (params.length !== 1 || typeof params[0] !== "string" || params[0].length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(params[0])) {
        throw new TypeError("WSS broadcast requires exactly one raw transaction hex argument");
      }
    } else if (!READ_METHODS.has(method) || !advertised.has(method)) {
      throw new Error("Wallet-service RPC method unavailable: " + String(method));
    }
    let reply;
    try {
      reply = await request(
        broadcast ? "tx.broadcast" : "rpc.call",
        broadcast ? { rawtx: params[0] } : { method, params }
      );
    } catch (cause) {
      const error = new Error("Wallet-service transport failed", { cause });
      if (broadcast) error.uncertain = true;
      throw error;
    }
    if (!object(reply) || own(reply, "error") && reply.error !== null && (!object(reply.error) || own(reply, "result")) || !own(reply, "result") && !object(reply.error) || own(reply, "result") && reply.result === void 0) {
      const error = new Error("Invalid wallet-service RPC response");
      if (broadcast) error.uncertain = true;
      throw error;
    }
    if (object(reply.error)) {
      const error = new Error(typeof reply.error.message === "string" ? reply.error.message : "Wallet-service RPC failed");
      const nodeCode = reply.error.node_code;
      if (Number.isInteger(nodeCode) && nodeCode < 0) error.code = nodeCode;
      else if (Number.isInteger(reply.error.code) && reply.error.code >= 1e3) error.code = reply.error.code;
      if (Number.isInteger(reply.error.code)) error.serviceCode = reply.error.code;
      if (Number.isInteger(reply.error.retry_after_seconds) && reply.error.retry_after_seconds > 0) {
        error.retryAfterSeconds = reply.error.retry_after_seconds;
      }
      if (broadcast && !(Number.isInteger(nodeCode) && nodeCode < 0)) error.uncertain = true;
      throw error;
    }
    if (broadcast) {
      if (!object(reply.result) || typeof reply.result.txid !== "string" || !HASH.test(reply.result.txid)) {
        throw Object.assign(new Error("Invalid wallet-service broadcast result"), { uncertain: true });
      }
      return reply.result.txid;
    }
    return reply.result;
  };
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
        const message = error instanceof Error ? error.message : error?.description ?? String(error);
        reply = { type: "rpc-result", id: data.id, error: message };
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
    return new Promise((resolve, reject) => {
      this.#pending = { resolve, reject, result: {} };
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

// src/sponsor-store.js
var IndexedDbSponsorStore = class {
  #database;
  constructor({ indexedDB = globalThis.indexedDB, name = "neurai-sponsor-journal-v1" } = {}) {
    if (!indexedDB || typeof name !== "string" || !name) throw new Error("IndexedDB sponsor storage is required");
    this.#database = new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("journals");
      request.onerror = () => reject(request.error ?? new Error("Sponsor database open failed"));
      request.onblocked = () => reject(new Error("Sponsor database upgrade is blocked"));
      request.onsuccess = () => resolve(request.result);
    });
  }
  async #run(key, expected, replacement, write) {
    const db = await this.#database;
    return new Promise((resolve, reject) => {
      const tx = write ? db.transaction("journals", "readwrite", { durability: "strict" }) : db.transaction("journals", "readonly");
      const store = tx.objectStore("journals");
      const request = store.get(key);
      let result;
      request.onsuccess = () => {
        const current = request.result ?? null;
        if (write) {
          result = current === expected;
          if (result) store.put(replacement, key);
        } else result = current;
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = tx.onerror = () => reject(tx.error ?? new Error("Sponsor storage transaction failed"));
    });
  }
  read(key) {
    return this.#run(key, null, null, false);
  }
  compareAndSwap(key, expected, replacement) {
    return this.#run(key, expected, replacement, true);
  }
  async close() {
    (await this.#database).close();
  }
};

// src/c6-sponsor-flow.js
var clone = (s) => JSON.parse(JSON.stringify(s));
var HASH2 = /^[0-9a-f]{64}$/;
var C6SponsorFlow = class {
  #store;
  #key;
  #journal;
  #rpc;
  #deployments;
  #locks;
  #fee;
  #sign;
  #checkpoint;
  #checkedRevision = null;
  constructor({ store, genesis, walletId, budgetAtomic, rpc, deployments, locks = globalThis.navigator?.locks, sweepFeeAtomic, sign }) {
    if (!locks || typeof locks.request !== "function") throw Error("Cross-tab Web Locks are required for C6 sponsorship");
    if (typeof rpc !== "function" || typeof sign !== "function" || typeof sweepFeeAtomic !== "function") throw Error("C6 RPC, local signer and bounded sweep fee policy required");
    this.#store = store;
    this.#key = `neurai:c6:flow:${genesis}:${walletId}`;
    this.#journal = new SponsorJournal({ store, genesis, walletId, budgetAtomic });
    try {
      this.#checkpoint = new C6SponsorScanCheckpoint({ store, genesis, walletId });
    } catch {
      this.#checkpoint = null;
    }
    this.#rpc = rpc;
    this.#deployments = clone(deployments).map(validateC6SponsorDeployment);
    this.#locks = locks;
    this.#fee = sweepFeeAtomic;
    this.#sign = sign;
  }
  #exclusive(fn) {
    return this.#locks.request(this.#key, { mode: "exclusive" }, fn);
  }
  #decode(raw) {
    if (typeof raw !== "string" || raw.length > 4e6) throw Error("Missing or oversized C6 flow metadata; restore the complete backup");
    const s = JSON.parse(raw);
    if (s.schema !== "neurai-c6-flow-test-v1" || !Array.isArray(s.intents) || !Array.isArray(s.sweeps) || !Array.isArray(s.prepared)) throw Error("Invalid C6 flow metadata");
    const ids = /* @__PURE__ */ new Set(), points = /* @__PURE__ */ new Set();
    for (const i of s.intents) {
      if (!HASH2.test(i.operationId) || !this.#deployments.some((d) => d.commitment === i.pool) || ids.has(i.operationId) || !Array.isArray(i.nullifiers) || i.nullifiers.some((n) => !HASH2.test(n))) throw Error("Invalid C6 intent metadata");
      ids.add(i.operationId);
    }
    for (const t of [...s.sweeps, ...s.prepared]) {
      if (!HASH2.test(t.txid) || readSponsorTransaction(t.raw).txid !== t.txid) throw Error("Corrupt persisted signed transaction");
      if (s.sweeps.includes(t)) {
        const decoded = readSponsorTransaction(t.raw);
        if (points.has(t.outpoint) || decoded.inputs.length !== 1 || decoded.outputs.length !== 1 || `${decoded.inputs[0].txid}:${decoded.inputs[0].vout}` !== t.outpoint) throw Error("Invalid persisted sweep");
        points.add(t.outpoint);
      } else {
        const intent = s.intents.find((i) => i.operationId === t.operationId);
        const deployment = this.#deployments.find((d) => d.commitment === intent?.pool);
        if (!ids.has(t.operationId) || c6SponsorIntent(t.raw, deployment).operationId !== t.operationId) throw Error("Prepared operation without matching intent");
      }
    }
    return s;
  }
  async #load() {
    return this.#decode(await this.#store.read(this.#key));
  }
  async #save(update) {
    const raw = await this.#store.read(this.#key), s = this.#decode(raw);
    update(s);
    const next = JSON.stringify(s);
    this.#decode(next);
    if (!await this.#store.compareAndSwap(this.#key, raw, next)) throw Error("Concurrent flow update; stop and rescan");
    return s;
  }
  async initialize({ create = false } = {}) {
    return this.#exclusive(async () => {
      await assertPoolChain(this.#rpc, { genesis: (await this.#journal.initialize({ create })).genesis });
      if (await this.#store.read(this.#key) === null) {
        if (!create) throw Error("C6 flow metadata missing; restore the full backup");
        const state = await this.#journal.snapshot();
        if (state.operations.length) throw Error("Cannot reset metadata for an existing sponsor history");
        await this.#store.compareAndSwap(this.#key, null, JSON.stringify({ schema: "neurai-c6-flow-test-v1", intents: [], sweeps: [], prepared: [] }));
      }
      await this.#load();
      return this.#journal.snapshot();
    });
  }
  async #scan(options = {}) {
    if (options.signal?.aborted) throw Error("C6 scan cancelled");
    if ((await this.#rpc("getblockchaininfo"))?.zk_portable_tree?.active_for_next_block !== true) throw Error("C6 verification is not active; keep reservations");
    const snapshot = await this.#journal.snapshot(), meta = await this.#load();
    if (this.#checkedRevision === snapshot.revision && snapshot.tip && await this.#rpc("getbestblockhash") === snapshot.tip.hash) {
      await assertPoolChain(this.#rpc, { genesis: snapshot.genesis });
      return snapshot;
    }
    const observation = await scanC6SponsorChain({ rpc: this.#rpc, snapshot, deployments: this.#deployments, intents: meta.intents, checkpoint: this.#checkpoint ?? void 0, ...options });
    const result = await this.#journal.reconcile(observation);
    this.#checkedRevision = result.revision;
    return result;
  }
  scan(options = {}) {
    return this.#exclusive(() => this.#scan(options));
  }
  snapshot() {
    return this.#journal.snapshot();
  }
  pending() {
    return this.#exclusive(async () => {
      const state = await this.#scan(), meta = await this.#load();
      return state.operations.filter((op) => op.privateOperation === "pending").flatMap((op) => {
        const tx = meta.prepared.filter((t) => t.operationId === op.operationId).at(-1);
        const input = tx ? readSponsorTransaction(tx.raw).inputs[2] : null;
        const row = input ? op.sponsors.find((s) => s.offer.outpoint === `${input.txid}:${input.vout}`) : null;
        return tx && row && !row.spentBy && !row.sweepTxid ? [{ operationId: tx.operationId, txid: tx.txid }] : [];
      });
    });
  }
  async backup() {
    return this.#exclusive(async () => ({ schema: "neurai-c6-backup-test-v1", journal: await this.#journal.export(), flow: JSON.stringify(await this.#load()) }));
  }
  async restore(backup) {
    return this.#exclusive(async () => {
      if (backup?.schema !== "neurai-c6-backup-test-v1") throw Error("Complete C6 backup required");
      this.#decode(backup.flow);
      if (await this.#store.read(this.#key) !== null) throw Error("Cannot replace existing C6 flow history");
      await this.#journal.restore(backup.journal);
      if (!await this.#store.compareAndSwap(this.#key, null, backup.flow)) throw Error("Concurrent restore; retain backup and stop");
      return this.#scan();
    });
  }
  async authorize({ raw, pool, notes, budgetAtomic, offer }) {
    return this.#exclusive(async () => {
      const d = this.#deployments.find((d2) => d2.commitment === pool);
      if (!d) throw Error("Unconfigured C6 pool");
      const intent = c6SponsorIntent(raw, d);
      if (JSON.stringify([...intent.nullifiers].sort()) !== JSON.stringify(notes.map((n) => n.nf).sort())) throw Error("Prepared proof does not match reserved notes");
      const meta = await this.#load(), old = meta.intents.find((i) => i.operationId === intent.operationId);
      if (!old) await this.#save((s) => s.intents.push(intent));
      const before = await this.#journal.snapshot();
      if (!before.operations.some((o) => o.operationId === intent.operationId)) await this.#journal.reserveOperation({ operationId: intent.operationId, budgetAtomic, notes });
      await this.#scan();
      const signed = await this.#journal.signAuthorization(intent.operationId, offer, { rpc: this.#rpc, sign: ({ offer: offer2, hashType }) => this.#sign({ raw, offer: offer2, hashType, index: 2 }) });
      if (c6SponsorIntent(signed, d).operationId !== intent.operationId) throw Error("Signer changed private C6 intent");
      const admitted = await admitTransaction(this.#rpc, signed);
      await this.#save((s) => s.prepared.push({ operationId: intent.operationId, raw: signed, txid: admitted.txid }));
      return { operationId: intent.operationId, raw: signed, txid: admitted.txid };
    });
  }
  async #send(tx) {
    const snapshot = await this.#journal.snapshot();
    await assertPoolChain(this.#rpc, { genesis: snapshot.genesis });
    let known;
    try {
      known = await this.#rpc("getrawtransaction", [tx.txid, true]);
    } catch (e) {
      if (e?.code !== -5) throw Error("Publication status unresolved; retain signed bytes");
    }
    if (known) {
      if (known.txid !== tx.txid) throw Error("RPC transaction mismatch");
      if (known.confirmations > 0) return { txid: tx.txid, status: "confirmed" };
      const pending = await this.#rpc("getrawmempool");
      if (!Array.isArray(pending) || pending.some((id) => !HASH2.test(id))) throw Error("Invalid mempool observation");
      if (pending.includes(tx.txid)) return { txid: tx.txid, status: "mempool" };
    }
    const accepted = await admitTransaction(this.#rpc, tx.raw);
    if (accepted.txid !== tx.txid) throw Error("Persisted transaction id mismatch");
    try {
      if (await this.#rpc("sendrawtransaction", [tx.raw]) !== tx.txid) throw Error("Unexpected publication id");
    } catch (e) {
      throw Object.assign(Error("Publication uncertain; no replacement authorization allowed"), { uncertain: true });
    }
    return { txid: tx.txid, status: "mempool" };
  }
  publish(operationId) {
    return this.#exclusive(async () => {
      const state = await this.#scan(), op = state.operations.find((o) => o.operationId === operationId);
      if (!op || op.privateOperation !== "pending") throw Error("Private operation no longer pending");
      const tx = (await this.#load()).prepared.filter((t) => t.operationId === operationId).at(-1);
      if (!tx) throw Error("Signed C6 operation missing");
      const input = readSponsorTransaction(tx.raw).inputs[2], row = op.sponsors.find((s) => s.offer.outpoint === `${input.txid}:${input.vout}`);
      if (!row || row.spentBy || row.sweepTxid) throw Error("This sponsor was spent or scheduled for recovery; do not publish its authorization");
      return this.#send(tx);
    });
  }
  async #sweep(outpoint) {
    const snapshot = await this.#journal.snapshot();
    const row = snapshot.operations.flatMap((o) => o.sponsors).find((s) => s.offer.outpoint === outpoint);
    if (!row || row.spentBy) return null;
    let tx = (await this.#load()).sweeps.find((t) => t.outpoint === outpoint);
    if (!tx) {
      if (row.sweepTxid) throw Error("Sweep bytes missing; recover the complete backup before retrying");
      const prepared = await this.#journal.prepareSweep(outpoint, { rpc: this.#rpc, feeAtomic: await this.#fee(clone(row.offer)), sign: ({ raw, offer, hashType }) => this.#sign({ raw, offer, hashType, index: 0 }) });
      tx = { raw: prepared.raw, txid: prepared.txid, outpoint };
      await this.#save((s) => s.sweeps.push(tx));
    }
    const decoded = readSponsorTransaction(tx.raw), fee = BigInt(row.offer.inputAtomic) - BigInt(decoded.outputs[0].valueAtomic);
    if (fee <= 0n || fee > BigInt(row.offer.inputAtomic) - BigInt(row.offer.changeAtomic)) throw Error("Persisted sweep exceeds authorization budget");
    validateSponsorSignature(tx.raw, row.offer, prepareSponsorSweep(row.offer, String(fee)));
    return this.#send(tx);
  }
  /** Explicit recovery of a still-pending authorization. This invalidates its
   * sponsor but does not cancel the portable private proof or free notes. */
  sweep(outpoint) {
    return this.#exclusive(async () => {
      await this.#scan();
      return this.#sweep(outpoint);
    });
  }
  /** Automatic cleanup only after the private operation confirms/conflicts.
   * A pending legitimate sponsor is never swept merely because time elapsed. */
  tick({ autoSweep = false, ...options } = {}) {
    return this.#exclusive(async () => {
      const state = await this.#scan(options), sweeps = [];
      if (autoSweep) {
        for (const op of state.operations) for (const row of op.sponsors) if (!row.spentBy && (op.privateOperation !== "pending" || row.sweepTxid)) sweeps.push(await this.#sweep(row.offer.outpoint));
      }
      return { snapshot: await this.#journal.snapshot(), sweeps };
    });
  }
};

// src/c6-worker-client.js
function errorText(value, depth = 0) {
  if (depth > 4) return "C6 request failed";
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    for (const key of ["message", "description"]) if (typeof value[key] === "string" && value[key].trim()) return value[key];
    if (value.error !== void 0) return errorText(value.error, depth + 1);
  }
  return "C6 request failed";
}
var C6WorkerClient = class {
  #worker;
  #rpc;
  #store;
  #stage;
  #pending = null;
  #stopped = false;
  constructor({ worker, rpc, store, onStage, onCrash }) {
    if (!worker || typeof rpc !== "function" || !store?.read || !store?.compareAndSwap) throw Error("C6 worker, RPC and durable CAS store required");
    this.#worker = worker;
    this.#rpc = rpc;
    this.#store = store;
    this.#stage = onStage;
    worker.onmessage = (e) => {
      void this.#handle(e.data);
    };
    worker.onerror = (e) => {
      e.preventDefault?.();
      const error = Error(e.message || "C6 worker stopped");
      this.terminate(error);
      onCrash?.(error);
    };
    worker.onmessageerror = () => {
      const error = Error("C6 worker message could not be decoded");
      this.terminate(error);
      onCrash?.(error);
    };
  }
  get stopped() {
    return this.#stopped;
  }
  async #handle(data) {
    if (this.#stopped) return;
    if (["rpc", "journal-read", "journal-write"].includes(data?.type)) {
      let result, error;
      try {
        if (data.type === "rpc") {
          if (!["getblockchaininfo", "getblockhash", "getblockcount", "getbestblockhash", "getblock", "getrawtransaction", "gettxout", "getspentinfo", "getprivacypoolupdates"].includes(data.method)) throw Error("C6 worker RPC must be read-only");
          result = await this.#rpc(data.method, data.params);
          if (result === void 0) throw Error("C6 RPC returned no result: " + data.method);
          if (result?.error) throw Error(errorText(result.error));
        } else {
          if (typeof data.key !== "string" || data.key.length > 200) throw Error("C6 journal key");
          if (data.type === "journal-write") {
            if (typeof data.replacement !== "string" || data.replacement.length > 8001e3 || !(data.expected === null || typeof data.expected === "string")) throw Error("C6 encrypted journal bounds");
            result = await this.#store.compareAndSwap(data.key, data.expected, data.replacement);
          } else result = await this.#store.read(data.key);
        }
      } catch (e) {
        error = errorText(e);
      }
      if (!this.#stopped) this.#worker.postMessage({ type: data.type === "rpc" ? "rpc-result" : "journal-result", id: data.id, result, error });
      return;
    }
    if (data?.type === "stage") {
      this.#stage?.(data.message);
      return;
    }
    if (!this.#pending) return;
    if (data.type === "done") {
      const p = this.#pending;
      this.#pending = null;
      p.resolve(p.result);
    } else if (data.type === "error") {
      const p = this.#pending;
      this.#pending = null;
      p.reject(Error(errorText(data.message)));
    } else this.#pending.result[data.type] = data;
  }
  request(type, payload = {}) {
    if (this.#stopped) return Promise.reject(Error("C6 worker terminated"));
    if (this.#pending) return Promise.reject(Error("C6 operation already running"));
    return new Promise((resolve, reject) => {
      this.#pending = { resolve, reject, result: {} };
      try {
        this.#worker.postMessage({ type, ...payload });
      } catch (e) {
        this.terminate(Error(errorText(e)));
      }
    });
  }
  derive(options) {
    return this.request("derive", options);
  }
  openJournal(options = {}) {
    return this.request("journal-open", options);
  }
  scan() {
    return this.request("scan");
  }
  async prepare(options) {
    return (await this.request("prepare", options)).prepared.result;
  }
  async rebuild(id, options = {}) {
    return (await this.request("rebuild", { ...options, id })).prepared.result;
  }
  async recordSigned(id, raw) {
    const reply = await this.request("record-signed", { id, raw });
    return { ...reply.signed.result, ...reply.journal ? { journal: reply.journal } : {} };
  }
  broadcastAttempt(id) {
    return this.request("record-broadcast", { id });
  }
  async backup() {
    return (await this.request("journal-backup")).backup.result;
  }
  newAddress() {
    return this.request("new-address");
  }
  releaseDraft(id) {
    return this.request("release-draft", { id });
  }
  terminate(error = Error("C6 worker terminated")) {
    this.#stopped = true;
    this.#worker.terminate?.();
    this.#pending?.reject(error);
    this.#pending = null;
  }
};

export {
  createWalletServiceRpc,
  ROTATION_MAX_GAP,
  rotationStorageKey,
  loadRotation,
  saveRotation,
  PoolWorkerClient,
  IndexedDbSponsorStore,
  C6SponsorFlow,
  C6WorkerClient
};
//# sourceMappingURL=chunk-UHSGQFHN.js.map
