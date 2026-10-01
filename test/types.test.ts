import {
  CliTestBackend, NeuraiPrivacy, BrowserTestIdentity, type NeuraiRpc, type RecipientDescriptor
} from '../src/index.js';
import { scanBrowserPool, type BrowserPoolManifest } from '../src/browser.js';

const rpc: NeuraiRpc = async () => '0'.repeat(64);
const backend = new CliTestBackend({
  repository: '/tmp/source',
  wallet: '/tmp/wallet',
  artifacts: '/tmp/artifacts',
  node: 'test-node',
  getPassword: async () => Buffer.from('long-test-password')
});
const wallet = new NeuraiPrivacy({ rpc, backend });
const recipient: RecipientDescriptor = {
  domain: '1'.repeat(64),
  asset_id: '2'.repeat(64),
  owner: '3'.repeat(64),
  view_pub: '4'.repeat(64)
};
async function compileOnly(): Promise<void> {
  const balance = await wallet.scan();
  const units: bigint = balance.balanceAtomic;
  await wallet.transfer({ recipients: [recipient] });
  await wallet.deposit({ amountUnits: 1 });
  await wallet.withdraw({ recipient: 'test-transparent-address' });
  const xna = new NeuraiPrivacy({ rpc, backend: new CliTestBackend({
    repository: '/tmp/source', wallet: '/tmp/xna', artifacts: '/tmp/xna-artifacts',
    node: 'test-node', profile: 'xna', manifestSha256: 'f'.repeat(64),
    getPassword: () => 'long-test-password'
  }) });
  await xna.deposit({ amountSats: 1_000_000_000_000_000n });
  await xna.transfer({ recipients: [recipient, recipient],
    splitSats: [600_000_000_000_000n, 400_000_000_000_000n] });
  const manifest: BrowserPoolManifest = {
    profile: 'xna', genesis: 'a'.repeat(64), commitment: 'b'.repeat(64),
    reserveCommitment: 'c'.repeat(64), domain: 'd'.repeat(64), assetId: 'e'.repeat(64),
    vkHashes: { D0: '1'.repeat(64), D1: '2'.repeat(64), T1: '3'.repeat(64),
      T2: '4'.repeat(64), W_partial: '5'.repeat(64), W_full: '6'.repeat(64) }
  };
  const browserScan = await scanBrowserPool({ rpc, manifest });
  const browserBalance: bigint = browserScan.balanceAtomic;
  void browserBalance;
  void units;
}
void compileOnly;

import { ZkWalletIdentity, decodeNzkAddress, parseRecipient, type NzkPoolScope, type NzkAddressRef } from '../src/browser.js';
async function zkCompileOnly() {
  const scope: NzkPoolScope = { network: 'testnet', domain: '00'.repeat(32), assetId: '11'.repeat(32) };
  const wallet = await ZkWalletIdentity.fromMnemonic({ family: 'legacy', mnemonic: 'words', passphrase: '', zkPassphrase: '',
    account: 0, domain: scope.domain, assetId: scope.assetId, network: scope.network, gap: 20 });
  const address: string = wallet.addressAt(0, wallet.currentIndex());
  const descriptor: RecipientDescriptor = decodeNzkAddress(address, scope);
  const again: RecipientDescriptor = parseRecipient(JSON.stringify(descriptor), scope);
  const fromObject: RecipientDescriptor = parseRecipient(descriptor, scope);
  // @ts-expect-error A numeric recipient is never a descriptor.
  parseRecipient(42, scope);
  void fromObject;
  const found = wallet.scanRecords([]);
  const where: NzkAddressRef | undefined = found[0]?.address;
  const scan = await scanBrowserPool({ rpc, manifest: {} as BrowserPoolManifest, identity: wallet, strategy: 'spent-index' });
  const noteAddress: NzkAddressRef | undefined = scan.notes[0]?.address;
  void again; void where; void noteAddress; wallet.lock();
}
void zkCompileOnly;

import { PoolWorkerClient, confirmedPoolCoins, selectPoolCoins, publishTransaction, rotationStorageKey, loadRotation,
  C3_TESTNET_MANIFEST, C3_TESTNET_ARTIFACTS, type PoolRpc, type ReceivingInfo, type PreparedPoolTransaction } from '../src/client.js';
import { startPoolWorker, planC3Operation, loadVerifiedArtifact, type SnarkjsLike } from '../src/worker.js';
async function poolCompileOnly(identity: BrowserTestIdentity, worker: { postMessage(m: unknown): void; onmessage: ((e: { data: any }) => void) | null }, snarkjs: SnarkjsLike) {
  const poolRpc: PoolRpc = async () => null;
  const client = new PoolWorkerClient({ worker, rpc: poolRpc, onStage: (m: string) => void m });
  const derived = await client.derive({ family: 'legacy', mnemonic: 'words', zkPassphrase: '', account: 0 });
  const receiving: ReceivingInfo = derived.addresses;
  const coins = await confirmedPoolCoins(poolRpc, [], { baseCurrency: 'XNA' });
  const { sponsor } = selectPoolCoins(coins, { action: 'transfer', amountAtomic: 1n, feeAtomic: 1n });
  const prepared: PreparedPoolTransaction = await client.prepare({ action: 'transfer', amountAtomic: '1', feeAtomic: '1', sponsor, note: 'cm', recipient: receiving.current.address });
  const txid: string = await publishTransaction(poolRpc, C3_TESTNET_MANIFEST, { raw: prepared.raw, txid: 'x', points: prepared.inputPoints });
  const key = rotationStorageKey({ network: 'testnet', derivation: 'NeuraiZK/v2', family: 'legacy', storageId: 'ab'.repeat(32), account: 0 });
  const state = loadRotation(null, key);
  startPoolWorker({ scope: { postMessage() {}, onmessage: null }, snarkjs, artifactBaseUrl: 'https://example.test/' }).stop();
  const zkey = await loadVerifiedArtifact({ path: 'a', artifacts: C3_TESTNET_ARTIFACTS, fetchArtifact: p => fetch(p) });
  const file = new File([zkey], 'final.zkey');
  const opened = identity.openRecord(zkey, zkey);
  const nf: Uint8Array = opened.nf;
  void planC3Operation; void txid; void state; void file; void nf;
}
void poolCompileOnly;

// Family selection is mandatory at both identity and worker boundaries.
function rejectedV2Calls(client: PoolWorkerClient) {
  // @ts-expect-error Missing explicit family.
  client.derive({ mnemonic: 'words' });
  // @ts-expect-error AuthScript is not a transparent wallet family.
  client.derive({ mnemonic: 'words', family: 'authscript' });
  // @ts-expect-error Missing explicit family.
  ZkWalletIdentity.fromRoot({ root: new Uint8Array(64), account: 0, domain: '', assetId: '', network: 'testnet' });
}
