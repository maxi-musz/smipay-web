// --- Config ---

export interface CashbackConfig {
  id: string;
  is_active: boolean;
  default_percentage: number;
  max_cashback_per_transaction: number;
  max_cashback_per_day: number;
  min_transaction_amount: number;
  updated_by: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CashbackConfigPayload {
  is_active?: boolean;
  default_percentage?: number;
  max_cashback_per_transaction?: number;
  max_cashback_per_day?: number;
  min_transaction_amount?: number;
}

// --- Rules ---

export type CashbackServiceType =
  | "airtime"
  | "data"
  | "cable"
  | "electricity"
  | "education"
  | "betting"
  | "international_airtime";

export interface CashbackRule {
  id: string;
  service_type: CashbackServiceType;
  is_active: boolean;
  percentage: number;
  max_cashback_amount: number | null;
  min_transaction_amount: number | null;
  updated_by: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CashbackRulePayload {
  service_type?: CashbackServiceType;
  percentage?: number;
  is_active?: boolean;
  max_cashback_amount?: number | null;
  min_transaction_amount?: number | null;
}

// --- Analytics ---

export interface CashbackServiceBreakdown {
  service_type: string;
  total_amount: number;
  transaction_count: number;
}

export interface CashbackAnalyticsData {
  total_cashback_given: number;
  total_transactions: number;
  today_cashback_given: number;
  today_transactions: number;
  unique_users: number;
  by_service: CashbackServiceBreakdown[];
}

// --- History ---

export interface CashbackHistoryItem {
  id: string;
  user_id: string;
  amount: number;
  service_type: string;
  transaction_ref: string;
  percentage_applied: number;
  source_amount: number;
  status: "credited" | "reversed" | "withdrawn";
  createdAt: string;
}

export interface CashbackHistoryMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CashbackHistoryFilters {
  page: number;
  limit: number;
  user_id: string;
  service_type: string;
  date_from: string;
  date_to: string;
}

// --- Responses ---

export interface CashbackConfigResponse {
  success: boolean;
  message: string;
  data: {
    config: CashbackConfig;
    rules: CashbackRule[];
  };
}

export interface CashbackRulesResponse {
  success: boolean;
  message: string;
  data: CashbackRule[];
}

export interface CashbackRuleResponse {
  success: boolean;
  message: string;
  data: CashbackRule;
}

export interface CashbackSeedResponse {
  success: boolean;
  message: string;
  data: CashbackRule[];
}

export interface CashbackAnalyticsResponse {
  success: boolean;
  message: string;
  data: {
    config: CashbackConfig;
    rules: CashbackRule[];
    analytics: CashbackAnalyticsData;
  };
}

export interface CashbackHistoryResponse {
  success: boolean;
  message: string;
  data: {
    history: CashbackHistoryItem[];
    meta: CashbackHistoryMeta;
  };
}

// --- Display helpers ---

export const CASHBACK_SERVICE_TYPES: {
  value: CashbackServiceType;
  label: string;
  color: string;
}[] = [
  { value: "airtime", label: "Airtime", color: "blue" },
  { value: "data", label: "Data", color: "purple" },
  { value: "cable", label: "Cable TV", color: "pink" },
  { value: "electricity", label: "Electricity", color: "amber" },
  { value: "education", label: "Education", color: "emerald" },
  { value: "betting", label: "Betting", color: "red" },
  { value: "international_airtime", label: "Intl Airtime", color: "cyan" },
];

export const CASHBACK_STATUS_COLORS: Record<string, string> = {
  credited: "emerald",
  reversed: "red",
  withdrawn: "amber",
};
