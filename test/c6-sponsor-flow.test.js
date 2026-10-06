import {c6SponsorWalletId} from '../src/c6-sponsor-wallet-id.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {sha256} from '@noble/hashes/sha2.js';
import {poseidonBytes} from '../src/poseidon.js';
import {C6SponsorFlow} from '../src/c6-sponsor-flow.js';
import {c6SponsorIntent,scanC6SponsorChain} from '../src/c6-sponsor-chain.js';
import {readSponsorTransaction} from '../src/sponsor-sweep.js';
const h=n=>n.toString(16).padStart(64,'0'),hex=b=>Buffer.from(b).toString('hex'),P=s=>hex(poseidonBytes(Buffer.from(s,'hex')));
const script='76a914'+'ab'.repeat(20)+'88ac',C=h(70),old='00'.repeat(145),next='01'.repeat(145),nf=h(10),cm=h(11);
const spk=s=>'5120'+C+'c04c2a'+P(s)+'75';
const leaf={form:'T1',script:'51',args:['tree0','tree1','tree2','tree3','tree4','proof','vk','chunk1','chunk2','R','prevouts']};
const le=(n,bytes)=>{let v=BigInt(n),out='';for(let i=0;i<bytes;i++){out+=(Number(v&255n)).toString(16).padStart(2,'0');v>>=8n;}return out;};
const varint=n=>n<253?le(n,1):'fd'+le(n,2),blob=s=>varint(s.length/2)+s;
function wire(ins,outs) {
 const witness=ins.some(i=>i.w?.length);
 return '03000000'+(witness?'0001':'')+varint(ins.length)+ins.map(i=>hex(Buffer.from(i.id,'hex').reverse())+le(i.vout??0,4)+blob(i.sig??'')+'ffffffff').join('')+
 varint(outs.length)+outs.map(o=>le(o.value,8)+blob(o.script)).join('')+'00'+(witness?ins.map(i=>varint(i.w?.length??0)+(i.w??[]).map(blob).join('')).join(''):'')+'00000000';
}
function fixture() {
 const funds=[1,2].map(n=>{const raw=wire([{id:h(n+90)}],[{value:100000000,script}]);return {raw,txid:readSponsorTransaction(raw).txid};});
 const anchor={txid:h(88),vin:[],vout:[{value:0,scriptPubKey:{hex:spk(old)}}]};
 const witness=['10','0202'+old+next+nf+h(12),'','','','',h(19),h(20),'02'.repeat(2048),'03'.repeat(2048),h(22),'','51',''];
 const operation=i=>wire([{id:anchor.txid,w:witness},{id:h(87)},{id:funds[i].txid}],[{value:0,script:spk(next)},{value:0,script:'5120'+h(99)},{value:90000000,script}]);
 const offer={outpoint:funds[0].txid+':0',inputAtomic:'100000000',changeAtomic:'90000000',inputScript:script,changeScript:script,index:2,sighash:131};
 const deployment={genesis:h(0),commitment:C,kind:'asset',anchor:{height:0,hash:h(0),outpoint:anchor.txid+':0',script:spk(old),opening:old},leaves:[leaf]};
 const fundingTx=f=>({txid:f.txid,vin:[{txid:h(95),vout:0}],vout:[{value:1,scriptPubKey:{hex:script}}]});
 const blocks=[{hash:h(0),height:0,tx:[anchor]},{hash:h(1),previousblockhash:h(0),height:1,tx:funds.map(fundingTx)}];
 const mempool=new Map(),sends=[],raws=new Map(funds.map(f=>[f.txid,f.raw]));let fail=false,blockSerial=1000;
 function decode(raw) {const tx=readSponsorTransaction(raw);return {txid:tx.txid,vin:tx.inputs.map(i=>({txid:i.txid,vout:i.vout})),vout:tx.outputs.map(o=>({value:String(BigInt(o.valueAtomic)/100000000n)+'.'+String(BigInt(o.valueAtomic)%100000000n).padStart(8,'0'),scriptPubKey:{hex:o.script}}))};}
 async function rpc(method,params=[]) {
  if(method==='getblockchaininfo')return {zk_portable_tree:{active_for_next_block:true}};
  if(method==='getblockcount')return blocks.length-1;
  if(method==='getbestblockhash')return blocks.at(-1).hash;
  if(method==='getblockhash')return blocks[params[0]]?.hash;
  if(method==='getblock')return blocks.find(b=>b.hash===params[0]);
  if(method==='getblockheader')return {height:blocks.find(b=>b.hash===params[0]).height};
  if(method==='getrawtransaction') {
   const raw=raws.get(params[0]);if(params[1]===false)return raw;
   const block=blocks.find(b=>b.tx.some(t=>t.txid===params[0]));
   if(block)return {...decode(raw),confirmations:blocks.length-block.height,blockhash:block.hash};
   if(mempool.has(params[0]))return {...decode(raw),confirmations:0};
   throw Object.assign(Error('No such tx'),{code:-5});
  }
  if(method==='gettxout') {
   if(blocks.some(b=>b.tx.some(t=>t.vin.some(i=>`${i.txid}:${i.vout}`===`${params[0]}:${params[1]}`))))return null;
   const fund=funds.find(f=>f.txid===params[0]);return fund?{confirmations:1,value:1,scriptPubKey:{hex:script}}:null;
  }
  if(method==='getrawmempool')return [...mempool.keys()];
  if(method==='testmempoolaccept')return [{allowed:true}];
  if(method==='decoderawtransaction')return decode(params[0]);
  if(method==='sendrawtransaction') {const raw=params[0],id=readSponsorTransaction(raw).txid;sends.push(raw);if(fail){fail=false;throw Error('Transport interrupted');}mempool.set(id,raw);raws.set(id,raw);return id;}
  throw Error('Unexpected RPC '+method);
 }
 function confirm(raw) {const tx=decode(raw),height=blocks.length;raws.set(tx.txid,raw);blocks.push({hash:h(++blockSerial),previousblockhash:blocks.at(-1).hash,height,tx:[tx]});mempool.delete(tx.txid);}
 const store={map:new Map(),async read(k){return this.map.get(k)??null;},async compareAndSwap(k,e,v){if(await this.read(k)!==e)return false;this.map.set(k,v);return true;}};
 const locks={tail:Promise.resolve(),request(_name,_opts,fn){const result=this.tail.then(fn);this.tail=result.catch(()=>{});return result;}};
 let signatures=0;
 const sign=async({raw,hashType,index})=>{signatures++;const tx=readSponsorTransaction(raw),sig='09'+'30'.repeat(8)+le(hashType,1)+'21'+'02'+'11'.repeat(32);
  return wire(tx.inputs.map((i,n)=>({id:i.txid,vout:i.vout,w:i.witness,sig:n===index?sig:i.scriptSig})),tx.outputs.map(o=>({value:o.valueAtomic,script:o.script})));};
 const options={store,genesis:h(0),walletId:h(3),budgetAtomic:'30000000',rpc,deployments:[deployment],locks,sweepFeeAtomic:async()=>'100000',sign};
 return {funds,offer,deployment,blocks,store,rpc,sends,options,confirm,raws,mempool,operation,fail:()=>{fail=true;},signatures:()=>signatures};
}
async function ready(f=fixture()) {const flow=new C6SponsorFlow(f.options);await flow.initialize({create:true});const raw=f.operation(0),intent=c6SponsorIntent(raw,f.deployment);await flow.authorize({raw,pool:C,notes:[{cm,nf}],budgetAtomic:'20000000',offer:f.offer});return {f,flow,intent};}
test('C6 scanner authenticates a confirmed private intent and all funding',async()=>{
 const {f,flow,intent}=await ready();f.confirm(f.operation(1));const s=await flow.scan();assert.equal(s.operations[0].operationTxid,c6SponsorIntent(f.operation(1),f.deployment)&&readSponsorTransaction(f.operation(1)).txid);assert.equal(s.operations[0].operationId,intent.operationId);assert.equal(s.operations[0].reservationClosed,true);assert.deepEqual(s.operations[0].exposedOutpoints,[f.offer.outpoint]);
});
test('pending operation is never swept automatically; explicit ALL sweep persists and retries identical bytes',async()=>{
 const {f,flow}=await ready();await flow.tick({autoSweep:true});assert.equal(f.sends.length,0);f.fail();await assert.rejects(flow.sweep(f.offer.outpoint),/uncertain/);const count=f.signatures();const reopened=new C6SponsorFlow(f.options);await reopened.initialize();await reopened.sweep(f.offer.outpoint);assert.equal(f.signatures(),count);assert.equal(f.sends.length,2);assert.equal(f.sends[0],f.sends[1]);assert.equal((await flow.snapshot()).operations[0].reservationClosed,false);
});
test('confirmed alternate sponsor triggers automatic cleanup, confirmation and reorg reopening',async()=>{
 const {f,flow}=await ready();f.confirm(f.operation(1));await flow.tick({autoSweep:true});assert.equal(f.sends.length,1);f.confirm(f.sends[0]);assert.deepEqual((await flow.scan()).operations[0].exposedOutpoints,[]);f.blocks.pop();f.mempool.clear();const s=await flow.scan();assert.deepEqual(s.operations[0].exposedOutpoints,[f.offer.outpoint]);await flow.tick({autoSweep:true});assert.equal(f.sends[0],f.sends[1]);f.blocks.pop();assert.equal((await flow.scan()).operations[0].privateOperation,'pending');
});
test('storage reload and two concurrent tabs produce one sweep signature/broadcast',async()=>{
 const {f,flow}=await ready();f.confirm(f.operation(1));const second=new C6SponsorFlow(f.options);await second.initialize();await Promise.all([flow.tick({autoSweep:true}),second.tick({autoSweep:true})]);assert.equal(f.signatures(),2);assert.equal(f.sends.length,1);
});
test('transport failure while resolving publication never signs a replacement',async()=>{
 const {f,flow}=await ready();f.confirm(f.operation(1));const blocked=new C6SponsorFlow({...f.options,rpc:async(m,p)=>{if(m==='getrawtransaction'&&!f.funds.some(t=>t.txid===p[0])&&p[1]===true)throw Error('RPC offline');return f.rpc(m,p);}});await blocked.initialize();await assert.rejects(blocked.tick({autoSweep:true}),/unresolved/);assert.equal(f.sends.length,0);const count=f.signatures();await blocked.tick({autoSweep:true}).catch(()=>{});assert.equal(f.signatures(),count);
});
test('missing history, metadata, wrong chain, missing funding and changing tip fail closed',async()=>{
 const {f,flow}=await ready();const before=await flow.backup();
 for(const mode of ['chain','funding','tip','blocks','utxo','activation']) {
  const rpc=async(m,p=[])=>mode==='activation'&&m==='getblockchaininfo'?{zk_portable_tree:{active_for_next_block:false}}:mode==='chain'&&m==='getblockhash'&&p[0]===0?h(99):mode==='funding'&&m==='getrawtransaction'&&p[1]===true?Promise.reject(Error('Unavailable funding')):mode==='tip'&&m==='getbestblockhash'?h(99):mode==='blocks'&&m==='getblock'&&p[0]===h(1)?{hash:h(1),height:1,previousblockhash:h(99),tx:[]}:mode==='utxo'&&m==='gettxout'?null:f.rpc(m,p);
  const snapshot=await flow.snapshot(),meta=JSON.parse(before.flow);
  await assert.rejects(scanC6SponsorChain({rpc,snapshot,deployments:[f.deployment],intents:meta.intents}));assert.equal((await flow.snapshot()).revision,snapshot.revision);
 }
 await assert.rejects(scanC6SponsorChain({rpc:f.rpc,snapshot:await flow.snapshot(),deployments:[f.deployment],intents:[]}),/metadata/);
 const missing=new C6SponsorFlow({...f.options,store:{...f.store,map:new Map()}});await assert.rejects(missing.initialize(),/missing/);
});
test('an unknown leaf/state opening or another valid proof cannot complete this private intent',async()=>{
 const {f,flow}=await ready();let raw=f.operation(1).replace(h(19),h(23));f.confirm(raw);const s=await flow.scan();assert.equal(s.operations[0].privateOperation,'conflicted');assert.equal(s.operations[0].reservationClosed,false);f.blocks.pop();raw=f.operation(1).replace('0202'+old,'0202'+'04'.repeat(145));f.confirm(raw);await assert.rejects(flow.scan(),/discontinuity/);
});
test('restored complete backup scans before signing; wrong wallet and overwritten history rejected',async()=>{
 const {f,flow}=await ready(),backup=await flow.backup(),store={...f.store,map:new Map()},restored=new C6SponsorFlow({...f.options,store});await restored.restore(backup);assert.equal((await restored.snapshot()).authorizedAtomic,'10000000');await assert.rejects(restored.restore(backup),/replace/);const wrong=new C6SponsorFlow({...f.options,store:{...store,map:new Map()},walletId:h(4)});await assert.rejects(wrong.restore(backup),/mismatch/);
});
test('cancellation and malformed transcript never reconcile partial observations',async()=>{
 const {f,flow}=await ready(),before=await flow.snapshot(),abort=new AbortController();abort.abort();await assert.rejects(flow.scan({signal:abort.signal}),/cancelled/);assert.equal((await flow.snapshot()).revision,before.revision);assert.throws(()=>c6SponsorIntent(f.operation(0).replace('0202'+old,'0402'+old),f.deployment),/profile/);
});
test('wallet-wide journal identity shares families, normalizes words and distinguishes passphrases',async()=>{
 const words='abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';const a=await c6SponsorWalletId(words);assert.equal(a,'e1336be03b000670a7d815d74feafb91949c7e7e3a8a1e408dede848f86154c2');assert.equal(await c6SponsorWalletId('  '+words.replaceAll(' ','  ')+'  '),a);assert.notEqual(await c6SponsorWalletId(words,'different'),a);await assert.rejects(c6SponsorWalletId('invalid words'));
});

