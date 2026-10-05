/* Real note encryption/membership and public serialization; no mock proof is
 * claimed as cryptographic evidence. Native captured transactions are separate. */
import test from 'node:test';import assert from 'node:assert/strict';
import * as sdk from '../src/browser.js';
import {c4Context} from '../src/c4-publication.js';
const hex=b=>Buffer.from(b).toString('hex'),bytes=s=>new Uint8Array(Buffer.from(s,'hex'));
const domain=new Uint8Array(32).fill(3),assetId=new Uint8Array(32).fill(4),secret=new Uint8Array(32).fill(5),seed=new Uint8Array(32).fill(6);
const recipient={domain:hex(domain),asset_id:hex(assetId),owner:hex(sdk.deriveOwner(domain,secret)),view_pub:hex(sdk.deriveViewPublic(seed))};
const destinations=['76a914'+'33'.repeat(20)+'88ac','5220'+'44'.repeat(32),'5320'+'55'.repeat(32)].map(bytes);
function config(units){const unit=10n**BigInt(8-units);return {profile:'C6-ORDINARY-ASSET-TEST-J2-v1',network:'11'.repeat(32),commitment:'22'.repeat(32),context:hex(c4Context({domain,assetId,unit})),asset:'SDK_TEST',units,unit:String(unit),private_fee:0,sponsor_index:2,fees:Object.fromEntries(['D','T1','T2','T3','W','J2'].map(o=>[o,['0']]))};}
function spending(note){let zero=sdk.encodeField(0n),root=note.cm;const path=[];for(let i=0;i<32;i++){path.push(zero);root=sdk.encodeField(sdk.poseidonPermutation([0n,sdk.decodeField(root),sdk.decodeField(zero)])[0]);zero=sdk.encodeField(sdk.poseidonPermutation([0n,sdk.decodeField(zero),sdk.decodeField(zero)])[0]);}return {root,spent:{note:note.note,spendSecret:secret,index:0,path}};}
for(const units of [0,2,8])test('asset precision '+units+' preserves deposit, transfer and all-family payout custody',()=>{
 const manifest=config(units),unit=BigInt(manifest.unit),wallet=sdk.createC6OperationWallet({expectedGenesis:manifest.network,expectedCommitment:manifest.commitment,kind:'asset'}),base={manifest,domain,assetId,fee:'0'};
 const dep=wallet.prepareDeposit({...base,amountAtomic:10n*unit,recipient,funding:new Uint8Array(36).fill(7),fundingValue:10n*unit});
 assert.equal(dep.input.unit,String(unit));assert.equal(dep.publics[4],'0');
 assert.equal(sdk.openNoteRecord({record:dep.created[0].record,cm:dep.created[0].cm,domain,assetId,viewSeed:seed,spendSecret:secret}).amountAtomic,10n*unit);
 const spent=spending(dep.created[0]);
 for(const count of [1,2,3]){const outs=Array.from({length:count-1},()=>({recipient,amountAtomic:unit}));outs.push({isChange:true,amountAtomic:(11n-BigInt(count))*unit});const t=wallet.prepareTransfer({...base,...spent,operation:'T'+count,outputs:outs});assert.equal(t.created.reduce((sum,n)=>sum+sdk.decodeNote(n.note).amountAtomic,0n),10n*unit);assert.equal(t.publics[4],'0');}
 for(const payoutScript of destinations){const w=wallet.prepareWithdrawal({...base,...spent,amountAtomic:10n*unit,payoutScript});assert.equal(w.created.length,0);assert.equal(w.input.changeAmount,String(unit));assert.equal(sdk.decodeNote(new Uint8Array(w.input.changeNote)).amountAtomic,unit);assert.equal(sdk.c6ReadAssetTransfer(w.payout,{asset:manifest.asset,unit}).amountAtomic,String(10n*unit));assert.deepEqual(sdk.c6ReadAssetTransfer(w.payout).destination,payoutScript);}
 assert.throws(()=>wallet.prepareDeposit({...base,fee:'10000000',amountAtomic:10n*unit,recipient,funding:new Uint8Array(36),fundingValue:10n*unit}),/fee/);
 if(unit>1n)assert.throws(()=>wallet.prepareDeposit({...base,amountAtomic:unit+1n,recipient,funding:new Uint8Array(36),fundingValue:unit+1n}),/multiple/);
});
test('canonical asset payload rejects truncation, trailing bytes, wrong asset and nonminimal pushes',()=>{
 for(const destination of destinations){const raw=sdk.c6AssetTransferScript(destination,'SDK_TEST',100000000n);assert.equal(sdk.c6ReadAssetTransfer(raw).amountAtomic,'100000000');
  assert.throws(()=>sdk.c6ReadAssetTransfer(raw,{asset:'OTHER'}),/wrong asset/);assert.throws(()=>sdk.c6ReadAssetTransfer(raw.slice(0,-2)));assert.throws(()=>sdk.c6ReadAssetTransfer(Uint8Array.from([...raw,0])));
  assert.throws(()=>sdk.c6AssetTransferScript(destination,'$RESTRICTED',1n));assert.throws(()=>sdk.c6AssetTransferScript(destination,'OWNER!',1n));}
 assert.equal(sdk.parseAssetAmount('12.34',2),1234000000n);for(const value of ['1.001','1e2','-1','01','0','1.'])assert.throws(()=>sdk.parseAssetAmount(value,2));
});
test('asset factories require exact profile, denomination and independent pins',()=>{
 const m=config(2),w=sdk.createC6OperationWallet({expectedGenesis:m.network,expectedCommitment:m.commitment,kind:'asset'}),r={manifest:m,domain,assetId,fee:'0',amountAtomic:100000000n,recipient,funding:new Uint8Array(36),fundingValue:100000000n};
 for(const patch of [{unit:'1'},{units:3},{private_fee:1},{sponsor_index:1},{asset:'~DEPIN'},{commitment:'aa'.repeat(32)},{profile:'C6-XNA-TEST-J2-v2'}])assert.throws(()=>w.prepareDeposit({...r,manifest:{...m,...patch}}));
 assert.throws(()=>sdk.createC6OperationWallet({expectedGenesis:m.network,expectedCommitment:m.commitment,kind:'unexpected'}));
});
