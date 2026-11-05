# Library architecture

## Design rules

The code follows a few rules:

- **Secrets stay in one place.** Spending keys, viewing keys, note
  plaintexts, Merkle paths, circuit witnesses and proofs live in a dedicated
  Web Worker. The page only sees public data: addresses, balances,
  commitments, packets and transactions.
- **The worker cannot write to the chain.** All its RPC calls go through the
  page, which forwards only read-only methods. The worker never signs
  transparent inputs or broadcasts.
- **Nothing is trusted from RPC that the application can pin.** The
  manifest, the deployment, the genesis, the contract commitment and the
  proving files come from the application.
- **Verify before use.** Pins, artifacts, coins, scanned transitions and
  proofs are checked before the next step uses them.
- **An exposed operation is never forgotten.** The durable journal reserves
  notes before proving and saves every packet before it is returned.
- **Exact amounts.** Atomic units are `bigint` or decimal strings, never
  floating-point numbers.
- **No GPL dependency.** snarkjs (GPL-3.0) is passed in by the application,
  not imported by the package.

## Entry points

| Import | Runs in | Holds secrets | Purpose |
| --- | --- | --- | --- |
| `@neuraiproject/neurai-privacy/client` | Page (main thread) | No | Amounts, RPC checks, publication, `validateC7Deployment`, `c7Intent`, `IndexedDbJournalStore` and `C7WorkerClient`. |
| `@neuraiproject/neurai-privacy/worker` | Dedicated Web Worker | Yes | `startC7PoolWorker`, `scanC7Pool`, `createC7OperationWallet`, `createC7JoinWallet`, `readC7Packet`, `buildC7Transaction`, `describeReceiving`, `loadVerifiedArtifact`. |
| `@neuraiproject/neurai-privacy/browser` | Browser or worker | Yes, if used | Everything above plus `C7WalletIdentity`, `C7Account`, C7 addresses and records, the wallet root and the building blocks. |
| `@neuraiproject/neurai-privacy` | Node | Yes, if used | The same API as the browser entry. Bundlers resolve it to the browser entry. |

The deprecated C6 names (`startC6PoolWorker`, `C6WorkerClient`, …) are
exported next to their C7 names from the same entries until the next release.

`npm run test:build` checks that every entry exposes the C7 API, that the C6
aliases are the same objects, that nothing of C4 to C6 is left, that the
client entry pulls in no ChaCha20, Argon2, ristretto255 or PBKDF2 code and
that no browser file imports Node built-ins.

## Page and worker

```text
 Page (main thread)                              Dedicated Web Worker
 ─────────────────────────────────               ──────────────────────────────────
 C7WorkerClient             ── derive ─────────▶  startC7PoolWorker
                            ── journal-open ───▶    C7WalletIdentity (keys)
                            ── scan / prepare ─▶    scanner, public trees
                            ◀─ identity/scan/ ──    operation and J2 wallets
                               prepared/signed      snarkjs prover (injected)
                            ◀─ rpc request ─────    transaction builder
   read-only filter ──▶ node                         encrypted journal
                            ── rpc-result ─────▶
                            ◀─ journal-read/write
   IndexedDbJournalStore (CAS)
                            ── journal-result ─▶
                            ◀─ stage (progress) ─

 Transparent signer: signs the funding input of a deposit with SIGHASH_ALL
 Publication helpers: admitTransaction, recheckInputs, publishTransaction, publicationStatus
```

The page holds the transparent wallet, the node connection and the storage.
The worker holds the private wallet. The journal and the scan caches reach
the page only encrypted under a key that never leaves the worker. A
transaction leaves the worker complete except for the funding input of a
deposit, which the page signs.

## Worker message protocol

`C7WorkerClient` wraps this protocol. An application can also post the
messages itself.

Messages to the worker:

