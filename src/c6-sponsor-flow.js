/* Opt-in C6 TEST lifecycle. All network writes are centralized here. A shared
 * Web Lock covers scan/sign/persist/broadcast across tabs; journal CAS remains
 * mandatory. Signing stays local. No timers, keys or wallet-specific UI here. */
import { SponsorJournal } from './sponsor-journal.js';
import { scanC6SponsorChain, c6SponsorIntent, validateC6SponsorDeployment } from './c6-sponsor-chain.js';
import { admitTransaction, assertPoolChain } from './pool-client.js';
import { readSponsorTransaction, validateSponsorSignature, prepareSponsorSweep } from './sponsor-sweep.js';
const clone = s => JSON.parse(JSON.stringify(s));
const HASH = /^[0-9a-f]{64}$/;
export class C6SponsorFlow {
  #store; #key; #journal; #rpc; #deployments; #locks; #fee; #sign; #checkedRevision=null;
  constructor({store, genesis, walletId, budgetAtomic, rpc, deployments, locks=globalThis.navigator?.locks, sweepFeeAtomic, sign}) {
    if(!locks || typeof locks.request!=='function')throw Error('Cross-tab Web Locks are required for C6 sponsorship');
    if(typeof rpc!=='function' || typeof sign!=='function' || typeof sweepFeeAtomic!=='function')throw Error('C6 RPC, local signer and bounded sweep fee policy required');
    this.#store=store; this.#key=`neurai:c6:flow:${genesis}:${walletId}`;
    this.#journal=new SponsorJournal({store,genesis,walletId,budgetAtomic});
    this.#rpc=rpc; this.#deployments=clone(deployments).map(validateC6SponsorDeployment); this.#locks=locks; this.#fee=sweepFeeAtomic; this.#sign=sign;
  }
  #exclusive(fn) { return this.#locks.request(this.#key,{mode:'exclusive'},fn); }
  #decode(raw) {
    if(typeof raw!=='string' || raw.length>4000000)throw Error('Missing or oversized C6 flow metadata; restore the complete backup');
    const s=JSON.parse(raw);
    if(s.schema!=='neurai-c6-flow-test-v1' || !Array.isArray(s.intents) || !Array.isArray(s.sweeps) || !Array.isArray(s.prepared))throw Error('Invalid C6 flow metadata');
    const ids=new Set(),points=new Set();
    for(const i of s.intents) {
      if(!HASH.test(i.operationId) || !this.#deployments.some(d=>d.commitment===i.pool) || ids.has(i.operationId) || !Array.isArray(i.nullifiers) || i.nullifiers.some(n=>!HASH.test(n)))throw Error('Invalid C6 intent metadata');
      ids.add(i.operationId);
    }
    for(const t of [...s.sweeps,...s.prepared]) {
      if(!HASH.test(t.txid) || readSponsorTransaction(t.raw).txid!==t.txid)throw Error('Corrupt persisted signed transaction');
      if(s.sweeps.includes(t)) {
        const decoded=readSponsorTransaction(t.raw);
        if(points.has(t.outpoint) || decoded.inputs.length!==1 || decoded.outputs.length!==1 || `${decoded.inputs[0].txid}:${decoded.inputs[0].vout}`!==t.outpoint)throw Error('Invalid persisted sweep');
        points.add(t.outpoint);
      }
      else {
        const intent=s.intents.find(i=>i.operationId===t.operationId);
        const deployment=this.#deployments.find(d=>d.commitment===intent?.pool);
        if(!ids.has(t.operationId) || c6SponsorIntent(t.raw,deployment).operationId!==t.operationId)throw Error('Prepared operation without matching intent');
      }
    }
    return s;
  }
  async #load() { return this.#decode(await this.#store.read(this.#key)); }
  async #save(update) {
    const raw=await this.#store.read(this.#key),s=this.#decode(raw);update(s);const next=JSON.stringify(s);this.#decode(next);
    if(!await this.#store.compareAndSwap(this.#key,raw,next))throw Error('Concurrent flow update; stop and rescan');return s;
  }
  async initialize({create=false}={}) {
    return this.#exclusive(async()=>{
      await assertPoolChain(this.#rpc,{genesis:(await this.#journal.initialize({create})).genesis});
      if(await this.#store.read(this.#key)===null) {
        if(!create)throw Error('C6 flow metadata missing; restore the full backup');
        const state=await this.#journal.snapshot();
        if(state.operations.length)throw Error('Cannot reset metadata for an existing sponsor history');
        await this.#store.compareAndSwap(this.#key,null,JSON.stringify({schema:'neurai-c6-flow-test-v1',intents:[],sweeps:[],prepared:[]}));
      }
      await this.#load();return this.#journal.snapshot();
    });
  }
  async #scan(options={}) {
    if(options.signal?.aborted)throw Error('C6 scan cancelled');
    if((await this.#rpc('getblockchaininfo'))?.zk_portable_tree?.active_for_next_block!==true)throw Error('C6 verification is not active; keep reservations');
    const snapshot=await this.#journal.snapshot(),meta=await this.#load();
    if(this.#checkedRevision===snapshot.revision && snapshot.tip && await this.#rpc('getbestblockhash')===snapshot.tip.hash){
      await assertPoolChain(this.#rpc,{genesis:snapshot.genesis});return snapshot;
    }
    const observation=await scanC6SponsorChain({rpc:this.#rpc,snapshot,deployments:this.#deployments,intents:meta.intents,...options});
    const result=await this.#journal.reconcile(observation);this.#checkedRevision=result.revision;return result;
  }
  scan(options={}) {return this.#exclusive(()=>this.#scan(options));}
  snapshot() {return this.#journal.snapshot();}
  pending() {return this.#exclusive(async()=>{const state=await this.#scan(),meta=await this.#load();
    return state.operations.filter(op=>op.privateOperation==='pending').flatMap(op=>{const tx=meta.prepared.filter(t=>t.operationId===op.operationId).at(-1);
      const input=tx?readSponsorTransaction(tx.raw).inputs[2]:null;
      const row=input?op.sponsors.find(s=>s.offer.outpoint===`${input.txid}:${input.vout}`):null;
      return tx&&row&&!row.spentBy&&!row.sweepTxid?[{operationId:tx.operationId,txid:tx.txid}]:[];});
  });}
  async backup() {return this.#exclusive(async()=>({schema:'neurai-c6-backup-test-v1',journal:await this.#journal.export(),flow:JSON.stringify(await this.#load())}));}
  async restore(backup) {
    return this.#exclusive(async()=>{
      if(backup?.schema!=='neurai-c6-backup-test-v1')throw Error('Complete C6 backup required');this.#decode(backup.flow);
      if(await this.#store.read(this.#key)!==null)throw Error('Cannot replace existing C6 flow history');
      await this.#journal.restore(backup.journal);
      if(!await this.#store.compareAndSwap(this.#key,null,backup.flow))throw Error('Concurrent restore; retain backup and stop');
      return this.#scan();
    });
  }
  async authorize({raw,pool,notes,budgetAtomic,offer}) {
    return this.#exclusive(async()=>{
      const d=this.#deployments.find(d=>d.commitment===pool);if(!d)throw Error('Unconfigured C6 pool');
      const intent=c6SponsorIntent(raw,d);
      if(JSON.stringify([...intent.nullifiers].sort())!==JSON.stringify(notes.map(n=>n.nf).sort()))throw Error('Prepared proof does not match reserved notes');
      const meta=await this.#load(),old=meta.intents.find(i=>i.operationId===intent.operationId);
      if(!old)await this.#save(s=>s.intents.push(intent));
      const before=await this.#journal.snapshot();
      if(!before.operations.some(o=>o.operationId===intent.operationId))await this.#journal.reserveOperation({operationId:intent.operationId,budgetAtomic,notes});
      await this.#scan();
      const signed=await this.#journal.signAuthorization(intent.operationId,offer,{rpc:this.#rpc,sign:({offer,hashType})=>this.#sign({raw,offer,hashType,index:2})});
      if(c6SponsorIntent(signed,d).operationId!==intent.operationId)throw Error('Signer changed private C6 intent');
      const admitted=await admitTransaction(this.#rpc,signed);
      await this.#save(s=>s.prepared.push({operationId:intent.operationId,raw:signed,txid:admitted.txid}));
      return {operationId:intent.operationId,raw:signed,txid:admitted.txid};
    });
  }
  async #send(tx) {
    const snapshot=await this.#journal.snapshot();await assertPoolChain(this.#rpc,{genesis:snapshot.genesis});
    // A transport error is not evidence of absence. Only structured -5 means
    // the node does not know this tx. Retry exactly the persisted bytes.
    let known;
    try {known=await this.#rpc('getrawtransaction',[tx.txid,true]);}
    catch(e) {if(e?.code!==-5)throw Error('Publication status unresolved; retain signed bytes');}
    if(known) {
      if(known.txid!==tx.txid)throw Error('RPC transaction mismatch');
      if(known.confirmations>0)return {txid:tx.txid,status:'confirmed'};
      const pending=await this.#rpc('getrawmempool');
      if(!Array.isArray(pending) || pending.some(id=>!HASH.test(id)))throw Error('Invalid mempool observation');
      if(pending.includes(tx.txid))return {txid:tx.txid,status:'mempool'};
    }
    const accepted=await admitTransaction(this.#rpc,tx.raw);if(accepted.txid!==tx.txid)throw Error('Persisted transaction id mismatch');
    try {if(await this.#rpc('sendrawtransaction',[tx.raw])!==tx.txid)throw Error('Unexpected publication id');}
    catch(e) {throw Object.assign(Error('Publication uncertain; no replacement authorization allowed'),{uncertain:true});}
    return {txid:tx.txid,status:'mempool'};
  }
  publish(operationId) {return this.#exclusive(async()=>{
    const state=await this.#scan(),op=state.operations.find(o=>o.operationId===operationId);
    if(!op || op.privateOperation!=='pending')throw Error('Private operation no longer pending');
    const tx=(await this.#load()).prepared.filter(t=>t.operationId===operationId).at(-1);
    if(!tx)throw Error('Signed C6 operation missing');
    const input=readSponsorTransaction(tx.raw).inputs[2],row=op.sponsors.find(s=>s.offer.outpoint===`${input.txid}:${input.vout}`);
    if(!row || row.spentBy || row.sweepTxid)throw Error('This sponsor was spent or scheduled for recovery; do not publish its authorization');
    return this.#send(tx);
  });}
  async #sweep(outpoint) {
    const snapshot=await this.#journal.snapshot();
    const row=snapshot.operations.flatMap(o=>o.sponsors).find(s=>s.offer.outpoint===outpoint);
    if(!row || row.spentBy)return null;
    let tx=(await this.#load()).sweeps.find(t=>t.outpoint===outpoint);
    if(!tx) {
      if(row.sweepTxid)throw Error('Sweep bytes missing; recover the complete backup before retrying');
      const prepared=await this.#journal.prepareSweep(outpoint,{rpc:this.#rpc,feeAtomic:await this.#fee(clone(row.offer)),sign:({raw,offer,hashType})=>this.#sign({raw,offer,hashType,index:0})});
      tx={raw:prepared.raw,txid:prepared.txid,outpoint};
      // Persist ALL bytes before the first network publication.
      await this.#save(s=>s.sweeps.push(tx));
    }
    const decoded=readSponsorTransaction(tx.raw),fee=BigInt(row.offer.inputAtomic)-BigInt(decoded.outputs[0].valueAtomic);
    if(fee<=0n || fee>BigInt(row.offer.inputAtomic)-BigInt(row.offer.changeAtomic))throw Error('Persisted sweep exceeds authorization budget');
    validateSponsorSignature(tx.raw,row.offer,prepareSponsorSweep(row.offer,String(fee)));
    return this.#send(tx);
  }
  /** Explicit recovery of a still-pending authorization. This invalidates its
   * sponsor but does not cancel the portable private proof or free notes. */
  sweep(outpoint) {return this.#exclusive(async()=>{await this.#scan();return this.#sweep(outpoint);});}
  /** Automatic cleanup only after the private operation confirms/conflicts.
   * A pending legitimate sponsor is never swept merely because time elapsed. */
  tick({autoSweep=false,...options}={}) {return this.#exclusive(async()=>{
    const state=await this.#scan(options),sweeps=[];
    if(autoSweep)for(const op of state.operations)for(const row of op.sponsors)if(!row.spentBy && (op.privateOperation!=='pending' || row.sweepTxid))sweeps.push(await this.#sweep(row.offer.outpoint));
    return {snapshot:await this.#journal.snapshot(),sweeps};
  });}
}
