# C6 ordinary-asset TEST wallets

The browser worker supports `C6-ORDINARY-ASSET-TEST-J2-v1`, separately from
`C6-XNA-TEST-J2-v2`. Each asset needs its own independently reviewed deployment,
UNIQUE birth outpoint, domain, asset ID, denomination and pinned six verification keys.
Fetching a manifest from an RPC server does not establish these pins.

Supported operations are D0/D1, T1/T2/T3, J2, partial withdrawal with or without
private change, and full pool withdrawal. Three transfer outputs include change.
Notes stay encrypted, owned and recovered using the existing family-separated
NZK derivation. Wallets of different transparent families may communicate using
an nzk address for the same pool. Balances are separate per pool and per family.

## Amounts and funding

API amounts are exact decimal strings in atomic units (10^8 atoms per asset
unit). The denomination is `10^(8 - asset.units)`. `parseAssetAmount()` converts
human amounts without floating point. Precision 0 through 8 is authenticated in
the circuit context. Every real input and output note must respect it.

Asset/state/funding/payout outputs carry zero XNA. Private fee is always zero.
An ordinary, confirmed Legacy/PQ/ECDSA XNA coin pays the external miner fee.
Sponsor input and sponsor change are always at index 2. Funding is input 1 for
D0 and input 3 for D1. Partial withdrawal pays at output 3; full withdrawal at
output 1. Do not apply the XNA private-fee or 100-XNA quantum rules to assets.

`c6AssetTransferScript()` emits the exact canonical `xnat` transfer suffix;
`c6ReadAssetTransfer()` rejects wrong assets, precision, malformed/trailing data
and unsupported destinations. No asset message is silently discarded. A deposit
requires an exact, confirmed transfer output; split it transparently first.

## Proving and authorizing

Pass `kind: 'asset'` to `createC6OperationWallet()` / `createC6JoinWallet()`.
The worker derives the kind only from its application-pinned deployment and
requires durable journals and transaction construction. Pass `sponsorPoint` and
`sponsorFee` to `prepare()` or `rebuild()`; it rechecks the confirmed coin with
RPC. Parameters are downloaded only for the selected operation and are verified
by byte length and SHA256 before proving.

1. Open/restore the encrypted private journal and save its backup.
2. Prepare the proof inside the worker; it reserves notes before any exposure.
3. Sign an asset deposit's financing input locally with `SIGHASH_ALL`.
4. Call `recordSigned()` to persist that funding signature without changing the
   proof, payouts or unsigned sponsor slot.
5. Pass the result to `C6SponsorFlow.authorize()` with `transaction.sponsor` and
   `sponsorNotes`, then publish the persisted bytes using that same flow.
6. Rescan both journals; keep reservations until confirmation or a confirmed
   conflict. An RPC error or a service timeout is not cancellation.

`sponsorNotes` uses the public nullifier and an opaque domain-separated resource
identifier. It does not expose the spent note's actual commitment/nullifier
pair. Plaintext notes, spending secrets and membership paths remain in the
worker. The independently encrypted private backup and complete encrypted
sponsor backup must both be restored when moving a pending wallet.

A detached `0x83` authorization may pay its bounded loss without executing the
private operation. It remains exposed until its input is confirmed spent,
including after another sponsor completes the operation. Reuse the same proof,
keep the notes reserved, enforce cumulative budgets and sweep unused
sponsors with ALL. Never automatically create another exposed authorization.

## Supported assets and scope

This profile supports ordinary fungible/unique transfer assets, not ownership
`!`, restricted `$`, or DePIN `~` tokens. Those require their separate consensus
authorization and transfer rules; this API rejects them. Registering an existing
asset requires a reviewed pool instance and parameters, not merely selecting an
asset name. The bundled webwallet deployment is one fresh ordinary TEST asset.

The RPC scanner trusts a fully validating archival node. It validates the
pinned birth, exact state chain, MAST path, fixed fields, publications, counters,
reserve quantity and historical note roots. It is not SPV. The default scan
follows confirmed state spends using `getspentinfo`, with checked block replay
when the index is unavailable. It returns a snapshot at `tip.height`; a new
descendant block does not invalidate it, but a reorganized prefix does. See
[C6 scanning](C6-OPERATIONS.md) for index requirements and explicit strategies. Reorganizations
reopen reservations as required. All keys here are TEST keys, not an audited
production ceremony.
