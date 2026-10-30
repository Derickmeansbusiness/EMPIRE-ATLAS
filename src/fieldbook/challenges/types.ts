import type { StatementLine, DebtTerms } from "../statement";

export interface RentRollRow { unitType: string; count: number; vacant: number; inPlaceRent: number; marketRent: number }
export interface MaintenanceRecord { period: string; description: string; amount: number; bookedAs: string }
export interface AnomalyDef { id: string; label: string; expected: boolean; explanation: string }
export interface TopicDef { id: string; label: string; pattern: string; sample: string }
export interface AdjustmentRule { lineKey: string; label: string; min: number | null; max: number | null; basisPattern: string; expectation: string }

export interface ChallengeCase {
  slug: string; title: string; subtitle: string; difficulty: "foundation" | "intermediate" | "advanced";
  propertySlug: string; skillKey: string;
  property: { name: string; assetClass: "multifamily"; units: number; yearBuilt: number; locationLabel: string; summary: string };
  askingPrice: number;
  lines: StatementLine[];
  rentRoll: RentRollRow[];
  delinquency: { asOf: string; over30: number; over60: number };
  records: MaintenanceRecord[];
  taxInfo: { assessedValue: number; effectiveRate: number; note: string };
  insuranceNote: string;
  sellerNotes: string[];
  debt: DebtTerms;
  marketCapRate: number;
  conventions: { managementFeeRate: number; repairsPerUnit: number; reservesPerUnit: number };
  anomalies: AnomalyDef[];
  topics: TopicDef[];
  adjustmentRules: AdjustmentRule[];
}
