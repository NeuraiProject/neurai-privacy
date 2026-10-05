/* Disposable encrypted scan progress. This is separate from the reservation
 * journal: deleting it never releases notes or authorizations. Only validated
 * public transactions are stored; balances and Merkle paths are reconstructed.
 */
import {sha256} from '@noble/hashes/sha2.js';
const hex=b=>Array.from(b,v=>v.toString(16).padStart(2,'0')).join('');
const TYPE='neurai-c6-scan-prefix-v1',MAX_BYTES=2*1024*1024;
const hash=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
export class C6ScanCheckpoint {
  constructor({store,identity,deployment,assertLive}) {
    if(!store?.read||!store?.compareAndSwap||!identity?.sealCheckpoint||!identity?.openCheckpoint||!identity?.checkpointStoreId)throw Error('C6 scan: encrypted checkpoint store required');
    Object.assign(this,{store,identity,deployment,assertLive});
    this.key='c6-scan-prefix-v1:'+hex(sha256(new TextEncoder().encode(identity.checkpointStoreId()+':'+deployment.genesis+':'+deployment.commitment))); 
    this.cipher=null;this.entries=[];
  }
  value(entries){const d=this.deployment;return {type:TYPE,genesis:d.genesis,commitment:d.commitment,anchor:d.anchor.outpoint,anchorHash:d.anchor.hash,entries};}
  async load(){
    this.assertLive();this.cipher=await this.store.read(this.key);this.assertLive();
    if(this.cipher===null)return [];
    // A damaged disposable cache is ignored. Storage failures still propagate;
    // the separate operation journal is never modified by this recovery.
    try{
      if(typeof this.cipher!=='string'||this.cipher.length>MAX_BYTES*2+200)throw Error('size');
      const value=this.identity.openCheckpoint(this.cipher),expected=this.value([]);
      for(const k of ['type','genesis','commitment','anchor','anchorHash'])if(value[k]!==expected[k])throw Error('instance');
      if(!Array.isArray(value.entries)||value.entries.length>2048||JSON.stringify(value).length>MAX_BYTES)throw Error('bounds');
      let h=this.deployment.anchor.height;
      for(const row of value.entries){
        if(!Number.isSafeInteger(row.height)||row.height<h||!hash(row.hash)||typeof row.raw!=='string'||row.raw.length>1000000||!/^(?:[0-9a-f]{2})+$/.test(row.raw))throw Error('entry');
        h=row.height;
      }
      this.entries=value.entries;
    }catch{this.entries=[];}
    return structuredClone(this.entries);
  }
  async save(entries){
    this.assertLive();const value=this.value(entries);
    // Bound cache cost independently of the usable pool history. Once full,
    // retain the saved prefix and scan its uncached suffix normally.
    if(entries.length>2048||JSON.stringify(value).length>MAX_BYTES)return false;
    const replacement=this.identity.sealCheckpoint(value);
    const written=await this.store.compareAndSwap(this.key,this.cipher,replacement);this.assertLive();
    if(!written)throw Error('C6 scan: progress changed in another tab; retry');
    this.cipher=replacement;this.entries=structuredClone(entries);return true;
  }
}
