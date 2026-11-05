import type { C7Descriptor, C7WalletIdentity, NzkAddressRef, NzkNetwork, RecipientDescriptor, C7_PROFILE } from './index.js';
import type { C7Deployment, C7Intent, PoolRpc, ReceivingInfo } from './client.js';

export interface Groth16Proof { pi_a: string[]; pi_b: string[][]; pi_c: string[] }
/** The parts of snarkjs the worker uses; injected so this package does not depend on it. */
export interface SnarkjsLike {
  wtns: { calculate(input: Record<string, unknown>, wasm: Uint8Array, witness: { type: 'mem' }): Promise<void> };
  groth16: {
    prove(zkey: Uint8Array, witness: { type: 'mem' }, logger?: unknown, options?: { singleThread?: boolean }): Promise<{ proof: Groth16Proof; publicSignals: string[] }>;
    verify(vk: unknown, publicSignals: string[], proof: Groth16Proof): Promise<boolean>;
  };
}
/** The worker global scope; startC7PoolWorker installs its own onmessage handler. */
export interface PoolWorkerScope {
  postMessage(message: unknown): void;
  onmessage: unknown;
  navigator?: unknown;
  Worker?: unknown;
}
/** Public proving artifacts of a deployment, pinned by size and SHA-256. */
export interface C7Artifacts {
  files: Record<string, { bytes: number; sha256: string }>;
  forms: Record<'D' | 'T1' | 'T2' | 'T3' | 'W', { wasm: string; zkey: string; vk: string }> & { J2?: { wasm: string; zkey: string; vk: string } };
}

export declare const MAX_ARTIFACT_BYTES: number;
export declare function loadVerifiedArtifact(options: {
  path: string; artifacts: Pick<C7Artifacts, 'files'>; fetchArtifact: (path: string) => Promise<Response>;
  onProgress?: (percent: number) => void; maxBytes?: number; missingMessage?: string;
}): Promise<Uint8Array<ArrayBuffer>>;
/** Public receiving data of a C7 identity. The options argument is ignored. */
export declare function describeReceiving(identity: C7WalletIdentity, scan?: C7PoolScan | null, options?: { network?: NzkNetwork }): ReceivingInfo;

/** J2 manifest fields of a C7 pool. Amounts use exact atomic units. */
export interface C7JoinManifest {
  profile: typeof C7_PROFILE; network: string; commitment: string; context: string;
  fees: { J2: Array<string | number> };
}
export interface C7JoinNote {
  note: Uint8Array; spendSecret: Uint8Array; index: number; path: Uint8Array[];
}
export interface C7JoinRequest {
  manifest: C7JoinManifest; domain: Uint8Array; assetId: Uint8Array; root: Uint8Array;
  notes: [C7JoinNote, C7JoinNote]; fee: string | bigint;
  /** The address of note 0: the joined note goes there. */
  change: C7Descriptor;
}
/** Contains private note witnesses: keep it in a dedicated proving worker. */
export interface C7JoinPrepared {
  input: Record<string, unknown>; publics: string[]; blob: Uint8Array;
  created: { note: Uint8Array; cm: Uint8Array; record: Uint8Array };
  resources: Array<{ cm: string; nf: string }>; network: Uint8Array; pool: Uint8Array;
}
export interface C7ProofResult {
  packet: Uint8Array; packetId: string;
  proof: Groth16Proof; publicSignals: string[];
}
export interface C7JoinWallet {
  prepare(request: C7JoinRequest): C7JoinPrepared;
  /** Application must pin the proving artifacts and VK for this instance.
   * Abort stops local work at checkpoints, not an already published packet. */
  prove(prepared: C7JoinPrepared, options: { api: SnarkjsLike;
    wasm: Uint8Array; zkey: Uint8Array; vk: unknown; stage?: (message: string) => void;
    signal?: AbortSignal }): Promise<C7ProofResult>;
}
export declare function createC7JoinWallet(options: { expectedGenesis: string; expectedCommitment: string; kind?: 'xna' }): C7JoinWallet;

