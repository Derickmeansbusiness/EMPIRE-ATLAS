import { describe, expect, it } from "vitest";
import { lindenCourt as c } from "@/fieldbook/challenges/linden-court";
import { reconcile, type FindingLike } from "@/fieldbook/reconcile";
import { buildSnapshot, reportHtml, reportMarkdown } from "@/fieldbook/report";
import { TEMPLATES, allItems, buildTemplate } from "@/fieldbook/templates";

const f = (over: Partial<FindingLike>): FindingLike => ({ id: "f", locationLabel: "Main lot", component: "paving", description: "Alligator cracking across the drive aisle", condition: "poor", severity: "material_repair", confidence: "medium", costLow: 10_000, costHigh: 20_000, costSource: "Own estimate, not a quote", specialistNeeded: null, followUpStatus: "open", photoCount: 1, ...over });

describe("statement-to-site reconciliation", () => {
  const findings = [f({}), f({ id: "g", component: "roof", locationLabel: "Building B roof", description: "Ponding stains visible from the ground", costLow: 30_000, costHigh: 50_000, specialistNeeded: "Roofing contractor" })];
  const r = reconcile(c, findings);
  it("sums recorded capital needs, including only costed findings", () => {
    expect(r.observed.capitalLow).toBe(40_000); expect(r.observed.capitalHigh).toBe(70_000); expect(r.observed.capitalMid).toBe(55_000);
    expect(r.observed.specialistCount).toBe(1); expect(r.observed.withPhotos).toBe(2);
    const un = reconcile(c, [f({ costLow: null, costHigh: null, costSource: null })]); expect(un.observed.uncosted).toBe(1); expect(un.observed.capitalHigh).toBe(0);
  });
  it("builds a base case whose loan is limited by DSCR (values hand-computed: loan = NOI ÷ 1.25 ÷ constant)", () => {
    const base = r.scenarios[0]!;
    expect(base.noi).toBeCloseTo(389_889.6, 6);
    expect(base.totalProjectCost).toBeCloseTo(6_800_000 * 1.02 + 55_000, 6);
    expect(base.loanLimitedBy).toBe("1.25x DSCR");
    expect(base.loan).toBeCloseTo(4_007_510.9899, 3);
    expect(base.annualDebtService).toBeCloseTo(389_889.6 / 1.25, 4);
    expect(base.dscr).toBeCloseTo(1.25, 9);
    expect(base.equity).toBeCloseTo(6_991_000 - 4_007_510.9899, 3);
    expect(base.cashFlowAfterDebt).toBeCloseTo(389_889.6 - 311_911.68, 4);
  });
  it("orders downside < base < upside and uses the stated capital ends", () => {
    const [b, d, u] = r.scenarios; expect(d!.noi).toBeLessThan(b!.noi); expect(u!.noi).toBeGreaterThan(b!.noi);
    expect(d!.capital).toBe(70_000); expect(u!.capital).toBe(40_000); expect(d!.name).toBe("Downside");
    expect(b!.assumptions.length).toBeGreaterThan(1);
  });
  it("raises questions, not accusations, and never edits the seller’s numbers", () => {
    const ids = r.crossChecks.map((x) => x.id); expect(ids).toContain("pavement"); expect(ids).toContain("reserves"); expect(ids).toContain("deferred");
    for (const ch of r.crossChecks) expect(ch.message).not.toMatch(/fraud|misrepresent|lied|deceiv/i);
    expect(r.seller.summary.noiBeforeReserves).toBe(492_980);
    expect(r.verified.find((v) => v.label === "Gross potential rent")!.status).toBe("reconciled");
    expect(r.verified.find((v) => v.label === "Vacancy")!.status).toBe("conflict");
    expect(r.verified.find((v) => v.label === "Insurance")!.status).toBe("unverified");
  });
  it("says so when there are no findings", () => {
    expect(reconcile(c, []).crossChecks.map((x) => x.id)).toEqual(["none"]);
  });
});

describe("report", () => {
  const input = { propertyName: "Linden Court Apartments", fictional: true, author: "A <b>Student</b>", date: "2026-10-30", challenge: c, findings: [f({ description: "<script>alert(1)</script> cracking" })], decision: "negotiate" as const, rationale: "Price must fall toward $5.4M & reserves added.", sessionDate: "2026-10-30", checklistProgress: { done: 3, total: 70 } };
  const snap = buildSnapshot(input);
  it("includes all six sections and the disclaimers in Markdown", () => {
    const md = reportMarkdown(snap);
    for (const h of ["1. What the seller reports", "2. What we observed", "3. What we can verify", "4. What we must investigate", "5. What we underwrite", "6. Investment implications"]) expect(md).toContain(h);
    expect(md).toContain("Screening decision: Negotiate"); expect(md).toContain("not a property condition assessment"); expect(md).toContain("Fictional training property");
  });
  it("escapes every user-supplied string in the HTML export", () => {
    const html = reportHtml(snap);
    expect(html).not.toContain("<script>alert(1)"); expect(html).toContain("&lt;script&gt;"); expect(html).not.toContain("<b>Student</b>"); expect(html).toContain("&amp;");
  });
});

describe("inspection templates", () => {
  it("cover all 17 categories for every asset class with unique item keys", () => {
    expect(TEMPLATES).toHaveLength(7);
    for (const t of TEMPLATES) {
      expect(t.categories.map((x) => x.number)).toEqual(Array.from({ length: 17 }, (_, i) => i + 1));
      const keys = allItems(t).map((x) => x.key); expect(new Set(keys).size).toBe(keys.length);
      for (const cat of t.categories) expect(cat.items.length).toBeGreaterThanOrEqual(2);
    }
  });
  it("uses class-specific interiors and never prompts entry to restricted areas", () => {
    expect(buildTemplate("hospitality").categories.find((x) => x.number === 8)!.title).toBe("Guest rooms and public spaces");
    const text = JSON.stringify(TEMPLATES);
    expect(text).not.toMatch(/climb onto the roof|open the panel|enter the mechanical/i);
  });
});

import { labQuery } from "@/fieldbook/reconcile";
describe("hand-off to the Capital Lab", () => {
  it("carries the verified base case into underwriter parameters in UI units", () => {
    const q = labQuery(c, reconcile(c, [f({})]));
    expect(q.purchasePrice).toBe("6800000"); expect(q.units).toBe("64"); expect(q.monthlyRentPerUnit).toBe("1135");
    expect(q.closingCostRate).toBe("2"); expect(q.initialCapex).toBe("15000");
    // vacancy + concessions + credit loss as a share of GPR: (82,920 + 6,400 + 14,200) / 871,680 = 11.8758…%
    expect(Number(q.vacancyRate)).toBeCloseTo(11.88, 2);
    // opex + reserves: 403,870.40 + 16,000 = 419,870.40
    expect(Number(q.operatingExpensesAnnual)).toBe(419_870);
    expect(Number(q.loanToValue)).toBeCloseTo((4_007_510.99 / 6_800_000) * 100, 2);
  });
});
