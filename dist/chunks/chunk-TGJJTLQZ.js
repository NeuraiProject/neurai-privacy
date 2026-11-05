import {
  abytes,
  add,
  add3H,
  add3L,
  aexists,
  ahash,
  anumber,
  aoutput,
  asyncLoop,
  bytesToHex,
  c7Intent,
  checkOpts,
  clean,
  concatBytes,
  createHasher,
  createView,
  decodeField,
  encodeField,
  fromBig,
  hexToBytes,
  isBytes,
  kdfInputToBytes,
  nextTick,
  poseidonBytes,
  poseidonPermutation,
  readC7RawTransaction,
  rotr32H,
  rotr32L,
  rotrBH,
  rotrBL,
  rotrSH,
  rotrSL,
  rpcAmountToSatoshis,
  sha256,
  sha512,
  swap32IfBE,
  swap8IfBE,
  u32,
  u8,
  validateC7Deployment
} from "./chunk-WIDDQ5UR.js";

// node_modules/@noble/curves/utils.js
var abytes2 = (value, length, title) => abytes(value, length, title);
var anumber2 = anumber;
var bytesToHex2 = bytesToHex;
var concatBytes2 = (...arrays) => concatBytes(...arrays);
var hexToBytes2 = (hex11) => hexToBytes(hex11);
var isBytes2 = isBytes;
var _0n = /* @__PURE__ */ BigInt(0);
var _1n = /* @__PURE__ */ BigInt(1);
function abool(value, title = "") {
  if (typeof value !== "boolean") {
    const prefix = title && `"${title}" `;
    throw new TypeError(prefix + "expected boolean, got type=" + typeof value);
  }
  return value;
}
function abignumber(n) {
  if (typeof n === "bigint") {
    if (!isPosBig(n))
      throw new RangeError("positive bigint expected, got " + n);
  } else
    anumber2(n);
  return n;
}
function asafenumber(value, title = "") {
  if (typeof value !== "number") {
    const prefix = title && `"${title}" `;
    throw new TypeError(prefix + "expected number, got type=" + typeof value);
  }
  if (!Number.isSafeInteger(value)) {
    const prefix = title && `"${title}" `;
    throw new RangeError(prefix + "expected safe integer, got " + value);
  }
}
function hexToNumber(hex11) {
  if (typeof hex11 !== "string")
    throw new TypeError("hex string expected, got " + typeof hex11);
  return hex11 === "" ? _0n : BigInt("0x" + hex11);
}
function bytesToNumberBE(bytes5) {
  return hexToNumber(bytesToHex(bytes5));
}
function bytesToNumberLE(bytes5) {
  return hexToNumber(bytesToHex(copyBytes(abytes(bytes5)).reverse()));
}
function numberToBytesBE(n, len) {
  anumber(len);
  if (len === 0)
    throw new RangeError("zero length");
  n = abignumber(n);
  const hex11 = n.toString(16);
  if (hex11.length > len * 2)
    throw new RangeError("number too large");
  return hexToBytes(hex11.padStart(len * 2, "0"));
}
function numberToBytesLE(n, len) {
  return numberToBytesBE(n, len).reverse();
}
function equalBytes(a, b) {
  a = abytes2(a);
  b = abytes2(b);
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++)
    diff |= a[i] ^ b[i];
  return diff === 0;
}
function copyBytes(bytes5) {
  return Uint8Array.from(abytes2(bytes5));
}
function asciiToBytes(ascii) {
  if (typeof ascii !== "string")
    throw new TypeError("ascii string expected, got " + typeof ascii);
  return Uint8Array.from(ascii, (c, i) => {
    const charCode = c.charCodeAt(0);
    if (c.length !== 1 || charCode > 127) {
      throw new RangeError(`string contains non-ASCII character "${ascii[i]}" with code ${charCode} at position ${i}`);
    }
    return charCode;
  });
}
var isPosBig = (n) => typeof n === "bigint" && _0n <= n;
function inRange(n, min, max) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
function aInRange(title, n, min, max) {
  if (!inRange(n, min, max))
    throw new RangeError("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
function bitLen(n) {
  if (n < _0n)
    throw new Error("expected non-negative bigint, got " + n);
  let len;
  for (len = 0; n > _0n; n >>= _1n, len += 1)
    ;
  return len;
}
var bitMask = (n) => (_1n << BigInt(n)) - _1n;
function validateObject(object, fields = {}, optFields = {}) {
  if (Object.prototype.toString.call(object) !== "[object Object]")
    throw new TypeError("expected valid options object");
  function checkField(fieldName, expectedType, isOpt) {
    if (!isOpt && expectedType !== "function" && !Object.hasOwn(object, fieldName))
      throw new TypeError(`param "${fieldName}" is invalid: expected own property`);
    const val = object[fieldName];
    if (isOpt && val === void 0)
      return;
    const current = typeof val;
    if (current !== expectedType || val === null)
      throw new TypeError(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current}`);
  }
  const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
  iter(fields, false);
  iter(optFields, true);
}
var notImplemented = () => {
  throw new Error("not implemented");
};

// node_modules/@noble/curves/abstract/modular.js
var _0n2 = /* @__PURE__ */ BigInt(0);
var _1n2 = /* @__PURE__ */ BigInt(1);
var _2n = /* @__PURE__ */ BigInt(2);
var _3n = /* @__PURE__ */ BigInt(3);
var _4n = /* @__PURE__ */ BigInt(4);
var _5n = /* @__PURE__ */ BigInt(5);
var _7n = /* @__PURE__ */ BigInt(7);
var _8n = /* @__PURE__ */ BigInt(8);
var _9n = /* @__PURE__ */ BigInt(9);
var _16n = /* @__PURE__ */ BigInt(16);
function mod(a, b) {
  if (b <= _0n2)
    throw new Error("mod: expected positive modulus, got " + b);
  const result = a % b;
  return result >= _0n2 ? result : b + result;
}
function pow2(x, power, modulo) {
  if (power < _0n2)
    throw new Error("pow2: expected non-negative exponent, got " + power);
  let res = x;
  while (power-- > _0n2) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number, modulo) {
  if (number === _0n2)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _0n2)
    throw new Error("invert: expected positive modulus, got " + modulo);
  let a = mod(number, modulo);
  let b = modulo;
  let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
  while (a !== _0n2) {
    const q = b / a;
    const r = b - a * q;
    const m = x - u * q;
    const n = y - v * q;
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  const gcd2 = b;
  if (gcd2 !== _1n2)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function assertIsSquare(Fp2, root, n) {
  const F = Fp2;
  if (!F.eql(F.sqr(root), n))
    throw new Error("Cannot find square root");
}
function sqrt3mod4(Fp2, n) {
  const F = Fp2;
  const p1div4 = (F.ORDER + _1n2) / _4n;
  const root = F.pow(n, p1div4);
  assertIsSquare(F, root, n);
  return root;
}
function sqrt5mod8(Fp2, n) {
  const F = Fp2;
  const p5div8 = (F.ORDER - _5n) / _8n;
  const n2 = F.mul(n, _2n);
  const v = F.pow(n2, p5div8);
  const nv = F.mul(n, v);
  const i = F.mul(F.mul(nv, _2n), v);
  const root = F.mul(nv, F.sub(i, F.ONE));
  assertIsSquare(F, root, n);
  return root;
}
function sqrt9mod16(P2) {
  const Fp_ = Field(P2);
  const tn = tonelliShanks(P2);
  const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
  const c2 = tn(Fp_, c1);
  const c3 = tn(Fp_, Fp_.neg(c1));
  const c4 = (P2 + _7n) / _16n;
  return ((Fp2, n) => {
    const F = Fp2;
    let tv1 = F.pow(n, c4);
    let tv2 = F.mul(tv1, c1);
    const tv3 = F.mul(tv1, c2);
    const tv4 = F.mul(tv1, c3);
    const e1 = F.eql(F.sqr(tv2), n);
    const e2 = F.eql(F.sqr(tv3), n);
    tv1 = F.cmov(tv1, tv2, e1);
    tv2 = F.cmov(tv4, tv3, e2);
    const e3 = F.eql(F.sqr(tv2), n);
    const root = F.cmov(tv1, tv2, e3);
    assertIsSquare(F, root, n);
    return root;
  });
}
function tonelliShanks(P2) {
  if (P2 < _3n)
    throw new Error("sqrt is not defined for small field");
  let Q = P2 - _1n2;
  let S = 0;
  while (Q % _2n === _0n2) {
    Q /= _2n;
    S++;
  }
  let Z = _2n;
  const _Fp = Field(P2);
  while (FpLegendre(_Fp, Z) === 1) {
    if (Z++ > 1e3)
      throw new Error("Cannot find square root: probably non-prime P");
  }
  if (S === 1)
    return sqrt3mod4;
  let cc = _Fp.pow(Z, Q);
  const Q1div2 = (Q + _1n2) / _2n;
  return function tonelliSlow(Fp2, n) {
    const F = Fp2;
    if (F.is0(n))
      return n;
    if (FpLegendre(F, n) !== 1)
      throw new Error("Cannot find square root");
    let M = S;
    let c = F.mul(F.ONE, cc);
    let t = F.pow(n, Q);
    let R = F.pow(n, Q1div2);
    while (!F.eql(t, F.ONE)) {
      if (F.is0(t))
        return F.ZERO;
      let i = 1;
      let t_tmp = F.sqr(t);
      while (!F.eql(t_tmp, F.ONE)) {
        i++;
        t_tmp = F.sqr(t_tmp);
        if (i === M)
          throw new Error("Cannot find square root");
      }
      const exponent = _1n2 << BigInt(M - i - 1);
      const b = F.pow(c, exponent);
      M = i;
      c = F.sqr(b);
      t = F.mul(t, c);
      R = F.mul(R, b);
    }
    return R;
  };
}
function FpSqrt(P2) {
  if (P2 % _4n === _3n)
    return sqrt3mod4;
  if (P2 % _8n === _5n)
    return sqrt5mod8;
  if (P2 % _16n === _9n)
    return sqrt9mod16(P2);
  return tonelliShanks(P2);
}
var isNegativeLE = (num2, modulo) => (mod(num2, modulo) & _1n2) === _1n2;
var FIELD_FIELDS = [
  "create",
  "isValid",
  "is0",
  "neg",
  "inv",
  "sqrt",
  "sqr",
  "eql",
  "add",
  "sub",
  "mul",
  "pow",
  "div",
  "addN",
  "subN",
  "mulN",
  "sqrN"
];
function validateField(field) {
  const initial = {
    ORDER: "bigint",
    BYTES: "number",
    BITS: "number"
  };
  const opts = FIELD_FIELDS.reduce((map, val) => {
    map[val] = "function";
    return map;
  }, initial);
  validateObject(field, opts);
  asafenumber(field.BYTES, "BYTES");
  asafenumber(field.BITS, "BITS");
  if (field.BYTES < 1 || field.BITS < 1)
    throw new Error("invalid field: expected BYTES/BITS > 0");
  if (field.ORDER <= _1n2)
    throw new Error("invalid field: expected ORDER > 1, got " + field.ORDER);
  return field;
}
function FpPow(Fp2, num2, power) {
  const F = Fp2;
  if (power < _0n2)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n2)
    return F.ONE;
  if (power === _1n2)
    return num2;
  let p = F.ONE;
  let d = num2;
  while (power > _0n2) {
    if (power & _1n2)
      p = F.mul(p, d);
    d = F.sqr(d);
    power >>= _1n2;
  }
  return p;
}
function FpInvertBatch(Fp2, nums, passZero = false) {
  const F = Fp2;
  const inverted = new Array(nums.length).fill(passZero ? F.ZERO : void 0);
  const multipliedAcc = nums.reduce((acc, num2, i) => {
    if (F.is0(num2))
      return acc;
    inverted[i] = acc;
    return F.mul(acc, num2);
  }, F.ONE);
  const invertedAcc = F.inv(multipliedAcc);
  nums.reduceRight((acc, num2, i) => {
    if (F.is0(num2))
      return acc;
    inverted[i] = F.mul(acc, inverted[i]);
    return F.mul(acc, num2);
  }, invertedAcc);
  return inverted;
}
function FpLegendre(Fp2, n) {
  const F = Fp2;
  const p1mod2 = (F.ORDER - _1n2) / _2n;
  const powered = F.pow(n, p1mod2);
  const yes = F.eql(powered, F.ONE);
  const zero = F.eql(powered, F.ZERO);
  const no = F.eql(powered, F.neg(F.ONE));
  if (!yes && !zero && !no)
    throw new Error("invalid Legendre symbol result");
  return yes ? 1 : zero ? 0 : -1;
}
function nLength(n, nBitLength) {
  if (nBitLength !== void 0)
    anumber2(nBitLength);
  if (n <= _0n2)
    throw new Error("invalid n length: expected positive n, got " + n);
  if (nBitLength !== void 0 && nBitLength < 1)
    throw new Error("invalid n length: expected positive bit length, got " + nBitLength);
  const bits = bitLen(n);
  if (nBitLength !== void 0 && nBitLength < bits)
    throw new Error(`invalid n length: expected bit length (${bits}) >= n.length (${nBitLength})`);
  const _nBitLength = nBitLength !== void 0 ? nBitLength : bits;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}
var FIELD_SQRT = /* @__PURE__ */ new WeakMap();
var _Field = class {
  ORDER;
  BITS;
  BYTES;
  isLE;
  ZERO = _0n2;
  ONE = _1n2;
  _lengths;
  _mod;
  constructor(ORDER, opts = {}) {
    if (ORDER <= _1n2)
      throw new Error("invalid field: expected ORDER > 1, got " + ORDER);
    let _nbitLength = void 0;
    this.isLE = false;
    if (opts != null && typeof opts === "object") {
      if (typeof opts.BITS === "number")
        _nbitLength = opts.BITS;
      if (typeof opts.sqrt === "function")
        Object.defineProperty(this, "sqrt", { value: opts.sqrt, enumerable: true });
      if (typeof opts.isLE === "boolean")
        this.isLE = opts.isLE;
      if (opts.allowedLengths)
        this._lengths = Object.freeze(opts.allowedLengths.slice());
      if (typeof opts.modFromBytes === "boolean")
        this._mod = opts.modFromBytes;
    }
    const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
    if (nByteLength > 2048)
      throw new Error("invalid field: expected ORDER of <= 2048 bytes");
    this.ORDER = ORDER;
    this.BITS = nBitLength;
    this.BYTES = nByteLength;
    Object.freeze(this);
  }
  create(num2) {
    return mod(num2, this.ORDER);
  }
  isValid(num2) {
    if (typeof num2 !== "bigint")
      throw new TypeError("invalid field element: expected bigint, got " + typeof num2);
    return _0n2 <= num2 && num2 < this.ORDER;
  }
  is0(num2) {
    return num2 === _0n2;
  }
  // is valid and invertible
  isValidNot0(num2) {
    return !this.is0(num2) && this.isValid(num2);
  }
  isOdd(num2) {
    return (num2 & _1n2) === _1n2;
  }
  neg(num2) {
    return mod(-num2, this.ORDER);
  }
  eql(lhs, rhs) {
    return lhs === rhs;
  }
  sqr(num2) {
    return mod(num2 * num2, this.ORDER);
  }
  add(lhs, rhs) {
    return mod(lhs + rhs, this.ORDER);
  }
  sub(lhs, rhs) {
    return mod(lhs - rhs, this.ORDER);
  }
  mul(lhs, rhs) {
    return mod(lhs * rhs, this.ORDER);
  }
  pow(num2, power) {
    return FpPow(this, num2, power);
  }
  div(lhs, rhs) {
    return mod(lhs * invert(rhs, this.ORDER), this.ORDER);
  }
  // Same as above, but doesn't normalize
  sqrN(num2) {
    return num2 * num2;
  }
  addN(lhs, rhs) {
    return lhs + rhs;
  }
  subN(lhs, rhs) {
    return lhs - rhs;
  }
  mulN(lhs, rhs) {
    return lhs * rhs;
  }
  inv(num2) {
    return invert(num2, this.ORDER);
  }
  sqrt(num2) {
    let sqrt = FIELD_SQRT.get(this);
    if (!sqrt)
      FIELD_SQRT.set(this, sqrt = FpSqrt(this.ORDER));
    return sqrt(this, num2);
  }
  toBytes(num2) {
    return this.isLE ? numberToBytesLE(num2, this.BYTES) : numberToBytesBE(num2, this.BYTES);
  }
  fromBytes(bytes5, skipValidation = false) {
    abytes2(bytes5);
    const { _lengths: allowedLengths, BYTES, isLE: isLE2, ORDER, _mod: modFromBytes } = this;
    if (allowedLengths) {
      if (bytes5.length < 1 || !allowedLengths.includes(bytes5.length) || bytes5.length > BYTES) {
        throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes5.length);
      }
      const padded = new Uint8Array(BYTES);
      padded.set(bytes5, isLE2 ? 0 : padded.length - bytes5.length);
      bytes5 = padded;
    }
    if (bytes5.length !== BYTES)
      throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes5.length);
    let scalar = isLE2 ? bytesToNumberLE(bytes5) : bytesToNumberBE(bytes5);
    if (modFromBytes)
      scalar = mod(scalar, ORDER);
    if (!skipValidation) {
      if (!this.isValid(scalar))
        throw new Error("invalid field element: outside of range 0..ORDER");
    }
    return scalar;
  }
  // TODO: we don't need it here, move out to separate fn
  invertBatch(lst) {
    return FpInvertBatch(this, lst);
  }
  // We can't move this out because Fp6, Fp12 implement it
  // and it's unclear what to return in there.
  cmov(a, b, condition) {
    abool(condition, "condition");
    return condition ? b : a;
  }
};
Object.freeze(_Field.prototype);
function Field(ORDER, opts = {}) {
  return new _Field(ORDER, opts);
}

// node_modules/@noble/curves/abstract/curve.js
var _0n3 = /* @__PURE__ */ BigInt(0);
var _1n3 = /* @__PURE__ */ BigInt(1);
function negateCt(condition, item) {
  const neg = item.negate();
  return condition ? neg : item;
}
function normalizeZ(c, points) {
  const invertedZs = FpInvertBatch(c.Fp, points.map((p) => p.Z));
  return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
}
function validateW(W, bits) {
  if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
    throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
}
function calcWOpts(W, scalarBits) {
  validateW(W, scalarBits);
  const windows = Math.ceil(scalarBits / W) + 1;
  const windowSize = 2 ** (W - 1);
  const maxNumber = 2 ** W;
  const mask = bitMask(W);
  const shiftBy = BigInt(W);
  return { windows, windowSize, mask, maxNumber, shiftBy };
}
function calcOffsets(n, window, wOpts) {
  const { windowSize, mask, maxNumber, shiftBy } = wOpts;
  let wbits = Number(n & mask);
  let nextN = n >> shiftBy;
  if (wbits > windowSize) {
    wbits -= maxNumber;
    nextN += _1n3;
  }
  const offsetStart = window * windowSize;
  const offset = offsetStart + Math.abs(wbits) - 1;
  const isZero2 = wbits === 0;
  const isNeg = wbits < 0;
  const isNegF = window % 2 !== 0;
  const offsetF = offsetStart;
  return { nextN, offset, isZero: isZero2, isNeg, isNegF, offsetF };
}
var pointPrecomputes = /* @__PURE__ */ new WeakMap();
var pointWindowSizes = /* @__PURE__ */ new WeakMap();
function getW(P2) {
  return pointWindowSizes.get(P2) || 1;
}
function assert0(n) {
  if (n !== _0n3)
    throw new Error("invalid wNAF");
}
var wNAF = class {
  BASE;
  ZERO;
  Fn;
  bits;
  // Parametrized with a given Point class (not individual point)
  constructor(Point2, bits) {
    this.BASE = Point2.BASE;
    this.ZERO = Point2.ZERO;
    this.Fn = Point2.Fn;
    this.bits = bits;
  }
  // non-const time multiplication ladder
  _unsafeLadder(elm, n, p = this.ZERO) {
    let d = elm;
    while (n > _0n3) {
      if (n & _1n3)
        p = p.add(d);
      d = d.double();
      n >>= _1n3;
    }
    return p;
  }
  /**
   * Creates a wNAF precomputation window. Used for caching.
   * Default window size is set by `utils.precompute()` and is equal to 8.
   * Number of precomputed points depends on the curve size:
   * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
   * - 𝑊 is the window size
   * - 𝑛 is the bitlength of the curve order.
   * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
   * @param point - Point instance
   * @param W - window size
   * @returns precomputed point tables flattened to a single array
   */
  precomputeWindow(point2, W) {
    const { windows, windowSize } = calcWOpts(W, this.bits);
    const points = [];
    let p = point2;
    let base = p;
    for (let window = 0; window < windows; window++) {
      base = p;
      points.push(base);
      for (let i = 1; i < windowSize; i++) {
        base = base.add(p);
        points.push(base);
      }
      p = base.double();
    }
    return points;
  }
  /**
   * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
   * More compact implementation:
   * https://github.com/paulmillr/noble-secp256k1/blob/47cb1669b6e506ad66b35fe7d76132ae97465da2/index.ts#L502-L541
   * @returns real and fake (for const-time) points
   */
  wNAF(W, precomputes, n) {
    if (!this.Fn.isValid(n))
      throw new Error("invalid scalar");
    let p = this.ZERO;
    let f = this.BASE;
    const wo = calcWOpts(W, this.bits);
    for (let window = 0; window < wo.windows; window++) {
      const { nextN, offset, isZero: isZero2, isNeg, isNegF, offsetF } = calcOffsets(n, window, wo);
      n = nextN;
      if (isZero2) {
        f = f.add(negateCt(isNegF, precomputes[offsetF]));
      } else {
        p = p.add(negateCt(isNeg, precomputes[offset]));
      }
    }
    assert0(n);
    return { p, f };
  }
  /**
   * Implements unsafe EC multiplication using precomputed tables
   * and w-ary non-adjacent form.
   * @param acc - accumulator point to add result of multiplication
   * @returns point
   */
  wNAFUnsafe(W, precomputes, n, acc = this.ZERO) {
    const wo = calcWOpts(W, this.bits);
    for (let window = 0; window < wo.windows; window++) {
      if (n === _0n3)
        break;
      const { nextN, offset, isZero: isZero2, isNeg } = calcOffsets(n, window, wo);
      n = nextN;
      if (isZero2) {
        continue;
      } else {
        const item = precomputes[offset];
        acc = acc.add(isNeg ? item.negate() : item);
      }
    }
    assert0(n);
    return acc;
  }
  getPrecomputes(W, point2, transform) {
    let comp = pointPrecomputes.get(point2);
    if (!comp) {
      comp = this.precomputeWindow(point2, W);
      if (W !== 1) {
        if (typeof transform === "function")
          comp = transform(comp);
        pointPrecomputes.set(point2, comp);
      }
    }
    return comp;
  }
  cached(point2, scalar, transform) {
    const W = getW(point2);
    return this.wNAF(W, this.getPrecomputes(W, point2, transform), scalar);
  }
  unsafe(point2, scalar, transform, prev) {
    const W = getW(point2);
    if (W === 1)
      return this._unsafeLadder(point2, scalar, prev);
    return this.wNAFUnsafe(W, this.getPrecomputes(W, point2, transform), scalar, prev);
  }
  // We calculate precomputes for elliptic curve point multiplication
  // using windowed method. This specifies window size and
  // stores precomputed values. Usually only base point would be precomputed.
  createCache(P2, W) {
    validateW(W, this.bits);
    pointWindowSizes.set(P2, W);
    pointPrecomputes.delete(P2);
  }
  hasCache(elm) {
    return getW(elm) !== 1;
  }
};
function createField(order, field, isLE2) {
  if (field) {
    if (field.ORDER !== order)
      throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
    validateField(field);
    return field;
  } else {
    return Field(order, { isLE: isLE2 });
  }
}
function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
  if (FpFnLE === void 0)
    FpFnLE = type === "edwards";
  if (!CURVE || typeof CURVE !== "object")
    throw new Error(`expected valid ${type} CURVE object`);
  for (const p of ["p", "n", "h"]) {
    const val = CURVE[p];
    if (!(typeof val === "bigint" && val > _0n3))
      throw new Error(`CURVE.${p} must be positive bigint`);
  }
  const Fp2 = createField(CURVE.p, curveOpts.Fp, FpFnLE);
  const Fn2 = createField(CURVE.n, curveOpts.Fn, FpFnLE);
  const _b = type === "weierstrass" ? "b" : "d";
  const params = ["Gx", "Gy", "a", _b];
  for (const p of params) {
    if (!Fp2.isValid(CURVE[p]))
      throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
  }
  CURVE = Object.freeze(Object.assign({}, CURVE));
  return { CURVE, Fp: Fp2, Fn: Fn2 };
}

// node_modules/@noble/curves/abstract/edwards.js
var _0n4 = /* @__PURE__ */ BigInt(0);
var _1n4 = /* @__PURE__ */ BigInt(1);
var _2n2 = /* @__PURE__ */ BigInt(2);
var _8n2 = /* @__PURE__ */ BigInt(8);
function isEdValidXY(Fp2, CURVE, x, y) {
  const x2 = Fp2.sqr(x);
  const y2 = Fp2.sqr(y);
  const left = Fp2.add(Fp2.mul(CURVE.a, x2), y2);
  const right = Fp2.add(Fp2.ONE, Fp2.mul(CURVE.d, Fp2.mul(x2, y2)));
  return Fp2.eql(left, right);
}
function edwards(params, extraOpts = {}) {
  const opts = extraOpts;
  const validated = createCurveFields("edwards", params, opts, opts.FpFnLE);
  const { Fp: Fp2, Fn: Fn2 } = validated;
  let CURVE = validated.CURVE;
  const { h: cofactor } = CURVE;
  validateObject(opts, {}, { uvRatio: "function" });
  const MASK = _2n2 << BigInt(Fn2.BYTES * 8) - _1n4;
  const modP = (n) => Fp2.create(n);
  const uvRatio2 = opts.uvRatio === void 0 ? (u, v) => {
    try {
      return { isValid: true, value: Fp2.sqrt(Fp2.div(u, v)) };
    } catch (e) {
      return { isValid: false, value: _0n4 };
    }
  } : opts.uvRatio;
  if (!isEdValidXY(Fp2, CURVE, CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  function acoord(title, n, banZero = false) {
    const min = banZero ? _1n4 : _0n4;
    aInRange("coordinate " + title, n, min, MASK);
    return n;
  }
  function aedpoint(other) {
    if (!(other instanceof Point2))
      throw new Error("EdwardsPoint expected");
  }
  class Point2 {
    // base / generator point
    static BASE = new Point2(CURVE.Gx, CURVE.Gy, _1n4, modP(CURVE.Gx * CURVE.Gy));
    // zero / infinity / identity point
    static ZERO = new Point2(_0n4, _1n4, _1n4, _0n4);
    // 0, 1, 1, 0
    // math field
    static Fp = Fp2;
    // scalar field
    static Fn = Fn2;
    X;
    Y;
    Z;
    T;
    constructor(X, Y, Z, T) {
      this.X = acoord("x", X);
      this.Y = acoord("y", Y);
      this.Z = acoord("z", Z, true);
      this.T = acoord("t", T);
      Object.freeze(this);
    }
    static CURVE() {
      return CURVE;
    }
    /**
     * Create one extended Edwards point from affine coordinates.
     * Does NOT validate that the point is on-curve or torsion-free.
     * Use `.assertValidity()` on adversarial inputs.
     */
    static fromAffine(p) {
      if (p instanceof Point2)
        throw new Error("extended point not allowed");
      const { x, y } = p || {};
      acoord("x", x);
      acoord("y", y);
      return new Point2(x, y, _1n4, modP(x * y));
    }
    // Uses algo from RFC8032 5.1.3.
    static fromBytes(bytes5, zip215 = false) {
      const len = Fp2.BYTES;
      const { a, d } = CURVE;
      bytes5 = copyBytes(abytes2(bytes5, len, "point"));
      abool(zip215, "zip215");
      const normed = copyBytes(bytes5);
      const lastByte = bytes5[len - 1];
      normed[len - 1] = lastByte & ~128;
      const y = bytesToNumberLE(normed);
      const max = zip215 ? MASK : Fp2.ORDER;
      aInRange("point.y", y, _0n4, max);
      const y2 = modP(y * y);
      const u = modP(y2 - _1n4);
      const v = modP(d * y2 - a);
      let { isValid, value: x } = uvRatio2(u, v);
      if (!isValid)
        throw new Error("bad point: invalid y coordinate");
      const isXOdd = (x & _1n4) === _1n4;
      const isLastByteOdd = (lastByte & 128) !== 0;
      if (!zip215 && x === _0n4 && isLastByteOdd)
        throw new Error("bad point: x=0 and x_0=1");
      if (isLastByteOdd !== isXOdd)
        x = modP(-x);
      return Point2.fromAffine({ x, y });
    }
    static fromHex(hex11, zip215 = false) {
      return Point2.fromBytes(hexToBytes2(hex11), zip215);
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    precompute(windowSize = 8, isLazy = true) {
      wnaf.createCache(this, windowSize);
      if (!isLazy)
        this.multiply(_2n2);
      return this;
    }
    // Useful in fromAffine() - not for fromBytes(), which always created valid points.
    assertValidity() {
      const p = this;
      const { a, d } = CURVE;
      if (p.is0())
        throw new Error("bad point: ZERO");
      const { X, Y, Z, T } = p;
      const X2 = modP(X * X);
      const Y2 = modP(Y * Y);
      const Z2 = modP(Z * Z);
      const Z4 = modP(Z2 * Z2);
      const aX2 = modP(X2 * a);
      const left = modP(Z2 * modP(aX2 + Y2));
      const right = modP(Z4 + modP(d * modP(X2 * Y2)));
      if (left !== right)
        throw new Error("bad point: equation left != right (1)");
      const XY = modP(X * Y);
      const ZT = modP(Z * T);
      if (XY !== ZT)
        throw new Error("bad point: equation left != right (2)");
    }
    // Compare one point to another.
    equals(other) {
      aedpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      const X1Z2 = modP(X1 * Z2);
      const X2Z1 = modP(X2 * Z1);
      const Y1Z2 = modP(Y1 * Z2);
      const Y2Z1 = modP(Y2 * Z1);
      return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
    }
    is0() {
      return this.equals(Point2.ZERO);
    }
    negate() {
      return new Point2(modP(-this.X), this.Y, this.Z, modP(-this.T));
    }
    // Fast algo for doubling Extended Point.
    // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#doubling-dbl-2008-hwcd
    // Cost: 4M + 4S + 1*a + 6add + 1*2.
    double() {
      const { a } = CURVE;
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const A = modP(X1 * X1);
      const B = modP(Y1 * Y1);
      const C = modP(_2n2 * modP(Z1 * Z1));
      const D = modP(a * A);
      const x1y1 = X1 + Y1;
      const E = modP(modP(x1y1 * x1y1) - A - B);
      const G2 = D + B;
      const F = G2 - C;
      const H = D - B;
      const X3 = modP(E * F);
      const Y3 = modP(G2 * H);
      const T3 = modP(E * H);
      const Z3 = modP(F * G2);
      return new Point2(X3, Y3, Z3, T3);
    }
    // Fast algo for adding 2 Extended Points.
    // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#addition-add-2008-hwcd
    // Cost: 9M + 1*a + 1*d + 7add.
    add(other) {
      aedpoint(other);
      const { a, d } = CURVE;
      const { X: X1, Y: Y1, Z: Z1, T: T1 } = this;
      const { X: X2, Y: Y2, Z: Z2, T: T2 } = other;
      const A = modP(X1 * X2);
      const B = modP(Y1 * Y2);
      const C = modP(T1 * d * T2);
      const D = modP(Z1 * Z2);
      const E = modP((X1 + Y1) * (X2 + Y2) - A - B);
      const F = D - C;
      const G2 = D + C;
      const H = modP(B - a * A);
      const X3 = modP(E * F);
      const Y3 = modP(G2 * H);
      const T3 = modP(E * H);
      const Z3 = modP(F * G2);
      return new Point2(X3, Y3, Z3, T3);
    }
    subtract(other) {
      aedpoint(other);
      return this.add(other.negate());
    }
    // Constant-time multiplication.
    multiply(scalar) {
      if (!Fn2.isValidNot0(scalar))
        throw new RangeError("invalid scalar: expected 1 <= sc < curve.n");
      const { p, f } = wnaf.cached(this, scalar, (p2) => normalizeZ(Point2, p2));
      return normalizeZ(Point2, [p, f])[0];
    }
    // Non-constant-time multiplication. Uses double-and-add algorithm.
    // It's faster, but should only be used when you don't care about
    // an exposed private key e.g. sig verification.
    // Keeps the same subgroup-scalar contract: 0 is allowed for public-scalar callers, but
    // n and larger values are rejected instead of being reduced mod n to the identity point.
    multiplyUnsafe(scalar) {
      if (!Fn2.isValid(scalar))
        throw new RangeError("invalid scalar: expected 0 <= sc < curve.n");
      if (scalar === _0n4)
        return Point2.ZERO;
      if (this.is0() || scalar === _1n4)
        return this;
      return wnaf.unsafe(this, scalar, (p) => normalizeZ(Point2, p));
    }
    // Checks if point is of small order.
    // If you add something to small order point, you will have "dirty"
    // point with torsion component.
    // Clears cofactor and checks if the result is 0.
    isSmallOrder() {
      return this.clearCofactor().is0();
    }
    // Multiplies point by curve order and checks if the result is 0.
    // Returns `false` is the point is dirty.
    isTorsionFree() {
      return wnaf.unsafe(this, CURVE.n).is0();
    }
    // Converts Extended point to default (x, y) coordinates.
    // Can accept precomputed Z^-1 - for example, from invertBatch.
    toAffine(invertedZ) {
      const p = this;
      let iz = invertedZ;
      const { X, Y, Z } = p;
      const is0 = p.is0();
      if (iz == null)
        iz = is0 ? _8n2 : Fp2.inv(Z);
      const x = modP(X * iz);
      const y = modP(Y * iz);
      const zz = Fp2.mul(Z, iz);
      if (is0)
        return { x: _0n4, y: _1n4 };
      if (zz !== _1n4)
        throw new Error("invZ was invalid");
      return { x, y };
    }
    clearCofactor() {
      if (cofactor === _1n4)
        return this;
      return this.multiplyUnsafe(cofactor);
    }
    toBytes() {
      const { x, y } = this.toAffine();
      const bytes5 = Fp2.toBytes(y);
      bytes5[bytes5.length - 1] |= x & _1n4 ? 128 : 0;
      return bytes5;
    }
    toHex() {
      return bytesToHex2(this.toBytes());
    }
    toString() {
      return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
    }
  }
  const wnaf = new wNAF(Point2, Fn2.BITS);
  if (Fn2.BITS >= 8)
    Point2.BASE.precompute(8);
  Object.freeze(Point2.prototype);
  Object.freeze(Point2);
  return Point2;
}
var PrimeEdwardsPoint = class {
  static BASE;
  static ZERO;
  static Fp;
  static Fn;
  ep;
  /**
   * Wrap one internal Edwards representative directly.
   * This is not a canonical encoding boundary: alternate Edwards
   * representatives may still describe the same abstract wrapper element.
   */
  constructor(ep) {
    this.ep = ep;
  }
  // Static methods that must be implemented by subclasses
  static fromBytes(_bytes) {
    notImplemented();
  }
  static fromHex(_hex) {
    notImplemented();
  }
  get x() {
    return this.toAffine().x;
  }
  get y() {
    return this.toAffine().y;
  }
  // Common implementations
  clearCofactor() {
    return this;
  }
  assertValidity() {
    this.ep.assertValidity();
  }
  /**
   * Return affine coordinates of the current internal Edwards representative.
   * This is a convenience helper, not a canonical Ristretto/Decaf encoding.
   * Equal abstract elements may expose different `x` / `y`; use
   * `toBytes()` / `fromBytes()` for canonical roundtrips.
   */
  toAffine(invertedZ) {
    return this.ep.toAffine(invertedZ);
  }
  toHex() {
    return bytesToHex2(this.toBytes());
  }
  toString() {
    return this.toHex();
  }
  isTorsionFree() {
    return true;
  }
  isSmallOrder() {
    return false;
  }
  add(other) {
    this.assertSame(other);
    return this.init(this.ep.add(other.ep));
  }
  subtract(other) {
    this.assertSame(other);
    return this.init(this.ep.subtract(other.ep));
  }
  multiply(scalar) {
    return this.init(this.ep.multiply(scalar));
  }
  multiplyUnsafe(scalar) {
    return this.init(this.ep.multiplyUnsafe(scalar));
  }
  double() {
    return this.init(this.ep.double());
  }
  negate() {
    return this.init(this.ep.negate());
  }
  precompute(windowSize, isLazy) {
    this.ep.precompute(windowSize, isLazy);
    return this;
  }
};

// node_modules/@noble/curves/abstract/hash-to-curve.js
function i2osp(value, length) {
  asafenumber(value);
  asafenumber(length);
  if (length < 0 || length > 4)
    throw new Error("invalid I2OSP length: " + length);
  if (value < 0 || value > 2 ** (8 * length) - 1)
    throw new Error("invalid I2OSP input: " + value);
  const res = Array.from({ length }).fill(0);
  for (let i = length - 1; i >= 0; i--) {
    res[i] = value & 255;
    value >>>= 8;
  }
  return new Uint8Array(res);
}
function strxor(a, b) {
  const arr = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    arr[i] = a[i] ^ b[i];
  }
  return arr;
}
function normDST(DST) {
  if (!isBytes2(DST) && typeof DST !== "string")
    throw new Error("DST must be Uint8Array or ascii string");
  const dst = typeof DST === "string" ? asciiToBytes(DST) : DST;
  if (dst.length === 0)
    throw new Error("DST must be non-empty");
  return dst;
}
function expand_message_xmd(msg, DST, lenInBytes, H) {
  abytes2(msg);
  asafenumber(lenInBytes);
  DST = normDST(DST);
  if (DST.length > 255)
    DST = H(concatBytes2(asciiToBytes("H2C-OVERSIZE-DST-"), DST));
  const { outputLen: b_in_bytes, blockLen: r_in_bytes } = H;
  const ell = Math.ceil(lenInBytes / b_in_bytes);
  if (lenInBytes > 65535 || ell > 255)
    throw new Error("expand_message_xmd: invalid lenInBytes");
  const DST_prime = concatBytes2(DST, i2osp(DST.length, 1));
  const Z_pad = new Uint8Array(r_in_bytes);
  const l_i_b_str = i2osp(lenInBytes, 2);
  const b = new Array(ell);
  const b_0 = H(concatBytes2(Z_pad, msg, l_i_b_str, i2osp(0, 1), DST_prime));
  b[0] = H(concatBytes2(b_0, i2osp(1, 1), DST_prime));
  for (let i = 1; i < ell; i++) {
    const args = [strxor(b_0, b[i - 1]), i2osp(i + 1, 1), DST_prime];
    b[i] = H(concatBytes2(...args));
  }
  const pseudo_random_bytes = concatBytes2(...b);
  return pseudo_random_bytes.slice(0, lenInBytes);
}
var _DST_scalar = "HashToScalar-";

// node_modules/@noble/curves/ed25519.js
var _0n5 = /* @__PURE__ */ BigInt(0);
var _1n5 = /* @__PURE__ */ BigInt(1);
var _2n3 = /* @__PURE__ */ BigInt(2);
var _5n2 = /* @__PURE__ */ BigInt(5);
var _8n3 = /* @__PURE__ */ BigInt(8);
var ed25519_CURVE_p = /* @__PURE__ */ BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed");
var ed25519_CURVE = /* @__PURE__ */ (() => ({
  p: ed25519_CURVE_p,
  n: BigInt("0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed"),
  h: _8n3,
  a: BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec"),
  d: BigInt("0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3"),
  Gx: BigInt("0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a"),
  Gy: BigInt("0x6666666666666666666666666666666666666666666666666666666666666658")
}))();
function ed25519_pow_2_252_3(x) {
  const _10n = BigInt(10), _20n = BigInt(20), _40n = BigInt(40), _80n = BigInt(80);
  const P2 = ed25519_CURVE_p;
  const x2 = x * x % P2;
  const b2 = x2 * x % P2;
  const b4 = pow2(b2, _2n3, P2) * b2 % P2;
  const b5 = pow2(b4, _1n5, P2) * x % P2;
  const b10 = pow2(b5, _5n2, P2) * b5 % P2;
  const b20 = pow2(b10, _10n, P2) * b10 % P2;
  const b40 = pow2(b20, _20n, P2) * b20 % P2;
  const b80 = pow2(b40, _40n, P2) * b40 % P2;
  const b160 = pow2(b80, _80n, P2) * b80 % P2;
  const b240 = pow2(b160, _80n, P2) * b80 % P2;
  const b250 = pow2(b240, _10n, P2) * b10 % P2;
  const pow_p_5_8 = pow2(b250, _2n3, P2) * x % P2;
  return { pow_p_5_8, b2 };
}
var ED25519_SQRT_M1 = /* @__PURE__ */ BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752");
function uvRatio(u, v) {
  const P2 = ed25519_CURVE_p;
  const v3 = mod(v * v * v, P2);
  const v7 = mod(v3 * v3 * v, P2);
  const pow = ed25519_pow_2_252_3(u * v7).pow_p_5_8;
  let x = mod(u * v3 * pow, P2);
  const vx2 = mod(v * x * x, P2);
  const root1 = x;
  const root2 = mod(x * ED25519_SQRT_M1, P2);
  const useRoot1 = vx2 === u;
  const useRoot2 = vx2 === mod(-u, P2);
  const noRoot = vx2 === mod(-u * ED25519_SQRT_M1, P2);
  if (useRoot1)
    x = root1;
  if (useRoot2 || noRoot)
    x = root2;
  if (isNegativeLE(x, P2))
    x = mod(-x, P2);
  return { isValid: useRoot1 || useRoot2, value: x };
}
var ed25519_Point = /* @__PURE__ */ edwards(ed25519_CURVE, { uvRatio });
var Fp = /* @__PURE__ */ (() => ed25519_Point.Fp)();
var Fn = /* @__PURE__ */ (() => ed25519_Point.Fn)();
var SQRT_M1 = ED25519_SQRT_M1;
var SQRT_AD_MINUS_ONE = /* @__PURE__ */ BigInt("25063068953384623474111414158702152701244531502492656460079210482610430750235");
var INVSQRT_A_MINUS_D = /* @__PURE__ */ BigInt("54469307008909316920995813868745141605393597292927456921205312896311721017578");
var ONE_MINUS_D_SQ = /* @__PURE__ */ BigInt("1159843021668779879193775521855586647937357759715417654439879720876111806838");
var D_MINUS_ONE_SQ = /* @__PURE__ */ BigInt("40440834346308536858101042469323190826248399146238708352240133220865137265952");
var invertSqrt = (number) => uvRatio(_1n5, number);
var MAX_255B = /* @__PURE__ */ BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
var bytes255ToNumberLE = (bytes5) => Fp.create(bytesToNumberLE(bytes5) & MAX_255B);
function calcElligatorRistrettoMap(r0) {
  const { d } = ed25519_CURVE;
  const P2 = ed25519_CURVE_p;
  const mod3 = (n) => Fp.create(n);
  const r = mod3(SQRT_M1 * r0 * r0);
  const Ns = mod3((r + _1n5) * ONE_MINUS_D_SQ);
  let c = BigInt(-1);
  const D = mod3((c - d * r) * mod3(r + d));
  let { isValid: Ns_D_is_sq, value: s } = uvRatio(Ns, D);
  let s_ = mod3(s * r0);
  if (!isNegativeLE(s_, P2))
    s_ = mod3(-s_);
  if (!Ns_D_is_sq)
    s = s_;
  if (!Ns_D_is_sq)
    c = r;
  const Nt = mod3(c * (r - _1n5) * D_MINUS_ONE_SQ - D);
  const s2 = s * s;
  const W0 = mod3((s + s) * D);
  const W1 = mod3(Nt * SQRT_AD_MINUS_ONE);
  const W2 = mod3(_1n5 - s2);
  const W3 = mod3(_1n5 + s2);
  return new ed25519_Point(mod3(W0 * W3), mod3(W2 * W1), mod3(W1 * W3), mod3(W0 * W2));
}
var _RistrettoPoint = class __RistrettoPoint extends PrimeEdwardsPoint {
  // Do NOT change syntax: the following gymnastics is done,
  // because typescript strips comments, which makes bundlers disable tree-shaking.
  // prettier-ignore
  static BASE = /* @__PURE__ */ (() => new __RistrettoPoint(ed25519_Point.BASE))();
  // prettier-ignore
  static ZERO = /* @__PURE__ */ (() => new __RistrettoPoint(ed25519_Point.ZERO))();
  // prettier-ignore
  static Fp = /* @__PURE__ */ (() => Fp)();
  // prettier-ignore
  static Fn = /* @__PURE__ */ (() => Fn)();
  constructor(ep) {
    super(ep);
  }
  /**
   * Create one Ristretto255 point from affine Edwards coordinates.
   * This wraps the internal Edwards representative directly and is not a
   * canonical ristretto255 decoding path.
   * Use `toBytes()` / `fromBytes()` if canonical ristretto255 bytes matter.
   */
  static fromAffine(ap) {
    return new __RistrettoPoint(ed25519_Point.fromAffine(ap));
  }
  assertSame(other) {
    if (!(other instanceof __RistrettoPoint))
      throw new Error("RistrettoPoint expected");
  }
  init(ep) {
    return new __RistrettoPoint(ep);
  }
  static fromBytes(bytes5) {
    abytes(bytes5, 32);
    const { a, d } = ed25519_CURVE;
    const P2 = ed25519_CURVE_p;
    const mod3 = (n) => Fp.create(n);
    const s = bytes255ToNumberLE(bytes5);
    if (!equalBytes(Fp.toBytes(s), bytes5) || isNegativeLE(s, P2))
      throw new Error("invalid ristretto255 encoding 1");
    const s2 = mod3(s * s);
    const u1 = mod3(_1n5 + a * s2);
    const u2 = mod3(_1n5 - a * s2);
    const u1_2 = mod3(u1 * u1);
    const u2_2 = mod3(u2 * u2);
    const v = mod3(a * d * u1_2 - u2_2);
    const { isValid, value: I } = invertSqrt(mod3(v * u2_2));
    const Dx = mod3(I * u2);
    const Dy = mod3(I * Dx * v);
    let x = mod3((s + s) * Dx);
    if (isNegativeLE(x, P2))
      x = mod3(-x);
    const y = mod3(u1 * Dy);
    const t = mod3(x * y);
    if (!isValid || isNegativeLE(t, P2) || y === _0n5)
      throw new Error("invalid ristretto255 encoding 2");
    return new __RistrettoPoint(new ed25519_Point(x, y, _1n5, t));
  }
  /**
   * Converts ristretto-encoded string to ristretto point.
   * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-decode).
   * @param hex - Ristretto-encoded 32 bytes. Not every 32-byte string is valid ristretto encoding
   */
  static fromHex(hex11) {
    return __RistrettoPoint.fromBytes(hexToBytes(hex11));
  }
  /**
   * Encodes ristretto point to Uint8Array.
   * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-encode).
   */
  toBytes() {
    let { X, Y, Z, T } = this.ep;
    const P2 = ed25519_CURVE_p;
    const mod3 = (n) => Fp.create(n);
    const u1 = mod3(mod3(Z + Y) * mod3(Z - Y));
    const u2 = mod3(X * Y);
    const u2sq = mod3(u2 * u2);
    const { value: invsqrt } = invertSqrt(mod3(u1 * u2sq));
    const D1 = mod3(invsqrt * u1);
    const D2 = mod3(invsqrt * u2);
    const zInv = mod3(D1 * D2 * T);
    let D;
    if (isNegativeLE(T * zInv, P2)) {
      let _x = mod3(Y * SQRT_M1);
      let _y = mod3(X * SQRT_M1);
      X = _x;
      Y = _y;
      D = mod3(D1 * INVSQRT_A_MINUS_D);
    } else {
      D = D2;
    }
    if (isNegativeLE(X * zInv, P2))
      Y = mod3(-Y);
    let s = mod3((Z - Y) * D);
    if (isNegativeLE(s, P2))
      s = mod3(-s);
    return Fp.toBytes(s);
  }
  /**
   * Compares two Ristretto points.
   * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-equals).
   */
  equals(other) {
    this.assertSame(other);
    const { X: X1, Y: Y1 } = this.ep;
    const { X: X2, Y: Y2 } = other.ep;
    const mod3 = (n) => Fp.create(n);
    const one = mod3(X1 * Y2) === mod3(Y1 * X2);
    const two = mod3(Y1 * Y2) === mod3(X1 * X2);
    return one || two;
  }
  is0() {
    return this.equals(__RistrettoPoint.ZERO);
  }
};
Object.freeze(_RistrettoPoint.BASE);
Object.freeze(_RistrettoPoint.ZERO);
Object.freeze(_RistrettoPoint.prototype);
Object.freeze(_RistrettoPoint);
var ristretto255 = /* @__PURE__ */ Object.freeze({ Point: _RistrettoPoint });
var ristretto255_hasher = Object.freeze({
  Point: _RistrettoPoint,
  /**
  * Spec: https://www.rfc-editor.org/rfc/rfc9380.html#name-hashing-to-ristretto255. Caveats:
  * * There are no test vectors
  * * encodeToCurve / mapToCurve is undefined
  * * mapToCurve would be `calcElligatorRistrettoMap(scalars[0])`, not ristretto255_map!
  * * hashToScalar is undefined too, so we just use OPRF implementation
  * * We cannot re-use 'createHasher', because ristretto255_map is different algorithm/RFC
    (os2ip -> bytes255ToNumberLE)
  * * mapToCurve == calcElligatorRistrettoMap, hashToCurve == ristretto255_map
  * * hashToScalar is undefined in RFC9380 for ristretto, so we use the OPRF
    version here. Using `bytes255ToNumblerLE` will create a different result
    if we use `bytes255ToNumberLE` as os2ip
  * * current version is closest to spec.
  */
  hashToCurve(msg, options) {
    const DST = options?.DST === void 0 ? "ristretto255_XMD:SHA-512_R255MAP_RO_" : options.DST;
    const xmd = expand_message_xmd(msg, DST, 64, sha512);
    return ristretto255_hasher.deriveToCurve(xmd);
  },
  hashToScalar(msg, options = { DST: _DST_scalar }) {
    const xmd = expand_message_xmd(msg, options.DST, 64, sha512);
    return Fn.create(bytesToNumberLE(xmd));
  },
  /**
   * HashToCurve-like construction based on RFC 9496 (Element Derivation).
   * Converts 64 uniform random bytes into a curve point.
   *
   * WARNING: This represents an older hash-to-curve construction from before
   * RFC 9380 was finalized.
   * It was later reused as a component in the newer
   * `hash_to_ristretto255` function defined in RFC 9380.
   */
  deriveToCurve(bytes5) {
    abytes(bytes5, 64);
    const r1 = bytes255ToNumberLE(bytes5.subarray(0, 32));
    const R1 = calcElligatorRistrettoMap(r1);
    const r2 = bytes255ToNumberLE(bytes5.subarray(32, 64));
    const R2 = calcElligatorRistrettoMap(r2);
    return new _RistrettoPoint(R1.add(R2));
  }
});

// node_modules/@noble/hashes/_blake.js
var BSIGMA = /* @__PURE__ */ Uint8Array.from([
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3,
  11,
  8,
  12,
  0,
  5,
  2,
  15,
  13,
  10,
  14,
  3,
  6,
  7,
  1,
  9,
  4,
  7,
  9,
  3,
  1,
  13,
  12,
  11,
  14,
  2,
  6,
  5,
  10,
  4,
  0,
  15,
  8,
  9,
  0,
  5,
  7,
  2,
  4,
  10,
  15,
  14,
  1,
  11,
  12,
  6,
  8,
  3,
  13,
  2,
  12,
  6,
  10,
  0,
  11,
  8,
  3,
  4,
  13,
  7,
  5,
  15,
  14,
  1,
  9,
  12,
  5,
  1,
  15,
  14,
  13,
  4,
  10,
  0,
  7,
  6,
  3,
  9,
  2,
  8,
  11,
  13,
  11,
  7,
  14,
  12,
  1,
  3,
  9,
  5,
  0,
  15,
  4,
  8,
  6,
  2,
  10,
  6,
  15,
  14,
  9,
  11,
  3,
  0,
  8,
  12,
  2,
  13,
  7,
  1,
  4,
  10,
  5,
  10,
  2,
  8,
  4,
  7,
  6,
  1,
  5,
  15,
  11,
  9,
  14,
  3,
  12,
  13,
  0,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3,
  // Blake1, unused in others
  11,
  8,
  12,
  0,
  5,
  2,
  15,
  13,
  10,
  14,
  3,
  6,
  7,
  1,
  9,
  4,
  7,
  9,
  3,
  1,
  13,
  12,
  11,
  14,
  2,
  6,
  5,
  10,
  4,
  0,
  15,
  8,
  9,
  0,
  5,
  7,
  2,
  4,
  10,
  15,
  14,
  1,
  11,
  12,
  6,
  8,
  3,
  13,
  2,
  12,
  6,
  10,
  0,
  11,
  8,
  3,
  4,
  13,
  7,
  5,
  15,
  14,
  1,
  9
]);

// node_modules/@noble/hashes/blake2.js
var B2B_IV = /* @__PURE__ */ Uint32Array.from([
  4089235720,
  1779033703,
  2227873595,
  3144134277,
  4271175723,
  1013904242,
  1595750129,
  2773480762,
  2917565137,
  1359893119,
  725511199,
  2600822924,
  4215389547,
  528734635,
  327033209,
  1541459225
]);
var BBUF = /* @__PURE__ */ new Uint32Array(32);
function G1b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  let ll = add3L(Al, Bl, Xl);
  Ah = add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotr32H(Dh, Dl), Dl: rotr32L(Dh, Dl) });
  ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrSH(Bh, Bl, 24), Bl: rotrSL(Bh, Bl, 24) });
  BBUF[2 * a] = Al, BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl, BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl, BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl, BBUF[2 * d + 1] = Dh;
}
function G2b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  let ll = add3L(Al, Bl, Xl);
  Ah = add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotrSH(Dh, Dl, 16), Dl: rotrSL(Dh, Dl, 16) });
  ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrBH(Bh, Bl, 63), Bl: rotrBL(Bh, Bl, 63) });
  BBUF[2 * a] = Al, BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl, BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl, BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl, BBUF[2 * d + 1] = Dh;
}
function checkBlake2Opts(outputLen, opts = {}, keyLen, saltLen, persLen) {
  anumber(keyLen);
  if (outputLen <= 0 || outputLen > keyLen)
    throw new Error("outputLen bigger than keyLen");
  const { key, salt, personalization } = opts;
  if (key !== void 0 && (key.length < 1 || key.length > keyLen))
    throw new Error('"key" expected to be undefined or of length=1..' + keyLen);
  if (salt !== void 0)
    abytes(salt, saltLen, "salt");
  if (personalization !== void 0)
    abytes(personalization, persLen, "personalization");
}
var _BLAKE2 = class {
  buffer;
  buffer32;
  finished = false;
  destroyed = false;
  length = 0;
  pos = 0;
  blockLen;
  outputLen;
  canXOF = false;
  constructor(blockLen, outputLen) {
    anumber(blockLen);
    anumber(outputLen);
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.buffer = new Uint8Array(blockLen);
    this.buffer32 = u32(this.buffer);
  }
  update(data) {
    aexists(this);
    abytes(data);
    const { blockLen, buffer, buffer32 } = this;
    const len = data.length;
    const offset = data.byteOffset;
    const buf = data.buffer;
    for (let pos = 0; pos < len; ) {
      if (this.pos === blockLen) {
        swap32IfBE(buffer32);
        this.compress(buffer32, 0, false);
        swap32IfBE(buffer32);
        this.pos = 0;
      }
      const take = Math.min(blockLen - this.pos, len - pos);
      const dataOffset = offset + pos;
      if (take === blockLen && !(dataOffset % 4) && pos + take < len) {
        const data32 = new Uint32Array(buf, dataOffset, Math.floor((len - pos) / 4));
        swap32IfBE(data32);
        for (let pos32 = 0; pos + blockLen < len; pos32 += buffer32.length, pos += blockLen) {
          this.length += blockLen;
          this.compress(data32, pos32, false);
        }
        swap32IfBE(data32);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      this.length += take;
      pos += take;
    }
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    const { pos, buffer32 } = this;
    this.finished = true;
    clean(this.buffer.subarray(pos));
    swap32IfBE(buffer32);
    this.compress(buffer32, 0, true);
    swap32IfBE(buffer32);
    if (out.byteOffset & 3)
      throw new RangeError('"digestInto() output" expected 4-byte aligned byteOffset, got ' + out.byteOffset);
    const state = this.get();
    const out32 = u32(out);
    const full = Math.floor(this.outputLen / 4);
    for (let i = 0; i < full; i++)
      out32[i] = swap8IfBE(state[i]);
    const tail = this.outputLen % 4;
    if (!tail)
      return;
    const off = full * 4;
    const word = state[full];
    for (let i = 0; i < tail; i++)
      out[off + i] = word >>> 8 * i;
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    const { buffer, length, finished, destroyed, outputLen, pos } = this;
    to ||= new this.constructor({ dkLen: outputLen });
    to.set(...this.get());
    to.buffer.set(buffer);
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    to.outputLen = outputLen;
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var _BLAKE2b = class extends _BLAKE2 {
  // Same IV words as SHA-512 / BLAKE2b, encoded as LE u32 low/high halves.
  v0l = B2B_IV[0] | 0;
  v0h = B2B_IV[1] | 0;
  v1l = B2B_IV[2] | 0;
  v1h = B2B_IV[3] | 0;
  v2l = B2B_IV[4] | 0;
  v2h = B2B_IV[5] | 0;
  v3l = B2B_IV[6] | 0;
  v3h = B2B_IV[7] | 0;
  v4l = B2B_IV[8] | 0;
  v4h = B2B_IV[9] | 0;
  v5l = B2B_IV[10] | 0;
  v5h = B2B_IV[11] | 0;
  v6l = B2B_IV[12] | 0;
  v6h = B2B_IV[13] | 0;
  v7l = B2B_IV[14] | 0;
  v7h = B2B_IV[15] | 0;
  constructor(opts = {}) {
    const olen = opts.dkLen === void 0 ? 64 : opts.dkLen;
    super(128, olen);
    checkBlake2Opts(olen, opts, 64, 16, 16);
    let { key, personalization, salt } = opts;
    let keyLength = 0;
    if (key !== void 0) {
      abytes(key, void 0, "key");
      keyLength = key.length;
    }
    this.v0l ^= this.outputLen | keyLength << 8 | 1 << 16 | 1 << 24;
    if (salt !== void 0) {
      abytes(salt, void 0, "salt");
      const slt = u32(salt);
      this.v4l ^= swap8IfBE(slt[0]);
      this.v4h ^= swap8IfBE(slt[1]);
      this.v5l ^= swap8IfBE(slt[2]);
      this.v5h ^= swap8IfBE(slt[3]);
    }
    if (personalization !== void 0) {
      abytes(personalization, void 0, "personalization");
      const pers = u32(personalization);
      this.v6l ^= swap8IfBE(pers[0]);
      this.v6h ^= swap8IfBE(pers[1]);
      this.v7l ^= swap8IfBE(pers[2]);
      this.v7h ^= swap8IfBE(pers[3]);
    }
    if (key !== void 0) {
      const tmp = new Uint8Array(this.blockLen);
      tmp.set(key);
      this.update(tmp);
    }
  }
  // prettier-ignore
  get() {
    let { v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h } = this;
    return [v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h];
  }
  // prettier-ignore
  set(v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h) {
    this.v0l = v0l | 0;
    this.v0h = v0h | 0;
    this.v1l = v1l | 0;
    this.v1h = v1h | 0;
    this.v2l = v2l | 0;
    this.v2h = v2h | 0;
    this.v3l = v3l | 0;
    this.v3h = v3h | 0;
    this.v4l = v4l | 0;
    this.v4h = v4h | 0;
    this.v5l = v5l | 0;
    this.v5h = v5h | 0;
    this.v6l = v6l | 0;
    this.v6h = v6h | 0;
    this.v7l = v7l | 0;
    this.v7h = v7h | 0;
  }
  compress(msg, offset, isLast) {
    this.get().forEach((v, i) => BBUF[i] = v);
    BBUF.set(B2B_IV, 16);
    let { h, l } = fromBig(BigInt(this.length));
    BBUF[24] = B2B_IV[8] ^ l;
    BBUF[25] = B2B_IV[9] ^ h;
    if (isLast) {
      BBUF[28] = ~BBUF[28];
      BBUF[29] = ~BBUF[29];
    }
    let j = 0;
    const s = BSIGMA;
    for (let i = 0; i < 12; i++) {
      G1b(0, 4, 8, 12, msg, offset + 2 * s[j++]);
      G2b(0, 4, 8, 12, msg, offset + 2 * s[j++]);
      G1b(1, 5, 9, 13, msg, offset + 2 * s[j++]);
      G2b(1, 5, 9, 13, msg, offset + 2 * s[j++]);
      G1b(2, 6, 10, 14, msg, offset + 2 * s[j++]);
      G2b(2, 6, 10, 14, msg, offset + 2 * s[j++]);
      G1b(3, 7, 11, 15, msg, offset + 2 * s[j++]);
      G2b(3, 7, 11, 15, msg, offset + 2 * s[j++]);
      G1b(0, 5, 10, 15, msg, offset + 2 * s[j++]);
      G2b(0, 5, 10, 15, msg, offset + 2 * s[j++]);
      G1b(1, 6, 11, 12, msg, offset + 2 * s[j++]);
      G2b(1, 6, 11, 12, msg, offset + 2 * s[j++]);
      G1b(2, 7, 8, 13, msg, offset + 2 * s[j++]);
      G2b(2, 7, 8, 13, msg, offset + 2 * s[j++]);
      G1b(3, 4, 9, 14, msg, offset + 2 * s[j++]);
      G2b(3, 4, 9, 14, msg, offset + 2 * s[j++]);
    }
    this.v0l ^= BBUF[0] ^ BBUF[16];
    this.v0h ^= BBUF[1] ^ BBUF[17];
    this.v1l ^= BBUF[2] ^ BBUF[18];
    this.v1h ^= BBUF[3] ^ BBUF[19];
    this.v2l ^= BBUF[4] ^ BBUF[20];
    this.v2h ^= BBUF[5] ^ BBUF[21];
    this.v3l ^= BBUF[6] ^ BBUF[22];
    this.v3h ^= BBUF[7] ^ BBUF[23];
    this.v4l ^= BBUF[8] ^ BBUF[24];
    this.v4h ^= BBUF[9] ^ BBUF[25];
    this.v5l ^= BBUF[10] ^ BBUF[26];
    this.v5h ^= BBUF[11] ^ BBUF[27];
    this.v6l ^= BBUF[12] ^ BBUF[28];
    this.v6h ^= BBUF[13] ^ BBUF[29];
    this.v7l ^= BBUF[14] ^ BBUF[30];
    this.v7h ^= BBUF[15] ^ BBUF[31];
    clean(BBUF);
  }
  destroy() {
    this.destroyed = true;
    clean(this.buffer32);
    this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
};
var blake2b = /* @__PURE__ */ createHasher((opts) => new _BLAKE2b(opts));

// node_modules/@noble/hashes/hmac.js
var _HMAC = class {
  oHash;
  iHash;
  blockLen;
  outputLen;
  canXOF = false;
  finished = false;
  destroyed = false;
  constructor(hash3, key) {
    ahash(hash3);
    abytes(key, void 0, "key");
    this.iHash = hash3.create();
    if (typeof this.iHash.update !== "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen;
    this.outputLen = this.iHash.outputLen;
    const blockLen = this.blockLen;
    const pad = new Uint8Array(blockLen);
    pad.set(key.length > blockLen ? hash3.create().update(key).digest() : key);
    for (let i = 0; i < pad.length; i++)
      pad[i] ^= 54;
    this.iHash.update(pad);
    this.oHash = hash3.create();
    for (let i = 0; i < pad.length; i++)
      pad[i] ^= 54 ^ 92;
    this.oHash.update(pad);
    clean(pad);
  }
  update(buf) {
    aexists(this);
    this.iHash.update(buf);
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const buf = out.subarray(0, this.outputLen);
    this.iHash.digestInto(buf);
    this.oHash.update(buf);
    this.oHash.digestInto(buf);
    this.destroy();
  }
  digest() {
    const out = new Uint8Array(this.oHash.outputLen);
    this.digestInto(out);
    return out;
  }
  _cloneInto(to) {
    to ||= Object.create(Object.getPrototypeOf(this), {});
    const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
    to = to;
    to.finished = finished;
    to.destroyed = destroyed;
    to.blockLen = blockLen;
    to.outputLen = outputLen;
    to.oHash = oHash._cloneInto(to.oHash);
    to.iHash = iHash._cloneInto(to.iHash);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = true;
    this.oHash.destroy();
    this.iHash.destroy();
  }
};
var hmac = /* @__PURE__ */ (() => {
  const hmac_ = ((hash3, key, message) => new _HMAC(hash3, key).update(message).digest());
  hmac_.create = (hash3, key) => new _HMAC(hash3, key);
  return hmac_;
})();

// node_modules/@noble/hashes/hkdf.js
function extract(hash3, ikm, salt) {
  ahash(hash3);
  if (salt === void 0)
    salt = new Uint8Array(hash3.outputLen);
  return hmac(hash3, salt, ikm);
}
var HKDF_COUNTER = /* @__PURE__ */ Uint8Array.of(0);
var EMPTY_BUFFER = /* @__PURE__ */ Uint8Array.of();
function expand(hash3, prk, info, length = 32) {
  ahash(hash3);
  anumber(length, "length");
  abytes(prk, void 0, "prk");
  const olen = hash3.outputLen;
  if (prk.length < olen)
    throw new Error('"prk" must be at least HashLen octets');
  if (length > 255 * olen)
    throw new Error("Length must be <= 255*HashLen");
  const blocks = Math.ceil(length / olen);
  if (info === void 0)
    info = EMPTY_BUFFER;
  else
    abytes(info, void 0, "info");
  const okm = new Uint8Array(blocks * olen);
  const HMAC = hmac.create(hash3, prk);
  const HMACTmp = HMAC._cloneInto();
  const T = new Uint8Array(HMAC.outputLen);
  for (let counter = 0; counter < blocks; counter++) {
    HKDF_COUNTER[0] = counter + 1;
    HMACTmp.update(counter === 0 ? EMPTY_BUFFER : T).update(info).update(HKDF_COUNTER).digestInto(T);
    okm.set(T, olen * counter);
    HMAC._cloneInto(HMACTmp);
  }
  HMAC.destroy();
  HMACTmp.destroy();
  clean(T, HKDF_COUNTER);
  return okm.slice(0, length);
}

// node_modules/@noble/ciphers/utils.js
function isBytes3(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
function abool2(b) {
  if (typeof b !== "boolean")
    throw new TypeError(`boolean expected, not ${b}`);
}
function anumber3(n) {
  if (typeof n !== "number")
    throw new TypeError("number expected, got " + typeof n);
  if (!Number.isSafeInteger(n) || n < 0)
    throw new RangeError("positive integer expected, got " + n);
}
function abytes3(value, length, title = "") {
  const bytes5 = isBytes3(value);
  const len = value?.length;
  const needsLen = length !== void 0;
  if (!bytes5 || needsLen && len !== length) {
    const prefix = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes5 ? `length=${len}` : `type=${typeof value}`;
    const message = prefix + "expected Uint8Array" + ofLen + ", got " + got;
    if (!bytes5)
      throw new TypeError(message);
    throw new RangeError(message);
  }
  return value;
}
function aexists2(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput2(out, instance, onlyAligned = false) {
  abytes3(out, void 0, "output");
  const min = instance.outputLen;
  if (out.length < min) {
    throw new RangeError("digestInto() expects output buffer of length at least " + min);
  }
  if (onlyAligned && !isAligned32(out))
    throw new Error("invalid output, must be aligned");
}
function u82(arr) {
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}
function u322(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean2(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView2(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
var byteSwap = (word) => word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
var swap8IfBE2 = isLE ? (n) => n : (n) => byteSwap(n) >>> 0;
var byteSwap32 = (arr) => {
  for (let i = 0; i < arr.length; i++)
    arr[i] = byteSwap(arr[i]);
  return arr;
};
var swap32IfBE2 = isLE ? (u) => u : byteSwap32;
var hasHexBuiltin = /* @__PURE__ */ (() => (
  // @ts-ignore
  typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
))();
var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
function bytesToHex3(bytes5) {
  abytes3(bytes5);
  if (hasHexBuiltin)
    return bytes5.toHex();
  let hex11 = "";
  for (let i = 0; i < bytes5.length; i++) {
    hex11 += hexes[bytes5[i]];
  }
  return hex11;
}
var asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
function asciiToBase16(ch) {
  if (ch >= asciis._0 && ch <= asciis._9)
    return ch - asciis._0;
  if (ch >= asciis.A && ch <= asciis.F)
    return ch - (asciis.A - 10);
  if (ch >= asciis.a && ch <= asciis.f)
    return ch - (asciis.a - 10);
  return;
}
function hexToBytes3(hex11) {
  if (typeof hex11 !== "string")
    throw new TypeError("hex string expected, got " + typeof hex11);
  if (hasHexBuiltin) {
    try {
      return Uint8Array.fromHex(hex11);
    } catch (error) {
      if (error instanceof SyntaxError)
        throw new RangeError(error.message);
      throw error;
    }
  }
  const hl = hex11.length;
  const al = hl / 2;
  if (hl % 2)
    throw new RangeError("hex string expected, got unpadded hex of length " + hl);
  const array = new Uint8Array(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex11.charCodeAt(hi));
    const n2 = asciiToBase16(hex11.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0) {
      const char = hex11[hi] + hex11[hi + 1];
      throw new RangeError('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array[ai] = n1 * 16 + n2;
  }
  return array;
}
function hexToNumber2(hex11) {
  if (typeof hex11 !== "string")
    throw new TypeError("hex string expected, got " + typeof hex11);
  return BigInt(hex11 === "" ? "0" : "0x" + hex11);
}
function bytesToNumberBE2(bytes5) {
  return hexToNumber2(bytesToHex3(bytes5));
}
function numberToBytesBE2(n, len) {
  if (typeof n === "number")
    anumber3(n);
  else if (typeof n !== "bigint")
    throw new TypeError(`number or bigint expected, got ${typeof n}`);
  anumber3(len);
  return hexToBytes3(n.toString(16).padStart(len * 2, "0"));
}
function overlapBytes(a, b) {
  if (!a.byteLength || !b.byteLength)
    return false;
  return a.buffer === b.buffer && // best we can do, may fail with an obscure Proxy
  a.byteOffset < b.byteOffset + b.byteLength && // a starts before b end
  b.byteOffset < a.byteOffset + a.byteLength;
}
function complexOverlapBytes(input, output) {
  if (overlapBytes(input, output) && input.byteOffset < output.byteOffset)
    throw new Error("complex overlap of input and output is not supported");
}
function checkOpts2(defaults, opts) {
  if (opts == null || typeof opts !== "object")
    throw new Error("options must be defined");
  const merged = Object.assign(defaults, opts);
  return merged;
}
function equalBytes2(a, b) {
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++)
    diff |= a[i] ^ b[i];
  return diff === 0;
}
function wrapMacConstructor(keyLen, macCons, fromMsg) {
  const mac = macCons;
  const getArgs = fromMsg || (() => []);
  const macC = (msg, key) => mac(key, ...getArgs(msg)).update(msg).digest();
  const tmp = mac(new Uint8Array(keyLen), ...getArgs(new Uint8Array(0)));
  macC.outputLen = tmp.outputLen;
  macC.blockLen = tmp.blockLen;
  macC.create = (key, ...args) => mac(key, ...args);
  return macC;
}
var wrapCipher = /* @__NO_SIDE_EFFECTS__ */ (params, constructor) => {
  function wrappedCipher(key, ...args) {
    abytes3(key, void 0, "key");
    if (params.nonceLength !== void 0) {
      const nonce = args[0];
      abytes3(nonce, params.varSizeNonce ? void 0 : params.nonceLength, "nonce");
    }
    const tagl = params.tagLength;
    if (tagl && args[1] !== void 0)
      abytes3(args[1], void 0, "AAD");
    const cipher = constructor(key, ...args);
    const checkOutput = (fnLength, output) => {
      if (output !== void 0) {
        if (fnLength !== 2)
          throw new Error("cipher output not supported");
        abytes3(output, void 0, "output");
      }
    };
    let called = false;
    const wrCipher = {
      encrypt(data, output) {
        if (called)
          throw new Error("cannot encrypt() twice with same key + nonce");
        called = true;
        abytes3(data);
        checkOutput(cipher.encrypt.length, output);
        return cipher.encrypt(data, output);
      },
      decrypt(data, output) {
        abytes3(data);
        if (tagl && data.length < tagl)
          throw new Error('"ciphertext" expected length bigger than tagLength=' + tagl);
        checkOutput(cipher.decrypt.length, output);
        return cipher.decrypt(data, output);
      }
    };
    return wrCipher;
  }
  Object.assign(wrappedCipher, params);
  return wrappedCipher;
};
function getOutput(expectedLength, out, onlyAligned = true) {
  if (out === void 0)
    return new Uint8Array(expectedLength);
  abytes3(out, void 0, "output");
  if (out.length !== expectedLength)
    throw new Error('"output" expected Uint8Array of length ' + expectedLength + ", got: " + out.length);
  if (onlyAligned && !isAligned32(out))
    throw new Error("invalid output, must be aligned");
  return out;
}
function u64Lengths(dataLength, aadLength, isLE2) {
  anumber3(dataLength);
  anumber3(aadLength);
  abool2(isLE2);
  const num2 = new Uint8Array(16);
  const view = createView2(num2);
  view.setBigUint64(0, BigInt(aadLength), isLE2);
  view.setBigUint64(8, BigInt(dataLength), isLE2);
  return num2;
}
function isAligned32(bytes5) {
  return bytes5.byteOffset % 4 === 0;
}
function copyBytes2(bytes5) {
  return Uint8Array.from(abytes3(bytes5));
}

// node_modules/@noble/ciphers/_arx.js
var encodeStr = (str) => Uint8Array.from(str.split(""), (c) => c.charCodeAt(0));
var sigma16_32 = /* @__PURE__ */ (() => swap32IfBE2(u322(encodeStr("expand 16-byte k"))))();
var sigma32_32 = /* @__PURE__ */ (() => swap32IfBE2(u322(encodeStr("expand 32-byte k"))))();
function rotl(a, b) {
  return a << b | a >>> 32 - b;
}
var BLOCK_LEN = 64;
var BLOCK_LEN32 = 16;
var MAX_COUNTER = /* @__PURE__ */ (() => 2 ** 32 - 1)();
var U32_EMPTY = /* @__PURE__ */ Uint32Array.of();
function runCipher(core, sigma, key, nonce, data, output, counter, rounds) {
  const len = data.length;
  const block2 = new Uint8Array(BLOCK_LEN);
  const b32 = u322(block2);
  const isAligned = isLE && isAligned32(data) && isAligned32(output);
  const d32 = isAligned ? u322(data) : U32_EMPTY;
  const o32 = isAligned ? u322(output) : U32_EMPTY;
  if (!isLE) {
    for (let pos = 0; pos < len; counter++) {
      core(sigma, key, nonce, b32, counter, rounds);
      swap32IfBE2(b32);
      if (counter >= MAX_COUNTER)
        throw new Error("arx: counter overflow");
      const take = Math.min(BLOCK_LEN, len - pos);
      for (let j = 0, posj; j < take; j++) {
        posj = pos + j;
        output[posj] = data[posj] ^ block2[j];
      }
      pos += take;
    }
    return;
  }
  for (let pos = 0; pos < len; counter++) {
    core(sigma, key, nonce, b32, counter, rounds);
    if (counter >= MAX_COUNTER)
      throw new Error("arx: counter overflow");
    const take = Math.min(BLOCK_LEN, len - pos);
    if (isAligned && take === BLOCK_LEN) {
      const pos32 = pos / 4;
      if (pos % 4 !== 0)
        throw new Error("arx: invalid block position");
      for (let j = 0, posj; j < BLOCK_LEN32; j++) {
        posj = pos32 + j;
        o32[posj] = d32[posj] ^ b32[j];
      }
      pos += BLOCK_LEN;
      continue;
    }
    for (let j = 0, posj; j < take; j++) {
      posj = pos + j;
      output[posj] = data[posj] ^ block2[j];
    }
    pos += take;
  }
}
function createCipher(core, opts) {
  const { allowShortKeys, extendNonceFn, counterLength, counterRight, rounds } = checkOpts2({ allowShortKeys: false, counterLength: 8, counterRight: false, rounds: 20 }, opts);
  if (typeof core !== "function")
    throw new Error("core must be a function");
  anumber3(counterLength);
  anumber3(rounds);
  abool2(counterRight);
  abool2(allowShortKeys);
  return (key, nonce, data, output, counter = 0) => {
    abytes3(key, void 0, "key");
    abytes3(nonce, void 0, "nonce");
    abytes3(data, void 0, "data");
    const len = data.length;
    output = getOutput(len, output, false);
    anumber3(counter);
    if (counter < 0 || counter >= MAX_COUNTER)
      throw new Error("arx: counter overflow");
    const toClean = [];
    let l = key.length;
    let k;
    let sigma;
    if (l === 32) {
      toClean.push(k = copyBytes2(key));
      sigma = sigma32_32;
    } else if (l === 16 && allowShortKeys) {
      k = new Uint8Array(32);
      k.set(key);
      k.set(key, 16);
      sigma = sigma16_32;
      toClean.push(k);
    } else {
      abytes3(key, 32, "arx key");
      throw new Error("invalid key size");
    }
    if (!isLE || !isAligned32(nonce))
      toClean.push(nonce = copyBytes2(nonce));
    let k32 = u322(k);
    if (extendNonceFn) {
      if (nonce.length !== 24)
        throw new Error(`arx: extended nonce must be 24 bytes`);
      const n16 = nonce.subarray(0, 16);
      if (isLE)
        extendNonceFn(sigma, k32, u322(n16), k32);
      else {
        const sigmaRaw = swap32IfBE2(Uint32Array.from(sigma));
        extendNonceFn(sigmaRaw, k32, u322(n16), k32);
        clean2(sigmaRaw);
        swap32IfBE2(k32);
      }
      nonce = nonce.subarray(16);
    } else if (!isLE)
      swap32IfBE2(k32);
    const nonceNcLen = 16 - counterLength;
    if (nonceNcLen !== nonce.length)
      throw new Error(`arx: nonce must be ${nonceNcLen} or 16 bytes`);
    if (nonceNcLen !== 12) {
      const nc = new Uint8Array(12);
      nc.set(nonce, counterRight ? 0 : 12 - nonce.length);
      nonce = nc;
      toClean.push(nonce);
    }
    const n32 = swap32IfBE2(u322(nonce));
    try {
      runCipher(core, sigma, k32, n32, data, output, counter, rounds);
      return output;
    } finally {
      clean2(...toClean);
    }
  };
}

// node_modules/@noble/ciphers/_poly1305.js
function u8to16(a, i) {
  return a[i++] & 255 | (a[i++] & 255) << 8;
}
var Poly1305 = class {
  blockLen = 16;
  outputLen = 16;
  buffer = new Uint8Array(16);
  r = new Uint16Array(10);
  // Allocating 1 array with .subarray() here is slower than 3
  h = new Uint16Array(10);
  pad = new Uint16Array(8);
  pos = 0;
  finished = false;
  destroyed = false;
  // Can be speed-up using BigUint64Array, at the cost of complexity
  constructor(key) {
    key = copyBytes2(abytes3(key, 32, "key"));
    const t0 = u8to16(key, 0);
    const t1 = u8to16(key, 2);
    const t2 = u8to16(key, 4);
    const t3 = u8to16(key, 6);
    const t4 = u8to16(key, 8);
    const t5 = u8to16(key, 10);
    const t6 = u8to16(key, 12);
    const t7 = u8to16(key, 14);
    this.r[0] = t0 & 8191;
    this.r[1] = (t0 >>> 13 | t1 << 3) & 8191;
    this.r[2] = (t1 >>> 10 | t2 << 6) & 7939;
    this.r[3] = (t2 >>> 7 | t3 << 9) & 8191;
    this.r[4] = (t3 >>> 4 | t4 << 12) & 255;
    this.r[5] = t4 >>> 1 & 8190;
    this.r[6] = (t4 >>> 14 | t5 << 2) & 8191;
    this.r[7] = (t5 >>> 11 | t6 << 5) & 8065;
    this.r[8] = (t6 >>> 8 | t7 << 8) & 8191;
    this.r[9] = t7 >>> 5 & 127;
    for (let i = 0; i < 8; i++)
      this.pad[i] = u8to16(key, 16 + 2 * i);
  }
  process(data, offset, isLast = false) {
    const hibit = isLast ? 0 : 1 << 11;
    const { h, r } = this;
    const r0 = r[0];
    const r1 = r[1];
    const r2 = r[2];
    const r3 = r[3];
    const r4 = r[4];
    const r5 = r[5];
    const r6 = r[6];
    const r7 = r[7];
    const r8 = r[8];
    const r9 = r[9];
    const t0 = u8to16(data, offset + 0);
    const t1 = u8to16(data, offset + 2);
    const t2 = u8to16(data, offset + 4);
    const t3 = u8to16(data, offset + 6);
    const t4 = u8to16(data, offset + 8);
    const t5 = u8to16(data, offset + 10);
    const t6 = u8to16(data, offset + 12);
    const t7 = u8to16(data, offset + 14);
    let h0 = h[0] + (t0 & 8191);
    let h1 = h[1] + ((t0 >>> 13 | t1 << 3) & 8191);
    let h2 = h[2] + ((t1 >>> 10 | t2 << 6) & 8191);
    let h3 = h[3] + ((t2 >>> 7 | t3 << 9) & 8191);
    let h4 = h[4] + ((t3 >>> 4 | t4 << 12) & 8191);
    let h5 = h[5] + (t4 >>> 1 & 8191);
    let h6 = h[6] + ((t4 >>> 14 | t5 << 2) & 8191);
    let h7 = h[7] + ((t5 >>> 11 | t6 << 5) & 8191);
    let h8 = h[8] + ((t6 >>> 8 | t7 << 8) & 8191);
    let h9 = h[9] + (t7 >>> 5 | hibit);
    let c = 0;
    let d0 = c + h0 * r0 + h1 * (5 * r9) + h2 * (5 * r8) + h3 * (5 * r7) + h4 * (5 * r6);
    c = d0 >>> 13;
    d0 &= 8191;
    d0 += h5 * (5 * r5) + h6 * (5 * r4) + h7 * (5 * r3) + h8 * (5 * r2) + h9 * (5 * r1);
    c += d0 >>> 13;
    d0 &= 8191;
    let d1 = c + h0 * r1 + h1 * r0 + h2 * (5 * r9) + h3 * (5 * r8) + h4 * (5 * r7);
    c = d1 >>> 13;
    d1 &= 8191;
    d1 += h5 * (5 * r6) + h6 * (5 * r5) + h7 * (5 * r4) + h8 * (5 * r3) + h9 * (5 * r2);
    c += d1 >>> 13;
    d1 &= 8191;
    let d2 = c + h0 * r2 + h1 * r1 + h2 * r0 + h3 * (5 * r9) + h4 * (5 * r8);
    c = d2 >>> 13;
    d2 &= 8191;
    d2 += h5 * (5 * r7) + h6 * (5 * r6) + h7 * (5 * r5) + h8 * (5 * r4) + h9 * (5 * r3);
    c += d2 >>> 13;
    d2 &= 8191;
    let d3 = c + h0 * r3 + h1 * r2 + h2 * r1 + h3 * r0 + h4 * (5 * r9);
    c = d3 >>> 13;
    d3 &= 8191;
    d3 += h5 * (5 * r8) + h6 * (5 * r7) + h7 * (5 * r6) + h8 * (5 * r5) + h9 * (5 * r4);
    c += d3 >>> 13;
    d3 &= 8191;
    let d4 = c + h0 * r4 + h1 * r3 + h2 * r2 + h3 * r1 + h4 * r0;
    c = d4 >>> 13;
    d4 &= 8191;
    d4 += h5 * (5 * r9) + h6 * (5 * r8) + h7 * (5 * r7) + h8 * (5 * r6) + h9 * (5 * r5);
    c += d4 >>> 13;
    d4 &= 8191;
    let d5 = c + h0 * r5 + h1 * r4 + h2 * r3 + h3 * r2 + h4 * r1;
    c = d5 >>> 13;
    d5 &= 8191;
    d5 += h5 * r0 + h6 * (5 * r9) + h7 * (5 * r8) + h8 * (5 * r7) + h9 * (5 * r6);
    c += d5 >>> 13;
    d5 &= 8191;
    let d6 = c + h0 * r6 + h1 * r5 + h2 * r4 + h3 * r3 + h4 * r2;
    c = d6 >>> 13;
    d6 &= 8191;
    d6 += h5 * r1 + h6 * r0 + h7 * (5 * r9) + h8 * (5 * r8) + h9 * (5 * r7);
    c += d6 >>> 13;
    d6 &= 8191;
    let d7 = c + h0 * r7 + h1 * r6 + h2 * r5 + h3 * r4 + h4 * r3;
    c = d7 >>> 13;
    d7 &= 8191;
    d7 += h5 * r2 + h6 * r1 + h7 * r0 + h8 * (5 * r9) + h9 * (5 * r8);
    c += d7 >>> 13;
    d7 &= 8191;
    let d8 = c + h0 * r8 + h1 * r7 + h2 * r6 + h3 * r5 + h4 * r4;
    c = d8 >>> 13;
    d8 &= 8191;
    d8 += h5 * r3 + h6 * r2 + h7 * r1 + h8 * r0 + h9 * (5 * r9);
    c += d8 >>> 13;
    d8 &= 8191;
    let d9 = c + h0 * r9 + h1 * r8 + h2 * r7 + h3 * r6 + h4 * r5;
    c = d9 >>> 13;
    d9 &= 8191;
    d9 += h5 * r4 + h6 * r3 + h7 * r2 + h8 * r1 + h9 * r0;
    c += d9 >>> 13;
    d9 &= 8191;
    c = (c << 2) + c | 0;
    c = c + d0 | 0;
    d0 = c & 8191;
    c = c >>> 13;
    d1 += c;
    h[0] = d0;
    h[1] = d1;
    h[2] = d2;
    h[3] = d3;
    h[4] = d4;
    h[5] = d5;
    h[6] = d6;
    h[7] = d7;
    h[8] = d8;
    h[9] = d9;
  }
  finalize() {
    const { h, pad } = this;
    const g = new Uint16Array(10);
    let c = h[1] >>> 13;
    h[1] &= 8191;
    for (let i = 2; i < 10; i++) {
      h[i] += c;
      c = h[i] >>> 13;
      h[i] &= 8191;
    }
    h[0] += c * 5;
    c = h[0] >>> 13;
    h[0] &= 8191;
    h[1] += c;
    c = h[1] >>> 13;
    h[1] &= 8191;
    h[2] += c;
    g[0] = h[0] + 5;
    c = g[0] >>> 13;
    g[0] &= 8191;
    for (let i = 1; i < 10; i++) {
      g[i] = h[i] + c;
      c = g[i] >>> 13;
      g[i] &= 8191;
    }
    g[9] -= 1 << 13;
    let mask = (c ^ 1) - 1;
    for (let i = 0; i < 10; i++)
      g[i] &= mask;
    mask = ~mask;
    for (let i = 0; i < 10; i++)
      h[i] = h[i] & mask | g[i];
    h[0] = (h[0] | h[1] << 13) & 65535;
    h[1] = (h[1] >>> 3 | h[2] << 10) & 65535;
    h[2] = (h[2] >>> 6 | h[3] << 7) & 65535;
    h[3] = (h[3] >>> 9 | h[4] << 4) & 65535;
    h[4] = (h[4] >>> 12 | h[5] << 1 | h[6] << 14) & 65535;
    h[5] = (h[6] >>> 2 | h[7] << 11) & 65535;
    h[6] = (h[7] >>> 5 | h[8] << 8) & 65535;
    h[7] = (h[8] >>> 8 | h[9] << 5) & 65535;
    let f = h[0] + pad[0];
    h[0] = f & 65535;
    for (let i = 1; i < 8; i++) {
      f = (h[i] + pad[i] | 0) + (f >>> 16) | 0;
      h[i] = f & 65535;
    }
    clean2(g);
  }
  update(data) {
    aexists2(this);
    abytes3(data);
    data = copyBytes2(data);
    const { buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(data, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(buffer, 0, false);
        this.pos = 0;
      }
    }
    return this;
  }
  destroy() {
    this.destroyed = true;
    clean2(this.h, this.r, this.buffer, this.pad);
  }
  digestInto(out) {
    aexists2(this);
    aoutput2(out, this);
    this.finished = true;
    const { buffer, h } = this;
    let { pos } = this;
    if (pos) {
      buffer[pos++] = 1;
      for (; pos < 16; pos++)
        buffer[pos] = 0;
      this.process(buffer, 0, true);
    }
    this.finalize();
    let opos = 0;
    for (let i = 0; i < 8; i++) {
      out[opos++] = h[i] >>> 0;
      out[opos++] = h[i] >>> 8;
    }
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
};
var poly1305 = /* @__PURE__ */ wrapMacConstructor(32, (key) => new Poly1305(key));

// node_modules/@noble/ciphers/chacha.js
function chachaCore(s, k, n, out, cnt, rounds = 20) {
  let y00 = s[0], y01 = s[1], y02 = s[2], y03 = s[3], y04 = k[0], y05 = k[1], y06 = k[2], y07 = k[3], y08 = k[4], y09 = k[5], y10 = k[6], y11 = k[7], y12 = cnt, y13 = n[0], y14 = n[1], y15 = n[2];
  let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
  for (let r = 0; r < rounds; r += 2) {
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 16);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 12);
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 8);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 7);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 16);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 12);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 8);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 7);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 16);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 12);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 8);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 7);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 16);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 12);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 8);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 7);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 16);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 12);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 8);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 7);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 16);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 12);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 8);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 7);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 16);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 12);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 8);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 7);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 16);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 12);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 8);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 7);
  }
  let oi = 0;
  out[oi++] = y00 + x00 | 0;
  out[oi++] = y01 + x01 | 0;
  out[oi++] = y02 + x02 | 0;
  out[oi++] = y03 + x03 | 0;
  out[oi++] = y04 + x04 | 0;
  out[oi++] = y05 + x05 | 0;
  out[oi++] = y06 + x06 | 0;
  out[oi++] = y07 + x07 | 0;
  out[oi++] = y08 + x08 | 0;
  out[oi++] = y09 + x09 | 0;
  out[oi++] = y10 + x10 | 0;
  out[oi++] = y11 + x11 | 0;
  out[oi++] = y12 + x12 | 0;
  out[oi++] = y13 + x13 | 0;
  out[oi++] = y14 + x14 | 0;
  out[oi++] = y15 + x15 | 0;
}
var chacha20 = /* @__PURE__ */ createCipher(chachaCore, {
  counterRight: false,
  counterLength: 4,
  allowShortKeys: false
});
var ZEROS16 = /* @__PURE__ */ new Uint8Array(16);
var updatePadded = (h, msg) => {
  h.update(msg);
  const leftover = msg.length % 16;
  if (leftover)
    h.update(ZEROS16.subarray(leftover));
};
var ZEROS32 = /* @__PURE__ */ new Uint8Array(32);
function computeTag(fn, key, nonce, ciphertext, AAD2) {
  if (AAD2 !== void 0)
    abytes3(AAD2, void 0, "AAD");
  const authKey = fn(key, nonce, ZEROS32);
  const lengths = u64Lengths(ciphertext.length, AAD2 ? AAD2.length : 0, true);
  const h = poly1305.create(authKey);
  if (AAD2)
    updatePadded(h, AAD2);
  updatePadded(h, ciphertext);
  h.update(lengths);
  const res = h.digest();
  clean2(authKey, lengths);
  return res;
}
var _poly1305_aead = (xorStream) => (key, nonce, AAD2) => {
  const tagLength = 16;
  return {
    encrypt(plaintext, output) {
      const plength = plaintext.length;
      output = getOutput(plength + tagLength, output, false);
      output.set(plaintext);
      const oPlain = output.subarray(0, -tagLength);
      xorStream(key, nonce, oPlain, oPlain, 1);
      const tag = computeTag(xorStream, key, nonce, oPlain, AAD2);
      output.set(tag, plength);
      clean2(tag);
      return output;
    },
    decrypt(ciphertext, output) {
      output = getOutput(ciphertext.length - tagLength, output, false);
      const data = ciphertext.subarray(0, -tagLength);
      const passedTag = ciphertext.subarray(-tagLength);
      const tag = computeTag(xorStream, key, nonce, data, AAD2);
      if (!equalBytes2(passedTag, tag)) {
        clean2(tag);
        throw new Error("invalid tag");
      }
      output.set(ciphertext.subarray(0, -tagLength));
      xorStream(key, nonce, output, output, 1);
      clean2(tag);
      return output;
    }
  };
};
var chacha20poly1305 = /* @__PURE__ */ wrapCipher(
  { blockSize: 64, nonceLength: 12, tagLength: 16 },
  /* @__PURE__ */ _poly1305_aead(chacha20)
);

// node_modules/@noble/ciphers/aes.js
var BLOCK_SIZE = 16;
var BLOCK_SIZE32 = 4;
var EMPTY_BLOCK = /* @__PURE__ */ new Uint8Array(BLOCK_SIZE);
var ONE_BLOCK = /* @__PURE__ */ Uint8Array.from([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1
]);
var POLY = 283;
function validateKeyLength(key) {
  if (![16, 24, 32].includes(key.length))
    throw new Error('"aes key" expected Uint8Array of length 16/24/32, got length=' + key.length);
}
function mul2(n) {
  return n << 1 ^ POLY & -(n >> 7);
}
function mul(a, b) {
  let res = 0;
  for (; b > 0; b >>= 1) {
    res ^= a & -(b & 1);
    a = mul2(a);
  }
  return res;
}
var incBytes = (data, isLE2, carry = 1) => {
  if (!Number.isSafeInteger(carry) || carry > 4294967040)
    throw new Error("incBytes: wrong carry " + carry);
  abytes3(data);
  for (let i = 0; i < data.length; i++) {
    const pos = !isLE2 ? data.length - 1 - i : i;
    carry = carry + (data[pos] & 255) | 0;
    data[pos] = carry & 255;
    carry >>>= 8;
  }
};
var sbox = /* @__PURE__ */ (() => {
  const t = new Uint8Array(256);
  for (let i = 0, x = 1; i < 256; i++, x ^= mul2(x))
    t[i] = x;
  const box = new Uint8Array(256);
  box[0] = 99;
  for (let i = 0; i < 255; i++) {
    let x = t[255 - i];
    x |= x << 8;
    box[t[i]] = (x ^ x >> 4 ^ x >> 5 ^ x >> 6 ^ x >> 7 ^ 99) & 255;
  }
  clean2(t);
  return box;
})();
var invSbox = /* @__PURE__ */ sbox.map((_, j) => sbox.indexOf(j));
var rotr32_8 = (n) => n << 24 | n >>> 8;
var rotl32_8 = (n) => n << 8 | n >>> 24;
function genTtable(sbox2, fn) {
  if (sbox2.length !== 256)
    throw new Error("Wrong sbox length");
  const T0 = new Uint32Array(256).map((_, j) => fn(sbox2[j]));
  const T1 = T0.map(rotl32_8);
  const T2 = T1.map(rotl32_8);
  const T3 = T2.map(rotl32_8);
  const T01 = new Uint32Array(256 * 256);
  const T23 = new Uint32Array(256 * 256);
  const sbox22 = new Uint16Array(256 * 256);
  for (let i = 0; i < 256; i++) {
    for (let j = 0; j < 256; j++) {
      const idx = i * 256 + j;
      T01[idx] = T0[i] ^ T1[j];
      T23[idx] = T2[i] ^ T3[j];
      sbox22[idx] = sbox2[i] << 8 | sbox2[j];
    }
  }
  return { sbox: sbox2, sbox2: sbox22, T0, T1, T2, T3, T01, T23 };
}
var tableEncoding = /* @__PURE__ */ genTtable(sbox, (s) => mul(s, 3) << 24 | s << 16 | s << 8 | mul(s, 2));
var tableDecoding = /* @__PURE__ */ genTtable(invSbox, (s) => mul(s, 11) << 24 | mul(s, 13) << 16 | mul(s, 9) << 8 | mul(s, 14));
var xPowers = /* @__PURE__ */ (() => {
  const p = new Uint8Array(16);
  for (let i = 0, x = 1; i < 16; i++, x = mul2(x))
    p[i] = x;
  return p;
})();
function expandKeyLE(key) {
  abytes3(key);
  const len = key.length;
  validateKeyLength(key);
  const { sbox2 } = tableEncoding;
  const toClean = [];
  if (!isLE || !isAligned32(key))
    toClean.push(key = copyBytes2(key));
  const k32 = swap32IfBE2(u322(key));
  const Nk = k32.length;
  const subByte = (n) => applySbox(sbox2, n, n, n, n);
  const xk = new Uint32Array(len + 28);
  xk.set(k32);
  for (let i = Nk; i < xk.length; i++) {
    let t = xk[i - 1];
    if (i % Nk === 0)
      t = subByte(rotr32_8(t)) ^ xPowers[i / Nk - 1];
    else if (Nk > 6 && i % Nk === 4)
      t = subByte(t);
    xk[i] = xk[i - Nk] ^ t;
  }
  clean2(...toClean);
  return xk;
}
function expandKeyDecLE(key) {
  const encKey = expandKeyLE(key);
  const xk = encKey.slice();
  const Nk = encKey.length;
  const { sbox2 } = tableEncoding;
  const { T0, T1, T2, T3 } = tableDecoding;
  for (let i = 0; i < Nk; i += 4) {
    for (let j = 0; j < 4; j++)
      xk[i + j] = encKey[Nk - i - 4 + j];
  }
  clean2(encKey);
  for (let i = 4; i < Nk - 4; i++) {
    const x = xk[i];
    const w = applySbox(sbox2, x, x, x, x);
    xk[i] = T0[w & 255] ^ T1[w >>> 8 & 255] ^ T2[w >>> 16 & 255] ^ T3[w >>> 24];
  }
  return xk;
}
function apply0123(T01, T23, s0, s1, s2, s3) {
  return T01[s0 << 8 & 65280 | s1 >>> 8 & 255] ^ T23[s2 >>> 8 & 65280 | s3 >>> 24 & 255];
}
function applySbox(sbox2, s0, s1, s2, s3) {
  return sbox2[s0 & 255 | s1 & 65280] | sbox2[s2 >>> 16 & 255 | s3 >>> 16 & 65280] << 16;
}
function encrypt(xk, s0, s1, s2, s3) {
  const { sbox2, T01, T23 } = tableEncoding;
  let k = 0;
  s0 ^= xk[k++], s1 ^= xk[k++], s2 ^= xk[k++], s3 ^= xk[k++];
  const rounds = xk.length / 4 - 2;
  for (let i = 0; i < rounds; i++) {
    const t02 = xk[k++] ^ apply0123(T01, T23, s0, s1, s2, s3);
    const t12 = xk[k++] ^ apply0123(T01, T23, s1, s2, s3, s0);
    const t22 = xk[k++] ^ apply0123(T01, T23, s2, s3, s0, s1);
    const t32 = xk[k++] ^ apply0123(T01, T23, s3, s0, s1, s2);
    s0 = t02, s1 = t12, s2 = t22, s3 = t32;
  }
  const t0 = xk[k++] ^ applySbox(sbox2, s0, s1, s2, s3);
  const t1 = xk[k++] ^ applySbox(sbox2, s1, s2, s3, s0);
  const t2 = xk[k++] ^ applySbox(sbox2, s2, s3, s0, s1);
  const t3 = xk[k++] ^ applySbox(sbox2, s3, s0, s1, s2);
  return { s0: t0, s1: t1, s2: t2, s3: t3 };
}
function decrypt(xk, s0, s1, s2, s3) {
  const { sbox2, T01, T23 } = tableDecoding;
  let k = 0;
  s0 ^= xk[k++], s1 ^= xk[k++], s2 ^= xk[k++], s3 ^= xk[k++];
  const rounds = xk.length / 4 - 2;
  for (let i = 0; i < rounds; i++) {
    const t02 = xk[k++] ^ apply0123(T01, T23, s0, s3, s2, s1);
    const t12 = xk[k++] ^ apply0123(T01, T23, s1, s0, s3, s2);
    const t22 = xk[k++] ^ apply0123(T01, T23, s2, s1, s0, s3);
    const t32 = xk[k++] ^ apply0123(T01, T23, s3, s2, s1, s0);
    s0 = t02, s1 = t12, s2 = t22, s3 = t32;
  }
  const t0 = xk[k++] ^ applySbox(sbox2, s0, s3, s2, s1);
  const t1 = xk[k++] ^ applySbox(sbox2, s1, s0, s3, s2);
  const t2 = xk[k++] ^ applySbox(sbox2, s2, s1, s0, s3);
  const t3 = xk[k++] ^ applySbox(sbox2, s3, s2, s1, s0);
  return { s0: t0, s1: t1, s2: t2, s3: t3 };
}
function ctrCounter(xk, nonce, src, dst) {
  abytes3(nonce, BLOCK_SIZE, "nonce");
  abytes3(src);
  const srcLen = src.length;
  dst = getOutput(srcLen, dst);
  complexOverlapBytes(src, dst);
  const ctr = nonce;
  const c32 = u322(ctr);
  const src32 = u322(src);
  const dst32 = u322(dst);
  let { s0, s1, s2, s3 } = encrypt(xk, swap8IfBE2(c32[0]), swap8IfBE2(c32[1]), swap8IfBE2(c32[2]), swap8IfBE2(c32[3]));
  for (let i = 0; i + 4 <= src32.length; i += 4) {
    dst32[i + 0] = src32[i + 0] ^ swap8IfBE2(s0);
    dst32[i + 1] = src32[i + 1] ^ swap8IfBE2(s1);
    dst32[i + 2] = src32[i + 2] ^ swap8IfBE2(s2);
    dst32[i + 3] = src32[i + 3] ^ swap8IfBE2(s3);
    incBytes(ctr, false, 1);
    ({ s0, s1, s2, s3 } = encrypt(xk, swap8IfBE2(c32[0]), swap8IfBE2(c32[1]), swap8IfBE2(c32[2]), swap8IfBE2(c32[3])));
  }
  const start = BLOCK_SIZE * Math.floor(src32.length / BLOCK_SIZE32);
  if (start < srcLen) {
    const b32 = new Uint32Array([s0, s1, s2, s3]);
    swap32IfBE2(b32);
    const buf = u82(b32);
    for (let i = start, pos = 0; i < srcLen; i++, pos++)
      dst[i] = src[i] ^ buf[pos];
    clean2(b32);
  }
  return dst;
}
function ctr32(xk, isLE2, nonce, src, dst) {
  abytes3(nonce, BLOCK_SIZE, "nonce");
  abytes3(src);
  dst = getOutput(src.length, dst);
  const ctr = nonce;
  const c32 = u322(ctr);
  const view = createView2(ctr);
  const src32 = u322(src);
  const dst32 = u322(dst);
  const ctrPos = isLE2 ? 0 : 12;
  const srcLen = src.length;
  let ctrNum = view.getUint32(ctrPos, isLE2);
  let { s0, s1, s2, s3 } = encrypt(xk, swap8IfBE2(c32[0]), swap8IfBE2(c32[1]), swap8IfBE2(c32[2]), swap8IfBE2(c32[3]));
  for (let i = 0; i + 4 <= src32.length; i += 4) {
    dst32[i + 0] = src32[i + 0] ^ swap8IfBE2(s0);
    dst32[i + 1] = src32[i + 1] ^ swap8IfBE2(s1);
    dst32[i + 2] = src32[i + 2] ^ swap8IfBE2(s2);
    dst32[i + 3] = src32[i + 3] ^ swap8IfBE2(s3);
    ctrNum = ctrNum + 1 >>> 0;
    view.setUint32(ctrPos, ctrNum, isLE2);
    ({ s0, s1, s2, s3 } = encrypt(xk, swap8IfBE2(c32[0]), swap8IfBE2(c32[1]), swap8IfBE2(c32[2]), swap8IfBE2(c32[3])));
  }
  const start = BLOCK_SIZE * Math.floor(src32.length / BLOCK_SIZE32);
  if (start < srcLen) {
    const b32 = new Uint32Array([s0, s1, s2, s3]);
    swap32IfBE2(b32);
    const buf = u82(b32);
    for (let i = start, pos = 0; i < srcLen; i++, pos++)
      dst[i] = src[i] ^ buf[pos];
    clean2(b32);
  }
  return dst;
}
function isBytes32(a) {
  return a instanceof Uint32Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint32Array";
}
function encryptBlock(xk, block2) {
  abytes3(block2, 16, "block");
  if (!isBytes32(xk))
    throw new Error("_encryptBlock accepts result of expandKeyLE");
  const b32 = u322(block2);
  swap32IfBE2(b32);
  let { s0, s1, s2, s3 } = encrypt(xk, b32[0], b32[1], b32[2], b32[3]);
  b32[0] = s0, b32[1] = s1, b32[2] = s2, b32[3] = s3;
  swap32IfBE2(b32);
  return block2;
}
function decryptBlock(xk, block2) {
  abytes3(block2, 16, "block");
  if (!isBytes32(xk))
    throw new Error("_decryptBlock accepts result of expandKeyLE");
  const b32 = u322(block2);
  swap32IfBE2(b32);
  let { s0, s1, s2, s3 } = decrypt(xk, b32[0], b32[1], b32[2], b32[3]);
  b32[0] = s0, b32[1] = s1, b32[2] = s2, b32[3] = s3;
  swap32IfBE2(b32);
  return block2;
}
function dbl(block2) {
  let carry = 0;
  for (let i = BLOCK_SIZE - 1; i >= 0; i--) {
    const newCarry = (block2[i] & 128) >>> 7;
    block2[i] = block2[i] << 1 | carry;
    carry = newCarry;
  }
  if (carry) {
    block2[BLOCK_SIZE - 1] ^= 135;
  }
  return block2;
}
function xorBlock(a, b) {
  if (a.length !== b.length)
    throw new Error("xorBlock: blocks must have same length");
  for (let i = 0; i < a.length; i++) {
    a[i] = a[i] ^ b[i];
  }
  return a;
}
function xorend(a, b) {
  if (b.length > a.length) {
    throw new Error("xorend: len(B) must be less than or equal to len(A)");
  }
  const offset = a.length - b.length;
  for (let i = 0; i < b.length; i++) {
    a[offset + i] = a[offset + i] ^ b[i];
  }
  return a;
}
var _CMAC = class {
  blockLen = BLOCK_SIZE;
  outputLen = BLOCK_SIZE;
  // CMAC can only decide between `K1` and `K2` once the true final block is known,
  // so updates process older blocks eagerly but keep one pending block buffered.
  buffer;
  pos;
  finished;
  destroyed;
  k1;
  k2;
  x;
  xk;
  constructor(key) {
    abytes3(key);
    validateKeyLength(key);
    this.xk = expandKeyLE(key);
    this.buffer = new Uint8Array(BLOCK_SIZE);
    this.pos = 0;
    this.finished = false;
    this.destroyed = false;
    this.x = new Uint8Array(BLOCK_SIZE);
    const L2 = new Uint8Array(BLOCK_SIZE);
    encryptBlock(this.xk, L2);
    this.k1 = dbl(L2);
    this.k2 = dbl(new Uint8Array(this.k1));
  }
  process(data) {
    xorBlock(this.x, data);
    encryptBlock(this.xk, this.x);
  }
  update(data) {
    if (this.destroyed)
      throw new Error("Hash instance has been destroyed");
    if (this.finished)
      throw new Error("Hash#digest() has already been called");
    abytes3(data);
    let pos = 0;
    if (this.pos) {
      const take = Math.min(BLOCK_SIZE - this.pos, data.length);
      this.buffer.set(data.subarray(0, take), this.pos);
      this.pos += take;
      pos = take;
      if (this.pos === BLOCK_SIZE && pos < data.length) {
        this.process(this.buffer);
        this.pos = 0;
      }
    }
    while (pos + BLOCK_SIZE < data.length) {
      this.process(data.subarray(pos, pos + BLOCK_SIZE));
      pos += BLOCK_SIZE;
    }
    if (pos < data.length) {
      this.buffer.set(data.subarray(pos), 0);
      this.pos = data.length - pos;
    }
    return this;
  }
  // See {@link https://www.rfc-editor.org/rfc/rfc4493.html#section-2.4 | RFC 4493 Section 2.4}.
  digestInto(out) {
    if (this.destroyed)
      throw new Error("Hash instance has been destroyed");
    if (this.finished)
      throw new Error("Hash#digest() has already been called");
    aoutput2(out, this, true);
    this.finished = true;
    const view = out.subarray(0, this.outputLen);
    let last = new Uint8Array(BLOCK_SIZE);
    if (this.pos === BLOCK_SIZE) {
      last.set(this.buffer);
      xorBlock(last, this.k1);
    } else {
      last.set(this.buffer.subarray(0, this.pos));
      last[this.pos] = 128;
      xorBlock(last, this.k2);
    }
    view.set(this.x);
    xorBlock(view, last);
    encryptBlock(this.xk, view);
    clean2(last);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  destroy() {
    const { buffer, destroyed, x, xk, k1, k2 } = this;
    if (destroyed)
      return;
    this.destroyed = true;
    clean2(buffer, x, xk, k1, k2);
  }
};
var cmac = /* @__PURE__ */ wrapMacConstructor(16, (key) => new _CMAC(key));
function s2v(key, strings) {
  validateKeyLength(key);
  const len = strings.length;
  if (len > 127) {
    throw new Error("s2v: number of input strings must be less than or equal to 127");
  }
  if (len === 0)
    return cmac(ONE_BLOCK, key);
  let d = cmac(EMPTY_BLOCK, key);
  for (let i = 0; i < len - 1; i++) {
    dbl(d);
    const cmacResult = cmac(strings[i], key);
    xorBlock(d, cmacResult);
    clean2(cmacResult);
  }
  const s_n = strings[len - 1];
  abytes3(s_n);
  let t;
  if (s_n.byteLength >= BLOCK_SIZE) {
    t = xorend(Uint8Array.from(s_n), d);
  } else {
    const paddedSn = new Uint8Array(BLOCK_SIZE);
    paddedSn.set(s_n);
    paddedSn[s_n.length] = 128;
    t = xorBlock(dbl(d), paddedSn);
    clean2(paddedSn);
  }
  const result = cmac(t, key);
  clean2(d, t);
  return result;
}
var unsafe = /* @__PURE__ */ Object.freeze({
  expandKeyLE,
  expandKeyDecLE,
  encrypt,
  decrypt,
  encryptBlock,
  decryptBlock,
  ctrCounter,
  ctr32,
  dbl,
  xorBlock,
  xorend,
  s2v
});

// node_modules/@noble/ciphers/ff1.js
var { expandKeyLE: expandKeyLE2, encryptBlock: encryptBlock2 } = unsafe;
var BLOCK_LEN2 = 16;
function mod2(a, b) {
  const result = a % b;
  return result >= 0 ? result : b + result;
}
function NUMradix(radix3, data) {
  let res = BigInt(0);
  for (let i of data)
    res = res * BigInt(radix3) + BigInt(i);
  return res;
}
function getRound(radix3, key, tweak, x) {
  if (radix3 > 2 ** 16 - 1)
    throw new Error("invalid radix " + radix3);
  const minLen = Math.ceil(Math.log(100) / Math.log(radix3));
  const maxLen = 2 ** 32 - 1;
  if (2 > minLen || minLen > maxLen || maxLen >= 2 ** 32)
    throw new Error("Invalid radix: 2 \u2264 minlen \u2264 maxlen < 2**32");
  if (!Array.isArray(x))
    throw new Error("invalid X");
  if (x.length < minLen || x.length > maxLen)
    throw new Error("X is outside minLen..maxLen bounds");
  for (const i of x) {
    if (!Number.isSafeInteger(i) || i < 0 || i >= radix3)
      throw new Error("invalid X: digit outside radix");
  }
  const u = Math.floor(x.length / 2);
  const v = x.length - u;
  const b = Math.ceil(Math.ceil(v * Math.log2(radix3)) / 8);
  const d = 4 * Math.ceil(b / 4) + 4;
  const padding2 = mod2(-tweak.length - b - 1, 16);
  const P2 = Uint8Array.from([1, 2, 1, 0, 0, 0, 10, u, 0, 0, 0, 0, 0, 0, 0, 0]);
  const view = new DataView(P2.buffer);
  view.setUint16(4, radix3, false);
  view.setUint32(8, x.length, false);
  view.setUint32(12, tweak.length, false);
  const PQ = new Uint8Array(P2.length + tweak.length + padding2 + 1 + b);
  PQ.set(P2);
  clean2(P2);
  PQ.set(tweak, P2.length);
  const xk = expandKeyLE2(key);
  const round = (A, B, i, decrypt2 = false) => {
    PQ[PQ.length - b - 1] = i;
    if (b)
      PQ.set(numberToBytesBE2(NUMradix(radix3, B), b), PQ.length - b);
    let r = new Uint8Array(16);
    for (let j = 0; j < PQ.length / BLOCK_LEN2; j++) {
      for (let i2 = 0; i2 < BLOCK_LEN2; i2++)
        r[i2] ^= PQ[j * BLOCK_LEN2 + i2];
      encryptBlock2(xk, r);
    }
    let s = Array.from(r);
    for (let j = 1; s.length < d; j++) {
      const block2 = numberToBytesBE2(BigInt(j), 16);
      for (let k = 0; k < BLOCK_LEN2; k++)
        block2[k] ^= r[k];
      s.push(...Array.from(encryptBlock2(xk, block2)));
    }
    let y = bytesToNumberBE2(Uint8Array.from(s.slice(0, d)));
    s.fill(0);
    if (decrypt2)
      y = -y;
    const m = i % 2 === 0 ? u : v;
    let c = mod2(NUMradix(radix3, A) + y, BigInt(radix3) ** BigInt(m));
    const C = Array(m).fill(0);
    for (let i2 = 0; i2 < m; i2++, c /= BigInt(radix3))
      C[m - 1 - i2] = Number(c % BigInt(radix3));
    A.fill(0);
    A = B;
    B = C;
    return [A, B];
  };
  const destroy = () => {
    clean2(xk, PQ);
  };
  return { u, round, destroy };
}
var EMPTY_BUF = /* @__PURE__ */ Uint8Array.of();
function FF1(radix3, key, tweak = EMPTY_BUF) {
  anumber3(radix3);
  abytes3(key);
  abytes3(tweak);
  const PQ = getRound.bind(null, radix3, key, tweak);
  return {
    encrypt(x) {
      const { u, round, destroy } = PQ(x);
      let [A, B] = [x.slice(0, u), x.slice(u)];
      for (let i = 0; i < 10; i++)
        [A, B] = round(A, B, i);
      destroy();
      const res = A.concat(B);
      A.fill(0);
      B.fill(0);
      return res;
    },
    decrypt(x) {
      const { u, round, destroy } = PQ(x);
      let [B, A] = [x.slice(0, u), x.slice(u)];
      for (let i = 9; i >= 0; i--)
        [A, B] = round(A, B, i, true);
      destroy();
      const res = B.concat(A);
      A.fill(0);
      B.fill(0);
      return res;
    }
  };
}
var binLE = {
  encode(bytes5) {
    const x = [];
    for (let i = 0; i < bytes5.length; i++) {
      for (let j = 0, tmp = bytes5[i]; j < 8; j++, tmp >>= 1)
        x.push(tmp & 1);
    }
    return x;
  },
  decode(b) {
    if (!Array.isArray(b) || b.length % 8)
      throw new Error("Invalid binary string");
    const res = new Uint8Array(b.length / 8);
    for (let i = 0, j = 0; i < res.length; i++) {
      res[i] = b[j++] | b[j++] << 1 | b[j++] << 2 | b[j++] << 3;
      res[i] |= b[j++] << 4 | b[j++] << 5 | b[j++] << 6 | b[j++] << 7;
    }
    return res;
  }
};
function BinaryFF1(key, tweak = EMPTY_BUF) {
  const ff12 = FF1(2, key, tweak);
  return {
    encrypt: (x) => binLE.decode(ff12.encrypt(binLE.encode(x))),
    decrypt: (x) => binLE.decode(ff12.decrypt(binLE.encode(x)))
  };
}

// src/notes.js
var text = new TextEncoder();
var MAX_MONEY_SATS = 2100000000000000000n;
var X25519_FIELD = (1n << 255n) - 19n;
var OWNER_TAG = text.encode("NIP043/owner/CP1");
var NK_TAG = text.encode("NIP043/nk/CP1");
var CM_TAG = text.encode("NIP043/cm/CP1");
var NF_TAG = text.encode("NIP043/nf/CP1");
function bytes32(value, name) {
  if (!(value instanceof Uint8Array) || value.length !== 32) {
    throw new TypeError(`${name} must contain 32 bytes`);
  }
  return value;
}
function join(...parts) {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}
function validViewPublic(value) {
  bytes32(value, "viewPub");
  let element = 0n;
  for (let i = 31; i >= 0; i--) element = element * 256n + BigInt(value[i]);
  if (element === 0n || element >= X25519_FIELD) {
    throw new RangeError("noncanonical X25519 view public key");
  }
  return value;
}
function amountValue(amount) {
  if (typeof amount !== "bigint" && !(typeof amount === "string" && /^[1-9][0-9]*$/.test(amount))) {
    throw new TypeError("amount must be an exact positive bigint or decimal string");
  }
  const value = BigInt(amount);
  if (value < 1n || value > MAX_MONEY_SATS) {
    throw new RangeError("amount exceeds allowed atomic value");
  }
  return value;
}
function encodeNote({ domain, assetId, owner, viewPub, amountAtomic, rho }) {
  bytes32(domain, "domain");
  bytes32(assetId, "assetId");
  bytes32(owner, "owner");
  validViewPublic(viewPub);
  bytes32(rho, "rho");
  if (decodeField(owner) === 0n) throw new RangeError("owner must be nonzero");
  const amount = amountValue(amountAtomic);
  const littleEndian = new Uint8Array(8);
  let remaining = amount;
  for (let i = 0; i < 8; i++) {
    littleEndian[i] = Number(remaining & 255n);
    remaining >>= 8n;
  }
  return join(Uint8Array.of(1), domain, assetId, owner, viewPub, littleEndian, rho);
}
function decodeNote(note) {
  if (!(note instanceof Uint8Array) || note.length !== 169 || note[0] !== 1) {
    throw new TypeError("invalid CP1 note encoding");
  }
  const domain = note.slice(1, 33);
  const assetId = note.slice(33, 65);
  const owner = note.slice(65, 97);
  const viewPub = validViewPublic(note.slice(97, 129));
  const rho = note.slice(137, 169);
  if (decodeField(owner) === 0n) throw new RangeError("owner must be nonzero");
  let amountAtomic = 0n;
  for (let i = 7; i >= 0; i--) amountAtomic = amountAtomic * 256n + BigInt(note[129 + i]);
  amountValue(amountAtomic);
  return { domain, assetId, owner, viewPub, amountAtomic, rho };
}
function deriveOwner(domain, spendSecret) {
  return poseidonBytes(join(OWNER_TAG, bytes32(domain, "domain"), bytes32(spendSecret, "spendSecret")));
}
function deriveNullifierKey(domain, spendSecret) {
  return poseidonBytes(join(NK_TAG, bytes32(domain, "domain"), bytes32(spendSecret, "spendSecret")));
}
function noteCommitment(note) {
  decodeNote(note);
  const cm = poseidonBytes(join(CM_TAG, note));
  if (decodeField(cm) === 0n) throw new RangeError("note commitment must be nonzero");
  return cm;
}
function noteNullifier(note, spendSecret) {
  const { domain, owner, rho } = decodeNote(note);
  const derivedOwner = deriveOwner(domain, spendSecret);
  let different = 0;
  for (let i = 0; i < 32; i++) different |= owner[i] ^ derivedOwner[i];
  if (different !== 0) {
    throw new Error("spend secret does not own this note");
  }
  return poseidonBytes(join(
    NF_TAG,
    domain,
    deriveNullifierKey(domain, spendSecret),
    rho,
    noteCommitment(note)
  ));
}

// src/c7-publication.js
var RECORD_BYTES = 230;
var utf8 = (value) => new TextEncoder().encode(value);
var demand = (condition, message) => {
  if (!condition) throw new Error(message);
};
function bytes(value, size, label2) {
  demand(value instanceof Uint8Array && value.length === size, `${label2} must be ${size} bytes`);
  return value;
}
function concat(...items) {
  const result = new Uint8Array(items.reduce((n, x) => n + x.length, 0));
  let offset = 0;
  for (const item of items) {
    result.set(item, offset);
    offset += item.length;
  }
  return result;
}
function le64(value) {
  demand(typeof value === "bigint" && value >= 0n && value < 1n << 64n, "Expected unsigned 64-bit bigint");
  const result = new Uint8Array(8);
  for (let i = 0; i < 8; i++, value >>= 8n) result[i] = Number(value & 255n);
  return result;
}
var same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
function layout(form) {
  const deposit = form === "D0" || form === "D1";
  demand(deposit || /^T[1-3]$/.test(form), "Unsupported C7 publication form");
  const count = deposit ? 1 : Number(form[1]);
  return { deposit, count, recordsAt: 34 + count * 32, end: 34 + count * (32 + RECORD_BYTES) };
}
function record(value) {
  bytes(value, RECORD_BYTES, "C7 record");
  demand(value[0] === 2, "Noncanonical C7 record");
  return value;
}
function c7PublicationContext({ domain, assetId, unit, registryRoot = new Uint8Array(32) }) {
  bytes(domain, 32, "Domain");
  bytes(assetId, 32, "Asset ID");
  bytes(registryRoot, 32, "Registry root");
  decodeField(registryRoot);
  demand(typeof unit === "bigint" && Array.from({ length: 9 }, (_, i) => 10n ** BigInt(i)).includes(unit), "Invalid asset quantum");
  return poseidonBytes(concat(utf8("NeuraiPoolCtx"), Uint8Array.of(1), domain, assetId, le64(unit), registryRoot));
}
function decodeC7Publication(form, blob) {
  bytes(blob, 4096, "C7 publication");
  const spec = layout(form);
  demand(blob[0] === 2 && blob[1] === spec.count, "C7 publication version/count mismatch");
  demand(blob.slice(spec.end).every((x) => x === 0), "Noncanonical C7 publication padding");
  const nf = spec.deposit ? null : blob.slice(2, 34);
  if (spec.deposit) demand(blob.slice(2, 34).every((x) => x === 0), "Deposit cannot carry a nullifier");
  else demand(decodeField(nf) !== 0n, "Zero nullifier");
  const cms = [], records = [];
  for (let i = 0; i < spec.count; i++) {
    const cm = blob.slice(34 + i * 32, 66 + i * 32);
    demand(decodeField(cm) !== 0n && !cms.some((other) => same(other, cm)), "Zero or duplicate commitment");
    cms.push(cm);
    records.push(record(blob.slice(spec.recordsAt + i * RECORD_BYTES, spec.recordsAt + (i + 1) * RECORD_BYTES)));
  }
  return { cms, records, nf };
}
function encodeC7Publication(form, { cms, records, nf = null }) {
  const spec = layout(form);
  demand(Array.isArray(cms) && Array.isArray(records) && cms.length === spec.count && records.length === spec.count, "Wrong note count");
  demand(spec.deposit ? nf === null : nf instanceof Uint8Array, "Wrong nullifier presence");
  const result = new Uint8Array(4096);
  result.set([2, spec.count]);
  if (!spec.deposit) result.set(bytes(nf, 32, "Nullifier"), 2);
  cms.forEach((cm, i) => result.set(bytes(cm, 32, "Commitment"), 34 + i * 32));
  records.forEach((value, i) => result.set(record(value), spec.recordsAt + i * RECORD_BYTES));
  decodeC7Publication(form, result);
  return result;
}
function c7PublicationHash(form, blob) {
  decodeC7Publication(form, blob);
  const seed = poseidonBytes(utf8("NIP045/dat"));
  return poseidonBytes(concat(poseidonBytes(concat(seed, blob.slice(0, 2048))), blob.slice(2048)));
}

// node_modules/@scure/bip39/node_modules/@noble/hashes/utils.js
function isBytes4(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes4(value, length, title = "") {
  const bytes5 = isBytes4(value);
  const len = value?.length;
  const needsLen = length !== void 0;
  if (!bytes5 || needsLen && len !== length) {
    const prefix = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes5 ? `length=${len}` : `type=${typeof value}`;
    throw new Error(prefix + "expected Uint8Array" + ofLen + ", got " + got);
  }
  return value;
}
function aexists3(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput3(out, instance) {
  abytes4(out, void 0, "digestInto() output");
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error('"digestInto() output" expected to be of length >=' + min);
  }
}
function clean3(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView3(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
function createHasher3(hashCons, info = {}) {
  const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
  const tmp = hashCons(void 0);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (opts) => hashCons(opts);
  Object.assign(hashC, info);
  return Object.freeze(hashC);
}
var oidNist = (suffix) => ({
  oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
});

// node_modules/@scure/bip39/node_modules/@noble/hashes/_md.js
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD = class {
  blockLen;
  outputLen;
  padOffset;
  isLE;
  // For partial updates less than block size
  buffer;
  view;
  finished = false;
  length = 0;
  pos = 0;
  destroyed = false;
  constructor(blockLen, outputLen, padOffset, isLE2) {
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE2;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView3(this.buffer);
  }
  update(data) {
    aexists3(this);
    abytes4(data);
    const { view, buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView3(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists3(this);
    aoutput3(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE: isLE2 } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean3(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++)
      buffer[i] = 0;
    view.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE2);
    this.process(view, 0);
    const oview = createView3(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen must be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE2);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to ||= new this.constructor();
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (length % blockLen)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);

// node_modules/@scure/bip39/node_modules/@noble/hashes/sha2.js
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA2_32B = class extends HashMD {
  constructor(outputLen) {
    super(64, outputLen, 8, false);
  }
  get() {
    const { A, B, C, D, E, F, G: G2, H } = this;
    return [A, B, C, D, E, F, G2, H];
  }
  // prettier-ignore
  set(A, B, C, D, E, F, G2, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G2 | 0;
    this.H = H | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W[i] = view.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G: G2, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G2) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma0 + Maj(A, B, C) | 0;
      H = G2;
      G2 = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G2 = G2 + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G2, H);
  }
  roundClean() {
    clean3(SHA256_W);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean3(this.buffer);
  }
};
var _SHA256 = class extends SHA2_32B {
  // We cannot use array here since array allows indexing by variable
  // which means optimizer/compiler cannot use registers.
  A = SHA256_IV[0] | 0;
  B = SHA256_IV[1] | 0;
  C = SHA256_IV[2] | 0;
  D = SHA256_IV[3] | 0;
  E = SHA256_IV[4] | 0;
  F = SHA256_IV[5] | 0;
  G = SHA256_IV[6] | 0;
  H = SHA256_IV[7] | 0;
  constructor() {
    super(32);
  }
};
var sha2562 = /* @__PURE__ */ createHasher3(
  () => new _SHA256(),
  /* @__PURE__ */ oidNist(1)
);

// node_modules/@scure/base/index.js
function isBytes5(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function isArrayOf(isString, arr) {
  if (!Array.isArray(arr))
    return false;
  if (arr.length === 0)
    return true;
  if (isString) {
    return arr.every((item) => typeof item === "string");
  } else {
    return arr.every((item) => Number.isSafeInteger(item));
  }
}
function afn(input) {
  if (typeof input !== "function")
    throw new Error("function expected");
  return true;
}
function astr(label2, input) {
  if (typeof input !== "string")
    throw new Error(`${label2}: string expected`);
  return true;
}
function anumber4(n) {
  if (!Number.isSafeInteger(n))
    throw new Error(`invalid integer: ${n}`);
}
function aArr(input) {
  if (!Array.isArray(input))
    throw new Error("array expected");
}
function astrArr(label2, input) {
  if (!isArrayOf(true, input))
    throw new Error(`${label2}: array of strings expected`);
}
function anumArr(label2, input) {
  if (!isArrayOf(false, input))
    throw new Error(`${label2}: array of numbers expected`);
}
// @__NO_SIDE_EFFECTS__
function chain(...args) {
  const id = (a) => a;
  const wrap = (a, b) => (c) => a(b(c));
  const encode = args.map((x) => x.encode).reduceRight(wrap, id);
  const decode = args.map((x) => x.decode).reduce(wrap, id);
  return { encode, decode };
}
// @__NO_SIDE_EFFECTS__
function alphabet(letters) {
  const lettersA = typeof letters === "string" ? letters.split("") : letters;
  const len = lettersA.length;
  astrArr("alphabet", lettersA);
  const indexes = new Map(lettersA.map((l, i) => [l, i]));
  return {
    encode: (digits) => {
      aArr(digits);
      return digits.map((i) => {
        if (!Number.isSafeInteger(i) || i < 0 || i >= len)
          throw new Error(`alphabet.encode: digit index outside alphabet "${i}". Allowed: ${letters}`);
        return lettersA[i];
      });
    },
    decode: (input) => {
      aArr(input);
      return input.map((letter) => {
        astr("alphabet.decode", letter);
        const i = indexes.get(letter);
        if (i === void 0)
          throw new Error(`Unknown letter: "${letter}". Allowed: ${letters}`);
        return i;
      });
    }
  };
}
// @__NO_SIDE_EFFECTS__
function join2(separator = "") {
  astr("join", separator);
  return {
    encode: (from) => {
      astrArr("join.decode", from);
      return from.join(separator);
    },
    decode: (to) => {
      astr("join.decode", to);
      return to.split(separator);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function padding(bits, chr = "=") {
  anumber4(bits);
  astr("padding", chr);
  return {
    encode(data) {
      astrArr("padding.encode", data);
      while (data.length * bits % 8)
        data.push(chr);
      return data;
    },
    decode(input) {
      astrArr("padding.decode", input);
      let end = input.length;
      if (end * bits % 8)
        throw new Error("padding: invalid, string should have whole number of bytes");
      for (; end > 0 && input[end - 1] === chr; end--) {
        const last = end - 1;
        const byte = last * bits;
        if (byte % 8 === 0)
          throw new Error("padding: invalid, string has too much padding");
      }
      return input.slice(0, end);
    }
  };
}
function convertRadix(data, from, to) {
  if (from < 2)
    throw new Error(`convertRadix: invalid from=${from}, base cannot be less than 2`);
  if (to < 2)
    throw new Error(`convertRadix: invalid to=${to}, base cannot be less than 2`);
  aArr(data);
  if (!data.length)
    return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data, (d) => {
    anumber4(d);
    if (d < 0 || d >= from)
      throw new Error(`invalid integer: ${d}`);
    return d;
  });
  const dlen = digits.length;
  while (true) {
    let carry = 0;
    let done = true;
    for (let i = pos; i < dlen; i++) {
      const digit = digits[i];
      const fromCarry = from * carry;
      const digitBase = fromCarry + digit;
      if (!Number.isSafeInteger(digitBase) || fromCarry / from !== carry || digitBase - digit !== fromCarry) {
        throw new Error("convertRadix: carry overflow");
      }
      const div = digitBase / to;
      carry = digitBase % to;
      const rounded = Math.floor(div);
      digits[i] = rounded;
      if (!Number.isSafeInteger(rounded) || rounded * to + carry !== digitBase)
        throw new Error("convertRadix: carry overflow");
      if (!done)
        continue;
      else if (!rounded)
        pos = i;
      else
        done = false;
    }
    res.push(carry);
    if (done)
      break;
  }
  for (let i = 0; i < data.length - 1 && data[i] === 0; i++)
    res.push(0);
  return res.reverse();
}
var gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
var radix2carry = /* @__NO_SIDE_EFFECTS__ */ (from, to) => from + (to - gcd(from, to));
var powers = /* @__PURE__ */ (() => {
  let res = [];
  for (let i = 0; i < 40; i++)
    res.push(2 ** i);
  return res;
})();
function convertRadix2(data, from, to, padding2) {
  aArr(data);
  if (from <= 0 || from > 32)
    throw new Error(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32)
    throw new Error(`convertRadix2: wrong to=${to}`);
  if (/* @__PURE__ */ radix2carry(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${/* @__PURE__ */ radix2carry(from, to)}`);
  }
  let carry = 0;
  let pos = 0;
  const max = powers[from];
  const mask = powers[to] - 1;
  const res = [];
  for (const n of data) {
    anumber4(n);
    if (n >= max)
      throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32)
      throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;
    for (; pos >= to; pos -= to)
      res.push((carry >> pos - to & mask) >>> 0);
    const pow = powers[pos];
    if (pow === void 0)
      throw new Error("invalid carry");
    carry &= pow - 1;
  }
  carry = carry << to - pos & mask;
  if (!padding2 && pos >= from)
    throw new Error("Excess padding");
  if (!padding2 && carry > 0)
    throw new Error(`Non-zero padding: ${carry}`);
  if (padding2 && pos > 0)
    res.push(carry >>> 0);
  return res;
}
// @__NO_SIDE_EFFECTS__
function radix(num2) {
  anumber4(num2);
  const _256 = 2 ** 8;
  return {
    encode: (bytes5) => {
      if (!isBytes5(bytes5))
        throw new Error("radix.encode input should be Uint8Array");
      return convertRadix(Array.from(bytes5), _256, num2);
    },
    decode: (digits) => {
      anumArr("radix.decode", digits);
      return Uint8Array.from(convertRadix(digits, num2, _256));
    }
  };
}
// @__NO_SIDE_EFFECTS__
function radix2(bits, revPadding = false) {
  anumber4(bits);
  if (bits <= 0 || bits > 32)
    throw new Error("radix2: bits should be in (0..32]");
  if (/* @__PURE__ */ radix2carry(8, bits) > 32 || /* @__PURE__ */ radix2carry(bits, 8) > 32)
    throw new Error("radix2: carry overflow");
  return {
    encode: (bytes5) => {
      if (!isBytes5(bytes5))
        throw new Error("radix2.encode input should be Uint8Array");
      return convertRadix2(Array.from(bytes5), 8, bits, !revPadding);
    },
    decode: (digits) => {
      anumArr("radix2.decode", digits);
      return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
    }
  };
}
function checksum(len, fn) {
  anumber4(len);
  afn(fn);
  return {
    encode(data) {
      if (!isBytes5(data))
        throw new Error("checksum.encode: input should be Uint8Array");
      const sum = fn(data).slice(0, len);
      const res = new Uint8Array(data.length + len);
      res.set(data);
      res.set(sum, data.length);
      return res;
    },
    decode(data) {
      if (!isBytes5(data))
        throw new Error("checksum.decode: input should be Uint8Array");
      const payload = data.slice(0, -len);
      const oldChecksum = data.slice(-len);
      const newChecksum = fn(payload).slice(0, len);
      for (let i = 0; i < len; i++)
        if (newChecksum[i] !== oldChecksum[i])
          throw new Error("Invalid checksum");
      return payload;
    }
  };
}
var utils = {
  alphabet,
  chain,
  checksum,
  convertRadix,
  convertRadix2,
  radix,
  radix2,
  join: join2,
  padding
};

