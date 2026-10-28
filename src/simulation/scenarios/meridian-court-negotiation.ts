import type { SimScenario, SimState } from "../engine";

/**
 * Fictional lender-negotiation exercise built on the Meridian Court case. Every figure is invented ($ thousands).
 * The debrief compares the player's choices with the documented Zell/Chilmark method, not with a real deal.
 */
const start = (): SimState => ({ equityValue: 12_000, liquidity: 12_000, debt: 0, assetValue: 0, flags: {}, log: [] });

export const meridianCourtNegotiation: SimScenario = {
  slug: "meridian-court-lender-negotiation",
  title: "Meridian Court: negotiating the note",
  subtitle: "Fictional · a 112-unit distressed multifamily loan, from bid to resolution",
  kind: "fictional",
  unit: "$ thousands (fictional)",
  investorSlug: "sam-zell",
  caseSlug: "meridian-court-distressed-multifamily",
  disclaimer: "Meridian Court, Larkspur Savings Bank and Halcyon Residential Partners are fictional. Every figure is invented for practice. The debrief cites documented claims about the Zell/Chilmark method only to compare reasoning, never to imply this deal happened.",
  setting: `You run a $12 million pool of patient capital. Larkspur Savings Bank wants to sell the defaulted $12.6 million (plus $0.4 million accrued) floating-rate loan on Meridian Court, a 112-unit garden apartment community that is 81% occupied. As-is value is about $11.5 million; stabilised value after a $1.35 million renovation is perhaps $13.4 million. Judicial foreclosure here takes 11–14 months and your carry while you wait is about $38,000 a month.

The bank has signalled it would accept a price in the low-to-mid 70s as a percentage of unpaid balance before year-end. The borrower has hinted it could refinance with a bridge lender in six months if offered a discounted payoff.`,
  objectives: ["Buy control of the situation at a price that survives the worst realistic path.", "Keep enough liquidity to carry a 14-month foreclosure without outside money.", "Earn a return that compensates for the time and the fight, not just the discount."],
  capitalSources: ["Your own pool ($12 million, uncommitted)", "A bridge lender offering 11% interest-only on a note purchase, 65% of your price", "Borrower's prospective refinancing (the source of any discounted payoff)"],
  evidence: ["carter-hawley-hale-1991", "zell-chilmark-fund-1990", "grave-dancer-essay-1976", "macklowe-lost-towers-2008"],
  initialState: start,
  stages: [
    {
      key: "bid", title: "Pricing the note", when: "Month 0",
      briefing: `Unpaid balance $13.0 million including accruals. As-is value $11.5 million. Your worst realistic path is 14 months of foreclosure, $220,000 of legal cost, $1.35 million of renovation and nine months of REO before a sale at roughly stabilised value less 2.5% costs.

The bank says it has another bidder. You have no way to verify that.`,
      constraints: ["Carry of $38,000 per month starts the day you close.", "You may bid once; the bank will accept, counter once, or walk."],
      options: [
        { key: "bid68", label: "Bid 68% of UPB ($8.84 million)", detail: "Price the worst path with a margin; risk losing the note to the other bidder.", apply: (s) => ({ ...s, flags: { ...s.flags, bid: 68, won: true, price: 9_100 }, liquidity: s.liquidity - 9_100, assetValue: 9_100, log: [...s.log, "Bid 68%; the bank countered at 71% and accepted 70% ($9.1m)."] }), scores: { financial_reasoning: 9, leverage_prudence: 8, diligence: 8, liquidity: 8, risk_adjusted_return: 9 }, feedback: "Pricing from the worst path and letting the bank counter is how claims are bought: the price is set by the downside, not by the discount headline.", consequence: "The bank counters at 71%; you settle at 70% ($9.1 million) and close. Carry begins." },
        { key: "bid74", label: "Bid 74% of UPB ($9.62 million)", detail: "Meet the bank's ask to be sure of winning.", apply: (s) => ({ ...s, flags: { ...s.flags, bid: 74, won: true, price: 9_620 }, liquidity: s.liquidity - 9_620, assetValue: 9_620, log: [...s.log, "Bid 74%; accepted immediately at $9.62m."] }), scores: { financial_reasoning: 5, leverage_prudence: 6, diligence: 4, liquidity: 6, risk_adjusted_return: 5 }, feedback: "Immediate acceptance usually means you paid the top of the range. At 84% of as-is value the foreclosure path barely clears the carry and legal cost.", consequence: "Accepted at once. You own the note at $9.62 million." },
        { key: "bid80", label: "Bid 80% of UPB ($10.4 million)", detail: "Pre-empt the auction; rely on the DPO or the renovation upside.", apply: (s) => ({ ...s, flags: { ...s.flags, bid: 80, won: true, price: 10_400 }, liquidity: s.liquidity - 10_400, assetValue: 10_400, log: [...s.log, "Bid 80%; accepted at $10.4m."] }), scores: { financial_reasoning: 2, leverage_prudence: 4, diligence: 3, liquidity: 3, risk_adjusted_return: 2 }, feedback: "At 90% of as-is value you have bought the building's upside at the price of a claim, with none of the claim's protection. Only a quick DPO makes this work, and the borrower knows it.", consequence: "Accepted at once. You own the note at $10.4 million and have $1.6 million left." },
      ],
      historical: { summary: "The Zell/Chilmark Fund bought junk bonds and vendor claims against Carter Hawley Hale's parent in 1991 and took control through the restructuring. The documented method is to own the claim that converts into control, priced for the restructuring path.", claims: ["carter-hawley-hale-1991", "zell-chilmark-fund-1990"], documentedChoiceKey: "bid68" },
    },
    {
      key: "carry", title: "Financing the wait", when: "Month 1",
      briefing: `You now own the note. A bridge lender offers to advance 65% of your purchase price at 11% interest-only for 18 months with a 1% fee, freeing your cash. Alternatively you carry entirely with your own capital.`,
      options: [
        { key: "equity", label: "Carry with your own capital", detail: "No financing cost; liquidity falls by $38,000 a month.", apply: (s) => ({ ...s, flags: { ...s.flags, bridge: false }, log: [...s.log, "Carried the note with equity."] }), scores: { leverage_prudence: 9, liquidity: 6, financial_reasoning: 7 }, feedback: "A non-performing claim produces no cash; financing it with debt that has its own maturity adds a second clock to the one you are already racing.", consequence: "No new debt. The clock is only the foreclosure clock." },
        { key: "bridge", label: "Take the 65% bridge loan at 11% IO", detail: "Frees about 65% of your price; adds interest and an 18-month maturity.", apply: (s) => { const loan = (s.flags.price as number) * 0.65; return { ...s, debt: loan, liquidity: s.liquidity + loan * 0.99, flags: { ...s.flags, bridge: true, bridgeLoan: loan }, log: [...s.log, `Took a ${Math.round(loan)}k bridge at 11% IO maturing in 18 months.`] }; }, scores: { leverage_prudence: 3, liquidity: 7, financial_reasoning: 4 }, feedback: "Leverage on a non-performing claim is the Macklowe structure in miniature: fine if the DPO arrives, ruinous if foreclosure runs past the bridge maturity.", consequence: "Cash returns to your account. Interest of roughly 0.9% of the loan is due every month." },
      ],
      historical: { summary: "Buyers who financed 2007 office purchases with short-term debt lost the assets when the debt could not be refinanced in 2008; matching the capital's maturity to the plan is the documented lesson.", claims: ["macklowe-lost-towers-2008"], documentedChoiceKey: "equity" },
    },
    {
      key: "dpo", title: "The borrower's offer", when: "Month 4",
      briefing: `The borrower's counsel calls. Halcyon can refinance with a bridge lender and will pay 82% of the unpaid balance ($10.66 million) in month six as a discounted payoff, in full satisfaction. If you refuse, they will contest the foreclosure, which their counsel estimates adds six to eight months.

You have spent four months of carry. Nothing about the property has changed.`,
      options: [
        { key: "accept", label: "Accept 82% in month six", detail: "Take the payoff; close the file.", apply: (s) => resolve(s, { payoff: 10_660, month: 6 }, "dpo"), scores: { financial_reasoning: 8, diligence: 6, liquidity: 9, risk_adjusted_return: 8, leverage_prudence: 8 }, feedback: "Selling certainty to a motivated buyer is the mirror image of buying claims from a forced seller. The return on a six-month hold is high and the renovation risk is someone else's.", consequence: "The payoff arrives in month six." },
        { key: "counter", label: "Counter at 88% ($11.44 million) in month six", detail: "Push for more; risk a contested foreclosure if they refuse.", apply: (s) => resolve(s, { payoff: 11_050, month: 7 }, "dpo_counter"), scores: { financial_reasoning: 7, diligence: 7, liquidity: 7, risk_adjusted_return: 7, leverage_prudence: 7 }, feedback: "A counter is reasonable when your downside path is priced in; here the borrower splits the difference. The risk you ran was the contest, not the number.", consequence: "They meet you at 85% ($11.05 million) in month seven." },
        { key: "refuse", label: "Refuse and foreclose for the property", detail: "You want the building and the renovation upside, not the payoff.", apply: (s) => resolve(s, { payoff: 0, month: 0 }, "foreclose"), scores: { financial_reasoning: 4, diligence: 5, liquidity: 3, risk_adjusted_return: 4, leverage_prudence: 4 }, feedback: "Choosing the longest path with the most execution risk when a high-return exit is offered needs a reason beyond wanting the building. The contested timeline is where carry and any bridge maturity bite.", consequence: "The borrower contests. You are in for the long path." },
      ],
      historical: { summary: "The Grave Dancer essay's warning about the fine line between the dancer and the danced upon applies here: the distressed buyer's edge is in pricing and timing the capital, not in winning the fight for its own sake.", claims: ["grave-dancer-essay-1976"], documentedChoiceKey: "accept" },
    },
    {
      key: "foreclosure_event", title: "The contested foreclosure", when: "Months 5 – 28",
      visibleWhen: (s) => s.flags.path === "foreclose",
      briefing: `The contest adds seven months. Title transfers in month 21. Renovation takes nine months; you sell the stabilised property in month 30 at $13.4 million less 2.5% costs. Legal costs run to $280,000.

If you took the bridge loan, it matured in month 18 and must be extended at a 2% fee and 13% or repaid from your own capital.`,
      options: [
        { key: "extend", label: "Extend the bridge (or, if unlevered, simply carry on)", detail: "Pay the extension fee if you have a bridge; otherwise this is the only path.", apply: (s) => finishForeclosure(s, "extend"), scores: { financial_reasoning: 6, leverage_prudence: 5, liquidity: 5, risk_adjusted_return: 5 }, feedback: "Extending at a higher rate preserves the asset but spends return on time; unlevered, the path is slow but intact.", consequence: "Title in month 21; sale in month 30." },
        { key: "repay", label: "Repay any bridge from your own capital and carry through", detail: "Remove the second clock.", apply: (s) => finishForeclosure(s, "repay"), scores: { financial_reasoning: 7, leverage_prudence: 8, liquidity: 4, risk_adjusted_return: 6 }, feedback: "Removing the maturity risk with your own liquidity is the right move once a contested timeline is certain; the cost is that your capital is fully committed to one asset.", consequence: "No more lender. Title in month 21; sale in month 30." },
      ],
      historical: { summary: "Refinancing risk on short-dated debt, not asset quality, is what forced the 2008 losses among leveraged buyers of the former Equity Office towers.", claims: ["macklowe-lost-towers-2008"] },
    },
  ],
  epilogue: (s) => {
    const profit = s.equityValue - 12_000;
    const months = (s.flags.months as number) ?? 0;
    return `Modelled result: ${profit >= 0 ? "profit" : "loss"} of ${Math.abs(Math.round(profit)).toLocaleString("en-US")} thousand over ${months} months on a $12 million pool, ending with ${Math.round(s.liquidity).toLocaleString("en-US")} thousand of liquidity. ${s.flags.path === "foreclose" ? "You took the longest path; whether it was worth it depends on the renovation executing to plan, which this model assumed." : "You sold certainty to the borrower and recycled capital quickly; the Zell/Chilmark pattern of buying the claim and letting the restructuring deliver the return."}`;
  },
};

