/**
 * Cryptographically secure random utilities.
 *
 * Roll outcomes MUST use this module — never Math.random().
 * `secureRandomInt` uses rejection sampling to eliminate modulo bias.
 */

const getBytes = (n: number): Uint8Array => {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return buf;
};

/** Returns a uniformly distributed integer in [min, max] inclusive. */
export function secureRandomInt(min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error("secureRandomInt requires integer bounds");
  }
  if (max < min) throw new Error("max < min");
  const range = max - min + 1;
  if (range === 1) return min;

  // Compute number of bytes needed
  const bitsNeeded = Math.ceil(Math.log2(range));
  const bytesNeeded = Math.ceil(bitsNeeded / 8);
  const mask = (1 << bitsNeeded) - 1;
  // For ranges that fit in 32 bits this is fine; we never need d-side > 100.

  // Rejection sampling
  // Try up to 64 times — extremely unlikely to need more than a couple
  for (let i = 0; i < 64; i++) {
    const bytes = getBytes(bytesNeeded);
    let value = 0;
    for (let j = 0; j < bytesNeeded; j++) value = (value << 8) | bytes[j];
    value = value & mask;
    if (value < range) return min + value;
  }
  // Fallback (should never happen for sane ranges)
  return min + (getBytes(4).reduce((a, b) => (a << 8) | b, 0) >>> 0) % range;
}

/** Returns a uniformly distributed float in [0, 1). */
export function secureRandomFloat(): number {
  // 53-bit precision from two 32-bit unsigned ints, matching standard practice.
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  // Take 26 bits from buf[0] and 27 bits from buf[1] for 53 bits.
  const top = buf[0] >>> 6; // 26 bits
  const bottom = buf[1] >>> 5; // 27 bits
  return (top * 2 ** 27 + bottom) / 2 ** 53;
}

export function secureRandomRange(min: number, max: number): number {
  return min + secureRandomFloat() * (max - min);
}

export function secureRandomId(len = 12): string {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  const bytes = getBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
