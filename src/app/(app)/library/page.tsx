import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listBookmarks, listNotes } from "@/lib/data/workspace";
import { listCollections } from "@/lib/data/study";
import { createCollectionAction } from "@/app/actions/study";
import { Button, Input, Select } from "@/components/ui/primitives";
import { Alert, Card, EmptyState, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { NoteForm } from "@/components/workspace/note-form";
import { formatRelative } from "@/lib/format";
import { VerificationBadge } from "@/components/research/status";

export const metadata: Metadata = { title: "Research Library" };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ deleted?: string; saved?: string; q?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const db = await getDb();
  const [notesAll, bookmarks, collections] = await Promise.all([listNotes(db, user.id), listBookmarks(db, user.id), listCollections(db, user.id)]);
  const q = (sp.q ?? "").trim().toLowerCase();
  const notes = q ? notesAll.filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q))) : notesAll;
  const tags = Array.from(new Set(notesAll.flatMap((n) => n.tags))).sort();
  return (
    <>
      <PageHeader eyebrow="Research Library" title="Notes, bookmarks and evidence cards" description="Private to your account. Notes attached to a claim, investor or transaction stay linked to the evidence. File notes in folders and gather sources into reading lists." actions={<a href="/library/export" className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold">Export notes (Markdown)</a>} />
      {sp.deleted && <div className="mb-6"><Alert tone="success">Note deleted.</Alert></div>}
      {sp.saved && <div className="mb-6"><Alert tone="success">Note saved.</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <form method="get" className="flex gap-2"><input name="q" defaultValue={sp.q ?? ""} placeholder="Search notes and tags" className="w-full rounded-md border border-platinum/20 bg-midnight/70 px-3 py-2 text-sm text-ivory placeholder:text-slate-mist focus:border-gold focus:outline-none" aria-label="Search notes" /><button type="submit" className="rounded-md border border-platinum/25 px-4 text-sm text-platinum hover:border-gold hover:text-gold">Search</button></form>
            {tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{tags.map((t) => <Link key={t} href={`/library?q=${encodeURIComponent(t)}`} className="rounded-full border border-platinum/15 px-2 py-0.5 text-[0.65rem] text-platinum/70 hover:border-gold hover:text-gold">#{t}</Link>)}</div>}
          </Card>
          <section>
            <Eyebrow className="mb-3">Notes · {notes.length}</Eyebrow>
            {notes.length === 0 ? <EmptyState title="No notes yet" body="Write one here or from any dossier, transaction or claim page." /> : (
              <ul className="space-y-2">
                {notes.map((n) => (
                  <li key={n.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/library/notes/${n.id}`} className="font-serif text-lg text-ivory hover:text-gold">{n.title}</Link>
                      <span className="shrink-0 text-xs text-slate-mist">{formatRelative(n.updatedAt)}</span>
                    </div>
                    {n.body && <p className="mt-1 line-clamp-2 text-sm text-platinum/70">{n.body}</p>}
                    <p className="mt-2 text-[0.65rem] uppercase tracking-[0.14em] text-slate-mist">{n.linkedKind ? `linked to ${n.linkedKind}` : "unlinked"}{n.tags.length ? ` · ${n.tags.join(", ")}` : ""}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <aside className="space-y-6">
          <Card><Eyebrow className="mb-3">New note</Eyebrow><NoteForm /></Card>
          <Card>
            <Eyebrow className="mb-3">Folders &amp; reading lists · {collections.length}</Eyebrow>
            {collections.length > 0 && <ul className="mb-4 space-y-1.5 text-sm">{collections.map((c) => <li key={c.id}><Link href={`/library/collections/${c.id}`} className="text-ivory hover:text-gold">{c.name}</Link> <span className="text-xs text-slate-mist">· {c.kind === "folder" ? "folder" : "reading list"}</span></li>)}</ul>}
            <form action={createCollectionAction} className="space-y-2">
              <label htmlFor="col-name" className="sr-only">Collection name</label><Input id="col-name" name="name" required maxLength={80} placeholder="e.g. Zell: distressed" />
              <label htmlFor="col-kind" className="sr-only">Kind</label><Select id="col-kind" name="kind" defaultValue="folder"><option value="folder">Folder for notes</option><option value="reading_list">Reading list for evidence</option></Select>
              <Button type="submit" variant="secondary" className="w-full">Create</Button>
            </form>
          </Card>
          <Card>
            <Eyebrow className="mb-3">Bookmarks · {bookmarks.length}</Eyebrow>
            {bookmarks.length === 0 ? <p className="text-sm text-slate-mist">Bookmark a claim from any dossier to collect evidence cards here.</p> : (
              <ul className="space-y-3">
                {bookmarks.map((b) => (
                  <li key={b.bookmark.id} className="text-sm">
                    {b.claim && <><VerificationBadge status={b.claim.verificationStatus} size="xs" /><Link href={`/evidence/claims/${b.claim.slug}`} className="mt-1 block text-platinum/90 hover:text-gold">{b.claim.claimText}</Link></>}
                    {b.investor && <Link href={`/dossiers/${b.investor.slug}`} className="text-platinum/90 hover:text-gold">Dossier: {b.investor.fullName}</Link>}
                    {b.transaction && <Link href={`/deals/${b.transaction.slug}`} className="text-platinum/90 hover:text-gold">Deal: {b.transaction.name}</Link>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
