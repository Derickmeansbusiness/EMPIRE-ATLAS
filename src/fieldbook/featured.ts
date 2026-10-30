/**
 * Featured Fieldbook record: a sourced analysis of one passage of a published book.
 * The platform holds NO copy of the passage text. The description below summarises what the passage was reported to
 * cover, supplied by the founding researcher, and every personal claim is marked first-person and uncorroborated.
 * Users add their own short excerpt privately; it is never shown to other users.
 */
import type { EvidenceClass } from "@/db/schema";

export const EVIDENCE_CLASS_LABELS: Record<EvidenceClass, string> = {
  direct_source_claim: "Direct source claim",
  verified_supporting_fact: "Verified supporting fact",
  analytical_interpretation: "Analytical interpretation",
  unsupported_conclusion: "Unsupported conclusion: do not cite",
  hypothetical_application: "Hypothetical modern application",
};
export const EVIDENCE_CLASS_HELP: Record<EvidenceClass, string> = {
  direct_source_claim: "What the source itself says. For a personal account, this is the author’s claim, not an established fact.",
  verified_supporting_fact: "A fact independently corroborated by a documented source.",
  analytical_interpretation: "Reasoning by an analyst about what the claim might mean. It can be wrong.",
  unsupported_conclusion: "Something people often infer that the source does not support.",
  hypothetical_application: "How the underlying skill could be practised today. A training suggestion, not history.",
};

export const DIMENSIONS = [
  { n: 1, title: "Literal statement", question: "What is being said?" },
  { n: 2, title: "Historical context", question: "When, where and under what conditions?" },
  { n: 3, title: "Observable behaviour", question: "What specifically did the investor do?" },
  { n: 4, title: "Skill acquisition", question: "What competence was being developed?" },
  { n: 5, title: "Information advantage", question: "What did the investor learn?" },
  { n: 6, title: "Capital advantage", question: "What financial capacity or financing access was being built?" },
  { n: 7, title: "Network advantage", question: "Which relationships were being cultivated?" },
  { n: 8, title: "Decision framework", question: "What criteria guided their choices?" },
  { n: 9, title: "Replicability", question: "Which principles apply in modern U.S. markets?" },
  { n: 10, title: "Practical assignment", question: "What should the student do to build the same competence?" },
] as const;

export const FEATURED_PASSAGE = {
  slug: "cardone-how-to-create-wealth-p39",
  sourceTitle: "How to Create Wealth Investing in Real Estate",
  author: "Grant Cardone",
  sourceKind: "book" as const,
  location: "p. 39",
  isFirstPerson: true,
  coverage: [
    "Analysing as many as 20 operating statements per day.",
    "Interviewing institutional lenders.",
    "Walking apartment properties.",
    "Questioning brokers.",
    "Saving capital through employment.",
    "Waiting several years for a suitable apartment acquisition.",
    "The author’s account of a first substantial 48-unit apartment acquisition.",
  ],
  note: "Publication date and edition are not recorded in this entry and are left unknown. Add them from your own copy.",
};

export interface FeaturedStatement { dimension: number; body: string; evidenceClass: EvidenceClass }
const S = (dimension: number, evidenceClass: EvidenceClass, body: string): FeaturedStatement => ({ dimension, evidenceClass, body });

export const FEATURED_STATEMENTS: FeaturedStatement[] = [
  S(1, "direct_source_claim", "As described by the researcher who supplied the passage, the author says he analysed as many as 20 operating statements a day, interviewed institutional lenders, walked apartment properties and questioned brokers."),
  S(1, "direct_source_claim", "He is described as saving capital through employment and waiting several years before a suitable apartment acquisition."),
  S(1, "direct_source_claim", "He is described as giving an account of a first substantial acquisition of 48 apartment units."),
  S(2, "analytical_interpretation", "Not established. This entry does not record the years, the market, or the interest-rate and lending conditions in which these activities took place. Do not assume the era from the book’s publication date; read the surrounding pages."),
  S(3, "direct_source_claim", "Reviewed up to 20 operating statements per day. First-person account; not independently corroborated."),
  S(3, "direct_source_claim", "Interviewed institutional lenders. First-person account; not independently corroborated."),
  S(3, "direct_source_claim", "Walked apartment properties. First-person account; not independently corroborated."),
  S(3, "direct_source_claim", "Questioned brokers. First-person account; not independently corroborated."),
  S(3, "direct_source_claim", "Saved capital from employment income, then waited several years for a suitable acquisition. First-person account; not independently corroborated."),
  S(4, "analytical_interpretation", "High-volume statement review can build pattern recognition: what a normal expense ratio looks like, which lines tend to be missing or understated, and how revenue and expense categories are labelled differently between sellers."),
  S(4, "analytical_interpretation", "Lender interviews can build financing literacy: how lenders size loans, which ratios they test, and what documents they ask for."),
  S(4, "analytical_interpretation", "Walking properties can build the habit of connecting what is visible to what is on the statement."),
  S(4, "analytical_interpretation", "Questioning brokers can build skill in extracting seller motivation and process information, and in noticing what is not answered."),
  S(5, "analytical_interpretation", "Repetition across many properties would produce a mental benchmark library. The passage as described gives no figures, so any benchmark attributed to the author would be unsupported."),
  S(6, "direct_source_claim", "Capital was accumulated from employment income over several years (first-person account; the amounts are not given in this record)."),
  S(6, "analytical_interpretation", "Lender conversations may have built a view of what financing was available before it was needed. Whether any lender relationship led to this acquisition is not stated here."),
  S(7, "analytical_interpretation", "Brokers and lenders are the two relationships this activity set exposes the student to. How they were cultivated is not described in this record."),
  S(8, "unsupported_conclusion", "The passage as described does not state acceptance criteria. Attributing specific return thresholds, loan-to-value limits or property standards to the author from this passage would be unsupported."),
  S(8, "analytical_interpretation", "Waiting several years suggests there was some standard for a “suitable” acquisition. What that standard was is not recorded here."),
  S(9, "hypothetical_application", "The underlying competences are not tied to any one market or decade: reading operating statements, understanding lender requirements, inspecting properties and questioning intermediaries can all be practised in current U.S. multifamily markets."),
  S(9, "hypothetical_application", "Volume is not the goal. Twenty careless reviews teach less than five careful ones; the exercises below score accuracy and evidence, not quantity."),
  S(10, "hypothetical_application", "Work the Linden Court challenge: normalise a fictional seller’s operating statement, then check it against a structured property walk."),
];

