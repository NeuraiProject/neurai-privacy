# @neuraiproject/neurai-privacy

JavaScript library for private XNA payments on Neurai.

Value is kept in private notes inside the Neurai privacy pool. The library
derives private wallets and `nzk` receiving addresses from the wallet's words,
reads the pool from a Neurai node and builds zero-knowledge proofs on the
user's device. Spending keys and proof inputs never leave the device. The
node only receives read-only calls until the application publishes a
transaction.

## What it does

- **Private wallet from the wallet words.** It derives a private wallet from
  the BIP-39 words, the optional BIP-39 passphrase, an optional ZK passphrase
  and an account number. The same inputs always recover the same wallet, so
  there is no extra file to back up.
- **Receiving addresses.** It encodes `nzk1…`, `tnzk1…` and `rnzk1…`
  addresses for mainnet, testnet and regtest. It hands out a new address for
  each payment and recovers them with a gap limit, like an HD wallet.
- **Pool operations.** Deposit XNA into the pool, assign all or part of a
  note to another address, and withdraw a note to a transparent address. The
  library chooses the right circuit for each case.
- **Chain scanning.** It rebuilds the pool state from the node, checks it
  against the pinned pool contract and finds the notes that belong to the
  wallet, marking the spent ones.
- **Proofs on the device.** It downloads the Groth16 proving parameters,
  checks their size and SHA-256, proves in a Web Worker and verifies every
  proof before returning a transaction.
- **Publication.** It rechecks the inputs, asks the node whether it accepts
  the transaction, broadcasts it and reports an unknown outcome as uncertain
  instead of guessing.
- **Building blocks.** Poseidon hashing, note encoding, commitments,
  nullifiers, encrypted note records (HPKE) and an encrypted JSON vault for
  identities that do not come from wallet words.

## Install

The package is configured for public npm publication but has not been
published yet. After publication, install it with:

```sh
npm install @neuraiproject/neurai-privacy
```

For local development before publication, run `npm ci && npm run build`
in this directory, then use `npm install /path/to/neurai-privacy` in the app.
The bundles include `@noble/hashes`, `@noble/ciphers` and `@noble/curves`
2.2.0, so the published package has no runtime dependencies on them.
Node use needs Node 20.19 or later. Proving needs
snarkjs 0.7.6, which the application passes to the worker. It is not a
dependency because snarkjs is GPL-3.0 licensed.

## Entry points

| Import | Load it in | Contents |
| --- | --- | --- |
| `@neuraiproject/neurai-privacy/client` | The page | Exact amounts, pool RPC checks, coin selection, publication, address rotation storage, the pinned pool manifest and `PoolWorkerClient`. No cryptography and no secrets. |
| `@neuraiproject/neurai-privacy/worker` | A dedicated Web Worker | `startPoolWorker` and the operations it runs: planning, parameter loading, proving and transaction building. |
| `@neuraiproject/neurai-privacy/browser` | Browser or worker | Everything above plus identities, addresses, the scanner, the transaction builder and the building blocks. |
| `@neuraiproject/neurai-privacy` | Node | The browser entry plus the Node backend described below. Bundlers resolve it to the browser entry. |

Keep every secret inside the worker. The page only handles public data:
recipient descriptors, `nzk` addresses, balances and unsigned transactions.

The `client`, `worker` and `browser` entries are ES modules. From CommonJS,
`require('@neuraiproject/neurai-privacy')` loads the Node build with its own
declarations. Node 20.19 and later can also `require()` the three ES module
entries; TypeScript accepts that with `module` set to `node20` or `nodenext`.

## Using it in a web app

The worker file holds the private wallet:

```js
// pool.worker.js
import * as snarkjs from 'snarkjs';
import { startPoolWorker } from '@neuraiproject/neurai-privacy/worker';

startPoolWorker({ scope: self, snarkjs, artifactBaseUrl: new URL('/privacy-c3/', self.location.origin).href });
```

The page talks to it through `PoolWorkerClient`. The client answers the
worker's RPC requests only for the read-only methods in
`POOL_READ_RPC_METHODS`, and it runs one operation at a time.