// node_modules/@scure/bip39/index.js
function nfkd(str) {
  if (typeof str !== "string")
    throw new TypeError("invalid mnemonic type: " + typeof str);
  return str.normalize("NFKD");
}
function normalize(str) {
  const norm = nfkd(str);
  const words = norm.split(" ");
  if (![12, 15, 18, 21, 24].includes(words.length))
    throw new Error("Invalid mnemonic");
  return { nfkd: norm, words };
}
function aentropy(ent) {
  abytes4(ent);
  if (![16, 20, 24, 28, 32].includes(ent.length))
    throw new Error("invalid entropy length");
}
var calcChecksum = (entropy) => {
  const bitsLeft = 8 - entropy.length / 4;
  return new Uint8Array([sha2562(entropy)[0] >> bitsLeft << bitsLeft]);
};
function getCoder(wordlist2) {
  if (!Array.isArray(wordlist2) || wordlist2.length !== 2048 || typeof wordlist2[0] !== "string")
    throw new Error("Wordlist: expected array of 2048 strings");
  wordlist2.forEach((i) => {
    if (typeof i !== "string")
      throw new Error("wordlist: non-string element: " + i);
  });
  return utils.chain(utils.checksum(1, calcChecksum), utils.radix2(11, true), utils.alphabet(wordlist2));
}
function mnemonicToEntropy(mnemonic, wordlist2) {
  const { words } = normalize(mnemonic);
  const entropy = getCoder(wordlist2).decode(words);
  aentropy(entropy);
  return entropy;
}
function validateMnemonic(mnemonic, wordlist2) {
  try {
    mnemonicToEntropy(mnemonic, wordlist2);
  } catch (e) {
    return false;
  }
  return true;
}

