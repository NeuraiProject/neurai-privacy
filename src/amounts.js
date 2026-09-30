/* Exact XNA amounts (8 decimals). No floating-point arithmetic on satoshis. */
export const ATOMIC_PER_XNA = 100000000n;
export const MAX_ATOMIC = 2_100_000_000_000_000_000n; // 21 billion XNA
const DECIMAL = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i;

/**
 * Convert an RPC coin value to satoshis. The node writes exact decimal text;
 * @neuraiproject/neurai-rpc returns a JS number only when String(number)
 * reproduces that text, and the text otherwise. Multiplying by 1e8 is not
 * exact (8999.86985 * 1e8 = 899986984999.9999), so parse the text instead.
 */
export function rpcAmountToSatoshis(value) {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Invalid RPC amount');
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string') throw new Error('Invalid RPC amount');
  const match = DECIMAL.exec(text);
  if (!match) throw new Error('Invalid RPC amount');
  const fraction = match[2] ?? '';
  const exponent = Number(match[3] ?? 0);
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) throw new Error('Invalid RPC amount');
  const digits = BigInt(match[1] + fraction);
  // Shortest JS formatting uses exponents for small values, for example 1e-7.
  const scale = 8 - fraction.length + exponent;
  let satoshis;
  if (scale >= 0) satoshis = digits * 10n ** BigInt(scale);
  else {
    const divisor = 10n ** BigInt(-scale);
    if (digits % divisor !== 0n) throw new Error('RPC amount has more than 8 decimals');
    satoshis = digits / divisor;
  }
  if (satoshis > MAX_ATOMIC) throw new Error('RPC amount out of range');
  return satoshis;
}

/** Parse user input such as "12.5" into satoshis: digits, at most 8 decimals, no exponent. */
export function parseXna(text, { allowZero = false } = {}) {
  const value = typeof text === 'string' ? text.trim() : '';
  const match = /^(\d+)(?:\.(\d{1,8}))?$/.exec(value);
  if (!match) throw new Error('Enter a decimal XNA amount with at most 8 decimal places');
  const satoshis = BigInt(match[1]) * ATOMIC_PER_XNA + BigInt((match[2] ?? '').padEnd(8, '0'));
  if (satoshis > MAX_ATOMIC) throw new Error('Amount is outside the supported range');
  if (!allowZero && satoshis === 0n) throw new Error('Amount must be greater than zero');
  return satoshis;
}

/** Format satoshis as XNA without trailing zeros, for example 1234500000n -> "12.345". */
export function formatXna(satoshis) {
  const value = BigInt(satoshis);
  if (value < 0n) return '-' + formatXna(-value);
  const whole = value / ATOMIC_PER_XNA;
  const fraction = (value % ATOMIC_PER_XNA).toString().padStart(8, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : String(whole);
}
