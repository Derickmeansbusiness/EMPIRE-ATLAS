import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { activityBetween, ritualJournal } from "@/lib/data/study";
import { RITUAL_DAYS, addDays, fullWeeks, ritualStreak, weekStartOf, weekdayNumber } from "@/lib/ritual";
import { activityLabel } from "@/lib/activity";
import { completeRitualDayAction, reopenRitualDayAction } from "@/app/actions/study";
import { Alert, Button, Card, Eyebrow, Field, PageHeader, Stat, Textarea } from "@/components/ui/primitives";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Weekly Research Ritual" };

export default async function RitualPage({ searchParams }: { searchParams: Promise<{ done?: string; error?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const db = await getDb();
  const now = new Date(); const ws = weekStartOf(now); const today = weekdayNumber(now);
  const [entries, activity] = await Promise.all([ritualJournal(db, user.id, 200), activityBetween(db, user.id, new Date(`${ws}T00:00:00Z`), new Date(`${addDays(ws, 7)}T00:00:00Z`))]);
  const thisWeek = new Map(entries.filter((e) => e.weekStart === ws).map((e) => [e.day, e] as const));
  const lite = entries.map((e) => ({ weekStart: e.weekStart, day: e.day }));
  const streak = ritualStreak(lite, now); const full = fullWeeks(lite);
  const past = entries.filter((e) => e.weekStart !== ws && e.journal.trim()).slice(0, 8);
  return (
    <>
      <PageHeader eyebrow={`Weekly research ritual · week of ${ws}`} title="Five days. One investigation." description="A fixed rhythm turns scattered reading into a finished piece of research. Complete each day with a short journal entry about what you found and what you could not establish." />
      {sp.done && <div className="mb-5"><Alert tone="success">Day recorded.</Alert></div>}
      {sp.error && <div className="mb-5"><Alert tone="error">That entry could not be saved.</Alert></div>}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><Stat label="This week" value={`${thisWeek.size} / 5`} sub={thisWeek.size === 5 ? "Complete. Well done." : `${5 - thisWeek.size} to go`} tone={thisWeek.size === 5 ? "positive" : undefined} /></Card>
        <Card><Stat label="Streak" value={`${streak} week${streak === 1 ? "" : "s"}`} sub="consecutive weeks with 3+ days" /></Card>
        <Card><Stat label="Full weeks" value={String(full)} sub="all five days completed" /></Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <ol className="space-y-4">
          {RITUAL_DAYS.map((d) => {
            const entry = thisWeek.get(d.day); const isToday = d.day === today;
            return (
              <li key={d.day} id={`day-${d.day}`}>
                <Card className={isToday ? "ring-1 ring-gold/60" : ""}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3"><span className="font-serif text-xl text-ivory">{d.name}</span>{isToday && <span className="rounded-full border border-gold/60 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-gold">Today</span>}{d.day > today && !entry && <span className="text-xs text-slate-mist">Upcoming</span>}</div>
                    {entry ? <span className="rounded-full border border-positive/60 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-positive">Completed {formatRelative(entry.completedAt)}</span> : null}
                  </div>
                  <p className="mt-2 text-sm text-ivory">{d.task}</p>
                  <p className="mt-1 text-xs leading-relaxed text-platinum/75">{d.guidance}</p>
                  <Link href={d.href} className="mt-2 inline-block text-xs text-gold hover:underline">Open the workspace →</Link>
                  {entry ? (
                    <div className="mt-3 border-t hairline pt-3">
                      <p className="eyebrow mb-1">Journal</p>
                      <p className="whitespace-pre-line text-sm text-platinum/85">{entry.journal || "No journal entry."}</p>
                      <form action={reopenRitualDayAction} className="mt-2"><input type="hidden" name="day" value={d.day} /><button type="submit" className="text-xs text-slate-mist hover:text-risk">Reopen this day</button></form>
                    </div>
                  ) : (
                    <form action={completeRitualDayAction} className="mt-3 space-y-2 border-t hairline pt-3">
                      <input type="hidden" name="day" value={d.day} />
                      <Field label="Journal (what you found, what you could not establish)" htmlFor={`journal-${d.day}`}><Textarea id={`journal-${d.day}`} name="journal" className="min-h-24" /></Field>
                      <Button type="submit" variant="secondary">Mark {d.name} complete</Button>
                    </form>
                  )}
                </Card>
              </li>
            );
          })}
        </ol>
        <aside className="space-y-5">
          <Card>
            <Eyebrow className="mb-2">What you did this week</Eyebrow>
            {activity.length === 0 ? <p className="text-sm text-slate-mist">Nothing recorded yet this week.</p> : <ul className="space-y-1.5 text-xs">{activity.slice(0, 14).map((a) => <li key={a.id} className="flex justify-between gap-2"><span className="text-platinum/85">{activityLabel(a.activityKind)}</span><span className="shrink-0 text-slate-mist">{formatRelative(a.createdAt)}</span></li>)}</ul>}
            <p className="mt-3 text-[0.65rem] text-slate-mist">Derived from your stored activity, so the journal can be checked against what you actually did.</p>
          </Card>
          {past.length > 0 && <Card><Eyebrow className="mb-2">Earlier journal entries</Eyebrow><ul className="space-y-3">{past.map((e) => <li key={e.id} className="text-xs"><p className="text-gold-soft">{e.weekStart} · {RITUAL_DAYS[e.day - 1]?.name}</p><p className="mt-0.5 line-clamp-3 text-platinum/80">{e.journal}</p></li>)}</ul></Card>}
        </aside>
      </div>
    </>
  );
}