// node_modules/@scure/bip39/wordlists/english.js
var wordlist = `abandon
ability
able
about
above
absent
absorb
abstract
absurd
abuse
access
accident
account
accuse
achieve
acid
acoustic
acquire
across
act
action
actor
actress
actual
adapt
add
addict
address
adjust
admit
adult
advance
advice
aerobic
affair
afford
afraid
again
age
agent
agree
ahead
aim
air
airport
aisle
alarm
album
alcohol
alert
alien
all
alley
allow
almost
alone
alpha
already
also
alter
always
amateur
amazing
among
amount
amused
analyst
anchor
ancient
anger
angle
angry
animal
ankle
announce
annual
another
answer
antenna
antique
anxiety
any
apart
apology
appear
apple
approve
april
arch
arctic
area
arena
argue
arm
armed
armor
army
around
arrange
arrest
arrive
arrow
art
artefact
artist
artwork
ask
aspect
assault
asset
assist
assume
asthma
athlete
atom
attack
attend
attitude
attract
auction
audit
august
aunt
author
auto
autumn
average
avocado
avoid
awake
aware
away
awesome
awful
awkward
axis
baby
bachelor
bacon
badge
bag
balance
balcony
ball
bamboo
banana
banner
bar
barely
bargain
barrel
base
basic
basket
battle
beach
bean
beauty
because
become
beef
before
begin
behave
behind
believe
below
belt
bench
benefit
best
betray
better
between
beyond
bicycle
bid
bike
bind
biology
bird
birth
bitter
black
blade
blame
blanket
blast
bleak
bless
blind
blood
blossom
blouse
blue
blur
blush
board
boat
body
boil
bomb
bone
bonus
book
boost
border
boring
borrow
boss
bottom
bounce
box
boy
bracket
brain
brand
brass
brave
bread
breeze
brick
bridge
brief
bright
bring
brisk
broccoli
broken
bronze
broom
brother
brown
brush
bubble
buddy
budget
buffalo
build
bulb
bulk
bullet
bundle
bunker
burden
burger
burst
bus
business
busy
butter
buyer
buzz
cabbage
cabin
cable
cactus
cage
cake
call
calm
camera
camp
can
canal
cancel
candy
cannon
canoe
canvas
canyon
capable
capital
captain
car
carbon
card
cargo
carpet
carry
cart
case
cash
casino
castle
casual
cat
catalog
catch
category
cattle
caught
cause
caution
cave
ceiling
celery
cement
census
century
cereal
certain
chair
chalk
champion
change
chaos
chapter
charge
chase
chat
cheap
check
cheese
chef
cherry
chest
chicken
chief
child
chimney
choice
choose
chronic
chuckle
chunk
churn
cigar
cinnamon
circle
citizen
city
civil
claim
clap
clarify
claw
clay
clean
clerk
clever
click
client
cliff
climb
clinic
clip
clock
clog
close
cloth
cloud
clown
club
clump
cluster
clutch
coach
coast
coconut
code
coffee
coil
coin
collect
color
column
combine
come
comfort
comic
common
company
concert
conduct
confirm
congress
connect
consider
control
convince
cook
cool
copper
copy
coral
core
corn
correct
cost
cotton
couch
country
couple
course
cousin
cover
coyote
crack
cradle
craft
cram
crane
crash
crater
crawl
crazy
cream
credit
creek
crew
cricket
crime
crisp
critic
crop
cross
crouch
crowd
crucial
cruel
cruise
crumble
crunch
crush
cry
crystal
cube
culture
cup
cupboard
curious
current
curtain
curve
cushion
custom
cute
cycle
dad
damage
damp
dance
danger
daring
dash
daughter
dawn
day
deal
debate
debris
decade
december
decide
decline
decorate
decrease
deer
defense
define
defy
degree
delay
deliver
demand
demise
denial
dentist
deny
depart
depend
deposit
depth
deputy
derive
describe
desert
design
desk
despair
destroy
detail
detect
develop
device
devote
diagram
dial
diamond
diary
dice
diesel
diet
differ
digital
dignity
dilemma
dinner
dinosaur
direct
dirt
disagree
discover
disease
dish
dismiss
disorder
display
distance
divert
divide
divorce
dizzy
doctor
document
dog
doll
dolphin
domain
donate
donkey
donor
door
dose
double
dove
draft
dragon
drama
drastic
draw
dream
dress
drift
drill
drink
drip
drive
drop
drum
dry
duck
dumb
dune
during
dust
dutch
duty
dwarf
dynamic
eager
eagle
early
earn
earth
easily
east
easy
echo
ecology
economy
edge
edit
educate
effort
egg
eight
either
elbow
elder
electric
elegant
element
elephant
elevator
elite
else
embark
embody
embrace
emerge
emotion
employ
empower
empty
enable
enact
end
endless
endorse
enemy
energy
enforce
engage
engine
enhance
enjoy
enlist
enough
enrich
enroll
ensure
enter
entire
entry
envelope
episode
equal
equip
era
erase
erode
erosion
error
erupt
escape
essay
essence
estate
eternal
ethics
evidence
evil
evoke
evolve
exact
example
excess
exchange
excite
exclude
excuse
execute
exercise
exhaust
exhibit
exile
exist
exit
exotic
expand
expect
expire
explain
expose
express
extend
extra
eye
eyebrow
fabric
face
faculty
fade
faint
faith
fall
false
fame
family
famous
fan
fancy
fantasy
farm
fashion
fat
fatal
father
fatigue
fault
favorite
feature
february
federal
fee
feed
feel
female
fence
festival
fetch
fever
few
fiber
fiction
field
figure
file
film
filter
final
find
fine
finger
finish
fire
firm
first
fiscal
fish
fit
fitness
fix
flag
flame
flash
flat
flavor
flee
flight
flip
float
flock
floor
flower
fluid
flush
fly
foam
focus
fog
foil
fold
follow
food
foot
force
forest
forget
fork
fortune
forum
forward
fossil
foster
found
fox
fragile
frame
frequent
fresh
friend
fringe
frog
front
frost
frown
frozen
fruit
fuel
fun
funny
furnace
fury
future
gadget
gain
galaxy
gallery
game
gap
garage
garbage
garden
garlic
garment
gas
gasp
gate
gather
gauge
gaze
general
genius
genre
gentle
genuine
gesture
ghost
giant
gift
giggle
ginger
giraffe
girl
give
glad
glance
glare
glass
glide
glimpse
globe
gloom
glory
glove
glow
glue
goat
goddess
gold
good
goose
gorilla
gospel
gossip
govern
gown
grab
grace
grain
grant
grape
grass
gravity
great
green
grid
grief
grit
grocery
group
grow
grunt
guard
guess
guide
guilt
guitar
gun
gym
habit
hair
half
hammer
hamster
hand
happy
harbor
hard
harsh
harvest
hat
have
hawk
hazard
head
health
heart
heavy
hedgehog
height
hello
helmet
help
hen
hero
hidden
high
hill
hint
hip
hire
history
hobby
hockey
hold
hole
holiday
hollow
home
honey
hood
hope
horn
horror
horse
hospital
host
hotel
hour
hover
hub
huge
human
humble
humor
hundred
hungry
hunt
hurdle
hurry
hurt
husband
hybrid
ice
icon
idea
identify
idle
ignore
ill
illegal
illness
image
imitate
immense
immune
impact
impose
improve
impulse
inch
include
income
increase
index
indicate
indoor
industry
infant
inflict
inform
inhale
inherit
initial
inject
injury
inmate
inner
innocent
input
inquiry
insane
insect
inside
inspire
install
intact
interest
into
invest
invite
involve
iron
island
isolate
issue
item
ivory
jacket
jaguar
jar
jazz
jealous
jeans
jelly
jewel
job
join
joke
journey
joy
judge
juice
jump
jungle
junior
junk
just
kangaroo
keen
keep
ketchup
key
kick
kid
kidney
kind
kingdom
kiss
kit
kitchen
kite
kitten
kiwi
knee
knife
knock
know
lab
label
labor
ladder
lady
lake
lamp
language
laptop
large
later
latin
laugh
laundry
lava
law
lawn
lawsuit
layer
lazy
leader
leaf
learn
leave
lecture
left
leg
legal
legend
leisure
lemon
lend
length
lens
leopard
lesson
letter
level
liar
liberty
library
license
life
lift
light
like
limb
limit
link
lion
liquid
list
little
live
lizard
load
loan
lobster
local
lock
logic
lonely
long
loop
lottery
loud
lounge
love
loyal
lucky
luggage
lumber
lunar
lunch
luxury
lyrics
machine
mad
magic
magnet
maid
mail
main
major
make
mammal
man
manage
mandate
mango
mansion
manual
maple
marble
march
margin
marine
market
marriage
mask
mass
master
match
material
math
matrix
matter
maximum
maze
meadow
mean
measure
meat
mechanic
medal
media
melody
melt
member
memory
mention
menu
mercy
merge
merit
merry
mesh
message
metal
method
middle
midnight
milk
million
mimic
mind
minimum
minor
minute
miracle
mirror
misery
miss
mistake
mix
mixed
mixture
mobile
model
modify
mom
moment
monitor
monkey
monster
month
moon
moral
more
morning
mosquito
mother
motion
motor
mountain
mouse
move
movie
much
muffin
mule
multiply
muscle
museum
mushroom
music
must
mutual
myself
mystery
myth
naive
name
napkin
narrow
nasty
nation
nature
near
neck
need
negative
neglect
neither
nephew
nerve
nest
net
network
neutral
never
news
next
nice
night
noble
noise
nominee
noodle
normal
north
nose
notable
note
nothing
notice
novel
now
nuclear
number
nurse
nut
oak
obey
object
oblige
obscure
observe
obtain
obvious
occur
ocean
october
odor
off
offer
office
often
oil
okay
old
olive
olympic
omit
once
one
onion
online
only
open
opera
opinion
oppose
option
orange
orbit
orchard
order
ordinary
organ
orient
original
orphan
ostrich
other
outdoor
outer
output
outside
oval
oven
over
own
owner
oxygen
oyster
ozone
pact
paddle
page
pair
palace
palm
panda
panel
panic
panther
paper
parade
parent
park
parrot
party
pass
patch
path
patient
patrol
pattern
pause
pave
payment
peace
peanut
pear
peasant
pelican
pen
penalty
pencil
people
pepper
perfect
permit
person
pet
phone
photo
phrase
physical
piano
picnic
picture
piece
pig
pigeon
pill
pilot
pink
pioneer
pipe
pistol
pitch
pizza
place
planet
plastic
plate
play
please
pledge
pluck
plug
plunge
poem
poet
point
polar
pole
police
pond
pony
pool
popular
portion
position
possible
post
potato
pottery
poverty
powder
power
practice
praise
predict
prefer
prepare
present
pretty
prevent
price
pride
primary
print
priority
prison
private
prize
problem
process
produce
profit
program
project
promote
proof
property
prosper
protect
proud
provide
public
pudding
pull
pulp
pulse
pumpkin
punch
pupil
puppy
purchase
purity
purpose
purse
push
put
puzzle
pyramid
quality
quantum
quarter
question
quick
quit
quiz
quote
rabbit
raccoon
race
rack
radar
radio
rail
rain
raise
rally
ramp
ranch
random
range
rapid
rare
rate
rather
raven
raw
razor
ready
real
reason
rebel
rebuild
recall
receive
recipe
record
recycle
reduce
reflect
reform
refuse
region
regret
regular
reject
relax
release
relief
rely
remain
remember
remind
remove
render
renew
rent
reopen
repair
repeat
replace
report
require
rescue
resemble
resist
resource
response
result
retire
retreat
return
reunion
reveal
review
reward
rhythm
rib
ribbon
rice
rich
ride
ridge
rifle
right
rigid
ring
riot
ripple
risk
ritual
rival
river
road
roast
robot
robust
rocket
romance
roof
rookie
room
rose
rotate
rough
round
route
royal
rubber
rude
rug
rule
run
runway
rural
sad
saddle
sadness
safe
sail
salad
salmon
salon
salt
salute
same
sample
sand
satisfy
satoshi
sauce
sausage
save
say
scale
scan
scare
scatter
scene
scheme
school
science
scissors
scorpion
scout
scrap
screen
script
scrub
sea
search
season
seat
second
secret
section
security
seed
seek
segment
select
sell
seminar
senior
sense
sentence
series
service
session
settle
setup
seven
shadow
shaft
shallow
share
shed
shell
sheriff
shield
shift
shine
ship
shiver
shock
shoe
shoot
shop
short
shoulder
shove
shrimp
shrug
shuffle
shy
sibling
sick
side
siege
sight
sign
silent
silk
silly
silver
similar
simple
since
sing
siren
sister
situate
six
size
skate
sketch
ski
skill
skin
skirt
skull
slab
slam
sleep
slender
slice
slide
slight
slim
slogan
slot
slow
slush
small
smart
smile
smoke
smooth
snack
snake
snap
sniff
snow
soap
soccer
social
sock
soda
soft
solar
soldier
solid
solution
solve
someone
song
soon
sorry
sort
soul
sound
soup
source
south
space
spare
spatial
spawn
speak
special
speed
spell
spend
sphere
spice
spider
spike
spin
spirit
split
spoil
sponsor
spoon
sport
spot
spray
spread
spring
spy
square
squeeze
squirrel
stable
stadium
staff
stage
stairs
stamp
stand
start
state
stay
steak
steel
stem
step
stereo
stick
still
sting
stock
stomach
stone
stool
story
stove
strategy
street
strike
strong
struggle
student
stuff
stumble
style
subject
submit
subway
success
such
sudden
suffer
sugar
suggest
suit
summer
sun
sunny
sunset
super
supply
supreme
sure
surface
surge
surprise
surround
survey
suspect
sustain
swallow
swamp
swap
swarm
swear
sweet
swift
swim
swing
switch
sword
symbol
symptom
syrup
system
table
tackle
tag
tail
talent
talk
tank
tape
target
task
taste
tattoo
taxi
teach
team
tell
ten
tenant
tennis
tent
term
test
text
thank
that
theme
then
theory
there
they
thing
this
thought
three
thrive
throw
thumb
thunder
ticket
tide
tiger
tilt
timber
time
tiny
tip
tired
tissue
title
toast
tobacco
today
toddler
toe
together
toilet
token
tomato
tomorrow
tone
tongue
tonight
tool
tooth
top
topic
topple
torch
tornado
tortoise
toss
total
tourist
toward
tower
town
toy
track
trade
traffic
tragic
train
transfer
trap
trash
travel
tray
treat
tree
trend
trial
tribe
trick
trigger
trim
trip
trophy
trouble
truck
true
truly
trumpet
trust
truth
try
tube
tuition
tumble
tuna
tunnel
turkey
turn
turtle
twelve
twenty
twice
twin
twist
two
type
typical
ugly
umbrella
unable
unaware
uncle
uncover
under
undo
unfair
unfold
unhappy
uniform
unique
unit
universe
unknown
unlock
until
unusual
unveil
update
upgrade
uphold
upon
upper
upset
urban
urge
usage
use
used
useful
useless
usual
utility
vacant
vacuum
vague
valid
valley
valve
van
vanish
vapor
various
vast
vault
vehicle
velvet
vendor
venture
venue
verb
verify
version
very
vessel
veteran
viable
vibrant
vicious
victory
video
view
village
vintage
violin
virtual
virus
visa
visit
visual
vital
vivid
vocal
voice
void
volcano
volume
vote
voyage
wage
wagon
wait
walk
wall
walnut
want
warfare
warm
warrior
wash
wasp
waste
water
wave
way
wealth
weapon
wear
weasel
weather
web
wedding
weekend
weird
welcome
west
wet
whale
what
wheat
wheel
when
where
whip
whisper
wide
width
wife
wild
will
win
window
wine
wing
wink
winner
winter
wire
wisdom
wise
wish
witness
wolf
woman
wonder
wood
wool
word
work
world
worry
worth
wrap
wreck
wrestle
wrist
write
wrong
yard
year
yellow
you
young
youth
zebra
zero
zone
zoo`.split("\n");

