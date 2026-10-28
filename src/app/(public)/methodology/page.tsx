import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/primitives";
import { EvidenceLegend } from "@/components/research/status";

export const metadata: Metadata = { title: "Research Methodology" };

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <PageHeader eyebrow="Research Methodology" title="Evidence first, interpretation second, estimates labelled, unknowns left blank" />
      <div className="space-y-8 text-sm leading-relaxed text-platinum/85">
        <section className="card p-6">
          <h2 className="font-serif text-xl text-ivory">Claims, not paragraphs</h2>
          <p className="mt-2">Every factual statement in a dossier is a structured claim with its own record: text, category, subject, dates, verification status, researcher notes and one or more source links with a locator or excerpt. Dossier prose cites claims inline; click a citation to inspect the evidence.</p>
        </section>
        <section className="card p-6">
          <h2 className="font-serif text-xl text-ivory">Verification statuses</h2>
          <div className="mt-4"><EvidenceLegend /></div>
          <p className="mt-4">A claim is never marked verified because a model or an editor believes it. Status changes are made by reviewers with the Research Editor role or above, and every change is logged with the reviewer, the previous status and a note.</p>
        </section>
        <section className="card p-6">
          <h2 className="font-serif text-xl text-ivory">Preferred sources</h2>
          <p className="mt-2">SEC and company filings, exchange notices, court records, annual reports, archives, academic research, first-person interviews, legally accessible property records, and reliable contemporaneous news. Tertiary references are used only to corroborate basics. We store source metadata and short permitted excerpts, never whole copyrighted works.</p>
        </section>
        <section className="card p-6">
          <h2 className="font-serif text-xl text-ivory">Historical versus hypothetical</h2>
          <p className="mt-2">Historical figures and modelled assumptions are stored in separate tables with separate labels. When a loan amount or rate is unknown, it stays unknown; you may build an explicitly hypothetical model on top, and it will say so everywhere it appears.</p>
        </section>
        <section className="card p-6">
          <h2 className="font-serif text-xl text-ivory">Ownership language</h2>
          <p className="mt-2">We do not describe a person as the legal owner of assets held by a corporation, partnership, fund or trust without evidence. “Zell sold Equity Office” is shorthand the record does not support; “Equity Office’s shareholders received $55.50 per share” is what the filings say.</p>
        </section>
      </div>
    </div>
  );
}
