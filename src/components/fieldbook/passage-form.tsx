"use client";

import { addPassageAction } from "@/app/actions/fieldbook";
import { useManualAction } from "./use-manual-action";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";

export function PassageForm({ defaults = {} }: { defaults?: { sourceTitle?: string; author?: string; location?: string } }) {
  const [state, onSubmit, pending] = useManualAction(addPassageAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Source title" htmlFor="ps-title"><Input id="ps-title" name="sourceTitle" required maxLength={240} defaultValue={defaults.sourceTitle ?? ""} /></Field>
        <Field label="Author" htmlFor="ps-author"><Input id="ps-author" name="author" required maxLength={160} defaultValue={defaults.author ?? ""} /></Field>
        <Field label="Kind" htmlFor="ps-kind"><Select id="ps-kind" name="sourceKind" defaultValue="book"><option value="book">Book</option><option value="interview">Interview</option><option value="letter">Investment letter</option><option value="lecture">Lecture</option><option value="article">Article</option><option value="filing">Filing</option><option value="other">Other</option></Select></Field>
        <Field label="Exact page or location" htmlFor="ps-loc"><Input id="ps-loc" name="location" maxLength={120} defaultValue={defaults.location ?? ""} placeholder="e.g. p. 39 or 14:20" /></Field>
        <Field label="Publication date" htmlFor="ps-date" hint="Leave blank if unknown."><Input id="ps-date" name="publishedLabel" maxLength={60} /></Field>
        <Field label="Edition" htmlFor="ps-ed"><Input id="ps-ed" name="edition" maxLength={120} /></Field>
      </div>
      <Field label="Source link" htmlFor="ps-url"><Input id="ps-url" name="sourceUrl" type="url" maxLength={500} placeholder="https://" /></Field>
      <Field label="Short excerpt" htmlFor="ps-exc" hint="Quote only what you need, up to 1,500 characters. Stays private to you; it is never shown to other users."><Textarea id="ps-exc" name="excerpt" maxLength={1500} className="min-h-28" /></Field>
      <Field label="Your notes and interpretation" htmlFor="ps-notes"><Textarea id="ps-notes" name="userNotes" maxLength={8000} className="min-h-24" /></Field>
      <label className="flex min-h-11 items-center gap-3 text-sm text-platinum/90"><input type="checkbox" name="isFirstPerson" value="1" defaultChecked className="h-4 w-4 accent-[#C19B63]" /> This is the author’s own first-person account (treated as uncorroborated until verified)</label>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save passage"}</Button>
    </form>
  );
}
