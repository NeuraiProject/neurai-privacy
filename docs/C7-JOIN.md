# C7 J2 (join) reference

`createC7JoinWallet` is exported from the Node, browser and worker entries.
It builds and proves the **J2 2-to-1** operation of a C7 XNA pool: two notes
of the wallet become one, minus the fee. `createC6JoinWallet` is a
deprecated alias of it until the next release.

```js
const joiner = createC7JoinWallet({ expectedGenesis, expectedCommitment });
const prepared = identity.prepareC7Join(joiner, { manifest, fee, consumed: [noteA, noteB] });
const { packet, packetId } = await joiner.prove(prepared, { api: snarkjs, wasm, zkey, vk });
```

The factory requires application-pinned `expectedGenesis` (internal byte
order) and `expectedCommitment`. `prepare` accepts only `C7_PROFILE`,
verifies those pins and checks the domain and asset context with quantum 1
and a zero registry root. Do not obtain the pins from the same untrusted
manifest you are checking. The fee must be one of the manifest's `J2` levels.

The request takes two notes with their spend secrets and 32-level paths
against one confirmed historical root, and `change`: the descriptor of the
address of note 0, where the joined note goes. A C7 note does not carry its
diversifier, so the wallet supplies that address.
`C7WalletIdentity.prepareC7Join` does all of this from two recovered notes of
`scanC7Pool`, which may have been received at different addresses; the
worker's `join` action uses it. Both notes must be distinct (index,
commitment and nullifier) and belong to this instance. Amounts and fees use
exact atomic strings or bigints.

`prepare` returns private circuit inputs, the J2 publication (two nullifiers,
the new commitment and its 230-byte record) and the reserved resources. Keep
the prepared object inside a dedicated Web Worker. Only the packet, proof and
public signals may leave it.

`prove(prepared, { api, wasm, zkey, vk, stage, signal })` injects a local
snarkjs-compatible prover. The application must pin the wasm, zkey and
verification key to its deployment and verify the files before this call;
`loadVerifiedArtifact` does that. Calling `prove` before any `prepare` throws
`Prepare a pinned J2 first`, and an object that did not come from this
wallet's `prepare` is refused.

The implementation proves and serializes a private snapshot, checks the
intent after every await and after progress callbacks, and compares the final
public signals. Changing the publication, the public signals, the private
input, the resources or the output record rejects the operation before a
packet is returned. Cancellation is checked at boundaries; terminate the
worker for immediate CPU cancellation. Neither cancellation nor queue expiry
invalidates a portable proof that was already exposed.

The packet uses wire version 2 (magic `4e4336504b540200`) and is exactly
4526 bytes. Like any packet, it still needs public relocation
(`buildC7Transaction`) before it is a publishable transaction. The public
inputs and the publication layout are in
[data formats](data-formats.md#public-inputs).

Joining is voluntary. Keeping separate notes allows more operations at the
same time; joining makes a larger single payment possible.

Unit tests (`test/c7-join.test.js`) cover real C7 notes, Merkle paths, the
packet layout and the lifecycle controls with a synthetic prover;
`test/c7-runtime.test.js` relocates, confirms and rescans a J2 on an
in-memory chain. They do not test ZK or consensus acceptance.
