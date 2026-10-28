import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getAttempt } from "@/lib/data/simulations";
import { getClaimsWithSources } from "@/lib/data/research";
import { claims } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { debrief, getScenario, SCORE_DIMENSIONS, type AttemptRecord } from "@/simulation";
import { restartAttemptAction } from "@/app/actions/simulations";
import { Button, Card, Eyebrow, PageHeader, Stat } from "@/components/ui/primitives";
import { VerificationBadge } from "@/components/research/status";

export const metadata: Metadata = { title: "Debrief" };

export default async function DebriefPage({ params }: { params: Promise<{ slug: string; attemptId: string }> }) {
  const user = await requireUser();
  const { slug, attemptId } = await params;
  const scenario = getScenario(slug); if (!scenario) notFound();
  const db = await getDb();
  const attempt = await getAttempt(db, user.id, attemptId);
  if (!attempt || attempt.scenarioSlug !== slug) notFound();
  if (attempt.status !== "completed") redirect(`/simulator/${slug}/play/${attemptId}`);
  const d = debrief(scenario, { choices: attempt.choices as AttemptRecord["choices"] });
  const claimSlugs = Array.from(new Set([...scenario.evidence, ...d.results.flatMap((r) => r.stage.historical.claims)]));
  const claimRows = claimSlugs.length ? await getClaimsWithSources(db, inArray(claims.slug, claimSlugs)) : [];
  const claimBySlug = new Map(claimRows.map((c) => [c.slug, c] as const));
  return (
    <>
      <PageHeader eyebrow={`Debrief · ${scenario.title}`} title={`${d.score.total}/100 · ${d.score.band}`} description="Scores reflect the reasoning available at each decision, not the outcome. Below, each stage shows your choice, its modelled consequence, and what the documented record says happened." actions={<form action={restartAttemptAction}><input type="hidden" name="scenario" value={slug} /><Button type="submit" variant="secondary">Play again</Button></form>} />
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <Card>
            <Eyebrow className="mb-3">Score by dimension</Eyebrow>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {SCORE_DIMENSIONS.map((dim) => { const s = d.score.byDimension[dim.key]; return <Stat key={dim.key} label={dim.label} value={s.max ? `${Math.round((s.score / s.max) * 100)}%` : "n/a"} sub={`${s.score}/${s.max}`} tone={s.max && s.score / s.max >= 0.7 ? "positive" : s.max && s.score / s.max < 0.4 ? "risk" : undefined} />; })}
            </div>
          </Card>
          <Card><Eyebrow className="mb-2">Epilogue (modelled)</Eyebrow><p className="text-sm leading-relaxed text-platinum/85">{d.epilogue}</p></Card>
          {d.results.map((r, i) => {
            const documented = r.stage.historical.documentedChoiceKey ? r.stage.options.find((o) => o.key === r.stage.historical.documentedChoiceKey) : null;
            return (
              <Card key={r.stage.key}>
                <Eyebrow className="mb-1">Stage {i + 1} · {r.stage.when}</Eyebrow>
                <h2 className="font-serif text-xl text-ivory">{r.stage.title}</h2>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div className="rounded-md border border-gold/40 bg-gold/5 p-3">
                    <p className="eyebrow mb-1">You chose</p>
                    <p className="text-sm text-ivory">{r.option.label}</p>
                    <p className="mt-2 text-xs text-platinum/75">{r.option.feedback}</p>
                    <p className="mt-2 text-[0.65rem] text-slate-mist">Scores: {Object.entries(r.option.scores).map(([k, v]) => `${SCORE_DIMENSIONS.find((x) => x.key === k)?.label} ${v}/10`).join(" · ")}</p>
                  </div>
                  <div className="rounded-md border hairline p-3">
                    <p className="eyebrow mb-1">Documented history</p>
                    <p className="text-sm text-platinum/85">{r.stage.historical.summary}</p>
                    {documented && <p className="mt-2 text-xs text-slate-mist">Closest documented choice: <span className="text-ivory">{documented.label}</span>{documented.key === r.option.key ? " — the same as yours." : "."}</p>}
                    <ul className="mt-2 space-y-1">{r.stage.historical.claims.map((cs) => { const c = claimBySlug.get(cs); return c ? <li key={cs} className="flex items-start gap-2 text-xs"><VerificationBadge status={c.verificationStatus} size="xs" /><Link href={`/evidence/claims/${c.slug}`} className="text-platinum/80 hover:text-gold">{c.claimText}</Link></li> : null; })}</ul>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-mist">Position after this stage ({scenario.unit}): equity {r.stateAfter.equityValue.toFixed(1)} · liquidity {r.stateAfter.liquidity.toFixed(1)} · debt {r.stateAfter.debt.toFixed(1)}</p>
              </Card>
            );
          })}
        </div>
        <aside className="space-y-5">
          <Card>
            <Eyebrow className="mb-2">Evidence this scenario rests on</Eyebrow>
            <ul className="space-y-2">{scenario.evidence.map((cs) => { const c = claimBySlug.get(cs); return c ? <li key={cs} className="text-xs"><VerificationBadge status={c.verificationStatus} size="xs" /> <Link href={`/evidence/claims/${c.slug}`} className="text-platinum/80 hover:text-gold">{c.claimText}</Link></li> : null; })}</ul>
          </Card>
          <div className="rounded-md border border-sky-400/40 bg-sky-400/10 px-3 py-2 text-[0.65rem] text-sky-100">{scenario.disclaimer}</div>
          <Card><Eyebrow className="mb-2">Next</Eyebrow><ul className="space-y-1 text-sm"><li><Link href="/committee/new" className="text-gold hover:underline">Defend a deal before the investment committee →</Link></li>{scenario.investorSlug && <li><Link href={`/dossiers/${scenario.investorSlug}`} className="text-gold hover:underline">Re-read the dossier →</Link></li>}{scenario.caseSlug && <li><Link href={`/lab/cases/${scenario.caseSlug}`} className="text-gold hover:underline">Open the case in the lab →</Link></li>}</ul></Card>
        </aside>
      </div>
    </>
  );
}
