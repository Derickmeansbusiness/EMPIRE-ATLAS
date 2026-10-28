import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { requireCapability } from "@/lib/auth/current-user";
import { claims, investors } from "@/db/schema";
import { Alert, Card, PageHeader } from "@/components/ui/primitives";
import { VerificationBadge } from "@/components/research/status";
import { ReviewForm } from "@/components/research/review-form";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Claims Verification" };

export default async function AdminClaims({ searchParams }: { searchParams: Promise<{ status?: string; reviewed?: string; error?: string }> }) {
  await requireCapability("claims:review");
  const sp = await searchParams;
  const db = await getDb();
  const rows = await db.select({ claim: claims, investor: investors }).from(claims).leftJoin(investors, eq(investors.id, claims.investorId)).orderBy(asc(claims.verificationStatus), asc(claims.slug));
  const filter = sp.status ?? "needs_review";
  const filtered = filter === "all" ? rows : filter === "needs_review" ? rows.filter((r) => ["unverified", "contested"].includes(r.claim.verificationStatus)) : rows.filter((r) => r.claim.verificationStatus === filter);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Claims verification queue" description="Change a claim's verification status only after checking the source. Every change is logged with your name and note, and shown on the claim's public record." />
      {sp.reviewed && <div className="mb-5"><Alert tone="success">Review recorded.</Alert></div>}
      {sp.error && <div className="mb-5"><Alert tone="error">The review could not be recorded.</Alert></div>}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {[["needs_review", "Needs review"], ["all", "All"], ["verified_primary", "Primary"], ["supported_secondary", "Secondary"], ["contested", "Contested"], ["unverified", "Unverified"], ["hypothetical", "Hypothetical"]].map(([k, label]) => <Link key={k} href={`/admin/claims?status=${k}`} className={`rounded-full border px-3 py-1 text-xs ${filter === k ? "border-gold text-gold" : "border-platinum/20 text-platinum/70 hover:border-gold"}`}>{label}</Link>)}
      </div>
      <div className="space-y-4">
        {filtered.length === 0 && <Card><p className="text-sm text-slate-mist">Nothing in this queue.</p></Card>}
        {filtered.map(({ claim, investor }) => (
          <Card key={claim.id}>
            <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
              <div>
                <div className="flex flex-wrap items-center gap-2"><VerificationBadge status={claim.verificationStatus} size="xs" /><span className="text-xs text-slate-mist">{investor?.fullName} · {claim.category} · {claim.lastReviewedAt ? `reviewed ${formatRelative(claim.lastReviewedAt)}` : "never reviewed"}</span></div>
                <p className="mt-2 text-sm text-ivory">{claim.claimText}</p>
                {claim.researcherNotes && <p className="mt-2 text-xs text-platinum/70">{claim.researcherNotes}</p>}
                <Link href={`/evidence/claims/${claim.slug}`} className="mt-2 inline-block text-xs text-gold hover:underline">Open evidence record →</Link>
              </div>
              <ReviewForm claimId={claim.id} current={claim.verificationStatus} returnTo={`/admin/claims?status=${filter}`} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
