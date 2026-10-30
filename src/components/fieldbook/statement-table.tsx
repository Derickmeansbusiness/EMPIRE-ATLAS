"use client";

import { useMemo, useState } from "react";
import { formatPct, formatUsd } from "@/lib/format";

export interface TableLine { key: string; label: string; section: "gpr" | "deduction" | "other_income" | "expense" | "reserve"; amount: number; note?: string }

/** Editable normalisation table. Works as a plain form without JS; with JS it recomputes subtotals as you type. */
export function StatementTable({ lines, units }: { lines: TableLine[]; units: number }) {
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(lines.map((l) => [l.key, String(l.amount)])));
  const sums = useMemo(() => {
    const v = (l: TableLine) => { const n = Number((vals[l.key] ?? "").replace(/[$,\s]/g, "")); return Number.isFinite(n) ? n : 0; };
    const sum = (s: TableLine["section"]) => lines.filter((l) => l.section === s).reduce((a, l) => a + v(l), 0);
    const egi = sum("gpr") - sum("deduction") + sum("other_income"); const opex = sum("expense"); const before = egi - opex; const noi = before - sum("reserve");
    return { egi, opex, before, noi, ratio: egi > 0 ? opex / egi : NaN, perUnit: opex / units };
  }, [vals, lines, units]);
  const groups: Array<[string, TableLine["section"][]]> = [["Revenue", ["gpr", "deduction", "other_income"]], ["Operating expenses", ["expense"]], ["Below the line", ["reserve"]]];
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">Seller-reported amounts and your normalised amounts</caption>
          <thead><tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-mist"><th className="py-2 pr-3 font-normal">Line</th><th className="px-3 py-2 text-right font-normal">Seller reports</th><th className="px-3 py-2 font-normal">Your amount</th><th className="py-2 pl-3 font-normal">Your basis (cite the evidence)</th></tr></thead>
          {groups.map(([title, secs]) => (
            <tbody key={title} className="border-t hairline">
              <tr><th colSpan={4} className="pt-3 pb-1 text-left text-xs font-normal uppercase tracking-[0.14em] text-gold">{title}</th></tr>
              {lines.filter((l) => secs.includes(l.section)).map((l) => (
                <tr key={l.key} className="align-top">
                  <td className="py-1.5 pr-3 text-platinum/90"><label htmlFor={`amt_${l.key}`}>{l.section === "deduction" ? `Less: ${l.label}` : l.label}</label>{l.note && <span className="block text-xs text-slate-mist">{l.note}</span>}</td>
                  <td className="px-3 py-1.5 text-right numeric text-platinum/80">{formatUsd(l.amount)}</td>
                  <td className="px-3 py-1.5"><input id={`amt_${l.key}`} name={`amt_${l.key}`} inputMode="decimal" autoComplete="off" value={vals[l.key] ?? ""} onChange={(e) => setVals((p) => ({ ...p, [l.key]: e.target.value }))} className="w-32 rounded-md border border-platinum/20 bg-midnight/70 px-2 py-1.5 text-right text-sm text-ivory numeric" /></td>
                  <td className="py-1.5 pl-3"><input id={`basis_${l.key}`} name={`basis_${l.key}`} aria-label={`Basis for ${l.label}`} maxLength={400} autoComplete="off" placeholder="Only if you changed it" className="w-full min-w-[12rem] rounded-md border border-platinum/20 bg-midnight/70 px-2 py-1.5 text-sm text-ivory" /></td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <dl className="mt-4 grid gap-3 rounded-card border hairline bg-obsidian/50 p-4 text-sm sm:grid-cols-5" aria-live="polite">
        <div><dt className="text-xs text-slate-mist">Your EGI</dt><dd className="numeric text-ivory">{formatUsd(sums.egi)}</dd></div>
        <div><dt className="text-xs text-slate-mist">Your operating expenses</dt><dd className="numeric text-ivory">{formatUsd(sums.opex)}</dd></div>
        <div><dt className="text-xs text-slate-mist">Expense ratio</dt><dd className="numeric text-ivory">{Number.isFinite(sums.ratio) ? formatPct(sums.ratio, 1) : "n/a"}</dd></div>
        <div><dt className="text-xs text-slate-mist">NOI before reserves</dt><dd className="numeric text-ivory">{formatUsd(sums.before)}</dd></div>
        <div><dt className="text-xs text-slate-mist">NOI after reserves</dt><dd className="numeric text-gold">{formatUsd(sums.noi)}</dd></div>
      </dl>
    </div>
  );
}
