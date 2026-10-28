import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getSubmission } from "@/lib/data/simulations";
import { COMMITTEE_DIMENSIONS, type DimensionResult } from "@/simulation/committee";
import { Card, Eyebrow, PageHeader, Stat } from "@/components/ui/primitives";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Committee memo" };

function renderMemo(md: string) {
  return md.split("\n").map((line, i) => {
    if (line.startsWith("# ")) return <h2 key={i} className="editorial-h2 text-2xl text-ivory">{line.slice(2)}</h2>;
    if (line.startsWith("## ")) return <h3 key={i} className="mt-5 font-serif text-lg text-gold-soft">{line.slice(3)}</h3>;
    if (line.startsWith("### ")) return <h4 key={i} className="mt-3 text-sm font-semibold text-ivory">{line.slice(4)}</h4>;
    if (line.startsWith("- ")) return <li key={i} className="ml-4 list-disc text-sm text-platinum/85">{inline(line.slice(2))}</li>;
    if (line.startsWith("_") && line.endsWith("_")) return <p key={i} className="mt-4 text-xs italic text-slate-mist">{line.slice(1, -1)}</p>;
    if (!line.trim()) return null;
    return <p key={i} className="text-sm leading-relaxed text-platinum/85">{inline(line)}</p>;
  });
}
function inline(t: string) { return t.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith("**") ? <strong key={i} className="text-ivory">{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>); }

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = await getDb();
  const s = await getSubmission(db, user.id, id);
  if (!s) notFound();
  const dims = (s.evaluation as { dimensions: DimensionResult[] }).dimensions;
  return (
    <>
      <PageHeader eyebrow={`Investment committee · ${formatRelative(s.createdAt)}`} title={s.title} description={<span>Verdict: <span className={s.verdict === "approved" ? "text-positive" : s.verdict === "declined" ? "text-risk" : "text-gold-soft"}>{s.verdict.replace(/_/g, " ")}</span> · score {s.score}/100 · sponsor recommended {s.recommendation.replace(/_/g, " ")}</span>} actions={<Link href="/committee/new" className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold">Resubmit a revised version</Link>} />
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card className="space-y-2">{renderMemo(s.memoMarkdown)}</Card>
        <aside className="space-y-5">
          <Card>
            <Eyebrow className="mb-3">Scores</Eyebrow>
            <div className="grid grid-cols-2 gap-4">{dims.map((d) => <Stat key={d.key} label={COMMITTEE_DIMENSIONS.find((x) => x.key === d.key)!.label} value={`${d.score}/10`} tone={d.score >= 7 ? "positive" : d.score < 4 ? "risk" : undefined} />)}</div>
          </Card>
          {s.modelId ? <Card><Eyebrow className="mb-2">Attached model</Eyebrow><Link href={`/lab/underwriter?model=${s.modelId}`} className="text-sm text-gold hover:underline">Open the underwriting model →</Link><p className="mt-1 text-xs text-slate-mist">The committee evaluated a snapshot of the model as it was at submission.</p></Card> : <Card><Eyebrow className="mb-2">No model attached</Eyebrow><p className="text-xs text-slate-mist">Attach a saved Acquisition Underwriter model next time so financial correctness and downside resilience can be scored.</p></Card>}
        </aside>
      </div>
    </>
  );
}
