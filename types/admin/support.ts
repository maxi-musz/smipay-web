// ─── CONVERSATIONS (new live-chat system) ────────────────────────────

export type AdminConversationStatus = "active" | "waiting_support" | "waiting_user" | "closed";
export type HandoverStatus = "pending" | "accepted" | "rejected";

export interface AdminConversationUserBrief {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string;
  smipay_tag: string | null;
  profile_image: { secure_url: string } | null;
}

export interface AdminConversationAdminBrief {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export interface AdminConversationTicketBrief {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  support_type: string;
}

export interface AdminConversationMessage {
  id: string;
  message: string;
  is_internal: boolean;
  is_from_user: boolean;
  user_id: string | null;
  sender_name: string | null;
  sender_email: string | null;
  attachments: string[] | null;
  createdAt: string;
}

export interface AdminConversationLastMessage {
  message: string;
  is_from_user: boolean;
  sender_name: string | null;
  createdAt: string;
}

export interface AdminConversationListItem {
  id: string;
  user_id: string | null;
  email: string | null;
  phone_number: string | null;
  status: AdminConversationStatus;
  assigned_to: string | null;
  assigned_at: string | null;
  satisfaction_rating: number | null;
  last_message_at: string;
  createdAt: string;
  updatedAt: string;
  user: AdminConversationUserBrief | null;
  ticket: AdminConversationTicketBrief | null;
  message_count: number;
  last_message: AdminConversationLastMessage | null;
  has_unread: boolean;
  assigned_admin: AdminConversationAdminBrief | null;
}

export interface AdminConversationAnalytics {
  total_conversations: number;
  active: number;
  unassigned: number;
  by_status: Record<string, number>;
}

export interface AdminConversationHandover {
  id: string;
  from_admin_id: string;
  to_admin_id: string;
  from_admin_name: string;
  to_admin_name: string;
  reason: string | null;
  status: HandoverStatus;
  responded_at: string | null;
  createdAt: string;
}

export interface AdminConversationDetailUser extends AdminConversationUserBrief {
  account_status: string;
  role: string;
  wallet: { current_balance: number } | null;
  tier: { tier: string; name: string } | null;
  kyc_verification: { is_verified: boolean; status: string } | null;
}

export interface AdminConversationDetail {
  id: string;
  user_id: string | null;
  email: string | null;
  phone_number: string | null;
  status: AdminConversationStatus;
  assigned_to: string | null;
  assigned_at: string | null;
  device_metadata: SupportDeviceMetadata | null;
  ip_address: string | null;
  user_agent: string | null;
  satisfaction_rating: number | null;
  feedback: string | null;
  last_message_at: string;
  createdAt: string;
  updatedAt: string;
  user: AdminConversationDetailUser | null;
  messages: AdminConversationMessage[];
  ticket: AdminConversationTicketBrief | null;
  assigned_admin: AdminConversationAdminBrief | null;
  handovers: AdminConversationHandover[];
}

export interface AdminConversationsListResponse {
  success: boolean;
  message: string;
  data: {
    analytics: AdminConversationAnalytics;
    conversations: AdminConversationListItem[];
    meta: SupportListMeta;
  };
}

export interface AdminConversationDetailResponse {
  success: boolean;
  message: string;
  data: AdminConversationDetail;
}

export interface AdminConversationFilters {
  page: number;
  limit: number;
  search: string;
  status: string;
  assigned_to: string;
  user_id: string;
  has_ticket: string;
  date_from: string;
  date_to: string;
  sort_by: string;
  sort_order: string;
}

export const CONVERSATION_STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "green" },
  { value: "waiting_support", label: "Waiting Support", color: "amber" },
  { value: "waiting_user", label: "Waiting User", color: "blue" },
  { value: "closed", label: "Closed", color: "slate" },
] as const;

// ─── TICKETS (existing — unchanged) ─────────────────────────────────

export interface SupportOverview {
  total_tickets: number;
  open: number;
  pending: number;
  in_progress: number;
  escalated: number;
  waiting_user: number;
  resolved: number;
  closed: number;
  unassigned: number;
}

export interface SupportActivity {
  new_today: number;
  new_this_week: number;
  new_this_month: number;
}

export interface SupportPerformance {
  avg_response_time_seconds: number | null;
  avg_satisfaction_rating: number | null;
  total_rated: number;
}

export interface SupportAnalytics {
  overview: SupportOverview;
  activity: SupportActivity;
  performance: SupportPerformance;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_type: Record<string, number>;
}

