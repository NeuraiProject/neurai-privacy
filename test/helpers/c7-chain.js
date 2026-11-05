/* In-memory chain for offline C7 runtime tests. It answers the read-only RPC
 * calls the scanner and the worker make, from blocks the test mines. It checks
 * no script or proof: the node does that. Pool transactions are stored as raw
 * hex and decoded with the library's own reader. */
import { createHash } from 'node:crypto';
import { readC7RawTransaction } from '../../src/c7-raw-transaction.js';

const sha = text => createHash('sha256').update(text).digest('hex');
const BURN = 'tBURNXXXXXXXXXXXXXXXXXXXXXXXVZLroy';
export const xna = atomic => { const n = BigInt(atomic); return `${n / 100000000n}.${String(n % 100000000n).padStart(8, '0')}`; };
export const P2PKH = '76a914' + '44'.repeat(20) + '88ac';

export class C7Chain {
  constructor({ deployment, manifest }) {
    this.genesis = deployment.genesis;
    this.blocks = [];
    this.raw = new Map();
    const [birthTxid] = deployment.anchor.outpoint.split(':');
    const [emissionTxid, emissionVout] = deployment.emission.split(':');
    const owner = manifest.identity.slice(0, manifest.identity.indexOf('#')) + '!';
    const birth = { txid: birthTxid, vin: [{ txid: emissionTxid, vout: Number(emissionVout) }], vout: [
      { n: 0, value: '0.00000000', scriptPubKey: { hex: deployment.anchor.script, asset: { name: manifest.identity } } },
      { n: 1, value: '0.00000000', scriptPubKey: { hex: '76a914' + '00'.repeat(20) + '88ac', asset: { name: owner }, addresses: [BURN] } }] };
    this.blocks.push({ hash: deployment.anchor.hash, height: deployment.anchor.height, previousblockhash: sha('before-birth'), tx: [birth] });
  }
  get tip() { return this.blocks.at(-1); }
  /** Mine a block with pool transactions (raw hex) and plain decoded transactions. */
  mine({ raws = [], txs = [] } = {}) {
    const height = this.tip.height + 1, hash = sha('block' + height + ':' + this.blocks.length);
    const decoded = raws.map(raw => {
      const tx = readC7RawTransaction(raw);
      this.raw.set(tx.txid, raw);
      return { txid: tx.txid, vin: tx.inputs.map(i => ({ txid: i.txid, vout: i.vout })),
        vout: tx.outputs.map((o, n) => ({ n, value: xna(o.valueAtomic), scriptPubKey: { hex: o.script } })) };
    });
    this.blocks.push({ hash, height, previousblockhash: this.tip.hash, tx: [...txs, ...decoded] });
    return { hash, height, txids: decoded.map(t => t.txid) };
  }
  /** A confirmed transparent coin that can fund a deposit. */
  fund(valueAtomic, script = P2PKH) {
    const txid = sha('funding' + this.blocks.length + ':' + valueAtomic);
    this.mine({ txs: [{ txid, vin: [], vout: [{ n: 0, value: xna(valueAtomic), scriptPubKey: { hex: script } }] }] });
    return { point: `${txid}:0`, valueAtomic: String(valueAtomic), script };
  }
  spender(txid, index) {
    for (const block of this.blocks) for (const tx of block.tx) {
      const at = tx.vin.findIndex(i => i.txid === txid && i.vout === index);
      if (at >= 0) return { txid: tx.txid, index: at, height: block.height };
    }
    return null;
  }
  output(txid, index) {
    for (const block of this.blocks) for (const tx of block.tx) if (tx.txid === txid) return { block, out: tx.vout[index] };
    return null;
  }
  rpc = async (method, params = []) => {
    switch (method) {
      case 'getblockchaininfo': return { chain: 'test', blocks: this.tip.height, zk_portable_tree: { active_for_next_block: true } };
      case 'getblockcount': return this.tip.height;
      case 'getbestblockhash': return this.tip.hash;
      case 'getblockhash': {
        const [h] = params;
        if (h === 0) return this.genesis;
        const block = this.blocks.find(b => b.height === h);
        if (!block) throw new Error('Block height out of range');
        return block.hash;
      }
      case 'getblock': {
        const block = this.blocks.find(b => b.hash === params[0]);
        if (!block) throw new Error('Block not found');
        return structuredClone(block);
      }
      case 'getrawtransaction': {
        const raw = this.raw.get(params[0]);
        if (!raw) throw new Error('No such transaction');
        return raw;
      }
      case 'getspentinfo': {
        const spent = this.spender(params[0].txid, params[0].index);
        if (!spent) throw new Error('Unable to get spent info');
        return spent;
      }
      case 'gettxout': {
        const [txid, index] = params;
        if (this.spender(txid, index)) return null;
        const found = this.output(txid, index);
        if (!found?.out) return null;
        return { bestblock: this.tip.hash, confirmations: this.tip.height - found.block.height + 1, value: found.out.value,
          scriptPubKey: structuredClone(found.out.scriptPubKey) };
      }
      case 'getprivacypoolupdates': throw new Error('Method not found');
      default: throw new Error('Unexpected RPC method ' + method);
    }
  };
}

/** A prover that returns the public signals the wallet expects. */
export const fakeProof = { pi_a: ['1', '2'], pi_b: [['1', '2'], ['3', '4']], pi_c: ['1', '2'] };
export const fakeProver = prepared => ({ wtns: { calculate: async () => {} },
  groth16: { prove: async () => ({ proof: fakeProof, publicSignals: prepared.publics.slice() }), verify: async () => true } });
