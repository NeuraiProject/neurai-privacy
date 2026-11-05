import type { NzkFamily } from './index.js';

/** Same shape as @neuraiproject/neurai-rpc getRPC(...). */
export type PoolRpc = (method: string, params: unknown[]) => Promise<any>;
export interface WalletServiceHello {
  protocol: string; exact_amounts: boolean; genesis_hash: string; service_id?: string | null;
  wallet_rpc: { methods: readonly string[]; amounts: string; numeric_encoding: string };
}
export interface WalletServiceReply {
  id?: string | number | null;
  result?: unknown;
  error?: null | { code?: number; node_code?: number | null; message?: string; retry_after_seconds?: number };
}
/** Adapt a negotiated wss/2 connection to native pool RPC.
 * request resolves correlated wire envelopes and rejects only transport failures.
 * Recreate the adapter after every connection/hello; it never retries or falls back.
 * Broadcast supports the one-argument sendrawtransaction form only.
 */
export declare function createWalletServiceRpc(options: {
  request: (method: 'rpc.call' | 'tx.broadcast', params: { method: string; params: unknown[] } | { rawtx: string }) => Promise<WalletServiceReply>;
  hello: WalletServiceHello; expectedGenesis: string; expectedServiceId?: string;
}): PoolRpc;
export type PoolAction = 'deposit' | 'transfer' | 'withdraw';
export interface OutPoint { txid: string; vout: number }

export declare const ATOMIC_PER_XNA: bigint;
export declare const MAX_ATOMIC: bigint;
export declare function rpcAmountToSatoshis(value: unknown): bigint;
export declare function parseXna(text: string, options?: { allowZero?: boolean }): bigint;
export declare function formatXna(satoshis: bigint | number | string): string;

export declare const LEGACY_P2PKH: RegExp;
export declare const POOL_READ_RPC_METHODS: readonly string[];
export declare function isPoolReadRpc(method: string): boolean;
export interface WalletUtxo { txid: string; outputIndex: number; script: string; satoshis: number | string; assetName: string; address?: string }
/** A confirmed transparent coin: Legacy P2PKH, strict PQ (OP_2) or strict ECDSA (OP_3). */
export interface PoolCoin { txid: string; vout: number; valueSats: string; scriptHex: string; address?: string; [key: string]: unknown }
export declare function assertPoolChain(rpc: PoolRpc, manifest: { genesis: string }): Promise<void>;
export declare function confirmedPoolCoins(rpc: PoolRpc, utxos: WalletUtxo[], options: { baseCurrency: string }): Promise<PoolCoin[]>;
export declare function checkPoolCoin(rpc: PoolRpc, coin: PoolCoin): Promise<void>;
export declare function withdrawalScript(rpc: PoolRpc, address: string): Promise<string>;
export declare function recheckInputs(rpc: PoolRpc, manifest: { genesis: string }, points: OutPoint[]): Promise<void>;
export declare function admitTransaction(rpc: PoolRpc, raw: string): Promise<{ txid: string; decoded: any }>;
export declare function inspectFundingTransaction(rpc: PoolRpc, raw: string): Promise<{ txid: string; feeAtomic: bigint; points: OutPoint[] }>;
/** Rejects with `uncertain: true` when the broadcast outcome is unknown. */
export declare function publishTransaction(rpc: PoolRpc, manifest: { genesis: string }, tx: { raw: string; txid: string; points: OutPoint[] },
  options?: { onBroadcast?: (txid: string) => void }): Promise<string>;
export declare function publicationStatus(rpc: PoolRpc, manifest: { genesis: string }, tx: { txid: string; raw?: string; points?: OutPoint[] }): Promise<'confirmed' | 'mempool' | 'retryable'>;

/** Public receiving data of the open C7 identity. */
export interface ReceivingInfo {
  /** Always 'derived': C7 wallets come from the wallet words. */
  kind: 'file' | 'derived';
  derivation?: 'NeuraiZK/v2' | 'NeuraiZK/v3'; family?: NzkFamily; storageId?: string;
  fingerprint?: string; account?: number; gap?: number; issued?: number; maxUsed?: number;
  current: { index: number; address: string };
  used: Array<{ index: number; address: string; receivedAtomic: string }>;
}

/** Application-pinned C7 XNA deployment on a trusted fully validating RPC. */
export interface C7Deployment {
  genesis: string; commitment: string; kind: 'xna';
  /** The unique emission the birth spends, "txid:vout"; the pool domain derives from it. */
  emission: string; ownerBurn?: string;
  anchor: { height: number; hash: string; outpoint: string; script: string; opening: string };
  leaves: Array<{ form: string; script: string; args: string[] }>;
}
/** Public intent of a pool transaction; journals key their operations by operationId. */
export interface C7Intent { operationId: string; pool: string; nullifiers: string[] }
export declare function validateC7Deployment(deployment: C7Deployment): C7Deployment;
export declare function c7Intent(raw: string, deployment: C7Deployment): C7Intent;

/** Durable CAS must be atomic across tabs/processes and resolve only after commit. */
export interface JournalStore {
  read(key: string): Promise<string | null>;
  compareAndSwap(key: string, expected: string | null, replacement: string): Promise<boolean>;
}
/** @deprecated Renamed to JournalStore. */
export type SponsorStore = JournalStore;
export declare class IndexedDbJournalStore implements JournalStore {
  constructor(options?: { indexedDB?: IDBFactory; name?: string });
  read(key: string): Promise<string | null>;
  compareAndSwap(key: string, expected: string | null, replacement: string): Promise<boolean>;
  close(): Promise<void>;
}
/** @deprecated Renamed to IndexedDbJournalStore; the same class. */
export { IndexedDbJournalStore as IndexedDbSponsorStore };

/** Dedicated C7 worker: durable encrypted CAS, public relocation and ALL funding. */
export declare class C7WorkerClient {
  constructor(options: { worker: Worker | any; rpc: PoolRpc; store: JournalStore; onStage?: (message: string) => void; onCrash?: (error: Error) => void });
  readonly stopped: boolean;
  request(type: string, payload?: Record<string, unknown>): Promise<any>;
  derive(options: { family: NzkFamily; mnemonic: string; passphrase?: string; zkPassphrase?: string; account?: number; gap?: number; issued?: number }): Promise<any>;
  openJournal(options?: { create?: boolean; backup?: any }): Promise<any>;
  scan(): Promise<any>; prepare(options: Record<string, unknown>): Promise<any>; rebuild(id: string, options?: Record<string, unknown>): Promise<any>;
  recordSigned(id: string, raw: string): Promise<any>; broadcastAttempt(id: string): Promise<any>;
  backup(): Promise<any>; newAddress(): Promise<any>; releaseDraft(id: string): Promise<any>; terminate(error?: Error): void;
}
/** @deprecated Renamed to C7WorkerClient; the same class. */
export { C7WorkerClient as C6WorkerClient };
