// Dashboard Data Types - Matches backend API response structure

export interface DashboardUser {
  id: string;
  smipay_tag: string;
  name: string;
  isTransactionPinSetup: boolean;
  phone_number: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  profile_image: string;
  is_email_verified: boolean;
  requested_account_deletion: boolean;
}

export interface BankAccount {
  id: string;
  account_holder_name: string;
  account_number: string;
  bank_name: string;
  currency: string;
  balance: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletCard {
  id: string;
  current_balance: string;
  all_time_fuunding: string;
  all_time_withdrawn: string;
  owned_currencies: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  credit_debit: "credit" | "debit";
  status: "success" | "pending" | "failed";
  date: string;
  sender: string;
  icon?: string;
  // Provider identifier for mapping to logos (e.g. "mtn", "airtel", "glo", "etisalat", "dstv", "gotv", "startimes", "showmax")
  provider?: string | null;
}

export interface KycVerification {
  id: string;
  is_verified: boolean;
  status: "approved" | "pending" | "rejected";
  id_type: string;
  id_no: string;
  bvn: string;
  bvn_verified: boolean;
  watchlisted: boolean;
  initiated_at: string;
  approved_at: string;
  failure_reason: string;
}

export interface AccountTier {
  tier: string;
  name: string;
  description: string;
  requirements: string[];
  limits: {
    singleTransaction: number;
    daily: number;
    monthly: number;
    airtimeDaily: number;
  };
  is_active: boolean;
}

export interface CashbackWallet {
  current_balance: string;
  all_time_earned: string;
  all_time_withdrawn: string;
}

export interface CashbackRate {
  service: string;
  percentage: number;
  is_active: boolean;
}

export interface RewardBanner {
  type: "referral" | "cashback" | "first_transaction";
  title: string;
  message: string;
  data: Record<string, number>;
}

export interface DashboardData {
  user: DashboardUser;
  accounts: BankAccount[];
  wallet_card: WalletCard;
  cashback_wallet?: CashbackWallet;
  cashback_rates?: CashbackRate[];
  transaction_history: Transaction[];
  kyc_verification: KycVerification;
  current_tier: AccountTier;
  reward_banners?: RewardBanner[];
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

