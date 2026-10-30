import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getQuizAttempt } from "@/lib/data/study";
import { getQuiz } from "@/quiz/bank";
import { gradeQuiz } from "@/quiz/grade";
import { Card, PageHeader, Stat } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Quiz results" };

export default async function ResultsPage({ params }: { params: Promise<{ slug: string; attemptId: string }> }) {
  const user = await requireUser();
  const { slug, attemptId } = await params;
  const quiz = getQuiz(slug); if (!quiz) notFound();
  const db = await getDb();
  const attempt = await getQuizAttempt(db, user.id, attemptId);
  if (!attempt || attempt.quizSlug !== slug) notFound();
  const answers = attempt.answers as Record<string, string>;
  const result = gradeQuiz(quiz, answers);
  return (
    <>
      <PageHeader eyebrow={`${quiz.title} · results`} title={result.passed ? `Passed · ${result.percent}%` : `Not yet · ${result.percent}%`} description={result.passed ? "This pass counts toward your competency level and the program." : `You need ${quiz.passPercent}% to pass. Read the explanations, then try again.`} actions={<Link href={`/quizzes/${slug}`} className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold">Retake</Link>} />
      <div className="mb-5 grid grid-cols-3 gap-4"><Card><Stat label="Correct" value={`${result.score} / ${result.max}`} tone={result.passed ? "positive" : "risk"} /></Card><Card><Stat label="Pass mark" value={`${quiz.passPercent}%`} /></Card><Card><Stat label="Score" value={`${result.percent}%`} /></Card></div>
      <div className="space-y-4">
        {quiz.questions.map((q, i) => {
          const r = result.results[i]!;
          const given = q.kind === "single" ? (r.given !== "" && q.options[Number(r.given)] ? q.options[Number(r.given)]! : "No answer") : r.given || "No answer";
          return (
            <Card key={q.id}>
              <div className="flex items-start justify-between gap-3"><p className="text-sm text-ivory"><span className="mr-2 font-serif text-gold numeric">{i + 1}.</span>{q.prompt}</p><span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.12em] ${r.correct ? "border-positive/60 text-positive" : "border-risk/60 text-risk"}`}>{r.correct ? "Correct" : "Incorrect"}</span></div>
              <dl className="mt-3 grid gap-1 text-xs sm:grid-cols-[110px_1fr]"><dt className="text-slate-mist">Your answer</dt><dd className="text-platinum/90">{given}</dd>{!r.correct && <><dt className="text-slate-mist">Correct answer</dt><dd className="text-positive">{r.expectedLabel}</dd></>}</dl>
              <p className="mt-2 text-sm leading-relaxed text-platinum/80">{q.explanation}</p>
              {q.claims && q.claims.length > 0 && <p className="mt-2 text-xs">{q.claims.map((c) => <Link key={c} href={`/evidence/claims/${c}`} className="mr-3 text-gold hover:underline">Evidence: {c}</Link>)}</p>}
            </Card>
          );
        })}
      </div>
    </>
  );
}
