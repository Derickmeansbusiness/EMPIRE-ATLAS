import { underwriteAcquisition, type UnderwritingAssumptions } from "@/finance/underwriting";
import { Alert, Card, Eyebrow, Stat } from "@/components/ui/primitives";
import { formatMultiple, formatPct, formatUsd } from "@/lib/format";
import { FinanceInputError } from "@/finance/core";
import { ParamForm, type FieldSpec } from "./param-form";

const DEFAULTS: UnderwritingAssumptions = {
  purchasePrice: 12_500_000, closingCostRate: 0.02, initialCapex: 750_000, units: 96, monthlyRentPerUnit: 1_250, otherIncomeAnnual: 40_000,
  vacancyRate: 0.08, operatingExpensesAnnual: 620_000, rentGrowth: 0.03, expenseGrowth: 0.025, loanToValue: 0.65, annualRate: 0.0675,
  amortizationYears: 30, interestOnlyYears: 1, holdingPeriodYears: 5, exitCapRate: 0.065, saleCostRate: 0.02,
};

export const FIELDS: Array<[keyof UnderwritingAssumptions, string, "usd" | "pct" | "int" | "num"]> = [
  ["purchasePrice", "Purchase price ($)", "usd"], ["closingCostRate", "Closing costs (% of price)", "pct"], ["initialCapex", "Initial capital expenditure ($)", "usd"],
  ["units", "Units", "int"], ["monthlyRentPerUnit", "Monthly rent per unit ($)", "usd"], ["otherIncomeAnnual", "Other income, annual ($)", "usd"],
  ["vacancyRate", "Vacancy & credit loss (%)", "pct"], ["operatingExpensesAnnual", "Operating expenses, year 1 ($)", "usd"],
  ["rentGrowth", "Rent growth (%/yr)", "pct"], ["expenseGrowth", "Expense growth (%/yr)", "pct"],
  ["loanToValue", "Loan-to-value (%)", "pct"], ["annualRate", "Interest rate (%)", "pct"], ["amortizationYears", "Amortisation (years)", "int"], ["interestOnlyYears", "Interest-only (years)", "int"],
  ["holdingPeriodYears", "Holding period (years)", "int"], ["exitCapRate", "Exit cap rate (%)", "pct"], ["saleCostRate", "Sale costs (% of price)", "pct"],
];

export const UNDERWRITER_FIELDS: FieldSpec[] = FIELDS.map(([key, label, kind]) => ({ key, label, kind }));

/** UI-unit values (percent as percent) for forms and saved models. */
export function toUiValues(a: UnderwritingAssumptions): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, , kind] of FIELDS) out[key] = kind === "pct" ? Number((a[key] * 100).toFixed(6)) : a[key];
  return out;
}

export function parseAssumptions(sp: Record<string, string | string[] | undefined>): { assumptions: UnderwritingAssumptions; touched: boolean } {
  const out: Record<string, number> = { ...DEFAULTS };
  let touched = false;
  for (const [key, , kind] of FIELDS) {
    const raw = sp[key];
    if (typeof raw !== "string" || raw.trim() === "") continue;
    const n = Number(raw);
    if (!Number.isFinite(n)) continue;
    touched = true;
    out[key] = kind === "pct" ? n / 100 : n;
  }
  return { assumptions: out as unknown as UnderwritingAssumptions, touched };
}

