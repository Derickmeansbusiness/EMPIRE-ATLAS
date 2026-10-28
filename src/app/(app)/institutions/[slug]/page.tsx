import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/roles";
import { filterGraph, getInstitution, loadNetworkGraph } from "@/lib/data/network";
import { getClaimsWithSources } from "@/lib/data/research";
import { bookmarkedIds } from "@/lib/data/workspace";
import { claims } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { ClaimCard } from "@/components/research/claim-card";
import { VerificationBadge } from "@/components/research/status";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const db = await getDb(); const r = await getInstitution(db, (await params).slug, true);
  return { title: r ? r.institution.name : "Institution" };
}

export default async function InstitutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const db = await getDb();
  const includeDrafts = can(user.role, "research:read_drafts");
  const r = await getInstitution(db, slug, includeDrafts);
  if (!r) notFound();
  const { institution } = r;
  const [graph, instClaims, bookmarks] = await Promise.all([loadNetworkGraph(db, includeDrafts), getClaimsWithSources(db, eq(claims.institutionId, institution.id), includeDrafts), bookmarkedIds(db, user.id, "claim")]);
  const ego = filterGraph(graph, { institution: slug });
  const nodeById = new Map(ego.nodes.map((n) => [n.id, n] as const));
  const self = ego.nodes.find((n) => n.kind === "institution" && n.slug === slug);
  return (
    <>
      <PageHeader eyebrow={`Institution · ${institution.kind.replace(/_/g, " ")}${institution.headquarters ? ` · ${institution.headquarters}` : ""}`} title={institution.name} description={institution.summary ?? undefined} actions={<Link href={`/network?institution=${slug}`} className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold">View in network</Link>} />
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <Card>
            <Eyebrow className="mb-3">Documented relationships ({ego.edges.length})</Eyebrow>
            {ego.edges.length === 0 ? <p className="text-sm text-slate-mist">No evidence-linked relationships recorded yet.</p> : (
              <ul className="space-y-2">
                {ego.edges.map((e) => { const other = nodeById.get(e.source === self?.id ? e.target : e.source)!; const outgoing = e.source === self?.id; return (
                  <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border hairline p-3 text-sm">
                    <span><span className="text-gold-soft">{outgoing ? "" : "← "}{e.relationship.replace(/_/g, " ")}</span> <Link href={other.href} className="text-ivory hover:text-gold">{other.label}</Link>{e.startYear ? <span className="text-xs text-slate-mist"> · {e.startYear}</span> : null}{e.description && <p className="text-xs text-slate-mist">{e.description}</p>}</span>
                    {e.claimSlug && <Link href={`/evidence/claims/${e.claimSlug}`}>{e.status === "hypothetical" ? <span className="text-xs text-sky-200">hypothetical</span> : <VerificationBadge status={e.status} size="xs" />}</Link>}
                  </li>); })}
              </ul>
            )}
          </Card>
          <section>
            <Eyebrow className="mb-3">Claims about this institution ({instClaims.length})</Eyebrow>
            <div className="space-y-3">{instClaims.map((c) => <ClaimCard key={c.id} claim={c} bookmarked={bookmarks.has(c.id)} returnTo={`/institutions/${slug}`} compact />)}</div>
            {instClaims.length === 0 && <p className="text-sm text-slate-mist">No claims are attached directly to this institution yet.</p>}
          </section>
        </div>
        <aside className="space-y-5">
          <Card>
            <Eyebrow className="mb-2">Record</Eyebrow>
            <dl className="space-y-2 text-sm">
              {institution.foundedYear && <div><dt className="text-slate-mist">Founded</dt><dd className="numeric">{institution.foundedYear}</dd></div>}
              {institution.headquarters && <div><dt className="text-slate-mist">Headquarters</dt><dd>{institution.headquarters}</dd></div>}
              {institution.geoLabel && <div><dt className="text-slate-mist">Map location</dt><dd>{institution.geoLabel}</dd></div>}
              <div><dt className="text-slate-mist">Status</dt><dd>{institution.publishStatus}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-slate-mist">Full institutional dossiers with twelve analytical divisions are on the research roadmap. This page shows what the evidence base documents today.</p>
          </Card>
          <Card>
            <Eyebrow className="mb-2">Connected</Eyebrow>
            <ul className="space-y-1 text-sm">{ego.nodes.filter((n) => n.id !== self?.id).map((n) => <li key={n.id}><Link href={n.href} className="text-ivory hover:text-gold">{n.label}</Link> <span className="text-xs text-slate-mist">· {n.kind}</span></li>)}</ul>
          </Card>
        </aside>
      </div>
    </>
  );
}
