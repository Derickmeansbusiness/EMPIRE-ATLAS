import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listSubmissions } from "@/lib/data/simulations";
import { COMMITTEE_DIMENSIONS } from "@/simulation/committee";
import { Card, EmptyState, Eyebrow, LinkButton, PageHeader } from "@/components/ui/primitives";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Investment Committee" };

export default async function CommitteePage() {
  const user = await requireUser();
  const db = await getDb();
  const subs = await listSubmissions(db, user.id);
  return (
    <>
      <PageHeader eyebrow="Investment Committee Chamber" title="Defend the decision" description="Submit a thesis, the asset or loan, sources and uses, assumptions, capital stack, risks, sensitivity, exit and a recommendation. A transparent rules-based framework scores evidence quality, financial correctness, risk identification, capital efficiency, downside resilience and strategic consistency, and returns a memo." actions={<LinkButton href="/committee/new">New submission</LinkButton>} />
      {subs.length === 0 ? <EmptyState title="No submissions yet" body="Attach a saved underwriting model so the committee can check the numbers and stress-test the downside." action={<LinkButton href="/committee/new">Prepare a submission</LinkButton>} /> : (
        <ul className="space-y-2">
          {subs.map((s) => (
            <li key={s.id} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><Link href={`/committee/${s.id}`} className="font-serif text-lg text-ivory hover:text-gold">{s.title}</Link><p className="text-xs text-slate-mist">{formatRelative(s.createdAt)} · sponsor recommended {s.recommendation.replace(/_/g, " ")}{s.modelId ? " · model attached" : " · no model"}</p></div>
              <div className="flex items-center gap-3"><span className={`rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] ${s.verdict === "approved" ? "border-positive/60 text-positive" : s.verdict === "declined" ? "border-risk/60 text-risk" : "border-gold/60 text-gold-soft"}`}>{s.verdict.replace(/_/g, " ")}</span><span className="font-serif text-xl numeric text-ivory">{s.score}</span></div>
            </li>
          ))}
        </ul>
      )}
      <Card className="mt-6"><Eyebrow className="mb-2">Evaluation framework</Eyebrow><ul className="grid gap-1 text-xs text-platinum/75 sm:grid-cols-2">{COMMITTEE_DIMENSIONS.map((d) => <li key={d.key}>· {d.label} (0–10)</li>)}</ul><p className="mt-2 text-xs text-slate-mist">Approved needs 75+ overall and at least 6/10 on financial correctness; 60–74 is approved with conditions; 40–59 is sent back; below 40 is declined. Every point is explained in the memo.</p></Card>
    </>
  );
}
