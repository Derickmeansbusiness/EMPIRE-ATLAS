"use client";

import { useActionState } from "react";
import { saveModelAction, type ModelFormState } from "@/app/actions/models";
import { Alert, Button, Field, Input } from "@/components/ui/primitives";
import type { ModelKind } from "@/lib/data/models";

/**
 * "Save model" panel: posts the current tool inputs (already resolved server-side into `assumptions`)
 * as a named, versioned, hypothetical financial model.
 */
export function SaveModelPanel({ kind, assumptions, returnTo, existing, transactions }: {
  kind: ModelKind; assumptions: Record<string, unknown>; returnTo: string;
  existing?: { id: string; name: string; version: number; transactionId: string | null } | null;
  transactions?: Array<{ id: string; name: string }>;
}) {
  const [state, action, pending] = useActionState<ModelFormState, FormData>(saveModelAction, {});
  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="assumptions" value={JSON.stringify(assumptions)} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {existing && <input type="hidden" name="modelId" value={existing.id} />}
      <Field label={existing ? `Model name (saving creates version ${existing.version + 1})` : "Model name"} htmlFor="model-name"><Input id="model-name" name="name" required maxLength={120} defaultValue={existing?.name ?? ""} placeholder="e.g. Meridian Court — base case" /></Field>
      {transactions && transactions.length > 0 && !existing && (
        <Field label="Attach to a historical transaction (optional)" htmlFor="model-tx" hint="The model stays labelled hypothetical; it never alters the historical record.">
          <select id="model-tx" name="transactionId" defaultValue="" className="w-full rounded-md border border-platinum/20 bg-midnight/70 px-3 py-2.5 text-sm text-ivory">
            <option value="">— none —</option>
            {transactions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
      )}
      {existing && <Field label="Version note" htmlFor="model-note"><Input id="model-note" name="note" maxLength={500} placeholder="What changed in this version?" /></Field>}
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Saving…" : existing ? "Save new version" : "Save model"}</Button>
    </form>
  );
}
