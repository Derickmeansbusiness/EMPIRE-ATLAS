import { Button, Field, Input, Select } from "@/components/ui/primitives";

export type FieldKind = "usd" | "pct" | "int" | "num" | "text" | "select";
export interface FieldSpec { key: string; label: string; kind: FieldKind; step?: number; options?: Array<[string, string]>; hint?: string; span?: 2 }

/** Server-rendered GET form. Values are the resolved UI-unit values (percent as percent, dollars as dollars). */
export function ParamForm({ action, fields, values, submitLabel = "Run", hidden = {} }: { action: string; fields: FieldSpec[]; values: Record<string, string | number | boolean>; submitLabel?: string; hidden?: Record<string, string> }) {
  return (
    <form method="get" action={action} className="grid grid-cols-2 gap-3">
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {fields.map((f) => {
        const v = values[f.key];
        const id = `p-${f.key}`;
        return (
          <div key={f.key} className={f.span === 2 ? "col-span-2" : ""}>
            <Field label={f.label} htmlFor={id} hint={f.hint}>
              {f.kind === "select" ? (
                <Select id={id} name={f.key} defaultValue={String(v)}>{(f.options ?? []).map(([val, label]) => <option key={val} value={val}>{label}</option>)}</Select>
              ) : f.kind === "text" ? (
                <Input id={id} name={f.key} type="text" defaultValue={String(v)} />
              ) : (
                <Input id={id} name={f.key} type="number" inputMode="decimal" step={f.step ?? (f.kind === "int" ? 1 : f.kind === "pct" ? 0.05 : 1)} defaultValue={typeof v === "number" ? Number(v.toFixed(6)) : String(v)} />
              )}
            </Field>
          </div>
        );
      })}
      <div className="col-span-2 mt-2 flex gap-2"><Button type="submit">{submitLabel}</Button><a href={action} className="inline-flex items-center rounded-md border border-platinum/25 px-4 py-2.5 text-sm text-platinum hover:border-gold hover:text-gold">Reset</a></div>
    </form>
  );
}

export function HypotheticalBanner({ modelName, version }: { modelName?: string | null; version?: number }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-md border border-sky-400/40 bg-sky-400/10 px-4 py-2 text-xs text-sky-100">
      <span className="rounded-full border border-sky-300/60 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em]">Hypothetical</span>
      <span>Inputs on this page are modelling assumptions, never historical data.{modelName ? ` Loaded saved model “${modelName}” (v${version}).` : ""}</span>
    </div>
  );
}

export function ResultsTable({ headers, rows, align = "right" }: { headers: string[]; rows: Array<Array<string | number>>; align?: "right" | "left" }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs numeric">
        <thead className="text-left text-[0.6rem] uppercase tracking-[0.14em] text-slate-mist"><tr>{headers.map((h, i) => <th key={h} className={`p-1.5 ${i === 0 ? "" : align === "right" ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t hairline">{r.map((c, j) => <td key={j} className={`p-1.5 ${j === 0 ? "text-ivory" : align === "right" ? "text-right" : ""}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
