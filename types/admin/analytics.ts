import type { ApiResponse } from "@/types/admin/management";

export type { ApiResponse };

export interface RangeMeta {
  from: string;
  to: string;
  days: number;
}

export interface Cat {
  label: string;
  count: number;
}

export interface OverviewData {
  range: RangeMeta;
  kpis: {
    total_users: number;
    new_users: number;
    new_users_delta_pct: number;
    active_users: number;
    transactions_count: number;
    transactions_volume: number;
    volume_delta_pct: number;
    success_rate: number;
    revenue: number;
    revenue_delta_pct: number;
    funded_amount: number;
    kyc_approved: number;
    referrals: number;
  };
  trend: {
    date: string;
    new_users: number;
    transactions_count: number;
    transactions_volume: number;
    revenue: number;
  }[];
}

export interface UsersData {
  range: RangeMeta;
  kpis: {
    total_users: number;
    new_users: number;
    new_users_delta_pct: number;
    active_dau: number;
    active_wau: number;
    active_mau: number;
    stickiness: number;
  };
  signups: { date: string; new_users: number; cumulative: number }[];
  funnel: { step: string; count: number }[];
  by_tier: Cat[];
  by_status: Cat[];
  by_gender: Cat[];
  by_location: Cat[];
}

export interface TransactionsData {
  range: RangeMeta;
  type_filter: string | null;
  kpis: {
    count: number;
    volume: number;
    avg_value: number;
    markup_revenue: number;
  };
  trend: {
    date: string;
    transactions_count: number;
    transactions_volume: number;
    success: number;
    failed: number;
  }[];
  by_type: { label: string; count: number; volume: number }[];
  by_status: Cat[];
  by_provider: { label: string; count: number; volume: number }[];
  by_channel: Cat[];
}

export interface RevenueData {
  range: RangeMeta;
  kpis: {
    markup_revenue: number;
    commission_revenue: number;
    gross_revenue: number;
    gross_delta_pct: number;
    funded_amount: number;
    payouts: number;
    net_revenue: number;
  };
  trend: { date: string; markup: number; commission: number; gross: number }[];
  by_type: { label: string; revenue: number }[];
}

export interface EngagementData {
  range: RangeMeta;
  kpis: {
    login_success: number;
    login_failed: number;
    login_success_rate: number;
    active_dau: number;
    active_wau: number;
    active_mau: number;
    stickiness: number;
    password_resets: number;
    otp_requests: number;
  };
  login_trend: { date: string; success: number; failed: number }[];
  failed_login_hotspots: { ip: string; count: number }[];
}

export interface DevicesData {
  range: RangeMeta;
  note: string;
  by_platform: Cat[];
  by_device_model: Cat[];
  by_location: Cat[];
}

export interface AnalyticsQuery {
  range?: string;
  from?: string;
  to?: string;
  type?: string;
}
