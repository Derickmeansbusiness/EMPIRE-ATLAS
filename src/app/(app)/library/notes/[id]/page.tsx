import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getNote } from "@/lib/data/workspace";
import { listCollections } from "@/lib/data/study";
import { assignNoteAction } from "@/app/actions/study";
import { Select } from "@/components/ui/primitives";
import { caseStudies, claims, investors, transactions } from "@/db/schema";
import { Button, Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { EditNoteForm } from "@/components/workspace/note-form";
import { deleteNoteAction } from "@/app/actions/workspace";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Note" };

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = await getDb();
  const note = await getNote(db, user.id, id);
  if (!note) notFound();
  const folders = (await listCollections(db, user.id)).filter((c) => c.kind === "folder");
  let linkHref: string | null = null; let linkLabel: string | null = null;
  if (note.linkedKind === "claim" && note.linkedId) { const c = await db.query.claims.findFirst({ where: eq(claims.id, note.linkedId) }); if (c) { linkHref = `/evidence/claims/${c.slug}`; linkLabel = c.claimText; } }
  if (note.linkedKind === "investor" && note.linkedId) { const i = await db.query.investors.findFirst({ where: eq(investors.id, note.linkedId) }); if (i) { linkHref = `/dossiers/${i.slug}`; linkLabel = i.fullName; } }
  if (note.linkedKind === "case_study" && note.linkedId) { const c = await db.query.caseStudies.findFirst({ where: eq(caseStudies.id, note.linkedId) }); if (c) { linkHref = `/lab/cases/${c.slug}`; linkLabel = c.title; } }
  if (note.linkedKind === "transaction" && note.linkedId) { const t = await db.query.transactions.findFirst({ where: eq(transactions.id, note.linkedId) }); if (t) { linkHref = `/deals/${t.slug}`; linkLabel = t.name; } }
  return (
    <>
      <PageHeader eyebrow={`Research note · updated ${formatRelative(note.updatedAt)}`} title={note.title} actions={<form action={deleteNoteAction}><input type="hidden" name="noteId" value={note.id} /><Button type="submit" variant="danger">Delete</Button></form>} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card><EditNoteForm note={{ id: note.id, title: note.title, body: note.body, tags: note.tags }} /></Card>
        <Card>
          <Eyebrow className="mb-2">Linked to</Eyebrow>
          {linkHref ? <Link href={linkHref} className="text-sm text-gold hover:underline">{note.linkedKind}: {linkLabel}</Link> : <p className="text-sm text-slate-mist">Unlinked note.</p>}
          <form action={assignNoteAction} className="mt-4 space-y-2 border-t hairline pt-3">
            <input type="hidden" name="noteId" value={note.id} />
            <label htmlFor="note-folder" className="eyebrow block">Folder</label>
            <Select id="note-folder" name="collectionId" defaultValue={note.collectionId ?? ""}><option value="">Unfiled</option>{folders.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">Move note</Button>
          </form>
          <p className="mt-4 text-xs text-slate-mist"><Link href="/library" className="hover:text-gold">← Back to library</Link></p>
        </Card>
      </div>
    </>
  );
}
