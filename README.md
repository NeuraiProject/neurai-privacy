# @neuraiproject/neurai-privacy

JavaScript library for private XNA payments in the Neurai C7 privacy pool.

Value is kept in private notes inside the pool. The library derives a private
wallet and `nzk` receiving addresses from the wallet's words, reads the pool
from a Neurai node and builds zero-knowledge proofs on the user's device.
Spending keys and proof inputs never leave a dedicated Web Worker. The node
only receives read-only calls until the application publishes a transaction.

> **TEST only.** C7 deployments are experimental TEST instances. Their proving
> keys come from a public setup and nothing has been independently audited.
> Do not use them for funds of value.

## 0.4.0: C7 only

0.4.0 removes the C4, C5 and C6 pools. The C7 runtime, which used to live in
modules named after C6, now has C7 names. This is a breaking release.

**Removed APIs**

- The C4 and C5 pools: `startPoolWorker`, `PoolWorkerClient`, `prepareC4`,
  `finishC4`, `prepareC5`, `finishC5`, the C5 transition helpers, the
  bundled `C4_TESTNET_*` deployment, `scanBrowserPool` and the C4
  pool-operations helpers (`summarizeScan`, `planC4Operation`, `proveC4`,
  `buildC4Transaction`, `buildC5Transaction`).
- The C6 profiles `C6-XNA-TEST-J2-v2` and `C6-ORDINARY-ASSET-TEST-J2-v1`,
  including C6 asset pools (`c6AssetMetadata`, `c6AssetTransferScript`,
  `c6ReadAssetTransfer`, `parseAssetAmount`) and the whole sponsor flow,
  journal and sweep (`SponsorJournal`, `C6SponsorFlow`, `scanC6SponsorChain`,
  `prepareSponsorSweep`, `validateSponsorSignature`, `c6SponsorWalletId`,
  `validateC6SponsorDeployment`, `c6SponsorIntent`).
- The Node backend for the Python wallet: `NeuraiPrivacy` and
  `CliTestBackend`.
- `BrowserTestIdentity` (random identities in an encrypted file) and
  `ZkWalletIdentity`, with the nzk v1 address functions (`zkFingerprint`,
  `deriveZkAddressKeys`, `nzkInstanceTag`, `encodeNzkAddress`,
  `decodeNzkAddress`, `parseRecipient`).
- The HPKE note records of C4 to C6: `deriveViewPublic`, `sealNote`,
  `openNoteRecord`.
- The address rotation store (`ROTATION_MAX_GAP`, `rotationStorageKey`,
  `loadRotation`, `saveRotation`), `selectPoolCoins` and
  `MIN_SPONSOR_CHANGE_ATOMIC`.

**Renamed APIs.** The old names stay as deprecated aliases for one release.
They are the same objects as the new names.

| Old name | New name |
| --- | --- |
| `startC6PoolWorker` | `startC7PoolWorker` |
| `C6WorkerClient` | `C7WorkerClient` |
| `scanC6Pool` | `scanC7Pool` |
| `buildC6Transaction` | `buildC7Transaction` |
| `readC6Packet` | `readC7Packet` |
| `createC6JoinWallet` | `createC7JoinWallet` |
| `createC6OperationWallet` | `createC7OperationWallet` |
| `IndexedDbSponsorStore` | `IndexedDbJournalStore` |
| `C7WalletIdentity.prepareC6Deposit`, `prepareC6Transfer`, `prepareC6Withdrawal`, `prepareC6Join` | `prepareC7Deposit`, `prepareC7Transfer`, `prepareC7Withdrawal`, `prepareC7Join` |
| Types `C6JoinManifest`, `C6JoinNote`, `C6JoinRequest`, `C6JoinPrepared`, `C6JoinResult`, `C6JoinWallet` | `C7JoinManifest`, `C7JoinNote`, `C7JoinRequest`, `C7JoinPrepared`, `C7ProofResult`, `C7JoinWallet` |
| Types `C6OperationManifest`, `C6OperationContext`, `C6DepositRequest`, `C6TransferRequest`, `C6WithdrawalRequest`, `C6OperationPrepared`, `C6OperationWallet` | `C7OperationManifest`, `C7OperationContext`, `C7DepositRequest`, `C7TransferRequest`, `C7WithdrawalRequest`, `C7OperationPrepared`, `C7OperationWallet` |
| Types `C6RecoveredNote`, `C6PoolScan`, `C6Packet`, `C6BuiltTransaction` | `C7RecoveredNote`, `C7PoolScan`, `C7Packet`, `C7BuiltTransaction` |
| Types `SponsorStore`, `ZkWalletOptions` | `JournalStore`, `C7WalletOptions` |

