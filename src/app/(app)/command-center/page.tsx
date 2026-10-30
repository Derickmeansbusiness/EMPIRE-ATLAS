import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { evidenceSummary, getDossier, listInvestorRoadmap, listTransactions } from "@/lib/data/research";
import { listBookmarks, listNotes, recentActivity, workspaceSummary } from "@/lib/data/workspace";
import { simulationSummary } from "@/lib/data/simulations";
import { competencyFor } from "@/lib/data/progress";
import { ritualJournal } from "@/lib/data/study";
import { RITUAL_DAYS, ritualStreak, weekStartOf, weekdayNumber } from "@/lib/ritual";
import { minimumTierFor, type Feature } from "@/lib/entitlements";
import { Alert, Card, Eyebrow, LinkButton, PageHeader, Stat } from "@/components/ui/primitives";
import { VerificationBadge } from "@/components/research/status";
import { formatHistoricalDate, formatRelative, researcherLabel } from "@/lib/format";
import { MODULES } from "@/lib/modules";

export const metadata: Metadata = { title: "Command Center" };

export default async function CommandCenterPage({ searchParams }: { searchParams: Promise<{ welcome?: string; denied?: string; locked?: string; tier?: string }> }) {
  const user = await requireUser();
  const db = await getDb();
  const sp = await searchParams;
  const [summary, notes, bookmarks, activity, roadmap, txs, evidence, zell, sims, study, ritual] = await Promise.all([
    workspaceSummary(db, user.id), listNotes(db, user.id, { limit: 5 }), listBookmarks(db, user.id), recentActivity(db, user.id, 6),
    listInvestorRoadmap(db), listTransactions(db), evidenceSummary(db), getDossier(db, "sam-zell"), simulationSummary(db, user.id),
    competencyFor(db, user.id), ritualJournal(db, user.id, 200),
  ]);
  const nowD = new Date(); const ws = weekStartOf(nowD); const todayNo = weekdayNumber(nowD);
  const doneDays = new Set(ritual.filter((e) => e.weekStart === ws).map((e) => e.day));
  const streak = ritualStreak(ritual.map((e) => ({ weekStart: e.weekStart, day: e.day })), nowD);
  const todayPending = todayNo <= 5 && !doneDays.has(todayNo);
  const published = roadmap.filter((i) => i.publishStatus === "published");
  const featuredInvestor = published[0];
  const featuredTx = txs[0];
  const openedDossier = summary.dossiers_opened > 0;
  const next = !openedDossier
    ? { title: "Open the Sam Zell dossier", body: "Start with the founding case: distressed property, REIT capital and the 2007 sale.", href: "/dossiers/sam-zell" }
    : summary.transactions_opened === 0
      ? { title: "Reconstruct the Equity Office sale", body: "Follow the sources and uses, and see what is documented versus estimated.", href: "/deals/equity-office-sale-2007" }
      : summary.notes === 0
        ? { title: "Write your first research note", body: "Attach it to a claim so it stays connected to the evidence.", href: "/dossiers/sam-zell#evidence" }
        : sims.completed === 0
          ? { title: "Run the office-portfolio scenario", body: "Decide at the top of the cycle with only what was knowable then; the record is revealed afterwards.", href: "/simulator" }
          : sims.submissions === 0
            ? { title: "Defend a deal before the committee", body: "Attach a saved underwriting model and submit a thesis for a scored memo.", href: "/committee/new" }
            : study.program.recommended
              ? { title: `Continue the program: week ${study.program.recommended}`, body: study.program.statuses[study.program.recommended - 1]!.week.title, href: `/program/${study.program.recommended}` }
              : { title: "Model a modern distressed acquisition", body: "Take the Zell principles into the underwriter with explicitly hypothetical inputs.", href: "/lab/underwriter" };

  return (
    <>
      <PageHeader eyebrow={`${researcherLabel(user.researcherNumber) ?? "Researcher"} · ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`} title={`Welcome back, ${user.displayName.split(" ")[0]}.`} description="Everything on this page is derived from stored records: your notes, bookmarks and activity, and the platform's published evidence." />
      {sp.welcome && <div className="mb-6"><Alert tone="success">Your research account is ready. Start with the recommended investigation below.</Alert></div>}
      {sp.denied && <div className="mb-6"><Alert tone="warning">That area requires an administrative role.</Alert></div>}
      {sp.locked && <div className="mb-6"><Alert tone="warning">{sp.locked.replace(/_/g, " ")} is part of the {sp.tier ?? minimumTierFor(sp.locked as Feature)} membership tier. Ask an administrator to change your tier.</Alert></div>}
      {todayPending && <div className="mb-6"><Alert tone="info">Today’s ritual day ({RITUAL_DAYS[todayNo - 1]!.name}: {RITUAL_DAYS[todayNo - 1]!.task.toLowerCase()}) is not done yet. <Link href={`/ritual#day-${todayNo}`} className="ml-1 text-gold underline">Open the ritual</Link></Alert></div>}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 rise">
          <Eyebrow className="mb-2">Recommended next investigation</Eyebrow>
          <h2 className="font-serif text-2xl text-ivory">{next.title}</h2>
          <p className="mt-2 text-sm text-platinum/75">{next.body}</p>
          <div className="mt-4"><LinkButton href={next.href}>Go <ArrowRight className="h-4 w-4" /></LinkButton></div>
        </Card>
        <Card className="rise-2">
          <Eyebrow className="mb-3">Your research activity</Eyebrow>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Notes" value={String(summary.notes)} />
            <Stat label="Bookmarks" value={String(summary.bookmarks)} />
            <Stat label="Dossiers opened" value={String(summary.dossiers_opened)} />
            <Stat label="Deals opened" value={String(summary.transactions_opened)} />
          </div>
          <p className="mt-4 text-xs text-slate-mist">Last activity {formatRelative(summary.last_activity)}</p>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {featuredInvestor && (
          <Card className="rise-2">
            <Eyebrow className="mb-2">Featured investor</Eyebrow>
            <Link href={`/dossiers/${featuredInvestor.slug}`} className="font-serif text-2xl text-ivory hover:text-gold">{featuredInvestor.fullName}</Link>
            <p className="mt-1 text-xs text-slate-mist">{featuredInvestor.eraLabel}</p>
            <p className="mt-3 text-sm text-platinum/75">{featuredInvestor.headline}</p>
            {zell && <p className="mt-3 text-xs text-slate-mist">{zell.claims.length} claims · {zell.sections.length} divisions · {zell.events.length} events</p>}
          </Card>
        )}
        {featuredTx && (
          <Card className="rise-2">
            <Eyebrow className="mb-2">Featured transaction</Eyebrow>
            <Link href={`/deals/${featuredTx.tx.slug}`} className="font-serif text-xl leading-snug text-ivory hover:text-gold">{featuredTx.tx.name}</Link>
            <p className="mt-1 text-xs text-slate-mist">{formatHistoricalDate(featuredTx.tx.closedOn, featuredTx.tx.datePrecision)} · {featuredTx.tx.market}</p>
            <p className="mt-3 font-serif text-lg text-gold-soft">{featuredTx.tx.headlineValueLabel}</p>
          </Card>
        )}
        <Card className="rise-3">
          <Eyebrow className="mb-2">Source verification status</Eyebrow>
          <ul className="space-y-2">
            {(["verified_primary", "supported_secondary", "contested", "unverified", "hypothetical"] as const).map((s) => (
              <li key={s} className="flex items-center justify-between gap-2 text-xs"><VerificationBadge status={s} size="xs" /><span className="numeric text-ivory">{evidence[s] ?? 0}</span></li>
            ))}
          </ul>
          <Link href="/evidence/sources" className="mt-3 inline-block text-xs text-slate-mist hover:text-gold">Browse sources →</Link>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between"><Eyebrow>Research notes</Eyebrow><Link href="/library" className="text-xs text-slate-mist hover:text-gold">Library →</Link></div>
          {notes.length === 0 ? <p className="mt-3 text-sm text-slate-mist">No notes yet. Notes attached to claims appear here and on the claim.</p> : (
            <ul className="mt-3 divide-y hairline">
              {notes.map((n) => <li key={n.id} className="py-2.5"><Link href={`/library/notes/${n.id}`} className="text-sm text-ivory hover:text-gold">{n.title}</Link><p className="text-xs text-slate-mist">{formatRelative(n.updatedAt)}{n.tags.length ? ` · ${n.tags.join(", ")}` : ""}</p></li>)}
            </ul>
          )}
          <div className="mt-5 flex items-center justify-between"><Eyebrow>Saved dossiers &amp; bookmarks</Eyebrow></div>
          {bookmarks.length === 0 ? <p className="mt-3 text-sm text-slate-mist">Bookmark claims, investors or transactions to build your dossier shelf.</p> : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {bookmarks.slice(0, 5).map((b) => (
                <li key={b.bookmark.id} className="truncate text-platinum/85">
                  {b.claim && <Link href={`/evidence/claims/${b.claim.slug}`} className="hover:text-gold">{b.claim.claimText}</Link>}
                  {b.investor && <Link href={`/dossiers/${b.investor.slug}`} className="hover:text-gold">{b.investor.fullName}</Link>}
                  {b.transaction && <Link href={`/deals/${b.transaction.slug}`} className="hover:text-gold">{b.transaction.name}</Link>}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="flex items-center justify-between"><Eyebrow>Weekly research ritual</Eyebrow><Link href="/ritual" className="text-xs text-slate-mist hover:text-gold">Open →</Link></div>
          <ol className="mt-2 space-y-2">
            {RITUAL_DAYS.map((d) => (
              <li key={d.day} className={`flex items-start gap-3 text-xs ${d.day === todayNo ? "text-ivory" : "text-slate-mist"}`}>
                <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[0.6rem] ${doneDays.has(d.day) ? "border-positive bg-positive/20 text-positive" : "border-platinum/30 text-transparent"}`} aria-hidden="true">✓</span>
                <span className={`w-16 shrink-0 uppercase tracking-[0.14em] ${d.day === todayNo ? "text-gold" : ""}`}>{d.name.slice(0, 3)}</span>
                <Link href={d.href} className="hover:text-gold">{d.task}<span className="sr-only">{doneDays.has(d.day) ? " (done)" : " (not done)"}</span></Link>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[0.65rem] text-slate-mist">{doneDays.size} of 5 days complete this week · {streak}-week streak.</p>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card>
          <Eyebrow className="mb-2">Competency level</Eyebrow>
          <p className="font-serif text-2xl text-ivory">{study.competency.label}</p>
          {study.competency.next ? <p className="mt-2 text-xs text-slate-mist">Next: <span className="text-gold-soft">{study.competency.next.label}</span>. Still to do: {study.competency.next.missing.join("; ")}.</p> : <p className="mt-2 text-xs text-positive">Highest level reached.</p>}
          <Link href="/profile" className="mt-3 inline-block text-xs text-gold hover:underline">All levels and achievements →</Link>
        </Card>
        <Card>
          <Eyebrow className="mb-2">Six-month program</Eyebrow>
          <p className="font-serif text-2xl numeric text-ivory">{study.program.weeksComplete}<span className="text-base text-slate-mist"> / 24 weeks</span></p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gold" style={{ width: `${(study.program.weeksComplete / 24) * 100}%` }} /></div>
          {study.program.recommended ? <Link href={`/program/${study.program.recommended}`} className="mt-3 inline-block text-xs text-gold hover:underline">Week {study.program.recommended}: {study.program.statuses[study.program.recommended - 1]!.week.title} →</Link> : <p className="mt-3 text-xs text-positive">Program complete.</p>}
        </Card>
        <Card>
          <Eyebrow className="mb-2">Principles &amp; doctrine</Eyebrow>
          <p className="text-sm text-platinum/85"><span className="numeric text-ivory">{study.program.stats.principles}</span> principles · doctrine <span className="numeric text-ivory">{study.program.stats.doctrineFieldsFilled}</span>/8 sections</p>
          <div className="mt-3 flex gap-3 text-xs"><Link href="/synthesis" className="text-gold hover:underline">Synthesis →</Link><Link href="/doctrine" className="text-gold hover:underline">Doctrine →</Link><Link href="/quizzes" className="text-gold hover:underline">Quizzes →</Link></div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card>
          <Eyebrow className="mb-2">Recent activity</Eyebrow>
          {activity.length === 0 ? <p className="text-sm text-slate-mist">Nothing recorded yet.</p> : (
            <ul className="space-y-1.5 text-xs text-platinum/80">{activity.map((a) => <li key={a.id}><span className="text-gold-soft">{a.activityKind.replace(".", " · ")}</span> <span className="text-slate-mist">{formatRelative(a.createdAt)}</span></li>)}</ul>
          )}
        </Card>
        <Card>
          <Eyebrow className="mb-2">Financial modelling &amp; simulations</Eyebrow>
          <p className="text-sm text-platinum/80">Saved models: <span className="numeric text-ivory">{summary.models}</span>. Simulations completed: <span className="numeric text-ivory">{sims.completed}</span>{sims.bestScore != null ? <> (best <span className="numeric text-ivory">{sims.bestScore}</span>/100)</> : null}. Committee submissions: <span className="numeric text-ivory">{sims.submissions}</span>.</p>
          <p className="mt-2 text-xs text-slate-mist">{sims.inProgress > 0 ? `${sims.inProgress} scenario in progress.` : "Seven lab tools, two scenarios and the committee are live."}</p>
          <div className="mt-3 flex gap-2"><LinkButton href="/lab" variant="secondary" className="text-xs">Lab</LinkButton><LinkButton href="/simulator" variant="secondary" className="text-xs">Simulator</LinkButton><LinkButton href="/committee" variant="secondary" className="text-xs">Committee</LinkButton></div>
        </Card>
        <Card>
          <Eyebrow className="mb-2">Platform status</Eyebrow>
          <ul className="space-y-1 text-xs text-platinum/80">
            {MODULES.slice(0, 8).map((m) => <li key={m.key} className="flex items-center justify-between"><span>{m.title}</span><span className={m.status === "live" ? "text-positive" : m.status === "partial" ? "text-gold-soft" : "text-slate-mist"}>{m.status}</span></li>)}
          </ul>
          <Link href="/roadmap" className="mt-3 inline-block text-xs text-slate-mist hover:text-gold">Full roadmap →</Link>
        </Card>
      </div>
    </>
  );
}
