// --- Analytics ---

export interface ReferralOverview {
  total_referrals: number;
  today: number;
  this_week: number;
  this_month: number;
  total_rewarded: number;
  total_paid_out: number;
}

export interface ReferralConfig {
  is_active: boolean;
  referrer_reward: number;
  referee_reward: number;
  reward_trigger: string;
  max_per_user: number;
  expiry_days: number;
  min_tx_amount: number;
}

export interface ReferralAnalytics {
  overview: ReferralOverview;
  by_status: Record<string, number>;
  config: ReferralConfig;
}

// --- User brief ---

export interface ReferralUserBrief {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  smipay_tag: string | null;
  phone_number?: string | null;
  profile_image: { secure_url: string } | null;
}

// --- Referral item ---

export interface ReferralItem {
  id: string;
  referrer_id: string;
  referee_user_id: string | null;
  referee_phone_number: string | null;
  referral_code_used: string;
  status: string;
  is_active: boolean;
  referee_registered: boolean;
  referee_registered_at: string | null;
  referee_first_tx: boolean;
  referee_first_tx_at: string | null;
  referrer_reward_given: boolean;
  referrer_reward_amount: number | null;
  referrer_reward_given_at: string | null;
  referee_reward_given: boolean;
  referee_reward_amount: number | null;
  referee_reward_given_at: string | null;
  manually_approved: boolean;
  manually_rejected: boolean;
  createdAt: string;
  referrer: ReferralUserBrief;
  referee: ReferralUserBrief | null;
}

// --- List response ---

export interface ReferralListMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ReferralListResponse {
  success: boolean;
  message: string;
  data: {
    analytics: ReferralAnalytics;
    referrals: ReferralItem[];
    meta: ReferralListMeta;
  };
}

// --- Top referrers ---

export interface TopReferrerEntry {
  user: ReferralUserBrief;
  referral_count: number;
  total_earned: number;
}

export interface TopReferrersResponse {
  success: boolean;
  message: string;
  data: {
    leaderboard: TopReferrerEntry[];
  };
}

// --- Config update ---

export interface ReferralConfigPayload {
  is_active?: boolean;
  referrer_reward_amount?: number;
  referee_reward_amount?: number;
  reward_trigger?: string;
  max_referrals_per_user?: number;
  referral_expiry_days?: number;
  min_transaction_amount?: number;
}

export interface ReferralConfigFull extends ReferralConfig {
  id?: string;
  referrer_reward_amount?: number;
  referee_reward_amount?: number;
  max_referrals_per_user?: number;
  referral_expiry_days?: number;
  min_transaction_amount?: number;
  updated_by?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface ReferralConfigResponse {
  success: boolean;
  message: string;
  data: ReferralConfigFull;
}

// --- Mutations ---

export interface ReferralRejectPayload {
  reason: string;
}

export interface ReferralMutationResponse {
  success: boolean;
  message: string;
  data: ReferralItem;
}

// --- Filters ---

export interface ReferralFilters {
  page: number;
  limit: number;
  search: string;
  status: string;
  referrer_id: string;
  date_from: string;
  date_to: string;
}

// --- Enums ---

export const REFERRAL_STATUSES = [
  { value: "pending", label: "Pending", color: "amber" },
  { value: "eligible", label: "Eligible", color: "blue" },
  { value: "rewarded", label: "Rewarded", color: "emerald" },
  { value: "partially_rewarded", label: "Partial", color: "orange" },
  { value: "expired", label: "Expired", color: "slate" },
  { value: "rejected", label: "Rejected", color: "red" },
] as const;

export const REWARD_TRIGGERS = [
  { value: "first_transaction", label: "First Transaction" },
  { value: "kyc_verified", label: "KYC Verified" },
  { value: "registration", label: "Registration" },
] as const;