**New exports.** `validateC7Deployment(deployment)` checks a pinned
deployment. `c7Intent(raw, deployment)` returns the public intent of a pool
transaction. Both are in the `client` entry.

**Behaviour changes**

- A deployment must have `kind: 'xna'` and an `emission` (`"txid:vout"`),
  and a manifest must have the profile `C7_PROFILE` (`C7-XNA-TEST-v1`).
  Other profiles are refused.
- J2 requests and transfers need the change address (`change`): the
  descriptor of the spent note's address, or of note 0 for J2. A withdrawal
  that leaves change needs it too. `C7WalletIdentity.prepareC7*` supplies it.
- Error messages start with `C7` instead of `C6`, except
  `C6 private journal missing: …`. NeuraiWallet and the web wallet recognise
  that text with `startsWith`, so it stays verbatim until the aliases are
  removed.
- The scanner's error codes are `C7_INDEX_UNAVAILABLE` and
  `C7_HISTORY_UNAVAILABLE` (they were `C6_…`).
- Storage keys and journal types keep their names (`neurai-c6-private-journal-v1`,
  `neurai-c6-scan-prefix-v1`, `c6-scan-state-v2:`…), so journals and scan
  caches saved by earlier releases stay readable. The protocol byte tags
  (`NeuraiPoolC6/pay`, `NeuraiPoolC6/J2/data`, `NeuraiC6Packet`,
  `NeuraiC6Intent/v1` and the `NC6PKT` packet magic) are unchanged on
  purpose: the C7 contract and proofs commit to them.
- `assertPoolChain` only checks the genesis; the C5 capability check is gone.
- The optional peer dependency `@neuraiproject/neurai-rpc` accepts
  `^0.7.0 || ^0.8.0 || ^0.9.0`.

**Tests.** The suite runs a C7 flow end to end on an in-memory chain with the
real C7 deployment of the 2026-09-26 testnet (`test/fixtures/c7-deployment.json`):
deposit, transfer, join and withdrawal through the scanner, the transaction
builder, the worker, its client and the durable journal.

## What it does

- **Private wallet from the wallet words.** The BIP-39 words, the optional
  BIP-39 passphrase, an optional ZK passphrase, a family (`legacy`, `ecdsa`
  or `pq`) and an account number give one private wallet per pool. The same
  inputs always recover it, so there is no extra file to back up.
- **Receiving addresses.** An account has one viewing key and any number of
  unlinkable `nzk` version 3 addresses (`nzk1…`, `tnzk1…`, `rnzk1…`).
  Recovery costs one ristretto255 multiplication per published record,
  whatever the number of addresses, so there is no address gap.
- **Pool operations.** Deposit XNA, transfer to up to three outputs (change
  included), join two notes into one (J2) and withdraw to a Legacy, strict
  PQ or strict ECDSA address.
- **Local proving worker.** It downloads the Groth16 proving files, checks
  their size and SHA-256, proves in a Web Worker and verifies every proof
  before returning it.
- **Durable encrypted journal.** Every operation is reserved before proving
  and saved before it is returned, in an encrypted compare-and-swap store,
  so two tabs never spend the same note and a restart never forgets an
  exposed operation.
- **Public relocation.** A proof does not depend on the current pool state.
  The worker rebuilds the public tree transition against the latest
  confirmed state when it builds the transaction, and `rebuild` does it
  again later without proving again.
- **Chain scanning.** It rebuilds the pool state from a pinned birth, checks
  each transition against the pinned contract and finds the wallet's notes.
- **Publication helpers.** They recheck inputs, ask the node whether it
  accepts a transaction, broadcast it and report an unknown outcome as
  uncertain instead of guessing.

