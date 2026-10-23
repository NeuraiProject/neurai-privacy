# C6 XNA TEST operations and recovery

This API targets the six-key `C6-XNA-TEST-J2-v2` contract profile. It is an
experimental XNA implementation, not a production pool or an asset wallet.
It does not select a default deployment. Keys used by the regression harness
have public TEST entropy and must never secure real-value funds.

## Instance pins and byte order

Supply a separately reviewed manifest, deployment and proving-artifact pins.
Do not obtain trust anchors from the RPC that supplies chain data.

* `manifest.network` and `createC6OperationWallet({expectedGenesis, ...})`
  use the 32 genesis bytes in internal/wire order, encoded as lowercase hex.
* `deployment.genesis` and RPC `getblockhash(0)` use display-order hex.
  Reverse these 32 bytes to convert between the two conventions.
* Commitments, field encodings, note roots and packet identifiers keep their
  documented byte order. Do not reverse them like RPC block hashes.
* `manifest.context` binds the domain, asset identifier, unit 1 and zero
  registry root. The contract and its pinned verification keys must match it.
* Amounts and fees are exact atomic decimal strings or bigint, never floating
  point. One XNA is 100,000,000 atomic units.

Application artifacts have `files[path] = {bytes, sha256}` and
`forms.D/T1/T2/T3/W = {wasm, zkey, vk}`. Review both artifact pins and their
relationship to the verification keys embedded in the contract. A successful
local proof verification alone does not establish that relationship.

## Private operation construction

`createC6OperationWallet({expectedGenesis, expectedCommitment})` exposes
`prepareDeposit`, `prepareTransfer`, `prepareWithdrawal` and `prove`.
Preparation results contain plaintext notes and private witnesses. Keep them
inside a dedicated worker; never send them to RPC or a public relocator.

* D accepts an existing funding outpoint (36 wire bytes) whose value equals
  the deposit plus its approved fee. Deposits are positive multiples of
  100 XNA. The API generates and encrypts a fresh note for its recipient.
* T1/T2/T3 consume one owned note against a nonzero historical root and a
  32-level Merkle path. Output count includes change. Ordinary recipients
  receive positive multiples of 100 XNA. At most one change note is allowed;
  its spending owner and viewing key must equal those of the consumed note.
  Outputs plus the approved fee must equal the consumed amount.
* W commits the complete transparent payout script. Exact Legacy P2PKH and
  strict PQ v2/ECDSA v3 scripts are supported. Normal payouts are multiples of
  100 XNA. A smaller payout is allowed only when it consumes the entire note
  after its fee, with no private change. `W_full` is a relocation/contract
  form that empties the pool reserve; it is not synonymous with emptying a
  user's wallet. Private change preserves the consumed note's owner and
  viewing key. No-change witnesses use the circuit's canonical dummy note.

The proof API checks mutation/cancellation across every asynchronous proving
step, matches all public signals to the original wallet intent, verifies the
proof locally and returns a public portable packet. D/T/W use packet wire
version 1; J2 uses wire version 2. The packet contains encrypted publications,
not plaintext notes, spending keys or Merkle witnesses.

`BrowserTestIdentity.prepareC6Deposit/Transfer/Withdrawal` supplies secrets
privately. `ZkWalletIdentity` provides the same methods and chooses the
identity of a recovered rotating address. No spending-key getter is exposed.
The lower-level J2 API remains separate; multi-address J2 orchestration is not
implemented by `startC6PoolWorker`.

## Confirmed-chain recovery

```js
const recovered = await scanC6Pool({
  rpc, deployment, identity,
  reserved: durableJournalReservations,
  signal, onProgress,
});
```

The scanner requires a trusted, fully validating archival RPC and a reviewed
birth anchor with zero notes. This is not SPV or independent consensus
validation. It verifies network/activation, birth, chain continuity, actual
state prevouts, pinned MAST leaves/control paths, openings, publications,
note-tree roots, historical roots and counters. Groth16 and complete indexed
nullifier-tree transition validity come from the validating node.

