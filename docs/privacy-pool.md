# How the privacy pool works

The Neurai privacy pool is a contract on the Neurai chain that holds XNA and
keeps a private ledger of who owns it. Ownership is recorded as **notes**.
The chain only stores a commitment to each note plus an encrypted record that
only the recipient can read. Every pool transaction carries a Groth16
zero-knowledge proof about the notes it spends and creates. The proof
reveals no owner, and for transfers and joins it reveals no amount either.

This library implements the C7 XNA TEST pool (`C7_PROFILE`,
`C7-XNA-TEST-v1`). C7 runs on the node's portable public-tree rules
(consensus profile 3). It needs no wallet support from the node: it is built
from a UNIQUE asset, AuthScript outputs with MAST leaves, Groth16
verification and those tree rules.

## Pool instance, manifest and deployment

A pool instance is created once by a **birth** transaction. The birth spends
a UNIQUE **emission** outpoint, creates the first state output (an empty
pool) carrying the UNIQUE asset `NAME#POOL`, and burns the owner token
`NAME!` to the network's global burn address, so nobody keeps control of the
pool asset. The instance is then identified by:

- **domain**, 32 bytes derived from the genesis, the emission outpoint and
  the pool name (`c7PoolDomain`). All note hashes include it, so notes of one
  instance cannot be used in another.
- **asset ID**, `c7XnaAssetId()`, the identifier of native XNA.
- **context** (`ctx`), a Poseidon hash of domain, asset ID, quantum 1 and an
  all-zero registry root (`c7Context`). It is the first public input of
  every proof.
- **commitment**, the MAST root of the contract leaves, one leaf per form.

The application pins two public documents, never taken from RPC data:

- the **manifest**: profile, network (genesis in internal byte order),
  identity `NAME#POOL`, context, commitment, one verification key per
  operation (`vks`, with `vk_sha256`) and the discrete fee levels of each
  operation (`fees`);
- the **deployment**: genesis (RPC order), commitment, `kind: 'xna'`, the
  emission, the birth anchor (height, block hash, outpoint, script and the
  145-byte opening of the empty state) and the leaves (form, script and
  witness argument names).

`validateC7Deployment` checks the deployment's shape: the anchor script
starts with the commitment and ends with the digest of the anchor opening,
and every leaf is a known form with the mandatory witness arguments. The
worker also checks that the manifest and the deployment match the pins and
that the domain derives from the birth. The transaction builder checks every
leaf against the commitment (MAST pin) and every verification key against
its hash. These checks prove that the documents are consistent. They do not
prove that the scripts implement safe custody; pinning a deployment is a
deliberate decision of the application. See the
[security model](security-model.md).

## The two pool outputs

Every pool transaction spends the current pool outputs and creates new ones.

**State output (output 0).** Value 0. Its script is an AuthScript output
(`OP_1 <commitment>`) that also carries one unit of `NAME#POOL` with the
32-byte state digest attached. Whoever spends it must use one of the
contract leaves.

**Reserve output (output 1).** Holds all the XNA in the pool. It is locked
by a guard script bound to the contract commitment and the pool identity,
so it can only be spent together with the state output. The reserve value is
public. When a withdrawal empties the pool (`W_full_no_change`), no reserve
output is created; the next deposit (`D0`) creates it again.

## Pool state

The state commits to four Merkle trees, each 32 levels deep and hashed with
Poseidon over the BN254 scalar field:

| Tree | Content | Purpose |
| --- | --- | --- |
| Note tree | Commitments of all notes ever created, in order. | Proves a spent note exists. |
| Nullifier tree | Indexed (sorted, linked) tree of all published nullifiers. | Proves a nullifier is new, which prevents double spends. |
| Seen tree | Indexed tree of all commitments. | Proves a new commitment is unique. |
| History tree | The note-tree root after every operation that created notes. | Lets a proof use any earlier root. |

The **state opening** is 145 bytes: the note, nullifier and seen roots, their
three counters, a mode byte, the history root and the number of historical
roots. Mode 0 means the pool holds nothing; mode 1 means it holds notes. The
digest is `PoseidonBytes(opening)`. Byte layouts are in
[data formats](data-formats.md#pool-trees-and-state-opening).

## Portable proofs

A C7 proof does not mention the pool state. It proves facts about notes: that
the spent note is in the note tree under one **historical root** `R`, that the
spender owns it, that its nullifier is correct, that value is conserved and
that the published records encrypt the new notes. The state transition itself
travels as a public **transcript** in the witness: the old and new openings,
the nullifiers, the new commitments and every insertion path. The node checks
that the transcript starts at the state being spent, applies exactly those
insertions and ends at the digest of the new state output.

This makes a proof **portable**. When another pool transaction confirms
first, the proof stays valid because its root is still in the history tree;
only the transcript, the prevouts and the reserve change. The worker builds
the transaction against the latest confirmed state just before returning it,
and `rebuild` relocates a saved operation again without proving. A deposit
built as `D0` becomes `D1` when the pool was refilled in the meantime.

## Notes, commitments and nullifiers

A note (CP1, 169 bytes) records a domain, an asset ID, an owner, the
recipient's transmission key `pk_d`, an amount in atomic units and a random
`rho`. Each address has a **spend secret**, from which the public `owner`
value and the private nullifier key `nk` are derived:

```text
owner = PoseidonBytes("NIP043/owner/CP1" || domain || spendSecret)
nk    = PoseidonBytes("NIP043/nk/CP1"    || domain || spendSecret)
cm    = PoseidonBytes("NIP043/cm/CP1"    || note)
nf    = PoseidonBytes("NIP043/nf/CP1"    || domain || nk || rho || cm)
```

Creating a note appends `cm` to the note and seen trees. Spending it
publishes `nf`. Only the owner knows `nk`, so nobody else can compute the
nullifier or tell which commitment it belongs to.

## Encrypted note records

The sender encrypts each new note to the recipient's address and publishes
the 230-byte record together with its commitment. C7 records are adapted
from Zcash Orchard over ristretto255: an ephemeral key derived from `rho`, a
one-byte **view tag**, and ChaCha20-Poly1305 encryption of the note and its
diversifier, bound to the domain and `cm`.

An account has one incoming viewing key. To find its notes it multiplies
each record's ephemeral key by that key once, compares the view tag (which
rejects about 255 of 256 foreign records without decrypting) and decrypts
the rest. The diversifier inside the plaintext tells which address received
the note, so the cost does not depend on the number of addresses. No message
has to reach the recipient: the chain carries everything needed to recover
the note. See [chain scanning](chain-scanning.md).

