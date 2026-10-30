"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { assignNoteSchema, collectionSchema, doctrineSchema, principleSchema, readingListItemSchema, ritualSchema, safeReturnTo, taskSchema } from "@/lib/validation";
import {
  addToReadingList, assignNoteToCollection, completeRitualDay, createCollection, deleteCollection, deletePrinciple, recordQuizAttempt, removeFromReadingList,
  reopenRitualDay, saveDoctrine, savePrinciple,
} from "@/lib/data/study";
import { setTaskDone, startProgram } from "@/lib/data/progress";
import { weekStartOf } from "@/lib/ritual";
import { getQuiz } from "@/quiz/bank";
import { gradeQuiz } from "@/quiz/grade";

const s = (f: FormData, k: string) => (f.get(k) == null ? undefined : String(f.get(k)));

export interface FormState { error?: string; saved?: boolean }

// ── synthesis ──
export async function savePrincipleAction(_p: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = principleSchema.safeParse({ id: s(f, "id"), title: s(f, "title"), statement: s(f, "statement"), sourceInvestorId: s(f, "sourceInvestorId"), supportingTransactionId: s(f, "supportingTransactionId"), supportingClaimId: s(f, "supportingClaimId"), relevantRisk: s(f, "relevantRisk"), modernApplication: s(f, "modernApplication"), personalNotes: s(f, "personalNotes") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the principle." };
  const db = await getDb();
  const { id, ...rest } = parsed.data;
  const row = await savePrinciple(db, user.id, rest, id);
  if (!row) return { error: "Principle not found." };
  revalidatePath("/synthesis"); revalidatePath("/command-center");
  redirect("/synthesis?saved=1");
}
export async function deletePrincipleAction(f: FormData): Promise<void> {
  const user = await requireUser(); const db = await getDb();
  await deletePrinciple(db, user.id, String(f.get("id") ?? ""));
  revalidatePath("/synthesis"); redirect("/synthesis?deleted=1");
}
export async function saveDoctrineAction(_p: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = doctrineSchema.safeParse(Object.fromEntries(["targetAssets", "geographicStrategy", "acquisitionCriteria", "financingCriteria", "riskTolerance", "capitalPartnerStrategy", "committeeStandards", "exitStrategies"].map((k) => [k, s(f, k) ?? ""])));
  if (!parsed.success) return { error: "A section is too long (8,000 characters maximum)." };
  const db = await getDb(); await saveDoctrine(db, user.id, parsed.data);
  revalidatePath("/doctrine"); revalidatePath("/command-center");
  return { saved: true };
}

// ── ritual ──
export async function completeRitualDayAction(f: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = ritualSchema.safeParse({ day: s(f, "day"), journal: s(f, "journal") ?? "" });
  if (!parsed.success) redirect("/ritual?error=invalid");
  const db = await getDb();
  await completeRitualDay(db, user.id, weekStartOf(new Date()), parsed.data.day, parsed.data.journal);
  revalidatePath("/ritual"); revalidatePath("/command-center"); redirect("/ritual?done=1");
}
export async function reopenRitualDayAction(f: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = ritualSchema.pick({ day: true }).safeParse({ day: s(f, "day") });
  if (!parsed.success) redirect("/ritual?error=invalid");
  const db = await getDb(); await reopenRitualDay(db, user.id, weekStartOf(new Date()), parsed.data.day);
  revalidatePath("/ritual"); revalidatePath("/command-center"); redirect("/ritual");
}

// ── program ──
export async function startProgramAction(): Promise<void> {
  const user = await requireUser(); const db = await getDb(); await startProgram(db, user.id);
  revalidatePath("/program"); redirect("/program");
}
export async function setTaskDoneAction(f: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = taskSchema.safeParse({ week: s(f, "week"), taskKey: s(f, "taskKey"), done: s(f, "done"), note: s(f, "note") });
  if (!parsed.success) redirect("/program?error=invalid");
  const db = await getDb();
  await setTaskDone(db, user.id, parsed.data.week, parsed.data.taskKey, parsed.data.done === "1", parsed.data.note);
  revalidatePath("/program"); revalidatePath(`/program/${parsed.data.week}`); revalidatePath("/command-center");
  redirect(`/program/${parsed.data.week}`);
}

// ── quizzes ──
export async function submitQuizAction(f: FormData): Promise<void> {
  const user = await requireUser();
  const quiz = getQuiz(String(f.get("quiz") ?? ""));
  if (!quiz) redirect("/quizzes");
  const answers: Record<string, string> = {};
  for (const q of quiz.questions) { const v = f.get(`q_${q.id}`); if (v != null) answers[q.id] = String(v).slice(0, 40); }
  const result = gradeQuiz(quiz, answers);
  const db = await getDb();
  const row = await recordQuizAttempt(db, user.id, quiz.slug, answers, result.score, result.max, result.passed);
  revalidatePath("/quizzes"); revalidatePath("/command-center"); revalidatePath("/program");
  redirect(`/quizzes/${quiz.slug}/results/${row.id}`);
}

// ── collections ──
export async function createCollectionAction(f: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = collectionSchema.safeParse({ name: s(f, "name"), kind: s(f, "kind") });
  if (!parsed.success) redirect("/library?error=collection");
  const db = await getDb(); const c = await createCollection(db, user.id, parsed.data.name, parsed.data.kind);
  revalidatePath("/library"); redirect(`/library/collections/${c.id}`);
}
export async function deleteCollectionAction(f: FormData): Promise<void> {
  const user = await requireUser(); const db = await getDb();
  await deleteCollection(db, user.id, String(f.get("id") ?? "")); revalidatePath("/library"); redirect("/library?deleted=collection");
}
export async function assignNoteAction(f: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = assignNoteSchema.safeParse({ noteId: s(f, "noteId"), collectionId: s(f, "collectionId") });
  if (!parsed.success) redirect("/library?error=invalid");
  const db = await getDb(); await assignNoteToCollection(db, user.id, parsed.data.noteId, parsed.data.collectionId ?? null);
  revalidatePath("/library"); revalidatePath(`/library/notes/${parsed.data.noteId}`); redirect(`/library/notes/${parsed.data.noteId}`);
}
export async function addToReadingListAction(f: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = readingListItemSchema.safeParse({ collectionId: s(f, "collectionId"), targetKind: s(f, "targetKind"), targetId: s(f, "targetId"), returnTo: s(f, "returnTo") });
  if (!parsed.success) redirect("/library?error=invalid");
  const db = await getDb(); await addToReadingList(db, user.id, parsed.data.collectionId, parsed.data.targetKind, parsed.data.targetId);
  const to = safeReturnTo(parsed.data.returnTo, `/library/collections/${parsed.data.collectionId}`);
  revalidatePath("/library"); redirect(`${to}${to.includes("?") ? "&" : "?"}listed=1`);
}
export async function removeFromReadingListAction(f: FormData): Promise<void> {
  const user = await requireUser(); const db = await getDb(); const cid = String(f.get("collectionId") ?? "");
  await removeFromReadingList(db, user.id, cid, String(f.get("itemId") ?? "")); revalidatePath(`/library/collections/${cid}`); redirect(`/library/collections/${cid}`);
}