```js
import { getRPC } from '@neuraiproject/neurai-rpc';
import {
  PoolWorkerClient, C3_TESTNET_MANIFEST as manifest, assertPoolChain, confirmedPoolCoins, selectPoolCoins,
  recheckInputs, admitTransaction, publishTransaction, publicationStatus, rotationStorageKey,
} from '@neuraiproject/neurai-privacy/client';

const rpc = getRPC(rpcUser, rpcPassword, rpcUrl);
await assertPoolChain(rpc, manifest);
const pool = new PoolWorkerClient({
  worker: new Worker(new URL('./pool.worker.js', import.meta.url), { type: 'module' }),
  rpc,
  onStage: text => showProgress(text),
  onCrash: () => showLocked(), // the worker lost its keys; the next call needs a new client
});

// Private wallet from the open wallet's words.
const { addresses } = await pool.derive({ mnemonic, passphrase, zkPassphrase: '', family: 'legacy', account: 0 });
showReceivingAddress(addresses.current.address); // tnzk1...
const { result, checkpoint } = await pool.scan(); // balanceAtomic, notes, transitions
// Save checkpoint in the app's local storage for the next session.

// Assign 2 XNA from a note to another person's address.
const coins = await confirmedPoolCoins(rpc, walletUtxos, { baseCurrency: 'XNA' });
const { sponsor } = selectPoolCoins(coins, { action: 'transfer', amountAtomic: 200000000n, feeAtomic: 10000000n });
const prepared = await pool.prepare({
  action: 'transfer', amountAtomic: '200000000', feeAtomic: '10000000',
  sponsor, note: result.notes[0].cm, recipient: 'tnzk1...',
});
const signedRaw = signFundingInputs(prepared.raw, [sponsor]); // your transparent signer
await recheckInputs(rpc, manifest, prepared.inputPoints);
const { txid } = await admitTransaction(rpc, signedRaw); // testmempoolaccept, nothing is sent
await publishTransaction(rpc, manifest, { raw: signedRaw, txid, points: prepared.inputPoints });
```

### Resume a scan after restarting the app

The worker can return an encrypted `checkpoint` with every scan. Save it in
IndexedDB or the mobile app's local storage, under a key specific to the
wallet and network. The storage adapter below is supplied by the application:

```js
const { addresses } = await pool.derive({ mnemonic, family: 'legacy', account: 0 });
const key = rotationStorageKey({
  network: 'testnet', derivation: addresses.derivation, family: addresses.family,
  storageId: addresses.storageId, account: 0,
}) + ':scan';
let previous;
try { previous = await storage.get(key); } catch { /* storage unavailable */ }
const scan = await pool.scan({ checkpoint: previous ?? undefined });
if (scan.checkpoint) {
  try { await storage.set(key, scan.checkpoint); } catch { /* storage full or unavailable */ }
}
showBalance(scan.result.balanceAtomic);
```

The checkpoint contains the reconstructed public pool state and the wallet's
found notes, encrypted and authenticated with a key derived inside the worker.
The page receives only the encrypted string. On the next scan, the worker
checks the saved block against the active chain and processes subsequent pool
transactions. If the cache is corrupt, belongs to another wallet or pool, or
points to a block lost in a reorganization, it rebuilds from the pool birth.
A wider address gap also makes it search old records again. The first scan
still processes the full pool history; storage size grows with that history.
Do not upload checkpoints to a server. Direct callers of `scanBrowserPool`
receive a plaintext checkpoint containing owned notes; they must encrypt and
authenticate it before storing it. The worker API performs this step. If
storage is unavailable or full, scanning continues without a saved checkpoint.

`create({ password })` and `restore({ backup, password })` open a random
identity kept in an encrypted JSON file instead of a derived one. An
application that does not use `PoolWorkerClient` can post the same messages
itself. The protocol is described at the top of `src/pool-worker.js`.

The application provides these parts:

- **Proving parameters.** Serve the 30 files listed in `C3_TESTNET_ARTIFACTS`,
  about 335 MiB, under `artifactBaseUrl`. The worker checks each size and
  SHA-256 before use.
- **A node with indexes.** The scanner follows the pool state with
  `getspentinfo`, so the node needs `-spentindex` and `-txindex`.
- **Transparent signing.** The worker returns funding inputs unsigned and
  never sees transparent keys. Funding coins must be confirmed P2PKH outputs.
  `@neuraiproject/neurai-sign-transaction` can sign them.
- **Deposit coins.** A deposit spends one confirmed coin of exactly the
  deposited amount and a separate coin for the fee. `inspectFundingTransaction`
  checks a transaction that creates such a coin.
- **Publication state.** `publishTransaction` rejects with `uncertain: true`
  when the node call fails after sending. Keep the transaction ID and call
  `publicationStatus` later. It answers confirmed, mempool or retryable.
- **Rotation state.** `rotationStorageKey`, `loadRotation` and `saveRotation`
  store the last issued address and the gap in any `localStorage`-like
  object. This state is not secret, and a scan rebuilds it if it is lost.

Amounts are atomic units, as bigint or decimal strings.
`rpcAmountToSatoshis` converts node amounts without floating-point
arithmetic. `parseXna` and `formatXna` handle user input and display.

## Receiving addresses

