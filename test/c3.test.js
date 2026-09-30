import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateC3Manifest,prepareC3,finishC3,hex,unhex} from '../src/c3.js';
import {emptyPoolState} from '../src/pool-state.js';
const {manifest,vectors}=JSON.parse(readFileSync(new URL('./fixtures/c3/public-chain.json',import.meta.url)));
const normal=x=>Array.isArray(x)?x.map(normal):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,normal(v)])):String(x);
function replay(mutate) {
 let scan={state:{...emptyPoolState(),stateOutpoint:[manifest.birth,0],reserveOutpoint:null},reserveAtomic:0n};
 for(const v of vectors) {
  const {form,input,tx}=v,w=tx.vin[0].txinwitness,blob='DT'.includes(form[0])?unhex(w[3]+w[4]):null;
  const created=[];
  if(form[0]==='D')created.push({note:Uint8Array.from(input.note),cm:blob.slice(6,38),record:blob.slice(198,1222)});
  else if(form[0]==='T')for(let j=1;j<=Number(form[1]);j++)created.push({note:Uint8Array.from(input['note'+j]),cm:blob.slice(34+(j-1)*32,66+(j-1)*32),record:blob.slice(98+(j-1)*1024,1122+(j-1)*1024)});
  const sponsor={...tx.vin.at(-1),valueSats:'200000000',scriptHex:tx.vout.at(-1).scriptPubKey.hex};
  const funding=form[0]==='D'?{...tx.vin.at(-2),valueSats:String(input.amount),scriptHex:sponsor.scriptHex}:undefined;
  const options={manifest,scan,form,created,sponsor,funding,feeAtomic:'10000000',consumed:input.sk?{note:Uint8Array.from(input.note??input.spentNote)}:undefined,secret:input.sk?Uint8Array.from(input.sk):undefined,payout:form[0]==='W'?tx.vout[form==='W_full'?1:2].scriptPubKey.hex:undefined};
  if(mutate)mutate(options);
  const p=prepareC3(options);
  assert.deepEqual(normal(p.input),normal(input),form+' exact private witness');
  assert.deepEqual(p.publicSignals,v.public,form+' exact public inputs');
  const raw=finishC3(p,v.proof,v.public);
  assert.ok(raw.includes(w[1]),form+' compressed proof');
  assert.ok(raw.includes(w[2]),form+' pinned compressed VK');
  scan={state:{...p.state,stateOutpoint:[tx.txid,0],reserveOutpoint:form==='W_full'?null:[tx.txid,1]},reserveAtomic:form==='W_full'?0n:BigInt(Math.round(tx.vout[1].value*1e8))};
 }
}
test('C3 manifest reproduces all six MAST paths and reserve commitment',()=>assert.equal(validateC3Manifest(manifest),manifest));
test('all seven public-chain operations reproduce independent Python private/public inputs',()=>replay());
test('C3 rejects modified leaf and foreign chain',()=>{const m=structuredClone(manifest);m.forms.D0.script+='51';assert.throws(()=>validateC3Manifest(m),/MAST/);assert.throws(()=>validateC3Manifest({...manifest,genesis:'00'.repeat(32)}),/testnet/);});
test('C3 rejects duplicate funding, mismatched amount and wrong fee',()=>{
 assert.throws(()=>replay(o=>o.sponsor=o.funding??o.sponsor),/Duplicate|Fee/);
 assert.throws(()=>replay(o=>{if(o.funding)o.funding.valueSats='1';}),/match/);
 assert.throws(()=>replay(o=>o.feeAtomic='100000001'),/Fee/);
});
