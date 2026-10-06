/* Disposable progress of the sponsor scanner's pool state walk.
 *
 * Stored next to the sponsor journal in the application's CAS store, under its
 * own key, so wallets need no extra integration. It only holds public chain
 * data: for each pinned pool, a confirmed prefix of the state chain (the state
 * outpoint and opening reached, and the intent/nullifier events seen on the
 * way). Saved prefixes end at least CHECKPOINT_DEPTH blocks below the scanned
 * tip so ordinary reorganizations leave them valid.
 *
 * The scanner never trusts it blindly: the saved block must still be on the
 * active chain, the walk must continue from the saved opening, and the live
 * state UTXO is checked at the end. Any mismatch discards the checkpoint and
 * the pool is walked again from its pinned anchor. Deleting it never changes
 * the journal, budgets or reservations.
 */
const TYPE = 'neurai-c6-sponsor-scan-v1';
const HASH = /^[0-9a-f]{64}$/;
const OPENING = /^[0-9a-f]{290}$/;
const MAX_EVENTS = 4096;
const MAX_BYTES = 2 * 1024 * 1024;

/** Blocks below the scanned tip a saved state prefix must end at. */
export const CHECKPOINT_DEPTH = 6;

const validEvent = e => e && HASH.test(e.txid) && HASH.test(e.operationId) && Number.isSafeInteger(e.height) &&
  Array.isArray(e.nfs) && e.nfs.length <= 2 && e.nfs.every(n => HASH.test(n));

export class C6SponsorScanCheckpoint {
  #store; #key;
  constructor({ store, genesis, walletId }) {
    if (!store?.read || !store?.compareAndSwap) throw Error('C6 sponsor scan checkpoint store required');
    if (!HASH.test(genesis) || !HASH.test(walletId)) throw Error('C6 sponsor scan checkpoint identity required');
    this.#store = store;
    this.#key = `neurai:c6:sponsor-scan:v1:${genesis}:${walletId}`;
  }

  /**
   * Saved prefixes keyed by pool commitment, keeping only those that match a
   * pinned deployment. A damaged or foreign cache is ignored; storage errors
   * propagate like any other journal read.
   */
  async load(deployments) {
    const raw = await this.#store.read(this.#key);
    if (raw === null) return new Map();
    try {
      if (typeof raw !== 'string' || raw.length > MAX_BYTES) throw Error('size');
      const value = JSON.parse(raw);
      if (value?.type !== TYPE || !Array.isArray(value.pools)) throw Error('type');
      const out = new Map();
      for (const p of value.pools) {
        const d = deployments.find(x => x.commitment === p?.commitment);
        if (!d || p.anchor !== d.anchor.outpoint || !Number.isSafeInteger(p.height) || p.height <= d.anchor.height || !HASH.test(p.hash) ||
            !/^[0-9a-f]{64}:0$/.test(p.point) || !OPENING.test(p.opening) || !Array.isArray(p.events) || !p.events.length ||
            p.events.length > MAX_EVENTS || !p.events.every(validEvent)) continue;
        let last = d.anchor.height;
        if (p.events.some(e => { const bad = e.height < last; last = e.height; return bad; }) || last !== p.height ||
            `${p.events.at(-1).txid}:0` !== p.point) continue;
        out.set(d.commitment, p);
      }
      return out;
    } catch {
      return new Map();
    }
  }

  /** Replace the saved prefixes; a concurrent writer simply wins. */
  async save(pools) {
    const value = JSON.stringify({ type: TYPE, pools });
    if (value.length > MAX_BYTES || pools.some(p => p.events.length > MAX_EVENTS)) return false;
    const current = await this.#store.read(this.#key);
    if (current === value) return true;
    return this.#store.compareAndSwap(this.#key, current, value);
  }

  /** Forget the saved progress (for example after it failed verification). */
  async clear() {
    const current = await this.#store.read(this.#key);
    if (current === null) return true;
    return this.#store.compareAndSwap(this.#key, current, JSON.stringify({ type: TYPE, pools: [] }));
  }
}
