import {c6AssetMetadata,c6AssetTransferScript,c6ReadAssetTransfer,c6NativeDestination} from './c6-assets.js';
/* Public-only C6 XNA TEST relocation. Construction is not authorization:
 * verify the exact proof/intent first, then ask a validating node for admission.
 * No spending key, plaintext note or private membership path is used here.
 */
import {sha256} from '@noble/hashes/sha2.js';
import {decodeField,encodeField,poseidonBytes} from './poseidon.js';
import {poolTreeNode,poolIndexedLeaf} from './pool-state.js';
import {decodeC4Publication,c4PublicationHash} from './c4-publication.js';
import {C7_PROFILE} from './c7.js';
import {readSponsorTransaction} from './sponsor-sweep.js';
import {validateC6SponsorDeployment,c6SponsorIntent} from './c6-sponsor-chain.js';
export const C6_FORMS=['D0','D1','T1','T2','T3','W_partial_no_change','W_partial_change','W_full_no_change','J2'];
const ZERO=new Uint8Array(32),MAX=2100000000000000000n;
export const c6Hex=b=>Array.from(b,v=>v.toString(16).padStart(2,'0')).join('');
export function c6Unhex(s){need(typeof s==='string'&&/^(?:[0-9a-f]{2})*$/.test(s),'canonical hex');return Uint8Array.from(s.match(/../g)??[],v=>parseInt(v,16));}
const eq=(a,b)=>c6Hex(a)===c6Hex(b),text=s=>new TextEncoder().encode(s);
export function c6Cat(...parts){const b=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let i=0;for(const p of parts){b.set(p,i);i+=p.length;}return b;}
function need(ok,msg){if(!ok)throw Error('C6 transaction: '+msg);}
export function c6LE(n,size){n=BigInt(n);need(n>=0n,'unsigned');const b=new Uint8Array(size);for(let i=0;i<size;i++,n>>=8n)b[i]=Number(n&255n);need(n===0n,'overflow');return b;}
const compact=n=>n<253?c6LE(n,1):n<=65535?c6Cat(Uint8Array.of(253),c6LE(n,2)):c6Cat(Uint8Array.of(254),c6LE(n,4));
const tagged=(s,b)=>{const h=sha256(text(s));return sha256(c6Cat(h,h,b));};
export function c6Outpoint(point){need(/^[0-9a-f]{64}:[0-9]+$/.test(point),'outpoint');const [id,v]=point.split(':');need(Number(v)<=0xffffffff&&String(Number(v))===v,'vout');return c6Cat(c6Unhex(id).reverse(),c6LE(v,4));}
const point=b=>c6Hex(b.slice(0,32).reverse())+':'+new DataView(b.buffer,b.byteOffset+32,4).getUint32(0,true);
function scriptNum(n){n=BigInt(n);if(!n)return new Uint8Array();const b=[];for(;n;n>>=8n)b.push(Number(n&255n));if(b.at(-1)&128)b.push(0);return Uint8Array.from(b);}
function push(b){need(b.length<=75,'guard constant');return c6Cat(Uint8Array.of(b.length),b);}
export function c6ReserveGuard(manifest){
 need(typeof manifest.identity==='string'&&/^[A-Z0-9_#./!~-]{1,64}$/.test(manifest.identity),'state identity');
 return c6Cat(c6Unhex('0052c420'),c6Unhex(manifest.commitment),c6Unhex('880051cf'),push(text(manifest.identity)),c6Unhex('880051ce'),push(text(manifest.identity)),c6Unhex('8800d50052c48851'));
}
export function c6ReserveScript(manifest){return c6Cat(c6Unhex('5120'),tagged('NeuraiAuthScript',c6Cat(Uint8Array.of(1,0),sha256(c6ReserveGuard(manifest)))));}
class Sparse{
 constructor(){this.empty=[ZERO];for(let i=0;i<32;i++)this.empty.push(poolTreeNode(this.empty[i],this.empty[i]));this.layers=Array.from({length:33},()=>new Map());}
 get(i,n){return this.layers[i].get(n)??this.empty[i];}
 get root(){return this.get(32,0);}
 path(n){const p=[];for(let i=0;i<32;i++){p.push(this.get(i,n%2?n-1:n+1));n=Math.floor(n/2);}return p;}
 set(n,value){need(Number.isInteger(n)&&n>=0&&n<=0xffffffff,'tree slot');decodeField(value);this.layers[0].set(n,value);for(let i=0;i<32;i++){n=Math.floor(n/2);this.layers[i+1].set(n,poolTreeNode(this.get(i,n*2),this.get(i,n*2+1)));}}
}
class Indexed{
 constructor(kind){this.kind=kind;this.entries=[[0n,0n,0]];this.tree=new Sparse();this.tree.set(0,poolIndexedLeaf(kind,0n,0n,0));}
 insert(value){
  need(value>0n&&this.entries.length<0xffffffff&&!this.entries.some(r=>r[0]===value),'indexed duplicate/range');encodeField(value);
  let index=0;for(let i=0;i<this.entries.length;i++)if(this.entries[i][0]<value&&this.entries[i][0]>this.entries[index][0])index=i;
  const [pv,nv,ni]=this.entries[index],next=this.entries.length;need(nv===0n||value<nv,'indexed ordering');
  const predPath=this.tree.path(index);this.entries[index]=[pv,value,next];this.tree.set(index,poolIndexedLeaf(this.kind,pv,value,next));
  const emptyPath=this.tree.path(next);this.entries.push([value,nv,ni]);this.tree.set(next,poolIndexedLeaf(this.kind,value,nv,ni));
  return c6Cat(c6LE(index,4),encodeField(pv),encodeField(nv),c6LE(ni,4),...predPath,...emptyPath);
 }
}
/** Deterministic public trees, rebuilt from confirmed events only. */
export class C6PublicWorld{
 constructor(){this.notes=new Sparse();this.history=new Sparse();this.nfs=new Indexed('nf');this.seen=new Indexed('cm');this.noteCount=0;this.roots=[];this.mode=0;}
 opening(){return c6Cat(this.notes.root,this.nfs.tree.root,this.seen.tree.root,c6LE(this.noteCount,4),c6LE(this.nfs.entries.length,4),c6LE(this.seen.entries.length,4),Uint8Array.of(this.mode),this.history.root,c6LE(this.roots.length,4));}
 transition({form,cms,nfs,rootIndex}){
  need(C6_FORMS.includes(form),'form');const dep=form[0]==='D',join=form==='J2',old=this.opening(),parts=[];
  const count=dep||join||form==='W_partial_change'?1:form[0]==='T'?Number(form[1]):0;
  need(cms.length===count&&nfs.length===(dep?0:join?2:1),'transition shape');need(this.mode===Number(form!=='D0'),'mode');
  if(!dep){need(Number.isInteger(rootIndex)&&rootIndex>=0&&rootIndex<this.roots.length,'historical root');parts.push(c6LE(rootIndex,4),...this.history.path(rootIndex));}
  need(new Set(nfs.map(c6Hex)).size===nfs.length,'duplicate nullifiers');for(const nf of nfs)parts.push(this.nfs.insert(decodeField(nf)));
  for(const cm of cms){need(this.noteCount<=0xfffffffd&&decodeField(cm)>0n,'note capacity/value');parts.push(...this.notes.path(this.noteCount));this.notes.set(this.noteCount++,cm);parts.push(this.seen.insert(decodeField(cm)));}
  if(cms.length){need(this.roots.length<0xffffffff,'historical capacity');parts.push(...this.history.path(this.roots.length));this.history.set(this.roots.length,this.notes.root);this.roots.push(this.notes.root);}
  this.mode=Number(form!=='W_full_no_change');
  const raw=c6Cat(Uint8Array.of(join?3:2,C6_FORMS.indexOf(form)),old,this.opening(),...(dep?[ZERO]:nfs),...cms,...parts);
  need(raw.length<=15360,'transcript capacity');return raw;
 }
}
export function readC6Packet(raw,{kind='xna',manifest}={}){
 need(['xna','asset'].includes(kind),'custody kind');
 const metadata=kind==='asset'?c6AssetMetadata(manifest):null,quantum=metadata?.unit??10000000000n;
 // C7 publications carry 230-byte records (0x02); J2 carries its record at [98, 328).
 const c7=kind==='xna'&&manifest?.profile===C7_PROFILE,format={format:c7?'c7':'hpke'},j2end=c7?328:318;
 need(raw instanceof Uint8Array&&raw.length<=4800,'packet size');let at=0;
 const take=n=>{need(at+n<=raw.length,'truncated packet');const b=raw.slice(at,at+n);at+=n;return b;};
 const magic=c6Hex(take(8)),join=magic==='4e4336504b540200';need(join||magic==='4e4336504b540100','packet version');
 const network=take(32),pool=take(32),op=take(1)[0],count=take(1)[0],operations=['D','T1','T2','T3','W','J2'];
 need(join?op===5&&count===7:op<5&&count===[5,6,7,8,8][op],'packet op/count');const operation=operations[op];
 const publics=Array.from({length:count},()=>{const b=take(32);decodeField(b);return b;}),proof=take(128),len=take(2),publication=take(len[0]+len[1]*256),payout=take(take(1)[0]),funding=take(take(1)[0]);
 need(at===raw.length,'trailing packet');need(funding.length===(op===0?36:0),'funding');
 const fee=decodeField(publics[op===5?5:4]);need(fee<=MAX&&(kind!=='asset'||fee===0n),'fee range');const dep=op===0,withdraw=op===4,change=withdraw&&decodeField(publics[6])!==0n;
 let cms=[],nfs=dep?[]:join?publics.slice(2,4):[publics[2]];
 need(nfs.every(n=>decodeField(n)>0n)&&new Set(nfs.map(c6Hex)).size===nfs.length,'nullifiers');
 if(!withdraw||change){
  need(publication.length===4096,'publication size');let digest;
  if(join){need(c6Hex(publication.slice(0,2))==='0301'&&(c7?publication[98]===2:c6Hex(publication.slice(98,101))==='01d900')&&publication.slice(j2end).every(b=>b===0),'J2 publication');cms=[publication.slice(66,98)];need(nfs.every((n,i)=>eq(n,publication.slice(2+i*32,34+i*32)))&&eq(cms[0],publics[6]),'J2 fields');digest=poseidonBytes(c6Cat(poseidonBytes(c6Cat(poseidonBytes(text('NeuraiPoolC6/J2/data\x01')),publication.slice(0,2048))),publication.slice(2048)));}
  else {const p=decodeC4Publication(dep?'D0':withdraw?'T1':operation,publication,format);cms=p.cms;need(dep||eq(p.nf,nfs[0]),'publication nf');digest=c4PublicationHash(dep?'D0':withdraw?'T1':operation,publication,format);if(!dep)need(cms.every((cm,i)=>eq(cm,publics[withdraw?6:5+i])),'publication cm');}
  need(eq(digest,publics[dep?2:withdraw?7:join?4:3]),'publication digest');
 }else need(publication.length===0&&c6Hex(publics[7])==='04bf938a28af8bc7ab2810e0adf3cbbb55aa4feb79827feed2722c5123baac15','no-publication domain');
 if(dep){const amount=decodeField(publics[3]);need(amount>0n&&amount<=MAX&&amount%quantum===0n&&eq(publics[1],poseidonBytes(c6Cat(text('NIP045/dep\x01'),c6LE(amount,8),cms[0]))),'deposit binding');}
 need(withdraw?(kind==='asset'?(()=>{const v=c6ReadAssetTransfer(payout,{asset:metadata.name,unit:metadata.unit});return BigInt(v.amountAtomic)===decodeField(publics[3]);})():((payout.length===25&&c6Hex(payout.slice(0,3))==='76a914'&&c6Hex(payout.slice(-2))==='88ac')||(payout.length===34&&[82,83].includes(payout[0])&&payout[1]===32))):payout.length===0,'payout shape');
 if(withdraw){const amount=decodeField(publics[3]);need(amount>0n&&amount<=MAX&&(kind==='xna'&&amount<quantum&&!change||amount%quantum===0n),'withdrawal quantum');need(eq(publics[5],poseidonBytes(c6Cat(text('NeuraiPoolC6/pay\x01'),compact(payout.length),payout))),'payout binding');}
 return {network,pool,operation,publics,proof,publication,payout,funding,cms,nfs,fee,packetId:c6Hex(sha256(c6Cat(c6Cat(text('NeuraiC6Packet'),Uint8Array.of(join?2:1)),raw)))};
}
function controls(leaves,C){
 const names=leaves.map(l=>l.form).sort(),map=Object.fromEntries(leaves.map(l=>[l.form,l]));need(new Set(names).size===names.length,'duplicate forms');
 function tree(ns){if(ns.length===1){const s=c6Unhex(map[ns[0]].script);return [tagged('NeuraiAuthLeaf',c6Cat(Uint8Array.of(1),compact(s.length),s)),{[ns[0]]:[]}];}
  let cut=1;while(cut*2<ns.length)cut*=2;const [a,pa]=tree(ns.slice(0,cut)),[b,pb]=tree(ns.slice(cut));
  return [tagged('NeuraiAuthBranch',c6Hex(a)<c6Hex(b)?c6Cat(a,b):c6Cat(b,a)),Object.fromEntries([...Object.entries(pa).map(([n,p])=>[n,[...p,b]]),...Object.entries(pb).map(([n,p])=>[n,[...p,a]])])];}
 const [root,paths]=tree(names);need(c6Hex(tagged('NeuraiAuthScript',c6Cat(Uint8Array.of(4,0),root)))===C,'MAST pin');return paths;
}
/** Public relocation of a previously verified, immutable packet. A changed
 * state requires rebuilding these paths, not regenerating its private proof.
 */
export function buildC6Transaction({packet,scan,manifest,deployment,funding,sponsor}){
 if(deployment?.kind==='asset')return buildAssetTransaction({packet,scan,manifest,deployment,funding,sponsor});
 const d=validateC6SponsorDeployment(deployment),p=readC6Packet(packet,{manifest});
 need((manifest.profile==='C6-XNA-TEST-J2-v2'||manifest.profile===C7_PROFILE&&typeof d.emission==='string')&&c6Hex(p.network)===manifest.network&&c6Hex(p.pool)===manifest.commitment&&manifest.commitment===d.commitment&&c6Hex(p.publics[0])===manifest.context,'instance pins');
 need(manifest.fees?.[p.operation]?.some(f=>String(f)===String(p.fee)),'fee level');
 const vk=c6Unhex(manifest.vks?.[p.operation]??'');need(vk.length>0&&c6Hex(sha256(vk))===manifest.vk_sha256?.[p.operation],'VK integrity');
 const world=new C6PublicWorld();need(c6Hex(world.opening())===d.anchor.opening,'empty birth');
 for(const e of scan.events??[]){const raw=world.transition({form:e.form,cms:e.cms.map(c6Unhex),nfs:e.nfs.map(c6Unhex),rootIndex:e.rootIndex});need(c6Hex(raw)===e.transcript,'confirmed transcript replay');}
 need(c6Hex(world.opening())===scan.opening,'state opening');const reserve=BigInt(scan.reserveAtomic);need(reserve>=0n&&reserve<=MAX&&!!reserve===!!world.mode,'reserve/mode');
 const paths=controls(d.leaves,d.commitment),guard=c6ReserveGuard(manifest),guardScript=c6ReserveScript(manifest),dep=p.operation==='D',withdraw=p.operation==='W';
 const points=[c6Outpoint(scan.statePoint)];if(reserve){need(scan.reservePoint===scan.statePoint.split(':')[0]+':1'&&scan.reserveScript===c6Hex(guardScript),'reserve UTXO');points.push(c6Outpoint(scan.reservePoint));}
 let amount=0n,left=reserve-p.fee,form=p.operation,rootIndex=null;
 if(dep){amount=decodeField(p.publics[3]);left=reserve+amount;form=reserve?'D1':'D0';need(funding&&funding.point===point(p.funding)&&BigInt(funding.valueAtomic)===amount+p.fee,'funding binding');const s=c6Unhex(funding.script);need(s.length===25&&c6Hex(s.slice(0,3))==='76a914'&&c6Hex(s.slice(-2))==='88ac'||s.length===34&&[82,83].includes(s[0])&&s[1]===32,'funding destination');points.push(p.funding);}
 else {rootIndex=world.roots.findIndex(r=>eq(r,p.publics[1]));need(rootIndex>=0,'historical root absent');if(withdraw){amount=decodeField(p.publics[3]);left=reserve-amount-p.fee;need(left>0n||decodeField(p.publics[6])===0n,'full withdrawal change');form=left===0n?'W_full_no_change':decodeField(p.publics[6])!==0n?'W_partial_change':'W_partial_no_change';}else need(left>0n,'transfer reserve');}
 need(left>=0n&&left<=MAX&&new Set(points.map(c6Hex)).size===points.length,'reserve/prevouts');
 const transcript=world.transition({form,cms:p.cms,nfs:p.nfs,rootIndex}),stateScript=c6Cat(c6Unhex(d.anchor.script.slice(0,-66)),poseidonBytes(world.opening()),Uint8Array.of(117));
 const outputs=[{valueAtomic:'0',script:c6Hex(stateScript)}];if(left)outputs.push({valueAtomic:String(left),script:c6Hex(guardScript)});if(withdraw)outputs.push({valueAtomic:String(amount),script:c6Hex(p.payout)});
 const values={proof:p.proof,vk,prevouts:c6Cat(...points),nf:p.nfs[0]??ZERO,R:p.publics[1],amount:scriptNum(amount),chunk1:p.publication.slice(0,2048),chunk2:p.publication.slice(2048)};
 for(let i=0;i<5;i++)values['tree'+i]=transcript.slice(i*3072,(i+1)*3072);
 const leaf=d.leaves.find(l=>l.form===form);need(leaf,'missing leaf');const stack=[Uint8Array.of(16),...leaf.args.map(n=>{need(values[n] instanceof Uint8Array,'missing witness argument');return values[n];}),c6Unhex(leaf.script),c6Cat(Uint8Array.of(1),...paths[form])];
 const stacks=[stack,...(reserve?[[Uint8Array.of(0),guard]]:[]),...(dep?[[]]:[])],blob=b=>c6Cat(compact(b.length),b);
 const body=c6Cat(compact(points.length),...points.map(p=>c6Cat(p,Uint8Array.of(0),c6Unhex('ffffffff'))),compact(outputs.length),...outputs.map(o=>c6Cat(c6LE(o.valueAtomic,8),blob(c6Unhex(o.script)))),Uint8Array.of(0));
 const raw=c6Hex(c6Cat(c6LE(3,4),Uint8Array.of(0,1),body,...stacks.map(w=>c6Cat(compact(w.length),...w.map(blob))),new Uint8Array(4))),tx=readSponsorTransaction(raw);
 return {raw,txid:tx.txid,packetId:p.packetId,form,feeAtomic:String(p.fee),amountAtomic:String(amount),reserveAtomic:String(left),inputPoints:tx.inputs.map(i=>({txid:i.txid,vout:i.vout})),funding:dep?{index:points.length-1,...funding}:null,intent:c6SponsorIntent(raw,d),transcript:c6Hex(transcript)};
}

/** Ordinary-asset relocation keeps sponsor/change at index two. The immutable
 * packet contains no sponsor signature; authorize it with C6SponsorFlow only.
 */
function buildAssetTransaction({packet,scan,manifest,deployment,funding,sponsor}){
 const d=validateC6SponsorDeployment(deployment),meta=c6AssetMetadata(manifest),p=readC6Packet(packet,{kind:'asset',manifest});
 need(d.asset===meta.name&&String(d.unit)===String(meta.unit)&&c6Hex(p.network)===manifest.network&&c6Hex(p.pool)===manifest.commitment&&manifest.commitment===d.commitment&&c6Hex(p.publics[0])===manifest.context,'asset instance pins');
 need(manifest.fees?.[p.operation]?.some(f=>String(f)===String(p.fee)),'private fee level');
 const vk=c6Unhex(manifest.vks?.[p.operation]??'');need(vk.length>0&&c6Hex(sha256(vk))===manifest.vk_sha256?.[p.operation],'VK integrity');
 need(sponsor&&manifest.sponsor_fees?.includes(String(sponsor.feeAtomic)),'external fee level');
 const sponsorValue=BigInt(sponsor.valueAtomic),externalFee=BigInt(sponsor.feeAtomic),changeValue=sponsorValue-externalFee;
 need(sponsorValue>0n&&sponsorValue<=MAX&&externalFee>0n&&changeValue>=1000000n,'sponsor value/change range');
 c6NativeDestination(c6Unhex(sponsor.script));c6NativeDestination(c6Unhex(sponsor.changeScript));
 need(sponsor.script===sponsor.changeScript,'sponsor change must return to its owner');
 const world=new C6PublicWorld();need(c6Hex(world.opening())===d.anchor.opening,'empty birth');
 for(const e of scan.events??[]){const raw=world.transition({form:e.form,cms:e.cms.map(c6Unhex),nfs:e.nfs.map(c6Unhex),rootIndex:e.rootIndex});need(c6Hex(raw)===e.transcript,'confirmed transcript replay');}
 need(c6Hex(world.opening())===scan.opening,'state opening');const reserve=BigInt(scan.reserveAtomic);need(reserve>=0n&&reserve<=MAX&&reserve%meta.unit===0n&&!!reserve===!!world.mode,'asset reserve/mode');
 const guard=c6ReserveGuard(manifest),guardScript=c6ReserveScript(manifest),reserveOutput=value=>c6AssetTransferScript(guardScript,meta.name,value,{allowContract:true});
 const points=[c6Outpoint(scan.statePoint)],stacks=[];if(reserve){need(scan.reservePoint===scan.statePoint.split(':')[0]+':1'&&scan.reserveScript===c6Hex(reserveOutput(reserve)),'asset reserve UTXO');points.push(c6Outpoint(scan.reservePoint));}
 const dep=p.operation==='D',withdraw=p.operation==='W';let amount=0n,left=reserve,form=p.operation,rootIndex=null,fundingIndex;
 if(dep){
  amount=decodeField(p.publics[3]);left=reserve+amount;form=reserve?'D1':'D0';fundingIndex=reserve?3:1;
  need(funding&&funding.point===point(p.funding)&&funding.valueAtomic==='0','asset funding outpoint/XNA binding');
  const transfer=c6ReadAssetTransfer(c6Unhex(funding.script),{asset:meta.name,unit:meta.unit});need(BigInt(transfer.amountAtomic)===amount,'asset funding quantity binding');
  if(!reserve)points.push(p.funding);
 }else{rootIndex=world.roots.findIndex(r=>eq(r,p.publics[1]));need(rootIndex>=0,'historical root absent');if(withdraw){amount=decodeField(p.publics[3]);left=reserve-amount;need(left>0n||decodeField(p.publics[6])===0n,'full withdrawal change');form=left===0n?'W_full_no_change':decodeField(p.publics[6])!==0n?'W_partial_change':'W_partial_no_change';}else need(reserve>0n,'transfer reserve');}
 need(points.length===2,'asset pre-sponsor layout');points.push(c6Outpoint(sponsor.point));if(dep&&reserve)points.push(p.funding);
 need(left>=0n&&left<=MAX&&left%meta.unit===0n&&new Set(points.map(c6Hex)).size===points.length,'asset conservation/prevouts');
 const transcript=world.transition({form,cms:p.cms,nfs:p.nfs,rootIndex}),stateScript=c6Cat(c6Unhex(d.anchor.script.slice(0,-66)),poseidonBytes(world.opening()),Uint8Array.of(117));
 const outputs=[{valueAtomic:'0',script:c6Hex(stateScript)},{valueAtomic:'0',script:c6Hex(left?reserveOutput(left):p.payout)},{valueAtomic:String(changeValue),script:sponsor.changeScript}];
 if(withdraw&&left)outputs.push({valueAtomic:'0',script:c6Hex(p.payout)});
 const values={proof:p.proof,vk,prevouts:c6Cat(...points),nf:p.nfs[0]??ZERO,R:p.publics[1],amount:scriptNum(amount),chunk1:p.publication.slice(0,2048),chunk2:p.publication.slice(2048)};
 for(let i=0;i<5;i++)values['tree'+i]=transcript.slice(i*3072,(i+1)*3072);
 const leaf=d.leaves.find(l=>l.form===form),paths=controls(d.leaves,d.commitment);need(leaf,'missing asset leaf');
 stacks.push([Uint8Array.of(16),...leaf.args.map(n=>{need(values[n] instanceof Uint8Array,'missing witness argument');return values[n];}),c6Unhex(leaf.script),c6Cat(Uint8Array.of(1),...paths[form])]);
 stacks.push(reserve?[Uint8Array.of(0),guard]:[]);stacks.push([]);if(dep&&reserve)stacks.push([]);
 const blob=b=>c6Cat(compact(b.length),b),body=c6Cat(compact(points.length),...points.map(p=>c6Cat(p,Uint8Array.of(0),c6Unhex('ffffffff'))),compact(outputs.length),...outputs.map(o=>c6Cat(c6LE(o.valueAtomic,8),blob(c6Unhex(o.script)))),Uint8Array.of(0));
 const raw=c6Hex(c6Cat(c6LE(3,4),Uint8Array.of(0,1),body,...stacks.map(w=>c6Cat(compact(w.length),...w.map(blob))),new Uint8Array(4))),tx=readSponsorTransaction(raw);
 const offer={outpoint:sponsor.point,inputAtomic:String(sponsorValue),changeAtomic:String(changeValue),inputScript:sponsor.script,changeScript:sponsor.changeScript,index:2,sighash:131};
 return {raw,txid:tx.txid,packetId:p.packetId,form,feeAtomic:String(externalFee),privateFeeAtomic:'0',amountAtomic:String(amount),reserveAtomic:String(left),inputPoints:tx.inputs.map(i=>({txid:i.txid,vout:i.vout})),funding:dep?{index:fundingIndex,...funding}:null,sponsor:offer,intent:c6SponsorIntent(raw,d),transcript:c6Hex(transcript)};
}
