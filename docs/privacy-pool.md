# How the privacy pool works

The Neurai privacy pool is a contract on the Neurai chain that holds XNA and
keeps a private ledger of who owns it. Ownership is recorded as **notes**.
The chain only stores a commitment to each note plus an encrypted copy that
only the recipient can read. Every pool transaction carries a Groth16
zero-knowledge proof that the private ledger was updated correctly. The
proof reveals no owner, and for assignments inside the pool it reveals no
amount either.

The pool needs no special wallet support from the node. It is built from
existing Neurai features: a UNIQUE asset, AuthScript outputs with MAST
leaves, Groth16 verification and transaction introspection. This library
handles everything on the wallet side.

## Pool instance and manifest

A pool instance is created once by a **birth** transaction. The birth
consumes the UNIQUE asset `NAME#POOL` and creates the first state output,
which holds the digest of an empty pool. The instance is then identified by:

- **domain**, 32 bytes that separate this instance from every other one. All
  note hashes include it.
- **asset ID**, 32 bytes for the pooled asset (native XNA here).
- **commitment**, the MAST root of the contract leaves (one leaf per form).
- **reserve commitment**, the hash of the guard script that locks the reserve.

The **manifest** pins all of this together with the genesis hash, the birth
transaction and height, the leaf scripts, the control blocks and the
verification keys. The wallet validates the manifest before it reads the
chain:

- every leaf with its control block must hash to the pinned commitment;
- every verification key must hash to its `vkHash`, and the leaf script must
  contain that hash;
- the guard script must hash to the reserve commitment;
- for C4, the domain is recomputed from the genesis and the issuance
  outpoint, the context is recomputed, and the commitment must equal a value
  the application pinned independently (`expectedCommitment`).

These checks prove that the manifest is internally consistent. They do not
prove that the scripts implement safe custody. Trusting a manifest is a
deliberate decision of the application. See the
[security model](security-model.md).

## The two pool outputs

Every pool transaction spends the current pool outputs and creates new ones.

**State output (output 0).** Value 0. Its script is an AuthScript output
(`OP_1 <commitment>`) that also carries the pool's UNIQUE asset `NAME#POOL`
with the 32-byte state digest attached. Whoever spends it must use one of the
contract leaves, so every change to the pool state needs a valid proof.

**Reserve output (output 1).** Holds all the XNA in the pool. It is locked
by a separate guard script (`OP_1 <reserve commitment>`). The guard only
lets the reserve move in a transaction that also spends the pool state
output as input 0, so the reserve follows the contract's rules. The reserve
value is public.

When the pool becomes empty (`W_full`), no reserve output is created. The
next deposit (`D0`) creates it again.

## Pool state

The state digest commits to three Merkle trees, each 32 levels deep and
hashed with Poseidon over the BN254 scalar field:

| Tree | Content | Purpose |
| --- | --- | --- |
| Note tree | Commitments of all notes ever created, in order. | Proves a spent note exists. |
| Nullifier tree | Indexed (sorted, linked) tree of all published nullifiers. | Proves a nullifier is new, which prevents double spends. |
| Seen tree | Indexed tree of all commitments. | Proves a new commitment is unique. |

