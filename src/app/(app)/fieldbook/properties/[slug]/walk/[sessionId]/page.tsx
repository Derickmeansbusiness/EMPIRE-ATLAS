/* eslint-disable @next/next/no-img-element -- private, authorised images served by our own route cannot use the public image optimiser */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getProperty, getSession, listFindingRevisions } from "@/lib/data/fieldbook";
import { evidenceFor } from "@/fieldbook/field-evidence";
import { COMPONENT_LABELS, SEVERITY_LABELS, WALK_LIMITS_NOTICE, WALK_SAFETY_NOTICE, allItems, getTemplate } from "@/fieldbook/templates";
import { addFollowUpAction, clearLocationAction, completeWalkAction, deleteFindingAction, reopenWalkAction, toggleFollowUpAction } from "@/app/actions/fieldbook";
import { Alert, Button, Card, Eyebrow, Field, PageHeader, Textarea } from "@/components/ui/primitives";
import { WalkChecklist } from "@/components/fieldbook/walk-checklist";
import { FindingForm } from "@/components/fieldbook/finding-form";
import { LocationButton } from "@/components/fieldbook/location-button";
import { formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Property walk" };

export default async function WalkPage({ params, searchParams }: { params: Promise<{ slug: string; sessionId: string }>; searchParams: Promise<{ item?: string; edit?: string; saved?: string }> }) {
  const user = await requireUser(); const { slug, sessionId } = await params; const sp = await searchParams; const db = await getDb();
  const prop = await getProperty(db, user.id, slug); if (!prop) notFound();
  const data = await getSession(db, user.id, sessionId); if (!data || data.session.propertyId !== prop.id) notFound();
  const t = getTemplate(data.session.templateSlug); if (!t) notFound();
  const { session, items, findings, followUps, media } = data; const locked = session.status === "completed";
  const base = `/fieldbook/properties/${prop.slug}/walk/${session.id}`;
  const cats = t.categories.map((c) => ({ key: c.key, number: c.number, title: c.title, items: c.items.map((i) => ({ key: i.key, prompt: i.prompt, hint: i.hint, evidence: prop.isFictional ? evidenceFor(prop.slug, i.key) : null })) }));
  const initial = Object.fromEntries(items.map((i) => [i.itemKey, { rating: i.rating, note: i.note ?? "" }]));
  const itemLabel = new Map(allItems(t).map((i) => [i.key, i] as const));
  const editing = sp.edit ? findings.find((f) => f.id === sp.edit) : undefined; const revisions = editing ? await listFindingRevisions(db, user.id, editing.id) : [];
  const fromItem = sp.item ? itemLabel.get(sp.item) : undefined;
  const mediaByFinding = new Map<string, typeof media>(); for (const m of media) if (m.findingId) mediaByFinding.set(m.findingId, [...(mediaByFinding.get(m.findingId) ?? []), m]);
  return (
    <>
      <PageHeader eyebrow={`Field inspection · ${prop.name}`} title={t.title} description={`Started ${session.startedAt.toISOString().slice(0, 16).replace("T", " ")} UTC. Each tap is saved as you go${locked ? "" : "; you can leave and resume this walk any time"}.`} actions={<Link href={`/fieldbook/properties/${prop.slug}`} className="rounded-md border border-platinum/25 px-3 py-2 text-xs text-platinum hover:border-gold hover:text-gold">Property</Link>} />
      <Alert tone="warning">{WALK_SAFETY_NOTICE}</Alert>
      <p className="mb-4 mt-2 text-xs text-slate-mist">{WALK_LIMITS_NOTICE}</p>
      {locked && <Alert tone="success">This walk is completed and locked. <Link href={`/fieldbook/properties/${prop.slug}/reconcile?session=${session.id}`} className="underline">Reconcile it against the statement</Link>, or reopen it to edit.</Alert>}

      <Card className="mb-4">
        <Eyebrow className="mb-2">Location tag (optional)</Eyebrow>
        {session.location ? <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-platinum/85">Tagged {session.location.lat.toFixed(4)}, {session.location.lng.toFixed(4)}{session.location.accuracy != null ? ` (±${Math.round(session.location.accuracy)} m)` : ""} at {session.location.capturedAt.slice(11, 16)} UTC.</span>
          <form action={clearLocationAction}><input type="hidden" name="sessionId" value={session.id} /><input type="hidden" name="returnTo" value={base} /><button type="submit" className="min-h-11 text-sm text-risk hover:underline">Remove location</button></form></div>
          : <><p className="mb-2 text-xs text-slate-mist">Your browser asks permission only when you tap the button. Nothing is recorded otherwise.</p>{!locked && <LocationButton sessionId={session.id} />}</>}
      </Card>

      <WalkChecklist sessionId={session.id} basePath={base} categories={cats} initial={initial} locked={locked} />

      <section id="findings" aria-label="Findings" className="mt-10">
        <h2 className="mb-1 font-serif text-2xl text-ivory">Findings ({findings.length})</h2>
        <p className="mb-4 text-sm text-platinum/75">Classify what you saw. Do not classify hidden structural or environmental conditions from the surface or from a photo: mark them “specialist investigation required”.</p>
        {sp.saved && <div className="mb-3"><Alert tone="success">Finding saved.</Alert></div>}
        <div className="space-y-3">{findings.map((f) => (
          <Card key={f.id}><div className="flex flex-wrap items-start justify-between gap-2">
            <div><p className="text-ivory">{f.locationLabel} <span className="text-slate-mist">· {COMPONENT_LABELS[f.component] ?? f.component}</span></p><p className="mt-1 text-sm text-platinum/85">{f.description}</p></div>
            <span className="rounded-full border border-gold/50 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.1em] text-gold">{SEVERITY_LABELS[f.severity]}</span></div>
            <p className="mt-2 text-xs text-slate-mist">Condition {f.condition} · confidence {f.confidence} · {f.followUpStatus.replace("_", " ")} · observed {f.observedAt.toISOString().slice(0, 16).replace("T", " ")} UTC{f.costLowN != null && f.costHighN != null ? ` · cost ${formatUsd(f.costLowN)}–${formatUsd(f.costHighN)} (${f.costSource})` : " · cost not estimated"}{f.specialistNeeded ? ` · specialist: ${f.specialistNeeded}` : ""}</p>
            {f.resolution && <p className="mt-1 text-xs text-platinum/75">Resolution: {f.resolution}</p>}
            {(mediaByFinding.get(f.id) ?? []).length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{(mediaByFinding.get(f.id) ?? []).map((m) => (<li key={m.id}><img src={`/fieldbook/media/${m.id}`} alt={m.caption || `Photo for ${f.locationLabel}`} className="h-24 w-24 rounded-md border hairline object-cover" /></li>))}</ul>}
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm"><Link href={`${base}?edit=${f.id}#finding-form`} className="inline-flex min-h-11 items-center text-gold hover:underline">Edit</Link>
              <form action={deleteFindingAction}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="returnTo" value={base} /><button type="submit" className="min-h-11 text-risk hover:underline">Delete</button></form></div>
            {!locked && (
              <form method="post" action="/fieldbook/media" encType="multipart/form-data" className="mt-2 space-y-2 border-t hairline pt-3">
                <input type="hidden" name="sessionId" value={session.id} /><input type="hidden" name="findingId" value={f.id} /><input type="hidden" name="redirect" value="1" /><input type="hidden" name="returnTo" value={`${base}#findings`} />
                <label className="block text-xs text-slate-mist" htmlFor={`photo-${f.id}`}>Add a photo (JPEG, PNG or WebP, up to 3 MB)</label>
                <input id={`photo-${f.id}`} type="file" name="photo" accept="image/jpeg,image/png,image/webp" capture="environment" required className="block w-full text-sm text-platinum file:mr-3 file:min-h-11 file:rounded-md file:border-0 file:bg-gold file:px-4 file:text-ink" />
                <input name="caption" aria-label="Photo caption" maxLength={200} placeholder="Caption (optional)" className="w-full rounded-md border border-platinum/20 bg-midnight/70 px-3 py-2 text-sm text-ivory" />
                <label className="flex items-start gap-2 text-xs text-platinum/80"><input type="checkbox" name="consent" value="1" required className="mt-0.5 h-4 w-4 accent-[#C19B63]" /> I have permission to photograph this area, and no tenant, occupied unit or private document is shown.</label>
                <button type="submit" className="min-h-11 rounded-md border border-platinum/25 px-4 text-sm text-platinum hover:border-gold hover:text-gold">Upload photo</button>
              </form>)}
          </Card>))}
          {findings.length === 0 && <p className="text-sm text-platinum/75">No findings yet. Use “Record a finding for this item” on any checklist item, or add one below.</p>}</div>

        {!locked && (
          <Card className="mt-5"><div id="finding-form" className="scroll-mt-24">
            <Eyebrow className="mb-1">{editing ? "Edit finding" : "Record a finding"}</Eyebrow>
            {fromItem && !editing && <p className="mb-3 text-xs text-slate-mist">For checklist item: {fromItem.prompt}</p>}
            <FindingForm key={editing?.id ?? sp.item ?? "new"} sessionId={session.id} returnTo={base} defaults={editing ? { id: editing.id, itemKey: editing.itemKey, locationLabel: editing.locationLabel, component: editing.component, description: editing.description, condition: editing.condition, severity: editing.severity, confidence: editing.confidence, financialImpact: editing.financialImpact, specialistNeeded: editing.specialistNeeded, followUpStatus: editing.followUpStatus, costLow: editing.costLow, costHigh: editing.costHigh, costSource: editing.costSource, resolution: editing.resolution } : { itemKey: fromItem?.key ?? null, locationLabel: "", description: "" }} />
            {editing && revisions.length > 0 && <details className="mt-4 text-xs text-slate-mist"><summary className="cursor-pointer">Earlier versions ({revisions.length})</summary><ul className="mt-2 space-y-1">{revisions.map((r) => { const s = r.snapshot as { severity: string; description: string; costLow: string | null; costHigh: string | null }; return <li key={r.id}>{r.revisedAt.toISOString().slice(0, 16).replace("T", " ")}: {SEVERITY_LABELS[s.severity] ?? s.severity}; {s.description.slice(0, 80)}{s.costLow ? `; ${formatUsd(s.costLow)}–${formatUsd(s.costHigh)}` : ""}</li>; })}</ul></details>}
          </div></Card>)}
      </section>

      <section id="followups" aria-label="Follow-up actions" className="mt-10">
        <h2 className="mb-3 font-serif text-2xl text-ivory">Follow-up actions</h2>
        <Card>
          <ul className="mb-4 divide-y hairline">{followUps.map((fu) => (<li key={fu.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span className={fu.status === "done" ? "text-slate-mist line-through" : "text-ivory"}>{fu.title}{fu.dueOn ? <span className="ml-2 text-xs text-slate-mist">due {fu.dueOn}</span> : null}</span>
            <form action={toggleFollowUpAction}><input type="hidden" name="id" value={fu.id} /><input type="hidden" name="done" value={fu.status === "done" ? "0" : "1"} /><input type="hidden" name="returnTo" value={`${base}#followups`} /><button type="submit" className="min-h-11 text-gold hover:underline">{fu.status === "done" ? "Reopen" : "Mark done"}</button></form></li>))}
            {followUps.length === 0 && <li className="py-2 text-sm text-platinum/75">None yet.</li>}</ul>
          {!locked && (<form action={addFollowUpAction} className="grid gap-3 sm:grid-cols-[1fr_auto_auto]"><input type="hidden" name="sessionId" value={session.id} /><input type="hidden" name="returnTo" value={`${base}#followups`} />
            <Field label="New follow-up" htmlFor="fu-title"><input id="fu-title" name="title" required minLength={3} maxLength={200} className="w-full rounded-md border border-platinum/20 bg-midnight/70 px-3 py-2 text-sm text-ivory" placeholder="e.g. Request the pavement invoice" /></Field>
            <Field label="Due" htmlFor="fu-due"><input id="fu-due" name="dueOn" type="date" className="w-full rounded-md border border-platinum/20 bg-midnight/70 px-3 py-2 text-sm text-ivory" /></Field>
            <div className="flex items-end"><Button type="submit">Add</Button></div></form>)}
        </Card>
      </section>

      <section className="mt-10"><Card>
        {locked ? <form action={reopenWalkAction} className="flex flex-wrap items-center gap-3"><input type="hidden" name="sessionId" value={session.id} /><input type="hidden" name="returnTo" value={base} /><Button type="submit" variant="secondary">Reopen this walk</Button><Link href={`/fieldbook/properties/${prop.slug}/reconcile?session=${session.id}`} className="rounded-md bg-gold px-4 py-2 text-sm text-ink">Reconcile with the statement</Link></form>
          : <form action={completeWalkAction} className="space-y-3"><input type="hidden" name="sessionId" value={session.id} /><input type="hidden" name="returnTo" value={`/fieldbook/properties/${prop.slug}/reconcile?session=${session.id}`} />
            <Field label="Walk summary (optional)" htmlFor="summaryNote"><Textarea id="summaryNote" name="summaryNote" maxLength={3000} className="min-h-20" defaultValue={session.summaryNote ?? ""} /></Field>
            <Button type="submit">Finish the walk and reconcile</Button><p className="text-xs text-slate-mist">Finishing locks the walk; you can reopen it later. Your findings stay private to you.</p></form>}
      </Card></section>
    </>
  );
}
