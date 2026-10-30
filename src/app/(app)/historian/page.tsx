import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/current-user";
import { aiStatus, ROLES } from "@/ai/historian";
import { Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { HistorianForm } from "@/components/historian/historian-form";

export const metadata: Metadata = { title: "AI Investment Historian" };

export default async function HistorianPage() {
  await requireUser();
  const status = aiStatus();
  return (
    <>
      <PageHeader eyebrow="AI Investment Historian" title="Ask the record, not the internet" description="The assistant answers only from the approved research corpus: published claims, dossier divisions, transactions and cases. Every statement must cite the evidence it was given, and citations that do not match are removed. Without an assistant connection you can still search the same evidence." />
      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_2fr]">
        <Card>
          <Eyebrow className="mb-2">Connection</Eyebrow>
          {status.configured ? <p className="text-sm text-positive">Assistant connected</p> : <p className="text-sm text-gold-soft">Not connected</p>}
          <p className="mt-2 text-xs leading-relaxed text-slate-mist">{status.configured ? `Model: ${status.model}. The API key stays on the server and is never sent to your browser.` : "An administrator connects it by setting ANTHROPIC_API_KEY in the server environment. Nothing else about the app changes."}</p>
        </Card>
        <Card>
          <Eyebrow className="mb-2">Roles</Eyebrow>
          <ul className="grid gap-x-4 gap-y-1 text-xs text-platinum/80 sm:grid-cols-2">{ROLES.map((r) => <li key={r.key}><span className="text-ivory">{r.label}.</span> {r.stance.split(". ")[0]}.</li>)}</ul>
        </Card>
      </div>
      <HistorianForm roles={ROLES.map((r) => ({ key: r.key, label: r.label, example: r.example }))} configured={status.configured} dailyLimit={status.dailyLimit} />
    </>
  );
}
