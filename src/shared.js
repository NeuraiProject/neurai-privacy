export const RESET_TESTNET_GENESIS =
  '0000008b384aeffecdab182575dc4e86c9f07f90318c65088532660ed9a8a021';

export const HEX32 = /^[0-9a-f]{64}$/i;
export const FORMS = new Set(['D0', 'D1', 'T1', 'T2', 'W_partial', 'W_full']);
const MAX_MONEY_SATS = 2_100_000_000_000_000_000n;
const BN254_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

export function satoshiText(value, name) {
  if (typeof value !== 'bigint' && typeof value !== 'string') {
    throw new TypeError(name + ' must be a decimal string or bigint');
  }
  const text = String(value);
  if (!/^[1-9][0-9]*$/.test(text) || BigInt(text) > MAX_MONEY_SATS) {
    throw new RangeError(name + ' must be an exact positive XNA satoshi amount');
  }
  return text;
}

export function noteCmText(value) {
  if (typeof value !== 'bigint' && typeof value !== 'string') {
    throw new TypeError('noteCm must be a decimal string or bigint');
  }
  const text = String(value);
  if (!/^[1-9][0-9]*$/.test(text) || BigInt(text) >= BN254_FIELD) {
    throw new RangeError('noteCm must be a canonical BN254 field element');
  }
  return text;
}

export function balanceText(value, name) {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value) ||
      BigInt(value) > MAX_MONEY_SATS) {
    throw new Error('invalid or unsafe TEST wallet ' + name);
  }
  return BigInt(value);
}

export function nonempty(value, name) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(name + ' must be a nonempty string');
  }
  return value;
}

export function unit(value) {
  if (!Number.isSafeInteger(value) || ![1, 2].includes(value)) {
    throw new RangeError('TEST deposit amountUnits must be 1 or 2 atomic RWAX units');
  }
  return value;
}

export function descriptor(value) {
  if (!value || typeof value !== 'object' ||
      !HEX32.test(value.domain) || !HEX32.test(value.asset_id) ||
      !HEX32.test(value.owner) || !HEX32.test(value.view_pub)) {
    throw new TypeError('invalid TEST shielded recipient descriptor');
  }
  if (BigInt('0x' + value.owner) === 0n || BigInt('0x' + value.owner) >= BN254_FIELD) {
    throw new TypeError('noncanonical TEST shielded recipient owner');
  }
  return {
    domain: value.domain.toLowerCase(),
    asset_id: value.asset_id.toLowerCase(),
    owner: value.owner.toLowerCase(),
    view_pub: value.view_pub.toLowerCase()
  };
}
