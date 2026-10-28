/**
 * Debt structuring: fixed, interest-only, balloon, floating-rate, bridge and seller financing,
 * each expanded into a real period-by-period schedule plus borrower all-in cost.
 */
import { annualizeRate, buildLoanSchedule, FinanceInputError, irr, periodicPayment, type AmortizationRow } from "./core";

export type DebtStructureKind = "amortizing" | "interest_only" | "balloon" | "floating" | "bridge" | "seller";

export interface DebtStructure {
  name: string;
  kind: DebtStructureKind;
  principal: number;
  annualRate: number;            // fixed coupon, or spread for floating
  amortizationYears: number;     // ignored for interest_only / bridge (set = term)
  termYears: number;
  interestOnlyYears?: number;
  originationFeeRate?: number;   // decimal of principal, paid at closing
  exitFeeRate?: number;          // decimal of principal, paid at maturity/payoff
  /** Floating only: annual index rate per year of the term (recycled if shorter). */
  indexPathAnnual?: number[];
  rateCap?: number;              // floating: max all-in annual rate
  rateFloor?: number;            // floating: min all-in annual rate
}

export interface DebtStructureResult {
  name: string;
  kind: DebtStructureKind;
  rows: AmortizationRow[];
  rateByPeriod: number[];        // annual all-in rate used in each period
  firstPayment: number;
  peakPayment: number;
  annualDebtServiceYear1: number;
  totalInterest: number;
  totalFees: number;
  balloonBalance: number;
  netProceedsAtClosing: number;  // principal − origination fee
  borrowerCashFlows: number[];   // index 0 = +net proceeds, then −payments, last includes −balloon −exit fee
  allInAnnualCost: number | null; // annualised IRR of borrower cash flows (negative of lender yield)
  warnings: string[];
}

const PPY = 12;

function clamp(x: number, lo: number | undefined, hi: number | undefined): number {
  let v = x;
  if (lo != null && v < lo) v = lo;
  if (hi != null && v > hi) v = hi;
  return v;
}

/** Floating-rate schedule: rate resets every period from the index path; payment is recast on remaining amortisation. */
function buildFloatingSchedule(s: DebtStructure): { rows: AmortizationRow[]; rates: number[] } {
  if (!s.indexPathAnnual || s.indexPathAnnual.length === 0) throw new FinanceInputError("floating structures need indexPathAnnual");
  const termPeriods = Math.round(s.termYears * PPY);
  const amortPeriods = Math.round(s.amortizationYears * PPY);
  const ioPeriods = Math.round((s.interestOnlyYears ?? 0) * PPY);
  const rows: AmortizationRow[] = []; const rates: number[] = [];
  let balance = s.principal;
  for (let p = 1; p <= termPeriods; p++) {
    const yearIdx = Math.floor((p - 1) / PPY);
    const index = s.indexPathAnnual[yearIdx % s.indexPathAnnual.length]!;
    const annual = clamp(index + s.annualRate, s.rateFloor, s.rateCap);
    const r = annual / PPY;
    const interest = balance * r;
    let payment: number; let principalPaid: number;
    if (p <= ioPeriods) { payment = interest; principalPaid = 0; }
    else {
      const remaining = amortPeriods - (p - 1 - ioPeriods);
      if (remaining <= 0) { payment = interest + balance; principalPaid = balance; }
      else { payment = periodicPayment(balance, r, remaining); principalPaid = Math.min(balance, payment - interest); payment = interest + principalPaid; }
    }
    const ending = balance - principalPaid;
    rows.push({ period: p, beginningBalance: balance, payment, interest, principal: principalPaid, endingBalance: ending });
    rates.push(annual);
    balance = ending;
  }
  return { rows, rates };
}

export function analyzeDebtStructure(s: DebtStructure): DebtStructureResult {
  if (s.principal <= 0) throw new FinanceInputError("principal must be > 0");
  if (s.termYears <= 0) throw new FinanceInputError("termYears must be > 0");
  const warnings: string[] = [];
  let rows: AmortizationRow[]; let rates: number[];
  if (s.kind === "floating") {
    const f = buildFloatingSchedule(s); rows = f.rows; rates = f.rates;
  } else {
    const io = s.kind === "interest_only" || s.kind === "bridge" ? s.termYears : (s.interestOnlyYears ?? 0);
    const amort = s.kind === "interest_only" || s.kind === "bridge" ? s.termYears : s.amortizationYears;
    const sched = buildLoanSchedule({ principal: s.principal, annualRate: s.annualRate, amortizationYears: amort, termYears: s.termYears, interestOnlyYears: Math.min(io, s.termYears) });
    rows = sched.rows; rates = rows.map(() => s.annualRate);
  }
  const originationFee = s.principal * (s.originationFeeRate ?? 0);
  const balloon = rows.length ? rows[rows.length - 1]!.endingBalance : s.principal;
  const balloonBalance = Math.abs(balloon) < 1e-6 ? 0 : balloon;
  const exitFee = s.principal * (s.exitFeeRate ?? 0);
  const totalInterest = rows.reduce((a, r) => a + r.interest, 0);
  const payments = rows.map((r) => r.payment);
  const borrowerCashFlows = [s.principal - originationFee, ...payments.map((p) => -p)];
  borrowerCashFlows[borrowerCashFlows.length - 1]! -= balloonBalance + exitFee;
  const monthly = irr(borrowerCashFlows.map((c) => -c)); // lender perspective for stable root
  const allInAnnualCost = monthly == null ? null : annualizeRate(monthly, PPY);
  if (balloonBalance > 0) warnings.push(`Balloon of ${Math.round(balloonBalance).toLocaleString("en-US")} due at maturity: refinancing or sale risk.`);
  if (s.kind === "floating" && s.rateCap == null) warnings.push("Floating rate has no cap: debt service is uncapped if the index rises.");
  if (s.kind === "bridge" && s.termYears > 3) warnings.push("Bridge terms beyond three years are unusual; check the business plan timeline.");
  return {
    name: s.name, kind: s.kind, rows, rateByPeriod: rates,
    firstPayment: payments[0] ?? 0, peakPayment: Math.max(...payments),
    annualDebtServiceYear1: payments.slice(0, PPY).reduce((a, b) => a + b, 0),
    totalInterest, totalFees: originationFee + exitFee, balloonBalance, netProceedsAtClosing: s.principal - originationFee,
    borrowerCashFlows, allInAnnualCost, warnings,
  };
}

export function compareDebtStructures(structures: DebtStructure[]): DebtStructureResult[] {
  return structures.map(analyzeDebtStructure);
}
