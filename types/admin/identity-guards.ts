export type GuardField = "phone" | "email" | "name" | "bvn";
export type GuardMode = "off" | "monitor" | "enforce";
export type RuleAction = "block" | "flag";
export type GuardVerdict = "pass" | "flag" | "would_block" | "block";

export const GUARD_FIELDS: readonly GuardField[] = [
  "phone",
  "email",
  "name",
  "bvn",
] as const;

export const GUARD_MODES: readonly GuardMode[] = [
  "off",
  "monitor",
  "enforce",
] as const;

export type GuardSurface =
  | "registration"
  | "kyc"
  | "profile_update"
  | "support"
  | "flutterwave_bvn"
  | "auto_dva"
  | "paystack_customer"
  | "flutterwave_virtual_account";

export type SurfaceMode = "inherit" | GuardMode;
export type SurfaceKind = "input" | "provider_gate";

export interface GuardSurfaceInfo {
  key: GuardSurface;
  label: string;
  description: string;
  kind: SurfaceKind;
  fields: GuardField[];
  mode: SurfaceMode;
  default_mode: SurfaceMode;
  allowed_modes: SurfaceMode[];
}

export type ParamKind =
  | "number"
  | "string"
  | "string_list"
  | "boolean"
  | "enum"
  | "json";

