import {c6AssetMetadata} from './c6-assets.js';
import {sha256} from '@noble/hashes/sha2.js';
import {decodeNote,noteCommitment,noteNullifier} from './notes.js';
import {sealNote} from './hpke.js';
import {encodeField,poseidonBytes,poseidonPermutation} from './poseidon.js';
/* Experimental six-key C6 XNA J2 wallet API. TEST only, no RPC or filesystem.
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

function compress(proof){
 const FP=21888242871839275222246405745257275088696311157297823662689037894645226208583n;
 const g1=p=>{const x=BigInt(p[0]),y=BigInt(p[1]);if(x<0n||x>=FP||y<=0n||y>=FP||(y*y-x*x*x-3n)%FP!==0n)throw Error('G1 encoding');return LE(x|((y>FP-y?1n:0n)<<255n),32);};
 const g2=p=>{const x=p[0].map(BigInt),y=p[1].map(BigInt),neg=y.map(v=>(FP-v)%FP);if([...x,...y].some(v=>v<0n||v>=FP))throw Error('G2 encoding');return cat(LE(x[0],32),LE(x[1]|(((y[1]>neg[1]||(y[1]===neg[1]&&y[0]>neg[0]))?1n:0n)<<255n),32));};
 return cat(g1(proof.pi_a),g2(proof.pi_b),g1(proof.pi_c));
}

/** Injectable SDK/prover permits the same wallet logic in Node and a browser. */
function createJoinWallet(sdk){
 const intents=new WeakMap();
 const fingerprint=p=>hex(sdk.sha256(cat(text(JSON.stringify({input:p.input,publics:p.publics,resources:p.resources})),
  p.blob,p.network,p.pool,p.created.note,p.created.cm,p.created.record)));
 const num=b=>{const value=BigInt('0x'+hex(bytes(b,32)));if(value>=21888242871839275222246405745257275088548364400416034343698204186575808495617n)throw Error('Noncanonical Fr');return value;};
 const merkle=(leaf,index,path)=>{if(!Number.isInteger(index)||index<0||index>0xffffffff||path.length!==32)throw Error('Merkle shape');let value=num(leaf),i=BigInt(index);for(const sibling of path){const other=num(sibling);value=sdk.poseidonPermutation(i&1n?[0n,other,value]:[0n,value,other])[0];i>>=1n;}return sdk.encodeField(value);};
 function prepare({manifest,domain,assetId,root,notes,fee}){
  const D=bytes(domain,32),AID=bytes(assetId,32),R=bytes(root,32),ctx=unhex(manifest.context);
  if(num(R)===0n||num(ctx)===0n||notes.length!==2)throw Error('Join context');
  if(!Array.isArray(manifest.fees?.J2)||!manifest.fees.J2.some(v=>money(String(v),true)===money(fee,true)))throw Error('Manifest J2 fee level');
  fee=money(fee,true);const opened=notes.map(row=>{
   const note=bytes(row.note,169),sk=bytes(row.spendSecret,32),decoded=sdk.decodeNote(note),cm=sdk.noteCommitment(note),nf=sdk.noteNullifier(note,sk);
   if(!same(decoded.domain,D)||!same(decoded.assetId,AID)||!same(merkle(cm,row.index,row.path),R))throw Error('Note instance or membership');
   return {note:note.slice(),sk:sk.slice(),decoded,cm,nf,index:row.index,path:row.path.map(x=>x.slice())};
  });
  if(opened[0].index===opened[1].index||same(opened[0].cm,opened[1].cm)||same(opened[0].nf,opened[1].nf))throw Error('Distinct real notes required');
  if(opened.some(x=>x.decoded.amountAtomic%sdk.unit!==0n))throw Error('Asset note precision');
  const total=money(opened[0].decoded.amountAtomic+opened[1].decoded.amountAtomic),amount=money(total-fee);
  const first=opened[0].decoded;
  const created=sdk.sealNote({descriptor:{domain:hex(D),asset_id:hex(AID),owner:hex(first.owner),view_pub:hex(first.viewPub)},amountAtomic:amount});
  if(opened.some(x=>same(x.cm,created.cm)))throw Error('Fresh output required');
  const blob=new Uint8Array(4096);blob.set([3,1]);blob.set(opened[0].nf,2);blob.set(opened[1].nf,34);blob.set(created.cm,66);blob.set(created.record.slice(0,220),98);
  if(hex(blob.slice(98,101))!=='01d900')throw Error('HPKE framing');
  const P=sdk.poseidonBytes,dh=P(cat(P(cat(P(text('NeuraiPoolC6/J2/data\x01')),blob.slice(0,2048))),blob.slice(2048)));
  const publics=[num(ctx),num(R),...opened.map(x=>num(x.nf)),num(dh),fee,num(created.cm)];
  const input={ctx:num(ctx),D:Array.from(D),AID:Array.from(AID),unit:sdk.unit,registryRoot:Array(32).fill(0),R:num(R),
   nf_0:publics[2],nf_1:publics[3],data_hash:publics[4],fee,cm:publics[6],
   sk:opened.map(x=>Array.from(x.sk)),spentNote:opened.map(x=>Array.from(x.note)),spentCm:opened.map(x=>num(x.cm)),
   spentAmount:opened.map(x=>x.decoded.amountAtomic),spentIndex:opened.map(x=>x.index),spentPath:opened.map(x=>x.path.map(num)),
   note:Array.from(created.note),amount};
  // The returned input is private. Never serialize it into a delivery packet.
  const prepared={input:decimal(input),publics:publics.map(String),blob,created,resources:opened.map(x=>({cm:hex(x.cm),nf:hex(x.nf)})),
   network:unhex(manifest.network),pool:unhex(manifest.commitment)};
  bytes(prepared.network,32);bytes(prepared.pool,32);intents.set(prepared,fingerprint(prepared));return prepared;
 }
 async function prove(prepared,{api,wasm,zkey,vk,stage=()=>{},signal}){
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
  const proof=compress(result.proof),fields=result.publicSignals.map(v=>sdk.encodeField(BigInt(v)));
  bytes(stable.network,32);bytes(stable.pool,32);
  const packet=cat(unhex('4e4336504b540200'),stable.network,stable.pool,Uint8Array.of(5,7),...fields,proof,LE(4096,2),stable.blob,Uint8Array.of(0,0));
  if(packet.length!==4526)throw Error('J2 packet length');
  return {packet,packetId:hex(sdk.sha256(cat(text('NeuraiC6Packet\x02'),packet))),proof:result.proof,publicSignals:result.publicSignals};
 }
 return {prepare,prove};
}


