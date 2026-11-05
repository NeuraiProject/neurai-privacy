/* Real C7 note crypto and membership; synthetic proving only for await scheduling. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as sdk from '../src/browser.js';
import { decodeC7Publication, c7PublicationHash } from '../src/c7-publication.js';
const v = JSON.parse(readFileSync(new URL('./fixtures/c7-vectors.json', import.meta.url)));
const hex = b => Buffer.from(b).toString('hex');
const unhex = s => new Uint8Array(Buffer.from(s, 'hex'));
const coin = 100000000n, fee = 10000000n;
const inst = v.instance, D = unhex(inst.domain), AID = unhex(inst.asset_id);
const account = name => { const a = v.accounts.find(x => x.name === name);
  return new sdk.C7Account(unhex(a.R), { family: a.family, account: a.account, domain: inst.domain, assetId: inst.asset_id }); };
const A = account('A'), B = account('B');
const manifest = { profile: sdk.C7_PROFILE, network:'11'.repeat(32), commitment:'22'.repeat(32), context:hex(sdk.c7Context(D, AID)),
  fees:Object.fromEntries(['D','T1','T2','T3','W'].map(op => [op, [String(fee), String(100n*coin)]])) };
const wallet = () => sdk.createC7OperationWallet({expectedGenesis:manifest.network, expectedCommitment:manifest.commitment});
const recipient = A.descriptor(1, 0), bob = B.descriptor(0, 5);
const base = {manifest, domain:D, assetId:AID, fee};
const pair = (a,b) => sdk.encodeField(sdk.poseidonPermutation([0n,sdk.decodeField(a),sdk.decodeField(b)])[0]);
function spending(amount=500n*coin) {
  const created = sdk.sealC7Note({descriptor:recipient, amountAtomic:amount}), path=[];
  let root=created.cm, zero=sdk.encodeField(0n);
  for(let i=0;i<32;i++){path.push(zero);root=pair(root,zero);zero=pair(zero,zero);}
  return {root, change:recipient, spent:{note:created.note, spendSecret:A.spendKeys(1, 0).spendSecret, index:0, path}};
}
const common = spending();
const deposit = {...base, amountAtomic:500n*coin, recipient, funding:new Uint8Array(36).fill(5), fundingValue:500n*coin+fee};
const transfer = {...base,...common, operation:'T2', outputs:[{recipient:bob,amountAtomic:200n*coin},{isChange:true,amountAtomic:300n*coin-fee}]};
const payouts = [unhex('76a914'+'33'.repeat(20)+'88ac'),unhex('5220'+'33'.repeat(32)),unhex('5320'+'33'.repeat(32))];
const withdrawal = {...base,...common,amountAtomic:400n*coin,payoutScript:payouts[0]};
const fakeProof = {pi_a:['1','2'], pi_b:[['1','2'],['3','4']], pi_c:['1','2']};
const prover = p => ({wtns:{calculate:async()=>{}},groth16:{prove:async()=>({proof:fakeProof,publicSignals:p.publics.slice()}),verify:async()=>true}});

test('C7 D builds exact amount, publication and independently recoverable note',()=>{
  const p=wallet().prepareDeposit(deposit);
  assert.equal(p.publics.length,5);assert.equal(p.input.amount,String(500n*coin));
  assert.deepEqual(decodeC7Publication('D0',p.blob).cms,[p.created[0].cm]);
  assert.equal(String(sdk.decodeField(c7PublicationHash('D0',p.blob))),p.publics[2]);
  const found=A.scan(p.created[0].record,p.created[0].cm);
  assert.deepEqual([found.chain,found.index,found.amountAtomic],[1,0,500n*coin]);
});
test('C7 T1/T2/T3 conserve amount and send change to the address of the spent note',()=>{
  for(const count of [1,2,3]){
    const outputs=Array.from({length:count-1},()=>({recipient:bob,amountAtomic:100n*coin}));
    outputs.push({isChange:true,amountAtomic:500n*coin-BigInt(count-1)*100n*coin-fee});
    const p=wallet().prepareTransfer({...base,...common,operation:'T'+count,outputs});
    assert.equal(p.publics.length,5+count);
    assert.equal(p.created.reduce((n,row)=>n+sdk.decodeNote(row.note).amountAtomic,fee),500n*coin);
    assert.deepEqual(p.created.at(-1).note.slice(65,129),common.spent.note.slice(65,129));
    assert.deepEqual(decodeC7Publication('T'+count,p.blob).cms,p.created.map(row=>row.cm));
    const change=A.scan(p.created.at(-1).record,p.created.at(-1).cm);
    assert.deepEqual([change.chain,change.index],[1,0]);
    if(count>1)assert.equal(B.scan(p.created[0].record,p.created[0].cm).amountAtomic,100n*coin);
  }
});
test('C7 W supports Legacy/PQ/ECDSA and binds the complete payout script',()=>{
  const publics=[];
  for(const payoutScript of payouts){
    const p=wallet().prepareWithdrawal({...withdrawal,payoutScript});
    assert.equal(p.input.has_change,1);assert.equal(p.input.changeAmount,String(100n*coin-fee));
    assert.deepEqual(p.created[0].note.slice(65,129),common.spent.note.slice(65,129));
    assert.equal(p.publics.length,8);publics.push(p.publics[5]);
  }
  assert.equal(new Set(publics).size,3);
});
test('C7 W no-change uses canonical dummy and allows only full small-note recovery',()=>{
  const request={...withdrawal,...spending(9990000000n),amountAtomic:9980000000n};
  const p=wallet().prepareWithdrawal(request);
  assert.equal(p.input.has_change,0);assert.equal(p.input.changeAmount,'1');assert.equal(p.input.cm_change,'0');
  assert.equal(p.blob.length,0);assert.equal(p.created.length,0);
  assert.equal(p.publics[7],String(BigInt('0x04bf938a28af8bc7ab2810e0adf3cbbb55aa4feb79827feed2722c5123baac15')));
  assert.throws(()=>wallet().prepareWithdrawal({...request,amountAtomic:9970000000n}),/entire note/);
});
test('C7 rejects missing pins, other instances, other profiles and unsafe fees',()=>{
  assert.throws(()=>sdk.createC7OperationWallet());
  assert.throws(()=>sdk.createC7OperationWallet({expectedGenesis:manifest.network,expectedCommitment:manifest.commitment,kind:'asset'}),/hold XNA/);
  for(const field of ['network','commitment','context'])assert.throws(()=>wallet().prepareDeposit({...deposit,manifest:{...manifest,[field]:'44'.repeat(32)}}));
  for(const profile of ['C5','C6-XNA-TEST-J2-v2','C6-ORDINARY-ASSET-TEST-J2-v1'])
    assert.throws(()=>wallet().prepareDeposit({...deposit,manifest:{...manifest,profile}}),/unsupported manifest profile/);
  assert.throws(()=>wallet().prepareDeposit({...deposit,fee:0.1}));
  assert.throws(()=>wallet().prepareDeposit({...deposit,fee:'1'}));
  assert.throws(()=>wallet().prepareDeposit({...deposit,manifest:{...manifest,fees:{...manifest.fees,D:[Number.MAX_SAFE_INTEGER+1]}}}),/unsafe/);
});
test('C7 needs version 3 addresses for recipients and change',()=>{
  const v1={domain:inst.domain,asset_id:inst.asset_id,owner:recipient.owner,view_pub:recipient.view_pub};
  assert.throws(()=>wallet().prepareDeposit({...deposit,recipient:v1}),/version 3/);
  assert.throws(()=>wallet().prepareTransfer({...transfer,outputs:[{recipient:{...v1,owner:bob.owner,view_pub:bob.view_pub},amountAtomic:200n*coin},transfer.outputs[1]]}),/version 3/);
  assert.throws(()=>wallet().prepareTransfer({...transfer,change:undefined}),/C7 change address/);
  assert.throws(()=>wallet().prepareTransfer({...transfer,change:bob}),/C7 change address/);
});
test('C7 rejects fractional ordinary payments, unbalanced funding and negative amounts',()=>{
  assert.throws(()=>wallet().prepareDeposit({...deposit,amountAtomic:501n*coin}));
  assert.throws(()=>wallet().prepareDeposit({...deposit,fundingValue:deposit.fundingValue+1n}));
  assert.throws(()=>wallet().prepareDeposit({...deposit,amountAtomic:-1n}));
  assert.throws(()=>wallet().prepareTransfer({...transfer,outputs:[{recipient:bob,amountAtomic:201n*coin},{isChange:true,amountAtomic:299n*coin-fee}]}));
  assert.throws(()=>wallet().prepareTransfer({...transfer,outputs:[{recipient:bob,amountAtomic:200n*coin},{isChange:true,amountAtomic:300n*coin}]}));
  assert.throws(()=>wallet().prepareWithdrawal({...withdrawal,amountAtomic:401n*coin}));
  assert.throws(()=>wallet().prepareWithdrawal({...withdrawal,amountAtomic:600n*coin}));
});
test('C7 rejects false ownership, invalid membership, altered change and wrong shape',()=>{
  assert.throws(()=>wallet().prepareTransfer({...transfer,spent:{...common.spent,spendSecret:B.spendKeys(0,5).spendSecret}}),/does not own/);
  assert.throws(()=>wallet().prepareTransfer({...transfer,root:sdk.encodeField(1n)}));
  assert.throws(()=>wallet().prepareTransfer({...transfer,spent:{...common.spent,path:common.spent.path.slice(1)}}));
  assert.throws(()=>wallet().prepareTransfer({...transfer,outputs:[transfer.outputs[0],{...transfer.outputs[1],recipient:bob}]}));
  assert.throws(()=>wallet().prepareTransfer({...transfer,outputs:[{isChange:true,amountAtomic:200n*coin},{isChange:true,amountAtomic:300n*coin-fee}]}));
  assert.throws(()=>wallet().prepareTransfer({...transfer,outputs:[transfer.outputs[0]]}));
  assert.throws(()=>wallet().prepareTransfer({...transfer,outputs:[transfer.outputs[0],{...transfer.outputs[1],isChange:2}]}));
  assert.throws(()=>wallet().prepareWithdrawal({...withdrawal,payoutScript:unhex('5120'+'33'.repeat(32))}));
});
test('C7 packets use wire v1 and contain only public values, proofs and ciphertext',async()=>{
  const w=wallet();
  const plans=[w.prepareDeposit(deposit),w.prepareTransfer(transfer),w.prepareWithdrawal(withdrawal),w.prepareWithdrawal({...withdrawal,...spending(9990000000n),amountAtomic:9980000000n})];
  for(const p of plans){
    const result=await w.prove(p,{api:prover(p)}),raw=Buffer.from(result.packet),at=204+32*p.publics.length;
    assert.equal(raw.subarray(0,8).toString('hex'),'4e4336504b540100');
    assert.deepEqual(result.packet.slice(at,at+p.blob.length),p.blob);
    assert.ok(raw.length<=4800);assert.equal(raw.includes(Buffer.from(common.spent.spendSecret)),false);
    for(const row of p.created)assert.equal(raw.includes(Buffer.from(row.note)),false);
    assert.equal(sdk.readC7Packet(result.packet,{manifest}).packetId,result.packetId);
  }
});
test('C7 D/T/W reject in-flight changes and cancellation across all prover waits',async()=>{
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
test('C7 no-change W rejects altered payout/funding and cross-factory plans',async()=>{
  const w=wallet();
  for(const field of ['payout','funding','operation','network','resources']){
    const p=w.prepareWithdrawal({...withdrawal,...spending(9990000000n),amountAtomic:9980000000n});
    if(field==='operation')p.operation='D';else if(field==='resources')p.resources=[];else p[field]=new Uint8Array(1);
    await assert.rejects(w.prove(p,{api:prover(p)}));
  }
  const p=w.prepareDeposit(deposit);await assert.rejects(wallet().prove(p,{api:prover(p)}));
});
test('the deprecated C6 names are the C7 functions',()=>{
  assert.equal(sdk.createC6OperationWallet,sdk.createC7OperationWallet);
  assert.equal(sdk.createC6JoinWallet,sdk.createC7JoinWallet);
  assert.equal(sdk.scanC6Pool,sdk.scanC7Pool);
  assert.equal(sdk.startC6PoolWorker,sdk.startC7PoolWorker);
  assert.equal(sdk.buildC6Transaction,sdk.buildC7Transaction);
  assert.equal(sdk.readC6Packet,sdk.readC7Packet);
  assert.equal(sdk.C6WorkerClient,sdk.C7WorkerClient);
  assert.equal(sdk.IndexedDbSponsorStore,sdk.IndexedDbJournalStore);
});
