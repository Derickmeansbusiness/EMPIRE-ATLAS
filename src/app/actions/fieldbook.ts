"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { findingSchema, passageSchema, reportSchema } from "@/lib/validation";
import {
  addFinding, addFollowUp, clearSessionLocation, completeSession, createPassage, deleteFinding, deleteMyPassage, getProperty, getSession, listAttempts, listFindings, recordAttempt, reopenSession,
  saveItem, saveReport, setFollowUpDone, setSessionLocation, startOrResumeSession, toFindingLike, updateFinding,
} from "@/lib/data/fieldbook";
import { getChallenge, challengeForProperty } from "@/fieldbook/challenges";
import { gradeChallenge, type ChallengeAnswers, type Recommendation } from "@/fieldbook/grade";
import { allItems, getTemplate } from "@/fieldbook/templates";
import { buildSnapshot, reportMarkdown } from "@/fieldbook/report";

export interface FbState { error?: string }
const s = (f: FormData, k: string) => (f.get(k) == null ? undefined : String(f.get(k)));
const numOrNull = (v: FormDataEntryValue | null): number | null => { if (v == null) return null; const t = String(v).replace(/[$,%\s]/g, ""); if (t === "") return null; const n = Number(t); return Number.isFinite(n) ? n : null; };

// ── passages ──
export async function addPassageAction(_p: FbState, f: FormData): Promise<FbState> {
  const user = await requireUser();
  const parsed = passageSchema.safeParse(Object.fromEntries(["sourceTitle", "author", "sourceKind", "publishedLabel", "edition", "location", "sourceUrl", "excerpt", "userNotes", "isFirstPerson"].map((k) => [k, s(f, k)])));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the passage." };
  const db = await getDb(); await createPassage(db, user.id, parsed.data);
  revalidatePath("/fieldbook", "layout"); redirect("/fieldbook?added=1");
}
export async function deletePassageAction(f: FormData): Promise<void> {
  const user = await requireUser(); const db = await getDb(); await deleteMyPassage(db, user.id, String(f.get("id") ?? ""));
  revalidatePath("/fieldbook", "layout"); redirect("/fieldbook");
}

// ── underwriting challenge ──
export async function submitChallengeAction(f: FormData): Promise<void> {
  const user = await requireUser(); const c = getChallenge(String(f.get("challenge") ?? "")); if (!c) redirect("/fieldbook/challenges");
  const amounts: Record<string, number> = {}; const basis: Record<string, string> = {};
  for (const l of c.lines) { const n = numOrNull(f.get(`amt_${l.key}`)); amounts[l.key] = n != null && n >= 0 && n < 1e10 ? n : l.amount; const b = String(f.get(`basis_${l.key}`) ?? "").slice(0, 400); if (b.trim()) basis[l.key] = b; }
  const valid = new Set(c.anomalies.map((a) => a.id));
  const rec = String(f.get("recommendation") ?? ""); const recommendation = (["acquire", "negotiate", "investigate", "reject"].includes(rec) ? rec : "") as Recommendation | "";
  const answers: ChallengeAnswers = {
    amounts, basis, reportedNoi: numOrNull(f.get("reportedNoi")), capRatePct: numOrNull(f.get("capRatePct")), dscr: numOrNull(f.get("dscr")), debtYieldPct: numOrNull(f.get("debtYieldPct")), maxPrice: numOrNull(f.get("maxPrice")),
    anomalies: f.getAll("anomalies").map(String).filter((id) => valid.has(id)), questions: String(f.get("questions") ?? "").slice(0, 6000),
    largestDriver: String(f.get("largestDriver") ?? "").slice(0, 40), dscrPasses: String(f.get("dscrPasses") ?? "") === "yes" ? "yes" : String(f.get("dscrPasses") ?? "") === "no" ? "no" : "",
    recommendation, rationale: String(f.get("rationale") ?? "").slice(0, 4000),
  };
  const result = gradeChallenge(c, answers);
  const db = await getDb(); const row = await recordAttempt(db, user.id, c.slug, answers, result);
  revalidatePath("/fieldbook", "layout"); 
  redirect(`/fieldbook/challenges/${c.slug}/results/${row.id}`);
}

// ── walks ──
export async function startWalkAction(f: FormData): Promise<void> {
  const user = await requireUser(); const db = await getDb();
  const prop = await getProperty(db, user.id, String(f.get("propertySlug") ?? "")); if (!prop) redirect("/fieldbook");
  const session = await startOrResumeSession(db, user.id, prop.id, prop.assetClass, { forceNew: f.get("fresh") === "1" });
  redirect(`/fieldbook/properties/${prop.slug}/walk/${session.id}`);
}

const itemSchema = z.object({ sessionId: z.string().uuid(), itemKey: z.string().min(1).max(80), rating: z.enum(["good", "fair", "poor", "not_observed"]), note: z.string().max(2000).nullable() });
/** Called by the walk checklist as the user taps; returns whether the server stored it so the client can keep unsent drafts. */
export async function saveItemAction(input: { sessionId: string; itemKey: string; rating: string; note: string | null }): Promise<{ ok: boolean }> {
  const user = await requireUser(); const parsed = itemSchema.safeParse(input); if (!parsed.success) return { ok: false };
  const db = await getDb(); return { ok: await saveItem(db, user.id, parsed.data.sessionId, parsed.data.itemKey, parsed.data.rating, parsed.data.note) };
}
const locSchema = z.object({ sessionId: z.string().uuid(), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), accuracy: z.number().min(0).max(100000).nullable() });
export async function setLocationAction(input: { sessionId: string; lat: number; lng: number; accuracy: number | null }): Promise<{ ok: boolean }> {
  const user = await requireUser(); const p = locSchema.safeParse(input); if (!p.success) return { ok: false };
  const db = await getDb(); const ok = await setSessionLocation(db, user.id, p.data.sessionId, { lat: p.data.lat, lng: p.data.lng, accuracy: p.data.accuracy }); return { ok };
}
export async function clearLocationAction(f: FormData): Promise<void> {
  const user = await requireUser(); const db = await getDb(); const id = String(f.get("sessionId") ?? ""); await clearSessionLocation(db, user.id, id);
  revalidatePath("/fieldbook", "layout"); redirect(String(f.get("returnTo") ?? "/fieldbook").startsWith("/fieldbook/") ? String(f.get("returnTo")) : "/fieldbook");
}

