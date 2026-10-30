import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getDoctrine, listPrinciples } from "@/lib/data/study";
import { DOCTRINE_FIELDS, filledCount } from "@/lib/doctrine";
import { Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { DoctrineForm } from "@/components/study/forms";

export const metadata: Metadata = { title: "My Investment Doctrine" };

export default async function DoctrinePage() {
  const user = await requireUser();
  const db = await getDb();
  const [d, principles] = await Promise.all([getDoctrine(db, user.id), listPrinciples(db, user.id)]);
  const values = Object.fromEntries(DOCTRINE_FIELDS.map((f) => [f.key, (d?.[f.key as keyof typeof d] as string | null | undefined) ?? ""]));
  const filled = filledCount(d ?? null);
  return (
    <>
      <PageHeader eyebrow="My Investment Doctrine" title="What you will buy, how you will finance it, and when you will walk away" description="Eight sections, in your own words, backed by your principles. A section counts as written at 20 characters or more. Export it as a formatted document when it is ready." actions={<><a href="/doctrine/export?format=html" target="_blank" rel="noopener" className="rounded-md bg-gold px-3 py-2 text-xs text-ink">Open printable version</a><a href="/doctrine/export?format=md" className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold">Download Markdown</a></>} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card><DoctrineForm values={values} /></Card>
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <Card><Eyebrow className="mb-2">Progress</Eyebrow><p className="font-serif text-3xl numeric text-ivory">{filled}<span className="text-lg text-slate-mist"> / 8</span></p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gold" style={{ width: `${(filled / 8) * 100}%` }} /></div><p className="mt-3 text-xs text-slate-mist">The printable version opens in a new tab; use your browser’s Print command and choose Save as PDF.</p></Card>
          <Card><Eyebrow className="mb-2">Principles included in the export</Eyebrow>{principles.length === 0 ? <p className="text-sm text-slate-mist">None yet. <Link href="/synthesis" className="text-gold underline">Save a principle</Link>.</p> : <ul className="space-y-1.5 text-sm">{principles.map((p) => <li key={p.principle.id} className="text-platinum/85">· {p.principle.title}</li>)}</ul>}</Card>
          <Card><Eyebrow className="mb-2">Compare</Eyebrow><p className="text-xs text-slate-mist">See your sections beside a documented investor’s approach.</p><Link href="/synthesis/compare" className="mt-2 inline-block text-sm text-gold hover:underline">Open the comparison →</Link></Card>
        </aside>
      </div>
    </>
  );
}
