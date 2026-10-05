/* Opt-in C6 TEST sponsorship. This ledger protects local authorization budgets;
 * it does not make SINGLE|ANYONECANPAY signatures safe outside the contract.
 * No keys or note plaintext are stored. Chain observations must be authenticated
 * by the caller; missing data is not evidence of an unspent note or sponsor. */
import { MAX_ATOMIC } from './amounts.js';
import { prepareSponsorSweep, validateSponsorSignature } from './sponsor-sweep.js';
import { checkPoolCoin, assertPoolChain, admitTransaction } from './pool-client.js';

const SCHEMA = 'neurai-c6-sponsor-journal-test-v1';
const HASH = /^[0-9a-f]{64}$/;
const SCRIPT = /^(?:76a914[0-9a-f]{40}88ac|(?:52|53)20[0-9a-f]{64})$/;
const clone = value => JSON.parse(JSON.stringify(value));
const exact = (value, fields) => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== [...fields].sort().join(',')) throw new Error('Invalid sponsor record shape');
};
export function sponsorAtomic(value) {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value) || BigInt(value) > MAX_ATOMIC) throw new Error('Canonical atomic amount required');
  return BigInt(value);
}
function hash(value) { if (typeof value !== 'string' || !HASH.test(value)) throw new Error('Canonical identifier required'); return value; }
function point(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}:(0|[1-9][0-9]*)$/.test(value) || BigInt(value.split(':')[1]) > 0xffffffffn) throw new Error('Canonical outpoint required');
  return value;
}
export function validateSponsorOffer(value) {
  exact(value, ['changeAtomic', 'changeScript', 'index', 'inputAtomic', 'inputScript', 'outpoint', 'sighash']);
  point(value.outpoint);
  const input = sponsorAtomic(value.inputAtomic), change = sponsorAtomic(value.changeAtomic);
  const dust = value.inputScript?.startsWith('5220') ? 3060n : value.inputScript?.startsWith('5320') ? 336n : 546n;
  if (value.index !== 2 || value.sighash !== 0x83 || !SCRIPT.test(value.inputScript) || value.changeScript !== value.inputScript || input <= change || change < dust) throw new Error('Invalid sponsor authorization or change');
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]]));
}
function resources(value) {
  if (!Array.isArray(value) || value.length > 16) throw new Error('Bounded private note reservations required');
  const cm = new Set(), nf = new Set();
  return value.map(row => {
    exact(row, ['cm', 'nf']); hash(row.cm); hash(row.nf);
    if (/^0+$/.test(row.cm) || /^0+$/.test(row.nf) || cm.has(row.cm) || nf.has(row.nf)) throw new Error('Duplicate or empty private note');
    cm.add(row.cm); nf.add(row.nf); return { cm: row.cm, nf: row.nf };
  });
}
const delta = row => sponsorAtomic(row.offer.inputAtomic) - sponsorAtomic(row.offer.changeAtomic);
const authorized = op => op.rows.reduce((sum, row) => sum + delta(row), 0n);

