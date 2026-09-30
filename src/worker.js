/* Worker entry: import it only inside a dedicated Web Worker that holds the private data. */
export { startPoolWorker } from './pool-worker.js';
export { summarizeScan, describeReceiving, planC3Operation, loadVerifiedArtifact, proveC3, buildC3Transaction,
  MAX_ARTIFACT_BYTES } from './pool-operations.js';
