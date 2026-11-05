# Transaction lifecycle

This document follows one pool operation from the user's request to its
confirmation, with the durable worker (`buildTransactions: true`,
`durableJournal: true`) and `C7WorkerClient`. The
[privacy pool overview](privacy-pool.md) explains the forms and the
transaction layout used below.

```text
 page                        worker                                           page
 ────                        ──────                                           ────
 prepare ──▶ rescan ─▶ plan ─▶ reserve (draft) ─▶ load files ─▶ prove ─▶ verify
                    ─▶ rescan ─▶ relocate (build tx) ─▶ save (prepared) ──▶ sign funding (deposits)
 confirm ◀─ scan/reconcile ◀─ publish ◀─ broadcastAttempt ◀─ admit ◀─ recordSigned ◀┘
```

## 0. Open the wallet

```js
await pool.derive({ mnemonic, passphrase, zkPassphrase, family: 'legacy', account: 0 });
await pool.openJournal();          // or { create: true } on first use, or { backup }
const { scan } = await pool.scan();
```

`openJournal()` fails with `C6 private journal missing: restore the encrypted
backup or explicitly create a new history` when the store has no history for
this wallet and pool. Create a new history only for genuinely new use. If the
wallet was used on another device, restore its latest backup with
`openJournal({ backup })` there instead; a restore never overwrites existing
history. Without a journal the worker can still scan (`historyReady: false`)
but reports no spendable balance and cannot prepare.

## 1. Request the operation

The fee must be one of the manifest's levels for the operation
(`manifest.fees`). Amounts are exact atomic decimal strings.

```js
// Deposit 500 XNA. The funding coin is worth exactly the amount plus the fee.
await pool.prepare({ action: 'deposit', amountAtomic: '50000000000', fee: '10000000',
  funding: outpointHex, fundingValue: '50010000000', fundingPoint: 'txid:vout' });

// Pay one to three recipients from one note; the worker adds the change.
await pool.prepare({ action: 'transfer', note: cm, fee: '10000000',
  recipients: [{ recipient: 'tnzk1…bob', amountAtomic: '20000000000' }] });

// Withdraw to a transparent address.
const payoutScript = await withdrawalScript(rpc, 'tXYZ…');
await pool.prepare({ action: 'withdraw', note: cm, amountAtomic: '10000000000', fee: '10000000', payoutScript });

// Join two notes into one.
await pool.prepare({ action: 'join', notes: [cm0, cm1], fee: '10000000' });
```

- `note` is the commitment of a spendable note from the last scan; `join`
  needs two distinct spendable notes under the same root.
- A deposit's `funding` is the 36-byte outpoint in hex (txid in internal
  order, then `u32le(vout)`), and an optional `recipient` sends the new note
  to another address; by default it goes to the wallet's own address.
- A recipient is an nzk v3 address of the same network and pool, or a C7
  descriptor as JSON.
- Deposits, payments to recipients and withdrawals are multiples of 100 XNA.
  A smaller withdrawal is allowed only when it takes the whole note after the
  fee. Change can be any amount.

### Creating an exact deposit coin

A wallet rarely holds a coin worth exactly the amount plus the fee. Create
one first with an ordinary self-payment to a Legacy, strict PQ or strict
ECDSA address. `inspectFundingTransaction(rpc, raw)` checks that transaction
before it is sent: the node accepts it, its inputs are unspent, and it
reports the fee it pays. Broadcast it, wait for a confirmation, then prepare
the deposit. `confirmedPoolCoins(rpc, utxos, { baseCurrency: 'XNA' })` lists
the wallet's confirmed coins with an accepted script.

## 2. Inside the worker

`prepare` runs these steps. Any failure stops the request with an error and
nothing leaves the worker.

1. **Rescan.** The worker reloads the journal, scans the pool and reconciles
   the journal with the confirmed chain.
2. **Plan.** The identity passes the spend secret of the note's address and
   the change address to the operation or J2 wallet, which checks the
   instance, the fee level, ownership, membership under the note's root,
   conservation and the amount rules, seals the new notes to their addresses
   and builds the publication and the public inputs.
