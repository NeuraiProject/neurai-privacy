import type { BrowserTestIdentity, ZkWalletIdentity, NzkNetwork, RecipientDescriptor } from './index.js';
import type { BrowserPoolScan, C3Manifest, C3Form, C3Prepared, C4Manifest, C4Form, C4Prepared } from './browser.js';
import type { C3ArtifactList, C4ArtifactList, ReceivingInfo, ScanSummary, PoolPrepareRequest, PreparedPoolTransaction } from './client.js';

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
  fetchArtifact?: (path: string) => Promise<Response>; manifest?: C3Manifest | C4Manifest; artifacts?: C3ArtifactList | C4ArtifactList;
  network?: NzkNetwork; singleThread?: boolean; missingArtifactMessage?: string;
  /** Largest deposit this application builds, in satoshis. Defaults to the money range. */
  depositLimitAtomic?: bigint;
  expectedGenesis?: string; expectedCommitment?: string; maxArtifactBytes?: number;
}): { stop(): void };

export declare const MAX_ARTIFACT_BYTES: number;
export declare function summarizeScan(scan: BrowserPoolScan): ScanSummary;
export declare function describeReceiving(identity: BrowserTestIdentity | ZkWalletIdentity, scan: BrowserPoolScan | null | undefined,
  options: { network: NzkNetwork }): ReceivingInfo;
export declare function planC3Operation(options: {
  identity: BrowserTestIdentity | ZkWalletIdentity; scan: BrowserPoolScan; action: 'deposit' | 'transfer' | 'withdraw';
  amountAtomic?: string | bigint; note?: string; recipient?: string;
  pool: { network: NzkNetwork; domain: string; assetId: string }; depositLimitAtomic?: bigint;
}): { form: C3Form; created: Array<{ note: Uint8Array; cm: Uint8Array; record: Uint8Array }>; consumed?: BrowserPoolScan['notes'][number]; amountAtomic: string };
export declare function loadVerifiedArtifact(options: {
  path: string; artifacts: C3ArtifactList; fetchArtifact: (path: string) => Promise<Response>;
  onProgress?: (percent: number) => void; maxBytes?: number; missingMessage?: string;
}): Promise<Uint8Array<ArrayBuffer>>;
export declare function proveC3(options: {
  form: C4Form; prepared: C3Prepared | C4Prepared; artifacts: C3ArtifactList; loadArtifact: (path: string) => Promise<Uint8Array>;
  snarkjs: SnarkjsLike; onStage?: (message: string) => void;
}): Promise<{ proof: Groth16Proof; publicSignals: string[] }>;
export declare function buildC3Transaction(options: {
  identity: BrowserTestIdentity | ZkWalletIdentity; scan: BrowserPoolScan; manifest: C3Manifest; artifacts: C3ArtifactList;
  loadArtifact: (path: string) => Promise<Uint8Array>; snarkjs: SnarkjsLike;
  pool: { network: NzkNetwork; domain: string; assetId: string }; request: PoolPrepareRequest;
  depositLimitAtomic?: bigint; onStage?: (message: string) => void;
}): Promise<PreparedPoolTransaction>;
export type { RecipientDescriptor };

export declare function planC4Operation(options: Parameters<typeof planC3Operation>[0] & {
  recipients?: Array<{recipient:string | RecipientDescriptor;amountAtomic:string}>;
}): Omit<ReturnType<typeof planC3Operation>, 'form'> & {form:C4Form};
export declare function buildC4Transaction(options: Omit<Parameters<typeof buildC3Transaction>[0], 'manifest' | 'artifacts'> & {
  manifest:C4Manifest; artifacts:C4ArtifactList; expectedGenesis?:string; expectedCommitment:string;
}):Promise<PreparedPoolTransaction>;
