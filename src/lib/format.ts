export function formatUsd(value: number | string | null | undefined, opts: { compact?: boolean; decimals?: number } = {}): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  if (opts.compact) {
    const abs = Math.abs(n);
    if (abs >= 1e9) return `$${(n / 1e9).toFixed(abs >= 1e10 ? 0 : 1)} billion`;
    if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)} million`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: opts.decimals ?? 0 }).format(n);
}

export function formatPct(value: number | null | undefined, decimals = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatMultiple(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}x`;
}

export type Precision = "day" | "month" | "year" | "circa" | "decade";

export function formatHistoricalDate(iso: string | Date | null | undefined, precision: Precision = "day"): string {
  if (!iso) return "Undated";
  const d = typeof iso === "string" ? new Date(`${iso.slice(0, 10)}T00:00:00Z`) : iso;
  if (Number.isNaN(d.getTime())) return "Undated";
  const year = d.getUTCFullYear();
  switch (precision) {
    case "year": return String(year);
    case "circa": return `c. ${year}`;
    case "decade": return `${Math.floor(year / 10) * 10}s`;
    case "month": return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    default: return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  }
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "never";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function researcherLabel(n: number | null | undefined): string | null {
  return n == null ? null : `Researcher ${String(n).padStart(3, "0")}`;
}