## Install

```sh
npm install @neuraiproject/neurai-privacy
```

The bundles include `@noble/hashes`, `@noble/ciphers` and `@noble/curves`
2.2.0, `@scure/bip39` 2.0.1 and `@scure/base` 2.0.0, so the package has no
runtime dependencies. Node use needs Node 20.19 or later. Proving needs
snarkjs 0.7.6, which the application passes to the worker. It is not a
dependency because snarkjs is GPL-3.0 licensed.

## Entry points

| Import | Load it in | Contents |
| --- | --- | --- |
| `@neuraiproject/neurai-privacy/client` | The page | Exact amounts, pool RPC checks, publication, `validateC7Deployment`, `c7Intent`, `IndexedDbJournalStore` and `C7WorkerClient`. No key or note cryptography and no secrets. |
| `@neuraiproject/neurai-privacy/worker` | A dedicated Web Worker | `startC7PoolWorker`, the scanner, the operation and J2 wallets, the transaction builder and the artifact loader. |
| `@neuraiproject/neurai-privacy/browser` | Browser or worker | Everything above plus `C7WalletIdentity`, `C7Account`, C7 addresses and notes, the wallet root and the building blocks (Poseidon, CP1 notes, vault). |
| `@neuraiproject/neurai-privacy` | Node | The same API as the browser entry, as ESM and CommonJS. Bundlers resolve it to the browser entry. |

Keep every secret inside the worker. The page only handles public data:
`nzk` addresses, balances, commitments, packets and unsigned transactions.

The `client`, `worker` and `browser` entries are ES modules. From CommonJS,
`require('@neuraiproject/neurai-privacy')` loads the Node build with its own
declarations. Node 20.19 and later can also `require()` the three ES module
entries; TypeScript accepts that with `module` set to `node20` or `nodenext`.

## Using it in a web app

The application ships a reviewed pool config: the C7 manifest, the
deployment, the domain and asset ID, and the pinned proving files. Never take
any of it from an RPC response.

The worker file holds the private wallet:

```js
// pool.worker.js
import * as snarkjs from 'snarkjs';
import { startC7PoolWorker } from '@neuraiproject/neurai-privacy/worker';
import config from './c7-testnet.json';

startC7PoolWorker({
  scope: self, snarkjs,
  manifest: config.manifest, deployment: config.deployment,
  domain: config.domain, assetId: config.assetId, network: 'testnet',
  expectedGenesis: config.manifest.network, expectedCommitment: config.manifest.commitment,
  artifacts: config.artifacts, artifactBaseUrl: new URL('/privacy-c7/', self.location.origin).href,
  reservations: [], buildTransactions: true, durableJournal: true,
});
```

The worker checks that the deployment, the manifest and the two pins agree,
and that the domain derives from the deployment's birth. `expectedGenesis`
and `manifest.network` are the genesis in internal byte order (the reverse
of `getblockhash(0)`).

The page talks to it through `C7WorkerClient`. The client forwards only
read-only RPC methods and the encrypted journal reads and writes, and runs
one operation at a time.

```js
import { getRPC } from '@neuraiproject/neurai-rpc';
import { C7WorkerClient, IndexedDbJournalStore, admitTransaction, publishTransaction } from '@neuraiproject/neurai-privacy/client';

const rpc = getRPC(rpcUser, rpcPassword, rpcUrl);
const store = new IndexedDbJournalStore({ name: 'neurai-c7-private-journal-v1' });
const pool = new C7WorkerClient({
  worker: new Worker(new URL('./pool.worker.js', import.meta.url), { type: 'module' }),
  rpc, store, onStage: text => showProgress(text),
  onCrash: () => showLocked(), // the worker lost its keys; open the wallet in a new worker
});

const { identity } = await pool.derive({ mnemonic, passphrase, zkPassphrase: '', family: 'legacy', account: 0 });
showReceivingAddress(identity.addresses.current.address); // tnzk1...
await pool.openJournal({ create: firstUseOnThisDevice });   // see below
const { scan } = await pool.scan();
showBalance(scan.result.balanceAtomic, scan.result.spendableAtomic);

// Pay 200 XNA from one of the wallet's notes. The worker adds the change.
const prepared = await pool.prepare({
  action: 'transfer', note: scan.result.notes[0].cm, fee: '10000000',
  recipients: [{ recipient: 'tnzk1...', amountAtomic: '20000000000' }],
});
const tx = prepared.transaction;
await pool.recordSigned(prepared.operationId, tx.raw);     // no transparent input to sign
const { txid } = await admitTransaction(rpc, tx.raw);       // testmempoolaccept, nothing is sent
await pool.broadcastAttempt(prepared.operationId);          // record the attempt before sending
await publishTransaction(rpc, { genesis: config.deployment.genesis }, { raw: tx.raw, txid, points: tx.inputPoints });
```