/** Local XNA TEST J2 builder/prover; no RPC, signing or broadcast. Supply pins
 * independently of a retrieved manifest. This is not a full C6 pool worker.
 * Proving parameters/VK must be independently pinned by the application.
 */
export function createC6JoinWallet({expectedGenesis,expectedCommitment,kind='xna'}={}){
 if(!['xna','asset'].includes(kind))throw Error('Unsupported C6 custody kind');
 const pin=value=>typeof value==='string'&&/^[0-9a-f]{64}$/.test(value);
 if(!pin(expectedGenesis)||!pin(expectedCommitment))throw Error('C6 J2 needs independently pinned genesis and commitment');
 let api;
 return {
  prepare(request){
   if(request?.manifest?.profile!==(kind==='asset'?'C6-ORDINARY-ASSET-TEST-J2-v1':'C6-XNA-TEST-J2-v2'))throw Error('Unsupported C6 J2 manifest profile');
   if(request.manifest.network!==expectedGenesis||request.manifest.commitment!==expectedCommitment)throw Error('C6 J2 manifest differs from pinned instance');
   // J2 uses unit=1, no registry. Validate the circuit's private context
   // relation locally before allocating proving resources.
   const domain=bytes(request.domain,32),asset=bytes(request.assetId,32);
   const unit=kind==='asset'?c6AssetMetadata(request.manifest).unit:1n;
   if(kind==='asset'&&money(request.fee,true)!==0n)throw Error('Asset private fee must be zero');
   const context=poseidonBytes(cat(text('NeuraiPoolCtx\x01'),domain,asset,LE(unit,8),new Uint8Array(32)));
   if(hex(context)!==request.manifest.context)throw Error('C6 J2 domain/asset context mismatch');
   api??=createJoinWallet({sha256,decodeNote,noteCommitment,noteNullifier,sealNote,encodeField,poseidonBytes,poseidonPermutation,unit});
   return api.prepare(request);
  },
  prove:(...args)=>{if(!api)throw Error('Prepare a pinned J2 first');return api.prove(...args);},
 };
}
