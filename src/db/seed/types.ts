import type { DataStatus, VerificationStatus } from "@/db/schema";

export type SourceTypeValue =
  | "sec_filing" | "company_filing" | "annual_report" | "archive" | "book" | "academic" | "news" | "interview"
  | "press_release" | "court_record" | "property_record" | "exchange_notice" | "trade_press" | "other";

export interface SeedSource {
  slug: string;
  title: string;
  sourceType: SourceTypeValue;
  publisher?: string;
  author?: string;
  url?: string;
  documentReference?: string;
  publishedOn?: string; // ISO date
  accessedOn?: string;
  licensingNote?: string;
  reliabilityNote?: string;
}

export interface SeedClaim {
  slug: string;
  text: string;
  category: string;
  eventDate?: string;
  eventDatePrecision?: "day" | "month" | "year" | "circa" | "decade";
  status: VerificationStatus;
  notes?: string;
  transaction?: string; // transaction slug
  institution?: string; // institution slug
  sources: Array<{ source: string; excerpt?: string; locator?: string; supports?: boolean }>;
}

export interface SeedSection {
  division: number;
  title: string;
  confidence: VerificationStatus;
  body: string; // markdown-lite with [[claim:slug]] citations
}

export interface SeedEvent {
  date: string;
  precision?: "day" | "month" | "year" | "circa" | "decade";
  title: string;
  description?: string;
  category?: string;
  claim?: string;
  transaction?: string;
}

export interface SeedInstitution {
  slug: string;
  name: string;
  kind: "individual" | "company" | "bank" | "private_lender" | "investment_fund" | "government_agency" | "real_estate_asset" | "transaction" | "partnership" | "ownership_entity" | "operating_company";
  foundedYear?: number;
  headquarters?: string;
  summary?: string;
  published?: boolean;
}

export interface SeedStackItem {
  side: "source" | "use";
  layer: string;
  label: string;
  amountUsd?: number;
  amountLabel?: string;
  provider?: string; // institution slug
  status: DataStatus;
  note?: string;
}

export interface SeedTransaction {
  slug: string;
  name: string;
  announcedOn?: string;
  closedOn?: string;
  datePrecision?: "day" | "month" | "year" | "circa" | "decade";
  assetDescription: string;
  market: string;
  location: string;
  assetClass: string;
  headlineValueUsd?: number;
  headlineValueLabel: string;
  headlineValueStatus: DataStatus;
  summary: string;
  rightsAcquired: string;
  operatingStrategy: string;
  subsequentEvents: string;
  exitOrStatus: string;
  verifiedOutcome: string;
  openQuestions: string;
  participants: Array<{ kind: "investor" | "institution"; slug: string; role: string; note?: string }>;
  stack: SeedStackItem[];
  events: SeedEvent[];
}

export interface SeedRelationship {
  from: { kind: "investor" | "institution"; slug: string };
  to: { kind: "investor" | "institution" | "transaction"; slug: string };
  relationship: "invested_in" | "lent_to" | "borrowed_from" | "acquired" | "sold" | "owned" | "co_founded" | "partnered_with" | "developed" | "managed" | "leased" | "guaranteed" | "advised";
  startYear?: number;
  endYear?: number;
  description?: string;
  claim: string;
}

export interface SeedQuotation {
  text: string;
  context: string;
  source: string;
  locator?: string;
  status: VerificationStatus;
}

export interface SeedInvestorDossier {
  investor: {
    slug: string; fullName: string; shortName: string; bornYear?: number; diedYear?: number; nationality?: string;
    headline: string; summary: string; eraLabel: string; primaryAssetClasses: string[]; roadmapRank: number;
  };
  sources: SeedSource[];
  institutions: SeedInstitution[];
  claims: SeedClaim[];
  sections: SeedSection[];
  events: SeedEvent[];
  transactions: SeedTransaction[];
  relationships: SeedRelationship[];
  quotations: SeedQuotation[];
}