The **state opening** is 109 bytes: the three roots, the three counters and
a mode byte. Mode 0 means the pool holds nothing; mode 1 means it holds
notes. The digest is `PoseidonBytes(opening)`. Each proof takes the old and
new digests (`S_old`, `S_new`) as public inputs, so the chain moves from one
state to the next only through proven transitions. Byte layouts are in
[data formats](data-formats.md#pool-trees-and-state-opening).

## Notes, commitments and nullifiers

A note records a domain, an asset ID, an owner, the recipient's viewing
public key, an amount in satoshis and a random `rho`. Two secrets of the
owner matter:

- the **spend secret**, from which the public `owner` value and the private
  nullifier key `nk` are derived with Poseidon;
- the **view seed**, from which an X25519 viewing key pair is derived.

```text
owner = PoseidonBytes("NIP043/owner/CP1" || domain || spendSecret)
nk    = PoseidonBytes("NIP043/nk/CP1"    || domain || spendSecret)
cm    = PoseidonBytes("NIP043/cm/CP1"    || note)
nf    = PoseidonBytes("NIP043/nf/CP1"    || domain || nk || rho || cm)
```

Creating a note appends `cm` to the note and seen trees. Spending it
publishes `nf`. Only the owner knows `nk`, so nobody else can compute the
nullifier or tell which commitment it belongs to. The proof shows that the
spent note is in the note tree, that the spender knows its spend secret and
that `nf` is new.

## Encrypted note records

The sender encrypts each new note to the recipient's viewing key with HPKE
(RFC 9180: X25519, HKDF-SHA256, ChaCha20-Poly1305) and publishes the
1024-byte record together with its commitment. The associated data binds
the record to the domain and to `cm`.

The recipient finds its notes by trial decryption. It tries every published
record with its viewing keys and keeps the ones that decrypt to a note whose
commitment matches and whose owner matches its spend secret. No separate
message has to reach the recipient: the chain carries everything needed to
recover the note. See [chain scanning](chain-scanning.md).

## Operations and forms

Each pool transaction uses exactly one form. Every form has its own circuit,
verification key and contract leaf.

| Form | Operation | Notes consumed | Notes created | Reserve |
| --- | --- | --- | --- | --- |
| `D0` | First deposit into an empty pool | 0 | 1 | 0 → amount |
| `D1` | Deposit into a pool that holds notes | 0 | 1 | grows by the amount |
| `T1` | Assign a whole note to one recipient | 1 | 1 | unchanged |
| `T2` | Assign a note to two notes (recipient and change, or two recipients) | 1 | 2 | unchanged |
| `T3`, `T4` | C4 only: assign a note to three or four notes | 1 | 3 or 4 | unchanged |
| `W_partial` | Withdraw one whole note while other notes remain | 1 | 0 | shrinks by the note amount |
| `W_full` | Withdraw the last note, emptying the pool | 1 | 0 | → 0, no reserve output |

Rules that follow from the forms:

- **One note in per transaction.** A transaction spends at most one note, so
  a payment cannot be larger than the largest single note.
- **Assignments conserve value.** The created notes must add up exactly to
  the consumed note. The fee never comes out of a note.
- **Withdrawals take a whole note.** To withdraw part of a note, first assign
  it to two notes (`T2`, one to yourself) and then withdraw one of them.
- **Deposits need an exact coin.** The deposited amount comes from one
  transparent coin of exactly that value.

## Transaction layout

Inputs, in this order:

| # | Input | Present in |
| --- | --- | --- |
| 0 | Current state output | every form |
| 1 | Current reserve output | every form except `D0` |
| next | Funding coin (exact deposit amount) | `D0`, `D1` |
| last | Sponsor coin (pays the fee) | every form |

Outputs, in this order:

| # | Output | Present in |
| --- | --- | --- |
| 0 | New state output with `S_new` | every form |
| 1 | New reserve output | every form except `W_full` |
| next | Withdrawal payment to a transparent script | `W_partial`, `W_full` |
| last | Sponsor change (sponsor value minus fee, back to the sponsor's script) | every form |

The witness of input 0 holds the compressed proof, the verification key,
either the 4096-byte publication (deposits and assignments) or the nullifier
(withdrawals), the serialized prevouts, the leaf script and its control
block. The reserve input reveals the guard script. Funding and sponsor
inputs are signed by the user's transparent wallet after the proof is built.

The **publication** carries the new commitments, their encrypted records and,
for assignments, the nullifier. The proof takes its hash (`data_hash`) as a
public input, so nobody can swap the records after proving.

## Binding the proof to the transaction

A proof must not be reusable in another transaction. The library computes the
NIP-042 TXHASH of the transaction with mask `0x011f`, which covers version,
locktime, prevouts, sequences and outputs. Its Poseidon hash is the
**anchor**, a public input of every proof. The leaf script recomputes the
same value through transaction introspection.

TXHASH does not cover signatures. The user's wallet can therefore sign the
funding and sponsor inputs after proving without invalidating the proof.
Changing any input or output, including the fee, requires a new proof.

## Contention and finality

There is one state output, and each pool transaction spends it. Only one pool
transaction can confirm on a given state:

- Two users who prepare against the same state race each other. The loser's
  transaction becomes invalid. Its owner must rescan and prove again against
  the new state; a `D0` may then have to become a `D1`.
- Pool transactions cannot be chained in the mempool. The scanner follows
  confirmed state only, so wait for confirmation before preparing the next
  operation.
- A reorganization can undo confirmed pool transactions. The scanner detects
  it and rebuilds; see [chain scanning](chain-scanning.md#reorganizations).

## Profiles: C3 and C4

The library supports two XNA TEST contract profiles. The worker selects one
from the manifest's `schema`.

| | C3 | C4 |
| --- | --- | --- |
| Manifest schema | `neurai-c3-xna-test-v1` | `neurai-c4-xna-test-v1` |
| Forms | `D0 D1 T1 T2 W_partial W_full` | adds `T3 T4` |
| Notes per assignment | up to 2 | up to 4, change included |
| Domain | Fixed synthetic bytes | SHA-256 of genesis, issuance outpoint and pool identity |
| Context public input | none | `ctx`, a Poseidon hash of domain, asset ID, unit and registry root |
| Publication | version 1, full 1024-byte records | version 2, compact 220-byte records |
| Funding, fee and withdrawal scripts | Legacy P2PKH | Legacy P2PKH, strict PQ (`OP_2`) and strict ECDSA (`OP_3`) |
| Dust rule | sponsor change of at least 546 satoshis | per script type, from the dust relay fee |
| Pinning | bundled manifest, structural checks | application must pass `expectedCommitment` |
| In the package | `C3_TESTNET_MANIFEST`, `C3_TESTNET_ARTIFACTS` | supplied by the application |

C4 is single-asset: unit 1 and an all-zero registry root. Shared
multi-asset reserves and per-asset permissions are not part of these
profiles.

## Related reading

- [Transaction lifecycle](transaction-lifecycle.md): how the library builds these transactions.
- [Security and privacy model](security-model.md): what the pool hides and what it does not.
- [Data formats](data-formats.md): exact bytes of everything described here.
