/* Worker entry: import it only inside a dedicated Web Worker that holds the private data. */
export { startC7PoolWorker } from './c7-worker.js';
export { describeReceiving } from './c7-wallet.js';
export { loadVerifiedArtifact, MAX_ARTIFACT_BYTES } from './artifacts.js';
export { createC7JoinWallet } from './c7-join.js';
export { createC7OperationWallet } from './c7-operations.js';
export { scanC7Pool } from './c7-scan.js';
export { readC7Packet, buildC7Transaction } from './c7-transaction.js';

// Deprecated names, kept for one release: they are the same functions as their C7 names.
export { startC7PoolWorker as startC6PoolWorker } from './c7-worker.js';
export { createC7JoinWallet as createC6JoinWallet } from './c7-join.js';
export { createC7OperationWallet as createC6OperationWallet } from './c7-operations.js';
export { scanC7Pool as scanC6Pool } from './c7-scan.js';
export { readC7Packet as readC6Packet, buildC7Transaction as buildC6Transaction } from './c7-transaction.js';
