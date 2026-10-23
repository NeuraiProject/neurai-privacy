export declare const RESET_TESTNET_GENESIS: string;

export interface RecipientDescriptor {
  domain: string;
  asset_id: string;
  owner: string;
  /** X25519 view key (C4 to C6) or pk_d (C7). */
  view_pub: string;
  /** C7 (nzk v3) only: 11-byte diversifier. */
  d?: string;
}

export interface WalletNote {
  cm: string;
  amountAtomic: bigint;
  spent: boolean;
  createdTxid: string;
  createdHeight: number;
  spentTxid: string | null;
  spentHeight: number | null;
  slot: number;
}

export interface PoolHistoryItem {
  txid: string;
  height: number;
  form: 'D0' | 'D1' | 'T1' | 'T2' | 'W_partial' | 'W_full';
  reserveAtomic: bigint;
}

export interface RawWalletScan {
  test_only: true;
  birth: { txid: string; height: number };
  height: number;
  blockhash: string;
  transitions: number;
  state_outpoint: [string, number];
  reserve_amount: number;
  reserve_sats: string;
  notes: number;
  balance_units: number;
  balance_sats: string;
  owned_notes: Array<{
    cm: string;
    amount_sats: string;
    spent: boolean;
    created_txid: string;
    created_height: number;
    spent_txid: string | null;
    spent_height: number | null;
    slot: number;
  }>;
  history: Array<{ txid: string; height: number; form: PoolHistoryItem['form']; reserve_sats: string }>;
  balance_asset: string;
  asset_name: 'RWAX' | 'XNA';
  asset_decimals: 8;
}

export interface WalletScan {
  test_only: true;
  birth: { txid: string; height: number };
  height: number;
  blockhash: string;
  transitions: number;
  state_outpoint: [string, number];
  notes: number;
  balance_asset: string;
  asset_name: 'RWAX' | 'XNA';
  asset_decimals: 8;
  balanceAtomic: bigint;
  reserveAtomic: bigint;
  ownedNotes: WalletNote[];
  history: PoolHistoryItem[];
  /** Legacy RWAX fields; deliberately absent for XNA to prevent precision loss. */
  balance_units?: number;
  reserve_amount?: number;
  balance_sats?: string;
  reserve_sats?: string;
}

export interface TransactionResult {
  test_only: true;
  form: 'D0' | 'D1' | 'T1' | 'T2' | 'W_partial' | 'W_full';
  txid: string;
  broadcast: boolean;
  mined: boolean;
  recipient: string | null;
  shield_recipients: number;
  old_state: string;
  new_state: string;
  raw_tx?: string | null;
  prepared_height?: number;
  prepared_blockhash?: string;
  state_outpoint?: [string, number];
  fee_sats?: string;
  reserve_after?: number;
  reserve_sats?: string;
  reserveAtomic?: bigint;
  reserve_asset: string;
  asset_name?: 'RWAX' | 'XNA';
}

export interface FundingStatus {
  test_only: true;
  amount_sats: string;
  fee_sats: string;
  exact_count: number;
  sponsor_count: number;
  ready: boolean;
  created_txid: string | null;
  await_confirmation: boolean;
}

export interface CliTestOptions {
  repository: string;
  wallet: string;
  artifacts: string;
  node: string;
  source?: string;
  proverCode?: string;
  python?: string;
  profile?: 'rwax' | 'xna';
  manifestSha256?: string;
  getPassword: () => string | Uint8Array | Promise<string | Uint8Array>;
  environment?: Record<string, string>;
  timeoutMs?: number;
}

export interface SpendOptions {
  broadcast?: boolean;
  mine?: boolean;
  feeSats?: number;
  maxRebuilds?: number;
  onProgress?: (event: { stage: string; attempt?: number }) => void;
}

