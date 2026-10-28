import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getCaseStudy } from "@/lib/data/cases";
import { can } from "@/lib/auth/roles";
import { MODEL_KIND_LABEL, MODEL_KIND_PATH, type ModelKind } from "@/lib/data/models";
import { toQuery } from "@/lib/lab-params";
import { Alert, Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { NoteForm } from "@/components/workspace/note-form";
import { listNotes } from "@/lib/data/workspace";
import { formatRelative } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const db = await getDb(); const c = await getCaseStudy(db, (await params).slug, true);
  return { title: c ? c.caseStudy.title : "Case" };
}

function renderBody(md: string) {
  return md.trim().split(/\n\s*\n/).map((block, i) => {
    if (block.startsWith("## ")) return <h2 key={i} className="editorial-h2 mt-8 text-2xl text-ivory first:mt-0">{block.slice(3)}</h2>;
    const lines = block.split("\n");
    if (lines.every((l) => /^- /.test(l))) return <ul key={i} className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-platinum/85">{lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}</ul>;
    if (lines.every((l) => /^\d+\. /.test(l))) return <ol key={i} className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-platinum/85">{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\d+\. /, ""))}</li>)}</ol>;
    return <p key={i} className="text-sm leading-relaxed text-platinum/85">{inline(block)}</p>;
  });
}
function inline(t: string) {
  return t.split(/(\*\*[^*]+\*\*)/g).map((part, i) => part.startsWith("**") ? <strong key={i} className="text-ivory">{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>);
}

export default async function CasePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string }> }) {
  const user = await requireUser();
  const { slug } = await params; const sp = await searchParams;
  const db = await getDb();
  const record = await getCaseStudy(db, slug, can(user.role, "research:read_drafts"));
  if (!record) notFound();
  const { caseStudy, investor } = record;
  const presets = caseStudy.modelPresets as Record<string, Record<string, string | number>>;
  const notes = await listNotes(db, user.id, { linkedKind: "case_study", linkedId: caseStudy.id });
  const returnTo = `/lab/cases/${caseStudy.slug}`;
  return (
    <>
      {sp.saved === "note" && <div className="mb-6"><Alert tone="success">Note saved.</Alert></div>}
      <PageHeader eyebrow={`${caseStudy.kind === "fictional" ? "Fictional modern case" : "Historical case"} · ${caseStudy.subtitle ?? ""}`} title={caseStudy.title} description={caseStudy.summary} />
      <div className="mb-6 rounded-md border border-sky-400/50 bg-sky-400/10 px-4 py-3 text-sm text-sky-100"><span className="mr-2 rounded-full border border-sky-300/60 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em]">Fictional</span>{caseStudy.disclaimer}</div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="space-y-4">{renderBody(caseStudy.bodyMarkdown)}</Card>
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <Eyebrow className="mb-3">Open in the lab with these inputs</Eyebrow>
            <ul className="space-y-2">
              {Object.entries(presets).map(([kind, values]) => (
                <li key={kind}><Link href={`${MODEL_KIND_PATH[kind as ModelKind]}?${toQuery(values)}`} className="flex items-center justify-between rounded-md border border-platinum/15 px-3 py-2 text-sm text-ivory hover:border-gold hover:text-gold"><span>{MODEL_KIND_LABEL[kind as ModelKind]}</span><span aria-hidden="true">→</span></Link></li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-mist">Presets are starting points. Change one assumption at a time and save versions to compare.</p>
          </Card>
          {investor && (
            <Card>
              <Eyebrow className="mb-2">Historical dossier this case draws on</Eyebrow>
              <Link href={`/dossiers/${investor.slug}`} className="font-serif text-xl text-ivory hover:text-gold">{investor.fullName}</Link>
              <p className="mt-1 text-xs text-slate-mist">The dossier’s claims carry their own verification status. This case borrows the reasoning, not the facts.</p>
            </Card>
          )}
          <Card>
            <Eyebrow className="mb-2">My notes on this case</Eyebrow>
            {notes.length > 0 && <ul className="mb-4 space-y-1.5">{notes.map((n) => <li key={n.id}><Link href={`/library/notes/${n.id}`} className="text-sm text-ivory hover:text-gold">{n.title}</Link><span className="ml-2 text-xs text-slate-mist">{formatRelative(n.updatedAt)}</span></li>)}</ul>}
            <NoteForm linkedKind="case_study" linkedId={caseStudy.id} returnTo={returnTo} compact />
          </Card>
        </aside>
      </div>
    </>
  );
}
