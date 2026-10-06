# @neuraiproject/neurai-privacy

JavaScript library for private XNA payments on Neurai.

Value is kept in private notes inside the Neurai privacy pool. The library
derives private wallets and `nzk` receiving addresses from the wallet's words,
reads the pool from a Neurai node and builds zero-knowledge proofs on the
user's device. Spending keys and proof inputs never leave the device. The
node only receives read-only calls until the application publishes a
transaction.

## Optional wallet-service WSS transport

The client entry exports `createWalletServiceRpc`. It adapts a negotiated
`neurai-wallet-services` **wss/2** connection to the same native
`rpc(method, params)` function used by pool scanning, admission and sponsor
recovery. It does not implement a socket or replace the existing HTTP RPC.

```js
import { createWalletServiceRpc } from '@neuraiproject/neurai-privacy/client';

const rpc = createWalletServiceRpc({
  hello, // Result of hello negotiated on this connection with wss/2.
  expectedGenesis: poolManifest.genesis, // Application-pinned chain identity.
  expectedServiceId: 'neurai-testnet-wallet-service', // Optional deployment pin.
  request: (method, params) => connection.requestEnvelope(method, params),
});
```

`connection.requestEnvelope` is an application-supplied transport function,
not an API provided here. It must correlate response IDs and resolve the
complete `{id, result}` or `{id, error}` WSS envelope, including service
errors. It must reject on timeout or disconnection and never silently resend
a transaction. Recreate the adapter after reconnecting and negotiating hello.

Read queries use `rpc.call` with native units and exact numeric strings.
Publication maps the **one-argument** `sendrawtransaction(raw)` call to
`tx.broadcast`, returning the txid string. Extra broadcast arguments are
unsupported and rejected before sending. The original negative `node_code`
becomes `Error.code`; a transport rejection, malformed reply or upstream
failure is never classified as a missing transaction (`-5`). An uncertain
publication carries `uncertain: true` and is not retried automatically.

Use a service that advertises `getblock`, `getbestblockhash`, `getspentinfo`,
`getrawmempool` and `decoderawtransaction`. The adapter refuses unavailable
and node-wallet methods locally and preserves native null/script/witness
responses. It never uses `address.get_state` as an alternative RPC schema.
The pool still checks the pinned instance and consensus activation; the
handshake does not prove that the service's node supports C6.

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
| `@neuraiproject/neurai-privacy/client` | The page | Exact amounts, pool RPC checks, coin selection, publication, address rotation storage, the bundled C4 TEST deployment and `PoolWorkerClient`. No cryptography and no secrets. |
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