export interface PrivacyBackend {
  profile?: 'rwax' | 'xna';
  requiresBlockVerification?: boolean;
  init(): Promise<{ created: string; test_only: true }>;
  backup(file: string): Promise<{ operation: 'backup'; path: string; test_only: true }>;
  restore(file: string): Promise<{ operation: 'restore'; path: string; test_only: true }>;
  funding(options: { amountSats: string | bigint; feeSats?: number; create?: boolean }): Promise<FundingStatus>;
  recipient(): Promise<RecipientDescriptor>;
  scan(options?: { fromHeight?: number; toHeight?: number }): Promise<RawWalletScan>;
  transact(options: SpendOptions & {
    kind: 'deposit' | 'transfer' | 'withdraw';
    amountUnits?: number;
    amountSats?: string | bigint;
    splitSats?: Array<string | bigint>;
    noteCm?: string | bigint;
    recipients?: RecipientDescriptor[];
    recipient?: string;
  }): Promise<TransactionResult>;
}

export declare class CliTestBackend {
  constructor(options: CliTestOptions);
  init(): Promise<{ created: string; test_only: true }>;
  backup(file: string): Promise<{ operation: 'backup'; path: string; test_only: true }>;
  restore(file: string): Promise<{ operation: 'restore'; path: string; test_only: true }>;
  funding(options: { amountSats: string | bigint; feeSats?: number; create?: boolean }): Promise<FundingStatus>;
  recipient(): Promise<RecipientDescriptor>;
  scan(options?: { fromHeight?: number; toHeight?: number }): Promise<RawWalletScan>;
  transact(options: SpendOptions & {
    kind: 'deposit' | 'transfer' | 'withdraw';
    amountUnits?: number;
    amountSats?: string | bigint;
    splitSats?: Array<string | bigint>;
    noteCm?: string | bigint;
    recipients?: RecipientDescriptor[];
    recipient?: string;
  }): Promise<TransactionResult>;
}

export type NeuraiRpc = (method: string, params: unknown[]) => Promise<unknown>;

export declare class NeuraiPrivacy {
  constructor(options: {
    rpc: NeuraiRpc;
    backend: PrivacyBackend;
    expectedGenesis?: string;
  });
  assertNetwork(): Promise<void>;
  networkStatus(): Promise<{ height: number; blockhash: string }>;
  createWallet(): Promise<{ created: string; test_only: true }>;
  backupWallet(file: string): Promise<{ operation: 'backup'; path: string; test_only: true }>;
  restoreWallet(file: string): Promise<{ operation: 'restore'; path: string; test_only: true }>;
  fundingStatus(options: { amountSats: string | bigint; feeSats?: number }): Promise<FundingStatus>;
  createFundingUtxo(options: { amountSats: string | bigint; feeSats?: number }): Promise<FundingStatus>;
  recipient(): Promise<RecipientDescriptor>;
  scan(options?: { fromHeight?: number; toHeight?: number }): Promise<WalletScan>;
  listNotes(options?: { fromHeight?: number; toHeight?: number }): Promise<WalletNote[]>;
  history(options?: { fromHeight?: number; toHeight?: number }): Promise<PoolHistoryItem[]>;
  deposit(options?: SpendOptions & { amountUnits?: 1 | 2; amountSats?: string | bigint }): Promise<TransactionResult>;
  transfer(options: SpendOptions & { recipients: RecipientDescriptor[]; splitSats?: Array<string | bigint>; noteCm?: string | bigint }): Promise<TransactionResult>;
  withdraw(options?: SpendOptions & { recipient?: string; noteCm?: string | bigint }): Promise<TransactionResult>;
  publishPrepared(candidate: TransactionResult): Promise<TransactionResult>;
  transactionStatus(txid: string): Promise<{ txid: string; state: 'confirmed' | 'mempool' | 'unknown'; confirmations: number; height: number | null; blockhash: string | null }>;
  transaction(txid: string): Promise<unknown>;
}

