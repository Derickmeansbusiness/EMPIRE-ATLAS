import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getProperty, getSession, listSessions, toFindingLike } from "@/lib/data/fieldbook";
import { challengeForProperty } from "@/fieldbook/challenges";
import { labQuery, reconcile, severityLabel } from "@/fieldbook/reconcile";
import { COMPONENT_LABELS, SEVERITIES } from "@/fieldbook/templates";
import { Alert, Card, Eyebrow, PageHeader, Stat } from "@/components/ui/primitives";
import { ReportForm } from "@/components/fieldbook/report-form";
import { formatPct, formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Statement-to-site reconciliation" };
const STATUS: Record<string, string> = { reconciled: "border-positive/60 text-positive", conflict: "border-risk/60 text-risk", unverified: "border-gold/60 text-gold" };

export default async function ReconcilePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ session?: string }> }) {
  const user = await requireUser(); const { slug } = await params; const sp = await searchParams; const db = await getDb();
  const prop = await getProperty(db, user.id, slug); if (!prop) notFound();
  const c = challengeForProperty(prop.slug); if (!c) notFound();
  const sessions = await listSessions(db, user.id, prop.id); const chosen = sp.session ?? sessions[0]?.id;
  const data = chosen ? await getSession(db, user.id, chosen) : null;
  if (!data || data.session.propertyId !== prop.id) {
    return (<><PageHeader eyebrow="Statement-to-site reconciliation" title={prop.name} /><Alert tone="info">Reconciliation compares the seller’s statement with what you recorded on a walk. <Link className="underline" href={`/fieldbook/properties/${prop.slug}`}>Start a walk first</Link>.</Alert></>);
  }
  const findings = toFindingLike(data.findings); const r = reconcile(c, findings); const [base, down, up] = r.scenarios as [typeof r.scenarios[0], typeof r.scenarios[0], typeof r.scenarios[0]];
  const maxBar = Math.max(r.seller.summary.noiBeforeReserves, ...r.solution.adjustments.map((a) => Math.abs(a.noiEffect)));
  const comps = [...new Set(findings.map((f) => f.component))];
  const lab = new URLSearchParams(labQuery(c, r)).toString();
  return (
    <>
      <PageHeader eyebrow="Statement-to-site reconciliation" title={prop.name} description="The seller’s numbers, set beside what you saw. Cross-checks raise questions; they do not change any assumption and they do not accuse anyone of anything." actions={<Link href={`/fieldbook/properties/${prop.slug}/walk/${data.session.id}`} className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold">Back to the walk</Link>} />
      {data.session.status === "draft" && <Alert tone="warning">This walk is still a draft. The reconciliation uses what is recorded so far.</Alert>}

      <section aria-labelledby="r1" className="mt-6"><h2 id="r1" className="mb-3 font-serif text-xl text-ivory">1. What the seller reports</h2>
        <Card><div className="grid grid-cols-2 gap-5 sm:grid-cols-5"><Stat label="Effective gross income" value={formatUsd(r.seller.summary.egi)} /><Stat label="Operating expenses" value={formatUsd(r.seller.summary.operatingExpenses)} sub={`${formatPct(r.seller.summary.expenseRatio, 1)} of EGI`} /><Stat label="Reported NOI" value={formatUsd(r.seller.summary.noiBeforeReserves)} tone="gold" /><Stat label="Cap rate at ask" value={formatPct(r.seller.capRate)} sub={formatUsd(r.seller.askingPrice)} /><Stat label="DSCR (hypothetical loan)" value={`${r.seller.dscr.toFixed(2)}x`} /></div></Card></section>

      <section aria-labelledby="r2" className="mt-8"><h2 id="r2" className="mb-3 font-serif text-xl text-ivory">2. What we observed</h2>
        <Card><div className="grid grid-cols-2 gap-5 sm:grid-cols-5"><Stat label="Findings" value={String(r.observed.findingCount)} sub={`${r.observed.withPhotos} with photos`} /><Stat label="Possible safety issues" value={String(r.observed.safetyCount)} tone={r.observed.safetyCount ? "risk" : undefined} /><Stat label="Need a specialist" value={String(r.observed.specialistCount)} /><Stat label="Capital need (your estimates)" value={r.observed.capitalHigh ? `${formatUsd(r.observed.capitalLow, { compact: true })}–${formatUsd(r.observed.capitalHigh, { compact: true })}` : "none costed"} sub={r.observed.uncosted ? `${r.observed.uncosted} serious not costed` : undefined} /><Stat label="Seller capital reserve" value={formatUsd(0)} sub="none reported" tone="risk" /></div>
          {findings.length > 0 && (<div className="mt-5 overflow-x-auto"><table className="w-full min-w-[560px] text-sm" aria-label="Findings by component and severity"><caption className="mb-1 text-left text-xs text-slate-mist">Risk map: findings by component and severity</caption><thead><tr className="text-xs text-slate-mist"><th className="py-1 text-left font-normal">Component</th>{SEVERITIES.map((s) => <th key={s.value} className="px-1 text-center font-normal">{s.label}</th>)}</tr></thead>
            <tbody>{comps.map((k) => <tr key={k} className="border-t hairline"><td className="py-1.5 text-platinum/90">{COMPONENT_LABELS[k] ?? k}</td>{SEVERITIES.map((s) => { const n = findings.filter((f) => f.component === k && f.severity === s.value).length; const heavy = ["potential_safety_issue", "major_capital_replacement", "specialist_investigation_required"].includes(s.value); return <td key={s.value} className="px-1 text-center"><span className={`inline-flex h-8 min-w-8 items-center justify-center rounded numeric text-xs ${n ? (heavy ? "bg-risk/30 text-ivory" : "bg-gold/25 text-ivory") : "text-platinum/30"}`}>{n || "·"}</span></td>; })}</tr>)}</tbody></table></div>)}</Card></section>

      <section aria-labelledby="r3" className="mt-8"><h2 id="r3" className="mb-3 font-serif text-xl text-ivory">3. What we can verify</h2>
        <Card><ul className="space-y-3">{r.verified.map((v) => <li key={v.label} className="text-sm"><span className="text-ivory">{v.label}</span> <span className={`ml-2 rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.1em] ${STATUS[v.status]}`}>{v.status}</span><p className="mt-1 text-platinum/75">{v.detail}</p></li>)}</ul>
          {r.crossChecks.length > 0 && <div className="mt-5 border-t hairline pt-4"><Eyebrow className="mb-2">Statement-to-site cross-checks (questions, not conclusions)</Eyebrow><ul className="space-y-2">{r.crossChecks.map((x) => <li key={x.id} className="rounded-md border border-gold/30 bg-gold/5 p-3 text-sm text-platinum/90" data-check={x.id}>{x.message}</li>)}</ul></div>}</Card></section>

      <section aria-labelledby="r4" className="mt-8"><h2 id="r4" className="mb-3 font-serif text-xl text-ivory">4. What we must investigate</h2>
        <Card><ul className="list-disc space-y-1.5 pl-5 text-sm text-platinum/85">{r.investigate.map((q, i) => <li key={i}>{q}</li>)}</ul></Card></section>

      <section aria-labelledby="r5" className="mt-8"><h2 id="r5" className="mb-3 font-serif text-xl text-ivory">5. What we underwrite</h2>
        <Card className="mb-4"><Eyebrow className="mb-3">NOI bridge: seller’s NOI to the base case</Eyebrow>
          <ul className="space-y-2" aria-label="NOI bridge">
            <li className="grid grid-cols-[9rem_1fr_6rem] items-center gap-3 text-sm sm:grid-cols-[13rem_1fr_7rem]"><span className="text-ivory">Seller’s reported NOI</span><span className="h-5 rounded bg-platinum/60" style={{ width: `${(r.seller.summary.noiBeforeReserves / maxBar) * 100}%` }} /><span className="numeric text-right text-ivory">{formatUsd(r.seller.summary.noiBeforeReserves)}</span></li>
            {r.solution.adjustments.map((a) => <li key={a.lineKey} className="grid grid-cols-[9rem_1fr_6rem] items-center gap-3 text-sm sm:grid-cols-[13rem_1fr_7rem]"><span className="text-platinum/85">{a.label}</span><span className={`h-5 rounded ${a.noiEffect < 0 ? "bg-risk/70" : "bg-positive/70"}`} style={{ width: `${(Math.abs(a.noiEffect) / maxBar) * 100}%`, minWidth: "2px" }} /><span className={`numeric text-right ${a.noiEffect < 0 ? "text-risk" : "text-positive"}`}>{a.noiEffect < 0 ? "−" : "+"}{formatUsd(Math.abs(a.noiEffect))}</span></li>)}
            <li className="grid grid-cols-[9rem_1fr_6rem] items-center gap-3 border-t hairline pt-2 text-sm sm:grid-cols-[13rem_1fr_7rem]"><span className="text-gold">Base case NOI after reserves</span><span className="h-5 rounded bg-gold" style={{ width: `${(base.noi / maxBar) * 100}%` }} /><span className="numeric text-right text-gold">{formatUsd(base.noi)}</span></li></ul>
          <p className="mt-3 text-xs text-slate-mist">The {formatUsd(r.solution.oneTimeCapex)} pavement project is capital history. It is not subtracted from recurring NOI.</p></Card>
        <Card><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="text-xs uppercase tracking-[0.12em] text-slate-mist"><th className="py-1 text-left font-normal" /><th className="text-right font-normal">Downside</th><th className="text-right font-normal text-gold">Base</th><th className="text-right font-normal">Upside</th></tr></thead>
          <tbody>{([["NOI after reserves", (s: typeof base) => formatUsd(s.noi)], ["Capital need", (s: typeof base) => formatUsd(s.capital)], ["Total project cost", (s: typeof base) => formatUsd(s.totalProjectCost)], ["Loan (lender-limited)", (s: typeof base) => `${formatUsd(s.loan)} (${s.loanLimitedBy})`], ["Equity required", (s: typeof base) => formatUsd(s.equity)], ["DSCR", (s: typeof base) => `${s.dscr.toFixed(2)}x`], ["Debt yield", (s: typeof base) => formatPct(s.debtYield)], ["Yield on cost", (s: typeof base) => formatPct(s.yieldOnCost)], ["Cash flow after debt", (s: typeof base) => formatUsd(s.cashFlowAfterDebt)], ["Cash-on-cash", (s: typeof base) => formatPct(s.cashOnCash, 1)]] as Array<[string, (s: typeof base) => string]>).map(([label, fn]) => <tr key={label} className="border-t hairline"><td className="py-1.5 text-platinum/85">{label}</td><td className="numeric text-right">{fn(down)}</td><td className="numeric text-right text-gold">{fn(base)}</td><td className="numeric text-right">{fn(up)}</td></tr>)}</tbody></table></div>
          <details className="mt-3 text-xs text-slate-mist"><summary className="cursor-pointer">Assumptions behind each case</summary>{r.scenarios.map((s) => <div key={s.name} className="mt-2"><p className="text-platinum/80">{s.name}</p><ul className="list-disc pl-5">{s.assumptions.map((a) => <li key={a}>{a}</li>)}</ul></div>)}</details></Card></section>

      <section aria-labelledby="r6" className="mt-8"><h2 id="r6" className="mb-3 font-serif text-xl text-ivory">6. Investment implications</h2>
        <Card><ul className="list-disc space-y-2 pl-5 text-sm text-platinum/90">{r.implications.map((m, i) => <li key={i}>{m}</li>)}</ul>
          <Link href={`/lab/underwriter?${lab}`} className="mt-4 inline-block rounded-md border border-platinum/25 px-4 py-2 text-sm text-platinum hover:border-gold hover:text-gold">Open the base case in the Capital Lab underwriter</Link>
          <p className="mt-2 text-xs text-slate-mist">Price, capex, rent, vacancy, expenses and loan are carried over. Rent and expense growth, hold period and exit are the lab’s defaults: set your own.</p></Card></section>

      <section aria-labelledby="r7" className="mt-8"><h2 id="r7" className="mb-3 font-serif text-xl text-ivory">Screening report</h2>
        <Card><ReportForm propertySlug={prop.slug} sessionId={data.session.id} /></Card></section>
      <p className="mt-6 text-xs text-slate-mist">Severity labels used: {SEVERITIES.map((s) => severityLabel(s.value)).join(", ")}. Educational screening only; not a substitute for professional due diligence.</p>
    </>
  );
}