test('corrupted prepared intent or ALL sweep backup is rejected before any broadcast',async()=>{
 const {f,flow}=await ready();await flow.sweep(f.offer.outpoint);const backup=await flow.backup();
 const meta=JSON.parse(backup.flow);meta.sweeps[0].outpoint=h(99)+':0';
 const restored=new C6SponsorFlow({...f.options,store:{...f.store,map:new Map()}});
 await assert.rejects(restored.restore({...backup,flow:JSON.stringify(meta)}),/persisted sweep/);
 meta.sweeps=[];meta.prepared[0].operationId=h(77);
 await assert.rejects(restored.restore({...backup,flow:JSON.stringify(meta)}),/matching intent/);
});

test('pending review survives reload; sweeping removes its publication path',async()=>{
 const {f,flow,intent}=await ready();const fresh=new C6SponsorFlow(f.options);await fresh.initialize();
 assert.equal((await fresh.pending())[0].operationId,intent.operationId);
 await fresh.sweep(f.offer.outpoint);assert.deepEqual(await fresh.pending(),[]);
 await assert.rejects(fresh.publish(intent.operationId),/scheduled for recovery/);
});
test('unchanged tip skips full block replay, while another tab revision forces a rescan',async()=>{
 const f=fixture();let blocks=0;const rpc=async(m,p)=>{if(m==='getblock')blocks++;return f.rpc(m,p);};
 const {flow}=await ready({...f,options:{...f.options,rpc}});await flow.scan();const count=blocks;await flow.scan();assert.equal(blocks,count);
 const other=new C6SponsorFlow({...f.options,rpc});await other.initialize();await other.scan();await flow.scan();assert.ok(blocks>count);
});

