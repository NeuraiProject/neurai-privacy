import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { CliTestBackend, NeuraiPrivacy, RESET_TESTNET_GENESIS } from '../src/index.js';

const TXID = 'a'.repeat(64);
const rpcGenesis = async (method) => method === 'getblockhash' ? RESET_TESTNET_GENESIS : null;

test('XNA scan lists distinct notes and retains satoshi precision above Number.MAX_SAFE_INTEGER', async () => {
  const amount = '10000000000000000';
  const backend = {
    profile: 'xna',
    scan: async () => ({ test_only: true, balance_sats: amount, reserve_sats: amount,
      balance_units: Number(amount), reserve_amount: Number(amount),
      owned_notes: [
        { cm: '123', amount_sats: amount, spent: false,
          created_txid: TXID, created_height: 120, spent_txid: null,
          spent_height: null, slot: 0 },
        { cm: '456', amount_sats: '12', spent: true,
          created_txid: TXID, created_height: 100, spent_txid: 'b'.repeat(64),
          spent_height: 110, slot: 1 }
      ], history: [{ txid: TXID, height: 120, form: 'D1', reserve_sats: amount }] }),
    transact: async () => ({ test_only: true, form: 'D1', txid: TXID,
      reserve_after: Number(amount), reserve_sats: amount })
  };
  const wallet = new NeuraiPrivacy({ rpc: rpcGenesis, backend });
  const scan = await wallet.scan();
  assert.equal(scan.balanceAtomic, BigInt(amount));
  assert.equal(scan.reserveAtomic, BigInt(amount));
  assert.equal('reserve_amount' in scan, false);
  assert.equal('balance_units' in scan, false);
  assert.equal(scan.ownedNotes[0].cm, '123');
  assert.equal(scan.ownedNotes[0].amountAtomic, BigInt(amount));
  assert.equal(scan.ownedNotes[1].spentTxid, 'b'.repeat(64));
  assert.equal((await wallet.listNotes()).length, 2);
  assert.equal((await wallet.history())[0].reserveAtomic, BigInt(amount));
  const result = await wallet.deposit({ amountSats: amount });
  assert.equal(result.reserveAtomic, BigInt(amount));
  assert.equal('reserve_after' in result, false);
});

test('prepared transaction is validated again before publication', async () => {
  const calls = [];
  let allowed = true;
  const rpc = async (method, params) => {
    calls.push(method);
    if (method === 'getblockhash') return RESET_TESTNET_GENESIS;
    if (method === 'decoderawtransaction') return { txid: TXID };
    if (method === 'testmempoolaccept') return [{ allowed: allowed ? 1 : 0,
      'reject-reason': allowed ? undefined : '18: txn-mempool-conflict' }];
    if (method === 'sendrawtransaction') return TXID;
    throw new Error(method);
  };
  const wallet = new NeuraiPrivacy({ rpc, backend: {
    profile: 'xna', scan: async () => ({}), transact: async () => ({})
  } });
  const candidate = { test_only: true, txid: TXID, raw_tx: '0102', broadcast: false };
  const sent = await wallet.publishPrepared(candidate);
  assert.equal(sent.broadcast, true);
  assert.equal(sent.raw_tx, undefined);
  assert.deepEqual(calls.slice(-3), ['decoderawtransaction', 'testmempoolaccept', 'sendrawtransaction']);
  allowed = false;
  await assert.rejects(wallet.publishPrepared(candidate), /txn-mempool-conflict/);
  assert.equal(calls.filter((item) => item === 'sendrawtransaction').length, 1);
});

test('one wallet serializes jobs and rebuilds a conflicting candidate once', async () => {
  let attempts = 0;
  const stages = [];
  const backend = { profile: 'xna', scan: async () => ({}),
    transact: async () => {
      attempts++;
      if (attempts === 1) throw new Error('18: txn-mempool-conflict');
      return { test_only: true, form: 'D0', txid: TXID, reserve_sats: '500' };
    } };
  const wallet = new NeuraiPrivacy({ rpc: rpcGenesis, backend });
  const result = await wallet.deposit({ amountSats: 500n,
    onProgress: (event) => stages.push(event.stage) });
  assert.equal(result.reserveAtomic, 500n);
  assert.equal(attempts, 2);
  assert.deepEqual(stages, ['rebuild']);
});

