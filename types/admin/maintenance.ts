// --- Maintenance flags ---
//
// Runtime switches that put a part of the app under maintenance without a
// rebuild/redeploy. One row per "area"; toggled from the admin console.

export type MaintenanceScope = "users" | "all";

export interface MaintenanceFlag {
  area: string;
  label: string;
  description: string;
  default_message: string;
  is_active: boolean;
  scope: MaintenanceScope;
  message: string | null;
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
}

export interface UpdateMaintenanceFlagResponse {
  success: boolean;
  message: string;
  data: {
    area: string;
    is_active: boolean;
    scope: MaintenanceScope;
    message: string | null;
    updatedAt: string;
    updated_by: string | null;
  };
}
