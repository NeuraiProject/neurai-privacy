/* API lifecycle tests use real C7 notes and Merkle paths, but a synthetic
 * prover to control await scheduling. They do not test ZK/consensus acceptance.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as sdk from '../src/browser.js';
const v=JSON.parse(readFileSync(new URL('./fixtures/c7-vectors.json',import.meta.url)));
const hex=b=>Buffer.from(b).toString('hex');
const cat=(...parts)=>Uint8Array.from(Buffer.concat(parts.map(b=>Buffer.from(b))));
const pair=(left,right)=>sdk.encodeField(sdk.poseidonPermutation([0n,sdk.decodeField(left),sdk.decodeField(right)])[0]);
const wait=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
test('C7 J2: pinned instance and 40 await/intent/ownership controls',async()=>{
 async function check(name,job){try{await job();}catch(error){throw new Error(name,{cause:error});}}
 const inst=v.instance,a=v.accounts.find(x=>x.name==='A'),domain=Buffer.from(inst.domain,'hex'),assetId=Buffer.from(inst.asset_id,'hex');
 const A=new sdk.C7Account(Uint8Array.from(Buffer.from(a.R,'hex')),{family:a.family,account:a.account,domain:inst.domain,assetId:inst.asset_id});
 const addresses=[[0,2],[1,0]];
 const rows=addresses.map(([chain,at],index)=>{
  const sealed=sdk.sealC7Note({descriptor:A.descriptor(chain,at),amountAtomic:BigInt(200+index*100)*100000000n});
  const recovered=A.scan(sealed.record,sealed.cm,{full:true});
  assert.deepEqual(recovered.note,sealed.note);assert.deepEqual([recovered.chain,recovered.index],[chain,at]);
  return {...sealed,nf:recovered.nf,spendSecret:A.spendKeys(chain,at).spendSecret,index};
 });
 const zeros=[sdk.encodeField(0n)];for(let i=0;i<31;i++)zeros.push(pair(zeros[i],zeros[i]));
 let root=pair(rows[0].cm,rows[1].cm);for(let i=1;i<32;i++)root=pair(root,zeros[i]);
 const notes=rows.map((row,index)=>({note:row.note,spendSecret:row.spendSecret,index,path:[rows[1-index].cm,...zeros.slice(1)]}));
 const context=sdk.poseidonBytes(cat(new TextEncoder().encode('NeuraiPoolCtx\x01'),domain,assetId,Uint8Array.of(1,0,0,0,0,0,0,0),new Uint8Array(32)));
 assert.equal(hex(context),hex(sdk.c7Context(domain,assetId)));
 const manifest={profile:sdk.C7_PROFILE,context:hex(context),fees:{J2:['10000000']},network:'11'.repeat(32),commitment:'22'.repeat(32)};
 const wallet=sdk.createC7JoinWallet({expectedGenesis:manifest.network,expectedCommitment:manifest.commitment});
 const request={manifest,domain,assetId,root,notes,fee:'10000000',change:A.descriptor(0,2)};
 await check('public API requires independent instance pins',async()=>assert.throws(()=>sdk.createC7JoinWallet(),/independently pinned/));
 await check('public API holds XNA only',async()=>assert.throws(()=>sdk.createC7JoinWallet({expectedGenesis:manifest.network,expectedCommitment:manifest.commitment,kind:'asset'}),/hold XNA/));
 await check('proving before any prepare is refused',async()=>assert.throws(()=>sdk.createC7JoinWallet({expectedGenesis:manifest.network,expectedCommitment:manifest.commitment}).prove({}),/Prepare a pinned J2 first/));
 await check('public API rejects a different network',async()=>assert.throws(()=>wallet.prepare({...request,manifest:{...manifest,network:'33'.repeat(32)}}),/pinned instance/));
 await check('public API rejects a different pool',async()=>assert.throws(()=>wallet.prepare({...request,manifest:{...manifest,commitment:'33'.repeat(32)}}),/pinned instance/));
 for(const profile of ['C5','C6-XNA-TEST-J2-v2','C6-ORDINARY-ASSET-TEST-J2-v1'])
  await check('public API rejects a '+profile+' manifest',async()=>assert.throws(()=>wallet.prepare({...request,manifest:{...manifest,profile}}),/manifest profile/));
 await check('public API validates its private domain/asset context before proving',async()=>assert.throws(()=>wallet.prepare({...request,domain:new Uint8Array(32)}),/context mismatch/));
 await check('the joined note goes to the address of note 0',async()=>{
  assert.throws(()=>wallet.prepare({...request,change:undefined}),/address of note 0/);
  assert.throws(()=>wallet.prepare({...request,change:A.descriptor(1,0)}),/address of note 0/);
 });
 await check('two TEST notes are recovered locally from independently encrypted records',async()=>{
  assert.notDeepEqual(rows[0].note.slice(65,97),rows[1].note.slice(65,97));
 });
 await check('prepare preserves both note reservations and exact conservation',async()=>{
  const prepared=wallet.prepare(request);
  assert.equal(sdk.decodeNote(prepared.created.note).amountAtomic,49990000000n);
  assert.deepEqual(prepared.resources,rows.map(row=>({cm:hex(row.cm),nf:hex(row.nf)})));
  const joined=A.scan(prepared.created.record,prepared.created.cm);
  assert.deepEqual([joined.chain,joined.index,joined.amountAtomic],[0,2,49990000000n]);
  assert.equal(prepared.blob[98],2);assert.ok(prepared.blob.slice(328).every(b=>b===0));
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
