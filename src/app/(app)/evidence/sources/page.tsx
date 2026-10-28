import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listSources } from "@/lib/data/research";
import { PageHeader } from "@/components/ui/primitives";
import { formatHistoricalDate } from "@/lib/format";

export const metadata: Metadata = { title: "Sources" };

const TYPE_LABEL: Record<string, string> = { sec_filing: "SEC filing", exchange_notice: "Exchange notice", press_release: "Press release", news: "News", trade_press: "Trade press", book: "Book", academic: "Academic", other: "Other", court_record: "Court record", company_filing: "Company filing", annual_report: "Annual report", archive: "Archive", interview: "Interview", property_record: "Property record" };

export default async function SourcesPage() {
  await requireUser();
  const db = await getDb();
  const sources = await listSources(db);
  const groups = new Map<string, typeof sources>();
  for (const s of sources) { const k = s.sourceType; groups.set(k, [...(groups.get(k) ?? []), s]); }
  const order = ["sec_filing", "exchange_notice", "press_release", "court_record", "book", "academic", "news", "trade_press", "other"];
  return (
    <>
      <PageHeader eyebrow="Sources & Evidence" title="Source library" description="Every source record stores metadata, a reliability note and the claims it supports. Only short permitted excerpts are stored, never whole works." />
      <div className="space-y-8">
        {order.filter((k) => groups.has(k)).map((k) => (
          <section key={k}>
            <h2 className="eyebrow mb-3">{TYPE_LABEL[k] ?? k} · {groups.get(k)!.length}</h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {groups.get(k)!.map((s) => (
                <li key={s.id} className="card p-4">
                  <Link href={`/evidence/sources/${s.slug}`} className="font-serif text-lg leading-snug text-ivory hover:text-gold">{s.title}</Link>
                  <p className="mt-1 text-xs text-slate-mist">{[s.publisher, s.author, s.publishedOn ? formatHistoricalDate(s.publishedOn, "day") : null].filter(Boolean).join(" · ")}</p>
                  <p className="mt-2 text-xs text-platinum/70">{s.claim_count} linked claim{s.claim_count === 1 ? "" : "s"}{s.reliabilityNote ? ` · ${s.reliabilityNote}` : ""}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
