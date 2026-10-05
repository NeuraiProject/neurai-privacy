/* Durable compare-and-swap is required. localStorage is not a transactional
 * store and must never be substituted for this adapter. No Node APIs. */
export class IndexedDbSponsorStore {
  #database;
  constructor({ indexedDB = globalThis.indexedDB, name = 'neurai-sponsor-journal-v1' } = {}) {
    if (!indexedDB || typeof name !== 'string' || !name) throw new Error('IndexedDB sponsor storage is required');
    this.#database = new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('journals');
      request.onerror = () => reject(request.error ?? new Error('Sponsor database open failed'));
      request.onblocked = () => reject(new Error('Sponsor database upgrade is blocked'));
      request.onsuccess = () => resolve(request.result);
    });
  }
  async #run(key, expected, replacement, write) {
    const db = await this.#database;
    return new Promise((resolve, reject) => {
      // Strict durability is requested before returning a signature to a caller.
      const tx = write ? db.transaction('journals', 'readwrite', { durability: 'strict' }) : db.transaction('journals', 'readonly');
      const store = tx.objectStore('journals');
      const request = store.get(key);
      let result;
      request.onsuccess = () => {
        const current = request.result ?? null;
        if (write) { result = current === expected; if (result) store.put(replacement, key); }
        else result = current;
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = tx.onerror = () => reject(tx.error ?? new Error('Sponsor storage transaction failed'));
    });
  }
  read(key) { return this.#run(key, null, null, false); }
  compareAndSwap(key, expected, replacement) { return this.#run(key, expected, replacement, true); }
  async close() { (await this.#database).close(); }
}
