import test from 'node:test';
import assert from 'node:assert/strict';
import {createWalletServiceRpc} from '../src/client.js';
const genesis = 'a'.repeat(64);
const methods = ['getbestblockhash', 'getblock', 'getspentinfo', 'getrawtransaction', 'gettxout', 'getrawmempool', 'decoderawtransaction', 'testmempoolaccept'];
const handshake = () => ({protocol: 'wss/2', exact_amounts: true, genesis_hash: genesis, service_id: 'test-pool',
  wallet_rpc: {methods: [...methods], amounts: 'rpc-native-units', numeric_encoding: 'safe-number-or-string'}});
const build = (request, overrides = {}) => createWalletServiceRpc({request, hello: handshake(), expectedGenesis: genesis, ...overrides});

test('requires exact negotiation, pinned chain and optional service identity', () => {
  const request = async () => ({result: null});
  for (const patch of [{protocol: 'wss/1'}, {exact_amounts: false}, {genesis_hash: 'b'.repeat(64)},
    {wallet_rpc: {methods, amounts: 'string-sats', numeric_encoding: 'safe-number-or-string'}}, {wallet_rpc: null}]) {
    assert.throws(() => build(request, {hello: {...handshake(), ...patch}}));
  }
  assert.throws(() => build(request, {expectedGenesis: undefined}));
  assert.throws(() => build(request, {expectedServiceId: 'other'}));
  assert.equal(typeof build(request, {expectedServiceId: 'test-pool'}), 'function');
});

test('forwards pool reads with native values, scripts, arrays and null unchanged', async () => {
  const captured = [];
  const native = {value: '100000000.00000001', satoshis: '10000000000000001', scriptPubKey: {hex: '5120'}, witness: ['10'], tx: []};
  const rpc = build(async (method, params) => {captured.push([method, params]); return {result: params.method === 'gettxout' ? null : native};});
  for (const method of methods) {
    const params = [{txid: 'b'.repeat(64), index: 0}, false];
    assert.equal(await rpc(method, params), method === 'gettxout' ? null : native);
    assert.deepEqual(captured.at(-1), ['rpc.call', {method, params}]);
  }
});

test('unsupported and node-wallet methods never reach the request function', async () => {
  let calls = 0;
  const hello = handshake();hello.wallet_rpc.methods.push('dumpprivkey', 'signrawtransaction');
  const rpc = build(async () => {calls++; return {result: null};}, {hello});
  for (const method of ['dumpprivkey', 'signrawtransaction', 'getassetdata', 'unknown']) await assert.rejects(rpc(method, []), /unavailable/);
  hello.wallet_rpc.methods.push('getassetdata');
  await assert.rejects(rpc('getassetdata', []), /unavailable/);
  assert.equal(calls, 0);
});

test('broadcast maps once to tx.broadcast and returns only the native txid', async () => {
  const captured = [];
  const rpc = build(async (...args) => {captured.push(args); return {result: {txid: 'b'.repeat(64)}};});
  assert.equal(await rpc('sendrawtransaction', ['aabb']), 'b'.repeat(64));
  assert.deepEqual(captured, [['tx.broadcast', {rawtx: 'aabb'}]]);
  for (const params of [[], ['aabb', true], ['aabb', false], [''], ['xyz'], ['abc'], [1], null]) {
    await assert.rejects(rpc('sendrawtransaction', params));
  }
  assert.equal(captured.length, 1);
});

test('only an authenticated node_code -5 is transaction-not-found', async () => {
  const missing = build(async () => ({error: {code: 1005, node_code: -5, message: 'No such transaction'}}));
  await assert.rejects(missing('getrawtransaction', []), e => e.code === -5 && e.serviceCode === 1005);
  for (const response of [{code: 1005, node_code: null}, {code: 1004}, {code: 1008, retry_after_seconds: 30},
    {code: -5}, {code: 1005, node_code: '-5'}]) {
    const rpc = build(async () => ({error: {...response, message: 'Not a missing transaction'}}));
    await assert.rejects(rpc('getrawtransaction', []), e => e.code !== -5);
  }
  const transport = build(async () => {throw Object.assign(Error('connection closed'), {code: -5});});
  await assert.rejects(transport('getrawtransaction', []), e => e.code === undefined && e.cause.code === -5);
});

test('broadcast transport, upstream and malformed results stay uncertain without retry', async () => {
  for (const outcome of [new Error('timeout'), {error: {code: 1005, node_code: null}},
    undefined, {result: {txid: 'wrong'}}, {error: 'bad'}, {result: undefined},
    {result: 'b'.repeat(64)}, {result: null, error: {code: 1005, node_code: -26}}]) {
    let calls = 0;
    const rpc = build(async () => {calls++; if (outcome instanceof Error) throw outcome; return outcome;});
    await assert.rejects(rpc('sendrawtransaction', ['aabb']), e => e.uncertain === true);
    assert.equal(calls, 1);
  }
  const refused = build(async () => ({error: {code: 1005, node_code: -26, message: 'txn-mempool-conflict'}}));
  await assert.rejects(refused('sendrawtransaction', ['aabb']), e => e.code === -26 && e.uncertain !== true);
});

test('malformed read envelopes fail instead of producing an empty balance', async () => {
  for (const response of [null, undefined, [], {}, {error: null}, {error: 'bad'}, {result: undefined}, {result: [], error: {code: 1005}}]) {
    await assert.rejects(build(async () => response)('getblock', []), /Invalid/);
  }
});
