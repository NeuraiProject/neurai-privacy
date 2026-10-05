import test from 'node:test';
import assert from 'node:assert/strict';
import {C6ScanCheckpoint} from '../src/c6-scan-checkpoint.js';
const deployment={genesis:'11'.repeat(32),commitment:'22'.repeat(32),anchor:{outpoint:'33'.repeat(32)+':0',hash:'44'.repeat(32),height:10}};
// Encoding is synthetic in these bounds-only tests. Scanner tests exercise AEAD.
const identity={checkpointStoreId:()=> 'id',sealCheckpoint:JSON.stringify,openCheckpoint:JSON.parse};
function make(){let cipher=null,writes=0;return {cache:new C6ScanCheckpoint({deployment,identity,assertLive:()=>{},store:{read:async()=>cipher,compareAndSwap:async(_,expected,next)=>{assert.equal(expected,cipher);cipher=next;writes++;return true;}}}),get writes(){return writes;},set cipher(v){cipher=v;}};}
test('checkpoint capacity limits reject oversized histories without writing or losing the saved prefix',async()=>{
 const h=make();assert.ok(h.cache.key.length<=200);assert.notEqual(h.cache.key,'id:'+deployment.genesis+':'+deployment.commitment);await h.cache.load();assert.equal(await h.cache.save([]),true);
 const row={height:10,hash:'44'.repeat(32),raw:'00'.repeat(500000)};
 assert.equal(await h.cache.save([row,row,row]),false);assert.equal(await h.cache.save(Array(2049).fill(row)),false);assert.equal(h.writes,1);assert.deepEqual(h.cache.entries,[]);
});
test('checkpoint validates row bounds and scope before using stored progress',async()=>{
 for(const patch of [{height:9},{hash:'invalid'},{raw:'XYZ'},{raw:'00'.repeat(500001)}]){
  const h=make();h.cipher=JSON.stringify({...h.cache.value([{height:10,hash:'44'.repeat(32),raw:'00',...patch}])});assert.deepEqual(await h.cache.load(),[]);
 }
});
test('checkpoint checks cancellation after asynchronous persistence',async()=>{
 let alive=true;const c=new C6ScanCheckpoint({deployment,identity,assertLive:()=>{if(!alive)throw Error('locked');},store:{read:async()=>null,compareAndSwap:async()=>{alive=false;return true;}}});await c.load();await assert.rejects(c.save([]),/locked/);
});
