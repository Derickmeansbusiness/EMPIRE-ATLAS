import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./helpers/db";
import type { AtlasDatabase } from "@/db/client";
import { createUser } from "@/lib/auth/service";
import { seedResearch } from "@/db/seed";
import { SCENARIOS, activeStages, debrief, getScenario, isComplete, playerView, scoreAttempt } from "@/simulation";
import { evaluateSubmission } from "@/simulation/committee";
import { createSubmission, getAttempt, getSubmission, recordChoice, startAttempt } from "@/lib/data/simulations";
import { getDossier } from "@/lib/data/research";

describe("simulation engine", () => {
  const office = getScenario("office-portfolio-top-of-cycle-2007")!;
  it("player view exposes no outcomes before a decision", () => {
    const v = playerView(office, { choices: [] })!;
    expect(v.key).toBe("offer");
    expect(v.index).toBe(1);
    const json = JSON.stringify(v);
    for (const forbidden of ["feedback", "consequence", "historical", "scores", "apply", "Blackstone", "$55.50"]) expect(json.includes(forbidden), `player view leaks ${forbidden}`).toBe(false);
    expect(() => debrief(office, { choices: [] })).toThrow(/sealed/);
  });
  it("conditional stages depend on earlier choices", () => {
    const negotiated = activeStages(office, { choices: [{ stageKey: "offer", optionKey: "negotiate" }] });
    expect(playerView(office, { choices: [{ stageKey: "offer", optionKey: "negotiate" }] })!.key).toBe("competing_bid");
    expect(negotiated.state.flags.process).toBe(true);
    // Rejecting skips the competing bid and the proceeds stage
    expect(playerView(office, { choices: [{ stageKey: "offer", optionKey: "reject_lever" }] })!.key).toBe("shock");
  });
  it("the documented path scores highest and the leveraged path scores lowest", () => {
    const documented = { choices: [{ stageKey: "offer", optionKey: "negotiate" }, { stageKey: "competing_bid", optionKey: "cash" }, { stageKey: "proceeds", optionKey: "drypowder" }, { stageKey: "shock", optionKey: "buy" }] };
    const zellActual = { choices: [{ stageKey: "offer", optionKey: "negotiate" }, { stageKey: "competing_bid", optionKey: "cash" }, { stageKey: "proceeds", optionKey: "lbo" }, { stageKey: "shock", optionKey: "triage" }] };
    const levered = { choices: [{ stageKey: "offer", optionKey: "reject_lever" }, { stageKey: "shock", optionKey: "defend" }] };
    expect(isComplete(office, documented)).toBe(true);
    const a = debrief(office, documented); const b = debrief(office, zellActual); const c = debrief(office, levered);
    expect(a.score.total).toBeGreaterThan(b.score.total);
    expect(b.score.total).toBeGreaterThan(c.score.total);
    expect(a.finalState.equityValue).toBeGreaterThan(c.finalState.equityValue);
    expect(a.score.total).toBeGreaterThanOrEqual(85);
    expect(c.score.total).toBeLessThan(40);
    expect(a.epilogue).toMatch(/without the documented Tribune mistake/);
    expect(b.results[2]!.stage.historical.claims).toContain("tribune-bankruptcy-dec-2008");
  });
  it("rejects out-of-order or unknown choices", () => {
    expect(() => activeStages(office, { choices: [{ stageKey: "shock", optionKey: "buy" }] })).toThrow(/order/);
    expect(() => activeStages(office, { choices: [{ stageKey: "offer", optionKey: "nope" }] })).toThrow(/Unknown option/);
  });
  it("scores are bounded and every scenario cites real claims", async () => {
    const empty = scoreAttempt([]);
    expect(empty.total).toBe(0);
    const database = await freshDatabase(); await seedResearch(database.db);
    const d = await getDossier(database.db, "sam-zell");
    const slugs = new Set(d!.claims.map((c) => c.slug));
    for (const s of SCENARIOS) {
      for (const c of s.evidence) expect(slugs.has(c), `${s.slug} cites unknown claim ${c}`).toBe(true);
      for (const st of s.stages) for (const c of st.historical.claims) expect(slugs.has(c), `${s.slug}/${st.key} cites unknown claim ${c}`).toBe(true);
    }
    await database.close();
  });
  it("Meridian Court: equity carry and an accepted payoff beats a levered contested foreclosure", () => {
    const m = getScenario("meridian-court-lender-negotiation")!;
    const good = debrief(m, { choices: [{ stageKey: "bid", optionKey: "bid68" }, { stageKey: "carry", optionKey: "equity" }, { stageKey: "dpo", optionKey: "accept" }] });
    const bad = debrief(m, { choices: [{ stageKey: "bid", optionKey: "bid80" }, { stageKey: "carry", optionKey: "bridge" }, { stageKey: "dpo", optionKey: "refuse" }, { stageKey: "foreclosure_event", optionKey: "extend" }] });
    // good: 12,000 − 9,100 − 38×6 + 10,660 = 13,332
    expect(good.finalState.equityValue).toBeCloseTo(13_332, 6);
    expect(good.finalState.flags.months).toBe(6);
    expect(bad.finalState.equityValue).toBeLessThan(good.finalState.equityValue);
    expect(good.score.total).toBeGreaterThan(bad.score.total);
  });
});

