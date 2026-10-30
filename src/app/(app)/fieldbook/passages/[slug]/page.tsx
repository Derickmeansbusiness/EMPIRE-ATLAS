import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getPassageBySlug } from "@/lib/data/fieldbook";
import { recordProgress } from "@/lib/data/workspace";
import { ACTIVITY_SKILLS, DIMENSIONS, EVIDENCE_CLASS_HELP, EVIDENCE_CLASS_LABELS, FEATURED_PASSAGE } from "@/fieldbook/featured";
import { Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { PassageForm } from "@/components/fieldbook/passage-form";
import type { EvidenceClass } from "@/db/schema";

export const metadata: Metadata = { title: "Passage analysis" };
const CLASS_STYLE: Record<EvidenceClass, string> = {
  direct_source_claim: "border-sky-400/50 text-sky-300", verified_supporting_fact: "border-positive/60 text-positive", analytical_interpretation: "border-gold/60 text-gold",
  unsupported_conclusion: "border-risk/60 text-risk", hypothetical_application: "border-platinum/40 text-platinum",
};

export default async function PassagePage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(); const { slug } = await params;
  const db = await getDb(); const rec = await getPassageBySlug(db, slug); if (!rec) notFound();
  await recordProgress(db, user.id, "passage.read", undefined, undefined, { passageId: rec.passage.id });
  const { passage, statements, exercises } = rec;
  const counts = (Object.keys(EVIDENCE_CLASS_LABELS) as EvidenceClass[]).map((k) => [k, statements.filter((s) => s.evidenceClass === k).length] as const);
  return (
    <>
      <PageHeader eyebrow="Investor Mind Lab · Quote Anatomy" title={`${passage.author}, ${passage.location}`} description={<>From <em>{passage.sourceTitle}</em>. Ten-dimension analysis, with every statement labelled by how well it is supported.</>} actions={<Link href="/fieldbook" className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold">Fieldbook</Link>} />
      <Card className="mb-6">
        <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-slate-mist">Source</dt><dd className="text-ivory"><em>{passage.sourceTitle}</em></dd></div>
          <div><dt className="text-xs text-slate-mist">Author</dt><dd className="text-ivory">{passage.author}</dd></div>
          <div><dt className="text-xs text-slate-mist">Location</dt><dd className="text-ivory">{passage.location}</dd></div>
          <div><dt className="text-xs text-slate-mist">Publication date and edition</dt><dd className="text-ivory">Not recorded (unknown)</dd></div>
        </dl>
        <p className="mt-4 rounded-md border border-gold/40 bg-gold/5 p-3 text-sm text-platinum/90"><strong className="text-gold">First-person account.</strong> The personal claims below are the author’s own, and none has been independently corroborated. Atlas holds no copy of the passage text. This analysis works from a summary of what the passage covers: check it against your own copy, and add your short excerpt privately below.</p>
        <p className="mt-3 text-xs text-slate-mist">What the passage covers: {FEATURED_PASSAGE.coverage.join(" ")}</p>
      </Card>

      <section aria-label="Evidence classes" className="mb-8">
        <Eyebrow className="mb-3">How to read each statement</Eyebrow>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{counts.map(([k, n]) => <li key={k} className={`rounded-card border p-3 text-xs ${CLASS_STYLE[k]}`}><p className="font-medium">{EVIDENCE_CLASS_LABELS[k]} <span className="numeric">· {n}</span></p><p className="mt-1 text-platinum/70">{EVIDENCE_CLASS_HELP[k]}</p></li>)}</ul>
        {counts.find(([k]) => k === "verified_supporting_fact")![1] === 0 && <p className="mt-2 text-xs text-slate-mist">No verified supporting facts yet: nothing in this record has been independently corroborated.</p>}
      </section>

      <section aria-label="Activities and the skills they might build" className="mb-8">
        <Eyebrow className="mb-1">Which skills might each activity build?</Eyebrow>
        <p className="mb-3 text-sm text-platinum/75">Open an activity to see the skill, what the passage does not say, and the exercise that practises it.</p>
        <div className="space-y-2">{ACTIVITY_SKILLS.map((a) => { const ex = exercises.find((e) => e.slug === a.exercise); return (
          <details key={a.exercise} className="card" data-activity={a.exercise}>
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 p-4"><span className="text-ivory">{a.claim}</span><span className="shrink-0 text-xs text-gold">{ex?.skillLabel}</span></summary>
            <div className="space-y-3 border-t hairline p-4 text-sm">
              <div><p className="text-xs uppercase tracking-[0.14em] text-gold">Might build (interpretation)</p><ul className="mt-1 list-disc space-y-1 pl-5 text-platinum/85">{a.builds.map((b) => <li key={b}>{b}</li>)}</ul></div>
              <div><p className="text-xs uppercase tracking-[0.14em] text-risk">What the passage does not say</p><p className="mt-1 text-platinum/80">{a.doesNotSay}</p></div>
              {ex && <div><p className="text-xs uppercase tracking-[0.14em] text-gold">Practice exercise</p><p className="mt-1 text-platinum/85">{ex.modernExercise}</p>{ex.launchHref ? <Link href={ex.launchHref} className="mt-2 inline-block rounded-md bg-gold px-4 py-2 text-sm text-ink">{ex.skillKey === "operating-statement-analysis" ? "Launch the statement challenge" : "Open the exercise"}</Link> : <p className="mt-2 text-xs text-slate-mist">Interactive exercise planned. Not available yet.</p>}</div>}
            </div>
          </details>); })}</div>
      </section>

      <section aria-label="Ten-dimension analysis" className="space-y-4">
        <Eyebrow>Quote Anatomy: ten dimensions</Eyebrow>
        {DIMENSIONS.map((d) => { const items = statements.filter((s) => s.dimension === d.n); return (
          <Card key={d.n}>
            <h2 className="font-serif text-lg text-ivory"><span className="mr-2 text-gold numeric">{d.n}.</span>{d.title} <span className="text-sm text-slate-mist">· {d.question}</span></h2>
            <ul className="mt-3 space-y-2">{items.map((s) => <li key={s.id} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3"><span className={`w-fit shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.1em] ${CLASS_STYLE[s.evidenceClass]}`}>{EVIDENCE_CLASS_LABELS[s.evidenceClass]}</span><span className="text-sm leading-relaxed text-platinum/90">{s.body}</span></li>)}</ul>
          </Card>); })}
        <p className="text-xs text-slate-mist">AI-assisted analysis of passages you add is planned. AI output will always be labelled as interpretation, never as verified evidence. Nothing on this page has been generated by a model.</p>
      </section>

      <Card className="mt-8"><Eyebrow className="mb-3">Add your own copy of this passage (private)</Eyebrow><PassageForm defaults={{ sourceTitle: passage.sourceTitle, author: passage.author, location: passage.location ?? "" }} /></Card>
    </>
  );
}
