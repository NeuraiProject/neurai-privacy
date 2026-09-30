/* RPC stub over the confirmed C3 TEST chain in fixtures/c3/public-chain.json:
 * pool birth plus seven operations, reachable through the spent index. */
import { readFileSync } from 'node:fs';
import { c3StateScript } from '../../src/c3.js';
import { emptyPoolState, poolStateDigest } from '../../src/pool-state.js';

export const c3 = JSON.parse(readFileSync(new URL('../fixtures/c3/public-chain.json', import.meta.url)));
export const C3_TIP = 7790;
const PARENT = 'ab'.repeat(32);
const xna = atomic => { const v = BigInt(atomic); return `${v / 100000000n}.${(v % 100000000n).toString().padStart(8, '0')}`; };

export function c3Chain() {
  const manifest = c3.manifest;
  const vectors = structuredClone(c3.vectors);
  const hashes = new Map(vectors.map(v => [v.tx.height, v.tx.blockhash]));
  const hashAt = height => height === 0 ? manifest.genesis : hashes.get(height) ?? height.toString(16).padStart(64, '0');
  const birth = { txid: manifest.birth, blockhash: hashAt(manifest.birthHeight), height: manifest.birthHeight,
    confirmations: C3_TIP - manifest.birthHeight + 1, vin: [{ txid: PARENT, vout: 0 }],
    vout: [{ value: 0, scriptPubKey: { hex: c3StateScript(manifest, poolStateDigest(emptyPoolState())) } }] };
  const txs = new Map([[birth.txid, birth], [PARENT, { txid: PARENT,
    vout: [{ scriptPubKey: { hex: '00' + Buffer.from(manifest.identity).toString('hex') } }] }]]);
  for (const { form, input, tx } of vectors) {
    txs.set(tx.txid, tx);
    if (form[0] !== 'D') continue;
    const funding = tx.vin[form === 'D0' ? 1 : 2];
    const parent = txs.get(funding.txid) ?? { txid: funding.txid, vout: [] };
    parent.vout[funding.vout] = { value: xna(input.amount) };
    txs.set(funding.txid, parent);
  }
  const spends = new Map();
  let previous = manifest.birth;
  for (const { tx } of vectors) { spends.set(previous + ':0', { txid: tx.txid, index: 0, height: tx.height }); previous = tx.txid; }
  const unspent = new Set([previous + ':0']);
  const calls = [];
  const rpc = async (method, params) => {
    calls.push(method);
    if (method === 'getblockhash') return hashAt(params[0]);
    if (method === 'getbestblockhash') return hashAt(C3_TIP);
    if (method === 'getblockcount') return C3_TIP;
    if (method === 'getrawtransaction') return txs.get(params[0]);
    if (method === 'getspentinfo') {
      const spent = spends.get(params[0].txid + ':' + params[0].index);
      if (!spent) throw new Error('Unable to get spent info');
      return spent;
    }
    if (method === 'gettxout') return unspent.has(params[0] + ':' + params[1]) ? { value: 0, confirmations: 1 } : null;
    throw new Error('unexpected RPC ' + method);
  };
  return { rpc, calls, manifest, finalState: previous };
}
