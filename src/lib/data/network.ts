/**
 * Capital network: evidence-linked graph built from `relationships`, with pure, testable filtering.
 */
import { eq } from "drizzle-orm";
import type { AtlasDb } from "@/db/client";
import { claims, institutions, investors, relationships, transactions, type VerificationStatus } from "@/db/schema";

export type NodeKind = "investor" | "institution" | "transaction";

export interface NetworkNode {
  id: string; kind: NodeKind; slug: string; label: string; subKind: string;
  geoLabel: string | null; lat: number | null; lng: number | null; assetClasses: string[]; href: string; summary: string | null;
}
export interface NetworkEdge {
  id: string; source: string; target: string; relationship: string; startYear: number | null; endYear: number | null; description: string | null;
  claimSlug: string | null; claimText: string | null; status: VerificationStatus | "hypothetical"; isHypothetical: boolean;
}
export interface NetworkGraph { nodes: NetworkNode[]; edges: NetworkEdge[] }

export interface NetworkFilters {
  investor?: string;          // investor slug (keeps the investor's ego-network)
  institution?: string;       // institution slug
  transaction?: string;       // transaction slug
  relationship?: string;      // relationship kind
  status?: string;            // verification status
  yearFrom?: number; yearTo?: number;
  geography?: string;         // substring of geo label
  assetClass?: string;        // substring of asset class / transaction class
}

export async function loadNetworkGraph(db: AtlasDb, includeDrafts = false): Promise<NetworkGraph> {
  const [rels, invs, insts, txs, cls] = await Promise.all([
    db.select().from(relationships),
    db.select().from(investors).where(includeDrafts ? undefined : eq(investors.publishStatus, "published")),
    db.select().from(institutions).where(includeDrafts ? undefined : eq(institutions.publishStatus, "published")),
    db.select().from(transactions).where(includeDrafts ? undefined : eq(transactions.publishStatus, "published")),
    db.select({ id: claims.id, slug: claims.slug, text: claims.claimText, status: claims.verificationStatus }).from(claims),
  ]);
  const claimById = new Map(cls.map((c) => [c.id, c] as const));
  const nodes = new Map<string, NetworkNode>();
  for (const i of invs) nodes.set(`investor:${i.id}`, { id: `investor:${i.id}`, kind: "investor", slug: i.slug, label: i.fullName, subKind: "individual", geoLabel: i.geoLabel, lat: i.latitude, lng: i.longitude, assetClasses: i.primaryAssetClasses, href: `/dossiers/${i.slug}`, summary: i.headline });
  for (const i of insts) nodes.set(`institution:${i.id}`, { id: `institution:${i.id}`, kind: "institution", slug: i.slug, label: i.name, subKind: i.kind, geoLabel: i.geoLabel, lat: i.latitude, lng: i.longitude, assetClasses: [], href: `/institutions/${i.slug}`, summary: i.summary });
  for (const t of txs) nodes.set(`transaction:${t.id}`, { id: `transaction:${t.id}`, kind: "transaction", slug: t.slug, label: t.name, subKind: "transaction", geoLabel: t.geoLabel, lat: t.latitude, lng: t.longitude, assetClasses: t.assetClass ? [t.assetClass] : [], href: `/deals/${t.slug}`, summary: t.summary });
  const edges: NetworkEdge[] = [];
  for (const r of rels) {
    const source = r.fromInvestorId ? `investor:${r.fromInvestorId}` : r.fromInstitutionId ? `institution:${r.fromInstitutionId}` : null;
    const target = r.toInvestorId ? `investor:${r.toInvestorId}` : r.toInstitutionId ? `institution:${r.toInstitutionId}` : r.toTransactionId ? `transaction:${r.toTransactionId}` : null;
    if (!source || !target || !nodes.has(source) || !nodes.has(target)) continue;
    const claim = r.claimId ? claimById.get(r.claimId) : undefined;
    edges.push({ id: r.id, source, target, relationship: r.relationship, startYear: r.startYear, endYear: r.endYear, description: r.description, claimSlug: claim?.slug ?? null, claimText: claim?.text ?? null, status: claim?.status ?? "hypothetical", isHypothetical: r.isHypothetical });
  }
  // Only keep nodes that participate in at least one edge (plus explicitly published investors, which anchor the view).
  const connected = new Set<string>(); for (const e of edges) { connected.add(e.source); connected.add(e.target); }
  return { nodes: Array.from(nodes.values()).filter((n) => connected.has(n.id) || n.kind === "investor"), edges };
}

