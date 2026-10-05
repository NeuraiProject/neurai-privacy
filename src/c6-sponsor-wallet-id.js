import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { walletSeedFromMnemonic } from './zk-wallet.js';
const hex = b => Array.from(b,n=>n.toString(16).padStart(2,'0')).join('');
/** Stable wallet-wide journal identity, shared by Legacy/PQ/ECDSA accounts. */
export async function c6SponsorWalletId(mnemonic,passphrase='') {
  const seed=await walletSeedFromMnemonic(mnemonic,passphrase);
  try{return hex(hmac(sha256,seed,new TextEncoder().encode('NeuraiC6SponsorWallet/v1')));}finally{seed.fill(0);}
}
