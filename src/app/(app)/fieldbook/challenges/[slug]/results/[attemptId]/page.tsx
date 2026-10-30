import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getAttempt, listAttempts } from "@/lib/data/fieldbook";
import { getChallenge } from "@/fieldbook/challenges";
import { gradeChallenge, type ChallengeAnswers } from "@/fieldbook/grade";
import { solve } from "@/fieldbook/solution";
import { summarize, withAmounts } from "@/fieldbook/statement";
import { Card, Eyebrow, PageHeader, Stat } from "@/components/ui/primitives";
import { formatPct, formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Challenge assessment" };

export default async function ResultsPage({ params }: { params: Promise<{ slug: string; attemptId: string }> }) {
  const user = await requireUser(); const { slug, attemptId } = await params;
  const c = getChallenge(slug); if (!c) notFound();
  const db = await getDb(); const attempt = await getAttempt(db, user.id, attemptId); if (!attempt || attempt.challengeSlug !== slug) notFound();
  const answers = attempt.answers as ChallengeAnswers; const res = gradeChallenge(c, answers); const sol = solve(c);
  const mine = summarize(withAmounts(c.lines, answers.amounts), c.property.units);
  const history = (await listAttempts(db, user.id, slug)).slice().reverse();
  const picked = new Set(answers.anomalies);
  return (
    <>
      <PageHeader eyebrow={`${c.title} · assessment`} title={`${res.total} / ${res.max}`} description="Every point below has a stated reason. Free-text items are scored by keyword, which checks that you named the right evidence and topics, not how well you wrote." actions={<Link href={`/fieldbook/challenges/${slug}`} className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold">Try again</Link>} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">{Object.entries(res.byDimension).map(([d, v]) => <Card key={d}><Stat label={d} value={`${v.earned} / ${v.max}`} tone={v.earned / v.max >= 0.7 ? "positive" : v.earned / v.max < 0.4 ? "risk" : "gold"} /></Card>)}</div>
      {history.length > 1 && <Card className="mb-6"><Eyebrow className="mb-2">Improvement across attempts</Eyebrow><ol className="flex flex-wrap items-end gap-3">{history.map((h, i) => <li key={h.id} className="text-center"><div className="mx-auto w-8 rounded-t bg-gold/70" style={{ height: `${Math.max(6, h.score)}px` }} aria-hidden="true" /><Link href={`/fieldbook/challenges/${slug}/results/${h.id}`} className={`numeric text-xs ${h.id === attempt.id ? "text-gold" : "text-platinum/70 hover:text-gold"}`}>#{i + 1}: {h.score}</Link></li>)}</ol></Card>}

      <Card className="mb-6">
        <Eyebrow className="mb-3">Your numbers beside the model solution</Eyebrow>
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-mist"><th className="py-1 font-normal">Line</th><th className="text-right font-normal">Seller</th><th className="text-right font-normal">You</th><th className="text-right font-normal">Model</th><th className="pl-4 font-normal">Model basis</th></tr></thead>
          <tbody>{c.lines.map((l) => { const adj = sol.adjustments.find((a) => a.lineKey === l.key); const yours = answers.amounts[l.key] ?? l.amount; const model = sol.normalizedAmounts[l.key] ?? l.amount; return (
            <tr key={l.key} className="border-t hairline align-top"><td className="py-1.5 pr-3 text-platinum/90">{l.label}</td><td className="numeric text-right text-platinum/70">{formatUsd(l.amount)}</td><td className={`numeric text-right ${Math.round(yours) === Math.round(l.amount) ? "text-platinum/70" : "text-ivory"}`}>{formatUsd(yours)}</td><td className={`numeric text-right ${adj ? "text-gold" : "text-platinum/70"}`}>{formatUsd(model)}</td><td className="pl-4 text-xs text-slate-mist">{adj?.basis ?? ""}{answers.basis[l.key] ? <span className="block text-platinum/70">Your basis: {answers.basis[l.key]}</span> : null}</td></tr>); })}
            <tr className="border-t border-gold/40 font-medium"><td className="py-2 text-ivory">NOI after reserves</td><td className="numeric text-right">{formatUsd(sol.reported.noi)}</td><td className="numeric text-right text-ivory">{formatUsd(mine.noi)}</td><td className="numeric text-right text-gold">{formatUsd(sol.normalized.noi)}</td><td /></tr></tbody></table></div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-5"><div><dt className="text-xs text-slate-mist">Cap rate on ask</dt><dd className="numeric text-ivory">{formatPct(sol.normalizedMetrics.capRate)}</dd></div><div><dt className="text-xs text-slate-mist">DSCR</dt><dd className="numeric text-ivory">{sol.normalizedMetrics.dscr.toFixed(2)}x</dd></div><div><dt className="text-xs text-slate-mist">Debt yield</dt><dd className="numeric text-ivory">{formatPct(sol.normalizedMetrics.debtYield)}</dd></div><div><dt className="text-xs text-slate-mist">Value at market cap</dt><dd className="numeric text-ivory">{formatUsd(sol.normalizedMetrics.impliedValue)}</dd></div><div><dt className="text-xs text-slate-mist">Debt service</dt><dd className="numeric text-ivory">{formatUsd(sol.normalizedMetrics.annualDebtService)}</dd></div></dl>
        <p className="mt-3 text-xs text-slate-mist">The {formatUsd(sol.oneTimeCapex)} pavement project is capital history. It is removed from recurring repairs and is never subtracted from recurring NOI.</p>
      </Card>

      <Card className="mb-6"><Eyebrow className="mb-3">Scoring detail</Eyebrow>
        <ul className="divide-y hairline">{res.lines.map((l, i) => <li key={i} className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:items-start sm:gap-4"><span className="numeric w-16 shrink-0 text-gold">{l.earned} / {l.max}</span><span><span className="text-xs uppercase tracking-[0.12em] text-slate-mist">{l.dimension}</span><span className="block text-ivory">{l.label}</span><span className="block text-platinum/75">{l.detail}</span></span></li>)}</ul></Card>

      <Card className="mb-6"><Eyebrow className="mb-3">Anomalies: what the documents support</Eyebrow>
        <ul className="space-y-3">{c.anomalies.map((a) => { const hit = picked.has(a.id); return <li key={a.id} className="text-sm"><div className="flex flex-wrap items-center gap-2"><span className="text-ivory">{a.label}</span><span className={`rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.1em] ${a.expected ? "border-gold/60 text-gold" : "border-platinum/40 text-platinum"}`}>{a.expected ? "Supported" : "Not supported"}</span><span className={`rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.1em] ${hit === a.expected ? "border-positive/60 text-positive" : "border-risk/60 text-risk"}`}>{hit ? "You flagged it" : "You did not flag it"}</span></div><p className="mt-1 text-platinum/75">{a.explanation}</p></li>; })}</ul></Card>

      <Card className="mb-6"><Eyebrow className="mb-3">Diligence questions</Eyebrow>
        <p className="mb-2 text-sm text-platinum/75">Your questions:</p><pre className="whitespace-pre-wrap rounded-md border hairline bg-obsidian/50 p-3 text-sm text-platinum/85">{answers.questions || "(none)"}</pre>
        <ul className="mt-3 space-y-1.5 text-sm">{c.topics.map((t) => { const got = res.topicsCovered.includes(t.id); return <li key={t.id} className="flex gap-2"><span className={got ? "text-positive" : "text-risk"} aria-hidden="true">{got ? "✓" : "✗"}</span><span><span className="text-ivory">{t.label}</span><span className="sr-only">{got ? " covered" : " missing"}</span>{!got && <span className="block text-xs text-slate-mist">Example: {t.sample}</span>}</span></li>; })}</ul></Card>

      <Card><Eyebrow className="mb-2">Next: check the statement against the site</Eyebrow><p className="text-sm text-platinum/85">The statement says one thing. The property may say another. Walk the fictional property, record what you find, then reconcile.</p>
        <Link href={`/fieldbook/properties/${c.propertySlug}`} className="mt-3 inline-block rounded-md bg-gold px-4 py-2 text-sm text-ink">Open Linden Court Apartments</Link></Card>
    </>
  );
}
