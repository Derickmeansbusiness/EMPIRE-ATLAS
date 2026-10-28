import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { listInvestorRoadmap, listInstitutions } from "@/lib/data/research";
import { LinkButton, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Explore the Empires" };

export default async function ExplorePage() {
  const db = await getDb();
  const [investors, institutions] = await Promise.all([listInvestorRoadmap(db), listInstitutions(db)]);
  const published = investors.filter((i) => i.publishStatus === "published");
  const queued = investors.filter((i) => i.publishStatus !== "published");
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <PageHeader eyebrow="Explore the Empires" title="Investors and institutions under investigation" description="Published dossiers are built claim by claim from cited sources. Queued subjects are listed so you can see where the research is going; they are not previews of unwritten content." />
      <section aria-labelledby="published">
        <h2 id="published" className="eyebrow mb-4">Published dossiers</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {published.map((i) => (
            <article key={i.slug} id={i.slug} className="card p-6">
              <p className="text-xs tracking-[0.2em] text-slate-mist uppercase">{i.eraLabel}</p>
              <h3 className="mt-2 font-serif text-3xl text-ivory">{i.fullName}</h3>
              <p className="mt-3 text-sm leading-relaxed text-platinum/80">{i.headline}</p>
              <p className="mt-3 text-sm leading-relaxed text-platinum/65">{i.summary}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">{i.primaryAssetClasses.map((c) => <span key={c} className="rounded-full border border-platinum/15 px-2 py-0.5 text-[0.65rem] text-platinum/70">{c}</span>)}</div>
              <div className="mt-6"><LinkButton href={`/dossiers/${i.slug}`}>Open the dossier</LinkButton></div>
            </article>
          ))}
        </div>
      </section>
      <section aria-labelledby="queued" className="mt-14">
        <h2 id="queued" className="eyebrow mb-1">Research queue</h2>
        <p className="mb-5 text-sm text-slate-mist">Ordered by research priority. Each will be published only once its twelve analytical divisions rest on sourced claims.</p>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {queued.map((i) => (
            <li key={i.slug} className="rounded-card border border-platinum/10 bg-midnight/40 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-serif text-lg text-ivory">{i.fullName}</p>
                <span className="numeric text-[0.65rem] text-slate-mist">#{i.roadmapRank}</span>
              </div>
              <p className="mt-1 text-xs text-slate-mist">{i.eraLabel}</p>
              <p className="mt-2 text-xs leading-relaxed text-platinum/70">{i.headline}</p>
              <p className="mt-3 text-[0.6rem] uppercase tracking-[0.2em] text-gold/80">{i.researchStatus === "in_research" ? "In research" : "Queued"}</p>
            </li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="institutions" className="mt-14">
        <h2 id="institutions" className="eyebrow mb-4">Institutions with published records</h2>
        <div className="flex flex-wrap gap-2">
          {institutions.map((inst) => <span key={inst.slug} className="rounded-full border border-platinum/15 px-3 py-1 text-xs text-platinum/80">{inst.name}</span>)}
        </div>
        <p className="mt-4 text-xs text-slate-mist">Institution profiles with their own analytical divisions are on the <Link href="/how-it-works" className="text-gold underline">roadmap</Link>. Today they appear as evidence-linked nodes inside dossiers and transactions.</p>
      </section>
    </div>
  );
}
