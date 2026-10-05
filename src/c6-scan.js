/** C6 XNA TEST scanning from an application-pinned birth and a trusted fully
 * validating archival RPC. This is not SPV or a replacement for consensus.
 * Follow confirmed state spends when the spent index is available; block replay
 * remains a checked fallback. Never publish a partial balance on failure.
 */
import {C6ScanSnapshot} from './c6-scan-snapshot.js';
import {C6ScanCheckpoint} from './c6-scan-checkpoint.js';
import {c6ReadAssetTransfer} from './c6-assets.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { decodeField, encodeField, poseidonBytes, poseidonPermutation } from './poseidon.js';
import { decodeC4Publication } from './c4-publication.js';
import { readSponsorTransaction } from './sponsor-sweep.js';
import { validateC6SponsorDeployment, c6SponsorIntent } from './c6-sponsor-chain.js';
const hex=b=>Array.from(b,v=>v.toString(16).padStart(2,'0')).join('');
function demand(ok,why){if(!ok)throw Error('C6 scan: '+why);}
function unhex(s){demand(typeof s==='string'&&/^(?:[0-9a-f]{2})*$/.test(s),'canonical hex');return Uint8Array.from(s.match(/../g)??[],v=>parseInt(v,16));}
function concat(...parts){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;}
const same=(a,b)=>hex(a)===hex(b);
function compact(n){if(n<253)return Uint8Array.of(n);return Uint8Array.of(253,n&255,n>>8);}
function tagged(tag,value){const t=sha256(new TextEncoder().encode(tag));return sha256(concat(t,t,value));}
function control(script,raw,C){
  const path=unhex(raw);demand(path[0]===1&&path.length>=1&&(path.length-1)%32===0&&path.length<=1+32*128,'MAST control shape');
  const bytes=unhex(script);let root=tagged('NeuraiAuthLeaf',concat(Uint8Array.of(1),compact(bytes.length),bytes));
  for(let at=1;at<path.length;at+=32){const other=path.slice(at,at+32);root=tagged('NeuraiAuthBranch',hex(root)<hex(other)?concat(root,other):concat(other,root));}
  demand(hex(tagged('NeuraiAuthScript',concat(Uint8Array.of(4,0),root)))===C,'MAST commitment');
}
function opening(value){
  const b=unhex(value);demand(b.length===145,'state opening length');
  for(const at of [0,32,64,109])decodeField(b.slice(at,at+32));
  const view=new DataView(b.buffer,b.byteOffset,b.byteLength);
  demand(b[108]===0||b[108]===1,'state mode');
  return {root:b.slice(0,32),notes:view.getUint32(96,true),nfs:view.getUint32(100,true),seen:view.getUint32(104,true),mode:b[108],history:view.getUint32(141,true)};
}
const pair=(a,b)=>encodeField(poseidonPermutation([0n,decodeField(a),decodeField(b)])[0]);
class NoteTree{
  constructor(source){
    if(source){this.zeros=source.zeros;this.levels=source.levels.map(m=>new Map(m));this.count=source.count;return;}
    this.zeros=[encodeField(0n)];for(let i=0;i<32;i++)this.zeros.push(pair(this.zeros[i],this.zeros[i]));
    this.levels=Array.from({length:33},()=>new Map());this.count=0;
  }
  snapshot(){return {count:this.count,zeros:this.zeros,levels:this.levels.map(m=>[...m])};}
  static restore(value){
    demand(value&&Number.isSafeInteger(value.count)&&value.count>=0&&value.count<0xffffffff,'saved note count');
    demand(Array.isArray(value.zeros)&&value.zeros.length===33&&Array.isArray(value.levels)&&value.levels.length===33,'saved tree shape');
    for(const v of value.zeros)demand(v instanceof Uint8Array&&v.length===32&&decodeField(v)>=0n,'saved zero field');
    const result=Object.create(NoteTree.prototype);result.zeros=value.zeros;result.count=value.count;
    result.levels=value.levels.map((rows,level)=>{
      demand(Array.isArray(rows)&&rows.length===Math.ceil(value.count/2**level),'saved tree width');
      const map=new Map();for(const [i,v] of rows){demand(Number.isSafeInteger(i)&&i>=0&&i<rows.length&&!map.has(i)&&v instanceof Uint8Array&&v.length===32&&decodeField(v)>=0n,'saved node');map.set(i,v);}return map;
    });return result;
  }
  get(level,index){return this.levels[level].get(index)??this.zeros[level];}
  get root(){return this.get(32,0);}
  append(cm){
    demand(this.count<0xffffffff&&decodeField(cm)!==0n,'note allocation');
    let i=this.count++;this.levels[0].set(i,cm.slice());
    for(let level=0;level<32;level++){const p=Math.floor(i/2);this.levels[level+1].set(p,pair(this.get(level,p*2),this.get(level,p*2+1)));i=p;}
  }
  path(index){
    demand(Number.isInteger(index)&&index>=0&&index<this.count,'note position');
    const out=[];let at=index;for(let i=0;i<32;i++){out.push(this.get(i,at%2?at-1:at+1).slice());at=Math.floor(at/2);}return out;
  }
}
const forms=['D0','D1','T1','T2','T3','W_partial_no_change','W_partial_change','W_full_no_change','J2'];
function statement(tx,d){
  const w=tx.inputs[0]?.witness;demand(w?.[0]==='10','NoAuth MAST witness');
  const leaf=d.leaves.find(l=>l.script===w.at(-2));demand(leaf&&w.length===leaf.args.length+3,'leaf/witness layout');
  control(leaf.script,w.at(-1),d.commitment);
  const args=Object.fromEntries(leaf.args.map((name,i)=>[name,w[i+1]]));
  const raw=unhex([0,1,2,3,4].map(i=>args['tree'+i]).join(''));
  const form=leaf.form,join=form==='J2',deposit=form.startsWith('D');
  const count=deposit||join||form==='W_partial_change'?1:/^T[1-3]$/.test(form)?Number(form[1]):0;
  const length=join?9824:324+32*count+3144*count+1024*Number(count>0)+(deposit?0:3148);
  demand(raw.length===length&&raw[0]===(join?3:2)&&raw[1]===forms.indexOf(form),'transcript profile/form/length');
  const old=hex(raw.slice(2,147)),next=hex(raw.slice(147,292));
  const nfs=deposit?[]:[raw.slice(292,324),...(join?[raw.slice(324,356)]:[])];
  demand(nfs.every(v=>decodeField(v)!==0n)&&new Set(nfs.map(hex)).size===nfs.length,'distinct nonzero nullifiers');
  let cms=[],records=[];
  if(count){
    const blob=unhex(args.chunk1+args.chunk2);
    if(join){
      demand(blob.length===4096&&blob[0]===3&&blob[1]===1&&hex(blob.slice(98,101))==='01d900'&&blob.slice(318).every(v=>v===0),'J2 publication');
      demand(nfs.every((nf,i)=>same(nf,blob.slice(2+32*i,34+32*i))),'J2 publication nullifiers');
      cms=[blob.slice(66,98)];const record=new Uint8Array(1024);record.set(blob.slice(98,318));records=[record];
    }else{
      const parsed=decodeC4Publication(deposit?'D0':form==='W_partial_change'?'T1':form,blob);
      cms=parsed.cms;records=parsed.records;demand(deposit||same(parsed.nf,nfs[0]),'publication nullifier');
    }
    const offset=join?356:324;
    demand(cms.every((cm,i)=>decodeField(cm)!==0n&&same(cm,raw.slice(offset+32*i,offset+32*(i+1)))),'publication commitment');
  }
  const rootIndex=deposit?null:new DataView(raw.buffer,raw.byteOffset,raw.byteLength).getUint32(join?388:324+32*count,true);
  return {form,old,next,cms,records,nfs,rootIndex,transcript:hex(raw),root:deposit?null:unhex(args.R)};
}

