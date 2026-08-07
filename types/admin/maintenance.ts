// --- Maintenance flags ---
//
// Runtime switches that put a part of the app under maintenance without a
// rebuild/redeploy. One row per "area"; toggled from the admin console.

export type MaintenanceScope = "users" | "all";

/**
 * Where a flag sits in its lifecycle, once the optional schedule window is
 * applied. `is_active` is the admin's switch; `phase` is what users experience.
 */
export type MaintenancePhase =
  | "live" // not blocking
  | "blocking" // blocking right now
  | "scheduled" // switch on, window hasn't opened yet
  | "expired"; // switch on, window already closed

export interface MaintenanceFlag {
  area: string;
  label: string;
  description: string;
  default_message: string;
  is_active: boolean;
  scope: MaintenanceScope;
  message: string | null;
  /** ISO-8601, or null for an open-ended bound. */
  starts_at: string | null;
  ends_at: string | null;
  phase: MaintenancePhase;
  updatedAt: string | null;
  updated_by: string | null;
}

export interface MaintenanceListResponse {
  success: boolean;
  message: string;
  data: { items: MaintenanceFlag[] };
}

export interface UpdateMaintenanceFlagPayload {
  area: string;
  is_active?: boolean;
  scope?: MaintenanceScope;
  message?: string;
  /** ISO-8601 to set, `null` to clear, omit to leave unchanged. */
  starts_at?: string | null;
  ends_at?: string | null;
}

export interface UpdateMaintenanceFlagResponse {
  success: boolean;
  message: string;
  data: {
    area: string;
    is_active: boolean;
    scope: MaintenanceScope;
    message: string | null;
    starts_at: string | null;
    ends_at: string | null;
    phase: MaintenancePhase;
    updatedAt: string;
    updated_by: string | null;
  };
}
