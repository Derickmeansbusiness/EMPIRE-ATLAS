import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getDossier } from "@/lib/data/research";
import { bookmarkedIds, listNotes, recordProgress } from "@/lib/data/workspace";
import { can } from "@/lib/auth/roles";
import { Alert, Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { EvidenceLegend, VerificationBadge } from "@/components/research/status";
import { DossierBody } from "@/components/research/claim-text";
import { ClaimCard } from "@/components/research/claim-card";
import { Timeline } from "@/components/research/timeline";
import { NoteForm } from "@/components/workspace/note-form";
import { toggleBookmarkAction } from "@/app/actions/workspace";
import { formatHistoricalDate, formatRelative } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const db = await getDb();
  const d = await getDossier(db, slug, true);
  return { title: d ? `${d.investor.fullName} — Dossier` : "Dossier" };
}

export default async function DossierPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string; mode?: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const sp = await searchParams;
  const db = await getDb();
  const dossier = await getDossier(db, slug, can(user.role, "research:read_drafts"));
  if (!dossier) notFound();
  const { investor, sections, events, claims, claimMap, claimById, quotes, transactions, relationships } = dossier;
  await recordProgress(db, user.id, "dossier.opened", "investor", investor.id);
  const [claimBookmarks, investorBookmarks, notes] = await Promise.all([bookmarkedIds(db, user.id, "claim"), bookmarkedIds(db, user.id, "investor"), listNotes(db, user.id, { linkedKind: "investor", linkedId: investor.id })]);
  const reading = sp.mode === "reading";
  const returnTo = `/dossiers/${investor.slug}`;
  const confidenceCounts = claims.reduce<Record<string, number>>((acc, c) => { acc[c.verificationStatus] = (acc[c.verificationStatus] ?? 0) + 1; return acc; }, {});
  const divisions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <>
      {investor.publishStatus !== "published" && <div className="mb-6"><Alert tone="warning">Draft dossier — visible to editors only. Not published.</Alert></div>}
      {sp.saved === "note" && <div className="mb-6"><Alert tone="success">Note saved to your library.</Alert></div>}
      <PageHeader
        eyebrow={`Empire dossier · ${investor.eraLabel}`}
        title={investor.fullName}
        description={investor.headline}
        actions={
          <>
            <Link href={`${returnTo}${reading ? "" : "?mode=reading"}`} className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold focus-ring">{reading ? "Research mode" : "Reading mode"}</Link>
            <form action={toggleBookmarkAction}>
              <input type="hidden" name="targetKind" value="investor" /><input type="hidden" name="targetId" value={investor.id} /><input type="hidden" name="returnTo" value={returnTo} />
              <button type="submit" className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs focus-ring ${investorBookmarks.has(investor.id) ? "border-gold text-gold" : "border-platinum/25 text-platinum hover:border-gold hover:text-gold"}`}>
                {investorBookmarks.has(investor.id) ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />} {investorBookmarks.has(investor.id) ? "Saved" : "Save dossier"}
              </button>
            </form>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card light={reading} className={reading ? "reading-mode" : ""}>
          <p className={`text-sm leading-relaxed ${reading ? "font-serif text-lg text-ink/85" : "text-platinum/85"}`}>{investor.summary}</p>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
            <div><dt className={reading ? "text-ink/60" : "text-slate-mist"}>Born</dt><dd className="numeric">{investor.bornYear ?? "—"}</dd></div>
            <div><dt className={reading ? "text-ink/60" : "text-slate-mist"}>Died</dt><dd className="numeric">{investor.diedYear ?? "—"}</dd></div>
            <div><dt className={reading ? "text-ink/60" : "text-slate-mist"}>Asset classes</dt><dd>{investor.primaryAssetClasses.join(", ")}</dd></div>
            <div><dt className={reading ? "text-ink/60" : "text-slate-mist"}>Sourced claims</dt><dd className="numeric">{claims.length}</dd></div>
          </dl>
        </Card>
        <Card>
          <Eyebrow className="mb-2">Evidence confidence</Eyebrow>
          <ul className="space-y-1.5">
            {Object.entries(confidenceCounts).map(([s, n]) => <li key={s} className="flex items-center justify-between text-xs"><VerificationBadge status={s as never} size="xs" /><span className="numeric">{n}</span></li>)}
          </ul>
          <p className="mt-3 text-[0.65rem] leading-relaxed text-slate-mist">Counts are computed from the claim records behind this dossier. Numbered chips in the text link to the evidence.</p>
        </Card>
      </div>

      <nav aria-label="Dossier divisions" className="mt-8 flex flex-wrap gap-1.5">
        {sections.map((s) => <a key={s.division} href={`#division-${s.division}`} className="rounded-full border border-platinum/15 px-2.5 py-1 text-[0.65rem] text-platinum/75 hover:border-gold hover:text-gold">{s.division}. {s.title}</a>)}
        <a href="#timeline" className="rounded-full border border-platinum/15 px-2.5 py-1 text-[0.65rem] text-platinum/75 hover:border-gold hover:text-gold">Timeline</a>
        <a href="#evidence" className="rounded-full border border-platinum/15 px-2.5 py-1 text-[0.65rem] text-platinum/75 hover:border-gold hover:text-gold">Evidence</a>
        <a href="#notes" className="rounded-full border border-platinum/15 px-2.5 py-1 text-[0.65rem] text-platinum/75 hover:border-gold hover:text-gold">My notes</a>
      </nav>

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {divisions.map((n) => {
            const s = sections.find((x) => x.division === n);
            return (
              <section key={n} id={`division-${n}`} className={`card scroll-mt-24 p-5 sm:p-7 ${reading ? "reading-mode card-light" : ""}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className={`editorial-h2 text-2xl ${reading ? "text-ink" : "text-ivory"}`}><span className={`mr-3 font-serif ${reading ? "text-[#8a6a35]" : "text-gold/70"} numeric`}>{String(n).padStart(2, "0")}</span>{s?.title ?? "Not yet researched"}</h2>
                  {s && <VerificationBadge status={s.evidenceConfidence} size="xs" />}
                </div>
                <div className={`mt-4 ${reading ? "text-ink/90" : "text-platinum/90"}`}>
                  {s ? <DossierBody body={s.bodyMarkdown} claimMap={claimMap} light={reading} /> : <p className="text-sm text-slate-mist">This division has not been written. It will appear when its claims are sourced.</p>}
                </div>
              </section>
            );
          })}

          <section id="timeline" className="card scroll-mt-24 p-5 sm:p-7">
            <Eyebrow className="mb-1">Biographical timeline</Eyebrow>
            <h2 className="editorial-h2 mb-6 text-2xl">Milestones with their evidence</h2>
            <Timeline events={events} claimById={claimById} hrefForEvent={(e) => (e.transactionId ? `/deals/${transactions.find((t) => t.id === e.transactionId)?.slug ?? ""}` : null)} />
          </section>

          <section id="evidence" className="scroll-mt-24">
            <Eyebrow className="mb-1">Research evidence</Eyebrow>
            <h2 className="editorial-h2 mb-3 text-2xl">{claims.length} sourced claims</h2>
            <div className="mb-5 card p-4"><EvidenceLegend /></div>
            <div className="space-y-3">
              {claims.map((c) => <ClaimCard key={c.id} claim={c} bookmarked={claimBookmarks.has(c.id)} returnTo={`${returnTo}#claim-${c.slug}`} />)}
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          {transactions.length > 0 && (
            <Card>
              <Eyebrow className="mb-2">Reconstructed transactions</Eyebrow>
              <ul className="space-y-2">
                {transactions.map((t) => <li key={t.id}><Link href={`/deals/${t.slug}`} className="text-sm text-ivory hover:text-gold">{t.name}</Link><p className="text-xs text-slate-mist">{formatHistoricalDate(t.closedOn, t.datePrecision)} · {t.headlineValueLabel}</p></li>)}
              </ul>
            </Card>
          )}
          <Card>
            <Eyebrow className="mb-2">Documented institutions &amp; relationships</Eyebrow>
            <ul className="space-y-1.5 text-xs text-platinum/85">
              {relationships.filter((r) => r.institution).map((r) => (
                <li key={r.rel.id} className="flex items-start justify-between gap-2">
                  <span><span className="text-slate-mist">{r.rel.relationship.replace(/_/g, " ")}</span> <Link href={`/institutions/${r.institution!.slug}`} className="hover:text-gold">{r.institution!.name}</Link>{r.rel.startYear ? <span className="text-slate-mist"> · {r.rel.startYear}</span> : null}</span>
                  {r.claim && <Link href={`/evidence/claims/${r.claim.slug}`} className="shrink-0"><VerificationBadge status={r.claim.verificationStatus} size="xs" /></Link>}
                </li>
              ))}
            </ul>
            <Link href={`/network?investor=${investor.slug}`} className="mt-3 inline-block text-xs text-slate-mist hover:text-gold">Capital network →</Link>
          </Card>
          {quotes.length > 0 && (
            <Card>
              <Eyebrow className="mb-2">Quotations</Eyebrow>
              {quotes.map(({ q, source }) => (
                <blockquote key={q.id} className="mb-4 border-l-2 border-gold pl-3 last:mb-0">
                  <p className="font-serif text-base text-ivory">“{q.quoteText}”</p>
                  <footer className="mt-1 text-xs text-slate-mist">{q.context} {source && <>— <Link href={`/evidence/sources/${source.slug}`} className="text-gold-soft hover:underline">{source.title}</Link></>} <VerificationBadge status={q.verificationStatus} size="xs" /></footer>
                </blockquote>
              ))}
            </Card>
          )}
          <Card>
            <Eyebrow className="mb-2">On wealth figures</Eyebrow>
            <p className="text-xs leading-relaxed text-platinum/75">This dossier states no net-worth figure. Estimated net worth (a third party’s guess at personal assets minus liabilities), enterprise value (debt plus equity of a company), asset value (what properties would sell for) and equity value (asset value minus debt) are different numbers and are never interchangeable.</p>
          </Card>
          <Card>
            <div id="notes" className="scroll-mt-24">
              <Eyebrow className="mb-2">My notes on this dossier</Eyebrow>
              {notes.length > 0 && <ul className="mb-4 space-y-1.5">{notes.map((n) => <li key={n.id}><Link href={`/library/notes/${n.id}`} className="text-sm text-ivory hover:text-gold">{n.title}</Link><span className="ml-2 text-xs text-slate-mist">{formatRelative(n.updatedAt)}</span></li>)}</ul>}
              <NoteForm linkedKind="investor" linkedId={investor.id} returnTo={returnTo} compact />
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
