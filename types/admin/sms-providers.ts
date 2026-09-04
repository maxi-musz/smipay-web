export type SmsMessagePurpose =
  | "otp"
  | "transaction_alert"
  | "marketing"
  | "test"
  | "other";

export type SmsDeliveryStatus = "queued" | "sent" | "delivered" | "failed";

export type TermiiChannel = "dnd" | "generic";

export type BulksmsNigeriaGateway =
  | "otp"
  | "direct-refund"
  | "direct-corporate"
  | "dual-backup";

export type SmsDriver = "termii" | "vtpass" | "bulksmsnigeria";

export interface SmsConfig {
  id: string;
  is_enabled: boolean;
  monthly_budget_ngn: number | null;
  daily_cap_per_user: number;
  otp_resend_cooldown_seconds: number;
  has_webhook_secret: boolean;
  updated_by: string | null;
  updatedAt: string;
}

export interface SmsProviderDefaults {
  sender_id?: string;
  default_channel?: TermiiChannel;
  default_type?: "plain" | "unicode";
  default_gateway?: BulksmsNigeriaGateway;
  otp_message_template?: string;
}

export interface SmsProviderConfig {
  id: string;
  name: string;
  driver: string;
  base_url: string;
  credentials: Record<string, unknown>;
  defaults: SmsProviderDefaults | null;
  is_active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  archived_at: string | null;
}

export interface SmsMessageItem {
  id: string;
  provider_name: string;
  driver: string;
  purpose: SmsMessagePurpose;
  to_last4: string | null;
  user_id: string | null;
  provider_ref: string | null;
  segments: number;
  cost_ngn: number | null;
  status: SmsDeliveryStatus;
  error_message: string | null;
  createdAt: string;
  delivered_at: string | null;
}

export interface SmsAnalyticsSummary {
  month: string;
  monthly: {
    messages_sent: number;
    messages_delivered: number;
    messages_failed: number;
    spend_ngn: number;
  };
  today: {
    messages_sent: number;
    messages_delivered: number;
    messages_failed: number;
    spend_ngn: number;
  };
  all_time: {
    messages_sent: number;
    messages_delivered: number;
    messages_failed: number;
    spend_ngn: number;
  };
}

export interface SmsDailyStat {
  date: string;
  messages_sent: number;
  messages_delivered: number;
  messages_failed: number;
  segments_total: number;
  spend_ngn: number;
}

export interface SmsBalance {
  balance: number;
  currency: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface SmsConfigPayload {
  is_enabled?: boolean;
  monthly_budget_ngn?: number;
  daily_cap_per_user?: number;
  otp_resend_cooldown_seconds?: number;
  webhook_secret?: string;
}

export interface CreateSmsProviderPayload {
  name: string;
  driver: string;
  base_url: string;
  credentials: {
    api_key?: string;
    api_token?: string;
    public_key?: string;
    secret_key?: string;
  };
  defaults?: SmsProviderDefaults;
  notes?: string;
  is_active?: boolean;
}

export interface UpdateSmsProviderPayload {
  name?: string;
  driver?: string;
  base_url?: string;
  credentials?: {
    api_key?: string;
    api_token?: string;
    public_key?: string;
    secret_key?: string;
  };
  defaults?: SmsProviderDefaults;
  notes?: string;
  is_active?: boolean;
}

export interface PaginatedMessages {
  items: SmsMessageItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
