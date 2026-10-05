/* C6 TEST observation from a trusted, fully validating RPC node. This is not
 * SPV: the RPC is the chain authority. Deployment anchors/leaves come from the
 * application, never from the RPC. Rebuild on every changed tip (including
 * reorgs); an incomplete scan never releases a reservation. */
import { sha256 } from '@noble/hashes/sha2.js';
import { poseidonBytes } from './poseidon.js';
import { rpcAmountToSatoshis } from './amounts.js';
import { readSponsorTransaction } from './sponsor-sweep.js';
const hex = b => Array.from(b, n => n.toString(16).padStart(2, '0')).join('');
const unhex = s => Uint8Array.from(s.match(/../g) ?? [], n => parseInt(n, 16));
const hash = s => hex(sha256(new TextEncoder().encode(s)));
const point = i => `${i.txid}:${i.vout}`;
const HASH = /^[0-9a-f]{64}$/;
const FR = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const forms = ['D0', 'D1', 'T1', 'T2', 'T3', 'W_partial_no_change', 'W_partial_change', 'W_full_no_change', 'J2'];
function field(s) { if (!HASH.test(s) || BigInt('0x' + s) >= FR) throw Error('Noncanonical C6 field'); return s; }
function stateTemplate(s) {
  if (typeof s !== 'string' || !/^5120[0-9a-f]+75$/.test(s) || s.length < 140) throw Error('C6 state asset script required');
  return s.slice(0, -66); // Exact pinned transfer serialization except its 32-byte state message.
}
export function validateC6SponsorDeployment(d) {
  if (!d || !HASH.test(d.genesis) || !HASH.test(d.commitment) || !['xna','asset'].includes(d.kind) || !Number.isSafeInteger(d.anchor?.height) || d.anchor.height < 0 ||
      !HASH.test(d.anchor.hash) || !/^[0-9a-f]{64}:0$/.test(d.anchor.outpoint) || !/^[0-9a-f]{290}$/.test(d.anchor.opening) ||
      !Array.isArray(d.leaves) || !d.leaves.length || d.leaves.length > 64) throw Error('Pinned C6 deployment required');
  if (!d.anchor.script.startsWith('5120' + d.commitment) ||
      hex(poseidonBytes(unhex(d.anchor.opening))) !== d.anchor.script.slice(-66, -2)) throw Error('Pinned state opening mismatch');
  stateTemplate(d.anchor.script);
  const scripts = new Set();
  for (const l of d.leaves) {
    if (!forms.includes(l.form) || typeof l.script !== 'string' || !/^(?:[0-9a-f]{2})+$/.test(l.script) || l.script.length > 20000 ||
        scripts.has(l.script) || !Array.isArray(l.args) || new Set(l.args).size !== l.args.length ||
        l.args.some(a => typeof a !== 'string') || ['proof', 'vk', ...[0,1,2,3,4].map(i => 'tree'+i)].some(a => !l.args.includes(a))) throw Error('Pinned C6 leaf specification required');
    scripts.add(l.script);
  }
  return d;
}
function describe(tx, d) {
  const w = tx.inputs[0]?.witness;
  if (!w || w[0] !== '10') throw Error('C6 NoAuth MAST witness required');
  const leaf = d.leaves.find(l => l.script === w.at(-2));
  if (!leaf || w.length !== leaf.args.length + 3) throw Error('Unknown C6 leaf or witness shape');
  const args = Object.fromEntries(leaf.args.map((name, i) => [name, w[i+1]]));
  const transcript = [0,1,2,3,4].map(i => args['tree'+i]).join('');
  if (transcript.slice(0,4) !== (leaf.form==='J2'?'03':'02') + forms.indexOf(leaf.form).toString(16).padStart(2,'0') || transcript.length < 648 || transcript.length > 32768) throw Error('C6 transcript profile/form mismatch');
  const old = transcript.slice(4,294), next = transcript.slice(294,584);
  const nfs = leaf.form.startsWith('D') ? [] : [field(transcript.slice(584,648)), ...(leaf.form === 'J2' ? [field(transcript.slice(648,712))] : [])];
  if (nfs.some(s => /^0+$/.test(s)) || new Set(nfs).size !== nfs.length) throw Error('Invalid C6 nullifiers');
  // These args remain invariant when the public tree transition is relocated.
  const stable = Object.fromEntries(Object.entries(args).filter(([k]) => !/^tree[0-4]$/.test(k) && k !== 'prevouts').sort());
  const payout = leaf.form.startsWith('W') ? tx.outputs[leaf.form === 'W_full_no_change' ? 1 : d.kind === 'asset' ? 3 : 2] : null;
  const funding = leaf.form.startsWith('D') ? tx.inputs[d.kind==='asset'?(leaf.form==='D0'?1:3):tx.inputs.length-1] : null;
  const operation = leaf.form.startsWith('W') ? 'W' : leaf.form.startsWith('D') ? 'D' : leaf.form;
  return { old, next, nfs, operationId: hash(JSON.stringify(['NeuraiC6Intent/v1', d.genesis, d.commitment, operation, stable,
    payout ? [payout.valueAtomic, payout.script] : null, funding ? point(funding) : null])) };
}
/** Derive the public intent BEFORE signing. It does not contain sponsor data,
 * mutable tree paths, private witnesses or plaintext notes. */
