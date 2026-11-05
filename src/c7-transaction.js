/* Public-only C7 XNA TEST relocation. Construction is not authorization:
 * verify the exact proof/intent first, then ask a validating node for admission.
 * No spending key, plaintext note or private membership path is used here.
 * Byte tags (NeuraiPoolC6/..., NeuraiC6Packet, the NC6PKT magic) are those the
 * pool contract and the proofs commit to; C7 kept them from C6.
 */
import {sha256} from '@noble/hashes/sha2.js';
import {decodeField,encodeField,poseidonBytes} from './poseidon.js';
import {poolTreeNode,poolIndexedLeaf} from './pool-state.js';
import {decodeC7Publication,c7PublicationHash} from './c7-publication.js';
import {C7_PROFILE} from './c7.js';
import {readC7RawTransaction} from './c7-raw-transaction.js';
import {validateC7Deployment,c7Intent} from './c7-deployment.js';
export const C7_FORMS=['D0','D1','T1','T2','T3','W_partial_no_change','W_partial_change','W_full_no_change','J2'];
const ZERO=new Uint8Array(32),MAX=2100000000000000000n,QUANTUM=10000000000n;
export const c7Hex=b=>Array.from(b,v=>v.toString(16).padStart(2,'0')).join('');
export function c7Unhex(s){need(typeof s==='string'&&/^(?:[0-9a-f]{2})*$/.test(s),'canonical hex');return Uint8Array.from(s.match(/../g)??[],v=>parseInt(v,16));}
const eq=(a,b)=>c7Hex(a)===c7Hex(b),text=s=>new TextEncoder().encode(s);
export function c7Cat(...parts){const b=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let i=0;for(const p of parts){b.set(p,i);i+=p.length;}return b;}
function need(ok,msg){if(!ok)throw Error('C7 transaction: '+msg);}
export function c7LE(n,size){n=BigInt(n);need(n>=0n,'unsigned');const b=new Uint8Array(size);for(let i=0;i<size;i++,n>>=8n)b[i]=Number(n&255n);need(n===0n,'overflow');return b;}
const compact=n=>n<253?c7LE(n,1):n<=65535?c7Cat(Uint8Array.of(253),c7LE(n,2)):c7Cat(Uint8Array.of(254),c7LE(n,4));
const tagged=(s,b)=>{const h=sha256(text(s));return sha256(c7Cat(h,h,b));};
export function c7Outpoint(point){need(/^[0-9a-f]{64}:[0-9]+$/.test(point),'outpoint');const [id,v]=point.split(':');need(Number(v)<=0xffffffff&&String(Number(v))===v,'vout');return c7Cat(c7Unhex(id).reverse(),c7LE(v,4));}
const point=b=>c7Hex(b.slice(0,32).reverse())+':'+new DataView(b.buffer,b.byteOffset+32,4).getUint32(0,true);
function scriptNum(n){n=BigInt(n);if(!n)return new Uint8Array();const b=[];for(;n;n>>=8n)b.push(Number(n&255n));if(b.at(-1)&128)b.push(0);return Uint8Array.from(b);}
function push(b){need(b.length<=75,'guard constant');return c7Cat(Uint8Array.of(b.length),b);}
function c7Manifest(manifest){need(manifest?.profile===C7_PROFILE,'C7 manifest required');return manifest;}
export function c7ReserveGuard(manifest){
 need(typeof manifest.identity==='string'&&/^[A-Z0-9_#./!~-]{1,64}$/.test(manifest.identity),'state identity');
 return c7Cat(c7Unhex('0052c420'),c7Unhex(manifest.commitment),c7Unhex('880051cf'),push(text(manifest.identity)),c7Unhex('880051ce'),push(text(manifest.identity)),c7Unhex('8800d50052c48851'));
}
export function c7ReserveScript(manifest){return c7Cat(c7Unhex('5120'),tagged('NeuraiAuthScript',c7Cat(Uint8Array.of(1,0),sha256(c7ReserveGuard(manifest)))));}
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
  return c7Cat(c7LE(index,4),encodeField(pv),encodeField(nv),c7LE(ni,4),...predPath,...emptyPath);
 }
}
/** Deterministic public trees, rebuilt from confirmed events only. */
export class C7PublicWorld{
 constructor(){this.notes=new Sparse();this.history=new Sparse();this.nfs=new Indexed('nf');this.seen=new Indexed('cm');this.noteCount=0;this.roots=[];this.mode=0;}
 opening(){return c7Cat(this.notes.root,this.nfs.tree.root,this.seen.tree.root,c7LE(this.noteCount,4),c7LE(this.nfs.entries.length,4),c7LE(this.seen.entries.length,4),Uint8Array.of(this.mode),this.history.root,c7LE(this.roots.length,4));}
 transition({form,cms,nfs,rootIndex}){
  need(C7_FORMS.includes(form),'form');const dep=form[0]==='D',join=form==='J2',old=this.opening(),parts=[];
  const count=dep||join||form==='W_partial_change'?1:form[0]==='T'?Number(form[1]):0;
  need(cms.length===count&&nfs.length===(dep?0:join?2:1),'transition shape');need(this.mode===Number(form!=='D0'),'mode');
  if(!dep){need(Number.isInteger(rootIndex)&&rootIndex>=0&&rootIndex<this.roots.length,'historical root');parts.push(c7LE(rootIndex,4),...this.history.path(rootIndex));}
  need(new Set(nfs.map(c7Hex)).size===nfs.length,'duplicate nullifiers');for(const nf of nfs)parts.push(this.nfs.insert(decodeField(nf)));
  for(const cm of cms){need(this.noteCount<=0xfffffffd&&decodeField(cm)>0n,'note capacity/value');parts.push(...this.notes.path(this.noteCount));this.notes.set(this.noteCount++,cm);parts.push(this.seen.insert(decodeField(cm)));}
  if(cms.length){need(this.roots.length<0xffffffff,'historical capacity');parts.push(...this.history.path(this.roots.length));this.history.set(this.roots.length,this.notes.root);this.roots.push(this.notes.root);}
  this.mode=Number(form!=='W_full_no_change');
  const raw=c7Cat(Uint8Array.of(join?3:2,C7_FORMS.indexOf(form)),old,this.opening(),...(dep?[ZERO]:nfs),...cms,...parts);
  need(raw.length<=15360,'transcript capacity');return raw;
 }
}
/** Decode a C7 proof packet. `manifest` must be the C7 manifest of the pool. */
export function readC7Packet(raw,{kind='xna',manifest}={}){
 need(kind==='xna','C7 pools hold XNA');c7Manifest(manifest);
 need(raw instanceof Uint8Array&&raw.length<=4800,'packet size');let at=0;
 const take=n=>{need(at+n<=raw.length,'truncated packet');const b=raw.slice(at,at+n);at+=n;return b;};
 const magic=c7Hex(take(8)),join=magic==='4e4336504b540200';need(join||magic==='4e4336504b540100','packet version');
 const network=take(32),pool=take(32),op=take(1)[0],count=take(1)[0],operations=['D','T1','T2','T3','W','J2'];
 need(join?op===5&&count===7:op<5&&count===[5,6,7,8,8][op],'packet op/count');const operation=operations[op];
 const publics=Array.from({length:count},()=>{const b=take(32);decodeField(b);return b;}),proof=take(128),len=take(2),publication=take(len[0]+len[1]*256),payout=take(take(1)[0]),funding=take(take(1)[0]);
 need(at===raw.length,'trailing packet');need(funding.length===(op===0?36:0),'funding');
 const fee=decodeField(publics[op===5?5:4]);need(fee<=MAX,'fee range');const dep=op===0,withdraw=op===4,change=withdraw&&decodeField(publics[6])!==0n;
 let cms=[],nfs=dep?[]:join?publics.slice(2,4):[publics[2]];
 need(nfs.every(n=>decodeField(n)>0n)&&new Set(nfs.map(c7Hex)).size===nfs.length,'nullifiers');
 if(!withdraw||change){
  need(publication.length===4096,'publication size');let digest;
  // J2: 03 01 || nf0 || nf1 || cm || one 230-byte record || zero padding
  if(join){need(c7Hex(publication.slice(0,2))==='0301'&&publication[98]===2&&publication.slice(328).every(b=>b===0),'J2 publication');cms=[publication.slice(66,98)];need(nfs.every((n,i)=>eq(n,publication.slice(2+i*32,34+i*32)))&&eq(cms[0],publics[6]),'J2 fields');digest=poseidonBytes(c7Cat(poseidonBytes(c7Cat(poseidonBytes(text('NeuraiPoolC6/J2/data\x01')),publication.slice(0,2048))),publication.slice(2048)));}
  else {const p=decodeC7Publication(dep?'D0':withdraw?'T1':operation,publication);cms=p.cms;need(dep||eq(p.nf,nfs[0]),'publication nf');digest=c7PublicationHash(dep?'D0':withdraw?'T1':operation,publication);if(!dep)need(cms.every((cm,i)=>eq(cm,publics[withdraw?6:5+i])),'publication cm');}
  need(eq(digest,publics[dep?2:withdraw?7:join?4:3]),'publication digest');
 }else need(publication.length===0&&c7Hex(publics[7])==='04bf938a28af8bc7ab2810e0adf3cbbb55aa4feb79827feed2722c5123baac15','no-publication domain');
 if(dep){const amount=decodeField(publics[3]);need(amount>0n&&amount<=MAX&&amount%QUANTUM===0n&&eq(publics[1],poseidonBytes(c7Cat(text('NIP045/dep\x01'),c7LE(amount,8),cms[0]))),'deposit binding');}
 need(withdraw?((payout.length===25&&c7Hex(payout.slice(0,3))==='76a914'&&c7Hex(payout.slice(-2))==='88ac')||(payout.length===34&&[82,83].includes(payout[0])&&payout[1]===32)):payout.length===0,'payout shape');
 if(withdraw){const amount=decodeField(publics[3]);need(amount>0n&&amount<=MAX&&(amount<QUANTUM&&!change||amount%QUANTUM===0n),'withdrawal quantum');need(eq(publics[5],poseidonBytes(c7Cat(text('NeuraiPoolC6/pay\x01'),compact(payout.length),payout))),'payout binding');}
 return {network,pool,operation,publics,proof,publication,payout,funding,cms,nfs,fee,packetId:c7Hex(sha256(c7Cat(c7Cat(text('NeuraiC6Packet'),Uint8Array.of(join?2:1)),raw)))};
}
function controls(leaves,C){
 const names=leaves.map(l=>l.form).sort(),map=Object.fromEntries(leaves.map(l=>[l.form,l]));need(new Set(names).size===names.length,'duplicate forms');
 function tree(ns){if(ns.length===1){const s=c7Unhex(map[ns[0]].script);return [tagged('NeuraiAuthLeaf',c7Cat(Uint8Array.of(1),compact(s.length),s)),{[ns[0]]:[]}];}
  let cut=1;while(cut*2<ns.length)cut*=2;const [a,pa]=tree(ns.slice(0,cut)),[b,pb]=tree(ns.slice(cut));
  return [tagged('NeuraiAuthBranch',c7Hex(a)<c7Hex(b)?c7Cat(a,b):c7Cat(b,a)),Object.fromEntries([...Object.entries(pa).map(([n,p])=>[n,[...p,b]]),...Object.entries(pb).map(([n,p])=>[n,[...p,a]])])];}
 const [root,paths]=tree(names);need(c7Hex(tagged('NeuraiAuthScript',c7Cat(Uint8Array.of(4,0),root)))===C,'MAST pin');return paths;
}
/** Public relocation of a previously verified, immutable packet. A changed
 * state requires rebuilding these paths, not regenerating its private proof.
 */
