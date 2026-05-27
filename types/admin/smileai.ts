export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

// ─── Providers / vector store ──────────────────────────────────────────────

export interface SmileAiProvider {
  id: string;
  kind: "llm" | "embeddings";
  name: string;
  driver: string;
  model: string;
  base_url: string | null;
  credentials: Record<string, unknown>;
  defaults: unknown;
  capabilities: unknown;
  is_active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  archived_at: string | null;
}

export interface SmileAiVectorStore {
  id: string;
  kind: string;
  name: string;
  driver: string;
  index_name: string;
  dimensions: number;
  metric: string;
  credentials?: Record<string, unknown>;
  is_active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  archived_at: string | null;
}

// ─── Personas ──────────────────────────────────────────────────────────────

export interface SmileAiPersona {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  prompt_version: number;
  capabilities: Record<string, unknown> | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  archived_at: string | null;
}

export interface SmileAiPersonaVersion {
  id: string;
  prompt_version: number;
  system_prompt: string;
  capabilities: Record<string, unknown> | null;
  description: string | null;
  edited_by: string | null;
  note: string | null;
  createdAt: string;
  is_active: boolean;
}

// ─── Knowledge base ────────────────────────────────────────────────────────

export type SmileAiDocStatus =
  | "uploaded"
  | "parsing"
  | "chunking"
  | "embedding"
  | "indexed"
  | "failed"
  | "archived";

export interface SmileAiDocument {
  id: string;
  title: string;
  source: string;
  mime_type: string;
  status: SmileAiDocStatus;
  version: number;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  uploaded_by: string | null;
  failure_reason: string | null;
  chunk_count: number;
  createdAt: string;
  updatedAt: string;
}

export interface SmileAiChunk {
  id: string;
  ordinal: number;
  heading_path: string;
  text: string;
  token_count: number;
  metadata: Record<string, unknown> | null;
  embedding_model: string | null;
  createdAt: string;
}

export interface SmileAiRetrievedHit {
  id: string;
  document_id: string;
  text: string;
  heading_path: string;
  score: number;
  metadata: Record<string, unknown>;
}

// ─── Actions ───────────────────────────────────────────────────────────────

export interface SmileAiAction {
  id: string;
  name: string;
  display_name: string;
  description: string;
  safety: "read" | "write" | "sensitive";
  parameters_schema: Record<string, unknown>;
  result_schema: Record<string, unknown> | null;
  binding_kind: string;
  binding: Record<string, unknown>;
  allowed_roles: string[];
  rate_limit_per_minute: number;
  enabled: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  archived_at: string | null;
  recent?: {
    success: number;
    failed: number;
    p95_ms: number | null;
  };
}

export interface SmileAiActionExecution {
  id: string;
  action_id: string;
  conversation_id: string | null;
  message_id: string | null;
  user_id: string | null;
  status: string;
  input: unknown;
  output: unknown;
  error: unknown;
  latency_ms: number | null;
  cost_usd: string | null;
  createdAt: string;
}

// ─── Conversations ─────────────────────────────────────────────────────────

export type SmileAiConvStatus =
  | "active"
  | "awaiting_user"
  | "handoff_pending"
  | "handed_off"
  | "resolved"
  | "closed"
  | "abandoned";

export interface SmileAiConversationListItem {
  id: string;
  user: { id: string; email: string | null; name: string | null } | null;
  user_id: string | null;
  user_email: string | null;
  status: SmileAiConvStatus;
  persona: string | null;
  support_conversation_id: string | null;
  handoff_trigger: string | null;
  handoff_id: string | null;
  message_count: number;
  rating: number | null;
  total_tokens_in: number;
  total_tokens_out: number;
  total_cost_usd: string | number;
  last_message_at: string | null;
  createdAt: string;
}

export interface SmileAiConversationMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  payload: unknown;
  tool_calls: unknown;
  tool_results: unknown;
  citations: unknown[];
  tokens_in: number | null;
  tokens_out: number | null;
  latency_ms: number | null;
  createdAt: string;
}

export interface SmileAiHandoffSummary {
  id: string;
  trigger: string;
  summary: string;
  entities: Record<string, unknown>;
  support_conversation_id: string | null;
  ai_message_id: string | null;
  createdAt: string;
}

export interface SmileAiAdminNote {
  id: string;
  conversation_id: string;
  author_id: string;
  author_name: string | null;
  body: string;
  createdAt: string;
}

