/**
 * Acquisition underwriting: a simple annual-period model that derives returns from actual
 * financing cash flows (equity out, levered cash flow in, net sale proceeds after debt payoff).
 * Appreciation is never counted as profit until it is realised through a modelled sale.
 */
import { buildLoanSchedule, cashOnCash, equityMultiple, irr, netOperatingIncome, FinanceInputError, debtServiceCoverage, debtYield, capRate } from "./core";

export interface UnderwritingAssumptions {
  purchasePrice: number;
  closingCostRate: number;         // decimal of purchase price
  initialCapex: number;
  units: number;
  monthlyRentPerUnit: number;
  otherIncomeAnnual: number;
  vacancyRate: number;
  operatingExpensesAnnual: number; // year-1 opex incl. taxes, insurance, mgmt, repairs, reserves
  rentGrowth: number;              // annual decimal
  expenseGrowth: number;           // annual decimal
  loanToValue: number;             // decimal of purchase price
  annualRate: number;
  amortizationYears: number;
  interestOnlyYears: number;
  holdingPeriodYears: number;
  exitCapRate: number;
  saleCostRate: number;            // decimal of sale price
}

export interface YearRow {
  year: number;
  grossPotentialRent: number;
  effectiveGrossIncome: number;
  operatingExpenses: number;
  noi: number;
  debtService: number;
  cashFlowAfterDebt: number;
  dscr: number;
  loanBalanceEnd: number;
}

export interface UnderwritingResult {
  totalUses: number;
  loanAmount: number;
  equityRequired: number;
  goingInCapRate: number;
  debtYieldYear1: number;
  dscrYear1: number;
  cashOnCashYear1: number;
  years: YearRow[];
  exitValue: number;
  netSaleProceeds: number;
  leveredCashFlows: number[]; // index 0 = -equity
  leveredIrr: number | null;
  equityMultiple: number;
  warnings: string[];
}

export function underwriteAcquisition(a: UnderwritingAssumptions): UnderwritingResult {
  if (a.holdingPeriodYears < 1 || !Number.isInteger(a.holdingPeriodYears)) throw new FinanceInputError("holdingPeriodYears must be a positive integer");
  if (a.loanToValue < 0 || a.loanToValue >= 1) throw new FinanceInputError("loanToValue must be in [0, 1)");
  const warnings: string[] = [];
  const closingCosts = a.purchasePrice * a.closingCostRate;
  const totalUses = a.purchasePrice + closingCosts + a.initialCapex;
  const loanAmount = a.purchasePrice * a.loanToValue;
  const equityRequired = totalUses - loanAmount;
  const schedule = loanAmount > 0
    ? buildLoanSchedule({ principal: loanAmount, annualRate: a.annualRate, amortizationYears: a.amortizationYears, termYears: a.holdingPeriodYears, interestOnlyYears: Math.min(a.interestOnlyYears, a.holdingPeriodYears) })
    : null;

  const years: YearRow[] = [];
  let rent = a.units * a.monthlyRentPerUnit * 12;
  let other = a.otherIncomeAnnual;
  let opex = a.operatingExpensesAnnual;
  for (let y = 1; y <= a.holdingPeriodYears; y++) {
    if (y > 1) { rent *= 1 + a.rentGrowth; other *= 1 + a.rentGrowth; opex *= 1 + a.expenseGrowth; }
    const n = netOperatingIncome({ grossPotentialRent: rent, otherIncome: other, vacancyAndCreditLossRate: a.vacancyRate, operatingExpenses: opex });
    const rows = schedule ? schedule.rows.slice((y - 1) * 12, y * 12) : [];
    const ds = rows.reduce((s, r) => s + r.payment, 0);
    const dscr = ds > 0 ? debtServiceCoverage(n.netOperatingIncome, ds) : Infinity;
    if (ds > 0 && dscr < 1.2) warnings.push(`Year ${y}: DSCR ${dscr.toFixed(2)}x is below the 1.20x threshold most senior lenders require.`);
    years.push({ year: y, grossPotentialRent: rent, effectiveGrossIncome: n.effectiveGrossIncome, operatingExpenses: opex, noi: n.netOperatingIncome, debtService: ds, cashFlowAfterDebt: n.netOperatingIncome - ds, dscr, loanBalanceEnd: rows.length ? rows[rows.length - 1]!.endingBalance : 0 });
  }
  const y1 = years[0]!;
  const goingInCapRate = capRate(y1.noi, a.purchasePrice);
  // Exit on forward NOI (year N+1) is a common convention; we use trailing NOI of the final year and say so.
  const exitNoi = years[years.length - 1]!.noi;
  const exitValue = exitNoi / a.exitCapRate;
  const saleCosts = exitValue * a.saleCostRate;
  const payoff = years[years.length - 1]!.loanBalanceEnd;
  const netSaleProceeds = exitValue - saleCosts - payoff;
  if (a.exitCapRate < goingInCapRate) warnings.push(`Exit cap rate (${(a.exitCapRate * 100).toFixed(2)}%) is below the going-in cap rate (${(goingInCapRate * 100).toFixed(2)}%): the model assumes cap-rate compression, which is a market bet rather than value creation.`);
  const leveredCashFlows = [-equityRequired, ...years.map((y) => y.cashFlowAfterDebt)];
  leveredCashFlows[leveredCashFlows.length - 1]! += netSaleProceeds;
  const r = irr(leveredCashFlows);
  return {
    totalUses, loanAmount, equityRequired, goingInCapRate,
    debtYieldYear1: loanAmount > 0 ? debtYield(y1.noi, loanAmount) : Infinity,
    dscrYear1: y1.dscr,
    cashOnCashYear1: cashOnCash(y1.cashFlowAfterDebt, equityRequired),
    years, exitValue, netSaleProceeds, leveredCashFlows, leveredIrr: r, equityMultiple: equityMultiple(leveredCashFlows), warnings,
  };
}
