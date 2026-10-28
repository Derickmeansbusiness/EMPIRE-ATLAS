import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getAttempt } from "@/lib/data/simulations";
import { activeStages, getScenario, playerView, type AttemptRecord } from "@/simulation";
import { chooseOptionAction } from "@/app/actions/simulations";
import { Alert, Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Scenario" };

export default async function PlayPage({ params, searchParams }: { params: Promise<{ slug: string; attemptId: string }>; searchParams: Promise<{ chose?: string; error?: string }> }) {
  const user = await requireUser();
  const { slug, attemptId } = await params; const sp = await searchParams;
  const scenario = getScenario(slug); if (!scenario) notFound();
  const db = await getDb();
  const attempt = await getAttempt(db, user.id, attemptId);
  if (!attempt || attempt.scenarioSlug !== slug) notFound();
  if (attempt.status === "completed") redirect(`/simulator/${slug}/debrief/${attemptId}`);
  const record: AttemptRecord = { choices: attempt.choices as AttemptRecord["choices"] };
  const view = playerView(scenario, record);
  if (!view) redirect(`/simulator/${slug}/debrief/${attemptId}`);
  const { results, state } = activeStages(scenario, record);
  const last = results[results.length - 1];
  const unitShort = scenario.unit.startsWith("$ billions") ? "bn" : scenario.unit.startsWith("$ thousands") ? "k" : "";
  const money = (v: number) => unitShort === "bn" ? `$${v.toFixed(1)}bn` : unitShort === "k" ? formatUsd(v * 1000) : String(v);
  return (
    <>
      <PageHeader eyebrow={`${scenario.title} · Stage ${view.index} of ${view.total}`} title={view.title} description={<span className="text-gold">{view.when}</span>} />
      {sp.error === "stale" && <div className="mb-5"><Alert tone="warning">That stage was already decided; here is the current one.</Alert></div>}
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          {last && sp.chose && (
            <Alert tone="info"><span className="eyebrow mr-2">Consequence</span>{last.option.consequence ?? "Your choice is recorded."}</Alert>
          )}
          <Card>
            <Eyebrow className="mb-2">Briefing · information available at this moment</Eyebrow>
            <div className="space-y-3 text-sm leading-relaxed text-platinum/85">{view.briefing.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>
            {view.constraints.length > 0 && <ul className="mt-4 space-y-1 text-xs text-platinum/70">{view.constraints.map((c) => <li key={c} className="border-l-2 border-gold/50 pl-2">{c}</li>)}</ul>}
          </Card>
          <Card>
            <Eyebrow className="mb-3">Your decision</Eyebrow>
            <div className="space-y-3">
              {view.options.map((o) => (
                <form key={o.key} action={chooseOptionAction} className="rounded-md border hairline p-4 transition-colors hover:border-gold/60">
                  <input type="hidden" name="attemptId" value={attempt.id} /><input type="hidden" name="scenario" value={slug} /><input type="hidden" name="stageKey" value={view.key} /><input type="hidden" name="optionKey" value={o.key} />
                  <p className="font-serif text-lg text-ivory">{o.label}</p>
                  <p className="mt-1 text-sm text-platinum/75">{o.detail}</p>
                  <button type="submit" className="mt-3 rounded-md bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-soft focus-ring">Commit to this</button>
                </form>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-mist">Decisions are final for this attempt. Consequences, scores and the documented history are revealed only in the debrief.</p>
          </Card>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <Eyebrow className="mb-2">Your position ({scenario.unit})</Eyebrow>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-mist">Equity value</dt><dd className="numeric text-ivory">{money(state.equityValue)}</dd></div>
              <div><dt className="text-slate-mist">Liquidity</dt><dd className="numeric text-ivory">{money(state.liquidity)}</dd></div>
              <div><dt className="text-slate-mist">Debt</dt><dd className="numeric text-ivory">{money(state.debt)}</dd></div>
              <div><dt className="text-slate-mist">Asset value</dt><dd className="numeric text-ivory">{money(state.assetValue)}</dd></div>
            </dl>
            {state.log.length > 0 && <ul className="mt-3 space-y-1 text-xs text-platinum/70">{state.log.map((l, i) => <li key={i}>· {l}</li>)}</ul>}
          </Card>
          <Card><Eyebrow className="mb-2">Setting</Eyebrow><div className="space-y-2 text-xs leading-relaxed text-platinum/75">{scenario.setting.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div></Card>
          <Card><Eyebrow className="mb-2">Capital sources</Eyebrow><ul className="space-y-1 text-xs text-platinum/75">{scenario.capitalSources.map((c) => <li key={c}>· {c}</li>)}</ul></Card>
          <div className="rounded-md border border-sky-400/40 bg-sky-400/10 px-3 py-2 text-[0.65rem] text-sky-100">{scenario.disclaimer}</div>
        </aside>
      </div>
    </>
  );
}
