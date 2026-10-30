import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { programState } from "@/lib/data/progress";
import { MONTHS } from "@/program/curriculum";
import { startProgramAction } from "@/app/actions/study";
import { Button, Card, Eyebrow, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Six-Month Research Program" };

export default async function ProgramPage() {
  const user = await requireUser();
  const db = await getDb();
  const p = await programState(db, user.id);
  const pct = Math.round((p.weeksComplete / 24) * 100);
  const rec = p.recommended;
  return (
    <>
      <PageHeader eyebrow="Six-month research program" title="Twenty-four weeks from reader to doctrine" description="A guided path through the dossiers, the lab, the simulator and the committee. Tasks that map to your stored work complete themselves; self-directed research tasks you mark yourself. Work at your own pace: the next week is whichever you have not finished." />
      <div className="mb-6 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card>
          <div className="flex items-end justify-between gap-4"><div><Eyebrow className="mb-1">Progress</Eyebrow><p className="font-serif text-4xl numeric text-ivory">{p.weeksComplete}<span className="text-xl text-slate-mist"> / 24 weeks</span></p></div><span className="text-sm text-slate-mist numeric">{pct}%</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Program completion"><div className="h-full bg-gold" style={{ width: `${pct}%` }} /></div>
          {p.startedOn ? <p className="mt-3 text-xs text-slate-mist">Started {p.startedOn}.</p> : <form action={startProgramAction} className="mt-4"><Button type="submit">Start the program</Button><p className="mt-2 text-xs text-slate-mist">Starting only records the date. Everything you have already done counts.</p></form>}
        </Card>
        <Card><Eyebrow className="mb-1">Next</Eyebrow>{rec ? <><p className="font-serif text-xl text-ivory">Week {rec}: {p.statuses[rec - 1]!.week.title}</p><Link href={`/program/${rec}`} className="mt-2 inline-block text-sm text-gold hover:underline">Open this week →</Link></> : <p className="text-sm text-positive">All twenty-four weeks are complete.</p>}</Card>
      </div>
      <div className="space-y-6">
        {MONTHS.map((title, mi) => (
          <section key={title} aria-labelledby={`m${mi}`}>
            <h2 id={`m${mi}`} className="eyebrow mb-3">Month {mi + 1} · {title}</h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {p.statuses.filter((w) => w.week.month === mi + 1).map((w) => (
                <li key={w.week.week}>
                  <Link href={`/program/${w.week.week}`} className={`card block p-4 transition-colors hover:border-gold/60 ${rec === w.week.week ? "ring-1 ring-gold/60" : ""}`}>
                    <div className="flex items-center justify-between gap-2"><span className="text-xs uppercase tracking-[0.16em] text-gold">Week {w.week.week}</span><span className={`rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.12em] ${w.complete ? "border-positive/60 text-positive" : rec === w.week.week ? "border-gold/60 text-gold" : "border-platinum/25 text-slate-mist"}`}>{w.complete ? "Complete" : rec === w.week.week ? "Next" : `${w.doneCount}/${w.tasks.length}`}</span></div>
                    <p className="mt-1 font-serif text-lg text-ivory">{w.week.title}</p>
                    {w.week.selfDirected && <p className="mt-1 text-xs text-slate-mist">Self-directed research</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
