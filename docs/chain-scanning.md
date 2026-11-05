# Chain scanning

The wallet keeps no balance of its own. Every scan rebuilds the public pool
state from the chain, checks each step against the pinned deployment, and
then finds the notes that belong to the wallet. `scanC7Pool` does this. The
worker calls it on every `scan`, before every `prepare` and again just before
it builds a transaction.

```js
const scan = await scanC7Pool({
  rpc, deployment, identity,            // identity: a C7WalletIdentity
  reserved: journalReservations,        // [{cm, nf}] held by pending operations
  strategy: 'auto', historyPageLimit: 20,
  checkpointStore,                      // optional encrypted caches, see below
  signal, onProgress,
});
```

## Node requirements

The scanner talks to one fully validating Neurai node through `rpc(method,
params)`. This is not SPV: it relies on the node to enforce consensus, and it
does not verify the Groth16 proofs of past transactions itself. It checks that
each confirmed transition is consistent with the pinned contract.

| Strategy | Node flags | How it follows the state |
| --- | --- | --- |
| `auto` (default) | `-spentindex -txindex` | `pool-history`, continuing with `spent-index` in the same pass when the node cannot serve pages; `blocks` when the spent index is missing. |
| `pool-history` | `-spentindex -txindex` | Pages of `getprivacypoolupdates`, up to `historyPageLimit` (1 to 1000, default 20) pool transactions per call. |
| `spent-index` | `-spentindex -txindex` | `getspentinfo` and the blocks that contain pool transactions. |
| `blocks` | `-txindex` | One `getblock` per block since the pool birth. |

Methods used: `getblockchaininfo`, `getblockhash`, `getblockcount`,
`getblock`, `getrawtransaction`, `gettxout`, `getspentinfo` and
`getprivacypoolupdates`. A forced `pool-history` scan fails with code
`C7_HISTORY_UNAVAILABLE` when the node cannot serve pages; a spent-index walk
fails with `C7_INDEX_UNAVAILABLE` when the index does not answer, which makes
`auto` switch to block replay. Contradictory index or history data always
fails closed.

## Before reading the pool

1. `validateC7Deployment` checks the pinned deployment, and the identity must
   be a C7 wallet identity.
2. `getblockchaininfo` must report `zk_portable_tree.active_for_next_block:
   true`: the node applies the portable public-tree rules.
3. The node's block 0 must be the deployment's genesis.
4. The tip is captured (`getblockcount`, `getblockhash`). The block at the
   anchor height must be the anchor's block.
5. The birth transaction must create the anchor script as output 0, spend the
   deployment's emission, carry the pool identity `NAME#POOL` in output 0 and
   burn the owner token `NAME!` to the network's burn address. Its opening
   must be the empty pool.

## Following the state

**Pool history.** The scanner builds the cursor itself from the pinned birth:
`pool_id` is the node's transport id of the birth outpoint
(`SHA256d(len || "Neurai/privacy-pool/transport/v1" || genesis || birthTxid
|| u32le(vout))`, in display order), the position is the current state
outpoint and the snapshot is the captured tip. Every page must name that pool,
genesis, commitment and snapshot. Every update must be the next one in
sequence, spend the current state as input 0 and create the next state as
output 0. The last page must report a complete history ending at the current
state with the expected script; the scanner then confirms independently that
the state is unspent (`gettxout`), or that its spender confirmed after the
captured tip (`getspentinfo`). The node only saves round trips: every raw
transaction goes through the checks below.

**Spent index.** The scanner asks `getspentinfo` which transaction spent the
current state output. A confirmed spender must spend it as input 0, at a
height not lower than the previous step, in a block that is still at its
height. When no spender is reported, the state and the reserve must be
unspent and confirmed with the expected scripts, and the walk ends. A
spender above the captured tip is ordinary chain growth: the scan stops
there and returns a snapshot at the captured height.

**Block replay.** The scanner reads every block from the birth to the
captured tip, requires each to link to the previous one and picks the
transaction that spends the current state as input 0.

At the end, the scanner reads again the hash of every block it used and of
the captured tip. If any changed, it fails with
`C7 scan: chain changed during scan; retry`.

## Checks on every transition

For each pool transaction, the scanner:

- requires the raw transaction to have the reported txid, spend the current
  state as input 0, be version 3 with locktime 0, final sequences and no
  reference inputs;
- requires a MAST spend of the state (witness item 0 is `0x10`), finds the
  leaf by its script, checks the witness length and checks the control block
  against the pinned commitment;
- reads the transcript from `tree0`…`tree4` and requires its length and
  header to match the leaf's form;
- requires the transcript's old opening to be the current state and output 0
  to carry the digest of the new opening, with the pinned script template;
- requires distinct, nonzero nullifiers that never appeared before;
- decodes the publication, requires its commitments to be those of the
  transcript and never seen before, and keeps their records;
- requires a spend's historical root to be the root at its index;
- checks the note count, the note-tree root and the other counters of the
  new opening;
- reads the reserve from output 1 while the pool holds notes.

Each transition is recorded as an event `{form, cms, nfs, rootIndex,
transcript, txid, intentId}`. `buildC7Transaction` replays these events to
rebuild the public trees, and the journal matches `intentId` with its
operations.

## Finding the wallet's notes

After the walk, `C7WalletIdentity.scanRecords` tries every published record
that a saved snapshot has not already covered. Per record it computes one
shared secret with the account's viewing key, compares the one-byte view tag,
and decrypts the records that pass. The diversifier in the plaintext names the
address, so the cost does not depend on how many addresses the wallet used,
and the order of the records does not matter. A record counts as owned when
the note matches the pool, the address and the commitment, and its owner
matches the address's spend secret. The scanner then computes the nullifier.

A note is **spent** when its nullifier appears in a later transition. The
balance is the sum of the unspent owned notes. A note is **spendable** when:

- it is under the most recent root whose publication has at least two
  confirmations at the scan tip (the scanner gives it that root and its
  Merkle path), and
- neither its commitment nor its nullifier is in `reserved`.

The result is private: it contains plaintext notes, records and paths. Keep it
inside the worker. Its fields are `profile`, `genesis`, `commitment`, `tip`,
`statePoint`, `opening`, `events`, `reserveAtomic`, `reserveScript`,
`reservePoint`, `notes`, `records`, `nullifiers`, `root`, `balanceAtomic`,
`spendableAtomic` and `ignoredRecords`. The worker sends the page only
balances, commitments and amounts.

## Reorganizations

The scanner only follows confirmed transactions and checks every block it
used, so a reorganization is handled by scanning again:

- a note created in a disconnected block disappears from the next scan;
- a note whose spend was disconnected becomes unspent again;
- a cache whose block is no longer in the active chain is discarded;
- the journal reopens reservations whose confirmation was disconnected.

## Encrypted caches

With `checkpointStore: { read, compareAndSwap }` the scanner keeps two
disposable records, encrypted with the identity (see
[data formats](data-formats.md#encrypted-caches-and-journal)):

- **Scan prefix.** Every validated pool transaction with its height and block
  hash, at most 2048 transactions and 2 MiB. On the next scan every saved
  block is checked against the active chain; a reorganization or a lower tip
  trims the affected suffix, and only the missing part is downloaded.
- **Scan snapshot.** The completed scan: trees, records, roots, nullifiers,
  events, the reserve and the recovered notes, at most 3 MiB. It is saved only
  after the final chain checks. It is reused when its tip block is still in
  the active chain and its contents pass shape checks; the scan then
  continues from the saved state. Note recovery runs only over new records,
  unless the wallet's receiving index changed since the snapshot.

A damaged or foreign cache is ignored and rebuilt. A storage error or a
concurrent write from another tab stops the scan (`C7 scan: progress changed
in another tab; retry`); it never returns an unchecked balance. The caches are
**not** the operation journal: losing them only repeats public scanning.

The worker passes its journal store as `checkpointStore` in durable mode. It
also keeps the last scan in memory and reuses it when nothing can have
changed: the last publication is mature, the portable rules are active, the
captured tip is still in the chain and the state and reserve outputs are
unspent with the expected scripts and value. Issuing an address, a spent
state, a younger publication or a reorganization forces a new scan.

A durable worker can scan before its journal is open. It then reports
`historyReady: false`, the confirmed balance and zero spendable balance;
preparing an operation still needs the journal.
