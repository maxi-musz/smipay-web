// --- Enums ---

export const TRANSACTION_STATUSES = [
  { value: "success", label: "Successful", color: "emerald" },
  { value: "pending", label: "Pending", color: "amber" },
  { value: "failed", label: "Failed", color: "red" },
  { value: "cancelled", label: "Cancelled", color: "slate" },
] as const;

export const TRANSACTION_TYPES = [
  { value: "transfer", label: "Transfer" },
  { value: "deposit", label: "Deposit" },
  { value: "airtime", label: "Airtime" },
  { value: "data", label: "Data" },
  { value: "cable", label: "Cable" },
  { value: "education", label: "Education" },
  { value: "betting", label: "Betting" },
] as const;

export const CREDIT_DEBIT = [
  { value: "credit", label: "Credit" },
  { value: "debit", label: "Debit" },
] as const;

export const PAYMENT_CHANNELS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "smipay_tag", label: "Smipay Tag" },
  { value: "paystack", label: "Paystack" },
  { value: "flutterwave", label: "Flutterwave" },
  { value: "other", label: "Other" },
] as const;

export const PAYMENT_METHODS = [
  { value: "paystack", label: "Paystack" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "wallet", label: "Wallet" },
  { value: "ussd", label: "USSD" },
] as const;

// --- Analytics ---

export interface TransactionOverview {
  total_transactions: number;
  total_volume: number;
  total_revenue: number;
  vtpass_commission?: number;
  total_revenue_including_commission?: number;
  avg_amount: number;
  min_amount: number;
  max_amount: number;
}

export interface TransactionActivity {
  today_count: number;
  today_volume: number;
  week_count: number;
  week_volume: number;
  month_count: number;
  month_volume: number;
  volume_growth_percent: number;
}

export interface StatusBreakdownItem {
  count: number;
  volume: number;
}

/** Dev-only: per-row main delta vs amount+cashback (same rules as Balance column check). */
export interface TransactionRowWalletRollups {
  checks_out: number;
  doesnt_check: number;
}

export interface TransactionAnalytics {
  overview: TransactionOverview;
  activity: TransactionActivity;
  by_status: Record<string, StatusBreakdownItem>;
  by_type: Record<string, StatusBreakdownItem>;
  by_channel: Record<string, StatusBreakdownItem>;
  row_wallet_rollups?: TransactionRowWalletRollups;
  row_wallet_rollups_capped?: boolean;
}

// --- User brief (embedded in transaction) ---

export interface TransactionUserBrief {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string;
  smipay_tag: string | null;
  role: string;
  account_status: string;
  profile_image: { secure_url: string } | null;
  /** Live wallet rollups (same shape as admin users list for Balance column parity) */
  wallet?: {
    current_balance: number;
    all_time_fuunding?: number;
    all_time_withdrawn?: number;
  } | null;
  cashbackWallet?: {
    current_balance: number;
    all_time_earned?: number;
    all_time_withdrawn?: number;
  } | null;
}

// --- Transaction item (list view) ---

export interface TransactionItem {
  id: string;
  user_id: string;
  amount: number | null;
  provider: string | null;
  data_plan_name?: string | null;
  transaction_type: string | null;
  credit_debit: string | null;
  description: string | null;
  status: string | null;
  recipient_mobile: string | null;
  currency_type: string | null;
  payment_method: string | null;
  payment_channel: string | null;
  commission: number | null;
  commission_smipay_earned: number | null;
  fee: number | null;
  balance_before: number;
  balance_after: number;
  cashback_balance_before?: number | null;
  cashback_used?: number | null;
  cashback_balance_after?: number | null;
  cashback_earned?: number | null;
  transaction_number: string | null;
  transaction_reference: string | null;
  session_id: string | null;
  markup_value: number | null;
  createdAt: string;
  updatedAt: string;
  sender_details: {
    sender_name: string;
    sender_bank: string;
    sender_account_number: string;
  } | null;
  icon: { secure_url: string } | null;
  user: TransactionUserBrief | null;
}

// --- Transaction detail (single view) ---

export interface TransactionDetailUser extends TransactionUserBrief {
  wallet: {
    current_balance: number;
    all_time_fuunding?: number;
    all_time_withdrawn?: number;
  } | null;
  tier: { tier: string; name: string } | null;
}

export interface TransactionCounterpart {
  id: string;
  user_id: string;
  amount: number;
  credit_debit: string;
  balance_before: number;
  balance_after: number;
  status: string;
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    smipay_tag: string | null;
  };
}

/** Wallet integrity check (admin transaction detail). */
export interface AdminWalletAnalysis {
  enforcement_skipped: boolean;
  enforcement_skip_reason?: string;
  tolerance_ngn: number;
  main: {
    current_balance: number;
    all_time_funding: number;
    all_time_withdrawn: number;
    expected_balance: number;
    delta: number;
    ok: boolean;
  };
  cashback: {
    current_balance: number;
    all_time_earned: number;
    all_time_withdrawn: number;
    expected_balance: number;
    delta: number;
    ok: boolean;
  } | null;
}

export interface TransactionDetail extends Omit<TransactionItem, "user"> {
  account_id: string | null;
  vtpass_amount: number | null;
  smipay_amount: number | null;
  markup_percent: number | null;
  authorization_url: string | null;
  electricity_token: string | null;
  meta_data: Record<string, unknown> | null;
  user: TransactionDetailUser | null;
  counterpart: TransactionCounterpart | null;
  wallet_analysis?: AdminWalletAnalysis | null;
}

// --- List meta ---

export interface TransactionListMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  /** When set, `limit` / `page` / `total_pages` refer to ledger display rows, not raw tx count. */
  ledger_slots_total?: number;
  ledger_slots_pagination?: boolean;
}

// --- Filters ---

export interface TransactionFilters {
  page: number;
  limit: number;
  search: string;
  status: string;
  transaction_type: string;
  credit_debit: string;
  payment_channel: string;
  user_id: string;
  min_amount: string;
  max_amount: string;
  date_from: string;
  date_to: string;
  sort_by: string;
  sort_order: string;
  /** Dev-only: filter list by row wallet check (`ok` / `fail`). */
  wallet_integrity: "" | "ok" | "fail";
}

// --- API Responses ---

export interface TransactionListResponse {
  success: boolean;
  message: string;
  data: {
    analytics: TransactionAnalytics;
    transactions: TransactionItem[];
    meta: TransactionListMeta;
  };
}

export interface TransactionDetailResponse {
  success: boolean;
  message: string;
  data: TransactionDetail;
}

export interface TransactionFlagResponse {
  success: boolean;
  message: string;
  data: null;
}
