/**
 * Drizzle schema for EMPIRE ATLAS.
 * Mirrors src/db/migrations/*.sql — the SQL files are the source of truth for DDL;
 * this file gives the application typed query access. Keep both in sync.
 */
import {
  pgTable, pgEnum, uuid, text, integer, bigint, boolean, timestamp, date, numeric, jsonb, unique, index, doublePrecision,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "platform_owner", "research_administrator", "research_editor", "researcher", "student", "institutional_subscriber",
]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "invited"]);
export const publishStatusEnum = pgEnum("publish_status", ["draft", "in_review", "published", "archived"]);
export const verificationStatusEnum = pgEnum("verification_status", [
  "verified_primary", "supported_secondary", "contested", "unverified", "hypothetical",
]);
export const dataStatusEnum = pgEnum("data_status", ["documented", "interpretation", "estimate", "unknown", "hypothetical"]);
export const sourceTypeEnum = pgEnum("source_type", [
  "sec_filing", "company_filing", "annual_report", "archive", "book", "academic", "news", "interview",
  "press_release", "court_record", "property_record", "exchange_notice", "trade_press", "other",
]);
export const partyKindEnum = pgEnum("party_kind", ["investor", "institution"]);
export const networkNodeKindEnum = pgEnum("network_node_kind", [
  "individual", "company", "bank", "private_lender", "investment_fund", "government_agency",
  "real_estate_asset", "transaction", "partnership", "ownership_entity", "operating_company",
]);
export const relationshipKindEnum = pgEnum("relationship_kind", [
  "invested_in", "lent_to", "borrowed_from", "acquired", "sold", "owned", "co_founded",
  "partnered_with", "developed", "managed", "leased", "guaranteed", "advised",
]);
export const linkedObjectKindEnum = pgEnum("linked_object_kind", [
  "investor", "institution", "transaction", "claim", "source", "financial_model", "historical_event", "case_study",
]);
export const datePrecisionEnum = pgEnum("date_precision", ["day", "month", "year", "circa", "decade"]);

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type VerificationStatus = (typeof verificationStatusEnum.enumValues)[number];
export type DataStatus = (typeof dataStatusEnum.enumValues)[number];
export type PublishStatus = (typeof publishStatusEnum.enumValues)[number];
export type LinkedObjectKind = (typeof linkedObjectKindEnum.enumValues)[number];

const now = () => sql`now()`;

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailNormalized: text("email_normalized").notNull().unique(),
  passwordHash: text("password_hash"),
  displayName: text("display_name").notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  status: userStatusEnum("status").notNull().default("active"),
  researcherNumber: integer("researcher_number").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
  lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  headline: text("headline"),
  bio: text("bio"),
  focusMarkets: text("focus_markets").array().notNull().default(sql`'{}'`),
  competencyLevel: text("competency_level").notNull().default("research_apprentice"),
  preferences: jsonb("preferences").notNull().default(sql`'{}'::jsonb`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  kind: text("kind").notNull().default("institution"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  tier: text("tier").notNull().default("explorer"),
  roleInOrg: text("role_in_org").notNull().default("member"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().default(now()),
  endsAt: timestamp("ends_at", { withTimezone: true }),
}, (t) => [unique().on(t.userId, t.organizationId)]);

export const auditEvents = pgTable("audit_events", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  objectKind: text("object_kind"),
  objectId: text("object_id"),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
});