/** D/T1-T3/W manifest fields of a C7 pool, with independent instance pins. */
export interface C7OperationManifest extends Omit<C7JoinManifest, 'fees'> {
  fees: Record<'D' | 'T1' | 'T2' | 'T3' | 'W', Array<string | number>> & { J2?: Array<string | number> };
}
/** The full C7 manifest a worker or a relocation needs. */
export interface C7PoolManifest extends C7OperationManifest {
  identity: string; vks: Record<string, string>; vk_sha256: Record<string, string>;
}
export interface C7OperationContext {
  manifest: C7OperationManifest; domain: Uint8Array; assetId: Uint8Array; fee: string | bigint;
}
export interface C7DepositRequest extends C7OperationContext {
  amountAtomic: string | bigint; recipient: RecipientDescriptor;
  funding: Uint8Array; fundingValue: string | bigint;
}
export interface C7TransferRequest extends C7OperationContext {
  operation: 'T1' | 'T2' | 'T3'; spent: C7JoinNote; root: Uint8Array;
  outputs: Array<{ amountAtomic: string | bigint; recipient?: RecipientDescriptor; isChange?: boolean }>;
  /** The address of the spent note: the change goes there. */
  change: C7Descriptor;
}
export interface C7WithdrawalRequest extends C7OperationContext {
  spent: C7JoinNote; root: Uint8Array; amountAtomic: string | bigint; payoutScript: Uint8Array;
  /** The address of the spent note; needed when the withdrawal leaves change. */
  change?: C7Descriptor;
}
/** Private witness and output plaintexts. Do not send this object to a service. */
export interface C7OperationPrepared {
  operation: 'D' | 'T1' | 'T2' | 'T3' | 'W'; input: Record<string, unknown>; publics: string[];
  created: Array<{ note: Uint8Array; cm: Uint8Array; record: Uint8Array }>;
  blob: Uint8Array; resources: Array<{ cm: string; nf: string }>; payout: Uint8Array; funding: Uint8Array;
  network: Uint8Array; pool: Uint8Array;
}
export interface C7OperationWallet {
  prepareDeposit(request: C7DepositRequest): C7OperationPrepared;
  prepareTransfer(request: C7TransferRequest): C7OperationPrepared;
  prepareWithdrawal(request: C7WithdrawalRequest): C7OperationPrepared;
  prove(prepared: C7OperationPrepared, options: Parameters<C7JoinWallet['prove']>[1]): Promise<C7ProofResult>;
}
export declare function createC7OperationWallet(options: { expectedGenesis: string; expectedCommitment: string; kind?: 'xna' }): C7OperationWallet;

/** Private result: note plaintext and balances belong in the wallet worker. */
export interface C7RecoveredNote {
  note: Uint8Array; cm: Uint8Array; record: Uint8Array; nf: Uint8Array; amountAtomic: string;
  index: number; height: number; txid: string; address?: NzkAddressRef;
  reserved: boolean; spendable: boolean; root: Uint8Array | null; path: Uint8Array[] | null;
}
export interface C7PoolScan {
  profile: typeof C7_PROFILE; genesis: string; commitment: string; tip: { height: number; hash: string };
  statePoint: string; opening: string; notes: C7RecoveredNote[];
  records: Array<{ cm: Uint8Array; record: Uint8Array; index: number; height: number; txid: string }>;
  events: Array<{ form: string; cms: string[]; nfs: string[]; rootIndex: number | null; transcript: string; txid: string; intentId: string }>;
  reserveAtomic: string; reserveScript: string | null; reservePoint: string | null;
  nullifiers: string[]; root: Uint8Array | null; balanceAtomic: string; spendableAtomic: string; ignoredRecords: number;
}
/** Fully validating trusted RPC is required; this scanner does not implement SPV.
 * `auto` (default) reads the state thread in pages with `getprivacypoolupdates`
 * and continues with `getspentinfo` when the node cannot serve them; a node
 * without a spent index falls back to block replay. */
export declare function scanC7Pool(options: { strategy?: 'auto' | 'blocks' | 'spent-index' | 'pool-history'; rpc: PoolRpc;
  deployment: C7Deployment; identity: C7WalletIdentity;
  reserved?: Array<{ cm: string; nf: string }>; signal?: AbortSignal;
  /** Disposable encrypted scan prefix; separate from the operation journal. */
  checkpointStore?: { read: (key: string) => Promise<string | null>; compareAndSwap: (key: string, expected: string | null, replacement: string) => Promise<boolean> };
  /** Pool transitions per `getprivacypoolupdates` page (1 to 1000, default 20; each is about 15–25 kB raw). */
  historyPageLimit?: number;
  onProgress?: (progress: { height: number; target: number; strategy?: 'blocks' | 'spent-index' | 'pool-history'; phase?: 'recovering' | 'verifying' | 'resuming' | 'checkpoint' | 'complete' }) => void }): Promise<C7PoolScan>;

