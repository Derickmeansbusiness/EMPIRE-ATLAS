import type { NumericQuestion, Question, Quiz, QuizResult } from "./types";

export function gradeNumeric(q: NumericQuestion, raw: string | undefined): boolean {
  if (raw == null) return false;
  const cleaned = raw.replace(/[$,%\s]/g, "");
  if (cleaned === "") return false;
  const n = Number(cleaned);
  return Number.isFinite(n) && Math.abs(n - q.expected()) <= q.tolerance;
}

export function gradeQuestion(q: Question, raw: string | undefined): { correct: boolean; expectedLabel: string } {
  if (q.kind === "single") {
    const correct = raw != null && raw !== "" && Number(raw) === q.answer;
    return { correct, expectedLabel: q.options[q.answer]! };
  }
  const e = q.expected();
  return { correct: gradeNumeric(q, raw), expectedLabel: `${Number(e.toFixed(4))} ${q.unit}`.trim() };
}

/** One point per question. */
export function gradeQuiz(quiz: Quiz, answers: Record<string, string>): QuizResult {
  const results = quiz.questions.map((q) => {
    const g = gradeQuestion(q, answers[q.id]);
    return { id: q.id, correct: g.correct, given: answers[q.id] ?? "", expectedLabel: g.expectedLabel };
  });
  const score = results.filter((r) => r.correct).length;
  const max = quiz.questions.length;
  const percent = max === 0 ? 0 : Math.round((score / max) * 100);
  return { score, max, percent, passed: percent >= quiz.passPercent, results };
}
