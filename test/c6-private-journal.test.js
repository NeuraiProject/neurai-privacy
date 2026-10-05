import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {BrowserTestIdentity,sealVault} from '../src/browser.js';
import {C6PrivateJournal} from '../src/c6-private-journal.js';
const config=JSON.parse(await fs.readFile(new URL('./fixtures/c6-relocation-config.json',import.meta.url)));
const packets=JSON.parse(await fs.readFile(new URL('./fixtures/c6-portable-packets.json',import.meta.url)));
const h=s=>createHash('sha256').update(s).digest('hex');
const identity=await BrowserTestIdentity.fromBackup({backup:await sealVault({spend_key:h('journal TEST spend'),view_seed:h('journal TEST view')},'TEST password only'),password:'TEST password only',domain:config.domain,assetId:config.assetId});
const resource={cm:'11'.repeat(32),nf:'22'.repeat(32)};
function store(){let current=null;return {read:async()=>current,compareAndSwap:async(_key,expected,replacement)=>{if(current!==expected)return false;current=replacement;return true;},get value(){return current;}};}
const make=(s,extra={})=>new C6PrivateJournal({identity,genesis:config.manifest.network,commitment:config.manifest.commitment,...s,...extra});
test('C6 encrypted history is explicit, scoped and durable across new instances',async()=>{
 const s=store(),a=make(s);await assert.rejects(a.open(),/missing/);await a.open({create:true});
 const id=await a.reserve({action:'transfer',resources:[resource]});assert.equal(a.reservations().length,1);
 assert.ok(!s.value.includes(resource.cm));const b=make(s);await b.open();assert.equal(b.summaries()[0].id,id);
 await assert.rejects(b.reserve({action:'withdraw',resources:[resource]}),/reserved/);
 const bad=make(s,{commitment:'33'.repeat(32)});await assert.rejects(bad.open(),/mismatched/);
});
test('C6 encrypted backup restores reservations and refuses overwriting existing history',async()=>{
 const a=make(store());await a.open({create:true});await a.reserve({action:'deposit',resources:[],funding:'44'.repeat(32)+':1'});
 const backup=a.backup(),fresh=make(store());await fresh.open({backup:backup.cipher});assert.deepEqual(fresh.summaries(),a.summaries());
 await assert.rejects(fresh.open({backup:backup.cipher}),/replace/);
 await assert.rejects(fresh.reserve({action:'deposit',resources:[],funding:'44'.repeat(32)+':1'}),/reserved/);
});
test('C6 cross-tab compare-and-swap permits only one simultaneous note reservation',async()=>{
 const s=store(),a=make(s),b=make(s);await a.open({create:true});await b.open();
 const results=await Promise.allSettled([a.reserve({action:'transfer',resources:[resource]}),b.reserve({action:'withdraw',resources:[resource]})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);await a.reload();assert.equal(a.summaries().length,1);
});
test('C6 prepared exposure closes only on confirmed intent/conflict and reopens on reorg',async()=>{
 const a=make(store());await a.open({create:true});const id=await a.reserve({action:'transfer',resources:[resource]});
 const raw=Uint8Array.from(Buffer.from(packets['T1-self'],'hex'));
 const {readC6Packet}=await import('../src/c6-transaction.js');const packetId=readC6Packet(raw).packetId;
 await a.prepared(id,{packet:raw,packetId,proof:{publicTEST:true},publicSignals:[],transaction:{intent:{operationId:'55'.repeat(32)}}});
 await assert.rejects(a.releaseDraft(id),/cannot be cancelled/);
 await a.reconcile({events:[]});assert.equal(a.reservations().length,1);
 await a.reconcile({events:[{intentId:'55'.repeat(32),txid:'66'.repeat(32),nfs:[resource.nf]}]});assert.equal(a.reservations().length,0);
 await a.reconcile({events:[]});assert.equal(a.reservations().length,1);
 await a.reconcile({events:[{intentId:'77'.repeat(32),txid:'88'.repeat(32),nfs:[resource.nf]}]});assert.equal(a.summaries()[0].outcome,'conflicted');
 await a.reconcile({events:[]});assert.equal(a.summaries()[0].outcome,null);
});
test('C6 storage failure and lock never expose a falsely persisted reservation',async()=>{
 let alive=true;const s=store(),a=make(s,{assertLive:()=>{if(!alive)throw Error('locked');}});await a.open({create:true});
 a.compareAndSwap=async()=>{throw Error('disk failure');};await assert.rejects(a.reserve({action:'transfer',resources:[resource]}),/disk failure/);assert.equal(a.reservations().length,0);
 alive=false;await assert.rejects(a.reserve({action:'transfer',resources:[resource]}),/locked/);
});
