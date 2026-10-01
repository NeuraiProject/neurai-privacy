/* Dedicated pool worker. Call startPoolWorker() from a Web Worker module; the
 * main thread talks to it with PoolWorkerClient or the raw message protocol:
 *
 *   in:  create {password} · restore {backup, password}
 *        derive {family, mnemonic, passphrase, zkPassphrase, account, gap?, issued?}
 *        scan {gap?, issued?} · new-address {force?} · prepare {request fields}
 *        rpc-result {id, result | error}
 *   out: stage {message} · rpc {id, method, params} · identity {recipient, backup, addresses}
 *        scan {result, recipient, addresses} · addresses {recipient, addresses}
 *        prepared {result} · done · error {message}
 *
 * Only public data leaves the worker. RPC calls go through the main thread,
 * which must forward read-only methods only (see isPoolReadRpc).
 */
import { validateC4Manifest } from './c4.js';
import { BrowserTestIdentity } from './browser-wallet.js';
import { ZkWalletIdentity } from './zk-wallet.js';
import { scanBrowserPool } from './browser-chain.js';
import { checkPoolCoin } from './pool-client.js';
import { C4_TESTNET_MANIFEST, C4_TESTNET_ARTIFACTS, C4_TESTNET_COMMITMENT, C4_TESTNET_NETWORK } from './c4-testnet.js';
import { summarizeScan, describeReceiving, buildC4Transaction, loadVerifiedArtifact, MAX_ARTIFACT_BYTES } from './pool-operations.js';

/**
 * Without `manifest`, the worker uses the bundled C4 TEST instance and its
 * pinned commitment. An application-supplied manifest needs its own
 * independently pinned `expectedCommitment`.
 */
