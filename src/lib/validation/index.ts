import { z } from "zod";

export const emailSchema = z.string().trim().min(3).max(254).email();
export const passwordSchema = z.string().min(10, "Use at least 10 characters.").max(256);

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(256),
  next: z.string().max(512).optional(),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(2).max(80),
});

export const linkedKindSchema = z.enum(["investor", "institution", "transaction", "claim", "source", "financial_model", "historical_event", "case_study"]);

export const noteSchema = z.object({
  title: z.string().trim().min(1, "Give the note a title.").max(160),
  body: z.string().max(20_000).default(""),
  tags: z.string().max(400).optional().transform((s) => (s ? s.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12) : [])),
  linkedKind: linkedKindSchema.optional().nullable(),
  linkedId: z.string().uuid().optional().nullable(),
  returnTo: z.string().max(512).optional(),
});

export const bookmarkSchema = z.object({
  targetKind: linkedKindSchema,
  targetId: z.string().uuid(),
  returnTo: z.string().max(512).optional(),
});

export const reviewClaimSchema = z.object({
  claimId: z.string().uuid(),
  toStatus: z.enum(["verified_primary", "supported_secondary", "contested", "unverified", "hypothetical"]),
  note: z.string().max(2000).optional(),
});

export const setRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["platform_owner", "research_administrator", "research_editor", "researcher", "student", "institutional_subscriber"]),
});

