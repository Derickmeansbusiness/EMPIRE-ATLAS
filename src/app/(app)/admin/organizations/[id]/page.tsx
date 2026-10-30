import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireCapability } from "@/lib/auth/current-user";
import { cohortSummary } from "@/lib/data/admin";
import { addOrganizationMemberAction } from "@/app/actions/admin";
import { Alert, Button, Card, Eyebrow, Input, PageHeader, Select } from "@/components/ui/primitives";
import { ResultsTable } from "@/components/lab/param-form";

export const metadata: Metadata = { title: "Cohort" };

export default async function CohortPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ member?: string }> }) {
  await requireCapability("users:manage");
  const { id } = await params; const sp = await searchParams;
  const db = await getDb();
  const c = await cohortSummary(db, id);
  if (!c) notFound();
  const msg: Record<string, [("success" | "error" | "warning"), string]> = { added: ["success", "Member added."], exists: ["warning", "That person is already a member."], no_user: ["error", "No account uses that email. They must sign up first."] };
  const m = sp.member ? msg[sp.member] : undefined;
  return (
    <>
      <PageHeader eyebrow="Cohort" title={c.organization.name} description="Progress is computed from each member’s stored work. Notes and journals stay private; only counts and levels are shown here." />
      {m && <div className="mb-5"><Alert tone={m[0]}>{m[1]}</Alert></div>}
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card>
          <Eyebrow className="mb-3">Members · {c.members.length}</Eyebrow>
          {c.members.length === 0 ? <p className="text-sm text-slate-mist">No members yet.</p> : <ResultsTable align="left" headers={["Member", "Role", "Level", "Weeks", "Quizzes", "Simulations", "Best committee"]} rows={c.members.map((x) => [`${x.name} (${x.email})`, x.roleInOrg, x.level, `${x.weeksComplete}/24`, x.quizzesPassed, x.simulations, x.committeeBest ?? "—"])} />}
        </Card>
        <Card>
          <Eyebrow className="mb-3">Add a member</Eyebrow>
          <form action={addOrganizationMemberAction} className="space-y-3"><input type="hidden" name="organizationId" value={c.organization.id} />
            <label htmlFor="m-email" className="sr-only">Email</label><Input id="m-email" name="email" type="email" required placeholder="member@example.com" />
            <label htmlFor="m-role" className="sr-only">Role in organization</label><Select id="m-role" name="roleInOrg" defaultValue="member"><option value="member">Member</option><option value="instructor">Instructor</option></Select>
            <Button type="submit" className="w-full">Add</Button></form>
          <p className="mt-3 text-xs text-slate-mist">Setting a person’s membership tier is on <Link href="/admin/users" className="text-gold underline">User management</Link>.</p>
        </Card>
      </div>
    </>
  );
}
