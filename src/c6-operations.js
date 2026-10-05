/** Local profile-3 XNA TEST D/T/W construction. No RPC or public relocation.
 * Prepared objects contain private witnesses and belong in a dedicated worker.
 */
import {c6AssetMetadata,c6AssetTransferScript} from './c6-assets.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { decodeNote, encodeNote, noteCommitment, noteNullifier } from './notes.js';
import { sealNote } from './hpke.js';
import { decodeField, encodeField, poseidonBytes, poseidonPermutation } from './poseidon.js';
import { c4Context, encodeC4Publication, c4PublicationHash } from './c4-publication.js';

const OPS = ['D', 'T1', 'T2', 'T3', 'W'];
const MAX_MONEY = 2100000000000000000n;
const QUANTUM = 10000000000n;
const EMPTY_W_DATA = '04bf938a28af8bc7ab2810e0adf3cbbb55aa4feb79827feed2722c5123baac15';
const utf8 = s => new TextEncoder().encode(s);
const hex = b => Array.from(b, v => v.toString(16).padStart(2, '0')).join('');
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
function require(ok, reason) { if (!ok) throw new Error('C6: ' + reason); }
function bytes(value, length, label) {
  require(value instanceof Uint8Array && value.length === length, label + ' length');
  return value;
}
function unhex(value, length) {
  require(typeof value === 'string' && /^[0-9a-f]*$/.test(value) && value.length === length * 2, 'canonical hex');
  return Uint8Array.from(value.match(/../g) ?? [], v => parseInt(v, 16));
}
function concat(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) { out.set(p, offset); offset += p.length; }
  return out;
}
function le(value, length) {
  let n = BigInt(value); require(n >= 0n, 'unsigned integer');
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++, n >>= 8n) out[i] = Number(n & 255n);
  require(n === 0n, 'integer overflow'); return out;
}
function money(value, zero = false) {
  require(typeof value === 'bigint' || (typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value)), 'exact atomic amount required');
  const n = BigInt(value);
  require(n >= (zero ? 0n : 1n) && n <= MAX_MONEY, 'money range'); return n;
}
function decimal(value) {
  if (typeof value === 'bigint') return String(value);
  if (Array.isArray(value)) return value.map(decimal);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decimal(v)]));
  return value;
}
function destination(script) {
  require(script instanceof Uint8Array && (
    (script.length === 25 && hex(script.slice(0, 3)) === '76a914' && hex(script.slice(-2)) === '88ac') ||
    (script.length === 34 && [0x52, 0x53].includes(script[0]) && script[1] === 0x20)), 'payout must be Legacy or strict PQ/ECDSA');
  return script;
}
function member(cm, index, path) {
  require(Number.isInteger(index) && index >= 0 && index <= 0xffffffff && Array.isArray(path) && path.length === 32, 'Merkle shape');
  let value = decodeField(cm), at = BigInt(index);
  for (const sibling of path) {
    const other = decodeField(bytes(sibling, 32, 'sibling'));
    value = poseidonPermutation(at & 1n ? [0n, other, value] : [0n, value, other])[0]; at >>= 1n;
  }
  return encodeField(value);
}
function descriptor(note) {
  return { domain: hex(note.domain), asset_id: hex(note.assetId), owner: hex(note.owner), view_pub: hex(note.viewPub) };
}
function seal(recipient, amount, domain, assetId) {
  require(recipient && recipient.domain === hex(domain) && recipient.asset_id === hex(assetId), 'recipient instance');
  return sealNote({ descriptor: recipient, amountAtomic: amount });
}
function compress(proof) {
  const fp = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
  const g1 = p => {
    const x = BigInt(p[0]), y = BigInt(p[1]);
    require(x >= 0n && x < fp && y > 0n && y < fp && (y*y-x*x*x-3n) % fp === 0n, 'G1 encoding');
    return le(x | ((y > fp-y ? 1n : 0n) << 255n), 32);
  };
  const g2 = p => {
    const x = p[0].map(BigInt), y = p[1].map(BigInt), neg = y.map(v => (fp-v) % fp);
    require(x.length === 2 && y.length === 2 && [...x, ...y].every(v => v >= 0n && v < fp), 'G2 encoding');
    const sign = y[1] > neg[1] || (y[1] === neg[1] && y[0] > neg[0]);
    return concat(le(x[0], 32), le(x[1] | ((sign ? 1n : 0n) << 255n), 32));
  };
  return concat(g1(proof.pi_a), g2(proof.pi_b), g1(proof.pi_c));
}

/** Supply instance pins independently of the retrieved manifest. The caller
 * independently pins the proving artifacts and verifies the full contract.
 */