const back = (f: FormData, fallback: string) => { const r = String(f.get("returnTo") ?? ""); return r.startsWith("/fieldbook/") && !r.startsWith("//") && !r.includes("\\") ? r : fallback; };

export async function saveFindingAction(_p: FbState, f: FormData): Promise<FbState> {
  const user = await requireUser();
  const parsed = findingSchema.safeParse(Object.fromEntries(["id", "sessionId", "itemKey", "locationLabel", "component", "description", "condition", "severity", "confidence", "financialImpact", "specialistNeeded", "followUpStatus", "costLow", "costHigh", "costSource", "resolution"].map((k) => [k, s(f, k)])));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the finding." };
  const db = await getDb(); const { id, sessionId, ...rest } = parsed.data;
  const sess = await getSession(db, user.id, sessionId); if (!sess) return { error: "Inspection not found." };
  if (rest.itemKey) { const t = getTemplate(sess.session.templateSlug); if (!t || !allItems(t).some((i) => i.key === rest.itemKey)) rest.itemKey = null; }
  const row = id ? await updateFinding(db, user.id, id, rest) : await addFinding(db, user.id, sessionId, rest);
  if (!row) return { error: "Could not save the finding." };
  revalidatePath("/fieldbook", "layout"); redirect(`${back(f, "/fieldbook")}${back(f, "/fieldbook").includes("?") ? "&" : "?"}saved=1#findings`);
}
export async function deleteFindingAction(f: FormData): Promise<void> {
  const user = await requireUser(); const db = await getDb(); await deleteFinding(db, user.id, String(f.get("id") ?? "")); revalidatePath("/fieldbook", "layout"); redirect(back(f, "/fieldbook"));
}
export async function addFollowUpAction(f: FormData): Promise<void> {
  const user = await requireUser(); const db = await getDb();
  const title = String(f.get("title") ?? "").trim().slice(0, 200); const fid = String(f.get("findingId") ?? ""); const due = String(f.get("dueOn") ?? "");
  if (title.length >= 3) await addFollowUp(db, user.id, String(f.get("sessionId") ?? ""), title, fid || null, /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : null);
  revalidatePath("/fieldbook", "layout"); redirect(back(f, "/fieldbook"));
}
export async function toggleFollowUpAction(f: FormData): Promise<void> {
  const user = await requireUser(); const db = await getDb(); await setFollowUpDone(db, user.id, String(f.get("id") ?? ""), f.get("done") === "1"); revalidatePath("/fieldbook", "layout"); redirect(back(f, "/fieldbook"));
}
export async function completeWalkAction(f: FormData): Promise<void> {
  const user = await requireUser(); const db = await getDb(); await completeSession(db, user.id, String(f.get("sessionId") ?? ""), String(f.get("summaryNote") ?? "").slice(0, 3000) || null);
  revalidatePath("/fieldbook", "layout"); redirect(back(f, "/fieldbook"));
}
export async function reopenWalkAction(f: FormData): Promise<void> {
  const user = await requireUser(); const db = await getDb(); await reopenSession(db, user.id, String(f.get("sessionId") ?? "")); revalidatePath("/fieldbook", "layout"); redirect(back(f, "/fieldbook"));
}

// ── report ──
export async function saveReportAction(_p: FbState, f: FormData): Promise<FbState> {
  const user = await requireUser();
  const parsed = reportSchema.safeParse({ propertySlug: s(f, "propertySlug"), sessionId: s(f, "sessionId"), decision: s(f, "decision"), rationale: s(f, "rationale") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the report." };
  const db = await getDb(); const prop = await getProperty(db, user.id, parsed.data.propertySlug); if (!prop) return { error: "Property not found." };
  const challenge = challengeForProperty(prop.slug); if (!challenge) return { error: "This property has no financial statement to reconcile yet." };
  const sess = await getSession(db, user.id, parsed.data.sessionId); if (!sess || sess.session.propertyId !== prop.id) return { error: "Inspection not found." };
  const t = getTemplate(sess.session.templateSlug);
  const done = sess.items.filter((i) => i.rating !== "not_observed").length;
  const attempts = await listAttempts(db, user.id, challenge.slug);
  const findings = toFindingLike(await listFindings(db, user.id, sess.session.id));
  const snap = buildSnapshot({ propertyName: prop.name, fictional: prop.isFictional, author: user.displayName, date: new Date().toISOString().slice(0, 10), challenge, findings, decision: parsed.data.decision, rationale: parsed.data.rationale, sessionDate: sess.session.startedAt.toISOString().slice(0, 10), checklistProgress: { done, total: t ? allItems(t).length : 0 } });
  const row = await saveReport(db, user.id, { propertyId: prop.id, sessionId: sess.session.id, attemptId: attempts[0]?.id ?? null, title: `Property Intelligence Report: ${prop.name}`, snapshot: snap, markdown: reportMarkdown(snap) });
  revalidatePath("/fieldbook", "layout"); revalidatePath("/library");
  redirect(`/fieldbook/reports/${row.id}`);
}