test('CLI bridge exposes funding, encrypted-backup commands and progress', async () => {
  const root = await mkdtemp(join(tmpdir(), 'neurai-privacy-enhanced-'));
  try {
    const fake = join(root, 'fake-python');
    await writeFile(fake, '#!/usr/bin/env python3\n' +
      'import json,sys\n' +
      'a=sys.argv[1:]; cmd=a[2]\n' +
      'assert sys.stdin.readline().strip()=="TEST-password-1234"\n' +
      'if cmd in ("backup","restore"):\n' +
      ' assert "--manifest-sha256" not in a\n' +
      ' print(json.dumps({"test_only":True,"operation":cmd,"path":a[a.index("--file")+1]}))\n' +
      'elif cmd=="funding":\n' +
      ' print(json.dumps({"test_only":True,"amount_sats":a[a.index("--amount-sats")+1],"ready":True,"created_txid":None}))\n' +
      'else:\n' +
      ' print("NIP045_PROGRESS:prove",file=sys.stderr,flush=True)\n' +
      ' print(json.dumps({"test_only":True,"form":"D0","txid":"a"*64,"reserve_sats":"500","raw_tx":"0102"}))\n',
      { mode: 0o700 });
    await chmod(fake, 0o700);
    const backend = new CliTestBackend({ python: fake, repository: root,
      wallet: join(root, 'wallet'), artifacts: join(root, 'public'),
      node: 'test-node', source: root, proverCode: root, profile: 'xna',
      manifestSha256: 'f'.repeat(64), getPassword: () => 'TEST-password-1234' });
    assert.equal((await backend.backup(join(root, 'copy'))).operation, 'backup');
    assert.equal((await backend.restore(join(root, 'copy'))).operation, 'restore');
    assert.equal((await backend.funding({ amountSats: 500n })).amount_sats, '500');
    const stages = [];
    const result = await backend.transact({ kind: 'deposit', amountSats: 500n,
      onProgress: (event) => stages.push(event.stage) });
    assert.equal(result.raw_tx, '0102');
    assert.deepEqual(stages, ['prove']);
    await assert.rejects(backend.transact({ kind: 'transfer',
      recipients: [{ domain: '1'.repeat(64), asset_id: '2'.repeat(64),
        owner: 'ff'.repeat(32), view_pub: '4'.repeat(64) }],
      splitSats: ['500'] }), /noncanonical/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('concurrent requests from one JS wallet never prove against the same local job slot', async () => {
  let active = 0;
  let maximum = 0;
  const backend = {
    profile: 'xna', scan: async () => ({}),
    transact: async () => {
      active++;
      maximum = Math.max(maximum, active);
      await new Promise(resolve => setTimeout(resolve, 15));
      active--;
      return { test_only: true, form: 'D0', txid: TXID, reserve_sats: '500' };
    }
  };
  const wallet = new NeuraiPrivacy({ rpc: rpcGenesis, backend });
  await Promise.all([
    wallet.deposit({ amountSats: '500' }),
    wallet.deposit({ amountSats: '500' }),
    wallet.deposit({ amountSats: '500' })
  ]);
  assert.equal(maximum, 1);
});

test('a persistent state conflict stops after the configured rebuild budget', async () => {
  let attempts = 0;
  const backend = { profile: 'xna', scan: async () => ({}),
    transact: async () => { attempts++; throw new Error('txn-mempool-conflict'); } };
  const wallet = new NeuraiPrivacy({ rpc: rpcGenesis, backend });
  await assert.rejects(wallet.deposit({ amountSats: 500n, maxRebuilds: 2 }),
    /txn-mempool-conflict/);
  assert.equal(attempts, 3);
  await assert.rejects(wallet.deposit({ amountSats: 500n, maxRebuilds: 0 }),
    /txn-mempool-conflict/);
  assert.equal(attempts, 4);
});

test('transaction status resolves confirmed height from the block header', async () => {
  const blockhash = 'c'.repeat(64);
  const rpc = async (method) => {
    if (method === 'getblockhash') return RESET_TESTNET_GENESIS;
    if (method === 'getrawtransaction') return { txid: TXID, confirmations: 3, blockhash };
    if (method === 'getblockheader') return { height: 3210 };
    throw new Error(method);
  };
  const wallet = new NeuraiPrivacy({ rpc, backend: {
    scan: async () => ({}), transact: async () => ({})
  } });
  assert.deepEqual(await wallet.transactionStatus(TXID), {
    txid: TXID, state: 'confirmed', confirmations: 3, height: 3210, blockhash
  });
});

test('local vault creation and encrypted recovery work while the node is offline', async () => {
  const calls = [];
  const backend = {
    scan: async () => ({}), transact: async () => ({}),
    init: async () => { calls.push('init'); return { created: 'wallet', test_only: true }; },
    backup: async () => { calls.push('backup'); return { operation: 'backup', test_only: true }; },
    restore: async () => { calls.push('restore'); return { operation: 'restore', test_only: true }; }
  };
  const wallet = new NeuraiPrivacy({
    rpc: async () => { throw new Error('node unavailable'); }, backend
  });
  await wallet.createWallet();
  await wallet.backupWallet('backup.enc');
  await wallet.restoreWallet('backup.enc');
  assert.deepEqual(calls, ['init', 'backup', 'restore']);
  await assert.rejects(wallet.deposit({ amountUnits: 1 }), /node unavailable/);
});


test('scan refuses a different RPC branch and malformed scanner checkpoints', async () => {
  const scanned = 'c'.repeat(64);
  let rpcBlock = scanned;
  let checkpoint = { test_only: true, height: 120, blockhash: scanned,
    balance_sats: '100', reserve_sats: '100', owned_notes: [], history: [] };
  const rpc = async (method, params) => {
    if (method === 'getblockhash' && params[0] === 0) return RESET_TESTNET_GENESIS;
    if (method === 'getblockhash' && params[0] === 120) return rpcBlock;
    throw new Error('unexpected RPC request: ' + method);
  };
  const backend = { profile: 'xna', scan: async () => checkpoint, transact: async () => ({}) };
  const wallet = new NeuraiPrivacy({ rpc, backend });
  assert.equal((await wallet.scan()).height, 120);
  rpcBlock = 'd'.repeat(64);
  await assert.rejects(wallet.scan(), /disagree at scanned height/);
  checkpoint = { ...checkpoint, height: -1 };
  await assert.rejects(wallet.scan(), /invalid TEST wallet scan block/);
  checkpoint = { ...checkpoint, height: 120, blockhash: '00' };
  await assert.rejects(wallet.scan(), /invalid TEST wallet scan block/);
});

test('recipient descriptor rejects noncanonical owner before transfer', async () => {
  const field = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
  const valid = { domain: '1'.repeat(64), asset_id: '2'.repeat(64),
    owner: (field - 1n).toString(16).padStart(64, '0'), view_pub: '4'.repeat(64) };
  const backend = { profile: 'xna', scan: async () => ({}), transact: async () => ({}),
    recipient: async () => valid };
  const wallet = new NeuraiPrivacy({ rpc: rpcGenesis, backend });
  assert.deepEqual(await wallet.recipient(), valid);
  backend.recipient = async () => ({ ...valid, owner: field.toString(16).padStart(64, '0') });
  await assert.rejects(wallet.recipient(), /noncanonical/);
  backend.recipient = async () => ({ ...valid, owner: 'ff'.repeat(32) });
  await assert.rejects(wallet.recipient(), /noncanonical/);
  backend.recipient = async () => ({ ...valid, owner: '00'.repeat(32) });
  await assert.rejects(wallet.recipient(), /noncanonical/);
});