A deposit spends one confirmed transparent coin worth exactly the amount
plus the fee. Pass it as `funding` (the 36-byte outpoint in hex),
`fundingValue` and `fundingPoint` (`"txid:vout"`). Sign the funding input
(`tx.funding.index`) with `SIGHASH_ALL` in the transparent wallet and record
the signed bytes with `recordSigned` before admitting them.

`openJournal()` without `create` fails with `C6 private journal missing: …`
when this browser has no history for the wallet. Use `create: true` only for
genuinely new use, or restore an exported backup with
`openJournal({ backup })`. The full flow, the journal rules and the failure
cases are in the [transaction lifecycle](docs/transaction-lifecycle.md) and
[C7 operations](docs/C7-OPERATIONS.md).

The application provides these parts:

- **Proving files.** Serve the pinned `wasm`, `zkey` and `vk` files of the
  forms D, T1, T2, T3, W and J2 under `artifactBaseUrl`, or pass
  `fetchArtifact`. The worker checks each size and SHA-256 before use.
- **A node with indexes.** The scanner reads the pool history with
  `getprivacypoolupdates` and falls back to `getspentinfo`; both need
  `-spentindex` and `-txindex`. Without a spent index it replays blocks.
- **Transparent signing.** The worker never sees transparent keys. Deposit
  funding coins and withdrawal destinations can be Legacy P2PKH, strict PQ
  (`OP_2`) or strict ECDSA (`OP_3`).
  `@neuraiproject/neurai-sign-transaction` can sign them.
- **Publication state.** `publishTransaction` rejects with `uncertain: true`
  when the node call fails after sending. Keep the transaction ID and call
  `publicationStatus` later.

Amounts are atomic units, as bigint or decimal strings.
`rpcAmountToSatoshis` converts node amounts without floating-point
arithmetic. `parseXna` and `formatXna` handle user input and display.

## Optional wallet-service WSS transport

The client entry exports `createWalletServiceRpc`. It adapts a negotiated
`neurai-wallet-services` **wss/2** connection to the same native
`rpc(method, params)` function used by pool scanning, admission and
publication. It does not implement a socket or replace the existing HTTP RPC.

```js
import { createWalletServiceRpc } from '@neuraiproject/neurai-privacy/client';

const rpc = createWalletServiceRpc({
  hello, // Result of hello negotiated on this connection with wss/2.
  expectedGenesis: config.deployment.genesis, // Application-pinned chain identity, RPC order.
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
`getrawmempool` and `decoderawtransaction`, and preferably
`getprivacypoolupdates`, which lets the scanner read the pool history in a
few pages instead of several calls per pool operation (see
[chain scanning](docs/chain-scanning.md)). The adapter refuses unavailable
and node-wallet methods locally and preserves native null/script/witness
responses. It never uses `address.get_state` as an alternative RPC schema.
The pool still checks the pinned instance and the node's portable
public-tree rules; the handshake does not prove that the service's node
supports C7.

## Receiving addresses

C7 addresses use the NeuraiZK/v3 derivation on top of the
[NeuraiZK/v2 wallet root](docs/nzk-v2-derivation.md). The mandatory
`family` is `legacy`, `ecdsa` or `pq`; the same words give a separate
private wallet for each family.

- **Format.** Bech32m with HRP `nzk`, `tnzk` or `rnzk`. The 80-byte payload
  is `03 || owner || d || pk_d || tag`: the address version, the owner, an
  11-byte diversifier, the diversified transmission key and a 4-byte tag of
  the pool instance.
- **Unlinkable.** Every address of an account has its own diversifier and
  owner. An observer cannot tell that two addresses belong to one wallet.
- **No gap.** One ristretto255 multiplication per record finds the wallet's
  notes at any address, so recovery needs no address window.
  `issueNext()` only moves the receiving index forward.
- **Change.** Deposits and change go to chain 1, index 0 (`selfRecipient()`).
- **Wallet check.** `fingerprint` is 8 hex characters. It lets the user
  confirm that the same words and passphrases open the same private wallet.
- **Recipients.** `decodeC7Address(text, scope)` rejects addresses of another
  network or pool instance. The worker also accepts a descriptor as JSON.

```js
import { C7WalletIdentity, decodeC7Address } from '@neuraiproject/neurai-privacy/browser';

