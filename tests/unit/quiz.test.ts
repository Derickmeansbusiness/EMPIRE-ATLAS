import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./helpers/db";
import type { AtlasDatabase } from "@/db/client";
import { seedResearch } from "@/db/seed";
import { getDossier } from "@/lib/data/research";
import { QUIZZES, getQuiz } from "@/quiz/bank";
import { gradeNumeric, gradeQuiz, gradeQuestion } from "@/quiz/grade";
import type { NumericQuestion } from "@/quiz/types";

let database: AtlasDatabase; let claimSlugs: Set<string>;
beforeAll(async () => { database = await freshDatabase(); await seedResearch(database.db); claimSlugs = new Set((await getDossier(database.db, "sam-zell"))!.claims.map((c) => c.slug)); });
afterAll(async () => { await database.close(); });

describe("quiz bank integrity", () => {
  it("ids are unique, answers are valid and every cited claim exists", () => {
    for (const quiz of QUIZZES) {
      const ids = quiz.questions.map((q) => q.id);
      expect(new Set(ids).size, `${quiz.slug} duplicate ids`).toBe(ids.length);
      expect(quiz.questions.length).toBeGreaterThanOrEqual(5);
      for (const q of quiz.questions) {
        expect(q.explanation.length).toBeGreaterThan(20);
        for (const c of q.claims ?? []) expect(claimSlugs.has(c), `${quiz.slug}/${q.id} cites unknown claim ${c}`).toBe(true);
        if (q.kind === "single") { expect(q.options.length).toBeGreaterThanOrEqual(3); expect(q.answer).toBeGreaterThanOrEqual(0); expect(q.answer).toBeLessThan(q.options.length); }
        else expect(Number.isFinite(q.expected())).toBe(true);
      }
      const singles = quiz.questions.filter((q) => q.kind === "single");
      if (singles.length >= 4) expect(new Set(singles.map((q) => (q as { answer: number }).answer)).size, `${quiz.slug} answer positions are not varied`).toBeGreaterThan(1);
    }
    expect(getQuiz("nope")).toBeNull();
  });
});

describe("calculation challenges match independently computed values", () => {
  // Expected values computed in Python (closed-form annuities, bisection IRR) — see docs/reports/PHASE-5-REPORT.md.
  const expected: Record<string, number> = { c1: 599.5505251527569, c2: 1.3995572497510311, c3: 62.5, c4: 847761.2636301381, c5: 8.896339469335002, c6: 12_500_000, c7: 469328.07680000056, c8: 9.175 };
  const quiz = getQuiz("capital-calculations")!;
  for (const [id, value] of Object.entries(expected)) {
    it(`${id} = ${value}`, () => {
      const q = quiz.questions.find((x) => x.id === id) as NumericQuestion;
      expect(q.expected()).toBeCloseTo(value, 6);
    });
  }
});

describe("grading", () => {
  const quiz = getQuiz("capital-calculations")!;
  it("accepts formatted numeric answers within tolerance and rejects others", () => {
    const c1 = quiz.questions[0] as NumericQuestion;
    expect(gradeNumeric(c1, "$599.55")).toBe(true);
    expect(gradeNumeric(c1, "599.5")).toBe(false);
    expect(gradeNumeric(c1, "")).toBe(false);
    expect(gradeNumeric(c1, "abc")).toBe(false);
    expect(gradeNumeric(c1, undefined)).toBe(false);
    const c3 = quiz.questions.find((q) => q.id === "c3") as NumericQuestion;
    expect(gradeNumeric(c3, "62.5%")).toBe(true);
    expect(gradeNumeric(c3, "62")).toBe(false);
    const c4 = quiz.questions.find((q) => q.id === "c4") as NumericQuestion;
    expect(gradeNumeric(c4, "847,761")).toBe(true);
  });
  it("scores a perfect attempt and a failing one against the pass mark", () => {
    const perfect = Object.fromEntries(quiz.questions.map((q) => [q.id, String(Number((q as NumericQuestion).expected().toFixed(2)))]));
    const r = gradeQuiz(quiz, perfect);
    expect(r.score).toBe(quiz.questions.length);
    expect(r.passed).toBe(true);
    const bad = gradeQuiz(quiz, { c1: "1", c2: "1" });
    expect(bad.passed).toBe(false);
    expect(bad.percent).toBeLessThan(quiz.passPercent);
  });
  it("single-choice: index 0 is gradable and wrong or blank answers fail", () => {
    const ev = getQuiz("reading-the-evidence")!;
    const q = ev.questions[4]!; // e5 answer index 2
    expect(gradeQuestion(q, "2").correct).toBe(true);
    expect(gradeQuestion(q, "0").correct).toBe(false);
    expect(gradeQuestion(q, "").correct).toBe(false);
    expect(gradeQuestion(q, undefined).correct).toBe(false);
    const z = getQuiz("zell-record")!.questions[2]!; // z3 answer index 0
    expect(gradeQuestion(z, "0").correct).toBe(true);
  });
});
