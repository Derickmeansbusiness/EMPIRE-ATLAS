"use client";

import { saveReportAction } from "@/app/actions/fieldbook";
import { useManualAction } from "./use-manual-action";
import { Alert, Button, Field, Select, Textarea } from "@/components/ui/primitives";

export function ReportForm({ propertySlug, sessionId }: { propertySlug: string; sessionId: string }) {
  const [state, onSubmit, pending] = useManualAction(saveReportAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="propertySlug" value={propertySlug} /><input type="hidden" name="sessionId" value={sessionId} />
      <Field label="Your screening decision" htmlFor="decision"><Select id="decision" name="decision" defaultValue="investigate"><option value="acquire">Acquire</option><option value="negotiate">Negotiate</option><option value="investigate">Investigate further</option><option value="reject">Reject</option></Select></Field>
      <Field label="Reasons" htmlFor="rationale" hint="Cite the figures and findings that drive the decision."><Textarea id="rationale" name="rationale" required minLength={20} maxLength={4000} className="min-h-28" /></Field>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Generate and save the report"}</Button>
      <p className="text-xs text-slate-mist">The report is frozen as of now and saved to your private Research Library. Later changes to findings do not alter it.</p>
    </form>
  );
}