/* Append to test/c6-sponsor-flow.test.js in an isolated SDK snapshot.
 * These cases reuse its public synthetic fixture; they do not claim C++
 * signature verification, real proof generation or power-loss durability. */
test('crash after durable sweep id and before signed-byte persistence fails closed', async t => {
 for (const failure of ['reject', 'throw']) await t.test(failure, async () => {
  const {f,flow,intent}=await ready();
  const originalCAS=f.store.compareAndSwap;
  let interrupted=false;
  f.store.compareAndSwap=async function(key,expected,replacement) {
   const state=JSON.parse(replacement);
   if (!interrupted && state.schema==='neurai-c6-flow-test-v1' && state.sweeps.length) {
    interrupted=true;
    if(failure==='throw')throw Error('Injected persistence interruption');
    return false;
   }
   return originalCAS.call(this,key,expected,replacement);
  };
  await assert.rejects(flow.sweep(f.offer.outpoint),/Concurrent flow|persistence interruption/);
  const state=await flow.snapshot(),signed=f.signatures();
  assert.ok(state.operations[0].sponsors[0].sweepTxid);
  assert.equal(state.authorizedAtomic,'10000000');
  assert.equal(state.operations[0].reservationClosed,false);
  assert.deepEqual(state.operations[0].notes,[{cm,nf}]);
  assert.deepEqual(state.operations[0].exposedOutpoints,[f.offer.outpoint]);
  assert.equal(f.sends.length,0);
  f.store.compareAndSwap=originalCAS;
  const reopened=new C6SponsorFlow(f.options);await reopened.initialize();
  await assert.rejects(reopened.sweep(f.offer.outpoint),/Sweep bytes missing/);
  await assert.rejects(reopened.tick({autoSweep:true}),/Sweep bytes missing/);
  await assert.rejects(reopened.publish(intent.operationId),/scheduled for recovery/);
  assert.equal(f.signatures(),signed);
  assert.equal(f.sends.length,0);
  // A fresh process rescans and may advance the journal revision. Its budget,
  // reservations and missing-byte recovery marker must remain unchanged.
  const after=await reopened.snapshot();
  assert.equal(after.authorizedAtomic,state.authorizedAtomic);
  assert.deepEqual(after.operations,state.operations);
  assert.deepEqual(await reopened.pending(),[]);
 });
});

