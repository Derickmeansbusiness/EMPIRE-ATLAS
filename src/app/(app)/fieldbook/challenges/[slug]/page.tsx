import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listAttempts } from "@/lib/data/fieldbook";
import { getChallenge } from "@/fieldbook/challenges";
import { submitChallengeAction } from "@/app/actions/fieldbook";
import { Alert, Button, Card, Eyebrow, Field, Input, PageHeader, Select, Textarea } from "@/components/ui/primitives";
import { StatementTable } from "@/components/fieldbook/statement-table";
import { formatPct, formatUsd } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const c = getChallenge((await params).slug); return { title: c ? c.title : "Challenge" }; }

export default async function ChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(); const c = getChallenge((await params).slug); if (!c) notFound();
  const db = await getDb(); const attempts = await listAttempts(db, user.id, c.slug);
  const u = c.property.units;
  return (
    <>
      <PageHeader eyebrow={`Underwriting challenge · ${c.difficulty}`} title={c.title} description={c.subtitle} actions={<Link href={`/fieldbook/properties/${c.propertySlug}`} className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold">The property</Link>} />
      <Alert tone="info">Fictional property and invented figures, built for training. The market cap rate, loan terms and per-unit conventions below are illustrative training assumptions, not market data. You are scored on method and evidence, not on matching a hidden answer to the dollar.</Alert>
      {attempts.length > 0 && <p className="mt-3 text-sm text-platinum/80">Your attempts: {attempts.slice().reverse().map((a, i) => <span key={a.id}>{i > 0 ? " → " : ""}<Link href={`/fieldbook/challenges/${c.slug}/results/${a.id}`} className="numeric text-gold hover:underline">{a.score}</Link></span>)}</p>}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="min-w-0">
          <Eyebrow className="mb-2">The deal</Eyebrow>
          <p className="text-sm leading-relaxed text-platinum/85">{c.property.summary}</p>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-slate-mist">Asking price</dt><dd className="numeric text-ivory">{formatUsd(c.askingPrice)}</dd></div><div><dt className="text-xs text-slate-mist">Units · built</dt><dd className="text-ivory">{u} · {c.property.yearBuilt}</dd></div>
            <div><dt className="text-xs text-slate-mist">Hypothetical loan</dt><dd className="numeric text-ivory">{formatPct(c.debt.ltv, 0)} of price, {formatPct(c.debt.annualRate)}, {c.debt.amortizationYears}-yr amortisation, {c.debt.termYears}-yr term</dd></div>
            <div><dt className="text-xs text-slate-mist">Lender minimums</dt><dd className="numeric text-ivory">{c.debt.minDscr.toFixed(2)}x DSCR · {formatPct(c.debt.minDebtYield, 1)} debt yield</dd></div>
            <div><dt className="text-xs text-slate-mist">Training market cap rate</dt><dd className="numeric text-ivory">{formatPct(c.marketCapRate)}</dd></div>
            <div><dt className="text-xs text-slate-mist">Conventions (illustrative)</dt><dd className="text-ivory">{formatPct(c.conventions.managementFeeRate, 1)} management · ${c.conventions.repairsPerUnit}/unit repairs · ${c.conventions.reservesPerUnit}/unit reserves</dd></div></dl>
          <ul className="mt-4 space-y-1.5 text-sm italic text-platinum/75">{c.sellerNotes.map((n) => <li key={n}>{n}</li>)}</ul>
        </Card>
        <Card className="min-w-0">
          <Eyebrow className="mb-2">Rent roll (snapshot)</Eyebrow>
          <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-sm"><thead><tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-mist"><th className="py-1 font-normal">Type</th><th className="font-normal">Units</th><th className="font-normal">Vacant</th><th className="text-right font-normal">In-place rent</th><th className="text-right font-normal">Market rent</th></tr></thead>
            <tbody>{c.rentRoll.map((r) => <tr key={r.unitType} className="border-t hairline"><td className="py-1.5 text-platinum/90">{r.unitType}</td><td className="numeric">{r.count}</td><td className="numeric">{r.vacant}</td><td className="numeric text-right">{formatUsd(r.inPlaceRent)}</td><td className="numeric text-right">{formatUsd(r.marketRent)}</td></tr>)}</tbody></table></div>
          <Eyebrow className="mb-1 mt-5">Other documents provided</Eyebrow>
          <ul className="space-y-1.5 text-sm text-platinum/85">
            <li>Delinquency report ({c.delinquency.asOf}): {formatUsd(c.delinquency.over30)} over 30 days past due, of which {formatUsd(c.delinquency.over60)} over 60 days.</li>
            <li>Property tax: assessed value {formatUsd(c.taxInfo.assessedValue)}; effective rate {formatPct(c.taxInfo.effectiveRate)}. {c.taxInfo.note}</li>
            <li>{c.insuranceNote}</li>
            <li>Maintenance summary: {c.records.map((r) => `${r.description} (${r.period}) ${formatUsd(r.amount)}, booked to ${r.bookedAs.toLowerCase()}`).join("; ")}.</li>
          </ul>
        </Card>
      </div>

      <form action={submitChallengeAction} className="mt-8 space-y-8">
        <input type="hidden" name="challenge" value={c.slug} />
        <section aria-labelledby="s1"><h2 id="s1" className="mb-1 font-serif text-xl text-ivory">1. Normalise the statement</h2>
          <p className="mb-3 text-sm text-platinum/75">Change any amount you believe should differ and say why, citing the document. Leave the rest alone. One-time capital items do not belong in recurring NOI. Replacement reserves are below the line.</p>
          <Card><StatementTable lines={c.lines} units={u} /></Card></section>

        <section aria-labelledby="s2"><h2 id="s2" className="mb-1 font-serif text-xl text-ivory">2. Calculate</h2>
          <p className="mb-3 text-sm text-platinum/75">Use your normalised NOI after reserves for items marked ★. Debt service comes from the amortising loan above.</p>
          <Card><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Seller-reported NOI, before reserves ($)" htmlFor="reportedNoi"><Input id="reportedNoi" name="reportedNoi" inputMode="decimal" autoComplete="off" /></Field>
            <Field label="★ Cap rate on the asking price (%)" htmlFor="capRatePct"><Input id="capRatePct" name="capRatePct" inputMode="decimal" autoComplete="off" /></Field>
            <Field label="★ DSCR (x)" htmlFor="dscr"><Input id="dscr" name="dscr" inputMode="decimal" autoComplete="off" /></Field>
            <Field label="★ Debt yield (%)" htmlFor="debtYieldPct"><Input id="debtYieldPct" name="debtYieldPct" inputMode="decimal" autoComplete="off" /></Field>
            <Field label="★ Value at the training market cap rate ($)" htmlFor="maxPrice"><Input id="maxPrice" name="maxPrice" inputMode="decimal" autoComplete="off" /></Field>
          </div></Card></section>

        <section aria-labelledby="s3"><h2 id="s3" className="mb-1 font-serif text-xl text-ivory">3. Flag anomalies</h2>
          <p className="mb-3 text-sm text-platinum/75">Tick only what the documents support. An unsupported flag costs you half a point-share: concluding without evidence is a mistake too.</p>
          <Card><fieldset><legend className="sr-only">Possible anomalies</legend><div className="grid gap-2 sm:grid-cols-2">{c.anomalies.map((a) => <label key={a.id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border hairline px-3 py-2 text-sm text-platinum/90 has-[:checked]:border-gold has-[:checked]:bg-gold/10"><input type="checkbox" name="anomalies" value={a.id} className="mt-1 h-4 w-4 accent-[#C19B63]" /><span>{a.label}</span></label>)}</div></fieldset></Card></section>

        <section aria-labelledby="s4"><h2 id="s4" className="mb-1 font-serif text-xl text-ivory">4. Write your diligence questions</h2>
          <Card><Field label="One question per line" htmlFor="questions" hint="Ask for documents and facts, not opinions. Name the topic in the question."><Textarea id="questions" name="questions" className="min-h-40" maxLength={6000} placeholder={"What documents support the other income?\n…"} /></Field></Card></section>

        <section aria-labelledby="s5"><h2 id="s5" className="mb-1 font-serif text-xl text-ivory">5. Risk and recommendation</h2>
          <Card><div className="grid gap-4 sm:grid-cols-2">
            <Field label="Which single adjustment moves NOI the most?" htmlFor="largestDriver"><Select id="largestDriver" name="largestDriver" defaultValue=""><option value="">Choose…</option>{["vacancy", "creditLoss", "management", "repairs", "taxes", "reserves"].map((k) => <option key={k} value={k}>{c.lines.find((l) => l.key === k)?.label.replace(/ \(.*/, "")}</option>)}</Select></Field>
            <Field label={`On your normalised NOI, does the loan meet the ${c.debt.minDscr.toFixed(2)}x DSCR minimum?`} htmlFor="dscrPasses"><Select id="dscrPasses" name="dscrPasses" defaultValue=""><option value="">Choose…</option><option value="yes">Yes</option><option value="no">No</option></Select></Field>
            <Field label="Your recommendation" htmlFor="recommendation"><Select id="recommendation" name="recommendation" defaultValue=""><option value="">Choose…</option><option value="acquire">Acquire at the asking price</option><option value="negotiate">Negotiate the price and terms</option><option value="investigate">Investigate further before deciding</option><option value="reject">Reject</option></Select></Field>
          </div>
            <div className="mt-4"><Field label="Rationale" htmlFor="rationale" hint="Cite figures: NOI, price, DSCR, reserves."><Textarea id="rationale" name="rationale" className="min-h-28" maxLength={4000} /></Field></div></Card></section>
        <Button type="submit">Submit for assessment</Button>
        <p className="text-xs text-slate-mist">Your answers are saved and scored against the model solution. You can retry; your attempts are kept so you can see improvement.</p>
      </form>
    </>
  );
}
