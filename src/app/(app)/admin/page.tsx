import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireCapability } from "@/lib/auth/current-user";
import { platformStats, recentAudit } from "@/lib/data/admin";
import { listInvestorRoadmap } from "@/lib/data/research";
import { Card, Eyebrow, PageHeader, Stat } from "@/components/ui/primitives";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Research CMS" };

export default async function AdminHome() {
  await requireCapability("admin:access");
  const db = await getDb();
  const [stats, audit, investors] = await Promise.all([platformStats(db), recentAudit(db, 20), listInvestorRoadmap(db)]);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Research CMS" description="Content status, verification workload and the audit log. Editing dossier prose in the browser, the simulation editor and platform analytics are later-phase work; today content changes flow through version-controlled seed files." />
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        <Card><Stat label="Users" value={String(stats.users)} /></Card>
        <Card><Stat label="Published investors" value={`${stats.published_investors} / ${stats.total_investors}`} /></Card>
        <Card><Stat label="Published claims" value={String(stats.published_claims)} sub={`${stats.claims_needing_review} unverified or contested`} tone={stats.claims_needing_review > 0 ? "risk" : "positive"} /></Card>
        <Card><Stat label="Sources" value={String(stats.sources)} sub={`${stats.published_transactions} transactions · ${stats.notes} user notes`} /></Card>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <Eyebrow className="mb-3">Investor profiles</Eyebrow>
          <table className="w-full text-sm">
            <thead className="text-left text-[0.65rem] uppercase tracking-[0.16em] text-slate-mist"><tr><th className="pb-2 font-medium">Subject</th><th className="pb-2 font-medium">Rank</th><th className="pb-2 font-medium">Status</th></tr></thead>
            <tbody>{investors.map((i) => <tr key={i.id} className="border-t hairline"><td className="py-2"><Link href={`/dossiers/${i.slug}`} className="hover:text-gold">{i.fullName}</Link></td><td className="py-2 numeric text-slate-mist">{i.roadmapRank}</td><td className="py-2"><span className={`rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-wide ${i.publishStatus === "published" ? "border-positive/60 text-positive" : "border-platinum/30 text-slate-mist"}`}>{i.publishStatus}</span></td></tr>)}</tbody>
          </table>
        </Card>
        <Card>
          <Eyebrow className="mb-3">Audit log</Eyebrow>
          <ul className="space-y-1.5 text-xs">{audit.map(({ e, actor }) => <li key={e.id} className="flex justify-between gap-2"><span className="text-platinum/85"><span className="text-gold-soft">{e.action}</span> {e.objectKind ? `· ${e.objectKind}` : ""} {actor ? `· ${actor}` : ""}</span><span className="shrink-0 text-slate-mist">{formatRelative(e.createdAt)}</span></li>)}</ul>
        </Card>
      </div>
    </>
  );
}
