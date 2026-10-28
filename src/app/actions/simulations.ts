"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { createSubmission, currentAttempt, recordChoice, startAttempt } from "@/lib/data/simulations";
import { getScenario } from "@/simulation";
import { committeeSubmissionSchema, simulationChoiceSchema } from "@/lib/validation";

export async function startAttemptAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("scenario") ?? "");
  if (!getScenario(slug)) redirect("/simulator");
  const db = await getDb();
  const existing = await currentAttempt(db, user.id, slug);
  const attempt = existing ?? (await startAttempt(db, user.id, slug));
  revalidatePath("/simulator");
  redirect(`/simulator/${slug}/play/${attempt.id}`);
}

export async function restartAttemptAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("scenario") ?? "");
  if (!getScenario(slug)) redirect("/simulator");
  const db = await getDb();
  const attempt = await startAttempt(db, user.id, slug);
  revalidatePath("/simulator");
  redirect(`/simulator/${slug}/play/${attempt.id}`);
}

export async function chooseOptionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = simulationChoiceSchema.safeParse({ attemptId: formData.get("attemptId"), stageKey: formData.get("stageKey"), optionKey: formData.get("optionKey") });
  if (!parsed.success) redirect("/simulator?error=invalid");
  const db = await getDb();
  const slug = String(formData.get("scenario") ?? "");
  let result: { completed: boolean } | null = null;
  try { result = await recordChoice(db, user.id, parsed.data.attemptId, parsed.data.stageKey, parsed.data.optionKey); }
  catch { redirect(`/simulator/${slug}/play/${parsed.data.attemptId}?error=stale`); }
  if (!result) redirect("/simulator?error=missing");
  revalidatePath("/simulator"); revalidatePath("/command-center");
  redirect(result.completed ? `/simulator/${slug}/debrief/${parsed.data.attemptId}` : `/simulator/${slug}/play/${parsed.data.attemptId}?chose=${parsed.data.optionKey}`);
}

export interface CommitteeFormState { error?: string; fields?: Record<string, string> }

export async function submitToCommitteeAction(_prev: CommitteeFormState, formData: FormData): Promise<CommitteeFormState> {
  const user = await requireUser();
  const raw = Object.fromEntries(["title", "thesis", "assetDetails", "sourcesAndUses", "assumptionsNarrative", "capitalStack", "risks", "sensitivity", "exitStrategy", "recommendation", "modelId"].map((k) => [k, String(formData.get(k) ?? "")]));
  const parsed = committeeSubmissionSchema.safeParse({ ...raw, modelId: raw.modelId || null });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the submission.", fields: raw };
  const db = await getDb();
  const row = await createSubmission(db, user.id, parsed.data);
  revalidatePath("/committee"); revalidatePath("/command-center");
  redirect(`/committee/${row.id}`);
}
