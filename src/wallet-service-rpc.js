/* Bridge the wallet service's WSS envelopes to the pool's native RPC shape.
 * The application owns the authenticated socket, correlation and timeouts.
 * No retry, endpoint fallback, signing or proof generation happens here. */
const HASH = /^[0-9a-f]{64}$/;
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const READ_METHODS = new Set([
  'getblockchaininfo', 'getblockcount', 'getblockhash', 'getblockheader',
  'getbestblockhash', 'getblock', 'getspentinfo', 'getrawmempool', 'decoderawtransaction',
  'getprivacypoolinfo', 'getprivacypoolupdates',
  'getaddressbalance', 'getaddressdeltas', 'getaddressutxos', 'getaddressmempool',
  'getrawtransaction', 'gettxout', 'estimatesmartfee', 'getassetdata',
  'listassets', 'listassetbalancesbyaddress', 'listaddressesbyasset',
  'checkaddresstag', 'listtagsforaddress', 'listaddressesfortag',
  'checkaddressrestriction', 'checkglobalrestriction', 'getverifierstring',
  'isvalidverifierstring', 'listdepinaddresses', 'listdepinholders', 'checkdepinvalidity',
  'validateaddress', 'getpubkey', 'testmempoolaccept',
]);

export function createWalletServiceRpc({ request, hello, expectedGenesis, expectedServiceId } = {}) {
  if (typeof request !== 'function') throw new TypeError('A correlated WSS request function is required');
  if (typeof expectedGenesis !== 'string' || !HASH.test(expectedGenesis)) throw new Error('Pin the expected wallet-service genesis');
  if (!object(hello) || hello.protocol !== 'wss/2' || hello.exact_amounts !== true ||
      hello.wallet_rpc?.amounts !== 'rpc-native-units' ||
      hello.wallet_rpc?.numeric_encoding !== 'safe-number-or-string' ||
      !Array.isArray(hello.wallet_rpc?.methods) || hello.wallet_rpc.methods.some(m => typeof m !== 'string')) {
    throw new Error('The wallet service must negotiate wss/2 with native exact wallet RPC');
  }
  if (hello.genesis_hash !== expectedGenesis) throw new Error('Wallet-service genesis mismatch');
  if (expectedServiceId !== undefined &&
      (typeof expectedServiceId !== 'string' || !expectedServiceId || hello.service_id !== expectedServiceId)) {
    throw new Error('Wallet-service identity mismatch');
  }
  // Copy capabilities: later mutation of the handshake cannot enable methods.
  const advertised = new Set(hello.wallet_rpc.methods);

  return async (method, params = []) => {
    if (!Array.isArray(params)) throw new TypeError('RPC params must be an array');
    const broadcast = method === 'sendrawtransaction';
    if (broadcast) {
      // tx.broadcast has no allowhighfees argument. Never silently drop one.
      if (params.length !== 1 || typeof params[0] !== 'string' ||
          params[0].length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(params[0])) {
        throw new TypeError('WSS broadcast requires exactly one raw transaction hex argument');
      }
    } else if (!READ_METHODS.has(method) || !advertised.has(method)) {
      throw new Error('Wallet-service RPC method unavailable: ' + String(method));
    }

    let reply;
    try {
      reply = await request(broadcast ? 'tx.broadcast' : 'rpc.call',
        broadcast ? { rawtx: params[0] } : { method, params });
    } catch (cause) {
      // A transport rejection is not an authenticated node rejection. Even
      // an Error with code -5 must not authorize publication recovery.
      const error = new Error('Wallet-service transport failed', { cause });
      if (broadcast) error.uncertain = true;
      throw error;
    }
    if (!object(reply) || (own(reply, 'error') && reply.error !== null &&
        (!object(reply.error) || own(reply, 'result'))) ||
        (!own(reply, 'result') && !object(reply.error)) ||
        (own(reply, 'result') && reply.result === undefined)) {
      const error = new Error('Invalid wallet-service RPC response');
      if (broadcast) error.uncertain = true;
      throw error;
    }
    if (object(reply.error)) {
      const error = new Error(typeof reply.error.message === 'string' ? reply.error.message : 'Wallet-service RPC failed');
      const nodeCode = reply.error.node_code;
      if (Number.isInteger(nodeCode) && nodeCode < 0) error.code = nodeCode;
      // Service errors remain distinct, including upstream failures whose
      // node_code is null. Do not turn them into "transaction not found".
      else if (Number.isInteger(reply.error.code) && reply.error.code >= 1000) error.code = reply.error.code;
      if (Number.isInteger(reply.error.code)) error.serviceCode = reply.error.code;
      if (Number.isInteger(reply.error.retry_after_seconds) && reply.error.retry_after_seconds > 0) {
        error.retryAfterSeconds = reply.error.retry_after_seconds;
      }
      if (broadcast && !(Number.isInteger(nodeCode) && nodeCode < 0)) error.uncertain = true;
      throw error;
    }
    if (broadcast) {
      if (!object(reply.result) || typeof reply.result.txid !== 'string' || !HASH.test(reply.result.txid)) {
        throw Object.assign(new Error('Invalid wallet-service broadcast result'), { uncertain: true });
      }
      return reply.result.txid;
    }
    // Preserve native schemas and units; address.* string-sats are never used
    // as an alternative to rpc.call. null is a valid gettxout response.
    return reply.result;
  };
}
