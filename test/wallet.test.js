import assert from 'node:assert/strict';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { CliTestBackend, NeuraiPrivacy, RESET_TESTNET_GENESIS } from '../src/index.js';

const ADDRESS = 'a'.repeat(64);
const DEST = {
  domain: '1'.repeat(64),
  asset_id: '2'.repeat(64),
  owner: '1'.repeat(64),
  view_pub: '4'.repeat(64)
};

test('RPC genesis gates private actions and keeps atomic balances exact', async () => {
  const calls = [];
  let genesis = RESET_TESTNET_GENESIS;
  const rpc = async (method, params) => {
    calls.push([method, params]);
    if (method === 'getblockhash') return genesis;
    if (method === 'getblockcount') return 2212;
    if (method === 'getbestblockhash') return ADDRESS;
    if (method === 'getrawtransaction') return { txid: params[0] };
    throw new Error('unexpected method');
  };
  const backend = {
    init: async () => ({ created: 'wallet', test_only: true }),
    recipient: async () => DEST,
    scan: async () => ({ test_only: true, balance_units: 2,
      reserve_amount: 3 }),
    transact: async (input) => {
      calls.push(['transact', input]);
      return { test_only: true, form: 'D0', txid: ADDRESS };
    }
  };
  const wallet = new NeuraiPrivacy({ rpc, backend });
  assert.deepEqual(await wallet.networkStatus(), { height: 2212, blockhash: ADDRESS });
  assert.equal((await wallet.scan()).balanceAtomic, 2n);
  assert.equal((await wallet.scan()).reserveAtomic, 3n);
  assert.deepEqual(await wallet.recipient(), DEST);
  assert.equal((await wallet.deposit({ amountUnits: 1 })).txid, ADDRESS);
  assert.equal((await wallet.transaction(ADDRESS)).txid, ADDRESS);
  assert.equal(calls.find((item) => item[0] === 'transact')[1].broadcast, false);
  genesis = '0'.repeat(64);
  await assert.rejects(wallet.withdraw({ broadcast: true }), /unexpected Neurai genesis/);
  assert.equal(calls.filter((item) => item[0] === 'transact').length, 1);
});

test('unsafe or invalid external balance is rejected', async () => {
  const backend = { init() {}, recipient() {}, transact() {},
    scan: async () => ({ test_only: true, balance_units: Number.MAX_SAFE_INTEGER + 1,
      reserve_amount: 0 }) };
  const wallet = new NeuraiPrivacy({
    rpc: async () => RESET_TESTNET_GENESIS, backend
  });
  await assert.rejects(wallet.scan(), /invalid or unsafe/);
});

