import type { DataStatus, VerificationStatus } from "@/db/schema";
import { cx } from "@/components/ui/primitives";

export const VERIFICATION_META: Record<VerificationStatus, { label: string; short: string; className: string; description: string }> = {
  verified_primary: { label: "Verified from primary documentation", short: "Primary", className: "border-positive/60 bg-positive/15 text-positive", description: "SEC filings, exchange notices, company filings, court records or catalogue records." },
  supported_secondary: { label: "Supported by credible secondary reporting", short: "Secondary", className: "border-gold/60 bg-gold/15 text-gold-soft", description: "Reputable news, trade press, academic or association reporting." },
  contested: { label: "Contested", short: "Contested", className: "border-risk/60 bg-risk/15 text-risk", description: "Credible sources disagree; the disagreement is recorded in the claim." },
  unverified: { label: "Unverified", short: "Unverified", className: "border-platinum/40 bg-platinum/10 text-platinum", description: "Reported by a single or weak source; not to be cited as fact." },
  hypothetical: { label: "Hypothetical / simulation only", short: "Hypothetical", className: "border-sky-400/50 bg-sky-400/10 text-sky-200", description: "A modelled or fictional assumption, never a historical statement." },
};

export const DATA_STATUS_META: Record<DataStatus, { label: string; className: string }> = {
  documented: { label: "Documented", className: "border-positive/60 bg-positive/15 text-positive" },
  interpretation: { label: "Interpretation", className: "border-gold/60 bg-gold/15 text-gold-soft" },
  estimate: { label: "Historical estimate", className: "border-platinum/40 bg-platinum/10 text-platinum" },
  unknown: { label: "Unknown", className: "border-risk/50 bg-risk/10 text-risk" },
  hypothetical: { label: "Hypothetical", className: "border-sky-400/50 bg-sky-400/10 text-sky-200" },
};

export function VerificationBadge({ status, size = "sm" }: { status: VerificationStatus; size?: "xs" | "sm" }) {
  const m = VERIFICATION_META[status];
  return (
    <span title={m.description} className={cx("inline-flex items-center gap-1 rounded-full border font-medium uppercase tracking-[0.12em]", size === "xs" ? "px-1.5 py-0.5 text-[0.55rem]" : "px-2.5 py-1 text-[0.625rem]", m.className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {size === "xs" ? m.short : m.label}
    </span>
  );
}

export function DataStatusBadge({ status }: { status: DataStatus }) {
  const m = DATA_STATUS_META[status];
  return <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.12em]", m.className)}>{m.label}</span>;
}

export function EvidenceLegend() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {(Object.keys(VERIFICATION_META) as VerificationStatus[]).map((s) => (
        <div key={s} className="flex items-start gap-2 text-xs text-platinum/80">
          <VerificationBadge status={s} size="xs" />
          <span className="leading-snug">{VERIFICATION_META[s].description}</span>
        </div>
      ))}
    </div>
  );
}
