# Library architecture

## Design rules

The code follows a few rules:

- **Secrets stay in one place.** Spending keys, viewing keys, note
  plaintexts, circuit witnesses and proofs live in a dedicated Web Worker.
  The page only sees public data: addresses, balances, commitments and
  unsigned transactions.
- **The worker cannot write to the chain.** All its RPC calls go through the
  page, which forwards only read-only methods.
- **Verify before use.** Manifests, proving artifacts, coins, scanned
  transitions and proofs are all checked before the next step uses them.
- **Exact amounts.** Satoshis are `bigint` or decimal strings, never
  floating-point numbers.
- **No GPL dependency.** snarkjs (GPL-3.0) is passed in by the application,
  not imported by the package.

## Entry points

| Import | Runs in | Holds secrets | Purpose |
| --- | --- | --- | --- |
| `@neuraiproject/neurai-privacy/client` | Page (main thread) | No | Amounts, RPC checks, coin selection, publication, rotation storage, the bundled C4 TEST deployment and `PoolWorkerClient`. Contains no cryptography. |
| `@neuraiproject/neurai-privacy/worker` | Dedicated Web Worker | Yes | `startPoolWorker` and the operations it runs: planning, artifact loading, proving and transaction building. |
| `@neuraiproject/neurai-privacy/browser` | Browser or worker | Yes, if used | Everything above plus identities, addresses, the scanner, the C4 builder and the building blocks. |
| `@neuraiproject/neurai-privacy` | Node | Yes, if used | The browser entry plus `CliTestBackend`. Bundlers resolve it to the browser entry. |

`npm run test:build` checks that the client entry pulls in no ChaCha20,
Argon2 or X25519 code and that no browser file imports Node built-ins.

## Page and worker

```text
 Page (main thread)                              Dedicated Web Worker
 ─────────────────────────────────               ──────────────────────────────────
 PoolWorkerClient           ── derive ─────────▶  startPoolWorker
                            ── scan ───────────▶    identity (keys)
                            ── prepare ────────▶    scanner, pool state
                            ◀─ identity/scan/ ──    planner, witness builder
                               prepared             snarkjs prover (injected)
                            ◀─ rpc request ─────
   read-only filter ──▶ node
                            ── rpc-result ─────▶
                            ◀─ stage (progress) ─

 Transparent signer: signs funding and sponsor inputs of the prepared transaction
 Publication helpers: recheckInputs, admitTransaction, publishTransaction, publicationStatus
```

The page holds the transparent wallet and the node connection. The worker
holds the private wallet. A prepared transaction leaves the worker with its
funding and sponsor inputs unsigned. The page signs them with the
transparent wallet and publishes.

## Worker message protocol

`PoolWorkerClient` wraps this protocol. An application can also post the
messages itself.

Messages to the worker:

| Type | Fields | Effect |
| --- | --- | --- |
| `derive` | `family`, `mnemonic`, `passphrase`, `zkPassphrase`, `account`, `gap?`, `issued?` | Opens a [NeuraiZK/v2](nzk-v2-derivation.md) identity from wallet words. Replies `identity`. |
| `create` | `password` | Creates a random identity and its encrypted JSON backup. Replies `identity`. |
| `restore` | `backup`, `password` | Opens a random identity from its backup. Replies `identity`. |
| `scan` | `gap?`, `issued?`, `checkpoint?` | Rebuilds the pool state and finds owned notes. Replies `scan`. |
| `new-address` | `force?` | Hands out the next receiving address. Replies `addresses`. |
| `prepare` | Request fields, see [transaction lifecycle](transaction-lifecycle.md) | Rescans, checks coins, proves and serializes. Replies `prepared`. |
| `lock` | | Wipes the identity and the scan from the worker. |
| `rpc-result` | `id`, `result` or `error` | Answer to an `rpc` request. |

Messages from the worker:

| Type | Fields |
| --- | --- |
| `stage` | `message`: progress text for the user. |
| `rpc` | `id`, `method`, `params`: a read-only call the page should forward. |
| `identity` | `recipient` (descriptor), `backup` (JSON or `null` for derived wallets), `addresses`. |
| `scan` | `result` (balance, unspent notes, transitions), `recipient`, `addresses`, `checkpoint` (encrypted string or `null`). |
| `addresses` | `recipient`, `addresses`. |
| `prepared` | `result`: `raw`, `form`, `feeAtomic`, `stateOutpoint`, `inputPoints`, `amountAtomic`. |
| `done` | The request finished. |
| `error` | `message`: the request failed. |

The worker handles one request at a time and silently ignores requests that
arrive while it is busy. Every accepted request ends with `done` or `error`.

## PoolWorkerClient

`PoolWorkerClient` turns the protocol into promises:

- It forwards an `rpc` request only when `isReadRpc(method)` is true. The
  default allows `POOL_READ_RPC_METHODS`: `getblockhash`, `getbestblockhash`,
  `getblockcount`, `getblock`, `getrawtransaction`, `gettxout` and
  `getspentinfo`. Any other method gets an error reply.
- It rejects a second call while one is running (`busy`).
- If the worker crashes, the client terminates it, rejects the pending call
  and calls `onCrash`. The keys are gone at that point; create a new worker
  and client and open the wallet again (`stopped` is then `true`).
- `onStage` receives progress text for the user interface.

