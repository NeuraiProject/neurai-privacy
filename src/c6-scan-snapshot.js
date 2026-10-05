/* Disposable, authenticated scan state. This cache never replaces the durable
 * operation journal or releases reservations. Only completed, chain-checked
 * scans are saved. Check the captured block again before using any snapshot.
 */
import {sha256} from '@noble/hashes/sha2.js';
const hex=b=>Array.from(b,v=>v.toString(16).padStart(2,'0')).join('');
const digest=v=>hex(sha256(new TextEncoder().encode(v)));
const MAX_BYTES=3*1024*1024;
export class C6ScanSnapshot {
  constructor({store,identity,deployment,assertLive}) {
    Object.assign(this,{store,identity,deployment,assertLive});
    this.scope=digest(JSON.stringify(deployment));
    this.key='c6-scan-state-v2:'+digest(identity.checkpointStoreId()+':'+this.scope);
    this.cipher=null;
  }
  async load() {
    this.assertLive();this.cipher=await this.store.read(this.key);this.assertLive();
    if(this.cipher===null)return null;
    try {
      if(typeof this.cipher!=='string'||this.cipher.length>MAX_BYTES*2+200)throw Error('size');
      const value=this.identity.openCheckpoint(this.cipher);
      if(value.type!=='neurai-c6-scan-state-v2'||value.scope!==this.scope||typeof value.data!=='string'||value.data.length>MAX_BYTES)throw Error('scope');
      return JSON.parse(value.data,(_key,v)=>{
        if(v&&typeof v==='object'&&v.$bytes!==undefined){
          if(Object.keys(v).length!==1||typeof v.$bytes!=='string'||!/^(?:[0-9a-f]{2})*$/.test(v.$bytes))throw Error('bytes');
          return Uint8Array.from(v.$bytes.match(/../g)??[],x=>parseInt(x,16));
        }
        if(v&&typeof v==='object'&&v.$bigint!==undefined){
          if(Object.keys(v).length!==1||!/^\d+$/.test(v.$bigint))throw Error('integer');return BigInt(v.$bigint);
        }
        return v;
      });
    }catch{return null;}
  }
  async save(snapshot) {
    this.assertLive();
    const data=JSON.stringify(snapshot,(_key,v)=>v instanceof Uint8Array?{$bytes:hex(v)}:typeof v==='bigint'?{$bigint:String(v)}:v);
    if(data.length>MAX_BYTES)return false;
    const replacement=this.identity.sealCheckpoint({type:'neurai-c6-scan-state-v2',scope:this.scope,data});
    if(replacement.length>MAX_BYTES*2+200)return false;
    const written=await this.store.compareAndSwap(this.key,this.cipher,replacement);this.assertLive();
    if(!written)throw Error('C6 scan: saved state changed in another tab; retry');
    this.cipher=replacement;return true;
  }
}
