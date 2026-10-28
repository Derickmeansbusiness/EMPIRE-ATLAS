import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listTransactions } from "@/lib/data/research";
import { num, pct, withSavedModel, type SP } from "@/lib/lab-params";
import { analyzeDebtStructure, compareDebtStructures, type DebtStructure, type DebtStructureKind } from "@/finance/debt";
import { FinanceInputError } from "@/finance/core";
import { Alert, Card, Eyebrow, PageHeader, Stat } from "@/components/ui/primitives";
import { HypotheticalBanner, ParamForm, ResultsTable, type FieldSpec } from "@/components/lab/param-form";
import { SaveModelPanel } from "@/components/lab/shared";
import { formatPct, formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Debt Structuring Lab" };

const KINDS: Array<[DebtStructureKind, string]> = [["amortizing", "Amortising (fixed)"], ["interest_only", "Interest-only"], ["balloon", "Balloon (partial amortisation)"], ["floating", "Floating-rate"], ["bridge", "Bridge"], ["seller", "Seller financing"]];

const FIELDS: FieldSpec[] = [
  { key: "kind", label: "Structure", kind: "select", options: KINDS }, { key: "principal", label: "Principal ($)", kind: "usd" },
  { key: "rate", label: "Rate or spread over index (%)", kind: "pct" }, { key: "amort", label: "Amortisation (years)", kind: "int" }, { key: "term", label: "Term (years)", kind: "int" }, { key: "io", label: "Interest-only (years)", kind: "int" },
  { key: "origFee", label: "Origination fee (%)", kind: "pct" }, { key: "exitFee", label: "Exit fee (%)", kind: "pct" },
  { key: "indexPath", label: "Index path by year (%, comma-separated; floating only)", kind: "text", span: 2 }, { key: "cap", label: "Rate cap (%, 0 = none)", kind: "pct" }, { key: "floor", label: "Rate floor (%)", kind: "pct" },
];

export default async function DebtPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const db = await getDb();
  const raw = await searchParams;
  const { sp, model } = await withSavedModel(db, user.id, raw);
  const values = {
    kind: (typeof sp.kind === "string" && KINDS.some(([k]) => k === sp.kind) ? sp.kind : "balloon") as DebtStructureKind,
    principal: num(sp, "principal", 8_000_000), rate: pct(sp, "rate", 0.065) * 100, amort: num(sp, "amort", 30), term: num(sp, "term", 10), io: num(sp, "io", 2),
    origFee: pct(sp, "origFee", 0.01) * 100, exitFee: pct(sp, "exitFee", 0) * 100,
    indexPath: typeof sp.indexPath === "string" && sp.indexPath.trim() ? sp.indexPath : "4.0, 4.5, 5.0, 5.5, 5.0, 4.5, 4.0, 4.0, 4.0, 4.0", cap: pct(sp, "cap", 0.09) * 100, floor: pct(sp, "floor", 0.03) * 100,
  };
  const indexPath = values.indexPath.split(",").map((x) => Number(x.trim()) / 100).filter((x) => Number.isFinite(x));
  const base: DebtStructure = { name: "Your structure", kind: values.kind, principal: values.principal, annualRate: values.rate / 100, amortizationYears: values.amort, termYears: values.term, interestOnlyYears: values.io, originationFeeRate: values.origFee / 100, exitFeeRate: values.exitFee / 100, indexPathAnnual: indexPath, rateCap: values.cap > 0 ? values.cap / 100 : undefined, rateFloor: values.floor / 100 };
  let primary: ReturnType<typeof analyzeDebtStructure> | null = null; let comparison: ReturnType<typeof compareDebtStructures> = []; let error: string | null = null;
  try {
    primary = analyzeDebtStructure(base);
    const P = values.principal; const r = values.rate / 100;
    comparison = compareDebtStructures([
      { name: "Fixed, fully amortising", kind: "amortizing", principal: P, annualRate: r, amortizationYears: values.amort, termYears: values.amort },
      { name: `Interest-only ${values.term}y`, kind: "interest_only", principal: P, annualRate: r, amortizationYears: values.term, termYears: values.term },
      { name: `Balloon ${values.term}/${values.amort}`, kind: "balloon", principal: P, annualRate: r, amortizationYears: values.amort, termYears: values.term },
      { name: "Floating (spread = rate − first index)", kind: "floating", principal: P, annualRate: Math.max(0, r - (indexPath[0] ?? 0)), amortizationYears: values.amort, termYears: values.term, indexPathAnnual: indexPath.length ? indexPath : [r], rateCap: values.cap > 0 ? values.cap / 100 : undefined, rateFloor: values.floor / 100 },
      { name: "Bridge 2y, +250 bps, 1% in / 1% out", kind: "bridge", principal: P, annualRate: r + 0.025, amortizationYears: 2, termYears: 2, originationFeeRate: 0.01, exitFeeRate: 0.01 },
      { name: "Seller note 5y IO, −150 bps", kind: "seller", principal: P, annualRate: Math.max(0, r - 0.015), amortizationYears: 30, termYears: 5, interestOnlyYears: 5 },
    ]);
  } catch (e) { error = e instanceof FinanceInputError ? e.message : "Could not compute."; }
  const annual = primary ? Array.from({ length: Math.ceil(primary.rows.length / 12) }, (_, y) => { const rows = primary!.rows.slice(y * 12, y * 12 + 12); return [y + 1, formatPct(primary!.rateByPeriod[y * 12] ?? 0), formatUsd(rows.reduce((s, r) => s + r.payment, 0)), formatUsd(rows.reduce((s, r) => s + r.interest, 0)), formatUsd(rows.reduce((s, r) => s + r.principal, 0)), formatUsd(rows[rows.length - 1]!.endingBalance)]; }) : [];
  const txs = await listTransactions(db);
  return (
    <>
      <PageHeader eyebrow="Capital Architecture Lab" title="Debt Structuring Lab" description="Build one structure in detail and compare it with the canonical alternatives at the same principal: fixed amortising, interest-only, balloon, floating-rate, bridge and seller financing. Every line is a real schedule." />
      <HypotheticalBanner modelName={model?.name} version={model?.version} />
      {raw.saved && <div className="mb-5"><Alert tone="success">Model saved.</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-5">
          <Card><Eyebrow className="mb-3">Loan terms</Eyebrow><ParamForm action="/lab/debt" fields={FIELDS} values={values} submitLabel="Build schedule" hidden={model ? { model: model.id } : {}} /></Card>
          <Card><Eyebrow className="mb-3">Save</Eyebrow><SaveModelPanel kind="debt" assumptions={values} returnTo="/lab/debt" existing={model ? { id: model.id, name: model.name, version: model.version, transactionId: model.transactionId } : null} transactions={txs.map((t) => ({ id: t.tx.id, name: t.tx.name }))} /></Card>
        </div>
        <div className="space-y-5">
          {error && <Alert tone="error">{error}</Alert>}
          {primary && (
            <>
              <Card>
                <Eyebrow className="mb-3">{primary.name} · {KINDS.find(([k]) => k === primary!.kind)?.[1]}</Eyebrow>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                  <Stat label="First monthly payment" value={formatUsd(primary.firstPayment, { decimals: 2 })} />
                  <Stat label="Peak monthly payment" value={formatUsd(primary.peakPayment, { decimals: 2 })} />
                  <Stat label="Year-1 debt service" value={formatUsd(primary.annualDebtServiceYear1)} />
                  <Stat label="Balloon at maturity" value={formatUsd(primary.balloonBalance)} tone={primary.balloonBalance > 0 ? "risk" : "positive"} />
                  <Stat label="Total interest" value={formatUsd(primary.totalInterest)} />
                  <Stat label="All-in annual cost" value={formatPct(primary.allInAnnualCost)} sub="IRR of borrower cash flows incl. fees" />
                </div>
                {primary.warnings.length > 0 && <ul className="mt-5 space-y-1.5">{primary.warnings.map((w) => <li key={w}><Alert tone="warning">{w}</Alert></li>)}</ul>}
              </Card>
              <Card><Eyebrow className="mb-3">Annual schedule</Eyebrow><ResultsTable headers={["Year", "Rate", "Payments", "Interest", "Principal", "Ending balance"]} rows={annual} /></Card>
              <Card>
                <Eyebrow className="mb-3">Comparison at {formatUsd(values.principal)}</Eyebrow>
                <ResultsTable headers={["Structure", "First payment", "Peak payment", "Y1 debt service", "Total interest", "Fees", "Balloon", "All-in cost"]} rows={comparison.map((c) => [c.name, formatUsd(c.firstPayment, { decimals: 0 }), formatUsd(c.peakPayment, { decimals: 0 }), formatUsd(c.annualDebtServiceYear1), formatUsd(c.totalInterest), formatUsd(c.totalFees), formatUsd(c.balloonBalance), formatPct(c.allInAnnualCost)])} />
                <p className="mt-3 text-[0.65rem] text-slate-mist">Comparison structures use your rate as the reference: the bridge adds 250 bps and fees, the seller note subtracts 150 bps, the floating line treats your rate minus the first index value as the spread.</p>
              </Card>
              <Card><Eyebrow className="mb-2">Formulas</Eyebrow><ul className="list-disc space-y-1 pl-5 text-xs text-platinum/75"><li>Level payment = P·r·(1+r)ⁿ ÷ ((1+r)ⁿ − 1), r = annual ÷ 12.</li><li>Floating: all-in rate = clamp(index + spread, floor, cap) each month; the payment is recast on the remaining balance over the remaining amortisation.</li><li>All-in cost: monthly IRR of (+net proceeds, −payments, −balloon −exit fee), annualised as (1+r)¹² − 1.</li></ul></Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
