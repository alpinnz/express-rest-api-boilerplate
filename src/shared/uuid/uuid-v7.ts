import { randomBytes } from "node:crypto";

const MAX_UUID_V7_TIMESTAMP = 0xffffffffffffn;

export function randomUUIDv7(): string {
  let timestamp = BigInt(Date.now());
  if (timestamp < 0n || timestamp > MAX_UUID_V7_TIMESTAMP)
    throw new RangeError("Current time is outside the UUIDv7 timestamp range");

  const bytes = randomBytes(16);
  for (let index = 5; index >= 0; index--) {
    bytes[index] = Number(timestamp & 0xffn);
    timestamp >>= 8n;
  }

  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hexadecimal = bytes.toString("hex");
  return `${hexadecimal.slice(0, 8)}-${hexadecimal.slice(8, 12)}-${hexadecimal.slice(12, 16)}-${hexadecimal.slice(16, 20)}-${hexadecimal.slice(20)}`;
}
