import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { investors } from "@/db/schema";
import { getDossier } from "@/lib/data/research";
import { getDoctrine } from "@/lib/data/study";
import { recordProgress } from "@/lib/data/workspace";
import { DOCTRINE_FIELDS } from "@/lib/doctrine";
import { investorProfile } from "@/lib/synthesis";
import { Card, Eyebrow, PageHeader, Select, Button } from "@/components/ui/primitives";
import { DossierBody } from "@/components/research/claim-text";

export const metadata: Metadata = { title: "Strategy Comparison" };

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ a?: string; b?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const db = await getDb();
  const [published, doctrine] = await Promise.all([db.select().from(investors).where(eq(investors.publishStatus, "published")), getDoctrine(db, user.id)]);
  const aSlug = sp.a ?? published[0]?.slug; const bSlug = sp.b ?? "doctrine";
  const A = aSlug ? await getDossier(db, aSlug) : null;
  const B = bSlug !== "doctrine" ? await getDossier(db, bSlug) : null;
  const ran = !!A && (bSlug === "doctrine" || !!B) && sp.a !== undefined;
  if (ran && A) await recordProgress(db, user.id, "synthesis.compared", "investor", A.investor.id, { b: bSlug });
  const left = A ? investorProfile(A.sections) : [];
  const right = B ? investorProfile(B.sections) : null;
  const labelB = B ? B.investor.fullName : "My doctrine";
  return (
    <>
      <PageHeader eyebrow="Strategy comparison engine" title="Side by side, section by section" description="Compare a documented investor’s approach with your own doctrine, or with another published investor. Each row maps a doctrine section to the dossier division that addresses it, with citations intact." />
      <Card className="mb-6">
        <form method="get" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-xs text-platinum/80">Investor<Select name="a" defaultValue={aSlug ?? ""} className="mt-1">{published.map((i) => <option key={i.slug} value={i.slug}>{i.fullName}</option>)}</Select></label>
          <label className="text-xs text-platinum/80">Compare with<Select name="b" defaultValue={bSlug} className="mt-1"><option value="doctrine">My doctrine</option>{published.filter((i) => i.slug !== aSlug).map((i) => <option key={i.slug} value={i.slug}>{i.fullName}</option>)}</Select></label>
          <Button type="submit">Compare</Button>
        </form>
        {published.length < 2 && <p className="mt-3 text-xs text-slate-mist">Only {published.length} dossier {published.length === 1 ? "is" : "are"} published, so investor-to-investor comparison unlocks as more dossiers are researched. Comparing against your own doctrine works now.</p>}
      </Card>
      {!ran && <Card><p className="text-sm text-slate-mist">Choose what to compare and press Compare. Running a comparison is recorded as study activity.</p></Card>}
      {ran && A && (
        <div className="space-y-4">
          <div className="hidden grid-cols-[170px_1fr_1fr] gap-4 px-1 text-xs uppercase tracking-[0.16em] text-gold md:grid"><span>Section</span><span>{A.investor.fullName}</span><span>{labelB}</span></div>
          {DOCTRINE_FIELDS.map((f, i) => {
            const l = left[i]!; const r = right?.[i];
            const mine = (doctrine?.[f.key as keyof typeof doctrine] as string | null | undefined)?.trim();
            return (
              <Card key={f.key} className="md:grid md:grid-cols-[170px_1fr_1fr] md:gap-4">
                <h2 className="font-serif text-lg text-ivory">{f.label}</h2>
                <div className="mt-3 md:mt-0"><p className="mb-1 text-xs uppercase tracking-[0.14em] text-gold md:hidden">{A.investor.fullName}</p>{l.excerpt ? <><DossierBody body={l.excerpt} claimMap={A.claimMap} /><Link href={`/dossiers/${A.investor.slug}#division-${l.division}`} className="mt-1 inline-block text-xs text-gold hover:underline">Division {l.division}: {l.divisionTitle} →</Link></> : <p className="text-sm text-slate-mist">No dossier division addresses this yet.</p>}</div>
                <div className="mt-3 md:mt-0"><p className="mb-1 text-xs uppercase tracking-[0.14em] text-gold md:hidden">{labelB}</p>
                  {B && r ? (r.excerpt ? <><DossierBody body={r.excerpt} claimMap={B.claimMap} /><Link href={`/dossiers/${B.investor.slug}#division-${r.division}`} className="mt-1 inline-block text-xs text-gold hover:underline">Division {r.division}: {r.divisionTitle} →</Link></> : <p className="text-sm text-slate-mist">Not addressed.</p>)
                    : mine ? <p className="whitespace-pre-line text-sm leading-relaxed text-platinum/90">{mine}</p> : <p className="text-sm text-slate-mist">Not written yet. <Link href="/doctrine" className="text-gold underline">Write this section</Link> to compare it.</p>}
                </div>
              </Card>
            );
          })}
          <Eyebrow className="pt-2">Reading the comparison</Eyebrow>
          <p className="text-xs leading-relaxed text-slate-mist">Dossier text is a research finding, not a recommendation. Differences are prompts for a note or a principle, not scores. Where the dossier says a division is thinly evidenced (see its confidence badge), treat the contrast with caution.</p>
        </div>
      )}
    </>
  );
}
