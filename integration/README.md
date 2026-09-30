# Live integration checks for neurai-privacy

These scripts exercise the library against a local Docker full node, a pinned
TEST pool manifest, public proving artifacts and an encrypted test wallet.
They need a Python wallet backend and a Python RPC bridge in a local source
checkout. The library's `CliTestBackend` starts the wallet CLI; the integration
configuration selects the RPC bridge and supplies its runtime paths.

| Script | Technical checks |
| --- | --- |
| `live-readonly.mjs` | Network and chain snapshot, notes, history, funding status, transaction status, encrypted backup and restore. It does not publish. |
| `live-flow.mjs` | One confirmed funding coin, deposit, two-recipient private transfer and two transparent withdrawals. It broadcasts and waits for confirmations; it does not mine. |
| `live-reorg.mjs` | Rollback and restoration of a known withdrawal on an isolated zero-peer Docker clone; checks that the prepared transaction can be republished on the disconnected branch. |

Build the integration image from the library root:

```sh
docker build -f Dockerfile.integration -t neurai-privacy-integration:test .
```

Mount the library, source checkout, artifacts and private wallet directory at
the same absolute paths inside the integration container and host. The prover
container launched through the host Docker daemon must be able to read them.
Run as the owner of the private wallet directory and with access to the Docker
socket. Set these variables before running a script:

| Variable | Value |
| --- | --- |
| `NEURAI_PRIVACY_REPOSITORY` | Source checkout used by the Python wallet backend. |
| `NEURAI_PRIVACY_SOURCE` | Source directory passed to the prover. |
| `NEURAI_PRIVACY_PROVER_CODE` | Python prover code directory. |
| `NEURAI_PRIVACY_ARTIFACTS` | Pinned public TEST manifest and proving artifacts. |
| `NEURAI_PRIVACY_MANIFEST_SHA256` | Expected SHA-256 of the public manifest. |
| `NEURAI_PRIVACY_NODE` | Local Docker node container name. |
| `NEURAI_PRIVACY_RPC_MODULE` | Importable Python module providing the RPC bridge class. |
| `NEURAI_PRIVACY_PYTHONPATH` | Python import path for the backend and RPC bridge. |
| `NEURAI_PRIVACY_PRIVATE_WORK` | Private directory containing `wallet/` and `password.test`; the spend flow also uses `bob/` and `password-bob.test`. |

The optional `NEURAI_PRIVACY_RPC_CLASS` defaults to `DockerRPC`, and
`NEURAI_PRIVACY_PYTHON` defaults to `python3`. Set
`NEURAI_PRIVACY_BACKEND_ENV_JSON` to a JSON object of any additional string
variables the installed Python backend needs, such as its circuit directory.
Passwords are read from files in the private directory, never from an
environment variable or command-line argument. Use directory mode 0700 and
password-file mode 0600.

Run `node integration/live-readonly.mjs` before the spend flow. Run
`node integration/live-flow.mjs` only after confirming that the node wallet
has suitable fee coins. A funding status of `ready: false` means that the
exact-value deposit input or a separate confirmed fee input is missing. The
flow creates an exact funding coin only when needed and waits for external
confirmation. It records public transaction IDs in `flow-journal.json` under
the private work directory so a delayed flow can resume.

Run `live-reorg.mjs` only against a Docker clone in network mode `none` with
zero peers, setting `NEURAI_PRIVACY_ALLOW_ISOLATED_REORG=1`. The script checks
those conditions before changing the chain and restores the original branch
in a `finally` block. It clears only the clone's mempool. All three checks
require the reset-testnet TEST pool and its pinned manifest. A transaction
rejected after the pool state changes must be rebuilt against the new root.
