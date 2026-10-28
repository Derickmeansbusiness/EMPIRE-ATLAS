/**
 * Private credit underwriting — the lender's side of a loan.
 */
import { annualizeRate, buildLoanSchedule, debtServiceCoverage, debtYield, FinanceInputError, irr, loanToCost, loanToValue } from "./core";

export interface CreditInputs {
  loanAmount: number;
  collateralValue: number;
  totalProjectCost: number;
  borrowerNoi: number;           // annual NOI (or borrower cash available for debt service)
  annualRate: number;
  termYears: number;
  amortizationYears: number;     // ≥ term; equal to term for full amortisation
  interestOnlyYears: number;
  originationFeeRate: number;    // decimal of loan
  exitFeeRate: number;           // decimal of loan
  /** Default scenario (explicitly defined, not probabilistic). */
  defaultMonth: number | null;   // month at which the borrower stops paying; null = performs to maturity
  recoveryValue: number;         // gross collateral proceeds on liquidation
  liquidationCostRate: number;   // decimal of recovery value
  monthsToRecover: number;       // months from default to cash recovery
  probabilityOfDefault?: number; // optional, for expected-loss display only
}

export interface CreditResult {
  ltv: number; ltc: number; dscr: number; debtYield: number;
  interestIncome: number; feeIncome: number; totalIncomePerforming: number;
  lenderCashFlowsPerforming: number[]; lenderIrrPerforming: number | null; lenderMoicPerforming: number;
  defaultScenario: null | {
    cashCollectedBeforeDefault: number; netRecovery: number; totalCollected: number; exposureAtDefault: number;
    lossAmount: number; lossSeverity: number; lenderIrr: number | null; lenderMoic: number; cashFlows: number[];
  };
  expectedLoss: number | null;
  warnings: string[];
}

export function underwriteCredit(i: CreditInputs): CreditResult {
  if (i.loanAmount <= 0) throw new FinanceInputError("loanAmount must be > 0");
  if (i.amortizationYears < i.termYears) throw new FinanceInputError("amortizationYears must be >= termYears");
  const warnings: string[] = [];
  const sched = buildLoanSchedule({ principal: i.loanAmount, annualRate: i.annualRate, amortizationYears: i.amortizationYears, termYears: i.termYears, interestOnlyYears: i.interestOnlyYears });
  const ltv = loanToValue(i.loanAmount, i.collateralValue);
  const ltc = loanToCost(i.loanAmount, i.totalProjectCost);
  const dscr = debtServiceCoverage(i.borrowerNoi, sched.annualDebtService);
  const dy = debtYield(i.borrowerNoi, i.loanAmount);
  const origination = i.loanAmount * i.originationFeeRate; const exit = i.loanAmount * i.exitFeeRate;
  const performing = [-(i.loanAmount - origination), ...sched.rows.map((r) => r.payment)];
  performing[performing.length - 1]! += sched.balloonBalance + exit;
  const irrP = irr(performing);
  const moicP = performing.slice(1).reduce((a, b) => a + b, 0) / (i.loanAmount - origination);
  if (ltv > 0.75) warnings.push(`LTV ${(ltv * 100).toFixed(1)}% exceeds the 75% senior-lender comfort zone.`);
  if (dscr < 1.25) warnings.push(`DSCR ${dscr.toFixed(2)}x is below 1.25x.`);
  if (dy < 0.08) warnings.push(`Debt yield ${(dy * 100).toFixed(2)}% is below 8%.`);

  let defaultScenario: CreditResult["defaultScenario"] = null;
  if (i.defaultMonth != null) {
    const m = Math.max(0, Math.min(Math.floor(i.defaultMonth), sched.rows.length));
    const paid = sched.rows.slice(0, m);
    const cashBefore = paid.reduce((a, r) => a + r.payment, 0);
    const exposure = m === 0 ? i.loanAmount : paid[paid.length - 1]!.endingBalance;
    const netRecovery = Math.min(exposure, Math.max(0, i.recoveryValue * (1 - i.liquidationCostRate)));
    const flows = [-(i.loanAmount - origination), ...paid.map((r) => r.payment)];
    for (let k = 0; k < i.monthsToRecover; k++) flows.push(0);
    flows[flows.length - 1]! += netRecovery;
    const collected = cashBefore + netRecovery;
    const loss = Math.max(0, exposure - netRecovery);
    defaultScenario = {
      cashCollectedBeforeDefault: cashBefore, netRecovery, totalCollected: collected, exposureAtDefault: exposure,
      lossAmount: loss, lossSeverity: exposure > 0 ? loss / exposure : 0, lenderIrr: irr(flows), lenderMoic: collected / (i.loanAmount - origination), cashFlows: flows,
    };
    if (loss > 0) warnings.push(`Default at month ${m} loses ${Math.round(loss).toLocaleString("en-US")} (${(defaultScenario.lossSeverity * 100).toFixed(1)}% severity).`);
  }
  const expectedLoss = i.probabilityOfDefault != null && defaultScenario ? i.probabilityOfDefault * defaultScenario.lossAmount : null;
  return {
    ltv, ltc, dscr, debtYield: dy, interestIncome: sched.totalInterest, feeIncome: origination + exit, totalIncomePerforming: sched.totalInterest + origination + exit,
    lenderCashFlowsPerforming: performing, lenderIrrPerforming: irrP == null ? null : annualizeRate(irrP, 12), lenderMoicPerforming: moicP,
    defaultScenario: defaultScenario ? { ...defaultScenario, lenderIrr: defaultScenario.lenderIrr == null ? null : annualizeRate(defaultScenario.lenderIrr, 12) } : null,
    expectedLoss, warnings,
  };
}
