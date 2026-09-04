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
