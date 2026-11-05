/* Proving artifacts pinned by size and SHA-256. No secrets. */
import { sha256 } from '@noble/hashes/sha2.js';

const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
/** Largest single artifact accepted by default. */
export const MAX_ARTIFACT_BYTES = 256 * 1048576;

/** Fetch one artifact and accept it only if its size and SHA-256 match the pin. */
export async function loadVerifiedArtifact({ path, artifacts, fetchArtifact, onProgress, maxBytes = MAX_ARTIFACT_BYTES,
  missingMessage = 'Pool proving parameters are not available' }) {
  const meta = artifacts.files[path];
  if (!meta || meta.bytes > maxBytes) throw new Error('Unsupported pool artifact');
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
  if (at !== bytes.length || hex(sha256(bytes)) !== meta.sha256) throw new Error('Pool artifact integrity mismatch');
  return bytes;
}
