"use client";

import { saveFindingAction } from "@/app/actions/fieldbook";
import { useManualAction } from "./use-manual-action";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { COMPONENTS, SEVERITIES } from "@/fieldbook/templates";

export interface FindingDefaults { id?: string; itemKey?: string | null; locationLabel?: string; component?: string; description?: string; condition?: string; severity?: string; confidence?: string; financialImpact?: string | null; specialistNeeded?: string | null; followUpStatus?: string; costLow?: string | null; costHigh?: string | null; costSource?: string | null; resolution?: string | null }

export function FindingForm({ sessionId, returnTo, defaults = {} }: { sessionId: string; returnTo: string; defaults?: FindingDefaults }) {
  const [state, onSubmit, pending] = useManualAction(saveFindingAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-label={defaults.id ? "Edit finding" : "Record a finding"}>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="sessionId" value={sessionId} /><input type="hidden" name="returnTo" value={returnTo} />
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      {defaults.itemKey && <input type="hidden" name="itemKey" value={defaults.itemKey} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Where (building, room or area)" htmlFor={`loc-${defaults.id ?? "new"}`}><Input id={`loc-${defaults.id ?? "new"}`} name="locationLabel" required maxLength={160} defaultValue={defaults.locationLabel ?? ""} placeholder="e.g. Building B east stair" /></Field>
        <Field label="Component" htmlFor={`cmp-${defaults.id ?? "new"}`}><Select id={`cmp-${defaults.id ?? "new"}`} name="component" defaultValue={defaults.component ?? "other"}>{COMPONENTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select></Field>
      </div>
      <Field label="What you observed" htmlFor={`desc-${defaults.id ?? "new"}`} hint="Describe what is visible. Do not diagnose hidden conditions from the surface."><Textarea id={`desc-${defaults.id ?? "new"}`} name="description" required minLength={5} maxLength={3000} className="min-h-24" defaultValue={defaults.description ?? ""} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Observed condition" htmlFor={`cond-${defaults.id ?? "new"}`}><Select id={`cond-${defaults.id ?? "new"}`} name="condition" defaultValue={defaults.condition ?? "unknown"}><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option><option value="unknown">Unknown</option></Select></Field>
        <Field label="Severity" htmlFor={`sev-${defaults.id ?? "new"}`}><Select id={`sev-${defaults.id ?? "new"}`} name="severity" defaultValue={defaults.severity ?? "minor_maintenance"}>{SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select></Field>
        <Field label="Your confidence" htmlFor={`conf-${defaults.id ?? "new"}`}><Select id={`conf-${defaults.id ?? "new"}`} name="confidence" defaultValue={defaults.confidence ?? "medium"}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Potential financial impact" htmlFor={`imp-${defaults.id ?? "new"}`}><Input id={`imp-${defaults.id ?? "new"}`} name="financialImpact" maxLength={1000} defaultValue={defaults.financialImpact ?? ""} placeholder="e.g. repaving cost; insurance question" /></Field>
        <Field label="Specialist needed" htmlFor={`spec-${defaults.id ?? "new"}`}><Input id={`spec-${defaults.id ?? "new"}`} name="specialistNeeded" maxLength={200} defaultValue={defaults.specialistNeeded ?? ""} placeholder="e.g. roofing contractor, structural engineer" /></Field>
      </div>
      <fieldset className="rounded-card border hairline p-4"><legend className="px-1 text-xs uppercase tracking-[0.14em] text-gold">Repair cost estimate (optional)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Low ($)" htmlFor={`lo-${defaults.id ?? "new"}`}><Input id={`lo-${defaults.id ?? "new"}`} name="costLow" inputMode="decimal" defaultValue={defaults.costLow ?? ""} /></Field>
          <Field label="High ($)" htmlFor={`hi-${defaults.id ?? "new"}`}><Input id={`hi-${defaults.id ?? "new"}`} name="costHigh" inputMode="decimal" defaultValue={defaults.costHigh ?? ""} /></Field>
          <Field label="Source of the estimate" htmlFor={`src-${defaults.id ?? "new"}`} hint="Required with a cost."><Input id={`src-${defaults.id ?? "new"}`} name="costSource" maxLength={300} defaultValue={defaults.costSource ?? ""} placeholder="Own estimate / contractor quote / guide" /></Field>
        </div>
      </fieldset>
      {defaults.id && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Follow-up status" htmlFor={`fs-${defaults.id}`}><Select id={`fs-${defaults.id}`} name="followUpStatus" defaultValue={defaults.followUpStatus ?? "open"}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="wont_fix">Won’t fix</option></Select></Field>
          <Field label="Resolution record" htmlFor={`res-${defaults.id}`}><Input id={`res-${defaults.id}`} name="resolution" maxLength={2000} defaultValue={defaults.resolution ?? ""} placeholder="What was found out or done" /></Field>
        </div>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : defaults.id ? "Save changes" : "Save finding"}</Button>
    </form>
  );
}
