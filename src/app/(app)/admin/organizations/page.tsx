import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireCapability } from "@/lib/auth/current-user";
import { listOrganizations } from "@/lib/data/admin";
import { createOrganizationAction } from "@/app/actions/admin";
import { Alert, Button, Card, EmptyState, Eyebrow, Input, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Organizations & Cohorts" };

export default async function OrganizationsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireCapability("users:manage");
  const sp = await searchParams;
  const db = await getDb();
  const orgs = await listOrganizations(db);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Organizations & cohorts" description="Institutional accounts group learners into a cohort. Each organization page shows every member’s competency level and program progress, computed from their stored work, so an instructor sees what was done and not what was claimed." />
      {sp.error && <div className="mb-5"><Alert tone="error">Enter an organization name of at least two characters.</Alert></div>}
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div>{orgs.length === 0 ? <EmptyState title="No organizations yet" body="Create one, then add members by the email they signed up with." /> : <ul className="space-y-2">{orgs.map((o) => <li key={o.id} className="card flex items-center justify-between p-4"><Link href={`/admin/organizations/${o.id}`} className="font-serif text-lg text-ivory hover:text-gold">{o.name}</Link><span className="text-xs text-slate-mist">{o.members} member{o.members === 1 ? "" : "s"}</span></li>)}</ul>}</div>
        <Card><Eyebrow className="mb-3">New organization</Eyebrow><form action={createOrganizationAction} className="space-y-3"><label htmlFor="org-name" className="sr-only">Organization name</label><Input id="org-name" name="name" required minLength={2} maxLength={120} placeholder="e.g. Lakeview Real Estate Club" /><Button type="submit" className="w-full">Create</Button></form></Card>
      </div>
    </>
  );
}
