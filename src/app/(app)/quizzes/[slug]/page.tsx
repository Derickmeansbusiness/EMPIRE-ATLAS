import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getQuiz } from "@/quiz/bank";
import { submitQuizAction } from "@/app/actions/study";
import { Button, Card, PageHeader } from "@/components/ui/primitives";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const q = getQuiz((await params).slug); return { title: q ? q.title : "Quiz" }; }

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const quiz = getQuiz((await params).slug);
  if (!quiz) notFound();
  return (
    <>
      <PageHeader eyebrow={`${quiz.questions.length} questions · pass at ${quiz.passPercent}%`} title={quiz.title} description={quiz.summary} />
      <form action={submitQuizAction} className="space-y-5">
        <input type="hidden" name="quiz" value={quiz.slug} />
        {quiz.questions.map((q, i) => (
          <Card key={q.id}>
            <fieldset>
              <legend className="mb-3 text-sm leading-relaxed text-ivory"><span className="mr-2 font-serif text-gold numeric">{i + 1}.</span>{q.prompt}</legend>
              {q.kind === "single" ? (
                <div className="space-y-2">{q.options.map((o, j) => (
                  <label key={j} htmlFor={`${q.id}-${j}`} className="flex cursor-pointer items-start gap-3 rounded-md border hairline px-3 py-2 text-sm text-platinum/90 has-[:checked]:border-gold has-[:checked]:bg-gold/10"><input id={`${q.id}-${j}`} type="radio" name={`q_${q.id}`} value={j} className="mt-1 accent-[#C19B63]" /><span>{o}</span></label>
                ))}</div>
              ) : (
                <div className="flex items-center gap-2"><label htmlFor={`${q.id}-n`} className="sr-only">Your answer in {q.unit || "units"}</label><input id={`${q.id}-n`} name={`q_${q.id}`} inputMode="decimal" autoComplete="off" className="w-48 rounded-md border border-platinum/20 bg-midnight/70 px-3 py-2 text-sm text-ivory numeric" /><span className="text-sm text-slate-mist">{q.unit}</span></div>
              )}
            </fieldset>
          </Card>
        ))}
        <Button type="submit">Submit answers</Button>
        <p className="text-xs text-slate-mist">Unanswered questions count as incorrect. You can retake the quiz as often as you like; only a pass counts toward progression.</p>
      </form>
    </>
  );
}
