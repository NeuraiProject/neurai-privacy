import type { RecipientDescriptor, NzkAddressRef } from './index.js';
import type { C4Manifest, C5Manifest, C4Coin, C4Form } from './browser.js';

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
export interface PoolCoin extends C4Coin { address?: string; [key: string]: unknown }
export declare function assertPoolChain(rpc: PoolRpc, manifest: { genesis: string }): Promise<void>;
export declare function confirmedPoolCoins(rpc: PoolRpc, utxos: WalletUtxo[], options: { baseCurrency: string }): Promise<PoolCoin[]>;
export declare function selectPoolCoins(coins: PoolCoin[], options: { action: PoolAction; amountAtomic: bigint | string; feeAtomic: bigint | string }): { funding?: PoolCoin; sponsor: PoolCoin };
export declare function checkPoolCoin(rpc: PoolRpc, coin: PoolCoin): Promise<void>;
export declare function withdrawalScript(rpc: PoolRpc, address: string): Promise<string>;
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
export declare function rotationStorageKey(options: { network: string; walletId?: string; derivation: 'NeuraiZK/v2'; family: import('./index.js').NzkFamily; storageId: string; account: number }): string;
export declare function loadRotation(storage: KeyValueStorage | null | undefined, key: string): RotationState | null;
export declare function saveRotation(storage: KeyValueStorage | null | undefined, key: string, state: RotationState): boolean;

/** Public proving artifacts of a deployment, pinned by size and SHA-256. */
export interface C4ArtifactList {
  schema: string; id: string; warning: string; snarkjs: string;
  forms: Record<C4Form, { wasm: string; zkey: string; vk: string }>;
  files: Record<string, { bytes: number; sha256: string }>;
}
/** Bundled public C4 XNA TEST instance on the reset Neurai testnet. */
export declare const C4_TESTNET_NETWORK: 'testnet';
export declare const C4_TESTNET_COMMITMENT: string;
export declare const C4_TESTNET_MANIFEST: Readonly<C4Manifest>;
export declare const C4_TESTNET_ARTIFACTS: Readonly<C4ArtifactList>;

/** Public receiving data of the open identity. */
export interface ReceivingInfo {
  kind: 'file' | 'derived';
  derivation?: 'NeuraiZK/v2'; family?: import('./index.js').NzkFamily; storageId?: string;
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
  derive(options: { family: import('./index.js').NzkFamily; mnemonic: string; passphrase?: string; zkPassphrase?: string; account?: number; gap?: number; issued?: number }): Promise<PoolIdentityMessage>;
  scan(options?: { gap?: number; issued?: number; checkpoint?: string }): Promise<PoolScanMessage>;
  newAddress(options?: { force?: boolean }): Promise<PoolAddressesMessage>;
  prepare(request: PoolPrepareRequest): Promise<PreparedPoolTransaction>;
  lock(): Promise<void>;
  terminate(): void;
}

