"use server";

import { getDb } from "@/db/client";
import { requireFeature } from "@/lib/auth/current-user";
import { historianSchema } from "@/lib/validation";
import { corpusIndex } from "@/lib/data/corpus";
import { search } from "@/ai/retrieval";
import { aiStatus, askHistorian, HistorianError } from "@/ai/historian";
import { historianUsage24h, recordHistorianQuery } from "@/lib/data/admin";

export interface EvidenceHit { ref: string; kind: string; title: string; href: string; status: string | null; excerpt: string; score: number }
export interface HistorianState {
  error?: string; question?: string; role?: string; mode?: "ask" | "search"; answer?: string; cited?: string[]; warnings?: string[]; usedModel?: boolean; hits?: EvidenceHit[];
}

export async function askHistorianAction(_p: HistorianState, f: FormData): Promise<HistorianState> {
  const user = await requireFeature("historian");
  const parsed = historianSchema.safeParse({ question: f.get("question"), role: f.get("role"), mode: f.get("mode") ?? "search" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the question." };
  const { question, role } = parsed.data;
  const status = aiStatus();
  const db = await getDb();
  const index = await corpusIndex(db);
  const found = search(index, question, 6);
  const hits: EvidenceHit[] = found.map((h) => ({ ref: h.doc.ref, kind: h.doc.kind, title: h.doc.title, href: h.doc.href, status: h.doc.status ?? null, excerpt: h.doc.text.replace(/\s+/g, " ").slice(0, 280), score: Math.round(h.score * 100) / 100 }));
  const wantModel = parsed.data.mode === "ask";

  if (!wantModel || !status.configured) {
    await recordHistorianQuery(db, user.id, { role, retrieved: hits.length, usedModel: false });
    return { question, role, mode: "search", hits, ...(wantModel && !status.configured ? { error: "The AI assistant is not configured on this server, so evidence search ran instead." } : {}) };
  }
  if ((await historianUsage24h(db, user.id)) >= status.dailyLimit) return { question, role, mode: "search", hits, error: `You have reached the daily limit of ${status.dailyLimit} assistant questions. Evidence search still works.` };
  try {
    const r = await askHistorian({ apiKey: process.env.ANTHROPIC_API_KEY!, model: status.model, role, question, hits: found });
    await recordHistorianQuery(db, user.id, { role, retrieved: hits.length, usedModel: r.usedModel });
    return { question, role, mode: "ask", answer: r.answer, cited: r.cited, warnings: r.warnings, usedModel: r.usedModel, hits };
  } catch (e) {
    return { question, role, mode: "search", hits, error: e instanceof HistorianError ? `${e.message} Showing the retrieved evidence instead.` : "The assistant is unavailable right now. Showing the retrieved evidence instead." };
  }
}