export interface FeaturedExercise { slug: string; historicalBehavior: string; skillKey: string; skillLabel: string; modernExercise: string; launchHref: string | null; position: number }
export const FEATURED_EXERCISES: FeaturedExercise[] = [
  { slug: "analyze-operating-statements", historicalBehavior: "Study as many as 20 operating statements per day.", skillKey: "operating-statement-analysis", skillLabel: "Operating-statement analysis",
    modernExercise: "Analyse realistic multifamily income-and-expense statements: identify anomalies, compare NOI margins, separate capital expenditure from recurring expense, assess operating risk, and rank the properties. Start with one case and score yourself on accuracy, not speed.", launchHref: "/fieldbook/challenges/linden-court-t12", position: 1 },
  { slug: "interview-lenders", historicalBehavior: "Interview institutional lenders.", skillKey: "lender-intelligence", skillLabel: "Lender intelligence",
    modernExercise: "Compare financing terms and the tests a lender applies (DSCR, debt yield, LTV, amortisation, reserves). A full simulated lender interview is planned; today, practise the term comparison in the Debt Structuring Lab.", launchHref: "/lab/debt", position: 2 },
  { slug: "walk-properties", historicalBehavior: "Walk apartment properties.", skillKey: "site-investigation", skillLabel: "Structured site investigation",
    modernExercise: "Complete a structured field investigation of a fictional property, record findings with severity, confidence and cost source, and connect each finding to the acquisition economics.", launchHref: "/fieldbook/properties/linden-court-apartments", position: 3 },
  { slug: "question-brokers", historicalBehavior: "Question brokers.", skillKey: "broker-discovery", skillLabel: "Broker discovery",
    modernExercise: "Prepare questions on seller motivation, financial performance, operations and transaction execution. The interactive worksheet and simulated broker conversation are planned; the Linden Court challenge already asks you to write diligence questions.", launchHref: null, position: 4 },
  { slug: "save-capital", historicalBehavior: "Save capital through employment before acquiring.", skillKey: "capital-readiness", skillLabel: "Capital readiness",
    modernExercise: "State in your doctrine how much capital you could commit, what reserves you would hold, and what leverage you would refuse to use.", launchHref: "/doctrine", position: 5 },
  { slug: "wait-for-the-right-deal", historicalBehavior: "Wait several years for a suitable acquisition.", skillKey: "decision-discipline", skillLabel: "Decision discipline",
    modernExercise: "Write explicit acquisition criteria, then test them by submitting a deal to the Investment Committee and recording a reject decision when it fails.", launchHref: "/committee", position: 6 },
];

export const LINDEN_PROPERTY_SLUG = "linden-court-apartments";

/** Interactive skill explainer: for each activity in the passage, what it might build, and what the passage does not tell us. */
export const ACTIVITY_SKILLS: Array<{ exercise: string; claim: string; builds: string[]; doesNotSay: string }> = [
  { exercise: "analyze-operating-statements", claim: "Analysed as many as 20 operating statements per day.",
    builds: ["Recognising a normal expense ratio and which lines are usually missing or light.", "Separating recurring expense from one-time capital items.", "Spotting statements that do not reconcile to the rent roll."],
    doesNotSay: "How he checked a statement, which anomalies he looked for, or how accurate his conclusions were. Volume alone does not show skill; accuracy does." },
  { exercise: "interview-lenders", claim: "Interviewed institutional lenders.",
    builds: ["Knowing which tests a lender applies (DSCR, debt yield, loan-to-value) and where the real constraint sits.", "Understanding reserves, recourse, prepayment and what a lender requires before closing."],
    doesNotSay: "Which lenders, what terms they offered, or whether any lender financed his later purchase." },
  { exercise: "walk-properties", claim: "Walked apartment properties.",
    builds: ["Linking visible condition (roofs, paving, drainage, units) to repair cost and operating risk.", "Noticing whether what the seller says matches what is there."],
    doesNotSay: "What he looked for, how he recorded it, or how many properties it was. Do not enter any area you are not authorised to enter." },
  { exercise: "question-brokers", claim: "Questioned brokers.",
    builds: ["Drawing out seller motivation, marketing history and pricing flexibility.", "Noticing which questions go unanswered, which is information too."],
    doesNotSay: "His questions or any broker’s answers. Broker statements are claims to verify, not evidence." },
  { exercise: "save-capital", claim: "Saved capital through employment.",
    builds: ["Capital readiness: knowing how much you can commit and still hold reserves.", "Not needing to accept a bad deal because of a funding deadline."],
    doesNotSay: "How much he saved or how long it took. Do not attach a figure to this claim." },
  { exercise: "wait-for-the-right-deal", claim: "Waited several years for a suitable apartment acquisition.",
    builds: ["Decision discipline: rejecting deals that fail written criteria.", "Treating a “no” as a result, not a failure."],
    doesNotSay: "His criteria. See dimension 8: attributing specific thresholds to him would be unsupported." },
];
