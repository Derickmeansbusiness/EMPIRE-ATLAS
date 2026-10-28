import Link from "next/link";
import { ArrowRight, Landmark, Network, Scale, ScrollText, Sigma, Swords } from "lucide-react";
import { getDb } from "@/db/client";
import { evidenceSummary, listInvestorRoadmap, listTransactions } from "@/lib/data/research";
import { Eyebrow, LinkButton } from "@/components/ui/primitives";
import { VerificationBadge } from "@/components/research/status";

const capabilities = [
  { icon: ScrollText, title: "Forensic Investment Research", body: "Dossiers built from filings, archives and contemporaneous reporting. Every statement carries a verification status you can inspect." },
  { icon: Landmark, title: "Deal Archaeology", body: "Landmark acquisitions reconstructed as sources and uses, with documented, estimated and unknown figures kept apart." },
  { icon: Network, title: "Capital Network Intelligence", body: "Investors, lenders, partners and assets linked only where a sourced claim supports the relationship." },
  { icon: Sigma, title: "Financial Engineering", body: "Capital stacks, amortisation, underwriting and returns computed from actual cash flows by a tested formula library." },
  { icon: Swords, title: "Historical Strategy Simulation", body: "Decision exercises grounded in documented circumstances. The outcome is revealed only after you commit." },
  { icon: Scale, title: "Strategic Knowledge Synthesis", body: "Turn completed cases into principles, and principles into a written investment doctrine." },
];

export default async function HomePage() {
  const db = await getDb();
  const [roadmap, summary, txs] = await Promise.all([listInvestorRoadmap(db), evidenceSummary(db), listTransactions(db)]);
  const published = roadmap.filter((i) => i.publishStatus === "published");
  const featured = published[0];
  const totalClaims = Object.values(summary).reduce((a, b) => a + b, 0);
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(193,155,99,0.14),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(17,30,46,0.9),transparent_60%)]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:pt-28">
          <div>
            <Eyebrow className="mb-5 rise">Real estate wealth intelligence</Eyebrow>
            <h1 className="editorial-h1 text-5xl sm:text-6xl lg:text-7xl rise">The anatomy of <span className="text-gold">great fortunes.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-platinum/85 sm:text-lg rise-2">Study the empires. Decode the capital. Engineer the future. Empire Atlas investigates how the most consequential real estate fortunes were financed, structured, scaled and preserved, and lets you model and test the same decisions yourself.</p>
            <div className="mt-8 flex flex-wrap gap-3 rise-3">
              <LinkButton href="/sign-up">Begin research <ArrowRight className="h-4 w-4" /></LinkButton>
              <LinkButton href="/explore" variant="secondary">Explore the empires</LinkButton>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 rise-3">
              <div><dt className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-mist">Published dossiers</dt><dd className="mt-1 font-serif text-3xl numeric">{published.length}</dd></div>
              <div><dt className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-mist">Sourced claims</dt><dd className="mt-1 font-serif text-3xl numeric">{totalClaims}</dd></div>
              <div><dt className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-mist">Reconstructed deals</dt><dd className="mt-1 font-serif text-3xl numeric">{txs.length}</dd></div>
            </dl>
          </div>
          {featured && (
            <Link href={`/explore#${featured.slug}`} className="card group relative flex flex-col justify-between overflow-hidden p-6 sm:p-8 rise-2 focus-ring">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold/10 blur-3xl transition-all duration-700 group-hover:bg-gold/20" />
              <div>
                <Eyebrow className="mb-3">Featured dossier</Eyebrow>
                <p className="font-serif text-3xl sm:text-4xl text-ivory">{featured.fullName}</p>
                <p className="mt-1 text-xs tracking-[0.2em] text-slate-mist uppercase">{featured.eraLabel}</p>
                <p className="mt-5 text-sm leading-relaxed text-platinum/85">{featured.headline}</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {(["verified_primary", "supported_secondary", "contested", "unverified"] as const).map((s) => summary[s] ? <span key={s} className="flex items-center gap-1.5 text-xs text-platinum/80"><VerificationBadge status={s} size="xs" /><span className="numeric">{summary[s]}</span></span> : null)}
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="gold-rule mb-12" />
        <Eyebrow className="mb-3">Six capabilities, one evidence base</Eyebrow>
        <h2 className="editorial-h2 max-w-2xl text-3xl sm:text-4xl">Beyond the biography. Into the economic machinery.</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, body }) => (
            <article key={title} className="card p-6 transition-transform duration-500 hover:-translate-y-0.5">
              <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
              <h3 className="mt-4 font-serif text-xl text-ivory">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-platinum/75">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="card-light grid gap-8 p-8 sm:p-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="eyebrow mb-3" style={{ color: "#8a6a35" }}>The questions we answer</p>
            <h2 className="editorial-h2 text-3xl sm:text-4xl">Who supplied the capital, and what did they actually buy?</h2>
          </div>
          <ul className="grid gap-3 text-sm leading-relaxed text-ink/80 sm:grid-cols-2">
            {[
              "How did an investor finance their first major acquisition?",
              "What was their true original capital advantage?",
              "Which banks, partners or institutions made the deal possible?",
              "Did they acquire ownership, debt, land rights, an operating business or contractual control?",
              "What was the relationship between leverage, liquidity and returns?",
              "Which mistakes nearly destroyed the business?",
              "What would the same transaction look like with today's financing tools?",
              "Which strategies still transfer to U.S. markets today?",
            ].map((q) => <li key={q} className="border-l-2 border-gold pl-3">{q}</li>)}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Eyebrow className="mb-3">Research queue</Eyebrow>
            <h2 className="editorial-h2 text-3xl">Subjects under investigation</h2>
            <p className="mt-2 max-w-xl text-sm text-platinum/75">One dossier is published. The rest are queued and will appear only when their claims are sourced. We do not publish filler.</p>
          </div>
          <LinkButton href="/explore" variant="secondary">See the full roadmap</LinkButton>
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {roadmap.map((i) => (
            <span key={i.slug} className={`rounded-full border px-3 py-1 text-xs ${i.publishStatus === "published" ? "border-gold/60 bg-gold/10 text-gold-soft" : "border-platinum/15 text-slate-mist"}`}>{i.shortName}</span>
          ))}
        </div>
      </section>
    </>
  );
}
