import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listQuizAttempts } from "@/lib/data/study";
import { QUIZZES } from "@/quiz/bank";
import { Card, PageHeader } from "@/components/ui/primitives";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Quizzes & Challenges" };
const CATEGORY: Record<string, string> = { evidence: "Evidence challenge", knowledge: "Knowledge quiz", calculation: "Calculation challenge", concepts: "Concepts quiz" };

export default async function QuizzesPage() {
  const user = await requireUser();
  const db = await getDb();
  const attempts = await listQuizAttempts(db, user.id);
  return (
    <>
      <PageHeader eyebrow="Quizzes & challenges" title="Prove it, don’t just read it" description="Questions are drawn from the dossier’s own claims and the lab’s own formulas. Calculation answers are checked against the same library the tools use. Passing is 70% and counts toward your competency level; viewing content never does." />
      <div className="grid gap-5 md:grid-cols-2">
        {QUIZZES.map((q) => {
          const mine = attempts.filter((a) => a.quizSlug === q.slug); const best = mine.reduce((b, a) => Math.max(b, Math.round((a.score / a.maxScore) * 100)), 0); const passed = mine.some((a) => a.passed);
          return (
            <Card key={q.slug}>
              <div className="flex items-center justify-between gap-2"><span className="text-xs uppercase tracking-[0.16em] text-gold">{CATEGORY[q.category]}</span>{passed && <span className="rounded-full border border-positive/60 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-positive">Passed</span>}</div>
              <h2 className="mt-1 font-serif text-2xl text-ivory"><Link href={`/quizzes/${q.slug}`} className="hover:text-gold">{q.title}</Link></h2>
              <p className="mt-1 text-sm text-platinum/75">{q.summary}</p>
              <p className="mt-3 text-xs text-slate-mist">{q.questions.length} questions · pass at {q.passPercent}% · {mine.length} attempt{mine.length === 1 ? "" : "s"}{mine.length ? ` · best ${best}% · last ${formatRelative(mine[0]!.createdAt)}` : ""}</p>
              <Link href={`/quizzes/${q.slug}`} className="mt-3 inline-block rounded-md bg-gold px-4 py-2 text-sm text-ink">{mine.length ? "Try again" : "Start"}</Link>
            </Card>
          );
        })}
      </div>
    </>
  );
}
