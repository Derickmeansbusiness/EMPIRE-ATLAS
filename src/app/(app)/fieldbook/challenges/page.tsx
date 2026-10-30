import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listAttempts } from "@/lib/data/fieldbook";
import { CHALLENGES } from "@/fieldbook/challenges";
import { Card, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Underwriting challenges" };
export default async function ChallengesPage() {
  const user = await requireUser(); const db = await getDb();
  const rows = await Promise.all(CHALLENGES.map(async (c) => ({ c, attempts: await listAttempts(db, user.id, c.slug) })));
  return (
    <>
      <PageHeader eyebrow="The 20-Statement Challenge" title="Underwriting challenges" description="Fictional operating statements with a model solution. You normalise the numbers, flag anomalies, write diligence questions and recommend a course of action. One case is live; nineteen more are planned." />
      <div className="grid gap-5 md:grid-cols-2">{rows.map(({ c, attempts }) => (
        <Card key={c.slug}><span className="text-xs uppercase tracking-[0.16em] text-gold">{c.difficulty}</span>
          <h2 className="mt-1 font-serif text-2xl text-ivory"><Link href={`/fieldbook/challenges/${c.slug}`} className="hover:text-gold">{c.title}</Link></h2>
          <p className="mt-1 text-sm text-platinum/75">{c.subtitle}</p>
          <p className="mt-2 text-xs text-slate-mist">{attempts.length ? `${attempts.length} attempt${attempts.length === 1 ? "" : "s"}, latest ${attempts[0]!.score}/${attempts[0]!.maxScore}` : "Not attempted yet"}</p>
          <Link href={`/fieldbook/challenges/${c.slug}`} className="mt-3 inline-block rounded-md bg-gold px-4 py-2 text-sm text-ink">{attempts.length ? "Try again" : "Start"}</Link></Card>))}</div>
    </>
  );
}
