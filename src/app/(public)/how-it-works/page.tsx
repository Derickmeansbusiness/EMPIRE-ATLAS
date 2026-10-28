import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/primitives";
import { MODULES } from "@/lib/modules";

export const metadata: Metadata = { title: "How It Works" };

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <PageHeader eyebrow="How It Works" title="A research terminal, an archive and a simulator in one environment" description="Every module below is real software or an honestly labelled plan. Status reflects what is implemented today, not what is intended." />
      <ol className="space-y-4">
        {MODULES.map((m, idx) => (
          <li key={m.key} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:gap-6">
            <span className="font-serif text-3xl text-gold/70 numeric sm:w-12">{String(idx + 1).padStart(2, "0")}</span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-xl text-ivory">{m.title}</h2>
                <span className={`rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.16em] ${m.status === "live" ? "border-positive/60 text-positive" : m.status === "partial" ? "border-gold/60 text-gold-soft" : "border-platinum/30 text-slate-mist"}`}>{m.status === "live" ? "Live" : m.status === "partial" ? "Partially live" : `Planned · ${m.phase}`}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-platinum/75">{m.description}</p>
              {m.note && <p className="mt-2 text-xs text-slate-mist">{m.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