// node_modules/@noble/hashes/argon2.js
var AT = { Argond2d: 0, Argon2i: 1, Argon2id: 2 };
var ARGON2_SYNC_POINTS = 4;
var abytesOrZero = (buf, errorTitle = "") => {
  if (buf === void 0)
    return Uint8Array.of();
  return kdfInputToBytes(buf, errorTitle);
};
function mul3(a, b) {
  const aL = a & 65535;
  const aH = a >>> 16;
  const bL = b & 65535;
  const bH = b >>> 16;
  const ll = Math.imul(aL, bL);
  const hl = Math.imul(aH, bL);
  const lh = Math.imul(aL, bH);
  const hh = Math.imul(aH, bH);
  const carry = (ll >>> 16) + (hl & 65535) + lh;
  const high = hh + (hl >>> 16) + (carry >>> 16) | 0;
  const low = carry << 16 | ll & 65535;
  return { h: high, l: low };
}
function mul22(a, b) {
  const { h, l } = mul3(a, b);
  return { h: (h << 1 | l >>> 31) & 4294967295, l: l << 1 & 4294967295 };
}
function blamka(Ah, Al, Bh, Bl) {
  const { h: Ch, l: Cl } = mul22(Al, Bl);
  const Rll = add3L(Al, Bl, Cl);
  return { h: add3H(Rll, Ah, Bh, Ch), l: Rll | 0 };
}
var A2_BUF = new Uint32Array(256);
function G(a, b, c, d) {
  let Al = A2_BUF[2 * a], Ah = A2_BUF[2 * a + 1];
  let Bl = A2_BUF[2 * b], Bh = A2_BUF[2 * b + 1];
  let Cl = A2_BUF[2 * c], Ch = A2_BUF[2 * c + 1];
  let Dl = A2_BUF[2 * d], Dh = A2_BUF[2 * d + 1];
  ({ h: Ah, l: Al } = blamka(Ah, Al, Bh, Bl));
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotr32H(Dh, Dl), Dl: rotr32L(Dh, Dl) });
  ({ h: Ch, l: Cl } = blamka(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrSH(Bh, Bl, 24), Bl: rotrSL(Bh, Bl, 24) });
  ({ h: Ah, l: Al } = blamka(Ah, Al, Bh, Bl));
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotrSH(Dh, Dl, 16), Dl: rotrSL(Dh, Dl, 16) });
  ({ h: Ch, l: Cl } = blamka(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrBH(Bh, Bl, 63), Bl: rotrBL(Bh, Bl, 63) });
  A2_BUF[2 * a] = Al, A2_BUF[2 * a + 1] = Ah;
  A2_BUF[2 * b] = Bl, A2_BUF[2 * b + 1] = Bh;
  A2_BUF[2 * c] = Cl, A2_BUF[2 * c + 1] = Ch;
  A2_BUF[2 * d] = Dl, A2_BUF[2 * d + 1] = Dh;
}
function P(v00, v01, v02, v03, v04, v05, v06, v07, v08, v09, v10, v11, v12, v13, v14, v15) {
  G(v00, v04, v08, v12);
  G(v01, v05, v09, v13);
  G(v02, v06, v10, v14);
  G(v03, v07, v11, v15);
  G(v00, v05, v10, v15);
  G(v01, v06, v11, v12);
  G(v02, v07, v08, v13);
  G(v03, v04, v09, v14);
}
function block(x, xPos, yPos, outPos, needXor) {
  for (let i = 0; i < 256; i++)
    A2_BUF[i] = x[xPos + i] ^ x[yPos + i];
  for (let i = 0; i < 128; i += 16) {
    P(i, i + 1, i + 2, i + 3, i + 4, i + 5, i + 6, i + 7, i + 8, i + 9, i + 10, i + 11, i + 12, i + 13, i + 14, i + 15);
  }
  for (let i = 0; i < 16; i += 2) {
    P(i, i + 1, i + 16, i + 17, i + 32, i + 33, i + 48, i + 49, i + 64, i + 65, i + 80, i + 81, i + 96, i + 97, i + 112, i + 113);
  }
  if (needXor)
    for (let i = 0; i < 256; i++)
      x[outPos + i] ^= A2_BUF[i] ^ x[xPos + i] ^ x[yPos + i];
  else
    for (let i = 0; i < 256; i++)
      x[outPos + i] = A2_BUF[i] ^ x[xPos + i] ^ x[yPos + i];
  clean(A2_BUF);
}
function Hp(A, dkLen) {
  const A8 = u8(A);
  const T = new Uint32Array(1);
  const T8 = u8(T);
  T[0] = swap8IfBE(dkLen);
  if (dkLen <= 64)
    return blake2b.create({ dkLen }).update(T8).update(A8).digest();
  const out = new Uint8Array(dkLen);
  let V = blake2b.create({}).update(T8).update(A8).digest();
  let pos = 0;
  out.set(V.subarray(0, 32));
  pos += 32;
  for (; dkLen - pos > 64; pos += 32) {
    const Vh = blake2b.create({}).update(V);
    Vh.digestInto(V);
    Vh.destroy();
    out.set(V.subarray(0, 32), pos);
  }
  out.set(blake2b(V, { dkLen: dkLen - pos }), pos);
  clean(V, T);
  return out;
}
function indexAlpha(r, s, laneLen, segmentLen, index, randL, sameLane = false) {
  let area;
  if (r === 0) {
    if (s === 0)
      area = index - 1;
    else if (sameLane)
      area = s * segmentLen + index - 1;
    else
      area = s * segmentLen + (index == 0 ? -1 : 0);
  } else if (sameLane)
    area = laneLen - segmentLen + index - 1;
  else
    area = laneLen - segmentLen + (index == 0 ? -1 : 0);
  const startPos = r !== 0 && s !== ARGON2_SYNC_POINTS - 1 ? (s + 1) * segmentLen : 0;
  const rel = area - 1 - mul3(area, mul3(randL, randL).h).h;
  return (startPos + rel) % laneLen;
}
var maxUint32 = Math.pow(2, 32);
function isU32(num2) {
  return Number.isSafeInteger(num2) && num2 >= 0 && num2 < maxUint32;
}
function argon2Opts(opts) {
  const merged = {
    version: 19,
    dkLen: 32,
    maxmem: maxUint32 - 1,
    asyncTick: 10
  };
  for (let [k, v] of Object.entries(opts))
    if (v !== void 0)
      merged[k] = v;
  const { dkLen, p, m, t, version, onProgress, asyncTick } = merged;
  if (!isU32(dkLen) || dkLen < 4)
    throw new Error('"dkLen" must be 4..');
  if (!isU32(p) || p < 1 || p >= Math.pow(2, 24))
    throw new Error('"p" must be 1..2^24');
  if (!isU32(m))
    throw new Error('"m" must be 0..2^32');
  if (!isU32(t) || t < 1)
    throw new Error('"t" (iterations) must be 1..2^32');
  if (onProgress !== void 0 && typeof onProgress !== "function")
    throw new Error('"progressCb" must be a function');
  anumber(asyncTick, "asyncTick");
  if (!isU32(m) || m < 8 * p)
    throw new Error('"m" (memory) must be at least 8*p bytes');
  if (version !== 16 && version !== 19)
    throw new Error('"version" must be 0x10 or 0x13, got ' + version);
  return merged;
}
function argon2Init(password, salt, type, opts) {
  password = kdfInputToBytes(password, "password");
  salt = kdfInputToBytes(salt, "salt");
  if (!isU32(password.length))
    throw new Error('"password" must be less of length 1..4Gb');
  if (!isU32(salt.length) || salt.length < 8)
    throw new Error('"salt" must be of length 8..4Gb');
  if (!Object.values(AT).includes(type))
    throw new Error('"type" was invalid');
  let { p, dkLen, m, t, version, key, personalization, maxmem, onProgress, asyncTick } = argon2Opts(opts);
  key = abytesOrZero(key, "key");
  personalization = abytesOrZero(personalization, "personalization");
  const h = blake2b.create();
  const BUF = new Uint32Array(1);
  const BUF8 = u8(BUF);
  for (let item of [p, dkLen, m, t, version, type]) {
    BUF[0] = swap8IfBE(item);
    h.update(BUF8);
  }
  for (let i of [password, salt, key, personalization]) {
    BUF[0] = swap8IfBE(i.length);
    h.update(BUF8).update(i);
  }
  const H0 = new Uint32Array(18);
  const H0_8 = u8(H0);
  h.digestInto(H0_8);
  const lanes = p;
  const mP = 4 * p * Math.floor(m / (ARGON2_SYNC_POINTS * p));
  const laneLen = Math.floor(mP / p);
  const segmentLen = Math.floor(laneLen / ARGON2_SYNC_POINTS);
  const memUsed = mP * 1024;
  if (!isU32(maxmem))
    throw new Error('"maxmem" expected <2**32, got ' + maxmem);
  if (memUsed > maxmem)
    throw new Error('"maxmem" limit was hit: memUsed(mP*1024)=' + memUsed + ", maxmem=" + maxmem);
  const B = new Uint32Array(memUsed / 4);
  for (let l = 0; l < p; l++) {
    const i = 256 * laneLen * l;
    H0[17] = swap8IfBE(l);
    H0[16] = swap8IfBE(0);
    B.set(swap32IfBE(u32(Hp(H0, 1024))), i);
    H0[16] = swap8IfBE(1);
    B.set(swap32IfBE(u32(Hp(H0, 1024))), i + 256);
  }
  let perBlock = () => {
  };
  if (onProgress) {
    const totalBlock = t * ARGON2_SYNC_POINTS * p * segmentLen - 2 * p;
    const callbackPer = Math.max(Math.floor(totalBlock / 1e4), 1);
    let blockCnt = 0;
    perBlock = () => {
      blockCnt++;
      if (onProgress && (!(blockCnt % callbackPer) || blockCnt === totalBlock))
        onProgress(blockCnt / totalBlock);
    };
  }
  clean(BUF, H0);
  return { type, mP, p, t, version, B, laneLen, lanes, segmentLen, dkLen, perBlock, asyncTick };
}
function argon2Output(B, p, laneLen, dkLen) {
  const B_final = new Uint32Array(256);
  for (let l = 0; l < p; l++)
    for (let j = 0; j < 256; j++)
      B_final[j] ^= B[256 * (laneLen * l + laneLen - 1) + j];
  const res = Hp(swap32IfBE(B_final), dkLen);
  clean(B, B_final);
  return res;
}
function processBlock(B, address, l, r, s, index, laneLen, segmentLen, lanes, offset, prev, dataIndependent, needXor) {
  if (offset % laneLen)
    prev = offset - 1;
  let randL, randH;
  if (dataIndependent) {
    let i128 = index % 128;
    if (i128 === 0) {
      address[256 + 12]++;
      block(address, 256, 2 * 256, 0, false);
      block(address, 0, 2 * 256, 0, false);
    }
    randL = address[2 * i128];
    randH = address[2 * i128 + 1];
  } else {
    const T = 256 * prev;
    randL = B[T];
    randH = B[T + 1];
  }
  const refLane = r === 0 && s === 0 ? l : randH % lanes;
  const refPos = indexAlpha(r, s, laneLen, segmentLen, index, randL, refLane == l);
  const refBlock = laneLen * refLane + refPos;
  block(B, 256 * prev, 256 * refBlock, offset * 256, needXor);
}
async function argon2Async(type, password, salt, opts) {
  const { mP, p, t, version, B, laneLen, lanes, segmentLen, dkLen, perBlock, asyncTick } = argon2Init(password, salt, type, opts);
  const address = new Uint32Array(3 * 256);
  address[256 + 6] = mP;
  address[256 + 8] = t;
  address[256 + 10] = type;
  let ts = Date.now();
  for (let r = 0; r < t; r++) {
    const needXor = r !== 0 && version === 19;
    address[256 + 0] = r;
    for (let s = 0; s < ARGON2_SYNC_POINTS; s++) {
      address[256 + 4] = s;
      const dataIndependent = type == AT.Argon2i || type == AT.Argon2id && r === 0 && s < 2;
      for (let l = 0; l < p; l++) {
        address[256 + 2] = l;
        address[256 + 12] = 0;
        let startPos = 0;
        if (r === 0 && s === 0) {
          startPos = 2;
          if (dataIndependent) {
            address[256 + 12]++;
            block(address, 256, 2 * 256, 0, false);
            block(address, 0, 2 * 256, 0, false);
          }
        }
        let offset = l * laneLen + s * segmentLen + startPos;
        let prev = offset % laneLen ? offset - 1 : offset + laneLen - 1;
        for (let index = startPos; index < segmentLen; index++, offset++, prev++) {
          perBlock();
          processBlock(B, address, l, r, s, index, laneLen, segmentLen, lanes, offset, prev, dataIndependent, needXor);
          const diff = Date.now() - ts;
          if (!(diff >= 0 && diff < asyncTick)) {
            await nextTick();
            ts += diff;
          }
        }
      }
    }
  }
  clean(address);
  return argon2Output(B, p, laneLen, dkLen);
}
var argon2idAsync = (password, salt, opts) => argon2Async(AT.Argon2id, password, salt, opts);