export declare const BN254_SCALAR_FIELD: bigint;
export declare function encodeField(value: bigint): Uint8Array;
export declare function decodeField(value: Uint8Array): bigint;
export declare function poseidonPermutation(state: [bigint, bigint, bigint]): [bigint, bigint, bigint];
export declare function poseidonBytes(input: Uint8Array): Uint8Array;

export interface CP1Note {
  domain: Uint8Array;
  assetId: Uint8Array;
  owner: Uint8Array;
  viewPub: Uint8Array;
  amountAtomic: bigint;
  rho: Uint8Array;
}
export declare function encodeNote(note: CP1Note & { amountAtomic: bigint | string }): Uint8Array;
export declare function decodeNote(note: Uint8Array): CP1Note;
export declare function deriveOwner(domain: Uint8Array, spendSecret: Uint8Array): Uint8Array;
export declare function deriveNullifierKey(domain: Uint8Array, spendSecret: Uint8Array): Uint8Array;
export declare function noteCommitment(note: Uint8Array): Uint8Array;
export declare function noteNullifier(note: Uint8Array, spendSecret: Uint8Array): Uint8Array;
export declare function sealVault(payload: Record<string, unknown>, password: string | Uint8Array): Promise<string>;
export declare function openVault(encoded: string | Uint8Array, password: string | Uint8Array): Promise<Record<string, unknown>>;
export declare function deriveViewPublic(viewSeed: Uint8Array): Uint8Array;
export declare function sealNote(options: { descriptor: RecipientDescriptor; amountAtomic: bigint | string }): { note: Uint8Array; cm: Uint8Array; record: Uint8Array };
export declare function openNoteRecord(options: { record: Uint8Array; cm: Uint8Array; domain: Uint8Array; assetId: Uint8Array; viewSeed: Uint8Array; spendSecret?: Uint8Array }): { note: Uint8Array; cm: Uint8Array; amountAtomic: bigint; nf?: Uint8Array };
export declare class BrowserTestIdentity {
  static create(options: { domain: string; assetId: string; password: string | Uint8Array }): Promise<BrowserTestIdentity>;
  static fromBackup(options: { backup: string | Uint8Array; password: string | Uint8Array; domain: string; assetId: string }): Promise<BrowserTestIdentity>;
  recipient(): RecipientDescriptor;
  backupJson(): string | Uint8Array;
  createNote(recipient: RecipientDescriptor, amountAtomic: bigint | string): { note: Uint8Array; cm: Uint8Array; record: Uint8Array };
  openRecord(record: Uint8Array, commitment: Uint8Array): { note: Uint8Array; cm: Uint8Array; amountAtomic: bigint; nf: Uint8Array };
  /** Local worker only: returned witness contains private circuit inputs. */
  prepareC4(options: import('./browser.cjs').C4PrepareOptions): import('./browser.cjs').C4Prepared;
  prepareC5(options: import('./browser.cjs').C5PrepareOptions): import('./browser.cjs').C5Prepared;
  prepareC6Deposit(wallet:C6OperationWallet,options:Omit<C6DepositRequest,'domain'|'assetId'|'recipient'> & {recipient?:RecipientDescriptor}):C6OperationPrepared;
  prepareC6Transfer(wallet:C6OperationWallet,options:Omit<C6TransferRequest,'domain'|'assetId'|'spent'|'root'> & {consumed:C6RecoveredNote}):C6OperationPrepared;
  prepareC6Withdrawal(wallet:C6OperationWallet,options:Omit<C6WithdrawalRequest,'domain'|'assetId'|'spent'|'root'> & {consumed:C6RecoveredNote}):C6OperationPrepared;
  sealCheckpoint(checkpoint: import('./browser.cjs').PoolScanCheckpoint): string;
  openCheckpoint(encoded: string): import('./browser.cjs').PoolScanCheckpoint;
  lock(): void;
}

