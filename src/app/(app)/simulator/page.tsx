import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listAttempts } from "@/lib/data/simulations";
import { SCENARIOS } from "@/simulation";
import { startAttemptAction, restartAttemptAction } from "@/app/actions/simulations";
import { Alert, Button, Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Empire Simulator" };

export default async function SimulatorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const db = await getDb();
  const attempts = await listAttempts(db, user.id);
  return (
    <>
      <PageHeader eyebrow="Empire Strategy Simulator" title="Decide first. Then see what history did." description="Each scenario puts you inside a documented moment with only the information available then. Consequences, scoring and the historical outcome are sealed until your final decision. Scoring rewards financial reasoning, prudent leverage, diligence, liquidity and risk-adjusted return, not hindsight." />
      {sp.error && <div className="mb-5"><Alert tone="error">{sp.error === "stale" ? "That stage has already been decided. Continue from the current one." : "That request could not be processed."}</Alert></div>}
      <div className="grid gap-5 lg:grid-cols-2">
        {SCENARIOS.map((s) => {
          const mine = attempts.filter((a) => a.scenarioSlug === s.slug);
          const inProgress = mine.find((a) => a.status === "in_progress");
          const completed = mine.filter((a) => a.status === "completed");
          const best = completed.reduce<number | null>((b, a) => { const t = (a.score as { total?: number } | null)?.total ?? null; return t == null ? b : b == null ? t : Math.max(b, t); }, null);
          return (
            <Card key={s.slug}>
              <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] ${s.kind === "fictional" ? "border-sky-400/50 text-sky-200" : "border-gold/60 text-gold-soft"}`}>{s.kind}</span><span className="text-xs text-slate-mist">{s.subtitle}</span></div>
              <h2 className="mt-2 font-serif text-2xl text-ivory">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-platinum/75">{s.setting.split("\n\n")[0]}</p>
              <ul className="mt-3 space-y-1 text-xs text-platinum/70">{s.objectives.map((o) => <li key={o} className="border-l-2 border-gold/50 pl-2">{o}</li>)}</ul>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <form action={startAttemptAction}><input type="hidden" name="scenario" value={s.slug} /><Button type="submit">{inProgress ? "Continue" : "Begin scenario"}</Button></form>
                {completed.length > 0 && <form action={restartAttemptAction}><input type="hidden" name="scenario" value={s.slug} /><Button type="submit" variant="secondary">Play again</Button></form>}
                <span className="text-xs text-slate-mist">{completed.length} completed{best != null ? ` · best ${best}/100` : ""}{inProgress ? ` · in progress since ${formatRelative(inProgress.startedAt)}` : ""}</span>
              </div>
              {completed.length > 0 && <ul className="mt-3 space-y-1 text-xs">{completed.slice(0, 3).map((a) => <li key={a.id}><Link href={`/simulator/${s.slug}/debrief/${a.id}`} className="text-gold hover:underline">Debrief · {(a.score as { total: number; band: string }).total}/100 · {(a.score as { band: string }).band}</Link> <span className="text-slate-mist">{formatRelative(a.completedAt)}</span></li>)}</ul>}
            </Card>
          );
        })}
      </div>
      <Card className="mt-6"><Eyebrow className="mb-2">How scoring works</Eyebrow><p className="text-xs text-platinum/75">Every option carries a 0–10 score on each relevant dimension, set when the scenario was written and not dependent on the outcome you reach. The total is the share of available points. Bands: Research Apprentice (&lt;40), Deal Analyst (40–54), Acquisition Strategist (55–69), Capital Strategist (70–84), Empire Architect (85+). Historical success is not treated as inevitable: the documented path is scored on its reasoning, and in one scenario the documented choice is the low-scoring one.</p></Card>
    </>
  );
}