/** Durable CAS must be atomic across tabs/processes and resolve only after commit. */
export interface SponsorStore {
  read(key: string): Promise<string | null>;
  compareAndSwap(key: string, expected: string | null, replacement: string): Promise<boolean>;
}
export declare class IndexedDbSponsorStore implements SponsorStore {
  constructor(options?: { indexedDB?: IDBFactory; name?: string });
  read(key: string): Promise<string | null>;
  compareAndSwap(key: string, expected: string | null, replacement: string): Promise<boolean>;
  close(): Promise<void>;
}
export interface SponsorOffer {
  outpoint: string; inputAtomic: string; changeAtomic: string;
  inputScript: string; changeScript: string; index: 2; sighash: 131;
}
export interface SponsorNoteReservation { cm: string; nf: string }
export interface SponsorSweepTemplate { raw: string; outpoint: string; outputAtomic: string; outputScript: string; hashType: 1 }
/** Envelope checks only; actual cryptographic signatures must also pass the node. */
export declare function validateSponsorSignature(raw: string, offer: SponsorOffer, sweep?: SponsorSweepTemplate | null): true;
export declare function prepareSponsorSweep(offer: SponsorOffer, feeAtomic: string): SponsorSweepTemplate;
export interface SponsorSnapshot {
  revision: number; genesis: string; walletId: string; budgetAtomic: string; authorizedAtomic: string;
  tip: { height: number; hash: string } | null;
  operations: Array<{ operationId: string; budgetAtomic: string; authorizedAtomic: string;
    privateOperation: 'pending' | 'confirmed' | 'conflicted'; operationTxid: string | null;
    reservationClosed: boolean; privateExposed: boolean; notes: SponsorNoteReservation[]; exposedOutpoints: string[];
    sponsors: Array<{ offer: SponsorOffer; spentBy: string | null; sweepTxid: string | null;
      status: 'exposed' | 'spent-for-operation' | 'spent-elsewhere' }> }>;
}
/** Opt-in C6 TEST; never includes private keys, plaintext notes or proving data. */
export declare class SponsorJournal {
  constructor(options: { store: SponsorStore; genesis: string; walletId: string; budgetAtomic: string });
  /** Explicitly initializes a NEW wallet only. Restore a backup before using a recovered wallet. */
  initialize(options?: { create?: boolean }): Promise<SponsorSnapshot>;
  /** Restore only into missing storage, never overwrite existing history. A fresh scan is still required. */
  restore(serialized: string): Promise<SponsorSnapshot>;
  reserveOperation(options: { operationId: string; budgetAtomic: string; notes: SponsorNoteReservation[] }): Promise<SponsorSnapshot>;
  /** Call before delivering a proof independently of its sponsor. */
  markPrivateExposure(operationId: string): Promise<SponsorSnapshot>;
  abandonUnexposed(operationId: string): Promise<SponsorSnapshot>;
  /** Reserve before external signing/publication. A signer failure never releases this exposure. */
  exposeAuthorization(operationId: string, offer: SponsorOffer): Promise<SponsorSnapshot>;
  signAuthorization(operationId: string, offer: SponsorOffer, options: { rpc: PoolRpc;
    sign: (request: { offer: SponsorOffer; hashType: 131 }) => Promise<string> }): Promise<string>;
  /** Caller authenticates a complete confirmed-chain scan AND exact private operation, not just its sponsor spend.
   * Missing observations are unsafe. expectedRevision prevents a stale asynchronous scan from overwriting history. */
  reconcile(observation: { expectedRevision: number; genesis: string; tip: { height: number; hash: string };
    confirmedSpends: Record<string, string>;
    operations: Array<{ operationId: string; txid: string | null; spentNullifiers: string[] }> }): Promise<SponsorSnapshot>;
  snapshot(): Promise<SponsorSnapshot>;
  /** Local backup metadata; encrypt it and include it in wallet backups. */
  export(): Promise<string>;
  /** Local signer must return ALL-signed bytes without broadcasting. Admission is checked on the node.
   * Records a pending sweep; confirmation/reorganization is still handled by reconcile. */
  prepareSweep(outpoint: string, options: { rpc: PoolRpc; feeAtomic: string;
    sign: (request: { raw: string; hashType: 1; offer: SponsorOffer }) => Promise<string> }):
      Promise<{ raw: string; txid: string; points: OutPoint[]; feeAtomic: string }>;
}

/** Application-pinned C6 TEST contract on a trusted fully validating RPC. */
export interface C6SponsorDeployment {
  genesis:string; commitment:string; kind:'xna'|'asset';asset?:string;unit?:string;units?:number;
  anchor:{height:number;hash:string;outpoint:string;script:string;opening:string};
  leaves:Array<{form:string;script:string;args:string[]}>;
}
export interface C6SponsorIntent {operationId:string;pool:string;nullifiers:string[]}
export declare function validateC6SponsorDeployment(deployment:C6SponsorDeployment):C6SponsorDeployment;
export declare function c6SponsorIntent(raw:string,deployment:C6SponsorDeployment):C6SponsorIntent;
export declare function scanC6SponsorChain(options:{rpc:PoolRpc;snapshot:SponsorSnapshot;deployments:C6SponsorDeployment[];intents:C6SponsorIntent[];
  signal?:AbortSignal;onProgress?:(progress:{height:number;target:number})=>void}):Promise<Parameters<SponsorJournal['reconcile']>[0]>;