/** NeuraiZK/v2: deterministic identities from the wallet seed and nzk addresses. */
export type NzkFamily = 'legacy' | 'ecdsa' | 'pq';
export declare const NZK_DERIVATION: 'NeuraiZK/v2';
export declare const NZK_FAMILIES: Readonly<Record<NzkFamily, number>>;
export type NzkNetwork = 'mainnet' | 'testnet' | 'regtest';
export interface NzkAddressRef { chain: 0 | 1; index: number }
export interface NzkPoolScope { network: NzkNetwork; domain: string; assetId: string }
export declare const NZK_ARGON2ID: Readonly<{ t: number; m: number; p: number; dkLen: number }>;
export declare const NZK_HRP: Readonly<Record<NzkNetwork, string>>;
export declare const NZK_DEFAULT_GAP: number;
export declare const NZK_MAX_GAP: number;
export declare function walletSeedFromMnemonic(mnemonic: string, passphrase?: string): Promise<Uint8Array>;
export declare function deriveZkRoot(seed: Uint8Array, zkPassphrase?: string): Promise<Uint8Array>;
export declare function zkFingerprint(root: Uint8Array, options: { family: NzkFamily; account?: number; domain: string | Uint8Array; assetId: string | Uint8Array }): string;
export declare function deriveZkAddressKeys(root: Uint8Array, options: { family: NzkFamily; account?: number; chain: 0 | 1; index: number; domain: string | Uint8Array; assetId: string | Uint8Array }): { spendSecret: Uint8Array; viewSeed: Uint8Array };
export declare function nzkInstanceTag(domain: string | Uint8Array, assetId: string | Uint8Array): Uint8Array;
export declare function encodeNzkAddress(descriptor: RecipientDescriptor, network: NzkNetwork): string;
export declare function decodeNzkAddress(address: string, scope: NzkPoolScope): RecipientDescriptor;
export declare function parseRecipient(text: string | RecipientDescriptor, scope: NzkPoolScope): RecipientDescriptor;
export declare function bech32mEncode(hrp: string, bytes: Uint8Array): string;
export declare function bech32mDecode(text: string): { hrp: string; bytes: Uint8Array };
export interface ZkWalletOptions { family: NzkFamily; account?: number; domain: string; assetId: string; network: NzkNetwork; gap?: number; issued?: number }
export declare class ZkWalletIdentity {
  static fromMnemonic(options: ZkWalletOptions & { mnemonic: string; passphrase?: string; zkPassphrase?: string }): Promise<ZkWalletIdentity>;
  static fromSeed(options: ZkWalletOptions & { seed: Uint8Array; zkPassphrase?: string }): Promise<ZkWalletIdentity>;
  static fromRoot(options: ZkWalletOptions & { root: Uint8Array }): ZkWalletIdentity;
  readonly derivation: 'NeuraiZK/v2';
  readonly family: NzkFamily;
  readonly storageId: string;
  readonly fingerprint: string;
  readonly account: number;
  readonly network: NzkNetwork;
  readonly gap: number;
  readonly issued: number;
  readonly maxUsed: number;
  readonly usedIndexes: number[];
  setGap(gap: number): void;
  setIssued(index: number): void;
  identityAt(chain: 0 | 1, index: number): BrowserTestIdentity;
  descriptorAt(chain: 0 | 1, index: number): RecipientDescriptor;
  addressAt(chain: 0 | 1, index: number): string;
  currentIndex(): number;
  recipient(): RecipientDescriptor;
  selfRecipient(): RecipientDescriptor;
  issueNext(options?: { force?: boolean }): number;
  scanRecords(entries: Array<{ record: Uint8Array; cm: Uint8Array }>, knownAddresses?: NzkAddressRef[]): Array<{ position: number; owned: { note: Uint8Array; cm: Uint8Array; amountAtomic: bigint; nf: Uint8Array }; address: NzkAddressRef }>;
  openRecord(record: Uint8Array, commitment: Uint8Array): { note: Uint8Array; cm: Uint8Array; amountAtomic: bigint; nf: Uint8Array } | null;
  createNote(recipient: RecipientDescriptor, amountAtomic: bigint | string): { note: Uint8Array; cm: Uint8Array; record: Uint8Array };
  spendingIdentity(consumed?: { address?: NzkAddressRef }): BrowserTestIdentity;
  /** Local worker only: returned witness contains private circuit inputs. */
  prepareC4(options: import('./browser.cjs').C4PrepareOptions): import('./browser.cjs').C4Prepared;
  prepareC5(options: import('./browser.cjs').C5PrepareOptions): import('./browser.cjs').C5Prepared;
  prepareC6Deposit(wallet:C6OperationWallet,options:Omit<C6DepositRequest,'domain'|'assetId'|'recipient'> & {recipient?:RecipientDescriptor}):C6OperationPrepared;
  prepareC6Transfer(wallet:C6OperationWallet,options:Omit<C6TransferRequest,'domain'|'assetId'|'spent'|'root'> & {consumed:C6RecoveredNote}):C6OperationPrepared;
  prepareC6Withdrawal(wallet:C6OperationWallet,options:Omit<C6WithdrawalRequest,'domain'|'assetId'|'spent'|'root'> & {consumed:C6RecoveredNote}):C6OperationPrepared;
  backupJson(): null;
  sealCheckpoint(checkpoint: import('./browser.cjs').PoolScanCheckpoint): string;
  openCheckpoint(encoded: string): import('./browser.cjs').PoolScanCheckpoint;
  lock(): void;
}

