import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/roles";
import { filterGraph, filterOptions, layoutGraph, loadNetworkGraph, type NetworkFilters } from "@/lib/data/network";
import { NetworkGraphView } from "@/components/network/graph";
import { GeoMap } from "@/components/network/geo-map";
import { Card, Eyebrow, PageHeader, Select, Input, Button } from "@/components/ui/primitives";
import { VERIFICATION_META, VerificationBadge } from "@/components/research/status";

export const metadata: Metadata = { title: "Capital Network" };

type SP = Record<string, string | string[] | undefined>;
const str = (sp: SP, k: string) => (typeof sp[k] === "string" && sp[k]!.trim() ? (sp[k] as string).trim() : undefined);

export default async function NetworkPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const db = await getDb();
  const full = await loadNetworkGraph(db, can(user.role, "research:read_drafts"));
  const filters: NetworkFilters = {
    investor: str(sp, "investor"), institution: str(sp, "institution"), transaction: str(sp, "transaction"), relationship: str(sp, "relationship"),
    status: str(sp, "status"), geography: str(sp, "geography"), assetClass: str(sp, "assetClass"),
    yearFrom: str(sp, "yearFrom") ? Number(sp.yearFrom) : undefined, yearTo: str(sp, "yearTo") ? Number(sp.yearTo) : undefined,
  };
  const active = Object.values(filters).some((v) => v != null && v !== "");
  const graph = active ? filterGraph(full, filters) : full;
  const options = filterOptions(full);
  const positions = Object.fromEntries(layoutGraph(graph));
  const view = str(sp, "view") === "map" ? "map" : str(sp, "view") === "table" ? "table" : "graph";
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n] as const));
  const keep = Object.fromEntries(Object.entries(sp).filter(([k, v]) => k !== "view" && typeof v === "string" && v)) as Record<string, string>;
  const viewHref = (v: string) => `/network?${new URLSearchParams({ ...keep, view: v }).toString()}`;
  return (
    <>
      <PageHeader eyebrow="Capital Network Explorer" title="Evidence-linked relationships" description="Investors, institutions and transactions connected only where a sourced claim supports the edge. Edge style encodes verification status. Filter, click a node for its evidence, and jump to the dossier, institution or transaction." actions={
        <div className="flex gap-1 rounded-md border border-platinum/20 p-0.5 text-xs">{(["graph", "map", "table"] as const).map((v) => <Link key={v} href={viewHref(v)} className={`rounded px-3 py-1.5 capitalize ${view === v ? "bg-gold text-ink" : "text-platinum hover:text-gold"}`}>{v}</Link>)}</div>
      } />
      <Card className="mb-5">
        <form method="get" className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          <input type="hidden" name="view" value={view} />
          <label className="text-xs text-platinum/80">Investor<Select name="investor" defaultValue={filters.investor ?? ""} className="mt-1 py-2 text-xs"><option value="">Any</option>{options.investors.map((o) => <option key={o.slug} value={o.slug}>{o.label}</option>)}</Select></label>
          <label className="text-xs text-platinum/80">Institution<Select name="institution" defaultValue={filters.institution ?? ""} className="mt-1 py-2 text-xs"><option value="">Any</option>{options.institutions.map((o) => <option key={o.slug} value={o.slug}>{o.label}</option>)}</Select></label>
          <label className="text-xs text-platinum/80">Transaction<Select name="transaction" defaultValue={filters.transaction ?? ""} className="mt-1 py-2 text-xs"><option value="">Any</option>{options.transactions.map((o) => <option key={o.slug} value={o.slug}>{o.label}</option>)}</Select></label>
          <label className="text-xs text-platinum/80">Relationship<Select name="relationship" defaultValue={filters.relationship ?? ""} className="mt-1 py-2 text-xs"><option value="">Any</option>{options.relationships.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}</Select></label>
          <label className="text-xs text-platinum/80">Evidence confidence<Select name="status" defaultValue={filters.status ?? ""} className="mt-1 py-2 text-xs"><option value="">Any</option>{options.statuses.map((s) => <option key={s} value={s}>{s === "hypothetical" ? "Hypothetical" : VERIFICATION_META[s as keyof typeof VERIFICATION_META]?.label ?? s}</option>)}</Select></label>
          <label className="text-xs text-platinum/80">Geography<Select name="geography" defaultValue={filters.geography ?? ""} className="mt-1 py-2 text-xs"><option value="">Any</option>{options.geographies.map((g) => <option key={g} value={g.split(" (")[0]}>{g.split(" (")[0]}</option>)}</Select></label>
          <label className="text-xs text-platinum/80">Asset class<Select name="assetClass" defaultValue={filters.assetClass ?? ""} className="mt-1 py-2 text-xs"><option value="">Any</option>{options.assetClasses.map((a) => <option key={a} value={a}>{a}</option>)}</Select></label>
          <label className="text-xs text-platinum/80">Year from<Input name="yearFrom" type="number" defaultValue={filters.yearFrom ?? ""} placeholder={String(options.yearMin ?? "")} className="mt-1 py-2 text-xs" /></label>
          <label className="text-xs text-platinum/80">Year to<Input name="yearTo" type="number" defaultValue={filters.yearTo ?? ""} placeholder={String(options.yearMax ?? "")} className="mt-1 py-2 text-xs" /></label>
          <div className="flex items-end gap-2"><Button type="submit" className="py-2 text-xs">Apply</Button><Link href={`/network?view=${view}`} className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold">Clear</Link></div>
        </form>
        <p className="mt-3 text-xs text-slate-mist">{graph.nodes.length} nodes · {graph.edges.length} relationships · {graph.edges.filter((e) => e.isHypothetical).length} hypothetical{active ? ` · filtered from ${full.nodes.length} / ${full.edges.length}` : ""}. Nothing is drawn that a claim does not support.</p>
      </Card>

      {view === "graph" && (graph.edges.length ? <NetworkGraphView graph={graph} positions={positions} /> : <Card><p className="text-sm text-slate-mist">No relationships match these filters.</p></Card>)}
      {view === "map" && <GeoMap nodes={graph.nodes} />}
      {view === "table" && (
        <div className="card overflow-x-auto p-2 sm:p-4">
          <table className="w-full text-sm">
            <thead className="text-left text-[0.65rem] uppercase tracking-[0.16em] text-slate-mist"><tr><th className="p-2 font-medium">From</th><th className="p-2 font-medium">Relationship</th><th className="p-2 font-medium">To</th><th className="p-2 font-medium">Years</th><th className="p-2 font-medium">Evidence</th></tr></thead>
            <tbody>
              {graph.edges.map((e) => { const s = nodeById.get(e.source)!; const t = nodeById.get(e.target)!; return (
                <tr key={e.id} className="border-t hairline align-top">
                  <td className="p-2 text-ivory"><Link href={s.href} className="hover:text-gold">{s.label}</Link></td>
                  <td className="p-2 text-gold-soft">{e.relationship.replace(/_/g, " ")}</td>
                  <td className="p-2 text-ivory"><Link href={t.href} className="hover:text-gold">{t.label}</Link>{e.description && <p className="text-xs text-slate-mist">{e.description}</p>}</td>
                  <td className="p-2 numeric text-platinum/75">{e.startYear ?? "—"}{e.endYear ? `–${e.endYear}` : ""}</td>
                  <td className="p-2">{e.status === "hypothetical" ? <span className="text-xs text-sky-200">hypothetical</span> : <Link href={`/evidence/claims/${e.claimSlug}`}><VerificationBadge status={e.status} size="xs" /></Link>}</td>
                </tr>); })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs text-slate-mist"><Eyebrow className="inline">Known gaps</Eyebrow> Lender nodes for the private-era Zell property deals and for Blackstone’s 2007 acquisition financing are not in the corpus and are deliberately absent rather than guessed.</p>
    </>
  );
}
