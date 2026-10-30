import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import type { User } from "@/db/schema";
import { resolveSession } from "./service";
import { SESSION_COOKIE, verifyCookieValue } from "./tokens";
import { can, type Capability } from "./roles";
import { hasFeature, minimumTierFor, type Feature } from "@/lib/entitlements";

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

/** Entitlement gate. Passes everything unless ATLAS_ENFORCE_ENTITLEMENTS=true; owners and administrators are never gated. */
export async function requireFeature(feature: Feature): Promise<User> {
  const user = await requireUser();
  if (!hasFeature({ tier: user.membershipTier, role: user.role, feature })) redirect(`/command-center?locked=${feature}&tier=${minimumTierFor(feature)}`);
  return user;
}
