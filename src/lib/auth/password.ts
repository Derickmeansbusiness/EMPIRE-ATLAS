import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

function scrypt(password: string, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => scryptCb(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key))));
}

// scrypt parameters (N=2^15, r=8, p=1) — ~64MB memory, interactive-login appropriate.
const N = 1 << 15;
const R = 8;
const P = 1;
const KEYLEN = 64;

/** Returns an encoded hash: scrypt$N$r$p$salt$hash (base64url). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize("NFKC"), salt, KEYLEN, { N, r: R, p: P, maxmem: 128 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string | null | undefined): Promise<boolean> {
  if (!encoded) return false;
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]); const r = Number(parts[2]); const p = Number(parts[3]);
  const salt = Buffer.from(parts[4]!, "base64url");
  const expected = Buffer.from(parts[5]!, "base64url");
  const derived = await scrypt(password.normalize("NFKC"), salt, expected.length, { N: n, r, p, maxmem: 128 * 1024 * 1024 });
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
