/* Main-thread entry: public hashes only, no private data. Safe to load in any page. */
export { ATOMIC_PER_XNA, MAX_ATOMIC, rpcAmountToSatoshis, parseXna, formatXna } from './amounts.js';
export { LEGACY_P2PKH, MIN_SPONSOR_CHANGE_ATOMIC, POOL_READ_RPC_METHODS, isPoolReadRpc, assertPoolChain, confirmedPoolCoins,
  selectPoolCoins, checkPoolCoin, withdrawalScript, recheckInputs, admitTransaction, inspectFundingTransaction,
  publishTransaction, publicationStatus } from './pool-client.js';
export { ROTATION_MAX_GAP, rotationStorageKey, loadRotation, saveRotation } from './rotation-store.js';
export { C4_TESTNET_NETWORK, C4_TESTNET_COMMITMENT, C4_TESTNET_MANIFEST, C4_TESTNET_ARTIFACTS } from './c4-testnet.js';
export { PoolWorkerClient } from './pool-worker-client.js';

// Opt-in C6 TEST sponsor management; C4/C5 signing defaults are unchanged.
export { SponsorJournal } from './sponsor-journal.js';
export { IndexedDbSponsorStore } from './sponsor-store.js';
export { prepareSponsorSweep, validateSponsorSignature } from './sponsor-sweep.js';

export { C6SponsorFlow } from './c6-sponsor-flow.js';
export { c6SponsorIntent, scanC6SponsorChain, validateC6SponsorDeployment } from './c6-sponsor-chain.js';

export {C6WorkerClient} from './c6-worker-client.js';

export {c6AssetMetadata,c6AssetTransferScript,c6ReadAssetTransfer,parseAssetAmount} from './c6-assets.js';
