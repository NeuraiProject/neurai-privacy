/** Explicit experimental C5 XNA builder. Never substitute C5 keys into C4. */
import { C4_FORMS, validateC4Manifest, prepareC4, c4ProofBytes, hex, unhex, cat, le, compact } from './c4.js';
import { encodeC5Transition, splitC5Transition } from './c5-transition.js';
export const C5_FORMS = Object.freeze([...C4_FORMS]);
const adapted = manifest => ({ ...manifest, schema: 'neurai-c4-xna-test-v1' });

function requireProfile2(script) {
  let at = 0, previous = null, calls = 0;
  while (at < script.length) {
    const op = script[at++]; let size = 0, item = null;
    if (op <= 75) size = op;
    else if (op === 76 || op === 77 || op === 78) {
      const width = op === 76 ? 1 : op === 77 ? 2 : 4;
      if (at + width > script.length) throw new Error('Truncated C5 leaf push');
      for (let i = 0; i < width; i++) size += script[at++] * 2 ** (8 * i);
    } else if (op >= 81 && op <= 96) item = Uint8Array.of(op - 80);
    if (op <= 78) {
      if (size > script.length - at) throw new Error('Truncated C5 leaf data');
      item = script.slice(at, at + size); at += size;
    }
    if (op === 0xc3) {
      if (previous?.length !== 1 || previous[0] !== 2) throw new Error('C5 leaf must pin ZK profile 2');
      calls++;
    }
    previous = item;
  }
  if (calls !== 1) throw new Error('C5 leaf must contain exactly one ZK verification');
}

/** A reviewed commitment pin is mandatory; this does not audit arbitrary scripts. */
export function validateC5Manifest(manifest, options) {
  if (manifest?.schema !== 'neurai-c5-xna-test-v1' || manifest.zkProfile !== 2) throw new Error('Explicit C5 profile-2 TEST manifest required');
  validateC4Manifest(adapted(manifest), options);
  for (const form of C5_FORMS) requireProfile2(unhex(manifest.forms[form].script));
  return manifest;
}
export function prepareC5(options) {
  const manifest = validateC5Manifest(options.manifest, options);
  // Private inputs and transaction rules retain the C4 encoding. Only public
  // updates move into the extra, independently verified C5 transcript.
  const prepared = prepareC4({ ...options, manifest: adapted(manifest) });
  const transition = encodeC5Transition(prepared.form, prepared.input);
  return { ...prepared, manifest, zkProfile: 2, transition, chunks: splitC5Transition(transition) };
}
export function finishC5(prepared, proof, publicSignals) {
  if (prepared.zkProfile !== 2 || prepared.manifest?.zkProfile !== 2) throw new Error('Prepared C5 profile required');
  if (JSON.stringify(publicSignals.map(String)) !== JSON.stringify(prepared.publicSignals)) throw new Error('Proof public inputs differ from the transaction');
  // Re-encode before serializing: a caller mutation must not silently change
  // public tree work independently of the prepared private/public inputs.
  const chunks = splitC5Transition(encodeC5Transition(prepared.form, prepared.input));
  const { form, inputs, outputs, template, manifest: m } = prepared, entry = m.forms[form];
  const args = prepared.blob ? [prepared.blob.slice(0, 2048), prepared.blob.slice(2048)] : [prepared.nf];
  const own = [unhex('10'), ...chunks, c4ProofBytes(proof), unhex(entry.vk), ...args, template.prevouts, unhex(entry.script), unhex(entry.control)];
  const witnesses = [own, ...(form === 'D0' ? [] : [[unhex('00'), unhex(m.guard)]]), ...(form[0] === 'D' ? [[]] : []), []];
  if (witnesses.length !== inputs.length) throw new Error('Witness count mismatch');
  const variable = b => cat(compact(b.length), b);
  return hex(cat(le(3, 4), unhex('0001'), compact(inputs.length), ...inputs.map(x => cat(unhex(x.txid).reverse(), le(x.vout, 4), le(0, 1), unhex('ffffffff'))), compact(outputs.length), template.outputs, le(0, 1), ...witnesses.map(w => cat(compact(w.length), ...w.map(variable))), le(0, 4)));
}
