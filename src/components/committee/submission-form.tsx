"use client";

import { useActionState } from "react";
import { submitToCommitteeAction, type CommitteeFormState } from "@/app/actions/simulations";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";

const SECTIONS: Array<[string, string, string]> = [
  ["assetDetails", "Property or debt details", "Asset, location, units or loan terms, condition, occupancy."],
  ["sourcesAndUses", "Sources and uses", "Equity, debt layers, closing costs, capex, reserves."],
  ["assumptionsNarrative", "Underwriting assumptions", "Rents, vacancy, expenses, growth, exit cap, and where each number comes from."],
  ["capitalStack", "Capital stack", "Senior, mezzanine, preferred, common; rates, terms, covenants."],
  ["risks", "Major risks and mitigations", "Refinancing, rates, liquidity, market, execution, counterparty, insurance and tax."],
  ["sensitivity", "Sensitivity analysis", "Which shocks you ran and what broke."],
  ["exitStrategy", "Exit strategy", "Sale, refinance or hold; the year; the fallback."],
];

export function SubmissionForm({ models }: { models: Array<{ id: string; name: string; version: number }> }) {
  const [state, action, pending] = useActionState<CommitteeFormState, FormData>(submitToCommitteeAction, {});
  const f = state.fields ?? {};
  return (
    <form action={action} className="space-y-5">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Title" htmlFor="title"><Input id="title" name="title" required defaultValue={f.title ?? ""} placeholder="e.g. Meridian Court note acquisition" /></Field>
      <Field label="Investment thesis" htmlFor="thesis" hint="Cite evidence with [[claim:slug]] tokens from any claim page; the committee counts them."><Textarea id="thesis" name="thesis" required className="min-h-40" defaultValue={f.thesis ?? ""} /></Field>
      <Field label="Attach a saved underwriting model" htmlFor="modelId" hint="Only Acquisition Underwriter or Stress Test models carry the inputs the committee needs. Without one, financial correctness and downside resilience cannot be scored.">
        <Select id="modelId" name="modelId" defaultValue={f.modelId ?? ""}><option value="">— none —</option>{models.map((m) => <option key={m.id} value={m.id}>{m.name} (v{m.version})</option>)}</Select>
      </Field>
      {SECTIONS.map(([key, label, hint]) => <Field key={key} label={label} htmlFor={key} hint={hint}><Textarea id={key} name={key} className="min-h-24" defaultValue={f[key] ?? ""} /></Field>)}
      <Field label="Your recommendation" htmlFor="recommendation"><Select id="recommendation" name="recommendation" defaultValue={f.recommendation ?? "approve_with_conditions"}><option value="approve">Approve</option><option value="approve_with_conditions">Approve with conditions</option><option value="decline">Decline</option></Select></Field>
      <Button type="submit" disabled={pending}>{pending ? "Convening the committee…" : "Submit to committee"}</Button>
    </form>
  );
}