By default (`strategy: 'auto'`), `scanC6Pool` reads the confirmed state thread
in pages with the node's `getprivacypoolupdates`: one call returns up to
`historyPageLimit` pool transactions (default 20, about 15–25 kB raw each) with
their heights and blocks, instead of `getspentinfo`, `getblockhash`, `getblock`
and `getrawtransaction` for every pool operation. The scanner builds the cursor
itself from the pinned birth (`pool_id` is the node's transport id of the birth
outpoint), pins the page snapshot to the tip it captured,
and resumes from its encrypted snapshot with a cursor at the saved state. Every
returned transaction goes through the same checks as before (txid, input 0,
pinned leaves, openings, publications, roots); the node only saves round trips.
The end of the thread is confirmed independently with `gettxout(..., false)`,
or with `getspentinfo` when the state was spent after the captured tip.

When the node or the wallet service cannot serve `getprivacypoolupdates` (older
node, no `-spentindex`/`-txindex`, method not allowed), the same pass continues
with the spent-index walk: it follows confirmed state spends with
`getspentinfo`, reads only blocks containing pool transitions, and confirms the
final live state (and reserve) with `gettxout(..., false)`. That walk needs a
synchronized spent index and historical transactions (`getrawtransaction`,
normally `txindex`). Unavailable indexes fall back to checked block replay;
contradictory index or history entries fail closed. Direct callers can request
`strategy: 'pool-history'`, `'spent-index'` or `'blocks'` for comparison or
diagnostics.

The result is a coherent snapshot at `tip.height`. Ordinary chain growth does
not invalidate it. A changed scanned prefix or reorganized birth still produces
an error, never a partial balance; rescan against the active chain. Both modes
rebuild pool history from the pinned birth on each scan; persistent incremental
checkpoints are still future work for this C6 scanner.

Notes are decrypted locally. A note is spendable only under a historical
root with at least two confirmations and while not reserved by an outstanding
operation. Reservations do not decrease owned balance. Invalid/foreign
ciphertexts are skipped locally. The scan result includes private plaintext
notes and paths; keep it inside the worker.

## Dedicated browser worker

A static site can import `startC6PoolWorker` from the `worker` entry and supply
snarkjs and hash-pinned wasm/zkey/VK artifacts. The protocol is compatible
with read-only RPC bridging, but its result shapes are C6-specific.

```js
import {startC6PoolWorker} from '@neuraiproject/neurai-privacy/worker';
startC6PoolWorker({
  scope: self, snarkjs,
  manifest, deployment, domain, assetId, network: 'testnet',
  expectedGenesis, expectedCommitment,
  artifacts, artifactBaseUrl,
  reservations: restoredDurableJournalReservations,
});
```

Messages in: `create`, `restore`, `derive`, `scan`, `new-address`, `prepare`,
`lock`, and `rpc-result`. `prepare` actions are:

* `deposit`: `fee`, `amountAtomic`, `funding` (36-byte hex), `fundingValue`,
  optional private `recipient` (nzk address or descriptor).
* `transfer`: `fee`, `note` (commitment hex), `recipients` containing
  `{recipient, amountAtomic}`. The worker adds authenticated change if
  needed, rejecting more than three outputs including change.
* `withdraw`: `fee`, `note`, `amountAtomic`, `payoutScript` (hex).

Messages out: progress `stage`, read-only `rpc`, public receiving `identity`
(including encrypted backup), `addresses`, private-balance summary `scan`,
public packet `prepared`, `done`, and `error`. Summary messages never include
plaintext notes, Merkle paths or spending secrets. Balance information and
reservation identifiers remain private application data: do not log/upload
these summaries to public infrastructure.

RPC bridge methods are limited to chain reads. The worker never signs transparent inputs, admits, mines or broadcasts transactions.
In full mode it relocates public paths locally. A public relocator can
update state witnesses without receiving note secrets. The application must
validate the resulting transaction against the prepared packet and sign any
required funding separately before publishing.

## Exposure and cancellation

A proof packet can remain valid after a service drops it. `prepared` marks
its resources reserved within this worker, and reports
`requiresDurableJournal: true`. Persist packet, operation identifier and
reservations before handing it to a relocator or publishing. On restart or
wallet switch restore the full durable journal; never silently use an empty
journal for an existing wallet. Packet-only mode does not implement that storage layer. Full mode uses the
encrypted CAS journal described below; neither mode releases exposed notes on local expiry.