export class SponsorJournal {
  #store; #key; #identity; #readyRevision = null;
  constructor({ store, genesis, walletId, budgetAtomic }) {
    if (!store || typeof store.read !== 'function' || typeof store.compareAndSwap !== 'function') throw new Error('Transactional sponsor storage required');
    hash(genesis); hash(walletId); sponsorAtomic(budgetAtomic);
    this.#store = store; this.#identity = { genesis, walletId, budgetAtomic };
    // One ledger per chain and wallet, across pools, operations and families.
    this.#key = `neurai:c6:sponsors:${genesis}:${walletId}`;
  }
  #decode(raw) {
    if (typeof raw === 'string' && raw.length > 2000000) throw new Error('Sponsor journal size limit exceeded');
    if (raw === null) throw new Error('Sponsor journal missing; explicit initialization required');
    const s = JSON.parse(raw);
    exact(s, ['schema', 'genesis', 'walletId', 'budgetAtomic', 'revision', 'tip', 'operations']);
    if (s.schema !== SCHEMA || Object.keys(this.#identity).some(k => s[k] !== this.#identity[k]) || !Number.isSafeInteger(s.revision) || s.revision < 0 || !Array.isArray(s.operations)) throw new Error('Sponsor journal restoration mismatch');
    if (s.tip !== null) { exact(s.tip, ['height', 'hash']); hash(s.tip.hash); if (!Number.isSafeInteger(s.tip.height) || s.tip.height < 0) throw new Error('Invalid chain tip'); }
    const ids = new Set(), points = new Set(), cms = new Set(), nfs = new Set();
    for (const op of s.operations) {
      exact(op, ['id', 'budgetAtomic', 'resources', 'confirmation', 'conflicted', 'privateExposed', 'rows']);
      hash(op.id); sponsorAtomic(op.budgetAtomic); resources(op.resources);
      if (ids.has(op.id) || !Array.isArray(op.rows) || typeof op.conflicted !== 'boolean' || typeof op.privateExposed !== 'boolean') throw new Error('Duplicate operation or invalid journal');
      ids.add(op.id); if (op.confirmation !== null) hash(op.confirmation);
      for (const r of op.resources) { if (cms.has(r.cm) || nfs.has(r.nf)) throw new Error('Private resources reused across operations'); cms.add(r.cm); nfs.add(r.nf); }
      for (const row of op.rows) {
        exact(row, ['offer', 'spentBy', 'sweepTxid']); validateSponsorOffer(row.offer);
        if (points.has(row.offer.outpoint)) throw new Error('Sponsor outpoint reused across operations'); points.add(row.offer.outpoint);
        if (row.spentBy !== null) hash(row.spentBy); if (row.sweepTxid !== null) hash(row.sweepTxid);
      }
      if (authorized(op) > sponsorAtomic(op.budgetAtomic)) throw new Error('Operation sponsor budget exceeded');
    }
    if (s.operations.reduce((sum, op) => sum + authorized(op), 0n) > sponsorAtomic(s.budgetAtomic)) throw new Error('Wallet sponsor budget exceeded');
    return s;
  }
  async initialize({ create = false } = {}) {
    const current = await this.#store.read(this.#key);
    if (current !== null) { this.#decode(current); return this.snapshot(); }
    if (!create) throw new Error('Sponsor journal missing; restore a backup or explicitly create a new wallet journal');
    const s = { schema: SCHEMA, ...this.#identity, revision: 0, tip: null, operations: [] };
    // Initialization is explicit. A deleted database cannot be distinguished
    // from a new wallet; recovery must restore its journal before signing.
    const created = await this.#store.compareAndSwap(this.#key, null, JSON.stringify(s));
    if (created) this.#readyRevision = 0;
    return this.snapshot();
  }
  async restore(serialized) {
    this.#decode(serialized);
    if (!await this.#store.compareAndSwap(this.#key, null, serialized)) throw new Error('Cannot overwrite an existing sponsor journal with a backup');
    this.#readyRevision = null;
    return this.snapshot();
  }
  async #mutate(update, requireFresh = false, establishesFresh = false) {
    for (let attempt = 0; attempt < 32; attempt++) {
      const raw = await this.#store.read(this.#key), s = this.#decode(raw);
      if (requireFresh && this.#readyRevision !== s.revision) throw new Error('Fresh confirmed-chain reconciliation required before authorization');
      update(s); s.revision++;
      if (!Number.isSafeInteger(s.revision)) throw new Error('Journal revision exhausted');
      this.#decode(JSON.stringify(s));
      if (await this.#store.compareAndSwap(this.#key, raw, JSON.stringify(s))) {
        if (establishesFresh || this.#readyRevision === s.revision - 1) this.#readyRevision = s.revision;
        return this.#view(s);
      }
    }
    throw new Error('Concurrent sponsor update; retry after reconciliation');
  }
  async reserveOperation({ operationId, budgetAtomic, notes }) {
    hash(operationId); sponsorAtomic(budgetAtomic); const selected = resources(notes);
    return this.#mutate(s => {
      if (s.operations.some(op => op.id === operationId)) throw new Error('Operation already reserved');
      s.operations.push({ id: operationId, budgetAtomic, resources: selected, confirmation: null, conflicted: false, privateExposed: false, rows: [] });
    });
  }
  async abandonUnexposed(operationId) {
    hash(operationId);
    return this.#mutate(s => {
      const op = this.#operation(s, operationId);
      if (op.privateExposed || op.rows.length || op.confirmation || op.conflicted) throw new Error('Exposed private notes cannot be released');
      s.operations = s.operations.filter(row => row !== op);
    });
  }
  async markPrivateExposure(operationId) {
    hash(operationId);
    return this.#mutate(s => { this.#operation(s, operationId).privateExposed = true; });
  }
  #operation(s, id) { const op = s.operations.find(row => row.id === id); if (!op) throw new Error('Unknown sponsor operation'); return op; }
  async exposeAuthorization(operationId, value) {
    hash(operationId); const offer = validateSponsorOffer(value);
    return this.#mutate(s => {
      const op = this.#operation(s, operationId);
      if (op.confirmation || op.conflicted) throw new Error('Private operation confirmed or conflicted');
      if (s.operations.some(other => other.rows.some(row => row.offer.outpoint === offer.outpoint))) throw new Error('Sponsor outpoint already authorized');
      if (op.rows.some(row => row.spentBy === null)) throw new Error('Previous sponsor authorization is still exposed');
      op.privateExposed = true;
      op.rows.push({ offer, spentBy: null, sweepTxid: null });
    }, true);
  }
  async signAuthorization(operationId, offer, { rpc, sign }) {
    if (typeof sign !== 'function') throw new Error('Local signer required');
    const intent = validateSponsorOffer(offer);
    await assertPoolChain(rpc, { genesis: this.#identity.genesis });
    const [txid, vout] = intent.outpoint.split(':');
    await checkPoolCoin(rpc, { txid, vout: Number(vout), valueSats: intent.inputAtomic, scriptHex: intent.inputScript });
    // Persist exposure before invoking even a potentially failing signer.
    await this.exposeAuthorization(operationId, intent);
    const raw = await sign({ offer: clone(intent), hashType: 0x83 });
    validateSponsorSignature(raw, intent);
    return raw;
  }
  async reconcile({ expectedRevision, genesis, tip, confirmedSpends, operations }) {
    if (genesis !== this.#identity.genesis || !tip || !Number.isSafeInteger(tip.height) || tip.height < 0) throw new Error('Authenticated chain snapshot required');
    exact(tip, ['height', 'hash']); hash(tip.hash);
    if (!Array.isArray(operations) || !confirmedSpends || typeof confirmedSpends !== 'object' || Array.isArray(confirmedSpends)) throw new Error('Complete chain snapshot required');
    return this.#mutate(s => {
      if (s.revision !== expectedRevision) throw new Error('Stale chain snapshot; scan again');
      const known = new Set(s.operations.flatMap(op => op.rows.map(row => row.offer.outpoint)));
      for (const [p, txid] of Object.entries(confirmedSpends)) { point(p); hash(txid); if (!known.has(p)) throw new Error('Unknown sponsor observation'); }
      if (operations.length !== s.operations.length || new Set(operations.map(op => op.operationId)).size !== operations.length) throw new Error('Incomplete private-operation observations');
      for (const observed of operations) {
        exact(observed, ['operationId', 'txid', 'spentNullifiers']); hash(observed.operationId);
        const op = this.#operation(s, observed.operationId);
        if (observed.txid !== null) hash(observed.txid);
        if (!Array.isArray(observed.spentNullifiers) || new Set(observed.spentNullifiers).size !== observed.spentNullifiers.length || observed.spentNullifiers.some(nf => !op.resources.some(r => r.nf === nf))) throw new Error('Invalid nullifier observations');
        if (observed.txid !== null && observed.spentNullifiers.length !== op.resources.length) throw new Error('Operation confirmation must consume every reserved note');
        if (observed.txid || observed.spentNullifiers.length) op.privateExposed = true;
        op.confirmation = observed.txid;
        op.conflicted = observed.txid === null && observed.spentNullifiers.length > 0;
        for (const row of op.rows) row.spentBy = confirmedSpends[row.offer.outpoint] ?? null;
      }
      s.tip = clone(tip);
    }, false, true);
  }
  #view(s) {
    return { revision: s.revision, genesis: s.genesis, walletId: s.walletId, budgetAtomic: s.budgetAtomic, tip: s.tip,
      authorizedAtomic: String(s.operations.reduce((sum, op) => sum + authorized(op), 0n)),
      operations: s.operations.map(op => ({ operationId: op.id, budgetAtomic: op.budgetAtomic, authorizedAtomic: String(authorized(op)),
        privateOperation: op.confirmation ? 'confirmed' : op.conflicted ? 'conflicted' : 'pending', operationTxid: op.confirmation,
        reservationClosed: op.confirmation !== null, privateExposed: op.privateExposed, notes: op.resources,
        exposedOutpoints: op.rows.filter(row => !row.spentBy).map(row => row.offer.outpoint),
        sponsors: op.rows.map(row => ({ ...row, status: !row.spentBy ? 'exposed' : row.spentBy === op.confirmation ? 'spent-for-operation' : 'spent-elsewhere' })) })) };
  }
  async snapshot() { return clone(this.#view(this.#decode(await this.#store.read(this.#key)))); }
  async export() { const raw = await this.#store.read(this.#key); this.#decode(raw); return raw; }
  async prepareSweep(outpoint, { rpc, feeAtomic, sign }) {
    point(outpoint); if (typeof sign !== 'function') throw new Error('Local ALL signer required');
    const s = this.#decode(await this.#store.read(this.#key));
    const row = s.operations.flatMap(op => op.rows).find(row => row.offer.outpoint === outpoint);
    if (row && sponsorAtomic(feeAtomic) > delta(row)) throw new Error('Sweep fee exceeds the authorized sponsor loss budget');
    if (!row || row.spentBy) throw new Error('Sponsor is not exposed');
    await assertPoolChain(rpc, { genesis: this.#identity.genesis });
    const [txid, vout] = outpoint.split(':');
    await checkPoolCoin(rpc, { txid, vout: Number(vout), valueSats: row.offer.inputAtomic, scriptHex: row.offer.inputScript });
    const template = prepareSponsorSweep(row.offer, feeAtomic);
    const raw = await sign({ raw: template.raw, hashType: 1, offer: clone(row.offer) });
    validateSponsorSignature(raw, row.offer, template);
    const admitted = await admitTransaction(rpc, raw);
    await this.#mutate(current => {
      const live = current.operations.flatMap(op => op.rows).find(r => r.offer.outpoint === outpoint);
      if (!live || live.spentBy) throw new Error('Sponsor changed while preparing sweep');
      live.sweepTxid = admitted.txid;
    });
    // Pending sweeps do not close exposure and never release private notes.
    return { raw, txid: admitted.txid, points: [{ txid, vout: Number(vout) }], feeAtomic };
  }
}
