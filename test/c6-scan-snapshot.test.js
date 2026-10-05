/* Storage tests use a transparent TEST identity; scanner tests exercise AEAD. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {C6ScanSnapshot} from '../src/c6-scan-snapshot.js';
function setup(){
 const values=new Map(),writes=[];
 const store={read:async k=>values.get(k)??null,compareAndSwap:async(k,expected,next)=>{writes.push(k);if((values.get(k)??null)!==expected)return false;values.set(k,next);return true;}};
 const identity={checkpointStoreId:()=> 'TEST wallet',sealCheckpoint:JSON.stringify,openCheckpoint:JSON.parse};
 const deployment={genesis:'11'.repeat(32),commitment:'22'.repeat(32),anchor:{height:3,outpoint:'33'.repeat(32)+':0'}};
 const create=extra=>new C6ScanSnapshot({store,identity,deployment,assertLive:()=>{},...extra});return {values,writes,store,identity,deployment,create};
}
test('snapshot round trips bytes and bigint, scopes the full deployment and rejects foreign envelopes',async()=>{
 const h=setup(),c=h.create();assert.equal(await c.load(),null);const input={note:new Uint8Array([0,1,255]),amount:90000000000n};assert.equal(await c.save(input),true);
 assert.deepEqual(await h.create().load(),input);
 const other=h.create({deployment:{...h.deployment,anchor:{...h.deployment.anchor,height:4}}});assert.notEqual(other.key,c.key);h.values.set(other.key,h.values.get(c.key));assert.equal(await other.load(),null);
});
test('snapshot bounds preserve the previous checkpoint without writes for oversized replacements',async()=>{
 const h=setup(),c=h.create();await c.load();await c.save({small:true});const cipher=h.values.get(c.key),writes=h.writes.length;
 assert.equal(await c.save({tooLarge:'a'.repeat(3*1024*1024)}),false);assert.equal(h.values.get(c.key),cipher);assert.equal(h.writes.length,writes);
});
test('snapshot refuses corrupt byte and bigint tags instead of returning malformed state',async()=>{
 for(const bad of [{$bytes:'zz'},{$bigint:'-1'},{$bytes:'00',extra:true}]){
  const h=setup(),c=h.create();await c.load();await c.save({okay:true});const envelope=JSON.parse(h.values.get(c.key));envelope.data=JSON.stringify(bad);h.values.set(c.key,JSON.stringify(envelope));assert.equal(await h.create().load(),null);
 }
});
test('snapshot checks cancellation after storage and rejects competing tab writes',async()=>{
 const h=setup(),c=h.create();await c.load();h.values.set(c.key,'another tab');await assert.rejects(c.save({state:1}),/another tab/);
 let live=true;const stopped=h.create({assertLive:()=>{if(!live)throw Error('cancelled');},store:{read:async()=>{live=false;return null;}}});await assert.rejects(stopped.load(),/cancelled/);
});
