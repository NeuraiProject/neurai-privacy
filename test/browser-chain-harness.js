import fixture from './fixtures/xna-chain-small.json';
import { BrowserTestIdentity } from '../src/browser-wallet.js';
import { scanBrowserPool } from '../src/browser-chain.js';

const bytes = value => Uint8Array.from(value.match(/../g), pair => parseInt(pair, 16));
window.runBrowserChainTest = async () => {
  const blocks = structuredClone(fixture.blocks);
  const identity = new BrowserTestIdentity(bytes(fixture.secret.spend), bytes(fixture.secret.view),
    bytes(fixture.manifest.domain), bytes(fixture.manifest.assetId), null);
  let height = 2;
  const rpc = async (method, args) => {
    if (method === 'getblockhash') return args[0] === 0 ? fixture.manifest.genesis : blocks[args[0]].hash;
    if (method === 'getbestblockhash') return blocks[height].hash;
    if (method === 'getblockcount') return height;
    if (method === 'getblock') return Object.values(blocks).find(block => block.hash === args[0]);
    if (method === 'getrawtransaction') return fixture.parents[args[0]];
    if (method === 'gettxout') return { value: 0 };
    throw new Error(`unexpected ${method}`);
  };
  try {
    const funded = await scanBrowserPool({ rpc, manifest: fixture.manifest, identity });
    if (funded.balanceAtomic.toString() !== fixture.expected.balanceAtomic ||
        funded.state.digest !== fixture.expected.digest || funded.transitions[0].form !== 'D0') {
      throw new Error('browser balance/state disagrees with Python vector');
    }
    height = 1;
    const rolled = await scanBrowserPool({ rpc, manifest: fixture.manifest, identity });
    if (rolled.balanceAtomic !== 0n || rolled.reserveAtomic !== 0n) {
      throw new Error('browser rollback did not remove private funds');
    }
    height = 2;
    blocks[2].tx[0].vout[1].value = 1000.00000001;
    let rejected = false;
    try { await scanBrowserPool({ rpc, manifest: fixture.manifest, identity }); }
    catch (error) { rejected = /reserve delta/.test(String(error)); }
    if (!rejected) throw new Error('browser accepted altered reserve');
    return { pass: true, fundedAtomic: funded.balanceAtomic.toString(),
      rollbackAtomic: rolled.balanceAtomic.toString(), rejectedAlteredReserve: true };
  } finally { identity.lock(); }
};
