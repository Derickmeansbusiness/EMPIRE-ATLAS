import type { VerificationStatus } from "@/db/schema";
/** Plain-text verification labels for exports and server-side text (no JSX). */
export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  verified_primary: "Verified from primary documentation", supported_secondary: "Supported by credible secondary reporting",
  contested: "Contested", unverified: "Unverified", hypothetical: "Hypothetical / simulation only",
};
