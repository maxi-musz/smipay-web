// --- App Version Gate config ---
//
// Server-driven thresholds that drive the mobile force / soft update prompts.
// Lives in the DB (singleton row) so it can be patched from the admin console
// without rebuilding or redeploying the mobile app.

export interface AppVersionGateConfig {
  id: string;
  /** Master switch. When false the gate is inert — every build passes. */
  is_active: boolean;

  /** Hard floor — builds below this are forced to update. */
  min_version_ios: string;
  min_version_android: string;

  /** Soft target — builds below this get a dismissable nudge. */
  latest_version_ios: string;
  latest_version_android: string;

  /** Informational build numbers (not used for gating). */
  latest_build_ios: string | null;
  latest_build_android: string | null;

  ios_store_url: string;
  android_store_url: string;

  force_message: string;
  soft_message: string;

  updated_by: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppVersionGateConfigPayload {
  is_active?: boolean;
  min_version_ios?: string;
  min_version_android?: string;
  latest_version_ios?: string;
  latest_version_android?: string;
  latest_build_ios?: string | null;
  latest_build_android?: string | null;
  ios_store_url?: string;
  android_store_url?: string;
  force_message?: string;
  soft_message?: string;
}

// --- Responses (ApiResponseDto wrapper) ---

export interface AppVersionGateConfigResponse {
  success: boolean;
  message: string;
  data: AppVersionGateConfig;
}