## startPoolWorker options

| Option | Default | Meaning |
| --- | --- | --- |
| `scope` | `globalThis` | Worker global scope. |
| `snarkjs` | | snarkjs 0.7.6 module. Without it the worker can scan but not prove. |
| `artifactBaseUrl` or `fetchArtifact` | | Where proving artifacts are fetched from. One is required. |
| `manifest`, `artifacts` | Bundled C4 TEST instance | Pool manifest and artifact list. |
| `network` | `'testnet'` | Selects the `nzk` address prefix. |
| `expectedCommitment` | Bundled pin, only without `manifest` | The independently pinned contract commitment. Required when `manifest` is passed. |
| `expectedGenesis` | reset testnet genesis | Genesis the manifest must match. |
| `depositLimitAtomic` | money range | Largest deposit the application builds. |
| `maxArtifactBytes` | 256 MiB | Largest single artifact accepted, at most 256 MiB. The bundled T4 proving key is about 192 MiB. |
| `singleThread` | `true` | Forces snarkjs to one thread inside the worker. |
| `missingArtifactMessage` | | Error text when artifacts cannot be fetched. |

With `singleThread`, the worker sets `navigator.hardwareConcurrency` to 1 and
removes `Worker` from its scope. Otherwise snarkjs would start one more
worker per core and multiply memory use.

## Identities

Both identity classes expose the same methods to the worker: `recipient`,
`createNote`, `openRecord`, `prepareC4`, `sealCheckpoint`,
`openCheckpoint` and `lock`.

**ZkWalletIdentity** is derived from wallet words
([NeuraiZK/v2](nzk-v2-derivation.md)). It holds one HKDF key for the
account and derives a separate spend secret and view seed for every address:

- chain 1, index 0 is the internal address. Deposits and change go there.
- chain 0, indexes 0, 1, 2, … are receiving addresses. A new one is handed
  out per payment (`issueNext`), limited by the gap.

When it spends a note, it uses the key of the address that received it. It
has no backup file; the words recover it.

**BrowserTestIdentity** holds one random spend secret and view seed,
encrypted in a JSON vault (Argon2id + ChaCha20-Poly1305). The vault format is
shared with the Python TEST wallet. It has one address and no rotation, and
only its backup file recovers it.

`lock()` overwrites the key buffers and drops them. JavaScript cannot
guarantee that no copy remains elsewhere in memory; see the
[security model](security-model.md#secret-handling).

## Module map

| Module | Responsibility |
| --- | --- |
| `amounts.js` | Exact XNA parsing and formatting, RPC amounts to satoshis. |
| `poseidon.js`, `poseidon-constants.js` | Poseidon permutation and byte sponge used by the circuits. |
| `notes.js` | CP1 note encoding, owner, nullifier key, commitment and nullifier. |
| `hpke.js` | Viewing keys and HPKE encryption of note records. |
| `pool-state.js` | Note tree, indexed trees, state opening and digest. |
| `pool-txhash.js`, `pool-transaction.js` | TXHASH anchor and the transaction template. |
| `c4.js`, `c4-publication.js` | Manifest validation, witness preparation, publication codec and final serialization. |
| `c4-testnet.js` | Bundled C4 TEST manifest, artifact list and pinned commitment. |
| `browser-chain.js` | Pool scanner and checkpoint format. |
| `checkpoint-crypto.js` | Checkpoint encryption. |
| `zk-wallet.js` | NeuraiZK/v2 derivation, `nzk` addresses, `ZkWalletIdentity`. |
| `browser-wallet.js`, `vault.js` | `BrowserTestIdentity` and its encrypted vault. |
| `pool-operations.js` | Planning, artifact loading, proving and transaction building (worker side). |
| `pool-worker.js` | `startPoolWorker` and the message protocol. |
| `pool-worker-client.js` | `PoolWorkerClient`. |
| `pool-client.js` | Page-side RPC checks, coin selection and publication. |
| `rotation-store.js` | Non-secret storage of receiving address rotation state. |
| `core.js`, `node-cli-backend.js`, `shared.js`, `protocol-constants.js` | Node backend for the Python TEST wallet. |

## Node backend

`NeuraiPrivacy` with `CliTestBackend` drives the Python privacy wallet of the
Neurai node repository. It was the first integration path and is now used
for live integration tests. It supports the RWAX and XNA TEST profiles with
the original six forms. The Python wallet keeps the spend key in an
encrypted vault, and proofs come from a Docker prover. Passwords are passed
on stdin, never on the command line or in environment variables.
`NeuraiPrivacy` checks the genesis before each call, confirms that the RPC
node sees the same block as the scanner, and runs one spending operation at a
time. After a state conflict it rebuilds the transaction up to `maxRebuilds`
times (default 1, at most 3).
See [integration/README.md](../integration/README.md).

## Build output

`npm run build` (esbuild) writes:

- ESM bundles for `browser`, `client` and `worker`, which share code through
  `dist/chunks`;
- ESM and CommonJS bundles for Node (`index.js`, `index.cjs`);
- `.d.ts` and `.d.cts` declarations and the licenses of bundled
  dependencies.

`@noble/*` and `@scure/bip39` are bundled, so the published package has no
runtime dependencies. `@neuraiproject/neurai-rpc` is an optional peer
dependency; any function with the shape `rpc(method, params)` works.
