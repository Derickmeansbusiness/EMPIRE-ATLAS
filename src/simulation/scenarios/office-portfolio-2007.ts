import type { SimScenario, SimState } from "../engine";

/**
 * Historically grounded scenario. The setting and the debrief cite claims from the Sam Zell dossier.
 * The financial state is a simplified, explicitly hypothetical model in $ billions; it is not Equity Office's
 * balance sheet. Option effects are stated assumptions, labelled as such in the debrief.
 */
const start = (): SimState => ({ equityValue: 22, liquidity: 0.5, debt: 17, assetValue: 39, flags: {}, log: [] });

export const officePortfolio2007: SimScenario = {
  slug: "office-portfolio-top-of-cycle-2007",
  title: "The office portfolio at the top of the cycle",
  subtitle: "November 2006 – 2009 · chairman of a large listed U.S. office REIT",
  kind: "historical",
  unit: "$ billions (simplified, hypothetical)",
  investorSlug: "sam-zell",
  disclaimer: "The decision points follow the documented sequence of the 2006–07 Equity Office sale, but the balance-sheet figures, option effects and the 2008 shock are a simplified hypothetical model, not the company's accounts. Documented facts in the debrief carry their claim citations.",
  setting: `It is late 2006. You chair the largest publicly traded office landlord in the United States. Your portfolio of several hundred buildings is valued by the market at roughly $39 billion including about $17 billion of debt. Private buyers, financed by abundant securitised debt, are paying prices for single buildings that imply more than the whole company trades for.

An investment firm has approached the board with an unsolicited, all-cash proposal for the entire company at a premium to the share price. Credit spreads are at historic lows. Nobody in the room knows what 2008 will bring, and neither do you: decide on what is knowable now.`,
  objectives: ["Maximise risk-adjusted value for shareholders.", "Preserve the option to redeploy capital if the cycle turns.", "Avoid committing the enterprise to leverage that depends on today's credit markets persisting."],
  capitalSources: ["Public equity (the company's shares)", "Secured and unsecured corporate debt (about $17 billion outstanding)", "A private-equity buyer's fund equity plus acquisition debt", "A competing REIT's shares (stock consideration)"],
  evidence: ["eop-largest-office-landlord", "eop-amended-merger-55-50", "eop-vornado-competing-bid", "eop-shareholder-approval-2007", "eop-merger-effective-2007-02-09", "blackstone-resales-27b-2007", "macklowe-lost-towers-2008", "tribune-lbo-2007", "tribune-bankruptcy-dec-2008"],
  initialState: start,
  stages: [
    {
      key: "offer", title: "An unsolicited all-cash offer", when: "November 2006",
      briefing: `The buyer offers all cash for 100% of the shares at roughly a 10% premium to yesterday's close, financed by its own fund equity and a large acquisition loan it says is committed. The agreement would include a short window in which the board may solicit higher bids.

Your advisers note that the implied price per square foot is below recent single-asset trades in New York and Washington. Your CFO notes that the company could instead borrow against that same gap and buy more buildings.`,
      constraints: ["Fiduciary duty to shareholders.", "A binding agreement signed now can still be topped during the solicitation window.", "Leverage available today: lenders will finance up to about 80% of value on office at tight spreads."],
      options: [
        { key: "accept", label: "Accept the cash offer as proposed", detail: "Sign now at the 10% premium; take certainty, forgo the solicitation window.", apply: (s) => ({ ...s, equityValue: 24.2, liquidity: 24.2, debt: 0, assetValue: 0, flags: { ...s.flags, sold: true, premium: 0.10 }, log: [...s.log, "Accepted all-cash offer at a 10% premium; company sold."] }), scores: { financial_reasoning: 6, leverage_prudence: 9, diligence: 4, liquidity: 10, risk_adjusted_return: 6 }, feedback: "Certainty and liquidity at the top of the cycle were the right instincts, but signing without using the solicitation window left value on the table that a competitive process would have surfaced.", consequence: "The company is sold. You hold the proceeds." },
        { key: "negotiate", label: "Sign, but keep the solicitation window open and invite competing bids", detail: "Lock in the floor with a binding cash agreement and run a process to see whether anyone pays more.", apply: (s) => ({ ...s, flags: { ...s.flags, process: true }, log: [...s.log, "Signed a binding cash agreement with a go-shop window; invited competing bids."] }), scores: { financial_reasoning: 9, leverage_prudence: 8, diligence: 10, liquidity: 8, risk_adjusted_return: 8 }, feedback: "This mirrors the documented path: a binding cash floor plus competition. It costs nothing in certainty and tests the price.", consequence: "A competitive process begins. Within weeks a second group signals interest." },
        { key: "reject_lever", label: "Reject, stay public, and borrow against the valuation gap to buy more buildings", detail: "Raise about $8 billion of new debt and acquire office at today's prices, betting the public/private gap closes upward.", apply: (s) => ({ ...s, debt: s.debt + 8, assetValue: s.assetValue + 8, liquidity: 0.3, flags: { ...s.flags, levered: true }, log: [...s.log, "Rejected the offer; added $8bn of debt to buy more office at 2006–07 prices."] }), scores: { financial_reasoning: 3, leverage_prudence: 1, diligence: 4, liquidity: 1, risk_adjusted_return: 2 }, feedback: "Adding leverage at record prices to buy more of the same asset class reverses the Grave Dancer logic: it buys at the top with borrowed money and depends on credit markets staying open.", consequence: "You are now 64% levered against a portfolio marked at peak prices." },
      ],
      historical: { summary: "Equity Office signed an agreement with Blackstone affiliates in November 2006. The agreement was later amended after a competing proposal emerged, and shareholders approved it in February 2007.", claims: ["eop-amended-merger-55-50", "eop-shareholder-approval-2007"], documentedChoiceKey: "negotiate" },
    },
    {
      key: "competing_bid", title: "A higher headline, a softer offer", when: "January – February 2007",
      visibleWhen: (s) => s.flags.process === true,
      briefing: `A consortium led by a rival REIT proposes a higher headline price, about 2% above the cash bidder's latest number. Roughly 40% of the consideration would be the rival's shares, the proposal is non-binding, and it needs 60 days of diligence and a shareholder vote on its side.

The cash bidder responds by raising its all-cash price to about a 15% premium to the original close and tightening its financing commitments. Your shareholder meeting is in days.`,
      constraints: ["The stock component moves with the rival's share price until closing.", "A non-binding proposal can be withdrawn at any time.", "Your shareholders expect a recommendation now."],
      options: [
        { key: "cash", label: "Take the raised all-cash bid", detail: "About 15% over the original close, binding, financing committed.", apply: (s) => ({ ...s, equityValue: 25.3, liquidity: 25.3, debt: 0, assetValue: 0, flags: { ...s.flags, sold: true, premium: 0.15 }, log: [...s.log, "Sold for cash at a 15% premium; closed within weeks."] }), scores: { financial_reasoning: 10, leverage_prudence: 9, diligence: 9, liquidity: 10, risk_adjusted_return: 9 }, feedback: "A slightly lower headline with certainty of close and no exposure to a buyer's share price was the higher-value bid on a risk-adjusted basis. This is the documented outcome.", consequence: "The merger closes. You hold the proceeds." },
        { key: "stock", label: "Recommend the higher stock-and-cash proposal", detail: "Chase the 2% headline; accept 60 days of diligence and exposure to the rival's share price.", apply: (s) => ({ ...s, equityValue: 24.6, liquidity: 14.8, debt: 0, assetValue: 9.8, flags: { ...s.flags, sold: true, stockConsideration: true, premium: 0.12 }, log: [...s.log, "Recommended the stock-heavy bid; after diligence and a weaker rival share price the realised value was lower and 40% arrived as shares."] }), scores: { financial_reasoning: 4, leverage_prudence: 6, diligence: 3, liquidity: 4, risk_adjusted_return: 3 }, feedback: "A non-binding, partly-stock headline is not a price. In the modelled path the diligence period and a softer rival share price erased the premium and left 40% of the proceeds in another office REIT at the top of the cycle.", consequence: "Diligence drags on; the rival's shares slip. Part of your proceeds are now someone else's office stock." },
        { key: "holdout", label: "Reject both and hold out for more", detail: "Signal that neither bid is adequate and see who comes back.", apply: (s) => ({ ...s, flags: { ...s.flags, holdout: true }, log: [...s.log, "Rejected both bids; the cash bidder walked and the consortium's interest faded over the following quarters."] }), scores: { financial_reasoning: 2, leverage_prudence: 5, diligence: 4, liquidity: 2, risk_adjusted_return: 2 }, feedback: "With a binding cash offer at a 15% premium on the table at the peak of the credit cycle, holding out traded a certain outcome for an uncertain one with no new information to justify it.", consequence: "Both bidders withdraw. You remain public and fully invested in office." },
      ],
      historical: { summary: "A Vornado-led consortium proposed a higher, partly-stock, non-binding price and withdrew hours before the vote; Equity Office's shareholders approved the amended all-cash Blackstone offer of $55.50 per share with more than 92% of votes cast, and the merger became effective on February 9, 2007.", claims: ["eop-vornado-competing-bid", "eop-amended-merger-55-50", "eop-shareholder-approval-2007", "eop-merger-effective-2007-02-09"], documentedChoiceKey: "cash" },
    },
    {
      key: "proceeds", title: "What to do with the money", when: "Spring – autumn 2007",
      visibleWhen: (s) => s.flags.sold === true,
      briefing: `You and your partners now control a large pool of cash. Credit is still cheap. Three propositions are on your desk:

1. A leveraged buyout of a large media company whose cash flows are declining, structured with roughly 90% debt and an employee ownership plan as the equity holder, with a few hundred million of your own capital behind the debt.
2. Buying back office buildings from the acquirer, which is already reselling parts of the portfolio to leveraged buyers at prices above what it paid.
3. Committing a portion to a distressed-debt vehicle that will not draw capital until defaults rise, and holding the rest in liquid form.`,
      constraints: ["Your liquidity is the whole of your advantage; it can be spent only once.", "Leveraged buyers are financing with short-term debt that must be refinanced within one to three years."],
      options: [
        { key: "lbo", label: "Lead the media-company buyout", detail: "About $0.3bn of your capital behind roughly $12bn of new debt on a shrinking cash flow.", apply: (s) => ({ ...s, liquidity: s.liquidity - 0.3, debt: s.debt + 12, assetValue: s.assetValue + 12.3, flags: { ...s.flags, lbo: true }, log: [...s.log, "Led a 90%-debt buyout of a declining-cash-flow business."] }), scores: { financial_reasoning: 2, leverage_prudence: 1, diligence: 3, liquidity: 4, risk_adjusted_return: 1 }, feedback: "Maximum leverage against a declining cash flow, at the top of the credit cycle, with employees' retirement plan as the equity: this is the documented structure that ended in bankruptcy within a year. The capital at risk was limited, but the reputational and legal exposure was not.", consequence: "The deal closes in December 2007." },
        { key: "rebuy", label: "Buy office back from the acquirer at 80% leverage", detail: "Re-enter the asset class you just exited, financed with two-year debt.", apply: (s) => ({ ...s, liquidity: s.liquidity - 2, debt: s.debt + 8, assetValue: s.assetValue + 10, flags: { ...s.flags, rebuy: true }, log: [...s.log, "Bought office back at 2007 prices with 80% short-term leverage."] }), scores: { financial_reasoning: 2, leverage_prudence: 2, diligence: 4, liquidity: 3, risk_adjusted_return: 2 }, feedback: "This is the position of the buyers who purchased from the acquirer in 2007 with short-term debt; several lost the buildings when they could not refinance in 2008.", consequence: "You own towers again, financed with debt maturing in 2009." },
        { key: "drypowder", label: "Commit to distressed dry powder and hold the rest liquid", detail: "Capital committed but undrawn until defaults appear; the balance in cash and short-dated instruments.", apply: (s) => ({ ...s, flags: { ...s.flags, drypowder: true }, log: [...s.log, "Held liquidity; committed capital to a distressed vehicle that draws only when defaults rise."] }), scores: { financial_reasoning: 9, leverage_prudence: 10, diligence: 8, liquidity: 10, risk_adjusted_return: 8 }, feedback: "The Grave Dancer position: liquid when others are forced sellers. It forgoes return in 2007 and earns it in 2009–10.", consequence: "Nothing happens for a while. That is the point." },
      ],
      historical: { summary: "After the sale, the acquirer resold roughly $27 billion of the portfolio within five months, largely to leveraged buyers; one of them later lost seven towers when short-term debt could not be refinanced. Separately, in 2007 Zell led the roughly $8.2 billion ESOP-structured buyout of Tribune Company, which filed for Chapter 11 in December 2008.", claims: ["blackstone-resales-27b-2007", "macklowe-lost-towers-2008", "tribune-lbo-2007", "tribune-bankruptcy-dec-2008"], documentedChoiceKey: "lbo" },
    },
    {
      key: "shock", title: "The credit markets close", when: "September 2008 – 2009",
      briefing: `Securitised lending has stopped. Commercial property values are marked down roughly a third from the 2007 peak. Loans maturing in 2008–09 cannot be refinanced at anything like their original size. Forced sellers are appearing.

How you respond depends on the position you built. Choose your posture for the next eighteen months.`,
      options: [
        { key: "defend", label: "Defend every position: inject cash to cure defaults and extend loans", detail: "Use remaining liquidity to keep levered assets.", apply: (s) => applyShock(s, "defend"), scores: { financial_reasoning: 4, leverage_prudence: 3, diligence: 5, liquidity: 2, risk_adjusted_return: 3 }, feedback: "Curing defaults on assets marked a third lower spends scarce liquidity to protect equity that may already be gone. It is the choice that turns a loss into insolvency.", consequence: "Liquidity drains into maturing loans." },
        { key: "triage", label: "Triage: hand back the worst-levered assets to lenders, keep the rest", detail: "Accept losses where equity is gone; conserve cash for what can be saved.", apply: (s) => applyShock(s, "triage"), scores: { financial_reasoning: 8, leverage_prudence: 7, diligence: 7, liquidity: 7, risk_adjusted_return: 7 }, feedback: "Non-recourse debt exists for this moment. Returning keys where equity is gone and conserving liquidity is the disciplined response.", consequence: "Some assets go back to lenders; your cash position stabilises." },
        { key: "buy", label: "Buy distressed claims from forced sellers", detail: "Deploy liquidity (and any dry powder) into discounted debt and property.", apply: (s) => applyShock(s, "buy"), scores: { financial_reasoning: 9, leverage_prudence: 9, diligence: 8, liquidity: 6, risk_adjusted_return: 10 }, feedback: "Only possible if you preserved liquidity. Buying claims when sellers are forced is where the cycle pays those who waited.", consequence: "You are a buyer in a market with few buyers." },
      ],
      historical: { summary: "The 2008 freeze produced the documented outcomes above: refinancing failures among 2007's leveraged buyers and the Tribune bankruptcy. Zell's own sale of Equity Office in February 2007 preceded the crisis by about eighteen months.", claims: ["macklowe-lost-towers-2008", "tribune-bankruptcy-dec-2008", "eop-merger-effective-2007-02-09"] },
    },
  ],
  epilogue: (s) => {
    const parts = [`Modelled end state: equity value ${s.equityValue.toFixed(1)} vs 22.0 at the start; liquidity ${s.liquidity.toFixed(1)}; debt ${s.debt.toFixed(1)} (all in $ billions, hypothetical).`];
    if (s.flags.sold && s.flags.drypowder) parts.push("You sold into strength, stayed liquid and were a buyer in the downturn: the documented Zell exit without the documented Tribune mistake.");
    else if (s.flags.sold && s.flags.lbo) parts.push("You repeated the documented sequence: a well-timed sale followed by a maximum-leverage purchase of a declining business. The sale saved the fortune; the buyout cost part of it and a reputation.");
    else if (s.flags.levered || s.flags.rebuy) parts.push("Leverage taken at the top turned a strong position into a forced seller's. The lesson is not that office was bad; it is that the capital structure could not survive a closed credit market.");
    else if (s.flags.holdout) parts.push("Holding out at the peak converted a certain, high-value exit into a full-cycle drawdown.");
    else parts.push("You left value on the table but preserved the enterprise; a defensible, if not optimal, result.");
    return parts.join(" ");
  },
};

