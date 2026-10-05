# C6 TEST J2 local API

`createC6JoinWallet` is exported from Node, browser and worker entries. It builds
and proves the **XNA J2 2-to-1** operation. It is not a replacement for the
C4/C5 worker and does not yet build D/T/W, relocate tree transitions, scan a
chain, sign sponsor inputs or broadcast a transaction.

The factory requires application-pinned `expectedGenesis` and
`expectedCommitment`. `prepare` accepts only `C6-XNA-TEST-J2-v2`, verifies those
pins and checks the domain/asset context with unit 1 and a zero registry root.
Do not obtain the pins from the same untrusted manifest you are checking.

Use two recovered notes with local spend secrets and two 32-level paths against
one confirmed historical root. All amounts and fees use exact atomic strings or
bigints. The output preserves the first note's spending and viewing identity.
Both input commitments/nullifiers must be distinct. The fee must be one of the
manifest's J2 levels; change retains fractional atomic amounts.

`prepare` returns private circuit inputs and encrypted publication metadata.
Keep the prepared object inside a dedicated local Web Worker. Only the result's
public packet/proof/public signals may go to a relocator. Do not transmit private
inputs, input commitments/positions or note secrets to RPC or delivery services.

`prove(prepared,{api,wasm,zkey,vk,stage,signal})` injects a local snarkjs-compatible
prover. The application must independently pin the wasm, zkey and VK to its
trusted deployment and verify file hashes before this call. `loadVerifiedArtifact`
is available for this purpose. No public C6 parameter deployment is bundled.
The object passed to `prove` must come from this factory's own `prepare`.

The implementation proves/serializes a private snapshot, checks intent after
all awaits and after progress callbacks, and compares final public signals.
Mutating publication, fields, private input, resources or output record rejects
the operation before returning a packet. Cancellation is checked at boundaries;
terminate the worker for immediate CPU cancellation. Neither cancellation nor
queue expiry invalidates an already exposed portable proof on chain.

Unit tests cover real note/HPKE/Merkle operations, layout and API scheduling with
a **synthetic prover** (40 lifecycle/instance controls). Separate isolated Docker
tests also generated fresh J2 proofs through the compiled Node and browser APIs
using real Groth16 TEST parameters. The C++ verifier accepted those proofs and
rejected changes to each public signal; an isolated regtest node confirmed the
new transactions. Chromium also tested immediate worker termination and two
independent J2/T1 workers. These tests used the matching Q17 baseline node and
are not a full validation of the latest node revision or an Android measurement.
They are not a production-key ceremony or security audit.
A valid packet still needs public tree relocation, state/reserve guards and
local funding/sponsor signatures before it is a publishable transaction.
