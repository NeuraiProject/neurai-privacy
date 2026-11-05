# NeuraiZK/v2: wallet seed and root

This is the byte-exact specification of the wallet seed `S` and the private
root `R` that a C7 wallet is derived from. Another wallet that follows it,
and then the C7 derivation in [data formats](data-formats.md#c7-account-keys-and-addresses),
recovers the same keys and the same notes.

**Status.** The derivation is implemented in `src/zk-wallet.js` and frozen by
independent vectors. Pool deployments remain TEST only and this
specification has not been audited.

## 1. Scope

NeuraiZK/v2 has two parts. The first turns the wallet words into `S` and `R`.
C7 (NeuraiZK/v3) builds every account key on `R`, so this part is current and
described here.

The second part derived a spend secret and a view seed per address under
`NeuraiZK/v2/…` labels, and encoded them as nzk version 1 addresses. That was
the scheme of the C6 pool. It was removed from the library in 0.4.0, together
with `ZkWalletIdentity` and the v1 address functions; C7 replaces it with one
viewing key per account and diversified version 3 addresses.

Choosing the `pq` family **does not make the pool post-quantum**: the pool
primitives, including Groth16 and ristretto255, are the same for all
families. Sharing one seed across families also shares the risk: a leak of
that seed compromises all three.

## 2. Inputs that identify a private wallet

| Field | Rule |
| --- | --- |
| Seed | 64 bytes obtained with BIP39 |
| BIP39 passphrase | The transparent wallet's passphrase; it changes the seed |
| ZK passphrase | Additional and optional; empty is a valid, explicit value |
| Family | `legacy` = byte `00`; `ecdsa` = `01`; `pq` = `02` |
| Account | Integer from 0 to 2³¹−1; default 0 |
| Pool instance | `domain` and `assetId` of the pinned C7 deployment |

The family and the account enter the C7 derivation, not `R`. The family is
mandatory in the API and has no default. Legacy wallets that use coin type 0
and coin type 1900 both belong to `legacy`: with the same seed and the same
other inputs they share one private wallet.

The ZK passphrase is not a password that a server checks. A different
passphrase produces a different wallet, which is normally empty. An empty
wallet is not proof that a passphrase is wrong or right.

## 3. Byte conventions

- `||` is byte concatenation, without separators or NUL terminators.
- `UTF8(s)` is UTF-8 encoding; literal labels are exact ASCII.
- `u32le(n)` is four little-endian bytes, written after checking range and
  integrality.
- Every passphrase is normalized to NFKD. Spaces are not trimmed and case is
  not changed. Its length is the UTF-8 byte length, not the number of
  JavaScript characters.

## 4. Derivation

### 4.1. BIP39 seed

`walletSeedFromMnemonic` validates the English BIP39 word list and the
checksum with `@scure/bip39`. Other word lists can use
`C7WalletIdentity.fromSeed` with an externally validated BIP39 seed. The
canonical input is the sequence of BIP39 words separated by one ASCII space,
normalized to NFKD. The passphrase keeps its spaces.

```text
S = PBKDF2-HMAC-SHA512(
    password = UTF8(NFKD(canonical_mnemonic)),
    salt = UTF8("mnemonic" || NFKD(bip39_passphrase)),
    iterations = 2048, output_length = 64)
```

This follows [BIP39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki).
The seed API requires exactly 64 bytes. A single WIF cannot recover a private
wallet derived from these words.

### 4.2. Private root

```text
Z = UTF8(NFKD(zk_passphrase))
password = S || u32le(length(Z)) || Z
R = Argon2id(password, salt = UTF8("NeuraiZK/v2/root"),
             version = 0x13, memory = 65536 KiB,
             iterations = 3, parallelism = 1, output_length = 64)
```

`deriveZkRoot` implements it. No Argon2 secret key or associated data is
used. The length of Z must fit in a u32 before it is serialized. The
parameters (`NZK_ARGON2ID`) are part of the protocol: do not lower them for
weaker devices. Run the derivation off the user interface thread and clear
buffers afterwards as far as JavaScript allows. The 64 MiB is the Argon2
memory parameter, **not the browser's total peak memory**. See
[Argon2, RFC 9106](https://www.rfc-editor.org/rfc/rfc9106.html).

### 4.3. Account PRK

```text
PRK = HKDF-Extract(SHA-256, salt = UTF8("NeuraiZK/v2/account"), ikm = R)
```

C7 expands every account key from this PRK with HKDF-Expand (32 bytes) under
`NeuraiZK/v3/…` labels. See [HKDF, RFC 5869](https://www.rfc-editor.org/rfc/rfc5869.html)
and [data formats](data-formats.md#c7-account-keys-and-addresses).

## 5. PoseidonBytes

The note transformations (owner, nullifier key, commitment, nullifier) use
`PoseidonBytes`, which must be exactly the function in `src/poseidon.js` with
the constants in `src/poseidon-constants.js`, not any function called
Poseidon. The constants are exported in `test/fixtures/nzk-poseidon.json`,
and the SHA-256 of that file is pinned in `test/fixtures/nzk-vectors.json`.

- Field: BN254 scalar field Fr. Width 3, 65 rounds, S-box x⁵.
- 4 full rounds at the start and 4 at the end; the other 57 apply the S-box
  to element 0 only.
- Each round adds its three round constants before the S-box and then
  multiplies by the MDS matrix in row order.
- Sponge: append `01`, then zeros up to a multiple of 31 bytes. Absorb
  big-endian 31-byte elements into positions 0 and 1 of a state that starts
  at zero, adding them to the state, and permute after each pair (including a
  final odd element).
- Output: element 0 as 32 big-endian bytes.

### Interface identifiers (integration note)

The network names of jswallet and neurai-key do not always mean the same
thing. The current testnet integration uses this map, which should be kept as
a test in the wallet that adapts them:

| Family | Current jswallet selector | Signing/key network |
| --- | --- | --- |
| `legacy` | `xna-test` or `xna-legacy-test` | `xna-legacy-test` |
| `ecdsa` | `xna-ecdsa-test` | `xna-test` |
| `pq` | `xna-pq-strict-test` | `xna-pq-test` |

In jswallet, `xna-pq-test` is generic AuthScript v1 and must **not** be read
as the strict PQ family. This library receives the explicit family enum; the
map belongs to the user interface adapter.

## 6. Recovery on another device

1. Enter the words, the BIP39 passphrase and the ZK passphrase. Choose the
   family and account.
2. Load the pool's reviewed deployment and manifest. Keep a public record of
   the pools used: the words do not list them.
3. Scan the pool from its birth. C7 finds the notes of every address of the
   account with one multiplication per record, so no address window or gap
   is needed.
4. Restore the encrypted operation journal from its backup if operations
   were pending on the old device; the words recover confirmed notes, not
   unpublished packets.

The words regenerate keys, **not missing publications**. Availability of the
published records is part of recovery. A forgotten ZK passphrase cannot be
recovered.

## 7. Implementation and test vectors

Implementation: `src/zk-wallet.js` (seed, root, bech32m, constants),
`src/c7.js` and `src/c7-wallet.js` (C7 keys built on the root),
`src/notes.js`, `src/poseidon.js`, `src/poseidon-constants.js`.

Tests: `test/zk-wallet.test.js` checks `S` and `R` for every vector of
`test/fixtures/nzk-vectors.json` (three different ZK passphrases), the
Argon2id parameters, the pinned hash of the Poseidon constants, bech32m and
the Unicode normalization of words and passphrases. The vector file still
contains the v2 per-address values of the C6 scheme; the library no longer
uses them.

`scripts/check-nzk-v2.py` recomputes the vectors with argon2-cffi, hashlib
and cryptography, without importing the JavaScript implementation. Its
normal mode compares the result with the frozen constants; `--write` is an
explicit vector review action. Python is only a verification tool: the
library and the browser need neither Python nor a server to derive keys.