/** Only allow same-origin relative paths for post-action redirects. */
export function safeReturnTo(value: string | undefined | null, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export const modelKindSchema = z.enum(["underwriter", "debt", "capital_stack", "credit", "distressed", "waterfall", "stress"]);

export const saveModelSchema = z.object({
  name: z.string().trim().min(1, "Name the model.").max(120),
  kind: modelKindSchema,
  assumptions: z.string().max(40_000).transform((s, ctx) => {
    try { const v = JSON.parse(s) as unknown; if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("not an object"); return v as Record<string, unknown>; }
    catch { ctx.addIssue({ code: "custom", message: "Assumptions must be a JSON object." }); return z.NEVER; }
  }),
  transactionId: z.string().uuid().optional().nullable(),
  modelId: z.string().uuid().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  returnTo: z.string().max(512).optional(),
});

export const simulationChoiceSchema = z.object({ attemptId: z.string().uuid(), stageKey: z.string().min(1).max(64), optionKey: z.string().min(1).max(64) });

export const committeeSubmissionSchema = z.object({
  title: z.string().trim().min(3).max(160),
  thesis: z.string().trim().min(40, "Write the investment thesis (at least 40 characters).").max(20_000),
  assetDetails: z.string().trim().max(10_000).default(""),
  sourcesAndUses: z.string().trim().max(10_000).default(""),
  assumptionsNarrative: z.string().trim().max(10_000).default(""),
  capitalStack: z.string().trim().max(10_000).default(""),
  risks: z.string().trim().min(20, "List the major risks.").max(10_000),
  sensitivity: z.string().trim().max(10_000).default(""),
  exitStrategy: z.string().trim().min(10, "State the exit strategy.").max(10_000),
  recommendation: z.enum(["approve", "approve_with_conditions", "decline"]),
  modelId: z.string().uuid().optional().nullable(),
});

// ── Phase 5 ──
const optionalUuid = z.string().uuid().optional().nullable().or(z.literal("").transform(() => null));
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable().transform((v) => (v && v.length ? v : null));

export const principleSchema = z.object({
  id: optionalUuid, title: z.string().trim().min(3, "Name the principle.").max(160), statement: z.string().trim().min(10, "State the principle in a sentence or two.").max(4000),
  sourceInvestorId: optionalUuid, supportingTransactionId: optionalUuid, supportingClaimId: optionalUuid,
  relevantRisk: optionalText(2000), modernApplication: optionalText(2000), personalNotes: optionalText(4000),
});

export const doctrineSchema = z.object(Object.fromEntries(["targetAssets", "geographicStrategy", "acquisitionCriteria", "financingCriteria", "riskTolerance", "capitalPartnerStrategy", "committeeStandards", "exitStrategies"].map((k) => [k, z.string().trim().max(8000).default("")])) as Record<"targetAssets" | "geographicStrategy" | "acquisitionCriteria" | "financingCriteria" | "riskTolerance" | "capitalPartnerStrategy" | "committeeStandards" | "exitStrategies", z.ZodDefault<z.ZodString>>);

export const ritualSchema = z.object({ day: z.coerce.number().int().min(1).max(5), journal: z.string().trim().max(4000).default("") });
export const taskSchema = z.object({ week: z.coerce.number().int().min(1).max(24), taskKey: z.string().min(1).max(64), done: z.enum(["1", "0"]), note: optionalText(1000) });
export const collectionSchema = z.object({ name: z.string().trim().min(1, "Name the collection.").max(80), kind: z.enum(["folder", "reading_list"]) });
export const assignNoteSchema = z.object({ noteId: z.string().uuid(), collectionId: optionalUuid });
export const readingListItemSchema = z.object({ collectionId: z.string().uuid(), targetKind: linkedKindSchema, targetId: z.string().uuid(), returnTo: z.string().max(512).optional() });
export const historianSchema = z.object({ question: z.string().trim().min(5, "Ask a fuller question.").max(2000), role: z.enum(["historian", "acquisition_analyst", "credit_underwriter", "capital_structure", "committee_examiner", "research_mentor"]), mode: z.enum(["ask", "search"]).default("search") });
export const tierSchema = z.object({ userId: z.string().uuid(), tier: z.enum(["explorer", "researcher", "professional", "institutional"]) });
export const orgSchema = z.object({ name: z.string().trim().min(2, "Name the organization.").max(120) });
export const orgMemberSchema = z.object({ organizationId: z.string().uuid(), email: emailSchema, roleInOrg: z.enum(["member", "instructor"]).default("member") });

// ── The Investor's Fieldbook ──
const optText = (max: number) => z.string().trim().max(max).optional().transform((s) => (s ? s : null));
const moneyField = z.string().trim().optional().transform((s, ctx) => {
  if (!s) return null; const n = Number(s.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000) { ctx.addIssue({ code: "custom", message: "Enter a dollar amount of zero or more." }); return z.NEVER; }
  return n;
});

export const passageSchema = z.object({
  sourceTitle: z.string().trim().min(2, "Give the source a title.").max(240), author: z.string().trim().min(2, "Name the author.").max(160),
  sourceKind: z.enum(["book", "interview", "letter", "lecture", "article", "filing", "other"]),
  publishedLabel: optText(60), edition: optText(120), location: optText(120),
  sourceUrl: z.string().trim().max(500).optional().transform((s) => (s ? s : null)).refine((s) => s == null || /^https?:\/\//i.test(s), "Links must start with http:// or https://"),
  excerpt: z.string().trim().max(1500, "Keep the excerpt to 1,500 characters. Quote only what you need.").optional().transform((s) => (s ? s : null)),
  userNotes: optText(8000), isFirstPerson: z.string().optional().transform((s) => s === "1"),
});

export const findingSchema = z.object({
  id: z.string().uuid().optional(), sessionId: z.string().uuid(), itemKey: optText(80),
  locationLabel: z.string().trim().min(2, "Say where you saw it (building, room or area).").max(160),
  component: z.string().trim().min(1).max(40),
  description: z.string().trim().min(5, "Describe what you observed.").max(3000),
  condition: z.enum(["good", "fair", "poor", "unknown"]),
  severity: z.enum(["information_only", "minor_maintenance", "material_repair", "major_capital_replacement", "potential_safety_issue", "specialist_investigation_required"]),
  confidence: z.enum(["low", "medium", "high"]),
  financialImpact: optText(1000), specialistNeeded: optText(200),
  followUpStatus: z.enum(["open", "in_progress", "resolved", "wont_fix"]).optional(),
  costLow: moneyField, costHigh: moneyField, costSource: optText(300), resolution: optText(2000),
}).superRefine((v, ctx) => {
  if ((v.costLow == null) !== (v.costHigh == null)) ctx.addIssue({ code: "custom", path: ["costHigh"], message: "Give both a low and a high cost, or neither." });
  if (v.costLow != null && v.costHigh != null && v.costHigh < v.costLow) ctx.addIssue({ code: "custom", path: ["costHigh"], message: "The high estimate must be at least the low estimate." });
  if (v.costLow != null && !v.costSource) ctx.addIssue({ code: "custom", path: ["costSource"], message: "Say where the cost estimate comes from (own estimate, contractor quote, published guide)." });
});

export const reportSchema = z.object({
  propertySlug: z.string().min(1).max(120), sessionId: z.string().uuid(),
  decision: z.enum(["acquire", "negotiate", "investigate", "reject"]),
  rationale: z.string().trim().min(20, "Give your reasons in at least a sentence or two.").max(4000),
});
