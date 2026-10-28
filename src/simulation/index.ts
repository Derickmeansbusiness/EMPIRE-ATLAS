import type { SimScenario } from "./engine";
import { officePortfolio2007 } from "./scenarios/office-portfolio-2007";
import { meridianCourtNegotiation } from "./scenarios/meridian-court-negotiation";

export const SCENARIOS: SimScenario[] = [officePortfolio2007, meridianCourtNegotiation];
export function getScenario(slug: string): SimScenario | null { return SCENARIOS.find((s) => s.slug === slug) ?? null; }
export * from "./engine";
