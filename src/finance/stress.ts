/**
 * Portfolio / asset stress test on top of the acquisition underwriter.
 */
import { underwriteAcquisition, type UnderwritingAssumptions } from "./underwriting";
import { buildLoanSchedule } from "./core";

export interface StressShocks {
  rateIncrease: number;        // added to annualRate (e.g. 0.02)
  valueDecline: number;        // exit cap rate widens so that value falls by this fraction (applied to exit value)
  rentDecline: number;         // fraction reduction in rent
  occupancyDecline: number;    // percentage points added to vacancy
  expenseIncrease: number;     // fraction increase in opex
  refinanceLtvCap: number;     // max LTV available at refinancing (for the refi-gap check)
  refinanceRate: number;       // rate at refinancing
}

export interface StressRow {
  scenario: string; noiYear1: number; dscrYear1: number; leveredIrr: number | null; equityMultiple: number; exitValue: number;
  refinanceProceeds: number; loanBalanceAtExit: number; refinanceGap: number; breached: string[];
}

export const STANDARD_SCENARIOS: Array<{ name: string; shocks: Partial<StressShocks> }> = [
  { name: "Base case", shocks: {} },
  { name: "Rates +200 bps", shocks: { rateIncrease: 0.02, refinanceRate: 0.02 } },
  { name: "Values −20%", shocks: { valueDecline: 0.2 } },
  { name: "Rents −10%", shocks: { rentDecline: 0.1 } },
  { name: "Occupancy −10 pts", shocks: { occupancyDecline: 0.1 } },
  { name: "Expenses +15%", shocks: { expenseIncrease: 0.15 } },
  { name: "Refi at 55% LTV, +150 bps", shocks: { refinanceLtvCap: 0.55, refinanceRate: 0.015 } },
  { name: "Combined downturn", shocks: { rateIncrease: 0.015, valueDecline: 0.15, rentDecline: 0.05, occupancyDecline: 0.05, expenseIncrease: 0.1, refinanceLtvCap: 0.6, refinanceRate: 0.015 } },
];

export function applyShocks(base: UnderwritingAssumptions, s: Partial<StressShocks>): UnderwritingAssumptions {
  const a = { ...base };
  a.annualRate = base.annualRate + (s.rateIncrease ?? 0);
  a.monthlyRentPerUnit = base.monthlyRentPerUnit * (1 - (s.rentDecline ?? 0));
  a.otherIncomeAnnual = base.otherIncomeAnnual * (1 - (s.rentDecline ?? 0));
  a.vacancyRate = Math.min(1, base.vacancyRate + (s.occupancyDecline ?? 0));
  a.operatingExpensesAnnual = base.operatingExpensesAnnual * (1 + (s.expenseIncrease ?? 0));
  // value decline implemented through exit cap: value × (1 − d) ⇔ cap / (1 − d)
  a.exitCapRate = (s.valueDecline ?? 0) > 0 ? base.exitCapRate / (1 - (s.valueDecline ?? 0)) : base.exitCapRate;
  return a;
}

export function stressTest(base: UnderwritingAssumptions, scenarios = STANDARD_SCENARIOS, refi: { ltvCap: number; rate: number; dscrFloor: number } = { ltvCap: 0.65, rate: base.annualRate, dscrFloor: 1.25 }): StressRow[] {
  return scenarios.map(({ name, shocks }) => {
    const a = applyShocks(base, shocks);
    const r = underwriteAcquisition(a);
    const last = r.years[r.years.length - 1]!;
    const ltvCap = shocks.refinanceLtvCap ?? refi.ltvCap;
    const refiRate = refi.rate + (shocks.refinanceRate ?? 0);
    // Refinance sizing: lesser of LTV cap × value and the loan whose debt service keeps DSCR ≥ floor at a 30-year amortisation.
    const byLtv = r.exitValue * ltvCap;
    const ds = buildLoanSchedule({ principal: 1_000_000, annualRate: refiRate, amortizationYears: 30, termYears: 1 }).annualDebtService / 1_000_000;
    const byDscr = ds > 0 ? last.noi / refi.dscrFloor / ds : Infinity;
    const proceeds = Math.max(0, Math.min(byLtv, byDscr));
    const gap = last.loanBalanceEnd - proceeds;
    const breached: string[] = [];
    if (r.dscrYear1 < 1.2) breached.push("DSCR < 1.20x");
    if (r.leveredIrr == null || r.leveredIrr < 0) breached.push("Negative or undefined IRR");
    if (gap > 0) breached.push("Refinance shortfall");
    if (r.netSaleProceeds < 0) breached.push("Sale does not repay debt");
    return { scenario: name, noiYear1: r.years[0]!.noi, dscrYear1: r.dscrYear1, leveredIrr: r.leveredIrr, equityMultiple: r.equityMultiple, exitValue: r.exitValue, refinanceProceeds: proceeds, loanBalanceAtExit: last.loanBalanceEnd, refinanceGap: gap, breached };
  });
}
