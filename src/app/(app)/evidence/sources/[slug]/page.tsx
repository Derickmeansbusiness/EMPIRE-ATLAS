import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getSourceBySlug } from "@/lib/data/research";
import { Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { VerificationBadge } from "@/components/research/status";
import { formatHistoricalDate } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const db = await getDb(); const r = await getSourceBySlug(db, (await params).slug);
  return { title: r ? r.source.title : "Source" };
}

export default async function SourcePage({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const db = await getDb();
  const r = await getSourceBySlug(db, (await params).slug);
  if (!r) notFound();
  const { source, linked } = r;
  return (
    <>
      <PageHeader eyebrow={`Source · ${source.sourceType.replace(/_/g, " ")}`} title={source.title} />
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        <Card>
          <dl className="space-y-3 text-sm">
            {[["Publisher", source.publisher], ["Author", source.author], ["Published", source.publishedOn ? formatHistoricalDate(source.publishedOn, "day") : null], ["Accessed", source.accessedOn ? formatHistoricalDate(source.accessedOn, "day") : null], ["Document reference", source.documentReference], ["Reliability", source.reliabilityNote], ["Licensing", source.licensingNote]].map(([k, v]) => v ? <div key={k}><dt className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-mist">{k}</dt><dd className="text-platinum/85">{v}</dd></div> : null)}
          </dl>
          {source.url && <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs text-gold hover:underline">Open original <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>}
        </Card>
        <div>
          <Eyebrow className="mb-3">Claims this source supports ({linked.length})</Eyebrow>
          <ul className="space-y-3">
            {linked.map(({ claim, link, investor }) => (
              <li key={claim.id} className="card p-4">
                <div className="flex flex-wrap items-center gap-2"><VerificationBadge status={claim.verificationStatus} size="xs" />{investor && <Link href={`/dossiers/${investor.slug}`} className="text-xs text-slate-mist hover:text-gold">{investor.fullName}</Link>}{!link.supports && <span className="rounded border border-risk/50 px-1 text-[0.6rem] uppercase text-risk">conflicting</span>}</div>
                <Link href={`/evidence/claims/${claim.slug}`} className="mt-2 block text-sm text-ivory hover:text-gold">{claim.claimText}</Link>
                {(link.locator || link.excerpt) && <p className="mt-1 text-xs text-slate-mist">{link.locator && <span className="italic">{link.locator}. </span>}{link.excerpt && <span>“{link.excerpt}”</span>}</p>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
