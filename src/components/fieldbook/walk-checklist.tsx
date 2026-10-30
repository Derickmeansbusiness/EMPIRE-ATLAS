"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveItemAction } from "@/app/actions/fieldbook";

type Rating = "good" | "fair" | "poor" | "not_observed";
interface Item { key: string; prompt: string; hint?: string; evidence: string | null }
interface Category { key: string; number: number; title: string; items: Item[] }
interface Saved { rating: Rating; note: string }
interface Draft extends Saved { dirty: boolean }

const RATINGS: Array<{ value: Rating; label: string; cls: string }> = [
  { value: "good", label: "Good", cls: "has-[:checked]:border-positive has-[:checked]:bg-positive/15 has-[:checked]:text-positive" },
  { value: "fair", label: "Fair", cls: "has-[:checked]:border-gold has-[:checked]:bg-gold/15 has-[:checked]:text-gold" },
  { value: "poor", label: "Poor", cls: "has-[:checked]:border-risk has-[:checked]:bg-risk/15 has-[:checked]:text-risk" },
  { value: "not_observed", label: "Not seen", cls: "has-[:checked]:border-platinum/60 has-[:checked]:bg-platinum/10 has-[:checked]:text-platinum" },
];

/**
 * Touch-first checklist. Every tap is saved to the server. If the save fails (no connection), the response is kept in
 * this browser's localStorage and retried when the connection returns. Limits: this works while the page stays open;
 * the page itself cannot be loaded offline (there is no service worker), and photos need a connection.
 */
