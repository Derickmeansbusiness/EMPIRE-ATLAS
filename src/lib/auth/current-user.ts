import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import type { User } from "@/db/schema";
import { resolveSession } from "./service";
import { SESSION_COOKIE, verifyCookieValue } from "./tokens";
import { can, type Capability } from "./roles";

/** Memoised per request. Returns null for anonymous visitors. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const token = verifyCookieValue(jar.get(SESSION_COOKIE)?.value);
  if (!token) return null;
  const db = await getDb();
  return resolveSession(db, token);
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const h = await headers();
    const next = h.get("x-atlas-path") ?? "/command-center";
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  }
  return user;
}

export async function requireCapability(capability: Capability): Promise<User> {
  const user = await requireUser();
  if (!can(user.role, capability)) redirect("/command-center?denied=1");
  return user;
}
