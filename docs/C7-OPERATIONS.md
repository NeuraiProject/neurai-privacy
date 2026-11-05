# C7 operations reference

This page is the API reference of the C7 XNA TEST runtime: instance pins,
the operation wallet, packets, public relocation, the dedicated worker and
the encrypted journal. The [transaction lifecycle](transaction-lifecycle.md)
shows the same pieces in order; [C7 J2](C7-JOIN.md) covers joins. Keys used
by the tests have public TEST entropy and must never secure real-value
funds.

The C6 names of this API (`createC6OperationWallet`, `scanC6Pool`,
`startC6PoolWorker`, `readC6Packet`, `buildC6Transaction`, `C6WorkerClient`,
`IndexedDbSponsorStore`, `prepareC6*`) are deprecated aliases of the C7 names
until the next release.

## Instance pins and byte order

Supply a separately reviewed manifest, deployment and proving-file pins. Do
not obtain trust anchors from the RPC that supplies chain data.

* `manifest.network`, `expectedGenesis` and the packet's network field use
  the 32 genesis bytes in internal/wire order, encoded as lowercase hex.
* `deployment.genesis` and RPC `getblockhash(0)` use display-order hex.
  Reverse these 32 bytes to convert between the two conventions.
* Commitments, field encodings, note roots and packet identifiers keep their
  documented byte order. Do not reverse them like RPC block hashes.
* `manifest.context` is `c7Context(domain, assetId)`: the domain, the XNA
  asset ID, quantum 1 and a zero registry root. `domain` must equal
  `c7PoolDomain({ genesis, emission, identity })` and `assetId`
  `c7XnaAssetId()`.
* `manifest.profile` is `C7_PROFILE` and the deployment has `kind: 'xna'`
  and an `emission`. `validateC7Deployment` checks the deployment's shape.
* Amounts and fees are exact atomic decimal strings or bigint, never floating
  point. One XNA is 100,000,000 atomic units. Fees must be one of the
  manifest's levels for the operation.

Proving files have `files[path] = {bytes, sha256}` and
`forms.D/T1/T2/T3/W/J2 = {wasm, zkey, vk}`. Review both the file pins and
their relationship to the verification keys of the manifest
(`vks`, `vk_sha256`). A successful local proof verification alone does not
establish that relationship.

## Private operation construction

`createC7OperationWallet({ expectedGenesis, expectedCommitment })` exposes
`prepareDeposit`, `prepareTransfer`, `prepareWithdrawal` and `prove`.
Preparation results contain plaintext notes and private witnesses. Keep them
inside a dedicated worker; never send them to RPC or a relocator.

* **D** accepts an existing funding outpoint (36 wire bytes) whose value
  equals the deposit plus its fee. Deposits are positive multiples of
  100 XNA. The wallet seals a fresh note to `recipient`, an nzk v3
  descriptor of this pool.
* **T1/T2/T3** consume one owned note against a nonzero historical root and a
  32-level Merkle path. The output count includes change. Ordinary recipients
  receive positive multiples of 100 XNA. At most one change note is allowed
  and it goes to `change`, the descriptor of the spent note's address (same
  owner and transmission key). Outputs plus the fee must equal the consumed
  amount.
* **W** commits the complete transparent payout script. Exact Legacy P2PKH
  and strict PQ (`OP_2`) / ECDSA (`OP_3`) scripts are supported. Normal
  payouts are multiples of 100 XNA. A smaller payout is allowed only when it
  consumes the entire note after its fee, with no change. Change goes to
  `change`. A withdrawal without change uses the circuit's canonical dummy
  note and a constant data hash.

`C7WalletIdentity.prepareC7Deposit`, `prepareC7Transfer` and
`prepareC7Withdrawal` fill in the domain, the asset ID, the spend secret of
the consumed note's address and the change address, from a recovered note of
`scanC7Pool` (`consumed`). No spending-key getter is exposed.

