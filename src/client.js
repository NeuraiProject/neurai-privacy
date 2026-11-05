/* Main-thread entry: public data only, no private keys or notes. Safe to load in any page. */
export { createWalletServiceRpc } from './wallet-service-rpc.js';
export { ATOMIC_PER_XNA, MAX_ATOMIC, rpcAmountToSatoshis, parseXna, formatXna } from './amounts.js';
export { LEGACY_P2PKH, POOL_READ_RPC_METHODS, isPoolReadRpc, assertPoolChain, confirmedPoolCoins, checkPoolCoin,
  withdrawalScript, recheckInputs, admitTransaction, inspectFundingTransaction, publishTransaction,
  publicationStatus } from './pool-client.js';
export { validateC7Deployment, c7Intent } from './c7-deployment.js';
export { IndexedDbJournalStore } from './journal-store.js';
export { C7WorkerClient } from './c7-worker-client.js';

// Deprecated names, kept for one release: they are the same objects as their C7 names.
export { IndexedDbJournalStore as IndexedDbSponsorStore } from './journal-store.js';
export { C7WorkerClient as C6WorkerClient } from './c7-worker-client.js';
