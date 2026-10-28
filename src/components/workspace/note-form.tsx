"use client";

import { useActionState } from "react";
import { createNoteAction, updateNoteAction, type NoteFormState } from "@/app/actions/workspace";
import { Alert, Button, Field, Input, Textarea } from "@/components/ui/primitives";
import type { LinkedObjectKind } from "@/db/schema";

export function NoteForm({ linkedKind, linkedId, returnTo, defaultTitle, compact = false }: { linkedKind?: LinkedObjectKind; linkedId?: string; returnTo?: string; defaultTitle?: string; compact?: boolean }) {
  const [state, action, pending] = useActionState<NoteFormState, FormData>(createNoteAction, {});
  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.saved && !returnTo && <Alert tone="success">Note saved.</Alert>}
      {linkedKind && linkedId && <><input type="hidden" name="linkedKind" value={linkedKind} /><input type="hidden" name="linkedId" value={linkedId} /></>}
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <Field label="Title" htmlFor={`note-title-${linkedId ?? "new"}`}><Input id={`note-title-${linkedId ?? "new"}`} name="title" required maxLength={160} defaultValue={defaultTitle ?? ""} placeholder="What did you find?" /></Field>
      <Field label="Note" htmlFor={`note-body-${linkedId ?? "new"}`}><Textarea id={`note-body-${linkedId ?? "new"}`} name="body" className={compact ? "min-h-24" : "min-h-40"} placeholder="Observations, questions, doubts, follow-ups…" /></Field>
      <Field label="Tags" htmlFor={`note-tags-${linkedId ?? "new"}`} hint="Comma-separated"><Input id={`note-tags-${linkedId ?? "new"}`} name="tags" placeholder="distressed, leverage, timing" /></Field>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save note"}</Button>
    </form>
  );
}

export function EditNoteForm({ note }: { note: { id: string; title: string; body: string; tags: string[] } }) {
  const [state, action, pending] = useActionState<NoteFormState, FormData>(updateNoteAction, {});
  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.saved && <Alert tone="success">Changes saved.</Alert>}
      <input type="hidden" name="noteId" value={note.id} />
      <Field label="Title" htmlFor="edit-title"><Input id="edit-title" name="title" required maxLength={160} defaultValue={note.title} /></Field>
      <Field label="Note" htmlFor="edit-body"><Textarea id="edit-body" name="body" className="min-h-64" defaultValue={note.body} /></Field>
      <Field label="Tags" htmlFor="edit-tags" hint="Comma-separated"><Input id="edit-tags" name="tags" defaultValue={note.tags.join(", ")} /></Field>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
    </form>
  );
}
