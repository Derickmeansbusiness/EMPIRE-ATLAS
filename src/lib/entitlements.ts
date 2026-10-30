/**
 * Entitlements: which membership tier unlocks which feature. Enforcement is OFF by default
 * (ATLAS_ENFORCE_ENTITLEMENTS=true to turn it on) because pricing and payments are not set; during the founding
 * period every account has full access. The mapping is nonetheless real and tested so billing can be added
 * without touching feature code.
 */
export type Tier = "explorer" | "researcher" | "professional" | "institutional";
export type Feature = "dossiers" | "library" | "synthesis" | "quizzes" | "program" | "ritual" | "lab" | "simulator" | "committee" | "historian" | "network" | "exports" | "cohorts";

export const TIERS: Array<{ key: Tier; label: string; blurb: string }> = [
  { key: "explorer", label: "Explorer", blurb: "Public historical profiles and selected case previews." },
  { key: "researcher", label: "Researcher", blurb: "Full research dossiers, notebooks, synthesis, quizzes and the study program." },
  { key: "professional", label: "Professional", blurb: "Deal reconstruction, financial laboratories, simulations, committee and the historian." },
  { key: "institutional", label: "Institutional", blurb: "Team accounts, cohort administration and advanced exports." },
];

const RESEARCHER: Feature[] = ["dossiers", "library", "synthesis", "quizzes", "program", "ritual", "network"];
const PROFESSIONAL: Feature[] = [...RESEARCHER, "lab", "simulator", "committee", "historian", "exports"];
const INSTITUTIONAL: Feature[] = [...PROFESSIONAL, "cohorts"];

const FEATURES: Record<Tier, Feature[]> = { explorer: [], researcher: RESEARCHER, professional: PROFESSIONAL, institutional: INSTITUTIONAL };

export function enforcementEnabled(): boolean { return process.env.ATLAS_ENFORCE_ENTITLEMENTS === "true"; }

export function isTier(v: string): v is Tier { return v === "explorer" || v === "researcher" || v === "professional" || v === "institutional"; }

export function tierHasFeature(tier: Tier, feature: Feature): boolean { return FEATURES[tier].includes(feature); }

/** Owners and administrators are never gated. */
export function hasFeature(opts: { tier: string; role: string; feature: Feature; enforce?: boolean }): boolean {
  const enforce = opts.enforce ?? enforcementEnabled();
  if (!enforce) return true;
  if (opts.role === "platform_owner" || opts.role === "research_administrator") return true;
  return isTier(opts.tier) && tierHasFeature(opts.tier, opts.feature);
}

export function minimumTierFor(feature: Feature): Tier {
  return (["explorer", "researcher", "professional", "institutional"] as Tier[]).find((t) => tierHasFeature(t, feature)) ?? "institutional";
}
