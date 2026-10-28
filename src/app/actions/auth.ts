"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { authenticate, AuthError, createSession, createUser, revokeSession } from "@/lib/auth/service";
import { SESSION_COOKIE, signCookieValue, verifyCookieValue } from "@/lib/auth/tokens";
import { safeReturnTo, signInSchema, signUpSchema } from "@/lib/validation";

export interface AuthFormState { error?: string; fields?: Record<string, string> }

async function setSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signCookieValue(token), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt,
  });
}

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({ email: formData.get("email"), password: formData.get("password"), next: formData.get("next") ?? undefined });
  if (!parsed.success) return { error: "Enter a valid email and password.", fields: { email: String(formData.get("email") ?? "") } };
  const db = await getDb();
  try {
    const user = await authenticate(db, parsed.data.email, parsed.data.password);
    const ua = (await headers()).get("user-agent");
    const { token, expiresAt } = await createSession(db, user.id, ua);
    await setSessionCookie(token, expiresAt);
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message, fields: { email: parsed.data.email } };
    throw err;
  }
  redirect(safeReturnTo(parsed.data.next, "/command-center"));
}

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if ((process.env.ATLAS_SIGNUP_MODE ?? "open") !== "open") return { error: "Public sign-up is closed. Ask an administrator for an invitation." };
  const parsed = signUpSchema.safeParse({ email: formData.get("email"), password: formData.get("password"), displayName: formData.get("displayName") });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Check the form and try again.", fields: { email: String(formData.get("email") ?? ""), displayName: String(formData.get("displayName") ?? "") } };
  }
  const db = await getDb();
  try {
    // Public sign-up always creates a Student. Elevated roles are granted only by operators.
    const user = await createUser(db, { ...parsed.data, role: "student" });
    const ua = (await headers()).get("user-agent");
    const { token, expiresAt } = await createSession(db, user.id, ua);
    await setSessionCookie(token, expiresAt);
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message, fields: { email: parsed.data.email, displayName: parsed.data.displayName } };
    throw err;
  }
  redirect("/command-center?welcome=1");
}

export async function signOutAction(): Promise<void> {
  const jar = await cookies();
  const token = verifyCookieValue(jar.get(SESSION_COOKIE)?.value);
  if (token) {
    const db = await getDb();
    await revokeSession(db, token);
  }
  jar.delete(SESSION_COOKIE);
  redirect("/");
}
