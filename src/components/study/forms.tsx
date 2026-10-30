"use client";

import { useActionState } from "react";
import { saveDoctrineAction, savePrincipleAction, type FormState } from "@/app/actions/study";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { DOCTRINE_FIELDS } from "@/lib/doctrine";

export interface Option { value: string; label: string }
export interface PrincipleDefaults { id?: string; title?: string; statement?: string; sourceInvestorId?: string | null; supportingTransactionId?: string | null; supportingClaimId?: string | null; relevantRisk?: string | null; modernApplication?: string | null; personalNotes?: string | null }

export function PrincipleForm({ defaults, investors, transactions, claims }: { defaults: PrincipleDefaults; investors: Option[]; transactions: Option[]; claims: Option[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePrincipleAction, {});
  const sel = (id: string, name: string, label: string, opts: Option[], value?: string | null, hint?: string) => (
    <Field label={label} htmlFor={id} hint={hint}><Select id={id} name={name} defaultValue={value ?? ""}><option value="">— none —</option>{opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></Field>
  );
  return (
    <form action={action} className="space-y-4" key={defaults.id ?? defaults.title ?? "new"}>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <Field label="Principle" htmlFor="pr-title"><Input id="pr-title" name="title" required maxLength={160} defaultValue={defaults.title ?? ""} placeholder="e.g. Match debt maturity to business strategy" /></Field>
      <Field label="Statement" htmlFor="pr-statement" hint="In your own words: what is the rule, and when does it apply?"><Textarea id="pr-statement" name="statement" required className="min-h-24" defaultValue={defaults.statement ?? ""} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        {sel("pr-investor", "sourceInvestorId", "Source investor", investors, defaults.sourceInvestorId)}
        {sel("pr-tx", "supportingTransactionId", "Supporting transaction", transactions, defaults.supportingTransactionId)}
        {sel("pr-claim", "supportingClaimId", "Historical evidence", claims, defaults.supportingClaimId, "A sourced claim from the corpus.")}
      </div>
      <Field label="Relevant risk" htmlFor="pr-risk"><Textarea id="pr-risk" name="relevantRisk" className="min-h-20" defaultValue={defaults.relevantRisk ?? ""} /></Field>
      <Field label="Modern application" htmlFor="pr-modern"><Textarea id="pr-modern" name="modernApplication" className="min-h-20" defaultValue={defaults.modernApplication ?? ""} /></Field>
      <Field label="Personal notes" htmlFor="pr-notes"><Textarea id="pr-notes" name="personalNotes" className="min-h-20" defaultValue={defaults.personalNotes ?? ""} /></Field>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : defaults.id ? "Save changes" : "Save principle"}</Button>
    </form>
  );
}

export function DoctrineForm({ values }: { values: Record<string, string> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveDoctrineAction, {});
  return (
    <form action={action} className="space-y-5">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.saved && <Alert tone="success">Doctrine saved.</Alert>}
      {DOCTRINE_FIELDS.map((f, i) => (
        <Field key={f.key} label={`${i + 1}. ${f.label}`} htmlFor={`d-${f.key}`} hint={f.hint}><Textarea id={`d-${f.key}`} name={f.key} className="min-h-28" defaultValue={values[f.key] ?? ""} /></Field>
      ))}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save doctrine"}</Button>
    </form>
  );
}
