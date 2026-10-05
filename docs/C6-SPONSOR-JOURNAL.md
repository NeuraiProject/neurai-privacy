# C6 TEST sponsor authorization management

This is an opt-in library API for the experimental C6 protocol. C4/C5 transaction
construction and their existing signing defaults are unchanged. It does not
implement the complete C6 prover or automatically switch a webwallet to C6.

## Threat and limits

A `SINGLE|ANYONECANPAY` (0x83) authorization is a public spending capability.
An unrelated transaction can consume it and retain some of
`inputAtomic - changeAtomic`. This is not just a miner fee. Confirmation of the
private payment with a different sponsor **does not revoke** old authorizations.
Only a confirmed spend of each exposed outpoint does so; a reorganization can
reopen any historical authorization. Pending sweeps are not cancellation.

`SponsorJournal` enforces cumulative atomic-unit budgets for each operation and
for the wallet. It refuses more than one currently exposed authorization per
operation. It also refuses reuse of an outpoint across operations/pools and
reuse of the reserved note commitments/nullifiers. Reopened historical
exposures are retained, not silently discarded. These are authorization loss
budgets, not measured mining fees. A sweep fee may not exceed the loss already
budgeted for that outpoint.

The scope key is `(genesis, walletId)`, shared across pools and families that use
the same transparent coins. Derive one stable **local** wallet identifier from a
common wallet root, not from the pool or operation; otherwise callers split the
guard. Never publish the journal or identifier to a relay. It contains no secret
keys or note plaintext, but it contains sensitive correlation metadata.

A local journal cannot coordinate independent devices or different browser
origins. They need a single coordinator or separate non-overlapping coins and
notes. Removing browser storage, rolling back a backup or deliberately bypassing
the API removes its protection. Do not initialize a recovered wallet as new.
Back up/encrypt the journal alongside the private wallet. Recovery from loss
requires reconstructing all previously published authorizations, not merely the
current UTXO set. This API does not claim tamper resistance against its owner.

## Storage and ordering

`IndexedDbSponsorStore` uses atomic read/write transactions with strict durability
requested. It works across tabs on the same origin/database. Custom stores must
implement durable atomic `compareAndSwap`, not a read followed by a write.
`localStorage` and per-instance mutexes do not meet that contract.

```js
import { SponsorJournal, IndexedDbSponsorStore } from '@neuraiproject/neurai-privacy/client';
const journal = new SponsorJournal({
  store: new IndexedDbSponsorStore(), genesis, walletId,
  budgetAtomic: '30000000', // Explicit maximum lifetime exposure: 0.3 XNA.
});
await journal.initialize({ create: true }); // Only for a genuinely new wallet/database.
await journal.reserveOperation({ operationId, budgetAtomic: '20000000', notes });
```

On restart call `initialize()` without `create`: missing storage is an error,
not a new zero-budget history. Use `restore(authenticatedBackup)` to restore
missing storage; it refuses to overwrite existing history and still requires a scan. After restart, or after another tab changes the journal, signing requires a new
confirmed-chain reconciliation. Never reset budgets on restart or reorganization.
Before delivering a private proof separately, call `markPrivateExposure`.
`abandonUnexposed` is allowed only before any proof or signature was exposed.

`signAuthorization(operationId, offer, {rpc, sign})` checks the chain genesis and
live confirmed funding coin, commits the exposure **before** invoking the local
signer, and verifies the returned transaction envelope: v3, zero locktime,
final sequences, empty references, sponsor and its unchanged change at index 2,
and the signature's 0x83 byte. If signing, validation or storage fails, never
infer that the exposure was cancelled. The signer must not broadcast by itself.
The signer remains injected; the journal never receives a private key. It does
not authenticate the ZK proof, unrelated inputs, or the private intent: the C6
operation builder and node must do that. Envelope validation is not signature
verification. Admit the completed transaction on the node before publication.

## Chain reconciliation

`reconcile` accepts a complete, authenticated **confirmed-chain** snapshot and the
journal revision from which it was scanned. It rejects stale scans, unknown
outpoints and missing operation observations. The observer must:

1. Pin the genesis and a stable tip hash/height; retry if the tip changes.
2. Authenticate every observed sponsor spend in the active chain. A missing
   `gettxout`, an unavailable RPC/index, mempool spend or pending sweep is not
   confirmation. If absence cannot be resolved, fail closed and keep exposure.
3. Authenticate the **exact private operation** independently of sponsor spending,
   including proof/intent and all reserved nullifiers, using the pool scanner.
   Supply its confirmed transaction ID only when that exact operation is proven.
4. Include the confirmed spent reserved nullifiers. An unrelated partial spend is
   `conflicted`, never a successful private payment and never free notes.

The library validates snapshot shape and consistency, not its truth. Do not feed
untrusted relay observations directly to `reconcile`. On reorganization scan again,
including every historical authorization, and reopen disconnected spends/payments.
A completed operation closes its reservation because notes are consumed; it does
not free the consumed notes for another operation.

## Sweeps

`prepareSweep(outpoint, {rpc, feeAtomic, sign})` prepares a v3 single-input,
single-output self-transfer with no references, locktime zero, final sequence
and `SIGHASH_ALL`. Legacy, native strict PQ and strict ECDSA are supported. It
validates the live coin, exact amounts, family dust limit, signer envelope and
node admission before returning `{raw, txid, points, feeAtomic}`. The returned
transaction can be passed to `publishTransaction` with the genesis manifest.
The journal stores its pending txid, leaving the exposure open. Reconcile only
after an authenticated confirmation. A disconnect restores exposure even if an
old pending sweep txid remains in the history.

The state/reserve contract and nullifiers are not inputs to a sweep. Sweeping a
sponsor cannot complete, cancel or release the private proof. Keep notes reserved
until the proof is confirmed or definitively conflicted on chain.

## Validation scope

Use the unit suite, browser IndexedDB concurrency tests and the Q16 confirmed
regtest observation replay. Real node sweeps must additionally verify Legacy,
PQ and ECDSA signatures, admission, confirmation and rollback. These tests use
TEST pools and do not provide production cryptographic assurance.
