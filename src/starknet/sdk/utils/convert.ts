/**
 * Type conversion utilities - thin wrappers around starknet.js encode/num modules.
 */

import { encode, BigNumberish } from "starknet";

/** Any value that can be converted to bigint, bytes, or hex */
export type Numeric = BigNumberish | Uint8Array;

export function uint8ArrayToBigInt(arr: Uint8Array): bigint {
  let hex = "0x";
  for (const b of arr) {
    hex += b.toString(16).padStart(2, "0");
  }
  return BigInt(hex === "0x" ? "0" : hex);
}

export function hexStringToUint8Array(hexString: string): Uint8Array {
  const clean = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  const padded = clean.length % 2 === 0 ? clean : "0" + clean;
  const match = padded.match(/.{1,2}/g);
  return new Uint8Array(match ? match.map((byte) => parseInt(byte, 16)) : []);
}

// ============ To BigInt ============

/** Convert Numeric to bigint */
export function toBigInt(value: Numeric): bigint {
  if (value instanceof Uint8Array) {
    return uint8ArrayToBigInt(value);
  }
  return BigInt(value);
}

// ============ To Bytes ============

/** Convert Numeric to 32-byte Uint8Array (zero-padded) */
export function toBytes(value: Numeric): Uint8Array {
  const n = toBigInt(value);
  const hex = n.toString(16).padStart(64, "0");
  return hexStringToUint8Array(hex);
}

// ============ To Hex ============

/** Convert Numeric to hex string (with 0x prefix by default). Strings are treated as UTF-8. */
export function toHex(value: Numeric, { prefix = true }: { prefix?: boolean } = {}): string {
  let hex: string;
  if (value instanceof Uint8Array) {
    hex = Array.from(value, (b) => b.toString(16).padStart(2, "0")).join("");
  } else if (typeof value === "bigint") {
    hex = value.toString(16);
  } else if (typeof value === "number") {
    hex = value.toString(16);
  } else if (typeof value === "string") {
    if (value.startsWith("0x") || value.startsWith("0X") || /^\d+$/.test(value)) {
      hex = toBigInt(value).toString(16);
    } else {
      hex = Array.from(encode.utf8ToArray(value), (b) => b.toString(16).padStart(2, "0")).join("");
    }
  } else {
    hex = toBigInt(value).toString(16);
  }
  return prefix ? `0x${hex}` : hex;
}