describe("investment committee evaluation", () => {
  const model = { purchasePrice: 10_000_000, closingCostRate: 0.02, initialCapex: 200_000, units: 100, monthlyRentPerUnit: 1_000, otherIncomeAnnual: 30_000, vacancyRate: 0.05, operatingExpensesAnnual: 480_000, rentGrowth: 0.03, expenseGrowth: 0.02, loanToValue: 0.65, annualRate: 0.065, amortizationYears: 30, interestOnlyYears: 0, holdingPeriodYears: 5, exitCapRate: 0.07, saleCostRate: 0.02 };
  const strong = {
    title: "Fictional garden apartments", thesis: "word ".repeat(130) + "We buy below conservative intrinsic value and underwrite to trailing NOI, with a sources-and-uses that includes reserves [[claim:carter-hawley-hale-1991]] [[claim:grave-dancer-essay-1976]] [[claim:eqr-ipo-august-1993]].",
    assetDetails: "112 units", sourcesAndUses: "Sources: equity and senior loan. Uses: price, closing costs, reserves.", assumptionsNarrative: "Rents from comparable leases and the rent roll; expenses from the trailing-12 source documents.",
    capitalStack: "Senior loan at 65% LTV; no mezzanine.", risks: "Refinancing and interest rate risk at maturity; liquidity reserves of six months of carry; rent and occupancy softness from new supply; renovation execution and capex overruns; insurance and property tax reassessment. " + "mitigation ".repeat(60),
    sensitivity: "Stress scenarios: rates +200 bps, values −20%, rents −10%, occupancy −10 points, expenses +15%, and a combined downside; refinancing sized at 65% LTV and 1.25x DSCR.", exitStrategy: "Sale in year 5 to a core buyer at a 7.0% cap rate, with a refinancing fallback if the market is closed; 5-year hold.",
    recommendation: "approve" as const, model, citedClaims: ["carter-hawley-hale-1991", "grave-dancer-essay-1976", "eqr-ipo-august-1993"],
  };
  it("a complete, modelled submission is approved with explained findings", () => {
    const e = evaluateSubmission(strong);
    expect(e.total).toBeGreaterThanOrEqual(75);
    expect(e.verdict).toBe("approved");
    expect(e.dimensions.find((d) => d.key === "strategic_consistency")!.findings.join(" ")).toMatch(/5-year hold matches/);
    expect(e.memo).toMatch(/Investment Committee Memo/);
    expect(e.memo).toMatch(/not investment advice/);
  });
  it("a thin submission without a model is sent back", () => {
    const e = evaluateSubmission({ ...strong, thesis: "Buy it, it is cheap.", risks: "None really.", sensitivity: "", exitStrategy: "Sell later.", model: null, citedClaims: [] });
    expect(e.total).toBeLessThan(40);
    expect(e.verdict).toBe("declined");
    expect(e.dimensions.find((d) => d.key === "financial_correctness")!.findings[0]).toMatch(/No underwriting model/);
  });
  it("approving a deal that fails its own coverage is flagged", () => {
    const e = evaluateSubmission({ ...strong, model: { ...model, loanToValue: 0.85, annualRate: 0.09 } });
    const sc = e.dimensions.find((d) => d.key === "strategic_consistency")!;
    expect(sc.findings.join(" ")).toMatch(/inconsistent/);
    expect(e.verdict).not.toBe("approved");
  });
});

describe("attempts and submissions are user-scoped", () => {
  let database: AtlasDatabase; let alice: string; let bob: string;
  beforeAll(async () => { database = await freshDatabase(); await seedResearch(database.db); alice = (await createUser(database.db, { email: "a@x.com", password: "alice-passphrase-1", displayName: "A" })).id; bob = (await createUser(database.db, { email: "b@x.com", password: "bob-passphrase-123", displayName: "B" })).id; });
  afterAll(async () => { await database.close(); });
  it("records choices in order, completes and scores, and hides from other users", async () => {
    const a = await startAttempt(database.db, alice, "office-portfolio-top-of-cycle-2007");
    expect(await getAttempt(database.db, bob, a.id)).toBeNull();
    expect(await recordChoice(database.db, bob, a.id, "offer", "accept")).toBeNull();
    await expect(recordChoice(database.db, alice, a.id, "shock", "buy")).rejects.toThrow(/Stage mismatch/);
    expect(await recordChoice(database.db, alice, a.id, "offer", "accept")).toEqual({ completed: false });
    expect(await recordChoice(database.db, alice, a.id, "proceeds", "drypowder")).toEqual({ completed: false });
    expect(await recordChoice(database.db, alice, a.id, "shock", "buy")).toEqual({ completed: true });
    const done = await getAttempt(database.db, alice, a.id);
    expect(done!.status).toBe("completed");
    expect((done!.score as { total: number }).total).toBeGreaterThan(0);
    expect(await recordChoice(database.db, alice, a.id, "shock", "buy")).toBeNull();
  });
  it("submissions evaluate on create and stay private", async () => {
    const s = await createSubmission(database.db, alice, { title: "Test", thesis: "A thesis long enough to pass validation and explain the plan in a few sentences.", assetDetails: "", sourcesAndUses: "", assumptionsNarrative: "", capitalStack: "", risks: "Refinancing risk and liquidity.", sensitivity: "", exitStrategy: "Sale in year 5; 5-year hold.", recommendation: "approve_with_conditions", modelId: null });
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.memoMarkdown).toMatch(/Investment Committee Memo/);
    expect(await getSubmission(database.db, bob, s.id)).toBeNull();
    expect((await getSubmission(database.db, alice, s.id))?.id).toBe(s.id);
  });
});
