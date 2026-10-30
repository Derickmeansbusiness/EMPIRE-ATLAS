/** Investment doctrine: fields, export (Markdown and print-ready HTML) and completeness. Pure and unit-tested. */

export const DOCTRINE_FIELDS = [
  { key: "targetAssets", label: "Target assets", hint: "Property types, size ranges, condition, and what you will not buy." },
  { key: "geographicStrategy", label: "Geographic strategy", hint: "Markets, submarkets, and the evidence you require about them." },
  { key: "acquisitionCriteria", label: "Acquisition criteria", hint: "Price discipline, return thresholds, diligence you insist on." },
  { key: "financingCriteria", label: "Financing criteria", hint: "Leverage limits, debt structure, coverage, maturity matching." },
  { key: "riskTolerance", label: "Risk tolerance", hint: "Maximum loss you will accept, liquidity reserves, stress tests that must pass." },
  { key: "capitalPartnerStrategy", label: "Capital partner strategy", hint: "Who you partner with, on what terms, and what you will never concede." },
  { key: "committeeStandards", label: "Investment committee standards", hint: "What a submission must contain before you consider it." },
  { key: "exitStrategies", label: "Exit strategies", hint: "Hold periods, sale and refinance triggers, fallback exits." },
] as const;
export type DoctrineKey = (typeof DOCTRINE_FIELDS)[number]["key"];
export type DoctrineValues = Record<DoctrineKey, string | null | undefined>;

export function filledCount(d: Partial<DoctrineValues> | null | undefined): number {
  if (!d) return 0;
  return DOCTRINE_FIELDS.filter((f) => (d[f.key] ?? "").trim().length >= 20).length;
}

export interface ExportPrinciple { title: string; statement: string; sourceInvestor?: string | null; transaction?: string | null; claimText?: string | null; claimStatus?: string | null; relevantRisk?: string | null; modernApplication?: string | null }
export interface ExportInput { author: string; researcherLabel?: string | null; date: string; doctrine: Partial<DoctrineValues>; principles: ExportPrinciple[] }

export function doctrineMarkdown(i: ExportInput): string {
  const L: string[] = [];
  L.push("# Personal Investment Doctrine", "", `**${i.author}**${i.researcherLabel ? ` · ${i.researcherLabel}` : ""} · ${i.date}`, "", "_Prepared with Empire Atlas. This document records the author’s own investment criteria; it is not investment advice._", "");
  for (const f of DOCTRINE_FIELDS) { L.push(`## ${f.label}`, "", (i.doctrine[f.key] ?? "").trim() || "_Not yet written._", ""); }
  if (i.principles.length) {
    L.push("## Supporting principles", "");
    i.principles.forEach((p, n) => {
      L.push(`### ${n + 1}. ${p.title}`, "", p.statement.trim(), "");
      if (p.sourceInvestor) L.push(`- **Source:** ${p.sourceInvestor}`);
      if (p.transaction) L.push(`- **Supporting transaction:** ${p.transaction}`);
      if (p.claimText) L.push(`- **Evidence:** ${p.claimText}${p.claimStatus ? ` (${p.claimStatus})` : ""}`);
      if (p.relevantRisk) L.push(`- **Relevant risk:** ${p.relevantRisk}`);
      if (p.modernApplication) L.push(`- **Modern application:** ${p.modernApplication}`);
      L.push("");
    });
  }
  return L.join("\n");
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const para = (t: string) => t.trim().split(/\n\s*\n/).map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("");

/** Self-contained, print-styled HTML. Every user-supplied string is escaped. Use the browser's print dialog for PDF. */
export function doctrineHtml(i: ExportInput): string {
  const sections = DOCTRINE_FIELDS.map((f, n) => `<section><h2><span>${String(n + 1).padStart(2, "0")}</span>${escapeHtml(f.label)}</h2>${(i.doctrine[f.key] ?? "").trim() ? para(i.doctrine[f.key]!) : '<p class="empty">Not yet written.</p>'}</section>`).join("");
  const principles = i.principles.length ? `<section class="principles"><h2>Supporting principles</h2>${i.principles.map((p, n) => `<article><h3>${n + 1}. ${escapeHtml(p.title)}</h3>${para(p.statement)}<dl>${p.sourceInvestor ? `<dt>Source</dt><dd>${escapeHtml(p.sourceInvestor)}</dd>` : ""}${p.transaction ? `<dt>Transaction</dt><dd>${escapeHtml(p.transaction)}</dd>` : ""}${p.claimText ? `<dt>Evidence</dt><dd>${escapeHtml(p.claimText)}${p.claimStatus ? ` <em>(${escapeHtml(p.claimStatus)})</em>` : ""}</dd>` : ""}${p.relevantRisk ? `<dt>Risk</dt><dd>${escapeHtml(p.relevantRisk)}</dd>` : ""}${p.modernApplication ? `<dt>Modern application</dt><dd>${escapeHtml(p.modernApplication)}</dd>` : ""}</dl></article>`).join("")}</section>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Personal Investment Doctrine — ${escapeHtml(i.author)}</title><style>
:root{--ink:#101722;--gold:#8a6a35;--rule:#d8d2c4;--paper:#f7f5f0}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.65 Georgia,"Iowan Old Style",serif}
main{max-width:760px;margin:0 auto;padding:56px 28px 80px}
header{border-bottom:2px solid var(--ink);padding-bottom:24px;margin-bottom:36px}
header p.k{font:600 11px/1 system-ui,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:var(--gold);margin:0 0 14px}
h1{font-size:2.4rem;line-height:1.1;margin:0 0 12px;font-weight:500;letter-spacing:-.01em}
header p{margin:0;color:#4a5260;font-size:.95rem}
section{margin:0 0 30px;break-inside:avoid}
h2{font-size:1.3rem;font-weight:500;margin:0 0 8px;border-top:1px solid var(--rule);padding-top:16px}h2 span{font:600 .8rem system-ui,sans-serif;color:var(--gold);margin-right:12px;letter-spacing:.12em}
p{margin:0 0 .9em}.empty{color:#7a8190;font-style:italic}
.principles article{margin:0 0 22px;break-inside:avoid}h3{font-size:1.05rem;margin:0 0 4px}dl{display:grid;grid-template-columns:150px 1fr;gap:2px 14px;font-size:.88rem;margin:6px 0 0}dt{font:600 .7rem system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);padding-top:2px}dd{margin:0}
footer{margin-top:48px;border-top:1px solid var(--rule);padding-top:14px;font-size:.8rem;color:#6a7280}
@media print{body{background:#fff}main{padding:0}@page{margin:22mm}}
</style></head><body><main><header><p class="k">Empire Atlas</p><h1>Personal Investment Doctrine</h1><p>${escapeHtml(i.author)}${i.researcherLabel ? ` · ${escapeHtml(i.researcherLabel)}` : ""} · ${escapeHtml(i.date)}</p></header>${sections}${principles}<footer>Prepared with Empire Atlas. This document records the author’s own investment criteria. It is not investment advice. Use your browser’s Print command to save a PDF.</footer></main></body></html>`;
}
