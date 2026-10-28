import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/current-user";
import { buildLoanSchedule } from "@/finance/core";
import { FinanceInputError } from "@/finance/core";
import { Alert, Button, Card, Eyebrow, Field, Input, PageHeader, Stat } from "@/components/ui/primitives";
import { formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Debt Structuring Lab" };

function num(v: string | string[] | undefined, d: number): number { if (typeof v !== "string" || v.trim() === "") return d; const n = Number(v); return Number.isFinite(n) ? n : d; }

export default async function DebtPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const sp = await searchParams;
  const principal = num(sp.principal, 8_000_000); const rate = num(sp.rate, 6.5) / 100; const amort = num(sp.amort, 30); const term = num(sp.term, 10); const io = num(sp.io, 2);
  let schedule: ReturnType<typeof buildLoanSchedule> | null = null; let error: string | null = null;
  try { schedule = buildLoanSchedule({ principal, annualRate: rate, amortizationYears: amort, termYears: term, interestOnlyYears: io }); } catch (e) { error = e instanceof FinanceInputError ? e.message : "Could not compute."; }
  const annual = schedule ? Array.from({ length: Math.ceil(schedule.rows.length / 12) }, (_, y) => { const rows = schedule!.rows.slice(y * 12, y * 12 + 12); return { year: y + 1, payment: rows.reduce((s, r) => s + r.payment, 0), interest: rows.reduce((s, r) => s + r.interest, 0), principal: rows.reduce((s, r) => s + r.principal, 0), balance: rows[rows.length - 1]!.endingBalance }; }) : [];
  return (
    <>
      <PageHeader eyebrow="Capital Architecture Lab · Hypothetical" title="Debt Structuring Lab" description="Build an amortising, interest-only or balloon loan and read the actual schedule. Floating-rate, bridge and seller-financing comparisons arrive in Phase 2." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <Eyebrow className="mb-3">Loan terms</Eyebrow>
          <form method="get" className="grid grid-cols-2 gap-3">
            <Field label="Principal ($)" htmlFor="principal"><Input id="principal" name="principal" type="number" defaultValue={principal} /></Field>
            <Field label="Rate (%)" htmlFor="rate"><Input id="rate" name="rate" type="number" step={0.05} defaultValue={rate * 100} /></Field>
            <Field label="Amortisation (years)" htmlFor="amort"><Input id="amort" name="amort" type="number" defaultValue={amort} /></Field>
            <Field label="Term (years)" htmlFor="term"><Input id="term" name="term" type="number" defaultValue={term} /></Field>
            <Field label="Interest-only (years)" htmlFor="io"><Input id="io" name="io" type="number" defaultValue={io} /></Field>
            <div className="col-span-2 mt-2"><Button type="submit">Build schedule</Button></div>
          </form>
          <p className="mt-3 text-xs text-slate-mist">Term shorter than amortisation produces a balloon. Set interest-only to 0 for a fully amortising structure from month one.</p>
        </Card>
        <div className="space-y-5">
          {error && <Alert tone="error">{error}</Alert>}
          {schedule && (
            <>
              <Card>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                  <Stat label="Monthly payment (amortising)" value={formatUsd(schedule.periodicPayment, { decimals: 2 })} />
                  <Stat label="Monthly payment (IO)" value={formatUsd(schedule.interestOnlyPayment, { decimals: 2 })} />
                  <Stat label="Balloon at maturity" value={formatUsd(schedule.balloonBalance)} tone={schedule.balloonBalance > 0 ? "risk" : "positive"} />
                  <Stat label="Year-1 debt service" value={formatUsd(schedule.annualDebtService)} />
                  <Stat label="Stabilised annual debt service" value={formatUsd(schedule.stabilizedAnnualDebtService)} />
                  <Stat label="Total interest over term" value={formatUsd(schedule.totalInterest)} />
                </div>
              </Card>
              <Card>
                <Eyebrow className="mb-3">Annual summary</Eyebrow>
                <table className="w-full text-xs numeric">
                  <thead className="text-left text-[0.6rem] uppercase tracking-[0.14em] text-slate-mist"><tr><th className="p-1.5">Year</th><th className="p-1.5 text-right">Payments</th><th className="p-1.5 text-right">Interest</th><th className="p-1.5 text-right">Principal</th><th className="p-1.5 text-right">Ending balance</th></tr></thead>
                  <tbody>{annual.map((y) => <tr key={y.year} className="border-t hairline"><td className="p-1.5">{y.year}</td><td className="p-1.5 text-right">{formatUsd(y.payment)}</td><td className="p-1.5 text-right">{formatUsd(y.interest)}</td><td className="p-1.5 text-right">{formatUsd(y.principal)}</td><td className="p-1.5 text-right">{formatUsd(y.balance)}</td></tr>)}</tbody>
                </table>
                <p className="mt-3 text-[0.65rem] text-slate-mist">Payment = P·r·(1+r)ⁿ ÷ ((1+r)ⁿ − 1) with r = annual rate ÷ 12 and n = amortisation months. Interest-only months pay P·r.</p>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