export function WalkChecklist({ sessionId, basePath, categories, initial, locked }: { sessionId: string; basePath: string; categories: Category[]; initial: Record<string, Saved>; locked: boolean }) {
  const storeKey = `fieldbook-draft:${sessionId}`;
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, { ...v, dirty: false }])));
  const [online, setOnline] = useState(true);
  const draftsRef = useRef(drafts);
  useEffect(() => { draftsRef.current = drafts; }, [drafts]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const total = categories.reduce((a, c) => a + c.items.length, 0);
  const rated = Object.values(drafts).filter((d) => d.rating !== "not_observed").length;
  const unsaved = Object.values(drafts).filter((d) => d.dirty).length;

  const persistLocal = useCallback((next: Record<string, Draft>) => {
    try { const dirty = Object.fromEntries(Object.entries(next).filter(([, d]) => d.dirty)); if (Object.keys(dirty).length) localStorage.setItem(storeKey, JSON.stringify(dirty)); else localStorage.removeItem(storeKey); } catch { /* storage unavailable: server saves still work */ }
  }, [storeKey]);

  const push = useCallback(async (key: string) => {
    const d = draftsRef.current[key]; if (!d) return;
    let ok = false;
    try { ok = (await saveItemAction({ sessionId, itemKey: key, rating: d.rating, note: d.note || null })).ok; } catch { ok = false; }
    if (ok) setDrafts((p) => { const cur = p[key]; if (!cur || cur.rating !== d.rating || cur.note !== d.note) return p; const n = { ...p, [key]: { ...cur, dirty: false } }; persistLocal(n); return n; });
  }, [sessionId, persistLocal]);

  const flush = useCallback(async () => { for (const [k, d] of Object.entries(draftsRef.current)) if (d.dirty) await push(k); }, [push]);

  // After mount: re-apply any unsent drafts from a previous offline period and try to send them.
  // localStorage is unreadable during server rendering, so this must run client-side; state is set from a timer, not the effect body.
  useEffect(() => {
    const boot = setTimeout(() => {
      try {
        const raw = localStorage.getItem(storeKey);
        if (raw) { const stored = JSON.parse(raw) as Record<string, Saved>; setDrafts((p) => { const n = { ...p }; for (const [k, v] of Object.entries(stored)) n[k] = { rating: v.rating, note: v.note ?? "", dirty: true }; draftsRef.current = n; return n; }); setTimeout(() => { void flush(); }, 50); }
      } catch { /* ignore */ }
      setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    }, 0);
    const on = () => { setOnline(true); void flush(); }; const off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { clearTimeout(boot); window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, [storeKey, flush]);

  const update = (key: string, patch: Partial<Saved>, immediate: boolean) => {
    if (locked) return;
    setDrafts((p) => { const cur = p[key] ?? { rating: "not_observed" as Rating, note: "", dirty: false }; const n = { ...p, [key]: { ...cur, ...patch, dirty: true } }; draftsRef.current = n; persistLocal(n); return n; });
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => { void push(key); }, immediate ? 0 : 700);
  };

  const status = !online ? `Offline: ${unsaved} change${unsaved === 1 ? "" : "s"} kept on this device and will send when you reconnect.` : unsaved ? `Saving ${unsaved}…` : "All changes saved.";
  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 border-b hairline bg-obsidian/95 px-4 py-3 backdrop-blur lg:top-0 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <div className="flex items-center justify-between gap-3 text-sm"><span className="text-ivory"><span className="numeric text-gold" data-testid="rated-count">{rated}</span> of {total} items rated</span><span role="status" aria-live="polite" data-testid="save-status" className={online ? "text-slate-mist" : "text-risk"}>{status}</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-platinum/10" role="progressbar" aria-label="Checklist progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={rated}><div className="h-full bg-gold transition-all" style={{ width: `${total ? (rated / total) * 100 : 0}%` }} /></div>
      </div>
      <div className="mt-4 space-y-3">
        {categories.map((c, ci) => {
          const done = c.items.filter((i) => (drafts[i.key]?.rating ?? "not_observed") !== "not_observed").length;
          return (
            <details key={c.key} open={ci === 0} className="card group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5">
                <span className="font-serif text-lg text-ivory"><span className="mr-2 text-gold numeric">{c.number}.</span>{c.title}</span>
                <span className="shrink-0 text-xs text-slate-mist numeric">{done}/{c.items.length}</span>
              </summary>
              <div className="space-y-5 border-t hairline p-4 sm:p-5">
                {c.items.map((it) => {
                  const d = drafts[it.key]; const rating = d?.rating ?? "not_observed";
                  return (
                    <fieldset key={it.key} className="space-y-3" data-item={it.key}>
                      <legend className="text-sm leading-relaxed text-ivory">{it.prompt}</legend>
                      {it.hint && <p className="text-xs text-slate-mist">{it.hint}</p>}
                      {it.evidence && <p className="rounded-md border border-gold/30 bg-gold/5 p-3 text-sm leading-relaxed text-platinum/90"><span className="mb-1 block text-[0.65rem] uppercase tracking-[0.16em] text-gold">What you see</span>{it.evidence}</p>}
                      <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={`Condition: ${it.prompt}`}>
                        {RATINGS.map((r) => (
                          <label key={r.value} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-md border border-platinum/20 px-1 text-center text-sm text-platinum/80 ${r.cls} ${locked ? "opacity-60" : ""}`}>
                            <input type="radio" name={`r_${it.key}`} value={r.value} checked={rating === r.value} disabled={locked} onChange={() => update(it.key, { rating: r.value }, true)} className="sr-only" />{r.label}
                          </label>
                        ))}
                      </div>
                      <label className="block"><span className="sr-only">Note for: {it.prompt}</span>
                        <textarea value={d?.note ?? ""} disabled={locked} onChange={(e) => update(it.key, { note: e.target.value, rating: d?.rating ?? "not_observed" }, false)} maxLength={2000} rows={2} placeholder="Note (what you saw, who told you what)" className="w-full rounded-md border border-platinum/20 bg-midnight/70 px-3 py-2 text-sm text-ivory" /></label>
                      {!locked && <Link href={`${basePath}?item=${encodeURIComponent(it.key)}#finding-form`} scroll className="inline-flex min-h-11 items-center text-sm text-gold hover:underline">Record a finding for this item</Link>}
                    </fieldset>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