export interface SmileAiConversationDetail {
  id: string;
  status: SmileAiConvStatus;
  persona: { id: string; name: string } | null;
  user_id: string | null;
  user_email: string | null;
  user: {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    smipay_tag: string | null;
    role: string;
  } | null;
  support_conversation_id: string | null;
  last_message_at: string | null;
  resolved_at: string | null;
  total_tokens_in: number;
  total_tokens_out: number;
  total_cost_usd: string | number;
  device_metadata: unknown;
  ip_address: string | null;
  user_agent: string | null;
  createdAt: string;
  updatedAt: string;
  messages: SmileAiConversationMessage[];
  handoffs: SmileAiHandoffSummary[];
  feedback: Array<{
    id: string;
    message_id: string | null;
    kind: string;
    rating: number | null;
    reason: string | null;
    createdAt: string;
  }>;
  executions: Array<{
    id: string;
    action_id: string;
    action_name: string;
    safety: string;
    status: string;
    input: unknown;
    output: unknown;
    error: unknown;
    latency_ms: number | null;
    cost_usd: string | null;
    createdAt: string;
  }>;
  notes: SmileAiAdminNote[];
}

// ─── Handoffs admin ────────────────────────────────────────────────────────

export interface SmileAiHandoffRow {
  id: string;
  conversation_id: string;
  conversation: {
    id: string;
    user_id: string | null;
    user_email: string | null;
    status: SmileAiConvStatus;
    persona: { name: string } | null;
  } | null;
  trigger: string;
  summary: string;
  summary_preview: string;
  entities: Record<string, unknown>;
  support_conversation_id: string | null;
  support_conversation: {
    id: string;
    status: string;
    assigned_to: string | null;
  } | null;
  createdAt: string;
}

// ─── Feedback admin ────────────────────────────────────────────────────────

export interface SmileAiFeedbackRow {
  id: string;
  kind: "thumbs_up" | "thumbs_down" | "rating" | "flag";
  rating: number | null;
  reason: string | null;
  conversation_id: string;
  message_id: string | null;
  message: {
    id: string;
    role: string;
    content: string;
    citations: unknown[];
    createdAt: string;
  } | null;
  conversation: {
    id: string;
    status: SmileAiConvStatus;
    user_email: string | null;
    user: { id: string; email: string | null; name: string | null } | null;
  } | null;
  createdAt: string;
}

// ─── Analytics ─────────────────────────────────────────────────────────────

export interface SmileAiOverview {
  range: "24h" | "7d" | "30d";
  since: string;
  conversations: {
    total: number;
    active_now: number;
    prev_total: number;
    delta_pct: number | null;
  };
  deflection: {
    resolved_by_ai: number;
    resolved_by_human: number;
    rate: number | null;
  };
  handoff: {
    count: number;
    rate: number | null;
    prev_count: number;
    delta_pct: number | null;
  };
  feedback: {
    thumbs_up: number;
    thumbs_down: number;
    ratio: number | null;
    csat_avg: number | null;
    csat_count: number;
  };
  tokens: { in: number; out: number };
  cost_usd: number;
  today: {
    messages: number;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
  };
  active_provider: {
    id: string;
    name: string;
    driver: string;
    model: string;
  } | null;
  active_embeddings: {
    id: string;
    name: string;
    driver: string;
    model: string;
  } | null;
  active_vector_store: {
    id: string;
    name: string;
    driver: string;
    index_name: string;
    dimensions: number;
  } | null;
}

export interface SmileAiSparkline {
  metric: string;
  range: "7d" | "30d";
  points: Array<{ date: string; value: number }>;
}

export interface SmileAiCostBreakdown {
  range: "7d" | "30d";
  since: string;
  total: { cost_usd: number; tokens_in: number; tokens_out: number };
  by_provider: Array<{
    key: string;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
  }>;
  by_category: Array<{
    key: string;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
  }>;
  by_day: Array<{
    date: string;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
  }>;
}

export interface SmileAiActionAnalyticsRow {
  action_id: string;
  name: string;
  display_name: string;
  safety: string;
  total: number;
  success: number;
  failed: number;
  success_rate: number | null;
  p50_ms: number | null;
  p95_ms: number | null;
}

export interface SmileAiCoverageGap {
  query: string;
  count: number;
  last_seen: string;
  sample_conversations: string[];
  had_citations: number;
  had_no_citations: number;
}

// ─── Settings ──────────────────────────────────────────────────────────────

export interface SmileAiLimits {
  per_user_per_minute: number;
  per_conversation_max_messages: number;
  per_user_per_day_messages: number;
  per_turn_max_tokens: number;
  per_conversation_max_cost_usd: number;
  per_user_per_day_cost_usd: number;
  global_daily_cost_usd: number;
  emergency_switch_off: boolean;
}

export interface SmileAiSafety {
  never_disclose_patterns: string[];
  refusal_copy: string;
  persona_policy: string[];
}

export interface SmileAiSettingsResponse<T> {
  key: string;
  value: T;
  defaults: T;
  updatedAt: string | null;
  updated_by: string | null;
}
