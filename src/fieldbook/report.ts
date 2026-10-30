/** Property Intelligence Report: Markdown for the workspace, escaped printable HTML for export. */
import { reconcile, severityLabel, type FindingLike, type Reconciliation } from "./reconcile";
import type { ChallengeCase } from "./challenges/types";
import { COMPONENT_LABELS, WALK_LIMITS_NOTICE } from "./templates";

export type Decision = "acquire" | "negotiate" | "investigate" | "reject";
export const DECISION_LABELS: Record<Decision, string> = { acquire: "Acquire", negotiate: "Negotiate", investigate: "Investigate further", reject: "Reject" };

export interface ReportInput {
  propertyName: string; fictional: boolean; author: string; date: string;
  challenge: ChallengeCase; findings: FindingLike[]; decision: Decision; rationale: string; sessionDate: string | null; checklistProgress: { done: number; total: number };
}
export interface ReportSnapshot { input: ReportInput; reconciliation: Reconciliation }

export const usd = (n: number) => (Number.isFinite(n) ? `${n < 0 ? "−" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}` : "n/a");
const pct = (n: number, d = 1) => (Number.isFinite(n) ? `${(n * 100).toFixed(d)}%` : "n/a");
const x = (n: number) => (Number.isFinite(n) ? `${n.toFixed(2)}x` : "n/a");

export function buildSnapshot(input: ReportInput): ReportSnapshot { return { input, reconciliation: reconcile(input.challenge, input.findings) }; }

