export interface AdminDashboardUsers {
  total: number;
  new_today: number;
  new_this_week: number;
  active: number;
  suspended: number;
}

export interface AdminDashboardTransactions {
  total_today: number;
  total_volume_today: number;
  pending_count: number;
  failed_count: number;
  success_count: number;
}

export interface AdminDashboardSupport {
  open_tickets: number;
  pending_tickets: number;
  escalated_tickets: number;
}

export interface AdminDashboardWallets {
  total_balance_all_users: number;
  total_funded_today: number;
}

export interface AdminDashboardKYC {
  pending: number;
  approved_today: number;
  approved_this_week: number;
  rejected: number;
}

export interface AdminDashboardCompliance {
  flagged_audit_logs: number;
  security_events_today: number;
}

export interface AdminDashboardCards {
  total_active: number;
  issued_today: number;
}

export interface AdminDashboardReferrals {
  today: number;
  this_week: number;
}

export interface AdminDashboardRevenuePeriod {
  markup: number;
  vtpass_commission: number;
  total: number;
}

export interface AdminDashboardRevenue {
  markup_today: number;
  markup_this_week: number;
  vtpass_commission_today?: number;
  vtpass_commission_this_week?: number;
  total_revenue_today?: number;
  total_revenue_this_week?: number;
  this_month?: AdminDashboardRevenuePeriod;
  last_month?: AdminDashboardRevenuePeriod;
  all_time?: AdminDashboardRevenuePeriod;
}

export type AdminActionItemType =
  | "escalated_tickets"
  | "flagged_audits"
  | "pending_kyc"
  | "pending_transactions";

export interface AdminActionItem {
  type: AdminActionItemType;
  count: number;
}

export interface AdminDashboardTierDistribution {
  [tier: string]: number;
}

export interface AdminDashboardData {
  users: AdminDashboardUsers;
  transactions: AdminDashboardTransactions;
  support: AdminDashboardSupport;
  wallets: AdminDashboardWallets;
  kyc: AdminDashboardKYC;
  compliance: AdminDashboardCompliance;
  cards: AdminDashboardCards;
  referrals: AdminDashboardReferrals;
  tier_distribution: AdminDashboardTierDistribution;
  revenue: AdminDashboardRevenue;
  action_items: AdminActionItem[];
}

export interface AdminDashboardResponse {
  success: boolean;
  message: string;
  data: AdminDashboardData;
}
