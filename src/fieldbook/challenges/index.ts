import { lindenCourt } from "./linden-court";
import type { ChallengeCase } from "./types";

/** Phase B grows this registry to twenty cases; the engine, grader and pages are case-agnostic. */
export const CHALLENGES: ChallengeCase[] = [lindenCourt];
export const getChallenge = (slug: string): ChallengeCase | null => CHALLENGES.find((c) => c.slug === slug) ?? null;
export const challengeForProperty = (propertySlug: string): ChallengeCase | null => CHALLENGES.find((c) => c.propertySlug === propertySlug) ?? null;
