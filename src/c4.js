/** Experimental C4 XNA TEST builder. Not a multiasset wallet or production deployment. */
import { c4Context, encodeC4Publication, c4PublicationHash } from './c4-publication.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { poseidonBytes, decodeField, encodeField } from './poseidon.js';
import { poolTreeNode, poolIndexedLeaf, poolIndexedInsert, poolStateOpening, poolStateDigest } from './pool-state.js';
import { noteCommitment, noteNullifier, decodeNote } from './notes.js';
import { serializePoolTemplate } from './pool-transaction.js';
import { RESET_TESTNET_GENESIS } from './shared.js';
import { NEURAI_POOL_HASH_LABELS } from './protocol-constants.js';
export const C4_FORMS = ['D0', 'D1', 'T1', 'T2', 'T3', 'T4', 'W_partial', 'W_full'];
export const hex = x => Array.from(x, b => b.toString(16).padStart(2, '0')).join('');
export function unhex(x) {
  if (typeof x !== 'string' || !/^(?:[0-9a-f]{2})*$/i.test(x)) throw new Error('Invalid hex');
  return Uint8Array.from(x.match(/../g) ?? [], b => parseInt(b, 16));
}
export function cat(...xs) { const r = new Uint8Array(xs.reduce((n,x) => n+x.length,0)); let i=0; for(const x of xs){r.set(x,i);i+=x.length;} return r; }
const utf8 = x => new TextEncoder().encode(x);
const demand = (ok, why) => { if (!ok) throw new Error(why); };
export function le(x, size) { let n=BigInt(x); demand(n>=0n && n<1n<<BigInt(size*8),'Integer overflow'); const b=new Uint8Array(size);for(let i=0;i<size;i++){b[i]=Number(n&255n);n>>=8n;}return b; }
export function compact(n) { return n<253 ? le(n,1) : n<=65535 ? cat(le(253,1),le(n,2)) : cat(le(254,1),le(n,4)); }
const variable = b => cat(compact(b.length),b);
export function push(b) { return cat(b.length<76 ? le(b.length,1) : b.length<=255 ? cat(le(76,1),le(b.length,1)) : cat(le(77,1),le(b.length,2)),b); }
export function tagged(tag, data) { const t=sha256(utf8(tag));return sha256(cat(t,t,data)); }
const p2pkh = x => /^76a914[0-9a-f]{40}88ac$/.test(x);
const transparent = x => p2pkh(x) || /^(?:52|53)20[0-9a-f]{64}$/.test(x);
export function c4DustAtomic(scriptHex, feePerKb = '3000') {
  demand((transparent(scriptHex) || /^5120[0-9a-f]{64}$/.test(scriptHex)) && typeof feePerKb === 'string' && /^(0|[1-9][0-9]*)$/.test(feePerKb), 'Invalid dust policy input');
  const size = p2pkh(scriptHex) ? 182n : /^(?:51|52)/.test(scriptHex) ? 1020n : 112n;
  const rate = BigInt(feePerKb), fee = size * rate / 1000n;
  return fee === 0n && rate > 0n ? 1n : fee;
}
const decimal = x => typeof x === 'bigint' ? x.toString() : Array.isArray(x) ? x.map(decimal) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k,v])=>[k,decimal(v)])) : x;

/** Verify a manifest against an independently reviewed deployment pin.
 * Structural checks do not prove arbitrary scripts implement safe custody.
 */