The derivation scheme is [NeuraiZK/v2](docs/nzk-v2-derivation.md). The
mandatory `family` is `legacy`, `ecdsa` or `pq`.
The same wallet words produce separate private keys for each family. Argon2id
with 64 MiB derives a root from the BIP39 seed and optional ZK passphrase;
HKDF-SHA256 binds address keys to family, account, branch, index and pool.
This replaces v1 without automatic migration. Old TEST notes need their old
keys. Receiving descriptors keep format version 1 and work across families.
`fromMnemonic` validates English BIP39 words; other BIP39 wordlists can use
`fromSeed` with their independently validated 64-byte seed.

- **Format.** An address is bech32m. Its 69-byte payload holds a version
  byte, the owner, the viewing public key and a 4-byte tag of the pool. It is
  a wallet format only; the node's rules do not change.
- **Rotation.** `issueNext()` hands out a fresh receiving address. It refuses
  to go more than `gap` unused addresses past the last used one unless
  `force` is set. The default gap is 20 and the maximum 1000.
- **Recovery.** A scan tries every receiving address up to the last used
  index plus the gap. Change goes to a separate internal address and never
  uses receiving indexes.
- **Wallet check.** `fingerprint` is 8 hex characters. It lets the user
  confirm that the same words and passphrases open the same private wallet.
- **Recipients.** `parseRecipient(text, scope)` accepts an `nzk` address or a
  JSON descriptor. It rejects addresses of another network or pool.

```js
import { ZkWalletIdentity, decodeNzkAddress } from '@neuraiproject/neurai-privacy/browser';

const scope = { network: 'testnet', domain: manifest.domain, assetId: manifest.assetId };
const wallet = await ZkWalletIdentity.fromMnemonic({ mnemonic, passphrase: '', zkPassphrase: '', family: 'legacy', account: 0, ...scope });
const address = wallet.addressAt(0, wallet.currentIndex()); // tnzk1...
const next = wallet.addressAt(0, wallet.issueNext());
const descriptor = decodeNzkAddress(next, scope);
wallet.lock();
```

Run this code inside the worker, because the identity holds spending keys.
The test vectors are in `test/fixtures/nzk-vectors.json`.

## Networks

The package includes the pool manifest and the proving parameter list for
Neurai testnet, `C3_TESTNET_MANIFEST` and `C3_TESTNET_ARTIFACTS`. The worker
uses them by default. Their verification keys come from a public setup, so
they are meant for testnet only. Another network needs its own manifest and
parameters, passed to `startPoolWorker`. The pool contract accepts deposits up
to the XNA money range; `startPoolWorker({ depositLimitAtomic })` sets a lower
limit for an application.

## What stays public

The fee is paid from a transparent coin, so it shows which transparent wallet
paid for each pool transaction. Deposits and withdrawals also show their
amounts and transparent addresses. Assignments inside the pool hide the
receiver and the amount. The time of each transaction and the node the
application talks to remain visible. See the
[security and privacy model](docs/security-model.md).

## Documentation

The [`docs/`](docs/README.md) folder explains how the pool and the library
work:

- [How the privacy pool works](docs/privacy-pool.md)
- [Library architecture](docs/architecture.md)
- [Transaction lifecycle](docs/transaction-lifecycle.md)
- [Chain scanning and checkpoints](docs/chain-scanning.md)
- [NeuraiZK/v2 derivation](docs/nzk-v2-derivation.md)
- [Data formats](docs/data-formats.md)
- [Security and privacy model](docs/security-model.md)

## Node backend

`NeuraiPrivacy` with `CliTestBackend` drives the Python privacy wallet of the
Neurai node repository from Node. It keeps the spending key in an encrypted
vault, scans, proves with a Docker prover and publishes. It needs Python 3,
Docker, the proving parameters and a local Neurai node. Passwords go over
stdin, never on the command line or in environment variables. Its methods
are listed in `src/index.d.ts`, and `integration/` has scripts that exercise
it against a node.

## Development

```sh
npm ci              # Install the locked development dependencies
npm run build       # Generate Node and browser bundles in dist/
npm test            # Node test runner
npm run test:types  # TypeScript declarations
npm run test:build  # Check bundled entry points
```

The build writes ESM files for the browser, client and worker, which share their common code through `dist/chunks`, and ESM/CJS files for Node. It also writes ESM and CommonJS declarations and the bundled dependency licenses into `dist/`. `npm pack` builds these files automatically. `npm run test:types` checks the published declarations with TypeScript `NodeNext` and `Node16` settings.

The browser pages in `test/` load the library without a bundler. Run
`npm install` first, then serve the package root with any static server,
because their import maps point to `node_modules/@noble`.
`test/browser-smoke.html` shows PASS when the browser entry works.

## License

MIT. See [LICENSE](./LICENSE).
