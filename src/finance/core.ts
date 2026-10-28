/**
 * EMPIRE ATLAS finance core — deterministic, dependency-free formulas.
 *
 * Conventions (documented in docs/ARCHITECTURE.md → Financial accuracy rules):
 *  - Money is a JS number in whole currency units (dollars), never cents-as-integers, never strings.
 *  - Rates are decimals (0.065 = 6.5%). Periodic rates are derived as annual / periodsPerYear (nominal).
 *  - Cash flows are period-indexed arrays; index 0 is time zero (typically the negative equity outlay).
 *  - Functions never round internally. Rounding is a presentation concern.
 *  - Every function validates its inputs and throws `FinanceInputError` rather than returning NaN.
 */

export class FinanceInputError extends Error {
  constructor(message: string) { super(message); this.name = "FinanceInputError"; }
}

function assertFinite(value: number, name: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new FinanceInputError(`${name} must be a finite number (received ${String(value)})`);
}
function assertNonNegative(value: number, name: string): void {
  assertFinite(value, name);
  if (value < 0) throw new FinanceInputError(`${name} must be >= 0 (received ${value})`);
}
function assertPositive(value: number, name: string): void {
  assertFinite(value, name);
  if (value <= 0) throw new FinanceInputError(`${name} must be > 0 (received ${value})`);
}

// ───────────────────────────── income metrics ─────────────────────────────

export interface NoiInputs {
  grossPotentialRent: number;
  otherIncome?: number;
  vacancyAndCreditLossRate: number; // decimal of gross potential rent
  operatingExpenses: number;       // all opex incl. taxes, insurance, management, repairs, reserves
}

export interface NoiResult {
  grossPotentialIncome: number;
  vacancyAndCreditLoss: number;
  effectiveGrossIncome: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  expenseRatio: number; // opex / EGI
}

export function netOperatingIncome(i: NoiInputs): NoiResult {
  assertNonNegative(i.grossPotentialRent, "grossPotentialRent");
  assertNonNegative(i.otherIncome ?? 0, "otherIncome");
  assertFinite(i.vacancyAndCreditLossRate, "vacancyAndCreditLossRate");
  if (i.vacancyAndCreditLossRate < 0 || i.vacancyAndCreditLossRate > 1) throw new FinanceInputError("vacancyAndCreditLossRate must be between 0 and 1");
  assertNonNegative(i.operatingExpenses, "operatingExpenses");
  const gpi = i.grossPotentialRent + (i.otherIncome ?? 0);
  const vacancy = i.grossPotentialRent * i.vacancyAndCreditLossRate;
  const egi = gpi - vacancy;
  const noi = egi - i.operatingExpenses;
  return { grossPotentialIncome: gpi, vacancyAndCreditLoss: vacancy, effectiveGrossIncome: egi, operatingExpenses: i.operatingExpenses, netOperatingIncome: noi, expenseRatio: egi === 0 ? 0 : i.operatingExpenses / egi };
}

export function capRate(noi: number, value: number): number {
  assertFinite(noi, "noi"); assertPositive(value, "value");
  return noi / value;
}

export function valueFromCapRate(noi: number, rate: number): number {
  assertFinite(noi, "noi"); assertPositive(rate, "capRate");
  return noi / rate;
}

// ───────────────────────────── debt ─────────────────────────────

/** Level payment for an amortizing loan (per period). Zero rate → straight-line principal. */
export function periodicPayment(principal: number, periodicRate: number, periods: number): number {
  assertNonNegative(principal, "principal"); assertNonNegative(periodicRate, "periodicRate"); assertPositive(periods, "periods");
  if (!Number.isInteger(periods)) throw new FinanceInputError("periods must be an integer");
  if (periodicRate === 0) return principal / periods;
  const f = Math.pow(1 + periodicRate, periods);
  return (principal * periodicRate * f) / (f - 1);
}

export interface AmortizationRow {
  period: number;
  beginningBalance: number;
  payment: number;
  interest: number;
  principal: number;
  endingBalance: number;
}

export interface LoanTerms {
  principal: number;
  annualRate: number;
  amortizationYears: number;   // amortization schedule length
  termYears: number;           // loan term; balloon = balance at end of term if < amortization
  interestOnlyYears?: number;  // leading IO period inside the term
  paymentsPerYear?: number;    // default 12
}

