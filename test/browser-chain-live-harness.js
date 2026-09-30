import { scanBrowserPool } from '../src/browser-chain.js';

window.runBrowserChainTest = async () => {
  const response = await fetch('./live-rpc-4291.json.gz');
  if (!response.ok || !response.body) throw new Error('missing TEST RPC capture');
  const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
  const transcript = JSON.parse(await new Response(stream).text());
  const rpc = async (method, params) => {
    const key = JSON.stringify([method, params]);
    if (!(key in transcript.capture)) throw new Error(`missing captured RPC: ${key}`);
    return transcript.capture[key];
  };
  const started = performance.now();
  const result = await scanBrowserPool({ rpc, manifest: transcript.manifest,
    stopHeight: transcript.stopHeight });
  const expectedDigest = '7461512188363804168099217549584285945504747854271275342582468953418674031321';
  if (result.height !== 4291 || result.state.digest !== expectedDigest ||
      result.reserveAtomic !== 60_000_000_000n || result.transitions.length !== 12) {
    throw new Error('Chromium scan disagrees with pinned Python result');
  }
  return { pass: true, height: result.height, transitions: result.transitions.length,
    reserveAtomic: result.reserveAtomic.toString(), digest: result.state.digest,
    scanMs: Math.round(performance.now() - started) };
};
