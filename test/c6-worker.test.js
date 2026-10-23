/* Lifecycle tests use a synthetic prover. Real proofs are exercised separately. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as sdk from '../src/browser.js';
import {formatXna} from '../src/amounts.js';
const fixture=JSON.parse(await fs.readFile(new URL('./fixtures/c6-operations-chain.json',import.meta.url)));
const {deployment,replies}=fixture,domain='6ea8abf30e23d97dcce7892186e82bea3b5ec01d644bc608c5e3e9a77e336ea6';
const hash=s=>createHash('sha256').update(s).digest('hex'),assetId=hash('C6/XNA/TEST'),bytes=s=>new Uint8Array(Buffer.from(s,'hex'));
const txid=fixture.operations.find(r=>r.label==='T3-pay').txid;
const height=Object.values(replies).find(r=>r?.height!==undefined&&r.tx?.some(t=>t.txid===txid)).height+1;
const network=Buffer.from(bytes(deployment.genesis)).reverse().toString('hex');
const ctx=Buffer.from(sdk.poseidonBytes(new Uint8Array([...new TextEncoder().encode('NeuraiPoolCtx\x01'),...bytes(domain),...bytes(assetId),1,0,0,0,0,0,0,0,...new Uint8Array(32)]))).toString('hex');
const manifest={profile:'C6-XNA-TEST-J2-v2',network,commitment:deployment.commitment,context:ctx,fees:Object.fromEntries(['D','T1','T2','T3','W'].map(op=>[op,['10000000']]))};
const payload=new Uint8Array([1,2,3]),meta={bytes:3,sha256:hash(payload)};
const vk=new TextEncoder().encode('{}');
const artifacts={files:{wasm:meta,zkey:meta,vk:{bytes:vk.length,sha256:hash(vk)}},forms:Object.fromEntries(['D','T1','T2','T3','W'].map(op=>[op,{wasm:'wasm',zkey:'zkey',vk:'vk'}]))};
const fetchArtifact=async path=>new Response(path==='vk'?vk:payload);
const backup=await sdk.sealVault({spend_key:hash('C6 API TEST spend Alice'),view_seed:hash('C6 API TEST view Alice')},'TEST password only');
function make(extra={}){
 let input;const messages=[];
 const api={wtns:{calculate:async i=>{input=i;}},groth16:{prove:async()=>({proof:{pi_a:['1','2'],pi_b:[['1','2'],['3','4']],pi_c:['1','2']},publicSignals:(input.spentNote?
  (input.pay?[input.ctx,input.R,input.nf,input.amount,input.fee,input.pay,input.cm_change,input.data_hash]:[input.ctx,input.R,input.nf,input.data_hash,input.fee,...input.cms])
  :[input.ctx,input.dep,input.data_hash,input.amount,input.fee]).map(String)}),verify:async()=>true}};
 const scope={navigator:{},postMessage:m=>{
  messages.push(structuredClone(m));
  if(m.type==='rpc')queueMicrotask(()=>{
   // A node without indexes: no spent index and no pool history pages.
   if(m.method==='getspentinfo'||m.method==='gettxout'||m.method==='getprivacypoolupdates'){void scope.onmessage?.({data:{type:'rpc-result',id:m.id,error:'Index unavailable in synthetic RPC'}});return;}
   let result;if(m.method==='getblockcount')result=height;else if(m.method==='getbestblockhash')result=replies['getblockhash\0'+JSON.stringify([height])];else result=replies[m.method+'\0'+JSON.stringify(m.params)];
   assert.notEqual(result,undefined);void scope.onmessage?.({data:{type:'rpc-result',id:m.id,result:structuredClone(result)}});
  });
 }};
 const config={scope,snarkjs:api,manifest,deployment,domain,assetId,network:'testnet',expectedGenesis:network,expectedCommitment:deployment.commitment,artifacts,fetchArtifact,reservations:[],...extra};
 const handle=sdk.startC6PoolWorker(config);
 const send=async data=>{const at=messages.length;await scope.onmessage({data});return messages.slice(at);};
 const restore=()=>send({type:'restore',backup,password:'TEST password only'});
 return {scope,messages,handle,send,restore,api};
}
const errors=messages=>messages.filter(m=>m.type==='error');
const prepared=messages=>messages.find(m=>m.type==='prepared');

test('C6 worker refuses unpinned configurations, missing journals and production network',()=>{
 for(const extra of [{expectedCommitment:'11'.repeat(32)},{expectedGenesis:'22'.repeat(32)},{network:'mainnet'},{reservations:undefined},{artifacts:{files:{},forms:{}}},{maxArtifactBytes:0}])assert.throws(()=>make(extra));
});
test('C6 worker restores, scans and exposes summaries without private notes or paths',async()=>{
 const h=make();assert.equal(errors(await h.restore()).length,0);
 const scan=(await h.send({type:'scan'})).find(m=>m.type==='scan');assert.equal(scan.result.balanceAtomic,'39970000000');
 assert.equal(scan.result.spendableAtomic,'39970000000');assert.ok(scan.result.notes.every(n=>!('note'in n)&&!('path'in n)&&!('nf'in n)));
 assert.ok(!JSON.stringify(scan).includes(hash('C6 API TEST spend Alice')));h.handle.stop();
});
test('C6 worker builds D/T/W public packets and reserves exposed notes',async()=>{
 for(const action of ['deposit','transfer','withdraw']){
  const h=make();await h.restore();
  const note=(await h.send({type:'scan'})).find(m=>m.type==='scan').result.notes[0].cm;
  const identity=h.messages.find(m=>m.type==='identity');
  const args=action==='deposit'?{amountAtomic:'10000000000',funding:'11'.repeat(36),fundingValue:'10010000000'}:
    action==='withdraw'?{note,amountAtomic:'30000000000',payoutScript:'76a914'+'33'.repeat(20)+'88ac'}:
    {note,recipients:[{recipient:identity.recipient,amountAtomic:'10000000000'},{recipient:identity.recipient,amountAtomic:'10000000000'}]};
  const messages=await h.send({type:'prepare',action,fee:'10000000',...args});assert.deepEqual(errors(messages),[]);
  const p=prepared(messages);assert.ok(p);assert.ok(p.result.packet instanceof Uint8Array);assert.equal(p.result.requiresDurableJournal,true);
  assert.equal(p.result.resources.length,action==='deposit'?0:1);
  assert.ok(!JSON.stringify(p).includes(hash('C6 API TEST spend Alice')));assert.ok(!('input'in p.result));
  if(action!=='deposit'){
   const current=(await h.send({type:'scan'})).find(m=>m.type==='scan');assert.equal(current.result.spendableAtomic,'0');
   assert.match(errors(await h.send({type:'prepare',action,fee:'10000000',...args}))[0].message,/reserved/);
  }
  h.handle.stop();
 }
});
test('C6 worker rejects corrupt proving artifacts and never emits a packet',async()=>{
 const h=make({fetchArtifact:async()=>new Response(new Uint8Array([3,2,1]))});await h.restore();
 const result=await h.send({type:'prepare',action:'deposit',fee:'10000000',amountAtomic:'10000000000',funding:'11'.repeat(36),fundingValue:'10010000000'});
 assert.match(errors(result)[0].message,/integrity/);assert.equal(prepared(result),undefined);h.handle.stop();
});
test('C6 worker lock cancels a live RPC; late replies cannot restore a balance',async()=>{
 const h=make();await h.restore();
 h.scope.postMessage=m=>h.messages.push(structuredClone(m));
 const pending=h.send({type:'scan'});await Promise.resolve();
 const request=h.messages.at(-1);assert.equal(request.type,'rpc');
 await h.send({type:'lock'});await pending;
 await h.send({type:'rpc-result',id:request.id,result:replies['getblockchaininfo\0[]']});
 assert.equal(h.messages.filter(m=>m.type==='scan').length,0);
 assert.match(errors(await h.send({type:'scan'}))[0].message,/unlock/);h.handle.stop();
});
test('C6 worker lock/stop suppress proofs across every asynchronous prover phase',async()=>{
 for(const phase of ['calculate','prove','verify'])for(const finish of ['lock','stop']){
  const h=make();await h.restore();let enter,resume;
  const entered=new Promise(r=>{enter=r;}),paused=new Promise(r=>{resume=r;});
  const wait=async()=>{enter();await paused;};
  const owner=phase==='calculate'?h.api.wtns:h.api.groth16,original=owner[phase];
  owner[phase]=async(...args)=>{await wait();return original(...args);};
  const job=h.send({type:'prepare',action:'deposit',fee:'10000000',amountAtomic:'10000000000',funding:'11'.repeat(36),fundingValue:'10010000000'});
  await entered;
  if(finish==='lock')await h.send({type:'lock'});else h.handle.stop();
  resume();const result=await job;assert.equal(prepared(result),undefined);
  if(finish==='lock')assert.match(errors(await h.send({type:'scan'}))[0].message,/unlock/);
  h.handle.stop();
 }
});

test('C6 full worker durably reserves, relocates, resumes and rejects changed signed intent',async()=>{
 const config=JSON.parse(await fs.readFile(new URL('./fixtures/c6-relocation-config.json',import.meta.url)));
 const h=make({manifest:config.manifest,artifacts:{...artifacts,forms:{...artifacts.forms,J2:artifacts.forms.T1}},buildTransactions:true,durableJournal:true});
 const original=h.scope.postMessage;let encrypted=null;const storage=new Map();
 h.scope.postMessage=m=>{
  if(m.type==='journal-read'||m.type==='journal-write'){
   h.messages.push(structuredClone(m));let result=storage.get(m.key)??null;
   if(m.type==='journal-write'){result=(storage.get(m.key)??null)===m.expected;if(result){storage.set(m.key,m.replacement);if(!m.key.startsWith('c6-scan-prefix-v1:'))encrypted=m.replacement;}}
   queueMicrotask(()=>void h.scope.onmessage({data:{type:'journal-result',id:m.id,result}}));
  }else original(m);
 };
 await h.restore();
 const readonly=(await h.send({type:'scan'})).find(m=>m.type==='scan');
 assert.equal(readonly.result.balanceAtomic,'39970000000');assert.equal(readonly.result.historyReady,false);assert.equal(readonly.result.spendableAtomic,'0');
 assert.ok(readonly.result.notes.every(n=>n.reserved&&!n.spendable));
 assert.match(errors(await h.send({type:'prepare',action:'deposit'}))[0].message,/history required/);
 assert.equal(errors(await h.send({type:'journal-open',create:true})).length,0);
 const note=(await h.send({type:'scan'})).find(m=>m.type==='scan').result.notes[0].cm;
 const recipient=h.messages.find(m=>m.type==='identity').recipient;
 const messages=await h.send({type:'prepare',action:'transfer',note,fee:'10000000',recipients:[{recipient,amountAtomic:'10000000000'}]});
 assert.deepEqual(errors(messages),[]);const result=prepared(messages).result;
 assert.ok(result.transaction.raw);assert.ok(result.operationId);assert.ok(!('resources' in result),'private cm/nullifier links stay in the encrypted worker journal');assert.ok(encrypted&&!encrypted.includes(note));
 const backup=(await h.send({type:'journal-backup'})).find(m=>m.type==='backup').result;
 assert.equal(backup.type,'neurai-c6-private-journal-v1');assert.ok(!JSON.stringify(backup).includes(hash('C6 API TEST spend Alice')));
 const after=(await h.send({type:'scan'})).find(m=>m.type==='scan').result;assert.equal(after.spendableAtomic,'0');
 assert.match(errors(await h.send({type:'release-draft',id:result.operationId}))[0].message,/cannot be cancelled/);
 const resumed=await h.send({type:'rebuild',id:result.operationId});assert.deepEqual(errors(resumed),[]);assert.equal(prepared(resumed).result.transaction.raw,result.transaction.raw);
 const signed=await h.send({type:'record-signed',id:result.operationId,raw:result.transaction.raw});assert.deepEqual(errors(signed),[]);assert.ok(signed.find(m=>m.type==='signed'));
 const bad=result.transaction.raw.slice(0,-8)+'01000000';assert.match(errors(await h.send({type:'record-signed',id:result.operationId,raw:bad}))[0].message,/changed private intent/);
 assert.deepEqual(errors(await h.send({type:'record-broadcast',id:result.operationId})),[]);
 h.handle.stop();
});

test('C6 worker rejects explicit empty RPC and storage errors instead of resolving undefined',async()=>{
 const h=make();await h.restore();
 h.scope.postMessage=m=>{h.messages.push(structuredClone(m));if(m.type==='rpc')queueMicrotask(()=>h.scope.onmessage({data:{type:'rpc-result',id:m.id,error:''}}));};
 const result=await h.send({type:'scan'});assert.match(errors(result)[0].message,/host request failed/);assert.equal(result.some(m=>m.type==='scan'),false);h.handle.stop();
});


test('C6 worker reuses only an unchanged mature confirmed state',async()=>{
 const h=make();await h.restore();
 const first=(await h.send({type:'scan'})).find(m=>m.type==='scan');
 const point=first.result.statePoint,[id,vout]=point.split(':');
 const block=Object.values(replies).find(b=>b?.tx?.some(t=>t.txid===id));
 const tx=block.tx.find(t=>t.txid===id),original=h.scope.postMessage;
 let wrong=false;
 h.scope.postMessage=m=>{
  if(m.type==='rpc'&&m.method==='gettxout'&&m.params[0]===id){
   h.messages.push(structuredClone(m));const output=tx.vout[Number(m.params[1])];
   queueMicrotask(()=>h.scope.onmessage({data:{type:'rpc-result',id:m.id,result:{...output,value:Number(m.params[1])===1?formatXna(first.result.reserveAtomic):'0',confirmations:height-block.height+1,...(wrong?{scriptPubKey:{hex:'51'}}:{})}}}));
  }else original(m);
 };
 const second=await h.send({type:'scan'});assert.deepEqual(errors(second),[]);
 assert.equal(second.find(m=>m.type==='scan').result.balanceAtomic,first.result.balanceAtomic);
 assert.equal(second.filter(m=>m.type==='rpc'&&['getrawtransaction','getblock','getspentinfo'].includes(m.method)).length,0);
 assert.equal(second.some(m=>m.type==='stage'&&m.message==='Recovering private notes on this device'),false);
 wrong=true;const third=await h.send({type:'scan'});
 assert.ok(third.some(m=>m.type==='rpc'&&m.method==='getblock'),'mismatched state must force complete checking');
 assert.equal(third.find(m=>m.type==='scan').result.balanceAtomic,first.result.balanceAtomic,'only full chain recovery can restore this balance');h.handle.stop();
});
