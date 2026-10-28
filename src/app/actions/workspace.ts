"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { createNote, deleteNote, recordProgress, toggleBookmark, updateNote } from "@/lib/data/workspace";
import { bookmarkSchema, noteSchema, safeReturnTo } from "@/lib/validation";

export interface NoteFormState { error?: string; saved?: boolean; noteId?: string }

export async function createNoteAction(_prev: NoteFormState, formData: FormData): Promise<NoteFormState> {
  const user = await requireUser();
  const parsed = noteSchema.safeParse({
    title: formData.get("title"), body: formData.get("body") ?? "", tags: formData.get("tags") ?? undefined,
    linkedKind: formData.get("linkedKind") || null, linkedId: formData.get("linkedId") || null, returnTo: formData.get("returnTo") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the note and try again." };
  const db = await getDb();
  const note = await createNote(db, user.id, parsed.data);
  revalidatePath("/library"); revalidatePath("/command-center");
  if (parsed.data.returnTo) { revalidatePath(safeReturnTo(parsed.data.returnTo, "/library")); redirect(`${safeReturnTo(parsed.data.returnTo, "/library")}?saved=note`); }
  return { saved: true, noteId: note.id };
}

export async function updateNoteAction(_prev: NoteFormState, formData: FormData): Promise<NoteFormState> {
  const user = await requireUser();
  const noteId = String(formData.get("noteId") ?? "");
  const parsed = noteSchema.pick({ title: true, body: true, tags: true }).safeParse({ title: formData.get("title"), body: formData.get("body") ?? "", tags: formData.get("tags") ?? undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the note and try again." };
  const db = await getDb();
  const note = await updateNote(db, user.id, noteId, parsed.data);
  if (!note) return { error: "Note not found." };
  revalidatePath("/library"); revalidatePath(`/library/notes/${noteId}`);
  return { saved: true, noteId };
}

export async function deleteNoteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const noteId = String(formData.get("noteId") ?? "");
  const db = await getDb();
  await deleteNote(db, user.id, noteId);
  revalidatePath("/library");
  redirect("/library?deleted=note");
}

export async function toggleBookmarkAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = bookmarkSchema.safeParse({ targetKind: formData.get("targetKind"), targetId: formData.get("targetId"), returnTo: formData.get("returnTo") ?? undefined });
  if (!parsed.success) return;
  const db = await getDb();
  await toggleBookmark(db, user.id, parsed.data.targetKind, parsed.data.targetId);
  const to = safeReturnTo(parsed.data.returnTo, "/library");
  revalidatePath(to); revalidatePath("/library"); revalidatePath("/command-center");
  redirect(to);
}

export async function trackOpenAction(kind: "dossier" | "transaction", objectKind: "investor" | "transaction", objectId: string): Promise<void> {
  const user = await requireUser();
  const db = await getDb();
  await recordProgress(db, user.id, `${kind}.opened`, objectKind, objectId);
}
