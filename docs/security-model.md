# Security and privacy model

## Status

The pool deployments this library supports are **TEST instances**. Their
proving keys were generated with public TEST entropy, so anyone could in
principle reconstruct the setup secrets and forge proofs. Neither the
contracts, the circuits nor this library have been independently audited.
Do not use them for funds of value.

## Trust assumptions

| Component | What the library checks | What it trusts |
| --- | --- | --- |
| Neurai node (RPC) | Genesis; that each pool transition is consistent with the pinned contract; that every block used is still in the active chain. | That the node validates consensus, including the proofs of past transactions, and does not hide confirmed transactions. A lying node can show a stale or incomplete view; transactions built on it then fail at publication. Run your own node or use one you trust. |
| Manifest | Internal consistency: leaves, control blocks, verification keys, guard, domain and context. The commitment must equal an independently pinned `expectedCommitment`; the bundled TEST deployment carries its own. | That the pinned contract actually implements safe custody. Pinning a manifest is the application's decision. |
| Proving artifacts | Size and SHA-256 of every file before use. | Nothing else: a wrong artifact is rejected. The server can still refuse to serve them. |
| snarkjs | Every proof is verified locally against the pinned key before it is used. | The injected module (0.7.6) runs inside the worker and sees the private witness. |
| Application code | Nothing. | The worker separates secrets from page code to avoid accidental leaks. It cannot protect against malicious code in the same application, such as a compromised dependency or a script injection. |
| Randomness | Fails if `crypto.getRandomValues` is missing. | The platform's secure random generator, used for `rho`, ephemeral keys and nonces. |

## Secret handling

| Data | Where it lives | Leaves the worker |
| --- | --- | --- |
| Wallet words and passphrases | Page (transparent wallet) and worker | Sent to the worker by `derive`; not kept after derivation |
| Account key, spend secrets, view seeds, nullifier keys | Worker | Never |
| Note plaintexts, witnesses | Worker | Only inside the encrypted checkpoint |
| Vault password | Page, sent to the worker | No |
| Vault JSON | Worker and page | Yes, encrypted |
| Scan checkpoint | Worker and page | Yes, encrypted and authenticated |
| Balance, own unspent commitments and amounts, receiving addresses | Worker and page | Yes |
| Proof and unsigned transaction | Worker and page | Yes; they become public anyway |
| Fingerprint, `storageId` | Worker and page | Yes; local only, never publish or send to the RPC node |

Notes for integrators:

- The page learns the balance and which commitments belong to the wallet.
  That link is private information: do not send it to analytics or servers.
- `lock()` and `stop()` overwrite key buffers. JavaScript cannot erase
  strings such as the mnemonic, nor copies made by the engine, so wiping is
  best effort.
- If the worker crashes, its keys are lost. `PoolWorkerClient` reports it
  through `onCrash`; open the wallet again in a new worker.
- `PoolWorkerClient` forwards only read-only RPC methods. Keep that filter if
  you replace it.

## What the pool hides

- The owner of every note.
- Amounts of assignments inside the pool.
- Which note a transaction spends: the nullifier cannot be linked to its
  commitment without the owner's key.
- The recipients of an assignment.
- The link between a wallet's receiving addresses: each one has independent
  keys.

## What stays public

- **Deposits:** the amount and the funding coin, with its address and
  history.
- **Withdrawals:** the amount and the destination address. A withdrawal
  always takes a whole note.
- **Fees:** the sponsor coin and its address. The change returns to the same
  script, so every operation paid from that address is linked.
- **Form:** the verification key in the witness reveals the operation and,
  for assignments, the number of notes created. `T1` shows that a whole note
  went to one recipient without change.
- **Reserve:** the total XNA in the pool after every transaction.
- **Timing:** the block and order of every operation.
- **Network metadata:** the RPC node sees the client's IP address, the coins
  it checks and the transactions it publishes. The artifact server sees which
  form's files are downloaded, and when.

## Linking risks

Zero-knowledge proofs hide the private ledger, not the public facts around
it. With few users, amounts and timing alone can link operations. For
example, after `deposit 1,000 → assign 400 to Bob → Bob withdraws 400` as the
only activity, an observer sees 1,000 enter, an assignment, and 400 leave to
Bob's address, and can guess the relationship.

Ways to reduce linking, none of which guarantees anonymity:

- Pay fees from coins that are not linked to the deposit or withdrawal
  addresses, and do not reuse one sponsor address for unrelated operations.
- Avoid withdrawing exactly the amount that was deposited, and avoid unique
  amounts.
- Leave time between a deposit and later operations.
- Use your own node so a third-party RPC operator does not see your queries.

Measure linkability against the real pool history. One unlinked note is not
"anonymous" if few other people use the pool. A small testnet pool has a
small anonymity set even when the cryptography is correct.

## Recovery

- A wallet derived from words is recovered from the words, the BIP39
  passphrase, the ZK passphrase, the family and the account, plus the chain.
  The note records are on chain, so no other backup is needed.
- A forgotten ZK passphrase cannot be recovered. A wrong one opens a
  different, usually empty wallet without any error.
- Recovery searches receiving addresses up to the last used one plus the
  gap. Payments to addresses handed out further away are only found with a
  larger gap.
- Random identities (`create`) are recovered only from their encrypted vault
  and its password.
- Notes created for the earlier v1 derivation need the v1 keys; v2 does not
  find them.

See [NeuraiZK/v2 §6](nzk-v2-derivation.md#6-recovery-on-another-device).

## Before funds of value

At least these parts need independent review:

- note ownership and nullifier constraints in the circuits;
- bounded amounts and conservation of the reserve;
- HPKE record construction and data availability;
- TXHASH anchoring and the Script introspection that checks it;
- the commitments from verification keys to contract leaves;
- wallet secret storage, exact amount parsing and reorganization recovery;
- a real trusted setup ceremony to replace the TEST proving keys.
