import { describe, expect, it } from "vitest";
import { addDays, completedDaysByWeek, fullWeeks, ritualStreak, weekStartOf, weekdayNumber } from "@/lib/ritual";
import { hasFeature, minimumTierFor, tierHasFeature } from "@/lib/entitlements";
import { computeCompetency, LEVELS, type CompetencyStats } from "@/lib/competency";
import { CURRICULUM, MONTHS, evaluateCheck, recommendedWeek, weekStatuses, type ActivityStats } from "@/program/curriculum";
import { QUIZZES } from "@/quiz/bank";
import { SCENARIOS } from "@/simulation";
import { DOCTRINE_FIELDS, doctrineHtml, doctrineMarkdown, escapeHtml, filledCount } from "@/lib/doctrine";
import { FIELD_DIVISIONS, excerptFor, investorProfile, PRINCIPLE_PROMPTS } from "@/lib/synthesis";
import { MODEL_KINDS } from "@/lib/data/models";

describe("ritual calendar", () => {
  it("finds Monday (UTC) and the weekday number", () => {
    expect(weekStartOf(new Date("2026-10-28T12:00:00Z"))).toBe("2026-10-26"); // Wednesday
    expect(weekStartOf(new Date("2026-10-26T00:00:00Z"))).toBe("2026-10-26");
    expect(weekStartOf(new Date("2026-11-01T23:59:00Z"))).toBe("2026-10-26"); // Sunday
    expect(weekdayNumber(new Date("2026-10-26T10:00:00Z"))).toBe(1);
    expect(weekdayNumber(new Date("2026-11-01T10:00:00Z"))).toBe(7);
    expect(addDays("2026-10-26", -7)).toBe("2026-10-19");
  });
  it("counts full weeks and streaks of weeks with at least three days", () => {
    const e = [1, 2, 3, 4, 5].map((d) => ({ weekStart: "2026-10-19", day: d })).concat([1, 2, 3].map((d) => ({ weekStart: "2026-10-12", day: d })), [1].map((d) => ({ weekStart: "2026-10-05", day: d })));
    expect(fullWeeks(e)).toBe(1);
    expect(completedDaysByWeek(e).get("2026-10-12")!.size).toBe(3);
    // Current week (10-26) has nothing yet, so the streak counts from last week: 10-19 (5) and 10-12 (3), stopping at 10-05 (1).
    expect(ritualStreak(e, new Date("2026-10-28T12:00:00Z"))).toBe(2);
    expect(ritualStreak([], new Date("2026-10-28T12:00:00Z"))).toBe(0);
    expect(ritualStreak(e.concat([1, 2, 3].map((d) => ({ weekStart: "2026-10-26", day: d }))), new Date("2026-10-28T12:00:00Z"))).toBe(3);
  });
});

describe("entitlements", () => {
  it("allows everything when enforcement is off", () => {
    expect(hasFeature({ tier: "explorer", role: "student", feature: "lab", enforce: false })).toBe(true);
  });
  it("maps tiers to features when enforced, and never gates owners or administrators", () => {
    expect(tierHasFeature("explorer", "dossiers")).toBe(false);
    expect(tierHasFeature("researcher", "dossiers")).toBe(true);
    expect(tierHasFeature("researcher", "lab")).toBe(false);
    expect(tierHasFeature("professional", "lab")).toBe(true);
    expect(tierHasFeature("professional", "cohorts")).toBe(false);
    expect(tierHasFeature("institutional", "cohorts")).toBe(true);
    expect(hasFeature({ tier: "researcher", role: "student", feature: "simulator", enforce: true })).toBe(false);
    expect(hasFeature({ tier: "professional", role: "student", feature: "simulator", enforce: true })).toBe(true);
    expect(hasFeature({ tier: "explorer", role: "platform_owner", feature: "cohorts", enforce: true })).toBe(true);
    expect(hasFeature({ tier: "bogus", role: "student", feature: "lab", enforce: true })).toBe(false);
    expect(minimumTierFor("historian")).toBe("professional");
    expect(minimumTierFor("quizzes")).toBe("researcher");
  });
});

const empty: CompetencyStats = { quizzesPassed: [], allQuizSlugs: QUIZZES.map((q) => q.slug), modelKinds: [], notes: 0, simulationBest: {}, committeeBest: null, committeeApproved: false, principles: 0, doctrineFieldsFilled: 0, programWeeksComplete: 0 };

