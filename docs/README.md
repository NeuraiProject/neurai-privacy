# neurai-privacy documentation

These documents explain how the Neurai privacy pool works and how this
library implements a private wallet for it. The [package README](../README.md)
covers installation and a first integration; start there if you only want to
use the library.

> **TEST only.** The pool deployments supported here are experimental TEST
> instances. Their verification keys come from a public setup and nothing has
> been independently audited. Do not use them for funds of value.

## Reading order

| Document | Read it to learn |
| --- | --- |
| [How the privacy pool works](privacy-pool.md) | Notes, commitments, nullifiers, the state and reserve outputs, the circuit forms and the layout of a pool transaction. |
| [Library architecture](architecture.md) | Entry points, the page/worker split, the worker message protocol and the module map. |
| [Transaction lifecycle](transaction-lifecycle.md) | How a deposit, assignment or withdrawal is planned, proven, signed and published, and how to handle failures. |
| [Chain scanning and checkpoints](chain-scanning.md) | How the wallet rebuilds the pool state from a node, finds its notes, survives reorganizations and resumes from an encrypted checkpoint. |
| [NeuraiZK/v2 derivation](nzk-v2-derivation.md) | The byte-exact derivation of private keys and `nzk` addresses from wallet words. Needed by other wallet implementations. |
| [Data formats](data-formats.md) | Byte layouts and hash labels: notes, encrypted records, publications, state openings, scripts, addresses, checkpoints and vaults. |
| [Security and privacy model](security-model.md) | What stays secret, what an observer can still learn, trust assumptions and recovery limits. |

The live integration scripts are described in [integration/README.md](../integration/README.md).

## Glossary

| Term | Meaning |
| --- | --- |
| Pool instance | One deployment of the pool contract, identified by a UNIQUE asset `NAME#POOL`, a domain and an asset ID. |
| Manifest | Public JSON that pins an instance: genesis, domain, asset ID, birth transaction, contract commitments, leaf scripts and verification keys. |
| Proving artifacts | Public circuit files (`.wasm`, `.zkey`, `vk.json`, …) needed to build proofs, pinned by size and SHA-256. |
| Note | A private amount owned by one key, encoded in 169 bytes (CP1 format). Only its commitment goes on chain. |
| Commitment (`cm`) | Poseidon hash of a note. Appended to the pool's note tree when the note is created. |
| Nullifier (`nf`) | Value published when a note is spent. Only the owner can compute it, and the pool rejects a repeated one. |
| Encrypted record | 1024-byte HPKE ciphertext of a note, published with its commitment so the recipient can find it. |
| State output | Output 0 of every pool transaction. Carries the pool's UNIQUE asset and the digest of the current pool state. |
| Reserve output | Output 1 of every pool transaction except `W_full`. Holds all XNA inside the pool. |
| Form | The circuit and contract leaf used by a pool transaction: `D0`, `D1`, `T1`–`T4`, `W_partial`, `W_full`. |
| Funding coin | Transparent coin whose exact value is deposited into the pool. |
| Sponsor coin | Separate transparent coin that pays the miner fee and receives the change. |
| Anchor | Poseidon hash of the transaction's TXHASH. A public proof input that binds the proof to the transaction. |
| Descriptor | Public receiving data `{domain, asset_id, owner, view_pub}`. An `nzk` address encodes it. |
| Family | `legacy`, `ecdsa` or `pq`. Selects an independent private wallet for the same wallet words. |
| Checkpoint | Saved scan result that lets the next scan continue instead of starting from the pool birth. |
