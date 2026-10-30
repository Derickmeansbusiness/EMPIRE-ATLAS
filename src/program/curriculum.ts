/**
 * The 24-week guided research program. Only one dossier (Sam Zell) is published, so weeks about queued subjects are
 * explicit self-directed research with manual completion, never padded with invented content. Tasks that map to
 * stored activity (a quiz passed, a model saved, a simulation completed) complete themselves.
 */
export interface ActivityStats {
  dossiersOpened: string[]; transactionsOpened: string[]; casesOpened: string[];
  modelKinds: Record<string, number>; simulationBest: Record<string, number>;
  committeeCount: number; committeeBest: { score: number; verdict: string } | null; committeeApproved: boolean;
  quizzesPassed: string[]; principles: number; notes: number; doctrineFieldsFilled: number; ritualDays: number;
  activity: Record<string, number>;
}

export type TaskCheck =
  | { type: "manual" }
  | { type: "dossier"; slug: string } | { type: "deal"; slug: string } | { type: "model"; kind: string }
  | { type: "simulation"; slug: string } | { type: "committee"; minScore?: number } | { type: "quiz"; slug: string }
  | { type: "principles"; min: number } | { type: "notes"; min: number } | { type: "doctrine" } | { type: "ritual"; min: number }
  | { type: "activity"; kind: string; min: number };

export interface Task { key: string; label: string; detail?: string; href?: string; check: TaskCheck }
export interface Week { week: number; month: number; title: string; focus: string; objectives: string[]; tasks: Task[]; selfDirected?: string }

export const MONTHS = [
  "Origins of real estate fortunes", "Development empires and land control", "Financial engineering, private credit and distressed transactions",
  "Operating platforms, recurring income and syndications", "Institutional real estate capital and asset management", "Comparative strategy synthesis and personal investment doctrine",
];

const m = (key: string, label: string, detail?: string, href?: string): Task => ({ key, label, detail, href, check: { type: "manual" } });
const quiz = (slug: string, label: string): Task => ({ key: `quiz-${slug}`, label, href: `/quizzes/${slug}`, check: { type: "quiz", slug } });
const model = (kind: string, label: string, href: string): Task => ({ key: `model-${kind}`, label, href, check: { type: "model", kind } });
const notes = (min: number, label: string): Task => ({ key: `notes-${min}`, label, href: "/library", check: { type: "notes", min } });