3. **Reserve.** The journal saves a draft that reserves the spent notes (and
   the funding coin) before any proving starts. Another tab that tries the
   same note or coin gets `C7 private journal: note or funding coin already
   reserved`.
4. **Load the proving files.** The form's `.wasm`, `.zkey` and `vk.json`
   must match their pinned size and SHA-256. Progress is reported through
   `stage` messages. The C7 TEST deployment of 2026-09-26 pins 18 files,
   about 88 MiB.
5. **Prove and verify.** snarkjs computes the witness and a Groth16 proof on
   one thread. The wallet checks that the public signals equal the prepared
   ones, verifies the proof against the pinned key and fails if it does not
   verify. It also checks, after every asynchronous step, that nothing
   changed the prepared intent.
6. **Rescan and relocate.** Proving can take minutes, so the worker scans
   again and builds the transaction against the latest confirmed state
   (`buildC7Transaction`). For a deposit it reads the funding coin with
   `gettxout`; it must be confirmed and match the packet.
7. **Save.** The journal saves the packet, the proof and the transaction
   before the worker returns them.

The `prepared` reply contains public data only:

| Field | Meaning |
| --- | --- |
| `operationId` | The journal's identifier of this operation. |
| `packet`, `packetId`, `proof`, `publicSignals` | The portable proof. |
| `transaction.raw`, `transaction.txid` | The transaction, complete except the funding signature of a deposit. |
| `transaction.form` | The form used, for example `D1` or `W_partial_change`. |
| `transaction.feeAtomic`, `amountAtomic`, `reserveAtomic` | Fee, operation amount and the reserve after it. |
| `transaction.inputPoints` | All outpoints spent, for the publication checks. |
| `transaction.funding` | For deposits, `{index, point, valueAtomic, script}` of the funding input. |
| `transaction.intent` | `c7Intent` of the transaction. |

## 3. Sign and record

Only a deposit has a transparent input: sign `transaction.funding.index`
with the wallet's own signer and `SIGHASH_ALL`, for example
`@neuraiproject/neurai-sign-transaction`. Then record the signed bytes:

```js
const signed = await pool.recordSigned(prepared.operationId, signedRaw);   // deposits
const signed = await pool.recordSigned(prepared.operationId, prepared.transaction.raw); // other forms
```

`recordSigned` requires the same version, locktime, outputs, inputs and
witnesses as the saved transaction, apart from the funding input's signature,
and the same intent. A Legacy funding signature must end with sighash `01`;
a witness signature must end with `01` and use a strict witness version. Any
other form must be recorded byte for byte. The reply carries the final
`txid`, which differs from the unsigned one for a Legacy funding coin.

## 4. Publish

```js
const { txid } = await admitTransaction(rpc, signed.raw);   // testmempoolaccept only
await pool.broadcastAttempt(prepared.operationId);          // record before sending
try {
  await publishTransaction(rpc, { genesis: deployment.genesis }, { raw: signed.raw, txid, points: signed.inputPoints });
} catch (error) {
  if (!error.uncertain) throw error;
  // The node may or may not have the transaction: check later with publicationStatus.
}
```

`publishTransaction` checks the genesis and that the inputs are unspent,
runs `testmempoolaccept`, confirms that the decoded transaction has the
expected ID, calls the optional `onBroadcast(txid)` and then
`sendrawtransaction`. If the send call fails or returns another ID, the error
has `uncertain: true`.

`publicationStatus(rpc, { genesis }, { txid, raw, points })` resolves an
uncertain publication:

| Result | Meaning |
| --- | --- |
| `'confirmed'` | In a block. |
| `'mempool'` | Waiting in the node's mempool. |
| `'retryable'` | The node does not know it, its inputs are unspent and the same bytes are still accepted. Send the same bytes again. |
| throws | Still uncertain. Keep the operation reserved. |

