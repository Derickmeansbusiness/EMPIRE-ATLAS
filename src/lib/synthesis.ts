/** Maps doctrine fields to the dossier divisions that speak to them, for side-by-side strategy comparison. */
import { DOCTRINE_FIELDS, type DoctrineKey } from "./doctrine";

export const FIELD_DIVISIONS: Record<DoctrineKey, number[]> = {
  targetAssets: [9, 4], geographicStrategy: [3], acquisitionCriteria: [4, 8], financingCriteria: [5], riskTolerance: [10, 11],
  capitalPartnerStrategy: [7, 5], committeeStandards: [6], exitStrategies: [6, 12],
};

export interface SectionLite { division: number; title: string; bodyMarkdown: string }
export interface ComparisonRow { key: DoctrineKey; label: string; division: number | null; divisionTitle: string | null; excerpt: string | null }

/** First `paragraphs` paragraphs of the best-matching division (claim tokens preserved for rendering). */
export function excerptFor(sections: SectionLite[], key: DoctrineKey, paragraphs = 2): { division: number; title: string; excerpt: string } | null {
  for (const d of FIELD_DIVISIONS[key]) {
    const s = sections.find((x) => x.division === d);
    if (s) return { division: s.division, title: s.title, excerpt: s.bodyMarkdown.trim().split(/\n\s*\n/).slice(0, paragraphs).join("\n\n") };
  }
  return null;
}

export function investorProfile(sections: SectionLite[]): ComparisonRow[] {
  return DOCTRINE_FIELDS.map((f) => { const e = excerptFor(sections, f.key); return { key: f.key, label: f.label, division: e?.division ?? null, divisionTitle: e?.title ?? null, excerpt: e?.excerpt ?? null }; });
}

/** Starter prompts for principles, each tied to a claim in the corpus so the learner begins from evidence. */
export const PRINCIPLE_PROMPTS: Array<{ title: string; statement: string; claim: string; risk: string; modern: string }> = [
  { title: "Buy below conservative intrinsic value", statement: "Price an acquisition from its worst realistic path, not from the discount headline.", claim: "carter-hawley-hale-1991", risk: "Paying the headline discount while the downside path still loses money.", modern: "Underwrite a note or property so that a contested foreclosure still returns capital." },
  { title: "Preserve liquidity during market downturns", statement: "The ability to wait is the only advantage that cannot be bought in a crisis.", claim: "eop-merger-effective-2007-02-09", risk: "Spending liquidity to defend positions whose equity is already gone.", modern: "Hold reserves for twice the expected carry and keep dry powder undrawn until sellers are forced." },
  { title: "Negotiate with capital providers as carefully as with sellers", statement: "Certainty, structure and competition decide price as much as the headline number.", claim: "eop-vornado-competing-bid", risk: "Chasing a higher non-binding headline over a lower binding cash offer.", modern: "Ask lenders and partners for committed terms and a go-shop or competitive process before you sign." },
  { title: "Separate contractual control from ownership", statement: "Owning the claim that converts into control can beat owning the asset.", claim: "carter-hawley-hale-1991", risk: "Control without the economics, or economics without the rights to enforce them.", modern: "Evaluate non-performing loans and preferred structures before buying the equity." },
  { title: "Understand where a project’s value is actually created", statement: "Separate value created by the plan from value borrowed from the market.", claim: "eop-amended-merger-55-50", risk: "Returns that depend on cap-rate compression rather than operations.", modern: "Show the exit at a flat cap rate and list what must go right beyond that." },
  { title: "Match debt maturity to business strategy", statement: "A loan that matures before the plan can finish turns a good asset into a forced sale.", claim: "macklowe-lost-towers-2008", risk: "Short-term financing for a long-term business plan.", modern: "Match loan term and extension options to the realistic business-plan timeline plus a delay." },
];
