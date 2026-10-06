# C6 TEST sponsor lifecycle

`C6SponsorFlow` connects the persistent `SponsorJournal` to local signing,
confirmed-chain scanning, reviewed publication and ALL sponsor recovery. It is
opt-in. It does not replace the C4/C5 builder, prove a circuit, activate C6,
install parameters or deploy a public pool.

## Deployment and RPC trust

Supply application-pinned `C6SponsorDeployment` entries for **every pool already
present in this wallet-wide journal**. Each specifies genesis, commitment,
XNA/asset kind, a confirmed baseline state UTXO, its exact script and 145-byte
opening, and the byte-exact leaves with their witness argument names.

The RPC must be a trusted **fully validating, archival node**, with transaction
lookup and block/header/UTXO/mempool reads enabled. Enable its spent index
(`-spentindex`, `getspentinfo`): without it the scanner falls back to reading
every block since the pool baseline, which is slow on long-lived pools. This is not SPV or proof of
consensus against a malicious RPC. The scanner authenticates observations against
that node's active chain; it does not independently mine/validate block headers.

The node must report `zk_portable_tree.active_for_next_block === true`; the
flow checks this even when it can reuse an unchanged-tip observation. It refuses
sponsorship/publication when C6 consensus verification is inactive.

The scan pins the tip, checks the baseline in its actual block, checks every
historical sponsor's funding transaction, follows actual state-input spends,
checks leaf/argument layouts and public state digest continuity, and resolves
sponsor spends against `gettxout(..., false)`. It parses the native C6 format 2
and J2 format 3 explicitly. A missing parent, moved baseline, wrong genesis,
incomplete block or changed tip fails closed. Full state/nullifier history must
be available from the pinned baseline for the intents being tracked. Never
anchor after an operation whose spend you need to recover.

Private confirmation requires the **same intent**, not merely consumption of a
sponsor or nullifier. The intent fingerprints pool, immutable proof/VK arguments,
publications, withdrawal amount/destination and deposit funding. Mutable tree
paths, prevouts and sponsor data are excluded to permit relocation. Another
proof consuming a reserved nullifier marks a conflict and does not release the
note. The local proving worker must bind the selected note commitments and
nullifiers correctly; the flow never receives private proving witnesses.

## API sequence

1. Use `IndexedDbSponsorStore` and Web Locks in a secure browser context. There
   is no localStorage fallback. Keep a common lock and journal scope across tabs.
2. Derive `c6SponsorWalletId(words, bip39Passphrase)` from the root seed, not from
   an address, pool, account or transparent family. This uses BIP39 seed
   derivation followed by HMAC-SHA256 with `NeuraiC6SponsorWallet/v1`; the seed is
   wiped. A single lifetime budget applies across Legacy/PQ/ECDSA and pools.
3. Call `initialize()` to open existing history. Only a genuinely new wallet
   uses `initialize({create:true})`. A recovered wallet restores the **complete**
   backup first. A missing journal cannot prove absence of old exposures.
4. A local C6 worker returns `C6PreparedAuthorization`: public transaction with any non-sponsor transparent inputs already locally
   signed (ALL), configured pool, selected `{cm,nf}` reservations, budget and
   index-2 sponsor offer. Deposits use an empty private reservation array.
5. `authorize(prepared)` records the public intent, reserves resources, scans the
   chain, persists exposure **before** calling the local `0x83` signer, checks
   the returned private intent and asks the node to admit the transaction. It
   saves the reviewed bytes but does not publish.
6. `publish(operationId)` rescans and sends those bytes after explicit approval.
   `pending()` restores reviewable preparations after a reload. A sponsor
   scheduled for recovery cannot publish the private payment again.
7. Call `tick({autoSweep:false})` for observation. An unchanged tip/journal
   revision skips the scan. Another tab's revision or any tip change forces a
   new observation, which may resume from the disposable scan checkpoint
   described below; nothing trusted is cached.
8. Opt in to `tick({autoSweep:true})` for recovery of residual sponsors after a
   private confirmation/conflict. This also retries a previously requested ALL
   sweep. It does **not** sweep a legitimate pending sponsor by elapsed time.
9. `sweep(outpoint)` explicitly recovers a pending sponsor. This is not
   cancellation of the portable proof and does not free private notes.

All signing is injected as `sign({raw, offer, hashType, index})`, returning locally
signed bytes without sending. C4/C5 callers retain their SIGHASH_ALL defaults.
For sponsorship only input 2 gets `0x83`; for an ALL sweep input 0 gets `1`.

## Scan cost and checkpoint

`scanC6SponsorChain` (and every flow method that scans) keeps the cost of an
observation proportional to what the journal tracks:

- **Empty journal.** With no operations there is no sponsor exposure and no
  private intent to resolve. The scan checks activation, genesis, the pinned
  baselines and the tip, and reads no other blocks. A new wallet opens at once.