export const investors = pgTable("investors", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  fullName: text("full_name").notNull(),
  shortName: text("short_name").notNull(),
  bornYear: integer("born_year"),
  diedYear: integer("died_year"),
  nationality: text("nationality"),
  headline: text("headline"),
  summary: text("summary"),
  eraLabel: text("era_label"),
  primaryAssetClasses: text("primary_asset_classes").array().notNull().default(sql`'{}'`),
  publishStatus: publishStatusEnum("publish_status").notNull().default("draft"),
  researchStatus: text("research_status").notNull().default("queued"),
  roadmapRank: integer("roadmap_rank"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  geoLabel: text("geo_label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

export const institutions = pgTable("institutions", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  kind: networkNodeKindEnum("kind").notNull().default("company"),
  foundedYear: integer("founded_year"),
  headquarters: text("headquarters"),
  summary: text("summary"),
  publishStatus: publishStatusEnum("publish_status").notNull().default("draft"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  geoLabel: text("geo_label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
});

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  assetClass: text("asset_class").notNull(),
  market: text("market"),
  location: text("location"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  leadInvestorId: uuid("lead_investor_id").references(() => investors.id, { onDelete: "set null" }),
  announcedOn: date("announced_on"),
  closedOn: date("closed_on"),
  datePrecision: datePrecisionEnum("date_precision").notNull().default("day"),
  assetDescription: text("asset_description"),
  market: text("market"),
  location: text("location"),
  assetClass: text("asset_class"),
  headlineValueUsd: numeric("headline_value_usd", { precision: 18, scale: 2 }),
  headlineValueLabel: text("headline_value_label"),
  headlineValueStatus: dataStatusEnum("headline_value_status").notNull().default("unknown"),
  summary: text("summary"),
  rightsAcquired: text("rights_acquired"),
  operatingStrategy: text("operating_strategy"),
  subsequentEvents: text("subsequent_events"),
  exitOrStatus: text("exit_or_status"),
  verifiedOutcome: text("verified_outcome"),
  openQuestions: text("open_questions"),
  publishStatus: publishStatusEnum("publish_status").notNull().default("draft"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  geoLabel: text("geo_label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

export const transactionParticipants = pgTable("transaction_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  partyKind: partyKindEnum("party_kind").notNull(),
  investorId: uuid("investor_id").references(() => investors.id, { onDelete: "cascade" }),
  institutionId: uuid("institution_id").references(() => institutions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  note: text("note"),
});

export const ownershipInterests = pgTable("ownership_interests", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").references(() => assets.id, { onDelete: "cascade" }),
  holderKind: partyKindEnum("holder_kind").notNull(),
  investorId: uuid("investor_id").references(() => investors.id, { onDelete: "cascade" }),
  institutionId: uuid("institution_id").references(() => institutions.id, { onDelete: "cascade" }),
  interestDescription: text("interest_description").notNull(),
  percentage: numeric("percentage", { precision: 6, scale: 3 }),
  dataStatus: dataStatusEnum("data_status").notNull().default("unknown"),
  note: text("note"),
});

export const capitalStackItems = pgTable("capital_stack_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  side: text("side").notNull(),
  layer: text("layer").notNull(),
  label: text("label").notNull(),
  amountUsd: numeric("amount_usd", { precision: 18, scale: 2 }),
  amountLabel: text("amount_label"),
  providerInstitutionId: uuid("provider_institution_id").references(() => institutions.id, { onDelete: "set null" }),
  dataStatus: dataStatusEnum("data_status").notNull().default("unknown"),
  note: text("note"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  sourceType: sourceTypeEnum("source_type").notNull(),
  publisher: text("publisher"),
  author: text("author"),
  url: text("url"),
  documentReference: text("document_reference"),
  publishedOn: date("published_on"),
  accessedOn: date("accessed_on"),
  licensingNote: text("licensing_note"),
  reliabilityNote: text("reliability_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
});

export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  claimText: text("claim_text").notNull(),
  category: text("category").notNull(),
  investorId: uuid("investor_id").references(() => investors.id, { onDelete: "set null" }),
  institutionId: uuid("institution_id").references(() => institutions.id, { onDelete: "set null" }),
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  eventDate: date("event_date"),
  eventDatePrecision: datePrecisionEnum("event_date_precision"),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default("unverified"),
  researcherNotes: text("researcher_notes"),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  lastReviewedBy: uuid("last_reviewed_by").references(() => users.id, { onDelete: "set null" }),
  publishStatus: publishStatusEnum("publish_status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

export const claimSources = pgTable("claim_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id").notNull().references(() => claims.id, { onDelete: "cascade" }),
  sourceId: uuid("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
  excerpt: text("excerpt"),
  locator: text("locator"),
  supports: boolean("supports").notNull().default(true),
}, (t) => [unique().on(t.claimId, t.sourceId)]);

export const verificationReviews = pgTable("verification_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id").notNull().references(() => claims.id, { onDelete: "cascade" }),
  reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "set null" }),
  fromStatus: verificationStatusEnum("from_status"),
  toStatus: verificationStatusEnum("to_status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
});

export const dossierSections = pgTable("dossier_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  investorId: uuid("investor_id").notNull().references(() => investors.id, { onDelete: "cascade" }),
  division: integer("division").notNull(),
  title: text("title").notNull(),
  bodyMarkdown: text("body_markdown").notNull(),
  evidenceConfidence: verificationStatusEnum("evidence_confidence").notNull().default("unverified"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
}, (t) => [unique().on(t.investorId, t.division)]);

export const historicalEvents = pgTable("historical_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  investorId: uuid("investor_id").references(() => investors.id, { onDelete: "cascade" }),
  institutionId: uuid("institution_id").references(() => institutions.id, { onDelete: "cascade" }),
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  claimId: uuid("claim_id").references(() => claims.id, { onDelete: "set null" }),
  occurredOn: date("occurred_on").notNull(),
  datePrecision: datePrecisionEnum("date_precision").notNull().default("day"),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("milestone"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const quotations = pgTable("quotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  investorId: uuid("investor_id").references(() => investors.id, { onDelete: "cascade" }),
  quoteText: text("quote_text").notNull(),
  context: text("context"),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
  locator: text("locator"),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default("unverified"),
});

export const relationships = pgTable("relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromKind: networkNodeKindEnum("from_kind").notNull(),
  fromInvestorId: uuid("from_investor_id").references(() => investors.id, { onDelete: "cascade" }),
  fromInstitutionId: uuid("from_institution_id").references(() => institutions.id, { onDelete: "cascade" }),
  toKind: networkNodeKindEnum("to_kind").notNull(),
  toInvestorId: uuid("to_investor_id").references(() => investors.id, { onDelete: "cascade" }),
  toInstitutionId: uuid("to_institution_id").references(() => institutions.id, { onDelete: "cascade" }),
  toTransactionId: uuid("to_transaction_id").references(() => transactions.id, { onDelete: "cascade" }),
  toAssetId: uuid("to_asset_id").references(() => assets.id, { onDelete: "cascade" }),
  relationship: relationshipKindEnum("relationship").notNull(),
  startYear: integer("start_year"),
  endYear: integer("end_year"),
  description: text("description"),
  claimId: uuid("claim_id").references(() => claims.id, { onDelete: "set null" }),
  isHypothetical: boolean("is_hypothetical").notNull().default(false),
});

export const researchCollections = pgTable("research_collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
});

export const researchNotes = pgTable("research_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  collectionId: uuid("collection_id").references(() => researchCollections.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  tags: text("tags").array().notNull().default(sql`'{}'`),
  linkedKind: linkedObjectKindEnum("linked_kind"),
  linkedId: uuid("linked_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
}, (t) => [index("research_notes_user_idx2").on(t.userId, t.updatedAt)]);

export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetKind: linkedObjectKindEnum("target_kind").notNull(),
  targetId: uuid("target_id").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
}, (t) => [unique().on(t.userId, t.targetKind, t.targetId)]);

export const financialModels = pgTable("financial_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  modelKind: text("model_kind").notNull(),
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  isHypothetical: boolean("is_hypothetical").notNull().default(true),
  assumptions: jsonb("assumptions").notNull().default(sql`'{}'::jsonb`),
  outputs: jsonb("outputs").notNull().default(sql`'{}'::jsonb`),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

export const researchProgress = pgTable("research_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  activityKind: text("activity_kind").notNull(),
  objectKind: linkedObjectKindEnum("object_kind"),
  objectId: uuid("object_id"),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
});

export const investmentPrinciples = pgTable("investment_principles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  statement: text("statement").notNull(),
  sourceInvestorId: uuid("source_investor_id").references(() => investors.id, { onDelete: "set null" }),
  supportingTransactionId: uuid("supporting_transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  supportingClaimId: uuid("supporting_claim_id").references(() => claims.id, { onDelete: "set null" }),
  relevantRisk: text("relevant_risk"),
  modernApplication: text("modern_application"),
  personalNotes: text("personal_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

export const investmentDoctrines = pgTable("investment_doctrines", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  targetAssets: text("target_assets"),
  geographicStrategy: text("geographic_strategy"),
  acquisitionCriteria: text("acquisition_criteria"),
  financingCriteria: text("financing_criteria"),
  riskTolerance: text("risk_tolerance"),
  capitalPartnerStrategy: text("capital_partner_strategy"),
  committeeStandards: text("committee_standards"),
  exitStrategies: text("exit_strategies"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

export const modelVersions = pgTable("model_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  modelId: uuid("model_id").notNull().references(() => financialModels.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  assumptions: jsonb("assumptions").notNull(),
  outputs: jsonb("outputs").notNull().default(sql`'{}'::jsonb`),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
}, (t) => [unique().on(t.modelId, t.version)]);

export const caseKindEnum = pgEnum("case_kind", ["historical", "fictional"]);

export const caseStudies = pgTable("case_studies", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  kind: caseKindEnum("kind").notNull(),
  investorId: uuid("investor_id").references(() => investors.id, { onDelete: "set null" }),
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  subtitle: text("subtitle"),
  summary: text("summary").notNull(),
  bodyMarkdown: text("body_markdown").notNull(),
  disclaimer: text("disclaimer"),
  modelPresets: jsonb("model_presets").notNull().default(sql`'{}'::jsonb`),
  publishStatus: publishStatusEnum("publish_status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
});

export type User = typeof users.$inferSelect;
export type Investor = typeof investors.$inferSelect;
export type Institution = typeof institutions.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Claim = typeof claims.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type ResearchNote = typeof researchNotes.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;
export type HistoricalEvent = typeof historicalEvents.$inferSelect;
export type CapitalStackItem = typeof capitalStackItems.$inferSelect;
export type DossierSection = typeof dossierSections.$inferSelect;
export type FinancialModel = typeof financialModels.$inferSelect;
export type CaseStudy = typeof caseStudies.$inferSelect;