export * from './client.cjs';
export * from './worker.cjs';

export { C4_FORMS, validateC4Manifest, prepareC4, finishC4, c4DustAtomic } from './browser.cjs';
export type { C4Form, C4Manifest, C4Coin, C4PrepareOptions, C4Prepared } from './browser.cjs';

export { C5_FORMS, validateC5Manifest, prepareC5, finishC5, C5_CHUNK_BYTES, C5_CHUNKS, c5TransitionBinding, encodeC5Transition, verifyC5Transition, splitC5Transition, joinC5Transition } from './browser.cjs';
export type { C5Manifest, C5Prepared, C5PrepareOptions } from './browser.cjs';

export declare function c6SponsorWalletId(mnemonic:string,passphrase?:string):Promise<string>;

/** Experimental profile-3 XNA J2 only. Amounts use exact atomic units. */
export interface C6JoinManifest {
  profile:'C6-XNA-TEST-J2-v2'|'C6-ORDINARY-ASSET-TEST-J2-v1';network:string;commitment:string;context:string;
  fees:{J2:Array<string|number>};asset?:string;units?:number;unit?:string|number;private_fee?:number;sponsor_index?:number;sponsor_fees?:string[];
}
export interface C6JoinNote {
  note:Uint8Array;spendSecret:Uint8Array;index:number;path:Uint8Array[];
}
export interface C6JoinRequest {
  manifest:C6JoinManifest;domain:Uint8Array;assetId:Uint8Array;root:Uint8Array;
  notes:[C6JoinNote,C6JoinNote];fee:string|bigint;
}
/** Contains private note witnesses: keep it in a dedicated proving worker. */
export interface C6JoinPrepared {
  input:Record<string,unknown>;publics:string[];blob:Uint8Array;
  created:{note:Uint8Array;cm:Uint8Array;record:Uint8Array};
  resources:Array<{cm:string;nf:string}>;network:Uint8Array;pool:Uint8Array;
}
export interface C6JoinResult {
  packet:Uint8Array;packetId:string;
  proof:import('./worker.cjs').Groth16Proof;publicSignals:string[];
}
export interface C6JoinWallet {
  prepare(request:C6JoinRequest):C6JoinPrepared;
  /** Application must pin the proving artifacts and VK for this instance.
   * Abort stops local work at checkpoints, not an already published packet. */
  prove(prepared:C6JoinPrepared,options:{api:import('./worker.cjs').SnarkjsLike;
    wasm:Uint8Array;zkey:Uint8Array;vk:unknown;stage?:(message:string)=>void;
    signal?:AbortSignal}):Promise<C6JoinResult>;
}
export declare function createC6JoinWallet(options:{expectedGenesis:string;expectedCommitment:string;kind?:'xna'|'asset'}):C6JoinWallet;

