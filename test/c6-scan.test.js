/* Public TEST keys reproduce the captured isolated chain; never use for funds. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import * as sdk from '../src/browser.js';
import {c6PoolTransportId} from '../src/c6-scan.js';
const fixture=JSON.parse(await fs.readFile(new URL('./fixtures/c6-operations-chain.json',import.meta.url)));
const {replies,deployment}=fixture;
const chain={operations:fixture.operations};
const domain='6ea8abf30e23d97dcce7892186e82bea3b5ec01d644bc608c5e3e9a77e336ea6';
const hash=s=>createHash('sha256').update(s).digest('hex');
const asset=hash('C6/XNA/TEST'),bytes=s=>new Uint8Array(Buffer.from(s,'hex'));
const checks=[];
const check=async(label,job)=>test(label,job);
const top=replies['getblockcount\u0000[]'];
function rpcAt(target=top,alter){return async(method,params=[])=>{
 let value;if(method==='getblockcount')value=target;else if(method==='getbestblockhash')value=replies['getblockhash\u0000'+JSON.stringify([target])];else value=replies[method+'\u0000'+JSON.stringify(params)];
 if(value===undefined)throw Error('Unexpected RPC '+method+JSON.stringify(params));
 value=structuredClone(value);return alter?alter(method,params,value):value;
};}
function operationHeight(label){const id=chain.operations.find(row=>row.label===label).txid;return Object.values(replies).find(row=>row?.height!==undefined&&row.tx?.some(tx=>tx.txid===id)).height+1;}
const identities={};
for(const who of ['Alice','Bob','Carol']){
 const backup=await sdk.sealVault({spend_key:hash('C6 API TEST spend '+who),view_seed:hash('C6 API TEST view '+who)},'TEST password only');
 identities[who]=await sdk.BrowserTestIdentity.fromBackup({backup,password:'TEST password only',domain,assetId:asset});
}
const scan=(who,target=top,extra={})=>sdk.scanC6Pool({rpc:rpcAt(target),deployment,identity:identities[who],...extra});
const expected={Alice:'39970000000',Bob:'50000000000',Carol:'40000000000'};
const atT3=operationHeight('T3-pay'),scans={};
for(const who of Object.keys(identities))await check('fresh backup '+who+' recovers exact T3 balance',async()=>{scans[who]=await scan(who,atT3);assert.equal(scans[who].balanceAtomic,expected[who]);assert.equal(scans[who].spendableAtomic,expected[who]);assert.ok(scans[who].notes.every(row=>row.path?.length===32));});
await check('all final balances zero after confirmed withdrawals',async()=>{for(const who of Object.keys(identities))assert.equal((await scan(who)).balanceAtomic,'0');});
await check('reserved notes remain owned but cannot be selected',async()=>{
 const row=scans.Alice.notes[0],reserved=[{cm:Buffer.from(row.cm).toString('hex'),nf:Buffer.from(row.nf).toString('hex')}];
 const result=await scan('Alice',atT3,{reserved});assert.equal(result.balanceAtomic,expected.Alice);assert.equal(result.spendableAtomic,'0');assert.equal(result.notes[0].reserved,true);
});
await check('one-confirmation publication waits for a mature historical root',async()=>{const result=await scan('Alice',atT3-1);assert.equal(result.balanceAtomic,expected.Alice);assert.equal(result.spendableAtomic,'0');});
await check('withdrawal preparation uses recovered note and private identity without key getters',async()=>{
 const manifest={profile:'C6-XNA-TEST-J2-v2',network:Buffer.from(bytes(deployment.genesis)).reverse().toString('hex'),commitment:deployment.commitment,
 context:Buffer.from(sdk.poseidonBytes(new Uint8Array([...new TextEncoder().encode('NeuraiPoolCtx\x01'),...bytes(domain),...bytes(asset),1,0,0,0,0,0,0,0,...new Uint8Array(32)]))).toString('hex'),fees:{W:['10000000']}};
 const wallet=sdk.createC6OperationWallet({expectedGenesis:manifest.network,expectedCommitment:manifest.commitment});
 const plan=identities.Alice.prepareC6Withdrawal(wallet,{manifest,fee:'10000000',consumed:scans.Alice.notes[0],amountAtomic:'30000000000',payoutScript:bytes('76a914'+'33'.repeat(20)+'88ac')});
 assert.equal(plan.input.changeAmount,'9960000000');assert.equal(plan.publics.length,8);
});
await check('changed chain during scan never returns a partial balance',async()=>{
 let reads=0;await assert.rejects(sdk.scanC6Pool({strategy:'blocks',rpc:rpcAt(top,(method,params,value)=>method==='getblockhash'&&params[0]===top&&++reads>2?'11'.repeat(32):value),deployment,identity:identities.Alice}),/changed/);
});
await check('disabled portable rules are rejected before scanning',async()=>{
 await assert.rejects(sdk.scanC6Pool({rpc:rpcAt(top,(method,params,value)=>method==='getblockchaininfo'?{zk_portable_tree:{active_for_next_block:false}}:value),deployment,identity:identities.Alice}),/inactive/);
});
await check('wrong genesis or birth cannot authorize a scan',async()=>{
 await assert.rejects(sdk.scanC6Pool({rpc:rpcAt(),deployment:{...deployment,genesis:'11'.repeat(32)},identity:identities.Alice}),/genesis/);
 await assert.rejects(sdk.scanC6Pool({rpc:rpcAt(),deployment:{...deployment,anchor:{...deployment.anchor,hash:'11'.repeat(32)}},identity:identities.Alice}),/birth/);
});
await check('pre-start cancellation returns no scan result',async()=>{const c=new AbortController();c.abort();await assert.rejects(scan('Alice',top,{signal:c.signal}),/cancelled/);});

// Model the node's spent-index API from the already captured confirmed blocks.
function indexedRpc(target=top,mutate,chainBlocks){
 const counts={},blocks=chainBlocks??Object.values(replies).filter(b=>b?.hash&&Number.isSafeInteger(b.height)&&Array.isArray(b.tx));
 const source=rpcAt(target);
 const call=async(method,params=[])=>{
  counts[method]=(counts[method]??0)+1;let value;
  if(method==='getspentinfo'){
   const {txid,index}=params[0];let hit;
   for(const block of blocks.filter(b=>b.height<=target).sort((a,b)=>a.height-b.height))for(const tx of block.tx){const vin=tx.vin.findIndex(i=>i.txid===txid&&i.vout===index);if(vin>=0)hit={txid:tx.txid,index:vin,height:block.height};}
   if(!hit)throw Error('Unable to get spent info');value=hit;
  }else if(method==='gettxout'){
   const [txid,index]=params;const block=blocks.find(b=>b.tx.some(t=>t.txid===txid));const tx=block?.tx.find(t=>t.txid===txid);
   const consumed=blocks.some(b=>b.height<=target&&b.tx.some(t=>t.vin.some(i=>i.txid===txid&&i.vout===index)));
   value=consumed||!tx||block.height>target?null:{confirmations:target-block.height+1,...tx.vout[index]};
  }else if(method==='getblock'&&chainBlocks)value=blocks.find(b=>b.hash===params[0]);
  else value=await source(method,params);
  return mutate?mutate(method,params,structuredClone(value),counts):structuredClone(value);
 };
 return {call,counts};
}
await check('indexed scan equals block replay and reads only blocks with pool operations',async()=>{
 const full=await scan('Alice',atT3,{strategy:'blocks'}),index=indexedRpc(atT3);
 const fast=await sdk.scanC6Pool({rpc:index.call,strategy:'spent-index',deployment,identity:identities.Alice});
 assert.deepEqual(fast,full);assert.ok(index.counts.getblock<=fast.events.length+1);assert.ok(index.counts.getblock<atT3-deployment.anchor.height);
});
await check('ordinary chain growth does not invalidate either scan snapshot',async()=>{
 for(const strategy of ['blocks','spent-index']){
  const index=indexedRpc(atT3);const rpc=async(m,p=[])=>m==='getbestblockhash'?'11'.repeat(32):index.call(m,p);
  const result=await sdk.scanC6Pool({rpc,strategy,deployment,identity:identities.Alice});assert.equal(result.tip.height,atT3);assert.equal(result.balanceAtomic,expected.Alice);
 }
});
await check('spent-index scan ignores an unconfirmed mempool spender of the live state',async()=>{
 const full=await scan('Alice',atT3,{strategy:'blocks'}),index=indexedRpc(atT3);
 const rpc=async(m,p)=>{if(m==='getspentinfo'&&p[0].txid+':'+p[0].index===full.statePoint)return {height:-1,index:0,txid:'11'.repeat(32)};return index.call(m,p);};
 const result=await sdk.scanC6Pool({rpc,strategy:'spent-index',deployment,identity:identities.Alice});assert.deepEqual(result,full);
});
await check('auto mode falls back only for unavailable indexes, never for contradictory entries',async()=>{
 const result=await scan('Alice',atT3);assert.equal(result.balanceAtomic,expected.Alice);
 for(const field of ['index','txid','height']){
  const index=indexedRpc(atT3,(m,p,v)=>m==='getspentinfo'?{...v,[field]:field==='index'?1:field==='height'?0:'11'.repeat(32)}:v);
  await assert.rejects(sdk.scanC6Pool({rpc:index.call,deployment,identity:identities.Alice}),/index|confirmed/);
 }
});
await check('indexed scan rejects a reorganization of the captured prefix and a false live state',async()=>{
 let reads=0;const index=indexedRpc(atT3,(m,p,v)=>m==='getblockhash'&&p[0]===atT3&&++reads>1?'11'.repeat(32):v);
 await assert.rejects(sdk.scanC6Pool({rpc:index.call,strategy:'spent-index',deployment,identity:identities.Alice}),/changed/);
 const mismatch=indexedRpc(atT3,(m,p,v)=>m==='gettxout'&&v?{...v,scriptPubKey:{hex:'51'}}:v);
 await assert.rejects(sdk.scanC6Pool({rpc:mismatch.call,deployment,identity:identities.Alice}),/mismatch/);
});
await check('indexed scan stops at the captured height when an extension already spent its state',async()=>{
 const full=await scan('Alice',atT3,{strategy:'blocks'}),index=indexedRpc(atT3);
 const future=indexedRpc(top);let heightReads=0;const rpc=async(m,p=[])=>{if(m==='getblockcount')return ++heightReads===1?atT3:top;if(m==='getspentinfo')return future.call(m,p);return index.call(m,p);};
 const result=await sdk.scanC6Pool({rpc,strategy:'spent-index',deployment,identity:identities.Alice});assert.deepEqual(result,full);
});

await check('both strategies include a state spend confirmed in its birth block',async()=>{
 const blocks=structuredClone(Object.values(replies).filter(b=>b?.hash&&Number.isSafeInteger(b.height)&&Array.isArray(b.tx)));
 const reference=await scan('Alice',top,{strategy:'blocks'});
 const id=reference.events[0].txid,from=blocks.find(b=>b.tx.some(t=>t.txid===id)),birth=blocks.find(b=>b.height===deployment.anchor.height);
 const tx=from.tx.find(t=>t.txid===id);from.tx=from.tx.filter(t=>t.txid!==id);birth.tx.push(tx);
 const full=await sdk.scanC6Pool({rpc:indexedRpc(top,undefined,blocks).call,strategy:'blocks',deployment,identity:identities.Alice});
 const fast=await sdk.scanC6Pool({rpc:indexedRpc(top,undefined,blocks).call,strategy:'spent-index',deployment,identity:identities.Alice});
 assert.deepEqual(fast,full);assert.equal(full.events[0].txid,id);assert.equal(full.events.length,reference.events.length);
});

function checkpointStore(){
 const values=new Map();return {values,read:async k=>values.get(k)??null,compareAndSwap:async(k,expected,replacement)=>{
  if((values.get(k)??null)!==expected)return false;values.set(k,replacement);return true;
 }};
}
await check('interrupted indexed scans persist each validated transition and resume after worker recreation',async()=>{
 const store=checkpointStore(),index=indexedRpc(atT3);let reads=0;
 const broken=async(m,p)=>{if(m==='getrawtransaction'&&++reads===4)throw Error('simulated timeout');return index.call(m,p);};
 await assert.rejects(sdk.scanC6Pool({rpc:broken,strategy:'spent-index',checkpointStore:store,deployment,identity:identities.Alice}),/timeout/);
 assert.equal(store.values.size,1);const cipher=[...store.values.values()][0],prefix=identities.Alice.openCheckpoint(cipher);
 assert.equal(prefix.entries.length,3);assert.ok(!cipher.includes(prefix.entries[0].raw));assert.ok(!('balanceAtomic'in prefix));
 const freshIdentity=await sdk.BrowserTestIdentity.fromBackup({backup:identities.Alice.backupJson(),password:'TEST password only',domain,assetId:asset});
 const resumed=indexedRpc(atT3),progress=[];
 const result=await sdk.scanC6Pool({rpc:resumed.call,strategy:'spent-index',checkpointStore:store,deployment,identity:freshIdentity,onProgress:p=>progress.push(p)});
 assert.deepEqual(result,scans.Alice);assert.equal(resumed.counts.getrawtransaction,result.events.length-3);
 assert.equal(resumed.counts.getspentinfo,result.events.length-3+1);assert.ok(progress.some(p=>p.phase==='resuming'&&p.height===prefix.entries.at(-1).height));freshIdentity.lock();
});
await check('unchanged pool scans use encrypted prefix without redownloading confirmed transactions',async()=>{
 const store=checkpointStore();await scan('Alice',atT3,{checkpointStore:store,strategy:'spent-index',rpc:indexedRpc(atT3).call});
 const next=indexedRpc(atT3),result=await scan('Alice',atT3,{checkpointStore:store,strategy:'spent-index',rpc:next.call});
 assert.deepEqual(result,scans.Alice);assert.equal(next.counts.getrawtransaction??0,0);assert.equal(next.counts.getspentinfo,1);assert.equal(next.counts.getblock,1);
});
await check('checkpoint truncates after a lower active tip and still enforces current reservations',async()=>{
 const store=checkpointStore();await scan('Alice',top,{checkpointStore:store,rpc:indexedRpc(top).call});
 const reserved=[{cm:Buffer.from(scans.Alice.notes[0].cm).toString('hex'),nf:Buffer.from(scans.Alice.notes[0].nf).toString('hex')}];
 const result=await scan('Alice',atT3,{checkpointStore:store,reserved,rpc:indexedRpc(atT3).call});
 assert.equal(result.balanceAtomic,expected.Alice);assert.equal(result.spendableAtomic,'0');assert.equal(result.notes[0].reserved,true);
 const saved=identities.Alice.openCheckpoint([...store.values.values()][0]);assert.equal(saved.entries.length,result.events.length);assert.ok(saved.entries.every(r=>r.height<=atT3));
});
await check('changed cached block hash discards its suffix and rebuilds from confirmed RPC',async()=>{
 const store=checkpointStore();await scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call});
 for(const key of store.values.keys())if(key.startsWith('c6-scan-state-v2:'))store.values.delete(key);
 const [key,cipher]=[...store.values.entries()][0],value=identities.Alice.openCheckpoint(cipher);value.entries[1].hash='11'.repeat(32);store.values.set(key,identities.Alice.sealCheckpoint(value));
 const next=indexedRpc(atT3),result=await scan('Alice',atT3,{checkpointStore:store,rpc:next.call});assert.deepEqual(result,scans.Alice);assert.equal(next.counts.getrawtransaction,result.events.length-1);
});
await check('corrupt or cross-pool disposable cache is rebuilt without touching operation history',async()=>{
 for(const wrongPool of [false,true]){
  const store=checkpointStore();await scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call});
  const [key,cipher]=[...store.values.entries()][0];store.values.set('separate-operation-journal','DO NOT TOUCH');
  if(wrongPool){const value=identities.Alice.openCheckpoint(cipher);value.commitment='11'.repeat(32);store.values.set(key,identities.Alice.sealCheckpoint(value));}else store.values.set(key,cipher.slice(0,-12)+'broken');
  const result=await scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call});assert.deepEqual(result,scans.Alice);assert.equal(store.values.get('separate-operation-journal'),'DO NOT TOUCH');
 }
});
await check('scan cache storage failure and CAS conflict return no private balance',async()=>{
 for(const store of [{read:async()=>{throw Error('storage unavailable');},compareAndSwap:async()=>true},{read:async()=>null,compareAndSwap:async()=>false}])await assert.rejects(scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call}),/storage|another tab/);
});
await check('block replay can resume a validated indexed prefix with the same result',async()=>{
 const store=checkpointStore();await scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call});
 let txReads=0;const source=rpcAt(atT3),rpc=async(m,p)=>{if(m==='getrawtransaction')txReads++;return source(m,p);};
 const result=await scan('Alice',atT3,{checkpointStore:store,strategy:'blocks',rpc});assert.deepEqual(result,scans.Alice);assert.equal(txReads,0);
});

await check('authenticated full snapshot resumes without re-decrypting old records after reopening',async()=>{
 const store=checkpointStore();await scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call});
 const fresh=await sdk.BrowserTestIdentity.fromBackup({backup:identities.Alice.backupJson(),password:'TEST password only',domain,assetId:asset});
 const open=fresh.openRecord.bind(fresh);let decrypts=0;fresh.openRecord=(...args)=>{decrypts++;return open(...args);};
 const next=indexedRpc(atT3),progress=[];
 const result=await sdk.scanC6Pool({rpc:next.call,deployment,identity:fresh,checkpointStore:store,onProgress:p=>progress.push(p)});
 assert.deepEqual(result,scans.Alice);assert.equal(decrypts,0);assert.equal(next.counts.getrawtransaction??0,0);assert.equal(next.counts.getspentinfo,1);
 assert.ok(progress.some(p=>p.phase==='checkpoint'));assert.equal(progress.at(-1).phase,'complete');assert.equal(progress.at(-1).height,atT3);
 const cipher=[...store.values.entries()].find(([k])=>k.startsWith('c6-scan-state-v2:'))[1];assert.ok(!cipher.includes(Buffer.from(result.notes[0].note).toString('hex')));fresh.lock();
});
await check('snapshot processes only new pool transactions and produces the same final state',async()=>{
 const store=checkpointStore();await scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call});
 const next=indexedRpc(top),result=await scan('Alice',top,{checkpointStore:store,rpc:next.call});
 assert.deepEqual(result,await scan('Alice',top));assert.equal(next.counts.getrawtransaction,result.events.length-scans.Alice.events.length);
});
await check('cached immature notes become spendable when their root matures',async()=>{
 const store=checkpointStore();const immature=await scan('Alice',atT3-1,{checkpointStore:store,rpc:indexedRpc(atT3-1).call});assert.equal(immature.spendableAtomic,'0');
 const next=await scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call});assert.deepEqual(next,scans.Alice);
});
await check('changed receiving window invalidates only private recovery, not cached public trees',async()=>{
 const store=checkpointStore(),id=identities.Alice;id.gap=1;await scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call});id.gap=2;
 const open=id.openRecord.bind(id);let calls=0;id.openRecord=(...args)=>{calls++;return open(...args);};
 try{const next=indexedRpc(atT3),result=await scan('Alice',atT3,{checkpointStore:store,rpc:next.call});assert.deepEqual(result,scans.Alice);assert.ok(calls>0);assert.equal(next.counts.getrawtransaction??0,0);}
 finally{id.openRecord=open;delete id.gap;}
});
await check('damaged full snapshot falls back to validated prefix without modifying reservations',async()=>{
 const store=checkpointStore();await scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call});
 const [key]=[...store.values.entries()].find(([k])=>k.startsWith('c6-scan-state-v2:'));store.values.set(key,'BROKEN');store.values.set('private-reservations','DO NOT TOUCH');
 const progress=[],result=await scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call,onProgress:p=>progress.push(p)});
 assert.deepEqual(result,scans.Alice);assert.ok(!progress.some(p=>p.phase==='checkpoint'));assert.equal(store.values.get('private-reservations'),'DO NOT TOUCH');
});
await check('snapshot CAS failure does not publish a balance even with a valid cached history',async()=>{
 const store=checkpointStore();await scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call});
 const cas=store.compareAndSwap;store.compareAndSwap=async(k,...args)=>k.startsWith('c6-scan-state-v2:')?false:cas(k,...args);
 await assert.rejects(scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call}),/saved state changed/);
});
await check('an interrupted suffix resumes from its completed snapshot and saved new transactions',async()=>{
 const store=checkpointStore();await scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call});
 const index=indexedRpc(top);let reads=0;const broken=async(m,p)=>{if(m==='getrawtransaction'&&++reads===2)throw Error('suffix timeout');return index.call(m,p);};
 await assert.rejects(scan('Alice',top,{checkpointStore:store,rpc:broken}),/timeout/);
 const next=indexedRpc(top),result=await scan('Alice',top,{checkpointStore:store,rpc:next.call});assert.deepEqual(result,await scan('Alice',top));assert.equal(next.counts.getrawtransaction,result.events.length-scans.Alice.events.length-1);
});
await check('completed snapshot rejects a chain change detected by its final hash check',async()=>{
 const store=checkpointStore();await scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call});
 let reads=0;const next=indexedRpc(atT3,(m,p,v)=>m==='getblockhash'&&p[0]===atT3&&++reads>=3?'11'.repeat(32):v);
 await assert.rejects(scan('Alice',atT3,{checkpointStore:store,rpc:next.call}),/changed/);
});
await check('malformed authenticated tree cache is discarded, not trusted as a balance',async()=>{
 const store=checkpointStore();await scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call});
 const [key,cipher]=[...store.values.entries()].find(([k])=>k.startsWith('c6-scan-state-v2:'));
 const envelope=identities.Alice.openCheckpoint(cipher),v=JSON.parse(envelope.data);v.tree.levels[0].pop();envelope.data=JSON.stringify(v);store.values.set(key,identities.Alice.sealCheckpoint(envelope));
 const progress=[],result=await scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call,onProgress:p=>progress.push(p)});assert.deepEqual(result,scans.Alice);assert.ok(!progress.some(p=>p.phase==='checkpoint'));
});
await check('extending the receiving gap revisits older records without replaying public trees',async()=>{
 const store=checkpointStore(),id=identities.Alice,base=id.openRecord.bind(id);let extend=false,calls=[];
 Object.assign(id,{gap:2,issued:0,maxUsed:0,scanRecords:(entries,known=[])=>{
  calls.push(entries.length);id.maxUsed=known.reduce((n,a)=>Math.max(n,a.index),0);
  return entries.flatMap((e,position)=>{let owned;try{owned=base(e.record,e.cm);}catch{}if(!owned)return [];const index=extend?1:0;id.maxUsed=Math.max(id.maxUsed,index);return [{position,owned,address:{chain:0,index}}];});
 }});
 try{
  await scan('Alice',atT3,{checkpointStore:store,rpc:indexedRpc(atT3).call});extend=true;calls=[];
  const next=indexedRpc(top),result=await scan('Alice',top,{checkpointStore:store,rpc:next.call});
  assert.ok(calls.some(n=>n===result.records.length));assert.equal(next.counts.getrawtransaction,result.events.length-scans.Alice.events.length);
 }finally{for(const key of ['gap','issued','maxUsed','scanRecords'])delete id[key];}
});

// Model the node's privacy-pool transport (getprivacypoolupdates) over the same
// confirmed blocks: cursors, a snapshot pinned by the cursor, and pages.
const hashAt=h=>replies['getblockhash\u0000'+JSON.stringify([h])];
function historyRpc(target=top,{mutate,fail,chainTarget=target}={}){
 const index=indexedRpc(chainTarget),cursors=[];
 const blocks=Object.values(replies).filter(b=>b?.hash&&Number.isSafeInteger(b.height)&&Array.isArray(b.tx)).sort((a,b)=>a.height-b.height);
 const poolId=c6PoolTransportId(deployment.genesis,deployment.anchor.outpoint);
 const call=async(method,params=[])=>{
  if(method!=='getprivacypoolupdates')return index.call(method,params);
  index.counts[method]=(index.counts[method]??0)+1;
  if(fail?.(index.counts[method]))throw Error('Method not found');
  const [pool,cursor,limit=100]=params;cursors.push(structuredClone(cursor));
  assert.equal(pool.txid+':'+pool.vout,deployment.anchor.outpoint);
  let snapshot=target,position={txid:pool.txid,vout:pool.vout},sequence=0,script=deployment.anchor.script;
  if(cursor){
   assert.equal(cursor.pool_id,poolId);
   if(hashAt(cursor.snapshot.height)!==cursor.snapshot.hash)throw Error('Cursor snapshot reorganized');
   if(!cursor.complete)snapshot=cursor.snapshot.height;
   position=cursor.position;sequence=cursor.sequence;
   const created=blocks.find(b=>b.tx.some(t=>t.txid===position.txid));
   assert.deepEqual(cursor.anchor,{height:created.height,hash:created.hash});
   script=created.tx.find(t=>t.txid===position.txid).vout[position.vout].scriptPubKey.hex;
  }
  const updates=[];let complete=false;
  for(;;){
   let hit;for(const block of blocks.filter(b=>b.height<=snapshot))for(const tx of block.tx)if(tx.vin.some(i=>i.txid===position.txid&&i.vout===position.vout))hit={block,tx};
   if(!hit){complete=true;break;}
   if(updates.length>=limit)break;
   const {block,tx}=hit,state={txid:tx.txid,vout:0,height:block.height,blockhash:block.hash,script:tx.vout[0].scriptPubKey.hex,value_satoshis:'0'};
   updates.push({sequence:++sequence,txid:tx.txid,wtxid:tx.hash??tx.txid,height:block.height,blockhash:block.hash,input_index:0,spent:{...position},state,
    raw:replies['getrawtransaction\u0000'+JSON.stringify([tx.txid,false])],witness:[]});
   position={txid:tx.txid,vout:0};script=state.script;
  }
  const last=updates.at(-1)?.state??{...position,script};
  const page={pool_id:poolId,genesis:deployment.genesis,profile:'authscript-v1-state-thread',privacy_profile:null,commitment:deployment.commitment,
   snapshot:{height:snapshot,hash:hashAt(snapshot)},indexed_height:snapshot,history_complete:complete,has_more:!complete,continuation:'matching_state',
   current_state:complete?last:null,last_state:last,transitions_followed:updates.length,
   next_cursor:{version:1,pool_id:poolId,position:{...position},sequence,anchor:{height:last.height??deployment.anchor.height,hash:last.blockhash??deployment.anchor.hash},snapshot:{height:snapshot,hash:hashAt(snapshot)},complete},updates};
  return mutate?mutate(page,index.counts[method]):page;
 };
 return {call,counts:index.counts,cursors};
}

await check('pool_id matches the node for the testnet C6 and C7 pools',()=>{
 const genesis='0000008b384aeffecdab182575dc4e86c9f07f90318c65088532660ed9a8a021';
 assert.equal(c6PoolTransportId(genesis,'ba82867c84b1d723b90455dd2514eb87901d7bf944b47e60214cf4ad1b0176e7:0'),'fce6715626c9e2eb268f7657273782828d20389ad7353d03c023f93a10bdd7a3');
 assert.equal(c6PoolTransportId(genesis,'8336537aab139fa78e9a219affaefa7f2c86eb8787c36600c6a270babd8763fa:0'),'8ffeb07858ec7f59be8e80388e16fc8bdb6c9ba99e8315eaf07188a7716aedf8');
});
await check('pool history equals block replay without per-transition reads',async()=>{
 const full=await scan('Alice',atT3,{strategy:'blocks'});
 for(const strategy of ['pool-history',undefined]){
  const history=historyRpc(atT3),result=await sdk.scanC6Pool({rpc:history.call,strategy,deployment,identity:identities.Alice});
  assert.deepEqual(result,full);assert.equal(history.counts.getprivacypoolupdates,1);
  assert.equal(history.counts.getrawtransaction??0,0);assert.equal(history.counts.getspentinfo??0,0);assert.equal(history.counts.getblock,1);
  // The first cursor starts at the pinned birth and pins the captured tip.
  assert.deepEqual(history.cursors[0],{version:1,pool_id:c6PoolTransportId(deployment.genesis,deployment.anchor.outpoint),
   position:{txid:deployment.anchor.outpoint.split(':')[0],vout:0},sequence:0,anchor:{height:deployment.anchor.height,hash:deployment.anchor.hash},
   snapshot:{height:atT3,hash:hashAt(atT3)},complete:false});
 }
});
await check('small pool history pages give the same result',async()=>{
 const full=await scan('Alice',top,{strategy:'blocks'}),history=historyRpc(top);
 const result=await sdk.scanC6Pool({rpc:history.call,historyPageLimit:1,deployment,identity:identities.Alice});
 assert.deepEqual(result,full);assert.equal(history.counts.getprivacypoolupdates,full.events.length);
 await assert.rejects(sdk.scanC6Pool({rpc:history.call,historyPageLimit:0,deployment,identity:identities.Alice}),/page limit/);
});
await check('auto mode continues with the spent index in the same pass when pool history is unavailable',async()=>{
 const full=await scan('Alice',atT3,{strategy:'blocks'});
 const missing=historyRpc(atT3,{fail:()=>true}),result=await sdk.scanC6Pool({rpc:missing.call,deployment,identity:identities.Alice});
 assert.deepEqual(result,full);assert.equal(missing.counts.getprivacypoolupdates,1);assert.equal(missing.counts.getspentinfo,full.events.length+1);
 // A page that fails later keeps the transitions already applied.
 const later=historyRpc(atT3,{fail:n=>n===2}),resumed=await sdk.scanC6Pool({rpc:later.call,historyPageLimit:2,deployment,identity:identities.Alice});
 assert.deepEqual(resumed,full);assert.equal(later.counts.getspentinfo,full.events.length-2+1);
 await assert.rejects(sdk.scanC6Pool({rpc:missing.call,strategy:'pool-history',deployment,identity:identities.Alice}),/pool history unavailable/);
});
await check('contradictory pool history fails closed instead of falling back',async()=>{
 const alter={
  sequence:page=>{page.updates[1].sequence=7;return page;},
  skipped:page=>{page.updates.splice(1,1);return page;},
  input:page=>{page.updates[0].input_index=1;return page;},
  snapshot:page=>({...page,snapshot:{height:atT3-1,hash:hashAt(atT3-1)}}),
  pool:page=>({...page,pool_id:'11'.repeat(32)}),
  raw:page=>{page.updates[0].raw=page.updates[1].raw;return page;},
  truncated:page=>({...page,updates:page.updates.slice(0,1),current_state:page.updates[0].state}),
 };
 for(const [name,mutate] of Object.entries(alter)){
  await assert.rejects(sdk.scanC6Pool({rpc:historyRpc(atT3,{mutate}).call,deployment,identity:identities.Alice}),/pool history|binding|omitted/,name);
 }
});
await check('pool history pins the captured tip while the chain grows',async()=>{
 const full=await scan('Alice',atT3,{strategy:'blocks'});
 const history=historyRpc(top,{chainTarget:top});let heightReads=0;
 const rpc=async(m,p=[])=>m==='getblockcount'?(++heightReads===1?atT3:top):history.call(m,p);
 const result=await sdk.scanC6Pool({rpc,deployment,identity:identities.Alice});
 assert.deepEqual(result,full);assert.equal(history.cursors[0].snapshot.height,atT3);
 // The state live at the captured tip was spent later: its spender is confirmed above it.
 assert.equal(history.counts.getspentinfo,1);
});
await check('pool history resumes from the saved snapshot with a cursor at its state',async()=>{
 const store=checkpointStore();const first=await scan('Alice',atT3,{checkpointStore:store,rpc:historyRpc(atT3).call});
 const next=historyRpc(top),result=await scan('Alice',top,{checkpointStore:store,rpc:next.call});
 assert.deepEqual(result,await scan('Alice',top));assert.equal(next.counts.getrawtransaction??0,0);assert.equal(next.counts.getprivacypoolupdates,1);
 assert.equal(next.cursors[0].sequence,first.events.length);assert.equal(next.cursors[0].position.txid+':0',first.statePoint);
 // A snapshot saved before pool-history support has no state block: the spent index resumes it.
 const [key,cipher]=[...store.values.entries()].find(([k])=>k.startsWith('c6-scan-state-v2:'));
 const envelope=identities.Alice.openCheckpoint(cipher),v=JSON.parse(envelope.data);delete v.pointBlock;envelope.data=JSON.stringify(v);store.values.set(key,identities.Alice.sealCheckpoint(envelope));
 const old=historyRpc(top),again=await scan('Alice',top,{checkpointStore:store,rpc:old.call});
 assert.deepEqual(again,result);assert.equal(old.counts.getprivacypoolupdates??0,0);assert.equal(old.counts.getspentinfo,1);
});
