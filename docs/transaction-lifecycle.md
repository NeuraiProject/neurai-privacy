# Transaction lifecycle

This document follows one pool transaction from the user's request to its
confirmation. The [privacy pool overview](privacy-pool.md) explains the forms
and the transaction layout used below.

```text
 page                         worker                           page
 ────                         ──────                           ────
 pick coins ──▶ prepare ──▶ rescan ─▶ check coins ─▶ plan form
                             ─▶ build witness ─▶ prove ─▶ verify ─▶ serialize
                                                                    │
 confirm ◀─ publish ◀─ admit ◀─ recheck inputs ◀─ sign funding/fee ◀┘
```

## 1. Choose the transparent coins

Every pool transaction spends a **sponsor coin** that pays the miner fee and
receives the change. A deposit also spends a **funding coin** whose value is
exactly the deposited amount. Both must be confirmed coins of the base
currency (XNA) with a script the profile accepts:

| Script | C3 | C4 | Minimum sponsor change |
| --- | --- | --- | --- |
| Legacy P2PKH (`76a914…88ac`) | yes | yes | 546 satoshis |
| Strict PQ, `OP_2 <32 bytes>` | no | yes | 3060 satoshis |
| Strict ECDSA, `OP_3 <32 bytes>` | no | yes | 336 satoshis |

In C4 the minimum is the dust threshold for the script, computed by
`c4DustAtomic(script, feePerKb)` with the default dust relay fee of 3000
satoshis per kB. The same rule applies to the new reserve output and to a
withdrawal payment.

Helpers in the `client` entry:

- `confirmedPoolCoins(rpc, utxos, { baseCurrency, profile })` keeps the
  wallet rows with an accepted script and asks the node (`gettxout`) that
  each one is unspent and confirmed.
- `selectPoolCoins(coins, { action, amountAtomic, feeAtomic, profile })`
  returns `funding` (deposits only: the first coin of exactly the amount) and
  `sponsor` (the first other coin that covers the fee plus the minimum
  change). An application may choose its own coins instead.

The fee is set by the application. It must be positive, at most 1 XNA and
accepted by the node's relay policy. Pool transactions carry a large witness,
so their fee is higher than that of an ordinary payment.

### Creating an exact deposit coin

A wallet rarely holds a coin of exactly the deposit amount. Create one first
with an ordinary self-payment. `inspectFundingTransaction(rpc, raw)` checks
that transaction before it is sent: the node accepts it, its inputs are
unspent, and it reports the fee it pays. Broadcast it, wait for a
confirmation, then prepare the deposit.

### Withdrawal destination

`withdrawalScript(rpc, address, { profile })` asks the node to validate the
address and returns its output script, which becomes the `payout` field.
C3 accepts Legacy addresses only. C4 also accepts strict PQ and ECDSA
addresses.

## 2. Request the transaction from the worker

```js
// Deposit 5 XNA.
const { funding, sponsor } = selectPoolCoins(coins, { action: 'deposit', amountAtomic: 500000000n, feeAtomic: 10000000n });
await pool.prepare({ action: 'deposit', amountAtomic: '500000000', feeAtomic: '10000000', funding, sponsor });

// Assign 2 XNA from a note to one recipient (T1, or T2 with change).
await pool.prepare({ action: 'transfer', amountAtomic: '200000000', feeAtomic: '10000000', sponsor,
  note: note.cm, recipient: 'tnzk1…' });

// C4: assign one note to several recipients (T2–T4, change included).
await pool.prepare({ action: 'transfer', amountAtomic: '700000000', feeAtomic: '10000000', sponsor, note: note.cm,
  recipients: [{ recipient: 'tnzk1…bob', amountAtomic: '400000000' }, { recipient: 'tnzk1…carol', amountAtomic: '300000000' }] });

// Withdraw a whole note to a transparent address.
const payout = await withdrawalScript(rpc, 'tXYZ…', { profile: 'C3' });
await pool.prepare({ action: 'withdraw', amountAtomic: note.amountAtomic, feeAtomic: '10000000', sponsor, note: note.cm, payout });
```

`note` is the commitment (`cm`) of an unspent note from the last scan.
A recipient is an `nzk` address, a JSON descriptor string or a descriptor
object. It must belong to the same network and pool instance.

## 3. Inside the worker

`prepare` runs these steps. Any failure stops the request with an error and
nothing leaves the worker.

1. **Rescan.** The worker rebuilds the pool state from the node, continuing
   from its last scan, so the transaction is built on the latest confirmed
   state.
2. **Check coins.** The sponsor and funding coins must still be unspent and
   confirmed, with the expected script and exact value.
3. **Plan.** The worker picks the form and creates the new notes:
   - deposit: `D0` if the reserve is 0, otherwise `D1`; one note to the
     wallet's own internal address;
   - transfer: one note per recipient, plus a change note to the wallet's
     internal address when the amount is less than the note; the form is
     `T` followed by the number of created notes;
   - withdraw: `W_full` if the note holds the whole reserve, otherwise
     `W_partial`.

   Each new note gets a fresh random `rho` and is encrypted to its
   recipient's viewing key.