/** Experimental profile-3 XNA TEST D/T1-T3/W, with independent instance pins. */
export interface C6OperationManifest extends Omit<C6JoinManifest,'fees'> {
  fees:Record<'D'|'T1'|'T2'|'T3'|'W',Array<string|number>> & {J2?:Array<string|number>};
}
export interface C6OperationContext {
  manifest:C6OperationManifest;domain:Uint8Array;assetId:Uint8Array;fee:string|bigint;
}
export interface C6DepositRequest extends C6OperationContext {
  amountAtomic:string|bigint;recipient:RecipientDescriptor;
  funding:Uint8Array;fundingValue:string|bigint;
}
export interface C6TransferRequest extends C6OperationContext {
  operation:'T1'|'T2'|'T3';spent:C6JoinNote;root:Uint8Array;
  outputs:Array<{amountAtomic:string|bigint;recipient?:RecipientDescriptor;isChange?:boolean}>;
}
export interface C6WithdrawalRequest extends C6OperationContext {
  spent:C6JoinNote;root:Uint8Array;amountAtomic:string|bigint;payoutScript:Uint8Array;
}
/** Private witness and output plaintexts. Do not send this object to a service. */
export interface C6OperationPrepared {
  operation:'D'|'T1'|'T2'|'T3'|'W';input:Record<string,unknown>;publics:string[];
  created:Array<{note:Uint8Array;cm:Uint8Array;record:Uint8Array}>;
  blob:Uint8Array;resources:Array<{cm:string;nf:string}>;payout:Uint8Array;funding:Uint8Array;
  network:Uint8Array;pool:Uint8Array;
}
export interface C6OperationWallet {
  prepareDeposit(request:C6DepositRequest):C6OperationPrepared;
  prepareTransfer(request:C6TransferRequest):C6OperationPrepared;
  prepareWithdrawal(request:C6WithdrawalRequest):C6OperationPrepared;
  prove(prepared:C6OperationPrepared,options:Parameters<C6JoinWallet['prove']>[1]):Promise<C6JoinResult>;
}
export declare function createC6OperationWallet(options:{expectedGenesis:string;expectedCommitment:string;kind?:'xna'|'asset'}):C6OperationWallet;

/** Private result: note plaintext and balances belong in the wallet worker. */
export interface C6RecoveredNote {
  note:Uint8Array;cm:Uint8Array;record:Uint8Array;nf:Uint8Array;amountAtomic:string;
  index:number;height:number;txid:string;address?:NzkAddressRef;
  reserved:boolean;spendable:boolean;root:Uint8Array|null;path:Uint8Array[]|null;
}
export interface C6PoolScan {
  profile:'C6-XNA-TEST-J2-v2'|'C6-ORDINARY-ASSET-TEST-J2-v1';genesis:string;commitment:string;tip:{height:number;hash:string};
  statePoint:string;opening:string;notes:C6RecoveredNote[];
  records:Array<{cm:Uint8Array;record:Uint8Array;index:number;height:number;txid:string}>;
  events:Array<{form:string;cms:string[];nfs:string[];rootIndex:number|null;transcript:string;txid:string;intentId:string}>;
  reserveAtomic:string;reserveScript:string|null;reservePoint:string|null;
  nullifiers:string[];root:Uint8Array|null;balanceAtomic:string;spendableAtomic:string;ignoredRecords:number;
}
/** C7 (NeuraiZK/v3): one viewing key per account, diversified nzk v3 addresses
 * and 230-byte note records with a view tag, over ristretto255. TEST only. */
