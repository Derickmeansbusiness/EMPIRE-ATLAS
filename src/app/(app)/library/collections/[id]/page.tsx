import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { collectionContents } from "@/lib/data/study";
import { deleteCollectionAction, removeFromReadingListAction } from "@/app/actions/study";
import { Button, EmptyState, PageHeader } from "@/components/ui/primitives";
import { VerificationBadge } from "@/components/research/status";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Collection" };

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = await getDb();
  const c = await collectionContents(db, user.id, id);
  if (!c) notFound();
  const isList = c.collection.kind === "reading_list";
  return (
    <>
      <PageHeader eyebrow={isList ? "Reading list" : "Folder"} title={c.collection.name} description={isList ? "Evidence, dossiers and transactions you intend to read. Add claims from any claim page." : "Notes filed here. Move a note from its own page."} actions={<form action={deleteCollectionAction}><input type="hidden" name="id" value={c.collection.id} /><Button type="submit" variant="danger">Delete</Button></form>} />
      {isList ? (
        c.items.length === 0 ? <EmptyState title="Nothing on this list yet" body="Open a claim record and use “Add to a reading list”." /> : (
          <ul className="space-y-2">{c.items.map(({ item, claim, investor, transaction }) => (
            <li key={item.id} className="card flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">{claim && <><VerificationBadge status={claim.verificationStatus} size="xs" /><Link href={`/evidence/claims/${claim.slug}`} className="mt-1 block text-sm text-ivory hover:text-gold">{claim.claimText}</Link></>}{investor && <Link href={`/dossiers/${investor.slug}`} className="text-sm text-ivory hover:text-gold">Dossier: {investor.fullName}</Link>}{transaction && <Link href={`/deals/${transaction.slug}`} className="text-sm text-ivory hover:text-gold">Deal: {transaction.name}</Link>}</div>
              <form action={removeFromReadingListAction}><input type="hidden" name="collectionId" value={c.collection.id} /><input type="hidden" name="itemId" value={item.id} /><button type="submit" className="text-xs text-slate-mist hover:text-risk">Remove</button></form>
            </li>))}</ul>
        )
      ) : (
        c.notes.length === 0 ? <EmptyState title="No notes in this folder" body="Open a note and choose this folder." /> : (
          <ul className="space-y-2">{c.notes.map((n) => <li key={n.id} className="card p-4"><Link href={`/library/notes/${n.id}`} className="font-serif text-lg text-ivory hover:text-gold">{n.title}</Link><p className="text-xs text-slate-mist">{formatRelative(n.updatedAt)}</p>{n.body && <p className="mt-1 line-clamp-2 text-sm text-platinum/70">{n.body}</p>}</li>)}</ul>
        )
      )}
      <p className="mt-6 text-xs text-slate-mist"><Link href="/library" className="hover:text-gold">← Back to library</Link></p>
    </>
  );
}