export interface SupportUserBrief {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string;
  smipay_tag: string | null;
  profile_image: { secure_url: string } | null;
}

export interface SupportAdminBrief {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export interface SupportTicketItem {
  id: string;
  ticket_number: string;
  user_id: string | null;
  phone_number: string | null;
  email: string | null;
  subject: string;
  support_type: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  first_response_at: string | null;
  last_response_at: string | null;
  response_time_seconds: number | null;
  resolved_at: string | null;
  satisfaction_rating: number | null;
  tags: string[] | null;
  conversation_id?: string | null;
  createdAt: string;
  updatedAt: string;
  user: SupportUserBrief | null;
  message_count: number;
  assigned_admin: SupportAdminBrief | null;
}

export interface SupportListMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface SupportListResponse {
  success: boolean;
  message: string;
  data: {
    analytics: SupportAnalytics;
    tickets: SupportTicketItem[];
    meta: SupportListMeta;
  };
}

export interface SupportMessage {
  id: string;
  message: string;
  is_internal: boolean;
  is_from_user: boolean;
  user_id: string | null;
  sender_name: string | null;
  sender_email: string | null;
  attachments: string[] | null;
  createdAt: string;
}

export interface SupportDeviceMetadata {
  device_id: string;
  platform: string;
  device_model: string;
  app_version: string;
}

export interface SupportRelatedTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  status: string;
  transaction_reference: string;
  createdAt: string;
}

export interface SupportDetailUser extends SupportUserBrief {
  account_status: string;
  role: string;
  wallet: { current_balance: number } | null;
  tier: { tier: string; name: string } | null;
  kyc_verification: { is_verified: boolean; status: string } | null;
}

export interface SupportTicketDetail extends SupportTicketItem {
  description: string;
  resolution_notes: string | null;
  resolved_by: string | null;
  related_transaction_id: string | null;
  related_registration_progress_id: string | null;
  device_metadata: SupportDeviceMetadata | null;
  ip_address: string | null;
  user_agent: string | null;
  internal_notes: string | null;
  attachments: string[] | null;
  feedback: string | null;
  messages: SupportMessage[];
  resolved_by_admin: SupportAdminBrief | null;
  related_transaction: SupportRelatedTransaction | null;
  user: SupportDetailUser | null;
}

export interface SupportDetailResponse {
  success: boolean;
  message: string;
  data: SupportTicketDetail;
}

export interface SupportMutationResponse {
  success: boolean;
  message: string;
  data: SupportTicketItem;
}

export interface SupportFilters {
  page: number;
  limit: number;
  search: string;
  status: string;
  priority: string;
  support_type: string;
  assigned_to: string;
  user_id: string;
  date_from: string;
  date_to: string;
  sort_by: string;
  sort_order: string;
}

export const SUPPORT_STATUSES = [
  { value: "pending", label: "Pending", color: "amber" },
  { value: "in_progress", label: "In Progress", color: "blue" },
  { value: "waiting_user", label: "Waiting User", color: "orange" },
  { value: "resolved", label: "Resolved", color: "emerald" },
  { value: "closed", label: "Closed", color: "slate" },
  { value: "escalated", label: "Escalated", color: "red" },
] as const;

export const SUPPORT_PRIORITIES = [
  { value: "low", label: "Low", color: "slate" },
  { value: "medium", label: "Medium", color: "blue" },
  { value: "high", label: "High", color: "orange" },
  { value: "urgent", label: "Urgent", color: "red" },
] as const;

export const SUPPORT_TYPES = [
  { value: "REGISTRATION_ISSUE", label: "Registration Issue" },
  { value: "LOGIN_ISSUE", label: "Login Issue" },
  { value: "TRANSACTION_ISSUE", label: "Transaction Issue" },
  { value: "PAYMENT_ISSUE", label: "Payment Issue" },
  { value: "ACCOUNT_ISSUE", label: "Account Issue" },
  { value: "WALLET_ISSUE", label: "Wallet Issue" },
  { value: "CARD_ISSUE", label: "Card Issue" },
  { value: "KYC_VERIFICATION_ISSUE", label: "KYC Verification" },
  { value: "SECURITY_ISSUE", label: "Security Issue" },
  { value: "FEATURE_REQUEST", label: "Feature Request" },
  { value: "BUG_REPORT", label: "Bug Report" },
  { value: "BILLING_ISSUE", label: "Billing Issue" },
  { value: "REFUND_REQUEST", label: "Refund Request" },
  { value: "GENERAL_INQUIRY", label: "General Inquiry" },
  { value: "OTHER", label: "Other" },
] as const;