`lock` invalidates the current session and prevents late scan/proof results.
`stop()` disables subsequent messages. To interrupt expensive WebAssembly
immediately and discard its memory, terminate the containing Web Worker.
JavaScript cannot guarantee physical zeroization of all engine copies.
Neither action cancels a packet already exposed. Reconcile reservations using
confirmed chain outcomes and retain them through uncertain RPC failures or
reorganizations.

## Verification and remaining integration

The source tests contain a field-projected capture of an isolated validated
13-operation chain, with public TEST identities and node/hash provenance.
The SDK flow covers D0/D1, T1/T2/T3, authenticated change, withdrawal to all
three transparent families, small-note recovery and final reserve exhaustion.
Its independent Python relocator and C++ verifier are test harnesses, not
runtime dependencies of local wallet proving or scanning.

Full integration now supplies JS relocation, ALL funding signing hooks, encrypted
durable history, webwallet controls and multi-address J2. Public-instance/artifact
hosting, complete asset-wallet operations and fresh public/Android end-to-end tests
remain separate validation/deployment work.

## Complete local-worker integration (October 2026)

Use `startC6PoolWorker` with **both** `buildTransactions: true` and
`durableJournal: true`, all six pinned artifact forms including J2, and the full
reviewed manifest (`identity`, `vks`, `vk_sha256`, discrete fees). The lightweight
packet-only mode remains available; it does not provide transaction construction
or durable history. The application must separately pin the birth UTXO and block,
network genesis, scripts/control paths, domain/asset context and each artifact.
Never load a deployment from an untrusted RPC response or substitute C4/C5 keys.

```js
const store = new IndexedDbSponsorStore({ name: 'neurai-c6-private-journal-v1' });
const client = new C6WorkerClient({ worker, rpc, store, onStage: showProgress });
await client.derive({ mnemonic, family: 'ecdsa', zkPassphrase, account: 0 });
await client.openJournal(); // Missing history is an error, not a new wallet.
const { scan, journal } = await client.scan();
const prepared = await client.prepare({
  action: 'transfer', note: selectedCommitment, fee: exactManifestFee,
  recipients: [{ recipient: receiverNzkAddress, amountAtomic: '10000000000' }],
});
// Transaction is constructed in JS inside the worker. T/W/J2 need no
// transparent signature. Deposits require local ALL signing of funding.index.
const signed = await client.recordSigned(prepared.operationId, prepared.transaction.raw);
const encryptedHistory = await client.backup();
// Save the encrypted history, obtain native testmempoolaccept, then record the
// attempt before sending. A transport failure does not release reservations.
await client.broadcastAttempt(prepared.operationId);
```

`create: true` on `openJournal` is an explicit new-history operation. Do not use it
as an automatic fallback after a missing or unreadable store. Restore an exported
backup on a device using the same words, wallet family, account and private-wallet
passphrase. Address rotation is persisted before returning the address. Backups
contain authenticated encrypted history; derived-wallet backups contain no words.
File-based identities additionally include their existing encrypted identity file.

The worker saves a draft reservation **before** proving and persists the verified
packet and transaction **before** returning it. Atomic IndexedDB compare-and-swap
prevents two tabs sharing this store from reserving the same resource. An
unexposed draft can be released explicitly after the operation stops; a prepared
packet cannot be cancelled locally. Confirmed matching intents close a reservation;
a competing confirmed nullifier closes it as conflicted. A reorganization reopens
these reservations. RPC failure or an empty mempool is not evidence of cancellation.

`rebuild(id)` rechecks the saved proof against its pinned VK and rescans the chain,
then reconstructs public paths and the current transaction in JS. It preserves the
private payment intent. A deposit must be signed again using its original funding
coin and `SIGHASH_ALL`; detachable asset sponsorship is a separate API and is not
used for XNA. `recordSigned` checks the fixed transaction, leaves non-funding
witnesses intact, and rejects a different intent or sighash. Native admission remains
mandatory; this check is not a replacement for signature/consensus verification.

