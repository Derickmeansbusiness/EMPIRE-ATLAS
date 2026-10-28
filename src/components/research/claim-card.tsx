import Link from "next/link";
import { Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import type { ClaimWithSources } from "@/lib/data/research";
import { VerificationBadge } from "./status";
import { formatHistoricalDate } from "@/lib/format";
import { toggleBookmarkAction } from "@/app/actions/workspace";

export function ClaimCard({ claim, bookmarked, returnTo, compact = false }: { claim: ClaimWithSources; bookmarked?: boolean; returnTo: string; compact?: boolean }) {
  return (
    <article id={`claim-${claim.slug}`} className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <VerificationBadge status={claim.verificationStatus} size="xs" />
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-mist">{claim.category.replace(/_/g, " ")}</span>
          {claim.eventDate && <span className="text-[0.65rem] text-slate-mist">· {formatHistoricalDate(claim.eventDate, claim.eventDatePrecision ?? "day")}</span>}
        </div>
        <form action={toggleBookmarkAction} className="shrink-0">
          <input type="hidden" name="targetKind" value="claim" />
          <input type="hidden" name="targetId" value={claim.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button type="submit" className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs focus-ring ${bookmarked ? "text-gold" : "text-platinum/70 hover:text-gold"}`} aria-pressed={bookmarked} aria-label={bookmarked ? "Remove bookmark" : "Bookmark this claim"}>
            {bookmarked ? <BookmarkCheck className="h-4 w-4" aria-hidden="true" /> : <Bookmark className="h-4 w-4" aria-hidden="true" />}
            <span className="hidden sm:inline">{bookmarked ? "Bookmarked" : "Bookmark"}</span>
          </button>
        </form>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ivory">{claim.claimText}</p>
      {!compact && claim.researcherNotes && <p className="mt-2 border-l-2 border-gold/50 pl-3 text-xs leading-relaxed text-platinum/70"><span className="eyebrow mr-1">Researcher note</span>{claim.researcherNotes}</p>}
      <ul className="mt-3 space-y-1.5">
        {claim.sources.map(({ source, excerpt, locator, supports }) => (
          <li key={source.id} className="text-xs text-platinum/75">
            <Link href={`/evidence/sources/${source.slug}`} className="text-gold-soft hover:underline">{source.title}</Link>
            {source.publisher && <span className="text-slate-mist"> · {source.publisher}</span>}
            {!supports && <span className="ml-1 rounded border border-risk/50 px-1 text-[0.6rem] uppercase tracking-wide text-risk">conflicting</span>}
            {!compact && (locator || excerpt) && <p className="mt-0.5 text-slate-mist">{locator && <span className="italic">{locator}. </span>}{excerpt && <span>“{excerpt}”</span>}</p>}
            {source.url && !compact && <a href={source.url} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-0.5 text-slate-mist hover:text-gold"><ExternalLink className="h-3 w-3" aria-hidden="true" /><span className="sr-only">Open original source</span></a>}
          </li>
        ))}
      </ul>
      <div className="mt-3 text-xs"><Link href={`/evidence/claims/${claim.slug}`} className="text-platinum/70 hover:text-gold">Open claim record →</Link></div>
    </article>
  );
}