// node_modules/@noble/hashes/pbkdf2.js
function pbkdf2Init(hash3, _password, _salt, _opts) {
  ahash(hash3);
  const opts = checkOpts({ dkLen: 32, asyncTick: 10 }, _opts);
  const { c, dkLen, asyncTick } = opts;
  anumber(c, "c");
  anumber(dkLen, "dkLen");
  anumber(asyncTick, "asyncTick");
  if (c < 1)
    throw new Error("iterations (c) must be >= 1");
  if (dkLen < 1)
    throw new Error('"dkLen" must be >= 1');
  if (dkLen > (2 ** 32 - 1) * hash3.outputLen)
    throw new Error("derived key too long");
  const password = kdfInputToBytes(_password, "password");
  const salt = kdfInputToBytes(_salt, "salt");
  const DK = new Uint8Array(dkLen);
  const PRF = hmac.create(hash3, password);
  const PRFSalt = PRF._cloneInto().update(salt);
  return { c, dkLen, asyncTick, DK, PRF, PRFSalt };
}
function pbkdf2Output(PRF, PRFSalt, DK, prfW, u) {
  PRF.destroy();
  PRFSalt.destroy();
  if (prfW)
    prfW.destroy();
  clean(u);
  return DK;
}
async function pbkdf2Async(hash3, password, salt, opts) {
  const { c, dkLen, asyncTick, DK, PRF, PRFSalt } = pbkdf2Init(hash3, password, salt, opts);
  let prfW;
  const arr = new Uint8Array(4);
  const view = createView(arr);
  const u = new Uint8Array(PRF.outputLen);
  for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += PRF.outputLen) {
    const Ti = DK.subarray(pos, pos + PRF.outputLen);
    view.setInt32(0, ti, false);
    (prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
    Ti.set(u.subarray(0, Ti.length));
    await asyncLoop(c - 1, asyncTick, () => {
      PRF._cloneInto(prfW).update(u).digestInto(u);
      for (let i = 0; i < Ti.length; i++)
        Ti[i] ^= u[i];
    });
  }
  return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
}

// src/zk-wallet.js
var utf82 = new TextEncoder();
var label = (name) => utf82.encode("NeuraiZK/v2/" + name);
var NZK_DERIVATION = "NeuraiZK/v2";
var NZK_FAMILIES = Object.freeze({ legacy: 0, ecdsa: 1, pq: 2 });
var NZK_ARGON2ID = Object.freeze({ t: 3, m: 64 * 1024, p: 1, dkLen: 64 });
var NZK_HRP = Object.freeze({ mainnet: "nzk", testnet: "tnzk", regtest: "rnzk" });
var NZK_DEFAULT_GAP = 20;
var NZK_MAX_GAP = 1e3;
function fail(reason) {
  throw new Error("nzk: " + reason);
}
function concat2(...parts) {
  const out = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}
function u32le(value) {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, true);
  return out;
}
var CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
var BECH32M_CONST = 734539939;
function polymod(values) {
  const gen = [996825010, 642813549, 513874426, 1027748829, 705979059];
  let chk = 1;
  for (const v of values) {
    const top = chk >>> 25;
    chk = (chk & 33554431) << 5 ^ v;
    for (let i = 0; i < 5; i++) if (top >>> i & 1) chk ^= gen[i];
  }
  return chk >>> 0;
}
function expandHrp(hrp) {
  const codes = Array.from(hrp, (c) => c.charCodeAt(0));
  return [...codes.map((c) => c >> 5), 0, ...codes.map((c) => c & 31)];
}
function convertBits(data, from, to, pad) {
  let acc = 0, bits = 0;
  const out = [], max = (1 << to) - 1;
  for (const value of data) {
    acc = (acc << from | value) & 16777215;
    bits += from;
    while (bits >= to) {
      bits -= to;
      out.push(acc >> bits & max);
    }
  }
  if (pad) {
    if (bits) out.push(acc << to - bits & max);
  } else if (bits >= from || acc << to - bits & max) fail("invalid bit padding");
  return out;
}
function bech32mEncode(hrp, bytes5) {
  if (!/^[a-z]{1,83}$/.test(hrp)) fail("invalid HRP");
  const data = convertBits(bytes5, 8, 5, true);
  const mod3 = polymod([...expandHrp(hrp), ...data, 0, 0, 0, 0, 0, 0]) ^ BECH32M_CONST;
  const checksum2 = [0, 1, 2, 3, 4, 5].map((i) => mod3 >>> 5 * (5 - i) & 31);
  return hrp + "1" + [...data, ...checksum2].map((v) => CHARSET[v]).join("");
}
function bech32mDecode(text4) {
  if (typeof text4 !== "string" || text4.length > 1023) fail("address must be a string");
  if (text4 !== text4.toLowerCase() && text4 !== text4.toUpperCase()) fail("mixed-case address");
  const s = text4.toLowerCase();
  const sep = s.lastIndexOf("1");
  if (sep < 1 || s.length - sep - 1 < 6) fail("malformed address");
  const hrp = s.slice(0, sep);
  const data = Array.from(s.slice(sep + 1), (c) => {
    const v = CHARSET.indexOf(c);
    if (v < 0) fail("invalid address character");
    return v;
  });
  if (polymod([...expandHrp(hrp), ...data]) !== BECH32M_CONST) fail("invalid bech32m checksum");
  return { hrp, bytes: Uint8Array.from(convertBits(data.slice(0, -6), 5, 8, false)) };
}
async function walletSeedFromMnemonic(mnemonic, passphrase = "") {
  if (typeof mnemonic !== "string" || !mnemonic.trim()) fail("mnemonic required");
  if (typeof passphrase !== "string") fail("passphrase must be a string");
  const canonical = mnemonic.normalize("NFKD").trim().split(/\s+/u).join(" ");
  if (!validateMnemonic(canonical, wordlist)) fail("invalid English BIP39 mnemonic");
  return pbkdf2Async(
    sha512,
    utf82.encode(canonical),
    utf82.encode("mnemonic" + passphrase.normalize("NFKD")),
    { c: 2048, dkLen: 64 }
  );
}
async function deriveZkRoot(seed, zkPassphrase = "") {
  if (!(seed instanceof Uint8Array) || seed.length !== 64) fail("wallet seed must be 64 bytes");
  if (typeof zkPassphrase !== "string") fail("ZK passphrase must be a string");
  const z = utf82.encode(zkPassphrase.normalize("NFKD"));
  if (z.length > 4294967295) fail("ZK passphrase is too long");
  const password = concat2(seed, u32le(z.length), z);
  try {
    return await argon2idAsync(password, label("root"), { ...NZK_ARGON2ID, version: 19, maxmem: NZK_ARGON2ID.m * 1024 });
  } finally {
    password.fill(0);
    z.fill(0);
  }
}

