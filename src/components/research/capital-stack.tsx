import type { CapitalStackItem, Institution } from "@/db/schema";
import { DataStatusBadge } from "./status";
import { formatUsd } from "@/lib/format";

type Row = { item: CapitalStackItem; provider: Institution | null };

const LAYER_COLORS = ["bg-gold", "bg-gold-soft", "bg-platinum/70", "bg-sky-300/80", "bg-positive/80", "bg-slate-mist"];

export function SourcesAndUses({ rows }: { rows: Row[] }) {
  const sources = rows.filter((r) => r.item.side === "source");
  const uses = rows.filter((r) => r.item.side === "use");
  const sum = (list: Row[]) => list.reduce((s, r) => s + (r.item.amountUsd ? Number(r.item.amountUsd) : 0), 0);
  const unknownCount = (list: Row[]) => list.filter((r) => r.item.amountUsd == null).length;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[{ title: "Sources", list: sources }, { title: "Uses", list: uses }].map(({ title, list }) => (
        <div key={title} className="card p-5">
          <div className="flex items-baseline justify-between"><h3 className="font-serif text-xl text-ivory">{title}</h3><span className="text-xs text-slate-mist">{list.length} lines · {unknownCount(list)} unknown</span></div>
          <StackBar list={list} />
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-[0.65rem] uppercase tracking-[0.16em] text-slate-mist"><tr><th className="pb-2 font-medium">Layer</th><th className="pb-2 font-medium text-right">Amount</th><th className="pb-2 pl-3 font-medium">Status</th></tr></thead>
            <tbody>
              {list.map(({ item, provider }) => (
                <tr key={item.id} className="border-t hairline align-top">
                  <td className="py-2.5 pr-3">
                    <p className="text-ivory">{item.layer}</p>
                    <p className="text-xs text-platinum/70">{item.label}{provider ? ` · ${provider.name}` : ""}</p>
                    {item.note && <p className="mt-1 text-xs text-slate-mist">{item.note}</p>}
                  </td>
                  <td className="py-2.5 text-right numeric text-ivory whitespace-nowrap">{item.amountLabel ?? (item.amountUsd ? formatUsd(item.amountUsd, { compact: true }) : "—")}</td>
                  <td className="py-2.5 pl-3"><DataStatusBadge status={item.dataStatus} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="border-t border-gold/40 text-xs"><td className="pt-2 text-slate-mist">Sum of quantified lines (excludes unknowns)</td><td className="pt-2 text-right numeric text-gold-soft">{formatUsd(sum(list), { compact: true })}</td><td /></tr></tfoot>
          </table>
        </div>
      ))}
    </div>
  );
}

function StackBar({ list }: { list: Row[] }) {
  const known = list.filter((r) => r.item.amountUsd != null);
  const total = known.reduce((s, r) => s + Number(r.item.amountUsd), 0);
  if (total === 0) return <p className="mt-3 text-xs text-slate-mist">No quantified lines.</p>;
  return (
    <div className="mt-4">
      <div className="flex h-5 w-full overflow-hidden rounded-md border hairline" role="img" aria-label="Proportional bar of quantified lines">
        {known.map((r, i) => (
          <div key={r.item.id} className={`stack-seg ${LAYER_COLORS[i % LAYER_COLORS.length]} ${r.item.dataStatus !== "documented" ? "opacity-60" : ""}`} style={{ width: `${(Number(r.item.amountUsd) / total) * 100}%` }} title={`${r.item.layer}: ${formatUsd(r.item.amountUsd, { compact: true })}`} />
        ))}
      </div>
      <p className="mt-1 text-[0.65rem] text-slate-mist">Faded segments are estimates. Unknown lines are not drawn because their size is not known.</p>
    </div>
  );
}
