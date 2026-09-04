/**
 * Named sections that group the unified-admin sidebar tabs (and the Management
 * → Permissions tree). Purely presentational — modules still come from the
 * access-modules registry / static fallback; this file only decides which
 * section each top-level module key lives under.
 *
 * A module key that isn't mapped here falls into DEFAULT_SECTION so entries
 * registered later from the Management UI never disappear.
 */

export interface SidebarSection {
  id: string;
  label: string;
}

/** Render order of the sections. */
export const SIDEBAR_SECTIONS: SidebarSection[] = [
  { id: "overview", label: "Overview" },
  { id: "people", label: "People" },
  { id: "money", label: "Money" },
  { id: "engagement", label: "Engagement" },
  { id: "system", label: "System" },
];

/** Top-level module key → section id. Children follow their parent. */
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
