export declare const RESET_TESTNET_GENESIS: string;

export interface RecipientDescriptor {
  domain: string;
  asset_id: string;
  owner: string;
  view_pub: string;
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
  prepareC4(options: import('./browser.js').C4PrepareOptions): import('./browser.js').C4Prepared;
  sealCheckpoint(checkpoint: import('./browser.js').PoolScanCheckpoint): string;
  openCheckpoint(encoded: string): import('./browser.js').PoolScanCheckpoint;
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
  prepareC4(options: import('./browser.js').C4PrepareOptions): import('./browser.js').C4Prepared;
  backupJson(): null;
  sealCheckpoint(checkpoint: import('./browser.js').PoolScanCheckpoint): string;
  openCheckpoint(encoded: string): import('./browser.js').PoolScanCheckpoint;
  lock(): void;
}

export * from './client.js';
export * from './worker.js';

export { C4_FORMS, validateC4Manifest, prepareC4, finishC4, c4DustAtomic } from './browser.js';
export type { C4Form, C4Manifest, C4Coin, C4PrepareOptions, C4Prepared } from './browser.js';