`buildC6Transaction` is also available as a **public construction primitive**. It
replays confirmed transcripts and checks instance/VK/MAST/funding bindings. It
**does not itself verify the Groth16 proof** or establish an untrusted RPC's honesty.
Use the worker's verified immutable intent, then a fully validating native node.

J2 supports exactly two distinct, mature owned notes under one historical root,
including notes received at different rotating addresses. Their secrets stay inside
the worker and the output retains the first note's owner/viewing key. Consolidation
is voluntary: keeping separate notes permits more concurrent payments.

### Boundaries

This is the XNA TEST profile. The existing asset sponsor API remains separate;
this UI does not implement a complete C6 asset pool. Neither a local CAS store nor
an encrypted backup provides a global reservation service across disconnected
devices. Restore current pending history, avoid simultaneous independent devices,
and never assume an older backup cancels a packet. History is bounded to 256
operations and 4 MB plaintext; exhaustion fails closed. No automatic pruning or
silent reset is performed.

The scanner replays validated transactions from the pinned birth, using an
optional encrypted prefix to avoid redownloading completed work from a trusted
archival, fully validating RPC; it is not an SPV client. Production ceremony and independent
cryptographic review remain required for real-value use. Public TEST parameters
must not be presented as production-ready keys. Mobile measurements from earlier
C6 prototypes do not establish memory/time for this complete integrated release.

### C6 scan transport and visible phases

Host RPC/storage failures must be sent as explicit, non-empty errors. The worker
rejects even an empty error field; it must never resolve such a failure as an
undefined result. The client preserves nested proxy errors, rejects missing RPC
results and terminates on message decoding or synchronous posting failures.
Legitimate `gettxout` null results remain supported.

The scan reports reading history, local note recovery, chain checks and encrypted
operation reconciliation separately. Balance summaries include the public pool
`reserveAtomic`, not other users' private balances. The UI can open the identity
and journal before scanning finishes; failed scans can be retried with the same
open journal. No partial scan reconciles reservations.

### Durable scan progress

A durable C6 worker saves each validated confirmed transition in a separate,
encrypted IndexedDB record scoped to the identity, genesis, pool commitment and
birth. On a later attempt or a new worker, it checks every saved block against
the captured active chain, replays the cached transactions locally and requests
only the missing suffix. It still reconstructs trees and tries to decrypt notes;
it does not trust a cached private balance. A reorganization or lower tip trims
the affected suffix. Final chain checks must succeed before a balance is sent.

`scanC6Pool` optionally takes `checkpointStore: { read, compareAndSwap }` with
string/null reads and ciphertext CAS writes. It encrypts/authenticates the cache
using the identity. This disposable cache is bounded to 2 MiB plaintext and 2048
transitions; additional history is scanned without extending a full cache.
Concurrent updates or storage errors stop the attempt; corrupt ciphertext is
ignored and rebuilt. No keys, balances or note ownership are stored in plaintext.

The scan cache is **not** the private-operation journal. It has a separate storage
key and is not included in the operation backup. Losing the cache only repeats
public scanning. Losing the journal can lose knowledge of outstanding exposures:
restore its backup or explicitly create history for genuinely new use. Never
silently replace missing reservation history. Clearing site data or changing the
site origin affects both records. After a scan error the webwallet pauses automatic
polling until the user retries, instead of replaying a failed scan every 20 seconds.


### Read-only recovery and refresh

A durable worker can scan after derivation even when its operation journal is
missing. It reports `historyReady: false`, the confirmed owned balance, and zero
spendable balance. Preparing, issuing another address, signing, and publishing
still require the encrypted journal. A missing history is never silently created.

The webwallet polls public confirmation status separately from scans. A scan
is requested on opening, explicitly by the user, or when preparing/publishing
an operation. An unchanged mature state can reuse the worker's recovered trees
and notes only after checking the active prefix, portable-rule activation, and
the unspent state/reserve scripts. Issuing an address, a spent state, a younger
publication, or a reorganization forces recovery again. This in-memory reuse
is separate from the persisted encrypted transaction-prefix cache; reopening
still reconstructs trees from that cache.