4. **Build the witness.** With the spend key of the address that received
   the note, the worker computes the nullifier and the Merkle paths and
   inserts the new commitments and nullifier into a copy of the trees. It
   then builds the transaction template, the anchor and the public inputs.
   It checks value conservation, the reserve range, the fee limit, dust
   rules, duplicate inputs and that every note belongs to this pool.
5. **Load artifacts.** It downloads the form's `.wasm`, `.zkey` and `vk.json`.
   Each file must match its pinned size and SHA-256. Download progress is
   reported through `stage` messages.
6. **Prove and verify.** snarkjs computes the witness and a Groth16 proof on
   one thread. The worker then verifies the proof against the pinned
   verification key and fails if verification fails.
7. **Serialize.** The worker checks that the proof's public inputs equal the
   prepared ones, compresses the proof to 128 bytes, assembles the witnesses
   and serializes the transaction.

The reply contains public data only:

| Field | Meaning |
| --- | --- |
| `raw` | Transaction hex with the pool inputs complete and the funding and sponsor inputs unsigned. |
| `form` | Form used. |
| `feeAtomic`, `amountAtomic` | Fee and operation amount. |
| `stateOutpoint` | The state output this transaction spends. |
| `inputPoints` | All outpoints spent, for the publication checks. |

The C3 TEST artifacts total about 335 MiB (30 files). The largest single
file is the `T2` proving key, about 111 MiB. Whether a later operation
downloads them again depends on the HTTP cache headers of the server that
hosts them. Proving time and memory depend on the device and the form;
assignments with more notes take longer.

## 4. Sign the transparent inputs

The worker never sees transparent keys. Sign the funding and sponsor inputs
with the wallet's own signer, for example
`@neuraiproject/neurai-sign-transaction`. The proof does not cover
signatures, so signing does not invalidate it. Changing any input or output
does.

## 5. Publish

```js
await recheckInputs(rpc, manifest, prepared.inputPoints);        // still unspent?
const { txid } = await admitTransaction(rpc, signedRaw);         // testmempoolaccept only
try {
  await publishTransaction(rpc, manifest, { raw: signedRaw, txid, points: prepared.inputPoints },
    { onBroadcast: id => journal.save({ txid: id, raw: signedRaw, points: prepared.inputPoints }) });
} catch (error) {
  if (!error.uncertain) throw error;
  // Keep the journal entry and check later with publicationStatus.
}
```

`publishTransaction` checks the genesis and the inputs again, runs
`testmempoolaccept`, confirms that the decoded transaction has the expected
ID, calls `onBroadcast(txid)` and then `sendrawtransaction`. Save the
transaction ID and bytes in `onBroadcast`. If the send call fails or returns
another ID, the error has `uncertain: true`: the node may or may not have
received the transaction.

`publicationStatus(rpc, manifest, { txid, raw, points })` resolves an
uncertain publication:

| Result | Meaning |
| --- | --- |
| `'confirmed'` | In a block. |
| `'mempool'` | Waiting in the node's mempool. |
| `'retryable'` | The node does not know it, its inputs are unspent and the same bytes are still accepted. Send the same bytes again. |
| throws | Still uncertain. Do not build a replacement yet. |

Never rebuild an operation while its earlier transaction might still
confirm. If the earlier one confirms, a rebuilt transfer or withdrawal built
on the new state would run the operation a second time.

## 6. After confirmation

Scan again to see the new balance. The recipient of an assignment finds the
note in its own scan; no message has to be sent. Wait for the confirmation
before preparing another pool operation, because each one must build on a
confirmed state.

## Failures and what to do

| Error | Cause | Action |
| --- | --- | --- |
| `Pool state changed: rescan required` | The reserve no longer matches the planned form. | Prepare again. |
| `Selected note is no longer spendable` | The note was spent or is not in the last scan. | Scan and choose another note. |
| `No confirmed coin matches this deposit…` | No funding coin of the exact amount. | Create one and wait for its confirmation. |
| `A separate confirmed supported XNA coin is needed for the fee` | No suitable sponsor coin. | Add a confirmed coin of an accepted script type. |
| `Funding coin is spent, unconfirmed or unsupported` | A coin changed after it was selected. | Select coins again. |
| `Fee must be at most 1 XNA and leave non-dust sponsor change` | Fee too high or sponsor too small. | Lower the fee or use a larger sponsor. |
| `… would be dust under the selected policy` (C4) | Reserve or withdrawal below the dust threshold. | Use larger amounts. |
| `C3 artifact integrity mismatch`, `Artifact exceeds pinned size` | A downloaded artifact differs from the pinned one. | Fix the artifact server. Never skip the check. |
| `Local proof verification failed` | The proof does not verify. | Report it; do not publish. |
| `An input was spent while preparing…` | Another pool transaction or a coin spend got there first. | Scan and prepare again. |
| Error with `uncertain: true` | Unknown publication outcome. | Use `publicationStatus` before doing anything else. |
