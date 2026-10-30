import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listAttempts, listMyPassages, listReports, listSessions, getProperty } from "@/lib/data/fieldbook";
import { CHALLENGES } from "@/fieldbook/challenges";
import { FEATURED_PASSAGE } from "@/fieldbook/featured";
import { Alert, Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { PassageForm } from "@/components/fieldbook/passage-form";
import { deletePassageAction } from "@/app/actions/fieldbook";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "The Investor’s Fieldbook" };

const STEPS = [
  { n: 1, verb: "Observe", text: "Read a sourced passage and separate what the author claims from what is verified." },
  { n: 2, verb: "Question", text: "Normalise a seller’s operating statement and write the questions it raises." },
  { n: 3, verb: "Verify", text: "Walk the property with a structured checklist and record findings with a cost source." },
  { n: 4, verb: "Underwrite", text: "Reconcile statement against site; build base, downside and upside cases." },
  { n: 5, verb: "Decide", text: "Save a screening report with your decision and reasons to your private library." },
];

export default async function FieldbookHome({ searchParams }: { searchParams: Promise<{ added?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser(); const db = await getDb();
  const [mine, reports, prop] = await Promise.all([listMyPassages(db, user.id), listReports(db, user.id), getProperty(db, user.id, "linden-court-apartments")]);
  const c = CHALLENGES[0]!; const attempts = await listAttempts(db, user.id, c.slug); const sessions = prop ? await listSessions(db, user.id, prop.id) : [];
  const best = attempts.reduce((b, a) => Math.max(b, a.score), 0);
  return (
    <>
      <PageHeader eyebrow="The Investor’s Fieldbook" title="Observe. Question. Verify. Underwrite. Decide." description="Where historical investing method becomes measurable acquisition skill. Everything here is training: the properties are fictional, the figures are invented, and nothing replaces professional due diligence." />
      {sp.added && <div className="mb-6"><Alert tone="success">Passage saved to your private notebook.</Alert></div>}
      <ol className="mb-8 grid gap-3 sm:grid-cols-5" aria-label="The Fieldbook method">{STEPS.map((s) => <li key={s.n} className="card p-4"><p className="font-serif text-lg text-gold"><span className="numeric mr-1">{s.n}.</span>{s.verb}</p><p className="mt-1 text-xs leading-relaxed text-platinum/75">{s.text}</p></li>)}</ol>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <Eyebrow>Step 1 · Investor Mind Lab</Eyebrow>
          <h2 className="mt-1 font-serif text-xl text-ivory"><Link href={`/fieldbook/passages/${FEATURED_PASSAGE.slug}`} className="hover:text-gold">{FEATURED_PASSAGE.author}: {FEATURED_PASSAGE.location}</Link></h2>
          <p className="mt-1 text-sm text-platinum/75"><em>{FEATURED_PASSAGE.sourceTitle}</em>. A first-person account of statement review, lender interviews, property walks and a long wait. Analysed across ten dimensions, with each statement labelled by how well it is supported.</p>
          <Link href={`/fieldbook/passages/${FEATURED_PASSAGE.slug}`} className="mt-4 inline-block rounded-md bg-gold px-4 py-2 text-sm text-ink">Read the analysis</Link>
        </Card>
        <Card>
          <Eyebrow>Steps 2 · 20-Statement Challenge</Eyebrow>
          <h2 className="mt-1 font-serif text-xl text-ivory"><Link href={`/fieldbook/challenges/${c.slug}`} className="hover:text-gold">{c.title}</Link></h2>
          <p className="mt-1 text-sm text-platinum/75">{c.subtitle} Case 1 of a planned set of twenty.</p>
          <p className="mt-2 text-xs text-slate-mist">{attempts.length ? `${attempts.length} attempt${attempts.length === 1 ? "" : "s"} · best ${best}/100 · last ${formatRelative(attempts[0]!.createdAt)}` : "Not attempted yet."}</p>
          <Link href={`/fieldbook/challenges/${c.slug}`} className="mt-4 inline-block rounded-md bg-gold px-4 py-2 text-sm text-ink">{attempts.length ? "Try again" : "Start the challenge"}</Link>
        </Card>
        <Card>
          <Eyebrow>Steps 3–5 · Property Intelligence Lab</Eyebrow>
          <h2 className="mt-1 font-serif text-xl text-ivory"><Link href="/fieldbook/properties/linden-court-apartments" className="hover:text-gold">Linden Court Apartments</Link></h2>
          <p className="mt-1 text-sm text-platinum/75">The fictional property behind the challenge. Walk it, record findings, reconcile them against the seller’s statement and save a screening report.</p>
          <p className="mt-2 text-xs text-slate-mist">{sessions.length} walk{sessions.length === 1 ? "" : "s"} · {reports.length} saved report{reports.length === 1 ? "" : "s"}</p>
          <Link href="/fieldbook/properties/linden-court-apartments" className="mt-4 inline-block rounded-md bg-gold px-4 py-2 text-sm text-ink">Open the property</Link>
        </Card>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card>
          <Eyebrow className="mb-3">Your saved reports</Eyebrow>
          {reports.length === 0 ? <p className="text-sm text-platinum/75">None yet. Reports are saved to your private library when you finish a reconciliation.</p> : <ul className="space-y-2">{reports.map((r) => <li key={r.id}><Link href={`/fieldbook/reports/${r.id}`} className="text-ivory hover:text-gold">{r.title}</Link> <span className="text-xs text-slate-mist">· {formatRelative(r.createdAt)}</span></li>)}</ul>}
        </Card>
        <Card>
          <Eyebrow className="mb-3">Your passages (private)</Eyebrow>
          {mine.length === 0 ? <p className="text-sm text-platinum/75">Add a short excerpt from a book, letter or interview below. Only you can see it.</p> : (
            <ul className="space-y-3">{mine.map((p) => (
              <li key={p.id} className="border-b hairline pb-3 text-sm"><p className="text-ivory">{p.sourceTitle} <span className="text-slate-mist">· {p.author}{p.location ? ` · ${p.location}` : ""}</span></p>{p.excerpt && <blockquote className="mt-1 border-l-2 border-gold/50 pl-3 text-platinum/80">{p.excerpt}</blockquote>}{p.isFirstPerson && <p className="mt-1 text-xs text-gold-soft">First-person account, uncorroborated.</p>}
                <form action={deletePassageAction} className="mt-1"><input type="hidden" name="id" value={p.id} /><button type="submit" className="text-xs text-risk hover:underline">Delete</button></form></li>
            ))}</ul>
          )}
        </Card>
      </div>
      <Card className="mt-8"><Eyebrow className="mb-3">Add a passage to your notebook</Eyebrow><PassageForm /></Card>
      <p className="mt-8 text-xs leading-relaxed text-slate-mist">Educational training only. The Fieldbook does not provide investment advice, appraisals, property condition assessments or any professional due diligence. Passages you add are private; do not paste whole chapters, and respect each work’s copyright.</p>
    </>
  );
}
