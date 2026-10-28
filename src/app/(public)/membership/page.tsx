import type { Metadata } from "next";
import { LinkButton, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Membership" };

const tiers = [
  ["Explorer", "Public historical profiles and selected case previews."],
  ["Researcher", "Full research dossiers and private notebooks."],
  ["Professional", "Deal reconstruction, financial laboratories and simulations."],
  ["Institutional", "Team accounts, collaborative research, advanced exports and cohort administration."],
];

export default function MembershipPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <PageHeader eyebrow="Membership" title="Four tiers, designed before they are priced" description="Entitlements and roles are built into the platform now. Pricing and payments will be added only when commercial terms are set; nothing here is for sale yet." />
      <div className="grid gap-4 sm:grid-cols-2">
        {tiers.map(([name, body]) => (
          <article key={name} className="card p-6"><h2 className="font-serif text-2xl text-ivory">{name}</h2><p className="mt-2 text-sm text-platinum/75">{body}</p><p className="mt-4 text-[0.65rem] uppercase tracking-[0.2em] text-slate-mist">Pricing not yet set</p></article>
        ))}
      </div>
      <p className="mt-8 text-sm text-platinum/75">During the founding period, new accounts are created as Students with access to the published research, notebooks and the live lab tools.</p>
      <div className="mt-4"><LinkButton href="/sign-up">Create a research account</LinkButton></div>
    </div>
  );
}