test('persisted sweep survives an ambiguous storage acknowledgement without signing again', async () => {
 const {f,flow}=await ready(),originalCAS=f.store.compareAndSwap;
 let interrupted=false;
 f.store.compareAndSwap=async function(key,expected,replacement) {
  const saved=await originalCAS.call(this,key,expected,replacement);
  if(saved && !interrupted && JSON.parse(replacement).sweeps?.length) {
   interrupted=true;throw Error('Injected interruption after commit');
  }
  return saved;
 };
 await assert.rejects(flow.sweep(f.offer.outpoint),/after commit/);
 assert.equal(f.sends.length,0);
 const backup=await flow.backup(),bytes=JSON.parse(backup.flow).sweeps[0].raw,count=f.signatures();
 f.store.compareAndSwap=originalCAS;
 const reopened=new C6SponsorFlow(f.options);await reopened.initialize();
 const sent=await reopened.sweep(f.offer.outpoint);
 assert.equal(sent.txid,readSponsorTransaction(bytes).txid);
 assert.equal(f.signatures(),count);
 assert.deepEqual(f.sends,[bytes]);
 assert.equal((await reopened.snapshot()).operations[0].reservationClosed,false);
});

test('failed initial sponsor signing remains exposed and cannot authorize a replacement', async () => {
 const f=fixture();let signatures=0;
 const flow=new C6SponsorFlow({...f.options,sign:async()=>{signatures++;throw Error('Injected signer failure');}});
 await flow.initialize({create:true});
 const raw=f.operation(0),intent=c6SponsorIntent(raw,f.deployment);
 await assert.rejects(flow.authorize({raw,pool:C,notes:[{cm,nf}],budgetAtomic:'20000000',offer:f.offer}),/signer failure/);
 const state=await flow.snapshot();
 assert.equal(state.authorizedAtomic,'10000000');
 assert.equal(state.operations[0].privateOperation,'pending');
 assert.deepEqual(state.operations[0].exposedOutpoints,[f.offer.outpoint]);
 assert.deepEqual(state.operations[0].notes,[{cm,nf}]);
 const reopened=new C6SponsorFlow(f.options);await reopened.initialize();
 await assert.rejects(reopened.authorize({raw:f.operation(1),pool:C,notes:[{cm,nf}],budgetAtomic:'20000000',offer:{...f.offer,outpoint:f.funds[1].txid+':0'}}),/exposed|exposure/i);
 assert.equal(signatures,1);assert.equal(f.signatures(),0);assert.equal(f.sends.length,0);
 await assert.rejects(reopened.publish(intent.operationId),/Signed C6 operation missing/);
});

