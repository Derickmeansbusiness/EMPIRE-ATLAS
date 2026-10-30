/**
 * Statement-to-site reconciliation. Pure. Takes a case's seller-reported statement and the user's recorded findings and
 * produces: what the seller reports, what was observed, what can be verified, what must be investigated, three
 * underwriting cases and the investment implications. Cross-checks raise QUESTIONS; they never call anything fraud, and
 * they never change an assumption on their own.
 */
import { metricsFor, summarize, withAmounts, type StatementLine, type StatementSummary } from "./statement";
import { solve, vacantAnnualRent, type Solution } from "./solution";
import type { ChallengeCase } from "./challenges/types";
import { SEVERITY_LABELS } from "./templates";

export const CLOSING_COST_RATE = 0.02; // illustrative; shown in the report

export interface FindingLike {
  id: string; locationLabel: string; component: string; description: string; condition: string; severity: string; confidence: string;
  costLow: number | null; costHigh: number | null; costSource: string | null; specialistNeeded: string | null; followUpStatus: string; photoCount: number;
}

export interface VerifiedItem { label: string; status: "reconciled" | "conflict" | "unverified"; detail: string }
export interface CrossCheck { id: string; message: string }
export interface ScenarioResult {
  name: "Base" | "Downside" | "Upside"; assumptions: string[];
  summary: StatementSummary; noi: number; capital: number; totalProjectCost: number; loan: number; equity: number; annualDebtService: number;
  dscr: number; debtYield: number; yieldOnCost: number; capRateOnPrice: number; cashFlowAfterDebt: number; cashOnCash: number; loanLimitedBy: string;
}
export interface Reconciliation {
  seller: { summary: StatementSummary; capRate: number; dscr: number; debtYield: number; askingPrice: number };
  observed: { findingCount: number; bySeverity: Record<string, number>; safetyCount: number; specialistCount: number; capitalLow: number; capitalMid: number; capitalHigh: number; uncosted: number; withPhotos: number };
  verified: VerifiedItem[]; investigate: string[]; crossChecks: CrossCheck[]; scenarios: ScenarioResult[]; implications: string[];
  solution: Solution;
}

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const pct = (n: number, d = 1) => `${(n * 100).toFixed(d)}%`;
const SERIOUS = new Set(["material_repair", "major_capital_replacement", "potential_safety_issue", "specialist_investigation_required"]);

function scenarioLines(c: ChallengeCase, sol: Solution, kind: "Base" | "Downside" | "Upside"): { lines: StatementLine[]; assumptions: string[] } {
  const base = { ...sol.normalizedAmounts }; const rep = (k: string) => c.lines.find((l) => l.key === k)!.amount;
  const a: Record<string, number> = { ...base };
  const notes: string[] = [];
  if (kind === "Base") { notes.push("Normalised case from the model solution: rent-roll vacancy, larger of reported or 60+ day delinquency as credit loss, 4% management, $650/unit repairs, post-sale tax reassessment, $250/unit reserves."); return { lines: withAmounts(c.lines, a), assumptions: notes }; }
  if (kind === "Downside") {
    a.vacancy = base.vacancy! * 1.25; a.creditLoss = base.creditLoss! * 1.5;
    const egi = summarize(withAmounts(c.lines, a), c.property.units).egi; a.management = c.conventions.managementFeeRate * egi;
    for (const k of ["payroll", "utilities", "insurance", "contract", "admin"]) a[k] = rep(k) * 1.05;
    a.repairs = base.repairs! * 1.1;
    notes.push("Vacancy loss +25% and credit loss +50% versus base.", "Payroll, utilities, insurance, contract and admin +5%; repairs +10%; management re-based on lower income.", "Capital need taken at the high end of your recorded estimates.");
    return { lines: withAmounts(c.lines, a), assumptions: notes };
  }
  a.vacancy = base.vacancy! * 0.6; a.creditLoss = Math.max(rep("creditLoss"), base.creditLoss! * 0.75);
  const egi = summarize(withAmounts(c.lines, a), c.property.units).egi; a.management = c.conventions.managementFeeRate * egi;
  a.repairs = base.repairs! * 0.9;
  notes.push("Vacancy loss −40% versus base (leasing recovers the vacant units); credit loss −25% but never below the seller’s reported figure.", "Repairs −10% on better vendor pricing; management re-based on higher income.", "Capital need taken at the low end of your recorded estimates.");
  return { lines: withAmounts(c.lines, a), assumptions: notes };
}

