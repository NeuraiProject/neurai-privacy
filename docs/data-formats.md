# Data formats

Byte layouts used by the library. Offsets are zero-based and ranges are
half-open (`[start, end)`). The [NeuraiZK/v2 specification](nzk-v2-derivation.md)
covers key derivation and the `nzk` address.

## Conventions

- **Field element:** a BN254 scalar field element, 32 bytes big-endian,
  canonical (less than the field order).
- **`PoseidonBytes(x)`:** the CP1 Poseidon byte sponge of `src/poseidon.js`.
  It is not circomlib Poseidon. See [NeuraiZK/v2 §4.4](nzk-v2-derivation.md#44-from-private-keys-to-the-public-descriptor).
- **`tagged(tag, x)`:** `SHA256(SHA256(tag) || SHA256(tag) || x)`.
- **`SHA256d(x)`:** `SHA256(SHA256(x))`.
- **`u32le`, `u64le`:** little-endian unsigned integers.
- **`compactSize`:** the Bitcoin variable-length integer.
- **txid:** RPC shows it reversed; transaction bytes use the internal order.

## Hash labels

| Label | Used for |
| --- | --- |
| `NIP043/owner/CP1`, `NIP043/nk/CP1` | Note owner and nullifier key |
| `NIP043/cm/CP1`, `NIP043/nf/CP1` | Note commitment and nullifier |
| `NIP043/cmleaf`, `NIP043/nfleaf` | Indexed tree leaves |
| `NIP043/HPKE/CP1`, `NIP043/note/CP1` | HPKE info and AEAD associated data of note records |
| `NIP043/instance/v3` | C4 domain |
| `NeuraiPoolAsset/v2` | C4 native asset ID |
| `NeuraiPoolCtx` | C4 circuit context |
| `NIP045/dep\x01`, `NIP045/wdr\x00`, `NIP045/req\x00` | Deposit public inputs |
| `NIP045/dat\x02`, `NIP045/dat\x03` | Publication hash, C3 and C4 |
| `NeuraiTxHash` | Transaction hash anchor |
| `NeuraiAuthLeaf`, `NeuraiAuthBranch`, `NeuraiAuthScript` | Contract MAST commitments |
| `NeuraiZK/v2/…`, `NeuraiZK/v1/instance` | Wallet derivation and address tag |
| `Neurai/privacy/scan-checkpoint/v1` | Checkpoint associated data |
| `Neurai/privacy/checkpoint/file/v1` | Checkpoint key of file identities |
| `Neurai/NIP045/testnet-wallet/vault/v1` | Vault associated data |

## Note (CP1, 169 bytes)

| Range | Size | Field |
| --- | --- | --- |
| `[0, 1)` | 1 | Version `0x01` |
| `[1, 33)` | 32 | `domain` |
| `[33, 65)` | 32 | `assetId` |
| `[65, 97)` | 32 | `owner`, nonzero field element |
| `[97, 129)` | 32 | Recipient's X25519 viewing public key, canonical, nonzero |
| `[129, 137)` | 8 | Amount, `u64le`, from 1 to 2.1 × 10¹⁸ satoshis |
| `[137, 169)` | 32 | `rho`, random |

```text
cm = PoseidonBytes("NIP043/cm/CP1" || note)                       must be nonzero
nf = PoseidonBytes("NIP043/nf/CP1" || domain || nk || rho || cm)
```

## Encrypted note record (1024 bytes)

| Range | Size | Field |
| --- | --- | --- |
| `[0, 3)` | 3 | Fixed prefix `01 d9 00` |
| `[3, 35)` | 32 | HPKE encapsulated key (ephemeral X25519 public key) |
| `[35, 220)` | 185 | ChaCha20-Poly1305 ciphertext of the 169-byte note plus 16-byte tag |
| `[220, 1024)` | 804 | Zero |

HPKE base mode (RFC 9180), one message per record:

- KEM `0x0020` DHKEM(X25519, HKDF-SHA256), KDF `0x0001` HKDF-SHA256,
  AEAD `0x0003` ChaCha20-Poly1305;
- `info = "NIP043/HPKE/CP1" || domain || assetId`;
- `aad = "NIP043/note/CP1" || domain || cm`;
- the recipient key pair is `DeriveKeyPair(viewSeed)`; the ephemeral pair is
  `DeriveKeyPair` of 32 fresh random bytes.

## Publication (4096 bytes)

The publication is passed as two 2048-byte witness items. Unused bytes are
zero. Its hash is a public input:

```text
data_hash = PoseidonBytes(PoseidonBytes(PoseidonBytes(label) || blob[0, 2048)) || blob[2048, 4096))
```

with `label = "NIP045/dat\x02"` for C3 and `"NIP045/dat\x03"` for C4.

### C3 deposit (version 1)

| Range | Content |
| --- | --- |
| `[0, 6)` | `01 00 00 00 01 00` |
| `[6, 38)` | `cm` |
| `[198, 1222)` | Record (1024 bytes) |

### C3 assignment (version 1), `T1` or `T2`

| Range | Content |
| --- | --- |
| `[0, 1)` | `01` |
| `[1, 2)` | Note count (1 or 2) |
| `[2, 34)` | Nullifier |
| `[34 + 32i, 66 + 32i)` | `cm` of note `i` |
| `[98 + 1024i, 1122 + 1024i)` | Record of note `i` |

### C4 (version 2), deposits and `T1`–`T4`

Records are stored compactly: only their first 220 bytes, because the rest
of a canonical record is zero.

| Range | Content |
| --- | --- |
| `[0, 1)` | `02` |
| `[1, 2)` | Note count `n` (1 for deposits) |
| `[2, 34)` | Nullifier; zero for deposits |
| `[34 + 32i, 66 + 32i)` | `cm` of note `i` |
| `[34 + 32n + 220i, 34 + 32n + 220(i+1))` | First 220 bytes of the record of note `i` |
| `[34 + 252n, 4096)` | Zero |

Commitments must be nonzero and distinct, and an assignment's nullifier must
be nonzero.

## Pool trees and state opening

**Note tree.** Sparse binary Merkle tree, 32 levels. Leaves are commitments in
creation order; an empty leaf is 32 zero bytes.

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

**State opening (109 bytes):**

| Range | Field |
| --- | --- |
| `[0, 32)` | Note tree root |
| `[32, 64)` | Nullifier tree root |
| `[64, 96)` | Seen (commitment) tree root |
| `[96, 100)` | Note count, `u32le` |
| `[100, 104)` | Nullifier count including the sentinel, `u32le` |
| `[104, 108)` | Seen count including the sentinel, `u32le` |
| `[108, 109)` | Mode: 0 empty, 1 holds notes |

`digest = PoseidonBytes(opening)`.

## Pool output scripts

State output, value 0:

```text
51 20 <commitment>  c0 <push(payload)>  75
payload = "xnat" || compactSize(len(identity)) || identity || u64le(100000000) || 54 20 || digest
```

`OP_1 <32 bytes>` is the AuthScript output. `c0` is the asset opcode, which
here carries one unit of the UNIQUE asset `identity` (for example
`C3TESTX260929A#POOL`) with the 32-byte digest attached. `75` is `OP_DROP`.

Reserve output, value = reserve: `51 20 <reserveCommitment>`.

## Contract commitments

```text
leaf      = tagged("NeuraiAuthLeaf", 01 || compactSize(len(script)) || script)
control   = 01 || sibling_1 || sibling_2 || …          (32 bytes per sibling)
node      = tagged("NeuraiAuthBranch", min(node, sibling) || max(node, sibling))
commitment        = tagged("NeuraiAuthScript", 04 || 00 || mastRoot)
reserveCommitment = tagged("NeuraiAuthScript", 01 || 00 || SHA256(guard))
```

`min` and `max` compare the two hashes as byte strings. Every leaf script
contains its form's `vkHash = SHA256(vk)`; in C4 it also contains the context.

## C4 instance values

```text
domain  = SHA256("NIP043/instance/v3" || genesis || issuanceTxid || u32le(issuanceVout)
                 || compactSize(len(identity)) || identity)
assetId = SHA256("NeuraiPoolAsset/v2" || 00 00)
context = PoseidonBytes("NeuraiPoolCtx" || 01 || domain || assetId || u64le(unit) || registryRoot)
```

`genesis` and `issuanceTxid` are in internal byte order, the reverse of the
RPC hex. The XNA profile uses `unit = 1` and an all-zero `registryRoot`. The context
is the first public input of every C4 proof.

## Transaction template and anchor

| Field | Value |
| --- | --- |
| Version | 3 |
| Inputs | Sequence `0xffffffff`; scriptSig empty until the wallet signs |
| Locktime | 0 |
| Serialization | Segregated witness (`00 01` marker and flag) |

```text
prevouts  = for each input:  txid || u32le(vout)
sequences = ff ff ff ff for each input
outputs   = for each output: u64le(value) || compactSize(len(script)) || script
txhash = tagged("NeuraiTxHash", 1f 01 || version || locktime || SHA256d(prevouts)
                || SHA256d(sequences) || SHA256d(outputs) || SHA256d(""))
anchor = PoseidonBytes(txhash)
```

`1f 01` is the NIP-042 field mask `0x011f`. Signatures are not covered.

## Deposit constants

```text
dep = PoseidonBytes("NIP045/dep\x01" || u64le(amount) || cm)
wdr = PoseidonBytes("NIP045/wdr\x00")
req = PoseidonBytes("NIP045/req\x00")
```

## Public inputs

| Form | Public inputs, in order (C4 adds `ctx` first) |
| --- | --- |
| `D0`, `D1` | `S_old, S_new, dep, wdr, req, data_hash, anchor, amount` |
| `T1`–`T4` | `S_old, S_new, nf, data_hash, anchor, cm_1, …, cm_n` |
| `W_partial`, `W_full` | `S_old, S_new, nf, anchor, amount, reserve_in, reserve_out` |

## Proof encoding (128 bytes)

`A (32) || B (64) || C (32)`, BN254 points in compressed form. Coordinates are
32 bytes little-endian.

- G1 (`A`, `C`): `x`, with bit 255 set when `y > p − y`.
- G2 (`B`): `x₀ || x₁`, with bit 255 of `x₁` set when `y₁ > p − y₁`, or
  `y₁ = p − y₁` and `y₀ > p − y₀`.

`p` is the BN254 base field order. The library compresses a proof only after
it verified it.

## Witness stacks

| Input | Witness items |
| --- | --- |
| State, deposits and assignments | `10`, proof, vk, publication `[0, 2048)`, publication `[2048, 4096)`, prevouts, leaf script, control block |
| State, withdrawals | `10`, proof, vk, nullifier, prevouts, leaf script, control block |
| Reserve | `00`, guard script |
| Funding, sponsor | Empty until the transparent wallet signs |

## Receiving descriptor and nzk address

Descriptor JSON, all values lowercase hex of 32 bytes:

```json
{ "domain": "…", "asset_id": "…", "owner": "…", "view_pub": "…" }
```

The `nzk` address encodes `01 || owner || view_pub || tag` (69 bytes) in
Bech32m; see [NeuraiZK/v2 §5](nzk-v2-derivation.md#5-receiving-format-and-compatibility-across-families).

## Scan checkpoint envelope

```json
{ "version": 1, "nonce": "<12 bytes hex>", "ciphertext": "<hex>" }
```

ChaCha20-Poly1305 with associated data `Neurai/privacy/scan-checkpoint/v1`.
The plaintext is the checkpoint JSON, at most 32 MiB. The key is:

- for derived wallets, `checkpointKey` from [NeuraiZK/v2 §4.3](nzk-v2-derivation.md#43-hkdf-and-context);
- for file identities, `SHA256("Neurai/privacy/checkpoint/file/v1" || domain || assetId || spendSecret || viewSeed)`.

## Encrypted vault (file identities)

A single JSON line followed by a newline:

```json
{ "version": 1, "kdf": "argon2id", "memory_kib": 65536, "passes": 3, "lanes": 1,
  "salt": "<16 bytes hex>", "nonce": "<12 bytes hex>", "ciphertext": "<hex>" }
```

- Key: Argon2id(password, salt, 3 passes, 64 MiB, 1 lane, 32 bytes).
- Cipher: ChaCha20-Poly1305 with associated data
  `Neurai/NIP045/testnet-wallet/vault/v1`.
- Plaintext: JSON with sorted keys, `{"spend_key": "<hex>", "view_seed": "<hex>"}`.

The Python TEST wallet reads and writes the same format.

## Rotation state

Stored under `neurai-privacy-zk:v2:` followed by the JSON array
`[network, walletId, family, account, storageId]`. The value is
`{"gap": <1–1000>, "issued": <index>}`. It is not secret.
