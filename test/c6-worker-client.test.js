/* Host transport regressions: no keys, signing or broadcast are involved. */
import test from 'node:test';import assert from 'node:assert/strict';
import {C6WorkerClient} from '../src/c6-worker-client.js';
const flush=()=>new Promise(r=>setTimeout(r,0));
function make(rpc=async()=>null){const sent=[],worker={postMessage:m=>sent.push(m),terminate(){this.closed=true;}},store={read:async()=>null,compareAndSwap:async()=>true};const client=new C6WorkerClient({worker,rpc,store});return {sent,worker,client};}
test('C6 bridge never serializes an empty rejected error as success',async()=>{
 const h=make(async()=>{throw Error();});await h.worker.onmessage({data:{type:'rpc',id:1,method:'getspentinfo',params:[]}});await flush();assert.ok(h.sent[0].error);assert.match(h.sent[0].error,/failed/);h.client.terminate();
});
test('C6 bridge preserves nested proxy RPC failures and rejects missing results',async()=>{
 for(const rpc of [async()=>{throw {error:{error:{message:'Unable to get spent info'}}};},async()=>({error:{error:{message:'Unable to get spent info'}}}),async()=>undefined]){
  const h=make(rpc);h.worker.onmessage({data:{type:'rpc',id:1,method:'getspentinfo',params:[]}});await flush();assert.match(h.sent[0].error,/Unable to get spent info|no result/);h.client.terminate();
 }
});
test('C6 bridge keeps legitimate null UTXOs as successful results',async()=>{const h=make();h.worker.onmessage({data:{type:'rpc',id:1,method:'gettxout',params:[]}});await flush();assert.equal(h.sent[0].result,null);assert.equal(h.sent[0].error,undefined);h.client.terminate();});
test('C6 message decode failure rejects pending work and terminates the worker',async()=>{const h=make(),request=h.client.scan();const rejection=assert.rejects(request,/could not be decoded/);h.worker.onmessageerror();await rejection;assert.equal(h.client.stopped,true);assert.equal(h.worker.closed,true);});
test('C6 postMessage failure never leaves a pending operation stuck',async()=>{const h=make();h.worker.postMessage=()=>{throw Error('DataCloneError');};await assert.rejects(h.client.scan(),/DataCloneError/);assert.equal(h.client.stopped,true);});
test('C6 termination suppresses late RPC replies',async()=>{let finish;const h=make(()=>new Promise(r=>{finish=r;}));h.worker.onmessage({data:{type:'rpc',id:1,method:'getblockcount',params:[]}});h.client.terminate();finish(100);await flush();assert.deepEqual(h.sent,[]);});