test('a sweep exceeding the lifetime authorization loss is rejected before local signing', async () => {
 const {f,flow}=await ready(),signatures=f.signatures();
 const reopened=new C6SponsorFlow({...f.options,sweepFeeAtomic:async()=>'10000001'});await reopened.initialize();
 await assert.rejects(reopened.sweep(f.offer.outpoint),/authorized sponsor loss budget/);
 assert.equal(f.signatures(),signatures);assert.equal(f.sends.length,0);
 const state=await flow.snapshot();
 assert.equal(state.operations[0].sponsors[0].sweepTxid,null);
 assert.equal(state.authorizedAtomic,'10000000');
 assert.equal(state.operations[0].reservationClosed,false);
});

test('relay rejection leaves no sweep marker and permits a reviewed ALL retry', async () => {
 const {f,flow}=await ready(),originalRpc=f.rpc;
 const rejecting=async(method,params)=>method==='testmempoolaccept'?[{allowed:false,'reject-reason':'min relay fee not met'}]:originalRpc(method,params);
 const insufficient=new C6SponsorFlow({...f.options,rpc:rejecting});await insufficient.initialize();
 await assert.rejects(insufficient.sweep(f.offer.outpoint),/relay|admit|rejected/i);
 const state=await flow.snapshot();
 assert.equal(state.operations[0].sponsors[0].sweepTxid,null);
 assert.equal(state.authorizedAtomic,'10000000');assert.equal(state.operations[0].reservationClosed,false);
 assert.equal(f.sends.length,0);
 await flow.sweep(f.offer.outpoint);
 assert.equal(f.sends.length,1);
 assert.equal((await flow.snapshot()).authorizedAtomic,'10000000');
});

