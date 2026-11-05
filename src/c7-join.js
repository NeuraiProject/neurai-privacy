import {sha256} from '@noble/hashes/sha2.js';
import {decodeNote,noteCommitment,noteNullifier} from './notes.js';
import {C7_PROFILE,isC7Descriptor,sealC7Note} from './c7.js';
import {encodeField,poseidonBytes,poseidonPermutation} from './poseidon.js';
import {c7ProofBytes} from './c7-operations.js';
/* C7 XNA J2 wallet API: join two notes into one. TEST only, no RPC or filesystem.
 * Secrets stay with the caller (normally a terminable Web Worker). Public
 * relocation never receives this object or the private witness inputs.
 */
const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
const unhex=s=>{if(typeof s!=='string'||!/^([0-9a-f]{2})*$/.test(s))throw Error('Canonical hex required');return Uint8Array.from(s.match(/../g)??[],x=>parseInt(x,16));};
const text=s=>new TextEncoder().encode(s);
const cat=(...parts)=>{const out=new Uint8Array(parts.reduce((n,x)=>n+x.length,0));let at=0;for(const x of parts){out.set(x,at);at+=x.length;}return out;};
const same=(a,b)=>hex(a)===hex(b);
const decimal=x=>typeof x==='bigint'?String(x):Array.isArray(x)?x.map(decimal):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,decimal(v)])):x;
const LE=(value,length)=>{let n=BigInt(value);if(n<0n)throw Error('Negative unsigned integer');const out=new Uint8Array(length);for(let i=0;i<length;i++){out[i]=Number(n&255n);n>>=8n;}if(n)throw Error('Integer overflow');return out;};
const MAX_MONEY=2100000000000000000n;
const money=(n,zero=false)=>{if(typeof n!=='bigint'&&!(typeof n==='string'&&/^(0|[1-9][0-9]*)$/.test(n)))throw Error('Exact atomic amount required');n=BigInt(n);if(n<(zero?0n:1n)||n>MAX_MONEY)throw Error('Money range');return n;};
const bytes=(value,length)=>{if(!(value instanceof Uint8Array)||value.length!==length)throw Error('Byte length');return value;};
const num=b=>{const value=BigInt('0x'+hex(bytes(b,32)));if(value>=21888242871839275222246405745257275088548364400416034343698204186575808495617n)throw Error('Noncanonical Fr');return value;};
const merkle=(leaf,index,path)=>{if(!Number.isInteger(index)||index<0||index>0xffffffff||path.length!==32)throw Error('Merkle shape');let value=num(leaf),i=BigInt(index);for(const sibling of path){const other=num(sibling);value=poseidonPermutation(i&1n?[0n,other,value]:[0n,value,other])[0];i>>=1n;}return encodeField(value);};

/** Local XNA TEST J2 builder/prover; no RPC, signing or broadcast. Supply pins
 * independently of a retrieved manifest. Proving parameters/VK must be
 * independently pinned by the application.
 */
