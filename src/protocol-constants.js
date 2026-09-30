/**
 * Neurai TEST pool compatibility identifiers.
 *
 * These bytes are part of circuit hashes, encrypted vault backups and the
 * current Python CLI interface. Keep them stable until those formats and the
 * Python module are migrated together.
 */
export const NEURAI_POOL_HASH_LABELS = Object.freeze({
  deposit: 'NIP045/dep\x01',
  withdrawal: 'NIP045/wdr\x00',
  request: 'NIP045/req\x00',
  data: 'NIP045/dat\x02'
});

export const NEURAI_TEST_VAULT_AAD_V1 = 'Neurai/NIP045/testnet-wallet/vault/v1';
export const NEURAI_PYTHON_CLI_MODULE = 'contrib.nip045_wallet.cli';
export const NEURAI_PYTHON_PROGRESS_PREFIX = 'NIP045_PROGRESS:';
