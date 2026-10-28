import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { PageHeader } from "@/components/ui/primitives";
import { MODULES } from "@/lib/modules";

export const metadata: Metadata = { title: "Roadmap" };

export default async function RoadmapPage() {
  await requireUser();
  return (
    <>
      <PageHeader eyebrow="Platform roadmap" title="What is live, what is partial, what is planned" description="The simulator, investment committee, strategy synthesis, doctrine, weekly ritual tracking, six-month program and AI historian are not yet built. They are listed here so nothing in the navigation pretends otherwise." />
      <ul className="space-y-3">
        {MODULES.map((m) => (
          <li key={m.key} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-serif text-lg text-ivory">{m.title}</p><p className="text-xs text-platinum/70">{m.description}</p>{m.note && <p className="mt-1 text-xs text-slate-mist">{m.note}</p>}</div>
            <div className="flex shrink-0 items-center gap-3">
              <span className={`rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] ${m.status === "live" ? "border-positive/60 text-positive" : m.status === "partial" ? "border-gold/60 text-gold-soft" : "border-platinum/30 text-slate-mist"}`}>{m.status} · {m.phase}</span>
              {m.href && <Link href={m.href} className="text-xs text-gold hover:underline">Open</Link>}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
