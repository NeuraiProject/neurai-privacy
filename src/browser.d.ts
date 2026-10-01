export { RESET_TESTNET_GENESIS, NeuraiPrivacy } from './index.js';
export type { NeuraiRpc, PrivacyBackend, RecipientDescriptor, WalletNote, WalletScan, PoolHistoryItem, TransactionResult, FundingStatus, SpendOptions } from './index.js';
export { BN254_SCALAR_FIELD, encodeField, decodeField, poseidonPermutation, poseidonBytes } from './index.js';
export type { CP1Note } from './index.js';
export { encodeNote, decodeNote, deriveOwner, deriveNullifierKey, noteCommitment, noteNullifier } from './index.js';
export { sealVault, openVault } from './index.js';
export { deriveViewPublic, sealNote, openNoteRecord } from './index.js';
export { BrowserTestIdentity } from './index.js';
export { NZK_DERIVATION, NZK_FAMILIES, NZK_ARGON2ID, NZK_HRP, NZK_DEFAULT_GAP, NZK_MAX_GAP, walletSeedFromMnemonic, deriveZkRoot, zkFingerprint, deriveZkAddressKeys, nzkInstanceTag, encodeNzkAddress, decodeNzkAddress, parseRecipient, bech32mEncode, bech32mDecode, ZkWalletIdentity } from './index.js';
export type { NzkFamily, NzkNetwork, NzkAddressRef, NzkPoolScope, ZkWalletOptions } from './index.js';

export interface BrowserPoolManifest {
  profile: 'xna';
  genesis: string;
  commitment: string;
  reserveCommitment: string;
  domain: string;
  assetId: string;
  vkHashes: Record<'D0' | 'D1' | 'T1' | 'T2' | 'W_partial' | 'W_full', string>;
}
export interface BrowserPoolScan {
  birth: { txid: string; height: number };
  transitions: Array<{ txid: string; height: number; form: string; digest: string; reserveAtomic: bigint }>;
  notes: Array<{ cm: string; amountAtomic: bigint; nf: bigint; note: string; spent: boolean; slot: number; txid: string; height: number; spentTxid?: string; spentHeight?: number; address?: import('./index.js').NzkAddressRef }>;
  balanceAtomic: bigint;
  reserveAtomic: bigint;
  state: { mode: number; slots: Map<number, Uint8Array>; seen: Map<number, [bigint, bigint, number]>; nfs: Map<number, [bigint, bigint, number]>; digest: string; stateOutpoint: [string, number]; reserveOutpoint: [string, number] | null };
  height: number;
  blockhash: string;
  currentTip: string;
  checkpoint: PoolScanCheckpoint;
}
/** Contains owned note plaintext. Encrypt and authenticate before persisting or restoring. */
export interface PoolScanCheckpoint {
  version: 1; manifestId: string; height: number; blockhash: string;
  birth: { txid: string; height: number }; reserveAtomic: string;
  stateOutpoint: [string, number]; reserveOutpoint: [string, number] | null;
  state: { mode: number; slots: Array<[number, string]>;
    seen: Array<[number, [string, string, number]]>; nfs: Array<[number, [string, string, number]]> };
  transitions: Array<{ txid: string; height: number; form: string; digest: string; reserveAtomic: string }>;
  published: Array<{ cm: string; record: string; slot: number; txid: string; height: number }>;
  spentBy: Array<[string, { txid: string; height: number }]>;
  walletTag: string | null;
  walletWindow: { gap: number; issued: number } | null;
  owned: Array<{ cm: string; amountAtomic: string; nf: string; note: string; slot: number;
    txid: string; height: number; address: import('./index.js').NzkAddressRef | null }>;
}

export declare function scanBrowserPool(options: {
  rpc: import('./index.js').NeuraiRpc;
  manifest: BrowserPoolManifest | C4Manifest;
  identity?: import('./index.js').BrowserTestIdentity | import('./index.js').ZkWalletIdentity;
  expectedGenesis?: string; expectedCommitment?: string;
  stopHeight?: number;
  onProgress?: (position:{height:number;total:number})=>void;
  /** 'spent-index' (C3 default) needs -spentindex and -txindex; 'blocks' replays every block. */
  strategy?: 'spent-index' | 'blocks';
  /** Pass only a previously authenticated checkpoint. Ignored after a reorganization. */
  checkpoint?: PoolScanCheckpoint;
}): Promise<BrowserPoolScan>;

export type C3Form = 'D0' | 'D1' | 'T1' | 'T2' | 'W_partial' | 'W_full';
export interface C3Manifest extends BrowserPoolManifest {
  schema: 'neurai-c3-xna-test-v1';
  identity: string;
  birth: string;
  birthHeight: number;
  guard: string;
  forms: Record<C3Form, {script:string;control:string;vk:string;vkHash:string}>;
}
export interface C3Coin { txid:string;vout:number;valueSats:string;scriptHex:string }
export interface C3PrepareOptions {
  manifest:C3Manifest; scan:BrowserPoolScan; form:C3Form;
  created?:Array<{note:Uint8Array;cm:Uint8Array;record:Uint8Array}>;
  consumed?:{note:string|Uint8Array;spent?:boolean};
  funding?:C3Coin;sponsor:C3Coin;payout?:string;feeAtomic:string;
}
/** Contains private circuit inputs. Keep inside a dedicated local proving worker. */
export interface C3Prepared {
  form:C3Form;input:Record<string,unknown>;publicSignals:string[];
  inputs:Array<{txid:string;vout:number}>;
  outputs:Array<{valueSats:bigint;scriptHex:string}>;
  manifest:C3Manifest;feeAtomic:string;
}
export declare function validateC3Manifest(manifest:C3Manifest):C3Manifest;
export declare function prepareC3(options:C3PrepareOptions & {secret?:Uint8Array}):C3Prepared;
export declare function finishC3(prepared:C3Prepared, proof:{pi_a:string[];pi_b:string[][];pi_c:string[]}, publicSignals:string[]):string;

export * from './client.js';
export * from './worker.js';

/** TEST single-asset XNA deployment. The commitment must be pinned independently. */
export type C4Form = C3Form | 'T3' | 'T4';
export interface C4Manifest extends Omit<C3Manifest, 'schema' | 'forms' | 'vkHashes'> {
  schema: 'neurai-c4-xna-test-v1'; testOnly: true;
  unit: '1'; registryRoot: string; context: string;
  issuance: {txid:string;vout:number};
  forms: Record<C4Form, {script:string;control:string;vk:string;vkHash:string}>;
}
export interface C4PrepareOptions extends Omit<C3PrepareOptions, 'manifest' | 'form'> {
  manifest:C4Manifest; form:C4Form; expectedGenesis?:string; expectedCommitment:string;
  dustRelayFeePerKb?:string;
}
export interface C4Prepared extends Omit<C3Prepared, 'manifest' | 'form'> {manifest:C4Manifest;form:C4Form}
export declare const C4_FORMS:C4Form[];
export declare function validateC4Manifest(manifest:C4Manifest, options:{expectedGenesis?:string;expectedCommitment:string}):C4Manifest;
export declare function c4DustAtomic(scriptHex:string, feePerKb?:string):bigint;
export declare function prepareC4(options:C4PrepareOptions & {secret?:Uint8Array}):C4Prepared;
export declare function finishC4(prepared:C4Prepared, proof:import('./worker.js').Groth16Proof, publicSignals:string[]):string;