export declare const C7_PROFILE: 'C7-XNA-TEST-v1';
export declare const C7_DERIVATION: 'NeuraiZK/v3';
export declare const C7_RECORD_BYTES: 230;
export declare class C7Error extends Error { readonly reason: string }
export declare function c7XnaAssetId(): Uint8Array;
export declare function c7PoolDomain(birth: { genesis: string; emission: string; identity: string }): Uint8Array;
export declare function c7Context(domain: string | Uint8Array, assetId: string | Uint8Array): Uint8Array;
export declare function c7InstanceTag(domain: string | Uint8Array, assetId: string | Uint8Array): Uint8Array;
export declare function isC7Descriptor(value: unknown): value is RecipientDescriptor & { d: string };
export declare function encodeC7Address(descriptor: RecipientDescriptor, network: NzkNetwork): string;
export declare function decodeC7Address(address: string, scope: NzkPoolScope): RecipientDescriptor & { d: string };
export declare function sealC7Note(options: { descriptor: RecipientDescriptor; amountAtomic: bigint | string; rho?: Uint8Array }): { note: Uint8Array; cm: Uint8Array; record: Uint8Array };
export declare class C7Account {
  constructor(root: Uint8Array, options: { family: NzkFamily; account?: number; domain: string | Uint8Array; assetId: string | Uint8Array });
  descriptor(chain: 0 | 1, index: number): RecipientDescriptor & { d: string };
  scan(record: Uint8Array, cm: Uint8Array, options?: { full?: boolean; checkTag?: boolean }): { status: 'received' | 'owned'; ownership: 'unverified' | 'verified'; chain: 0 | 1; index: number; amountAtomic: bigint; note: Uint8Array; d: Uint8Array; cm: Uint8Array; nf?: Uint8Array };
  lock(): void;
}
export declare class C7WalletIdentity {
  static fromMnemonic(options: ZkWalletOptions & { mnemonic: string; passphrase?: string; zkPassphrase?: string }): Promise<C7WalletIdentity>;
  static fromSeed(options: ZkWalletOptions & { seed: Uint8Array; zkPassphrase?: string }): Promise<C7WalletIdentity>;
  static fromRoot(options: ZkWalletOptions & { root: Uint8Array }): C7WalletIdentity;
  readonly generation: 'c7';
  readonly derivation: 'NeuraiZK/v3';
  readonly family: NzkFamily;
  readonly storageId: string;
  readonly fingerprint: string;
  readonly account: number;
  readonly network: NzkNetwork;
  readonly gap: number;
  readonly issued: number;
  readonly maxUsed: number;
  readonly usedIndexes: number[];
  setGap(gap?: number): void;
  setIssued(index: number): void;
  descriptorAt(chain: 0 | 1, index: number): RecipientDescriptor & { d: string };
  addressAt(chain: 0 | 1, index: number): string;
  currentIndex(): number;
  recipient(): RecipientDescriptor & { d: string };
  selfRecipient(): RecipientDescriptor & { d: string };
  issueNext(options?: { force?: boolean }): number;
  scanRecords(entries: Array<{ record: Uint8Array; cm: Uint8Array }>, knownAddresses?: NzkAddressRef[]): Array<{ position: number; owned: { note: Uint8Array; cm: Uint8Array; amountAtomic: bigint; nf: Uint8Array; address: NzkAddressRef }; address: NzkAddressRef }>;
  openRecord(record: Uint8Array, commitment: Uint8Array): { note: Uint8Array; cm: Uint8Array; amountAtomic: bigint; nf: Uint8Array; address: NzkAddressRef } | null;
  prepareC6Deposit(wallet:C6OperationWallet,options:Omit<C6DepositRequest,'domain'|'assetId'|'recipient'> & {recipient?:RecipientDescriptor}):C6OperationPrepared;
  prepareC6Transfer(wallet:C6OperationWallet,options:Omit<C6TransferRequest,'domain'|'assetId'|'spent'|'root'> & {consumed:C6RecoveredNote}):C6OperationPrepared;
  prepareC6Withdrawal(wallet:C6OperationWallet,options:Omit<C6WithdrawalRequest,'domain'|'assetId'|'spent'|'root'> & {consumed:C6RecoveredNote}):C6OperationPrepared;
  backupJson(): null;
  checkpointStoreId(): string;
  sealCheckpoint(checkpoint: import('./browser.cjs').PoolScanCheckpoint): string;
  openCheckpoint(encoded: string): import('./browser.cjs').PoolScanCheckpoint;
  lock(): void;
}
/** Fully validating trusted RPC is required; this scanner does not implement SPV. */
export declare function scanC6Pool(options:{strategy?:'auto'|'blocks'|'spent-index';rpc:(method:string,params?:unknown[])=>Promise<any>;
  deployment:import('./client.cjs').C6SponsorDeployment;identity:BrowserTestIdentity|ZkWalletIdentity|C7WalletIdentity;
  reserved?:Array<{cm:string;nf:string}>;signal?:AbortSignal;
  /** Disposable encrypted scan prefix; separate from the operation journal. */
  checkpointStore?:{read:(key:string)=>Promise<string|null>;compareAndSwap:(key:string,expected:string|null,replacement:string)=>Promise<boolean>};
  onProgress?:(progress:{height:number;target:number;strategy?:'blocks'|'spent-index';phase?:'recovering'|'verifying'|'resuming'})=>void}):Promise<C6PoolScan>;

