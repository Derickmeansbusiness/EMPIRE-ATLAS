import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listInvestorRoadmap } from "@/lib/data/research";
import { can } from "@/lib/auth/roles";
import { Eyebrow, LinkButton, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Empire Dossiers" };

export default async function DossiersPage() {
  const user = await requireUser();
  const db = await getDb();
  const investors = await listInvestorRoadmap(db);
  const published = investors.filter((i) => i.publishStatus === "published");
  const queued = investors.filter((i) => i.publishStatus !== "published");
  const seesDrafts = can(user.role, "research:read_drafts");
  return (
    <>
      <PageHeader eyebrow="Empire Dossiers" title="Research profiles" description="Twelve analytical divisions per subject, each statement cited to a claim with a verification status." />
      <div className="grid gap-5 md:grid-cols-2">
        {published.map((i) => (
          <article key={i.slug} className="card p-6 rise">
            <p className="text-xs tracking-[0.2em] text-slate-mist uppercase">{i.eraLabel}</p>
            <h2 className="mt-2 font-serif text-3xl text-ivory">{i.fullName}</h2>
            <p className="mt-3 text-sm leading-relaxed text-platinum/80">{i.headline}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">{i.primaryAssetClasses.map((c) => <span key={c} className="rounded-full border border-platinum/15 px-2 py-0.5 text-[0.65rem] text-platinum/70">{c}</span>)}</div>
            <div className="mt-6"><LinkButton href={`/dossiers/${i.slug}`}>Open dossier</LinkButton></div>
          </article>
        ))}
      </div>
      <section className="mt-12">
        <Eyebrow className="mb-1">Research queue</Eyebrow>
        <p className="mb-4 text-sm text-slate-mist">{seesDrafts ? "Drafts are visible to editors; nothing is written for these yet." : "These subjects will open once their claims are sourced."}</p>
        <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {queued.map((i) => (
            <li key={i.slug} className="flex items-baseline justify-between rounded-card border border-platinum/10 bg-midnight/40 px-4 py-3">
              <span><span className="font-serif text-ivory">{i.fullName}</span><span className="ml-2 text-xs text-slate-mist">{i.eraLabel}</span></span>
              <span className="text-[0.6rem] uppercase tracking-[0.18em] text-gold/70">#{i.roadmapRank}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-slate-mist">Priority order follows <Link href="/roadmap" className="text-gold underline">the roadmap</Link>.</p>
      </section>
    </>
  );
}