/** C7 TEST proof worker. Persistent reservations are supplied by the application. */
export declare function startC7PoolWorker(options: {
  scope?: PoolWorkerScope | any; snarkjs?: SnarkjsLike; manifest: C7PoolManifest;
  deployment: C7Deployment;
  domain: string; assetId: string; network?: 'testnet' | 'regtest';
  expectedGenesis: string; expectedCommitment: string;
  artifacts: C7Artifacts;
  fetchArtifact?: (path: string) => Promise<Response>; artifactBaseUrl?: string;
  reservations: Array<{ cm: string; nf: string }>; maxArtifactBytes?: number; singleThread?: boolean; buildTransactions?: boolean; durableJournal?: boolean;
}): { stop(): void };

/** Public-only relocation; callers must verify the proof and immutable intent first. */
export interface C7Packet {
  network: Uint8Array; pool: Uint8Array; operation: 'D' | 'T1' | 'T2' | 'T3' | 'W' | 'J2'; publics: Uint8Array[]; proof: Uint8Array;
  publication: Uint8Array; payout: Uint8Array; funding: Uint8Array; cms: Uint8Array[]; nfs: Uint8Array[]; fee: bigint; packetId: string;
}
export interface C7BuiltTransaction {
  raw: string; txid: string; packetId: string; form: string; feeAtomic: string; amountAtomic: string; reserveAtomic: string;
  inputPoints: Array<{ txid: string; vout: number }>; funding: { index: number; point: string; valueAtomic: string; script: string } | null;
  intent: C7Intent; transcript: string;
}
export declare function readC7Packet(packet: Uint8Array, options: { kind?: 'xna'; manifest: C7OperationManifest }): C7Packet;
export declare function buildC7Transaction(options: { packet: Uint8Array; scan: Pick<C7PoolScan, 'events' | 'opening' | 'statePoint' | 'reserveAtomic' | 'reservePoint' | 'reserveScript'>;
  manifest: C7PoolManifest; deployment: C7Deployment; funding?: { point: string; valueAtomic: string; script: string } }): C7BuiltTransaction;

/** Deprecated names, kept for one release: the same functions as their C7 names. */
export {
  startC7PoolWorker as startC6PoolWorker, createC7JoinWallet as createC6JoinWallet, createC7OperationWallet as createC6OperationWallet,
  scanC7Pool as scanC6Pool, readC7Packet as readC6Packet, buildC7Transaction as buildC6Transaction,
};
/** @deprecated Renamed to C7JoinManifest. */ export type C6JoinManifest = C7JoinManifest;
/** @deprecated Renamed to C7JoinNote. */ export type C6JoinNote = C7JoinNote;
/** @deprecated Renamed to C7JoinRequest. */ export type C6JoinRequest = C7JoinRequest;
/** @deprecated Renamed to C7JoinPrepared. */ export type C6JoinPrepared = C7JoinPrepared;
/** @deprecated Renamed to C7ProofResult. */ export type C6JoinResult = C7ProofResult;
/** @deprecated Renamed to C7JoinWallet. */ export type C6JoinWallet = C7JoinWallet;
/** @deprecated Renamed to C7OperationManifest. */ export type C6OperationManifest = C7OperationManifest;
/** @deprecated Renamed to C7OperationContext. */ export type C6OperationContext = C7OperationContext;
/** @deprecated Renamed to C7DepositRequest. */ export type C6DepositRequest = C7DepositRequest;
/** @deprecated Renamed to C7TransferRequest. */ export type C6TransferRequest = C7TransferRequest;
/** @deprecated Renamed to C7WithdrawalRequest. */ export type C6WithdrawalRequest = C7WithdrawalRequest;
/** @deprecated Renamed to C7OperationPrepared. */ export type C6OperationPrepared = C7OperationPrepared;
/** @deprecated Renamed to C7OperationWallet. */ export type C6OperationWallet = C7OperationWallet;
/** @deprecated Renamed to C7RecoveredNote. */ export type C6RecoveredNote = C7RecoveredNote;
/** @deprecated Renamed to C7PoolScan. */ export type C6PoolScan = C7PoolScan;
/** @deprecated Renamed to C7Packet. */ export type C6Packet = C7Packet;
/** @deprecated Renamed to C7BuiltTransaction. */ export type C6BuiltTransaction = C7BuiltTransaction;