export interface LoanSchedule {
  rows: AmortizationRow[];
  periodicPayment: number;      // amortizing payment (after IO period)
  interestOnlyPayment: number;  // payment during IO period
  totalInterest: number;
  totalPayments: number;
  balloonBalance: number;       // balance due at maturity (0 if fully amortized)
  annualDebtService: number;    // first-year debt service (IO if applicable)
  stabilizedAnnualDebtService: number; // annual payment once amortizing
}

export function buildLoanSchedule(t: LoanTerms): LoanSchedule {
  const ppy = t.paymentsPerYear ?? 12;
  assertPositive(ppy, "paymentsPerYear");
  assertNonNegative(t.principal, "principal"); assertNonNegative(t.annualRate, "annualRate");
  assertPositive(t.amortizationYears, "amortizationYears"); assertPositive(t.termYears, "termYears");
  const ioYears = t.interestOnlyYears ?? 0;
  assertNonNegative(ioYears, "interestOnlyYears");
  if (ioYears > t.termYears) throw new FinanceInputError("interestOnlyYears cannot exceed termYears");
  const r = t.annualRate / ppy;
  const termPeriods = Math.round(t.termYears * ppy);
  const ioPeriods = Math.round(ioYears * ppy);
  const amortPeriods = Math.round(t.amortizationYears * ppy);
  const pmt = periodicPayment(t.principal, r, amortPeriods);
  const ioPmt = t.principal * r;
  const rows: AmortizationRow[] = [];
  let balance = t.principal;
  let totalInterest = 0; let totalPayments = 0;
  for (let p = 1; p <= termPeriods; p++) {
    const interest = balance * r;
    const isIo = p <= ioPeriods;
    let payment = isIo ? ioPmt : pmt;
    let principalPaid = isIo ? 0 : payment - interest;
    if (!isIo && principalPaid > balance) { principalPaid = balance; payment = interest + principalPaid; }
    const ending = balance - principalPaid;
    rows.push({ period: p, beginningBalance: balance, payment, interest, principal: principalPaid, endingBalance: ending });
    totalInterest += interest; totalPayments += payment; balance = ending;
  }
  const firstYear = rows.slice(0, ppy).reduce((s, row) => s + row.payment, 0);
  return {
    rows, periodicPayment: pmt, interestOnlyPayment: ioPmt, totalInterest, totalPayments,
    balloonBalance: Math.abs(balance) < 1e-6 ? 0 : balance,
    annualDebtService: firstYear,
    stabilizedAnnualDebtService: pmt * ppy,
  };
}

export function debtServiceCoverage(noi: number, annualDebtService: number): number {
  assertFinite(noi, "noi"); assertPositive(annualDebtService, "annualDebtService");
  return noi / annualDebtService;
}

export function debtYield(noi: number, loanAmount: number): number {
  assertFinite(noi, "noi"); assertPositive(loanAmount, "loanAmount");
  return noi / loanAmount;
}

export function loanToValue(loanAmount: number, value: number): number {
  assertNonNegative(loanAmount, "loanAmount"); assertPositive(value, "value");
  return loanAmount / value;
}

export function loanToCost(loanAmount: number, totalCost: number): number {
  assertNonNegative(loanAmount, "loanAmount"); assertPositive(totalCost, "totalCost");
  return loanAmount / totalCost;
}

// ───────────────────────────── returns ─────────────────────────────

export function cashOnCash(annualPreTaxCashFlow: number, equityInvested: number): number {
  assertFinite(annualPreTaxCashFlow, "annualPreTaxCashFlow"); assertPositive(equityInvested, "equityInvested");
  return annualPreTaxCashFlow / equityInvested;
}

export function npv(rate: number, cashFlows: number[]): number {
  assertFinite(rate, "rate");
  if (rate <= -1) throw new FinanceInputError("rate must be > -1");
  return cashFlows.reduce((acc, cf, t) => { assertFinite(cf, `cashFlows[${t}]`); return acc + cf / Math.pow(1 + rate, t); }, 0);
}

/**
 * Internal rate of return per period via bracketing + Newton refinement.
 * Returns null when no sign change exists (IRR undefined) or no root is found in (-0.9999, 10].
 */
