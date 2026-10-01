/* Pool operations that handle private data. Run them inside a dedicated worker:
 * identities, notes, witnesses and proofs stay there. snarkjs (GPL-3.0) is
 * injected by the caller, so this package does not depend on it.
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { finishC3 } from './c3.js';
import { finishC4 } from './c4.js';
import { ZkWalletIdentity, encodeNzkAddress, parseRecipient } from './zk-wallet.js';
import { C3_TEST_DEPOSIT_LIMIT_ATOMIC } from './c3-testnet.js';
import { formatXna } from './amounts.js';

const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
export const MAX_ARTIFACT_BYTES = 150 * 1048576;

/** Public summary of a scan: balances, spendable notes and pool transitions. No secrets. */
export function summarizeScan(scan) {
  return {
    balanceAtomic: String(scan.balanceAtomic), reserveAtomic: String(scan.reserveAtomic), height: scan.height,
    notes: scan.notes.filter(n => !n.spent).map(n => ({ cm: n.cm, amountAtomic: String(n.amountAtomic), address: n.address ?? null })),
    transitions: scan.transitions.map(t => ({ txid: t.txid, form: t.form, height: t.height })),
  };
}

/**
 * Public receiving data of an identity: current nzk address, used receiving
 * addresses with the amount each received, and rotation state. For a file
 * identity there is a single address and no rotation.
 */
export function describeReceiving(identity, scan, { network }) {
  if (!(identity instanceof ZkWalletIdentity)) {
    return { kind: 'file', current: { index: 0, address: encodeNzkAddress(identity.recipient(), network) }, used: [] };
  }
  const received = new Map();
  for (const note of scan?.notes ?? []) {
    if (note.address?.chain === 0) received.set(note.address.index, (received.get(note.address.index) ?? 0n) + BigInt(note.amountAtomic));
  }
  const current = identity.currentIndex();
  return {
    kind: 'derived', derivation: identity.derivation, family: identity.family, storageId: identity.storageId, fingerprint: identity.fingerprint, account: identity.account, gap: identity.gap,
    issued: identity.issued, maxUsed: identity.maxUsed,
    current: { index: current, address: identity.addressAt(0, current) },
    used: identity.usedIndexes.map(index => ({ index, address: identity.addressAt(0, index), receivedAtomic: String(received.get(index) ?? 0n) })),
  };
}

const selfRecipient = identity => identity.selfRecipient?.() ?? identity.recipient();

/**
 * Choose the C3 form and the notes to create. Own notes (deposits, change)
 * go to the identity's change address. `recipient` is an nzk address or a
 * JSON descriptor; `note` is the commitment of the note to spend.
 */
export function planC3Operation({ identity, scan, action, amountAtomic, note, recipient, pool,
  depositLimitAtomic = C3_TEST_DEPOSIT_LIMIT_ATOMIC }) {
  if (!identity) throw new Error('Unlock the private wallet first');
  if (action === 'deposit') {
    const amount = BigInt(amountAtomic);
    if (amount <= 0n || amount > depositLimitAtomic) throw new Error(`Deposit must be more than 0 and at most ${formatXna(depositLimitAtomic)} XNA`);
    return { form: scan.reserveAtomic === 0n ? 'D0' : 'D1', created: [identity.createNote(selfRecipient(identity), String(amount))],
      consumed: undefined, amountAtomic: String(amount) };
  }
  const consumed = scan.notes.find(n => n.cm === note && !n.spent);
  if (!consumed) throw new Error('Selected note is no longer spendable');
  if (action === 'transfer') {
    const amount = BigInt(amountAtomic), total = BigInt(consumed.amountAtomic);
    if (amount <= 0n || amount > total) throw new Error('Amount exceeds the selected note');
    const created = [identity.createNote(parseRecipient(recipient, pool), String(amount))];
    if (amount < total) created.push(identity.createNote(selfRecipient(identity), String(total - amount)));
    return { form: created.length === 1 ? 'T1' : 'T2', created, consumed, amountAtomic: String(amount) };
  }
  if (action === 'withdraw') {
    return { form: BigInt(consumed.amountAtomic) === BigInt(scan.reserveAtomic) ? 'W_full' : 'W_partial', created: [],
      consumed, amountAtomic: String(consumed.amountAtomic) };
  }
  throw new Error('Unknown pool action');
}

/**
 * Fetch one public artifact and check its pinned size and SHA-256.
 * `fetchArtifact(path)` returns a fetch Response; streaming reports progress.
 */
export async function loadVerifiedArtifact({ path, artifacts, fetchArtifact, onProgress, maxBytes = MAX_ARTIFACT_BYTES,
  missingMessage = 'C3 TEST parameters are not available' }) {
  const meta = artifacts.files[path];
  if (!meta || meta.bytes > maxBytes) throw new Error('Unsupported C3 artifact');
  const response = await fetchArtifact(path);
  if (!response?.ok) throw new Error(missingMessage);
  const bytes = new Uint8Array(meta.bytes);
  let at = 0;
  if (response.body?.getReader) {
    const reader = response.body.getReader();
    let last = -1;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (at + value.length > bytes.length) throw new Error('Artifact exceeds pinned size');
      bytes.set(value, at); at += value.length;
      const percent = Math.floor(at / bytes.length * 20) * 5;
      if (percent !== last) { last = percent; onProgress?.(percent); }
    }
  } else {
    const whole = new Uint8Array(await response.arrayBuffer());
    if (whole.length > bytes.length) throw new Error('Artifact exceeds pinned size');
    bytes.set(whole); at = whole.length; onProgress?.(100);
  }
  if (at !== bytes.length || hex(sha256(bytes)) !== meta.sha256) throw new Error('C3 artifact integrity mismatch');
  return bytes;
}

