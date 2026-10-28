import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "atlas_session";
export const SESSION_TTL_DAYS = 30;

function secret(): string {
  const s = process.env.ATLAS_SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ATLAS_SESSION_SECRET must be set (>= 32 chars) in production.");
  }
  return "development-only-insecure-secret-change-me-0000";
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Deterministic hash stored in the database; the raw token only lives in the cookie. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Cookie value = token.signature so tampered cookies are rejected before a DB lookup. */
export function signCookieValue(token: string): string {
  const sig = createHmac("sha256", secret()).update(token).digest("base64url");
  return `${token}.${sig}`;
}

export function verifyCookieValue(value: string | undefined): string | null {
  if (!value) return null;
  const idx = value.lastIndexOf(".");
  if (idx <= 0) return null;
  const token = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  const expected = createHmac("sha256", secret()).update(token).digest("base64url");
  const a = Buffer.from(sig); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return token;
}
