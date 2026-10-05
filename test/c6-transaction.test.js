/* Compare local public relocation against actual captured consensus transactions. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as sdk from '../src/browser.js';
import {C6PublicWorld,c6Hex,c6Unhex} from '../src/c6-transaction.js';
import {c6SponsorIntent} from '../src/c6-sponsor-chain.js';
import {readSponsorTransaction} from '../src/sponsor-sweep.js';
const source=JSON.parse(await fs.readFile(new URL('./fixtures/c6-operations-chain.json',import.meta.url)));
const packets=JSON.parse(await fs.readFile(new URL('./fixtures/c6-portable-packets.json',import.meta.url)));
const config=JSON.parse(await fs.readFile(new URL('./fixtures/c6-relocation-config.json',import.meta.url)));
const {replies,deployment}=source;const hash=s=>createHash('sha256').update(s).digest('hex');
const domain=config.domain,assetId=config.assetId;
const backup=await sdk.sealVault({spend_key:hash('C6 API TEST spend Alice'),view_seed:hash('C6 API TEST view Alice')},'TEST password only');
const identity=await sdk.BrowserTestIdentity.fromBackup({backup,password:'TEST password only',domain,assetId});
const atHeight=target=>async(method,params=[])=>{
 if(method==='getblockcount')return target;
 const key=method==='getbestblockhash'?'getblockhash\0'+JSON.stringify([target]):method+'\0'+JSON.stringify(params);
 if(!Object.hasOwn(replies,key))throw Error('RPC not captured: '+method);
 return structuredClone(replies[key]);
};
function height(txid){return Object.values(replies).find(row=>row?.height!==undefined&&row.tx?.some(tx=>tx.txid===txid)).height;}
test('C6 public tree engine reproduces every captured single-input/J2 transcript byte-for-byte',async()=>{
 const scan=await sdk.scanC6Pool({rpc:atHeight(replies['getblockcount\0[]']),deployment,identity});
 const world=new C6PublicWorld();assert.equal(c6Hex(world.opening()),deployment.anchor.opening);
 for(const event of scan.events)assert.equal(c6Hex(world.transition({form:event.form,cms:event.cms.map(c6Unhex),nfs:event.nfs.map(c6Unhex),rootIndex:event.rootIndex})),event.transcript);
 assert.equal(c6Hex(world.opening()),scan.opening);
});
test('C6 JS relocation reproduces the 13 actual consensus transactions and public intents',async()=>{
 for(const operation of source.operations){
  const scan=await sdk.scanC6Pool({rpc:atHeight(height(operation.txid)-1),deployment,identity});
  const packet=c6Unhex(packets[operation.label]),decoded=sdk.readC6Packet(packet);
  const funding=decoded.operation==='D'?{point:c6Hex(decoded.funding.slice(0,32).reverse())+':'+new DataView(decoded.funding.buffer,decoded.funding.byteOffset+32,4).getUint32(0,true),valueAtomic:String(sdk.decodeField(decoded.publics[3])+decoded.fee),script:'5320'+'33'.repeat(32)}:undefined;
  const built=sdk.buildC6Transaction({packet,scan,manifest:config.manifest,deployment,funding});
  const native=replies['getrawtransaction\0'+JSON.stringify([operation.txid,false])],tx=readSponsorTransaction(native),actual=readSponsorTransaction(built.raw);
  assert.equal(built.txid,operation.txid);assert.equal(built.packetId,decoded.packetId);assert.deepEqual(actual.outputs,tx.outputs);
  assert.deepEqual(actual.inputs[0].witness,tx.inputs[0].witness);assert.equal(built.intent.operationId,c6SponsorIntent(native,deployment).operationId);
  if(decoded.operation!=='D')assert.equal(built.raw,native);
  else assert.equal(actual.inputs.at(-1).witness.length,0);
 }
});

test('C6 relocation rejects mixed instance pins, stale tree openings and mutated publications',async()=>{
 const row=source.operations.find(r=>r.label==='T3-pay');const scan=await sdk.scanC6Pool({rpc:atHeight(height(row.txid)-1),deployment,identity});const packet=c6Unhex(packets[row.label]);
 const original={packet,scan,manifest:config.manifest,deployment};
 assert.throws(()=>sdk.buildC6Transaction({...original,manifest:{...config.manifest,network:'11'.repeat(32)}}),/instance pins/);
 assert.throws(()=>sdk.buildC6Transaction({...original,scan:{...scan,opening:'00'.repeat(145)}}),/state opening/);
 const corrupt=packet.slice();corrupt[74+32*8+128+2+80]^=1;assert.throws(()=>sdk.readC6Packet(corrupt));
 const m={...config.manifest,vk_sha256:{...config.manifest.vk_sha256,T3:'22'.repeat(32)}};assert.throws(()=>sdk.buildC6Transaction({...original,manifest:m}),/VK integrity/);
 const events=structuredClone(scan.events);events.at(-1).transcript=events.at(-1).transcript.slice(0,-2)+'ff';assert.throws(()=>sdk.buildC6Transaction({...original,scan:{...scan,events}}),/confirmed transcript replay/);
});
