export { RESET_TESTNET_GENESIS, NeuraiPrivacy } from './index.cjs';
export type { NeuraiRpc, PrivacyBackend, RecipientDescriptor, WalletNote, WalletScan, PoolHistoryItem, TransactionResult, FundingStatus, SpendOptions } from './index.cjs';
export { BN254_SCALAR_FIELD, encodeField, decodeField, poseidonPermutation, poseidonBytes } from './index.cjs';
export type { CP1Note } from './index.cjs';
export { encodeNote, decodeNote, deriveOwner, deriveNullifierKey, noteCommitment, noteNullifier } from './index.cjs';
export { sealVault, openVault } from './index.cjs';
export { deriveViewPublic, sealNote, openNoteRecord } from './index.cjs';
export { BrowserTestIdentity } from './index.cjs';
export { NZK_DERIVATION, NZK_FAMILIES, NZK_ARGON2ID, NZK_HRP, NZK_DEFAULT_GAP, NZK_MAX_GAP, walletSeedFromMnemonic, deriveZkRoot, zkFingerprint, deriveZkAddressKeys, nzkInstanceTag, encodeNzkAddress, decodeNzkAddress, parseRecipient, bech32mEncode, bech32mDecode, ZkWalletIdentity } from './index.cjs';
export type { NzkFamily, NzkNetwork, NzkAddressRef, NzkPoolScope, ZkWalletOptions } from './index.cjs';

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
  manifest: C4Manifest;
  /** Independently pinned contract commitment that the manifest must match. */
  expectedCommitment: string;
  expectedGenesis?: string;
  identity?: import('./index.cjs').BrowserTestIdentity | import('./index.cjs').ZkWalletIdentity;
  stopHeight?: number;
  onProgress?: (position:{height:number;total:number})=>void;
  /** 'spent-index' (default) needs -spentindex and -txindex; 'blocks' replays every block. */
  strategy?: 'spent-index' | 'blocks';
  /** Pass only a previously authenticated checkpoint. Ignored after a reorganization. */
  checkpoint?: PoolScanCheckpoint;
}): Promise<BrowserPoolScan>;

export * from './client.cjs';
export * from './worker.cjs';

/** Single-asset XNA TEST deployment. The commitment must be pinned independently. */
export type C4Form = 'D0' | 'D1' | 'T1' | 'T2' | 'T3' | 'T4' | 'W_partial' | 'W_full';
export interface C4Manifest {
  schema: 'neurai-c4-xna-test-v1'; testOnly: true; profile: 'xna';
  genesis: string; domain: string; assetId: string;
  commitment: string; reserveCommitment: string; guard: string;
  identity: string; birth: string; birthHeight: number;
  unit: '1'; registryRoot: string; context: string;
  issuance: {txid:string;vout:number};
  forms: Record<C4Form, {script:string;control:string;vk:string;vkHash:string}>;
  /** Informational address of the state contract. */
  address?: string;
}
/** A confirmed transparent coin: Legacy P2PKH, strict PQ (OP_2) or strict ECDSA (OP_3). */
export interface C4Coin { txid:string;vout:number;valueSats:string;scriptHex:string }
export interface C4PrepareOptions {
  manifest:C4Manifest; scan:BrowserPoolScan; form:C4Form;
  created?:Array<{note:Uint8Array;cm:Uint8Array;record:Uint8Array}>;
  consumed?:{note:string|Uint8Array;spent?:boolean};
  funding?:C4Coin;sponsor:C4Coin;payout?:string;feeAtomic:string;
  expectedGenesis?:string; expectedCommitment:string; dustRelayFeePerKb?:string;
}
/** Contains private circuit inputs. Keep inside a dedicated local proving worker. */
export interface C4Prepared {
  form:C4Form;input:Record<string,unknown>;publicSignals:string[];
  inputs:Array<{txid:string;vout:number}>;
  outputs:Array<{valueSats:bigint;scriptHex:string}>;
  manifest:C4Manifest;feeAtomic:string;
}
export declare const C4_FORMS:C4Form[];
export declare function validateC4Manifest(manifest:C4Manifest, options:{expectedGenesis?:string;expectedCommitment:string}):C4Manifest;
export declare function c4DustAtomic(scriptHex:string, feePerKb?:string):bigint;
export declare function prepareC4(options:C4PrepareOptions & {secret?:Uint8Array}):C4Prepared;
export declare function finishC4(prepared:C4Prepared, proof:import('./worker.cjs').Groth16Proof, publicSignals:string[]):string;
