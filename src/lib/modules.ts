export type ModuleStatus = "live" | "partial" | "planned";
export interface ModuleInfo { key: string; title: string; description: string; status: ModuleStatus; phase: string; href?: string; note?: string }

/** Single source of truth for what is implemented. Keep in sync with docs/ROADMAP.md. */
export const MODULES: ModuleInfo[] = [
  { key: "command-center", title: "Empire Command Center", description: "Your research dashboard: activity, saved work, evidence status, recommended next investigation.", status: "live", phase: "Phase 1", href: "/command-center" },
  { key: "dossiers", title: "Empire Dossiers", description: "Twelve-division research profiles with citations, timelines, quotations and evidence confidence.", status: "live", phase: "Phase 1", href: "/dossiers", note: "One dossier published (Sam Zell). Fifteen subjects queued." },
  { key: "timeline", title: "Historical Timeline", description: "Dated milestones across published subjects, each linked to its claim.", status: "live", phase: "Phase 1", href: "/timeline" },
  { key: "deals", title: "Deal Archaeology", description: "Reconstructed transactions with sources and uses, participants, timeline, open questions, and your attached hypothetical models.", status: "live", phase: "Phase 1–2", href: "/deals" },
  { key: "evidence", title: "Source & Evidence Viewer", description: "Claim-to-source navigation, verification history and source metadata.", status: "live", phase: "Phase 1", href: "/evidence/sources" },
  { key: "library", title: "Research Library", description: "Private notes linked to claims, investors and transactions; bookmarks; tags.", status: "live", phase: "Phase 1", href: "/library", note: "Rich-text, folders, reading lists and export arrive in Phase 5." },
  { key: "lab", title: "Capital Architecture Lab", description: "Seven quantitative tools on a tested formula library, with saved and versioned models and a fictional modern case.", status: "live", phase: "Phase 2", href: "/lab" },
  { key: "network", title: "Capital Network Explorer", description: "Interactive evidence-linked relationship graph with filters by investor, institution, transaction, relationship, confidence, geography, asset class and year; schematic geographic view; institution pages.", status: "live", phase: "Phase 3", href: "/network" },
  { key: "simulator", title: "Empire Strategy Simulator", description: "Decision scenarios with hidden outcomes, scoring and historical comparison.", status: "planned", phase: "Phase 4" },
  { key: "committee", title: "Investment Committee Chamber", description: "Submit and defend an acquisition; receive a scored memo.", status: "planned", phase: "Phase 4" },
  { key: "synthesis", title: "Strategy Synthesis & Doctrine", description: "Principles derived from cases, compared side by side, assembled into an exportable doctrine.", status: "planned", phase: "Phase 5", note: "Tables exist; the workspace UI does not yet." },
  { key: "ritual", title: "Weekly Research Ritual & Six-Month Program", description: "Five-day workflow and 24-week guided journey.", status: "planned", phase: "Phase 5" },
  { key: "historian", title: "AI Investment Historian", description: "Grounded assistant answering only from the approved corpus, with citations.", status: "planned", phase: "Phase 5", note: "Requires a server-side model API key; shows an explicit 'not configured' state until then." },
  { key: "admin", title: "Research CMS & Administration", description: "User roles, claims verification queue, content status, audit log.", status: "partial", phase: "Phase 1", href: "/admin", note: "Users, claims review, content status and audit are live. Rich editing of dossiers, simulation editor and analytics follow." },
];