export function irr(cashFlows: number[], guess = 0.1): number | null {
  if (cashFlows.length < 2) return null;
  const hasPositive = cashFlows.some((c) => c > 0); const hasNegative = cashFlows.some((c) => c < 0);
  if (!hasPositive || !hasNegative) return null;
  const f = (r: number) => npv(r, cashFlows);
  // Newton from guess
  let r = guess;
  for (let i = 0; i < 100; i++) {
    const v = f(r);
    const h = 1e-6;
    const d = (f(r + h) - f(r - h)) / (2 * h);
    if (!Number.isFinite(d) || d === 0) break;
    const next = r - v / d;
    if (!Number.isFinite(next) || next <= -0.9999) break;
    if (Math.abs(next - r) < 1e-10) { r = next; return Math.abs(f(r)) < 1e-6 * Math.max(1, Math.abs(cashFlows[0]!)) ? r : bisect(f); }
    r = next;
  }
  return bisect(f);
}

function bisect(f: (r: number) => number): number | null {
  let lo = -0.9999; let hi = 10;
  let flo = f(lo); const fhi = f(hi);
  if (Number.isNaN(flo) || Number.isNaN(fhi)) return null;
  if (flo * fhi > 0) {
    // scan for a bracket
    let prev = lo; let fprev = flo; let found = false;
    for (let x = -0.99; x <= 10; x += 0.01) {
      const fx = f(x);
      if (fprev * fx <= 0) { lo = prev; hi = x; flo = fprev; found = true; break; }
      prev = x; fprev = fx;
    }
    if (!found) return null;
  }
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2; const fm = f(mid);
    if (Math.abs(fm) < 1e-9 || (hi - lo) < 1e-12) return mid;
    if (flo * fm < 0) { hi = mid; } else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
}

/** Annualises a periodic IRR: (1 + r)^periodsPerYear - 1. */
export function annualizeRate(periodicRate: number, periodsPerYear: number): number {
  assertFinite(periodicRate, "periodicRate"); assertPositive(periodsPerYear, "periodsPerYear");
  return Math.pow(1 + periodicRate, periodsPerYear) - 1;
}

export function equityMultiple(cashFlows: number[]): number {
  const invested = cashFlows.filter((c) => c < 0).reduce((s, c) => s - c, 0);
  const returned = cashFlows.filter((c) => c > 0).reduce((s, c) => s + c, 0);
  if (invested === 0) throw new FinanceInputError("equityMultiple requires at least one negative (investment) cash flow");
  return returned / invested;
}

// ───────────────────────────── capital stack ─────────────────────────────

export interface CapitalLayer {
  name: string;
  kind: "senior_debt" | "junior_debt" | "mezzanine" | "preferred_equity" | "common_equity" | "sponsor_equity";
  amount: number;
  annualRate?: number; // cost of the layer (coupon or target return), decimal
}

export interface CapitalStackSummary {
  totalSources: number;
  totalDebt: number;
  totalEquity: number;
  loanToValue: number | null;
  loanToCost: number | null;
  debtToEquity: number | null;
  weightedCostOfCapital: number | null; // null when any layer lacks a rate
  fundingGap: number; // uses - sources (positive = shortfall)
}

export function summarizeCapitalStack(layers: CapitalLayer[], opts: { totalUses: number; value?: number }): CapitalStackSummary {
  assertPositive(opts.totalUses, "totalUses");
  let totalDebt = 0; let totalEquity = 0; let weighted = 0; let allRated = layers.length > 0;
  for (const l of layers) {
    assertNonNegative(l.amount, `${l.name}.amount`);
    const isDebt = l.kind === "senior_debt" || l.kind === "junior_debt" || l.kind === "mezzanine";
    if (isDebt) totalDebt += l.amount; else totalEquity += l.amount;
    if (l.annualRate == null) allRated = false; else weighted += l.amount * l.annualRate;
  }
  const totalSources = totalDebt + totalEquity;
  return {
    totalSources, totalDebt, totalEquity,
    loanToValue: opts.value && opts.value > 0 ? totalDebt / opts.value : null,
    loanToCost: totalDebt / opts.totalUses,
    debtToEquity: totalEquity > 0 ? totalDebt / totalEquity : null,
    weightedCostOfCapital: allRated && totalSources > 0 ? weighted / totalSources : null,
    fundingGap: opts.totalUses - totalSources,
  };
}
