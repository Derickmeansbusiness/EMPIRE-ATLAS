/**
 * Lexical retrieval (BM25) over the approved research corpus. Deterministic, dependency-free and testable.
 * This is the grounding layer for the AI Investment Historian, and it also powers evidence search on its own.
 */
export type DocKind = "claim" | "section" | "transaction" | "case";

export interface CorpusDoc {
  /** Citation reference the model must use, e.g. "claim:egi-founding-year" or "doc:section:sam-zell-3". */
  ref: string; kind: DocKind; slug: string; title: string; text: string; href: string; status?: string | null;
}
export interface Hit { doc: CorpusDoc; score: number }

const STOP = new Set("a an and are as at be but by for from has have how i if in into is it its of on or that the their then there these this to was were what when where which who why will with would you your".split(" "));

function stem(w: string): string {
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("es")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

export function tokenize(text: string): string[] {
  return (text.toLowerCase().replace(/\[\[claim:[a-z0-9-]+\]\]/g, " ").match(/[a-z0-9$.%]+/g) ?? []).map((t) => t.replace(/^[.$%]+|[.$%]+$/g, "")).filter((t) => t && !STOP.has(t)).map(stem);
}

export interface Index { docs: CorpusDoc[]; tf: Array<Map<string, number>>; len: number[]; avg: number; df: Map<string, number> }

export function buildIndex(docs: CorpusDoc[]): Index {
  const tf: Array<Map<string, number>> = []; const len: number[] = []; const df = new Map<string, number>();
  for (const d of docs) {
    const tokens = [...tokenize(d.title), ...tokenize(d.title), ...tokenize(d.text)]; // title counts double
    const m = new Map<string, number>(); for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
    tf.push(m); len.push(tokens.length);
    for (const t of m.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  }
  return { docs, tf, len, avg: len.reduce((a, b) => a + b, 0) / Math.max(1, len.length), df };
}

export function search(index: Index, query: string, k = 6, opts: { k1?: number; b?: number } = {}): Hit[] {
  const k1 = opts.k1 ?? 1.5; const b = opts.b ?? 0.75; const N = index.docs.length;
  const q = Array.from(new Set(tokenize(query)));
  if (q.length === 0 || N === 0) return [];
  const hits: Hit[] = [];
  index.docs.forEach((doc, i) => {
    let score = 0;
    for (const t of q) {
      const f = index.tf[i]!.get(t) ?? 0; if (!f) continue;
      const n = index.df.get(t) ?? 0; const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * index.len[i]!) / index.avg)));
    }
    if (score > 0) hits.push({ doc, score });
  });
  return hits.sort((a, b2) => b2.score - a.score || a.doc.ref.localeCompare(b2.doc.ref)).slice(0, k);
}