describe("competency progression", () => {
  it("starts as an apprentice and advances only on completed exercises", () => {
    expect(computeCompetency(empty).label).toBe("Research Apprentice");
    const a = computeCompetency({ ...empty, quizzesPassed: ["zell-record"], modelKinds: ["underwriter"], notes: 1 });
    expect(a.label).toBe("Deal Analyst");
    expect(a.next?.label).toBe("Credit Architect");
    expect(a.next?.missing).toEqual(expect.arrayContaining(["Pass the evidence quiz", "Pass the capital calculations quiz"]));
    const c = computeCompetency({ ...empty, quizzesPassed: ["reading-the-evidence", "capital-calculations"], modelKinds: ["underwriter", "debt", "credit"], notes: 2 });
    expect(c.label).toBe("Credit Architect");
    const s = computeCompetency({ ...empty, quizzesPassed: ["reading-the-evidence", "capital-calculations"], modelKinds: ["underwriter", "debt", "credit"], notes: 2, simulationBest: { a: 60 }, committeeBest: { score: 62, verdict: "approved_with_conditions" } });
    expect(s.label).toBe("Acquisition Strategist");
    const cs = computeCompetency({ ...empty, quizzesPassed: ["reading-the-evidence", "capital-calculations"], modelKinds: ["underwriter", "debt", "credit"], notes: 2, simulationBest: { a: 72, b: 75 }, committeeBest: { score: 80, verdict: "approved" }, committeeApproved: true, principles: 3 });
    expect(cs.label).toBe("Capital Strategist");
    const ea = computeCompetency({ ...empty, quizzesPassed: QUIZZES.map((q) => q.slug), modelKinds: ["underwriter", "debt", "credit"], notes: 2, simulationBest: { a: 90, b: 75 }, committeeBest: { score: 80, verdict: "approved" }, committeeApproved: true, principles: 3, doctrineFieldsFilled: 8, programWeeksComplete: 12 });
    expect(ea.label).toBe("Empire Architect");
    expect(ea.next).toBeNull();
    expect(ea.achievements.filter((x) => x.earned).length).toBeGreaterThan(8);
  });
  it("levels are sequential: a later requirement does not skip an earlier one", () => {
    const r = computeCompetency({ ...empty, simulationBest: { a: 90 }, committeeBest: { score: 90, verdict: "approved" }, committeeApproved: true, principles: 5 });
    expect(r.label).toBe("Research Apprentice");
    expect(LEVELS).toHaveLength(6);
  });
});