- **Spent index (`strategy: 'auto'`, the default, or `'spent-index'`).** Each
  pool's state outpoint is followed with `getspentinfo`, one lookup per state
  transition, and each tracked sponsor outpoint is looked up once. Every
  spender is confirmed with `getrawtransaction` and `getblockhash` at the
  indexed height, every transition passes the same leaf, digest and
  continuity checks as block replay, and the walk ends at a confirmed live
  state UTXO whose script commits to the reached opening. A spend that is only
  in the mempool is not a confirmed spend.
- **Block replay (`strategy: 'blocks'`).** The original walk over every block
  from the earliest baseline or sponsor funding to the tip. `'auto'` falls back
  to it when the index cannot answer (error code `C6_INDEX_UNAVAILABLE`);
  `'spent-index'` fails closed instead.

`C6SponsorFlow` also keeps a **scan checkpoint** in its own store, under
`neurai:c6:sponsor-scan:v1:<genesis>:<walletId>`, so wallets need no extra
integration. After an indexed scan it saves, per pool, the confirmed prefix of
the state walk that ends at least six blocks below the scanned tip: the block
height and hash of its last transition, the state outpoint and opening reached,
and the intent and nullifier events seen. It contains public chain data only.

The checkpoint is never trusted as an observation. A prefix is resumed only if
it matches a pinned deployment, is well formed and its block is still on the
active chain; the walk must continue from its opening and end at the live state
UTXO. Any mismatch, a damaged value or a reorganization below its height
discards it and the pool is walked again from its baseline. Deleting the key
only makes the next scan slower; it never changes the journal, budgets or
reservations.

## Recovery and errors

Signed ALL bytes are persisted before the first broadcast and validated again
before retrying. A retry uses exactly those bytes; it neither signs another
transaction nor raises the lifetime authorization budget. A mempool result is
not confirmation: Neurai's RPC can omit `confirmations` for a mempool tx, so the
flow checks actual membership. Only structured RPC `-5` establishes a missing
transaction; a network/error response does not.

A disconnected confirmation reopens exposure. A disconnected private operation
reopens its reservation. Pending/swept sponsors do not cancel the private proof,
and competing spends of reserved nullifiers do not make other notes available.
A signer/admission/storage/publication failure leaves exposure recorded.

`backup()` includes journal, immutable intent metadata, reviewed operation bytes
and pending ALL bytes. Encrypt the entire object with `sealVault`; restore with
`restore()`, never overwrite newer history. There is deliberately no routine
reset/delete operation. If a crash occurs between saving a journal sweep ID and
saving its signed bytes, the flow refuses to re-sign blindly; recovery needs
operator inspection. Automatic fee bump/replacement is not implemented.

An application must stop polling and signing on wallet lock/change, RPC/storage
errors or an unresolved baseline. A wallet lacking the exposed sponsor's key
must ask the user to switch to its owning family. It must not choose a fresh
sponsor merely because a previous payment appeared to time out.

## Current webwallet integration

The webwallet has a separate lazy-loaded C6 TEST panel. Its runtime is explicitly
supplied as `PrivacyPool({c6})`, with pinned deployments, one wallet lifetime
budget, supported action labels and a **local C6 proving-worker** `prepare`
bridge. The default public deployment remains unavailable: C4/C5 manifests,
parameters and worker protocols cannot be used for C6.

The panel scans while visible, supports reviewed local sponsorship, restores
prepared transactions after reload, shows exposure/reservations, offers explicit
ALL recovery, and opt-in automatic recovery. It encrypts full sponsor backups.
It does not yet provide a default public C6 proving worker, receiving/balance
scanner or parameter/instance registry. Those must be supplied and tested before
claiming a complete public C6 wallet. The current real-browser harness reuses a
real cached TEST J2 proof; it does not generate a new proof in the screen.

Root ID known-answer vector: the standard BIP39 TEST mnemonic `abandon` repeated
11 times followed by `about`, empty BIP39 passphrase, yields
`e1336be03b000670a7d815d74feafb91949c7e7e3a8a1e408dede848f86154c2`. This does not depend on the
transparent family, account, pool or ZK passphrase.

## Additional local recovery regression coverage

The test suite injects storage rejection and exceptions after recording a sweep
ID but before saving its signed bytes. Reopening the flow preserves the loss
budget and private reservations, refuses another signature or broadcast, and
blocks publication using that sponsor. This is a fail-closed state requiring
inspection; it is not automatic recovery of missing transaction bytes.

A second case commits the signed bytes and then throws while acknowledging the
write. Reopening retries the exact saved transaction without signing again.
Other cases cover failed sponsorship signing, over-budget fees, relay rejection,
inactive C6 and ambiguous RPC status. The same fault cases run in isolated
Chromium with real IndexedDB and Web Locks. Their synthetic signature and RPC
fixtures test persistence/control flow, not cryptographic acceptance, physical
power loss, or new ZK proof generation.
