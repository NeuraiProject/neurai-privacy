import {sha256} from '@noble/hashes/sha2.js';
import {poseidonBytes} from './poseidon.js';
import {c6AssetMetadata,c6ReadAssetTransfer} from './c6-assets.js';
/* C6 XNA TEST proving worker. Secrets and recovered paths never leave this scope.
 * Public relocation runs here. The host stores only an encrypted CAS journal
 * and signs transparent funding inputs locally with SIGHASH_ALL.
 */
import { BrowserTestIdentity } from './browser-wallet.js';
import { ZkWalletIdentity, parseRecipient } from './zk-wallet.js';
import { C6PrivateJournal } from './c6-private-journal.js';
import { buildC6Transaction,c6Outpoint,readC6Packet } from './c6-transaction.js';
import { readSponsorTransaction } from './sponsor-sweep.js';
import { c6SponsorIntent } from './c6-sponsor-chain.js';
import { c4ProofBytes } from './c4.js';
import { rpcAmountToSatoshis } from './amounts.js';
import { createC6JoinWallet } from './c6-join.js';
import { scanC6Pool } from './c6-scan.js';
import { createC6OperationWallet } from './c6-operations.js';
import { validateC6SponsorDeployment } from './c6-sponsor-chain.js';
import { describeReceiving, loadVerifiedArtifact, MAX_ARTIFACT_BYTES } from './pool-operations.js';
const hex = b => Array.from(b, v => v.toString(16).padStart(2, '0')).join('');
function unhex(value, length) {
  if (typeof value !== 'string' || !/^(?:[0-9a-f]{2})+$/.test(value) || (length !== undefined && value.length !== length * 2)) throw Error('C6 worker: canonical hex required');
  return Uint8Array.from(value.match(/../g), v => parseInt(v, 16));
}
const READ_RPC = new Set(['getblockchaininfo', 'getblockhash', 'getblockcount', 'getbestblockhash', 'getblock', 'getrawtransaction','gettxout','getspentinfo']);
const money = value => {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) throw Error('C6 worker: exact atomic amount required');
  return BigInt(value);
};

/** Explicit application-reviewed configuration only. No default instance or
 * fetched deployment is trusted. Pass reservations from the durable journal;
 * losing this journal can expose a note to multiple outstanding payments.
 */
