import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getProperty, listAttempts, listSessions } from "@/lib/data/fieldbook";
import { challengeForProperty } from "@/fieldbook/challenges";
import { ASSET_CLASS_LABELS, WALK_LIMITS_NOTICE, WALK_SAFETY_NOTICE, allItems, templateForClass } from "@/fieldbook/templates";
import { startWalkAction } from "@/app/actions/fieldbook";
import { Alert, Button, Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Property" };

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(); const { slug } = await params; const db = await getDb();
  const p = await getProperty(db, user.id, slug); if (!p) notFound();
  const c = challengeForProperty(p.slug); const sessions = await listSessions(db, user.id, p.id); const attempts = c ? await listAttempts(db, user.id, c.slug) : [];
  const t = templateForClass(p.assetClass); const draft = sessions.find((s) => s.status === "draft"); const latest = sessions[0];
  return (
    <>
      <PageHeader eyebrow={`Property Intelligence Lab · ${ASSET_CLASS_LABELS[p.assetClass]}${p.isFictional ? " · fictional" : ""}`} title={p.name} description={p.summary ?? undefined} actions={<Link href="/fieldbook" className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold">Fieldbook</Link>} />
      {p.isFictional && <Alert tone="info">Linden Court does not exist. Its figures and the things you will see on the walk are invented for training. No photographs are shown; you can attach your own images to practise the upload workflow.</Alert>}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card><Eyebrow className="mb-2">Facts</Eyebrow><dl className="space-y-1.5 text-sm"><div className="flex justify-between"><dt className="text-slate-mist">Units</dt><dd className="numeric text-ivory">{p.units ?? "n/a"}</dd></div><div className="flex justify-between"><dt className="text-slate-mist">Built</dt><dd className="numeric text-ivory">{p.yearBuilt ?? "n/a"}</dd></div><div className="flex justify-between"><dt className="text-slate-mist">Location</dt><dd className="text-ivory">{p.locationLabel ?? "n/a"}</dd></div></dl></Card>
        <Card><Eyebrow className="mb-2">1 · Statement</Eyebrow>{c ? <><p className="text-sm text-platinum/80">The seller’s trailing-12 and rent roll.</p><p className="mt-1 text-xs text-slate-mist">{attempts.length ? `Challenge attempted ${attempts.length}×, latest ${attempts[0]!.score}/${attempts[0]!.maxScore}` : "Challenge not attempted yet. You can still walk the property."}</p><Link href={`/fieldbook/challenges/${c.slug}`} className="mt-3 inline-block rounded-md border border-platinum/25 px-3 py-2 text-sm text-platinum hover:border-gold hover:text-gold">{attempts.length ? "Retry the challenge" : "Open the challenge"}</Link></> : <p className="text-sm text-platinum/75">No financial statement is attached to this property yet.</p>}</Card>
        <Card><Eyebrow className="mb-2">2 · Walk</Eyebrow><p className="text-sm text-platinum/80">{allItems(t).length}-item {t.title.toLowerCase()} across 17 categories.</p>
          <form action={startWalkAction} className="mt-3 flex flex-wrap gap-2"><input type="hidden" name="propertySlug" value={p.slug} /><Button type="submit">{draft ? "Resume the walk" : "Start a walk"}</Button>{draft && <Button type="submit" name="fresh" value="1" variant="secondary">Start a new one</Button>}</form></Card>
      </div>
      <Alert tone="warning">{WALK_SAFETY_NOTICE}</Alert>
      <p className="mt-3 text-xs text-slate-mist">{WALK_LIMITS_NOTICE}</p>

      <Card className="mt-8"><Eyebrow className="mb-3">Inspection history</Eyebrow>
        {sessions.length === 0 ? <p className="text-sm text-platinum/75">No walks yet.</p> : <ul className="divide-y hairline">{sessions.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm"><span className="text-ivory">{s.startedAt.toISOString().slice(0, 10)} <span className="ml-2 rounded-full border border-platinum/30 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.1em] text-platinum/80">{s.status === "draft" ? "Draft" : "Completed"}</span>{s.location && <span className="ml-2 text-xs text-slate-mist">location tagged</span>}</span>
            <span className="flex gap-4"><Link href={`/fieldbook/properties/${p.slug}/walk/${s.id}`} className="text-gold hover:underline">{s.status === "draft" ? "Continue" : "Review"}</Link>{c && <Link href={`/fieldbook/properties/${p.slug}/reconcile?session=${s.id}`} className="text-gold hover:underline">Reconcile</Link>}</span></li>))}</ul>}
        {latest && <p className="mt-2 text-xs text-slate-mist">Last activity {formatRelative(latest.updatedAt)}.</p>}
      </Card>
    </>
  );
}
