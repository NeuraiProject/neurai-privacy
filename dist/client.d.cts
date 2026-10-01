import type { RecipientDescriptor, NzkAddressRef } from './index.cjs';
import type { C3Manifest, C3Form, C3Coin, C4Form } from './browser.cjs';

/** Same shape as @neuraiproject/neurai-rpc getRPC(...). */
export type PoolRpc = (method: string, params: unknown[]) => Promise<any>;
export type PoolAction = 'deposit' | 'transfer' | 'withdraw';
export interface OutPoint { txid: string; vout: number }

export declare const ATOMIC_PER_XNA: bigint;
export declare const MAX_ATOMIC: bigint;
export declare function rpcAmountToSatoshis(value: unknown): bigint;
export declare function parseXna(text: string, options?: { allowZero?: boolean }): bigint;
export declare function formatXna(satoshis: bigint | number | string): string;

export declare const LEGACY_P2PKH: RegExp;
export declare const MIN_SPONSOR_CHANGE_ATOMIC: bigint;
export declare const POOL_READ_RPC_METHODS: readonly string[];
export declare function isPoolReadRpc(method: string): boolean;
export interface WalletUtxo { txid: string; outputIndex: number; script: string; satoshis: number | string; assetName: string; address?: string }
export interface PoolCoin extends C3Coin { address?: string; [key: string]: unknown }
export declare function assertPoolChain(rpc: PoolRpc, manifest: { genesis: string }): Promise<void>;
export declare function confirmedPoolCoins(rpc: PoolRpc, utxos: WalletUtxo[], options: { baseCurrency: string; profile?: 'C3' | 'C4' }): Promise<PoolCoin[]>;
export declare function selectPoolCoins(coins: PoolCoin[], options: { action: PoolAction; amountAtomic: bigint | string; feeAtomic: bigint | string; profile?: 'C3' | 'C4' }): { funding?: PoolCoin; sponsor: PoolCoin };
export declare function checkPoolCoin(rpc: PoolRpc, coin: PoolCoin, options?: {profile?: 'C3' | 'C4'}): Promise<void>;
export declare function withdrawalScript(rpc: PoolRpc, address: string, options?: {profile?: 'C3' | 'C4'}): Promise<string>;
export declare function recheckInputs(rpc: PoolRpc, manifest: { genesis: string }, points: OutPoint[]): Promise<void>;
export declare function admitTransaction(rpc: PoolRpc, raw: string): Promise<{ txid: string; decoded: any }>;
export declare function inspectFundingTransaction(rpc: PoolRpc, raw: string): Promise<{ txid: string; feeAtomic: bigint; points: OutPoint[] }>;
/** Rejects with `uncertain: true` when the broadcast outcome is unknown. */
export declare function publishTransaction(rpc: PoolRpc, manifest: { genesis: string }, tx: { raw: string; txid: string; points: OutPoint[] },
  options?: { onBroadcast?: (txid: string) => void }): Promise<string>;
export declare function publicationStatus(rpc: PoolRpc, manifest: { genesis: string }, tx: { txid: string; raw?: string; points?: OutPoint[] }): Promise<'confirmed' | 'mempool' | 'retryable'>;

export interface RotationState { gap: number; issued: number }
export interface KeyValueStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export declare const ROTATION_MAX_GAP: number;
export declare function rotationStorageKey(options: { network: string; walletId?: string; derivation: 'NeuraiZK/v2'; family: import('./index.cjs').NzkFamily; storageId: string; account: number }): string;
export declare function loadRotation(storage: KeyValueStorage | null | undefined, key: string): RotationState | null;
export declare function saveRotation(storage: KeyValueStorage | null | undefined, key: string, state: RotationState): boolean;

export interface C3ArtifactList {
  schema: string; id: string; warning: string; snarkjs: string;
  forms: Record<C3Form, { input: string; public: string; vk: string; zkey: string; wasm: string }>;
  files: Record<string, { bytes: number; sha256: string }>;
}
export interface C4ArtifactList extends Omit<C3ArtifactList, 'forms'> {
  forms: Record<C4Form, {input:string;public:string;vk:string;zkey:string;wasm:string}>;
}
export declare const C3_TESTNET_NETWORK: 'testnet';
export declare const C3_TEST_DEPOSIT_LIMIT_ATOMIC: bigint;
export declare const C3_TESTNET_MANIFEST: Readonly<C3Manifest & { genesis: string; address: string; commitment: string; reserveCommitment: string }>;
export declare const C3_TESTNET_ARTIFACTS: Readonly<C3ArtifactList>;

/** Public receiving data of the open identity. */
export interface ReceivingInfo {
  kind: 'file' | 'derived';
  derivation?: 'NeuraiZK/v2'; family?: import('./index.cjs').NzkFamily; storageId?: string;
  fingerprint?: string; account?: number; gap?: number; issued?: number; maxUsed?: number;
  current: { index: number; address: string };
  used: Array<{ index: number; address: string; receivedAtomic: string }>;
}
export interface ScanSummary {
  balanceAtomic: string; reserveAtomic: string; height: number;
  notes: Array<{ cm: string; amountAtomic: string; address: NzkAddressRef | null }>;
  transitions: Array<{ txid: string; form: string; height: number }>;
}
export interface PoolIdentityMessage { type: 'identity'; recipient: RecipientDescriptor; backup: string | null; addresses: ReceivingInfo }
export interface PoolScanMessage { type: 'scan'; result: ScanSummary; recipient: RecipientDescriptor; addresses: ReceivingInfo; checkpoint: string | null }
export interface PoolAddressesMessage { type: 'addresses'; recipient: RecipientDescriptor; addresses: ReceivingInfo }
export interface PoolPrepareRequest {
  recipients?: Array<{recipient: string | RecipientDescriptor; amountAtomic: string}>;
  action: PoolAction; amountAtomic: string; feeAtomic: string;
  funding?: PoolCoin; sponsor: PoolCoin; payout?: string; note?: string; recipient?: string;
}
/** Unsigned funding inputs; contains no private data. */
export interface PreparedPoolTransaction {
  raw: string; form: C4Form; feeAtomic: string; stateOutpoint: [string, number]; inputPoints: OutPoint[]; amountAtomic: string;
}
/** A Worker running startPoolWorker; the client installs its own onmessage and onerror handlers. */
export interface PoolWorkerLike {
  postMessage(message: unknown): void;
  onmessage: unknown;
  onerror?: unknown;
  terminate?(): void;
}
export declare class PoolWorkerClient {
  constructor(options: { worker: PoolWorkerLike; rpc: PoolRpc; onStage?: (message: string) => void;
    /** Called when the worker crashes, even with no request running; the client is then stopped. */
    onCrash?: (error: Error) => void; isReadRpc?: (method: string) => boolean });
  readonly busy: boolean;
  /** True after terminate() or a worker crash; create a new client to continue. */
  readonly stopped: boolean;
  create(options: { password: string }): Promise<PoolIdentityMessage>;
  restore(options: { backup: string; password: string }): Promise<PoolIdentityMessage>;
  derive(options: { family: import('./index.cjs').NzkFamily; mnemonic: string; passphrase?: string; zkPassphrase?: string; account?: number; gap?: number; issued?: number }): Promise<PoolIdentityMessage>;
  scan(options?: { gap?: number; issued?: number; checkpoint?: string }): Promise<PoolScanMessage>;
  newAddress(options?: { force?: boolean }): Promise<PoolAddressesMessage>;
  prepare(request: PoolPrepareRequest): Promise<PreparedPoolTransaction>;
  lock(): Promise<void>;
  terminate(): void;
}
