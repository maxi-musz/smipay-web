// --- Security policy ---
//
// Runtime security knobs (device/registration limits, lockouts, OTP limits).
// The backend ships the field catalogue alongside the values, so this page
// renders whatever the API describes — adding a setting needs no web change.

export type EnforcementMode = "monitor" | "enforce";

export type SecurityPolicy = Record<string, string | number | boolean>;

export interface SecurityPolicyFieldOption {
  value: string;
  label: string;
  help?: string;
}

export interface SecurityPolicyField {
  key: string;
  label: string;
  help: string;
  type: "boolean" | "number" | "enum";
  min?: number;
  max?: number;
  unit?: string;
  zero_label?: string;
  options?: SecurityPolicyFieldOption[];
  depends_on?: { key: string; equals: Array<string | number | boolean> };
}

export interface SecurityPolicyGroup {
  key: string;
  label: string;
  description: string;
  icon: string;
  fields: SecurityPolicyField[];
}

export interface SecurityPolicyResponse {
  success: boolean;
  message: string;
  data: {
    policy: SecurityPolicy;
    defaults: SecurityPolicy;
    groups: SecurityPolicyGroup[];
  };
}

export interface UpdateSecurityPolicyResponse {
  success: boolean;
  message: string;
  data: { policy: SecurityPolicy; changed: string[] };
}

// --- Monitor log ---
//
// Every time a rule tripped, and whether it actually blocked. This is what
// makes "monitor" mode useful: see a rule's real impact before enforcing it.

export interface SecurityEventSummaryRow {
  rule: string;
  label: string;
  count: number;
  last_seen: string | null;
}

export interface SecurityEvent {
  id: string;
  rule: string;
  event_type: string;
  severity: string;
  description: string;
  user_id: string | null;
  device_id: string | null;
  ip_address: string | null;
  metadata: { blocked?: boolean; enforcement_mode?: string } | null;
  createdAt: string;
}

export interface SecurityEventsResponse {
  success: boolean;
  message: string;
  data: {
    window_days: number;
    total: number;
    summary: SecurityEventSummaryRow[];
    events: SecurityEvent[];
  };
}