| Type | Fields | Effect |
| --- | --- | --- |
| `derive` | `family`, `mnemonic`, `passphrase?`, `zkPassphrase?`, `account?`, `issued?` | Opens a `C7WalletIdentity` from the wallet words. Replies `identity`. |
| `journal-open` | `create?`, `backup?` | Opens the encrypted journal, creates a new one, or restores a backup into empty storage. Replies `journal`. |
| `journal-backup` | | Replies `backup` with the encrypted journal. |
| `scan` | | Rescans and reconciles the journal. Replies `scan`. |
| `new-address` | `force?` | Hands out the next receiving address. Replies `addresses`. |
| `prepare` | `action` and its fields, see [C7 operations](C7-OPERATIONS.md#dedicated-worker) | Rescans, proves, relocates and saves. Replies `prepared`. |
| `rebuild` | `id` | Relocates a saved operation against the current state. Replies `prepared`. |
| `record-signed` | `id`, `raw` | Checks and saves the signed bytes. Replies `signed`. |
| `record-broadcast` | `id` | Records a broadcast attempt before sending. |
| `release-draft` | `id` | Releases a reservation whose packet was never produced. |
| `lock` | | Wipes the identity, the scan and the journal from the worker. |
| `rpc-result`, `journal-result` | `id`, `result` or `error` | Answers to `rpc`, `journal-read` and `journal-write`. |

`create` and `restore` are refused: a C7 wallet is always derived from the
wallet words.

Messages from the worker:

| Type | Fields |
| --- | --- |
| `stage` | `message`: progress text for the user. |
| `rpc` | `id`, `method`, `params`: a read-only call the page should forward. |
| `journal-read` | `id`, `key`: read an encrypted record. |
| `journal-write` | `id`, `key`, `expected`, `replacement`: compare-and-swap an encrypted record. |
| `identity` | `recipient` (descriptor), `backup` (`null`), `addresses` (receiving data). |
| `journal` | `operations`: `{id, action, phase, outcome, confirmedBy, txid}` per operation. |
| `scan` | `result`: `historyReady`, `tip`, `statePoint`, `reserveAtomic`, `balanceAtomic`, `spendableAtomic` and `notes` (`cm`, `amountAtomic`, `spendable`, `reserved`); `addresses`. |
| `addresses` | `recipient`, `addresses`. |
| `prepared` | `result`: `packet`, `packetId`, `proof`, `publicSignals`, `operationId`, `transaction` and `requiresDurableJournal`. |
| `signed` | `result`: `operationId`, `raw`, `txid`, `inputPoints`. |
| `backup` | `result`: `type`, `genesis`, `commitment`, `cipher`, `identityBackup` (`null`). |
| `done` | The request finished. |
| `error` | `message`: the request failed. |

The worker handles one request at a time; a request that arrives while it is
busy gets `error` (`C7 worker: another operation is running`). Every accepted
request ends with `done` or `error`. Summaries never include plaintext notes,
Merkle paths, nullifiers or spending secrets.

## C7WorkerClient

`C7WorkerClient({ worker, rpc, store, onStage, onCrash })` turns the protocol
into promises:

- It forwards an `rpc` request only for `getblockchaininfo`, `getblockhash`,
  `getblockcount`, `getbestblockhash`, `getblock`, `getrawtransaction`,
  `gettxout`, `getspentinfo` and `getprivacypoolupdates`. Any other method
  gets an error reply.
- It answers `journal-read` and `journal-write` with `store.read` and
  `store.compareAndSwap`, after bounding the key and the ciphertext size.
- It turns host failures into non-empty errors and never resolves a failed or
  missing RPC result as a success; a legitimate `null` (for example from
  `gettxout`) stays a success.
- It rejects a second call while one is running.
- If the worker crashes or one of its messages cannot be decoded, the client
  terminates it, rejects the pending call and calls `onCrash`. A request that
  cannot be posted also terminates it. The keys are gone at that point;
  create a new worker and client and open the wallet again (`stopped` is then
  `true`).
- `onStage` receives progress text for the user interface.

Its methods are `derive`, `openJournal`, `scan`, `prepare`, `rebuild`,
`recordSigned`, `broadcastAttempt`, `backup`, `newAddress`, `releaseDraft`,
`request` (any message type) and `terminate`.

## startC7PoolWorker options

| Option | Default | Meaning |
| --- | --- | --- |
| `scope` | `globalThis` | Worker global scope. |
| `snarkjs` | | snarkjs 0.7.6 module. Without it the worker can scan but not prove. |
| `manifest`, `deployment` | | The reviewed C7 manifest (profile, network, identity, context, commitment, `vks`, `vk_sha256`, `fees`) and deployment. |
| `domain`, `assetId` | | Hex of the instance; the domain must derive from the deployment's birth. |
| `network` | `'testnet'` | `testnet` or `regtest`; selects the address HRP. |
| `expectedGenesis` | | Genesis in internal byte order; must equal the manifest's `network` and the reverse of the deployment's genesis. |
| `expectedCommitment` | | Contract commitment; must equal the manifest's and the deployment's. |
| `artifacts` | | `files[path] = {bytes, sha256}` and `forms.D/T1/T2/T3/W` (and `J2`) = `{wasm, zkey, vk}`. |
| `artifactBaseUrl` or `fetchArtifact` | | Where the files are fetched from. One is required. |
| `reservations` | | Reservations `{cm, nf}` restored by the application (packet-only mode). Required, may be empty. |
| `maxArtifactBytes` | 256 MiB | Largest single artifact accepted, at most 256 MiB. |
| `singleThread` | `true` | Forces snarkjs to one thread inside the worker. |
| `buildTransactions` | `false` | Relocate packets into transactions inside the worker. |
| `durableJournal` | `false` | Keep reservations and operations in the encrypted journal. Requires `buildTransactions` and the J2 artifacts. |

Use `buildTransactions: true` and `durableJournal: true` in applications. The
packet-only mode returns a packet and its `resources`; the application must
then store reservations and build transactions itself.

With `singleThread`, the worker sets `navigator.hardwareConcurrency` to 1 and
removes `Worker` from its scope. Otherwise snarkjs would start one more
worker per core and multiply memory use.

## C7WalletIdentity

`C7WalletIdentity` is derived from wallet words: the
[NeuraiZK/v2 root](nzk-v2-derivation.md) and the C7 account keys
(`C7Account`). It holds one incoming viewing key for the account and derives
the spend secret of an address only when that address's note is spent:

- chain 1, index 0 is the wallet's own address (`selfRecipient()`).
  Deposits and change go there.
- chain 0, indexes 0, 1, 2, … are receiving addresses (`addressAt(0, i)`).
  `issueNext()` moves the receiving index forward; there is no gap.

`scanRecords` finds the account's notes among published records in any
order, and `prepareC7Deposit`, `prepareC7Transfer`, `prepareC7Withdrawal`
and `prepareC7Join` pass its secrets to the operation and J2 wallets
without exposing them. `sealCheckpoint`, `openCheckpoint` and
`checkpointStoreId` encrypt and namespace the journal and the scan caches.
`backupJson()` returns `null`: the words recover the wallet. `lock()`
overwrites the key buffers. JavaScript cannot guarantee that no copy remains
elsewhere in memory; see the [security model](security-model.md#secret-handling).

## Module map

| Module | Responsibility |
| --- | --- |
| `amounts.js` | Exact XNA parsing and formatting, RPC amounts to atomic units. |
| `poseidon.js`, `poseidon-constants.js` | Poseidon permutation and byte sponge used by the circuits. |
| `notes.js` | CP1 note encoding, owner, nullifier key, commitment and nullifier. |
| `pool-state.js` | Tree node and indexed-tree leaf hashes. |
| `zk-wallet.js` | NeuraiZK/v2 wallet seed and root, bech32m, nzk constants. |
| `c7.js` | C7 account keys, diversified addresses, note records, domain, asset ID and context. |
| `c7-wallet.js` | `C7WalletIdentity` and `describeReceiving`. |
| `checkpoint-crypto.js` | Encryption of the journal and the scan caches. |
| `c7-publication.js` | Publication codec and pool context. |
| `c7-operations.js` | D/T/W preparation and proving, proof compression. |
| `c7-join.js` | J2 preparation and proving. |
| `c7-raw-transaction.js` | Reader of version 3 transactions. |
| `c7-deployment.js` | `validateC7Deployment` and `c7Intent`. |
| `c7-transaction.js` | Public trees, packet reader and transaction builder. |
| `c7-scan.js`, `c7-scan-checkpoint.js`, `c7-scan-snapshot.js` | Scanner and its encrypted caches. |
| `c7-private-journal.js` | Encrypted operation journal. |
| `c7-worker.js` | `startC7PoolWorker` and the message protocol. |
| `c7-worker-client.js` | `C7WorkerClient`. |
| `journal-store.js` | `IndexedDbJournalStore`. |
| `artifacts.js` | `loadVerifiedArtifact` and `MAX_ARTIFACT_BYTES`. |
| `pool-client.js` | Page-side RPC checks, coin discovery and publication. |
| `wallet-service-rpc.js` | wss/2 wallet-service adapter. |
| `vault.js`, `protocol-constants.js` | Encrypted JSON vault. |
| `shared.js` | `RESET_TESTNET_GENESIS`. |

## Build output

`npm run build` (esbuild) writes:

- ESM bundles for `browser`, `client` and `worker`, which share code through
  `dist/chunks`;
- ESM and CommonJS bundles for Node (`index.js`, `index.cjs`);
- `.d.ts` and `.d.cts` declarations and the licenses of bundled
  dependencies.

`@noble/*` and `@scure/*` are bundled, so the published package has no
runtime dependencies. `@neuraiproject/neurai-rpc` is an optional peer
dependency; any function with the shape `rpc(method, params)` works.
