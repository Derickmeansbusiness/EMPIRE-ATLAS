"use client";

import { Fragment, useActionState } from "react";
import Link from "next/link";
import { askHistorianAction, type EvidenceHit, type HistorianState } from "@/app/actions/historian";
import { Alert, Button, Field, Select, Textarea } from "@/components/ui/primitives";
import { VerificationBadge } from "@/components/research/status";
import type { VerificationStatus } from "@/db/schema";

export interface RoleOption { key: string; label: string; example: string }

const VALID = new Set(["verified_primary", "supported_secondary", "contested", "unverified", "hypothetical"]);

function Answer({ text, hits }: { text: string; hits: EvidenceHit[] }) {
  const byRef = new Map(hits.map((h, i) => [h.ref.toLowerCase(), { h, n: i + 1 }] as const));
  return (
    <div className="space-y-3 text-sm leading-relaxed text-platinum/90">
      {text.split(/\n\s*\n/).map((para, pi) => (
        <p key={pi}>
          {para.split(/(\[\[(?:claim|doc):[a-z0-9:_-]+\]\])/gi).map((part, i) => {
            const m = part.match(/^\[\[((?:claim|doc):[a-z0-9:_-]+)\]\]$/i);
            if (!m) return <Fragment key={i}>{part}</Fragment>;
            const e = byRef.get(m[1]!.toLowerCase());
            return e ? <Link key={i} href={e.h.href} title={e.h.title} className="mx-0.5 rounded-full border border-gold/60 px-1.5 py-[1px] align-middle text-[0.65rem] font-semibold text-gold-soft no-underline hover:bg-gold/10">{e.n}</Link> : null;
          })}
        </p>
      ))}
    </div>
  );
}

export function HistorianForm({ roles, configured, dailyLimit }: { roles: RoleOption[]; configured: boolean; dailyLimit: number }) {
  const [state, action, pending] = useActionState<HistorianState, FormData>(askHistorianAction, {});
  return (
    <div className="space-y-6">
      <form action={action} className="card space-y-4 p-5">
        <Field label="Role" htmlFor="role"><Select id="role" name="role" defaultValue={state.role ?? "historian"}>{roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}</Select></Field>
        <Field label="Your question" htmlFor="question" hint={`Try: “${roles[0]!.example}”`}><Textarea id="question" name="question" required minLength={5} maxLength={2000} className="min-h-24" defaultValue={state.question ?? ""} /></Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" name="mode" value="search" variant="secondary" disabled={pending}>{pending ? "Searching…" : "Search the evidence"}</Button>
          <Button type="submit" name="mode" value="ask" disabled={pending || !configured} title={configured ? undefined : "The AI assistant is not configured on this server"}>{pending ? "Asking…" : "Ask the assistant"}</Button>
          {configured ? <span className="text-xs text-slate-mist">Up to {dailyLimit} assistant questions per day.</span> : <span className="text-xs text-gold-soft">Assistant not connected. Evidence search works without it.</span>}
        </div>
      </form>

      {state.error && <Alert tone="warning">{state.error}</Alert>}
      {state.mode === "ask" && state.answer && (
        <section className="card p-5" aria-label="Assistant answer">
          <p className="eyebrow mb-2">Assistant answer · grounded in the evidence below</p>
          <Answer text={state.answer} hits={state.hits ?? []} />
          {state.warnings?.map((w) => <div key={w} className="mt-3"><Alert tone="warning">{w}</Alert></div>)}
          <p className="mt-4 text-xs text-slate-mist">Generated text is not documented history. Numbered chips link to the evidence it was given. Open a claim record to check its source and status before relying on anything here.</p>
        </section>
      )}
      {state.hits && (
        <section aria-label="Retrieved evidence">
          <p className="eyebrow mb-3">{state.mode === "ask" ? "Evidence the assistant was given" : "Matching evidence"} · {state.hits.length}</p>
          {state.hits.length === 0 ? <p className="text-sm text-slate-mist">Nothing in the approved corpus matches. That is itself a finding: it is a research gap.</p> : (
            <ol className="space-y-3">
              {state.hits.map((h, i) => (
                <li key={h.ref} className="card p-4">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-serif text-gold numeric">{i + 1}</span><span className="text-[0.65rem] uppercase tracking-[0.16em] text-slate-mist">{h.kind}</span>{h.status && VALID.has(h.status) && <VerificationBadge status={h.status as VerificationStatus} size="xs" />}</div>
                  <Link href={h.href} className="mt-1 block text-sm text-ivory hover:text-gold">{h.title}</Link>
                  <p className="mt-1 text-xs leading-relaxed text-platinum/70">{h.excerpt}{h.excerpt.length >= 280 ? "…" : ""}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
