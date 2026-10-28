import Link from "next/link";
import type { HistoricalEvent } from "@/db/schema";
import type { ClaimWithSources } from "@/lib/data/research";
import { formatHistoricalDate } from "@/lib/format";
import { VerificationBadge } from "./status";

const CATEGORY_COLORS: Record<string, string> = {
  life: "bg-platinum", institution: "bg-gold", acquisition: "bg-positive", financing: "bg-gold-soft", strategy: "bg-sky-300", exit: "bg-positive", failure: "bg-risk",
  negotiation: "bg-gold", approval: "bg-gold-soft", closing: "bg-positive", resale: "bg-sky-300", aftermath: "bg-risk", milestone: "bg-platinum",
};

export function Timeline({ events, claimById, hrefForEvent }: { events: HistoricalEvent[]; claimById?: Map<string, ClaimWithSources>; hrefForEvent?: (e: HistoricalEvent) => string | null }) {
  return (
    <ol className="relative ml-3 border-l border-transparent pl-7">
      <div className="timeline-line absolute left-0 top-0 h-full w-px" aria-hidden="true" />
      {events.map((e, i) => {
        const claim = e.claimId && claimById ? claimById.get(e.claimId) : undefined;
        const href = hrefForEvent?.(e) ?? null;
        return (
          <li key={e.id} className="relative pb-7 last:pb-0" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
            <span className={`absolute -left-[33px] top-1.5 h-3 w-3 rounded-full ring-4 ring-obsidian ${CATEGORY_COLORS[e.category] ?? "bg-platinum"}`} aria-hidden="true" />
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-gold numeric">{formatHistoricalDate(e.occurredOn, e.datePrecision)}</p>
            <h3 className="mt-1 font-serif text-lg text-ivory">{href ? <Link href={href} className="hover:text-gold">{e.title}</Link> : e.title}</h3>
            {e.description && <p className="mt-1 text-sm text-platinum/75">{e.description}</p>}
            {claim && <p className="mt-2 flex flex-wrap items-center gap-2 text-xs"><VerificationBadge status={claim.verificationStatus} size="xs" /><Link href={`/evidence/claims/${claim.slug}`} className="text-slate-mist hover:text-gold">View evidence</Link></p>}
          </li>
        );
      })}
    </ol>
  );
}
