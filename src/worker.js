/* Worker entry: import it only inside a dedicated Web Worker that holds the private data. */
export { startPoolWorker } from './pool-worker.js';
export { summarizeScan, describeReceiving, planC4Operation, loadVerifiedArtifact, proveC4, buildC4Transaction,
  MAX_ARTIFACT_BYTES } from './pool-operations.js';
