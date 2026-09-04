export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface MetricDefinition {
  key: string;
  label: string;
  description: string;
  group: string;
  is_money: boolean;
}

export interface RewardsReport {
  period: { from: string; to: string; label: string };
  generated_at: string;
  selected_metrics: string[];
  rewards_paid_out: number;
  metrics: {
    cashback_earned?: { total: number; count: number };
    first_tx_rewards?: { total: number; count: number };
    referral_bonuses?: {
      total: number;
      referrer_total: number;
      referee_total: number;
      count: number;
    };
    user_deposits?: {
      total: number;
      count: number;
      current_total: number;
      current_count: number;
      legacy_total: number;
      legacy_count: number;
      fake_total: number;
      fake_count: number;
    };
    total_transactions?: {
      count: number;
      success_count: number;
      success_volume: number;
    };
    markup_revenue?: { total: number; vtpass_commission: number };
    vtpass_reconciliation?: {
      partner: string;
      loaded: number;
      loaded_entries: number;
      used: number;
      remaining: number;
      smipay_charged: number;
      markup_revenue: number;
      transactions: number;
      usage_estimated: boolean;
    };
    forged_webhook_summary?: {
      incident: string;
      forged_total: number;
      clawed_back: number;
      net_lost: number;
      accounts: number;
    };
    new_users?: { count: number };
  };
}

export interface PartnerLoadingEntry {
  id: string;
  partner: string;
  amount: number;
  loaded_at: string;
  reference?: string | null;
  note?: string | null;
  created_by?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerLoadingList {
  entries: PartnerLoadingEntry[];
  total_loaded: number;
}

export interface ForgedEvent {
  event_time: string;
  amount: number;
  reference: string | null;
  user: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    account_status: string | null;
    joined_at: string;
  } | null;
  device: {
    model: string | null;
    platform: string | null;
    os_version: string | null;
    app_version: string | null;
    ip_address: string | null;
    location: string | null;
    first_seen_at: string | null;
  } | null;
  forged_payload: {
    paystack_id: string | null;
    amount_kobo: number | null;
    channel: string | null;
    customer_code: string | null;
    gateway_response: string | null;
    domain: string | null;
  };
}

export interface VtpassBalance {
  balance: number;
  currency: "NGN";
  environment: "live" | "sandbox";
  fetched_at: string;
  cached: boolean;
  stale?: boolean;
}

export interface FundingAccount {
  bank_name?: string;
  account_number?: string;
  account_name?: string;
}

export interface PartnerBalance {
  key: string;
  label: string;
  balance: number | null;
  currency: string;
  environment?: string;
  stale?: boolean;
  error?: string | null;
  funding_account?: FundingAccount | null;
}

export interface PartnerBalances {
  partners: PartnerBalance[];
  refresh_interval_seconds: number;
  fetched_at: string;
}

export interface PartnerBalancesConfig {
  id: string;
  refresh_interval_seconds: number;
  funding_accounts: Record<string, FundingAccount>;
  updated_by?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ForgedIncidentEvents {
  incident: string;
  total_events: number;
  distinct_accounts: number;
  first_event_at: string | null;
  events: ForgedEvent[];
}

export interface GenerateReportPayload {
  date_from: string;
  date_to: string;
  metrics: string[];
  partner?: string;
}

export interface CreatePartnerLoadingPayload {
  partner?: string;
  amount: number;
  loaded_at: string;
  reference?: string;
  note?: string;
}