A transport failure or an empty mempool is not evidence that an operation
was cancelled. The journal keeps it reserved until the chain decides.

## 5. After confirmation

Scan again. The journal closes an operation as `confirmed` when the scan
finds a transaction with its intent, and as `conflicted` when another
confirmed transaction spent one of its nullifiers. A reorganization reopens
both. The recipient of a transfer finds the note in its own scan; no message
has to be sent. A new note becomes spendable when its publication has two
confirmations.

## 6. When the state moved first

There is one pool state, so another pool transaction can confirm while an
operation is being signed or published. Its transaction then spends an input
that no longer exists, and admission fails. Do not prove again:

```js
const again = await pool.rebuild(prepared.operationId);   // same proof, current state
```

`rebuild` checks the saved proof against its pinned verification key, scans,
and relocates the same packet against the current state. Record and publish
the new transaction as above; a deposit must be signed again with its
original funding coin. Both versions spend the same nullifiers or the same
funding coin, so at most one of them can confirm.

An operation that stopped before its packet existed (for example a cancelled
proof) is a draft. `releaseDraft(id)` frees its reservation. A prepared
packet cannot be cancelled locally (`An exposed C7 packet cannot be cancelled
locally`): only a confirmed spend or a confirmed conflict closes it.

## 7. Backups

`pool.backup()` returns the encrypted history
(`{ type, genesis, commitment, cipher }`). It contains no words or keys and
opens only with the same words, BIP-39 passphrase, ZK passphrase, family and
account. Keep a current backup when pending operations must move to another
browser or device. Confirmed notes do not need it: a scan finds them from the
words.

## Failures and what to do

| Error | Cause | Action |
| --- | --- | --- |
| `C6 private journal missing: …` | No history for this wallet in this store. | Restore a backup, or create a history for new use. |
| `C7 operation history required before preparing; restore or explicitly create it` | The journal is not open. | Call `openJournal`. |
| `C7 worker: selected note is unavailable, immature or reserved` | The note was spent, is too recent or is held by a pending operation. | Scan; wait for two confirmations or choose another note. |
| `C7 worker: insufficient selected note` | Payments plus fee exceed the note. | Choose a larger note or join two notes. |
| `C7 worker: maximum three outputs including change` | Three recipients plus change. | Pay at most two recipients when there is change. |
| `C7: unapproved fee` | The fee is not one of the manifest's levels. | Use a listed fee level. |
| `C7: deposit must be a multiple of 100 XNA`, `C7: recipient amount must be a multiple of 100 XNA`, `C7: withdrawal must be a multiple of 100 XNA` | Amount outside the quantum. | Round the amount. |
| `C7: small recovery must consume the entire note` | A withdrawal below 100 XNA that leaves change. | Withdraw the whole note. |
| `C7: funding must equal amount plus fee` | `fundingValue` differs. | Create an exact funding coin. |
| `C7 confirmed funding coin unavailable` | The funding coin is spent or unconfirmed. | Wait for its confirmation or create another. |
| `C7 private journal: note or funding coin already reserved` | Another pending operation holds it. | Finish or release that operation. |
| `C7 private journal changed in another tab; rescan before retrying` | Two tabs wrote the journal. | Scan and retry. |
| `Pool artifact integrity mismatch`, `Artifact exceeds pinned size` | A downloaded file differs from its pin. | Fix the file server. Never skip the check. |
| `C7: invalid generated proof`, `Invalid generated proof` | The proof does not verify. | Report it; do not publish. |
| `C7 funding must use SIGHASH_ALL` | The funding input was signed with another sighash. | Sign it again with `SIGHASH_ALL`. |
| `C7 signed transaction changed private intent` | The signed bytes differ from the saved transaction. | Sign the saved transaction without changing it. |
| `An input was spent while preparing. Refresh and rebuild the transaction.` | Another pool transaction or a coin spend got there first. | `rebuild` the operation; no new proof is needed. |
| Error with `uncertain: true` | Unknown publication outcome. | Use `publicationStatus` before doing anything else. |
