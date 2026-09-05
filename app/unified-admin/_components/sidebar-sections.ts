// Groups the unified-admin sidebar tabs (and the Management → Permissions
// tree). Module keys not mapped here fall into DEFAULT_SECTION.

export interface SidebarSection {
  id: string;
  label: string;
}

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  { id: "overview", label: "Overview" },
  { id: "people", label: "People" },
  { id: "money", label: "Money" },
  { id: "engagement", label: "Engagement" },
  { id: "system", label: "System" },
];

export const MODULE_SECTION_MAP: Record<string, string> = {
  dashboard: "overview",
  "audit-logs": "overview",

  users: "people",
  kyc: "people",
  devices: "people",

  transactions: "money",
  markup: "money",
  rewards: "money",
  cards: "money",

  support: "engagement",
  smileai: "engagement",
  notifications: "engagement",

  providers: "system",
  settings: "system",
  management: "system",
  compliance: "system",
};

export const DEFAULT_SECTION = "system";

export function sectionIdForModule(key: string): string {
  return MODULE_SECTION_MAP[key] ?? DEFAULT_SECTION;
}