// src/c7.js
var C7_PROFILE = "C7-XNA-TEST-v1";
var C7_DERIVATION = "NeuraiZK/v3";
var C7_RECORD_BYTES = 230;
var C7_ADDRESS_VERSION = 3;
var NOTE_BYTES = 169;
var MAX_INDEX = 2147483647;
var MAX_AMOUNT = 2100000000000000000n;
var L = 2n ** 252n + 27742317777372353535851937790883648493n;
var FR = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001n;
var DST_GD = "NeuraiZKv3-gd";
var NONCE = new Uint8Array(12);
var utf83 = (s) => new TextEncoder().encode(s);
var Point = ristretto255.Point;
var C7Error = class extends Error {
  constructor(reason, detail = "") {
    super(detail ? `C7 ${reason}: ${detail}` : `C7 ${reason}`);
    this.reason = reason;
  }
};
var fail2 = (reason, detail) => {
  throw new C7Error(reason, detail);
};
function concat3(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
var hex = (b) => Array.from(b, (v) => v.toString(16).padStart(2, "0")).join("");
function unhex(text4, length, label2) {
  if (typeof text4 !== "string" || !/^(?:[0-9a-f]{2})*$/i.test(text4) || length !== void 0 && text4.length !== 2 * length) {
    throw new TypeError(`${label2} must be ${length ?? "canonical"} bytes of hex`);
  }
  return Uint8Array.from(text4.match(/../g) ?? [], (v) => parseInt(v, 16));
}
function bytes2(value, length, label2) {
  if (typeof value === "string") return unhex(value, length, label2);
  if (!(value instanceof Uint8Array) || value.length !== length) throw new TypeError(`${label2} must be ${length} bytes`);
  return value;
}
var equal = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
var isZero = (b) => b.every((v) => v === 0);
var u32le2 = (n) => Uint8Array.of(n & 255, n >>> 8 & 255, n >>> 16 & 255, n >>> 24);
var leInt = (b) => b.reduceRight((acc, v) => acc << 8n | BigInt(v), 0n);
var beInt = (b) => b.reduce((acc, v) => acc << 8n | BigInt(v), 0n);
var leBytes = (v, n) => Uint8Array.from({ length: n }, (_, i) => Number(v >> BigInt(8 * i) & 255n));
function personal(text4) {
  const out = new Uint8Array(16);
  out.set(utf83(text4));
  return out;
}
var blake = (data, label2, size) => blake2b(data, { dkLen: size, personalization: personal(label2) });
var toScalar = (wide) => leInt(wide) % L;
function index31(value, label2) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_INDEX) throw new RangeError(`${label2} must be in [0, 2^31 - 1]`);
  return value;
}
function hrpFor(network) {
  const hrp = NZK_HRP[network];
  if (!hrp) throw new Error("unknown network");
  return hrp;
}
function c7XnaAssetId() {
  return sha256(utf83("NeuraiPool/asset/XNA"));
}
function c7PoolDomain({ genesis, emission, identity }) {
  const match = /^([0-9a-f]{64}):(\d{1,10})$/.exec(emission ?? "");
  if (!match || Number(match[2]) > 4294967295) throw new TypeError('emission must be "txid:vout"');
  const name = utf83(identity ?? "");
  if (name.length < 1 || name.length > 64 || name.some((c) => c < 33 || c > 126)) throw new TypeError("invalid pool identity");
  return sha256(concat3(
    utf83("NeuraiPoolC7/domain"),
    [1],
    unhex(genesis, 32, "genesis").reverse(),
    unhex(match[1], 32, "emission txid").reverse(),
    u32le2(Number(match[2])),
    [name.length],
    name
  ));
}
function c7Context(domain, assetId) {
  return c7PublicationContext({ domain: bytes2(domain, 32, "domain"), assetId: bytes2(assetId, 32, "assetId"), unit: 1n });
}
function c7InstanceTag(domain, assetId) {
  return sha256(concat3(utf83("NeuraiZK/v3/instance"), bytes2(domain, 32, "domain"), bytes2(assetId, 32, "assetId"))).slice(0, 4);
}
var ff1Keys = /* @__PURE__ */ new Map();
function ff1(dk) {
  const id = hex(dk);
  if (!ff1Keys.has(id)) ff1Keys.set(id, BinaryFF1(dk));
  return ff1Keys.get(id);
}
var c7Diversifier = (dk, j) => ff1(dk).encrypt(leBytes(BigInt(j), 11));
var c7DiversifierIndex = (dk, d) => leInt(ff1(dk).decrypt(d));
function diversifyHash(d, domain, assetId) {
  const point2 = ristretto255_hasher.hashToCurve(concat3(d, domain, assetId), { DST: DST_GD });
  if (point2.equals(Point.ZERO)) fail2("diversifier-identity");
  return point2;
}
function decodePoint(encoded) {
  try {
    return Point.fromBytes(encoded);
  } catch {
    return null;
  }
}
function tagAndKey(shared, epk) {
  const input = concat3(shared, epk);
  return { vtag: blake(input, "NeuraiZKv3_vtag", 32)[0], key: blake(input, "NeuraiZKv3_KDF", 32) };
}
var esk = (rho, domain, assetId) => toScalar(blake(concat3(rho, domain, assetId), "NeuraiZKv3_esk", 64));
var noteAad = (domain, cm) => concat3(utf83("NIP043/note/CP2"), domain, cm);
var canonicalOwner = (owner) => {
  const v = beInt(owner);
  return v !== 0n && v < FR;
};
var isC7Descriptor = (value) => !!value && typeof value === "object" && typeof value.d === "string";
function checkDescriptor(descriptor2) {
  if (!isC7Descriptor(descriptor2)) throw new TypeError("C7 receiving descriptor required");
  const owner = bytes2(descriptor2.owner, 32, "owner"), pkd = bytes2(descriptor2.view_pub, 32, "pk_d");
  if (!canonicalOwner(owner)) fail2("owner-invalid");
  const point2 = decodePoint(pkd);
  if (!point2 || point2.equals(Point.ZERO)) fail2("pk_d-invalid");
  return {
    domain: bytes2(descriptor2.domain, 32, "domain"),
    assetId: bytes2(descriptor2.asset_id, 32, "asset_id"),
    owner,
    d: bytes2(descriptor2.d, 11, "diversifier"),
    pkd,
    pkdPoint: point2
  };
}
function encodeC7Address(descriptor2, network) {
  const r = checkDescriptor(descriptor2);
  return bech32mEncode(hrpFor(network), concat3([C7_ADDRESS_VERSION], r.owner, r.d, r.pkd, c7InstanceTag(r.domain, r.assetId)));
}
function decodeC7Address(address, { network, domain, assetId }) {
  let decoded;
  try {
    decoded = bech32mDecode(address);
  } catch {
    fail2("address-encoding");
  }
  if (decoded.hrp !== hrpFor(network)) fail2("address-hrp");
  const p = decoded.bytes;
  if (p.length !== 80) fail2("address-length");
  if (p[0] !== C7_ADDRESS_VERSION) fail2("address-version");
  if (!equal(p.subarray(76), c7InstanceTag(domain, assetId))) fail2("address-instance");
  const descriptor2 = {
    domain: hex(bytes2(domain, 32, "domain")),
    asset_id: hex(bytes2(assetId, 32, "assetId")),
    owner: hex(p.subarray(1, 33)),
    view_pub: hex(p.subarray(44, 76)),
    d: hex(p.subarray(33, 44))
  };
  if (!canonicalOwner(p.subarray(1, 33))) fail2("owner-invalid");
  const point2 = decodePoint(p.subarray(44, 76));
  if (!point2 || point2.equals(Point.ZERO)) fail2("pk_d-invalid");
  return descriptor2;
}
function sealC7Note({ descriptor: descriptor2, amountAtomic, rho }) {
  const r = checkDescriptor(descriptor2);
  for (let attempt = 0; attempt < 4; attempt++) {
    const seed = rho ? bytes2(rho, 32, "rho") : globalThis.crypto.getRandomValues(new Uint8Array(32));
    const note = encodeNote({ domain: r.domain, assetId: r.assetId, owner: r.owner, viewPub: r.pkd, amountAtomic, rho: seed });
    const cm = noteCommitment(note);
    const k = esk(seed, r.domain, r.assetId);
    if (k === 0n) {
      if (rho) fail2("esk-zero");
      continue;
    }
    const gd = diversifyHash(r.d, r.domain, r.assetId);
    const epk = gd.multiply(k).toBytes();
    const { vtag, key } = tagAndKey(r.pkdPoint.multiply(k).toBytes(), epk);
    const ct = chacha20poly1305(key, NONCE, noteAad(r.domain, cm)).encrypt(concat3(note, r.d));
    key.fill(0);
    return { note, cm, record: concat3([2, vtag], epk, ct) };
  }
  fail2("esk-zero");
}
var C7Account = class {
  #prk;
  #q;
  #ivk;
  #dk;
  #family;
  #account;
  #domain;
  #assetId;
  constructor(root, { family, account = 0, domain, assetId }) {
    if (!(root instanceof Uint8Array) || root.length !== 64) throw new TypeError("ZK root must be 64 bytes");
    if (!Object.hasOwn(NZK_FAMILIES, family)) throw new TypeError("family must be legacy, ecdsa or pq");
    this.#family = NZK_FAMILIES[family];
    this.#account = index31(account, "account");
    this.#domain = bytes2(domain, 32, "domain").slice();
    this.#assetId = bytes2(assetId, 32, "assetId").slice();
    this.#prk = extract(sha256, root, utf83("NeuraiZK/v2/account"));
    this.#q = concat3([this.#family], u32le2(this.#account), this.#domain, this.#assetId);
    const seed = this.expand32("NeuraiZK/v3/ivk", this.#q);
    this.#ivk = toScalar(blake(seed, "NeuraiZKv3_ivk", 64));
    seed.fill(0);
    if (this.#ivk === 0n) fail2("ivk-zero", "derivation fails without retrying");
    this.#dk = this.expand32("NeuraiZK/v3/dk", this.#q);
  }
  get domain() {
    return this.#domain.slice();
  }
  get assetId() {
    return this.#assetId.slice();
  }
  expand32(label2, scope) {
    this.#assertOpen();
    return expand(sha256, this.#prk, concat3(utf83(label2), scope), 32);
  }
  #assertOpen() {
    if (!this.#prk) throw new Error("C7 account is locked");
  }
  #scope(chain2, index) {
    if (chain2 !== 0 && chain2 !== 1) fail2("index-out-of-range");
    index31(index, "address index");
    return concat3([this.#family], u32le2(this.#account), u32le2(chain2), u32le2(index), this.#domain, this.#assetId);
  }
  /** spendSecret, owner and nk of one address. Callers must zero spendSecret. */
  spendKeys(chain2, index) {
    const spendSecret = this.expand32("NeuraiZK/v3/spend", this.#scope(chain2, index));
    if (isZero(spendSecret)) fail2("spend-secret-zero");
    const owner = poseidonBytes(concat3(utf83("NIP043/owner/CP1"), this.#domain, spendSecret));
    const nk = poseidonBytes(concat3(utf83("NIP043/nk/CP1"), this.#domain, spendSecret));
    return { spendSecret, owner, nk };
  }
  /** Receiving descriptor of address (chain, index). */
  descriptor(chain2, index) {
    const keys = this.spendKeys(chain2, index);
    keys.spendSecret.fill(0);
    const d = c7Diversifier(this.#dk, BigInt(chain2) * 2n ** 32n + BigInt(index));
    const pkd = diversifyHash(d, this.#domain, this.#assetId).multiply(this.#ivk);
    if (pkd.equals(Point.ZERO)) fail2("pk_d-identity");
    return {
      domain: hex(this.#domain),
      asset_id: hex(this.#assetId),
      owner: hex(keys.owner),
      view_pub: hex(pkd.toBytes()),
      d: hex(d)
    };
  }
  /** Receive-only scan (steps 1 to 8); full=true adds ownership and nullifier
   * (steps 9 and 10). Throws C7Error with the reason of the first failed step. */
  scan(record2, cm, { full = true, checkTag = true } = {}) {
    this.#assertOpen();
    if (!(record2 instanceof Uint8Array) || record2.length !== C7_RECORD_BYTES) fail2("record-length");
    if (record2[0] !== 2) fail2("record-version");
    bytes2(cm, 32, "commitment");
    const epk = record2.subarray(2, 34), epkPoint = decodePoint(epk);
    if (!epkPoint) fail2("epk-invalid");
    if (epkPoint.equals(Point.ZERO)) fail2("epk-identity");
    const { vtag, key } = tagAndKey(epkPoint.multiply(this.#ivk).toBytes(), epk);
    if (checkTag && vtag !== record2[1]) {
      key.fill(0);
      fail2("vtag-mismatch");
    }
    let plain;
    try {
      plain = chacha20poly1305(key, NONCE, noteAad(this.#domain, cm)).decrypt(record2.subarray(34));
    } catch {
      fail2("aead-failed");
    } finally {
      key.fill(0);
    }
    const note = plain.slice(0, NOTE_BYTES), d = plain.slice(NOTE_BYTES);
    if (note[0] !== 1) fail2("note-malformed");
    if (!equal(note.subarray(1, 33), this.#domain) || !equal(note.subarray(33, 65), this.#assetId)) fail2("note-instance");
    let decoded;
    try {
      decoded = decodeNote(note);
    } catch {
      fail2("note-malformed");
    }
    if (!canonicalOwner(decoded.owner) || decoded.amountAtomic < 1n || decoded.amountAtomic > MAX_AMOUNT) fail2("note-malformed");
    const j = c7DiversifierIndex(this.#dk, d), chain2 = j >> 32n, index = j & 0xffffffffn;
    if (chain2 > 1n || index > BigInt(MAX_INDEX)) fail2("index-out-of-range");
    const gd = diversifyHash(d, this.#domain, this.#assetId);
    if (!equal(gd.multiply(this.#ivk).toBytes(), decoded.viewPub)) fail2("pk_d-mismatch");
    const k = esk(decoded.rho, this.#domain, this.#assetId);
    if (k === 0n || !equal(gd.multiply(k).toBytes(), epk)) fail2("epk-mismatch");
    if (!equal(noteCommitment(note), cm)) fail2("cm-mismatch");
    const found = {
      status: "received",
      ownership: "unverified",
      chain: Number(chain2),
      index: Number(index),
      amountAtomic: decoded.amountAtomic,
      note,
      d,
      cm: cm.slice()
    };
    if (!full) return found;
    const keys = this.spendKeys(found.chain, found.index);
    try {
      if (!equal(keys.owner, decoded.owner)) fail2("owner-mismatch");
      const nf = poseidonBytes(concat3(utf83("NIP043/nf/CP1"), this.#domain, keys.nk, decoded.rho, cm));
      return { ...found, status: "owned", ownership: "verified", nf };
    } finally {
      keys.spendSecret.fill(0);
    }
  }
  lock() {
    this.#prk?.fill(0);
    this.#dk?.fill(0);
    this.#prk = null;
    this.#dk = null;
    this.#ivk = 0n;
  }
};

// src/checkpoint-crypto.js
var encoder = new TextEncoder();
var decoder = new TextDecoder("utf-8", { fatal: true });
var AAD = encoder.encode("Neurai/privacy/scan-checkpoint/v1");
var MAX_BYTES = 32 * 1024 * 1024;
var hex2 = (bytes5) => Array.from(bytes5, (byte) => byte.toString(16).padStart(2, "0")).join("");
function unhex2(value) {
  if (typeof value !== "string" || !/^(?:[0-9a-f]{2})+$/i.test(value)) throw new Error("Invalid scan checkpoint");
  return Uint8Array.from(value.match(/../g), (pair2) => parseInt(pair2, 16));
}
function sealScanCheckpoint(checkpoint, key) {
  if (!globalThis.crypto?.getRandomValues) throw new Error("Secure randomness is required");
  const plaintext = encoder.encode(JSON.stringify(checkpoint));
  if (plaintext.length > MAX_BYTES) throw new RangeError("Scan checkpoint is too large");
  const nonce = globalThis.crypto.getRandomValues(new Uint8Array(12));
  try {
    return JSON.stringify({ version: 1, nonce: hex2(nonce), ciphertext: hex2(chacha20poly1305(key, nonce, AAD).encrypt(plaintext)) });
  } finally {
    plaintext.fill(0);
  }
}
function openScanCheckpoint(encoded, key) {
  if (typeof encoded !== "string" || encoded.length > (MAX_BYTES + 16) * 2 + 100) throw new Error("Invalid scan checkpoint");
  const envelope = JSON.parse(encoded);
  if (envelope?.version !== 1) throw new Error("Unsupported scan checkpoint");
  const nonce = unhex2(envelope.nonce);
  const ciphertext = unhex2(envelope.ciphertext);
  if (nonce.length !== 12 || ciphertext.length < 16 || ciphertext.length > MAX_BYTES + 16) throw new Error("Invalid scan checkpoint");
  const plaintext = chacha20poly1305(key, nonce, AAD).decrypt(ciphertext);
  try {
    return JSON.parse(decoder.decode(plaintext));
  } finally {
    plaintext.fill(0);
  }
}

// src/c7-wallet.js
var CHAIN_RECEIVING = 0;
var CHAIN_CHANGE = 1;
var MAX_INDEX2 = 2147483647;
var utf84 = (s) => new TextEncoder().encode(s);
var hex3 = (b) => Array.from(b, (v) => v.toString(16).padStart(2, "0")).join("");
function index312(value, label2) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_INDEX2) throw new RangeError(`${label2} must be in [0, 2^31 - 1]`);
  return value;
}
function concat4(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
var u32le3 = (n) => Uint8Array.of(n & 255, n >>> 8 & 255, n >>> 16 & 255, n >>> 24);
function bytes322(value, label2) {
  const out = typeof value === "string" && /^[0-9a-f]{64}$/i.test(value) ? Uint8Array.from(value.match(/../g), (v) => parseInt(v, 16)) : value;
  if (!(out instanceof Uint8Array) || out.length !== 32) throw new TypeError(`${label2} must be 32 bytes`);
  return out;
}
var C7WalletIdentity = class _C7WalletIdentity {
  #account;
  #family;
  #accountIndex;
  #network;
  #scope;
  #storageId;
  #fingerprint;
  #issued = 0;
  #used = /* @__PURE__ */ new Set();
  #maxUsed = -1;
  constructor(root, { family, account = 0, domain, assetId, network, issued }) {
    if (!NZK_HRP[network]) throw new Error("unknown network");
    this.#family = family;
    this.#accountIndex = index312(account, "account");
    this.#network = network;
    this.#account = new C7Account(root, { family, account, domain: bytes322(domain, "domain"), assetId: bytes322(assetId, "assetId") });
    this.#scope = concat4([NZK_FAMILIES[family]], u32le3(account), this.#account.domain, this.#account.assetId);
    this.#storageId = hex3(sha256(this.#account.expand32("NeuraiZK/v3/storage", this.#scope)));
    this.#fingerprint = hex3(sha256(this.#account.expand32("NeuraiZK/v3/fingerprint", this.#scope)).subarray(0, 4));
    if (issued !== void 0) this.setIssued(issued);
  }
  static async fromMnemonic({ mnemonic, passphrase = "", zkPassphrase = "", ...options }) {
    const seed = await walletSeedFromMnemonic(mnemonic, passphrase);
    try {
      return await _C7WalletIdentity.fromSeed({ seed, zkPassphrase, ...options });
    } finally {
      seed.fill(0);
    }
  }
  static async fromSeed({ seed, zkPassphrase = "", ...options }) {
    const root = await deriveZkRoot(seed, zkPassphrase);
    try {
      return new _C7WalletIdentity(root, options);
    } finally {
      root.fill(0);
    }
  }
  /** For callers that already derived R, such as tests. */
  static fromRoot({ root, ...options }) {
    return new _C7WalletIdentity(root, options);
  }
  get generation() {
    return "c7";
  }
  get derivation() {
    return C7_DERIVATION;
  }
  get family() {
    return this.#family;
  }
  get account() {
    return this.#accountIndex;
  }
  get network() {
    return this.#network;
  }
  get storageId() {
    return this.#storageId;
  }
  get fingerprint() {
    return this.#fingerprint;
  }
  /** Kept for interface compatibility: C7 recovery has no address window. */
  get gap() {
    return NZK_DEFAULT_GAP;
  }
  get issued() {
    return this.#issued;
  }
  get maxUsed() {
    return this.#maxUsed;
  }
  get usedIndexes() {
    return [...this.#used].sort((a, b) => a - b);
  }
  setGap() {
  }
  setIssued(index) {
    this.#issued = index312(index, "issued index");
  }
  descriptorAt(chain2, index) {
    return this.#account.descriptor(chain2, index312(index, "address index"));
  }
  addressAt(chain2, index) {
    return encodeC7Address(this.descriptorAt(chain2, index), this.#network);
  }
  /** First receiving index after the highest used one, or the last one handed out if later. */
  currentIndex() {
    return Math.max(this.#maxUsed + 1, this.#issued);
  }
  recipient() {
    return this.descriptorAt(CHAIN_RECEIVING, this.currentIndex());
  }
  /** Descriptor for the wallet's own notes: deposits, change and self-assignments. */
  selfRecipient() {
    return this.descriptorAt(CHAIN_CHANGE, 0);
  }
  /** Hand out the next receiving address. Recovery does not depend on a gap, so
   * this only keeps the receiving index moving forward. */
  issueNext() {
    const next = this.currentIndex() + 1;
    this.#issued = index312(next, "issued index");
    return next;
  }
  /** Finds this account's notes among published records with the full scanner
   * (ownership checked, nullifier computed). Order of records does not matter. */
  scanRecords(entries, knownAddresses = []) {
    for (const address of knownAddresses) {
      if (address?.chain === CHAIN_RECEIVING) this.#markUsed(address.index);
    }
    const found = [];
    entries.forEach((entry, position) => {
      const owned = this.openRecord(entry.record, entry.cm);
      if (!owned) return;
      found.push({ position, owned, address: owned.address });
      if (owned.address.chain === CHAIN_RECEIVING) this.#markUsed(owned.address.index);
    });
    return found;
  }
  #markUsed(index) {
    this.#used.add(index312(index, "address index"));
    this.#maxUsed = Math.max(this.#maxUsed, index);
  }
  /** The owned note in a record, or null when it is not this account's. */
  openRecord(record2, cm) {
    try {
      const r = this.#account.scan(record2, cm, { full: true });
      return { note: r.note, cm: r.cm, amountAtomic: r.amountAtomic, nf: r.nf, address: { chain: r.chain, index: r.index } };
    } catch {
      return null;
    }
  }
  #spend(consumed) {
    const address = consumed?.address;
    if (!address || address.chain !== CHAIN_RECEIVING && address.chain !== CHAIN_CHANGE) {
      throw new Error("note has no known C7 address");
    }
    const keys = this.#account.spendKeys(address.chain, address.index);
    return { spendSecret: keys.spendSecret, change: this.descriptorAt(address.chain, address.index) };
  }
  /** C7 secrets stay in the proving worker; no spending-key getter is added. */
  prepareC7Deposit(wallet, options) {
    return wallet.prepareDeposit({
      ...options,
      domain: this.#account.domain,
      assetId: this.#account.assetId,
      recipient: options.recipient ?? this.selfRecipient()
    });
  }
  prepareC7Transfer(wallet, { consumed, ...options }) {
    const { spendSecret, change } = this.#spend(consumed);
    try {
      return wallet.prepareTransfer({
        ...options,
        domain: this.#account.domain,
        assetId: this.#account.assetId,
        change,
        root: consumed.root,
        spent: { note: consumed.note, index: consumed.index, path: consumed.path, spendSecret }
      });
    } finally {
      spendSecret.fill(0);
    }
  }
  prepareC7Withdrawal(wallet, { consumed, ...options }) {
    const { spendSecret, change } = this.#spend(consumed);
    try {
      return wallet.prepareWithdrawal({
        ...options,
        domain: this.#account.domain,
        assetId: this.#account.assetId,
        change,
        root: consumed.root,
        spent: { note: consumed.note, index: consumed.index, path: consumed.path, spendSecret }
      });
    } finally {
      spendSecret.fill(0);
    }
  }
  /** J2 joins two owned notes; the new note goes to the address of note 0. */
  prepareC7Join(wallet, { consumed, ...options }) {
    if (!Array.isArray(consumed) || consumed.length !== 2) throw new Error("Two owned notes required");
    const spends = consumed.map((note) => this.#spend(note));
    try {
      return wallet.prepare({
        ...options,
        domain: this.#account.domain,
        assetId: this.#account.assetId,
        root: consumed[0].root,
        change: spends[0].change,
        notes: consumed.map((n, i) => ({ note: n.note, index: n.index, path: n.path, spendSecret: spends[i].spendSecret }))
      });
    } finally {
      for (const s of spends) s.spendSecret.fill(0);
    }
  }
  /** @deprecated Renamed to prepareC7Deposit; kept for one release. */
  prepareC6Deposit(wallet, options) {
    return this.prepareC7Deposit(wallet, options);
  }
  /** @deprecated Renamed to prepareC7Transfer; kept for one release. */
  prepareC6Transfer(wallet, options) {
    return this.prepareC7Transfer(wallet, options);
  }
  /** @deprecated Renamed to prepareC7Withdrawal; kept for one release. */
  prepareC6Withdrawal(wallet, options) {
    return this.prepareC7Withdrawal(wallet, options);
  }
  /** @deprecated Renamed to prepareC7Join; kept for one release. */
  prepareC6Join(wallet, options) {
    return this.prepareC7Join(wallet, options);
  }
  /** Derived identities are recovered from the words; there is no file backup. */
  backupJson() {
    return null;
  }
  #checkpointKey() {
    return this.#account.expand32("NeuraiZK/v3/scan-checkpoint", this.#scope);
  }
  /** Stable opaque journal namespace, never a spending or encryption key. */
  checkpointStoreId() {
    const key = this.#checkpointKey();
    try {
      return hex3(sha256(concat4(utf84("Neurai/C7/journal-id/v1"), key)));
    } finally {
      key.fill(0);
    }
  }
  sealCheckpoint(checkpoint) {
    const key = this.#checkpointKey();
    try {
      return sealScanCheckpoint(checkpoint, key);
    } finally {
      key.fill(0);
    }
  }
  openCheckpoint(encoded) {
    const key = this.#checkpointKey();
    try {
      return openScanCheckpoint(encoded, key);
    } finally {
      key.fill(0);
    }
  }
  lock() {
    this.#account.lock();
  }
};
function describeReceiving(identity, scan) {
  if (!(identity instanceof C7WalletIdentity)) throw new Error("C7 wallet identity required");
  const received = /* @__PURE__ */ new Map();
  for (const note of scan?.notes ?? []) {
    if (note.address?.chain === CHAIN_RECEIVING) received.set(note.address.index, (received.get(note.address.index) ?? 0n) + BigInt(note.amountAtomic));
  }
  const current = identity.currentIndex();
  return {
    kind: "derived",
    derivation: identity.derivation,
    family: identity.family,
    storageId: identity.storageId,
    fingerprint: identity.fingerprint,
    account: identity.account,
    gap: identity.gap,
    issued: identity.issued,
    maxUsed: identity.maxUsed,
    current: { index: current, address: identity.addressAt(CHAIN_RECEIVING, current) },
    used: identity.usedIndexes.map((index) => ({ index, address: identity.addressAt(CHAIN_RECEIVING, index), receivedAtomic: String(received.get(index) ?? 0n) }))
  };
}

// src/pool-state.js
var encoder2 = new TextEncoder();
var MAX_INDEX3 = 4294967295;
function bytes323(value, name) {
  if (!(value instanceof Uint8Array) || value.length !== 32) {
    throw new TypeError(`${name} must be 32 bytes`);
  }
  decodeField(value);
  return value;
}
function uint32(value, name) {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_INDEX3) {
    throw new RangeError(`${name} is not a uint32`);
  }
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, true);
  return out;
}
function concat5(...parts) {
  const out = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
function poolTreeNode(left, right) {
  return encodeField(poseidonPermutation([
    0n,
    decodeField(bytes323(left, "left")),
    decodeField(bytes323(right, "right"))
  ])[0]);
}
function poolIndexedLeaf(kind, value, nextValue, nextIndex) {
  if (kind !== "cm" && kind !== "nf") throw new TypeError("indexed kind must be cm or nf");
  return poseidonBytes(concat5(
    encoder2.encode(`NIP043/${kind}leaf`),
    encodeField(value),
    encodeField(nextValue),
    uint32(nextIndex, "next index")
  ));
}

// src/c7-transaction.js
var C7_FORMS = ["D0", "D1", "T1", "T2", "T3", "W_partial_no_change", "W_partial_change", "W_full_no_change", "J2"];
var ZERO = new Uint8Array(32);
var MAX = 2100000000000000000n;
var QUANTUM = 10000000000n;
var c7Hex = (b) => Array.from(b, (v) => v.toString(16).padStart(2, "0")).join("");
function c7Unhex(s) {
  need(typeof s === "string" && /^(?:[0-9a-f]{2})*$/.test(s), "canonical hex");
  return Uint8Array.from(s.match(/../g) ?? [], (v) => parseInt(v, 16));
}
var eq = (a, b) => c7Hex(a) === c7Hex(b);
var text2 = (s) => new TextEncoder().encode(s);
function c7Cat(...parts) {
  const b = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let i = 0;
  for (const p of parts) {
    b.set(p, i);
    i += p.length;
  }
  return b;
}
function need(ok, msg) {
  if (!ok) throw Error("C7 transaction: " + msg);
}
function c7LE(n, size) {
  n = BigInt(n);
  need(n >= 0n, "unsigned");
  const b = new Uint8Array(size);
  for (let i = 0; i < size; i++, n >>= 8n) b[i] = Number(n & 255n);
  need(n === 0n, "overflow");
  return b;
}
var compact = (n) => n < 253 ? c7LE(n, 1) : n <= 65535 ? c7Cat(Uint8Array.of(253), c7LE(n, 2)) : c7Cat(Uint8Array.of(254), c7LE(n, 4));
var tagged = (s, b) => {
  const h = sha256(text2(s));
  return sha256(c7Cat(h, h, b));
};
function c7Outpoint(point2) {
  need(/^[0-9a-f]{64}:[0-9]+$/.test(point2), "outpoint");
  const [id, v] = point2.split(":");
  need(Number(v) <= 4294967295 && String(Number(v)) === v, "vout");
  return c7Cat(c7Unhex(id).reverse(), c7LE(v, 4));
}
var point = (b) => c7Hex(b.slice(0, 32).reverse()) + ":" + new DataView(b.buffer, b.byteOffset + 32, 4).getUint32(0, true);
function scriptNum(n) {
  n = BigInt(n);
  if (!n) return new Uint8Array();
  const b = [];
  for (; n; n >>= 8n) b.push(Number(n & 255n));
  if (b.at(-1) & 128) b.push(0);
  return Uint8Array.from(b);
}
function push(b) {
  need(b.length <= 75, "guard constant");
  return c7Cat(Uint8Array.of(b.length), b);
}
function c7Manifest(manifest) {
  need(manifest?.profile === C7_PROFILE, "C7 manifest required");
  return manifest;
}
function c7ReserveGuard(manifest) {
  need(typeof manifest.identity === "string" && /^[A-Z0-9_#./!~-]{1,64}$/.test(manifest.identity), "state identity");
  return c7Cat(c7Unhex("0052c420"), c7Unhex(manifest.commitment), c7Unhex("880051cf"), push(text2(manifest.identity)), c7Unhex("880051ce"), push(text2(manifest.identity)), c7Unhex("8800d50052c48851"));
}
function c7ReserveScript(manifest) {
  return c7Cat(c7Unhex("5120"), tagged("NeuraiAuthScript", c7Cat(Uint8Array.of(1, 0), sha256(c7ReserveGuard(manifest)))));
}
var Sparse = class {
  constructor() {
    this.empty = [ZERO];
    for (let i = 0; i < 32; i++) this.empty.push(poolTreeNode(this.empty[i], this.empty[i]));
    this.layers = Array.from({ length: 33 }, () => /* @__PURE__ */ new Map());
  }
  get(i, n) {
    return this.layers[i].get(n) ?? this.empty[i];
  }
  get root() {
    return this.get(32, 0);
  }
  path(n) {
    const p = [];
    for (let i = 0; i < 32; i++) {
      p.push(this.get(i, n % 2 ? n - 1 : n + 1));
      n = Math.floor(n / 2);
    }
    return p;
  }
  set(n, value) {
    need(Number.isInteger(n) && n >= 0 && n <= 4294967295, "tree slot");
    decodeField(value);
    this.layers[0].set(n, value);
    for (let i = 0; i < 32; i++) {
      n = Math.floor(n / 2);
      this.layers[i + 1].set(n, poolTreeNode(this.get(i, n * 2), this.get(i, n * 2 + 1)));
    }
  }
};
var Indexed = class {
  constructor(kind) {
    this.kind = kind;
    this.entries = [[0n, 0n, 0]];
    this.tree = new Sparse();
    this.tree.set(0, poolIndexedLeaf(kind, 0n, 0n, 0));
  }
  insert(value) {
    need(value > 0n && this.entries.length < 4294967295 && !this.entries.some((r) => r[0] === value), "indexed duplicate/range");
    encodeField(value);
    let index = 0;
    for (let i = 0; i < this.entries.length; i++) if (this.entries[i][0] < value && this.entries[i][0] > this.entries[index][0]) index = i;
    const [pv, nv, ni] = this.entries[index], next = this.entries.length;
    need(nv === 0n || value < nv, "indexed ordering");
    const predPath = this.tree.path(index);
    this.entries[index] = [pv, value, next];
    this.tree.set(index, poolIndexedLeaf(this.kind, pv, value, next));
    const emptyPath = this.tree.path(next);
    this.entries.push([value, nv, ni]);
    this.tree.set(next, poolIndexedLeaf(this.kind, value, nv, ni));
    return c7Cat(c7LE(index, 4), encodeField(pv), encodeField(nv), c7LE(ni, 4), ...predPath, ...emptyPath);
  }
};
var C7PublicWorld = class {
  constructor() {
    this.notes = new Sparse();
    this.history = new Sparse();
    this.nfs = new Indexed("nf");
    this.seen = new Indexed("cm");
    this.noteCount = 0;
    this.roots = [];
    this.mode = 0;
  }
  opening() {
    return c7Cat(this.notes.root, this.nfs.tree.root, this.seen.tree.root, c7LE(this.noteCount, 4), c7LE(this.nfs.entries.length, 4), c7LE(this.seen.entries.length, 4), Uint8Array.of(this.mode), this.history.root, c7LE(this.roots.length, 4));
  }
  transition({ form, cms, nfs, rootIndex }) {
    need(C7_FORMS.includes(form), "form");
    const dep = form[0] === "D", join3 = form === "J2", old = this.opening(), parts = [];
    const count = dep || join3 || form === "W_partial_change" ? 1 : form[0] === "T" ? Number(form[1]) : 0;
    need(cms.length === count && nfs.length === (dep ? 0 : join3 ? 2 : 1), "transition shape");
    need(this.mode === Number(form !== "D0"), "mode");
    if (!dep) {
      need(Number.isInteger(rootIndex) && rootIndex >= 0 && rootIndex < this.roots.length, "historical root");
      parts.push(c7LE(rootIndex, 4), ...this.history.path(rootIndex));
    }
    need(new Set(nfs.map(c7Hex)).size === nfs.length, "duplicate nullifiers");
    for (const nf of nfs) parts.push(this.nfs.insert(decodeField(nf)));
    for (const cm of cms) {
      need(this.noteCount <= 4294967293 && decodeField(cm) > 0n, "note capacity/value");
      parts.push(...this.notes.path(this.noteCount));
      this.notes.set(this.noteCount++, cm);
      parts.push(this.seen.insert(decodeField(cm)));
    }
    if (cms.length) {
      need(this.roots.length < 4294967295, "historical capacity");
      parts.push(...this.history.path(this.roots.length));
      this.history.set(this.roots.length, this.notes.root);
      this.roots.push(this.notes.root);
    }
    this.mode = Number(form !== "W_full_no_change");
    const raw = c7Cat(Uint8Array.of(join3 ? 3 : 2, C7_FORMS.indexOf(form)), old, this.opening(), ...dep ? [ZERO] : nfs, ...cms, ...parts);
    need(raw.length <= 15360, "transcript capacity");
    return raw;
  }
};
function readC7Packet(raw, { kind = "xna", manifest } = {}) {
  need(kind === "xna", "C7 pools hold XNA");
  c7Manifest(manifest);
  need(raw instanceof Uint8Array && raw.length <= 4800, "packet size");
  let at = 0;
  const take = (n) => {
    need(at + n <= raw.length, "truncated packet");
    const b = raw.slice(at, at + n);
    at += n;
    return b;
  };
  const magic = c7Hex(take(8)), join3 = magic === "4e4336504b540200";
  need(join3 || magic === "4e4336504b540100", "packet version");
  const network = take(32), pool = take(32), op = take(1)[0], count = take(1)[0], operations = ["D", "T1", "T2", "T3", "W", "J2"];
  need(join3 ? op === 5 && count === 7 : op < 5 && count === [5, 6, 7, 8, 8][op], "packet op/count");
  const operation = operations[op];
  const publics = Array.from({ length: count }, () => {
    const b = take(32);
    decodeField(b);
    return b;
  }), proof = take(128), len = take(2), publication = take(len[0] + len[1] * 256), payout = take(take(1)[0]), funding = take(take(1)[0]);
  need(at === raw.length, "trailing packet");
  need(funding.length === (op === 0 ? 36 : 0), "funding");
  const fee = decodeField(publics[op === 5 ? 5 : 4]);
  need(fee <= MAX, "fee range");
  const dep = op === 0, withdraw = op === 4, change = withdraw && decodeField(publics[6]) !== 0n;
  let cms = [], nfs = dep ? [] : join3 ? publics.slice(2, 4) : [publics[2]];
  need(nfs.every((n) => decodeField(n) > 0n) && new Set(nfs.map(c7Hex)).size === nfs.length, "nullifiers");
  if (!withdraw || change) {
    need(publication.length === 4096, "publication size");
    let digest2;
    if (join3) {
      need(c7Hex(publication.slice(0, 2)) === "0301" && publication[98] === 2 && publication.slice(328).every((b) => b === 0), "J2 publication");
      cms = [publication.slice(66, 98)];
      need(nfs.every((n, i) => eq(n, publication.slice(2 + i * 32, 34 + i * 32))) && eq(cms[0], publics[6]), "J2 fields");
      digest2 = poseidonBytes(c7Cat(poseidonBytes(c7Cat(poseidonBytes(text2("NeuraiPoolC6/J2/data")), publication.slice(0, 2048))), publication.slice(2048)));
    } else {
      const p = decodeC7Publication(dep ? "D0" : withdraw ? "T1" : operation, publication);
      cms = p.cms;
      need(dep || eq(p.nf, nfs[0]), "publication nf");
      digest2 = c7PublicationHash(dep ? "D0" : withdraw ? "T1" : operation, publication);
      if (!dep) need(cms.every((cm, i) => eq(cm, publics[withdraw ? 6 : 5 + i])), "publication cm");
    }
    need(eq(digest2, publics[dep ? 2 : withdraw ? 7 : join3 ? 4 : 3]), "publication digest");
  } else need(publication.length === 0 && c7Hex(publics[7]) === "04bf938a28af8bc7ab2810e0adf3cbbb55aa4feb79827feed2722c5123baac15", "no-publication domain");
  if (dep) {
    const amount = decodeField(publics[3]);
    need(amount > 0n && amount <= MAX && amount % QUANTUM === 0n && eq(publics[1], poseidonBytes(c7Cat(text2("NIP045/dep"), c7LE(amount, 8), cms[0]))), "deposit binding");
  }
  need(withdraw ? payout.length === 25 && c7Hex(payout.slice(0, 3)) === "76a914" && c7Hex(payout.slice(-2)) === "88ac" || payout.length === 34 && [82, 83].includes(payout[0]) && payout[1] === 32 : payout.length === 0, "payout shape");
  if (withdraw) {
    const amount = decodeField(publics[3]);
    need(amount > 0n && amount <= MAX && (amount < QUANTUM && !change || amount % QUANTUM === 0n), "withdrawal quantum");
    need(eq(publics[5], poseidonBytes(c7Cat(text2("NeuraiPoolC6/pay"), compact(payout.length), payout))), "payout binding");
  }
  return { network, pool, operation, publics, proof, publication, payout, funding, cms, nfs, fee, packetId: c7Hex(sha256(c7Cat(c7Cat(text2("NeuraiC6Packet"), Uint8Array.of(join3 ? 2 : 1)), raw))) };
}
function controls(leaves, C) {
  const names = leaves.map((l) => l.form).sort(), map = Object.fromEntries(leaves.map((l) => [l.form, l]));
  need(new Set(names).size === names.length, "duplicate forms");
  function tree(ns) {
    if (ns.length === 1) {
      const s = c7Unhex(map[ns[0]].script);
      return [tagged("NeuraiAuthLeaf", c7Cat(Uint8Array.of(1), compact(s.length), s)), { [ns[0]]: [] }];
    }
    let cut = 1;
    while (cut * 2 < ns.length) cut *= 2;
    const [a, pa] = tree(ns.slice(0, cut)), [b, pb] = tree(ns.slice(cut));
    return [tagged("NeuraiAuthBranch", c7Hex(a) < c7Hex(b) ? c7Cat(a, b) : c7Cat(b, a)), Object.fromEntries([...Object.entries(pa).map(([n, p]) => [n, [...p, b]]), ...Object.entries(pb).map(([n, p]) => [n, [...p, a]])])];
  }
  const [root, paths] = tree(names);
  need(c7Hex(tagged("NeuraiAuthScript", c7Cat(Uint8Array.of(4, 0), root))) === C, "MAST pin");
  return paths;
}
function buildC7Transaction({ packet, scan, manifest, deployment, funding }) {
  const d = validateC7Deployment(deployment), p = readC7Packet(packet, { manifest });
  need(c7Hex(p.network) === manifest.network && c7Hex(p.pool) === manifest.commitment && manifest.commitment === d.commitment && c7Hex(p.publics[0]) === manifest.context, "instance pins");
  need(manifest.fees?.[p.operation]?.some((f) => String(f) === String(p.fee)), "fee level");
  const vk = c7Unhex(manifest.vks?.[p.operation] ?? "");
  need(vk.length > 0 && c7Hex(sha256(vk)) === manifest.vk_sha256?.[p.operation], "VK integrity");
  const world = new C7PublicWorld();
  need(c7Hex(world.opening()) === d.anchor.opening, "empty birth");
  for (const e of scan.events ?? []) {
    const raw2 = world.transition({ form: e.form, cms: e.cms.map(c7Unhex), nfs: e.nfs.map(c7Unhex), rootIndex: e.rootIndex });
    need(c7Hex(raw2) === e.transcript, "confirmed transcript replay");
  }
  need(c7Hex(world.opening()) === scan.opening, "state opening");
  const reserve = BigInt(scan.reserveAtomic);
  need(reserve >= 0n && reserve <= MAX && !!reserve === !!world.mode, "reserve/mode");
  const paths = controls(d.leaves, d.commitment), guard = c7ReserveGuard(manifest), guardScript = c7ReserveScript(manifest), dep = p.operation === "D", withdraw = p.operation === "W";
  const points = [c7Outpoint(scan.statePoint)];
  if (reserve) {
    need(scan.reservePoint === scan.statePoint.split(":")[0] + ":1" && scan.reserveScript === c7Hex(guardScript), "reserve UTXO");
    points.push(c7Outpoint(scan.reservePoint));
  }
  let amount = 0n, left = reserve - p.fee, form = p.operation, rootIndex = null;
  if (dep) {
    amount = decodeField(p.publics[3]);
    left = reserve + amount;
    form = reserve ? "D1" : "D0";
    need(funding && funding.point === point(p.funding) && BigInt(funding.valueAtomic) === amount + p.fee, "funding binding");
    const s = c7Unhex(funding.script);
    need(s.length === 25 && c7Hex(s.slice(0, 3)) === "76a914" && c7Hex(s.slice(-2)) === "88ac" || s.length === 34 && [82, 83].includes(s[0]) && s[1] === 32, "funding destination");
    points.push(p.funding);
  } else {
    rootIndex = world.roots.findIndex((r) => eq(r, p.publics[1]));
    need(rootIndex >= 0, "historical root absent");
    if (withdraw) {
      amount = decodeField(p.publics[3]);
      left = reserve - amount - p.fee;
      need(left > 0n || decodeField(p.publics[6]) === 0n, "full withdrawal change");
      form = left === 0n ? "W_full_no_change" : decodeField(p.publics[6]) !== 0n ? "W_partial_change" : "W_partial_no_change";
    } else need(left > 0n, "transfer reserve");
  }
  need(left >= 0n && left <= MAX && new Set(points.map(c7Hex)).size === points.length, "reserve/prevouts");
  const transcript = world.transition({ form, cms: p.cms, nfs: p.nfs, rootIndex }), stateScript = c7Cat(c7Unhex(d.anchor.script.slice(0, -66)), poseidonBytes(world.opening()), Uint8Array.of(117));
  const outputs = [{ valueAtomic: "0", script: c7Hex(stateScript) }];
  if (left) outputs.push({ valueAtomic: String(left), script: c7Hex(guardScript) });
  if (withdraw) outputs.push({ valueAtomic: String(amount), script: c7Hex(p.payout) });
  const values = { proof: p.proof, vk, prevouts: c7Cat(...points), nf: p.nfs[0] ?? ZERO, R: p.publics[1], amount: scriptNum(amount), chunk1: p.publication.slice(0, 2048), chunk2: p.publication.slice(2048) };
  for (let i = 0; i < 5; i++) values["tree" + i] = transcript.slice(i * 3072, (i + 1) * 3072);
  const leaf = d.leaves.find((l) => l.form === form);
  need(leaf, "missing leaf");
  const stack = [Uint8Array.of(16), ...leaf.args.map((n) => {
    need(values[n] instanceof Uint8Array, "missing witness argument");
    return values[n];
  }), c7Unhex(leaf.script), c7Cat(Uint8Array.of(1), ...paths[form])];
  const stacks = [stack, ...reserve ? [[Uint8Array.of(0), guard]] : [], ...dep ? [[]] : []], blob = (b) => c7Cat(compact(b.length), b);
  const body = c7Cat(compact(points.length), ...points.map((p2) => c7Cat(p2, Uint8Array.of(0), c7Unhex("ffffffff"))), compact(outputs.length), ...outputs.map((o) => c7Cat(c7LE(o.valueAtomic, 8), blob(c7Unhex(o.script)))));
  const raw = c7Hex(c7Cat(c7LE(3, 4), Uint8Array.of(0, 1), body, ...stacks.map((w) => c7Cat(compact(w.length), ...w.map(blob))), new Uint8Array(4))), tx = readC7RawTransaction(raw);
  return { raw, txid: tx.txid, packetId: p.packetId, form, feeAtomic: String(p.fee), amountAtomic: String(amount), reserveAtomic: String(left), inputPoints: tx.inputs.map((i) => ({ txid: i.txid, vout: i.vout })), funding: dep ? { index: points.length - 1, ...funding } : null, intent: c7Intent(raw, d), transcript: c7Hex(transcript) };
}

// src/c7-private-journal.js
var TYPE = "neurai-c6-private-journal-v1";
var hash = (v) => typeof v === "string" && /^[0-9a-f]{64}$/.test(v);
var fail3 = () => {
  throw Error("C7 private journal: invalid or mismatched history");
};
var C7PrivateJournal = class {
  constructor({ identity, genesis, commitment, read, compareAndSwap, assertLive = () => {
  }, packetOptions = {} }) {
    if (!hash(genesis) || !hash(commitment) || !identity || !read || !compareAndSwap) fail3();
    Object.assign(this, { identity, genesis, commitment, read, compareAndSwap, assertLive, packetOptions: structuredClone(packetOptions) });
    this.key = identity.checkpointStoreId() + ":" + genesis + ":" + commitment;
    this.cipher = null;
    this.value = null;
  }
  validate(value) {
    if (value?.type !== TYPE || value.genesis !== this.genesis || value.commitment !== this.commitment || !Number.isSafeInteger(value.revision) || value.revision < 0 || !Array.isArray(value.operations) || value.operations.length > 256 || JSON.stringify(value).length > 4e6) fail3();
    const ids = /* @__PURE__ */ new Set();
    for (const op of value.operations) {
      if (!hash(op.id) || ids.has(op.id) || !["deposit", "transfer", "withdraw", "join"].includes(op.action) || !["draft", "prepared"].includes(op.phase) || !Array.isArray(op.resources) || op.resources.length > 2) fail3();
      ids.add(op.id);
      for (const r of op.resources) if (!hash(r.cm) || !hash(r.nf)) fail3();
      if (op.funding && !/^[0-9a-f]{64}:[0-9]+$/.test(op.funding)) fail3();
      if (op.phase === "prepared") {
        if (!hash(op.packetId) || !op.proof || !Array.isArray(op.publicSignals) || !op.transaction) fail3();
        const p = readC7Packet(c7Unhex(op.packet), this.packetOptions);
        if (p.packetId !== op.packetId || c7Hex(p.network) !== this.genesis || c7Hex(p.pool) !== this.commitment) fail3();
      }
    }
    return value;
  }
  async open({ create = false, backup } = {}) {
    this.assertLive();
    const cipher = await this.read(this.key);
    this.assertLive();
    if (cipher !== null) {
      if (backup) throw Error("C7 private journal: refusing to replace existing history");
      this.value = this.validate(this.identity.openCheckpoint(cipher));
      this.cipher = cipher;
      return;
    }
    if (backup) {
      this.value = this.validate(this.identity.openCheckpoint(backup));
      this.cipher = null;
      await this.write(this.value);
      return;
    }
    if (!create) throw Error("C6 private journal missing: restore the encrypted backup or explicitly create a new history");
    this.cipher = null;
    await this.write({ type: TYPE, genesis: this.genesis, commitment: this.commitment, revision: 0, issued: 0, operations: [] });
  }
  async reload() {
    this.assertLive();
    const cipher = await this.read(this.key);
    this.assertLive();
    if (cipher === null) throw Error("C7 private journal disappeared; restore history before operating");
    this.value = this.validate(this.identity.openCheckpoint(cipher));
    this.cipher = cipher;
    return this.value;
  }
  async write(value) {
    this.assertLive();
    this.validate(value);
    const replacement = this.identity.sealCheckpoint(value), expected = this.cipher;
    const changed = await this.compareAndSwap(this.key, expected, replacement);
    this.assertLive();
    if (!changed) throw Error("C7 private journal changed in another tab; rescan before retrying");
    this.cipher = replacement;
    this.value = structuredClone(value);
  }
  async edit(fn) {
    await this.reload();
    const value = structuredClone(this.value);
    fn(value);
    value.revision++;
    await this.write(value);
  }
  reservations() {
    if (!this.value) throw Error("C7 private journal must be opened");
    return this.value.operations.filter((o) => !o.outcome).flatMap((o) => o.resources);
  }
  async reserve({ action, resources, funding }) {
    const id = c7Hex(sha256(crypto.getRandomValues(new Uint8Array(32))));
    await this.edit((v) => {
      const live = v.operations.filter((o) => !o.outcome);
      if (live.some((o) => resources.some((r) => o.resources.some((s) => s.cm === r.cm || s.nf === r.nf)) || funding && o.funding === funding)) throw Error("C7 private journal: note or funding coin already reserved");
      v.operations.push({ id, action, phase: "draft", resources: structuredClone(resources), ...funding ? { funding } : {}, attempts: [] });
    });
    return id;
  }
  async prepared(id, result) {
    await this.edit((v) => {
      const op = v.operations.find((o) => o.id === id);
      if (!op || op.phase !== "draft") fail3();
      Object.assign(op, { phase: "prepared", packet: c7Hex(result.packet), packetId: result.packetId, proof: result.proof, publicSignals: result.publicSignals, transaction: result.transaction });
    });
  }
  async releaseDraft(id) {
    await this.edit((v) => {
      const i = v.operations.findIndex((o) => o.id === id);
      if (i < 0 || v.operations[i].phase !== "draft") throw Error("An exposed C7 packet cannot be cancelled locally");
      v.operations.splice(i, 1);
    });
  }
  async reconcile(scan) {
    const spent = new Set(scan.events.flatMap((e) => e.nfs));
    await this.edit((v) => {
      for (const op of v.operations) {
        const event = op.transaction && scan.events.find((e) => e.intentId === op.transaction.intent.operationId);
        op.outcome = event ? "confirmed" : op.resources.some((r) => spent.has(r.nf)) ? "conflicted" : null;
        op.confirmedBy = event?.txid ?? null;
      }
    });
  }
  operation(id) {
    const op = this.value?.operations.find((o) => o.id === id);
    if (!op || op.phase !== "prepared" || op.outcome) throw Error("C7 operation is unavailable or already confirmed");
    return structuredClone(op);
  }
  summaries() {
    return this.value.operations.map((o) => ({ id: o.id, action: o.action, phase: o.phase, outcome: o.outcome ?? null, confirmedBy: o.confirmedBy ?? null, txid: o.signed?.txid ?? o.transaction?.txid ?? null }));
  }
  backup() {
    if (!this.cipher) throw Error("C7 journal not open");
    return { type: TYPE, genesis: this.genesis, commitment: this.commitment, cipher: this.cipher };
  }
};

// src/c7-operations.js
var OPS = ["D", "T1", "T2", "T3", "W"];
var MAX_MONEY = 2100000000000000000n;
var QUANTUM2 = 10000000000n;
var EMPTY_W_DATA = "04bf938a28af8bc7ab2810e0adf3cbbb55aa4feb79827feed2722c5123baac15";
var utf85 = (s) => new TextEncoder().encode(s);
var hex4 = (b) => Array.from(b, (v) => v.toString(16).padStart(2, "0")).join("");
var same2 = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
function require2(ok, reason) {
  if (!ok) throw new Error("C7: " + reason);
}
function bytes3(value, length, label2) {
  require2(value instanceof Uint8Array && value.length === length, label2 + " length");
  return value;
}
function unhex3(value, length) {
  require2(typeof value === "string" && /^[0-9a-f]*$/.test(value) && value.length === length * 2, "canonical hex");
  return Uint8Array.from(value.match(/../g) ?? [], (v) => parseInt(v, 16));
}
function concat6(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}
function le(value, length) {
  let n = BigInt(value);
  require2(n >= 0n, "unsigned integer");
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++, n >>= 8n) out[i] = Number(n & 255n);
  require2(n === 0n, "integer overflow");
  return out;
}
function money(value, zero = false) {
  require2(typeof value === "bigint" || typeof value === "string" && /^(0|[1-9][0-9]*)$/.test(value), "exact atomic amount required");
  const n = BigInt(value);
  require2(n >= (zero ? 0n : 1n) && n <= MAX_MONEY, "money range");
  return n;
}
function decimal(value) {
  if (typeof value === "bigint") return String(value);
  if (Array.isArray(value)) return value.map(decimal);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decimal(v)]));
  return value;
}
function destination(script) {
  require2(script instanceof Uint8Array && (script.length === 25 && hex4(script.slice(0, 3)) === "76a914" && hex4(script.slice(-2)) === "88ac" || script.length === 34 && [82, 83].includes(script[0]) && script[1] === 32), "payout must be Legacy or strict PQ/ECDSA");
  return script;
}
function member(cm, index, path) {
  require2(Number.isInteger(index) && index >= 0 && index <= 4294967295 && Array.isArray(path) && path.length === 32, "Merkle shape");
  let value = decodeField(cm), at = BigInt(index);
  for (const sibling of path) {
    const other = decodeField(bytes3(sibling, 32, "sibling"));
    value = poseidonPermutation(at & 1n ? [0n, other, value] : [0n, value, other])[0];
    at >>= 1n;
  }
  return encodeField(value);
}
function descriptor(note) {
  return { domain: hex4(note.domain), asset_id: hex4(note.assetId), owner: hex4(note.owner), view_pub: hex4(note.viewPub) };
}
function seal(recipient, amount, domain, assetId) {
  require2(recipient && recipient.domain === hex4(domain) && recipient.asset_id === hex4(assetId), "recipient instance");
  require2(isC7Descriptor(recipient), "a C7 pool needs a version 3 private address");
  return sealC7Note({ descriptor: recipient, amountAtomic: amount });
}
function changeOf(request, note) {
  const own = descriptor(note);
  const change = request.change;
  require2(isC7Descriptor(change) && change.owner === own.owner && change.view_pub === own.view_pub && change.domain === own.domain && change.asset_id === own.asset_id, "C7 change address must hold the spent note");
  return change;
}
function c7ProofBytes(proof) {
  const fp = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
  const g1 = (p) => {
    const x = BigInt(p[0]), y = BigInt(p[1]);
    require2(x >= 0n && x < fp && y > 0n && y < fp && (y * y - x * x * x - 3n) % fp === 0n, "G1 encoding");
    return le(x | (y > fp - y ? 1n : 0n) << 255n, 32);
  };
  const g2 = (p) => {
    const x = p[0].map(BigInt), y = p[1].map(BigInt), neg = y.map((v) => (fp - v) % fp);
    require2(x.length === 2 && y.length === 2 && [...x, ...y].every((v) => v >= 0n && v < fp), "G2 encoding");
    const sign = y[1] > neg[1] || y[1] === neg[1] && y[0] > neg[0];
    return concat6(le(x[0], 32), le(x[1] | (sign ? 1n : 0n) << 255n, 32));
  };
  return concat6(g1(proof.pi_a), g2(proof.pi_b), g1(proof.pi_c));
}
function createC7OperationWallet({ expectedGenesis, expectedCommitment, kind = "xna" } = {}) {
  if (kind !== "xna") throw Error("C7 pools hold XNA");
  const network = unhex3(expectedGenesis, 32), pool = unhex3(expectedCommitment, 32);
  const intents = /* @__PURE__ */ new WeakMap();
  const fingerprint = (p) => hex4(sha256(utf85(JSON.stringify(p))));
  function context(request, op) {
    const { manifest } = request;
    require2(manifest?.profile === C7_PROFILE, "unsupported manifest profile");
    require2(manifest.network === expectedGenesis && manifest.commitment === expectedCommitment, "manifest differs from pinned instance");
    const D = bytes3(request.domain, 32, "domain"), AID = bytes3(request.assetId, 32, "asset");
    const unit = 1n;
    const ctx = c7PublicationContext({ domain: D, assetId: AID, unit });
    require2(hex4(ctx) === manifest.context && decodeField(ctx) !== 0n, "domain/asset context mismatch");
    const fee = money(request.fee, true), levels = manifest.fees?.[op];
    require2(Array.isArray(levels) && levels.length > 0, "missing operation fee levels");
    const approved = levels.map((v) => {
      if (typeof v === "number") require2(Number.isSafeInteger(v) && v >= 0, "unsafe manifest fee");
      return money(typeof v === "number" ? String(v) : v, true);
    });
    require2(approved.includes(fee), "unapproved fee");
    return { D, AID, ctx, fee, unit, quantum: QUANTUM2, input: { ctx: decodeField(ctx), D: Array.from(D), AID: Array.from(AID), unit, registryRoot: Array(32).fill(0), fee } };
  }
  function spent(request, state) {
    const row = request.spent;
    require2(row && row.note instanceof Uint8Array, "spent note required");
    const note = bytes3(row.note, 169, "spent note"), sk = bytes3(row.spendSecret, 32, "spend secret");
    const decoded = decodeNote(note), cm = noteCommitment(note), nf = noteNullifier(note, sk);
    const root = bytes3(request.root, 32, "historical root");
    require2(decodeField(root) !== 0n && same2(decoded.domain, state.D) && same2(decoded.assetId, state.AID), "spent note instance/root");
    require2(same2(member(cm, row.index, row.path), root), "spent note membership");
    money(decoded.amountAtomic);
    Object.assign(state.input, {
      R: decodeField(root),
      nf: decodeField(nf),
      sk: Array.from(sk),
      spentNote: Array.from(note),
      spentCm: decodeField(cm),
      spentAmount: decoded.amountAtomic,
      spentIndex: row.index,
      spentPath: row.path.map(decodeField)
    });
    return { decoded, cm, nf, root, resource: { cm: hex4(cm), nf: hex4(nf) } };
  }
  function finish(op, state, created, blob, publics, resources, payout = new Uint8Array(), funding = new Uint8Array()) {
    const prepared = {
      operation: op,
      input: decimal(state.input),
      publics: publics.map(String),
      created,
      blob,
      resources,
      payout: payout.slice(),
      funding: funding.slice(),
      network: network.slice(),
      pool: pool.slice()
    };
    intents.set(prepared, fingerprint(prepared));
    return prepared;
  }
  function prepareDeposit(request) {
    const state = context(request, "D"), amount = money(request.amountAtomic);
    require2(amount % state.quantum === 0n, "deposit must be a multiple of 100 XNA");
    const funding = bytes3(request.funding, 36, "funding outpoint");
    require2(money(request.fundingValue) === money(amount + state.fee), "funding must equal amount plus fee");
    const created = seal(request.recipient, amount, state.D, state.AID);
    const blob = encodeC7Publication("D0", { cms: [created.cm], records: [created.record] });
    const data = c7PublicationHash("D0", blob), dep = poseidonBytes(concat6(utf85("NIP045/dep"), le(amount, 8), created.cm));
    Object.assign(state.input, { note: Array.from(created.note), cm: decodeField(created.cm), amount, dep: decodeField(dep), data_hash: decodeField(data) });
    return finish("D", state, [created], blob, [decodeField(state.ctx), decodeField(dep), decodeField(data), amount, state.fee], [], void 0, funding);
  }
  function prepareTransfer(request) {
    require2(["T1", "T2", "T3"].includes(request.operation), "transfer operation");
    const state = context(request, request.operation), input = spent(request, state);
    require2(Array.isArray(request.outputs) && request.outputs.length === Number(request.operation[1]), "transfer output count");
    let total = state.fee, changes = 0;
    const flags = [], created = request.outputs.map((output) => {
      require2(output && (output.isChange === void 0 || typeof output.isChange === "boolean"), "change flag must be Boolean");
      const amount = money(output.amountAtomic), change = output.isChange === true;
      if (change) changes++;
      else require2(amount % state.quantum === 0n, "recipient amount must be a multiple of 100 XNA");
      const own = changeOf(request, input.decoded);
      if (change && output.recipient) require2(Object.keys(own).every((k) => output.recipient[k] === own[k]), "change must preserve owner and viewing key");
      total = money(total + amount);
      flags.push(change ? 1 : 0);
      return seal(change ? own : output.recipient, amount, state.D, state.AID);
    });
    require2(changes <= 1 && total === input.decoded.amountAtomic, "transfer conservation or duplicate change");
    require2(created.every((row) => !same2(row.cm, input.cm)) && new Set(created.map((row) => hex4(row.cm))).size === created.length, "fresh distinct outputs");
    const blob = encodeC7Publication(request.operation, { cms: created.map((row) => row.cm), records: created.map((row) => row.record), nf: input.nf });
    const data = c7PublicationHash(request.operation, blob);
    Object.assign(state.input, {
      data_hash: decodeField(data),
      notes: created.map((row) => Array.from(row.note)),
      amounts: created.map((row) => decodeNote(row.note).amountAtomic),
      cms: created.map((row) => decodeField(row.cm)),
      changeFlags: flags
    });
    return finish(request.operation, state, created, blob, [decodeField(state.ctx), decodeField(input.root), decodeField(input.nf), decodeField(data), state.fee, ...state.input.cms], [input.resource]);
  }
  function prepareWithdrawal(request) {
    const state = context(request, "W"), input = spent(request, state), amount = money(request.amountAtomic);
    const payout = destination(request.payoutScript);
    const left = input.decoded.amountAtomic - amount - state.fee;
    require2(left >= 0n, "withdrawal conservation");
    if (amount >= QUANTUM2) require2(amount % state.quantum === 0n, "withdrawal must be a multiple of 100 XNA");
    else require2(left === 0n, "small recovery must consume the entire note");
    const created = left ? [seal(changeOf(request, input.decoded), money(left), state.D, state.AID)] : [];
    const dummy = encodeNote({
      domain: state.D,
      assetId: state.AID,
      owner: encodeField(1n),
      viewPub: Uint8Array.of(9, ...Array(31).fill(0)),
      amountAtomic: state.unit,
      rho: new Uint8Array(32)
    });
    const blob = left ? encodeC7Publication("T1", { cms: [created[0].cm], records: [created[0].record], nf: input.nf }) : new Uint8Array();
    const data = left ? c7PublicationHash("T1", blob) : unhex3(EMPTY_W_DATA, 32);
    const pay = poseidonBytes(concat6(utf85("NeuraiPoolC6/pay"), Uint8Array.of(payout.length), payout));
    const cm = left ? decodeField(created[0].cm) : 0n;
    Object.assign(state.input, {
      amount,
      pay: decodeField(pay),
      cm_change: cm,
      data_hash: decodeField(data),
      has_change: left ? 1 : 0,
      changeNote: Array.from(created[0]?.note ?? dummy),
      changeAmount: left || state.unit
    });
    return finish("W", state, created, blob, [decodeField(state.ctx), decodeField(input.root), decodeField(input.nf), amount, state.fee, decodeField(pay), cm, decodeField(data)], [input.resource], payout);
  }
  async function prove(prepared, { api, wasm, zkey, vk, signal, stage = () => {
  } }) {
    const expected = intents.get(prepared);
    const check = () => {
      require2(!signal?.aborted, "aborted locally; an exposed packet remains valid on chain");
      require2(expected !== void 0 && intents.get(prepared) === expected && fingerprint(prepared) === expected, "wallet intent changed after preparation");
    };
    check();
    const stable = structuredClone(prepared);
    require2(fingerprint(stable) === expected, "wallet intent changed after preparation");
    stage("Compute witness");
    check();
    const witness = { type: "mem" };
    await api.wtns.calculate(structuredClone(stable.input), wasm, witness);
    check();
    stage("Generate " + stable.operation + " proof");
    check();
    const result = structuredClone(await api.groth16.prove(zkey, witness, void 0, { singleThread: true }));
    check();
    require2(JSON.stringify(result.publicSignals.map(String)) === JSON.stringify(stable.publics), "public signals differ from wallet intent");
    stage("Verify " + stable.operation + " proof");
    check();
    require2(await api.groth16.verify(vk, structuredClone(result.publicSignals), structuredClone(result.proof)), "invalid generated proof");
    check();
    const packet = concat6(
      unhex3("4e4336504b540100", 8),
      stable.network,
      stable.pool,
      Uint8Array.of(OPS.indexOf(stable.operation), stable.publics.length),
      ...stable.publics.map((v) => encodeField(BigInt(v))),
      c7ProofBytes(result.proof),
      le(stable.blob.length, 2),
      stable.blob,
      Uint8Array.of(stable.payout.length),
      stable.payout,
      Uint8Array.of(stable.funding.length),
      stable.funding
    );
    require2(packet.length <= 4800, "packet size");
    return { packet, packetId: hex4(sha256(concat6(utf85("NeuraiC6Packet"), packet))), proof: result.proof, publicSignals: result.publicSignals };
  }
  return { prepareDeposit, prepareTransfer, prepareWithdrawal, prove };
}

// src/c7-join.js
var hex5 = (b) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
var unhex4 = (s) => {
  if (typeof s !== "string" || !/^([0-9a-f]{2})*$/.test(s)) throw Error("Canonical hex required");
  return Uint8Array.from(s.match(/../g) ?? [], (x) => parseInt(x, 16));
};
var text3 = (s) => new TextEncoder().encode(s);
var cat = (...parts) => {
  const out = new Uint8Array(parts.reduce((n, x) => n + x.length, 0));
  let at = 0;
  for (const x of parts) {
    out.set(x, at);
    at += x.length;
  }
  return out;
};
var same3 = (a, b) => hex5(a) === hex5(b);
var decimal2 = (x) => typeof x === "bigint" ? String(x) : Array.isArray(x) ? x.map(decimal2) : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, decimal2(v)])) : x;
var LE = (value, length) => {
  let n = BigInt(value);
  if (n < 0n) throw Error("Negative unsigned integer");
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    out[i] = Number(n & 255n);
    n >>= 8n;
  }
  if (n) throw Error("Integer overflow");
  return out;
};
var MAX_MONEY2 = 2100000000000000000n;
var money2 = (n, zero = false) => {
  if (typeof n !== "bigint" && !(typeof n === "string" && /^(0|[1-9][0-9]*)$/.test(n))) throw Error("Exact atomic amount required");
  n = BigInt(n);
  if (n < (zero ? 0n : 1n) || n > MAX_MONEY2) throw Error("Money range");
  return n;
};
var bytes4 = (value, length) => {
  if (!(value instanceof Uint8Array) || value.length !== length) throw Error("Byte length");
  return value;
};
var num = (b) => {
  const value = BigInt("0x" + hex5(bytes4(b, 32)));
  if (value >= 21888242871839275222246405745257275088548364400416034343698204186575808495617n) throw Error("Noncanonical Fr");
  return value;
};
var merkle = (leaf, index, path) => {
  if (!Number.isInteger(index) || index < 0 || index > 4294967295 || path.length !== 32) throw Error("Merkle shape");
  let value = num(leaf), i = BigInt(index);
  for (const sibling of path) {
    const other = num(sibling);
    value = poseidonPermutation(i & 1n ? [0n, other, value] : [0n, value, other])[0];
    i >>= 1n;
  }
  return encodeField(value);
};
function createC7JoinWallet({ expectedGenesis, expectedCommitment, kind = "xna" } = {}) {
  if (kind !== "xna") throw Error("C7 pools hold XNA");
  const pin = (value) => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
  if (!pin(expectedGenesis) || !pin(expectedCommitment)) throw Error("C7 J2 needs independently pinned genesis and commitment");
  const intents = /* @__PURE__ */ new WeakMap();
  let ready = false;
  const fingerprint = (p) => hex5(sha256(cat(
    text3(JSON.stringify({ input: p.input, publics: p.publics, resources: p.resources })),
    p.blob,
    p.network,
    p.pool,
    p.created.note,
    p.created.cm,
    p.created.record
  )));
  function prepare({ manifest, domain, assetId, root, notes, fee, change }) {
    if (manifest?.profile !== C7_PROFILE) throw Error("Unsupported C7 J2 manifest profile");
    if (manifest.network !== expectedGenesis || manifest.commitment !== expectedCommitment) throw Error("C7 J2 manifest differs from pinned instance");
    const D = bytes4(domain, 32), AID = bytes4(assetId, 32), R = bytes4(root, 32), ctx = unhex4(manifest.context);
    if (hex5(poseidonBytes(cat(text3("NeuraiPoolCtx"), D, AID, LE(1n, 8), new Uint8Array(32)))) !== manifest.context) throw Error("C7 J2 domain/asset context mismatch");
    ready = true;
    if (num(R) === 0n || num(ctx) === 0n || notes?.length !== 2) throw Error("Join context");
    if (!Array.isArray(manifest.fees?.J2) || !manifest.fees.J2.some((v) => money2(String(v), true) === money2(fee, true))) throw Error("Manifest J2 fee level");
    fee = money2(fee, true);
    const opened = notes.map((row) => {
      const note = bytes4(row.note, 169), sk = bytes4(row.spendSecret, 32), decoded = decodeNote(note), cm = noteCommitment(note), nf = noteNullifier(note, sk);
      if (!same3(decoded.domain, D) || !same3(decoded.assetId, AID) || !same3(merkle(cm, row.index, row.path), R)) throw Error("Note instance or membership");
      return { note: note.slice(), sk: sk.slice(), decoded, cm, nf, index: row.index, path: row.path.map((x) => x.slice()) };
    });
    if (opened[0].index === opened[1].index || same3(opened[0].cm, opened[1].cm) || same3(opened[0].nf, opened[1].nf)) throw Error("Distinct real notes required");
    const total = money2(opened[0].decoded.amountAtomic + opened[1].decoded.amountAtomic), amount = money2(total - fee);
    const first = opened[0].decoded, own = { domain: hex5(D), asset_id: hex5(AID), owner: hex5(first.owner), view_pub: hex5(first.viewPub) };
    if (!(isC7Descriptor(change) && Object.keys(own).every((k) => change[k] === own[k]))) throw Error("C7 J2 needs the address of note 0");
    const created = sealC7Note({ descriptor: change, amountAtomic: amount });
    if (opened.some((x) => same3(x.cm, created.cm))) throw Error("Fresh output required");
    const blob = new Uint8Array(4096);
    blob.set([3, 1]);
    blob.set(opened[0].nf, 2);
    blob.set(opened[1].nf, 34);
    blob.set(created.cm, 66);
    blob.set(created.record.slice(0, 230), 98);
    if (blob[98] !== 2) throw Error("Note record framing");
    const P2 = poseidonBytes, dh = P2(cat(P2(cat(P2(text3("NeuraiPoolC6/J2/data")), blob.slice(0, 2048))), blob.slice(2048)));
    const publics = [num(ctx), num(R), ...opened.map((x) => num(x.nf)), num(dh), fee, num(created.cm)];
    const input = {
      ctx: num(ctx),
      D: Array.from(D),
      AID: Array.from(AID),
      unit: 1n,
      registryRoot: Array(32).fill(0),
      R: num(R),
      nf_0: publics[2],
      nf_1: publics[3],
      data_hash: publics[4],
      fee,
      cm: publics[6],
      sk: opened.map((x) => Array.from(x.sk)),
      spentNote: opened.map((x) => Array.from(x.note)),
      spentCm: opened.map((x) => num(x.cm)),
      spentAmount: opened.map((x) => x.decoded.amountAtomic),
      spentIndex: opened.map((x) => x.index),
      spentPath: opened.map((x) => x.path.map(num)),
      note: Array.from(created.note),
      amount
    };
    const prepared = {
      input: decimal2(input),
      publics: publics.map(String),
      blob,
      created,
      resources: opened.map((x) => ({ cm: hex5(x.cm), nf: hex5(x.nf) })),
      network: unhex4(manifest.network),
      pool: unhex4(manifest.commitment)
    };
    bytes4(prepared.network, 32);
    bytes4(prepared.pool, 32);
    intents.set(prepared, fingerprint(prepared));
    return prepared;
  }
  async function proveJoin(prepared, { api, wasm, zkey, vk, stage = () => {
  }, signal }) {
    const abort = () => {
      if (signal?.aborted) throw Error("Aborted locally; an exposed packet is not cancelled on chain");
    };
    const expected = intents.get(prepared);
    const checkIntent = () => {
      abort();
      if (expected === void 0 || fingerprint(prepared) !== expected) throw Error("Wallet intent changed after preparation");
    };
    checkIntent();
    const stable = structuredClone(prepared);
    if (fingerprint(stable) !== expected) throw Error("Wallet intent changed after preparation");
    stage("Compute witness");
    checkIntent();
    const witness = { type: "mem" };
    await api.wtns.calculate(structuredClone(stable.input), wasm, witness);
    checkIntent();
    stage("Generate J2 proof");
    checkIntent();
    const result = structuredClone(await api.groth16.prove(zkey, witness, void 0, { singleThread: true }));
    checkIntent();
    if (JSON.stringify(result.publicSignals.map(String)) !== JSON.stringify(stable.publics)) throw Error("Public signals differ from wallet intent");
    stage("Verify J2 proof");
    checkIntent();
    if (!await api.groth16.verify(vk, structuredClone(result.publicSignals), structuredClone(result.proof))) throw Error("Invalid generated proof");
    checkIntent();
    const proof = c7ProofBytes(result.proof), fields = result.publicSignals.map((v) => encodeField(BigInt(v)));
    bytes4(stable.network, 32);
    bytes4(stable.pool, 32);
    const packet = cat(unhex4("4e4336504b540200"), stable.network, stable.pool, Uint8Array.of(5, 7), ...fields, proof, LE(4096, 2), stable.blob, Uint8Array.of(0, 0));
    if (packet.length !== 4526) throw Error("J2 packet length");
    return { packet, packetId: hex5(sha256(cat(text3("NeuraiC6Packet"), packet))), proof: result.proof, publicSignals: result.publicSignals };
  }
  return { prepare, prove: (...args) => {
    if (!ready) throw Error("Prepare a pinned J2 first");
    return proveJoin(...args);
  } };
}

// src/c7-scan-snapshot.js
var hex6 = (b) => Array.from(b, (v) => v.toString(16).padStart(2, "0")).join("");
var digest = (v) => hex6(sha256(new TextEncoder().encode(v)));
var MAX_BYTES2 = 3 * 1024 * 1024;
var C7ScanSnapshot = class {
  constructor({ store, identity, deployment, assertLive }) {
    Object.assign(this, { store, identity, deployment, assertLive });
    this.scope = digest(JSON.stringify(deployment));
    this.key = "c6-scan-state-v2:" + digest(identity.checkpointStoreId() + ":" + this.scope);
    this.cipher = null;
  }
  async load() {
    this.assertLive();
    this.cipher = await this.store.read(this.key);
    this.assertLive();
    if (this.cipher === null) return null;
    try {
      if (typeof this.cipher !== "string" || this.cipher.length > MAX_BYTES2 * 2 + 200) throw Error("size");
      const value = this.identity.openCheckpoint(this.cipher);
      if (value.type !== "neurai-c6-scan-state-v2" || value.scope !== this.scope || typeof value.data !== "string" || value.data.length > MAX_BYTES2) throw Error("scope");
      return JSON.parse(value.data, (_key, v) => {
        if (v && typeof v === "object" && v.$bytes !== void 0) {
          if (Object.keys(v).length !== 1 || typeof v.$bytes !== "string" || !/^(?:[0-9a-f]{2})*$/.test(v.$bytes)) throw Error("bytes");
          return Uint8Array.from(v.$bytes.match(/../g) ?? [], (x) => parseInt(x, 16));
        }
        if (v && typeof v === "object" && v.$bigint !== void 0) {
          if (Object.keys(v).length !== 1 || !/^\d+$/.test(v.$bigint)) throw Error("integer");
          return BigInt(v.$bigint);
        }
        return v;
      });
    } catch {
      return null;
    }
  }
  async save(snapshot) {
    this.assertLive();
    const data = JSON.stringify(snapshot, (_key, v) => v instanceof Uint8Array ? { $bytes: hex6(v) } : typeof v === "bigint" ? { $bigint: String(v) } : v);
    if (data.length > MAX_BYTES2) return false;
    const replacement = this.identity.sealCheckpoint({ type: "neurai-c6-scan-state-v2", scope: this.scope, data });
    if (replacement.length > MAX_BYTES2 * 2 + 200) return false;
    const written = await this.store.compareAndSwap(this.key, this.cipher, replacement);
    this.assertLive();
    if (!written) throw Error("C7 scan: saved state changed in another tab; retry");
    this.cipher = replacement;
    return true;
  }
};

// src/c7-scan-checkpoint.js
var hex7 = (b) => Array.from(b, (v) => v.toString(16).padStart(2, "0")).join("");
var TYPE2 = "neurai-c6-scan-prefix-v1";
var MAX_BYTES3 = 2 * 1024 * 1024;
var hash2 = (v) => typeof v === "string" && /^[0-9a-f]{64}$/.test(v);
var C7ScanCheckpoint = class {
  constructor({ store, identity, deployment, assertLive }) {
    if (!store?.read || !store?.compareAndSwap || !identity?.sealCheckpoint || !identity?.openCheckpoint || !identity?.checkpointStoreId) throw Error("C7 scan: encrypted checkpoint store required");
    Object.assign(this, { store, identity, deployment, assertLive });
    this.key = "c6-scan-prefix-v1:" + hex7(sha256(new TextEncoder().encode(identity.checkpointStoreId() + ":" + deployment.genesis + ":" + deployment.commitment)));
    this.cipher = null;
    this.entries = [];
  }
  value(entries) {
    const d = this.deployment;
    return { type: TYPE2, genesis: d.genesis, commitment: d.commitment, anchor: d.anchor.outpoint, anchorHash: d.anchor.hash, entries };
  }
  async load() {
    this.assertLive();
    this.cipher = await this.store.read(this.key);
    this.assertLive();
    if (this.cipher === null) return [];
    try {
      if (typeof this.cipher !== "string" || this.cipher.length > MAX_BYTES3 * 2 + 200) throw Error("size");
      const value = this.identity.openCheckpoint(this.cipher), expected = this.value([]);
      for (const k of ["type", "genesis", "commitment", "anchor", "anchorHash"]) if (value[k] !== expected[k]) throw Error("instance");
      if (!Array.isArray(value.entries) || value.entries.length > 2048 || JSON.stringify(value).length > MAX_BYTES3) throw Error("bounds");
      let h = this.deployment.anchor.height;
      for (const row of value.entries) {
        if (!Number.isSafeInteger(row.height) || row.height < h || !hash2(row.hash) || typeof row.raw !== "string" || row.raw.length > 1e6 || !/^(?:[0-9a-f]{2})+$/.test(row.raw)) throw Error("entry");
        h = row.height;
      }
      this.entries = value.entries;
    } catch {
      this.entries = [];
    }
    return structuredClone(this.entries);
  }
  async save(entries) {
    this.assertLive();
    const value = this.value(entries);
    if (entries.length > 2048 || JSON.stringify(value).length > MAX_BYTES3) return false;
    const replacement = this.identity.sealCheckpoint(value);
    const written = await this.store.compareAndSwap(this.key, this.cipher, replacement);
    this.assertLive();
    if (!written) throw Error("C7 scan: progress changed in another tab; retry");
    this.cipher = replacement;
    this.entries = structuredClone(entries);
    return true;
  }
};

// src/c7-scan.js
var hex8 = (b) => Array.from(b, (v) => v.toString(16).padStart(2, "0")).join("");
function demand2(ok, why) {
  if (!ok) throw Error("C7 scan: " + why);
}
function unhex5(s) {
  demand2(typeof s === "string" && /^(?:[0-9a-f]{2})*$/.test(s), "canonical hex");
  return Uint8Array.from(s.match(/../g) ?? [], (v) => parseInt(v, 16));
}
function concat7(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
var same4 = (a, b) => hex8(a) === hex8(b);
function compact2(n) {
  if (n < 253) return Uint8Array.of(n);
  return Uint8Array.of(253, n & 255, n >> 8);
}
function tagged2(tag, value) {
  const t = sha256(new TextEncoder().encode(tag));
  return sha256(concat7(t, t, value));
}
function control(script, raw, C) {
  const path = unhex5(raw);
  demand2(path[0] === 1 && path.length >= 1 && (path.length - 1) % 32 === 0 && path.length <= 1 + 32 * 128, "MAST control shape");
  const bytes5 = unhex5(script);
  let root = tagged2("NeuraiAuthLeaf", concat7(Uint8Array.of(1), compact2(bytes5.length), bytes5));
  for (let at = 1; at < path.length; at += 32) {
    const other = path.slice(at, at + 32);
    root = tagged2("NeuraiAuthBranch", hex8(root) < hex8(other) ? concat7(root, other) : concat7(other, root));
  }
  demand2(hex8(tagged2("NeuraiAuthScript", concat7(Uint8Array.of(4, 0), root))) === C, "MAST commitment");
}
function opening(value) {
  const b = unhex5(value);
  demand2(b.length === 145, "state opening length");
  for (const at of [0, 32, 64, 109]) decodeField(b.slice(at, at + 32));
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  demand2(b[108] === 0 || b[108] === 1, "state mode");
  return { root: b.slice(0, 32), notes: view.getUint32(96, true), nfs: view.getUint32(100, true), seen: view.getUint32(104, true), mode: b[108], history: view.getUint32(141, true) };
}
var pair = (a, b) => encodeField(poseidonPermutation([0n, decodeField(a), decodeField(b)])[0]);
function c7PoolTransportId(genesis, outpoint) {
  demand2(/^[0-9a-f]{64}$/.test(genesis) && /^[0-9a-f]{64}:\d{1,10}$/.test(outpoint), "pool transport id inputs");
  const [txid, vout] = outpoint.split(":"), tag = new TextEncoder().encode("Neurai/privacy-pool/transport/v1"), n = Number(vout);
  demand2(n <= 4294967295, "pool transport id inputs");
  const body = concat7(Uint8Array.of(tag.length), tag, unhex5(genesis).reverse(), unhex5(txid).reverse(), Uint8Array.of(n & 255, n >>> 8 & 255, n >>> 16 & 255, n >>> 24));
  return hex8(sha256(sha256(body)).reverse());
}
var NoteTree = class _NoteTree {
  constructor(source) {
    if (source) {
      this.zeros = source.zeros;
      this.levels = source.levels.map((m) => new Map(m));
      this.count = source.count;
      return;
    }
    this.zeros = [encodeField(0n)];
    for (let i = 0; i < 32; i++) this.zeros.push(pair(this.zeros[i], this.zeros[i]));
    this.levels = Array.from({ length: 33 }, () => /* @__PURE__ */ new Map());
    this.count = 0;
  }
  snapshot() {
    return { count: this.count, zeros: this.zeros, levels: this.levels.map((m) => [...m]) };
  }
  static restore(value) {
    demand2(value && Number.isSafeInteger(value.count) && value.count >= 0 && value.count < 4294967295, "saved note count");
    demand2(Array.isArray(value.zeros) && value.zeros.length === 33 && Array.isArray(value.levels) && value.levels.length === 33, "saved tree shape");
    for (const v of value.zeros) demand2(v instanceof Uint8Array && v.length === 32 && decodeField(v) >= 0n, "saved zero field");
    const result = Object.create(_NoteTree.prototype);
    result.zeros = value.zeros;
    result.count = value.count;
    result.levels = value.levels.map((rows, level) => {
      demand2(Array.isArray(rows) && rows.length === Math.ceil(value.count / 2 ** level), "saved tree width");
      const map = /* @__PURE__ */ new Map();
      for (const [i, v] of rows) {
        demand2(Number.isSafeInteger(i) && i >= 0 && i < rows.length && !map.has(i) && v instanceof Uint8Array && v.length === 32 && decodeField(v) >= 0n, "saved node");
        map.set(i, v);
      }
      return map;
    });
    return result;
  }
  get(level, index) {
    return this.levels[level].get(index) ?? this.zeros[level];
  }
  get root() {
    return this.get(32, 0);
  }
  append(cm) {
    demand2(this.count < 4294967295 && decodeField(cm) !== 0n, "note allocation");
    let i = this.count++;
    this.levels[0].set(i, cm.slice());
    for (let level = 0; level < 32; level++) {
      const p = Math.floor(i / 2);
      this.levels[level + 1].set(p, pair(this.get(level, p * 2), this.get(level, p * 2 + 1)));
      i = p;
    }
  }
  path(index) {
    demand2(Number.isInteger(index) && index >= 0 && index < this.count, "note position");
    const out = [];
    let at = index;
    for (let i = 0; i < 32; i++) {
      out.push(this.get(i, at % 2 ? at - 1 : at + 1).slice());
      at = Math.floor(at / 2);
    }
    return out;
  }
};
var forms = ["D0", "D1", "T1", "T2", "T3", "W_partial_no_change", "W_partial_change", "W_full_no_change", "J2"];
var BURN = { mainnet: "NbURNXXXXXXXXXXXXXXXXXXXXXXXT65Gdr", testnet: "tBURNXXXXXXXXXXXXXXXXXXXXXXXVZLroy", regtest: "tBURNXXXXXXXXXXXXXXXXXXXXXXXVZLroy" };
function checkC7Birth(tx, d, network) {
  demand2(/^[0-9a-f]{64}:\d{1,10}$/.test(d.emission), "C7 emission");
  const [txid, vout] = d.emission.split(":");
  demand2(tx.vin?.some((i) => i.txid === txid && i.vout === Number(vout)), "C7 birth must spend the emission");
  const identity = tx.vout?.[0]?.scriptPubKey?.asset?.name;
  demand2(typeof identity === "string" && identity.includes("#"), "C7 birth state carries the identity");
  const owner = identity.slice(0, identity.indexOf("#")) + "!";
  demand2(tx.vout.some((o) => o.scriptPubKey?.asset?.name === owner && JSON.stringify(o.scriptPubKey?.addresses) === JSON.stringify([BURN[network]])), "C7 birth must burn " + owner);
}
function statement(tx, d) {
  const w = tx.inputs[0]?.witness;
  demand2(w?.[0] === "10", "NoAuth MAST witness");
  const leaf = d.leaves.find((l) => l.script === w.at(-2));
  demand2(leaf && w.length === leaf.args.length + 3, "leaf/witness layout");
  control(leaf.script, w.at(-1), d.commitment);
  const args = Object.fromEntries(leaf.args.map((name, i) => [name, w[i + 1]]));
  const raw = unhex5([0, 1, 2, 3, 4].map((i) => args["tree" + i]).join(""));
  const form = leaf.form, join3 = form === "J2", deposit = form.startsWith("D");
  const count = deposit || join3 || form === "W_partial_change" ? 1 : /^T[1-3]$/.test(form) ? Number(form[1]) : 0;
  const length = join3 ? 9824 : 324 + 32 * count + 3144 * count + 1024 * Number(count > 0) + (deposit ? 0 : 3148);
  demand2(raw.length === length && raw[0] === (join3 ? 3 : 2) && raw[1] === forms.indexOf(form), "transcript profile/form/length");
  const old = hex8(raw.slice(2, 147)), next = hex8(raw.slice(147, 292));
  const nfs = deposit ? [] : [raw.slice(292, 324), ...join3 ? [raw.slice(324, 356)] : []];
  demand2(nfs.every((v) => decodeField(v) !== 0n) && new Set(nfs.map(hex8)).size === nfs.length, "distinct nonzero nullifiers");
  let cms = [], records = [];
  if (count) {
    const blob = unhex5(args.chunk1 + args.chunk2);
    if (join3) {
      demand2(blob.length === 4096 && blob[0] === 3 && blob[1] === 1 && blob[98] === 2 && blob.slice(328).every((v) => v === 0), "J2 publication");
      demand2(nfs.every((nf, i) => same4(nf, blob.slice(2 + 32 * i, 34 + 32 * i))), "J2 publication nullifiers");
      cms = [blob.slice(66, 98)];
      records = [blob.slice(98, 328)];
    } else {
      const parsed = decodeC7Publication(deposit ? "D0" : form === "W_partial_change" ? "T1" : form, blob);
      cms = parsed.cms;
      records = parsed.records;
      demand2(deposit || same4(parsed.nf, nfs[0]), "publication nullifier");
    }
    const offset = join3 ? 356 : 324;
    demand2(cms.every((cm, i) => decodeField(cm) !== 0n && same4(cm, raw.slice(offset + 32 * i, offset + 32 * (i + 1)))), "publication commitment");
  }
  const rootIndex = deposit ? null : new DataView(raw.buffer, raw.byteOffset, raw.byteLength).getUint32(join3 ? 388 : 324 + 32 * count, true);
  return { form, old, next, cms, records, nfs, rootIndex, transcript: hex8(raw), root: deposit ? null : unhex5(args.R) };
}
async function scanC7PoolMode({ rpc, deployment, identity, reserved = [], signal, onProgress, strategy, checkpointStore, historyPageLimit = 20, historyFallback = false }) {
  const d = validateC7Deployment(deployment);
  demand2(Number.isSafeInteger(historyPageLimit) && historyPageLimit >= 1 && historyPageLimit <= 1e3, "history page limit");
  const check = () => {
    demand2(!signal?.aborted, "cancelled");
  };
  check();
  identity.recipient();
  const capability = await rpc("getblockchaininfo");
  demand2(capability?.zk_portable_tree?.active_for_next_block === true, "portable public-tree rules inactive");
  demand2(await rpc("getblockhash", [0]) === d.genesis, "wrong genesis");
  const height = await rpc("getblockcount"), tip = await rpc("getblockhash", [height]);
  demand2(Number.isSafeInteger(height) && height >= d.anchor.height && /^[0-9a-f]{64}$/.test(tip), "tip");
  demand2(await rpc("getblockhash", [d.anchor.height]) === d.anchor.hash, "birth reorganized");
  const birth = await rpc("getblock", [d.anchor.hash, 2]);
  demand2(birth.hash === d.anchor.hash && birth.height === d.anchor.height && birth.tx?.find((tx) => tx.txid === d.anchor.outpoint.split(":")[0])?.vout?.[0]?.scriptPubKey?.hex === d.anchor.script, "birth UTXO");
  demand2(identity.generation === "c7", "C7 pool needs a C7 wallet identity");
  checkC7Birth(birth.tx.find((tx) => tx.txid === d.anchor.outpoint.split(":")[0]), d, identity.network);
  let state = d.anchor.opening, point2 = d.anchor.outpoint, previous = d.anchor.hash, stateScript = d.anchor.script;
  let pointBlock = { height: d.anchor.height, hash: d.anchor.hash };
  const anchors = /* @__PURE__ */ new Map([[d.anchor.height, d.anchor.hash]]);
  let tree = new NoteTree(), roots = [], records = [], nullifiers = /* @__PURE__ */ new Set(), seen = /* @__PURE__ */ new Set();
  const initial = opening(state);
  demand2(initial.notes === 0 && initial.history === 0 && same4(initial.root, tree.root), "zero-note birth required");
  let eligible = null, reserveAtomic = "0", reserveScript = null, reservePoint = null, events = [], lastPublicationHeight = null;
  let restored = null, startHeight = d.anchor.height, recoveryStart = 0;
  const checkpoint = checkpointStore ? new C7ScanCheckpoint({ store: checkpointStore, identity, deployment: d, assertLive: check }) : null;
  const snapshots = checkpointStore ? new C7ScanSnapshot({ store: checkpointStore, identity, deployment: d, assertLive: check }) : null;
  const candidate = snapshots ? await snapshots.load() : null;
  if (candidate && Number.isSafeInteger(candidate.tip?.height) && candidate.tip.height >= d.anchor.height && candidate.tip.height <= height && /^[0-9a-f]{64}$/.test(candidate.tip.hash) && await rpc("getblockhash", [candidate.tip.height]) === candidate.tip.hash) {
    try {
      const restoredTree = NoteTree.restore(candidate.tree), o = opening(candidate.state);
      demand2(o.notes === restoredTree.count && same4(o.root, restoredTree.root) && Array.isArray(candidate.records) && candidate.records.length === o.notes && Array.isArray(candidate.roots) && candidate.roots.length === o.history, "saved state counts");
      demand2(candidate.nullifiers.length === o.nfs - initial.nfs && candidate.seen.length === o.seen - initial.seen && new Set(candidate.nullifiers).size === candidate.nullifiers.length && new Set(candidate.seen).size === candidate.seen.length, "saved sets");
      candidate.records.forEach((r, i) => demand2(r.index === i && r.cm instanceof Uint8Array && r.cm.length === 32 && r.record instanceof Uint8Array && r.record.length === 230 && same4(restoredTree.get(0, i), r.cm) && Number.isSafeInteger(r.height) && r.height <= candidate.tip.height, "saved record"));
      candidate.roots.forEach((r) => demand2(r instanceof Uint8Array && r.length === 32 && decodeField(r) >= 0n, "saved historical root"));
      demand2(/^[0-9a-f]{64}:0$/.test(candidate.point) && typeof candidate.stateScript === "string" && candidate.stateScript.slice(0, -66) === d.anchor.script.slice(0, -66) && candidate.stateScript.slice(-66, -2) === hex8(poseidonBytes(unhex5(candidate.state))), "saved state script");
      const mature = candidate.eligible ? { ...candidate.eligible, tree: NoteTree.restore(candidate.eligible.tree) } : null;
      if (mature) demand2(mature.index < candidate.roots.length && same4(mature.root, candidate.roots[mature.index]) && same4(mature.root, mature.tree.root), "saved eligible root");
      demand2(Array.isArray(candidate.events) && Array.isArray(candidate.recovered) && candidate.recovered.every((r) => Number.isSafeInteger(r.position) && r.position >= 0 && r.position < candidate.records.length && r.owned?.nf instanceof Uint8Array && r.owned.note instanceof Uint8Array && typeof r.owned.amountAtomic === "bigint"), "saved recovery");
      restored = candidate;
      tree = restoredTree;
      state = candidate.state;
      point2 = candidate.point;
      stateScript = candidate.stateScript;
      roots = candidate.roots;
      records = candidate.records;
      nullifiers = new Set(candidate.nullifiers);
      seen = new Set(candidate.seen);
      eligible = mature;
      events = candidate.events;
      const b = candidate.pointBlock;
      pointBlock = b && Number.isSafeInteger(b.height) && b.height >= d.anchor.height && b.height <= candidate.tip.height && /^[0-9a-f]{64}$/.test(b.hash) ? { height: b.height, hash: b.hash } : null;
      reserveAtomic = candidate.reserveAtomic;
      reserveScript = candidate.reserveScript;
      reservePoint = candidate.reservePoint;
      lastPublicationHeight = candidate.lastPublicationHeight;
      startHeight = candidate.tip.height;
      recoveryStart = records.length;
      anchors.set(startHeight, candidate.tip.hash);
      if (lastPublicationHeight !== null && height - lastPublicationHeight + 1 >= 2 && roots.length) eligible = { tree: new NoteTree(tree), root: tree.root.slice(), index: roots.length - 1 };
      onProgress?.({ height: startHeight, target: height, strategy, phase: "checkpoint" });
    } catch {
      restored = null;
    }
  }
  let prefix = checkpoint ? await checkpoint.load() : [], valid = 0;
  for (const row of prefix) {
    check();
    if (row.height > height) break;
    if (!restored || row.height > startHeight) {
      if (await rpc("getblockhash", [row.height]) !== row.hash) break;
      anchors.set(row.height, row.hash);
    }
    valid++;
  }
  if (valid < prefix.length) {
    prefix = prefix.slice(0, valid);
    await checkpoint.save(prefix);
  }
  const saved = restored ? prefix.filter((r) => r.height <= startHeight) : [];
  let cacheWritable = true;
  if (prefix.length && !restored) onProgress?.({ height: prefix.at(-1).height, target: height, strategy, phase: "resuming" });
  async function confirmLive(coin) {
    demand2(Number.isSafeInteger(coin.confirmations) && coin.confirmations >= 1 && coin.scriptPubKey?.hex === stateScript, "indexed live state mismatch");
    if (reservePoint) {
      const [reserveId, reserveIndex] = reservePoint.split(":");
      const reserve = await rpc("gettxout", [reserveId, Number(reserveIndex), false]);
      demand2(reserve && reserve.confirmations >= 1 && reserve.scriptPubKey?.hex === reserveScript, "indexed live reserve mismatch");
    }
  }
  async function* poolHistory() {
    if (!pointBlock) return false;
    const [birthTxid, birthVout] = d.anchor.outpoint.split(":"), pool = { txid: birthTxid, vout: Number(birthVout) }, poolId = c7PoolTransportId(d.genesis, d.anchor.outpoint);
    let cursor = { version: 1, pool_id: poolId, position: { txid: point2.split(":")[0], vout: Number(point2.split(":")[1]) }, sequence: events.length, anchor: { ...pointBlock }, snapshot: { height, hash: tip }, complete: false };
    for (; ; ) {
      check();
      let page;
      try {
        page = await rpc("getprivacypoolupdates", [pool, cursor, historyPageLimit]);
      } catch {
        check();
        return false;
      }
      demand2(page && page.pool_id === poolId && page.genesis === d.genesis && page.commitment === d.commitment && page.snapshot?.height === height && page.snapshot?.hash === tip && typeof page.has_more === "boolean" && Array.isArray(page.updates) && page.updates.length <= historyPageLimit, "pool history page");
      for (const u of page.updates) {
        check();
        demand2(u && u.sequence === events.length + 1 && u.input_index === 0 && u.spent?.txid + ":" + u.spent?.vout === point2 && u.state?.txid === u.txid && u.state?.vout === 0 && /^[0-9a-f]{64}$/.test(u.txid) && /^[0-9a-f]{64}$/.test(u.blockhash) && Number.isSafeInteger(u.height) && u.height >= pointBlock.height && u.height <= height && typeof u.raw === "string", "pool history update");
        onProgress?.({ height: u.height, target: height, strategy });
        yield { tx: { txid: u.txid, vin: [{ txid: u.spent.txid, vout: u.spent.vout }] }, h: u.height, rawHex: u.raw, blockHash: u.blockhash };
      }
      if (page.has_more) {
        demand2(page.updates.length > 0 && page.next_cursor, "pool history progress");
        cursor = page.next_cursor;
        continue;
      }
      demand2(page.history_complete === true && page.continuation === "matching_state" && page.current_state?.txid + ":" + page.current_state?.vout === point2 && page.current_state.script === stateScript, "pool history end");
      const [txid, index] = point2.split(":"), coin = await rpc("gettxout", [txid, Number(index), false]);
      if (coin) await confirmLive(coin);
      else {
        const spent = await rpc("getspentinfo", [{ txid, index: Number(index) }]);
        demand2(Number.isSafeInteger(spent?.height) && spent.height > height, "pool history omitted a confirmed state spend");
      }
      return true;
    }
  }
  async function* transitions() {
    for (const row of prefix) {
      if (restored && row.height <= startHeight) continue;
      check();
      const raw = readC7RawTransaction(row.raw);
      yield { tx: { txid: raw.txid, vin: raw.inputs.map((i) => ({ txid: i.txid, vout: i.vout })) }, h: row.height, rawHex: row.raw, cached: true, blockHash: row.hash };
    }
    const start = Math.max(startHeight, prefix.at(-1)?.height ?? d.anchor.height);
    if (strategy === "pool-history") {
      if (yield* poolHistory()) return;
      if (!historyFallback) throw Object.assign(Error("C7 scan: pool history unavailable; use the spent index"), { code: "C7_HISTORY_UNAVAILABLE" });
    }
    if (strategy === "blocks") {
      if (start > d.anchor.height) previous = await rpc("getblockhash", [start - 1]);
      for (let h = start; h <= height; h++) {
        check();
        const hash3 = h === d.anchor.height ? d.anchor.hash : await rpc("getblockhash", [h]), block2 = h === d.anchor.height ? birth : await rpc("getblock", [hash3, 2]);
        demand2(block2.hash === hash3 && block2.height === h && (h === d.anchor.height || block2.previousblockhash === previous) && Array.isArray(block2.tx), "active-chain continuity");
        for (const tx of block2.tx) if (tx.vin?.some((i) => i.txid + ":" + i.vout === point2)) yield { tx, h, blockHash: hash3 };
        previous = hash3;
        onProgress?.({ height: h, target: height, strategy });
      }
      return;
    }
    let last = Math.max(start, pointBlock?.height ?? start);
    const blocks = /* @__PURE__ */ new Map();
    const walk = strategy === "pool-history" ? "spent-index" : strategy;
    for (; ; ) {
      check();
      const [txid, index] = point2.split(":");
      let spent = null, lookupFailed = false;
      try {
        spent = await rpc("getspentinfo", [{ txid, index: Number(index) }]);
      } catch (e) {
        check();
        lookupFailed = true;
      }
      if (lookupFailed || spent === null || spent?.height === -1) {
        let coin;
        try {
          coin = await rpc("gettxout", [txid, Number(index), false]);
        } catch (e) {
          check();
          throw Object.assign(Error("C7 scan: spent index unavailable; use block replay"), { code: "C7_INDEX_UNAVAILABLE" });
        }
        if (coin) {
          await confirmLive(coin);
          break;
        }
        throw Object.assign(Error("C7 scan: spent index unavailable for consumed state; use block replay"), { code: "C7_INDEX_UNAVAILABLE" });
      }
      demand2(spent && Number.isSafeInteger(spent.height) && spent.height >= last && spent.index === 0 && /^[0-9a-f]{64}$/.test(spent.txid), "invalid spent index entry");
      if (spent.height > height) demand2(spent.height <= await rpc("getblockcount"), "spent index height exceeds active tip");
      const h = spent.height, hash3 = await rpc("getblockhash", [h]);
      if (anchors.has(h)) demand2(anchors.get(h) === hash3, "chain changed during scan; retry");
      if (h <= height) anchors.set(h, hash3);
      let block2 = blocks.get(hash3);
      if (!block2) {
        block2 = await rpc("getblock", [hash3, 2]);
        blocks.set(hash3, block2);
      }
      demand2(block2.hash === hash3 && block2.height === h && Array.isArray(block2.tx), "indexed block mismatch");
      const tx = block2.tx.find((t) => t.txid === spent.txid);
      demand2(tx && tx.vin?.[0]?.txid + ":" + tx.vin?.[0]?.vout === point2, "spent index disagrees with confirmed transaction");
      if (h > height) break;
      onProgress?.({ height: h, target: height, strategy: walk });
      yield { tx, h, blockHash: hash3 };
      last = h;
    }
  }
  for await (const { tx, h, rawHex, cached, blockHash } of transitions()) {
    check();
    demand2(tx.vin[0].txid + ":" + tx.vin[0].vout === point2, "state must be input zero");
    const hexRaw = rawHex ?? await rpc("getrawtransaction", [tx.txid, false]), raw = readC7RawTransaction(hexRaw);
    demand2(raw.txid === tx.txid && raw.inputs[0].txid + ":" + raw.inputs[0].vout === point2 && raw.version === 3 && raw.locktime === 0 && raw.refs.length === 0 && raw.inputs.every((i) => i.sequence === 4294967295), "transaction binding/fixed fields");
    const parsed = statement(raw, d), before = opening(state), after = opening(parsed.next), out = raw.outputs[0]?.script;
    demand2(parsed.old === state && out?.slice(0, -66) === d.anchor.script.slice(0, -66) && out.slice(-66, -2) === hex8(poseidonBytes(unhex5(parsed.next))), "state chain binding");
    if (parsed.rootIndex !== null) demand2(parsed.rootIndex < roots.length && same4(parsed.root, roots[parsed.rootIndex]), "historical root binding");
    for (const nf of parsed.nfs) {
      const key = hex8(nf);
      demand2(!nullifiers.has(key), "confirmed double nullifier");
      nullifiers.add(key);
    }
    parsed.cms.forEach((cm, i) => {
      const key = hex8(cm);
      demand2(!seen.has(key), "duplicate commitment");
      seen.add(key);
      records.push({ cm: cm.slice(), record: parsed.records[i].slice(), index: tree.count, height: h, txid: tx.txid });
      tree.append(cm);
    });
    demand2(after.notes === tree.count && same4(after.root, tree.root) && after.nfs === before.nfs + parsed.nfs.length && after.seen === before.seen + parsed.cms.length && after.history === before.history + Number(parsed.cms.length > 0), "public tree counters/root");
    if (parsed.cms.length) {
      lastPublicationHeight = h;
      roots.push(tree.root.slice());
      if (height - h + 1 >= 2) eligible = { tree: new NoteTree(tree), root: tree.root.slice(), index: roots.length - 1 };
    }
    events.push({ form: parsed.form, cms: parsed.cms.map(hex8), nfs: parsed.nfs.map(hex8), rootIndex: parsed.rootIndex, transcript: parsed.transcript, txid: tx.txid, intentId: c7Intent(hexRaw, d).operationId });
    reserveAtomic = after.mode ? raw.outputs[1].valueAtomic : "0";
    reserveScript = after.mode ? raw.outputs[1].script : null;
    reservePoint = after.mode ? tx.txid + ":1" : null;
    state = parsed.next;
    point2 = tx.txid + ":0";
    stateScript = out;
    pointBlock = { height: h, hash: blockHash };
    if (checkpoint && cacheWritable) saved.push({ height: h, hash: blockHash, raw: hexRaw });
    if (checkpoint && !cached && cacheWritable) cacheWritable = await checkpoint.save(saved);
  }
  const reservedCms = /* @__PURE__ */ new Set(), reservedNfs = /* @__PURE__ */ new Set();
  demand2(Array.isArray(reserved), "reservations");
  for (const row of reserved) {
    demand2(/^[0-9a-f]{64}$/.test(row.cm) && /^[0-9a-f]{64}$/.test(row.nf), "reservation identifiers");
    reservedCms.add(row.cm);
    reservedNfs.add(row.nf);
  }
  onProgress?.({ height, target: height, strategy, phase: "recovering" });
  let recovered;
  const window = { gap: identity.gap ?? null, issued: identity.issued ?? null };
  const reuse = restored && JSON.stringify(window) === JSON.stringify(restored.window);
  const offset = reuse ? recoveryStart : 0, remaining = records.slice(offset);
  if (typeof identity.scanRecords === "function") recovered = identity.scanRecords(remaining, reuse ? restored.recovered.map((r) => r.address).filter(Boolean) : []);
  else recovered = remaining.flatMap((entry, position) => {
    try {
      const owned = identity.openRecord(entry.record, entry.cm);
      return owned ? [{ position, owned }] : [];
    } catch {
      return [];
    }
  });
  recovered = recovered.map((r) => ({ ...r, position: r.position + offset }));
  if (reuse) recovered = [...restored.recovered, ...recovered];
  const coverage = () => typeof identity.scanRecords === "function" ? Math.max(identity.gap - 1, identity.issued, identity.maxUsed + identity.gap) : null;
  if (reuse && typeof identity.scanRecords === "function" && coverage() > restored.coverage) recovered = identity.scanRecords(records, recovered.map((r) => r.address).filter(Boolean));
  const notes = recovered.filter((row) => !nullifiers.has(hex8(row.owned.nf))).map((row) => {
    const entry = records[row.position], reserved2 = reservedCms.has(hex8(entry.cm)) || reservedNfs.has(hex8(row.owned.nf));
    const mature = !!eligible && entry.index < eligible.tree.count;
    return {
      ...entry,
      ...row.owned,
      address: row.address,
      amountAtomic: String(row.owned.amountAtomic),
      reserved: reserved2,
      spendable: mature && !reserved2,
      root: mature ? eligible.root.slice() : null,
      path: mature ? eligible.tree.path(entry.index) : null
    };
  });
  check();
  onProgress?.({ height, target: height, strategy, phase: "verifying" });
  for (const [h, hash3] of anchors) demand2(await rpc("getblockhash", [h]) === hash3, "chain changed during scan; retry");
  demand2(await rpc("getblockhash", [height]) === tip, "chain changed during scan; retry");
  check();
  if (snapshots) await snapshots.save({ tip: { height, hash: tip }, state, point: point2, pointBlock, stateScript, tree: tree.snapshot(), roots, records, nullifiers: [...nullifiers], seen: [...seen], eligible: eligible ? { ...eligible, tree: eligible.tree.snapshot() } : null, events, reserveAtomic, reserveScript, reservePoint, lastPublicationHeight, recovered, window, coverage: coverage() });
  check();
  onProgress?.({ height, target: height, strategy, phase: "complete" });
  return {
    profile: C7_PROFILE,
    genesis: d.genesis,
    commitment: d.commitment,
    tip: { height, hash: tip },
    statePoint: point2,
    opening: state,
    events,
    reserveAtomic,
    reserveScript,
    reservePoint,
    notes,
    records,
    nullifiers: [...nullifiers],
    root: eligible?.root ?? null,
    balanceAtomic: String(notes.reduce((n, row) => n + BigInt(row.amountAtomic), 0n)),
    spendableAtomic: String(notes.filter((row) => row.spendable).reduce((n, row) => n + BigInt(row.amountAtomic), 0n)),
    ignoredRecords: records.length - recovered.length
  };
}
async function scanC7Pool(options) {
  const strategy = options.strategy ?? "auto";
  demand2(["auto", "blocks", "spent-index", "pool-history"].includes(strategy), "unknown scan strategy");
  if (strategy !== "auto") return scanC7PoolMode({ ...options, strategy, historyFallback: false });
  try {
    return await scanC7PoolMode({ ...options, strategy: "pool-history", historyFallback: true });
  } catch (e) {
    if (e.code !== "C7_INDEX_UNAVAILABLE" || options.signal?.aborted) throw e;
    return scanC7PoolMode({ ...options, strategy: "blocks", historyFallback: false });
  }
}

// src/artifacts.js
var hex9 = (bytes5) => Array.from(bytes5, (b) => b.toString(16).padStart(2, "0")).join("");
var MAX_ARTIFACT_BYTES = 256 * 1048576;
async function loadVerifiedArtifact({
  path,
  artifacts,
  fetchArtifact,
  onProgress,
  maxBytes = MAX_ARTIFACT_BYTES,
  missingMessage = "Pool proving parameters are not available"
}) {
  const meta = artifacts.files[path];
  if (!meta || meta.bytes > maxBytes) throw new Error("Unsupported pool artifact");
  const response = await fetchArtifact(path);
  if (!response?.ok) throw new Error(missingMessage);
  const bytes5 = new Uint8Array(meta.bytes);
  let at = 0;
  if (response.body?.getReader) {
    const reader = response.body.getReader();
    let last = -1;
    for (; ; ) {
      const { value, done } = await reader.read();
      if (done) break;
      if (at + value.length > bytes5.length) throw new Error("Artifact exceeds pinned size");
      bytes5.set(value, at);
      at += value.length;
      const percent = Math.floor(at / bytes5.length * 20) * 5;
      if (percent !== last) {
        last = percent;
        onProgress?.(percent);
      }
    }
  } else {
    const whole = new Uint8Array(await response.arrayBuffer());
    if (whole.length > bytes5.length) throw new Error("Artifact exceeds pinned size");
    bytes5.set(whole);
    at = whole.length;
    onProgress?.(100);
  }
  if (at !== bytes5.length || hex9(sha256(bytes5)) !== meta.sha256) throw new Error("Pool artifact integrity mismatch");
  return bytes5;
}

// src/c7-worker.js
var hex10 = (b) => Array.from(b, (v) => v.toString(16).padStart(2, "0")).join("");
function unhex6(value, length) {
  if (typeof value !== "string" || !/^(?:[0-9a-f]{2})+$/.test(value) || length !== void 0 && value.length !== length * 2) throw Error("C7 worker: canonical hex required");
  return Uint8Array.from(value.match(/../g), (v) => parseInt(v, 16));
}
var READ_RPC = /* @__PURE__ */ new Set(["getblockchaininfo", "getblockhash", "getblockcount", "getbestblockhash", "getblock", "getrawtransaction", "gettxout", "getspentinfo", "getprivacypoolupdates"]);
var money3 = (value) => {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]*)$/.test(value)) throw Error("C7 worker: exact atomic amount required");
  return BigInt(value);
};
function startC7PoolWorker({
  scope = globalThis,
  snarkjs,
  manifest,
  deployment,
  domain,
  assetId,
  network = "testnet",
  expectedGenesis,
  expectedCommitment,
  artifacts,
  fetchArtifact,
  artifactBaseUrl,
  reservations,
  maxArtifactBytes = MAX_ARTIFACT_BYTES,
  singleThread = true,
  buildTransactions = false,
  durableJournal = false
} = {}) {
  const pinned = validateC7Deployment(structuredClone(deployment));
  manifest = structuredClone(manifest);
  artifacts = structuredClone(artifacts);
  if (hex10(unhex6(pinned.genesis, 32).reverse()) !== expectedGenesis || pinned.commitment !== expectedCommitment || manifest?.network !== expectedGenesis || manifest?.commitment !== expectedCommitment || manifest?.profile !== C7_PROFILE) throw Error("C7 worker: pinned instance mismatch");
  if (hex10(c7PoolDomain({ genesis: pinned.genesis, emission: pinned.emission, identity: manifest.identity })) !== domain || hex10(c7XnaAssetId()) !== assetId) throw Error("C7 worker: domain or asset does not derive from the pinned birth");
  const kind = "xna", generation = "C7";
  unhex6(domain, 32);
  unhex6(assetId, 32);
  if (network !== "testnet" && network !== "regtest") throw Error("C7 worker: TEST networks only");
  if (!Array.isArray(reservations)) throw Error("C7 worker: durable journal reservations required");
  reservations = structuredClone(reservations);
  for (const r of reservations) {
    unhex6(r.cm, 32);
    unhex6(r.nf, 32);
  }
  if (!artifacts?.files || !artifacts?.forms || !fetchArtifact && !artifactBaseUrl) throw Error("C7 worker: pinned artifacts required");
  if (!Number.isSafeInteger(maxArtifactBytes) || maxArtifactBytes <= 0 || maxArtifactBytes > 256 * 1048576) throw Error("C7 worker: artifact limit");
  for (const op of ["D", "T1", "T2", "T3", "W", ...durableJournal ? ["J2"] : []]) {
    const form = artifacts.forms[op];
    if (!form) throw Error("C7 worker: missing artifacts for " + op);
    for (const path of [form.wasm, form.zkey, form.vk]) {
      const meta = artifacts.files[path];
      if (typeof path !== "string" || !meta || !Number.isSafeInteger(meta.bytes) || meta.bytes <= 0 || meta.bytes > maxArtifactBytes || !/^[0-9a-f]{64}$/.test(meta.sha256)) throw Error("C7 worker: invalid artifact pin");
    }
  }
  if (durableJournal && !buildTransactions) throw Error("C7 durable worker requires transaction construction");
  const joinWallet = createC7JoinWallet({ expectedGenesis, expectedCommitment, kind });
  const wallet = createC7OperationWallet({ expectedGenesis, expectedCommitment, kind });
  const pool = { network, domain, assetId }, fetcher = fetchArtifact ?? ((path) => fetch(new URL(path, artifactBaseUrl)));
  let journal = null, scanIssued = null;
  let identity = null, scan = null, busy = false, stopped = false, epoch = 0, rpcId = 0, controller = null;
  const calls = /* @__PURE__ */ new Map(), post = (m) => {
    if (!stopped) scope.postMessage(m);
  };
  function live(token) {
    if (stopped || token !== epoch || controller?.signal.aborted) throw Error("C7 worker: cancelled/locked");
  }
  function rpc(method, params = [], token = epoch) {
    live(token);
    if (!READ_RPC.has(method)) throw Error("C7 worker: read-only RPC required");
    return new Promise((resolve, reject) => {
      const id = ++rpcId;
      calls.set(id, { resolve, reject, token });
      post({ type: "rpc", id, method, params });
    });
  }
  function storage(type, key, extra = {}, token = epoch) {
    live(token);
    return new Promise((resolve, reject) => {
      const id = ++rpcId;
      calls.set(id, { resolve, reject, token });
      post({ type, id, key, ...extra });
    });
  }
  function journalSummary() {
    if (journal?.value) post({ type: "journal", operations: journal.summaries() });
  }
  async function openJournal(data, token) {
    if (!identity || !durableJournal) throw Error("C7 durable identity required");
    const next = new C7PrivateJournal({
      identity,
      genesis: expectedGenesis,
      commitment: expectedCommitment,
      packetOptions: { kind, manifest },
      read: (key) => storage("journal-read", key, {}, token),
      compareAndSwap: (key, expected, replacement) => storage("journal-write", key, { expected, replacement }, token),
      assertLive: () => live(token)
    });
    await next.open({ create: !!data.create, backup: data.backup?.cipher });
    live(token);
    journal = next;
    if (journal.value.issued > 1) identity.setIssued(journal.value.issued);
    reservations = journal.reservations();
    journalSummary();
  }
  const receiving = () => describeReceiving(identity, scan);
  function recipientOf(input) {
    try {
      if (typeof input === "string" && input.trim()[0] !== "{") return decodeC7Address(input.trim(), pool);
      const value = typeof input === "string" ? JSON.parse(input) : input;
      if (!isC7Descriptor(value)) throw Error("not a version 3 descriptor");
      return decodeC7Address(encodeC7Address(value, network), pool);
    } catch (e) {
      throw Error(`Recipient is not a C7 private address of this pool (${e?.reason ?? e?.message ?? e})`);
    }
  }
  function cancel() {
    epoch++;
    controller?.abort();
    identity?.lock();
    identity = null;
    scan = null;
    journal = null;
    for (const c of calls.values()) c.reject(Error("C7 worker: cancelled/locked"));
    calls.clear();
  }
  async function unchangedScan(token) {
    if (!scan || scanIssued !== (identity.issued ?? null)) return null;
    if (scan.records.some((r) => scan.tip.height - r.height + 1 < 2)) return null;
    const info = await rpc("getblockchaininfo", [], token);
    if (info?.zk_portable_tree?.active_for_next_block !== true) return null;
    const height = await rpc("getblockcount", [], token);
    if (!Number.isSafeInteger(height) || height < scan.tip.height) return null;
    if (await rpc("getblockhash", [scan.tip.height], token) !== scan.tip.hash) return null;
    const hash3 = await rpc("getblockhash", [height], token);
    if (typeof hash3 !== "string" || !/^[0-9a-f]{64}$/.test(hash3)) return null;
    for (const point2 of [scan.statePoint, scan.reservePoint].filter(Boolean)) {
      const [txid, index] = point2.split(":");
      const coin = await rpc("gettxout", [txid, Number(index), false], token);
      const expected = point2 === scan.statePoint ? pinned.anchor.script.slice(0, -66) + hex10(poseidonBytes(unhex6(scan.opening))) + "75" : scan.reserveScript;
      if (!coin || coin.confirmations < 1 || coin.scriptPubKey?.hex !== expected) return null;
      if (point2 === scan.reservePoint && String(rpcAmountToSatoshis(coin.value)) !== scan.reserveAtomic) return null;
    }
    if (await rpc("getblockhash", [height], token) !== hash3) return null;
    live(token);
    return { ...scan, tip: { height, hash: hash3 } };
  }
  async function refresh(token) {
    if (durableJournal && journal) {
      await journal.reload();
      reservations = journal.reservations();
    }
    post({ type: "stage", message: `Reading confirmed ${generation} pool history` });
    let reused = null;
    try {
      reused = await unchangedScan(token);
    } catch {
      live(token);
    }
    const recovered = reused ?? await scanC7Pool({
      rpc: (m, p) => rpc(m, p, token),
      deployment: pinned,
      identity,
      reserved: reservations,
      checkpointStore: durableJournal ? { read: (key) => storage("journal-read", key, {}, token), compareAndSwap: (key, expected, replacement) => storage("journal-write", key, { expected, replacement }, token) } : void 0,
      signal: controller.signal,
      onProgress: (p) => {
        live(token);
        post({ type: "stage", message: p.phase === "checkpoint" ? `Resumed saved ${generation} state through block ${p.height}; checking snapshot ${p.target}` : p.phase === "resuming" ? `Replaying saved pool operations through block ${p.height}` : p.phase === "recovering" ? "Recovering private notes on this device" : p.phase === "verifying" ? "Checking the scanned chain" : p.phase === "complete" ? `${generation} synchronized through block ${p.height}` : p.strategy === "spent-index" || p.strategy === "pool-history" ? `Checking pool operation at block ${p.height} (chain snapshot ${p.target})` : `Reading ${generation} block ${p.height} / ${p.target}` });
      }
    });
    live(token);
    scan = recovered;
    scanIssued = identity.issued ?? null;
    post({ type: "stage", message: "Updating encrypted operation history" });
    if (durableJournal && journal) {
      await journal.reconcile(scan);
      reservations = journal.reservations();
      const reserved = new Set(reservations.map((r) => r.cm));
      for (const n of scan.notes) {
        n.reserved = reserved.has(hex10(n.cm));
        n.spendable = !n.reserved && !!n.root;
      }
      scan.spendableAtomic = String(scan.notes.filter((n) => n.spendable).reduce((v, n) => v + BigInt(n.amountAtomic), 0n));
      journalSummary();
    }
    const heldCms = new Set(reservations.map((r) => r.cm)), heldNfs = new Set(reservations.map((r) => r.nf));
    for (const n of scan.notes) {
      n.reserved = heldCms.has(hex10(n.cm)) || heldNfs.has(hex10(n.nf));
      n.spendable = !n.reserved && !!n.root;
    }
    scan.spendableAtomic = String(scan.notes.filter((n) => n.spendable).reduce((v, n) => v + BigInt(n.amountAtomic), 0n));
    if (durableJournal && !journal) {
      for (const n of scan.notes) {
        n.reserved = true;
        n.spendable = false;
      }
      scan.spendableAtomic = "0";
    }
    post({ type: "scan", result: {
      historyReady: !durableJournal || !!journal,
      tip: scan.tip,
      statePoint: scan.statePoint,
      reserveAtomic: scan.reserveAtomic,
      balanceAtomic: scan.balanceAtomic,
      spendableAtomic: scan.spendableAtomic,
      notes: scan.notes.map((n) => ({ cm: hex10(n.cm), amountAtomic: n.amountAtomic, spendable: n.spendable, reserved: n.reserved }))
    }, addresses: receiving() });
  }
  async function load(path, token) {
    const result = await loadVerifiedArtifact({
      path,
      artifacts,
      fetchArtifact: fetcher,
      maxBytes: maxArtifactBytes,
      onProgress: (percent) => {
        live(token);
        post({ type: "stage", message: `Loading ${path} \xB7 ${percent}%` });
      }
    });
    live(token);
    return result;
  }
  async function prepare(data, token) {
    if (!identity) throw Error("C7 worker: unlock first");
    if (durableJournal && !journal) throw Error("C7 operation history required before preparing; restore or explicitly create it");
    if (!snarkjs) throw Error("C7 worker: snarkjs required");
    await refresh(token);
    const options = { manifest, fee: data.fee };
    let plan;
    if (data.action === "join") {
      if (!Array.isArray(data.notes) || data.notes.length !== 2 || data.notes[0] === data.notes[1]) throw Error("Two distinct notes required");
      const consumed = data.notes.map((cm) => scan.notes.find((n) => hex10(n.cm) === cm && n.spendable));
      if (consumed.some((n) => !n) || hex10(consumed[0].root) !== hex10(consumed[1].root)) throw Error("Two mature owned notes under one root required");
      plan = identity.prepareC7Join(joinWallet, { ...options, consumed });
      plan.operation = "J2";
    } else if (data.action === "deposit") {
      plan = identity.prepareC7Deposit(wallet, {
        ...options,
        amountAtomic: data.amountAtomic,
        funding: unhex6(data.funding, 36),
        fundingValue: data.fundingValue,
        ...data.recipient === void 0 ? {} : { recipient: recipientOf(data.recipient) }
      });
    } else {
      const consumed = scan.notes.find((n) => hex10(n.cm) === data.note && n.spendable);
      if (!consumed) throw Error("C7 worker: selected note is unavailable, immature or reserved");
      if (data.action === "withdraw") plan = identity.prepareC7Withdrawal(wallet, { ...options, consumed, amountAtomic: data.amountAtomic, payoutScript: unhex6(data.payoutScript) });
      else if (data.action === "transfer") {
        if (!Array.isArray(data.recipients) || data.recipients.length < 1 || data.recipients.length > 3) throw Error("C7 worker: one to three recipients required");
        const outputs = data.recipients.map((r) => ({ amountAtomic: r.amountAtomic, recipient: recipientOf(r.recipient) }));
        const remainder = money3(consumed.amountAtomic) - money3(options.fee) - outputs.reduce((n, o) => n + money3(o.amountAtomic), 0n);
        if (remainder < 0n) throw Error("C7 worker: insufficient selected note");
        if (remainder > 0n) outputs.push({ amountAtomic: String(remainder), isChange: true });
        if (outputs.length > 3) throw Error("C7 worker: maximum three outputs including change");
        plan = identity.prepareC7Transfer(wallet, { ...options, consumed, operation: "T" + outputs.length, outputs });
      } else throw Error("C7 worker: unsupported action");
    }
    live(token);
    if (!artifacts.forms[plan.operation]) throw Error("C7 missing operation parameters");
    let operationId;
    if (durableJournal) operationId = await journal.reserve({ action: data.action, resources: plan.resources, funding: data.action === "deposit" ? data.fundingPoint : void 0 });
    live(token);
    const form = artifacts.forms[plan.operation];
    const wasm = await load(form.wasm, token), zkey = await load(form.zkey, token), vk = JSON.parse(new TextDecoder().decode(await load(form.vk, token)));
    const result = await (data.action === "join" ? joinWallet : wallet).prove(plan, { api: snarkjs, wasm, zkey, vk, signal: controller.signal, stage: (message) => {
      live(token);
      post({ type: "stage", message });
    } });
    live(token);
    if (buildTransactions) {
      await refresh(token);
      result.transaction = buildC7Transaction({ packet: result.packet, scan, manifest, deployment: pinned, funding: await fundingCoin(data.fundingPoint, result.packet, token) });
    }
    if (durableJournal) {
      await journal.prepared(operationId, result);
      journalSummary();
    } else reservations.push(...plan.resources);
    post({ type: "prepared", result: { ...result, operationId, ...!durableJournal ? { resources: structuredClone(plan.resources) } : {}, requiresDurableJournal: true } });
  }
  async function fundingCoin(point2, packet, token) {
    const p = readC7Packet(packet, { manifest });
    if (p.operation !== "D") return void 0;
    const chosen = point2 ?? hex10(p.funding.slice(0, 32).reverse()) + ":" + new DataView(p.funding.buffer, p.funding.byteOffset + 32, 4).getUint32(0, true);
    const [txid, index] = chosen.split(":");
    if (hex10(c7Outpoint(chosen)) !== hex10(p.funding)) throw Error("C7 funding point mismatch");
    const coin = await rpc("gettxout", [txid, Number(index), true], token);
    live(token);
    if (!coin || coin.confirmations < 1) throw Error("C7 confirmed funding coin unavailable");
    return { point: chosen, valueAtomic: String(rpcAmountToSatoshis(coin.value)), script: coin.scriptPubKey.hex };
  }
  async function rebuild(id, token) {
    if (!journal) throw Error("C7 journal must be open");
    await refresh(token);
    const op = journal.operation(id), packet = unhex6(op.packet), p = readC7Packet(packet, { manifest }), form = artifacts.forms[p.operation];
    const vk = JSON.parse(new TextDecoder().decode(await load(form.vk, token)));
    if (JSON.stringify(op.publicSignals) !== JSON.stringify(p.publics.map((b) => String(BigInt("0x" + hex10(b))))) || !await snarkjs.groth16.verify(vk, op.publicSignals, op.proof) || hex10(c7ProofBytes(op.proof)) !== hex10(p.proof)) throw Error("C7 stored proof mismatch");
    live(token);
    const transaction = buildC7Transaction({ packet, scan, manifest, deployment: pinned, funding: await fundingCoin(op.funding, packet, token) });
    await journal.edit((v) => {
      const o = v.operations.find((o2) => o2.id === id);
      o.transaction = transaction;
      delete o.signed;
    });
    live(token);
    journalSummary();
    post({ type: "prepared", result: { operationId: id, packet, packetId: op.packetId, transaction, requiresDurableJournal: true } });
  }
  async function recordSigned(data, token) {
    if (!journal) throw Error("C7 journal must be open");
    await journal.reload();
    const op = journal.operation(data.id);
    const original = readC7RawTransaction(op.transaction.raw), signed = readC7RawTransaction(data.raw), i = op.transaction.funding?.index;
    const shape = (t) => JSON.stringify({ version: t.version, locktime: t.locktime, outputs: t.outputs, refs: t.refs, inputs: t.inputs.map((n, index) => ({ ...n, ...index === i ? { scriptSig: "", witness: [] } : {} })) });
    if (shape(original) !== shape(signed) || c7Intent(data.raw, pinned).operationId !== op.transaction.intent.operationId) throw Error("C7 signed transaction changed private intent");
    if (i !== void 0) {
      const input = signed.inputs[i], script = op.transaction.funding.script;
      if (script.startsWith("76a914")) {
        const b = unhex6(input.scriptSig), n = b[0];
        if (n < 9 || n > 73 || b.length < n + 2 || b[n] !== 1 || input.witness.length) throw Error("C7 funding must use SIGHASH_ALL");
      } else {
        const signature = input.witness[1];
        if (!signature || !signature.endsWith("01") || !["01", "02"].includes(input.witness[0])) throw Error("C7 funding must use SIGHASH_ALL");
      }
    } else if (data.raw !== op.transaction.raw) throw Error("C7 spend needs no transparent signature");
    await journal.edit((v) => {
      v.operations.find((o) => o.id === data.id).signed = { raw: data.raw, txid: signed.txid };
    });
    live(token);
    post({ type: "signed", result: { operationId: data.id, raw: data.raw, txid: signed.txid, inputPoints: op.transaction.inputPoints } });
    journalSummary();
  }
  scope.onmessage = async ({ data }) => {
    if (stopped) return;
    if (data?.type === "rpc-result" || data?.type === "journal-result") {
      const c = calls.get(data.id);
      if (!c) return;
      calls.delete(data.id);
      if (c.token !== epoch) c.reject(Error("C7 worker: stale RPC"));
      else data.error !== void 0 && data.error !== null ? c.reject(Error(String(data.error) || "C7 host request failed")) : c.resolve(data.result);
      return;
    }
    if (data?.type === "lock") {
      cancel();
      post({ type: "done" });
      return;
    }
    if (busy) {
      post({ type: "error", message: "C7 worker: another operation is running" });
      return;
    }
    busy = true;
    controller = new AbortController();
    const token = epoch;
    try {
      data = structuredClone(data);
      if (singleThread) {
        Object.defineProperty(scope.navigator ?? {}, "hardwareConcurrency", { value: 1, configurable: true });
        scope.Worker = void 0;
      }
      if (data.type === "create" || data.type === "restore") throw Error("C7 worker: the private wallet is derived from the wallet words");
      if (data.type === "derive") {
        identity?.lock();
        identity = null;
        scan = null;
        journal = null;
        const next = await C7WalletIdentity.fromMnemonic({
          ...pool,
          mnemonic: data.mnemonic,
          passphrase: data.passphrase ?? "",
          family: data.family,
          zkPassphrase: data.zkPassphrase ?? "",
          account: data.account,
          gap: data.gap,
          issued: data.issued
        });
        try {
          live(token);
        } catch (e) {
          next.lock();
          throw e;
        }
        identity = next;
        post({ type: "identity", recipient: identity.recipient(), backup: identity.backupJson(), addresses: receiving() });
      } else if (data.type === "journal-open") {
        await openJournal(data, token);
      } else if (data.type === "journal-backup") {
        if (!journal) throw Error("C7 journal required");
        post({ type: "backup", result: { ...journal.backup(), identityBackup: identity.backupJson() } });
      } else if (data.type === "rebuild") {
        await rebuild(data.id, token);
      } else if (data.type === "record-signed") {
        await recordSigned(data, token);
      } else if (data.type === "record-broadcast") {
        if (!journal) throw Error("C7 journal required");
        await journal.edit((v) => {
          const o = v.operations.find((o2) => o2.id === data.id);
          if (!o?.signed || o.outcome) throw Error("C7 signed operation required");
          o.attempts.push({ txid: o.signed.txid, raw: o.signed.raw });
        });
        journalSummary();
      } else if (data.type === "release-draft") {
        if (!journal) throw Error("C7 journal required");
        await journal.releaseDraft(data.id);
        journalSummary();
      } else if (data.type === "scan") {
        if (!identity) throw Error("C7 worker: unlock first");
        await refresh(token);
      } else if (data.type === "prepare") await prepare(data, token);
      else if (data.type === "new-address") {
        if (!identity) throw Error("C7 worker: unlock first");
        if (durableJournal && !journal) throw Error("C7 journal required");
        identity.issueNext({ force: !!data.force });
        if (durableJournal) {
          await journal.edit((v) => {
            v.issued = identity.issued;
          });
        }
        post({ type: "addresses", recipient: identity.recipient(), addresses: receiving() });
      } else throw Error("C7 worker: unknown request");
      live(token);
      post({ type: "done" });
    } catch (e) {
      if (!stopped && token === epoch) post({ type: "error", message: e instanceof Error ? e.message : String(e) });
    } finally {
      busy = false;
      controller = null;
    }
  };
  return { stop() {
    cancel();
    stopped = true;
    scope.onmessage = null;
  } };
}

export {
  encodeNote,
  decodeNote,
  deriveOwner,
  deriveNullifierKey,
  noteCommitment,
  noteNullifier,
  argon2idAsync,
  chacha20poly1305,
  NZK_DERIVATION,
  NZK_FAMILIES,
  NZK_ARGON2ID,
  NZK_HRP,
  NZK_DEFAULT_GAP,
  NZK_MAX_GAP,
  bech32mEncode,
  bech32mDecode,
  walletSeedFromMnemonic,
  deriveZkRoot,
  C7_PROFILE,
  C7_DERIVATION,
  C7_RECORD_BYTES,
  C7Error,
  c7XnaAssetId,
  c7PoolDomain,
  c7Context,
  c7InstanceTag,
  isC7Descriptor,
  encodeC7Address,
  decodeC7Address,
  sealC7Note,
  C7Account,
  C7WalletIdentity,
  describeReceiving,
  readC7Packet,
  buildC7Transaction,
  createC7OperationWallet,
  createC7JoinWallet,
  scanC7Pool,
  MAX_ARTIFACT_BYTES,
  loadVerifiedArtifact,
  startC7PoolWorker
};
/*! Bundled license information:

@noble/curves/utils.js:
@noble/curves/abstract/modular.js:
@noble/curves/abstract/curve.js:
@noble/curves/abstract/edwards.js:
@noble/curves/ed25519.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/ciphers/utils.js:
  (*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) *)

@noble/hashes/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@scure/base/index.js:
  (*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@scure/bip39/index.js:
  (*! scure-bip39 - MIT License (c) 2022 Patricio Palladino, Paul Miller (paulmillr.com) *)
*/
//# sourceMappingURL=chunk-TGJJTLQZ.js.map
