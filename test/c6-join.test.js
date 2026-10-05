/* API lifecycle tests use real notes, HPKE and Merkle paths, but a synthetic
 * prover to control await scheduling. They do not test ZK/consensus acceptance.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as sdk from '../src/browser.js';
import {createC6JoinWallet} from '../src/c6-join.js';
import {sha256} from '@noble/hashes/sha2.js';
const module={createC6JoinWallet};
const hex=b=>Buffer.from(b).toString('hex');
const cat=(...parts)=>Uint8Array.from(Buffer.concat(parts.map(b=>Buffer.from(b))));
const pair=(left,right)=>sdk.encodeField(sdk.poseidonPermutation([0n,sdk.decodeField(left),sdk.decodeField(right)])[0]);
const wait=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
test('C6 J2: pinned instance and 40 await/intent/ownership controls',async()=>{
 async function check(name,job){try{await job();}catch(error){throw new Error(name,{cause:error});}}
 const domain=new Uint8Array(32).fill(1),assetId=new Uint8Array(32).fill(2);
 const rows=[3,4].map((value,index)=>{
  const secret=new Uint8Array(32).fill(value),viewSeed=new Uint8Array(32).fill(value+2);
  const sealed=sdk.sealNote({descriptor:{domain:hex(domain),asset_id:hex(assetId),owner:hex(sdk.deriveOwner(domain,secret)),view_pub:hex(sdk.deriveViewPublic(viewSeed))},amountAtomic:BigInt(200+index*100)*100000000n});
  const recovered=sdk.openNoteRecord({record:sealed.record,cm:sealed.cm,domain,assetId,viewSeed,spendSecret:secret});
  assert.deepEqual(recovered.note,sealed.note);
  return {...sealed,nf:recovered.nf,spendSecret:secret,index};
 });
 const zeros=[sdk.encodeField(0n)];for(let i=0;i<31;i++)zeros.push(pair(zeros[i],zeros[i]));
 let root=pair(rows[0].cm,rows[1].cm);for(let i=1;i<32;i++)root=pair(root,zeros[i]);
 const notes=rows.map((row,index)=>({note:row.note,spendSecret:row.spendSecret,index,path:[rows[1-index].cm,...zeros.slice(1)]}));
 const context=sdk.poseidonBytes(cat(new TextEncoder().encode('NeuraiPoolCtx\x01'),domain,assetId,Uint8Array.of(1,0,0,0,0,0,0,0),new Uint8Array(32)));
 const manifest={profile:'C6-XNA-TEST-J2-v2',context:hex(context),fees:{J2:['10000000']},network:'11'.repeat(32),commitment:'22'.repeat(32)};
 const wallet=module.createJoinWallet?module.createJoinWallet({...sdk,sha256}):module.createC6JoinWallet({expectedGenesis:manifest.network,expectedCommitment:manifest.commitment});
 const request={manifest,domain,assetId,root,notes,fee:'10000000'};
 if(module.createC6JoinWallet){
  await check('public API requires independent instance pins',async()=>assert.throws(()=>module.createC6JoinWallet(),/independently pinned/));
  await check('public API rejects a different network',async()=>assert.throws(()=>wallet.prepare({...request,manifest:{...manifest,network:'33'.repeat(32)}}),/pinned instance/));
  await check('public API rejects a different pool',async()=>assert.throws(()=>wallet.prepare({...request,manifest:{...manifest,commitment:'33'.repeat(32)}}),/pinned instance/));
  await check('public API rejects C4 or C5 manifest reuse',async()=>assert.throws(()=>wallet.prepare({...request,manifest:{...manifest,profile:'C5'}}),/manifest profile/));
  await check('public API validates its private domain/asset context before proving',async()=>assert.throws(()=>wallet.prepare({...request,domain:new Uint8Array(32)}),/context mismatch/));
 }
 await check('two TEST notes are recovered locally from independently encrypted records',async()=>{
  assert.notDeepEqual(rows[0].note.slice(65,97),rows[1].note.slice(65,97));
 });
 await check('prepare preserves both note reservations and exact conservation',async()=>{
  const prepared=wallet.prepare(request);
  assert.equal(sdk.decodeNote(prepared.created.note).amountAtomic,49990000000n);
  assert.deepEqual(prepared.resources,rows.map(row=>({cm:hex(row.cm),nf:hex(row.nf)})));
 });
 const proof={pi_a:['1','2'],pi_b:[['1','2'],['3','4']],pi_c:['1','2']};
 function prover(prepared,calculate=async()=>{}){
  return {wtns:{calculate},groth16:{prove:async()=>({proof,publicSignals:prepared.publics.slice()}),verify:async()=>true}};
 }
 await check('unchanged prepared intent produces the expected public packet layout',async()=>{
  const prepared=wallet.prepare(request),result=await wallet.prove(prepared,{api:prover(prepared)});
  assert.equal(result.packet.length,4526);
  assert.equal(hex(result.packet.slice(8,40)),manifest.network);
  assert.equal(hex(result.packet.slice(40,72)),manifest.commitment);
  assert.deepEqual(result.packet.slice(428,4524),prepared.blob);
 });
 await check('a mutation before proving is rejected without invoking the prover',async()=>{
  const prepared=wallet.prepare(request);prepared.blob[4095]^=1;
  let called=false;
  await assert.rejects(()=>wallet.prove(prepared,{api:prover(prepared,async()=>{called=true;})}),/intent changed/);
  assert.equal(called,false);
 });
 await check('cancellation during the witness wait produces no packet',async()=>{
  const prepared=wallet.prepare(request),entered=wait(),resume=wait(),controller=new AbortController();
  const proving=wallet.prove(prepared,{api:prover(prepared,async()=>{entered.resolve();await resume.promise;}),signal:controller.signal});
  const rejected=assert.rejects(proving,/Aborted locally/);
  await entered.promise;controller.abort();resume.resolve();await rejected;
 });
 await check('a changed publication during the witness wait is rejected before packet creation',async()=>{
  const prepared=wallet.prepare(request),entered=wait(),resume=wait();let returned;
  const proving=wallet.prove(prepared,{api:prover(prepared,async()=>{entered.resolve();await resume.promise;})}).then(result=>{returned=result;return result;});
  const rejection=assert.rejects(proving,/intent changed/);
  await entered.promise;prepared.blob[4095]^=1;resume.resolve();
  await rejection;
 });
 const mutations={
  publication:prepared=>{prepared.blob[4095]^=1;},
  publics:prepared=>{prepared.publics[5]='20000000';},
  network:prepared=>{prepared.network[0]^=1;},
  pool:prepared=>{prepared.pool[0]^=1;},
  privateInput:prepared=>{prepared.input.spentAmount[0]='1';},
  reservations:prepared=>{prepared.resources[0].nf='33'.repeat(32);},
  outputRecord:prepared=>{prepared.created.record[10]^=1;},
 };
 for(const phase of ['calculate','prove','verify'])for(const [name,mutate] of Object.entries(mutations)){
  await check(`${name} changed during ${phase} produces no packet`,async()=>{
   const prepared=wallet.prepare(request),entered=wait(),resume=wait();
   const result={proof:structuredClone(proof),publicSignals:prepared.publics.slice()};
   const pause=async()=>{entered.resolve();await resume.promise;};
   const api={wtns:{calculate:async()=>{if(phase==='calculate')await pause();}},groth16:{
    prove:async()=>{if(phase==='prove')await pause();return result;},
    verify:async()=>{if(phase==='verify')await pause();return true;},
   }};
   const proving=wallet.prove(prepared,{api});
   const rejected=assert.rejects(proving,/intent changed/);
   await entered.promise;mutate(prepared);resume.resolve();await rejected;
  });
 }
 for(const phase of ['calculate','prove','verify']){
  await check(`cancellation during ${phase} produces no packet`,async()=>{
   const prepared=wallet.prepare(request),entered=wait(),resume=wait(),controller=new AbortController();
   const pause=async()=>{entered.resolve();await resume.promise;};
   const api={wtns:{calculate:async()=>{if(phase==='calculate')await pause();}},groth16:{
    prove:async()=>{if(phase==='prove')await pause();return {proof:structuredClone(proof),publicSignals:prepared.publics.slice()};},
    verify:async()=>{if(phase==='verify')await pause();return true;},
   }};
   const rejected=assert.rejects(wallet.prove(prepared,{api,signal:controller.signal}),/Aborted locally/);
   await entered.promise;controller.abort();resume.resolve();await rejected;
  });
 }
 await check('progress callbacks cannot alter an intent before calculating its witness',async()=>{
  const prepared=wallet.prepare(request);let calculated=false;
  await assert.rejects(()=>wallet.prove(prepared,{api:prover(prepared,async()=>{calculated=true;}),stage:()=>{prepared.pool[0]^=1;}}),/intent changed/);
  assert.equal(calculated,false);
 });
 await check('witness and verification arguments share no mutable data with the caller',async()=>{
  const prepared=wallet.prepare(request),original=structuredClone(prepared);
  const api={wtns:{calculate:async input=>{assert.notEqual(input,prepared.input);assert.notEqual(input.sk,prepared.input.sk);input.sk[0][0]='255';}},groth16:{
   prove:async()=>({proof:structuredClone(proof),publicSignals:prepared.publics.slice()}),
   verify:async(_vk,signals,value)=>{signals[0]='0';value.pi_a[0]='0';return true;},
  }};
  const result=await wallet.prove(prepared,{api});
  assert.deepEqual(prepared,original);assert.deepEqual(result.publicSignals,original.publics);
  assert.deepEqual(result.proof,proof);
  assert.deepEqual(result.packet.slice(428,4524),original.blob);
  const P=sdk.poseidonBytes;
  const digest=P(cat(P(cat(P(new TextEncoder().encode('NeuraiPoolC6/J2/data\x01')),result.packet.slice(428,2476))),result.packet.slice(2476,4524)));
  assert.equal(String(sdk.decodeField(digest)),result.publicSignals[4]);
 });
 await check('a proof with other public signals cannot leave the wallet',async()=>{
  const prepared=wallet.prepare(request),signals=prepared.publics.slice();signals[0]='1';let verified=false;
  await assert.rejects(()=>wallet.prove(prepared,{api:{wtns:{calculate:async()=>{}},groth16:{prove:async()=>({proof,publicSignals:signals}),verify:async()=>{verified=true;return true;}}}}),/Public signals differ/);
  assert.equal(verified,false);
 });
 await check('a locally invalid proof cannot leave the wallet',async()=>{
  const prepared=wallet.prepare(request),api=prover(prepared);api.groth16.verify=async()=>false;
  await assert.rejects(()=>wallet.prove(prepared,{api}),/Invalid generated proof/);
 });
 await check('a structurally cloned plan is not an authorized prepared object',async()=>{
  const prepared=wallet.prepare(request);
  await assert.rejects(()=>wallet.prove(structuredClone(prepared),{api:prover(prepared)}),/intent changed/);
 });

});
