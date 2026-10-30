import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { competencyFor } from "@/lib/data/progress";
import { listQuizAttempts } from "@/lib/data/study";
import { LEVELS } from "@/lib/competency";
import { TIERS } from "@/lib/entitlements";
import { QUIZZES } from "@/quiz/bank";
import { Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { formatRelative, researcherLabel } from "@/lib/format";
import { signOutAction } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Profile & Settings" };

export default async function ProfilePage() {
  const user = await requireUser();
  const db = await getDb();
  const [{ competency, program }, attempts] = await Promise.all([competencyFor(db, user.id), listQuizAttempts(db, user.id)]);
  const tier = TIERS.find((t) => t.key === user.membershipTier);
  return (
    <>
      <PageHeader eyebrow="Profile & Settings" title={user.displayName} description={researcherLabel(user.researcherNumber) ?? undefined} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <Eyebrow className="mb-2">Account</Eyebrow>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-mist">Email</dt><dd>{user.email}</dd></div>
            <div><dt className="text-slate-mist">Role</dt><dd>{ROLE_LABELS[user.role]}</dd></div>
            <div><dt className="text-slate-mist">Membership</dt><dd>{tier?.label ?? user.membershipTier} <span className="text-xs text-slate-mist">· {tier?.blurb}</span></dd></div>
            <div><dt className="text-slate-mist">Member since</dt><dd>{formatRelative(user.createdAt)}</dd></div>
            <div><dt className="text-slate-mist">Last sign-in</dt><dd>{formatRelative(user.lastSignInAt)}</dd></div>
          </dl>
          <form action={signOutAction} className="mt-5"><button type="submit" className="rounded-md border border-risk/50 px-4 py-2 text-sm text-risk hover:bg-risk/10 focus-ring">Sign out</button></form>
        </Card>
        <Card>
          <Eyebrow className="mb-2">Competency level</Eyebrow>
          <p className="font-serif text-3xl text-ivory">{competency.label}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-mist">Derived from completed quizzes, saved models, simulations, committee submissions, principles, your doctrine and program weeks. Time spent viewing content does not count.</p>
          {competency.next && <p className="mt-3 text-sm text-platinum/85">To reach <span className="text-gold-soft">{competency.next.label}</span>: {competency.next.missing.join("; ")}.</p>}
          <p className="mt-3 text-xs text-slate-mist">Program: {program.weeksComplete} of 24 weeks · Quizzes passed: {program.stats.quizzesPassed.length} of {QUIZZES.length}</p>
        </Card>
      </div>
      <Card className="mt-5">
        <Eyebrow className="mb-3">The six levels</Eyebrow>
        <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((l, i) => (
            <li key={l.key} className={`rounded-md border p-3 ${i === competency.index ? "border-gold bg-gold/10" : i < competency.index ? "border-positive/40" : "hairline"}`}>
              <p className="flex items-center justify-between font-serif text-lg text-ivory">{l.label}{i <= competency.index && <span className="text-xs text-positive">{i === competency.index ? "current" : "reached"}</span>}</p>
              <ul className="mt-1 space-y-0.5 text-xs text-platinum/75">{l.requires.map((r) => <li key={r}>· {r}</li>)}</ul>
            </li>
          ))}
        </ol>
      </Card>
      <Card className="mt-5">
        <Eyebrow className="mb-3">Achievements · {competency.achievements.filter((a) => a.earned).length} of {competency.achievements.length}</Eyebrow>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{competency.achievements.map((a) => <li key={a.key} className={`rounded-md border p-3 text-sm ${a.earned ? "border-gold/60 bg-gold/10" : "hairline opacity-70"}`}><p className="text-ivory">{a.label}<span className="sr-only">{a.earned ? " (earned)" : " (not earned)"}</span></p><p className="text-xs text-slate-mist">{a.description}</p></li>)}</ul>
      </Card>
      {attempts.length > 0 && <Card className="mt-5"><Eyebrow className="mb-3">Recent quiz attempts</Eyebrow><ul className="space-y-1 text-sm">{attempts.slice(0, 6).map((a) => <li key={a.id}><Link href={`/quizzes/${a.quizSlug}/results/${a.id}`} className="text-ivory hover:text-gold">{QUIZZES.find((q) => q.slug === a.quizSlug)?.title ?? a.quizSlug}</Link> <span className="text-xs text-slate-mist">· {a.score}/{a.maxScore} · {a.passed ? "passed" : "not passed"} · {formatRelative(a.createdAt)}</span></li>)}</ul></Card>}
    </>
  );
}
