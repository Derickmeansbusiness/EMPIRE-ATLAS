import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listTransactions } from "@/lib/data/research";
import { num, pct, withSavedModel, type SP } from "@/lib/lab-params";
import { runWaterfall } from "@/finance/waterfall";
import { FinanceInputError } from "@/finance/core";
import { Alert, Card, Eyebrow, PageHeader, Stat } from "@/components/ui/primitives";
import { HypotheticalBanner, ParamForm, ResultsTable, type FieldSpec } from "@/components/lab/param-form";
import { SaveModelPanel } from "@/components/lab/shared";
import { formatMultiple, formatPct, formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Equity Waterfall Studio" };

const FIELDS: FieldSpec[] = [
  { key: "lpEquity", label: "LP equity ($)", kind: "usd" }, { key: "gpEquity", label: "GP co-invest ($)", kind: "usd" }, { key: "preferredReturn", label: "Preferred return (%, compounding)", kind: "pct" },
  { key: "catchUp", label: "GP catch-up after pref", kind: "select", options: [["0", "No"], ["1", "Yes (to first-tier promote share)"]] },
  { key: "tier1Hurdle", label: "Tier 1 hurdle IRR (%)", kind: "pct" }, { key: "tier1LpShare", label: "Tier 1 LP share (%)", kind: "pct" },
  { key: "tier2Hurdle", label: "Tier 2 hurdle IRR (%)", kind: "pct" }, { key: "tier2LpShare", label: "Tier 2 LP share (%)", kind: "pct" },
  { key: "residualLpShare", label: "Residual LP share (%)", kind: "pct" },
  { key: "distributions", label: "Annual distributions, years 1…N ($, comma-separated; include sale proceeds in the final year)", kind: "text", span: 2 },
];

export default async function WaterfallPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const db = await getDb();
  const raw = await searchParams;
  const { sp, model } = await withSavedModel(db, user.id, raw);
  const values = {
    lpEquity: num(sp, "lpEquity", 3_600_000), gpEquity: num(sp, "gpEquity", 400_000), preferredReturn: pct(sp, "preferredReturn", 0.08) * 100, catchUp: typeof sp.catchUp === "string" ? sp.catchUp : "0",
    tier1Hurdle: pct(sp, "tier1Hurdle", 0.12) * 100, tier1LpShare: pct(sp, "tier1LpShare", 0.8) * 100, tier2Hurdle: pct(sp, "tier2Hurdle", 0.18) * 100, tier2LpShare: pct(sp, "tier2LpShare", 0.7) * 100, residualLpShare: pct(sp, "residualLpShare", 0.6) * 100,
    distributions: typeof sp.distributions === "string" && sp.distributions.trim() ? sp.distributions : "250000, 270000, 290000, 310000, 6400000",
  };
  const dist = values.distributions.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
  let result: ReturnType<typeof runWaterfall> | null = null; let error: string | null = null;
  try {
    result = runWaterfall({
      lpEquity: values.lpEquity, gpEquity: values.gpEquity, preferredReturn: values.preferredReturn / 100, catchUp: values.catchUp === "1",
      tiers: [{ hurdleIrr: values.tier1Hurdle / 100, lpShare: values.tier1LpShare / 100 }, { hurdleIrr: values.tier2Hurdle / 100, lpShare: values.tier2LpShare / 100 }, { hurdleIrr: 99, lpShare: values.residualLpShare / 100 }],
      cashFlows: [-(values.lpEquity + values.gpEquity), ...dist],
    });
  } catch (e) { error = e instanceof FinanceInputError ? e.message : "Could not compute."; }
  const txs = await listTransactions(db);
  return (
    <>
      <PageHeader eyebrow="Capital Architecture Lab" title="Equity Waterfall Studio" description="Return of capital, a compounding preferred return, optional GP catch-up, two IRR-hurdle promote tiers and a residual split, applied year by year to the distributions you enter." />
      <HypotheticalBanner modelName={model?.name} version={model?.version} />
      {raw.saved && <div className="mb-5"><Alert tone="success">Model saved.</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-5">
          <Card><Eyebrow className="mb-3">Structure</Eyebrow><ParamForm action="/lab/waterfall" fields={FIELDS} values={values} submitLabel="Run waterfall" hidden={model ? { model: model.id } : {}} /></Card>
          <Card><Eyebrow className="mb-3">Save</Eyebrow><SaveModelPanel kind="waterfall" assumptions={values} returnTo="/lab/waterfall" existing={model ? { id: model.id, name: model.name, version: model.version, transactionId: model.transactionId } : null} transactions={txs.map((t) => ({ id: t.tx.id, name: t.tx.name }))} /></Card>
        </div>
        <div className="space-y-5">
          {error && <Alert tone="error">{error}</Alert>}
          {result && (
            <>
              <Card>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                  <Stat label="Deal IRR" value={formatPct(result.dealIrr)} />
                  <Stat label="LP IRR" value={formatPct(result.lpIrr)} tone="positive" />
                  <Stat label="GP IRR" value={formatPct(result.gpIrr)} />
                  <Stat label="LP multiple" value={formatMultiple(result.lpMultiple)} />
                  <Stat label="LP total" value={formatUsd(result.lpTotal)} />
                  <Stat label="GP total" value={formatUsd(result.gpTotal)} />
                  <Stat label="Promote earned" value={formatUsd(result.promoteEarned)} sub="GP receipts above pro-rata" />
                </div>
                {result.warnings.length > 0 && <ul className="mt-5 space-y-1.5">{result.warnings.map((w) => <li key={w}><Alert tone="warning">{w}</Alert></li>)}</ul>}
              </Card>
              <Card>
                <Eyebrow className="mb-3">Distribution by year</Eyebrow>
                <ResultsTable headers={["Year", "Available", "Return of capital", "Preferred", "Tier 1", "Tier 2", "Residual", "LP", "GP"]} rows={result.years.map((y) => [y.year, formatUsd(y.available), formatUsd(y.returnOfCapital), formatUsd(y.preferred), formatUsd(y.tierDistributions[0] ?? 0), formatUsd(y.tierDistributions[1] ?? 0), formatUsd(y.tierDistributions[2] ?? 0), formatUsd(y.lp), formatUsd(y.gp)])} />
              </Card>
              <Card><Eyebrow className="mb-2">Method</Eyebrow><ul className="list-disc space-y-1 pl-5 text-xs text-platinum/75"><li>Tier order: return of capital (pro rata) → preferred return accrued annually on unreturned capital and unpaid pref → optional GP catch-up → promote tiers → residual.</li><li>Each IRR hurdle is tracked as a capital account accruing at the hurdle rate and reduced by distributions; a tier pays until the LP’s account reaches zero, which is exact for annual cash flows.</li><li>The residual tier is a final tier with no hurdle.</li></ul></Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