export function validateC4Manifest(m, { expectedGenesis = RESET_TESTNET_GENESIS, expectedCommitment } = {}) {
  demand(typeof expectedCommitment === 'string' && /^[0-9a-f]{64}$/.test(expectedCommitment) && m?.commitment === expectedCommitment, 'An independently pinned pool commitment is required');
  demand(m?.schema === 'neurai-c4-xna-test-v1' && m.testOnly === true && m.profile === 'xna', 'Only experimental C4 XNA is supported');
  demand(/^[0-9a-f]{64}$/.test(expectedGenesis) && m.genesis === expectedGenesis, 'Unexpected chain genesis');
  demand(m.unit === '1' && m.registryRoot === '00'.repeat(32), 'XNA context must have unit one and no registry');
  demand(/^[A-Z0-9_]+#POOL$/.test(m.identity) && m.identity.length <= 30, 'Invalid UNIQUE identity');
  demand(/^[0-9a-f]{64}$/.test(m.issuance?.txid) && Number.isSafeInteger(m.issuance?.vout) && m.issuance.vout >= 0 && m.issuance.vout <= 0xffffffff, 'Pinned issuance outpoint required');
  const domain = sha256(cat(utf8('NIP043/instance/v3'), unhex(m.genesis).reverse(), unhex(m.issuance.txid).reverse(), le(m.issuance.vout, 4), variable(utf8(m.identity))));
  const assetId = sha256(cat(utf8('NeuraiPoolAsset/v2'), Uint8Array.of(0, 0)));
  demand(hex(domain) === m.domain && hex(assetId) === m.assetId, 'Wrong instance domain or native asset ID');
  demand(hex(c4Context({domain, assetId, unit: 1n})) === m.context, 'Context mismatch');
  demand(/^[0-9a-f]{64}$/.test(m.birth) && Number.isSafeInteger(m.birthHeight) && m.birthHeight > 0, 'Pinned birth required');
  demand(/^[0-9a-f]{64}$/.test(m.commitment) && /^[0-9a-f]{64}$/.test(m.reserveCommitment), 'Bad commitments');
  demand(C4_FORMS.every(f => m.forms?.[f]) && Object.keys(m.forms).length === 8, 'Eight circuit forms required');
  for (const f of C4_FORMS) {
    const entry = m.forms[f], script = unhex(entry.script), control = unhex(entry.control), vk = unhex(entry.vk);
    demand(script.length > 0 && script.length <= 10000 && control[0] === 1 && (control.length - 1) % 32 === 0, 'Invalid MAST leaf');
    let root = tagged('NeuraiAuthLeaf', cat(le(1, 1), variable(script)));
    for (let at = 1; at < control.length; at += 32) { const sibling = control.slice(at, at + 32); root = tagged('NeuraiAuthBranch', hex(root) < hex(sibling) ? cat(root, sibling) : cat(sibling, root)); }
    demand(hex(tagged('NeuraiAuthScript', cat(le(4, 1), le(0, 1), root))) === m.commitment, 'MAST commitment mismatch');
    demand(hex(sha256(vk)) === entry.vkHash && entry.script.includes(entry.vkHash), 'VK commitment mismatch');
    demand(entry.script.includes(m.context), 'Missing pinned context in leaf');
  }
  demand(hex(tagged('NeuraiAuthScript', cat(le(1, 1), le(0, 1), sha256(unhex(m.guard))))) === m.reserveCommitment, 'Reserve commitment mismatch');
  return m;
}
export function c4StateScript(m, digest) {
  const payload=cat(utf8('xnat'),variable(utf8(m.identity)),le(100000000,8),unhex('5420'),digest);
  return hex(cat(unhex('5120'+m.commitment+'c0'),push(payload),unhex('75')));
}
export function c4Path(slots, index) {
  let empty=new Uint8Array(32),layer=new Map(slots);const siblings=[];
  for(let d=0;d<32;d++) {
    siblings.push(decodeField(layer.get(index^1) ?? empty));
    layer=new Map([...new Set([...layer.keys()].map(i=>Math.floor(i/2)))].map(i=>[i,poolTreeNode(layer.get(i*2)??empty,layer.get(i*2+1)??empty)]));
    empty=poolTreeNode(empty,empty);index=Math.floor(index/2);
  }
  return siblings;
}
function insert(kind, entries, value) {
  const updated=poolIndexedInsert(kind,entries,value);
  const index=entries.size;
  let pred=-1, pv=-1n;
  for(const [i,e] of entries) if(e[0]<value && e[0]>pv){pred=i;pv=e[0];}
  const [predValue,predNextValue,predNextIndex]=entries.get(pred);
  const slots=new Map([...entries].map(([i,e])=>[i,poolIndexedLeaf(kind,...e)]));
  const predPath=c4Path(slots,pred);
  slots.set(pred,poolIndexedLeaf(kind,predValue,value,index));
  return [{predIndex:pred,predValue,predNextValue,predNextIndex,predPath,emptyPath:c4Path(slots,index)},updated];
}
function add(state,note) {
  const cm=noteCommitment(note),notePath=c4Path(state.slots,state.slots.size);
  const [fields,seen]=insert('cm',state.seen,decodeField(cm));state.seen=seen;
  state.slots.set(state.slots.size,cm);state.mode=1;return {notePath,...fields};
}
function spend(state,note,secret) {
  const cm=hex(noteCommitment(note));const noteIndex=[...state.slots].find(([,c])=>hex(c)===cm)?.[0];
  demand(noteIndex!==undefined,'Note is not in the confirmed pool');
  const nf=decodeField(noteNullifier(note,secret));const notePath=c4Path(state.slots,noteIndex);
  const [fields,nfs]=insert('nf',state.nfs,nf);state.nfs=nfs;
  return {noteIndex,notePath,nf,...fields};
}
function states(old,state) { return {oldState:Array.from(poolStateOpening(old)),newState:Array.from(poolStateOpening(state)),S_old:decodeField(poolStateDigest(old)),S_new:decodeField(poolStateDigest(state))}; }
export function c4Publication(form, created, nf) {
  return encodeC4Publication(form, {cms: created.map(x => x.cm), records: created.map(x => x.record), nf: form[0] === 'D' ? null : encodeField(nf)});
}
function coin(u) {
  demand(u && /^[0-9a-f]{64}$/.test(u.txid) && Number.isSafeInteger(u.vout) && u.vout>=0 && u.vout<=0xffffffff && transparent(u.scriptHex),'A confirmed Legacy/PQ/ECDSA XNA coin is required');
  demand(typeof u.valueSats==='string' && /^[1-9][0-9]*$/.test(u.valueSats),'Exact coin value required');return u;
}
/** Build the exact circuit witness and transaction template from locally recovered state. */
export function prepareC4({manifest,scan,form,created=[],consumed,secret,funding,sponsor,payout,feeAtomic,dustRelayFeePerKb='3000',expectedGenesis=RESET_TESTNET_GENESIS,expectedCommitment}) {
  const m=validateC4Manifest(manifest,{expectedGenesis,expectedCommitment});demand(C4_FORMS.includes(form),'Unknown form');
  const old=scan.state,state={slots:new Map(old.slots),seen:new Map(old.seen),nfs:new Map(old.nfs),mode:old.mode};
  const reserve=BigInt(scan.reserveAtomic);let nextReserve=reserve,amount=0n,data;
  demand((form==='D0')===(reserve===0n),'Pool state changed: rescan required');
  demand(form!=='D0'||old.mode===0,'Pool mode mismatch');
  for(const fresh of created) {
    demand(hex(noteCommitment(fresh.note))===hex(fresh.cm),'Note commitment mismatch');
    const p=decodeNote(fresh.note);demand(hex(p.domain)===m.domain&&hex(p.assetId)===m.assetId,'Note belongs to another domain');
  }
  if(form[0]==='D') {
    demand(created.length===1 && !consumed,'Invalid deposit notes');const x=created[0];amount=decodeNote(x.note).amountAtomic;
    data={...add(state,x.note),...states(old,state),note:Array.from(x.note),cm:decodeField(x.cm),amount,
      dep:decodeField(poseidonBytes(cat(utf8(NEURAI_POOL_HASH_LABELS.deposit),le(amount,8),x.cm))),
      wdr:decodeField(poseidonBytes(utf8(NEURAI_POOL_HASH_LABELS.withdrawal))),req:decodeField(poseidonBytes(utf8(NEURAI_POOL_HASH_LABELS.request)))};
    coin(funding);demand(BigInt(funding.valueSats)===amount,'Deposit input must match the note amount exactly');nextReserve+=amount;
  } else {
    demand(consumed?.note && !consumed.spent,'Select an unspent owned note');const note=typeof consumed.note==='string'?unhex(consumed.note):consumed.note;
    const parsed=decodeNote(note);demand(hex(parsed.domain)===m.domain&&hex(parsed.assetId)===m.assetId,'Consumed note domain mismatch');
    const spent=spend(state,note,secret);amount=parsed.amountAtomic;
    if(form[0]==='T') {
      demand(created.length===Number(form[1]) && created.reduce((sum,x)=>sum+decodeNote(x.note).amountAtomic,0n)===amount,'Transfer amounts must conserve the selected note');
      data={oldState:Array.from(poolStateOpening(old)),S_old:decodeField(poolStateDigest(old)),states:[Array.from(poolStateOpening(state))],sk:Array.from(secret),spentNote:Array.from(note),spentCm:decodeField(noteCommitment(note)),spentIndex:spent.noteIndex,spentPath:spent.notePath,nf:spent.nf,cms:[],notes:[],amounts:[],notePaths:[],predIndices:[],predValues:[],predNextValues:[],predNextIndices:[],predPaths:[],emptyPaths:[]};
      for(const k of ['predIndex','predValue','predNextValue','predNextIndex','predPath','emptyPath']) data['nf'+k[0].toUpperCase()+k.slice(1)]=spent[k];
      const mapping={notePath:'notePaths',predIndex:'predIndices',predValue:'predValues',predNextValue:'predNextValues',predNextIndex:'predNextIndices',predPath:'predPaths',emptyPath:'emptyPaths'};
      for(const fresh of created) {
        const fields=add(state,fresh.note);
        for(const [k,v] of Object.entries(fields)) data[mapping[k]].push(v);
        data.cms.push(decodeField(fresh.cm));data.notes.push(Array.from(fresh.note));data.amounts.push(decodeNote(fresh.note).amountAtomic);data.states.push(Array.from(poolStateOpening(state)));
      }
      data.S_new=decodeField(poolStateDigest(state));
    } else {
      demand(created.length===0 && transparent(payout),'Withdrawal requires a Legacy/PQ/ECDSA destination');nextReserve-=amount;
      demand(nextReserve>=0n && (form==='W_full')===(nextReserve===0n),'Wrong withdrawal form');if(form==='W_full')state.mode=0;
      data={...spent,...states(old,state),note:Array.from(note),sk:Array.from(secret),cm:decodeField(noteCommitment(note)),amount,reserve_in:reserve,reserve_out:nextReserve};
    }
  }
  demand(nextReserve<=2100000000000000000n,'Reserve exceeds money range');
  data.ctx=decodeField(unhex(m.context));data.D=Array.from(unhex(m.domain));data.AID=Array.from(unhex(m.assetId));data.unit=1n;data.registryRoot=Array(32).fill(0);
  let blob;
  if('DT'.includes(form[0])) {blob=c4Publication(form,created,data.nf);data.data_hash=decodeField(c4PublicationHash(form,blob));}
  coin(sponsor);demand(typeof feeAtomic==='string'&&/^[1-9][0-9]*$/.test(feeAtomic),'Exact positive fee required');const fee=BigInt(feeAtomic);
  demand(fee<=100000000n && BigInt(sponsor.valueSats)-fee>=c4DustAtomic(sponsor.scriptHex,dustRelayFeePerKb),'Fee must be at most 1 XNA and leave non-dust sponsor change');
  const inputs=[{txid:old.stateOutpoint[0],vout:0}];
  if(form!=='D0') {demand(old.reserveOutpoint?.[0]===old.stateOutpoint[0]&&old.reserveOutpoint[1]===1,'Noncanonical reserve');inputs.push({txid:old.reserveOutpoint[0],vout:1});}
  if(form[0]==='D')inputs.push(funding);inputs.push(sponsor);
  demand(new Set(inputs.map(x=>x.txid+':'+x.vout)).size===inputs.length,'Duplicate transaction input');
  const outputs=[{valueSats:0n,scriptHex:c4StateScript(m,encodeField(data.S_new))}];
  if(form!=='W_full') {
    demand(nextReserve>=c4DustAtomic('5120'+m.reserveCommitment,dustRelayFeePerKb),'Reserve output would be dust under the selected policy');
    outputs.push({valueSats:nextReserve,scriptHex:'5120'+m.reserveCommitment});
  }
  if(form[0]==='W') {
    demand(amount>=c4DustAtomic(payout,dustRelayFeePerKb),'Withdrawal would be dust under the selected policy');
    outputs.push({valueSats:amount,scriptHex:payout});
  }
  outputs.push({valueSats:BigInt(sponsor.valueSats)-fee,scriptHex:sponsor.scriptHex});
  const template=serializePoolTemplate({inputs,outputs});data.anchor=decodeField(template.anchor);
  const publics=[data.ctx,data.S_old,data.S_new];
  if(form[0]==='D')publics.push(data.dep,data.wdr,data.req,data.data_hash,data.anchor,amount);
  else if(form[0]==='T')publics.push(data.nf,data.data_hash,data.anchor,...created.map(x=>decodeField(x.cm)));
  else publics.push(data.nf,data.anchor,amount,reserve,nextReserve);
  return {state,form,inputs,outputs,template,input:decimal(data),publicSignals:publics.map(String),blob,nf:data.nf===undefined?undefined:encodeField(data.nf),feeAtomic,manifest:m};
}
const FP=21888242871839275222246405745257275088696311157297823662689037894645226208583n;
function g1(p) {const [x,y]=p.map(BigInt);demand(x>=0n&&x<FP&&y>=0n&&y<FP&&y*y%FP===(x*x%FP*x+3n)%FP,'Invalid G1 proof point');return le(x|(y>FP-y?1n<<255n:0n),32);}
function g2(p) {const [x,y]=p.map(q=>q.map(BigInt));demand([...x,...y].every(v=>v>=0n&&v<FP),'Invalid G2 coordinate');const n=y.map(v=>(FP-v)%FP);const sign=y[1]>n[1]||(y[1]===n[1]&&y[0]>n[0]);return cat(le(x[0],32),le(x[1]|(sign?1n<<255n:0n),32));}
/** Compress only after successful Groth16 verification against the pinned VK. */
export function c4ProofBytes(proof) {return cat(g1(proof.pi_a),g2(proof.pi_b),g1(proof.pi_c));}
export function finishC4(prepared,proof,publicSignals) {
  demand(JSON.stringify(publicSignals.map(String))===JSON.stringify(prepared.publicSignals),'Proof public inputs differ from the transaction');
  const {form,inputs,outputs,template,manifest:m}=prepared,entry=m.forms[form];
  const args=prepared.blob?[prepared.blob.slice(0,2048),prepared.blob.slice(2048)]:[prepared.nf];
  const own=[unhex('10'),c4ProofBytes(proof),unhex(entry.vk),...args,template.prevouts,unhex(entry.script),unhex(entry.control)];
  const witnesses=[own,...(form==='D0'?[]:[[unhex('00'),unhex(m.guard)]]),...(form[0]==='D'?[[]]:[]),[]];
  demand(witnesses.length===inputs.length,'Witness count mismatch');
  return hex(cat(le(3,4),unhex('0001'),compact(inputs.length),...inputs.map(x=>cat(unhex(x.txid).reverse(),le(x.vout,4),le(0,1),unhex('ffffffff'))),compact(outputs.length),template.outputs,le(0,1),...witnesses.map(w=>cat(compact(w.length),...w.map(variable))),le(0,4)));
}
