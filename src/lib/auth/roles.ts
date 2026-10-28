import type { UserRole } from "@/db/schema";

export const ROLE_LABELS: Record<UserRole, string> = {
  platform_owner: "Platform Owner",
  research_administrator: "Research Administrator",
  research_editor: "Research Editor",
  researcher: "Researcher",
  student: "Student",
  institutional_subscriber: "Institutional Subscriber",
};

const RANK: Record<UserRole, number> = {
  platform_owner: 100,
  research_administrator: 80,
  research_editor: 60,
  researcher: 40,
  institutional_subscriber: 40,
  student: 20,
};

export type Capability =
  | "research:read_published"
  | "research:read_drafts"
  | "research:edit"
  | "claims:review"
  | "admin:access"
  | "users:manage"
  | "notes:write"
  | "models:write";

const CAPABILITIES: Record<Capability, UserRole[]> = {
  "research:read_published": ["platform_owner", "research_administrator", "research_editor", "researcher", "student", "institutional_subscriber"],
  "notes:write": ["platform_owner", "research_administrator", "research_editor", "researcher", "student", "institutional_subscriber"],
  "models:write": ["platform_owner", "research_administrator", "research_editor", "researcher", "student", "institutional_subscriber"],
  "research:read_drafts": ["platform_owner", "research_administrator", "research_editor"],
  "research:edit": ["platform_owner", "research_administrator", "research_editor"],
  "claims:review": ["platform_owner", "research_administrator", "research_editor"],
  "admin:access": ["platform_owner", "research_administrator", "research_editor"],
  "users:manage": ["platform_owner", "research_administrator"],
};

export function can(role: UserRole, capability: Capability): boolean {
  return CAPABILITIES[capability].includes(role);
}

export function isAtLeast(role: UserRole, other: UserRole): boolean {
  return RANK[role] >= RANK[other];
}

/** Only owners may grant owner; administrators may grant anything below administrator. */
export function canAssignRole(actor: UserRole, target: UserRole): boolean {
  if (actor === "platform_owner") return true;
  if (actor === "research_administrator") return RANK[target] < RANK["research_administrator"];
  return false;
}