/** Witness, Groth16 proof with one thread and local verification against the pinned VK. */
export async function proveC3({ form, prepared, artifacts, loadArtifact, snarkjs, onStage = () => {} }) {
  const entry = artifacts.forms[form];
  if (!entry) throw new Error('Unknown C3 form');
  const wasm = await loadArtifact(entry.wasm);
  const zkey = await loadArtifact(entry.zkey);
  const vk = JSON.parse(new TextDecoder().decode(await loadArtifact(entry.vk)));
  onStage('Calculating private witness');
  const witness = { type: 'mem' };
  await snarkjs.wtns.calculate(prepared.input, wasm, witness);
  onStage(`Generating ${form} proof locally · one thread`);
  const { proof, publicSignals } = await snarkjs.groth16.prove(zkey, witness, undefined, { singleThread: true });
  onStage('Verifying proof and transaction binding');
  if (!await snarkjs.groth16.verify(vk, publicSignals, proof)) throw new Error('Local proof verification failed');
  return { proof, publicSignals };
}

/**
 * Plan, prepare, prove and serialize one pool transaction. Funding and fee
 * inputs are left for the wallet to sign; the result contains no secrets.
 */
export async function buildC3Transaction({ identity, scan, manifest, artifacts, loadArtifact, snarkjs, pool, request,
  depositLimitAtomic, onStage = () => {} }) {
  const { action, amountAtomic, feeAtomic, funding, sponsor, payout, note, recipient } = request;
  const plan = planC3Operation({ identity, scan, action, amountAtomic, note, recipient, pool,
    ...(depositLimitAtomic === undefined ? {} : { depositLimitAtomic }) });
  onStage('Building note paths and transaction witness');
  const prepared = identity.prepareC3({ manifest, scan, form: plan.form, created: plan.created, consumed: plan.consumed,
    funding, sponsor, payout, feeAtomic });
  const { proof, publicSignals } = await proveC3({ form: plan.form, prepared, artifacts, loadArtifact, snarkjs, onStage });
  return { raw: finishC3(prepared, proof, publicSignals), form: plan.form, feeAtomic, stateOutpoint: scan.state.stateOutpoint,
    inputPoints: prepared.inputs.map(x => ({ txid: x.txid, vout: x.vout })), amountAtomic: plan.amountAtomic };
}

/** Plan a C4 transfer from one note to up to four notes, including change.
 * Recipients are private descriptors/nzk addresses, never transparent addresses.
 */
export function planC4Operation(options) {
  const { identity, scan, action, note, pool, recipients } = options;
  if (action !== 'transfer') return planC3Operation(options);
  if (!identity) throw new Error('Unlock the private wallet first');
  const consumed = scan.notes.find(n => n.cm === note && !n.spent);
  if (!consumed) throw new Error('Selected note is no longer spendable');
  const targets = recipients ?? [{ recipient: options.recipient, amountAtomic: options.amountAtomic }];
  if (!Array.isArray(targets) || targets.length < 1 || targets.length > 4) {
    throw new Error('C4 requires between one and four private recipients');
  }
  const validated = targets.map(target => {
    if (typeof target?.amountAtomic !== 'string' || !/^[1-9][0-9]*$/.test(target.amountAtomic)) {
      throw new Error('Recipient amounts must be exact positive atomic strings');
    }
    return { descriptor: parseRecipient(target.recipient, pool), amount: BigInt(target.amountAtomic) };
  });
  const amount = validated.reduce((sum, x) => sum + x.amount, 0n);
  const total = BigInt(consumed.amountAtomic);
  if (amount > total) throw new Error('Recipient total exceeds the selected note');
  if (amount < total && targets.length === 4) throw new Error('C4 supports at most four notes including change');
  const created = validated.map(x => identity.createNote(x.descriptor, String(x.amount)));
  if (amount < total) created.push(identity.createNote(selfRecipient(identity), String(total - amount)));
  return { form: `T${created.length}`, created, consumed, amountAtomic: String(amount) };
}

/** Build C4 with an independently pinned deployment; secrets remain in the worker. */
export async function buildC4Transaction({ identity, scan, manifest, artifacts, loadArtifact, snarkjs, pool, request,
  expectedGenesis, expectedCommitment, depositLimitAtomic, onStage = () => {} }) {
  const plan = planC4Operation({ identity, scan, pool, action: request.action,
    amountAtomic: request.amountAtomic, note: request.note, recipient: request.recipient, recipients: request.recipients,
    ...(depositLimitAtomic === undefined ? {} : { depositLimitAtomic }) });
  onStage('Building C4 note paths and transaction witness');
  const prepared = identity.prepareC4({ manifest, scan, form: plan.form, created: plan.created, consumed: plan.consumed,
    funding: request.funding, sponsor: request.sponsor, payout: request.payout, feeAtomic: request.feeAtomic,
    expectedGenesis, expectedCommitment });
  const { proof, publicSignals } = await proveC3({ form: plan.form, prepared, artifacts, loadArtifact, snarkjs, onStage });
  return { raw: finishC4(prepared, proof, publicSignals), form: plan.form, feeAtomic: request.feeAtomic,
    stateOutpoint: scan.state.stateOutpoint, inputPoints: prepared.inputs.map(x => ({ txid: x.txid, vout: x.vout })),
    amountAtomic: plan.amountAtomic };
}