startPoolWorker({ scope: self, snarkjs, artifactBaseUrl: new URL('/privacy-c4/', self.location.origin).href });
```

Without other options the worker uses the bundled C4 XNA TEST pool:
`C4_TESTNET_MANIFEST`, `C4_TESTNET_ARTIFACTS` and the contract commitment
`C4_TESTNET_COMMITMENT`. To use another deployment, pass its `manifest`,
`artifacts` and an independently pinned `expectedCommitment`; the worker
refuses a manifest whose commitment differs. Keep a deployment in a file that
ships with the application, never in data received from RPC.

The page talks to it through `PoolWorkerClient`. The client answers the
worker's RPC requests only for the read-only methods in
`POOL_READ_RPC_METHODS`, and it runs one operation at a time.

```js
import { getRPC } from '@neuraiproject/neurai-rpc';
import {
  PoolWorkerClient, C4_TESTNET_MANIFEST as manifest, assertPoolChain, confirmedPoolCoins, selectPoolCoins,
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

To pay several people from one note, replace `recipient` with
`recipients: [{ recipient, amountAtomic }, …]`. A note can be split into up
to four notes, change included.

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

- **Proving parameters.** Serve the 24 files listed in `C4_TESTNET_ARTIFACTS`,
  about 691 MiB, under `artifactBaseUrl`. The worker checks each size and
  SHA-256 before use.
- **A node with indexes.** The scanner follows the pool state with
  `getspentinfo`, so the node needs `-spentindex` and `-txindex`.
- **Transparent signing.** The worker returns funding inputs unsigned and
  never sees transparent keys. Funding and fee coins must be confirmed Legacy
  P2PKH, strict PQ (`OP_2`) or strict ECDSA (`OP_3`) outputs, and withdrawals
  can pay to any of those address types.
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

The package includes the public C4 XNA TEST pool on Neurai testnet,
`C4TESTX260930A#POOL`: its manifest, its proving parameter list and its
pinned contract commitment. The worker uses them by default. Their
verification keys come from a public setup, so they are meant for testnet
only. Another network or pool needs its own manifest, parameters and pinned
commitment, passed to `startPoolWorker`. The pool contract accepts deposits
up to the XNA money range; `startPoolWorker({ depositLimitAtomic })` sets a
lower limit for an application.

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

## Experimental C5 profile (isolated tests)

C4 remains the bundled public TEST deployment. C5 is an explicit alternative
for native XNA only; it requires the node's profile-2 public-transition rules.
Do not send C5 transactions to a node where those rules are inactive.

Configure `startPoolWorker` with a reviewed C5 manifest (schema
`neurai-c5-xna-test-v1`, `zkProfile: 2`), its own artifacts, and independently
pinned `expectedGenesis` and `expectedCommitment`. The library never substitutes
C4 parameters or accepts a relabeled C4 leaf: each C5 leaf must explicitly
select profile 2. The commitment pin authenticates the reviewed scripts;
structural manifest validation does not audit arbitrary contracts.

The worker supports D0/D1, T1/T2/T3/T4, and partial/full reserve withdrawals.
`prepareC5`, `finishC5` and `buildC5Transaction` are available for explicit
integration. Private ownership, note membership, hidden amounts and
conservation remain in the ZK circuit. The public transition carries append
and indexed insertion paths. Its five canonical chunks precede the proof and
verification key in the MAST witness. The scanner checks these paths against
the state and commitments reconstructed from the confirmed transaction.

`verifyC5Transition` only validates public paths and their supplied binding;
it does not verify Groth16, authorize spending, validate a block, or replace
the node. Never accept a binding chosen by an untrusted transcript producer.
Deposit amount/digest binding and the complete conjunction of proof, paths
and contract rules are additionally enforced by profile 2 in the node.

C4 and C5 share private-wallet derivation, note encryption, address rotation
and local signing, but have distinct manifests, commitments, proving keys
and scanner checkpoints. The browser does not invoke Python or Node for C5
operations. The current JS adapter does not implement asset pools.

The checked-in public vectors exercise all eight transitions and malformed
paths. The isolated browser review generated and confirmed all eight forms
with local Legacy, PQ and ECDSA signatures, recovery, parameter integrity and
cancellation checks. The parameters used for those tests are PUBLIC TEST keys,
not keys for valuable funds. They are not shipped inside the npm package.

C5 clients additionally require
`getblockchaininfo.zk_public_tree.active_for_next_block === true` before
funding/publication. An old RPC node with a matching genesis is rejected;
C4 retains its existing RPC behavior. This response is a capability check,
not a proof that an untrusted server validates consensus.

### C6 TEST sponsor authorization management

The opt-in `SponsorJournal` and `IndexedDbSponsorStore` APIs persist authorization
exposure, enforce cumulative wallet/operation budgets and prepare `SIGHASH_ALL`
sponsor sweeps. A private payment confirmed with a different sponsor does not
revoke older 0x83 signatures. Pending sweeps do not cancel them.
See [C6-SPONSOR-JOURNAL.md](docs/C6-SPONSOR-JOURNAL.md) for storage, chain
authentication, recovery and integration requirements. C4/C5 signing defaults
remain unchanged; this does not switch the webwallet to C6.

The opt-in C6 TEST lifecycle is documented in
[docs/C6-SPONSOR-FLOW.md](docs/C6-SPONSOR-FLOW.md). It adds active-chain observation,
persisted reviewed publication and ALL recovery to `SponsorJournal`. It is not
an implementation/activation of the public C6 pool or its proving worker.

### C6 TEST local J2 preparation and proving

`createC6JoinWallet` is an opt-in XNA J2 2-to-1 builder/prover for Node, browser
and worker entries. It requires independently pinned genesis/commitment and
local note secrets and paths. It preserves the first note's owner and viewing
key, validates exact conservation and instance context, and checks a private
intent snapshot across asynchronous proving. See [C6-JOIN.md](docs/C6-JOIN.md).

Real TEST proofs from the compiled API have been verified with C++ and confirmed
in isolated regtest; Chromium covers cancellation and mixed J2/T1 workers.
This is not the complete C6 deposit/transfer/withdraw worker, a chain scanner,
public deployment or a production-security claim. Application-pinned TEST
parameters and a separate public relocator are still required.

### C6 XNA TEST portable-operation API

`createC6OperationWallet` now constructs D/T1/T2/T3/W witnesses locally;
`scanC6Pool` recovers confirmed private notes from an independently pinned
birth using a trusted validating RPC. It follows confirmed state spends by
index when available, falls back to checked block replay, and tolerates ordinary
chain growth while rejecting reorganizations of the captured prefix. C6 has no
persistent incremental scan checkpoint yet. `startC6PoolWorker` keeps identity,
note paths and proving inputs in a dedicated browser worker and emits public
portable packets. Explicit deployment/artifact pins and restored reservation
journals are required. This is separate from the asset sponsor-flow API;
XNA D funding must not be treated as an exposed asset `0x83` sponsorship.
See [C6 operation, recovery and worker protocol](docs/C6-OPERATIONS.md) for
byte order, TEST scope, cancellation and outstanding integration.

### C6 ordinary assets (TEST)

The browser worker now supports an independently pinned pool per ordinary asset,
with exact units, D/T/J2/W, encrypted recovery and external XNA sponsorship.
See [C6-ASSETS.md](docs/C6-ASSETS.md) for the API and authorization sequence.

#### C6 completed scan checkpoints

The C6 worker automatically saves completed scans in an authenticated encrypted
checkpoint, in addition to its bounded transaction prefix. This stores tree
nodes and recovered records privately inside the worker. Reopening verifies the
captured block and pinned deployment, follows only new confirmed state spends,
and rechecks current reservations. A receiving-window change repeats note
recovery. A reorganization or corrupt checkpoint falls back to validated replay.
The completed snapshot is bounded to 3 MiB serialized plaintext and is disposable;
it never replaces the durable pending-operation journal. Storage read/write or
CAS failures remain errors, rather than returning an unchecked balance.

The webwallet saves its encrypted operation journal automatically. Exporting a
backup is optional; mnemonic scanning recovers confirmed notes, not necessarily
unpublished portable packets or exposed sponsor authorizations. Keep a current
backup when transferring pending operations between browsers or devices.