function applyShock(s: SimState, posture: "defend" | "triage" | "buy"): SimState {
  const next = structuredClone(s);
  const marked = next.assetValue * 0.65;             // −35% on all property-type assets
  const equityBefore = marked - next.debt + next.liquidity;
  next.log.push(`2008 shock: assets marked down 35% to ${marked.toFixed(1)}.`);
  if (posture === "defend") {
    const cure = Math.min(next.liquidity, Math.max(0, next.debt - marked * 0.6));
    next.liquidity -= cure; next.debt -= cure; next.assetValue = marked;
    next.log.push(`Injected ${cure.toFixed(1)} to cure maturing loans.`);
  } else if (posture === "triage") {
    const underwater = Math.max(0, next.debt - marked * 0.7);
    next.debt -= underwater; next.assetValue = marked - underwater * 0.9;
    next.log.push(`Returned ${underwater.toFixed(1)} of debt to lenders with the assets behind it.`);
  } else {
    const deploy = Math.min(next.liquidity * 0.6, 8);
    next.liquidity -= deploy; next.assetValue = marked + deploy * 1.45; // discounted claims recover at 1.45x by 2011 (assumption)
    next.log.push(`Deployed ${deploy.toFixed(1)} into distressed claims at a 1.45x modelled recovery.`);
    if (next.flags.drypowder) { next.assetValue += 2.0; next.log.push("Dry-powder vehicle drew and earned a modelled 2.0 of gains."); }
  }
  next.equityValue = Math.max(0, next.assetValue - next.debt + next.liquidity);
  if (next.flags.lbo) { next.equityValue = Math.max(0, next.equityValue - 0.3); next.log.push("The media buyout filed for bankruptcy; the capital behind its debt was lost."); }
  void equityBefore;
  return next;
}
