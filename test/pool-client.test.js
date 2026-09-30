import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rpcAmountToSatoshis, parseXna, formatXna, isPoolReadRpc, assertPoolChain, confirmedPoolCoins, selectPoolCoins,
  checkPoolCoin, withdrawalScript, recheckInputs, admitTransaction, inspectFundingTransaction, publishTransaction,
  publicationStatus, rotationStorageKey, loadRotation, saveRotation, C3_TESTNET_MANIFEST, C3_TESTNET_ARTIFACTS,
} from '../src/client.js';

const GENESIS = C3_TESTNET_MANIFEST.genesis;
const P2PKH = '76a914' + '11'.repeat(20) + '88ac';
const OTHER = '76a914' + '22'.repeat(20) + '88ac';
function stubRpc(handlers) {
  const calls = [];
  const rpc = async (method, params) => {
    calls.push([method, params]);
    if (!(method in handlers)) throw new Error('unexpected RPC ' + method);
    const handler = handlers[method];
    return typeof handler === 'function' ? handler(...params) : handler;
  };
  return { rpc, calls };
}

test('exact amounts: RPC values, user input and formatting', () => {
  assert.equal(rpcAmountToSatoshis(8999.86985), 899986985000n);
  assert.notEqual(8999.86985 * 1e8, 899986985000);
  assert.equal(rpcAmountToSatoshis('95000000.12345678'), 9500000012345678n);
  assert.equal(rpcAmountToSatoshis('21000000000.00000000'), 2100000000000000000n);
  assert.equal(rpcAmountToSatoshis(0.0000001), 10n);
  assert.equal(rpcAmountToSatoshis('1e-8'), 1n);
  for (const bad of ['0.000000001', '-1', NaN, Infinity, '', '0x10', null, {}, '21000000000.00000001', '1e-9']) {
    assert.throws(() => rpcAmountToSatoshis(bad));
  }
  assert.equal(parseXna('12.5'), 1250000000n);
  assert.equal(parseXna(' 0.00000001 '), 1n);
  assert.throws(() => parseXna('0'), /greater than zero/);
  assert.equal(parseXna('0', { allowZero: true }), 0n);
  for (const bad of ['1e3', '1.123456789', '-1', 'abc', '']) assert.throws(() => parseXna(bad));
  assert.equal(formatXna(1234500000n), '12.345');
  assert.equal(formatXna(100000000n), '1');
  assert.equal(formatXna(1n), '0.00000001');
});

test('read-only RPC allowlist and chain check', async () => {
  for (const method of ['getblockhash', 'getblock', 'getrawtransaction', 'gettxout', 'getspentinfo']) assert.equal(isPoolReadRpc(method), true);
  for (const method of ['sendrawtransaction', 'dumpprivkey', 'signrawtransaction', 'testmempoolaccept']) assert.equal(isPoolReadRpc(method), false);
  await assertPoolChain(stubRpc({ getblockhash: GENESIS }).rpc, C3_TESTNET_MANIFEST);
  await assert.rejects(assertPoolChain(stubRpc({ getblockhash: '00'.repeat(32) }).rpc, C3_TESTNET_MANIFEST), /not on the network/);
});