export function buildC7Transaction({packet,scan,manifest,deployment,funding}){
 const d=validateC7Deployment(deployment),p=readC7Packet(packet,{manifest});
 need(c7Hex(p.network)===manifest.network&&c7Hex(p.pool)===manifest.commitment&&manifest.commitment===d.commitment&&c7Hex(p.publics[0])===manifest.context,'instance pins');
 need(manifest.fees?.[p.operation]?.some(f=>String(f)===String(p.fee)),'fee level');
 const vk=c7Unhex(manifest.vks?.[p.operation]??'');need(vk.length>0&&c7Hex(sha256(vk))===manifest.vk_sha256?.[p.operation],'VK integrity');
 const world=new C7PublicWorld();need(c7Hex(world.opening())===d.anchor.opening,'empty birth');
 for(const e of scan.events??[]){const raw=world.transition({form:e.form,cms:e.cms.map(c7Unhex),nfs:e.nfs.map(c7Unhex),rootIndex:e.rootIndex});need(c7Hex(raw)===e.transcript,'confirmed transcript replay');}
 need(c7Hex(world.opening())===scan.opening,'state opening');const reserve=BigInt(scan.reserveAtomic);need(reserve>=0n&&reserve<=MAX&&!!reserve===!!world.mode,'reserve/mode');
 const paths=controls(d.leaves,d.commitment),guard=c7ReserveGuard(manifest),guardScript=c7ReserveScript(manifest),dep=p.operation==='D',withdraw=p.operation==='W';
 const points=[c7Outpoint(scan.statePoint)];if(reserve){need(scan.reservePoint===scan.statePoint.split(':')[0]+':1'&&scan.reserveScript===c7Hex(guardScript),'reserve UTXO');points.push(c7Outpoint(scan.reservePoint));}
 let amount=0n,left=reserve-p.fee,form=p.operation,rootIndex=null;
 if(dep){amount=decodeField(p.publics[3]);left=reserve+amount;form=reserve?'D1':'D0';need(funding&&funding.point===point(p.funding)&&BigInt(funding.valueAtomic)===amount+p.fee,'funding binding');const s=c7Unhex(funding.script);need(s.length===25&&c7Hex(s.slice(0,3))==='76a914'&&c7Hex(s.slice(-2))==='88ac'||s.length===34&&[82,83].includes(s[0])&&s[1]===32,'funding destination');points.push(p.funding);}
 else {rootIndex=world.roots.findIndex(r=>eq(r,p.publics[1]));need(rootIndex>=0,'historical root absent');if(withdraw){amount=decodeField(p.publics[3]);left=reserve-amount-p.fee;need(left>0n||decodeField(p.publics[6])===0n,'full withdrawal change');form=left===0n?'W_full_no_change':decodeField(p.publics[6])!==0n?'W_partial_change':'W_partial_no_change';}else need(left>0n,'transfer reserve');}
 need(left>=0n&&left<=MAX&&new Set(points.map(c7Hex)).size===points.length,'reserve/prevouts');
 const transcript=world.transition({form,cms:p.cms,nfs:p.nfs,rootIndex}),stateScript=c7Cat(c7Unhex(d.anchor.script.slice(0,-66)),poseidonBytes(world.opening()),Uint8Array.of(117));
 const outputs=[{valueAtomic:'0',script:c7Hex(stateScript)}];if(left)outputs.push({valueAtomic:String(left),script:c7Hex(guardScript)});if(withdraw)outputs.push({valueAtomic:String(amount),script:c7Hex(p.payout)});
 const values={proof:p.proof,vk,prevouts:c7Cat(...points),nf:p.nfs[0]??ZERO,R:p.publics[1],amount:scriptNum(amount),chunk1:p.publication.slice(0,2048),chunk2:p.publication.slice(2048)};
 for(let i=0;i<5;i++)values['tree'+i]=transcript.slice(i*3072,(i+1)*3072);
 const leaf=d.leaves.find(l=>l.form===form);need(leaf,'missing leaf');const stack=[Uint8Array.of(16),...leaf.args.map(n=>{need(values[n] instanceof Uint8Array,'missing witness argument');return values[n];}),c7Unhex(leaf.script),c7Cat(Uint8Array.of(1),...paths[form])];
 const stacks=[stack,...(reserve?[[Uint8Array.of(0),guard]]:[]),...(dep?[[]]:[])],blob=b=>c7Cat(compact(b.length),b);
 const body=c7Cat(compact(points.length),...points.map(p=>c7Cat(p,Uint8Array.of(0),c7Unhex('ffffffff'))),compact(outputs.length),...outputs.map(o=>c7Cat(c7LE(o.valueAtomic,8),blob(c7Unhex(o.script)))));
 const raw=c7Hex(c7Cat(c7LE(3,4),Uint8Array.of(0,1),body,...stacks.map(w=>c7Cat(compact(w.length),...w.map(blob))),new Uint8Array(4))),tx=readC7RawTransaction(raw);
 return {raw,txid:tx.txid,packetId:p.packetId,form,feeAtomic:String(p.fee),amountAtomic:String(amount),reserveAtomic:String(left),inputPoints:tx.inputs.map(i=>({txid:i.txid,vout:i.vout})),funding:dep?{index:points.length-1,...funding}:null,intent:c7Intent(raw,d),transcript:c7Hex(transcript)};
}
