// ─── Conversation types (new live-chat-first system) ─────────────────

export interface ConversationMessage {
  id: string;
  message: string;
  is_from_user: boolean;
  sender_name: string | null;
  sender_email: string | null;
  attachments: string[] | null;
  created_at?: string;
  createdAt?: string;
}

export interface ConversationTicketBrief {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  support_type: string;
}

export interface ConversationLastMessage {
  message: string;
  is_from_user: boolean;
  sender_name: string | null;
  createdAt: string;
}

export interface ConversationListItem {
  id: string;
  status: ConversationStatus;
  assigned_admin_name: string | null;
  message_count: number;
  last_message: ConversationLastMessage | null;
  has_unread: boolean;
  ticket: ConversationTicketBrief | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  satisfaction_rating: number | null;
}

export interface ConversationDetail {
  id: string;
  status: ConversationStatus;
  assigned_admin_name: string | null;
  email: string;
  phone_number: string | null;
  satisfaction_rating: number | null;
  feedback: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  messages: ConversationMessage[];
  total_messages: number;
  ticket: ConversationTicketBrief | null;
}

export type ConversationStatus = "active" | "waiting_support" | "waiting_user" | "closed";

export interface SendChatPayload {
  message: string;
  conversation_id?: string;
  device_metadata?: {
    device_id?: string;
    device_model?: string;
    platform?: string;
    app_version?: string;
  };
}

export interface RateConversationPayload {
  rating: number;
  feedback?: string;
}

// Conversation status display map
export const CONVERSATION_STATUS_DISPLAY: Record<
  ConversationStatus,
  { label: string; color: string }
> = {
  active: { label: "Active", color: "green" },
  waiting_support: { label: "Waiting for support", color: "amber" },
  waiting_user: { label: "Waiting for your reply", color: "blue" },
  closed: { label: "Closed", color: "slate" },
};

// ─── API response wrappers ───────────────────────────────────────────

export interface ConversationsListResponse {
  success: boolean;
  message: string;
  data: {
    conversations: ConversationListItem[];
    total: number;
  };
}

export interface ConversationDetailResponse {
  success: boolean;
  message: string;
  data: {
    conversation: ConversationDetail;
  };
}

export interface SendChatNewResponse {
  success: boolean;
  message: string;
  data: {
    conversation: ConversationDetail;
    is_new: true;
  };
}

export interface SendChatExistingResponse {
  success: boolean;
  message: string;
  data: {
    conversation_id: string;
    message: ConversationMessage;
    is_new: false;
  };
}

export type SendChatResponse = SendChatNewResponse | SendChatExistingResponse;

export interface RateConversationResponse {
  success: boolean;
  message: string;
}

// ─── Legacy ticket types (kept for backward compatibility) ───────────

export interface SupportMessage {
  id: string;
  message: string;
  is_from_user: boolean;
  sender_name: string | null;
  sender_email: string | null;
  attachments: string[] | null;
  created_at?: string;
  createdAt?: string;
}

export interface SupportTicketListItem {
  id: string;
  ticket_number: string;
  subject: string;
  support_type: string;
  status: string;
  priority: string;
  message_count: number;
  last_message: {
    message: string;
    is_from_user: boolean;
    createdAt: string;
  } | null;
  has_unread: boolean;
  created_at: string;
  updated_at: string;
  last_response_at: string | null;
}

export interface SupportTicketDetail {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  support_type: string;
  status: string;
  priority: string;
  email: string;
  phone_number: string | null;
  related_transaction_id: string | null;
  created_at: string;
  updated_at: string;
  last_response_at: string | null;
  messages: SupportMessage[];
  total_messages: number;
  satisfaction_rating?: number | null;
}

export interface CreateTicketPayload {
  subject: string;
  description: string;
  email: string;
  phone_number?: string;
  support_type?: string;
  related_transaction_id?: string;
  device_metadata?: {
    device_id?: string;
    device_model?: string;
    platform?: string;
    app_version?: string;
  };
}

export interface SendMessagePayload {
  ticket_number: string;
  message: string;
  email: string;
}

export interface RateTicketPayload {
  rating: number;
  feedback?: string;
}

export const SUPPORT_TYPES = [
  { value: "GENERAL_INQUIRY", label: "General Inquiry" },
  { value: "TRANSACTION_ISSUE", label: "Transaction Issue" },
  { value: "PAYMENT_ISSUE", label: "Payment Issue" },
  { value: "ACCOUNT_ISSUE", label: "Account Issue" },
  { value: "WALLET_ISSUE", label: "Wallet Issue" },
  { value: "CARD_ISSUE", label: "Card Issue" },
  { value: "KYC_VERIFICATION_ISSUE", label: "KYC Verification" },
  { value: "LOGIN_ISSUE", label: "Login Issue" },
  { value: "REGISTRATION_ISSUE", label: "Registration Issue" },
  { value: "SECURITY_ISSUE", label: "Security Issue" },
  { value: "BILLING_ISSUE", label: "Billing Issue" },
  { value: "REFUND_REQUEST", label: "Refund Request" },
  { value: "FEATURE_REQUEST", label: "Feature Request" },
  { value: "BUG_REPORT", label: "Bug Report" },
  { value: "OTHER", label: "Other" },
] as const;

export const TICKET_STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  pending: { label: "Waiting for support", color: "amber" },
  in_progress: { label: "Being handled", color: "blue" },
  waiting_user: { label: "Waiting for your reply", color: "orange" },
  escalated: { label: "Under review", color: "purple" },
  resolved: { label: "Resolved", color: "green" },
  closed: { label: "Closed", color: "slate" },
};

export interface MyTicketsResponse {
  success: boolean;
  message: string;
  data: {
    tickets: SupportTicketListItem[];
    total_tickets: number;
  };
}

export interface TicketDetailResponse {
  success: boolean;
  message: string;
  data: {
    ticket: SupportTicketDetail;
  };
}

export interface CreateTicketResponse {
  success: boolean;
  message: string;
  data: {
    ticket: SupportTicketDetail;
    message: string;
  };
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data: {
    ticket_number: string;
    ticket_id: string;
    message: SupportMessage;
  };
}

export interface RateTicketResponse {
  success: boolean;
  message: string;
}