export function reconcile(c: ChallengeCase, findings: FindingLike[]): Reconciliation {
  const sol = solve(c); const units = c.property.units; const price = c.askingPrice;

  // Observed
  const bySeverity: Record<string, number> = {};
  for (const f of findings) bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
  const costed = findings.filter((f) => f.costLow != null && f.costHigh != null);
  const capitalLow = costed.reduce((a, f) => a + (f.costLow ?? 0), 0); const capitalHigh = costed.reduce((a, f) => a + (f.costHigh ?? 0), 0);
  const observed = {
    findingCount: findings.length, bySeverity,
    safetyCount: findings.filter((f) => f.severity === "potential_safety_issue").length,
    specialistCount: findings.filter((f) => f.severity === "specialist_investigation_required" || !!f.specialistNeeded).length,
    capitalLow, capitalMid: (capitalLow + capitalHigh) / 2, capitalHigh,
    uncosted: findings.filter((f) => SERIOUS.has(f.severity) && (f.costLow == null || f.costHigh == null)).length,
    withPhotos: findings.filter((f) => f.photoCount > 0).length,
  };

  // Verified
  const gprFromRoll = c.rentRoll.reduce((a, r) => a + r.count * r.inPlaceRent * 12, 0);
  const reportedGpr = c.lines.find((l) => l.key === "gpr")!.amount; const reportedVac = c.lines.find((l) => l.key === "vacancy")!.amount;
  const vacUnits = c.rentRoll.reduce((a, r) => a + r.vacant, 0); const rentRollVac = vacantAnnualRent(c);
  const repairsRep = c.lines.find((l) => l.key === "repairs")!.amount; const recordsTotal = c.records.reduce((a, r) => a + r.amount, 0);
  const creditRep = c.lines.find((l) => l.key === "creditLoss")!.amount;
  const verified: VerifiedItem[] = [
    gprFromRoll === reportedGpr ? { label: "Gross potential rent", status: "reconciled", detail: `Rent roll (${units} units at in-place rents) gives ${usd(gprFromRoll)}, equal to the reported figure.` } : { label: "Gross potential rent", status: "conflict", detail: `Rent roll gives ${usd(gprFromRoll)} against ${usd(reportedGpr)} reported.` },
    { label: "Vacancy", status: rentRollVac > reportedVac * 1.25 ? "conflict" : "reconciled", detail: `Rent roll shows ${vacUnits} of ${units} units vacant (${usd(rentRollVac)} a year of in-place rent) against ${usd(reportedVac)} of reported vacancy loss. A snapshot is not an average: monthly occupancy history is needed.` },
    { label: "Credit loss", status: c.delinquency.over60 > creditRep ? "conflict" : "reconciled", detail: `${usd(c.delinquency.over60)} is more than 60 days past due against ${usd(creditRep)} of reported credit loss.` },
    { label: "Repairs and maintenance", status: recordsTotal === repairsRep ? "reconciled" : "conflict", detail: `The maintenance summary totals ${usd(recordsTotal)} against ${usd(repairsRep)} reported, but it is a seller summary, not invoices.` },
    { label: "Real estate taxes", status: "unverified", detail: `Reported on the current assessment (${usd(c.taxInfo.assessedValue)}). Post-sale taxes are not verified.` },
    { label: "Insurance", status: "unverified", detail: c.insuranceNote },
    { label: "Other income", status: "unverified", detail: `${usd(c.lines.find((l) => l.key === "otherIncome")!.amount)} reported with no supporting detail.` },
  ];

  // Cross-checks (questions only)
  const checks: CrossCheck[] = [];
  const pavement = findings.filter((f) => f.component === "paving" && SERIOUS.has(f.severity));
  const pavementRec = c.records.find((r) => /sealcoat|paving|resurfac|parking/i.test(r.description));
  if (pavement.length && pavementRec) checks.push({ id: "pavement", message: `You recorded pavement concerns, and the seller booked ${usd(pavementRec.amount)} for “${pavementRec.description.toLowerCase()}”. Ask for the invoice and scope: surface treatments do not repair structural cracking or drainage.` });
  if (observed.capitalMid > 0 && c.lines.find((l) => l.key === "reserves")!.amount === 0) checks.push({ id: "reserves", message: `You estimate ${usd(observed.capitalLow)}–${usd(observed.capitalHigh)} of capital needs; the seller shows no replacement reserve and provided no capital-expenditure history.` });
  if (observed.capitalMid > 0 && observed.capitalMid >= 2 * sol.recurringRepairsReported) checks.push({ id: "deferred", message: `Your capital estimate (${usd(observed.capitalMid)} midpoint) is more than twice the seller’s recurring repair spending (${usd(sol.recurringRepairsReported)}). That is consistent with deferred maintenance; confirm with specialist estimates.` });
  if (findings.some((f) => /offline|down unit|out of service|water damage/i.test(f.description))) checks.push({ id: "offline", message: "You noted units that may be offline or damaged. Ask which units are down, why, and whether they are counted as occupied in the statement." });
  if (findings.some((f) => f.component === "life_safety" || f.severity === "potential_safety_issue")) checks.push({ id: "safety", message: "You recorded a possible safety issue. Ask about code citations, insurer inspections and incident history, and do not rely on your own assessment." });
  if (findings.length === 0) checks.push({ id: "none", message: "No findings are recorded, so this screening compares the statement with the documents only." });

  // Investigate
  const investigate: string[] = [
    ...c.topics.map((t) => t.sample),
    ...findings.filter((f) => f.specialistNeeded).map((f) => `Specialist review (${f.specialistNeeded}): ${f.locationLabel}, ${f.description.slice(0, 90)}`),
    ...findings.filter((f) => SERIOUS.has(f.severity) && (f.costLow == null)).map((f) => `Obtain a contractor quote for: ${f.locationLabel}, ${f.description.slice(0, 90)}`),
    "Lender requirements: confirm property inspection, environmental and reserve conditions with a lender.",
  ];

  // Underwrite
  const results: ScenarioResult[] = (["Base", "Downside", "Upside"] as const).map((name) => {
    const { lines, assumptions } = scenarioLines(c, sol, name);
    const s = summarize(lines, units);
    const capital = name === "Base" ? observed.capitalMid : name === "Downside" ? observed.capitalHigh : observed.capitalLow;
    const m = metricsFor(s.noi, price, c.debt, c.marketCapRate);
    const total = price * (1 + CLOSING_COST_RATE) + capital;
    const loan = m.supportedLoan; const limitedBy = loan === m.maxLoanByLtv ? "loan-to-value" : loan === m.maxLoanByDscr ? `${c.debt.minDscr.toFixed(2)}x DSCR` : "debt yield";
    const ds = loan * m.loanConstant; const equity = total - loan; const cf = s.noi - ds;
    return { name, assumptions: [...assumptions, `Closing costs ${pct(CLOSING_COST_RATE, 1)} of price (illustrative).`], summary: s, noi: s.noi, capital, totalProjectCost: total, loan, equity, annualDebtService: ds, dscr: ds > 0 ? s.noi / ds : NaN, debtYield: loan > 0 ? s.noi / loan : NaN, yieldOnCost: s.noi / total, capRateOnPrice: s.noi / price, cashFlowAfterDebt: cf, cashOnCash: equity > 0 ? cf / equity : NaN, loanLimitedBy: limitedBy };
  });
  const base = results[0]!;
  const seller = { summary: sol.reported, capRate: sol.reportedMetrics.capRate, dscr: sol.reportedMetrics.dscr, debtYield: sol.reportedMetrics.debtYield, askingPrice: price };

  const implications = [
    `At ${usd(price)}, the seller’s NOI of ${usd(sol.reported.noiBeforeReserves)} is a ${pct(sol.reportedMetrics.capRate, 2)} cap rate. On the base case NOI after reserves (${usd(base.noi)}) it is ${pct(base.capRateOnPrice, 2)}.`,
    `At the training market cap rate of ${pct(c.marketCapRate, 2)}, base case NOI supports a value near ${usd(base.noi / c.marketCapRate)}, about ${usd(price - base.noi / c.marketCapRate)} below the asking price.`,
    `Debt capacity: the lender’s ${c.debt.minDscr.toFixed(2)}x DSCR and ${pct(c.debt.minDebtYield, 1)} debt-yield tests limit the base case loan to ${usd(base.loan)} (limited by ${base.loanLimitedBy}), against ${usd(price * c.debt.ltv)} at ${pct(c.debt.ltv, 0)} of the asking price.`,
    `Total project cost rises to ${usd(base.totalProjectCost)} with closing costs and your midpoint capital estimate (${usd(observed.capitalMid)}); equity required is ${usd(base.equity)}.`,
    `Base case year-1 cash flow after debt service is ${usd(base.cashFlowAfterDebt)} (${pct(base.cashOnCash, 1)} on equity). In the downside case it is ${usd(results[1]!.cashFlowAfterDebt)}.`,
  ];
  return { seller, observed, verified, investigate, crossChecks: checks, scenarios: results, implications, solution: sol };
}

