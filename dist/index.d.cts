/** Genesis of the testnet of 2026-11-05, in RPC (display) order. */
export declare const RESET_TESTNET_GENESIS: string;

/** A private address of a C7 pool, as a descriptor (nzk v3). */
export interface RecipientDescriptor {
  domain: string;
  asset_id: string;
  owner: string;
  /** pk_d of the diversified address. */
  view_pub: string;
  /** 11-byte diversifier. */
  d?: string;
}

export declare const BN254_SCALAR_FIELD: bigint;
export declare function encodeField(value: bigint): Uint8Array;
export declare function decodeField(value: Uint8Array): bigint;
export declare function poseidonPermutation(state: [bigint, bigint, bigint]): [bigint, bigint, bigint];
export declare function poseidonBytes(input: Uint8Array): Uint8Array;

/** CP1 note (169 bytes encoded). C7 notes use this encoding. */
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

/** NeuraiZK/v2 wallet root: wallet seed S and ZK root R, from which C7 accounts derive. */
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
export declare function bech32mEncode(hrp: string, bytes: Uint8Array): string;
export declare function bech32mDecode(text: string): { hrp: string; bytes: Uint8Array };

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
export declare function isC7Descriptor(value: unknown): value is C7Descriptor;
export declare function encodeC7Address(descriptor: RecipientDescriptor, network: NzkNetwork): string;
export declare function decodeC7Address(address: string, scope: NzkPoolScope): C7Descriptor;
export declare function sealC7Note(options: { descriptor: RecipientDescriptor; amountAtomic: bigint | string; rho?: Uint8Array }): { note: Uint8Array; cm: Uint8Array; record: Uint8Array };
/** Descriptor of a C7 address: the diversifier is always present. */
export type C7Descriptor = RecipientDescriptor & { d: string };
export declare class C7Account {
  constructor(root: Uint8Array, options: { family: NzkFamily; account?: number; domain: string | Uint8Array; assetId: string | Uint8Array });
  descriptor(chain: 0 | 1, index: number): C7Descriptor;
  scan(record: Uint8Array, cm: Uint8Array, options?: { full?: boolean; checkTag?: boolean }): { status: 'received' | 'owned'; ownership: 'unverified' | 'verified'; chain: 0 | 1; index: number; amountAtomic: bigint; note: Uint8Array; d: Uint8Array; cm: Uint8Array; nf?: Uint8Array };
  spendKeys(chain: 0 | 1, index: number): { spendSecret: Uint8Array; owner: Uint8Array; nk: Uint8Array };
  lock(): void;
}
export interface C7WalletOptions { family: NzkFamily; account?: number; domain: string; assetId: string; network: NzkNetwork; gap?: number; issued?: number }
/** @deprecated Renamed to C7WalletOptions. */
export type ZkWalletOptions = C7WalletOptions;
type C7Prepare<R, Omitted extends keyof R> = Omit<R, Omitted>;
export declare class C7WalletIdentity {
  static fromMnemonic(options: C7WalletOptions & { mnemonic: string; passphrase?: string; zkPassphrase?: string }): Promise<C7WalletIdentity>;
  static fromSeed(options: C7WalletOptions & { seed: Uint8Array; zkPassphrase?: string }): Promise<C7WalletIdentity>;
  static fromRoot(options: C7WalletOptions & { root: Uint8Array }): C7WalletIdentity;
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
  descriptorAt(chain: 0 | 1, index: number): C7Descriptor;
  addressAt(chain: 0 | 1, index: number): string;
  currentIndex(): number;
  recipient(): C7Descriptor;
  selfRecipient(): C7Descriptor;
  issueNext(options?: { force?: boolean }): number;
  scanRecords(entries: Array<{ record: Uint8Array; cm: Uint8Array }>, knownAddresses?: NzkAddressRef[]): Array<{ position: number; owned: { note: Uint8Array; cm: Uint8Array; amountAtomic: bigint; nf: Uint8Array; address: NzkAddressRef }; address: NzkAddressRef }>;
  openRecord(record: Uint8Array, commitment: Uint8Array): { note: Uint8Array; cm: Uint8Array; amountAtomic: bigint; nf: Uint8Array; address: NzkAddressRef } | null;
  prepareC7Deposit(wallet: import('./worker.cjs').C7OperationWallet, options: C7Prepare<import('./worker.cjs').C7DepositRequest, 'domain' | 'assetId' | 'recipient'> & { recipient?: RecipientDescriptor }): import('./worker.cjs').C7OperationPrepared;
  prepareC7Transfer(wallet: import('./worker.cjs').C7OperationWallet, options: C7Prepare<import('./worker.cjs').C7TransferRequest, 'domain' | 'assetId' | 'spent' | 'root' | 'change'> & { consumed: import('./worker.cjs').C7RecoveredNote }): import('./worker.cjs').C7OperationPrepared;
  prepareC7Withdrawal(wallet: import('./worker.cjs').C7OperationWallet, options: C7Prepare<import('./worker.cjs').C7WithdrawalRequest, 'domain' | 'assetId' | 'spent' | 'root' | 'change'> & { consumed: import('./worker.cjs').C7RecoveredNote }): import('./worker.cjs').C7OperationPrepared;
  prepareC7Join(wallet: import('./worker.cjs').C7JoinWallet, options: C7Prepare<import('./worker.cjs').C7JoinRequest, 'domain' | 'assetId' | 'root' | 'notes' | 'change'> & { consumed: [import('./worker.cjs').C7RecoveredNote, import('./worker.cjs').C7RecoveredNote] }): import('./worker.cjs').C7JoinPrepared;
  /** @deprecated Renamed to prepareC7Deposit. */
  prepareC6Deposit: C7WalletIdentity['prepareC7Deposit'];
  /** @deprecated Renamed to prepareC7Transfer. */
  prepareC6Transfer: C7WalletIdentity['prepareC7Transfer'];
  /** @deprecated Renamed to prepareC7Withdrawal. */
  prepareC6Withdrawal: C7WalletIdentity['prepareC7Withdrawal'];
  /** @deprecated Renamed to prepareC7Join. */
  prepareC6Join: C7WalletIdentity['prepareC7Join'];
  backupJson(): null;
  checkpointStoreId(): string;
  /** Encrypts and authenticates a scan checkpoint or journal under this account. */
  sealCheckpoint(checkpoint: unknown): string;
  openCheckpoint(encoded: string): any;
  lock(): void;
}

export * from './client.cjs';
export * from './worker.cjs';