test('cached scan still refuses publication and recovery when C6 becomes inactive', async () => {
 const {f,flow,intent}=await ready(),count=f.signatures();
 await flow.scan();
 const rpc=async(method,params)=>method==='getblockchaininfo'?{zk_portable_tree:{active_for_next_block:false}}:f.rpc(method,params);
 const reopened=new C6SponsorFlow({...f.options,rpc});await reopened.initialize();
 await assert.rejects(reopened.publish(intent.operationId),/not active/);
 await assert.rejects(reopened.sweep(f.offer.outpoint),/not active/);
 await assert.rejects(reopened.tick({autoSweep:true}),/not active/);
 assert.equal(f.signatures(),count);assert.equal(f.sends.length,0);
 assert.equal((await reopened.snapshot()).operations[0].reservationClosed,false);
});

test('RPC transport ambiguity during recovery never releases notes or broadcasts a second transaction', async () => {
 const {f,flow}=await ready();await flow.sweep(f.offer.outpoint);
 const count=f.signatures(),backup=await flow.backup(),stored=JSON.parse(backup.flow).sweeps[0].raw;
 const rpc=async(method,params)=>{if(method==='getrawtransaction' && params[0]===readSponsorTransaction(stored).txid)throw Error('Injected RPC outage');return f.rpc(method,params);};
 const reopened=new C6SponsorFlow({...f.options,rpc});await reopened.initialize();
 await assert.rejects(reopened.sweep(f.offer.outpoint),/unresolved/);
 assert.equal(f.signatures(),count);assert.deepEqual(f.sends,[stored]);
 assert.equal((await reopened.snapshot()).operations[0].reservationClosed,false);
 const healthy=new C6SponsorFlow(f.options);await healthy.initialize();
 const result=await healthy.sweep(f.offer.outpoint);assert.equal(result.status,'mempool');
 assert.equal(f.signatures(),count);assert.deepEqual(f.sends,[stored]);
});