export function c6SponsorIntent(raw, deployment) {
  const d = validateC6SponsorDeployment(deployment), tx = readSponsorTransaction(raw), parsed = describe(tx, d);
  if (tx.locktime || tx.refs.length || tx.inputs.some(i => i.sequence !== 0xffffffff)) throw Error('C6 transaction fixed fields changed');
  return { operationId: parsed.operationId, pool: d.commitment, nullifiers: parsed.nfs };
}
export async function scanC6SponsorChain({ rpc, snapshot, deployments, intents, signal, onProgress }) {
  const check = () => { if (signal?.aborted) throw Error('C6 scan cancelled'); };
  check();
  const activation=await rpc('getblockchaininfo');
  if(activation?.zk_portable_tree?.active_for_next_block!==true)throw Error('C6 portable public-tree verification is not active');
  if (await rpc('getblockhash',[0]) !== snapshot.genesis) throw Error('Sponsor scanner chain mismatch');
  const height = await rpc('getblockcount'), tipHash = await rpc('getblockhash',[height]);
  if (!Number.isSafeInteger(height) || height < 0 || !HASH.test(tipHash)) throw Error('Invalid chain tip');
  const contexts = deployments.map(d => ({ d:validateC6SponsorDeployment(d), point:d.anchor.outpoint, opening:d.anchor.opening, events:[] }));
  if (new Set(contexts.map(c => c.d.commitment)).size !== contexts.length || contexts.some(c => c.d.genesis !== snapshot.genesis)) throw Error('Ambiguous C6 pool deployments');
  let first = height;
  for (const c of contexts) {
    check();
    if (c.d.anchor.height > height || await rpc('getblockhash',[c.d.anchor.height]) !== c.d.anchor.hash) throw Error('Pinned pool anchor reorganized; restore an earlier deployment');
    const block = await rpc('getblock',[c.d.anchor.hash,2]);
    const tx = block.tx?.find(t => t.txid === c.d.anchor.outpoint.split(':')[0]);
    if (!tx || tx.vout?.[0]?.scriptPubKey?.hex !== c.d.anchor.script) throw Error('Pinned pool UTXO absent');
    first = Math.min(first, c.d.anchor.height + 1);
  }
  const offers = snapshot.operations.flatMap(o => o.sponsors.map(s => s.offer));
  const created = new Set(), spent = {}, pools = new Map(contexts.map(c => [c.d.commitment,c]));
  for (const op of snapshot.operations) {
    const intent = intents.find(i => i.operationId === op.operationId);
    if (!intent || !pools.has(intent.pool) || JSON.stringify([...intent.nullifiers].sort()) !== JSON.stringify(op.notes.map(n => n.nf).sort())) throw Error('Missing or inconsistent C6 intent metadata');
  }
  // Every historical sponsor is rooted in an actual active-chain funding tx.
  for (const offer of offers) {
    check(); const [id,vout] = offer.outpoint.split(':'), tx = await rpc('getrawtransaction',[id,true]);
    if (tx.txid !== id || !(tx.confirmations > 0) || !tx.blockhash) throw Error('Sponsor funding missing or reorganized');
    const header = await rpc('getblockheader',[tx.blockhash]);
    if (await rpc('getblockhash',[header.height]) !== tx.blockhash) throw Error('Sponsor funding not in active chain');
    const block = await rpc('getblock',[tx.blockhash,2]), actual = block.tx?.find(t=>t.txid===id)?.vout?.[Number(vout)];
    if (!actual || actual.scriptPubKey?.hex !== offer.inputScript || String(rpcAmountToSatoshis(actual.value)) !== offer.inputAtomic) throw Error('Sponsor funding binding mismatch');
    created.add(offer.outpoint); first = Math.min(first,header.height);
  }
  const tracked = new Set(offers.map(o => o.outpoint));
  let previous = first > 0 ? await rpc('getblockhash',[first-1]) : null;
  for (let h=first;h<=height;h++) {
    check(); const id=await rpc('getblockhash',[h]), block=await rpc('getblock',[id,2]);
    if (block.hash !== id || block.height !== h || (h>0 && block.previousblockhash !== previous) || !Array.isArray(block.tx)) throw Error('Incomplete active-chain block scan');
    for (const tx of block.tx) {
      for (const i of tx.vin ?? []) if (tracked.has(point(i))) { if(spent[point(i)]) throw Error('Duplicate confirmed sponsor spend'); spent[point(i)] = tx.txid; }
      for (const c of contexts) {
        if (h <= c.d.anchor.height || !tx.vin?.some(i=>point(i)===c.point)) continue;
        if (point(tx.vin[0]) !== c.point) throw Error('Pool state spent outside input zero');
        const raw = await rpc('getrawtransaction',[tx.txid,false]);
        const parsedTx = readSponsorTransaction(raw), parsed = describe(parsedTx,c.d);
        if (parsedTx.txid !== tx.txid || point(parsedTx.inputs[0]) !== c.point || parsed.old !== c.opening || stateTemplate(parsedTx.outputs[0]?.script) !== stateTemplate(c.d.anchor.script) ||
            hex(poseidonBytes(unhex(parsed.next))) !== parsedTx.outputs[0].script.slice(-66,-2)) throw Error('C6 state chain discontinuity');
        c.events.push({ txid:tx.txid, ...parsed }); c.point=tx.txid+':0'; c.opening=parsed.next;
      }
    }
    previous=id; onProgress?.({height:h,target:height});
  }
  for (const offer of offers) {
    check(); const [id,vout]=offer.outpoint.split(':'), coin=await rpc('gettxout',[id,Number(vout),false]);
    if (!created.has(offer.outpoint) || (spent[offer.outpoint] ? coin !== null : !coin || coin.confirmations<1 || coin.scriptPubKey?.hex !== offer.inputScript || String(rpcAmountToSatoshis(coin.value))!==offer.inputAtomic)) throw Error('Unresolved sponsor spend; scan incomplete');
  }
  const operations=snapshot.operations.map(op=>{
    const intent=intents.find(i=>i.operationId===op.operationId), events=pools.get(intent.pool).events;
    const matching=events.filter(e=>e.operationId===op.operationId);
    if(matching.length>1)throw Error('Duplicate confirmed private intent');
    const used=op.notes.map(n=>n.nf).filter(nf=>events.some(e=>e.nfs.includes(nf)));
    return {operationId:op.operationId,txid:matching[0]?.txid??null,spentNullifiers:used};
  });
  check(); if(await rpc('getbestblockhash')!==tipHash || await rpc('getblockhash',[height])!==tipHash)throw Error('Chain changed during C6 scan; retry');
  return {expectedRevision:snapshot.revision,genesis:snapshot.genesis,tip:{height,hash:tipHash},confirmedSpends:spent,operations};
}

