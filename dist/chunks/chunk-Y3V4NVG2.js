import {
  rpcAmountToSatoshis
} from "./chunk-WIDDQ5UR.js";

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

// src/pool-client.js
var LEGACY_P2PKH = /^76a914[0-9a-f]{40}88ac$/;
var STRICT_SCRIPT = /^(?:52|53)20[0-9a-f]{64}$/;
var accepts = (script) => LEGACY_P2PKH.test(script) || STRICT_SCRIPT.test(script);
var POOL_READ_RPC_METHODS = Object.freeze([
  "getblockchaininfo",
  "getblockhash",
  "getbestblockhash",
  "getblockcount",
  "getblock",
  "getrawtransaction",
  "gettxout",
  "getspentinfo",
  "getprivacypoolupdates"
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
    const coin = { ...row, vout: row.outputIndex, valueSats: String(row.satoshis), scriptHex: row.script };
    coins.push(coin);
  }
  return coins;
}
async function checkPoolCoin(rpc, coin) {
  const live = await rpc("gettxout", [coin.txid, coin.vout, true]);
  if (!live || live.confirmations < 1 || live.scriptPubKey?.hex !== coin.scriptHex || !accepts(coin.scriptHex)) {
    throw new Error("Funding coin is spent, unconfirmed or unsupported");
  }
  if (rpcAmountToSatoshis(live.value).toString() !== String(coin.valueSats)) throw new Error("Funding value mismatch");
}
async function withdrawalScript(rpc, address) {
  const result = await rpc("validateaddress", [String(address ?? "").trim()]);
  if (!result?.isvalid || !accepts(result.scriptPubKey ?? "")) throw new Error("Withdrawals from this pool require a Legacy, PQ or ECDSA address");
  return result.scriptPubKey;
}
async function recheckInputs(rpc, manifest, points) {
  await assertPoolChain(rpc, manifest);
  for (const p of points) {
    if (!await rpc("gettxout", [p.txid, p.vout, true])) throw new Error("An input was spent while preparing. Refresh and rebuild the transaction.");
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

// src/journal-store.js
var IndexedDbJournalStore = class {
  #database;
  constructor({ indexedDB = globalThis.indexedDB, name = "neurai-sponsor-journal-v1" } = {}) {
    if (!indexedDB || typeof name !== "string" || !name) throw new Error("IndexedDB journal storage is required");
    this.#database = new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("journals");
      request.onerror = () => reject(request.error ?? new Error("Journal database open failed"));
      request.onblocked = () => reject(new Error("Journal database upgrade is blocked"));
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
      tx.onabort = tx.onerror = () => reject(tx.error ?? new Error("Journal storage transaction failed"));
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

// src/c7-worker-client.js
function errorText(value, depth = 0) {
  if (depth > 4) return "C7 request failed";
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    for (const key of ["message", "description"]) if (typeof value[key] === "string" && value[key].trim()) return value[key];
    if (value.error !== void 0) return errorText(value.error, depth + 1);
  }
  return "C7 request failed";
}
var C7WorkerClient = class {
  #worker;
  #rpc;
  #store;
  #stage;
  #pending = null;
  #stopped = false;
  constructor({ worker, rpc, store, onStage, onCrash }) {
    if (!worker || typeof rpc !== "function" || !store?.read || !store?.compareAndSwap) throw Error("C7 worker, RPC and durable CAS store required");
    this.#worker = worker;
    this.#rpc = rpc;
    this.#store = store;
    this.#stage = onStage;
    worker.onmessage = (e) => {
      void this.#handle(e.data);
    };
    worker.onerror = (e) => {
      e.preventDefault?.();
      const error = Error(e.message || "C7 worker stopped");
      this.terminate(error);
      onCrash?.(error);
    };
    worker.onmessageerror = () => {
      const error = Error("C7 worker message could not be decoded");
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
          if (!["getblockchaininfo", "getblockhash", "getblockcount", "getbestblockhash", "getblock", "getrawtransaction", "gettxout", "getspentinfo", "getprivacypoolupdates"].includes(data.method)) throw Error("C7 worker RPC must be read-only");
          result = await this.#rpc(data.method, data.params);
          if (result === void 0) throw Error("C7 RPC returned no result: " + data.method);
          if (result?.error) throw Error(errorText(result.error));
        } else {
          if (typeof data.key !== "string" || data.key.length > 200) throw Error("C7 journal key");
          if (data.type === "journal-write") {
            if (typeof data.replacement !== "string" || data.replacement.length > 8001e3 || !(data.expected === null || typeof data.expected === "string")) throw Error("C7 encrypted journal bounds");
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
    if (this.#stopped) return Promise.reject(Error("C7 worker terminated"));
    if (this.#pending) return Promise.reject(Error("C7 operation already running"));
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
  terminate(error = Error("C7 worker terminated")) {
    this.#stopped = true;
    this.#worker.terminate?.();
    this.#pending?.reject(error);
    this.#pending = null;
  }
};

export {
  createWalletServiceRpc,
  LEGACY_P2PKH,
  POOL_READ_RPC_METHODS,
  isPoolReadRpc,
  assertPoolChain,
  confirmedPoolCoins,
  checkPoolCoin,
  withdrawalScript,
  recheckInputs,
  admitTransaction,
  inspectFundingTransaction,
  publishTransaction,
  publicationStatus,
  IndexedDbJournalStore,
  C7WorkerClient
};
//# sourceMappingURL=chunk-Y3V4NVG2.js.map
