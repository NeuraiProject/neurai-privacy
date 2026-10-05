/* Public Q15 fixture: actual C++-validated asset transitions, not a JS model. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import * as sdk from '../src/browser.js';import {c6Cat,c6Hex,c6Unhex,c6LE,c6Outpoint} from '../src/c6-transaction.js';import {readSponsorTransaction} from '../src/sponsor-sweep.js';
const f=JSON.parse(await fs.readFile(new URL('./fixtures/c6-assets-chain.json',import.meta.url))),{deployment,manifest,replies}=f;
const h=txid=>Object.values(replies).find(b=>b?.height!==undefined&&b.tx?.some(t=>t.txid===txid)).height;
const rpc=height=>async(m,p=[])=>{
 if(m==='getblockcount')return height;
 const key=m==='getbestblockhash'?'getblockhash\0'+JSON.stringify([height]):m+'\0'+JSON.stringify(p);
 if(!Object.hasOwn(replies,key))throw Error('RPC not captured: '+m);
 return structuredClone(replies[key]);
};
const identity={recipient:()=>({}),scanRecords:()=>[]};
function packet(row){const tx=readSponsorTransaction(replies['getrawtransaction\0'+JSON.stringify([row.txid,false])]),leaf=deployment.leaves.find(l=>l.form===row.form),args=Object.fromEntries(leaf.args.map((a,i)=>[a,tx.inputs[0].witness[i+1]])),op=row.form.startsWith('D')?'D':row.form.startsWith('W')?'W':row.form;
 const payout=op==='W'?c6Unhex(tx.outputs[row.form==='W_full_no_change'?1:3].script):new Uint8Array(),funding=op==='D'?c6Outpoint(tx.inputs[row.form==='D0'?1:3].txid+':'+tx.inputs[row.form==='D0'?1:3].vout):new Uint8Array(),blob=c6Unhex((args.chunk1??'')+(args.chunk2??''));
 return {tx,raw:c6Cat(c6Unhex(op==='J2'?'4e4336504b540200':'4e4336504b540100'),c6Unhex(manifest.network),c6Unhex(manifest.commitment),Uint8Array.of(['D','T1','T2','T3','W','J2'].indexOf(op),row.public.length),...row.public.map(c6Unhex),c6Unhex(args.proof),c6LE(blob.length,2),blob,Uint8Array.of(payout.length),payout,Uint8Array.of(funding.length),funding)};
}
test('asset JS relocation matches all eleven genuine Q15 custody transactions and intents',async()=>{
 for(const row of f.operations){const scan=await sdk.scanC6Pool({rpc:rpc(h(row.txid)-1),deployment,identity}),{tx,raw}=packet(row),dep=row.form.startsWith('D'),fi=row.form==='D0'?1:3,coin=i=>{const input=tx.inputs[i],out=replies['getrawtransaction\0'+JSON.stringify([input.txid,true])].vout[input.vout];return {point:input.txid+':'+input.vout,valueAtomic:String(sdk.rpcAmountToSatoshis(out.value)),script:out.scriptPubKey.hex};};
  const sponsor={...coin(2),changeScript:tx.outputs[2].script,feeAtomic:'10000000'},funding=dep?coin(fi):undefined;
  const built=sdk.buildC6Transaction({packet:raw,scan,manifest,deployment,funding,sponsor}),actual=readSponsorTransaction(built.raw);
  assert.equal(built.form,row.form);assert.deepEqual(actual.outputs,tx.outputs);assert.deepEqual(actual.inputs[0],tx.inputs[0]);assert.equal(built.intent.operationId,sdk.c6SponsorIntent(replies['getrawtransaction\0'+JSON.stringify([row.txid,false])],deployment).operationId);assert.equal(built.privateFeeAtomic,'0');assert.equal(built.reserveAtomic,String(row.reserve));assert.equal(actual.inputs[2].txid,tx.inputs[2].txid);
  if(dep)assert.equal(built.funding.index,fi);
  assert.equal(sdk.readC6Packet(raw,{kind:'asset',manifest}).fee,0n);
 }
});
test('asset relocation binds funding independently of the detachable D0 sponsor and rejects substitutions',async()=>{
 const row=f.operations[0],scan=await sdk.scanC6Pool({rpc:rpc(h(row.txid)-1),deployment,identity}),{tx,raw}=packet(row),coin=i=>{const input=tx.inputs[i],out=replies['getrawtransaction\0'+JSON.stringify([input.txid,true])].vout[input.vout];return {point:input.txid+':'+input.vout,valueAtomic:String(sdk.rpcAmountToSatoshis(out.value)),script:out.scriptPubKey.hex};};
 const args={packet:raw,scan,manifest,deployment,funding:coin(1),sponsor:{...coin(2),changeScript:tx.outputs[2].script,feeAtomic:'10000000'}},first=sdk.buildC6Transaction(args),second=sdk.buildC6Transaction({...args,sponsor:{...args.sponsor,point:'aa'.repeat(32)+':0'}});
 assert.equal(first.intent.operationId,second.intent.operationId);assert.notEqual(first.raw,second.raw);
 for(const patch of [{asset:'OTHER'},{unit:'1'},{sponsor_fees:['1']}])assert.throws(()=>sdk.buildC6Transaction({...args,manifest:{...manifest,...patch}}));
 assert.throws(()=>sdk.buildC6Transaction({...args,funding:{...args.funding,valueAtomic:'1'}}));assert.throws(()=>sdk.buildC6Transaction({...args,sponsor:{...args.sponsor,script:deployment.anchor.script}}));assert.throws(()=>sdk.buildC6Transaction({...args,sponsor:{...args.sponsor,point:args.funding.point}}));
});
