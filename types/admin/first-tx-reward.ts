// --- Config ---

export interface FirstTxRewardConfig {
  id: string;
  is_active: boolean;
  reward_amount: number;
  min_transaction_amount: number;
  eligible_transaction_types: string[];
  budget_limit: number | null;
  max_recipients: number | null;
  start_date: string | null;
  end_date: string | null;
  require_kyc: boolean;
  updated_by: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FirstTxRewardConfigPayload {
  is_active?: boolean;
  reward_amount?: number;
  min_transaction_amount?: number;
  eligible_transaction_types?: string[];
  budget_limit?: number | null;
  max_recipients?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  require_kyc?: boolean;
}

export interface FirstTxRewardStats {
  total_recipients: number;
  total_given: number;
  budget_remaining: number | null;
  recipient_slots_remaining: number | null;
}

// --- Analytics ---

export interface FirstTxRewardAnalyticsOverview {
  total_recipients: number;
  total_given: number;
  budget_remaining: number | null;
  recipient_slots_remaining: number | null;
}

export interface FirstTxRewardPeriodStat {
  recipients: number;
  amount_given?: number;
}

export interface FirstTxRewardTriggerBreakdown {
  transaction_type: string;
  count: number;
  total_amount: number;
}

export interface FirstTxRewardAnalytics {
  overview: FirstTxRewardAnalyticsOverview;
  today: FirstTxRewardPeriodStat;
  this_week: FirstTxRewardPeriodStat;
  this_month: FirstTxRewardPeriodStat;
  by_trigger_type: FirstTxRewardTriggerBreakdown[];
}

// --- History ---

export interface FirstTxRewardHistoryItem {
  id: string;
  user_id: string;
  reward_amount: number;
  transaction_ref: string;
  source_transaction_ref: string;
  source_transaction_type: string;
  source_amount: number;
  createdAt: string;
}

export interface FirstTxRewardHistoryMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface FirstTxRewardHistoryFilters {
  page: number;
  limit: number;
  user_id: string;
  source_transaction_type: string;
  date_from: string;
  date_to: string;
}

// --- Responses (ApiResponseDto wrapper) ---

export interface FirstTxRewardConfigResponse {
  success: boolean;
  message: string;
  data: {
    config: FirstTxRewardConfig;
    stats: FirstTxRewardStats;
  };
}

export interface FirstTxRewardUpdateResponse {
  success: boolean;
  message: string;
  data: FirstTxRewardConfig;
}

export interface FirstTxRewardAnalyticsResponse {
  success: boolean;
  message: string;
  data: {
    config: FirstTxRewardConfig;
    analytics: FirstTxRewardAnalytics;
  };
}

export interface FirstTxRewardHistoryResponse {
  success: boolean;
  message: string;
  data: {
    history: FirstTxRewardHistoryItem[];
    meta: FirstTxRewardHistoryMeta;
  };
}

// --- Display helpers ---

export const FIRST_TX_TRANSACTION_TYPES: {
  value: string;
  label: string;
  color: string;
}[] = [
  { value: "airtime", label: "Airtime", color: "blue" },
  { value: "data", label: "Data", color: "purple" },
  { value: "transfer", label: "Transfer", color: "indigo" },
  { value: "deposit", label: "Deposit", color: "orange" },
  { value: "cable", label: "Cable TV", color: "pink" },
  { value: "electricity", label: "Electricity", color: "amber" },
  { value: "education", label: "Education", color: "emerald" },
  { value: "betting", label: "Betting", color: "red" },
];

export const ALL_ELIGIBLE_TX_TYPES = FIRST_TX_TRANSACTION_TYPES.map(
  (t) => t.value,
);
