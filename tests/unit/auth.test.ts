import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./helpers/db";
import type { AtlasDatabase } from "@/db/client";
import { authenticate, AuthError, createSession, createUser, resolveSession, revokeSession, setUserRole } from "@/lib/auth/service";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signCookieValue, verifyCookieValue } from "@/lib/auth/tokens";
import { can, canAssignRole } from "@/lib/auth/roles";

let database: AtlasDatabase;
beforeAll(async () => { database = await freshDatabase(); });
afterAll(async () => { await database.close(); });

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const h = await hashPassword("correct horse battery staple");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery staple", h)).toBe(true);
    expect(await verifyPassword("Correct horse battery staple", h)).toBe(false);
    expect(await verifyPassword("anything", null)).toBe(false);
  });
});

describe("session cookies", () => {
  it("round-trips a signed value and rejects tampering", () => {
    const v = signCookieValue("abc123");
    expect(verifyCookieValue(v)).toBe("abc123");
    expect(verifyCookieValue(v.slice(0, -2) + "zz")).toBeNull();
    expect(verifyCookieValue("abc123")).toBeNull();
    expect(verifyCookieValue(undefined)).toBeNull();
  });
});

describe("auth service", () => {
  it("creates a student by default, never an elevated role", async () => {
    const u = await createUser(database.db, { email: "Student@Example.com", password: "a-long-passphrase", displayName: "Student One" });
    expect(u.role).toBe("student");
    expect(u.researcherNumber).toBeNull();
    expect(u.emailNormalized).toBe("student@example.com");
  });
  it("rejects duplicates (case-insensitive) and weak passwords", async () => {
    await expect(createUser(database.db, { email: "STUDENT@example.com", password: "another-long-passphrase", displayName: "Dup" })).rejects.toBeInstanceOf(AuthError);
    await expect(createUser(database.db, { email: "weak@example.com", password: "short", displayName: "Weak" })).rejects.toMatchObject({ code: "weak_password" });
  });
  it("authenticates, issues and resolves sessions, and revokes them", async () => {
    const user = await authenticate(database.db, "student@example.com", "a-long-passphrase");
    await expect(authenticate(database.db, "student@example.com", "wrong-passphrase")).rejects.toMatchObject({ code: "invalid_credentials" });
    await expect(authenticate(database.db, "nobody@example.com", "a-long-passphrase")).rejects.toMatchObject({ code: "invalid_credentials" });
    const { token } = await createSession(database.db, user.id, "vitest");
    const resolved = await resolveSession(database.db, token);
    expect(resolved?.id).toBe(user.id);
    expect(await resolveSession(database.db, "not-a-real-token")).toBeNull();
    await revokeSession(database.db, token);
    expect(await resolveSession(database.db, token)).toBeNull();
  });
  it("role grants are explicit and audited", async () => {
    const u = await createUser(database.db, { email: "founder@example.com", password: "founder-passphrase-1", displayName: "Founder" });
    expect(u.role).toBe("student");
    const updated = await setUserRole(database.db, null, u.id, "platform_owner", 1);
    expect(updated.role).toBe("platform_owner");
    expect(updated.researcherNumber).toBe(1);
  });
});

describe("capabilities", () => {
  it("maps roles to capabilities", () => {
    expect(can("student", "research:read_published")).toBe(true);
    expect(can("student", "admin:access")).toBe(false);
    expect(can("research_editor", "claims:review")).toBe(true);
    expect(can("research_editor", "users:manage")).toBe(false);
    expect(can("platform_owner", "users:manage")).toBe(true);
  });
  it("restricts who can assign which roles", () => {
    expect(canAssignRole("platform_owner", "platform_owner")).toBe(true);
    expect(canAssignRole("research_administrator", "platform_owner")).toBe(false);
    expect(canAssignRole("research_administrator", "research_administrator")).toBe(false);
    expect(canAssignRole("research_administrator", "research_editor")).toBe(true);
    expect(canAssignRole("research_editor", "student")).toBe(false);
  });
});
