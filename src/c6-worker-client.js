/* Main-thread C6 worker bridge. Read-only chain queries and encrypted CAS only.
 * The worker cannot sign transparent inputs or broadcast transactions. */
function errorText(value, depth=0) {
  if (depth>4) return 'C6 request failed';
  if (typeof value==='string' && value.trim()) return value;
  if (value && typeof value==='object') {
    for (const key of ['message','description']) if(typeof value[key]==='string' && value[key].trim()) return value[key];
    if(value.error!==undefined)return errorText(value.error,depth+1);
  }
  return 'C6 request failed';
}
export class C6WorkerClient {
  #worker; #rpc; #store; #stage; #pending=null; #stopped=false;
  constructor({worker,rpc,store,onStage,onCrash}){
    if(!worker||typeof rpc!=='function'||!store?.read||!store?.compareAndSwap)throw Error('C6 worker, RPC and durable CAS store required');
    this.#worker=worker;this.#rpc=rpc;this.#store=store;this.#stage=onStage;
    worker.onmessage=e=>{void this.#handle(e.data);};
    worker.onerror=e=>{e.preventDefault?.();const error=Error(e.message||'C6 worker stopped');this.terminate(error);onCrash?.(error);};
    worker.onmessageerror=()=>{const error=Error('C6 worker message could not be decoded');this.terminate(error);onCrash?.(error);};
  }
  get stopped(){return this.#stopped;}
  async #handle(data){
    if(this.#stopped)return;
    if(['rpc','journal-read','journal-write'].includes(data?.type)){
      let result,error;
      try{
        if(data.type==='rpc'){
          if(!['getblockchaininfo','getblockhash','getblockcount','getbestblockhash','getblock','getrawtransaction','gettxout','getspentinfo','getprivacypoolupdates'].includes(data.method))throw Error('C6 worker RPC must be read-only');
          result=await this.#rpc(data.method,data.params);
          if(result===undefined)throw Error('C6 RPC returned no result: '+data.method);
          if(result?.error)throw Error(errorText(result.error));
        }else{
          if(typeof data.key!=='string'||data.key.length>200)throw Error('C6 journal key');
          if(data.type==='journal-write'){
            if(typeof data.replacement!=='string'||data.replacement.length>8001000||!(data.expected===null||typeof data.expected==='string'))throw Error('C6 encrypted journal bounds');
            result=await this.#store.compareAndSwap(data.key,data.expected,data.replacement);
          }else result=await this.#store.read(data.key);
        }
      }catch(e){error=errorText(e);}
      if(!this.#stopped)this.#worker.postMessage({type:data.type==='rpc'?'rpc-result':'journal-result',id:data.id,result,error});return;
    }
    if(data?.type==='stage'){this.#stage?.(data.message);return;}
    if(!this.#pending)return;
    if(data.type==='done'){const p=this.#pending;this.#pending=null;p.resolve(p.result);}
    else if(data.type==='error'){const p=this.#pending;this.#pending=null;p.reject(Error(errorText(data.message)));}
    else this.#pending.result[data.type]=data;
  }
  request(type,payload={}){
    if(this.#stopped)return Promise.reject(Error('C6 worker terminated'));
    if(this.#pending)return Promise.reject(Error('C6 operation already running'));
    return new Promise((resolve,reject)=>{this.#pending={resolve,reject,result:{}};try{this.#worker.postMessage({type,...payload});}catch(e){this.terminate(Error(errorText(e)));}});
  }
  derive(options){return this.request('derive',options);}
  openJournal(options={}){return this.request('journal-open',options);}
  scan(){return this.request('scan');}
  async prepare(options){return (await this.request('prepare',options)).prepared.result;}
  async rebuild(id,options={}){return (await this.request('rebuild',{...options,id})).prepared.result;}
  async recordSigned(id,raw){const reply=await this.request('record-signed',{id,raw});return {...reply.signed.result,...(reply.journal?{journal:reply.journal}:{})};}
  broadcastAttempt(id){return this.request('record-broadcast',{id});}
  async backup(){return (await this.request('journal-backup')).backup.result;}
  newAddress(){return this.request('new-address');}
  releaseDraft(id){return this.request('release-draft',{id});}
  terminate(error=Error('C6 worker terminated')){this.#stopped=true;this.#worker.terminate?.();this.#pending?.reject(error);this.#pending=null;}
}
