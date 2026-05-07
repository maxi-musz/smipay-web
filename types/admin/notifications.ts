export type NotificationCampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "failed"
  | "cancelled";

export type NotificationTargetType = "all" | "individual" | "filtered";

export interface NotificationTargetFilters {
  role?: string;
  tier?: string;
  account_status?: string;
  is_email_verified?: boolean;
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

export interface NotificationCampaign {
  id: string;
  title: string;
  subject: string;
  content_markdown?: string;
  content_html?: string;
  target_type: NotificationTargetType;
  target_filters: NotificationTargetFilters | null;
  target_emails: string[] | null;
  status: NotificationCampaignStatus;
  scheduled_for: string | null;
  sent_at: string | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_by?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationDeliveryLog {
  id: string;
  campaign_id: string;
  user_id: string | null;
  email: string;
  status: "sent" | "failed";
  error_message: string | null;
  createdAt: string;
}

export interface NotificationCampaignFilters {
  page: number;
  limit: number;
  status: string;
}

export interface NotificationCampaignListMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface NotificationCampaignListResponse {
  success: boolean;
  message: string;
  data: {
    campaigns: NotificationCampaign[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface NotificationCampaignResponse {
  success: boolean;
  message: string;
  data: NotificationCampaign;
}

export interface NotificationDeliveryLogsResponse {
  success: boolean;
  message: string;
  data: {
    logs: NotificationDeliveryLog[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface NotificationPreviewResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    sample: string[];
  };
}

export interface NotificationCampaignCreatePayload {
  title: string;
  subject: string;
  content_markdown: string;
  target_type: NotificationTargetType;
  target_filters?: NotificationTargetFilters | null;
  target_emails?: string[] | null;
  scheduled_for?: string | null;
}

export interface NotificationResendFailedResponse {
  success: boolean;
  message: string;
  data: {
    message: string;
    count: number;
  };
}

export type NotificationResendSelectedResponse = NotificationResendFailedResponse;

export const NOTIFICATION_CAMPAIGN_STATUSES: Array<{
  value: NotificationCampaignStatus;
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
