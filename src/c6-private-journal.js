/* Encrypted private-operation journal. CAS prevents cross-tab reservations.
 * An exported packet never expires locally. Only a confirmed spend closes its
 * reservation, and a reorganization may reopen it. No keys or plaintext notes.
 */
import {sha256} from '@noble/hashes/sha2.js';
import {c6Hex as hex,c6Unhex as unhex,readC6Packet} from './c6-transaction.js';
const TYPE='neurai-c6-private-journal-v1';
const hash=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const fail=()=>{throw Error('C6 private journal: invalid or mismatched history');};
export class C6PrivateJournal {
  constructor({identity,genesis,commitment,read,compareAndSwap,assertLive=()=>{},packetOptions={}}){
    if(!hash(genesis)||!hash(commitment)||!identity||!read||!compareAndSwap)fail();
    Object.assign(this,{identity,genesis,commitment,read,compareAndSwap,assertLive,packetOptions:structuredClone(packetOptions)});
    this.key=identity.checkpointStoreId()+':'+genesis+':'+commitment;this.cipher=null;this.value=null;
  }
  validate(value){
    if(value?.type!==TYPE||value.genesis!==this.genesis||value.commitment!==this.commitment||!Number.isSafeInteger(value.revision)||value.revision<0||!Array.isArray(value.operations)||value.operations.length>256||JSON.stringify(value).length>4000000)fail();
    const ids=new Set();
    for(const op of value.operations){
      if(!hash(op.id)||ids.has(op.id)||!['deposit','transfer','withdraw','join'].includes(op.action)||!['draft','prepared'].includes(op.phase)||!Array.isArray(op.resources)||op.resources.length>2)fail();ids.add(op.id);
      for(const r of op.resources)if(!hash(r.cm)||!hash(r.nf))fail();
      if(op.funding&&!/^[0-9a-f]{64}:[0-9]+$/.test(op.funding))fail();
      if(op.phase==='prepared'){
        if(!hash(op.packetId)||!op.proof||!Array.isArray(op.publicSignals)||!op.transaction)fail();
        const p=readC6Packet(unhex(op.packet),this.packetOptions);
        if(p.packetId!==op.packetId||hex(p.network)!==this.genesis||hex(p.pool)!==this.commitment)fail();
      }
    }
    return value;
  }
  async open({create=false,backup}={}){
    this.assertLive();const cipher=await this.read(this.key);this.assertLive();
    if(cipher!==null){
      if(backup)throw Error('C6 private journal: refusing to replace existing history');
      this.value=this.validate(this.identity.openCheckpoint(cipher));this.cipher=cipher;return;
    }
    if(backup){this.value=this.validate(this.identity.openCheckpoint(backup));this.cipher=null;await this.write(this.value);return;}
    if(!create)throw Error('C6 private journal missing: restore the encrypted backup or explicitly create a new history');
    this.cipher=null;await this.write({type:TYPE,genesis:this.genesis,commitment:this.commitment,revision:0,issued:0,operations:[]});
  }
  async reload(){
    this.assertLive();const cipher=await this.read(this.key);this.assertLive();
    if(cipher===null)throw Error('C6 private journal disappeared; restore history before operating');
    this.value=this.validate(this.identity.openCheckpoint(cipher));this.cipher=cipher;return this.value;
  }
  async write(value){
    this.assertLive();this.validate(value);const replacement=this.identity.sealCheckpoint(value),expected=this.cipher;
    const changed=await this.compareAndSwap(this.key,expected,replacement);this.assertLive();
    if(!changed)throw Error('C6 private journal changed in another tab; rescan before retrying');
    this.cipher=replacement;this.value=structuredClone(value);
  }
  async edit(fn){await this.reload();const value=structuredClone(this.value);fn(value);value.revision++;await this.write(value);}
  reservations(){if(!this.value)throw Error('C6 private journal must be opened');return this.value.operations.filter(o=>!o.outcome).flatMap(o=>o.resources);}
  async reserve({action,resources,funding}){
    const id=hex(sha256(crypto.getRandomValues(new Uint8Array(32))));
    await this.edit(v=>{
      const live=v.operations.filter(o=>!o.outcome);
      if(live.some(o=>resources.some(r=>o.resources.some(s=>s.cm===r.cm||s.nf===r.nf))||(funding&&o.funding===funding)))throw Error('C6 private journal: note or funding coin already reserved');
      v.operations.push({id,action,phase:'draft',resources:structuredClone(resources),...(funding?{funding}:{}),attempts:[]});
    });return id;
  }
  async prepared(id,result){
    await this.edit(v=>{
      const op=v.operations.find(o=>o.id===id);if(!op||op.phase!=='draft')fail();
      Object.assign(op,{phase:'prepared',packet:hex(result.packet),packetId:result.packetId,proof:result.proof,publicSignals:result.publicSignals,transaction:result.transaction});
    });
  }
  async releaseDraft(id){await this.edit(v=>{const i=v.operations.findIndex(o=>o.id===id);if(i<0||v.operations[i].phase!=='draft')throw Error('An exposed C6 packet cannot be cancelled locally');v.operations.splice(i,1);});}
  async reconcile(scan){
    const spent=new Set(scan.events.flatMap(e=>e.nfs));
    await this.edit(v=>{for(const op of v.operations){
      const event=op.transaction&&scan.events.find(e=>e.intentId===op.transaction.intent.operationId);
      op.outcome=event?'confirmed':op.resources.some(r=>spent.has(r.nf))?'conflicted':null;
      op.confirmedBy=event?.txid??null;
    }});
  }
  operation(id){const op=this.value?.operations.find(o=>o.id===id);if(!op||op.phase!=='prepared'||op.outcome)throw Error('C6 operation is unavailable or already confirmed');return structuredClone(op);}
  summaries(){return this.value.operations.map(o=>({id:o.id,action:o.action,phase:o.phase,outcome:o.outcome??null,confirmedBy:o.confirmedBy??null,txid:o.signed?.txid??o.transaction?.txid??null}));}
  backup(){if(!this.cipher)throw Error('C6 journal not open');return {type:TYPE,genesis:this.genesis,commitment:this.commitment,cipher:this.cipher};}
}