test('coin discovery and selection for deposits and fees', async () => {
  const utxos = [
    { txid: 'a'.repeat(64), outputIndex: 0, script: P2PKH, satoshis: 100000000000, assetName: 'XNA', address: 'tA' },
    { txid: 'b'.repeat(64), outputIndex: 1, script: P2PKH, satoshis: 899986985000, assetName: 'XNA', address: 'tA' },
    { txid: 'c'.repeat(64), outputIndex: 0, script: P2PKH, satoshis: 5, assetName: 'XNA' },
    { txid: 'd'.repeat(64), outputIndex: 0, script: '5120' + '33'.repeat(32), satoshis: 7, assetName: 'XNA' },
    { txid: 'e'.repeat(64), outputIndex: 0, script: P2PKH, satoshis: 7, assetName: 'OTHER' },
  ];
  const { rpc } = stubRpc({ gettxout: txid => txid === 'c'.repeat(64) ? { confirmations: 0 } : { confirmations: 3 } });
  const coins = await confirmedPoolCoins(rpc, utxos, { baseCurrency: 'XNA' });
  assert.deepEqual(coins.map(c => [c.txid[0], c.vout, c.valueSats, c.scriptHex]), [['a', 0, '100000000000', P2PKH], ['b', 1, '899986985000', P2PKH]]);
  const deposit = selectPoolCoins(coins, { action: 'deposit', amountAtomic: 100000000000n, feeAtomic: 10000000n });
  assert.equal(deposit.funding.txid[0], 'a');
  assert.equal(deposit.sponsor.txid[0], 'b');
  assert.throws(() => selectPoolCoins(coins, { action: 'deposit', amountAtomic: 5n, feeAtomic: 1n }), /exact deposit coin/);
  assert.equal(selectPoolCoins(coins, { action: 'transfer', amountAtomic: 0n, feeAtomic: 10000000n }).funding, undefined);
  assert.throws(() => selectPoolCoins([coins[0]], { action: 'deposit', amountAtomic: 100000000000n, feeAtomic: 1n }), /separate confirmed/);
  assert.throws(() => selectPoolCoins(coins, { action: 'transfer', amountAtomic: 0n, feeAtomic: 899986985000n }), /separate confirmed/);
});

test('coin rechecks compare exact satoshis, script and confirmation', async () => {
  const coin = { txid: 'b'.repeat(64), vout: 1, valueSats: '899986985000', scriptHex: P2PKH };
  const live = { confirmations: 2, value: 8999.86985, scriptPubKey: { hex: P2PKH } };
  await checkPoolCoin(stubRpc({ gettxout: live }).rpc, coin);
  await assert.rejects(checkPoolCoin(stubRpc({ gettxout: { ...live, value: 8999.86984 } }).rpc, coin), /value mismatch/);
  await assert.rejects(checkPoolCoin(stubRpc({ gettxout: null }).rpc, coin), /spent, unconfirmed/);
  await assert.rejects(checkPoolCoin(stubRpc({ gettxout: { ...live, confirmations: 0 } }).rpc, coin), /spent, unconfirmed/);
  await assert.rejects(checkPoolCoin(stubRpc({ gettxout: { ...live, scriptPubKey: { hex: OTHER } } }).rpc, coin), /spent, unconfirmed/);
  assert.equal(await withdrawalScript(stubRpc({ validateaddress: { isvalid: true, scriptPubKey: P2PKH } }).rpc, ' tAddr '), P2PKH);
  await assert.rejects(withdrawalScript(stubRpc({ validateaddress: { isvalid: false } }).rpc, 'x'), /Legacy/);
  await assert.rejects(withdrawalScript(stubRpc({ validateaddress: { isvalid: true, scriptPubKey: '5120' + '00'.repeat(32) } }).rpc, 'x'), /Legacy/);
});

test('funding inspection, admission and inputs recheck', async () => {
  const decoded = { txid: 'f'.repeat(64), vin: [{ txid: 'b'.repeat(64), vout: 1 }], vout: [{ value: 1000 }, { value: 7999.86975 }] };
  const { rpc } = stubRpc({ decoderawtransaction: decoded, testmempoolaccept: [{ allowed: true }],
    gettxout: { value: 8999.86985, confirmations: 1 } });
  assert.deepEqual(await inspectFundingTransaction(rpc, 'raw'), { txid: 'f'.repeat(64), feeAtomic: 10000n, points: [{ txid: 'b'.repeat(64), vout: 1 }] });
  await assert.rejects(inspectFundingTransaction(stubRpc({ decoderawtransaction: decoded,
    testmempoolaccept: [{ allowed: false, 'reject-reason': 'min relay fee not met' }] }).rpc, 'raw'), /min relay fee/);
  assert.equal((await admitTransaction(rpc, 'raw')).txid, 'f'.repeat(64));
  await recheckInputs(stubRpc({ getblockhash: GENESIS, gettxout: { value: 1 } }).rpc, C3_TESTNET_MANIFEST, [{ txid: 'a', vout: 0 }]);
  await assert.rejects(recheckInputs(stubRpc({ getblockhash: GENESIS, gettxout: null }).rpc, C3_TESTNET_MANIFEST, [{ txid: 'a', vout: 0 }]), /spent while preparing/);
});

