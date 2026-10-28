import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { evidenceSummary, getDossier, listInvestorRoadmap, listTransactions } from "@/lib/data/research";
import { listBookmarks, listNotes, recentActivity, workspaceSummary } from "@/lib/data/workspace";
import { Alert, Card, Eyebrow, LinkButton, PageHeader, Stat } from "@/components/ui/primitives";
import { VerificationBadge } from "@/components/research/status";
import { formatHistoricalDate, formatRelative, researcherLabel } from "@/lib/format";
import { MODULES } from "@/lib/modules";

export const metadata: Metadata = { title: "Command Center" };

const RITUAL = [
  ["Monday", "Research historical context and sources", "/evidence/sources"],
  ["Tuesday", "Reconstruct acquisitions and financial structures", "/deals"],
  ["Wednesday", "Map networks, strategies and institutional relationships", "/network"],
  ["Thursday", "Translate historical principles into a modern U.S. case", "/lab"],
  ["Friday", "Present findings to an investment committee", "/roadmap"],
] as const;

export default async function CommandCenterPage({ searchParams }: { searchParams: Promise<{ welcome?: string; denied?: string }> }) {
  const user = await requireUser();
  const db = await getDb();
  const sp = await searchParams;
  const [summary, notes, bookmarks, activity, roadmap, txs, evidence, zell] = await Promise.all([
    workspaceSummary(db, user.id), listNotes(db, user.id, { limit: 5 }), listBookmarks(db, user.id), recentActivity(db, user.id, 6),
    listInvestorRoadmap(db), listTransactions(db), evidenceSummary(db), getDossier(db, "sam-zell"),
  ]);
  const published = roadmap.filter((i) => i.publishStatus === "published");
  const featuredInvestor = published[0];
  const featuredTx = txs[0];
  const dayIndex = (new Date().getDay() + 6) % 7; // Monday = 0
  const todayRitual = RITUAL[Math.min(dayIndex, 4)]!;
  const openedDossier = summary.dossiers_opened > 0;
  const next = !openedDossier
    ? { title: "Open the Sam Zell dossier", body: "Start with the founding case: distressed property, REIT capital and the 2007 sale.", href: "/dossiers/sam-zell" }
    : summary.transactions_opened === 0
      ? { title: "Reconstruct the Equity Office sale", body: "Follow the sources and uses, and see what is documented versus estimated.", href: "/deals/equity-office-sale-2007" }
      : summary.notes === 0
        ? { title: "Write your first research note", body: "Attach it to a claim so it stays connected to the evidence.", href: "/dossiers/sam-zell#evidence" }
        : { title: "Model a modern distressed acquisition", body: "Take the Zell principles into the underwriter with explicitly hypothetical inputs.", href: "/lab/underwriter" };

  return (
    <>
      <PageHeader eyebrow={`${researcherLabel(user.researcherNumber) ?? "Researcher"} · ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`} title={`Welcome back, ${user.displayName.split(" ")[0]}.`} description="Everything on this page is derived from stored records: your notes, bookmarks and activity, and the platform's published evidence." />
      {sp.welcome && <div className="mb-6"><Alert tone="success">Your research account is ready. Start with the recommended investigation below.</Alert></div>}
      {sp.denied && <div className="mb-6"><Alert tone="warning">That area requires an administrative role.</Alert></div>}

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
          <Eyebrow className="mb-2">Weekly research ritual</Eyebrow>
          <ol className="space-y-2">
            {RITUAL.map(([day, task, href]) => (
              <li key={day} className={`flex gap-3 text-xs ${day === todayRitual[0] ? "text-ivory" : "text-slate-mist"}`}>
                <span className={`w-20 shrink-0 uppercase tracking-[0.16em] ${day === todayRitual[0] ? "text-gold" : ""}`}>{day}</span>
                <Link href={href} className="hover:text-gold">{task}</Link>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[0.65rem] text-slate-mist">Progress tracking and reminders for the ritual arrive in Phase 5. Today’s focus is highlighted.</p>
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
          <p className="text-sm text-platinum/80">Saved models: <span className="numeric text-ivory">{summary.models}</span>. Principles: <span className="numeric text-ivory">{summary.principles}</span>.</p>
          <p className="mt-2 text-xs text-slate-mist">All seven lab tools are live with saved, versioned models. Simulations and the doctrine workspace are scheduled for later phases.</p>
          <LinkButton href="/lab" variant="secondary" className="mt-3 text-xs">Open the lab</LinkButton>
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
