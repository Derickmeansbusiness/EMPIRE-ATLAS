/**
 * Helpers for lab tools: tool inputs live in the URL (shareable) and can be pre-filled from a saved model.
 */
import type { AtlasDb } from "@/db/client";
import { getModel } from "@/lib/data/models";

export type SP = Record<string, string | string[] | undefined>;

export function num(sp: SP, key: string, fallback: number): number {
  const v = sp[key];
  if (typeof v !== "string" || v.trim() === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function pct(sp: SP, key: string, fallbackDecimal: number): number {
  const v = sp[key];
  if (typeof v !== "string" || v.trim() === "") return fallbackDecimal;
  const n = Number(v);
  return Number.isFinite(n) ? n / 100 : fallbackDecimal;
}

/** Merge a saved model's assumptions (flat key → value) into search params, URL params winning. */
export async function withSavedModel(db: AtlasDb, userId: string, sp: SP): Promise<{ sp: SP; model: Awaited<ReturnType<typeof getModel>> }> {
  const id = typeof sp.model === "string" ? sp.model : null;
  if (!id) return { sp, model: null };
  const model = await getModel(db, userId, id);
  if (!model) return { sp, model: null };
  const saved = model.assumptions as Record<string, unknown>;
  const merged: SP = {};
  for (const [k, v] of Object.entries(saved)) if (v != null && typeof v !== "object") merged[k] = String(v);
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v !== "") merged[k] = v;
  return { sp: merged, model };
}

export function toQuery(values: Record<string, string | number | boolean>): string {
  return new URLSearchParams(Object.entries(values).map(([k, v]) => [k, String(v)])).toString();
}
