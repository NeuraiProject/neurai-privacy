# Data formats

Byte layouts used by the library for the C7 pool. Offsets are zero-based and
ranges are half-open (`[start, end)`). The byte-level specification of C7
keys, addresses and records, with shared vectors, is in Neurai-DePIN,
`contrib/privacypool/privacy-c7`; this page describes what `src/` implements.
The wallet seed and root are in [NeuraiZK/v2](nzk-v2-derivation.md).

## Conventions

- **Field element:** a BN254 scalar field element, 32 bytes big-endian,
  canonical (less than the field order).
- **`PoseidonBytes(x)`:** the CP1 Poseidon byte sponge of `src/poseidon.js`.
  It is not circomlib Poseidon. See [NeuraiZK/v2 §5](nzk-v2-derivation.md#5-poseidonbytes).
- **`tagged(tag, x)`:** `SHA256(SHA256(tag) || SHA256(tag) || x)`.
- **`SHA256d(x)`:** `SHA256(SHA256(x))`.
- **`BLAKE2b-n(x, label)`:** BLAKE2b with an `n`-bit output and the 16-byte
  personalization `label` padded with zeros.
- **`u32le`, `u64le`:** little-endian unsigned integers.
- **`compactSize`:** the Bitcoin variable-length integer.
- **txid and genesis:** RPC shows them reversed; transaction bytes, the
  manifest's `network` and the domain use the internal order.
- **ℓ:** the order of the ristretto255 group. A 64-byte value is reduced to a
  scalar as a little-endian integer modulo ℓ.

## Hash labels

| Label | Used for |
| --- | --- |
| `NIP043/owner/CP1`, `NIP043/nk/CP1` | Note owner and nullifier key |
| `NIP043/cm/CP1`, `NIP043/nf/CP1` | Note commitment and nullifier |
| `NIP043/cmleaf`, `NIP043/nfleaf` | Indexed tree leaves |
| `NIP043/note/CP2` | Associated data of C7 note records |
| `NeuraiZK/v2/root`, `NeuraiZK/v2/account` | Wallet root and account PRK |
| `NeuraiZK/v3/ivk`, `NeuraiZK/v3/dk`, `NeuraiZK/v3/spend` | C7 account keys and spend secrets |
| `NeuraiZKv3_ivk`, `NeuraiZKv3_esk`, `NeuraiZKv3_vtag`, `NeuraiZKv3_KDF` | BLAKE2b personalizations of C7 keys and records |
| `NeuraiZKv3-gd` | Hash-to-ristretto255 domain of diversified bases |
| `NeuraiZK/v3/instance` | Address instance tag |
| `NeuraiZK/v3/scan-checkpoint`, `NeuraiZK/v3/storage`, `NeuraiZK/v3/fingerprint` | Local cache key and identifiers |
| `NeuraiPoolC7/domain`, `NeuraiPool/asset/XNA`, `NeuraiPoolCtx` | Pool domain, asset ID and circuit context |
| `NIP045/dep\x01` | Deposit binding |
| `NIP045/dat\x03` | Publication hash |
| `NeuraiPoolC6/J2/data\x01` | J2 publication hash |
| `NeuraiPoolC6/pay\x01` | Withdrawal payout binding |
| `NeuraiC6Packet` | Packet identifier |
| `NeuraiC6Intent/v1` | Intent identifier |
| `NeuraiAuthLeaf`, `NeuraiAuthBranch`, `NeuraiAuthScript` | Contract MAST commitments |
| `Neurai/privacy-pool/transport/v1` | `pool_id` of `getprivacypoolupdates` |
| `Neurai/privacy/scan-checkpoint/v1` | Associated data of encrypted caches and the journal |
| `Neurai/C7/journal-id/v1` | Storage namespace of a wallet |
| `Neurai/NIP045/testnet-wallet/vault/v1` | Vault associated data |

The labels with `C6` in their name were introduced by the C6 pool. C7 kept
them because its contract and circuits commit to these exact bytes.

## Note (CP1, 169 bytes)

| Range | Size | Field |
| --- | --- | --- |
| `[0, 1)` | 1 | Version `0x01` |
| `[1, 33)` | 32 | `domain` |
| `[33, 65)` | 32 | `assetId` |
| `[65, 97)` | 32 | `owner`, nonzero field element |
| `[97, 129)` | 32 | Recipient's `pk_d` (ristretto255 encoding), nonzero, below 2²⁵⁵ − 19 |
| `[129, 137)` | 8 | Amount, `u64le`, from 1 to 2.1 × 10¹⁸ atomic units |
| `[137, 169)` | 32 | `rho`, random |

```text
cm = PoseidonBytes("NIP043/cm/CP1" || note)                       must be nonzero
nf = PoseidonBytes("NIP043/nf/CP1" || domain || nk || rho || cm)
```

## C7 account keys and addresses

```text
PRK = HKDF-Extract(SHA-256, salt = "NeuraiZK/v2/account", R)        (R: NeuraiZK/v2 root)
expand32(label, scope) = HKDF-Expand(SHA-256, PRK, label || scope, 32)
Q = family || u32le(account) || domain || assetId                   (69 bytes)
P = family || u32le(account) || u32le(chain) || u32le(index) || domain || assetId

ivk  = BLAKE2b-512(expand32("NeuraiZK/v3/ivk", Q), "NeuraiZKv3_ivk") mod ℓ
dk   = expand32("NeuraiZK/v3/dk", Q)
spendSecret = expand32("NeuraiZK/v3/spend", P)
owner, nk   = as for every CP1 note, from spendSecret
d    = FF1-AES256(dk, radix 2, 88 bits, j = chain · 2³² + index)    (11 bytes, Zcash bit order)
G_d  = hash_to_ristretto255(d || domain || assetId, DST "NeuraiZKv3-gd")
pk_d = ivk · G_d
```

`family` is one byte (`legacy` 0, `ecdsa` 1, `pq` 2). Chain 0 holds the
receiving addresses and chain 1 index 0 the wallet's own address for deposits
and change. Derivation fails, without retrying another value, when `ivk`, a
spend secret, `G_d` or `pk_d` is zero or the identity.

Receiving descriptor JSON, values in lowercase hex:

```json
{ "domain": "…", "asset_id": "…", "owner": "…", "view_pub": "<pk_d>", "d": "<11 bytes>" }
```

The nzk v3 address is Bech32m with HRP `nzk` (mainnet), `tnzk` (testnet) or
`rnzk` (regtest) of the 80-byte payload:

```text
03 || owner (32) || d (11) || pk_d (32) || tag (4)
tag = first_4_bytes(SHA256("NeuraiZK/v3/instance" || domain || assetId))
```

The decoder rejects another HRP, length, version or tag, a noncanonical owner
and an invalid or identity `pk_d`.

## C7 note record (230 bytes)

```text
esk    = BLAKE2b-512(rho || domain || assetId, "NeuraiZKv3_esk") mod ℓ     (nonzero)
epk    = esk · G_d
shared = esk · pk_d                       (the receiver computes ivk · epk)
vtag   = first_byte(BLAKE2b-256(shared || epk, "NeuraiZKv3_vtag"))
key    = BLAKE2b-256(shared || epk, "NeuraiZKv3_KDF")
```

| Range | Size | Field |
| --- | --- | --- |
| `[0, 1)` | 1 | Version `0x02` |
| `[1, 2)` | 1 | View tag `vtag` |
| `[2, 34)` | 32 | `epk` |
| `[34, 230)` | 196 | ChaCha20-Poly1305 of `note (169) || d (11)` plus its 16-byte tag |

The cipher uses `key`, a zero 12-byte nonce (each key encrypts one message)
and the associated data `"NIP043/note/CP2" || domain || cm`. A full scan of a
record checks, in this order: length and version, `epk`, view tag,
decryption, note instance and range, the diversifier index, `pk_d`, the
re-derived `epk`, `cm`, then the owner and the nullifier
(`C7Account.scan`; the failure reasons are those of the shared vectors).

## Publication (4096 bytes)

The publication is passed as two 2048-byte witness items. Unused bytes are
zero. Its hash is a public input:

```text
data_hash = PoseidonBytes(PoseidonBytes(PoseidonBytes("NIP045/dat\x03") || blob[0, 2048)) || blob[2048, 4096))
```

Deposits (`D0` layout) and transfers `T1`–`T3` use this layout; a withdrawal
with change publishes its change note in the `T1` layout.

| Range | Content |
| --- | --- |
| `[0, 1)` | `02` |
| `[1, 2)` | Note count `n` (1 for deposits) |
| `[2, 34)` | Nullifier; zero for deposits |
| `[34 + 32i, 66 + 32i)` | `cm` of note `i` |
| `[34 + 32n + 230i, 34 + 32n + 230(i+1))` | Record of note `i` |
| `[34 + 262n, 4096)` | Zero |

Commitments must be nonzero and distinct, and a spend's nullifier nonzero.
A withdrawal without change publishes nothing; its `data_hash` is the
constant `0x04bf938a28af8bc7ab2810e0adf3cbbb55aa4feb79827feed2722c5123baac15`.

**J2 publication.** `03 01 || nf_0 (32) || nf_1 (32) || cm (32) || record (230)`,
then zeros from byte 328, with

```text
data_hash = PoseidonBytes(PoseidonBytes(PoseidonBytes("NeuraiPoolC6/J2/data\x01") || blob[0, 2048)) || blob[2048, 4096))
```

## Pool trees and state opening

**Note and history trees.** Sparse binary Merkle trees, 32 levels. Leaves are
commitments (note tree) or note-tree roots (history tree) in order; an empty
leaf is 32 zero bytes.

```text
node(left, right) = PoseidonPermutation([0, left, right])[0]
```

**Indexed trees** (`nf` and `cm`). Each entry is `[value, nextValue,
nextIndex]`, forming a sorted linked list. Entry 0 is the sentinel
`[0, 0, 0]`. A new value is appended at index `size`: its predecessor (the
largest smaller value) now points to it, and it takes over the predecessor's
old link. Leaves go into a 32-level tree like the note tree:

```text
leaf = PoseidonBytes("NIP043/" || kind || "leaf" || value32 || nextValue32 || u32le(nextIndex))
```

**State opening (145 bytes):**

| Range | Field |
| --- | --- |
| `[0, 32)` | Note tree root |
| `[32, 64)` | Nullifier tree root |
| `[64, 96)` | Seen (commitment) tree root |
| `[96, 100)` | Note count, `u32le` |
| `[100, 104)` | Nullifier count including the sentinel, `u32le` |
| `[104, 108)` | Seen count including the sentinel, `u32le` |
| `[108, 109)` | Mode: 0 empty, 1 holds notes |
| `[109, 141)` | History tree root |
| `[141, 145)` | Number of historical roots, `u32le` |

`digest = PoseidonBytes(opening)`. The empty opening starts with the roots
`2f68a1c5…`, `14203f41…` and `0be6babf…` (`test/pool-state.test.js`).

## Transcript

The public tree transition of one operation (`C7PublicWorld.transition`):

```text
header (2)   = (03 for J2, else 02) || index of the form in C7_FORMS
old (145), new (145)
nfs          = nullifiers (32 each); 32 zero bytes for a deposit
cms          = new commitments (32 each)
paths        = for a spend: u32le(rootIndex) || history path (32 × 32)
               per nullifier: u32le(predIndex) || predValue || predNext || u32le(predNextIndex)
                              || predecessor path (32 × 32) || empty-slot path (32 × 32)
               per commitment: note-tree path (32 × 32) || the same indexed insertion into the seen tree
               if notes were created: history path of the new root (32 × 32)
```

`C7_FORMS` is `D0 D1 T1 T2 T3 W_partial_no_change W_partial_change
W_full_no_change J2`. A transcript is at most 15360 bytes and travels as five
witness items `tree0`…`tree4` of up to 3072 bytes.

## Pool output scripts

State output, value 0:

```text
51 20 <commitment>  c0 <push(payload)>  75
payload = "xnat" || compactSize(len(identity)) || identity || u64le(100000000) || 54 20 || digest
```

`OP_1 <32 bytes>` is the AuthScript output. `c0` carries one unit of the
UNIQUE asset `identity` (for example `C7TEST1023A#POOL`) with the 32-byte
digest attached. `75` is `OP_DROP`. The deployment's anchor script is this
script for the empty state; every later state script differs only in its
last 33 bytes.

Reserve output, value = reserve: `51 20 tagged("NeuraiAuthScript", 01 00 || SHA256(guard))`,
where `guard` (`c7ReserveGuard`) embeds the commitment and the pool identity.

## Contract commitments

```text
leaf      = tagged("NeuraiAuthLeaf", 01 || compactSize(len(script)) || script)
branch    = tagged("NeuraiAuthBranch", min(a, b) || max(a, b))
control   = 01 || sibling_1 || sibling_2 || …          (32 bytes per sibling)
commitment = tagged("NeuraiAuthScript", 04 || 00 || mastRoot)
```

`min` and `max` compare the two hashes as byte strings. Leaves are sorted by
form name; a list of more than one leaf splits into its first `k` names and
the rest, where `k` is the largest power of two below the list size.

## Instance values

```text
domain  = SHA256("NeuraiPoolC7/domain" || 01 || genesis || emissionTxid || u32le(emissionVout)
                 || u8(len(name)) || name)
assetId = SHA256("NeuraiPool/asset/XNA")
ctx     = PoseidonBytes("NeuraiPoolCtx" || 01 || domain || assetId || u64le(1) || zero32)
```

`genesis` and `emissionTxid` are in internal byte order; `name` is the pool
identity `NAME#POOL` (1 to 64 printable ASCII characters).

## Public inputs

| Operation | Public inputs, in order |
| --- | --- |
| `D` | `ctx, dep, data_hash, amount, fee` |
| `T1`–`T3` | `ctx, R, nf, data_hash, fee, cm_1, …, cm_n` |
| `W` | `ctx, R, nf, amount, fee, pay, cm_change, data_hash` |
| `J2` | `ctx, R, nf_0, nf_1, data_hash, fee, cm` |

```text
dep = PoseidonBytes("NIP045/dep\x01" || u64le(amount) || cm)
pay = PoseidonBytes("NeuraiPoolC6/pay\x01" || compactSize(len(payout)) || payout)
```

`R` is the historical root the spent notes belong to. A withdrawal without
change has `cm_change = 0` and uses the circuit's canonical dummy note.

## Proof encoding (128 bytes)

`A (32) || B (64) || C (32)`, BN254 points in compressed form
(`c7ProofBytes`). Coordinates are 32 bytes little-endian.

- G1 (`A`, `C`): `x`, with bit 255 set when `y > p − y`.
- G2 (`B`): `x₀ || x₁`, with bit 255 of `x₁` set when `y₁ > p − y₁`, or
  `y₁ = p − y₁` and `y₀ > p − y₀`.

`p` is the BN254 base field order. The library compresses a proof only after
it verified it.

## Packet

A packet is the public result of one proof (`readC7Packet`):

| Field | Size |
| --- | --- |
| Magic | 8: `4e4336504b540100` (`NC6PKT 01 00`) for D/T/W, `4e4336504b540200` for J2 |
| Network (genesis, internal order) | 32 |
| Pool commitment | 32 |
| Operation | 1: D 0, T1 1, T2 2, T3 3, W 4, J2 5 |
| Public input count | 1: 5, 6, 7, 8, 8 and 7 for J2 |
| Public inputs | 32 each |
| Proof | 128 |
| Publication length, `u16le`, and publication | 2 + 0 or 4096 |
| Payout length (`u8`) and payout script | 1 + script; the script is empty except for withdrawals |
| Funding length (`u8`) and funding outpoint | 1 + 36 for deposits, 1 + 0 otherwise |

A packet is at most 4800 bytes; a J2 packet is exactly 4526.
`packetId = SHA256("NeuraiC6Packet" || version || packet)`, with version
`01` for D/T/W and `02` for J2.

## Transaction

| Field | Value |
| --- | --- |
| Version | 3 |
| Serialization | Segregated witness, flags `0x01` |
| Inputs | Sequence `0xffffffff`; scriptSig empty until the transparent wallet signs the funding coin |
| Locktime | 0 |
| Reference inputs | None. NIP-014 reference inputs are announced by flag `0x02` and go between the outputs and the witnesses; pool transactions do not use them, so nothing follows the outputs, as in 1.0.7. |

`readC7RawTransaction` reads this format and computes the txid.

## Witness stacks

| Input | Witness items |
| --- | --- |
| State | `10`, the leaf's arguments in leaf order, leaf script, control block |
| Reserve | `00`, guard script |
| Funding | Empty until the transparent wallet signs |

Leaf arguments: `tree0`…`tree4` (transcript), `proof`, `vk` (the manifest's
verification key), `chunk1` and `chunk2` (publication halves) or `nf`,
`amount` (a minimal script number, deposits) or `R`, and `prevouts` (the
36-byte outpoints of all inputs, concatenated).

## Intent

`c7Intent(raw, deployment)` identifies an operation independently of the
state it is relocated to:

```text
operationId = hex(SHA256(UTF8(JSON.stringify(["NeuraiC6Intent/v1", genesis, commitment, operation,
                                               stable, payout, funding]))))
```

`operation` is `D`, `W` or the form (`T1`–`T3`, `J2`). `stable` is the
object of the leaf's witness arguments except `tree0`…`tree4` and
`prevouts`, sorted by name, as hex. `payout` is `[valueAtomic, script]` of
the withdrawal output or `null`; `funding` is the `"txid:vout"` of a
deposit's funding input or `null`. The intent also returns the pool
commitment and the nullifiers.

## Encrypted caches and journal

All three are sealed with `C7WalletIdentity.sealCheckpoint`:

```json
{ "version": 1, "nonce": "<12 bytes hex>", "ciphertext": "<hex>" }
```

ChaCha20-Poly1305 with associated data `Neurai/privacy/scan-checkpoint/v1`
and the key `expand32("NeuraiZK/v3/scan-checkpoint", Q)`. The plaintext is
JSON, at most 32 MiB. `storeId = hex(SHA256("Neurai/C7/journal-id/v1" ||
key))` (`checkpointStoreId()`) namespaces the storage keys:

| Record | Storage key | Plaintext type | Limit |
| --- | --- | --- | --- |
| Operation journal | `storeId:genesis:commitment` (genesis in internal order) | `neurai-c6-private-journal-v1` | 256 operations, 4 MB of JSON |
| Scan prefix | `c6-scan-prefix-v1:` + hex(SHA256(`storeId:genesis:commitment`)) (RPC order) | `neurai-c6-scan-prefix-v1` | 2048 transactions, 2 MiB |
| Scan snapshot | `c6-scan-state-v2:` + hex(SHA256(`storeId:scope`)), scope = hex(SHA256(deployment JSON)) | `neurai-c6-scan-state-v2` | 3 MiB |

The names keep the `c6` of the release that introduced them so that saved
data stays readable. The journal backup is
`{ "type": "neurai-c6-private-journal-v1", "genesis", "commitment", "cipher" }`.

## Encrypted vault

`sealVault(payload, password)` writes a single JSON line followed by a
newline:

```json
{ "version": 1, "kdf": "argon2id", "memory_kib": 65536, "passes": 3, "lanes": 1,
  "salt": "<16 bytes hex>", "nonce": "<12 bytes hex>", "ciphertext": "<hex>" }
```

- Key: Argon2id(password, salt, 3 passes, 64 MiB, 1 lane, 32 bytes).
- Cipher: ChaCha20-Poly1305 with associated data
  `Neurai/NIP045/testnet-wallet/vault/v1`.
- Plaintext: the payload object as JSON with sorted keys.

The Python TEST wallet reads and writes the same format. Applications use it
to encrypt their own backups; C7 identities need none.