describe("curriculum integrity", () => {
  const dossierSlugs = new Set(["sam-zell"]); const dealSlugs = new Set(["equity-office-sale-2007"]); const scenarioSlugs = new Set(SCENARIOS.map((s) => s.slug)); const quizSlugs = new Set(QUIZZES.map((q) => q.slug));
  it("has 24 sequential weeks, four per month, with unique task keys and valid references", () => {
    expect(CURRICULUM.map((w) => w.week)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    expect(MONTHS).toHaveLength(6);
    for (const w of CURRICULUM) {
      expect(w.month).toBe(Math.ceil(w.week / 4));
      expect(w.tasks.length).toBeGreaterThanOrEqual(1);
      expect(new Set(w.tasks.map((t) => t.key)).size, `week ${w.week} duplicate task keys`).toBe(w.tasks.length);
      expect(w.objectives.length).toBeGreaterThan(0);
      for (const t of w.tasks) {
        if (t.href) expect(t.href.startsWith("/")).toBe(true);
        const c = t.check;
        if (c.type === "dossier") expect(dossierSlugs.has(c.slug)).toBe(true);
        if (c.type === "deal") expect(dealSlugs.has(c.slug)).toBe(true);
        if (c.type === "simulation") expect(scenarioSlugs.has(c.slug)).toBe(true);
        if (c.type === "quiz") expect(quizSlugs.has(c.slug)).toBe(true);
        if (c.type === "model") expect((MODEL_KINDS as readonly string[]).includes(c.kind)).toBe(true);
      }
      if (w.selfDirected) expect(w.tasks.some((t) => t.check.type === "manual"), `week ${w.week} is self-directed but has no manual task`).toBe(true);
    }
  });
  it("auto tasks complete from activity; manual tasks need a recorded completion", () => {
    const s: ActivityStats = { dossiersOpened: ["sam-zell"], transactionsOpened: [], casesOpened: [], modelKinds: { debt: 1 }, simulationBest: {}, committeeCount: 0, committeeBest: null, committeeApproved: false, quizzesPassed: ["reading-the-evidence"], principles: 0, notes: 1, doctrineFieldsFilled: 0, ritualDays: 0, activity: {} };
    expect(evaluateCheck({ type: "dossier", slug: "sam-zell" }, s)).toBe(true);
    expect(evaluateCheck({ type: "quiz", slug: "zell-record" }, s)).toBe(false);
    expect(evaluateCheck({ type: "manual" }, s)).toBeNull();
    const none = weekStatuses(s, new Set());
    expect(none[0]!.doneCount).toBe(2); // dossier + evidence quiz; methodology is manual
    expect(none[0]!.complete).toBe(false);
    expect(recommendedWeek(none)).toBe(1);
    const done = weekStatuses(s, new Set(["1:methodology"]));
    expect(done[0]!.complete).toBe(true);
    expect(recommendedWeek(done)).toBe(2);
  });
});

describe("doctrine export", () => {
  const input = { author: "Ada <script>alert(1)</script>", researcherLabel: "Researcher 001", date: "2026-10-30", doctrine: { targetAssets: "Garden apartments & townhomes.\n\nNever hotels.", exitStrategies: "Sale in year 5 <b>or</b> refinance." }, principles: [{ title: "Liquidity first", statement: "Keep reserves.", sourceInvestor: "Samuel Zell", claimText: "Merger effective Feb 9, 2007.", claimStatus: "Verified from primary documentation", modernApplication: "Hold 12 months of carry." }] };
  it("escapes every user-supplied string in the HTML export", () => {
    const html = doctrineHtml(input);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<b>or</b>");
    expect(html).toContain("Garden apartments &amp; townhomes.");
    expect(html).toContain("Not yet written.");
    expect(escapeHtml(`"'<>&`)).toBe("&quot;&#39;&lt;&gt;&amp;");
  });
  it("produces a Markdown document with all eight sections and the supporting principles", () => {
    const md = doctrineMarkdown(input);
    for (const f of DOCTRINE_FIELDS) expect(md).toContain(`## ${f.label}`);
    expect(md).toContain("### 1. Liquidity first");
    expect(md).toContain("**Source:** Samuel Zell");
    expect(md).toContain("not investment advice");
  });
  it("counts only substantive sections as filled", () => {
    expect(filledCount(null)).toBe(0);
    expect(filledCount({ targetAssets: "short" })).toBe(0);
    expect(filledCount({ targetAssets: "Garden apartments in secondary markets.", exitStrategies: "Sell in year five or refinance." })).toBe(2);
  });
});

describe("strategy comparison mapping", () => {
  const sections = [3, 5, 6, 9, 10].map((d) => ({ division: d, title: `T${d}`, bodyMarkdown: `First para ${d}.\n\nSecond para ${d}.\n\nThird para ${d}.` }));
  it("selects the best available division and trims to two paragraphs", () => {
    expect(excerptFor(sections, "financingCriteria")?.division).toBe(5);
    expect(excerptFor(sections, "targetAssets")?.division).toBe(9);
    expect(excerptFor(sections, "riskTolerance")?.division).toBe(10);
    expect(excerptFor(sections, "geographicStrategy")?.excerpt).toBe("First para 3.\n\nSecond para 3.");
    expect(excerptFor([], "exitStrategies")).toBeNull();
    expect(investorProfile(sections)).toHaveLength(8);
    expect(Object.keys(FIELD_DIVISIONS)).toHaveLength(8);
  });
  it("every starter principle cites a claim in the corpus", async () => {
    expect(PRINCIPLE_PROMPTS).toHaveLength(6);
    const { zellDossier } = await import("@/db/seed/zell");
    const slugs = new Set(zellDossier.claims.map((c) => c.slug));
    for (const p of PRINCIPLE_PROMPTS) expect(slugs.has(p.claim), p.title).toBe(true);
  });
});
