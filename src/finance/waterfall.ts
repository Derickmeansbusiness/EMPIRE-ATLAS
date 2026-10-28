/**
 * Equity waterfall (deal-level, annual periods).
 * Tiers: return of capital → preferred return (compounding annually) → IRR-hurdle promote tiers → residual split.
 * Hurdles use the "hurdle capital account" method: an account per hurdle accrues at the hurdle rate and is reduced by
 * total LP+GP distributions; a tier distributes until the LP's hurdle account reaches zero. This is exact for annual
 * cash flows and IRR hurdles.
 */
import { equityMultiple, FinanceInputError, irr } from "./core";

export interface WaterfallTier { hurdleIrr: number; lpShare: number }  // distributions above the previous hurdle up to this IRR go lpShare / (1 − lpShare)

export interface WaterfallInputs {
  lpEquity: number;
  gpEquity: number;
  preferredReturn: number;       // annual, compounding
  catchUp?: boolean;             // GP catch-up after pref (100% to GP until GP has promoteShare of profits so far)
  tiers: WaterfallTier[];        // ascending hurdles; the final tier's lpShare applies to all residual
  cashFlows: number[];           // deal-level, index 0 = −total equity (must equal −(lp+gp)), then annual distributions
}

export interface WaterfallYear { year: number; available: number; returnOfCapital: number; preferred: number; tierDistributions: number[]; lp: number; gp: number }
export interface WaterfallResult {
  years: WaterfallYear[]; lpCashFlows: number[]; gpCashFlows: number[];
  lpIrr: number | null; gpIrr: number | null; dealIrr: number | null;
  lpMultiple: number; gpMultiple: number; lpTotal: number; gpTotal: number; promoteEarned: number; warnings: string[];
}

export function runWaterfall(w: WaterfallInputs): WaterfallResult {
  const total = w.lpEquity + w.gpEquity;
  if (total <= 0) throw new FinanceInputError("equity must be > 0");
  if (Math.abs(-w.cashFlows[0]! - total) > 1e-6) throw new FinanceInputError("cashFlows[0] must equal −(lpEquity + gpEquity)");
  for (let k = 1; k < w.tiers.length; k++) if (w.tiers[k]!.hurdleIrr <= w.tiers[k - 1]!.hurdleIrr) throw new FinanceInputError("tiers must have ascending hurdles");
  const lpPct = w.lpEquity / total; const gpPct = w.gpEquity / total;
  let unreturned = total;                      // capital account for ROC (pro rata)
  let prefAccount = total;                     // compounding at pref; ROC + pref paid reduce it
  const hurdleAccounts = w.tiers.map(() => total);
  let lpProfitPaid = 0; let gpProfitPaid = 0;
  const years: WaterfallYear[] = []; const lpCF = [-w.lpEquity]; const gpCF = [-w.gpEquity];
  for (let y = 1; y < w.cashFlows.length; y++) {
    // accrue
    prefAccount *= 1 + w.preferredReturn;
    for (let k = 0; k < hurdleAccounts.length; k++) hurdleAccounts[k]! *= 1 + w.tiers[k]!.hurdleIrr;
    let avail = Math.max(0, w.cashFlows[y]!);
    let lp = 0; let gp = 0;
    const reduceAll = (amt: number) => { prefAccount = Math.max(0, prefAccount - amt); for (let k = 0; k < hurdleAccounts.length; k++) hurdleAccounts[k] = Math.max(0, hurdleAccounts[k]! - amt); };
    // 1. return of capital
    const roc = Math.min(avail, unreturned); unreturned -= roc; avail -= roc; lp += roc * lpPct; gp += roc * gpPct; reduceAll(roc);
    // 2. preferred return (pro rata to all capital)
    const pref = Math.min(avail, prefAccount); avail -= pref; lp += pref * lpPct; gp += pref * gpPct; reduceAll(pref); lpProfitPaid += pref * lpPct; gpProfitPaid += pref * gpPct;
    // 3. optional GP catch-up to first tier's promote share of profits so far
    const tierDist: number[] = w.tiers.map(() => 0);
    if (w.catchUp && w.tiers.length > 0 && avail > 0) {
      const promote = 1 - w.tiers[0]!.lpShare;
      // target: gp profit share (excluding pro-rata) = promote × total profits distributed
      const target = Math.max(0, (promote * (lpProfitPaid + gpProfitPaid) - gpProfitPaid) / (1 - promote));
      const cu = Math.min(avail, target); avail -= cu; gp += cu; gpProfitPaid += cu; reduceAll(cu);
    }
    // 4. hurdle tiers
    for (let k = 0; k < w.tiers.length && avail > 0; k++) {
      const share = w.tiers[k]!.lpShare;
      const isLast = k === w.tiers.length - 1;
      // distribute until LP's hurdle account is cleared: LP receives share × amount; account tracks total LP-equivalent at lpPct
      // The hurdle account is in total-equity terms; LP's remaining hurdle need = account × lpPct, satisfied by share × amount.
      const need = isLast ? Infinity : (hurdleAccounts[k]! * lpPct) / share;
      const amt = Math.min(avail, need);
      avail -= amt; lp += amt * share; gp += amt * (1 - share); lpProfitPaid += amt * share; gpProfitPaid += amt * (1 - share); tierDist[k] = amt;
      reduceAll(amt * share / lpPct); // reduce accounts by the total-equity-equivalent of what LP received
    }
    years.push({ year: y, available: Math.max(0, w.cashFlows[y]!), returnOfCapital: roc, preferred: pref, tierDistributions: tierDist, lp, gp });
    lpCF.push(lp); gpCF.push(gp);
  }
  const lpTotal = lpCF.slice(1).reduce((a, b) => a + b, 0); const gpTotal = gpCF.slice(1).reduce((a, b) => a + b, 0);
  const promoteEarned = gpTotal - (w.gpEquity > 0 ? gpPct * (lpTotal + gpTotal) : 0);
  const warnings: string[] = [];
  if (unreturned > 1e-6) warnings.push(`Capital not fully returned: ${Math.round(unreturned).toLocaleString("en-US")} outstanding.`);
  return {
    years, lpCashFlows: lpCF, gpCashFlows: gpCF, lpIrr: irr(lpCF), gpIrr: w.gpEquity > 0 ? irr(gpCF) : null, dealIrr: irr(w.cashFlows),
    lpMultiple: equityMultiple(lpCF), gpMultiple: w.gpEquity > 0 ? equityMultiple(gpCF) : 0, lpTotal, gpTotal, promoteEarned, warnings,
  };
}