const scope = { network: 'testnet', domain: config.domain, assetId: config.assetId };
const wallet = await C7WalletIdentity.fromMnemonic({ mnemonic, passphrase: '', zkPassphrase: '', family: 'legacy', account: 0, ...scope });
const address = wallet.addressAt(0, wallet.currentIndex()); // tnzk1...
const next = wallet.addressAt(0, wallet.issueNext());
const descriptor = decodeC7Address(next, scope);
wallet.lock();
```

Run this code inside the worker, because the identity holds spending keys.
In the worker, `describeReceiving(identity, scan)` gives the public receiving
data that the `identity` and `addresses` messages carry.
`test/fixtures/c7-vectors.json` is the same vector file as the node's
(`src/test/data/privacy_c7_vectors.json`); the byte-level specification is in
Neurai-DePIN, `contrib/privacypool/privacy-c7`.

## Networks

The worker accepts `testnet` and `regtest` only. The package bundles no
deployment: each pool needs its own reviewed manifest, deployment and proving
files, and the application pins the genesis and the contract commitment.
`RESET_TESTNET_GENESIS` is the genesis of the testnet of 2026-11-05, in RPC
order.

## What stays public

Deposits show their amount and funding coin, and withdrawals their amount
and destination. Every operation shows its fee level and form, so a transfer
shows how many outputs it created. Transfers and joins hide the sender, the
receiver and the amounts. The reserve held by the pool, the time of each
transaction and the node the application talks to remain visible. See the
[security and privacy model](docs/security-model.md).

## Documentation

The [`docs/`](docs/README.md) folder explains how the pool and the library
work:

- [How the privacy pool works](docs/privacy-pool.md)
- [Library architecture](docs/architecture.md)
- [Transaction lifecycle](docs/transaction-lifecycle.md)
- [Chain scanning](docs/chain-scanning.md)
- [C7 operations reference](docs/C7-OPERATIONS.md)
- [C7 J2 (join) reference](docs/C7-JOIN.md)
- [NeuraiZK/v2 wallet root](docs/nzk-v2-derivation.md)
- [Data formats](docs/data-formats.md)
- [Security and privacy model](docs/security-model.md)

## Development

```sh
npm ci              # Install the locked development dependencies
npm run build       # Generate Node and browser bundles in dist/
npm test            # Node test runner
npm run test:types  # TypeScript declarations
npm run test:build  # Check the bundled entry points
```

The build writes ESM files for the browser, client and worker, which share
their common code through `dist/chunks`, and ESM/CJS files for Node. It also
writes ESM and CommonJS declarations and the bundled dependency licenses into
`dist/`. `npm pack` builds these files automatically. `npm run test:types`
checks the published declarations with TypeScript `NodeNext` and `Node16`
settings. `npm run test:build` checks that every entry exposes the C7 API,
that the C6 aliases are the same objects, that nothing of C4 to C6 is left and
that the client entry loads no key or note cryptography.

`test/browser-smoke.html` loads the browser entry without a bundler. Run
`npm install` first, then serve the package root with any static server,
because its import map points to `node_modules`. It shows PASS when Poseidon,
the vault and a C7 note round trip work.

## License

MIT. See [LICENSE](./LICENSE).
