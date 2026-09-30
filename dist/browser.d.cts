export { RESET_TESTNET_GENESIS, NeuraiPrivacy } from './index.cjs';
export type { NeuraiRpc, PrivacyBackend, RecipientDescriptor, WalletNote, WalletScan, PoolHistoryItem, TransactionResult, FundingStatus, SpendOptions } from './index.cjs';
export { BN254_SCALAR_FIELD, encodeField, decodeField, poseidonPermutation, poseidonBytes } from './index.cjs';
export type { CP1Note } from './index.cjs';
export { encodeNote, decodeNote, deriveOwner, deriveNullifierKey, noteCommitment, noteNullifier } from './index.cjs';
export { sealVault, openVault } from './index.cjs';
export { deriveViewPublic, sealNote, openNoteRecord } from './index.cjs';
export { BrowserTestIdentity } from './index.cjs';
export { NZK_ARGON2ID, NZK_HRP, NZK_DEFAULT_GAP, NZK_MAX_GAP, walletSeedFromMnemonic, deriveZkRoot, zkFingerprint, deriveZkAddressKeys, nzkInstanceTag, encodeNzkAddress, decodeNzkAddress, parseRecipient, bech32mEncode, bech32mDecode, ZkWalletIdentity } from './index.cjs';
export type { NzkNetwork, NzkAddressRef, NzkPoolScope, ZkWalletOptions } from './index.cjs';

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
  notes: Array<{ cm: string; amountAtomic: bigint; nf: bigint; note: string; spent: boolean; slot: number; txid: string; height: number; spentTxid?: string; spentHeight?: number; address?: import('./index.cjs').NzkAddressRef }>;
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
    txid: string; height: number; address: import('./index.cjs').NzkAddressRef | null }>;
}

export declare function scanBrowserPool(options: {
  rpc: import('./index.cjs').NeuraiRpc;
  manifest: BrowserPoolManifest;
  identity?: import('./index.cjs').BrowserTestIdentity | import('./index.cjs').ZkWalletIdentity;
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

export * from './client.cjs';
export * from './worker.cjs';