/* Spent-index strategy and the sponsor scan checkpoint. The wrapper models the
 * node's -spentindex (confirmed and mempool spends) and live UTXOs over the
 * synthetic chain; the plain fixture RPC has no index, as an unindexed node. */
function indexed(f, counts = {}) {
 const spentBy = key => {
  for (const b of f.blocks) for (const t of b.tx) { const i = t.vin.findIndex(v => `${v.txid}:${v.vout}` === key); if (i >= 0) return {txid:t.txid,index:i,height:b.height}; }
  for (const [id,raw] of f.mempool) { const i = readSponsorTransaction(raw).inputs.findIndex(v => `${v.txid}:${v.vout}` === key); if (i >= 0) return {txid:id,index:i,height:-1}; }
  return null;
 };
 return async (method, params = []) => {
  counts[method] = (counts[method] ?? 0) + 1;
  if (method === 'getspentinfo') {
   const found = spentBy(`${params[0].txid}:${params[0].index}`);
   if (!found) throw Object.assign(Error('Unable to get spent info'), {code:-5});
   return found;
  }
  if (method === 'gettxout') {
   const found = spentBy(`${params[0]}:${params[1]}`);
   if (found && found.height >= 0) return null;
   for (const b of f.blocks) { const t = b.tx.find(x => x.txid === params[0]), out = t?.vout?.[params[1]]; if (out) return {confirmations:f.blocks.length-b.height,value:out.value,scriptPubKey:out.scriptPubKey}; }
   return null;
  }
  return f.rpc(method, params);
 };
}
const grow = (f, n) => { for (let i = 0; i < n; i++) f.blocks.push({hash:h(5000+f.blocks.length),previousblockhash:f.blocks.at(-1).hash,height:f.blocks.length,tx:[]}); };
const observe = async (f, flow, rpc, strategy, extra = {}) => {
 const snapshot = await flow.snapshot(), meta = JSON.parse((await flow.backup()).flow);
 return scanC6SponsorChain({rpc, snapshot, deployments:[f.deployment], intents:meta.intents, strategy, ...extra});
};

test('an empty sponsor journal observes the tip without replaying blocks', async () => {
 const f = fixture(); grow(f, 40); const counts = {};
 const flow = new C6SponsorFlow({...f.options, rpc:indexed(f, counts)}); await flow.initialize({create:true});
 const state = await flow.scan();
 assert.equal(state.tip.height, f.blocks.length - 1);
 assert.equal(counts.getblock, 1); // the pinned anchor only
 assert.equal(counts.getspentinfo ?? 0, 0);
});

test('spent-index scan reads pool transitions, not blocks, and matches block replay', async () => {
 const {f, flow} = await ready(); grow(f, 30); f.confirm(f.operation(1));
 await flow.tick({autoSweep:true}); f.confirm(f.sends[0]); grow(f, 8);
 const counts = {}, viaIndex = await observe(f, flow, indexed(f, counts), 'spent-index');
 assert.deepEqual(viaIndex, await observe(f, flow, f.rpc, 'blocks'));
 assert.equal(viaIndex.operations[0].txid, readSponsorTransaction(f.operation(1)).txid);
 assert.equal(viaIndex.confirmedSpends[f.offer.outpoint], readSponsorTransaction(f.sends[0]).txid);
 assert.ok(counts.getblock <= 2, `getblock calls: ${counts.getblock}`); // anchor and sponsor funding
});

test('a mempool spend is not a confirmed sponsor spend in either strategy', async () => {
 const {f, flow} = await ready(); f.confirm(f.operation(1)); await flow.tick({autoSweep:true}); grow(f, 2);
 assert.equal(f.mempool.size, 1);
 const viaIndex = await observe(f, flow, indexed(f), 'spent-index');
 assert.deepEqual(viaIndex, await observe(f, flow, f.rpc, 'blocks'));
 assert.deepEqual(viaIndex.confirmedSpends, {});
});

