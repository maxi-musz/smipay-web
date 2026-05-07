// User Profile Types

export interface TierLimits {
  singleTransaction: number;
  daily: number;
  monthly: number;
  airtimeDaily: number;
}

export interface CurrentTier {
  tier: string;
  name: string;
  description: string;
  requirements: string[];
  limits: TierLimits;
  is_active: boolean;
}

export interface AvailableTier {
  id: string;
  tier: string;
  name: string;
  description: string;
  order: number;
  requirements: string[];
  limits: TierLimits;
  is_current: boolean;
}

export interface ReferralAnalysis {
  total_referred: number;
  by_status: {
    pending?: number;
    eligible?: number;
    rewarded?: number;
    partially_rewarded?: number;
    expired?: number;
    rejected?: number;
  };
  referrer_rewards_issued: number;
  referrer_rewards_total_amount: number;
  referee_rewards_issued: number;
  referee_rewards_total_amount: number;
  slots_remaining: number;
  program_config?: {
    is_active?: boolean;
    referrer_reward_amount?: number;
    referee_reward_amount?: number;
    reward_trigger?: string;
    max_referrals_per_user?: number;
    min_transaction_amount?: number;
  };
}

export interface UserProfile {
  user: {
    id: string;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    is_verified: boolean;
    is_email_verified: boolean;
    is_phone_verified?: boolean;
    account_status?: string;
    phone_number: string;
    profile_image: string;
    gender: string;
    date_of_birth: string;
    joined: string;
    totalCards: number;
    totalAccounts: number;
    wallet_balance: number;
    smipay_tag: string;
    referral_code?: string;
    requested_account_deletion: boolean;
    role?: string;
    isTransactionPinSetup?: boolean;
  };
  address: {
    id: string;
    house_no: string;
    city: string;
    state: string;
    country: string;
    house_address: string;
    postal_code: string;
  };
  kyc_verification: {
    id: string;
    is_active: boolean;
    status: string;
    id_type: string;
    id_number: string;
  };
  wallet_card: {
    id: string;
    current_balance: string;
    all_time_fuunding: string;
    all_time_withdrawn: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  current_tier?: CurrentTier;
  available_tiers?: AvailableTier[];
  referral_analysis?: ReferralAnalysis;
}

export interface UserProfileResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}

