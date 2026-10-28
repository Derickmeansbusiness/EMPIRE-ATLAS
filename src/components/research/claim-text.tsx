import Link from "next/link";
import type { ClaimWithSources } from "@/lib/data/research";
import { VERIFICATION_META } from "./status";
import { cx } from "@/components/ui/primitives";

/**
 * Renders dossier prose (paragraphs, numbered lists) and turns [[claim:slug]] tokens into
 * inline evidence chips that link to the claim's evidence page.
 */
export function DossierBody({ body, claimMap, light = false }: { body: string; claimMap: Map<string, ClaimWithSources>; light?: boolean }) {
  const blocks = body.trim().split(/\n\s*\n/);
  return (
    <div className="prose-atlas text-[0.95rem]">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\d+\.\s/.test(l.trim()));
        if (isList) {
          return <ol key={i}>{lines.map((l, j) => <li key={j}>{renderInline(l.replace(/^\d+\.\s/, ""), claimMap, light)}</li>)}</ol>;
        }
        return <p key={i}>{renderInline(block, claimMap, light)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string, claimMap: Map<string, ClaimWithSources>, light: boolean) {
  const parts = text.split(/(\[\[claim:[a-z0-9-]+\]\])/g);
  let n = 0;
  return parts.map((part, i) => {
    const m = part.match(/^\[\[claim:([a-z0-9-]+)\]\]$/);
    if (!m) return <span key={i}>{part}</span>;
    const claim = claimMap.get(m[1]!);
    n++;
    if (!claim) return <span key={i} className="text-risk" title="Unresolved citation">[?]</span>;
    return <ClaimChip key={i} claim={claim} index={n} light={light} />;
  });
}

export function ClaimChip({ claim, index, light }: { claim: ClaimWithSources; index?: number; light?: boolean }) {
  const meta = VERIFICATION_META[claim.verificationStatus];
  return (
    <Link
      href={`/evidence/claims/${claim.slug}`}
      title={`${meta.label}: ${claim.claimText}`}
      className={cx("mx-0.5 inline-flex -translate-y-px items-center gap-1 rounded-full border px-1.5 py-[1px] align-middle text-[0.6rem] font-semibold uppercase tracking-[0.1em] no-underline transition-colors hover:brightness-125 focus-ring", meta.className, light && "bg-white/60")}
      aria-label={`Evidence ${index ?? ""}: ${meta.label}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {index ?? meta.short}
    </Link>
  );
}