export function startPoolWorker({ scope = globalThis, snarkjs, artifactBaseUrl, fetchArtifact, manifest,
  artifacts = C4_TESTNET_ARTIFACTS, network = C4_TESTNET_NETWORK, singleThread = true,
  missingArtifactMessage, depositLimitAtomic, expectedGenesis, expectedCommitment, maxArtifactBytes = MAX_ARTIFACT_BYTES } = {}) {
  if (!fetchArtifact && !artifactBaseUrl) throw new Error('startPoolWorker needs artifactBaseUrl or fetchArtifact');
  if (depositLimitAtomic !== undefined && (typeof depositLimitAtomic !== 'bigint' || depositLimitAtomic <= 0n)) {
    throw new Error('depositLimitAtomic must be a positive bigint');
  }
  if (manifest === undefined) {
    manifest = C4_TESTNET_MANIFEST;
    expectedCommitment ??= C4_TESTNET_COMMITMENT;
  }
  validateC4Manifest(manifest, { expectedGenesis, expectedCommitment });
  if (!Number.isSafeInteger(maxArtifactBytes) || maxArtifactBytes <= 0 || maxArtifactBytes > 256 * 1048576) {
    throw new Error('Artifact limit must be a positive integer of at most 256 MiB');
  }
  const missing = missingArtifactMessage ?? (artifactBaseUrl ? 'Pool proving parameters are not available at ' + artifactBaseUrl
    : 'Pool proving parameters are not available');
  const pool = { network, domain: manifest.domain, assetId: manifest.assetId };
  const fetcher = fetchArtifact ?? (path => fetch(new URL(path, artifactBaseUrl)));
  let identity = null;
  let scan = null;
  let active = false;
  let rpcId = 0;
  const calls = new Map();
  const post = message => scope.postMessage(message);
  const stage = message => post({ type: 'stage', message });
  const rpc = (method, params) => new Promise((resolve, reject) => {
    const id = ++rpcId;
    calls.set(id, { resolve, reject });
    post({ type: 'rpc', id, method, params });
  });
  const loadArtifact = path => {
    const name = path.split('/').slice(-1)[0];
    stage(`Loading ${name}`);
    return loadVerifiedArtifact({ path, artifacts, fetchArtifact: fetcher, missingMessage: missing, maxBytes: maxArtifactBytes,
      onProgress: percent => stage(`Loading ${name} · ${percent}%`) });
  };
  const receiving = () => describeReceiving(identity, scan, { network });
  const identityMessage = () => ({ type: 'identity', recipient: identity.recipient(), backup: identity.backupJson(), addresses: receiving() });

  async function refresh(encodedCheckpoint) {
    let previous = scan?.checkpoint;
    if (encodedCheckpoint) {
      try { previous = identity.openCheckpoint(encodedCheckpoint); }
      catch { previous = null; }
    }
    stage('Reading confirmed pool state');
    // Follows the pool state through the node spent index; one step per pool operation.
    scan = await scanBrowserPool({ rpc, manifest, identity, expectedGenesis, expectedCommitment, checkpoint: previous, onProgress: ({ height }) => stage(`Reading pool operation at block ${height}`) });
    let checkpoint = null;
    try { checkpoint = identity.sealCheckpoint(scan.checkpoint); }
    catch { /* A cache failure must never prevent a verified scan. */ }
    post({ type: 'scan', result: summarizeScan(scan), recipient: identity.recipient(), addresses: receiving(), checkpoint });
  }

  async function prepare(data) {
    if (!identity) throw new Error('Unlock the private wallet first');
    if (!snarkjs) throw new Error('This worker was started without snarkjs, so it cannot prove');
    await refresh();
    for (const coin of [data.sponsor, data.funding].filter(Boolean)) await checkPoolCoin(rpc, coin);
    const result = await buildC4Transaction({ identity, scan, manifest, artifacts, loadArtifact, snarkjs, pool,
      request: data, depositLimitAtomic, expectedGenesis, expectedCommitment, onStage: stage });
    post({ type: 'prepared', result });
  }

  scope.onmessage = async ({ data }) => {
    if (data?.type === 'rpc-result') {
      const call = calls.get(data.id);
      if (call) { calls.delete(data.id); data.error ? call.reject(new Error(data.error)) : call.resolve(data.result); }
      return;
    }
    if (active) return;
    active = true;
    try {
      if (singleThread) {
        // snarkjs would otherwise spawn one worker per core; verification has no singleThread option.
        Object.defineProperty(scope.navigator ?? {}, 'hardwareConcurrency', { value: 1, configurable: true });
        scope.Worker = undefined;
      }
      if (data.type === 'create' || data.type === 'restore') {
        identity?.lock(); identity = null; scan = null;
        stage(data.type === 'create' ? 'Encrypting new privacy JSON' : 'Unlocking privacy JSON');
        const options = { domain: manifest.domain, assetId: manifest.assetId, password: data.password };
        identity = data.type === 'create' ? await BrowserTestIdentity.create(options)
          : await BrowserTestIdentity.fromBackup({ ...options, backup: data.backup });
        post(identityMessage());
      } else if (data.type === 'derive') {
        identity?.lock(); identity = null; scan = null;
        stage('Deriving the private wallet from the wallet words');
        identity = await ZkWalletIdentity.fromMnemonic({ mnemonic: data.mnemonic, passphrase: data.passphrase ?? '',
          family: data.family, zkPassphrase: data.zkPassphrase ?? '', account: data.account, gap: data.gap, issued: data.issued, ...pool });
        post(identityMessage());
      } else if (data.type === 'scan') {
        if (!identity) throw new Error('Unlock the private wallet first');
        if (identity instanceof ZkWalletIdentity) {
          if (data.gap !== undefined) identity.setGap(data.gap);
          if (data.issued !== undefined) identity.setIssued(data.issued);
        }
        await refresh(data.checkpoint);
      } else if (data.type === 'new-address') {
        if (!(identity instanceof ZkWalletIdentity)) throw new Error('Only a wallet opened from its words can rotate addresses');
        identity.issueNext({ force: !!data.force });
        post({ type: 'addresses', recipient: identity.recipient(), addresses: receiving() });
      } else if (data.type === 'prepare') {
        await prepare(data);
      } else if (data.type === 'lock') {
        identity?.lock(); identity = null; scan = null;
      } else {
        throw new Error('Unknown worker request');
      }
      post({ type: 'done' });
    } catch (error) {
      post({ type: 'error', message: error instanceof Error ? error.message : String(error) });
    } finally {
      active = false;
    }
  };
  return { stop() { identity?.lock(); identity = null; scan = null; scope.onmessage = null; } };
}
