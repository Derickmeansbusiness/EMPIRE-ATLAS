/**
 * Framework-agnostic authentication service (used by server actions, CLI scripts and tests).
 */
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import type { AtlasDb } from "@/db/client";
import { auditEvents, profiles, sessions, users, type User, type UserRole } from "@/db/schema";
import { hashPassword, normalizeEmail, verifyPassword } from "./password";
import { generateSessionToken, hashSessionToken, SESSION_TTL_DAYS } from "./tokens";

export class AuthError extends Error {
  constructor(message: string, public readonly code: "invalid_credentials" | "email_taken" | "suspended" | "signup_closed" | "weak_password") {
    super(message);
  }
}

export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  role?: UserRole;
  researcherNumber?: number | null;
}

export async function createUser(db: AtlasDb, input: CreateUserInput): Promise<User> {
  const emailNormalized = normalizeEmail(input.email);
  if (input.password.length < 10) throw new AuthError("Password must be at least 10 characters.", "weak_password");
  const existing = await db.query.users.findFirst({ where: eq(users.emailNormalized, emailNormalized) });
  if (existing) throw new AuthError("An account with that email already exists.", "email_taken");
  const passwordHash = await hashPassword(input.password);
  const [user] = await db.insert(users).values({
    email: input.email.trim(),
    emailNormalized,
    passwordHash,
    displayName: input.displayName.trim(),
    role: input.role ?? "student",
    researcherNumber: input.researcherNumber ?? null,
  }).returning();
  await db.insert(profiles).values({ userId: user!.id });
  await db.insert(auditEvents).values({ actorUserId: user!.id, action: "user.created", objectKind: "user", objectId: user!.id, metadata: { role: user!.role } });
  return user!;
}

export async function authenticate(db: AtlasDb, email: string, password: string): Promise<User> {
  const user = await db.query.users.findFirst({ where: eq(users.emailNormalized, normalizeEmail(email)) });
  // Always run the verifier to avoid user-enumeration timing differences.
  const ok = await verifyPassword(password, user?.passwordHash ?? "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
  if (!user || !ok) throw new AuthError("Invalid email or password.", "invalid_credentials");
  if (user.status === "suspended") throw new AuthError("This account is suspended.", "suspended");
  return user;
}

export async function createSession(db: AtlasDb, userId: string, userAgent?: string | null): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ userId, tokenHash: hashSessionToken(token), userAgent: userAgent ?? null, expiresAt });
  await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.id, userId));
  await db.insert(auditEvents).values({ actorUserId: userId, action: "auth.sign_in", objectKind: "user", objectId: userId });
  return { token, expiresAt };
}

export async function resolveSession(db: AtlasDb, token: string): Promise<User | null> {
  const tokenHash = hashSessionToken(token);
  const row = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt), gt(sessions.expiresAt, sql`now()`)))
    .limit(1);
  const user = row[0]?.user ?? null;
  if (!user || user.status === "suspended") return null;
  return user;
}

export async function revokeSession(db: AtlasDb, token: string): Promise<void> {
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, hashSessionToken(token)));
}

export async function setUserRole(db: AtlasDb, actorId: string | null, userId: string, role: UserRole, researcherNumber?: number | null): Promise<User> {
  const patch: Partial<typeof users.$inferInsert> = { role, updatedAt: new Date() };
  if (researcherNumber !== undefined) patch.researcherNumber = researcherNumber;
  const [updated] = await db.update(users).set(patch).where(eq(users.id, userId)).returning();
  if (!updated) throw new Error("User not found");
  await db.insert(auditEvents).values({ actorUserId: actorId, action: "user.role_changed", objectKind: "user", objectId: userId, metadata: { role, researcherNumber: researcherNumber ?? null } });
  return updated;
}