test('CLI bridge keeps password off argv and cleans recipient descriptor files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'neurai-privacy-test-'));
  try {
    const fake = join(root, 'fake-python');
    await writeFile(fake, '#!/usr/bin/env python3\n' +
      'import json,sys\n' +
      'a=sys.argv[1:]\n' +
      'assert a[:2]==["-m","contrib.nip045_wallet.cli"]\n' +
      'assert "TEST-password-1234" not in a\n' +
      'assert sys.stdin.readline().strip()=="TEST-password-1234"\n' +
      'cmd=a[2]\n' +
      'if cmd=="recipient": print(json.dumps({"domain":"1"*64,"asset_id":"2"*64,"owner":"1"*64,"view_pub":"4"*64}))\n' +
      'elif cmd=="init": print(json.dumps({"test_only":True,"created":"wallet"}))\n' +
      'elif cmd=="scan": print(json.dumps({"test_only":True,"height":100,"blockhash":"a"*64,"balance_units":0,"reserve_amount":0}))\n' +
      'else:\n' +
      '  i=a.index("--shield-recipient") if "--shield-recipient" in a else -1\n' +
      '  path=a[i+1] if i>=0 else None\n' +
      '  if path: assert json.load(open(path))["owner"]=="1"*64\n' +
      '  print(json.dumps({"test_only":True,"form":"T1","txid":"a"*64,"descriptor_path":path}))\n',
      { mode: 0o700 });
    await chmod(fake, 0o700);
    const backend = new CliTestBackend({
      python: fake, repository: root, wallet: join(root, 'wallet'),
      artifacts: join(root, 'public'), node: 'test-node',
      source: root, proverCode: root,
      getPassword: () => Buffer.from('TEST-password-1234')
    });
    assert.deepEqual(await backend.recipient(), DEST);
    assert.equal((await backend.init()).test_only, true);
    assert.equal((await backend.scan()).balance_units, 0);
    const result = await backend.transact({
      kind: 'transfer', recipients: [DEST], broadcast: true
    });
    assert.equal(result.form, 'T1');
    assert.equal(existsSync(result.descriptor_path), false);
    await assert.rejects(backend.transact({ kind: 'transfer', recipients: [],
      broadcast: true }), /one or two/);
    await assert.rejects(backend.transact({ kind: 'deposit', amountUnits: 3 }),
      /1 or 2 atomic/);
    await assert.rejects(backend.transact({ kind: 'withdraw', mine: true }),
      /requires broadcast/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('XNA TEST backend passes exact satoshis and a pinned manifest to the CLI', async () => {
  const root = await mkdtemp(join(tmpdir(), 'neurai-privacy-xna-'));
  try {
    const fake = join(root, 'fake-python');
    await writeFile(fake, '#!/usr/bin/env python3\n' +
      'import json,sys\n' +
      'a=sys.argv[1:]\n' +
      'assert a[a.index("--profile")+1]=="xna"\n' +
      'assert a[a.index("--manifest-sha256")+1]=="f"*64\n' +
      'assert sys.stdin.readline().strip()=="TEST-password-1234"\n' +
      'cmd=a[2]\n' +
      'if cmd=="scan": print(json.dumps({"test_only":True,"height":100,"blockhash":"a"*64,"balance_sats":"1000000000000000","reserve_sats":"1000000000000000"}))\n' +
      'else:\n' +
      '  kind=a[a.index("--kind")+1]\n' +
      '  if kind=="deposit":\n' +
      '    assert a[a.index("--amount-sats")+1] in ("1000000000000000","100000000000")\n' +
      '    form="D0"\n' +
      '  elif kind=="transfer":\n' +
      '    assert [a[i+1] for i,x in enumerate(a) if x=="--split-sats"]==["60000000000","40000000000"]\n' +
      '    assert a.count("--shield-recipient")==2\n' +
      '    form="T2"\n' +
      '  else: raise AssertionError(kind)\n' +
      '  print(json.dumps({"test_only":True,"form":form,"txid":"a"*64,"reserve_sats":"0"}))\n',
      { mode: 0o700 });
    await chmod(fake, 0o700);
    const backend = new CliTestBackend({
      python: fake, repository: root, wallet: join(root, 'wallet'),
      artifacts: join(root, 'public'), node: 'test-node',
      source: root, proverCode: root, profile: 'xna',
      manifestSha256: 'f'.repeat(64),
      getPassword: () => 'TEST-password-1234'
    });
    const wallet = new NeuraiPrivacy({
      rpc: async (method, params) => method === 'getblockhash' ? (params[0] === 0 ? RESET_TESTNET_GENESIS : ADDRESS) : null,
      backend
    });
    assert.equal((await wallet.scan()).balanceAtomic, 1_000_000_000_000_000n);
    assert.equal((await wallet.deposit({
      amountSats: 1_000_000_000_000_000n
    })).form, 'D0');
    await assert.rejects(wallet.deposit({ amountSats: 1_000_000_000_000_000 }),
      /decimal string or bigint/);
    assert.equal((await wallet.deposit({ amountSats: 100_000_000_000n })).form, 'D0');
    const recipient = { domain: '0'.repeat(64), asset_id: '1'.repeat(64),
      owner: '2'.repeat(64), view_pub: '3'.repeat(64) };
    assert.equal((await wallet.transfer({ recipients: [recipient, recipient],
      splitSats: [60_000_000_000n, 40_000_000_000n] })).form, 'T2');
    assert.equal((await backend.transact({ kind: 'deposit',
      amountSats: '1000000000000000', noteCm: '123456789012345678901234567890' })).form, 'D0');
    assert.throws(() => new CliTestBackend({ repository: root, wallet: root,
      artifacts: root, node: 'test', profile: 'xna', getPassword: () => 'password123456' }),
      /manifestSha256/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