/** Pure filter; keeps edges that match every active filter and nodes touched by those edges. */
export function filterGraph(graph: NetworkGraph, f: NetworkFilters): NetworkGraph {
  const bySlug = new Map(graph.nodes.map((n) => [`${n.kind}:${n.slug}`, n] as const));
  const anchor = (kind: NodeKind, slug?: string) => (slug ? bySlug.get(`${kind}:${slug}`)?.id ?? "__none__" : null);
  const inv = anchor("investor", f.investor); const inst = anchor("institution", f.institution); const tx = anchor("transaction", f.transaction);
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n] as const));
  const geo = f.geography?.trim().toLowerCase(); const ac = f.assetClass?.trim().toLowerCase();
  const edges = graph.edges.filter((e) => {
    const s = nodeById.get(e.source)!; const t = nodeById.get(e.target)!;
    if (inv && e.source !== inv && e.target !== inv) return false;
    if (inst && e.source !== inst && e.target !== inst) return false;
    if (tx && e.source !== tx && e.target !== tx) return false;
    if (f.relationship && e.relationship !== f.relationship) return false;
    if (f.status && e.status !== f.status) return false;
    if (f.yearFrom != null && e.startYear != null && (e.endYear ?? e.startYear) < f.yearFrom) return false;
    if (f.yearTo != null && e.startYear != null && e.startYear > f.yearTo) return false;
    if (geo && !(s.geoLabel ?? "").toLowerCase().includes(geo) && !(t.geoLabel ?? "").toLowerCase().includes(geo)) return false;
    if (ac && ![...s.assetClasses, ...t.assetClasses].some((x) => x.toLowerCase().includes(ac))) return false;
    return true;
  });
  const keep = new Set<string>(); for (const e of edges) { keep.add(e.source); keep.add(e.target); }
  return { nodes: graph.nodes.filter((n) => keep.has(n.id)), edges };
}

export function filterOptions(graph: NetworkGraph) {
  const years = graph.edges.map((e) => e.startYear).filter((y): y is number => y != null);
  return {
    investors: graph.nodes.filter((n) => n.kind === "investor").map((n) => ({ slug: n.slug, label: n.label })),
    institutions: graph.nodes.filter((n) => n.kind === "institution").map((n) => ({ slug: n.slug, label: n.label })).sort((a, b) => a.label.localeCompare(b.label)),
    transactions: graph.nodes.filter((n) => n.kind === "transaction").map((n) => ({ slug: n.slug, label: n.label })),
    relationships: Array.from(new Set(graph.edges.map((e) => e.relationship))).sort(),
    statuses: Array.from(new Set(graph.edges.map((e) => e.status))),
    geographies: Array.from(new Set(graph.nodes.map((n) => n.geoLabel).filter((g): g is string => !!g))).sort(),
    assetClasses: Array.from(new Set(graph.nodes.flatMap((n) => n.assetClasses))).sort(),
    yearMin: years.length ? Math.min(...years) : null, yearMax: years.length ? Math.max(...years) : null,
  };
}

/** Deterministic concentric layout: investors centre, institutions middle ring, transactions outer ring. */
export function layoutGraph(graph: NetworkGraph, width = 1100, height = 700): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  const cx = width / 2; const cy = height / 2;
  const ring = (nodes: NetworkNode[], radius: number, offset = 0) => {
    nodes.forEach((n, i) => { const a = offset + (2 * Math.PI * i) / Math.max(1, nodes.length); pos.set(n.id, { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) }); });
  };
  const inv = graph.nodes.filter((n) => n.kind === "investor"); const inst = graph.nodes.filter((n) => n.kind === "institution"); const tx = graph.nodes.filter((n) => n.kind === "transaction");
  if (inv.length === 1) pos.set(inv[0]!.id, { x: cx, y: cy }); else ring(inv, 90);
  ring(inst, Math.min(cx, cy) * 0.62, -Math.PI / 2);
  ring(tx, Math.min(cx, cy) * 0.95, Math.PI / 6);
  return pos;
}

export async function getInstitution(db: AtlasDb, slug: string, includeDrafts = false) {
  const inst = await db.query.institutions.findFirst({ where: eq(institutions.slug, slug) });
  if (!inst || (!includeDrafts && inst.publishStatus !== "published")) return null;
  const instClaims = await db.select().from(claims).where(eq(claims.institutionId, inst.id));
  return { institution: inst, claims: instClaims };
}