export const severityLabel = (s: string) => SEVERITY_LABELS[s] ?? s;

/** URL parameters (UI units) that open the Capital Lab underwriter with this property's base case. Growth, hold and exit year are left to the lab's defaults. */
export function labQuery(c: ChallengeCase, r: Reconciliation): Record<string, string> {
  const gpr = c.lines.find((l) => l.key === "gpr")!.amount; const base = r.scenarios[0]!;
  const rep = r.solution.normalizedAmounts; const concessions = c.lines.find((l) => l.key === "concessions")!.amount;
  const vacancyAndCredit = ((rep.vacancy ?? 0) + concessions + (rep.creditLoss ?? 0)) / gpr;
  const other = c.lines.find((l) => l.key === "otherIncome")!.amount;
  return {
    purchasePrice: String(c.askingPrice), closingCostRate: String(CLOSING_COST_RATE * 100), initialCapex: String(Math.round(r.observed.capitalMid)), units: String(c.property.units),
    monthlyRentPerUnit: String(Math.round(gpr / 12 / c.property.units)), otherIncomeAnnual: String(other), vacancyRate: String(Number((vacancyAndCredit * 100).toFixed(2))),
    operatingExpensesAnnual: String(Math.round(base.summary.operatingExpenses + base.summary.reserves)), loanToValue: String(Number(((base.loan / c.askingPrice) * 100).toFixed(2))),
    annualRate: String(c.debt.annualRate * 100), amortizationYears: String(c.debt.amortizationYears), interestOnlyYears: "0", exitCapRate: String(c.marketCapRate * 100),
  };
}
