export type EmailMessagePurpose =
  | "otp"
  | "transaction_alert"
  | "support"
  | "campaign"
  | "ops_alert"
  | "lifecycle"
  | "test"
  | "other";

export type EmailDeliveryStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "bounced"
  | "complained"
  | "failed";

export type EmailDriver = "resend" | "sendgrid" | "smtp";

export interface EmailConfig {
  id: string;
  is_enabled: boolean;
  failover_enabled: boolean;
  default_from_email: string | null;
  default_from_name: string | null;
  default_reply_to: string | null;
  enforce_suppression: boolean;
  sandbox_mode: boolean;
  sandbox_redirect_to: string | null;
  monthly_send_cap: number | null;
  updated_by: string | null;
  updatedAt: string;
}

export interface EmailProviderDefaults {
  from_email?: string;
  from_name?: string;
  reply_to?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_user?: string;
}

export interface EmailProviderStats {
  /** Rows attributed to this provider (includes failures). */
  attempts: number;
  successful: number;
  failed: number;
}

export interface EmailProviderConfig {
  id: string;
  name: string;
  driver: string;
  base_url: string | null;
  credentials: Record<string, unknown>;
  defaults: EmailProviderDefaults | null;
  is_enabled: boolean;
  priority: number;
  last_success_at: string | null;
  last_failure_at: string | null;
  consecutive_failures: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  archived_at: string | null;
  /** All-time counts from email_messages. Present on list responses. */
  stats?: EmailProviderStats;
}

export interface EmailMessageItem {
  id: string;
  provider_name: string;
  driver: string;
  purpose: EmailMessagePurpose;
  to_masked: string;
  subject: string;
  user_id: string | null;
  provider_ref: string | null;
  status: EmailDeliveryStatus;
  error_message: string | null;
  createdAt: string;
  delivered_at: string | null;
}

export interface EmailAnalyticsSummary {
  month: string;
  monthly: {
    messages_sent: number;
    messages_delivered: number;
    messages_failed: number;
    messages_bounced: number;
    messages_complained: number;
  };
  today: {
    messages_sent: number;
    messages_delivered: number;
    messages_failed: number;
    messages_bounced: number;
    messages_complained: number;
  };
  all_time: {
    messages_sent: number;
    messages_delivered: number;
    messages_failed: number;
    messages_bounced: number;
    messages_complained: number;
  };
}

export interface EmailDailyStat {
  date: string;
  messages_sent: number;
  messages_delivered: number;
  messages_failed: number;
  messages_bounced: number;
  messages_complained: number;
}

export interface EmailSuppressionItem {
  id: string;
  email: string;
  reason: string;
  bounce_type: string | null;
  detail: string | null;
  is_active: boolean;
  occurrences: number;
  last_seen_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface EmailConfigPayload {
  is_enabled?: boolean;
  failover_enabled?: boolean;
  default_from_email?: string;
  default_from_name?: string;
  default_reply_to?: string;
  enforce_suppression?: boolean;
  sandbox_mode?: boolean;
  sandbox_redirect_to?: string;
  monthly_send_cap?: number;
}

export interface CreateEmailProviderPayload {
  name: string;
  driver: string;
  base_url?: string;
  credentials: {
    api_key?: string;
    password?: string;
    webhook_secret?: string;
  };
  defaults?: EmailProviderDefaults;
  notes?: string;
  is_enabled?: boolean;
  priority?: number;
}

export interface UpdateEmailProviderPayload {
  name?: string;
  driver?: string;
  base_url?: string;
  credentials?: {
    api_key?: string;
    password?: string;
    webhook_secret?: string;
  };
  defaults?: EmailProviderDefaults;
  notes?: string;
  is_enabled?: boolean;
  priority?: number;
}

export interface PaginatedEmailMessages {
  items: EmailMessageItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  facets?: {
    by_status: Record<string, number>;
    by_provider: Record<string, number>;
  };
}