export function createC6OperationWallet({ expectedGenesis, expectedCommitment, kind = 'xna' } = {}) {
  if(!['xna','asset'].includes(kind))throw Error('Unsupported C6 custody kind');
  const network = unhex(expectedGenesis, 32), pool = unhex(expectedCommitment, 32);
  const intents = new WeakMap();
  const fingerprint = p => hex(sha256(utf8(JSON.stringify(p))));
  function context(request, op) {
    const { manifest } = request;
    require(manifest?.profile === (kind==='asset'?'C6-ORDINARY-ASSET-TEST-J2-v1':'C6-XNA-TEST-J2-v2'), 'unsupported manifest profile');
    require(manifest.network === expectedGenesis && manifest.commitment === expectedCommitment, 'manifest differs from pinned instance');
    const D = bytes(request.domain, 32, 'domain'), AID = bytes(request.assetId, 32, 'asset');
    const unit=kind==='asset'?c6AssetMetadata(manifest).unit:1n;
    const ctx = c4Context({ domain: D, assetId: AID, unit });
    require(hex(ctx) === manifest.context && decodeField(ctx) !== 0n, 'domain/asset context mismatch');
    const fee = money(request.fee, true), levels = manifest.fees?.[op];
    require(Array.isArray(levels) && levels.length > 0, 'missing operation fee levels');
    const approved = levels.map(v => {
      if (typeof v === 'number') require(Number.isSafeInteger(v) && v >= 0, 'unsafe manifest fee');
      return money(typeof v === 'number' ? String(v) : v, true);
    });
    require(approved.includes(fee)&& (kind!=='asset'||fee===0n), 'unapproved fee');
    return { D, AID, ctx, fee, unit, quantum:kind==='asset'?unit:QUANTUM, asset:manifest.asset, input: { ctx: decodeField(ctx), D: Array.from(D), AID: Array.from(AID), unit, registryRoot: Array(32).fill(0), fee } };
  }
  function spent(request, state) {
    const row = request.spent;
    require(row && row.note instanceof Uint8Array, 'spent note required');
    const note = bytes(row.note, 169, 'spent note'), sk = bytes(row.spendSecret, 32, 'spend secret');
    const decoded = decodeNote(note), cm = noteCommitment(note), nf = noteNullifier(note, sk);
    const root = bytes(request.root, 32, 'historical root');
    require(decodeField(root) !== 0n && same(decoded.domain, state.D) && same(decoded.assetId, state.AID), 'spent note instance/root');
    require(same(member(cm, row.index, row.path), root), 'spent note membership');
    money(decoded.amountAtomic);require(kind!=='asset'||decoded.amountAtomic%state.unit===0n,'spent asset precision');
    Object.assign(state.input, { R: decodeField(root), nf: decodeField(nf), sk: Array.from(sk), spentNote: Array.from(note),
      spentCm: decodeField(cm), spentAmount: decoded.amountAtomic, spentIndex: row.index, spentPath: row.path.map(decodeField) });
    return { decoded, cm, nf, root, resource: { cm: hex(cm), nf: hex(nf) } };
  }
  function finish(op, state, created, blob, publics, resources, payout = new Uint8Array(), funding = new Uint8Array()) {
    const prepared = { operation: op, input: decimal(state.input), publics: publics.map(String), created,
      blob, resources, payout: payout.slice(), funding: funding.slice(), network: network.slice(), pool: pool.slice() };
    intents.set(prepared, fingerprint(prepared)); return prepared;
  }
  function prepareDeposit(request) {
    const state = context(request, 'D'), amount = money(request.amountAtomic);
    require(amount % state.quantum === 0n, 'deposit must be a multiple of 100 XNA');
    const funding = bytes(request.funding, 36, 'funding outpoint');
    require(money(request.fundingValue) === money(amount + state.fee), 'funding must equal amount plus fee');
    const created = seal(request.recipient, amount, state.D, state.AID);
    const blob = encodeC4Publication('D0', { cms: [created.cm], records: [created.record] });
    const data = c4PublicationHash('D0', blob), dep = poseidonBytes(concat(utf8('NIP045/dep\x01'), le(amount, 8), created.cm));
    Object.assign(state.input, { note: Array.from(created.note), cm: decodeField(created.cm), amount, dep: decodeField(dep), data_hash: decodeField(data) });
    return finish('D', state, [created], blob, [decodeField(state.ctx), decodeField(dep), decodeField(data), amount, state.fee], [], undefined, funding);
  }
  function prepareTransfer(request) {
    require(['T1', 'T2', 'T3'].includes(request.operation), 'transfer operation');
    const state = context(request, request.operation), input = spent(request, state);
    require(Array.isArray(request.outputs) && request.outputs.length === Number(request.operation[1]), 'transfer output count');
    let total = state.fee, changes = 0;
    const flags = [], created = request.outputs.map(output => {
      require(output && (output.isChange === undefined || typeof output.isChange === 'boolean'), 'change flag must be Boolean');
      const amount = money(output.amountAtomic), change = output.isChange === true;
      if (change) changes++;
      else require(amount % state.quantum === 0n, 'recipient amount must be a multiple of 100 XNA');
      const own = descriptor(input.decoded);
      if (change && output.recipient) require(Object.keys(own).every(k => output.recipient[k] === own[k]), 'change must preserve owner and viewing key');
      total = money(total + amount); flags.push(change ? 1 : 0);
      return seal(change ? own : output.recipient, amount, state.D, state.AID);
    });
    require(changes <= 1 && total === input.decoded.amountAtomic, 'transfer conservation or duplicate change');
    require(created.every(row => !same(row.cm, input.cm)) && new Set(created.map(row => hex(row.cm))).size === created.length, 'fresh distinct outputs');
    const blob = encodeC4Publication(request.operation, { cms: created.map(row => row.cm), records: created.map(row => row.record), nf: input.nf });
    const data = c4PublicationHash(request.operation, blob);
    Object.assign(state.input, { data_hash: decodeField(data), notes: created.map(row => Array.from(row.note)),
      amounts: created.map(row => decodeNote(row.note).amountAtomic), cms: created.map(row => decodeField(row.cm)), changeFlags: flags });
    return finish(request.operation, state, created, blob, [decodeField(state.ctx), decodeField(input.root), decodeField(input.nf), decodeField(data), state.fee, ...state.input.cms], [input.resource]);
  }
  function prepareWithdrawal(request) {
    const state = context(request, 'W'), input = spent(request, state), amount = money(request.amountAtomic);
    const native = destination(request.payoutScript);
    const payout = kind==='asset'?c6AssetTransferScript(native,state.asset,amount):native;
    const left = input.decoded.amountAtomic - amount - state.fee;
    require(left >= 0n, 'withdrawal conservation');
    if (kind==='asset'||amount >= QUANTUM) require(amount % state.quantum === 0n, 'withdrawal must be a multiple of 100 XNA');
    else require(left === 0n, 'small recovery must consume the entire note');
    const created = left ? [seal(descriptor(input.decoded), money(left), state.D, state.AID)] : [];
    const dummy = encodeNote({ domain: state.D, assetId: state.AID, owner: encodeField(1n),
      viewPub: Uint8Array.of(9, ...Array(31).fill(0)), amountAtomic: state.unit, rho: new Uint8Array(32) });
    const blob = left ? encodeC4Publication('T1', { cms: [created[0].cm], records: [created[0].record], nf: input.nf }) : new Uint8Array();
    const data = left ? c4PublicationHash('T1', blob) : unhex(EMPTY_W_DATA, 32);
    const pay = poseidonBytes(concat(utf8('NeuraiPoolC6/pay\x01'), Uint8Array.of(payout.length), payout));
    const cm = left ? decodeField(created[0].cm) : 0n;
    Object.assign(state.input, { amount, pay: decodeField(pay), cm_change: cm, data_hash: decodeField(data),
      has_change: left ? 1 : 0, changeNote: Array.from(created[0]?.note ?? dummy), changeAmount: left || state.unit });
    return finish('W', state, created, blob, [decodeField(state.ctx), decodeField(input.root), decodeField(input.nf), amount, state.fee, decodeField(pay), cm, decodeField(data)], [input.resource], payout);
  }
  async function prove(prepared, { api, wasm, zkey, vk, signal, stage = () => {} }) {
    const expected = intents.get(prepared);
    const check = () => {
      require(!signal?.aborted, 'aborted locally; an exposed packet remains valid on chain');
      require(expected !== undefined && intents.get(prepared) === expected && fingerprint(prepared) === expected, 'wallet intent changed after preparation');
    };
    check(); const stable = structuredClone(prepared);
    require(fingerprint(stable) === expected, 'wallet intent changed after preparation');
    stage('Compute witness'); check(); const witness = { type: 'mem' };
    await api.wtns.calculate(structuredClone(stable.input), wasm, witness); check();
    stage('Generate ' + stable.operation + ' proof'); check();
    const result = structuredClone(await api.groth16.prove(zkey, witness, undefined, { singleThread: true })); check();
    require(JSON.stringify(result.publicSignals.map(String)) === JSON.stringify(stable.publics), 'public signals differ from wallet intent');
    stage('Verify ' + stable.operation + ' proof'); check();
    require(await api.groth16.verify(vk, structuredClone(result.publicSignals), structuredClone(result.proof)), 'invalid generated proof'); check();
    const packet = concat(unhex('4e4336504b540100', 8), stable.network, stable.pool,
      Uint8Array.of(OPS.indexOf(stable.operation), stable.publics.length),
      ...stable.publics.map(v => encodeField(BigInt(v))), compress(result.proof), le(stable.blob.length, 2), stable.blob,
      Uint8Array.of(stable.payout.length), stable.payout, Uint8Array.of(stable.funding.length), stable.funding);
    require(packet.length <= 4800, 'packet size');
    return { packet, packetId: hex(sha256(concat(utf8('NeuraiC6Packet\x01'), packet))), proof: result.proof, publicSignals: result.publicSignals };
  }
  return { prepareDeposit, prepareTransfer, prepareWithdrawal, prove };
}