export function createC7JoinWallet({expectedGenesis,expectedCommitment,kind='xna'}={}){
 if(kind!=='xna')throw Error('C7 pools hold XNA');
 const pin=value=>typeof value==='string'&&/^[0-9a-f]{64}$/.test(value);
 if(!pin(expectedGenesis)||!pin(expectedCommitment))throw Error('C7 J2 needs independently pinned genesis and commitment');
 const intents=new WeakMap();
 let ready=false;
 const fingerprint=p=>hex(sha256(cat(text(JSON.stringify({input:p.input,publics:p.publics,resources:p.resources})),
  p.blob,p.network,p.pool,p.created.note,p.created.cm,p.created.record)));
 function prepare({manifest,domain,assetId,root,notes,fee,change}){
  if(manifest?.profile!==C7_PROFILE)throw Error('Unsupported C7 J2 manifest profile');
  if(manifest.network!==expectedGenesis||manifest.commitment!==expectedCommitment)throw Error('C7 J2 manifest differs from pinned instance');
  const D=bytes(domain,32),AID=bytes(assetId,32),R=bytes(root,32),ctx=unhex(manifest.context);
  // J2 uses unit=1, no registry. Validate the circuit's private context
  // relation locally before allocating proving resources.
  if(hex(poseidonBytes(cat(text('NeuraiPoolCtx\x01'),D,AID,LE(1n,8),new Uint8Array(32))))!==manifest.context)throw Error('C7 J2 domain/asset context mismatch');
  ready=true;
  if(num(R)===0n||num(ctx)===0n||notes?.length!==2)throw Error('Join context');
  if(!Array.isArray(manifest.fees?.J2)||!manifest.fees.J2.some(v=>money(String(v),true)===money(fee,true)))throw Error('Manifest J2 fee level');
  fee=money(fee,true);const opened=notes.map(row=>{
   const note=bytes(row.note,169),sk=bytes(row.spendSecret,32),decoded=decodeNote(note),cm=noteCommitment(note),nf=noteNullifier(note,sk);
   if(!same(decoded.domain,D)||!same(decoded.assetId,AID)||!same(merkle(cm,row.index,row.path),R))throw Error('Note instance or membership');
   return {note:note.slice(),sk:sk.slice(),decoded,cm,nf,index:row.index,path:row.path.map(x=>x.slice())};
  });
  if(opened[0].index===opened[1].index||same(opened[0].cm,opened[1].cm)||same(opened[0].nf,opened[1].nf))throw Error('Distinct real notes required');
  const total=money(opened[0].decoded.amountAtomic+opened[1].decoded.amountAtomic),amount=money(total-fee);
  const first=opened[0].decoded,own={domain:hex(D),asset_id:hex(AID),owner:hex(first.owner),view_pub:hex(first.viewPub)};
  // The new note goes to the address of note 0. A C7 note does not carry its
  // diversifier, so the wallet supplies that address as change.
  if(!(isC7Descriptor(change)&&Object.keys(own).every(k=>change[k]===own[k])))throw Error('C7 J2 needs the address of note 0');
  const created=sealC7Note({descriptor:change,amountAtomic:amount});
  if(opened.some(x=>same(x.cm,created.cm)))throw Error('Fresh output required');
  const blob=new Uint8Array(4096);blob.set([3,1]);blob.set(opened[0].nf,2);blob.set(opened[1].nf,34);blob.set(created.cm,66);blob.set(created.record.slice(0,230),98);
  if(blob[98]!==2)throw Error('Note record framing');
  // The J2 data tag is the one C6 introduced; the J2 circuit commits to it.
  const P=poseidonBytes,dh=P(cat(P(cat(P(text('NeuraiPoolC6/J2/data\x01')),blob.slice(0,2048))),blob.slice(2048)));
  const publics=[num(ctx),num(R),...opened.map(x=>num(x.nf)),num(dh),fee,num(created.cm)];
  const input={ctx:num(ctx),D:Array.from(D),AID:Array.from(AID),unit:1n,registryRoot:Array(32).fill(0),R:num(R),
   nf_0:publics[2],nf_1:publics[3],data_hash:publics[4],fee,cm:publics[6],
   sk:opened.map(x=>Array.from(x.sk)),spentNote:opened.map(x=>Array.from(x.note)),spentCm:opened.map(x=>num(x.cm)),
   spentAmount:opened.map(x=>x.decoded.amountAtomic),spentIndex:opened.map(x=>x.index),spentPath:opened.map(x=>x.path.map(num)),
   note:Array.from(created.note),amount};
  // The returned input is private. Never serialize it into a delivery packet.
  const prepared={input:decimal(input),publics:publics.map(String),blob,created,resources:opened.map(x=>({cm:hex(x.cm),nf:hex(x.nf)})),
   network:unhex(manifest.network),pool:unhex(manifest.commitment)};
  bytes(prepared.network,32);bytes(prepared.pool,32);intents.set(prepared,fingerprint(prepared));return prepared;
 }
 async function proveJoin(prepared,{api,wasm,zkey,vk,stage=()=>{},signal}){
  const abort=()=>{if(signal?.aborted)throw Error('Aborted locally; an exposed packet is not cancelled on chain');};
  const expected=intents.get(prepared);
  const checkIntent=()=>{
   abort();
   if(expected===undefined||fingerprint(prepared)!==expected)throw Error('Wallet intent changed after preparation');
  };
  checkIntent();
  // Prove and serialize a private snapshot. In-flight callers and progress
  // callbacks cannot change the witness, publications or reserved resources.
  const stable=structuredClone(prepared);
  if(fingerprint(stable)!==expected)throw Error('Wallet intent changed after preparation');
  stage('Compute witness');checkIntent();const witness={type:'mem'};
  await api.wtns.calculate(structuredClone(stable.input),wasm,witness);checkIntent();
  stage('Generate J2 proof');checkIntent();
  const result=structuredClone(await api.groth16.prove(zkey,witness,undefined,{singleThread:true}));checkIntent();
  if(JSON.stringify(result.publicSignals.map(String))!==JSON.stringify(stable.publics))throw Error('Public signals differ from wallet intent');
  stage('Verify J2 proof');checkIntent();
  if(!await api.groth16.verify(vk,structuredClone(result.publicSignals),structuredClone(result.proof)))throw Error('Invalid generated proof');
  checkIntent();
  const proof=c7ProofBytes(result.proof),fields=result.publicSignals.map(v=>encodeField(BigInt(v)));
  bytes(stable.network,32);bytes(stable.pool,32);
  // Packet magic and id tag are the ones C6 introduced; C7 kept them.
  const packet=cat(unhex('4e4336504b540200'),stable.network,stable.pool,Uint8Array.of(5,7),...fields,proof,LE(4096,2),stable.blob,Uint8Array.of(0,0));
  if(packet.length!==4526)throw Error('J2 packet length');
  return {packet,packetId:hex(sha256(cat(text('NeuraiC6Packet\x02'),packet))),proof:result.proof,publicSignals:result.publicSignals};
 }
 return {prepare,prove:(...args)=>{if(!ready)throw Error('Prepare a pinned J2 first');return proveJoin(...args);}};
}
