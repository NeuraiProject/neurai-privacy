# NeuraiZK/v2: private wallet derivation per family

This is the byte-exact specification of how a private pool wallet and its
`nzk` receiving addresses are derived from the wallet words. Another wallet
that follows it recovers the same keys and the same notes.

**Status.** NeuraiZK/v2 is the active derivation in `src/zk-wallet.js`. The
family is mandatory and there is no fallback to the earlier derivation. The
test vectors were recomputed with an independent implementation. Pool
deployments remain TEST only and this specification has not been audited.

## 1. Goal and scope

The same words, passphrases, family, account, pool instance and index must
produce the same keys in any implementation. Changing the family must produce
different private keys and a different private receiving address.

v2 separates the Legacy, ECDSA witness and strict PQ families explicitly and
documents recovery. It never derives secrets from a transparent address, a
public key or a WIF.

v2 replaces the earlier v1 derivation of this TEST integration on purpose.
There is no silent search for v1 keys and no automatic migration. Notes on
the chain are not deleted: a note created for v1 keys stays bound to those
keys, and only those keys can spend it.

The change is wallet-only. Notes, circuits, verification keys, contracts and
the receiving address format stay the same, and no new opcode is needed.
Choosing the `pq` family **does not make the pool post-quantum**: the pool
primitives, including Groth16 and X25519, are unchanged. Sharing one seed
across families also shares the risk: a leak of that seed compromises all
three families.

## 2. Parameters that identify a private wallet

| Field | Rule |
| --- | --- |
| Derivation | `NeuraiZK/v2`, never inferred from the look of an address |
| Seed | 64 bytes obtained with BIP39 |
| BIP39 passphrase | The transparent wallet's passphrase; it changes the seed |
| ZK passphrase | Additional and optional; empty is a valid, explicit value |
| Family | `legacy` = byte `00`; `ecdsa` = `01`; `pq` = `02` |
| Account | Integer from 0 to 2³¹−1; default 0 |
| Branch | 0 receiving; 1 change and self-deposit |
| Index | Integer from 0 to 2³¹−1 |
| `domain` | 32 bytes, domain of the verified pool instance |
| `assetId` | 32 bytes, asset identifier of that instance |
| Network | Validated against the manifest and its genesis; selects the HRP |

The family is mandatory in the API and has no default. Legacy wallets that
use coin type 0 and coin type 1900 both belong to `legacy`: with the same
seed and the same other parameters they share one private wallet. The index
and branch of the transparent account are never used as implicit
parameters.

The ZK passphrase is not a password that a server checks. A different
passphrase produces a different wallet, which is normally empty. An empty
wallet is not proof that a passphrase is wrong or right. The password of an
exported JSON file encrypts that file only and must never silently replace a
passphrase.

## 3. Byte conventions

- `||` is byte concatenation, without separators or NUL terminators.
- `UTF8(s)` is UTF-8 encoding; literal labels are exact ASCII.
- `u32le(n)` is four little-endian bytes, written after checking range and
  integrality.
- SHA-256 and HMAC return raw bytes; hex is only their representation.
- `domain` and `assetId` are used exactly as the manifest defines them,
  without the byte reversal that RPC applies when displaying txids.
- No integer is truncated, parsed loosely (`parseInt`), negative or decimal.
- Every passphrase is normalized to NFKD. Spaces are not trimmed and case is
  not changed. Its length is the UTF-8 byte length, not the number of
  JavaScript characters.

## 4. Derivation, byte by byte

### 4.1. BIP39 seed

`fromMnemonic` validates the English BIP39 word list and the checksum with
`@scure/bip39`. Other word lists can use `fromSeed` with an externally
validated BIP39 seed. The canonical input is the sequence of BIP39 words
separated by one ASCII space, normalized to NFKD. The passphrase keeps its
spaces.

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

