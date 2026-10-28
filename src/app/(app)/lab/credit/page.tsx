import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listTransactions } from "@/lib/data/research";
import { num, pct, withSavedModel, type SP } from "@/lib/lab-params";
import { underwriteCredit } from "@/finance/credit";
import { FinanceInputError } from "@/finance/core";
import { Alert, Card, Eyebrow, PageHeader, Stat } from "@/components/ui/primitives";
import { HypotheticalBanner, ParamForm, type FieldSpec } from "@/components/lab/param-form";
import { SaveModelPanel } from "@/components/lab/shared";
import { formatMultiple, formatPct, formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Private Credit Underwriting" };

const FIELDS: FieldSpec[] = [
  { key: "loanAmount", label: "Loan request ($)", kind: "usd" }, { key: "collateralValue", label: "Collateral value ($)", kind: "usd" }, { key: "totalProjectCost", label: "Total project cost ($)", kind: "usd" },
  { key: "borrowerNoi", label: "Borrower NOI / cash for debt service ($)", kind: "usd" }, { key: "annualRate", label: "Interest rate (%)", kind: "pct" }, { key: "termYears", label: "Term (years)", kind: "int" },
  { key: "amortizationYears", label: "Amortisation (years)", kind: "int" }, { key: "interestOnlyYears", label: "Interest-only (years)", kind: "int" }, { key: "originationFeeRate", label: "Origination fee (%)", kind: "pct" }, { key: "exitFeeRate", label: "Exit fee (%)", kind: "pct" },
  { key: "defaultMonth", label: "Default scenario: month of default (0 = none)", kind: "int" }, { key: "recoveryValue", label: "Gross recovery value ($)", kind: "usd" }, { key: "liquidationCostRate", label: "Liquidation costs (%)", kind: "pct" }, { key: "monthsToRecover", label: "Months to recover", kind: "int" }, { key: "probabilityOfDefault", label: "Probability of default (%)", kind: "pct", hint: "Optional, for expected loss only" },
];

export default async function CreditPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const db = await getDb();
  const raw = await searchParams;
  const { sp, model } = await withSavedModel(db, user.id, raw);
  const values = {
    loanAmount: num(sp, "loanAmount", 6_500_000), collateralValue: num(sp, "collateralValue", 10_000_000), totalProjectCost: num(sp, "totalProjectCost", 10_400_000), borrowerNoi: num(sp, "borrowerNoi", 690_000),
    annualRate: pct(sp, "annualRate", 0.07) * 100, termYears: num(sp, "termYears", 5), amortizationYears: num(sp, "amortizationYears", 30), interestOnlyYears: num(sp, "interestOnlyYears", 1), originationFeeRate: pct(sp, "originationFeeRate", 0.01) * 100, exitFeeRate: pct(sp, "exitFeeRate", 0.005) * 100,
    defaultMonth: num(sp, "defaultMonth", 24), recoveryValue: num(sp, "recoveryValue", 7_500_000), liquidationCostRate: pct(sp, "liquidationCostRate", 0.08) * 100, monthsToRecover: num(sp, "monthsToRecover", 9), probabilityOfDefault: pct(sp, "probabilityOfDefault", 0.05) * 100,
  };
  let result: ReturnType<typeof underwriteCredit> | null = null; let error: string | null = null;
  try {
    result = underwriteCredit({ ...values, annualRate: values.annualRate / 100, originationFeeRate: values.originationFeeRate / 100, exitFeeRate: values.exitFeeRate / 100, liquidationCostRate: values.liquidationCostRate / 100, probabilityOfDefault: values.probabilityOfDefault / 100, defaultMonth: values.defaultMonth > 0 ? values.defaultMonth : null });
  } catch (e) { error = e instanceof FinanceInputError ? e.message : "Could not compute."; }
  const txs = await listTransactions(db);
  return (
    <>
      <PageHeader eyebrow="Capital Architecture Lab" title="Private Credit Underwriting" description="The lender's side: collateral coverage, repayment capacity, income and fees, and an explicitly defined default scenario with recovery and loss severity." />
      <HypotheticalBanner modelName={model?.name} version={model?.version} />
      {raw.saved && <div className="mb-5"><Alert tone="success">Model saved.</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-5">
          <Card><Eyebrow className="mb-3">Loan request &amp; scenario</Eyebrow><ParamForm action="/lab/credit" fields={FIELDS} values={values} submitLabel="Underwrite" hidden={model ? { model: model.id } : {}} /></Card>
          <Card><Eyebrow className="mb-3">Save</Eyebrow><SaveModelPanel kind="credit" assumptions={values} returnTo="/lab/credit" existing={model ? { id: model.id, name: model.name, version: model.version, transactionId: model.transactionId } : null} transactions={txs.map((t) => ({ id: t.tx.id, name: t.tx.name }))} /></Card>
        </div>
        <div className="space-y-5">
          {error && <Alert tone="error">{error}</Alert>}
          {result && (
            <>
              <Card>
                <Eyebrow className="mb-3">Coverage &amp; performing economics</Eyebrow>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                  <Stat label="LTV" value={formatPct(result.ltv, 1)} tone={result.ltv > 0.75 ? "risk" : "positive"} />
                  <Stat label="LTC" value={formatPct(result.ltc, 1)} />
                  <Stat label="DSCR" value={formatMultiple(result.dscr)} tone={result.dscr < 1.25 ? "risk" : "positive"} />
                  <Stat label="Debt yield" value={formatPct(result.debtYield)} />
                  <Stat label="Interest income" value={formatUsd(result.interestIncome)} />
                  <Stat label="Fee income" value={formatUsd(result.feeIncome)} />
                  <Stat label="Lender IRR (performing)" value={formatPct(result.lenderIrrPerforming)} />
                  <Stat label="Lender MOIC" value={formatMultiple(result.lenderMoicPerforming)} />
                </div>
                {result.warnings.length > 0 && <ul className="mt-5 space-y-1.5">{result.warnings.map((w) => <li key={w}><Alert tone="warning">{w}</Alert></li>)}</ul>}
              </Card>
              {result.defaultScenario && (
                <Card>
                  <Eyebrow className="mb-3">Default scenario (month {values.defaultMonth})</Eyebrow>
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                    <Stat label="Exposure at default" value={formatUsd(result.defaultScenario.exposureAtDefault)} />
                    <Stat label="Net recovery" value={formatUsd(result.defaultScenario.netRecovery)} />
                    <Stat label="Loss" value={formatUsd(result.defaultScenario.lossAmount)} tone={result.defaultScenario.lossAmount > 0 ? "risk" : "positive"} />
                    <Stat label="Loss severity" value={formatPct(result.defaultScenario.lossSeverity, 1)} />
                    <Stat label="Lender IRR (default)" value={formatPct(result.defaultScenario.lenderIrr)} tone={(result.defaultScenario.lenderIrr ?? 0) < 0 ? "risk" : "positive"} />
                    <Stat label="Lender MOIC (default)" value={formatMultiple(result.defaultScenario.lenderMoic)} />
                    <Stat label="Expected loss" value={formatUsd(result.expectedLoss)} sub={`PD ${values.probabilityOfDefault}% × loss`} />
                  </div>
                </Card>
              )}
              <Card><Eyebrow className="mb-2">Formulas</Eyebrow><ul className="list-disc space-y-1 pl-5 text-xs text-platinum/75"><li>Lender cash flows: −(loan − origination fee), then scheduled payments, plus balloon and exit fee at maturity. IRR is monthly, annualised as (1+r)¹² − 1.</li><li>Exposure at default = scheduled balance after the last payment received; net recovery = min(exposure, recovery × (1 − liquidation costs)) received after the recovery period.</li><li>Loss severity = loss ÷ exposure. Expected loss = PD × loss (a display aid, not a credit model).</li></ul></Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