test('publication marks unknown outcomes as uncertain and resolves them later', async () => {
  const tx = { raw: 'raw', txid: 'f'.repeat(64), points: [{ txid: 'a', vout: 0 }] };
  const base = { getblockhash: GENESIS, gettxout: { value: 1 }, testmempoolaccept: [{ allowed: true }],
    decoderawtransaction: { txid: tx.txid } };
  const seen = [];
  assert.equal(await publishTransaction(stubRpc({ ...base, sendrawtransaction: tx.txid }).rpc, C3_TESTNET_MANIFEST, tx,
    { onBroadcast: txid => seen.push(txid) }), tx.txid);
  assert.deepEqual(seen, [tx.txid]);
  await assert.rejects(publishTransaction(stubRpc({ ...base, decoderawtransaction: { txid: '0'.repeat(64) },
    sendrawtransaction: tx.txid }).rpc, C3_TESTNET_MANIFEST, tx), /does not match/);
  await assert.rejects(publishTransaction(stubRpc({ ...base, sendrawtransaction: () => { throw new Error('timeout'); } }).rpc,
    C3_TESTNET_MANIFEST, tx), e => e.uncertain === true && /uncertain: timeout/.test(e.message));
  await assert.rejects(publishTransaction(stubRpc({ ...base, sendrawtransaction: '0'.repeat(64) }).rpc, C3_TESTNET_MANIFEST, tx),
    e => e.uncertain === true);
  await assert.rejects(publishTransaction(stubRpc({ ...base, testmempoolaccept: [{ allowed: false, 'reject-reason': 'txn-mempool-conflict' }] }).rpc,
    C3_TESTNET_MANIFEST, tx), e => !e.uncertain && /conflict/.test(e.message));
  const found = confirmations => stubRpc({ ...base, getrawtransaction: { txid: tx.txid, confirmations } }).rpc;
  assert.equal(await publicationStatus(found(3), C3_TESTNET_MANIFEST, tx), 'confirmed');
  assert.equal(await publicationStatus(found(0), C3_TESTNET_MANIFEST, tx), 'mempool');
  const missing = extra => stubRpc({ ...base, getrawtransaction: () => { throw new Error('No such mempool or blockchain transaction'); }, ...extra }).rpc;
  assert.equal(await publicationStatus(missing(), C3_TESTNET_MANIFEST, tx), 'retryable');
  await assert.rejects(publicationStatus(missing({ testmempoolaccept: [{ allowed: false }] }), C3_TESTNET_MANIFEST, tx), /remains uncertain/);
  await assert.rejects(publicationStatus(missing(), C3_TESTNET_MANIFEST, { txid: tx.txid }), /unavailable/);
});

test('rotation state is small, validated and tolerant of unavailable storage', () => {
  const key = rotationStorageKey({ network: 'xna-test', walletId: 'tWallet', fingerprint: 'ce62fe35', account: 0 });
  assert.equal(key, 'neurai-privacy-zk:xna-test:tWallet:ce62fe35:0');
  assert.throws(() => rotationStorageKey({ network: 'x', fingerprint: 'nothex!!', account: 0 }), /fingerprint/);
  const map = new Map();
  const storage = { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) };
  assert.equal(loadRotation(storage, key), null);
  assert.equal(saveRotation(storage, key, { gap: 20, issued: 3 }), true);
  assert.deepEqual(loadRotation(storage, key), { gap: 20, issued: 3 });
  for (const bad of ['not json', '{"gap":0,"issued":1}', '{"gap":1001,"issued":1}', '{"gap":20,"issued":-1}']) {
    map.set(key, bad);
    assert.equal(loadRotation(storage, key), null);
  }
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); } };
  assert.equal(loadRotation(broken, key), null);
  assert.equal(saveRotation(broken, key, { gap: 20, issued: 1 }), false);
  assert.equal(saveRotation(null, key, { gap: 20, issued: 1 }), false);
  assert.equal(C3_TESTNET_ARTIFACTS.forms.T2.zkey, 'artifacts/T2/final.zkey');
  assert.ok(Object.isFrozen(C3_TESTNET_MANIFEST.forms.D0));
});