No Argon2 secret key or associated data is used. The length of Z must fit in
a u32 before it is serialized. The parameters are part of the protocol: do
not lower them for weaker devices. Run the derivation off the user interface
thread, allow cancellation, and clear buffers afterwards as far as JavaScript
allows. The 64 MiB is the Argon2 memory parameter, **not the browser's total
peak memory**. See [Argon2, RFC 9106](https://www.rfc-editor.org/rfc/rfc9106.html).

### 4.3. HKDF and context

This fixes the cryptographic meaning, not the argument order of any library:

```text
PRK = HMAC-SHA256(key = UTF8("NeuraiZK/v2/account"), message = R)
expand32(info) = HMAC-SHA256(key = PRK, message = info || 0x01)

Q = family_byte || u32le(account) || domain32 || assetId32
P = family_byte || u32le(account) || u32le(branch) || u32le(index)
    || domain32 || assetId32

spendSecret   = expand32(UTF8("NeuraiZK/v2/spend") || P)
viewSeed      = expand32(UTF8("NeuraiZK/v2/view")  || P)
checkpointKey = expand32(UTF8("NeuraiZK/v2/scan-checkpoint") || Q)
fingerprintMaterial = expand32(UTF8("NeuraiZK/v2/fingerprint") || Q)
fingerprint = lowercase_hex(first_4_bytes(SHA256(fingerprintMaterial)))
storageId   = lowercase_hex(SHA256(expand32(UTF8("NeuraiZK/v2/storage") || Q)))
```

Q is **69 bytes** and P is **77 bytes**. `expand32` is HKDF-Expand with
length 32, so it has a single block. PRK is HKDF-Extract with the given salt.
This follows [HKDF, RFC 5869](https://www.rfc-editor.org/rfc/rfc5869.html).

The fingerprint is a local comparison hint only. It is not authentication and
not a unique ID: it has 32 bits. Do not publish it or use it as the only
storage key. Storage keys combine version, family, account, network, wallet
ID and the 256-bit `storageId`, which is bound to domain and asset. The C4
instance includes the genesis in its domain, and the manifest is validated
before scanning. Checkpoints are authenticated with their full derived key.
`storageId` is also local: do not publish it or send it to the RPC node.
The checkpoint encryption format is shared with v1, but a v1 checkpoint is
never accepted as a v2 checkpoint.

If a derived spend secret is all zeros or a descriptor is invalid, fail
explicitly. Do not retry with other values and do not silently skip to the
next index.

### 4.4. From private keys to the public descriptor

The CP1 note transformations are unchanged:

```text
owner = PoseidonBytes(UTF8("NIP043/owner/CP1") || domain32 || spendSecret)
nk    = PoseidonBytes(UTF8("NIP043/nk/CP1")    || domain32 || spendSecret)
```

`owner` is the field element as 32 big-endian bytes, canonical and nonzero.
`nk` stays secret. The viewing public key is obtained with
`DHKEM(X25519, HKDF-SHA256).DeriveKeyPair(viewSeed)`, KEM `0x0020`, as in
[HPKE, RFC 9180](https://www.rfc-editor.org/rfc/rfc9180.html) and
`src/hpke.js`. **It is not the same as using `viewSeed` directly as an
X25519 scalar.**

`PoseidonBytes` must be exactly the function in `src/poseidon.js` with the
constants in `src/poseidon-constants.js`, not any function called Poseidon.
The constants are exported in `test/fixtures/nzk-poseidon.json`, and the
SHA-256 of that file is pinned in `test/fixtures/nzk-vectors.json`.

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

External recovery needs this function and the publication and note
specifications as well; the KDF formula alone is not enough.

## 5. Receiving format and compatibility across families

The address format keeps **version 1**, independently of the **derivation
being version 2**:

```text
tag = first_4_bytes(SHA256(UTF8("NeuraiZK/v1/instance") || domain32 || assetId32))
payload = 0x01 || owner32 || viewPublic32 || tag4
```

The payload is 69 bytes, encoded as Bech32m with HRP `nzk`, `tnzk` or `rnzk`
depending on the network. The v1 instance tag is kept on purpose so that the
codec does not change. The existing checks on checksum, padding, owner and
X25519 key stay in place. The short tag catches common mistakes; it **does
not authenticate a pool**. Validate the full manifest, genesis and expected
commitment before operating.

The family is not published in the descriptor. A Legacy sender can assign
to a PQ or ECDSA recipient and the other way around, using the recipient's
private address. The sender does not derive the recipient's keys and does not
need the same family. Transparent addresses are still used for deposits and
withdrawals; on their own they do not contain the descriptor needed for a
private assignment.

A valid old descriptor does not reveal whether it was generated with v1 or
v2. Removing the v1 derivation therefore does not allow rejecting those
descriptors by their look, and it does not require invalidating their notes
in consensus.

### Interface identifiers (integration note)

The network names of jswallet and neurai-key do not always mean the same
thing. The current testnet integration uses this map, which should be kept as
a test in the wallet that adapts them:

| v2 family | Current jswallet selector | Signing/key network |
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
2. Get the instance's public manifest and check its network, domain, asset,
   commitment and verification keys. Keep a public record of the instances
   used: the words do not list every pool.
3. Derive receiving addresses on branch 0 with consecutive indexes. Change
   and self-deposits use branch 1, index 0 only. Do not rotate internal
   addresses until a recovery rule for them is specified.
4. Read the confirmed publication history from the pool birth, decrypt the
   wallet's notes and compare their nullifiers with the current state. Count
   notes that are already spent when deciding which indexes were used.
5. Rebuild the balance, the notes and the next index. Discard checkpoints
   affected by reorganizations; a local balance never replaces the canonical
   chain.

The receiving gap is 20 by default, configurable up to 1000. It does not
guarantee recovery of an arbitrarily distant index or of unknown accounts.
Keep metadata about accounts, pools and issued ranges, and offer an explicit
wider recovery. A scan cannot know which addresses were handed out but never
paid; losing that record can lead to address reuse.

The words regenerate keys, **not missing publications or lost ciphertexts**.
Availability and authenticity of that data are part of recovery. A JSON
backup can still be useful, but it should not be required when the chain,
its publications and the public parameters are enough. Identities created at
random without this derivation still need their own backup; never claim that
the words recover them.

## 7. Implementation and test vectors

Implementation: `src/zk-wallet.js`, `src/notes.js`, `src/hpke.js`,
`src/poseidon.js`, `src/poseidon-constants.js`, `src/checkpoint-crypto.js`.

Tests: `test/zk-wallet.test.js` with the vectors in
`test/fixtures/nzk-vectors.json`. They freeze S, R, PRK, Q, P, the spend
secret, the view seed, the viewing public key, owner, nk, fingerprint,
checkpoint key and address for the three families.

`scripts/check-nzk-v2.py` recomputes the vectors with argon2-cffi, hashlib
and cryptography, without importing the JavaScript implementation. Its
normal mode compares the result with the frozen constants; `--write` is an
explicit vector review action. Python is only a verification tool: the
library and the browser need neither Python nor a server to derive keys.