export const CURRICULUM: Week[] = [
  { week: 1, month: 1, title: "Learn to read the evidence", focus: "Before any fortune is analysed, learn what the platform’s labels commit it to: primary, secondary, contested, unverified.", objectives: ["Distinguish a documented fact from an estimate and from an unknown.", "Read a claim record and follow it to its source."], tasks: [m("methodology", "Read the research methodology", "Note one thing the platform refuses to do.", "/methodology"), { key: "dossier-sam-zell", label: "Open the Sam Zell dossier", href: "/dossiers/sam-zell", check: { type: "dossier", slug: "sam-zell" } }, quiz("reading-the-evidence", "Pass the “Reading the evidence” quiz")] },
  { week: 2, month: 1, title: "Origins and initial advantages", focus: "What did the investor have at the start: capital, knowledge, a partner, a market? Distinguish what the record shows from what is assumed.", objectives: ["Separate documented advantages from narrative.", "List the open questions the record cannot answer."], tasks: [notes(1, "Write a note on what the record does not say about Zell’s first buildings"), quiz("zell-record", "Pass “The Zell record” quiz"), m("open-questions", "List three open research questions from divisions 1–4", "Use the dossier’s own stated gaps.", "/dossiers/sam-zell#division-4")] },
  { week: 3, month: 1, title: "Land before buildings: Astor and the Rockefellers", focus: "Two fortunes built with land and ground control at city scale.", objectives: ["Find archival or primary sources for a land-accumulation case.", "Write sourced claims with a status you would assign."], selfDirected: "Dossiers for John Jacob Astor and the Rockefellers are queued, not published. Research one yourself; the methodology applies to your own claims.", tasks: [m("sources", "Find two primary or archival sources on one subject", "Record what each states and what it does not.", "/evidence/sources"), m("claims", "Write five sourced claims in your library", "Each with a source, locator and the verification status you would give it.", "/library"), notes(2, "Have at least two notes in your library")] },
  { week: 4, month: 1, title: "Market selection and timing", focus: "Zell wrote down his timing thesis in 1976 and acted on its mirror image in 2007.", objectives: ["State the signal an investor used to buy or sell.", "Save your first investment principle."], tasks: [{ key: "deal-eop", label: "Open the Equity Office sale reconstruction", href: "/deals/equity-office-sale-2007", check: { type: "deal", slug: "equity-office-sale-2007" } }, { key: "principle-1", label: "Save your first principle", href: "/synthesis", check: { type: "principles", min: 1 } }, m("timing-note", "Write what the 1976 and 2007 decisions have in common", undefined, "/library")] },
  { week: 5, month: 2, title: "Financing housing: Stephen Ross", focus: "Development capital and public subsidy as structure.", objectives: ["Describe a development capital stack.", "Model one in the Capital Stack Builder."], selfDirected: "The Stephen Ross dossier is queued. Use public financing disclosures to research it yourself.", tasks: [m("ross-research", "Summarise one financing structure from a public disclosure", "Mark every number documented, estimated or unknown.", "/evidence/sources"), model("capital_stack", "Save a Capital Stack Builder model", "/lab/capital-stack")] },
  { week: 6, month: 2, title: "Master planning and land control: Donald Bren", focus: "Who holds the land decides who captures the value.", objectives: ["Explain land control as a source of advantage.", "Identify what is not publicly known."], selfDirected: "The Donald Bren dossier is queued.", tasks: [m("bren-research", "Summarise how land is held and controlled, from public sources", "Flag unknowns rather than estimating.", "/library"), notes(3, "Have at least three notes in your library")] },
  { week: 7, month: 2, title: "Development on leased land: Rockefeller Center", focus: "Building through a depression on ground you do not own.", objectives: ["Underwrite a ground-lease development simply.", "Name the risk the ground lease transfers."], selfDirected: "The Rockefeller Center entities are queued.", tasks: [m("rc-research", "Research the Rockefeller Center financing and lease structure", undefined, "/evidence/sources"), model("underwriter", "Save an Acquisition Underwriter model", "/lab/underwriter")] },
  { week: 8, month: 2, title: "Checkpoint: principles and comparison", focus: "Turn four weeks of cases into transferable principles, and check them against a documented strategy.", objectives: ["Hold at least three principles, each with evidence.", "Compare your approach with a documented one."], tasks: [{ key: "principles-3", label: "Save three principles", href: "/synthesis", check: { type: "principles", min: 3 } }, { key: "compare-1", label: "Run a strategy comparison", href: "/synthesis/compare", check: { type: "activity", kind: "synthesis.compared", min: 1 } }, { key: "ritual-3", label: "Complete three days of the weekly ritual", href: "/ritual", check: { type: "ritual", min: 3 } }] },
  { week: 9, month: 3, title: "Debt structures", focus: "Amortising, interest-only, balloon, floating, bridge and seller financing: same principal, very different risk.", objectives: ["Read a schedule and find the balloon.", "Choose a structure to match a business plan."], tasks: [model("debt", "Save a Debt Structuring Lab model", "/lab/debt"), quiz("capital-calculations", "Pass the capital calculations quiz"), quiz("capital-structure-concepts", "Pass the capital structure concepts quiz")] },
  { week: 10, month: 3, title: "Private credit from the lender’s chair", focus: "A lender is paid for being right about downside.", objectives: ["Compute loss severity on a default.", "Write the questions a credit committee asks."], tasks: [model("credit", "Save a Private Credit Underwriting model", "/lab/credit"), m("credit-questions", "Write three questions a credit committee would ask the borrower", undefined, "/library")] },
  { week: 11, month: 3, title: "Distressed buyers", focus: "Buy the claim, price the worst path, carry the wait.", objectives: ["Compare discounted payoff, restructuring and foreclosure.", "Negotiate a note purchase."], tasks: [{ key: "case-meridian", label: "Read the Meridian Court case", href: "/lab/cases/meridian-court-distressed-multifamily", check: { type: "activity", kind: "case.opened", min: 1 } }, model("distressed", "Save a Distressed Acquisition model", "/lab/distressed"), { key: "sim-meridian", label: "Complete the Meridian Court negotiation", href: "/simulator", check: { type: "simulation", slug: "meridian-court-lender-negotiation" } }] },
  { week: 12, month: 3, title: "Reconstruct and defend: the Equity Office sale", focus: "Take the best-documented exit in the corpus from reconstruction to decision to committee.", objectives: ["Decide with only the information available then.", "Defend a deal in writing."], tasks: [{ key: "sim-office", label: "Complete the office-portfolio scenario", href: "/simulator", check: { type: "simulation", slug: "office-portfolio-top-of-cycle-2007" } }, { key: "committee-1", label: "Submit to the investment committee", href: "/committee/new", check: { type: "committee" } }] },
  { week: 13, month: 4, title: "Operating platforms: Kroc and Sonneborn", focus: "A restaurant chain whose economics ran on land and leases.", objectives: ["Explain separation of operating and property income.", "Spot the sale-leaseback logic."], selfDirected: "The Kroc and Sonneborn dossiers are queued.", tasks: [m("kroc-research", "Research the McDonald’s real estate model from public filings", "Separate what filings state from what biographies say.", "/evidence/sources"), notes(4, "Have at least four notes in your library")] },
  { week: 14, month: 4, title: "Syndications and waterfalls", focus: "Who is paid first, and who bears first loss.", objectives: ["Run a two-tier promote.", "Explain a GP catch-up."], tasks: [model("waterfall", "Save an Equity Waterfall model", "/lab/waterfall"), m("waterfall-note", "Write who bears first loss in your waterfall", undefined, "/library")] },
  { week: 15, month: 4, title: "Small-scale rental acquisition: Schwarzenegger", focus: "Early rental buildings as a path to financial independence.", objectives: ["Underwrite a small multifamily purchase.", "Find the break-even occupancy."], selfDirected: "The Arnold Schwarzenegger dossier is queued.", tasks: [m("arnold-research", "Research the early-investment record from reliable sources", undefined, "/library"), model("underwriter", "Save an underwriting model with a break-even note", "/lab/underwriter")] },
  { week: 16, month: 4, title: "Public capital as recapitalisation", focus: "The Equity REIT IPOs turned private portfolios into permanent public equity.", objectives: ["Read a use-of-proceeds statement.", "Explain why the IPO lowered the cost of capital."], tasks: [{ key: "dossier-division-5", label: "Read division 5 of the dossier", href: "/dossiers/sam-zell#division-5", check: { type: "dossier", slug: "sam-zell" } }, m("ipo-note", "Compare the 1993 and 1997 IPOs in a note", "Use the cited claims.", "/library"), { key: "principles-4", label: "Save a fourth principle", href: "/synthesis", check: { type: "principles", min: 4 } }] },
  { week: 17, month: 5, title: "Institutions as nodes", focus: "Capital moves through banks, funds and operating companies.", objectives: ["Trace a relationship to its evidence.", "Name a relationship the corpus cannot support."], tasks: [{ key: "institutions-2", label: "Open two institution pages", href: "/network", check: { type: "activity", kind: "institution.opened", min: 2 } }, m("network-gap", "Write one relationship you wanted to draw but could not evidence", undefined, "/network")] },
  { week: 18, month: 5, title: "Credit cycles: Howard Marks", focus: "Capital preservation through the cycle.", objectives: ["Describe where a market sits in its credit cycle.", "Explain why liquidity is the real option."], selfDirected: "The Howard Marks dossier is queued.", tasks: [m("marks-research", "Read two primary memos or filings on credit cycles and summarise", undefined, "/library"), model("stress", "Save a Portfolio Stress Test model", "/lab/stress")] },
  { week: 19, month: 5, title: "Portfolio stress", focus: "Find what breaks first.", objectives: ["Rank shocks by damage.", "Size a refinancing gap."], tasks: [m("stress-note", "Write what broke first and why", undefined, "/lab/stress"), { key: "ritual-5", label: "Complete five ritual days in total", href: "/ritual", check: { type: "ritual", min: 5 } }] },
  { week: 20, month: 5, title: "The buyer’s side: Jon Gray and Blackstone", focus: "The $39 billion deal from the other side of the table.", objectives: ["List what is unknown about the buyer’s financing.", "Estimate nothing you cannot source."], selfDirected: "The Jon Gray dossier is queued.", tasks: [{ key: "deal-open-questions", label: "Re-read the open questions on the transaction", href: "/deals/equity-office-sale-2007", check: { type: "deal", slug: "equity-office-sale-2007" } }, m("buyer-research", "Find one primary source on the buyer’s financing and record what it states", undefined, "/evidence/sources")] },
  { week: 21, month: 6, title: "Principles audit", focus: "A principle without evidence, a risk and a modern application is a slogan.", objectives: ["Hold six principles with complete references."], tasks: [{ key: "principles-6", label: "Save six principles", href: "/synthesis", check: { type: "principles", min: 6 } }] },
  { week: 22, month: 6, title: "Strategy comparison", focus: "Put your approach beside a documented one and look for the gap.", objectives: ["Identify where your approach differs and why."], tasks: [{ key: "compare-2", label: "Run two strategy comparisons", href: "/synthesis/compare", check: { type: "activity", kind: "synthesis.compared", min: 2 } }, m("compare-note", "Write the three biggest differences you found", undefined, "/library")] },
  { week: 23, month: 6, title: "Draft the doctrine", focus: "Target assets, geography, acquisition and financing criteria, risk tolerance, partners, committee standards, exits.", objectives: ["Complete all eight doctrine sections."], tasks: [{ key: "doctrine-complete", label: "Fill all eight doctrine sections", href: "/doctrine", check: { type: "doctrine" } }] },
  { week: 24, month: 6, title: "Capstone: defend a deal under your own doctrine", focus: "Submit a deal that your doctrine would approve, then export the doctrine.", objectives: ["Pass the committee with a score of 70 or more.", "Export the doctrine as a document."], tasks: [{ key: "committee-70", label: "Earn a committee score of 70 or more", href: "/committee/new", check: { type: "committee", minScore: 70 } }, { key: "doctrine-export", label: "Export your doctrine", href: "/doctrine", check: { type: "activity", kind: "doctrine.exported", min: 1 } }] },
];