export interface ParamDescriptor {
  key: string;
  label: string;
  help?: string;
  kind: ParamKind;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface RuleTypeDescriptor {
  type: string;
  label: string;
  description: string;
  fields: GuardField[];
  custom_allowed: boolean;
  params: ParamDescriptor[];
}

export interface IdentityGuardRule {
  id: string | null;
  key: string;
  field: GuardField;
  type: string;
  label: string;
  description: string | null;
  params: Record<string, unknown>;
  action: RuleAction;
  enabled: boolean;
  message: string | null;
  is_system: boolean;
  sort_order: number;
  hit_count: number;
  last_hit_at: string | null;
  is_modified: boolean;
  updated_by: string | null;
  updatedAt: string | null;
  problem?: string | null;
}

export interface GuardFieldInfo {
  key: GuardField;
  label: string;
  description: string;
  floor: string;
}

export interface DisposablePolicyNote {
  enforcement_mode: string;
  block_disposable_email: boolean;
  effective_blocking: boolean;
}

export interface IdentityGuardConfigResponse {
  migration_pending: boolean;
  surfaces_migration_pending?: boolean;
  seeded_at: string | null;
  modes: Record<GuardField, GuardMode>;
  default_modes: Record<GuardField, GuardMode>;
  fields: GuardFieldInfo[];
  rules: IdentityGuardRule[];
  rule_types: RuleTypeDescriptor[];
  surfaces?: GuardSurfaceInfo[];
  notes: {
    bvn_sandbox: boolean;
    disposable_policy: DisposablePolicyNote;
  };
}

export interface DraftRule {
  field: GuardField;
  type: string;
  params: Record<string, unknown>;
  action: RuleAction;
  label?: string;
  message?: string;
}

export type TraceSkipReason =
  | "disabled"
  | "mode_off"
  | "sandbox"
  | "domain_allowed"
  | "dns_not_run"
  | "no_data"
  | "error"
  | "timeout";

export interface SimulationTraceItem {
  key: string;
  label: string;
  type: string;
  action: RuleAction;
  enabled: boolean;
  hit: boolean;
  detail?: string;
  draft?: boolean;
  skipped?: TraceSkipReason | string;
  part?: "first_name" | "middle_name" | "last_name" | "full_name";
}

export interface EmailPipelineResult {
  ran: boolean;
  valid: boolean;
  reason?: string;
  message?: string;
  suggestion?: string;
  disposable_source?: string;
  matched?: string;
  would_block: boolean;
  mx?: { ok: boolean; hosts: string[]; inconclusive: boolean };
}

export interface SimulationResult {
  input: string;
  normalized: string | null;
  floor: { passed: boolean; message?: string };
  verdict: GuardVerdict;
  user_message: string | null;
  code: string | null;
  trace: SimulationTraceItem[];
  email_pipeline?: EmailPipelineResult;
}

export interface SimulateResponse {
  field: GuardField;
  mode: GuardMode;
  results: SimulationResult[];
}

export interface SimulatePayload {
  field: GuardField;
  value?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  values?: string[];
  draft_rule?: DraftRule;
  include_dns?: boolean;
  include_lists?: boolean;
}

export interface BacktestRuleResult {
  key: string;
  label: string;
  action: RuleAction;
  hits: number;
  hits_bvn_verified: number;
  examples: { value: string; bvn_verified: boolean; user_id: string }[];
}

export type MxTier =
  | "trusted"
  | "suffix"
  | "A"
  | "none"
  | "inconclusive"
  | "not_checked";

export interface BacktestEmailDomainInsight {
  domain: string;
  users: number;
  bvn_verified_users: number;
  mx_tier: MxTier;
}

export interface BacktestResponse {
  field: GuardField;
  mode: GuardMode;
  sample_size: number;
  scanned: number;
  duration_ms: number;
  totals: {
    block: number;
    flag: number;
    pass: number;
    block_bvn_verified: number;
    flag_bvn_verified: number;
  };
  rules: BacktestRuleResult[];
  insights?: {
    email_domains_blocked?: BacktestEmailDomainInsight[];
    bvn_prefixes?: { prefix: string; count: number }[];
  };
}

export interface BacktestPayload {
  field: GuardField;
  sample_size?: number;
  draft_rule?: DraftRule;
}

export const BACKTEST_DRAFT_KEY = "draft";

export const BACKTEST_SAMPLE_MIN = 100;
export const BACKTEST_SAMPLE_MAX = 5000;
export const BACKTEST_SAMPLE_DEFAULT = 2000;
export const SIMULATE_BATCH_MAX = 50;

export interface ActivityItem {
  id: string;
  createdAt: string;
  field: GuardField | null;
  verdict: GuardVerdict | null;
  source: string | null;
  surface?: string | null;
  rule_keys: string[];
  value: string | null;
  user_id: string | null;
  phone_number: string | null;
  ip_address: string | null;
  device_id: string | null;
}

export type ActivityFieldSummary = Record<
  GuardField,
  { block: number; would_block: number; flag: number }
>;

export interface ActivityResponse {
  items: ActivityItem[];
  meta: { page: number; limit: number; total: number; pages: number };
  summary: {
    by_field: ActivityFieldSummary;
    top_email_domains: { domain: string; count: number }[];
  };
}

export interface ActivityQuery {
  page?: number;
  limit?: number;
  field?: GuardField;
  verdict?: Exclude<GuardVerdict, "pass">;
  source?: string;
  surface?: GuardSurface;
}

export interface CreateRulePayload {
  field: GuardField;
  type: string;
  label: string;
  description?: string;
  params: Record<string, unknown>;
  action: RuleAction;
  enabled?: boolean;
  message?: string;
}

export interface UpdateRulePayload {
  label?: string;
  description?: string;
  params?: Record<string, unknown>;
  action?: RuleAction;
  enabled?: boolean;
  message?: string | null;
  sort_order?: number;
}

export interface RestoreDefaultsResult {
  created: number;
  rules: IdentityGuardRule[];
}

export type EmailDomainRuleKind = "DOMAIN" | "MX_HOST";
export type EmailDomainRuleAction = "BLOCK" | "ALLOW";

export interface EmailDomainRuleRow {
  id: string;
  pattern: string;
  kind: EmailDomainRuleKind;
  action: EmailDomainRuleAction;
  note: string | null;
  hit_count: number;
  last_hit_at: string | null;
  created_by: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailDomainRulePayload {
  pattern: string;
  kind: EmailDomainRuleKind;
  action: EmailDomainRuleAction;
  note?: string;
}

export interface UpdateEmailDomainRulePayload {
  pattern?: string;
  action?: EmailDomainRuleAction;
  note?: string;
}

export interface IdentityGuardsEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
}
