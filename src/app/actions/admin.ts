"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { auditEvents, users } from "@/db/schema";
import { requireCapability } from "@/lib/auth/current-user";
import { canAssignRole } from "@/lib/auth/roles";
import { setUserRole } from "@/lib/auth/service";
import { reviewClaim } from "@/lib/data/admin";
import { reviewClaimSchema, setRoleSchema } from "@/lib/validation";

export async function reviewClaimAction(formData: FormData): Promise<void> {
  const reviewer = await requireCapability("claims:review");
  const parsed = reviewClaimSchema.safeParse({ claimId: formData.get("claimId"), toStatus: formData.get("toStatus"), note: formData.get("note") ?? undefined });
  if (!parsed.success) redirect("/admin/claims?error=invalid");
  const db = await getDb();
  await reviewClaim(db, reviewer.id, parsed.data.claimId, parsed.data.toStatus, parsed.data.note?.trim() || null);
  revalidatePath("/admin/claims"); revalidatePath("/dossiers"); revalidatePath("/evidence");
  const back = String(formData.get("returnTo") ?? "/admin/claims");
  const safe = back.startsWith("/") && !back.startsWith("//") ? back : "/admin/claims";
  redirect(`${safe}${safe.includes("?") ? "&" : "?"}reviewed=1`);
}

export async function setUserRoleAction(formData: FormData): Promise<void> {
  const actor = await requireCapability("users:manage");
  const parsed = setRoleSchema.safeParse({ userId: formData.get("userId"), role: formData.get("role") });
  if (!parsed.success) redirect("/admin/users?error=invalid");
  if (!canAssignRole(actor.role, parsed.data.role)) redirect("/admin/users?error=forbidden");
  if (parsed.data.userId === actor.id) redirect("/admin/users?error=self");
  const db = await getDb();
  const target = await db.query.users.findFirst({ where: eq(users.id, parsed.data.userId) });
  if (!target) redirect("/admin/users?error=missing");
  // Administrators cannot demote owners or other administrators.
  if (!canAssignRole(actor.role, target.role)) redirect("/admin/users?error=forbidden");
  await setUserRole(db, actor.id, target.id, parsed.data.role);
  revalidatePath("/admin/users");
  redirect("/admin/users?updated=1");
}

export async function setUserStatusAction(formData: FormData): Promise<void> {
  const actor = await requireCapability("users:manage");
  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!userId || !["active", "suspended"].includes(status) || userId === actor.id) redirect("/admin/users?error=invalid");
  const db = await getDb();
  const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!target || !canAssignRole(actor.role, target.role)) redirect("/admin/users?error=forbidden");
  await db.update(users).set({ status: status as "active" | "suspended", updatedAt: new Date() }).where(eq(users.id, userId));
  await db.insert(auditEvents).values({ actorUserId: actor.id, action: `user.${status}`, objectKind: "user", objectId: userId });
  revalidatePath("/admin/users");
  redirect("/admin/users?updated=1");
}
