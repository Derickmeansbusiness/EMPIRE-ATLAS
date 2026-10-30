/**
 * Operating-statement arithmetic and underwriting metrics. Pure: no IO, no rounding.
 * Conventions used by the Fieldbook (stated next to every result in the UI):
 *  - Recurring operating expenses exclude one-time capital items; those are tracked separately as capital.
 *  - "Underwritten NOI" is NOI after replacement reserves. NOI before reserves is shown as an intermediate.
 *  - Debt service comes from a real amortisation schedule (src/finance/core.ts).
 */
import { buildLoanSchedule, capRate, debtServiceCoverage, debtYield } from "@/finance/core";

export type LineSection = "gpr" | "deduction" | "other_income" | "expense" | "reserve";
export interface StatementLine { key: string; label: string; section: LineSection; amount: number; note?: string }

export interface StatementSummary {
  gpr: number; deductions: number; netRentalIncome: number; otherIncome: number; egi: number;
  operatingExpenses: number; noiBeforeReserves: number; reserves: number; noi: number;
  expenseRatio: number; noiMargin: number; opexPerUnit: number; egiPerUnit: number;
}

export function summarize(lines: StatementLine[], units: number): StatementSummary {
  const sum = (s: LineSection) => lines.filter((l) => l.section === s).reduce((a, l) => a + l.amount, 0);
  const gpr = sum("gpr"), deductions = sum("deduction"), otherIncome = sum("other_income"), operatingExpenses = sum("expense"), reserves = sum("reserve");
  const netRentalIncome = gpr - deductions; const egi = netRentalIncome + otherIncome;
  const noiBeforeReserves = egi - operatingExpenses; const noi = noiBeforeReserves - reserves;
  return { gpr, deductions, netRentalIncome, otherIncome, egi, operatingExpenses, noiBeforeReserves, reserves, noi, expenseRatio: egi > 0 ? operatingExpenses / egi : NaN, noiMargin: egi > 0 ? noiBeforeReserves / egi : NaN, opexPerUnit: operatingExpenses / units, egiPerUnit: egi / units };
}

export const withAmounts = (lines: StatementLine[], amounts: Record<string, number>): StatementLine[] => lines.map((l) => ({ ...l, amount: amounts[l.key] ?? l.amount }));

export interface DebtTerms { ltv: number; annualRate: number; amortizationYears: number; termYears: number; minDscr: number; minDebtYield: number }
export interface Metrics {
  loanAmount: number; annualDebtService: number; dscr: number; debtYield: number; capRate: number;
  impliedValue: number; maxLoanByLtv: number; maxLoanByDscr: number; maxLoanByDebtYield: number; supportedLoan: number;
  passesDscr: boolean; passesDebtYield: boolean; loanConstant: number;
}

/** Metrics for an underwritten NOI at a given price and hypothetical loan terms. */
export function metricsFor(noi: number, price: number, terms: DebtTerms, marketCapRate: number): Metrics {
  const loanAmount = price * terms.ltv;
  const sched = buildLoanSchedule({ principal: loanAmount, annualRate: terms.annualRate, amortizationYears: terms.amortizationYears, termYears: terms.termYears });
  const ds = sched.stabilizedAnnualDebtService; const constant = ds / loanAmount;
  const maxLoanByLtv = loanAmount; const maxLoanByDscr = noi / terms.minDscr / constant; const maxLoanByDebtYield = noi / terms.minDebtYield;
  const dscr = debtServiceCoverage(noi, ds); const dy = debtYield(noi, loanAmount);
  return {
    loanAmount, annualDebtService: ds, dscr, debtYield: dy, capRate: capRate(noi, price), impliedValue: noi / marketCapRate,
    maxLoanByLtv, maxLoanByDscr, maxLoanByDebtYield, supportedLoan: Math.max(0, Math.min(maxLoanByLtv, maxLoanByDscr, maxLoanByDebtYield)),
    passesDscr: dscr >= terms.minDscr, passesDebtYield: dy >= terms.minDebtYield, loanConstant: constant,
  };
}