/** Returns private recovered notes; keep this result in the wallet worker.
 * A zero-note birth is required. Optional encrypted prefixes cache validated
 * transactions. Full encrypted snapshots cache trees and recovered notes;
 * their captured block and wallet scope are rechecked on every resume.
 */
async function scanC6PoolMode({rpc,deployment,identity,reserved=[],signal,onProgress,strategy,checkpointStore}){
  const d=validateC6SponsorDeployment(deployment);demand(['xna','asset'].includes(d.kind),'supported custody kind');
  const check=()=>{demand(!signal?.aborted,'cancelled');};check();identity.recipient();
  const capability=await rpc('getblockchaininfo');demand(capability?.zk_portable_tree?.active_for_next_block===true,'portable public-tree rules inactive');
  demand(await rpc('getblockhash',[0])===d.genesis,'wrong genesis');
  const height=await rpc('getblockcount'),tip=await rpc('getblockhash',[height]);
  demand(Number.isSafeInteger(height)&&height>=d.anchor.height&&/^[0-9a-f]{64}$/.test(tip),'tip');
  demand(await rpc('getblockhash',[d.anchor.height])===d.anchor.hash,'birth reorganized');
  const birth=await rpc('getblock',[d.anchor.hash,2]);
  demand(birth.hash===d.anchor.hash&&birth.height===d.anchor.height&&birth.tx?.find(tx=>tx.txid===d.anchor.outpoint.split(':')[0])?.vout?.[0]?.scriptPubKey?.hex===d.anchor.script,'birth UTXO');
  let state=d.anchor.opening,point=d.anchor.outpoint,previous=d.anchor.hash,stateScript=d.anchor.script;
  const anchors=new Map([[d.anchor.height,d.anchor.hash]]);
  let tree=new NoteTree(),roots=[],records=[],nullifiers=new Set(),seen=new Set();const initial=opening(state);
  demand(initial.notes===0&&initial.history===0&&same(initial.root,tree.root),'zero-note birth required');
  let eligible=null,reserveAtomic='0',reserveScript=null,reservePoint=null,events=[],lastPublicationHeight=null;
  let restored=null,startHeight=d.anchor.height,recoveryStart=0;
  const checkpoint=checkpointStore?new C6ScanCheckpoint({store:checkpointStore,identity,deployment:d,assertLive:check}):null;
  const snapshots=checkpointStore?new C6ScanSnapshot({store:checkpointStore,identity,deployment:d,assertLive:check}):null;
  const candidate=snapshots?await snapshots.load():null;
  if(candidate&&Number.isSafeInteger(candidate.tip?.height)&&candidate.tip.height>=d.anchor.height&&candidate.tip.height<=height&&/^[0-9a-f]{64}$/.test(candidate.tip.hash)&&await rpc('getblockhash',[candidate.tip.height])===candidate.tip.hash){
    // Authentication binds this state to this wallet and the entire pinned
    // deployment. Shape checks bound replay cost; the block hash pins ancestry.
    try{
      const restoredTree=NoteTree.restore(candidate.tree),o=opening(candidate.state);
      demand(o.notes===restoredTree.count&&same(o.root,restoredTree.root)&&Array.isArray(candidate.records)&&candidate.records.length===o.notes&&Array.isArray(candidate.roots)&&candidate.roots.length===o.history,'saved state counts');
      demand(candidate.nullifiers.length===o.nfs-initial.nfs&&candidate.seen.length===o.seen-initial.seen&&new Set(candidate.nullifiers).size===candidate.nullifiers.length&&new Set(candidate.seen).size===candidate.seen.length,'saved sets');
      candidate.records.forEach((r,i)=>demand(r.index===i&&r.cm instanceof Uint8Array&&r.cm.length===32&&r.record instanceof Uint8Array&&r.record.length===1024&&same(restoredTree.get(0,i),r.cm)&&Number.isSafeInteger(r.height)&&r.height<=candidate.tip.height,'saved record'));
      candidate.roots.forEach(r=>demand(r instanceof Uint8Array&&r.length===32&&decodeField(r)>=0n,'saved historical root'));
      demand(/^[0-9a-f]{64}:0$/.test(candidate.point)&&typeof candidate.stateScript==='string'&&candidate.stateScript.slice(0,-66)===d.anchor.script.slice(0,-66)&&candidate.stateScript.slice(-66,-2)===hex(poseidonBytes(unhex(candidate.state))),'saved state script');
      const mature=candidate.eligible?{...candidate.eligible,tree:NoteTree.restore(candidate.eligible.tree)}:null;
      if(mature)demand(mature.index<candidate.roots.length&&same(mature.root,candidate.roots[mature.index])&&same(mature.root,mature.tree.root),'saved eligible root');
      demand(Array.isArray(candidate.events)&&Array.isArray(candidate.recovered)&&candidate.recovered.every(r=>Number.isSafeInteger(r.position)&&r.position>=0&&r.position<candidate.records.length&&r.owned?.nf instanceof Uint8Array&&r.owned.note instanceof Uint8Array&&typeof r.owned.amountAtomic==='bigint'),'saved recovery');
      restored=candidate;tree=restoredTree;state=candidate.state;point=candidate.point;stateScript=candidate.stateScript;roots=candidate.roots;records=candidate.records;nullifiers=new Set(candidate.nullifiers);seen=new Set(candidate.seen);eligible=mature;events=candidate.events;
      reserveAtomic=candidate.reserveAtomic;reserveScript=candidate.reserveScript;reservePoint=candidate.reservePoint;lastPublicationHeight=candidate.lastPublicationHeight;startHeight=candidate.tip.height;recoveryStart=records.length;anchors.set(startHeight,candidate.tip.hash);
      if(lastPublicationHeight!==null&&height-lastPublicationHeight+1>=2&&roots.length)eligible={tree:new NoteTree(tree),root:tree.root.slice(),index:roots.length-1};
      onProgress?.({height:startHeight,target:height,strategy,phase:'checkpoint'});
    }catch{restored=null;}
  }
  let prefix=checkpoint?await checkpoint.load():[],valid=0;
  // Recheck every cached block against the captured active prefix. A reorg or
  // lower tip discards the affected suffix before any cached balance is used.
  for(const row of prefix){check();if(row.height>height)break;if(!restored||row.height>startHeight){if(await rpc('getblockhash',[row.height])!==row.hash)break;anchors.set(row.height,row.hash);}valid++;}
  if(valid<prefix.length){prefix=prefix.slice(0,valid);await checkpoint.save(prefix);}
  const saved=restored?prefix.filter(r=>r.height<=startHeight):[];let cacheWritable=true;
  if(prefix.length&&!restored)onProgress?.({height:prefix.at(-1).height,target:height,strategy,phase:'resuming'});
  async function* transitions(){
    for(const row of prefix){
      if(restored&&row.height<=startHeight)continue;
      check();const raw=readSponsorTransaction(row.raw);
      yield {tx:{txid:raw.txid,vin:raw.inputs.map(i=>({txid:i.txid,vout:i.vout}))},h:row.height,rawHex:row.raw,cached:true,blockHash:row.hash};
    }
    const start=Math.max(startHeight,prefix.at(-1)?.height??d.anchor.height);
    if(strategy==='blocks'){
      if(start>d.anchor.height)previous=await rpc('getblockhash',[start-1]);
      for(let h=start;h<=height;h++){
        check();const hash=h===d.anchor.height?d.anchor.hash:await rpc('getblockhash',[h]),block=h===d.anchor.height?birth:await rpc('getblock',[hash,2]);
        demand(block.hash===hash&&block.height===h&&(h===d.anchor.height||block.previousblockhash===previous)&&Array.isArray(block.tx),'active-chain continuity');
        for(const tx of block.tx)if(tx.vin?.some(i=>i.txid+':'+i.vout===point))yield {tx,h,blockHash:hash};
        previous=hash;onProgress?.({height:h,target:height,strategy});
      }
      return;
    }
    let last=start;const blocks=new Map();
    for(;;){
      check();const [txid,index]=point.split(':');let spent=null,lookupFailed=false;
      try{spent=await rpc('getspentinfo',[{txid,index:Number(index)}]);}catch(e){check();lookupFailed=true;}
      if(lookupFailed||spent===null||spent?.height===-1){
        // Unspent outputs and a disabled spent index both produce RPC errors.
        // Only an independently confirmed live state permits ending the walk.
        let coin;
        try{coin=await rpc('gettxout',[txid,Number(index),false]);}catch(e){check();throw Object.assign(Error('C6 scan: spent index unavailable; use block replay'),{code:'C6_INDEX_UNAVAILABLE'});}
        if(coin){
          demand(Number.isSafeInteger(coin.confirmations)&&coin.confirmations>=1&&coin.scriptPubKey?.hex===stateScript,'indexed live state mismatch');
          if(reservePoint){
            const [reserveId,reserveIndex]=reservePoint.split(':');const reserve=await rpc('gettxout',[reserveId,Number(reserveIndex),false]);
            demand(reserve&&reserve.confirmations>=1&&reserve.scriptPubKey?.hex===reserveScript,'indexed live reserve mismatch');
          }
          break;
        }
        throw Object.assign(Error('C6 scan: spent index unavailable for consumed state; use block replay'),{code:'C6_INDEX_UNAVAILABLE'});
      }
      demand(spent&&Number.isSafeInteger(spent.height)&&spent.height>=last&&spent.index===0&&/^[0-9a-f]{64}$/.test(spent.txid),'invalid spent index entry');
      // Return a coherent snapshot at the captured height. A later block is
      // ordinary chain growth, not a reorganization of the scanned prefix.
      if(spent.height>height)demand(spent.height<=await rpc('getblockcount'),'spent index height exceeds active tip');
      const h=spent.height,hash=await rpc('getblockhash',[h]);
      if(anchors.has(h))demand(anchors.get(h)===hash,'chain changed during scan; retry');
      if(h<=height)anchors.set(h,hash);
      let block=blocks.get(hash);
      if(!block){block=await rpc('getblock',[hash,2]);blocks.set(hash,block);}
      demand(block.hash===hash&&block.height===h&&Array.isArray(block.tx),'indexed block mismatch');
      const tx=block.tx.find(t=>t.txid===spent.txid);
      demand(tx&&tx.vin?.[0]?.txid+':'+tx.vin?.[0]?.vout===point,'spent index disagrees with confirmed transaction');
      if(h>height)break;
      onProgress?.({height:h,target:height,strategy});yield {tx,h,blockHash:hash};last=h;
    }
  }
  for await(const {tx,h,rawHex,cached,blockHash} of transitions()){
    check();
      demand(tx.vin[0].txid+':'+tx.vin[0].vout===point,'state must be input zero');
      const hexRaw=rawHex??await rpc('getrawtransaction',[tx.txid,false]),raw=readSponsorTransaction(hexRaw);
      demand(raw.txid===tx.txid&&raw.inputs[0].txid+':'+raw.inputs[0].vout===point&&raw.version===3&&raw.locktime===0&&raw.refs.length===0&&raw.inputs.every(i=>i.sequence===0xffffffff),'transaction binding/fixed fields');
      const parsed=statement(raw,d),before=opening(state),after=opening(parsed.next),out=raw.outputs[0]?.script;
      demand(parsed.old===state&&out?.slice(0,-66)===d.anchor.script.slice(0,-66)&&out.slice(-66,-2)===hex(poseidonBytes(unhex(parsed.next))),'state chain binding');
      if(parsed.rootIndex!==null)demand(parsed.rootIndex<roots.length&&same(parsed.root,roots[parsed.rootIndex]),'historical root binding');
      for(const nf of parsed.nfs){const key=hex(nf);demand(!nullifiers.has(key),'confirmed double nullifier');nullifiers.add(key);}
      parsed.cms.forEach((cm,i)=>{
        const key=hex(cm);demand(!seen.has(key),'duplicate commitment');seen.add(key);
        records.push({cm:cm.slice(),record:parsed.records[i].slice(),index:tree.count,height:h,txid:tx.txid});tree.append(cm);
      });
      demand(after.notes===tree.count&&same(after.root,tree.root)&&after.nfs===before.nfs+parsed.nfs.length&&after.seen===before.seen+parsed.cms.length&&after.history===before.history+Number(parsed.cms.length>0),'public tree counters/root');
      if(parsed.cms.length){lastPublicationHeight=h;roots.push(tree.root.slice());if(height-h+1>=2)eligible={tree:new NoteTree(tree),root:tree.root.slice(),index:roots.length-1};}
      events.push({form:parsed.form,cms:parsed.cms.map(hex),nfs:parsed.nfs.map(hex),rootIndex:parsed.rootIndex,transcript:parsed.transcript,txid:tx.txid,intentId:c6SponsorIntent(hexRaw,d).operationId});
      if(d.kind==='asset'&&after.mode){demand(raw.outputs[1].valueAtomic==='0','asset reserve must contain no XNA');}
      reserveAtomic=after.mode?(d.kind==='asset'?c6ReadAssetTransfer(unhex(raw.outputs[1].script),{asset:d.asset,unit:d.unit,allowContract:true}).amountAtomic:raw.outputs[1].valueAtomic):'0';reserveScript=after.mode?raw.outputs[1].script:null;reservePoint=after.mode?tx.txid+':1':null;
      state=parsed.next;point=tx.txid+':0';stateScript=out;
      if(checkpoint&&cacheWritable)saved.push({height:h,hash:blockHash,raw:hexRaw});
      // Persist each validated transition before requesting the next one. No
      // private balance is emitted until final active-chain checks succeed.
      if(checkpoint&&!cached&&cacheWritable)cacheWritable=await checkpoint.save(saved);
  }
  const reservedCms=new Set(),reservedNfs=new Set();
  demand(Array.isArray(reserved),'reservations');
  for(const row of reserved){demand(/^[0-9a-f]{64}$/.test(row.cm)&&/^[0-9a-f]{64}$/.test(row.nf),'reservation identifiers');reservedCms.add(row.cm);reservedNfs.add(row.nf);}
  onProgress?.({height,target:height,strategy,phase:'recovering'});
  let recovered;
  const window={gap:identity.gap??null,issued:identity.issued??null};
  const reuse=restored&&JSON.stringify(window)===JSON.stringify(restored.window);
  const offset=reuse?recoveryStart:0,remaining=records.slice(offset);
  if(typeof identity.scanRecords==='function')recovered=identity.scanRecords(remaining,reuse?restored.recovered.map(r=>r.address).filter(Boolean):[]);
  else recovered=remaining.flatMap((entry,position)=>{try{const owned=identity.openRecord(entry.record,entry.cm);return owned?[{position,owned}]:[];}catch{return [];}});
  recovered=recovered.map(r=>({...r,position:r.position+offset}));
  if(reuse)recovered=[...restored.recovered,...recovered];
  // A new receiving address can extend the gap into older previously skipped
  // publications. Repeat recovery over all records in that case, preserving
  // already discovered addresses. Public trees still come from the checkpoint.
  const coverage=()=>typeof identity.scanRecords==='function'?Math.max(identity.gap-1,identity.issued,identity.maxUsed+identity.gap):null;
  if(reuse&&typeof identity.scanRecords==='function'&&coverage()>restored.coverage)recovered=identity.scanRecords(records,recovered.map(r=>r.address).filter(Boolean));
  const notes=recovered.filter(row=>!nullifiers.has(hex(row.owned.nf))).map(row=>{
    const entry=records[row.position],reserved=reservedCms.has(hex(entry.cm))||reservedNfs.has(hex(row.owned.nf));
    const mature=!!eligible&&entry.index<eligible.tree.count;
    return {...entry,...row.owned,address:row.address,amountAtomic:String(row.owned.amountAtomic),reserved,spendable:mature&&!reserved,
      root:mature?eligible.root.slice():null,path:mature?eligible.tree.path(entry.index):null};
  });
  check();
  // A new descendant block does not invalidate this snapshot. Check the
  // captured prefix and every indexed block, rather than demanding a static tip.
  onProgress?.({height,target:height,strategy,phase:'verifying'});
  for(const [h,hash] of anchors)demand(await rpc('getblockhash',[h])===hash,'chain changed during scan; retry');
  demand(await rpc('getblockhash',[height])===tip,'chain changed during scan; retry');
  check();
  if(snapshots)await snapshots.save({tip:{height,hash:tip},state,point,stateScript,tree:tree.snapshot(),roots,records,nullifiers:[...nullifiers],seen:[...seen],eligible:eligible?{...eligible,tree:eligible.tree.snapshot()}:null,events,reserveAtomic,reserveScript,reservePoint,lastPublicationHeight,recovered,window,coverage:coverage()});
  check();onProgress?.({height,target:height,strategy,phase:'complete'});
  return {profile:d.kind==='asset'?'C6-ORDINARY-ASSET-TEST-J2-v1':'C6-XNA-TEST-J2-v2',genesis:d.genesis,commitment:d.commitment,tip:{height,hash:tip},statePoint:point,opening:state,
    events,reserveAtomic,reserveScript,reservePoint,notes,records,nullifiers:[...nullifiers],root:eligible?.root??null,
    balanceAtomic:String(notes.reduce((n,row)=>n+BigInt(row.amountAtomic),0n)),spendableAtomic:String(notes.filter(row=>row.spendable).reduce((n,row)=>n+BigInt(row.amountAtomic),0n)),ignoredRecords:records.length-recovered.length};
}

/** Default auto mode uses the confirmed spent index when available. A missing
 * index falls back to full block replay; contradictory index data fails closed.
 * Each returned balance is a snapshot at tip.height, even if a new block arrived.
 */
export async function scanC6Pool(options){
  const strategy=options.strategy??'auto';
  demand(['auto','blocks','spent-index'].includes(strategy),'unknown scan strategy');
  if(strategy!=='auto')return scanC6PoolMode({...options,strategy});
  try{return await scanC6PoolMode({...options,strategy:'spent-index'});}
  catch(e){if(e.code!=='C6_INDEX_UNAVAILABLE'||options.signal?.aborted)throw e;return scanC6PoolMode({...options,strategy:'blocks'});}
}