/** Whether a task's check is satisfied by stored activity. Manual tasks return null. */
export function evaluateCheck(check: TaskCheck, s: ActivityStats): boolean | null {
  switch (check.type) {
    case "manual": return null;
    case "dossier": return s.dossiersOpened.includes(check.slug);
    case "deal": return s.transactionsOpened.includes(check.slug);
    case "model": return (s.modelKinds[check.kind] ?? 0) >= 1;
    case "simulation": return check.slug in s.simulationBest;
    case "committee": return check.minScore == null ? s.committeeCount >= 1 : (s.committeeBest?.score ?? 0) >= check.minScore;
    case "quiz": return s.quizzesPassed.includes(check.slug);
    case "principles": return s.principles >= check.min;
    case "notes": return s.notes >= check.min;
    case "doctrine": return s.doctrineFieldsFilled >= 8;
    case "ritual": return s.ritualDays >= check.min;
    case "activity": return (s.activity[check.kind] ?? 0) >= check.min;
  }
}

export interface TaskStatus { task: Task; done: boolean; auto: boolean }
export interface WeekStatus { week: Week; tasks: TaskStatus[]; doneCount: number; complete: boolean }

export function weekStatuses(s: ActivityStats, manualDone: Set<string> /* `${week}:${taskKey}` */): WeekStatus[] {
  return CURRICULUM.map((week) => {
    const tasks = week.tasks.map((task) => {
      const auto = evaluateCheck(task.check, s);
      const done = auto === true || (auto === null && manualDone.has(`${week.week}:${task.key}`));
      return { task, done, auto: auto !== null };
    });
    const doneCount = tasks.filter((t) => t.done).length;
    return { week, tasks, doneCount, complete: doneCount === tasks.length };
  });
}

/** The first incomplete week, i.e. where a self-paced learner should work next; null when all 24 are done. */
export function recommendedWeek(statuses: WeekStatus[]): number | null {
  return statuses.find((w) => !w.complete)?.week.week ?? null;
}
