import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./helpers/db";
import type { AtlasDatabase } from "@/db/client";
import { seedResearch } from "@/db/seed";
import { filterGraph, filterOptions, getInstitution, layoutGraph, loadNetworkGraph, type NetworkGraph } from "@/lib/data/network";

let database: AtlasDatabase; let graph: NetworkGraph;
beforeAll(async () => { database = await freshDatabase(); await seedResearch(database.db); graph = await loadNetworkGraph(database.db); });
afterAll(async () => { await database.close(); });

describe("network graph", () => {
  it("builds nodes and evidence-linked edges from the seed, with no orphan edges", () => {
    expect(graph.edges.length).toBe(14);
    const ids = new Set(graph.nodes.map((n) => n.id));
    for (const e of graph.edges) { expect(ids.has(e.source)).toBe(true); expect(ids.has(e.target)).toBe(true); expect(e.claimSlug, `edge ${e.relationship} lacks a claim`).not.toBeNull(); expect(e.isHypothetical).toBe(false); }
    expect(graph.nodes.some((n) => n.kind === "transaction")).toBe(true);
  });
  it("filters by investor, relationship, status, year, geography and asset class", () => {
    expect(filterGraph(graph, { investor: "sam-zell" }).edges.every((e) => e.source.startsWith("investor:") || e.target.startsWith("investor:"))).toBe(true);
    expect(filterGraph(graph, { relationship: "co_founded" }).edges.every((e) => e.relationship === "co_founded")).toBe(true);
    expect(filterGraph(graph, { status: "verified_primary" }).edges.every((e) => e.status === "verified_primary")).toBe(true);
    const since2007 = filterGraph(graph, { yearFrom: 2007 });
    expect(since2007.edges.every((e) => e.startYear == null || e.startYear >= 2007)).toBe(true);
    expect(since2007.edges.length).toBeGreaterThan(0);
    expect(filterGraph(graph, { geography: "Boston" }).nodes.some((n) => n.slug === "beacon-capital-partners")).toBe(true);
    expect(filterGraph(graph, { assetClass: "Office" }).edges.length).toBeGreaterThan(0);
    expect(filterGraph(graph, { investor: "nobody" }).edges.length).toBe(0);
    const inst = filterGraph(graph, { institution: "blackstone" });
    expect(inst.edges.every((e) => e.source.includes("institution:") || e.target.includes("institution:"))).toBe(true);
    expect(inst.nodes.some((n) => n.slug === "blackstone")).toBe(true);
  });
  it("offers filter options and a deterministic layout", () => {
    const o = filterOptions(graph);
    expect(o.investors.map((i) => i.slug)).toEqual(["sam-zell"]);
    expect(o.relationships).toContain("acquired");
    expect(o.geographies).toContain("Chicago, IL");
    expect(o.yearMin).toBe(1968);
    const pos = layoutGraph(graph);
    expect(pos.size).toBe(graph.nodes.length);
    expect(pos.get("investor:" + graph.nodes.find((n) => n.kind === "investor")!.id.split(":")[1])).toEqual({ x: 550, y: 350 });
  });
  it("institution lookup respects publish status", async () => {
    expect((await getInstitution(database.db, "blackstone"))?.institution.name).toBe("Blackstone");
    expect(await getInstitution(database.db, "related-companies")).toBeNull();
    expect((await getInstitution(database.db, "related-companies", true))?.institution.slug).toBe("related-companies");
  });
});