function resolve(s: SimState, dpo: { payoff: number; month: number }, path: "dpo" | "dpo_counter" | "foreclose"): SimState {
  const next = structuredClone(s);
  next.flags.path = path;
  if (path === "foreclose") { next.log.push("Refused the payoff; foreclosure contested."); return next; }
  const carry = 38 * dpo.month;
  const bridgeCost = next.flags.bridge ? (next.flags.bridgeLoan as number) * (0.11 / 12) * dpo.month + (next.flags.bridgeLoan as number) * 0.01 : 0;
  next.liquidity = next.liquidity - carry - bridgeCost + dpo.payoff - (next.flags.bridge ? (next.flags.bridgeLoan as number) : 0);
  next.debt = 0; next.assetValue = 0;
  next.equityValue = next.liquidity;
  next.flags.months = dpo.month;
  next.log.push(`Payoff of ${dpo.payoff.toLocaleString("en-US")}k received in month ${dpo.month}; carry ${carry}k${bridgeCost ? `, bridge cost ${Math.round(bridgeCost)}k` : ""}.`);
  return next;
}

function finishForeclosure(s: SimState, action: "extend" | "repay"): SimState {
  const next = structuredClone(s);
  const months = 30;
  const carry = 38 * 21 + 20 * 9; // full carry to title, reduced carry during renovation (fictional)
  const legal = 280; const reno = 1_350; const sale = 13_400 * 0.975;
  let bridgeCost = 0;
  if (next.flags.bridge) {
    const loan = next.flags.bridgeLoan as number;
    if (action === "extend") bridgeCost = loan * (0.11 / 12) * 18 + loan * 0.02 + loan * (0.13 / 12) * 12;
    else bridgeCost = loan * (0.11 / 12) * 18; // repaid at month 18 from own capital
    next.liquidity -= loan; next.debt = 0;
  }
  next.liquidity = next.liquidity - carry - legal - reno - bridgeCost + sale;
  next.assetValue = 0; next.equityValue = next.liquidity; next.flags.months = months;
  next.log.push(`Foreclosed, renovated and sold in month ${months}: sale ${Math.round(sale)}k, carry ${carry}k, legal ${legal}k, renovation ${reno}k${bridgeCost ? `, bridge cost ${Math.round(bridgeCost)}k` : ""}.`);
  return next;
}
