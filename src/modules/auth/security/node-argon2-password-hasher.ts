import { argon2, randomBytes, timingSafeEqual } from "node:crypto";
import type { PasswordHasher } from "./password-hasher.type.js";

const ARGON2_MEMORY_KIB = 64 * 1024;
const ARGON2_PASSES = 3;
const ARGON2_PARALLELISM = 1;
const ARGON2_TAG_BYTES = 32;
const ARGON2_SALT_BYTES = 16;
const MAXIMUM_MEMORY_KIB = 256 * 1024;
const MAXIMUM_PASSES = 10;
const MAXIMUM_PARALLELISM = 4;
const MINIMUM_TAG_BYTES = 16;
const MAXIMUM_TAG_BYTES = 64;
const MAXIMUM_SALT_BYTES = 64;

type EncodedArgon2Hash = {
  memory: number;
  passes: number;
  parallelism: number;
  salt: Buffer;
  tag: Buffer;
};

export class NodeArgon2PasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(ARGON2_SALT_BYTES);
    const tag = await this.derive(password, salt, {
      memory: ARGON2_MEMORY_KIB,
      passes: ARGON2_PASSES,
      parallelism: ARGON2_PARALLELISM,
      tagLength: ARGON2_TAG_BYTES,
    });
    // Preserve the existing PHC format so hashes written by the previous provider remain readable.
    return [
      "argon2id",
      "v=19",
      `m=${ARGON2_MEMORY_KIB},t=${ARGON2_PASSES},p=${ARGON2_PARALLELISM}`,
      salt.toString("base64").replace(/=+$/, ""),
      tag.toString("base64").replace(/=+$/, ""),
    ]
      .map((part) => `$${part}`)
      .join("");
  }

  async verify(hash: string, password: string): Promise<boolean> {
    const encoded = this.parse(hash);
    if (!encoded) return false;

    const tag = await this.derive(password, encoded.salt, {
      memory: encoded.memory,
      passes: encoded.passes,
      parallelism: encoded.parallelism,
      tagLength: encoded.tag.length,
    });
    return timingSafeEqual(tag, encoded.tag);
  }

  private derive(
    password: string,
    salt: Buffer,
    parameters: { memory: number; passes: number; parallelism: number; tagLength: number },
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      argon2(
        "argon2id",
        {
          message: Buffer.from(password, "utf8"),
          nonce: salt,
          memory: parameters.memory,
          passes: parameters.passes,
          parallelism: parameters.parallelism,
          tagLength: parameters.tagLength,
        },
        (error, tag) => (error ? reject(error) : resolve(tag)),
      );
    });
  }

  private parse(hash: string): EncodedArgon2Hash | null {
    const parts =
      /^\$argon2id\$v=(\d+)\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/.exec(
        hash,
      );
    if (!parts) return null;

    const version = Number(parts[1]);
    const memory = Number(parts[2]);
    const passes = Number(parts[3]);
    const parallelism = Number(parts[4]);
    const saltValue = parts[5];
    const tagValue = parts[6];
    if (
      version !== 19 ||
      !Number.isSafeInteger(memory) ||
      memory < 8 * parallelism ||
      memory > MAXIMUM_MEMORY_KIB ||
      !Number.isSafeInteger(passes) ||
      passes < 1 ||
      passes > MAXIMUM_PASSES ||
      !Number.isSafeInteger(parallelism) ||
      parallelism < 1 ||
      parallelism > MAXIMUM_PARALLELISM ||
      !saltValue ||
      !tagValue
    )
      return null;

    const salt = this.decodePhcBase64(saltValue);
    const tag = this.decodePhcBase64(tagValue);
    if (
      !salt ||
      salt.length < ARGON2_SALT_BYTES ||
      salt.length > MAXIMUM_SALT_BYTES ||
      !tag ||
      tag.length < MINIMUM_TAG_BYTES ||
      tag.length > MAXIMUM_TAG_BYTES
    )
      return null;

    return { memory, passes, parallelism, salt, tag };
  }

  private decodePhcBase64(value: string): Buffer | null {
    const decoded = Buffer.from(value, "base64");
    return decoded.toString("base64").replace(/=+$/, "") === value ? decoded : null;
  }
}
