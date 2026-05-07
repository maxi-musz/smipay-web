// ---------------------------------------------------------------------------
// Shared / Base
// ---------------------------------------------------------------------------

export interface AuditUserBrief {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
}

export interface AuditLogItem {
  id: string;
  user_id: string | null;
  actor_type: string;
  actor_name: string | null;
  session_id: string | null;
  action: string;
  category: string;
  status: string;
  severity: string;
  resource_type: string | null;
  resource_id: string | null;
  resource_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_id: string | null;
  device_model: string | null;
  platform: string | null;
  geo_location: string | null;
  latitude: number | null;
  longitude: number | null;
  http_method: string | null;
  endpoint: string | null;
  request_id: string | null;
  description: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  error_message: string | null;
  amount: number | null;
  currency: string | null;
  balance_before: number | null;
  balance_after: number | null;
  transaction_ref: string | null;
  is_flagged: boolean;
  flagged_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  user: AuditUserBrief | null;
}

export interface AuditListMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

export interface AuditDetailUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  smipay_tag: string | null;
  role: string;
  account_status: string;
  profile_image: { secure_url: string } | null;
}

export interface AuditSessionContextItem {
  id: string;
  action: string;
  status: string;
  severity: string;
  description: string;
  created_at: string;
}

export interface AuditLogDetail extends AuditLogItem {
  user:
    | (AuditUserBrief & {
        smipay_tag: string | null;
        role: string;
        account_status: string;
        profile_image: { secure_url: string } | null;
      })
    | null;
  reviewed_by_admin: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  session_context: AuditSessionContextItem[];
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface AuditTimelinePoint {
  timestamp: string;
  total: number;
  success_count: number;
  failure_count: number;
  blocked_count: number;
  high_severity_count: number;
  flagged_count: number;
}

// ---------------------------------------------------------------------------
// IP Investigation
// ---------------------------------------------------------------------------

export interface AuditActionCount {
  action: string;
  count: number;
}

export interface AuditAssociatedUser {
  user: AuditUserBrief & {
    smipay_tag: string | null;
    account_status: string;
  };
  action_count: number;
}

export interface AuditIPSummary {
  total_actions: number;
  distinct_users: number;
  is_multi_account: boolean;
  first_seen: string;
  last_seen: string;
}

export interface AuditIPResponse {
  success: boolean;
  message?: string;
  data: {
    ip_address: string;
    geo_location: string | null;
    summary: AuditIPSummary;
    associated_users: AuditAssociatedUser[];
    top_actions: AuditActionCount[];
    logs: AuditLogItem[];
    meta: AuditListMeta;
  };
}

// ---------------------------------------------------------------------------
// Session Trace
// ---------------------------------------------------------------------------

export interface AuditSessionSummary {
  duration_seconds: number;
  total_actions: number;
  failure_count: number;
  total_financial_amount: number;
  device_model: string | null;
  platform: string | null;
  geo_location: string | null;
  ip_address: string | null;
  unique_endpoints: number;
  started_at: string;
  ended_at: string;
}

export interface AuditSessionLogItem {
  id: string;
  action: string;
  status: string;
  severity: string;
  description: string;
  amount: number | null;
  created_at: string;
}

export interface AuditSessionResponse {
  success: boolean;
  message?: string;
  data: {
    user: AuditUserBrief;
    summary: AuditSessionSummary;
    logs: AuditSessionLogItem[];
  };
}

// ---------------------------------------------------------------------------
// Device Investigation
// ---------------------------------------------------------------------------

export interface AuditIPCount {
  ip_address: string;
  action_count: number;
}

export interface AuditDeviceSummary {
  total_actions: number;
  distinct_users: number;
  distinct_ips: number;
  is_multi_account: boolean;
}

export interface AuditDeviceResponse {
  success: boolean;
  message?: string;
  data: {
    device_id: string;
    device_model: string | null;
    platform: string | null;
    summary: AuditDeviceSummary;
    associated_users: AuditAssociatedUser[];
    ip_addresses: AuditIPCount[];
    logs: AuditLogItem[];
    meta: AuditListMeta;
  };
}

// ---------------------------------------------------------------------------
// User Audit Logs
// ---------------------------------------------------------------------------

export interface AuditUserIPAddress {
  ip_address: string;
  count: number;
}

export interface AuditUserSummary {
  total_actions: number;
  failure_count: number;
  top_actions: AuditActionCount[];
  ip_addresses: AuditUserIPAddress[];
  by_severity: Record<string, number>;
}

export interface AuditUserLogsResponse {
  success: boolean;
  message?: string;
  data: {
    user: AuditDetailUser;
    user_summary: AuditUserSummary;
    data: AuditLogItem[];
    meta: AuditListMeta;
  };
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface AuditAnalyticsOverview {
  total_logs: number;
  today: number;
  yesterday: number;
  this_week: number;
  this_month: number;
  week_over_week_percent: number;
  flagged: number;
  unreviewed_flagged: number;
  failures: number;
  failures_today: number;
  high_severity: number;
  high_severity_today: number;
  blocked: number;
}

export interface AuditAnalyticsFinancial {
  flagged_transaction_count: number;
  flagged_transaction_volume: number;
}

export interface AuditRecentHighSeverityItem {
  id: string;
  action: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  user_id: string | null;
  actor_type: string;
  ip_address: string | null;
  geo_location: string | null;
  amount: number | null;
  is_flagged: boolean;
  created_at: string;
  user: AuditUserBrief | null;
}

export interface AuditFraudIndicators {
  top_failed_actions: { action: string; failure_count: number }[];
  top_failed_users: {
    user: AuditUserBrief & { account_status: string };
    failure_count: number;
  }[];
  suspicious_ips: {
    ip_address: string;
    distinct_users: number;
    total_actions: number;
  }[];
}

export interface AuditAnalytics {
  overview: AuditAnalyticsOverview;
  financial: AuditAnalyticsFinancial;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
  by_severity: Record<string, number>;
  by_actor_type: Record<string, number>;
  recent_high_severity: AuditRecentHighSeverityItem[];
  fraud_indicators: AuditFraudIndicators;
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface AuditFilters {
  page: number;
  limit: number;
  search: string;
  user_id: string;
  action: string;
  category: string;
  status: string;
  severity: string;
  actor_type: string;
  resource_type: string;
  ip_address: string;
  is_flagged: string;
  date_from: string;
  date_to: string;
}

// ---------------------------------------------------------------------------
// API Response Wrappers (used by service layer & stores)
// ---------------------------------------------------------------------------

export interface AuditListResponse {
  success: boolean;
  message?: string;
  data: {
    logs: AuditLogItem[];
    meta: AuditListMeta;
    analytics: AuditAnalytics;
  };
}

export interface AuditDetailResponse {
  success: boolean;
  message?: string;
  data: AuditLogDetail;
}

export interface AuditTimelineResponse {
  success: boolean;
  message?: string;
  data: AuditTimelinePoint[];
}

export interface AuditFlaggedResponse {
  success: boolean;
  message?: string;
  data: {
    data: AuditLogItem[];
    meta: AuditListMeta;
  };
}

export interface AuditActionResponse {
  success: boolean;
  message?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const AUDIT_STATUSES = [
  { value: "SUCCESS", label: "Success", color: "emerald" },
  { value: "FAILURE", label: "Failure", color: "red" },
  { value: "PENDING", label: "Pending", color: "amber" },
  { value: "BLOCKED", label: "Blocked", color: "slate" },
] as const;

export const AUDIT_SEVERITIES = [
  { value: "LOW", label: "Low", color: "slate" },
  { value: "MEDIUM", label: "Medium", color: "blue" },
  { value: "HIGH", label: "High", color: "orange" },
  { value: "CRITICAL", label: "Critical", color: "red" },
] as const;

export const AUDIT_ACTOR_TYPES = [
  { value: "USER", label: "User", color: "blue" },
  { value: "ADMIN", label: "Admin", color: "purple" },
  { value: "SYSTEM", label: "System", color: "slate" },
  { value: "WEBHOOK", label: "Webhook", color: "amber" },
  { value: "CRON", label: "Cron", color: "cyan" },
] as const;

export const AUDIT_CATEGORIES = [
  { value: "AUTHENTICATION", label: "Authentication", color: "indigo" },
  { value: "REGISTRATION", label: "Registration", color: "teal" },
  { value: "USER_MANAGEMENT", label: "User Management", color: "purple" },
  { value: "KYC_VERIFICATION", label: "KYC Verification", color: "sky" },
  { value: "BANKING", label: "Banking", color: "emerald" },
  { value: "TRANSFER", label: "Transfer", color: "blue" },
  { value: "WALLET", label: "Wallet", color: "orange" },
  { value: "AIRTIME", label: "Airtime", color: "pink" },
  { value: "DATA", label: "Data", color: "cyan" },
  { value: "CABLE", label: "Cable", color: "violet" },
  { value: "EDUCATION", label: "Education", color: "yellow" },
  { value: "ELECTRICITY", label: "Electricity", color: "lime" },
  { value: "ADMIN", label: "Admin", color: "red" },
  { value: "SYSTEM", label: "System", color: "slate" },
  { value: "WEBHOOK", label: "Webhook", color: "amber" },
] as const;
