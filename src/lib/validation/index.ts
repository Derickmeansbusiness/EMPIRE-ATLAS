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
