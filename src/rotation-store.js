/* Non-secret receiving-address rotation state for wallet-seed identities.
 * It only remembers the last handed-out index and the gap limit, keyed by
 * wallet, family check and account. The chain still recovers everything if it
 * is lost; a ZK passphrase is never stored here. `storage` is any object with
 * getItem/setItem, such as window.localStorage.
 */
export const ROTATION_MAX_GAP = 1000;

export function rotationStorageKey({ network, walletId = '', fingerprint, account }) {
  if (typeof fingerprint !== 'string' || !/^[0-9a-f]{8}$/.test(fingerprint)) throw new Error('fingerprint must be 8 hex characters');
  if (!Number.isInteger(account) || account < 0) throw new Error('account must be a non-negative integer');
  return `neurai-privacy-zk:${network}:${walletId}:${fingerprint}:${account}`;
}

export function loadRotation(storage, key) {
  try {
    const value = JSON.parse(storage?.getItem(key) ?? 'null');
    if (value && Number.isInteger(value.issued) && value.issued >= 0 && value.issued < 2 ** 31 &&
        Number.isInteger(value.gap) && value.gap >= 1 && value.gap <= ROTATION_MAX_GAP) {
      return { gap: value.gap, issued: value.issued };
    }
  } catch { /* unavailable or corrupt storage: start from the chain */ }
  return null;
}

export function saveRotation(storage, key, { gap, issued }) {
  if (!storage || typeof storage.setItem !== 'function') return false;
  try {
    storage.setItem(key, JSON.stringify({ gap, issued }));
    return true;
  } catch { return false; } // private mode or quota: the chain still recovers everything
}
