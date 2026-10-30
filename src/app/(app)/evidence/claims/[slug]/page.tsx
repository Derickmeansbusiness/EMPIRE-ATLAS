import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getClaimBySlug } from "@/lib/data/research";
import { bookmarkedIds, listNotes } from "@/lib/data/workspace";
import { listCollections } from "@/lib/data/study";
import { addToReadingListAction } from "@/app/actions/study";
import { Button, Select } from "@/components/ui/primitives";
import { can } from "@/lib/auth/roles";
import { Alert, Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { VERIFICATION_META, VerificationBadge } from "@/components/research/status";
import { ClaimCard } from "@/components/research/claim-card";
import { NoteForm } from "@/components/workspace/note-form";
import { ReviewForm } from "@/components/research/review-form";
import { formatRelative } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return { title: `Claim ${(await params).slug}` };
}

export default async function ClaimPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string; reviewed?: string; listed?: string }> }) {
  const user = await requireUser();
  const { slug } = await params; const sp = await searchParams;
  const db = await getDb();
  const record = await getClaimBySlug(db, slug, can(user.role, "research:read_drafts"));
  if (!record) notFound();
  const { claim, investor, transaction, reviews } = record;
  const [bookmarks, notes, lists] = await Promise.all([bookmarkedIds(db, user.id, "claim"), listNotes(db, user.id, { linkedKind: "claim", linkedId: claim.id }), listCollections(db, user.id)]);
  const readingLists = lists.filter((c) => c.kind === "reading_list");
  const returnTo = `/evidence/claims/${claim.slug}`;
  return (
    <>
      {sp.saved === "note" && <div className="mb-6"><Alert tone="success">Note saved and linked to this claim.</Alert></div>}
      {sp.reviewed && <div className="mb-6"><Alert tone="success">Verification status updated and logged.</Alert></div>}
      {sp.listed && <div className="mb-6"><Alert tone="success">Added to your reading list.</Alert></div>}
      <PageHeader eyebrow="Evidence record" title="Claim" description={<span className="flex flex-wrap gap-2 text-xs">{investor && <Link href={`/dossiers/${investor.slug}`} className="text-gold hover:underline">{investor.fullName}</Link>}{transaction && <Link href={`/deals/${transaction.slug}`} className="text-gold hover:underline">· {transaction.name}</Link>}</span>} />
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <ClaimCard claim={claim} bookmarked={bookmarks.has(claim.id)} returnTo={returnTo} />
          <Card>
            <Eyebrow className="mb-2">What this status means</Eyebrow>
            <p className="text-sm text-platinum/85"><VerificationBadge status={claim.verificationStatus} /> </p>
            <p className="mt-2 text-sm text-platinum/75">{VERIFICATION_META[claim.verificationStatus].description}</p>
            <p className="mt-3 text-xs text-slate-mist">Last reviewed: {claim.lastReviewedAt ? formatRelative(claim.lastReviewedAt) : "not yet reviewed by a human editor (status set at seed time by the research author)"}.</p>
          </Card>
          <Card>
            <Eyebrow className="mb-2">Verification history</Eyebrow>
            {reviews.length === 0 ? <p className="text-sm text-slate-mist">No reviews recorded.</p> : (
              <ul className="space-y-2 text-xs">{reviews.map((r) => <li key={r.id} className="border-l-2 border-gold/40 pl-3"><p className="text-ivory">{r.from_status ?? "—"} → {r.to_status} <span className="text-slate-mist">· {r.reviewer_name ?? "system"} · {formatRelative(r.created_at)}</span></p>{r.note && <p className="text-platinum/70">{r.note}</p>}</li>)}</ul>
            )}
          </Card>
          {can(user.role, "claims:review") && <Card><Eyebrow className="mb-2">Editor review</Eyebrow><ReviewForm claimId={claim.id} current={claim.verificationStatus} returnTo={returnTo} /></Card>}
        </div>
        <aside className="space-y-5">
          {readingLists.length > 0 && (
            <Card>
              <Eyebrow className="mb-2">Add to a reading list</Eyebrow>
              <form action={addToReadingListAction} className="space-y-2"><input type="hidden" name="targetKind" value="claim" /><input type="hidden" name="targetId" value={claim.id} /><input type="hidden" name="returnTo" value={returnTo} />
                <label htmlFor="rl" className="sr-only">Reading list</label><Select id="rl" name="collectionId">{readingLists.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
                <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">Add</Button></form>
            </Card>
          )}
          <Card>
            <Eyebrow className="mb-2">My notes on this claim</Eyebrow>
            {notes.length > 0 && <ul className="mb-4 space-y-1.5">{notes.map((n) => <li key={n.id}><Link href={`/library/notes/${n.id}`} className="text-sm text-ivory hover:text-gold">{n.title}</Link></li>)}</ul>}
            <NoteForm linkedKind="claim" linkedId={claim.id} returnTo={returnTo} compact />
          </Card>
        </aside>
      </div>
    </>
  );
}