`prove(prepared, { api, wasm, zkey, vk, stage, signal })` checks the
prepared object against its fingerprint across every asynchronous proving
step, matches all public signals to the wallet's intent, verifies the proof
locally and returns `{ packet, packetId, proof, publicSignals }`. D/T/W use
packet wire version 1; J2 uses wire version 2. The packet contains
encrypted records, not plaintext notes, spending keys or Merkle paths. The
object passed to `prove` must come from the same wallet's `prepare`.

`readC7Packet(packet, { manifest })` decodes a packet and checks its
structure, its publication digest, the deposit binding, the payout script and
binding, and the withdrawal quantum. The byte layout is in
[data formats](data-formats.md#packet).

## Public relocation

```js
const tx = buildC7Transaction({ packet, scan, manifest, deployment, funding });
```

`buildC7Transaction` turns an immutable packet into a transaction against
the scanned state. `scan` needs only the public fields of a `scanC7Pool`
result (`events`, `opening`, `statePoint`, `reserveAtomic`, `reservePoint`,
`reserveScript`); `funding` (`{point, valueAtomic, script}`) is required for
deposits. It:

- validates the deployment and decodes the packet with the C7 manifest;
- checks the instance pins (network, pool, commitment, context), the fee
  level and the verification key's hash;
- replays every confirmed transcript of `scan.events` from the empty birth
  and requires the resulting opening to be `scan.opening`;
- checks the reserve, its outpoint and its script, the funding coin's
  outpoint, value and script type, and that the spent root is a historical
  root;
- picks the form (`D0`/`D1`, `T1`–`T3`, `J2`, `W_partial_no_change`,
  `W_partial_change`, `W_full_no_change`), builds the new transcript, the
  outputs and the witnesses, and checks the leaf against the commitment
  (MAST pin).

The result has `raw`, `txid`, `packetId`, `form`, `feeAtomic`,
`amountAtomic`, `reserveAtomic`, `inputPoints`, `funding` (deposits:
`{index, point, valueAtomic, script}`), `intent` (`c7Intent`) and
`transcript`. It **does not verify the Groth16 proof** and does not
establish that the RPC was honest. Use the worker's verified packet, then a
fully validating native node for admission.

`c7Intent(raw, deployment)` returns `{operationId, pool, nullifiers}`. The
`operationId` does not depend on the state the packet was relocated to, so a
rebuilt transaction keeps the intent of the original.

## Confirmed-chain recovery

`scanC7Pool({ rpc, deployment, identity, reserved, strategy,
historyPageLimit, checkpointStore, signal, onProgress })` rebuilds the pool
from the pinned birth and recovers the identity's notes; see
[chain scanning](chain-scanning.md). A note is spendable only under a
historical root with at least two confirmations and while not reserved by an
outstanding operation. Reservations do not decrease the owned balance. The
result includes private plaintext notes and paths; keep it inside the worker.

## Dedicated worker

```js
import { startC7PoolWorker } from '@neuraiproject/neurai-privacy/worker';

startC7PoolWorker({
  scope: self, snarkjs,
  manifest, deployment, domain, assetId, network: 'testnet',
  expectedGenesis, expectedCommitment,
  artifacts, artifactBaseUrl,
  reservations: [], buildTransactions: true, durableJournal: true,
});
```

The worker refuses foreign pins (`C7 worker: pinned instance mismatch`), a
domain or asset that does not derive from the birth, networks other than
`testnet` and `regtest`, invalid file pins and a durable worker without
transaction construction or J2 files. The options and the message protocol
are listed in [architecture](architecture.md#startc7poolworker-options).

`prepare` actions:

* `deposit`: `fee`, `amountAtomic`, `funding` (36-byte hex),
  `fundingValue`, `fundingPoint` (`"txid:vout"`), optional `recipient` (nzk
  v3 address or descriptor; by default the wallet's own address).
* `transfer`: `fee`, `note` (commitment hex), `recipients` with one to three
  `{recipient, amountAtomic}`. The worker adds change when needed and rejects
  more than three outputs including change.
* `withdraw`: `fee`, `note`, `amountAtomic`, `payoutScript` (hex).
* `join`: `fee`, `notes` with two distinct commitments of mature notes under
  one root.

In durable mode the worker reserves the resources before proving, rescans
after proving, relocates the packet into a transaction and saves both before
replying. In packet-only mode (`buildTransactions` and `durableJournal`
false) it returns the packet and its `resources`, keeps the reservation only
in memory, and the application must store reservations and relocate the
packet itself.

Summary messages never include plaintext notes, Merkle paths or spending
secrets. Balance information and reservation identifiers remain private
application data: do not log or upload them to public infrastructure. The
worker never signs transparent inputs, admits, mines or broadcasts
transactions.

## Durable journal

`openJournal()` opens the encrypted journal of this wallet and pool from the
store. Missing history is an error (`C6 private journal missing: …`), not a
new wallet. `openJournal({ create: true })` explicitly creates a new history;
do not use it as an automatic fallback after a missing or unreadable store.
`openJournal({ backup })` restores an exported backup, only into empty
storage (`C7 private journal: refusing to replace existing history`), on a
device using the same words, family, account and passphrases.

* **Reservations.** A draft reserves the spent notes and the funding coin
  before proving. Atomic compare-and-swap prevents two tabs that share the
  store from reserving the same resource.
* **Prepared operations.** The verified packet, proof, public signals and
  transaction are saved before the worker returns them. A prepared packet
  cannot be cancelled locally. `releaseDraft(id)` releases only a draft.
* **Outcomes.** On every scan the journal marks an operation `confirmed` when
  a confirmed transaction carries its intent, and `conflicted` when a
  confirmed transaction spent one of its nullifiers. A reorganization
  reopens it. An RPC failure or an empty mempool is not evidence of
  cancellation.
* **Signing.** `recordSigned(id, raw)` checks that the signed transaction is
  the saved one apart from the funding signature, that its intent is
  unchanged and that the funding input uses `SIGHASH_ALL`. Forms without a
  funding input must be recorded unchanged.
  `broadcastAttempt(id)` records each attempt before the application sends
  it.
* **Rebuild.** `rebuild(id)` rechecks the saved proof against its pinned
  verification key, rescans and relocates the packet against the current
  state, keeping the payment intent. A deposit must be signed again with its
  original funding coin.
* **Address rotation.** The receiving index is saved in the journal before a
  new address is returned.
* **Backups.** `backup()` returns the authenticated encrypted history. It
  contains no words or keys.

History is bounded to 256 operations and 4 MB of plaintext; exhaustion fails
closed. No automatic pruning or silent reset is performed. The scan caches
use the same store under separate keys and are not part of the backup.

## Exposure and cancellation

A proof packet can remain valid after a service drops it. Persist the
journal before handing a packet to a relocator or publishing it, and restore
the full journal after a restart or a wallet switch; never silently use an
empty journal for an existing wallet.

`lock` invalidates the current session and prevents late scan or proof
results. `stop()` disables further messages. To interrupt expensive
WebAssembly immediately and discard its memory, terminate the containing Web
Worker. JavaScript cannot guarantee physical zeroization of all engine
copies. Neither action cancels a packet already exposed.

## Boundaries

This is the C7 XNA TEST profile. There are no asset pools and no sponsor
coins: the reserve pays the fee of every operation except deposits. A local
store and an encrypted backup do not provide a global reservation service
across disconnected devices: restore current pending history, avoid
simultaneous independent devices and never assume that an older backup
cancels a packet.

The scanner replays validated transactions from the pinned birth, using
optional encrypted caches to avoid redownloading completed work from a
trusted archival, fully validating RPC; it is not an SPV client. Production
ceremony and independent cryptographic review remain required for real-value
use.
