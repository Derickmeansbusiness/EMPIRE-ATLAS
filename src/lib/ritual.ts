/** Weekly research ritual calendar helpers. All dates are UTC calendar dates (YYYY-MM-DD). */

export const RITUAL_DAYS = [
  { day: 1, name: "Monday", task: "Research historical context and sources", href: "/evidence/sources", guidance: "Read two primary sources end to end. Record what each actually states, and what it does not." },
  { day: 2, name: "Tuesday", task: "Reconstruct acquisitions and financial structures", href: "/deals", guidance: "Rebuild one transaction as sources and uses. Mark every line documented, estimated or unknown." },
  { day: 3, name: "Wednesday", task: "Map networks, strategies and institutional relationships", href: "/network", guidance: "Trace who supplied capital and what each party was paid. Note any relationship you cannot evidence." },
  { day: 4, name: "Thursday", task: "Translate historical principles into a modern U.S. case", href: "/lab", guidance: "Take one principle into the lab with explicitly hypothetical inputs and see where it breaks." },
  { day: 5, name: "Friday", task: "Present findings to an investment committee", href: "/committee", guidance: "Defend your conclusion in writing: thesis, numbers, risks, exit. Accept the verdict." },
] as const;

export function toISODate(d: Date): string { return d.toISOString().slice(0, 10); }

/** Monday of the week containing `d`, as YYYY-MM-DD (UTC). */
export function weekStartOf(d: Date): string {
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = (utc.getUTCDay() + 6) % 7; // Monday = 0
  utc.setUTCDate(utc.getUTCDate() - dow);
  return toISODate(utc);
}

/** 1 (Mon) … 7 (Sun). */
export function weekdayNumber(d: Date): number { return ((d.getUTCDay() + 6) % 7) + 1; }

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return toISODate(d);
}

export interface RitualEntryLite { weekStart: string; day: number }

export function completedDaysByWeek(entries: RitualEntryLite[]): Map<string, Set<number>> {
  const m = new Map<string, Set<number>>();
  for (const e of entries) { const s = m.get(e.weekStart) ?? new Set<number>(); s.add(e.day); m.set(e.weekStart, s); }
  return m;
}

/**
 * Streak = consecutive weeks, ending with the current week (or the previous one if the current week has no entry yet),
 * in which at least `minDays` of the five days were completed.
 */
export function ritualStreak(entries: RitualEntryLite[], now: Date, minDays = 3): number {
  const byWeek = completedDaysByWeek(entries);
  let week = weekStartOf(now);
  if ((byWeek.get(week)?.size ?? 0) === 0) week = addDays(week, -7);
  let streak = 0;
  while ((byWeek.get(week)?.size ?? 0) >= minDays) { streak++; week = addDays(week, -7); }
  return streak;
}

export function fullWeeks(entries: RitualEntryLite[]): number {
  let n = 0; for (const s of completedDaysByWeek(entries).values()) if (s.size === 5) n++; return n;
}
