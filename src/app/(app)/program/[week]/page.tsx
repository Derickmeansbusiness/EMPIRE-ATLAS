import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { programState } from "@/lib/data/progress";
import { MONTHS } from "@/program/curriculum";
import { setTaskDoneAction } from "@/app/actions/study";
import { Button, Card, Eyebrow, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Program week" };

export default async function WeekPage({ params }: { params: Promise<{ week: string }> }) {
  const user = await requireUser();
  const n = Number((await params).week);
  if (!Number.isInteger(n) || n < 1 || n > 24) notFound();
  const db = await getDb();
  const p = await programState(db, user.id);
  const w = p.statuses[n - 1]!;
  return (
    <>
      <PageHeader eyebrow={`Month ${w.week.month} · ${MONTHS[w.week.month - 1]} · Week ${n} of 24`} title={w.week.title} description={w.week.focus} actions={w.complete ? <span className="rounded-full border border-positive/60 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-positive">Week complete</span> : undefined} />
      {w.week.selfDirected && <div className="mb-5 rounded-md border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ivory"><span className="eyebrow mr-2">Self-directed</span>{w.week.selfDirected}</div>}
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card>
          <Eyebrow className="mb-3">Tasks · {w.doneCount} of {w.tasks.length} done</Eyebrow>
          <ul className="space-y-3">
            {w.tasks.map(({ task, done, auto }) => (
              <li key={task.key} className="rounded-md border hairline p-3">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${done ? "border-positive bg-positive/20 text-positive" : "border-platinum/30 text-transparent"}`} aria-hidden="true">✓</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ivory">{task.label}<span className="sr-only">{done ? " (done)" : " (not done)"}</span></p>
                    {task.detail && <p className="mt-0.5 text-xs text-slate-mist">{task.detail}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      {task.href && <Link href={task.href} className="text-gold hover:underline">Open →</Link>}
                      {auto ? <span className="text-slate-mist">{done ? "Completed from your activity" : "Completes automatically when you do it"}</span> : (
                        <form action={setTaskDoneAction} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="week" value={n} /><input type="hidden" name="taskKey" value={task.key} /><input type="hidden" name="done" value={done ? "0" : "1"} />
                          {!done && <><label className="sr-only" htmlFor={`note-${task.key}`}>Optional note</label><input id={`note-${task.key}`} name="note" placeholder="Optional note" className="w-48 rounded-md border border-platinum/20 bg-midnight/70 px-2 py-1 text-xs text-ivory placeholder:text-slate-mist" /></>}
                          <Button type="submit" variant={done ? "ghost" : "secondary"} className="px-3 py-1 text-xs">{done ? "Undo" : "Mark done"}</Button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <aside className="space-y-5">
          <Card><Eyebrow className="mb-2">Objectives</Eyebrow><ul className="space-y-1.5 text-sm text-platinum/85">{w.week.objectives.map((o) => <li key={o} className="border-l-2 border-gold/50 pl-2">{o}</li>)}</ul></Card>
          <Card><div className="flex justify-between text-sm">{n > 1 ? <Link href={`/program/${n - 1}`} className="text-gold hover:underline">← Week {n - 1}</Link> : <span />}<Link href="/program" className="text-slate-mist hover:text-gold">All weeks</Link>{n < 24 ? <Link href={`/program/${n + 1}`} className="text-gold hover:underline">Week {n + 1} →</Link> : <span />}</div></Card>
        </aside>
      </div>
    </>
  );
}