export function UnderwriterTool({ sp, modelId, savePanel }: { sp: Record<string, string | string[] | undefined>; modelId?: string | null; savePanel?: React.ReactNode }) {
  const { assumptions, touched } = parseAssumptions(sp);
  let result: ReturnType<typeof underwriteAcquisition> | null = null; let error: string | null = null;
  try { result = underwriteAcquisition(assumptions); } catch (e) { error = e instanceof FinanceInputError ? e.message : "Could not compute with these inputs."; }
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <Eyebrow className="mb-3">Assumptions (hypothetical)</Eyebrow>
        <ParamForm action="/lab/underwriter" fields={UNDERWRITER_FIELDS} values={toUiValues(assumptions)} submitLabel="Run underwriting" hidden={modelId ? { model: modelId } : {}} />
        {!touched && <p className="mt-3 text-xs text-slate-mist">Defaults describe a fictional 96-unit garden apartment deal. They are illustrative, not a market quote.</p>}
        {savePanel && <div className="mt-6 border-t hairline pt-5"><Eyebrow className="mb-3">Save</Eyebrow>{savePanel}</div>}
      </Card>
      <div className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}
        {result && (
          <>
            <Card>
              <Eyebrow className="mb-3">Results</Eyebrow>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                <Stat label="Total uses" value={formatUsd(result.totalUses)} />
                <Stat label="Loan" value={formatUsd(result.loanAmount)} sub={`LTV ${formatPct(assumptions.loanToValue, 1)}`} />
                <Stat label="Equity required" value={formatUsd(result.equityRequired)} />
                <Stat label="Going-in cap rate" value={formatPct(result.goingInCapRate)} />
                <Stat label="Debt yield (Y1)" value={formatPct(result.debtYieldYear1)} />
                <Stat label="DSCR (Y1)" value={formatMultiple(result.dscrYear1)} tone={result.dscrYear1 < 1.2 ? "risk" : "positive"} />
                <Stat label="Cash-on-cash (Y1)" value={formatPct(result.cashOnCashYear1)} />
                <Stat label="Levered IRR" value={result.leveredIrr == null ? "undefined" : formatPct(result.leveredIrr)} tone={result.leveredIrr != null && result.leveredIrr > 0 ? "positive" : "risk"} />
                <Stat label="Equity multiple" value={formatMultiple(result.equityMultiple)} />
                <Stat label="Exit value" value={formatUsd(result.exitValue)} sub={`at ${formatPct(assumptions.exitCapRate)} on year-${assumptions.holdingPeriodYears} NOI`} />
                <Stat label="Net sale proceeds" value={formatUsd(result.netSaleProceeds)} sub="after sale costs and loan payoff" />
              </div>
              {result.warnings.length > 0 && <ul className="mt-5 space-y-1.5">{result.warnings.map((w) => <li key={w}><Alert tone="warning">{w}</Alert></li>)}</ul>}
            </Card>
            <Card>
              <Eyebrow className="mb-3">Annual cash flows</Eyebrow>
              <div className="overflow-x-auto">
                <table className="w-full text-xs numeric">
                  <thead className="text-left text-[0.6rem] uppercase tracking-[0.14em] text-slate-mist"><tr><th className="p-1.5">Year</th><th className="p-1.5 text-right">EGI</th><th className="p-1.5 text-right">Opex</th><th className="p-1.5 text-right">NOI</th><th className="p-1.5 text-right">Debt service</th><th className="p-1.5 text-right">Cash flow</th><th className="p-1.5 text-right">DSCR</th><th className="p-1.5 text-right">Loan balance</th></tr></thead>
                  <tbody>{result.years.map((y) => <tr key={y.year} className="border-t hairline"><td className="p-1.5">{y.year}</td><td className="p-1.5 text-right">{formatUsd(y.effectiveGrossIncome)}</td><td className="p-1.5 text-right">{formatUsd(y.operatingExpenses)}</td><td className="p-1.5 text-right">{formatUsd(y.noi)}</td><td className="p-1.5 text-right">{formatUsd(y.debtService)}</td><td className="p-1.5 text-right">{formatUsd(y.cashFlowAfterDebt)}</td><td className={`p-1.5 text-right ${y.dscr < 1.2 ? "text-risk" : ""}`}>{Number.isFinite(y.dscr) ? formatMultiple(y.dscr) : "n/a"}</td><td className="p-1.5 text-right">{formatUsd(y.loanBalanceEnd)}</td></tr>)}</tbody>
                </table>
              </div>
              <p className="mt-3 text-[0.65rem] text-slate-mist">Levered cash flow series: {result.leveredCashFlows.map((c) => formatUsd(c)).join(" → ")}. IRR is solved on this series.</p>
            </Card>
            <Card>
              <Eyebrow className="mb-2">Formulas &amp; conventions</Eyebrow>
              <ul className="list-disc space-y-1 pl-5 text-xs text-platinum/75">
                <li>NOI = (GPR + other income − vacancy × GPR) − operating expenses.</li>
                <li>Debt service is taken from a real monthly amortisation schedule (interest-only months first, if any), not from a constant.</li>
                <li>DSCR = NOI ÷ annual debt service. Debt yield = NOI ÷ loan amount. Cash-on-cash = year-1 cash flow after debt ÷ equity.</li>
                <li>Exit value = final-year NOI ÷ exit cap rate; net proceeds deduct sale costs and the outstanding loan balance.</li>
                <li>IRR is the rate at which the NPV of the levered series is zero (Newton with bisection fallback). Equity multiple = total distributions ÷ total equity.</li>
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
