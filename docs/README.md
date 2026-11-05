# neurai-privacy documentation

These documents explain how the Neurai C7 privacy pool works and how this
library implements a private wallet for it. The [package README](../README.md)
covers installation, a first integration and the 0.4.0 migration from C6;
start there if you only want to use the library.

> **TEST only.** The C7 deployments supported here are experimental TEST
> instances. Their verification keys come from a public setup and nothing has
> been independently audited. Do not use them for funds of value.

## Reading order

| Document | Read it to learn |
| --- | --- |
| [How the privacy pool works](privacy-pool.md) | Notes, records, the state and reserve outputs, portable proofs, the forms and the layout of a pool transaction. |
| [Library architecture](architecture.md) | Entry points, the page/worker split, the worker message protocol, the worker options and the module map. |
| [Transaction lifecycle](transaction-lifecycle.md) | How a deposit, transfer, join or withdrawal is prepared, proven, relocated, signed, published and reconciled, and how to handle failures. |
| [Chain scanning](chain-scanning.md) | How the wallet rebuilds the pool state from a node, finds its notes, survives reorganizations and resumes from encrypted caches. |
| [C7 operations reference](C7-OPERATIONS.md) | Instance pins and byte order, the operation wallet, packets, public relocation, the dedicated worker and the durable journal. |
| [C7 J2 (join) reference](C7-JOIN.md) | Joining two notes into one. |
| [NeuraiZK/v2 wallet root](nzk-v2-derivation.md) | The byte-exact derivation of the wallet seed and root that C7 builds on. Needed by other wallet implementations. |
| [Data formats](data-formats.md) | Byte layouts and hash labels: notes, keys, addresses, records, publications, state openings, transcripts, scripts, packets, intents, caches and vaults. |
| [Security and privacy model](security-model.md) | What stays secret, what an observer can still learn, trust assumptions and recovery limits. |

## Glossary

| Term | Meaning |
| --- | --- |
| Pool instance | One deployment of the pool contract, identified by a UNIQUE asset `NAME#POOL`, a domain and an asset ID. |
| Manifest | Public JSON that pins an instance's profile, network, identity, context, commitment, verification keys and fee levels. |
| Deployment | Public JSON that pins the birth: genesis, commitment, emission, anchor (state outpoint, script and empty opening) and contract leaves. |
| Proving files | Public circuit files (`.wasm`, `.zkey`, `vk.json`) needed to build proofs, pinned by size and SHA-256. |
| Note | A private amount owned by one address, encoded in 169 bytes (CP1 format). Only its commitment goes on chain. |
| Commitment (`cm`) | Poseidon hash of a note. Appended to the pool's note tree when the note is created. |
| Nullifier (`nf`) | Value published when a note is spent. Only the owner can compute it, and the pool rejects a repeated one. |
| Record | 230-byte encryption of a note to its address, published with the commitment so the recipient can find it. |
| View tag | First byte after the version of a record; lets a wallet skip almost all foreign records cheaply. |
| State output | Output 0 of every pool transaction. Carries the pool's UNIQUE asset and the digest of the current pool state. |
| Reserve output | Output 1 of every pool transaction except `W_full_no_change`. Holds all XNA inside the pool. |
| Historical root | A past root of the note tree, kept in the history tree; proofs spend notes against one of them. |
| Transcript | The public tree transition of one operation, carried in the witness and checked by the node. |
| Packet | The public result of one proof: public inputs, proof, publication, payout and funding. It can be relocated to a newer state. |
| Relocation | Building the transaction of a packet against the current state (`buildC7Transaction`), without proving again. |
| Intent | `c7Intent` of a transaction: an identifier that does not change when the packet is relocated. |
| Form | The contract leaf used by a pool transaction: `D0`, `D1`, `T1`–`T3`, `J2`, `W_partial_no_change`, `W_partial_change`, `W_full_no_change`. |
| Funding coin | Transparent coin worth exactly a deposit plus its fee. |
| Descriptor | Public receiving data `{domain, asset_id, owner, view_pub, d}`. An nzk v3 address encodes it. |
| Family | `legacy`, `ecdsa` or `pq`. Selects an independent private wallet for the same wallet words. |
| Journal | Encrypted, compare-and-swap record of the wallet's reservations and pending operations. |
