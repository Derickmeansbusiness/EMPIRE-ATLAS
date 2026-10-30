import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { requireCapability } from "@/lib/auth/current-user";
import { listUsers } from "@/lib/data/admin";
import { ROLE_LABELS, canAssignRole } from "@/lib/auth/roles";
import { setTierAction, setUserRoleAction, setUserStatusAction } from "@/app/actions/admin";
import { TIERS } from "@/lib/entitlements";
import { Alert, Card, PageHeader, Select } from "@/components/ui/primitives";
import { formatRelative, researcherLabel } from "@/lib/format";
import type { UserRole } from "@/db/schema";

export const metadata: Metadata = { title: "User Management" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ updated?: string; error?: string }> }) {
  const actor = await requireCapability("users:manage");
  const sp = await searchParams;
  const db = await getDb();
  const users = await listUsers(db);
  const roles = Object.keys(ROLE_LABELS) as UserRole[];
  return (
    <>
      <PageHeader eyebrow="Administration" title="User management" description="Roles are assigned here or by the operator CLI. Public sign-up always creates Students. Owners may grant any role; administrators may grant roles below their own and cannot change owners or other administrators." />
      {sp.updated && <div className="mb-5"><Alert tone="success">User updated.</Alert></div>}
      {sp.error && <div className="mb-5"><Alert tone="error">{sp.error === "forbidden" ? "You are not allowed to assign that role or change that user." : sp.error === "self" ? "You cannot change your own role." : "Invalid request."}</Alert></div>}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[0.65rem] uppercase tracking-[0.16em] text-slate-mist"><tr><th className="p-2 font-medium">User</th><th className="p-2 font-medium">Role</th><th className="p-2 font-medium">Status</th><th className="p-2 font-medium">Last sign-in</th><th className="p-2 font-medium">Change role</th><th className="p-2 font-medium">Tier</th><th className="p-2 font-medium">Access</th></tr></thead>
          <tbody>
            {users.map((u) => {
              const editable = u.id !== actor.id && canAssignRole(actor.role, u.role);
              return (
                <tr key={u.id} className="border-t hairline align-top">
                  <td className="p-2"><p className="text-ivory">{u.displayName}</p><p className="text-xs text-slate-mist">{u.email}{researcherLabel(u.researcherNumber) ? ` · ${researcherLabel(u.researcherNumber)}` : ""}</p></td>
                  <td className="p-2 text-platinum/85">{ROLE_LABELS[u.role]}</td>
                  <td className="p-2"><span className={u.status === "active" ? "text-positive" : "text-risk"}>{u.status}</span></td>
                  <td className="p-2 text-xs text-slate-mist">{formatRelative(u.lastSignInAt)}</td>
                  <td className="p-2">
                    {editable ? (
                      <form action={setUserRoleAction} className="flex gap-1.5">
                        <input type="hidden" name="userId" value={u.id} />
                        <Select name="role" defaultValue={u.role} aria-label={`Role for ${u.displayName}`} className="py-1.5 text-xs">{roles.filter((r) => canAssignRole(actor.role, r)).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</Select>
                        <button type="submit" className="rounded-md border border-platinum/25 px-2 text-xs text-platinum hover:border-gold hover:text-gold">Set</button>
                      </form>
                    ) : <span className="text-xs text-slate-mist">{u.id === actor.id ? "you" : "protected"}</span>}
                  </td>
                  <td className="p-2"><form action={setTierAction} className="flex gap-1.5"><input type="hidden" name="userId" value={u.id} /><Select name="tier" defaultValue={u.membershipTier} aria-label={`Membership tier for ${u.displayName}`} className="py-1.5 text-xs">{TIERS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</Select><button type="submit" className="rounded-md border border-platinum/25 px-2 text-xs text-platinum hover:border-gold hover:text-gold">Set</button></form></td>
                  <td className="p-2">
                    {editable && (
                      <form action={setUserStatusAction}><input type="hidden" name="userId" value={u.id} /><input type="hidden" name="status" value={u.status === "active" ? "suspended" : "active"} /><button type="submit" className={`rounded-md border px-2 py-1 text-xs ${u.status === "active" ? "border-risk/50 text-risk hover:bg-risk/10" : "border-positive/50 text-positive hover:bg-positive/10"}`}>{u.status === "active" ? "Suspend" : "Reactivate"}</button></form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <p className="mt-4 text-xs text-slate-mist">Founding account: run <code className="rounded bg-midnight px-1">pnpm atlas:grant-role --email … --role platform_owner --researcher-number 1</code> on the server, or set the ATLAS_FOUNDER_* variables before seeding.</p>
    </>
  );
}
