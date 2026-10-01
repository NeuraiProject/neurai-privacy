# Chain scanning and checkpoints

The wallet keeps no balance of its own. Every scan rebuilds the public pool
state from the chain, checks each step against the manifest, and then finds
the notes that belong to the wallet. `scanBrowserPool` does this. The worker
calls it on every `scan` and before every `prepare`.

## Node requirements

The scanner talks to one fully validating Neurai node through `rpc(method,
params)`. It relies on the node to enforce consensus. It does not verify
the Groth16 proofs of past transactions itself; it checks that each
confirmed transition is consistent with the pinned contract.

| Strategy | Node flags | Cost |
| --- | --- | --- |
| `spent-index` (default) | `-spentindex -txindex` | A few RPC calls per pool operation, independent of chain length. |
| `blocks` | `-txindex` | One `getblock` per block since the pool birth. For nodes without a spent index. |

Methods used: `getblockhash`, `getbestblockhash`, `getblockcount`, `getblock`
(blocks strategy only), `getrawtransaction`, `gettxout` and `getspentinfo`.

## Before reading the pool

1. Validate the manifest against `expectedCommitment` and `expectedGenesis`
   and check that it lists one distinct verification key per form.
2. Check that the node's block 0 is the manifest's genesis.
3. If an identity is given, check that its descriptor belongs to the
   manifest's domain and asset ID.
4. If a checkpoint is given, restore it (see [checkpoints](#checkpoints)).

## Following the state with the spent index

Without a checkpoint, the scan starts at the pool birth:

- the birth transaction must be confirmed at `birthHeight` in the active
  chain;
- its output 0 must be the state script of an empty pool;
- one of its inputs must spend an output that carries the pool's UNIQUE asset.

Then it follows the state output step by step:

1. Ask `getspentinfo` which transaction spent the current state output.
2. If a confirmed spender exists, it must spend the state as input 0, at a
   height not lower than the previous step. The scanner fetches it, checks
   that it is in the active chain at that height, applies the transition and
   repeats with the new state output.
3. If there is no confirmed spender, the scanner checks with `gettxout` that
   the state output and the reserve output are unspent. The scan then ends at
   the current height. A spender that is only in the mempool is ignored.
4. If the state is spent but the index does not report the spender, it asks
   once more, then fails with a message that the node needs `-spentindex`.

Without `stopHeight`, the scan follows the state to its current unspent
output, even past the height read at the start. With `stopHeight` it stops
there.

At the end, the scanner reads again the hash of every block it used. If any
changed, it fails with `chain reorganized during scan; retry`.

The `blocks` strategy replays every block from the birth height instead,
looks for the transaction that spends the current state as input 0, applies
the same checks, and requires the chain tip to be unchanged at the end.

## Checks on every transition

For each pool transaction, the scanner:

- requires a MAST spend of the state (witness item 0 is `0x10`);
- identifies the form from the SHA-256 of the verification key in the
  witness, and requires the exact leaf script, control block and key of
  that form;
- checks that the form fits the reserve (`D0` only on an empty pool) and that
  input 1 is the current reserve output;
- decodes the publication (deposits and assignments) or the nullifier
  (withdrawals), inserts the nullifier and the new commitments into the trees
  and fails on a duplicate;
- recomputes the state digest and requires output 0 to carry exactly that
  digest;
- checks the reserve output script and its value change: unchanged for
  assignments, increased by the funding coin's value for deposits, decreased
  by the payment's value for withdrawals, and no reserve after `W_full`.

Each transition is recorded as `{txid, height, form, digest, reserveAtomic}`.
All published commitments and records are kept with their tree slot,
transaction and height.

## Finding the wallet's notes

After the walk, the scanner tries to decrypt every published record that the
checkpoint has not already covered.

A wallet opened from its words (`ZkWalletIdentity`) has many addresses, so it
searches a window:

1. It tries the internal address (chain 1, index 0), where deposits and
   change go.
2. It tries receiving addresses 0, 1, 2, … up to at least `gap − 1` and at
   least the last issued index.
3. Every time a receiving address turns out to be used, the window extends to
   that index plus `gap`.

The order of the records does not matter. A record counts as owned when it
decrypts with the address's viewing key, the note matches the pool and the
commitment, and its owner matches the address's spend secret. The scanner
then computes the note's nullifier.

A note is **spent** when its nullifier appears in a later transition. The
balance is the sum of the unspent owned notes. Each note keeps the address
that received it, which selects the key used to spend it.

The cost of this step grows with the number of records times the number of
addresses tried. A checkpoint avoids decrypting old records again.

## Address rotation

`issueNext()` hands out the next receiving address. It refuses to go more
than `gap` addresses past the highest used one unless `force` is set, because
a later recovery with the same gap would not find payments sent there. The
default gap is 20 and the maximum 1000.

The scanner learns which addresses are used, but it cannot know which
addresses were handed out and never paid. The application can store that
non-secret state with `rotationStorageKey`, `loadRotation` and
`saveRotation`, and pass `gap` and `issued` to `derive` or `scan`. If this
state is lost, a scan restores everything up to the last used address, and
the wallet may hand out an already shown address again.

## Reorganizations

The scanner only follows confirmed transactions and checks every block it
used, so a reorganization is handled by scanning again:

- a note created in a disconnected block disappears from the next scan;
- a note whose spend was disconnected becomes unspent again;
- a checkpoint whose block is no longer in the active chain is discarded and
  the scan starts from the pool birth.

One confirmation is enough for the scanner. An application that wants more
certainty before showing a received payment as final can compare the note's
`height` with the chain height.

## Checkpoints

A scan returns a plaintext `checkpoint` with everything needed to continue
later:

- the manifest ID (SHA-256 of the manifest JSON), the height and block hash;
- the pool state trees, the state and reserve outpoints and the reserve;
- all transitions, all published commitments and records, and the
  transaction that published each nullifier;
- the wallet tag and its address window (`gap`, `issued`);
- the owned notes, **including their plaintext**.

Because it contains note plaintexts, the checkpoint must be encrypted and
authenticated before it is stored. The worker does this: it seals the
checkpoint with ChaCha20-Poly1305 under a key derived from the wallet
(see [data formats](data-formats.md#scan-checkpoint-envelope)) and gives the
page only the encrypted string. Direct callers of `scanBrowserPool` must do
the same.

On the next scan the checkpoint is used only if:

- it decrypts with the wallet's key, so it belongs to the same wallet;
- its manifest ID matches the current manifest;
- its fields are well formed and its height is not above the scan height;
- the node still has the same block at its height.

Otherwise the scan starts from the pool birth. The pool part of a valid
checkpoint is always reused. Its owned notes are reused only when the wallet
tag and the address window are unchanged; after changing `gap` or `issued`,
the scanner searches all records again.

Storage advice:

- Keep checkpoints on the device, for example in IndexedDB, under a key that
  includes the network and the wallet (`rotationStorageKey(...) + ':scan'`).
- Do not upload them to a server.
- A storage failure must not block scanning; the scan simply starts from the
  pool birth.
- The checkpoint grows with the pool history. Above 32 MiB of plaintext the
  worker cannot seal it and returns `null`. The open worker still continues
  from its last scan in memory, but after a restart scans start from the
  pool birth.