export function reportMarkdown(s: ReportSnapshot): string {
  const { input: i, reconciliation: r } = s; const out: string[] = [];
  const p = (t = "") => out.push(t);
  p(`# Property Intelligence Report: ${i.propertyName}`); p();
  p(`Prepared by ${i.author} on ${i.date}. ${i.fictional ? "**Fictional training property.** All figures are invented." : ""}`); p();
  p(`> Educational screening only. ${WALK_LIMITS_NOTICE} Seller figures are as reported and unaudited. Assumptions marked illustrative are training conventions, not market data.`); p();
  p(`## Screening decision: ${DECISION_LABELS[i.decision]}`); p(); p(i.rationale || "_No rationale recorded._"); p();
  p("## 1. What the seller reports"); p();
  p(`| Line | Amount |`); p(`| --- | ---: |`);
  for (const l of i.challenge.lines) p(`| ${l.label} | ${usd(l.amount)} |`);
  p(`| **Effective gross income** | ${usd(r.seller.summary.egi)} |`); p(`| **Operating expenses** | ${usd(r.seller.summary.operatingExpenses)} |`); p(`| **Reported NOI** | ${usd(r.seller.summary.noiBeforeReserves)} |`); p();
  p(`Expense ratio ${pct(r.seller.summary.expenseRatio)}; implied cap rate at the asking price of ${usd(r.seller.askingPrice)}: ${pct(r.seller.capRate, 2)}; DSCR on the hypothetical loan ${x(r.seller.dscr)}.`); p();
  p("## 2. What we observed"); p();
  p(`${r.observed.findingCount} finding(s) recorded; checklist ${i.checklistProgress.done} of ${i.checklistProgress.total} items rated${i.sessionDate ? ` (walk on ${i.sessionDate})` : ""}. ${r.observed.safetyCount} possible safety issue(s); ${r.observed.specialistCount} needing a specialist; ${r.observed.withPhotos} with photos.`); p();
  if (i.findings.length) {
    p("| Location | Component | Severity | Confidence | Cost range | Cost source |"); p("| --- | --- | --- | --- | ---: | --- |");
    for (const f of i.findings) p(`| ${f.locationLabel} | ${COMPONENT_LABELS[f.component] ?? f.component} | ${severityLabel(f.severity)} | ${f.confidence} | ${f.costLow != null && f.costHigh != null ? `${usd(f.costLow)}–${usd(f.costHigh)}` : "not estimated"} | ${f.costSource ?? "n/a"} |`);
    p(); for (const f of i.findings) p(`- **${f.locationLabel}**: ${f.description}`); p();
    p(`Recorded capital needs: ${usd(r.observed.capitalLow)}–${usd(r.observed.capitalHigh)} (${r.observed.uncosted} serious finding(s) not yet costed).`); p();
  }
  p("## 3. What we can verify"); p();
  for (const v of r.verified) p(`- **${v.label}** (${v.status}): ${v.detail}`); p();
  if (r.crossChecks.length) { p("Cross-checks between the statement and the site. These are questions, not conclusions:"); p(); for (const c of r.crossChecks) p(`- ${c.message}`); p(); }
  p("## 4. What we must investigate"); p(); for (const q of r.investigate) p(`- ${q}`); p();
  p("## 5. What we underwrite"); p();
  p("| Case | NOI after reserves | Capital | Total project cost | Loan | Equity | DSCR | Debt yield | Cash flow after debt |"); p("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const sc of r.scenarios) p(`| ${sc.name} | ${usd(sc.noi)} | ${usd(sc.capital)} | ${usd(sc.totalProjectCost)} | ${usd(sc.loan)} | ${usd(sc.equity)} | ${x(sc.dscr)} | ${pct(sc.debtYield, 2)} | ${usd(sc.cashFlowAfterDebt)} |`); p();
  for (const sc of r.scenarios) { p(`**${sc.name} assumptions**`); for (const a of sc.assumptions) p(`- ${a}`); p(); }
  p("Normalisation adjustments to reported NOI:"); p(); p("| Adjustment | Reported | Underwritten | NOI effect | Basis |"); p("| --- | ---: | ---: | ---: | --- |");
  for (const a of r.solution.adjustments) p(`| ${a.label} | ${usd(a.reported)} | ${usd(a.normalized)} | ${usd(a.noiEffect)} | ${a.basis} |`); p();
  p(`The ${usd(r.solution.oneTimeCapex)} pavement project is treated as capital history, not recurring expense.`); p();
  p("## 6. Investment implications"); p(); for (const m of r.implications) p(`- ${m}`); p();
  p("---"); p("_Educational training output from The Investor’s Fieldbook. Not an appraisal, property condition assessment, investment advice or a substitute for professional due diligence._");
  return out.join("\n");
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const row = (cells: string[], head = false) => `<tr>${cells.map((c) => `<${head ? "th" : "td"}>${esc(c)}</${head ? "th" : "td"}>`).join("")}</tr>`;

export function reportHtml(s: ReportSnapshot): string {
  const { input: i, reconciliation: r } = s;
  const table = (head: string[], rows: string[][]) => `<table><thead>${row(head, true)}</thead><tbody>${rows.map((x2) => row(x2)).join("")}</tbody></table>`;
  const ul = (items: string[]) => `<ul>${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  const body = `
<h1>Property Intelligence Report</h1><p class="sub">${esc(i.propertyName)}${i.fictional ? " · fictional training property" : ""} · prepared by ${esc(i.author)} · ${esc(i.date)}</p>
<p class="notice">Educational screening only. ${esc(WALK_LIMITS_NOTICE)} Seller figures are as reported and unaudited; assumptions marked illustrative are training conventions, not market data.</p>
<h2>Screening decision: ${esc(DECISION_LABELS[i.decision])}</h2><p>${esc(i.rationale || "No rationale recorded.")}</p>
<h2>1. What the seller reports</h2>${table(["Line", "Amount"], [...i.challenge.lines.map((l) => [l.label, usd(l.amount)]), ["Effective gross income", usd(r.seller.summary.egi)], ["Operating expenses", usd(r.seller.summary.operatingExpenses)], ["Reported NOI", usd(r.seller.summary.noiBeforeReserves)]])}
<p>Expense ratio ${esc(pct(r.seller.summary.expenseRatio))}; implied cap rate at ${esc(usd(r.seller.askingPrice))}: ${esc(pct(r.seller.capRate, 2))}; DSCR ${esc(x(r.seller.dscr))}.</p>
<h2>2. What we observed</h2><p>${r.observed.findingCount} finding(s); checklist ${i.checklistProgress.done} of ${i.checklistProgress.total} items rated; ${r.observed.safetyCount} possible safety issue(s); ${r.observed.specialistCount} needing a specialist.</p>
${i.findings.length ? table(["Location", "Component", "Severity", "Confidence", "Cost range", "Cost source"], i.findings.map((f) => [f.locationLabel, COMPONENT_LABELS[f.component] ?? f.component, severityLabel(f.severity), f.confidence, f.costLow != null && f.costHigh != null ? `${usd(f.costLow)}–${usd(f.costHigh)}` : "not estimated", f.costSource ?? "n/a"])) + ul(i.findings.map((f) => `${f.locationLabel}: ${f.description}`)) : ""}
<h2>3. What we can verify</h2>${ul(r.verified.map((v) => `${v.label} (${v.status}): ${v.detail}`))}${r.crossChecks.length ? `<p>Cross-checks between the statement and the site (questions, not conclusions):</p>${ul(r.crossChecks.map((c) => c.message))}` : ""}
<h2>4. What we must investigate</h2>${ul(r.investigate)}
<h2>5. What we underwrite</h2>${table(["Case", "NOI after reserves", "Capital", "Total project cost", "Loan", "Equity", "DSCR", "Debt yield", "Cash flow after debt"], r.scenarios.map((sc) => [sc.name, usd(sc.noi), usd(sc.capital), usd(sc.totalProjectCost), usd(sc.loan), usd(sc.equity), x(sc.dscr), pct(sc.debtYield, 2), usd(sc.cashFlowAfterDebt)]))}
${r.scenarios.map((sc) => `<h3>${esc(sc.name)} assumptions</h3>${ul(sc.assumptions)}`).join("")}
${table(["Adjustment", "Reported", "Underwritten", "NOI effect", "Basis"], r.solution.adjustments.map((a) => [a.label, usd(a.reported), usd(a.normalized), usd(a.noiEffect), a.basis]))}
<h2>6. Investment implications</h2>${ul(r.implications)}
<p class="foot">Educational training output from The Investor’s Fieldbook. Not an appraisal, property condition assessment, investment advice or a substitute for professional due diligence.</p>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(`Property Intelligence Report: ${i.propertyName}`)}</title><style>
body{font:15px/1.55 Georgia,serif;color:#101722;max-width:900px;margin:2rem auto;padding:0 1rem}h1{font-weight:500;margin-bottom:.2rem}h2{margin-top:2rem;border-bottom:1px solid #c19b63;padding-bottom:.2rem;font-weight:500}.sub{color:#555;margin-top:0}
table{border-collapse:collapse;width:100%;font:13px/1.4 system-ui,sans-serif;margin:.8rem 0}th,td{border:1px solid #d8d3c8;padding:.35rem .5rem;text-align:left;vertical-align:top}th{background:#f1ede4}
.notice{background:#f7f5f0;border-left:3px solid #c19b63;padding:.6rem .8rem;font-size:13px}.foot{color:#555;font-size:12px;margin-top:2rem}@media print{body{margin:0;max-width:none}h2{break-after:avoid}table{break-inside:avoid}}</style></head><body>${body}</body></html>`;
}
