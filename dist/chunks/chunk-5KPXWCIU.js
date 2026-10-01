import {
  isPoolReadRpc
} from "./chunk-ZTELRD6L.js";

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

export {
  ROTATION_MAX_GAP,
  rotationStorageKey,
  loadRotation,
  saveRotation,
  PoolWorkerClient
};
//# sourceMappingURL=chunk-5KPXWCIU.js.map
