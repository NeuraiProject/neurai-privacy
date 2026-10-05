/* Real note crypto and membership; synthetic proving only for await scheduling. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as sdk from '../src/browser.js';
import { decodeC4Publication, c4PublicationHash } from '../src/c4-publication.js';
const hex = b => Buffer.from(b).toString('hex');
const unhex = s => new Uint8Array(Buffer.from(s, 'hex'));
const coin = 100000000n, fee = 10000000n;
const D = new Uint8Array(32).fill(1), AID = new Uint8Array(32).fill(2);
const ctx = sdk.poseidonBytes(Uint8Array.from([...new TextEncoder().encode('NeuraiPoolCtx\x01'), ...D, ...AID, 1,0,0,0,0,0,0,0, ...new Uint8Array(32)]));
const manifest = { profile:'C6-XNA-TEST-J2-v2', network:'11'.repeat(32), commitment:'22'.repeat(32), context:hex(ctx),
  fees:Object.fromEntries(['D','T1','T2','T3','W'].map(op => [op, [String(fee), String(100n*coin)]])) };
const wallet = () => sdk.createC6OperationWallet({expectedGenesis:manifest.network, expectedCommitment:manifest.commitment});
const secret = new Uint8Array(32).fill(3), seed = new Uint8Array(32).fill(7);
const recipient = {domain:hex(D), asset_id:hex(AID), owner:hex(sdk.deriveOwner(D, secret)), view_pub:hex(sdk.deriveViewPublic(seed))};
const bob = {...recipient, owner:hex(sdk.deriveOwner(D,new Uint8Array(32).fill(4))), view_pub:hex(sdk.deriveViewPublic(new Uint8Array(32).fill(8)))};
const base = {manifest, domain:D, assetId:AID, fee};
const pair = (a,b) => sdk.encodeField(sdk.poseidonPermutation([0n,sdk.decodeField(a),sdk.decodeField(b)])[0]);
function spending(amount=500n*coin) {
  const created = sdk.sealNote({descriptor:recipient, amountAtomic:amount}), path=[];
  let root=created.cm, zero=sdk.encodeField(0n);
  for(let i=0;i<32;i++){path.push(zero);root=pair(root,zero);zero=pair(zero,zero);}
  return {root, spent:{note:created.note, spendSecret:secret, index:0, path}};
}
const common = spending();
const deposit = {...base, amountAtomic:500n*coin, recipient, funding:new Uint8Array(36).fill(5), fundingValue:500n*coin+fee};
const transfer = {...base,...common, operation:'T2', outputs:[{recipient:bob,amountAtomic:200n*coin},{isChange:true,amountAtomic:300n*coin-fee}]};
const payouts = [unhex('76a914'+'33'.repeat(20)+'88ac'),unhex('5220'+'33'.repeat(32)),unhex('5320'+'33'.repeat(32))];
const withdrawal = {...base,...common,amountAtomic:400n*coin,payoutScript:payouts[0]};
const fakeProof = {pi_a:['1','2'], pi_b:[['1','2'],['3','4']], pi_c:['1','2']};
const prover = p => ({wtns:{calculate:async()=>{}},groth16:{prove:async()=>({proof:fakeProof,publicSignals:p.publics.slice()}),verify:async()=>true}});

test('C6 D builds exact amount, publication and independently recoverable note',()=>{
  const p=wallet().prepareDeposit(deposit);
  assert.equal(p.publics.length,5);assert.equal(p.input.amount,String(500n*coin));
  assert.deepEqual(decodeC4Publication('D0',p.blob).cms,[p.created[0].cm]);
  assert.equal(String(sdk.decodeField(c4PublicationHash('D0',p.blob))),p.publics[2]);
  assert.equal(sdk.openNoteRecord({record:p.created[0].record,cm:p.created[0].cm,domain:D,assetId:AID,viewSeed:seed,spendSecret:secret}).amountAtomic,500n*coin);
});
test('C6 T1/T2/T3 conserve amount and authenticate fractional change',()=>{
  for(const count of [1,2,3]){
    const outputs=Array.from({length:count-1},()=>({recipient:bob,amountAtomic:100n*coin}));
    outputs.push({isChange:true,amountAtomic:500n*coin-BigInt(count-1)*100n*coin-fee});
    const p=wallet().prepareTransfer({...base,...common,operation:'T'+count,outputs});
    assert.equal(p.publics.length,5+count);
    assert.equal(p.created.reduce((n,row)=>n+sdk.decodeNote(row.note).amountAtomic,fee),500n*coin);
    assert.deepEqual(p.created.at(-1).note.slice(65,129),common.spent.note.slice(65,129));
    assert.deepEqual(decodeC4Publication('T'+count,p.blob).cms,p.created.map(row=>row.cm));
  }
});
test('C6 W supports Legacy/PQ/ECDSA and binds the complete payout script',()=>{
  const publics=[];
  for(const payoutScript of payouts){
    const p=wallet().prepareWithdrawal({...withdrawal,payoutScript});
    assert.equal(p.input.has_change,1);assert.equal(p.input.changeAmount,String(100n*coin-fee));
    assert.deepEqual(p.created[0].note.slice(65,129),common.spent.note.slice(65,129));
    assert.equal(p.publics.length,8);publics.push(p.publics[5]);
  }
  assert.equal(new Set(publics).size,3);
});
test('C6 W no-change uses canonical dummy and allows only full small-note recovery',()=>{
  const request={...withdrawal,...spending(9990000000n),amountAtomic:9980000000n};
  const p=wallet().prepareWithdrawal(request);
  assert.equal(p.input.has_change,0);assert.equal(p.input.changeAmount,'1');assert.equal(p.input.cm_change,'0');
  assert.equal(p.blob.length,0);assert.equal(p.created.length,0);
  assert.equal(p.publics[7],String(BigInt('0x04bf938a28af8bc7ab2810e0adf3cbbb55aa4feb79827feed2722c5123baac15')));
  assert.throws(()=>wallet().prepareWithdrawal({...request,amountAtomic:9970000000n}),/entire note/);
});
test('C6 rejects missing pins, other instances, unsupported profiles and unsafe fees',()=>{
  assert.throws(()=>sdk.createC6OperationWallet());
  for(const field of ['network','commitment','context'])assert.throws(()=>wallet().prepareDeposit({...deposit,manifest:{...manifest,[field]:'44'.repeat(32)}}));
  assert.throws(()=>wallet().prepareDeposit({...deposit,manifest:{...manifest,profile:'C5'}}));
  assert.throws(()=>wallet().prepareDeposit({...deposit,fee:0.1}));
  assert.throws(()=>wallet().prepareDeposit({...deposit,fee:'1'}));
  assert.throws(()=>wallet().prepareDeposit({...deposit,manifest:{...manifest,fees:{...manifest.fees,D:[Number.MAX_SAFE_INTEGER+1]}}}),/unsafe/);
});
test('C6 rejects fractional ordinary payments, unbalanced funding and negative amounts',()=>{
  assert.throws(()=>wallet().prepareDeposit({...deposit,amountAtomic:501n*coin}));
  assert.throws(()=>wallet().prepareDeposit({...deposit,fundingValue:deposit.fundingValue+1n}));
  assert.throws(()=>wallet().prepareDeposit({...deposit,amountAtomic:-1n}));
  assert.throws(()=>wallet().prepareTransfer({...transfer,outputs:[{recipient:bob,amountAtomic:201n*coin},{isChange:true,amountAtomic:299n*coin-fee}]}));
  assert.throws(()=>wallet().prepareTransfer({...transfer,outputs:[{recipient:bob,amountAtomic:200n*coin},{isChange:true,amountAtomic:300n*coin}]}));
  assert.throws(()=>wallet().prepareWithdrawal({...withdrawal,amountAtomic:401n*coin}));
  assert.throws(()=>wallet().prepareWithdrawal({...withdrawal,amountAtomic:600n*coin}));
});
test('C6 rejects false ownership, invalid membership, altered change and wrong shape',()=>{
  assert.throws(()=>wallet().prepareTransfer({...transfer,spent:{...common.spent,spendSecret:new Uint8Array(32).fill(4)}}));
  assert.throws(()=>wallet().prepareTransfer({...transfer,root:sdk.encodeField(1n)}));
  assert.throws(()=>wallet().prepareTransfer({...transfer,spent:{...common.spent,path:common.spent.path.slice(1)}}));
  assert.throws(()=>wallet().prepareTransfer({...transfer,outputs:[transfer.outputs[0],{...transfer.outputs[1],recipient:bob}]}));
  assert.throws(()=>wallet().prepareTransfer({...transfer,outputs:[{isChange:true,amountAtomic:200n*coin},{isChange:true,amountAtomic:300n*coin-fee}]}));
  assert.throws(()=>wallet().prepareTransfer({...transfer,outputs:[transfer.outputs[0]]}));
  assert.throws(()=>wallet().prepareTransfer({...transfer,outputs:[transfer.outputs[0],{...transfer.outputs[1],isChange:2}]}));
  assert.throws(()=>wallet().prepareWithdrawal({...withdrawal,payoutScript:unhex('5120'+'33'.repeat(32))}));
});
test('C6 packets use wire v1 and contain only public values, proofs and ciphertext',async()=>{
  const w=wallet();
  const plans=[w.prepareDeposit(deposit),w.prepareTransfer(transfer),w.prepareWithdrawal(withdrawal),w.prepareWithdrawal({...withdrawal,...spending(9990000000n),amountAtomic:9980000000n})];
  for(const p of plans){
    const result=await w.prove(p,{api:prover(p)}),raw=Buffer.from(result.packet),at=204+32*p.publics.length;
    assert.equal(raw.subarray(0,8).toString('hex'),'4e4336504b540100');
    assert.deepEqual(result.packet.slice(at,at+p.blob.length),p.blob);
    assert.ok(raw.length<=4800);assert.equal(raw.includes(Buffer.from(secret)),false);
    for(const row of p.created)assert.equal(raw.includes(Buffer.from(row.note)),false);
  }
});
test('C6 D/T/W reject in-flight changes and cancellation across all prover waits',async()=>{
  const makers=[w=>w.prepareDeposit(deposit),w=>w.prepareTransfer(transfer),w=>w.prepareWithdrawal(withdrawal)];
  for(const make of makers)for(const phase of ['calculate','prove','verify'])for(const kind of ['blob','publics','private','cancel']){
    const w=wallet(),p=make(w),controller=new AbortController();let enter,resume;
    const entered=new Promise(r=>{enter=r;}),paused=new Promise(r=>{resume=r;});
    const wait=async()=>{enter();await paused;};
    const api={wtns:{calculate:async()=>{if(phase==='calculate')await wait();}},groth16:{
      prove:async()=>{if(phase==='prove')await wait();return {proof:fakeProof,publicSignals:p.publics.slice()};},
      verify:async()=>{if(phase==='verify')await wait();return true;}}};
    const rejected=assert.rejects(w.prove(p,{api,signal:controller.signal}));await entered;
    if(kind==='blob')p.blob[0]^=1;else if(kind==='publics')p.publics[0]='1';else if(kind==='private')p.input.fee='1';else controller.abort();
    resume();await rejected;
  }
});
test('C6 no-change W rejects altered payout/funding and cross-factory plans',async()=>{
  const w=wallet();
  for(const field of ['payout','funding','operation','network','resources']){
    const p=w.prepareWithdrawal({...withdrawal,...spending(9990000000n),amountAtomic:9980000000n});
    if(field==='operation')p.operation='D';else if(field==='resources')p.resources=[];else p[field]=new Uint8Array(1);
    await assert.rejects(w.prove(p,{api:prover(p)}));
  }
  const p=w.prepareDeposit(deposit);await assert.rejects(wallet().prove(p,{api:prover(p)}));
});
