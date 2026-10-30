import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { freshDatabase } from "./helpers/db";
import type { AtlasDatabase } from "@/db/client";
import { seedResearch } from "@/db/seed";
import { loadCorpus } from "@/lib/data/corpus";
import { buildIndex, search, tokenize, type Hit, type Index } from "@/ai/retrieval";
import { aiStatus, askHistorian, buildContext, extractCitations, HistorianError, ROLES, systemPrompt, validateCitations } from "@/ai/historian";

let database: AtlasDatabase; let index: Index;
beforeAll(async () => { database = await freshDatabase(); await seedResearch(database.db); index = buildIndex(await loadCorpus(database.db)); });
afterAll(async () => { await database.close(); });

describe("corpus and retrieval", () => {
  it("indexes published claims, dossier sections, transactions and cases only", () => {
    const kinds = new Set(index.docs.map((d) => d.kind));
    expect(kinds).toEqual(new Set(["claim", "section", "transaction", "case"]));
    expect(index.docs.filter((d) => d.kind === "claim")).toHaveLength(32);
    expect(index.docs.filter((d) => d.kind === "section")).toHaveLength(12);
    expect(index.docs.some((d) => /stephen ross|donald bren/i.test(d.title))).toBe(false); // queued subjects have no content
    expect(new Set(index.docs.map((d) => d.ref)).size).toBe(index.docs.length);
    for (const d of index.docs) expect(d.text).not.toMatch(/\[\[claim:/); // citation tokens never leak into model context
  });
  it("finds the right evidence for representative questions", () => {
    const refs = (q: string, k = 3) => search(index, q, k).map((h) => h.doc.ref);
    expect(refs("when did the Equity Office merger become effective and what price per share")).toEqual(expect.arrayContaining(["claim:eop-merger-effective-2007-02-09"]));
    expect(refs("Equity Group Investments founding year 1964 1968")[0]).toBe("claim:egi-founding-year");
    expect(refs("Meridian Court foreclosure discounted payoff", 2).some((r) => r === "doc:case:meridian-court-distressed-multifamily")).toBe(true);
    expect(refs("Tribune bankruptcy ESOP leveraged buyout")).toEqual(expect.arrayContaining(["claim:tribune-lbo-2007"]));
    expect(search(index, "", 5)).toEqual([]);
    expect(search(index, "the of and is", 5)).toEqual([]);
    expect(search(index, "zzzzqqq xyzzy", 5)).toEqual([]);
    expect(search(index, "merger", 2)).toHaveLength(2);
  });
  it("tokenises with stop-word removal and light stemming", () => {
    expect(tokenize("The financing of properties was completed")).toEqual(["financ", "property", "complet"]);
    expect(tokenize("[[claim:foo-bar]] Price $55.50")).toEqual(["price", "55.50"]);
  });
});

describe("historian configuration and prompts", () => {
  it("reports an unconfigured state without a usable key and never exposes the key", () => {
    expect(aiStatus({} as NodeJS.ProcessEnv).configured).toBe(false);
    expect(aiStatus({ ANTHROPIC_API_KEY: "short" } as unknown as NodeJS.ProcessEnv).configured).toBe(false);
    const s = aiStatus({ ANTHROPIC_API_KEY: "sk-ant-this-is-a-long-enough-key-value", ATLAS_AI_DAILY_LIMIT: "5", ATLAS_AI_MODEL: "claude-test" } as unknown as NodeJS.ProcessEnv);
    expect(s).toEqual({ configured: true, model: "claude-test", dailyLimit: 5 });
    expect(JSON.stringify(s)).not.toContain("sk-ant");
    expect(aiStatus({} as NodeJS.ProcessEnv).model).toBe("claude-sonnet-5-5");
  });
  it("defines six roles and a system prompt that forbids unsupported claims", () => {
    expect(ROLES).toHaveLength(6);
    const p = systemPrompt("committee_examiner");
    expect(p).toMatch(/Investment Committee Examiner/);
    expect(p).toMatch(/ONLY from the CONTEXT/);
    expect(p).toMatch(/never present those as established fact/i);
    expect(p).toMatch(/Never invent figures/);
    expect(p).toMatch(/untrusted/);
  });
  it("builds context with references and statuses", () => {
    const hits = search(index, "egi founding year", 1);
    const ctx = buildContext(hits);
    expect(ctx).toContain("[[claim:egi-founding-year]]");
    expect(ctx).toContain("status=contested");
  });
});

describe("citation validation", () => {
  it("keeps retrieved references and strips invented ones", () => {
    const allowed = new Set(["claim:a", "doc:section:sam-zell-3"]);
    const r = validateCitations("Fact one [[claim:a]]. Fact two [[CLAIM:b]]. Fact three [[doc:section:sam-zell-3]].", allowed);
    expect(r.cited).toEqual(["claim:a", "doc:section:sam-zell-3"]);
    expect(r.unsupported).toEqual(["claim:b"]);
    expect(r.text).toContain("[citation removed: not in the retrieved evidence]");
    expect(r.text).not.toContain("claim:b");
    expect(extractCitations("x [[claim:a]] [[claim:a]] [[doc:case:z]]")).toEqual(["claim:a", "doc:case:z"]);
  });
});

describe("askHistorian", () => {
  const hits = (): Hit[] => search(index, "Equity Office merger effective February 2007 per share", 4);
  const ok = (text: string) => vi.fn(async () => new Response(JSON.stringify({ content: [{ type: "text", text }] }), { status: 200 })) as unknown as typeof fetch;

  it("does not call the model when retrieval finds nothing", async () => {
    const f = vi.fn(async () => { throw new Error("must not be called"); }) as unknown as typeof fetch;
    const r = await askHistorian({ apiKey: "k".repeat(30), model: "m", role: "historian", question: "zzzz", hits: [], fetchImpl: f });
    expect(r.usedModel).toBe(false);
    expect(r.answer).toMatch(/nothing on this question/);
    expect(f).not.toHaveBeenCalled();
  });
  it("sends a grounded request and removes unsupported citations from the answer", async () => {
    const h = hits(); const first = h[0]!.doc.ref;
    const f = ok(`The merger became effective on February 9, 2007 [[${first}]]. A rumoured figure [[claim:invented-claim]].`);
    const r = await askHistorian({ apiKey: "sk-ant-secret-key-value-for-test-1234", model: "claude-test", role: "acquisition_analyst", question: "When did it close?", hits: h, fetchImpl: f });
    expect(r.usedModel).toBe(true);
    expect(r.cited).toEqual([first]);
    expect(r.answer).toContain("[citation removed");
    expect(r.answer).not.toContain("invented-claim");
    expect(r.warnings.join(" ")).toMatch(/did not match the retrieved evidence/);
    const call = (f as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls[0]!;
    expect(call[0]).toBe("https://api.anthropic.com/v1/messages");
    const headers = call[1].headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("sk-ant-secret-key-value-for-test-1234");
    expect(headers["anthropic-version"]).toBe("2023-06-01");
    const body = JSON.parse(call[1].body as string) as { model: string; system: string; messages: Array<{ content: string }> };
    expect(body.model).toBe("claude-test");
    expect(body.system).toMatch(/Real Estate Acquisition Analyst/);
    expect(body.messages[0]!.content).toContain(`[[${first}]]`);
    expect(body.messages[0]!.content).toContain("QUESTION (untrusted user input)");
    expect(JSON.stringify(body)).not.toContain("sk-ant-secret");
  });
  it("warns when the answer cites nothing and truncates very long questions", async () => {
    const f = ok("A confident answer with no citations.");
    const r = await askHistorian({ apiKey: "k".repeat(30), model: "m", role: "historian", question: "x".repeat(5000), hits: hits(), fetchImpl: f });
    expect(r.warnings.join(" ")).toMatch(/cites no retrieved evidence/);
    const body = JSON.parse((f as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls[0]![1].body as string) as { messages: Array<{ content: string }> };
    expect(body.messages[0]!.content.split("QUESTION (untrusted user input):\n")[1]!.length).toBeLessThanOrEqual(2000);
  });
  it("raises a typed error without leaking the key when the service fails", async () => {
    const f = vi.fn(async () => new Response("rate limited", { status: 429 })) as unknown as typeof fetch;
    const err = await askHistorian({ apiKey: "sk-ant-secret-key-value-for-test-1234", model: "m", role: "historian", question: "q", hits: hits(), fetchImpl: f }).catch((e) => e);
    expect(err).toBeInstanceOf(HistorianError);
    expect(err.status).toBe(429);
    expect(err.message).not.toContain("sk-ant");
    const empty = vi.fn(async () => new Response(JSON.stringify({ content: [] }), { status: 200 })) as unknown as typeof fetch;
    await expect(askHistorian({ apiKey: "k".repeat(30), model: "m", role: "historian", question: "q", hits: hits(), fetchImpl: empty })).rejects.toThrow(/no text/);
  });
});
