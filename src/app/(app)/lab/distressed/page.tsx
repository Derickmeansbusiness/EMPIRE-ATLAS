import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listTransactions } from "@/lib/data/research";
import { num, pct, withSavedModel, type SP } from "@/lib/lab-params";
import { analyzeDistressedLoan } from "@/finance/distressed";
import { FinanceInputError } from "@/finance/core";
import { Alert, Card, Eyebrow, PageHeader, Stat } from "@/components/ui/primitives";
import { HypotheticalBanner, ParamForm, type FieldSpec } from "@/components/lab/param-form";
import { SaveModelPanel } from "@/components/lab/shared";
import { formatMultiple, formatPct, formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Distressed Acquisition Simulator" };

const FIELDS: FieldSpec[] = [
  { key: "unpaidPrincipalBalance", label: "Unpaid principal balance ($)", kind: "usd" }, { key: "purchasePriceOfLoan", label: "Price paid for the note ($)", kind: "usd" }, { key: "propertyValueToday", label: "Collateral value today ($)", kind: "usd" }, { key: "monthlyCarryCost", label: "Monthly carry ($)", kind: "usd" },
  { key: "dpoPercentOfUpb", label: "Discounted payoff (% of UPB)", kind: "pct" }, { key: "dpoMonth", label: "DPO month", kind: "int" },
  { key: "restructuredBalancePercent", label: "Restructured balance (% of UPB)", kind: "pct" }, { key: "restructureRate", label: "Restructured rate (%)", kind: "pct" }, { key: "restructureTermYears", label: "Restructured term (years)", kind: "int" }, { key: "restructureStartMonth", label: "Restructure starts (month)", kind: "int" },
  { key: "foreclosureMonths", label: "Months to foreclose", kind: "int" }, { key: "legalCosts", label: "Legal costs ($)", kind: "usd" }, { key: "reoRenovation", label: "REO renovation ($)", kind: "usd" }, { key: "reoHoldMonths", label: "REO hold (months)", kind: "int" }, { key: "reoSalePriceRatio", label: "REO sale price (% of value)", kind: "pct" }, { key: "saleCostRate", label: "Sale costs (%)", kind: "pct" },
];

export default async function DistressedPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const db = await getDb();
  const raw = await searchParams;
  const { sp, model } = await withSavedModel(db, user.id, raw);
  const values = {
    unpaidPrincipalBalance: num(sp, "unpaidPrincipalBalance", 8_000_000), purchasePriceOfLoan: num(sp, "purchasePriceOfLoan", 5_200_000), propertyValueToday: num(sp, "propertyValueToday", 7_000_000), monthlyCarryCost: num(sp, "monthlyCarryCost", 12_000),
    dpoPercentOfUpb: pct(sp, "dpoPercentOfUpb", 0.78) * 100, dpoMonth: num(sp, "dpoMonth", 8),
    restructuredBalancePercent: pct(sp, "restructuredBalancePercent", 0.85) * 100, restructureRate: pct(sp, "restructureRate", 0.065) * 100, restructureTermYears: num(sp, "restructureTermYears", 25), restructureStartMonth: num(sp, "restructureStartMonth", 4),
    foreclosureMonths: num(sp, "foreclosureMonths", 12), legalCosts: num(sp, "legalCosts", 150_000), reoRenovation: num(sp, "reoRenovation", 400_000), reoHoldMonths: num(sp, "reoHoldMonths", 9), reoSalePriceRatio: pct(sp, "reoSalePriceRatio", 0.95) * 100, saleCostRate: pct(sp, "saleCostRate", 0.03) * 100,
  };
  let result: ReturnType<typeof analyzeDistressedLoan> | null = null; let error: string | null = null;
  try {
    result = analyzeDistressedLoan({ ...values, noteRate: 0, dpoPercentOfUpb: values.dpoPercentOfUpb / 100, restructuredBalancePercent: values.restructuredBalancePercent / 100, restructureRate: values.restructureRate / 100, reoSalePriceRatio: values.reoSalePriceRatio / 100, saleCostRate: values.saleCostRate / 100 });
  } catch (e) { error = e instanceof FinanceInputError ? e.message : "Could not compute."; }
  const txs = await listTransactions(db);
  return (
    <>
      <PageHeader eyebrow="Capital Architecture Lab" title="Distressed Acquisition Simulator" description="Buy a non-performing loan at a discount and compare three defined exits: a discounted payoff, a restructuring you hold, or foreclosure to REO and sale. Each path is a complete monthly cash-flow series." />
      <HypotheticalBanner modelName={model?.name} version={model?.version} />
      {raw.saved && <div className="mb-5"><Alert tone="success">Model saved.</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-5">
          <Card><Eyebrow className="mb-3">Note purchase &amp; exit paths</Eyebrow><ParamForm action="/lab/distressed" fields={FIELDS} values={values} submitLabel="Simulate paths" hidden={model ? { model: model.id } : {}} /></Card>
          <Card><Eyebrow className="mb-3">Save</Eyebrow><SaveModelPanel kind="distressed" assumptions={values} returnTo="/lab/distressed" existing={model ? { id: model.id, name: model.name, version: model.version, transactionId: model.transactionId } : null} transactions={txs.map((t) => ({ id: t.tx.id, name: t.tx.name }))} /></Card>
        </div>
        <div className="space-y-5">
          {error && <Alert tone="error">{error}</Alert>}
          {result && (
            <>
              <Card>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                  <Stat label="Discount to UPB" value={formatPct(result.discountToUpb, 1)} />
                  <Stat label="Price / collateral value" value={formatPct(result.priceToValue, 1)} tone={result.priceToValue > 0.8 ? "risk" : "positive"} />
                  <Stat label="Breakeven price (foreclosure path)" value={formatUsd(result.breakevenPurchasePriceForeclosure)} sub="zero profit, ignoring time value" />
                </div>
                {result.warnings.length > 0 && <ul className="mt-5 space-y-1.5">{result.warnings.map((w) => <li key={w}><Alert tone="warning">{w}</Alert></li>)}</ul>}
              </Card>
              <div className="grid gap-4 md:grid-cols-3">
                {result.paths.map((p) => (
                  <Card key={p.key}>
                    <Eyebrow className="mb-1">{p.name}</Eyebrow>
                    <p className="text-xs text-slate-mist">{p.narrative}</p>
                    <div className="mt-4 space-y-3">
                      <Stat label="Annualised IRR" value={formatPct(p.irrAnnual)} tone={(p.irrAnnual ?? -1) >= 0 ? "positive" : "risk"} />
                      <Stat label="Multiple" value={formatMultiple(p.multiple)} />
                      <Stat label="Total profit" value={formatUsd(p.totalProfit)} tone={p.totalProfit >= 0 ? "positive" : "risk"} />
                      <Stat label="Duration" value={`${p.months} mo`} />
                    </div>
                  </Card>
                ))}
              </div>
              <Card><Eyebrow className="mb-2">Conventions</Eyebrow><ul className="list-disc space-y-1 pl-5 text-xs text-platinum/75"><li>Every path starts with −price at month 0 and pays monthly carry until cash comes back.</li><li>Restructure path: the written-down balance amortises at the new rate; the buyer is modelled as collecting every payment to maturity (no resale of the modified note).</li><li>Foreclosure path: legal and renovation costs are paid when title transfers; sale proceeds net of sale costs arrive at the end of the REO hold.</li><li>IRRs are monthly, annualised as (1+r)¹² − 1.</li></ul></Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