## Operations and forms

Every operation has its own circuit and verification key (`D`, `T1`, `T2`,
`T3`, `W`, `J2`). The contract has one leaf per **form**; the builder picks
the form from the operation and the reserve.

| Form | Operation | Notes consumed | Notes created | Reserve |
| --- | --- | --- | --- | --- |
| `D0` | First deposit into an empty pool | 0 | 1 | 0 → amount |
| `D1` | Deposit into a pool that holds notes | 0 | 1 | grows by the amount |
| `T1`, `T2`, `T3` | Transfer one note to 1, 2 or 3 notes, change included | 1 | 1 to 3 | shrinks by the fee |
| `J2` | Join two notes of the wallet into one | 2 | 1 | shrinks by the fee |
| `W_partial_change` | Withdraw part of a note; the rest becomes a new note | 1 | 1 | shrinks by amount and fee |
| `W_partial_no_change` | Withdraw a whole note while the pool keeps XNA | 1 | 0 | shrinks by amount and fee |
| `W_full_no_change` | Withdraw a whole note that empties the pool | 1 | 0 | → 0, no reserve output |

Rules the library enforces:

- **Fees.** The fee is a public input and must be one of the manifest's
  levels for the operation. A deposit's funding coin pays it; every other
  operation pays it from the reserve, and the spent note covers it.
- **Conservation.** The created notes plus the fee add up exactly to the
  consumed notes.
- **Quantum.** Deposits, transfer payments to other recipients and
  withdrawals are multiples of 100 XNA. Change can be any amount. A smaller
  withdrawal is allowed only when it takes the whole note after its fee.
- **Change address.** The change of a transfer or a withdrawal goes back to
  the spent note's address, and a join's note goes to the address of its
  first note. The wallet supplies that address, because a C7 note does not
  carry its diversifier.
- **Deposits need an exact coin.** The deposit spends one confirmed
  transparent coin worth exactly the amount plus the fee.

## Transaction layout

All pool transactions are version 3 with the witness flag, locktime 0,
sequences `0xffffffff` and no reference inputs.

Inputs, in this order:

| # | Input | Present in |
| --- | --- | --- |
| 0 | Current state output | every form |
| 1 | Current reserve output | every form except `D0` |
| last | Funding coin (amount plus fee) | `D0`, `D1` |

Outputs, in this order:

| # | Output | Present in |
| --- | --- | --- |
| 0 | New state output | every form |
| 1 | New reserve output | every form except `W_full_no_change` |
| last | Withdrawal payment to a transparent script | `W_*` forms |

The witness of input 0 holds the leaf's arguments: the five 3072-byte pieces
of the transcript, the compressed proof, the verification key, either the
4096-byte publication (in two halves) or the nullifier, the amount (deposits)
or the historical root `R`, and the serialized prevouts; then the leaf script
and its control block. The reserve input reveals the guard script. The
funding coin of a deposit is signed by the user's transparent wallet with
`SIGHASH_ALL` after the transaction is built; the other forms need no
transparent signature.

The **publication** carries the new commitments, their records and, when a
note is spent, the nullifier. Its hash (`data_hash`) is a public input, so
nobody can swap the records after proving.

## Contention and finality

There is one state output, and each pool transaction spends it. Only one pool
transaction can confirm on a given state. Because proofs are portable, the
loser of a race does not prove again: rescan and rebuild the operation
against the new state (the worker does this in `prepare` and `rebuild`), then
publish the new bytes. Two operations that spend the same note cannot both
confirm; the journal marks the loser as conflicted.

Pool transactions cannot be chained in the mempool, and a note becomes
spendable only when the publication that created it has two confirmations.
A reorganization can undo confirmed pool transactions; the scanner detects
it and rebuilds. See [chain scanning](chain-scanning.md#reorganizations).

## Related reading

- [Transaction lifecycle](transaction-lifecycle.md): how the library builds these transactions.
- [Security and privacy model](security-model.md): what the pool hides and what it does not.
- [Data formats](data-formats.md): exact bytes of everything described here.
