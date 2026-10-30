import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { requireCapability } from "@/lib/auth/current-user";
import { platformAnalytics } from "@/lib/data/admin";
import { activityLabel } from "@/lib/activity";
import { Card, Eyebrow, PageHeader, Stat } from "@/components/ui/primitives";
import { ResultsTable } from "@/components/lab/param-form";

export const metadata: Metadata = { title: "Platform Analytics" };

function Bars({ rows }: { rows: Array<{ label: string; n: number }> }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return <ul className="space-y-1.5">{rows.map((r) => <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_2fr_auto] items-center gap-2 text-xs"><span className="truncate text-platinum/85">{r.label}</span><span className="h-2 overflow-hidden rounded-full bg-white/10"><span className="block h-full bg-gold" style={{ width: `${(r.n / max) * 100}%` }} /></span><span className="numeric text-ivory">{r.n}</span></li>)}</ul>;
}

export default async function AnalyticsPage() {
  await requireCapability("admin:access");
  const db = await getDb();
  const a = await platformAnalytics(db);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Platform analytics" description="Counts from stored records only: no tracking pixels, no third-party analytics. Activity covers the last 30 days unless stated." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><Stat label="Active, 7 days" value={String(a.active7)} /></Card><Card><Stat label="Active, 30 days" value={String(a.active30)} /></Card>
        <Card><Stat label="Program started" value={String(a.programStarted)} /></Card><Card><Stat label="Ritual days, 30 days" value={String(a.ritualDays30)} sub={`${a.historianQueries30} assistant queries`} /></Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card><Eyebrow className="mb-3">Users by role</Eyebrow><Bars rows={a.usersByRole.map((r) => ({ label: r.role.replace(/_/g, " "), n: r.n }))} /></Card>
        <Card><Eyebrow className="mb-3">Users by membership tier</Eyebrow><Bars rows={a.usersByTier.map((r) => ({ label: r.tier, n: r.n }))} /></Card>
        <Card><Eyebrow className="mb-3">Published claims by status</Eyebrow><Bars rows={a.claimsByStatus.map((r) => ({ label: r.status.replace(/_/g, " "), n: r.n }))} /></Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card><Eyebrow className="mb-3">Activity by kind</Eyebrow>{a.activity30.length ? <Bars rows={a.activity30.map((r) => ({ label: activityLabel(r.kind), n: r.n }))} /> : <p className="text-sm text-slate-mist">No activity in the last 30 days.</p>}</Card>
        <Card><Eyebrow className="mb-3">Most-opened dossiers</Eyebrow>{a.topDossiers.length ? <Bars rows={a.topDossiers.map((r) => ({ label: r.name, n: r.opens }))} /> : <p className="text-sm text-slate-mist">None opened yet.</p>}</Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card><Eyebrow className="mb-3">Quizzes</Eyebrow>{a.quizzes.length ? <ResultsTable headers={["Quiz", "Attempts", "Passed", "Avg %"]} rows={a.quizzes.map((q) => [q.slug, q.attempts, q.passed, q.avgPercent])} /> : <p className="text-sm text-slate-mist">No attempts yet.</p>}</Card>
        <Card><Eyebrow className="mb-3">Simulations</Eyebrow>{a.simulations.length ? <ResultsTable headers={["Scenario", "Completed", "Avg score"]} rows={a.simulations.map((s) => [s.slug, s.completed, s.avgScore])} /> : <p className="text-sm text-slate-mist">No completions yet.</p>}</Card>
        <Card><Eyebrow className="mb-3">Committee verdicts</Eyebrow>{a.committee.length ? <ResultsTable headers={["Verdict", "Count", "Avg score"]} rows={a.committee.map((c) => [c.verdict.replace(/_/g, " "), c.n, c.avgScore])} /> : <p className="text-sm text-slate-mist">No submissions yet.</p>}</Card>
      </div>
    </>
  );
}