export interface C6PreparedAuthorization {raw:string;pool:string;notes:SponsorNoteReservation[];budgetAtomic:string;offer:SponsorOffer}
export interface C6SponsorBackup {schema:'neurai-c6-backup-test-v1';journal:string;flow:string}
export declare class C6SponsorFlow {
  constructor(options:{store:SponsorStore;genesis:string;walletId:string;budgetAtomic:string;rpc:PoolRpc;deployments:C6SponsorDeployment[];
    locks?:Pick<LockManager,'request'>;sweepFeeAtomic:(offer:SponsorOffer)=>Promise<string>;
    sign:(request:{raw:string;offer:SponsorOffer;hashType:1|131;index:0|2})=>Promise<string>});
  initialize(options?:{create?:boolean}):Promise<SponsorSnapshot>;
  scan(options?:{signal?:AbortSignal;onProgress?:(progress:{height:number;target:number})=>void}):Promise<SponsorSnapshot>;
  snapshot():Promise<SponsorSnapshot>;
  pending():Promise<Array<{operationId:string;txid:string}>>;
  backup():Promise<C6SponsorBackup>;
  restore(backup:C6SponsorBackup):Promise<SponsorSnapshot>;
  authorize(prepared:C6PreparedAuthorization):Promise<{operationId:string;raw:string;txid:string}>;
  publish(operationId:string):Promise<{txid:string;status:string}>;
  sweep(outpoint:string):Promise<{txid:string;status:string}|null>;
  tick(options?:{autoSweep?:boolean;signal?:AbortSignal;onProgress?:(progress:{height:number;target:number})=>void}):Promise<{snapshot:SponsorSnapshot;sweeps:Array<{txid:string;status:string}|null>}>;
}

/** Dedicated C6 worker: durable encrypted CAS, public relocation and ALL funding. */
export declare class C6WorkerClient {
  constructor(options:{worker:Worker|any;rpc:PoolRpc;store:Pick<IndexedDbSponsorStore,'read'|'compareAndSwap'>;onStage?:(message:string)=>void;onCrash?:(error:Error)=>void});
  readonly stopped:boolean;
  request(type:string,payload?:Record<string,unknown>):Promise<any>;
  derive(options:{family:import('./index.js').NzkFamily;mnemonic:string;passphrase?:string;zkPassphrase?:string;account?:number;gap?:number;issued?:number}):Promise<any>;
  openJournal(options?:{create?:boolean;backup?:any}):Promise<any>;
  scan():Promise<any>;prepare(options:Record<string,unknown>):Promise<any>;rebuild(id:string,options?:{sponsorPoint:string;sponsorFee:string}):Promise<any>;
  recordSigned(id:string,raw:string):Promise<any>;broadcastAttempt(id:string):Promise<any>;
  backup():Promise<any>;newAddress():Promise<any>;releaseDraft(id:string):Promise<any>;terminate(error?:Error):void;
}

export declare function c6AssetMetadata(manifest:import('./index.js').C6OperationManifest):{name:string;unit:bigint;units:number};
export declare function c6AssetTransferScript(destination:Uint8Array,asset:string,amountAtomic:string|bigint,options?:{allowContract?:boolean}):Uint8Array;
export declare function c6ReadAssetTransfer(script:Uint8Array,options?:{asset?:string;unit?:string|bigint;allowContract?:boolean}):{asset:string;amountAtomic:string;destination:Uint8Array};
export declare function parseAssetAmount(value:string,units:number):bigint;
