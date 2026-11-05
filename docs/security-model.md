# Security and privacy model

## Status

The C7 deployments this library supports are **TEST instances**. Their
proving keys were generated with public TEST entropy, so anyone could in
principle reconstruct the setup secrets and forge proofs. Neither the
contract, the circuits, the C7 note scheme nor this library have been
independently audited. Do not use them for funds of value.

## Trust assumptions

| Component | What the library checks | What it trusts |
| --- | --- | --- |
| Neurai node (RPC) | Genesis; that the portable public-tree rules are active; that each pool transition is consistent with the pinned contract; that every block used is still in the active chain. | That the node validates consensus, including the proofs and the tree transitions of past transactions, and does not hide confirmed transactions. A lying node can show a stale or incomplete view; transactions built on it then fail at admission. Run your own node or use one you trust. |
| Manifest and deployment | Consistency between them and with the pinned genesis and commitment, the birth (emission spent, owner token burned), the domain derivation, every leaf against the commitment and every verification key against its hash. | That the pinned contract implements safe custody. Pinning a deployment is the application's decision. |
| Proving files | Size and SHA-256 of every file before use. | Nothing else: a wrong file is rejected. The server can still refuse to serve them. |
| snarkjs | Every proof is verified locally against the pinned key, and its public signals are compared with the wallet's intent. | The injected module (0.7.6) runs inside the worker and sees the private witness. |
| Journal store | Ciphertexts are authenticated with a key derived from the wallet; writes are compare-and-swap. | That the store's compare-and-swap is atomic across tabs and durable when it resolves. `localStorage` is not; use `IndexedDbJournalStore` or an equivalent. |
| Application code | Nothing. | The worker separates secrets from page code to avoid accidental leaks. It cannot protect against malicious code in the same application, such as a compromised dependency or a script injection. |
| Randomness | Fails if `crypto.getRandomValues` is missing. | The platform's secure random generator, used for `rho`, nonces and journal identifiers. |

## Secret handling

| Data | Where it lives | Leaves the worker |
| --- | --- | --- |
| Wallet words and passphrases | Page (transparent wallet) and worker | Sent to the worker by `derive`; not kept after derivation |
| Root, viewing key, diversifier key, spend secrets, nullifier keys | Worker | Never |
| Note plaintexts, Merkle paths, nullifiers, witnesses | Worker | Only inside the encrypted journal and caches |
| Journal and scan caches | Worker and store | Yes, encrypted and authenticated |
| Balance, own commitments and amounts, receiving addresses | Worker and page | Yes |
| Packets, proofs and transactions | Worker and page | Yes; they become public anyway |
| Fingerprint, `storageId` | Worker and page | Yes; local only, never publish or send to the RPC node |

Notes for integrators:

- The page learns the balance and which commitments belong to the wallet.
  That link is private information: do not send it to analytics or servers.
- `lock()` and `stop()` overwrite key buffers. JavaScript cannot erase
  strings such as the mnemonic, nor copies made by the engine, so wiping is
  best effort. Terminate the worker to discard its memory.
- If the worker crashes, its keys are lost. `C7WorkerClient` reports it
  through `onCrash`; open the wallet again in a new worker.
- `C7WorkerClient` forwards only read-only RPC methods. Keep that filter if
  you replace it.

## Exposure

A packet is a valid portable proof as soon as it exists. If it reaches a
relocator, a log or a node and is later dropped, someone can still relocate
and publish it. That is why the worker reserves notes before proving, saves
every packet before returning it and never releases a prepared operation
locally. Only a confirmed spend of its intent or a confirmed conflicting
nullifier closes a reservation, and a reorganization reopens it. Restore the
latest journal backup before operating on another device, and avoid using
two independent devices at the same time: a local store is not a global
reservation service.

## What the pool hides

- The owner of every note.
- Amounts of transfers and joins.
- Which note a transaction spends: the nullifier cannot be linked to its
  commitment without the owner's key.
- The recipients of a transfer.
- The link between a wallet's receiving addresses: each one has its own
  diversifier, transmission key and owner.

## What stays public

- **Deposits:** the amount and the funding coin, with its address and
  history.
- **Withdrawals:** the amount and the destination address.
- **Fees:** the fee level of every operation. Only deposits involve a
  transparent coin; the other operations pay from the reserve.
- **Form:** the leaf reveals the operation and, for transfers, the number of
  notes created; `W_partial_change`, `W_partial_no_change` and
  `W_full_no_change` show whether a withdrawal left change.
- **Reserve:** the total XNA in the pool after every transaction.
- **Timing:** the block and order of every operation.
- **Network metadata:** the RPC node sees the client's IP address, the
  outpoints it checks and the transactions it publishes. The file server
  sees which form's files are downloaded, and when.

## Linking risks

Zero-knowledge proofs hide the private ledger, not the public facts around
it. With few users, amounts and timing alone can link operations. For
example, after `deposit 1,000 → transfer 400 to Bob → Bob withdraws 400` as
the only activity, an observer sees 1,000 enter, a transfer, and 400 leave to
Bob's address, and can guess the relationship.

Ways to reduce linking, none of which guarantees anonymity:

- Fund deposits from coins that are not linked to the withdrawal addresses.
- Avoid withdrawing exactly the amount that was deposited, and avoid unique
  amounts.
- Leave time between a deposit and later operations.
- Use your own node so a third-party RPC operator does not see your queries.

Measure linkability against the real pool history. One unlinked note is not
"anonymous" if few other people use the pool. A small testnet pool has a
small anonymity set even when the cryptography is correct.

## Recovery

- A wallet is recovered from the words, the BIP-39 passphrase, the ZK
  passphrase, the family and the account, plus the chain and the pool's
  deployment. The note records are on chain, so no backup is needed for
  confirmed notes, and there is no address gap to configure.
- A forgotten ZK passphrase cannot be recovered. A wrong one opens a
  different, usually empty wallet without any error.
- Pending operations live in the encrypted journal. Without it, the words
  recover confirmed notes but not unpublished packets.
- Notes of the C4, C5 and C6 pools need those releases; 0.4.0 cannot read
  them.

See [NeuraiZK/v2 §6](nzk-v2-derivation.md#6-recovery-on-another-device).

## Before funds of value

At least these parts need independent review:

- note ownership, nullifier and membership constraints in the circuits;
- bounded amounts, fees and conservation of the reserve;
- the portable tree transcript rules and the contract leaves that check it;
- the C7 key, address and record construction and data availability;
- the commitments from verification keys to contract leaves;
- wallet secret storage, the journal, exact amount parsing and
  reorganization recovery;
- a real trusted setup ceremony to replace the TEST proving keys.
