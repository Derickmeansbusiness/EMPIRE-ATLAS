import type { Metadata } from "next";
import { asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { historicalEvents, investors, transactions } from "@/db/schema";
import { getClaimsByIds } from "@/lib/data/research";
import { PageHeader } from "@/components/ui/primitives";
import { Timeline } from "@/components/research/timeline";

export const metadata: Metadata = { title: "Historical Timeline" };

export default async function TimelinePage() {
  await requireUser();
  const db = await getDb();
  const rows = await db.select({ e: historicalEvents, investor: investors, tx: transactions })
    .from(historicalEvents)
    .leftJoin(investors, eq(investors.id, historicalEvents.investorId))
    .leftJoin(transactions, eq(transactions.id, historicalEvents.transactionId))
    .where(inArray(investors.publishStatus, ["published"]))
    .orderBy(asc(historicalEvents.occurredOn), asc(historicalEvents.sortOrder));
  const claimIds = rows.map((r) => r.e.claimId).filter((x): x is string => !!x);
  const claims = await getClaimsByIds(db, claimIds);
  const claimById = new Map(claims.map((c) => [c.id, c] as const));
  const events = rows.map((r) => ({ ...r.e, title: r.investor ? `${r.investor.shortName}: ${r.e.title}` : r.e.title }));
  const txSlug = new Map(rows.filter((r) => r.tx).map((r) => [r.e.id, r.tx!.slug] as const));
  return (
    <>
      <PageHeader eyebrow="Historical Timeline" title="Dated milestones across published subjects" description="Each event links to the claim that supports it. Dates carry their own precision: a year, a month, or a day." />
      <div className="card p-5 sm:p-8"><Timeline events={events} claimById={claimById} hrefForEvent={(e) => (txSlug.get(e.id) ? `/deals/${txSlug.get(e.id)}` : null)} /></div>
    </>
  );
}
