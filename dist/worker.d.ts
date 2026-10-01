import type { BrowserTestIdentity, ZkWalletIdentity, NzkNetwork, RecipientDescriptor } from './index.js';
import type { BrowserPoolScan, C4Manifest, C4Form, C4Prepared } from './browser.js';
import type { C4ArtifactList, PoolAction, ReceivingInfo, ScanSummary, PoolPrepareRequest, PreparedPoolTransaction } from './client.js';

export interface Groth16Proof { pi_a: string[]; pi_b: string[][]; pi_c: string[] }
/** The parts of snarkjs the worker uses; injected so this package does not depend on it. */
export interface SnarkjsLike {
  wtns: { calculate(input: Record<string, unknown>, wasm: Uint8Array, witness: { type: 'mem' }): Promise<void> };
  groth16: {
    prove(zkey: Uint8Array, witness: { type: 'mem' }, logger?: unknown, options?: { singleThread?: boolean }): Promise<{ proof: Groth16Proof; publicSignals: string[] }>;
    verify(vk: unknown, publicSignals: string[], proof: Groth16Proof): Promise<boolean>;
  };
}
/** The worker global scope; startPoolWorker installs its own onmessage handler. */
export interface PoolWorkerScope {
  postMessage(message: unknown): void;
  onmessage: unknown;
  navigator?: unknown;
  Worker?: unknown;
}
export declare function startPoolWorker(options: {
  scope?: PoolWorkerScope; snarkjs?: SnarkjsLike; artifactBaseUrl?: string | URL;
  fetchArtifact?: (path: string) => Promise<Response>;
  /** Defaults to the bundled C4 TEST instance. A supplied manifest also needs `expectedCommitment`. */
  manifest?: C4Manifest; artifacts?: C4ArtifactList;
  network?: NzkNetwork; singleThread?: boolean; missingArtifactMessage?: string;
  /** Largest deposit this application builds, in satoshis. Defaults to the money range. */
  depositLimitAtomic?: bigint;
  expectedGenesis?: string; expectedCommitment?: string; maxArtifactBytes?: number;
}): { stop(): void };

export declare const MAX_ARTIFACT_BYTES: number;
export declare function summarizeScan(scan: BrowserPoolScan): ScanSummary;
export declare function describeReceiving(identity: BrowserTestIdentity | ZkWalletIdentity, scan: BrowserPoolScan | null | undefined,
  options: { network: NzkNetwork }): ReceivingInfo;
export declare function planC4Operation(options: {
  identity: BrowserTestIdentity | ZkWalletIdentity; scan: BrowserPoolScan; action: PoolAction;
  amountAtomic?: string | bigint; note?: string; recipient?: string | RecipientDescriptor;
  recipients?: Array<{ recipient: string | RecipientDescriptor; amountAtomic: string }>;
  pool: { network: NzkNetwork; domain: string; assetId: string }; depositLimitAtomic?: bigint;
}): { form: C4Form; created: Array<{ note: Uint8Array; cm: Uint8Array; record: Uint8Array }>; consumed?: BrowserPoolScan['notes'][number]; amountAtomic: string };
export declare function loadVerifiedArtifact(options: {
  path: string; artifacts: Pick<C4ArtifactList, 'files'>; fetchArtifact: (path: string) => Promise<Response>;
  onProgress?: (percent: number) => void; maxBytes?: number; missingMessage?: string;
}): Promise<Uint8Array<ArrayBuffer>>;
export declare function proveC4(options: {
  form: C4Form; prepared: C4Prepared; artifacts: Pick<C4ArtifactList, 'forms'>; loadArtifact: (path: string) => Promise<Uint8Array>;
  snarkjs: SnarkjsLike; onStage?: (message: string) => void;
}): Promise<{ proof: Groth16Proof; publicSignals: string[] }>;
export declare function buildC4Transaction(options: {
  identity: BrowserTestIdentity | ZkWalletIdentity; scan: BrowserPoolScan; manifest: C4Manifest; artifacts: C4ArtifactList;
  loadArtifact: (path: string) => Promise<Uint8Array>; snarkjs: SnarkjsLike;
  pool: { network: NzkNetwork; domain: string; assetId: string }; request: PoolPrepareRequest;
  expectedGenesis?: string; expectedCommitment: string; depositLimitAtomic?: bigint; onStage?: (message: string) => void;
}): Promise<PreparedPoolTransaction>;
export type { RecipientDescriptor };
