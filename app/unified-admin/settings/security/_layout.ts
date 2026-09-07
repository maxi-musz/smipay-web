import type { SecurityPolicyGroup } from "@/types/admin/security";
import type { MaintenanceFlag } from "@/types/admin/maintenance";
import type { RateLimitGroup } from "@/types/admin/rate-limits";

/**
 * Information architecture for the Security page.
 *
 * Row 1 (`section`) is *which part of the app*. Row 2 (`tab`) is *what about
 * it* — either tunable rules (a policy group from the backend catalogue) or
 * availability (the maintenance kill-switch for one or more areas).
 *
 * This file only decides placement. It never decides what exists: anything the
 * API returns that isn't claimed here still surfaces under "Advanced", so a new
 * policy group or maintenance area can never go missing from the console just
 * because nobody updated this map.
 */

export type TabSpec =
  | { key: string; label: string; kind: "policy"; group: string }
  | { key: string; label: string; kind: "availability"; areas: string[] }
  /** Read-only view of what tripped; has no backing catalogue entry. */
  | { key: string; label: string; kind: "monitor" }
  | { key: string; label: string; kind: "blocked-ips" };

export interface SectionSpec {
  key: string;
  label: string;
  icon: string;
  tabs: TabSpec[];
}

const AVAILABILITY_LABEL = "Availability";

/** Section that collects anything not explicitly placed. Always last. */
const ADVANCED_KEY = "advanced";

export const SECURITY_LAYOUT: SectionSpec[] = [
  {
    key: "registration",
    label: "Registration & Login",
    icon: "UserPlus",
    tabs: [
      { key: "device", label: "Device rules", kind: "policy", group: "device" },
      { key: "login", label: "Login & registration", kind: "policy", group: "login" },
      {
        key: "availability",
        label: AVAILABILITY_LABEL,
        kind: "availability",
        areas: ["registration"],
      },
    ],
  },
  {
    key: "verification",
    label: "Verification",
    icon: "KeyRound",
    tabs: [
      { key: "otp", label: "OTP limits", kind: "policy", group: "otp" },
      {
        key: "availability",
        label: AVAILABILITY_LABEL,
        kind: "availability",
        areas: ["email_verification", "otp_verification"],
      },
    ],
  },
  {
    key: "transactions",
    label: "Transactions",
    icon: "Lock",
    tabs: [
      {
        key: "availability",
        label: AVAILABILITY_LABEL,
        kind: "availability",
        areas: ["utility_services"],
      },
      { key: "pin", label: "Transaction PIN", kind: "policy", group: "pin" },
    ],
  },
  {
    key: ADVANCED_KEY,
    label: "Advanced",
    icon: "SlidersHorizontal",
    tabs: [
      {
        key: "enforcement",
        label: "Enforcement",
        kind: "policy",
        group: "enforcement",
      },
      { key: "blocked-ips", label: "Blocked IPs", kind: "blocked-ips" },
      { key: "monitor", label: "Monitor log", kind: "monitor" },
    ],
  },
];

/** A tab with its backing data attached and confirmed to exist. */
export type ResolvedTab =
  | { key: string; label: string; kind: "policy"; group: SecurityPolicyGroup }
  | { key: string; label: string; kind: "availability"; areas: MaintenanceFlag[] }
  | { key: string; label: string; kind: "ratelimits"; group: RateLimitGroup }
  | { key: string; label: string; kind: "monitor" }
  | { key: string; label: string; kind: "blocked-ips" };

export interface ResolvedSection {
  key: string;
  label: string;
  icon: string;
  tabs: ResolvedTab[];
}

/**
 * Match the layout against what the API actually returned, dropping empty tabs
 * and sections, then sweep anything unclaimed into "Advanced".
 */
export function resolveSections(
  groups: SecurityPolicyGroup[],
  flags: MaintenanceFlag[],
  rateLimits: RateLimitGroup[] = [],
): ResolvedSection[] {
  const groupByKey = new Map(groups.map((g) => [g.key, g]));
  const flagByArea = new Map(flags.map((f) => [f.area, f]));
  const usedGroups = new Set<string>();
  const usedAreas = new Set<string>();

  const sections: ResolvedSection[] = [];

  for (const spec of SECURITY_LAYOUT) {
    const tabs: ResolvedTab[] = [];

    for (const tab of spec.tabs) {
      if (tab.kind === "monitor") {
        // Always available — it reads events, not configuration.
        tabs.push({ key: tab.key, label: tab.label, kind: "monitor" });
      } else if (tab.kind === "blocked-ips") {
        tabs.push({ key: tab.key, label: tab.label, kind: "blocked-ips" });
      } else if (tab.kind === "policy") {
        const group = groupByKey.get(tab.group);
        if (!group) continue;
        usedGroups.add(group.key);
        tabs.push({ key: tab.key, label: tab.label, kind: "policy", group });
      } else {
        const areas = tab.areas
          .map((a) => flagByArea.get(a))
          .filter((f): f is MaintenanceFlag => Boolean(f));
        if (areas.length === 0) continue;
        areas.forEach((a) => usedAreas.add(a.area));
        tabs.push({ key: tab.key, label: tab.label, kind: "availability", areas });
      }
    }

    if (tabs.length > 0) sections.push({ ...spec, tabs });
  }

  // Rate limits are their own section, built from whatever the API returns —
  // one sub-tab per service group, so adding an endpoint to the backend
  // catalogue makes it appear here with no web change.
  if (rateLimits.length > 0) {
    const rateSection: ResolvedSection = {
      key: "rate-limits",
      label: "Rate limits",
      icon: "Gauge",
      tabs: rateLimits.map((g) => ({
        key: `rl-${g.key}`,
        label: g.label,
        kind: "ratelimits" as const,
        group: g,
      })),
    };
    // Keep Advanced last.
    const advancedAt = sections.findIndex((s) => s.key === ADVANCED_KEY);
    if (advancedAt === -1) sections.push(rateSection);
    else sections.splice(advancedAt, 0, rateSection);
  }

  // Anything the layout didn't claim lands in Advanced so it stays reachable.
  const orphanGroups = groups.filter((g) => !usedGroups.has(g.key));
  const orphanAreas = flags.filter((f) => !usedAreas.has(f.area));

  if (orphanGroups.length > 0 || orphanAreas.length > 0) {
    let advanced = sections.find((s) => s.key === ADVANCED_KEY);
    if (!advanced) {
      advanced = {
        key: ADVANCED_KEY,
        label: "Advanced",
        icon: "SlidersHorizontal",
        tabs: [],
      };
      sections.push(advanced);
    }
    for (const group of orphanGroups) {
      advanced.tabs.push({
        key: `group-${group.key}`,
        label: group.label,
        kind: "policy",
        group,
      });
    }
    if (orphanAreas.length > 0) {
      advanced.tabs.push({
        key: "availability-other",
        label: AVAILABILITY_LABEL,
        kind: "availability",
        areas: orphanAreas,
      });
    }
  }

  return sections;
}