export function startC6PoolWorker({scope=globalThis, snarkjs, manifest, deployment, domain, assetId,
  network='testnet', expectedGenesis, expectedCommitment, artifacts, fetchArtifact,
  artifactBaseUrl, reservations, maxArtifactBytes=MAX_ARTIFACT_BYTES, singleThread=true, buildTransactions=false, durableJournal=false}={}) {
  // The RPC genesis uses display order; wire packet pins use internal order.
  const pinned=validateC6SponsorDeployment(structuredClone(deployment));
  manifest=structuredClone(manifest); artifacts=structuredClone(artifacts);
  if (!['xna','asset'].includes(pinned.kind) || hex(unhex(pinned.genesis,32).reverse())!==expectedGenesis || pinned.commitment!==expectedCommitment || manifest?.network!==expectedGenesis || manifest?.commitment!==expectedCommitment || manifest?.profile!==(pinned.kind==='asset'?'C6-ORDINARY-ASSET-TEST-J2-v1':'C6-XNA-TEST-J2-v2')) throw Error('C6 worker: pinned instance mismatch');
  const kind=pinned.kind;
  if(kind==='asset'){const meta=c6AssetMetadata(manifest);if(pinned.asset!==meta.name||String(pinned.unit)!==String(meta.unit))throw Error('C6 asset deployment metadata mismatch');if(!durableJournal||!buildTransactions)throw Error('Assets require durable private and sponsor journals');}
  unhex(domain,32);unhex(assetId,32);
  if(network!=='testnet'&&network!=='regtest')throw Error('C6 worker: TEST networks only');
  if (!Array.isArray(reservations)) throw Error('C6 worker: durable journal reservations required');
  reservations=structuredClone(reservations);
  for(const r of reservations){unhex(r.cm,32);unhex(r.nf,32);}
  if (!artifacts?.files || !artifacts?.forms || (!fetchArtifact&&!artifactBaseUrl)) throw Error('C6 worker: pinned artifacts required');
  if (!Number.isSafeInteger(maxArtifactBytes)||maxArtifactBytes<=0||maxArtifactBytes>256*1048576) throw Error('C6 worker: artifact limit');
  for(const op of ['D','T1','T2','T3','W',...(durableJournal?['J2']:[])]) {
    const form=artifacts.forms[op];
    if(!form)throw Error('C6 worker: missing artifacts for '+op);
    for(const path of [form.wasm,form.zkey,form.vk]) {
      const meta=artifacts.files[path];
      if(typeof path!=='string'||!meta||!Number.isSafeInteger(meta.bytes)||meta.bytes<=0||meta.bytes>maxArtifactBytes||!/^[0-9a-f]{64}$/.test(meta.sha256))throw Error('C6 worker: invalid artifact pin');
    }
  }
  if(durableJournal&&!buildTransactions)throw Error("C6 durable worker requires transaction construction");
  const joinWallet=createC6JoinWallet({expectedGenesis,expectedCommitment,kind});
  const wallet=createC6OperationWallet({expectedGenesis,expectedCommitment,kind});
  const pool={network,domain,assetId},fetcher=fetchArtifact??(path=>fetch(new URL(path,artifactBaseUrl)));
  let journal=null,scanIssued=null;
  let identity=null,scan=null,busy=false,stopped=false,epoch=0,rpcId=0,controller=null;
  const calls=new Map(),post=m=>{if(!stopped)scope.postMessage(m);};
  function live(token){if(stopped||token!==epoch||controller?.signal.aborted)throw Error('C6 worker: cancelled/locked');}
  function rpc(method,params=[],token=epoch){
    live(token);if(!READ_RPC.has(method))throw Error('C6 worker: read-only RPC required');
    return new Promise((resolve,reject)=>{const id=++rpcId;calls.set(id,{resolve,reject,token});post({type:'rpc',id,method,params});});
  }
  function storage(type,key,extra={},token=epoch){
    live(token);return new Promise((resolve,reject)=>{const id=++rpcId;calls.set(id,{resolve,reject,token});post({type,id,key,...extra});});
  }
  function journalSummary(){if(journal?.value)post({type:'journal',operations:journal.summaries()});}
  async function openJournal(data,token){
    if(!identity||!durableJournal)throw Error('C6 durable identity required');
    const next=new C6PrivateJournal({identity,genesis:expectedGenesis,commitment:expectedCommitment,packetOptions:{kind,manifest},
      read:key=>storage('journal-read',key,{},token),compareAndSwap:(key,expected,replacement)=>storage('journal-write',key,{expected,replacement},token),assertLive:()=>live(token)});
    await next.open({create:!!data.create,backup:data.backup?.cipher});live(token);journal=next;
    if(identity instanceof ZkWalletIdentity&&journal.value.issued>1)identity.setIssued(journal.value.issued);
    reservations=journal.reservations();journalSummary();
  }
  const receiving=()=>describeReceiving(identity,scan,{network});
  function cancel(){epoch++;controller?.abort();identity?.lock();identity=null;scan=null;journal=null;for(const c of calls.values())c.reject(Error('C6 worker: cancelled/locked'));calls.clear();}
  async function unchangedScan(token){
    if(!scan||scanIssued!==(identity.issued??null))return null;
    // The most recent publication must already have matured under the snapshot.
    // Otherwise another block can change spendability without spending the state.
    if(scan.records.some(r=>scan.tip.height-r.height+1<2))return null;
    const info=await rpc('getblockchaininfo',[],token);
    if(info?.zk_portable_tree?.active_for_next_block!==true)return null;
    const height=await rpc('getblockcount',[],token);
    if(!Number.isSafeInteger(height)||height<scan.tip.height)return null;
    if(await rpc('getblockhash',[scan.tip.height],token)!==scan.tip.hash)return null;
    const hash=await rpc('getblockhash',[height],token);
    if(typeof hash!=='string'||!/^[0-9a-f]{64}$/.test(hash))return null;
    for(const point of [scan.statePoint,scan.reservePoint].filter(Boolean)){
      const [txid,index]=point.split(':');const coin=await rpc('gettxout',[txid,Number(index),false],token);
      const expected=point===scan.statePoint?pinned.anchor.script.slice(0,-66)+hex(poseidonBytes(unhex(scan.opening)))+'75':scan.reserveScript;
      if(!coin||coin.confirmations<1||coin.scriptPubKey?.hex!==expected)return null;
      if(point===scan.reservePoint&&kind==='xna'&&String(rpcAmountToSatoshis(coin.value))!==scan.reserveAtomic)return null;
    }
    if(await rpc('getblockhash',[height],token)!==hash)return null;
    live(token);return {...scan,tip:{height,hash}};
  }
  async function refresh(token){
    if(durableJournal&&journal){await journal.reload();reservations=journal.reservations();}
    post({type:'stage',message:'Reading confirmed C6 pool history'});
    let reused=null;try{reused=await unchangedScan(token);}catch{live(token);/* A failed cache check falls back to complete validation. */}
    const recovered=reused??await scanC6Pool({rpc:(m,p)=>rpc(m,p,token),deployment:pinned,identity,reserved:reservations,
      checkpointStore:durableJournal?{read:key=>storage('journal-read',key,{},token),compareAndSwap:(key,expected,replacement)=>storage('journal-write',key,{expected,replacement},token)}:undefined,
      signal:controller.signal,onProgress:p=>{live(token);post({type:'stage',message:p.phase==='checkpoint'?`Resumed saved C6 state through block ${p.height}; checking snapshot ${p.target}`:p.phase==='resuming'?`Replaying saved pool operations through block ${p.height}`:p.phase==='recovering'?'Recovering private notes on this device':p.phase==='verifying'?'Checking the scanned chain':p.phase==='complete'?`C6 synchronized through block ${p.height}`:p.strategy==='spent-index'?`Checking pool operation at block ${p.height} (chain snapshot ${p.target})`:`Reading C6 block ${p.height} / ${p.target}`});}});
    live(token);scan=recovered;scanIssued=identity.issued??null;
    post({type:'stage',message:'Updating encrypted operation history'});
    if(durableJournal&&journal){await journal.reconcile(scan);reservations=journal.reservations();const reserved=new Set(reservations.map(r=>r.cm));for(const n of scan.notes){n.reserved=reserved.has(hex(n.cm));n.spendable=!n.reserved&&!!n.root;}scan.spendableAtomic=String(scan.notes.filter(n=>n.spendable).reduce((v,n)=>v+BigInt(n.amountAtomic),0n));journalSummary();}
    const heldCms=new Set(reservations.map(r=>r.cm)),heldNfs=new Set(reservations.map(r=>r.nf));
    for(const n of scan.notes){n.reserved=heldCms.has(hex(n.cm))||heldNfs.has(hex(n.nf));n.spendable=!n.reserved&&!!n.root;}
    scan.spendableAtomic=String(scan.notes.filter(n=>n.spendable).reduce((v,n)=>v+BigInt(n.amountAtomic),0n));
    // Read-only recovery is possible without the pending-operation journal.
    // Never offer spendable notes until reservations can be reconciled safely.
    if(durableJournal&&!journal){for(const n of scan.notes){n.reserved=true;n.spendable=false;}scan.spendableAtomic='0';}
    // Do not send records, plaintext notes, paths or nullifiers with balances.
    post({type:'scan',result:{historyReady:!durableJournal||!!journal,tip:scan.tip,statePoint:scan.statePoint,reserveAtomic:scan.reserveAtomic,balanceAtomic:scan.balanceAtomic,spendableAtomic:scan.spendableAtomic,
      notes:scan.notes.map(n=>({cm:hex(n.cm),amountAtomic:n.amountAtomic,spendable:n.spendable,reserved:n.reserved}))},addresses:receiving()});
  }
  async function load(path,token){
    const result=await loadVerifiedArtifact({path,artifacts,fetchArtifact:fetcher,maxBytes:maxArtifactBytes,
      onProgress:percent=>{live(token);post({type:'stage',message:`Loading ${path} · ${percent}%`});}});
    live(token);return result;
  }
  async function prepare(data,token){
    if(!identity)throw Error('C6 worker: unlock first');if(durableJournal&&!journal)throw Error('C6 operation history required before preparing; restore or explicitly create it');if(!snarkjs)throw Error('C6 worker: snarkjs required');
    await refresh(token);
    const options={manifest,fee:kind==='asset'?'0':data.fee};let plan;
    if(data.action==='join'){
      if(!Array.isArray(data.notes)||data.notes.length!==2||data.notes[0]===data.notes[1])throw Error("Two distinct notes required");
      const consumed=data.notes.map(cm=>scan.notes.find(n=>hex(n.cm)===cm&&n.spendable));
      if(consumed.some(n=>!n)||hex(consumed[0].root)!==hex(consumed[1].root))throw Error("Two mature owned notes under one root required");
      plan=identity.prepareC6Join(joinWallet,{...options,consumed});plan.operation="J2";
    }else
    if(data.action==='deposit') {
      plan=identity.prepareC6Deposit(wallet,{...options,amountAtomic:data.amountAtomic,funding:unhex(data.funding,36),fundingValue:data.fundingValue,
        ...(data.recipient===undefined?{}:{recipient:parseRecipient(data.recipient,pool)})});
    }else{
      const consumed=scan.notes.find(n=>hex(n.cm)===data.note&&n.spendable);
      if(!consumed)throw Error('C6 worker: selected note is unavailable, immature or reserved');
      if(data.action==='withdraw')plan=identity.prepareC6Withdrawal(wallet,{...options,consumed,amountAtomic:data.amountAtomic,payoutScript:unhex(data.payoutScript)});
      else if(data.action==='transfer') {
        if(!Array.isArray(data.recipients)||data.recipients.length<1||data.recipients.length>3)throw Error('C6 worker: one to three recipients required');
        const outputs=data.recipients.map(r=>({amountAtomic:r.amountAtomic,recipient:parseRecipient(r.recipient,pool)}));
        const remainder=money(consumed.amountAtomic)-money(options.fee)-outputs.reduce((n,o)=>n+money(o.amountAtomic),0n);
        if(remainder<0n)throw Error('C6 worker: insufficient selected note');
        if(remainder>0n)outputs.push({amountAtomic:String(remainder),isChange:true});
        if(outputs.length>3)throw Error('C6 worker: maximum three outputs including change');
        plan=identity.prepareC6Transfer(wallet,{...options,consumed,operation:'T'+outputs.length,outputs});
      }else throw Error('C6 worker: unsupported action');
    }
    live(token);if(!artifacts.forms[plan.operation])throw Error("C6 missing operation parameters");
    let operationId;
    if(durableJournal)operationId=await journal.reserve({action:data.action,resources:plan.resources,funding:data.action==='deposit'?data.fundingPoint:undefined});
    live(token);const form=artifacts.forms[plan.operation];
    const wasm=await load(form.wasm,token),zkey=await load(form.zkey,token),vk=JSON.parse(new TextDecoder().decode(await load(form.vk,token)));
    const result=await (data.action==='join'?joinWallet:wallet).prove(plan,{api:snarkjs,wasm,zkey,vk,signal:controller.signal,stage:message=>{live(token);post({type:'stage',message});}});
    live(token);
    // Publishing this packet creates exposure, even if a service later drops
    // it. Keep the consumed note reserved until a confirmed competing spend.
    if(buildTransactions){
      // Proof generation may take minutes. Rescan without exposing the packet
      // and relocate against the current confirmed state before persisting it.
      await refresh(token);
      result.transaction=buildC6Transaction({packet:result.packet,scan,manifest,deployment:pinned,funding:await fundingCoin(data.fundingPoint,result.packet,token),sponsor:await sponsorCoin(data,token)});
    }
    if(durableJournal){await journal.prepared(operationId,result);journalSummary();}else reservations.push(...plan.resources);
    post({type:'prepared',result:{...result,operationId,...(!durableJournal?{resources:structuredClone(plan.resources)}:{}),...(kind==='asset'?{sponsorNotes:sponsorNotes(result.packet)}:{}),requiresDurableJournal:true}});
  }
  async function fundingCoin(point,packet,token){
    const p=readC6Packet(packet,{kind,manifest});if(p.operation!=='D')return undefined;
    const chosen=point??(hex(p.funding.slice(0,32).reverse())+':'+new DataView(p.funding.buffer,p.funding.byteOffset+32,4).getUint32(0,true));
    const [txid,index]=chosen.split(':');
    if(hex(c6Outpoint(chosen))!==hex(p.funding))throw Error('C6 funding point mismatch');
    const coin=await rpc('gettxout',[txid,Number(index),true],token);live(token);
    if(!coin||coin.confirmations<1)throw Error('C6 confirmed funding coin unavailable');
    return {point:chosen,valueAtomic:String(rpcAmountToSatoshis(coin.value)),script:coin.scriptPubKey.hex};
  }
  async function rebuild(id,token,data={}){
    if(!journal)throw Error('C6 journal must be open');await refresh(token);
    const op=journal.operation(id),packet=unhex(op.packet),p=readC6Packet(packet,{kind,manifest}),form=artifacts.forms[p.operation];
    const vk=JSON.parse(new TextDecoder().decode(await load(form.vk,token)));
    if(JSON.stringify(op.publicSignals)!==JSON.stringify(p.publics.map(b=>String(BigInt('0x'+hex(b)))))||!await snarkjs.groth16.verify(vk,op.publicSignals,op.proof)||hex(c4ProofBytes(op.proof))!==hex(p.proof))throw Error('C6 stored proof mismatch');
    live(token);const transaction=buildC6Transaction({packet,scan,manifest,deployment:pinned,funding:await fundingCoin(op.funding,packet,token),sponsor:await sponsorCoin(data,token)});
    await journal.edit(v=>{const o=v.operations.find(o=>o.id===id);o.transaction=transaction;delete o.signed;});live(token);
    journalSummary();post({type:'prepared',result:{operationId:id,packet,packetId:op.packetId,transaction,...(kind==='asset'?{sponsorNotes:sponsorNotes(packet)}:{}),requiresDurableJournal:true}});
  }
  function sponsorNotes(packet){return readC6Packet(packet,{kind,manifest}).nfs.map(nf=>({nf:hex(nf),cm:hex(sha256(new Uint8Array([...new TextEncoder().encode('NeuraiC6SponsorResource\x01'),...nf])))}));}
  async function sponsorCoin(data,token){
    if(kind!=='asset')return undefined;
    const point=data.sponsorPoint;c6Outpoint(point);const [txid,index]=point.split(':');
    const coin=await rpc('gettxout',[txid,Number(index),true],token);live(token);
    if(!coin||coin.confirmations<1)throw Error('C6 confirmed sponsor coin unavailable');
    return {point,valueAtomic:String(rpcAmountToSatoshis(coin.value)),script:coin.scriptPubKey.hex,changeScript:coin.scriptPubKey.hex,feeAtomic:data.sponsorFee};
  }
  async function recordSigned(data,token){
    if(!journal)throw Error('C6 journal must be open');await journal.reload();const op=journal.operation(data.id);
    const original=readSponsorTransaction(op.transaction.raw),signed=readSponsorTransaction(data.raw),i=op.transaction.funding?.index;
    const shape=t=>JSON.stringify({version:t.version,locktime:t.locktime,outputs:t.outputs,refs:t.refs,inputs:t.inputs.map((n,index)=>({...n,...(index===i?{scriptSig:'',witness:[]}:{} )}))});
    if(shape(original)!==shape(signed)||c6SponsorIntent(data.raw,pinned).operationId!==op.transaction.intent.operationId)throw Error('C6 signed transaction changed private intent');
    if(i!==undefined){
      const input=signed.inputs[i],script=op.transaction.funding.script;
      if(script.startsWith('76a914')){
        const b=unhex(input.scriptSig),n=b[0];if(n<9||n>73||b.length<n+2||b[n]!==1||input.witness.length)throw Error('C6 funding must use SIGHASH_ALL');
      }else{const signature=input.witness[1];if(!signature||!signature.endsWith('01')||!['01','02'].includes(input.witness[0]))throw Error('C6 funding must use SIGHASH_ALL');}
    }else if(data.raw!==op.transaction.raw)throw Error('C6 spend needs no transparent signature');
    await journal.edit(v=>{v.operations.find(o=>o.id===data.id).signed={raw:data.raw,txid:signed.txid};});live(token);
    post({type:'signed',result:{operationId:data.id,raw:data.raw,txid:signed.txid,inputPoints:op.transaction.inputPoints}});journalSummary();
  }
  scope.onmessage=async({data})=>{
    if(stopped)return;
    if(data?.type==='rpc-result'||data?.type==='journal-result') {
      const c=calls.get(data.id);if(!c)return;calls.delete(data.id);
      if(c.token!==epoch)c.reject(Error('C6 worker: stale RPC'));
      else data.error!==undefined&&data.error!==null?c.reject(Error(String(data.error)||'C6 host request failed')):c.resolve(data.result);
      return;
    }
    if(data?.type==='lock'){cancel();post({type:'done'});return;}
    if(busy){post({type:'error',message:'C6 worker: another operation is running'});return;}
    busy=true;controller=new AbortController();const token=epoch;
    try{
      data=structuredClone(data);
      if(singleThread){Object.defineProperty(scope.navigator??{},'hardwareConcurrency',{value:1,configurable:true});scope.Worker=undefined;}
      if(data.type==='create'||data.type==='restore'||data.type==='derive') {
        identity?.lock();identity=null;scan=null;journal=null;
        let next;
        if(data.type==='derive')next=await ZkWalletIdentity.fromMnemonic({...pool,mnemonic:data.mnemonic,passphrase:data.passphrase??'',family:data.family,
          zkPassphrase:data.zkPassphrase??'',account:data.account,gap:data.gap,issued:data.issued});
        else next=data.type==='create'?await BrowserTestIdentity.create({...pool,password:data.password})
          :await BrowserTestIdentity.fromBackup({...pool,password:data.password,backup:data.backup});
        try{live(token);}catch(e){next.lock();throw e;}identity=next;
        post({type:'identity',recipient:identity.recipient(),backup:identity.backupJson(),addresses:receiving()});
      }else if(data.type==='journal-open'){await openJournal(data,token);}
      else if(data.type==='journal-backup'){if(!journal)throw Error('C6 journal required');post({type:'backup',result:{...journal.backup(),identityBackup:identity.backupJson()}});}
      else if(data.type==='rebuild'){await rebuild(data.id,token,data);}
      else if(data.type==='record-signed'){await recordSigned(data,token);}
      else if(data.type==='record-broadcast'){if(!journal)throw Error('C6 journal required');await journal.edit(v=>{const o=v.operations.find(o=>o.id===data.id);if(!o?.signed||o.outcome)throw Error('C6 signed operation required');o.attempts.push({txid:o.signed.txid,raw:o.signed.raw});});journalSummary();}
      else if(data.type==='release-draft'){if(!journal)throw Error('C6 journal required');await journal.releaseDraft(data.id);journalSummary();}
      else if(data.type==='scan') {if(!identity)throw Error('C6 worker: unlock first');await refresh(token);}
      else if(data.type==='prepare')await prepare(data,token);
      else if(data.type==='new-address') {
        if(!(identity instanceof ZkWalletIdentity))throw Error('C6 worker: derived wallet required');
        if(durableJournal&&!journal)throw Error('C6 journal required');
        identity.issueNext({force:!!data.force});if(durableJournal){if(!journal)throw Error('C6 journal required');await journal.edit(v=>{v.issued=identity.issued;});}post({type:'addresses',recipient:identity.recipient(),addresses:receiving()});
      }else throw Error('C6 worker: unknown request');
      live(token);post({type:'done'});
    }catch(e){if(!stopped&&token===epoch)post({type:'error',message:e instanceof Error?e.message:String(e)});}
    finally{busy=false;controller=null;}
  };
  return {stop(){cancel();stopped=true;scope.onmessage=null;}};
}