test('without a spent index the scan falls back to block replay; forcing the index fails closed', async () => {
 const {f, flow} = await ready(); f.confirm(f.operation(1));
 await assert.rejects(observe(f, flow, f.rpc, 'spent-index'), e => e.code === 'C6_INDEX_UNAVAILABLE');
 assert.deepEqual(await observe(f, flow, f.rpc, 'auto'), await observe(f, flow, f.rpc, 'blocks'));
 await assert.rejects(observe(f, flow, f.rpc, 'fast'), /Unknown C6 sponsor scan strategy/);
});

test('the scan checkpoint resumes the pool walk and is replaced after a reorganization', async () => {
 const f = fixture(); grow(f, 20); const counts = {}, rpc = indexed(f, counts);
 const {flow} = await ready({...f, options:{...f.options, rpc}});
 f.confirm(f.operation(1)); grow(f, 10);
 await flow.scan();
 const key = [...f.store.map.keys()].find(k => k.startsWith('neurai:c6:sponsor-scan:v1:'));
 const saved = JSON.parse(f.store.map.get(key)), opHeight = f.blocks.findIndex(b => b.tx.some(t => t.txid === readSponsorTransaction(f.operation(1)).txid));
 assert.equal(saved.pools[0].events.length, 1);
 assert.equal(saved.pools[0].height, opHeight);
 // A fresh process (no in-memory shortcut) resumes after the saved transition.
 grow(f, 1); for (const k in counts) delete counts[k];
 const second = new C6SponsorFlow({...f.options, rpc}); await second.initialize();
 const resumed = await second.scan();
 assert.equal(counts.getspentinfo, 2); // live state and the sponsor coin; the anchor is not walked again
 assert.equal(resumed.operations[0].operationTxid, readSponsorTransaction(f.operation(1)).txid);
 // Reorganize the checkpoint block: the saved prefix no longer verifies.
 const old = f.blocks[opHeight].hash; f.blocks[opHeight].hash = h(9999); f.blocks[opHeight + 1].previousblockhash = h(9999);
 grow(f, 1); for (const k in counts) delete counts[k];
 const third = new C6SponsorFlow({...f.options, rpc}); await third.initialize();
 await third.scan();
 assert.equal(counts.getspentinfo, 3); // walked again from the anchor
 assert.equal(JSON.parse(f.store.map.get(key)).pools[0].hash, h(9999));
 assert.notEqual(old, h(9999));
 assert.deepEqual(await observe(f, third, rpc, 'spent-index', {checkpoint:undefined}), await observe(f, third, f.rpc, 'blocks'));
});

test('a damaged or forged scan checkpoint is ignored, never trusted', async () => {
 const f = fixture(); grow(f, 12); const rpc = indexed(f);
 const {flow} = await ready({...f, options:{...f.options, rpc}});
 f.confirm(f.operation(1)); grow(f, 8); await flow.scan();
 const key = [...f.store.map.keys()].find(k => k.startsWith('neurai:c6:sponsor-scan:v1:'));
 const valid = f.store.map.get(key), expected = await observe(f, flow, f.rpc, 'blocks');
 for (const damage of ['{not json', JSON.stringify({type:'other', pools:[]}),
  JSON.stringify({...JSON.parse(valid), pools:[{...JSON.parse(valid).pools[0], opening:'05'.repeat(145)}]}),
  JSON.stringify({...JSON.parse(valid), pools:[{...JSON.parse(valid).pools[0], point:h(77)+':0', events:[{...JSON.parse(valid).pools[0].events[0], txid:h(77)}]}]})]) {
  f.store.map.set(key, damage);
  const reopened = new C6SponsorFlow({...f.options, rpc}); await reopened.initialize();
  const state = await reopened.scan();
  assert.equal(state.operations[0].operationTxid, expected.operations[0].txid);
 }
});
