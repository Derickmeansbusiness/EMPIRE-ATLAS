import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getReport } from "@/lib/data/fieldbook";
import { reportHtml, type ReportSnapshot } from "@/fieldbook/report";
import { Alert, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Property Intelligence Report" };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params; const db = await getDb();
  const r = await getReport(db, user.id, id); if (!r) notFound();
  const html = reportHtml(r.snapshot as unknown as ReportSnapshot);
  return (
    <>
      <PageHeader eyebrow="Saved to your private workspace" title={r.title} description={`Frozen ${r.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC. A copy is in your Research Library.`}
        actions={<><a href={`/fieldbook/reports/${r.id}/export?format=html`} target="_blank" rel="noopener" className="rounded-md bg-gold px-3 py-2 text-xs text-ink">Open printable version</a><a href={`/fieldbook/reports/${r.id}/export?format=md`} className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold">Download Markdown</a>{r.noteId && <Link href={`/library/notes/${r.noteId}`} className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold">Library copy</Link>}</>} />
      <Alert tone="info">Educational screening output. Not an appraisal, property condition assessment or investment advice.</Alert>
      <iframe title="Property Intelligence Report" sandbox="" srcDoc={html} className="mt-4 h-[75vh] w-full rounded-card border hairline bg-white" />
    </>
  );
}
