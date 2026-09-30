import { poolTxAnchor } from './pool-txhash.js';

const MAX_MONEY = 2_100_000_000_000_000_000n;
function bytes(hex, name) {
  if (typeof hex !== 'string' || hex.length % 2 || !/^[0-9a-f]*$/i.test(hex)) {
    throw new TypeError(`${name} must be even-length hex`);
  }
  return Uint8Array.from(hex.match(/../g) ?? [], pair => parseInt(pair, 16));
}
function concat(...parts) {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let at = 0;
  for (const part of parts) { result.set(part, at); at += part.length; }
  return result;
}
function u32(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) throw new RangeError('vout is not uint32');
  const result = new Uint8Array(4);
  new DataView(result.buffer).setUint32(0, value, true);
  return result;
}
function u64(value) {
  if ((typeof value !== 'bigint' && !(typeof value === 'string' && /^\d+$/.test(value))) ||
      BigInt(value) < 0n || BigInt(value) > MAX_MONEY) throw new RangeError('invalid atomic XNA value');
  const result = new Uint8Array(8);
  let remaining = BigInt(value);
  for (let i = 0; i < 8; i++) { result[i] = Number(remaining & 255n); remaining >>= 8n; }
  return result;
}
function compactSize(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) throw new RangeError('invalid script size');
  if (value < 253) return Uint8Array.of(value);
  if (value <= 0xffff) return Uint8Array.of(253, value & 255, value >>> 8);
  return concat(Uint8Array.of(254), u32(value));
}

/** Serialize the transparent transaction template only. Does not create a ZK proof or sign. */
export function serializePoolTemplate({ inputs, outputs }) {
  if (!Array.isArray(inputs) || !inputs.length || !Array.isArray(outputs) || !outputs.length) {
    throw new TypeError('nonempty pool inputs and outputs required');
  }
  const prevouts = concat(...inputs.map(({ txid, vout }) => {
    const hash = bytes(txid, 'txid');
    if (hash.length !== 32) throw new TypeError('txid must be 32 bytes');
    return concat(hash.reverse(), u32(vout));
  }));
  const serializedOutputs = concat(...outputs.map(({ valueSats, scriptHex }) => {
    const script = bytes(scriptHex, 'script');
    return concat(u64(valueSats), compactSize(script.length), script);
  }));
  const fields = { version: Uint8Array.of(3, 0, 0, 0), locktime: new Uint8Array(4),
    prevouts, sequences: new Uint8Array(inputs.length * 4).fill(255), outputs: serializedOutputs };
  return { ...fields, anchor: poolTxAnchor(fields) };
}
