import {
  C7WalletIdentity, C7_PROFILE, decodeC7Address, type RecipientDescriptor, type NzkPoolScope, type NzkAddressRef, type C7Descriptor,
} from '../src/index.js';
import { createWalletServiceRpc, type WalletServiceHello, type WalletServiceReply, type PoolRpc } from '../src/client.js';
import { C7WorkerClient, C6WorkerClient, IndexedDbJournalStore, IndexedDbSponsorStore, confirmedPoolCoins, publishTransaction,
  validateC7Deployment, c7Intent, type ReceivingInfo, type C7Deployment, type JournalStore } from '../src/client.js';
import { startC7PoolWorker, scanC7Pool, buildC7Transaction, readC7Packet, describeReceiving, loadVerifiedArtifact,
  createC7OperationWallet, type SnarkjsLike, type C7PoolManifest, type C7PoolScan, type C6PoolScan } from '../src/worker.js';

const serviceHello: WalletServiceHello = {protocol: 'wss/2', exact_amounts: true, genesis_hash: 'a'.repeat(64),
  wallet_rpc: {methods: ['getblock'], amounts: 'rpc-native-units', numeric_encoding: 'safe-number-or-string'}};
const serviceRpc: PoolRpc = createWalletServiceRpc({hello: serviceHello, expectedGenesis: 'a'.repeat(64),
  request: async (_method, _params): Promise<WalletServiceReply> => ({result: null})});
// @ts-expect-error The expected chain must be independently pinned.
createWalletServiceRpc({hello: serviceHello, request: async () => ({result: null})});
void serviceRpc;

async function c7CompileOnly(deployment: C7Deployment, manifest: C7PoolManifest, snarkjs: SnarkjsLike, worker: Worker) {
  const scope: NzkPoolScope = { network: 'testnet', domain: '00'.repeat(32), assetId: '11'.repeat(32) };
  const identity = await C7WalletIdentity.fromMnemonic({ family: 'legacy', mnemonic: 'words', passphrase: '', zkPassphrase: '',
    account: 0, domain: scope.domain, assetId: scope.assetId, network: scope.network });
  const address: string = identity.addressAt(0, identity.currentIndex());
  const descriptor: C7Descriptor = decodeC7Address(address, scope);
  const plain: RecipientDescriptor = descriptor;
  const scan: C7PoolScan = await scanC7Pool({ rpc: serviceRpc, deployment: validateC7Deployment(deployment), identity, strategy: 'spent-index' });
  const old: C6PoolScan = scan;
  const where: NzkAddressRef | undefined = scan.notes[0]?.address;
  const receiving: ReceivingInfo = describeReceiving(identity, scan);
  const wallet = createC7OperationWallet({ expectedGenesis: manifest.network, expectedCommitment: manifest.commitment });
  const plan = identity.prepareC7Transfer(wallet, { manifest, fee: '10000000', consumed: scan.notes[0]!, operation: 'T1',
    outputs: [{ isChange: true, amountAtomic: '1' }] });
  const proved = await wallet.prove(plan, { api: snarkjs, wasm: new Uint8Array(), zkey: new Uint8Array(), vk: {} });
  const built = buildC7Transaction({ packet: proved.packet, scan, manifest, deployment });
  const intent: string = c7Intent(built.raw, deployment).operationId;
  if (readC7Packet(proved.packet, { manifest }).operation !== 'T1') throw new Error('operation');
  // @ts-expect-error The scanner needs a C7 wallet identity.
  await scanC7Pool({ rpc: serviceRpc, deployment, identity: {} });
  const store: JournalStore = new IndexedDbJournalStore({ name: 'neurai-c7-private-journal-v1' });
  const legacyStore: IndexedDbJournalStore = new IndexedDbSponsorStore();
  const client = new C7WorkerClient({ worker, rpc: serviceRpc, store });
  const legacyClient: C6WorkerClient = client;
  await client.derive({ family: 'ecdsa', mnemonic: 'words' });
  // @ts-expect-error Missing explicit family.
  await client.derive({ mnemonic: 'words' });
  const coins = await confirmedPoolCoins(serviceRpc, [], { baseCurrency: 'XNA' });
  const txid: string = await publishTransaction(serviceRpc, { genesis: 'a'.repeat(64) }, { raw: built.raw, txid: built.txid, points: built.inputPoints });
  const bytes = await loadVerifiedArtifact({ path: 'D.zkey', artifacts: { files: {} }, fetchArtifact: p => fetch(p) });
  startC7PoolWorker({ manifest, deployment, domain: scope.domain, assetId: scope.assetId, expectedGenesis: manifest.network,
    expectedCommitment: manifest.commitment, artifacts: { files: {}, forms: {} as any }, artifactBaseUrl: '/privacy-c7/', reservations: [] }).stop();
  if (manifest.profile !== C7_PROFILE) throw new Error('profile');
  void [plain, old, where, receiving, intent, legacyStore, legacyClient, coins, txid, bytes];
}
void c7CompileOnly;

import './c7-join-types.test.js';
import './c7-operation-types.test.js';