/** C6 TEST portable proof worker. Persistent reservations are supplied by the application. */
export function startC6PoolWorker(options: {
  scope?: any; snarkjs?: any; manifest: C6OperationManifest;
  deployment: import('./client.cjs').C6SponsorDeployment;
  domain: string; assetId: string; network?: 'testnet'|'regtest';
  expectedGenesis: string; expectedCommitment: string;
  artifacts: {files: Record<string,{bytes:number;sha256:string}>;
    forms: Record<'D'|'T1'|'T2'|'T3'|'W',{wasm:string;zkey:string;vk:string}> & {J2?:{wasm:string;zkey:string;vk:string}}};
  fetchArtifact?: (path:string)=>Promise<Response>; artifactBaseUrl?: string;
  reservations: Array<{cm:string;nf:string}>; maxArtifactBytes?: number; singleThread?: boolean; buildTransactions?:boolean; durableJournal?:boolean;
}): {stop():void};

/** Public-only relocation; callers must verify the proof and immutable intent first. */
export interface C6Packet {
 network:Uint8Array;pool:Uint8Array;operation:'D'|'T1'|'T2'|'T3'|'W'|'J2';publics:Uint8Array[];proof:Uint8Array;
 publication:Uint8Array;payout:Uint8Array;funding:Uint8Array;cms:Uint8Array[];nfs:Uint8Array[];fee:bigint;packetId:string;
}
export interface C6BuiltTransaction {
 raw:string;txid:string;packetId:string;form:string;feeAtomic:string;amountAtomic:string;reserveAtomic:string;
 inputPoints:Array<{txid:string;vout:number}>;funding:{index:number;point:string;valueAtomic:string;script:string}|null;sponsor?:import('./client.cjs').SponsorOffer;privateFeeAtomic?:string;
 intent:ReturnType<typeof import('./client.cjs').c6SponsorIntent>;transcript:string;
}
export declare function readC6Packet(packet:Uint8Array,options?:{kind:'xna'|'asset';manifest?:C6OperationManifest}):C6Packet;
export declare function buildC6Transaction(options:{packet:Uint8Array;scan:C6PoolScan;manifest:C6OperationManifest & {identity:string;vks:Record<string,string>;vk_sha256:Record<string,string>};deployment:import('./client.cjs').C6SponsorDeployment;funding?:{point:string;valueAtomic:string;script:string};sponsor?:{point:string;valueAtomic:string;script:string;changeScript:string;feeAtomic:string}}):C6BuiltTransaction;
export {C6WorkerClient} from './client.cjs';
