export type PushBroadcastStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "failed"
  | "cancelled";

export type PushBroadcastTargetType = "all" | "individual" | "filtered";

export interface PushBroadcastTargetFilters {
  role?: string;
  tier?: string;
  account_status?: string;
  has_completed_onboarding?: boolean;
  gender?: string;
  registered_before?: string;
  registered_after?: string;
  min_balance?: number;
  max_balance?: number;
  min_total_transactions?: number;
  max_total_transactions?: number;
  platform?: string;
}

export interface PushBroadcast {
  id: string;
  title: string;
  body: string;
  message?: string | null;
  target_type: PushBroadcastTargetType;
  target_filters: PushBroadcastTargetFilters | null;
  target_user_ids: string[] | null;
  data: Record<string, unknown> | null;
  status: PushBroadcastStatus;
  scheduled_for: string | null;
  sent_at: string | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_by?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PushBroadcastLog {
  id: string;
  broadcast_id: string;
  user_id: string;
  status: "sent" | "failed";
  error_message: string | null;
  createdAt: string;
}

export interface PushBroadcastFilters {
  page: number;
  limit: number;
  status: string;
}

export interface PushBroadcastListMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PushBroadcastListResponse {
  success: boolean;
  message: string;
  data: {
    broadcasts: PushBroadcast[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface PushBroadcastResponse {
  success: boolean;
  message: string;
  data: PushBroadcast;
}

export interface PushBroadcastLogsResponse {
  success: boolean;
  message: string;
  data: {
    logs: PushBroadcastLog[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface PushBroadcastPreviewResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    sample: string[];
  };
}

export interface PushBroadcastCreatePayload {
  title: string;
  body: string;
  message?: string | null;
  target_type: PushBroadcastTargetType;
  target_filters?: PushBroadcastTargetFilters | null;
  target_user_ids?: string[] | null;
  scheduled_for?: string | null;
}

export const PUSH_BROADCAST_STATUSES: Array<{
  value: PushBroadcastStatus;
  label: string;
  color: "gray" | "blue" | "amber" | "green" | "red";
}> = [
  { value: "draft", label: "Draft", color: "gray" },
  { value: "scheduled", label: "Scheduled", color: "blue" },
  { value: "sending", label: "Sending", color: "amber" },
  { value: "sent", label: "Sent", color: "green" },
  { value: "failed", label: "Failed", color: "red" },
  { value: "cancelled", label: "Cancelled", color: "gray" },
];
