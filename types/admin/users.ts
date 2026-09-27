import type {
  VerificationBreakdown,
  VerificationFlagFilter,
} from "@/types/admin/verification";

// --- Enums ---

export const USER_ROLES = [
  { value: "user", label: "User" },
  { value: "agent", label: "Agent" },
  { value: "support", label: "Support" },
  { value: "compliance_officer", label: "Compliance Officer" },
  { value: "finance", label: "Finance" },
  { value: "operations", label: "Operations" },
  { value: "admin", label: "Admin" },
] as const;

export const ACCOUNT_STATUSES = [
  { value: "active", label: "Active", color: "emerald" },
  { value: "suspended", label: "Suspended", color: "red" },
] as const;

export const KYC_STATUSES = [
  { value: "verified", label: "Verified", color: "emerald" },
  { value: "pending", label: "Pending", color: "amber" },
  { value: "rejected", label: "Rejected", color: "red" },
  { value: "none", label: "None", color: "slate" },
] as const;

export const KYC_ID_TYPES = [
  "NIGERIAN_BVN_VERIFICATION",
  "NIGERIAN_NIN",
  "NIGERIAN_INTERNATIONAL_PASSPORT",
  "NIGERIAN_PVC",
  "NIGERIAN_DRIVERS_LICENSE",
] as const;

// --- Analytics ---

export interface UserOverview {
  total_users: number;
  active_users: number;
  suspended_users: number;
  /** Sum of main NGN wallet `current_balance` for users matching current list filters. */
  total_main_wallet_balance: number;
  /** Sum of cashback `current_balance` for users matching current list filters. */
  total_cashback_balance: number;
  verification?: VerificationBreakdown | null;
  cohort_all_users?: number;
}

export interface UserGrowth {
  new_today: number;
  new_this_week: number;
  new_this_month: number;
  new_prev_month: number;
  month_over_month_percent: number;
}

export interface UserKYCBreakdown {
  verified: number;
  pending: number;
  rejected: number;
  none: number;
}

export interface UserTierItem {
  tier: string;
  name: string;
  count: number;
}

export interface RecentSignup {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  createdAt: string;
}

/** Main + cashback rollup invariant counts for the current list filters (max ~20k users scanned server-side). */
export interface WalletRollupAnalytics {
  checks_out: number;
  doesnt_check: number;
}

export interface AdminUserAnalytics {
  overview: UserOverview;
  growth: UserGrowth;
  kyc: UserKYCBreakdown;
  by_role: Record<string, number>;
  by_tier: UserTierItem[];
  recent_signups: RecentSignup[];
  wallet_rollups?: WalletRollupAnalytics;
  /** True when the filtered cohort exceeds the server scan limit; rollup counts are omitted. */
  wallet_rollups_capped?: boolean;
}

// --- Last activity ---

export interface UserLastActivity {
  action: string;
  description: string;
  status: string;
  timestamp: string;
  ip_address: string | null;
  platform: string | null;
}

// --- User (list view) ---

export interface AdminUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  email: string | null;
  phone_number: string;
  smipay_tag: string | null;
  role: string;
  gender: string | null;
  date_of_birth: string | null;
  account_status: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  createdAt: string;
  updatedAt: string;
  tier: { id: string; tier: string; name: string } | null;
  profile_image: { secure_url: string } | null;
  kyc_verification: {
    status: string;
    is_verified: boolean;
    bvn_verified: boolean;
    id_type: string | null;
  } | null;
  bvn_verification?: { is_verified: boolean } | null;
  /** Main wallet; null if no wallet row (unusual). */
  wallet: {
    current_balance: number;
    all_time_fuunding: number;
    all_time_withdrawn: number;
  } | null;
  /** Cashback wallet; null if no row yet. */
  cashbackWallet?: {
    current_balance: number;
    all_time_earned: number;
    all_time_withdrawn: number;
  } | null;
  last_activity: UserLastActivity | null;
}

// --- User detail ---

export interface AdminUserAddress {
  id: string;
  userId: string;
  city: string | null;
  state: string | null;
  country: string | null;
  home_address: string | null;
  house_number: string | null;
  postal_code: string | null;
}

export interface AdminUserWallet {
  id: string;
  current_balance: number;
  all_time_fuunding: number;
  all_time_withdrawn: number;
  isActive: boolean;
}

/** Prisma relation name; included on admin user detail when present */
export interface AdminUserCashbackWallet {
  id: string;
  current_balance: number;
  all_time_earned: number;
  all_time_withdrawn: number;
  isActive: boolean;
}

export interface AdminUserKYCFull {
  id: string;
  userId: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nin: string | null;
  state_of_origin: string | null;
  lga_of_origin: string | null;
  state_of_residence: string | null;
  lga_of_residence: string | null;
  watchlisted: boolean;
  face_image: string | null;
  is_verified: boolean;
  id_type: string | null;
  id_no: string | null;
  bvn: string | null;
  bvn_verified: boolean;
  status: string;
  initiated_at: string | null;
  approved_at: string | null;
  failure_reason: string | null;
}

export interface AdminUserDetail extends Omit<AdminUser, "kyc_verification"> {
  is_friendly: boolean;
  referral_code: string | null;
  agree_to_terms: boolean;
  address: AdminUserAddress | null;
  wallet: AdminUserWallet | null;
  /** Present when API includes cashback relation (null if user has no cashback wallet row) */
  cashbackWallet?: AdminUserCashbackWallet | null;
  kyc_verification: AdminUserKYCFull | null;
  _count: {
    cards: number;
    supportTickets: number;
    auditLogs: number;
  };
}

// --- List meta ---

export interface UserListMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// --- Filters ---

/** Matches backend `list_sort` presets (admin user list ordering). */
export type AdminUserListSort =
  | "created_desc"
  | "created_asc"
  | "name_asc"
  | "name_desc"
  | "wallet_balance_desc"
  | "wallet_balance_asc"
  | "cashback_balance_desc"
  | "cashback_balance_asc"
  | "all_time_funding_desc"
  | "all_time_funding_asc"
  | "transaction_count_desc"
  | "transaction_count_asc";

export const ADMIN_USER_LIST_SORT_OPTIONS: { value: AdminUserListSort; label: string }[] = [
  { value: "created_desc", label: "Joined (newest first)" },
  { value: "created_asc", label: "Joined (oldest first)" },
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
  { value: "wallet_balance_desc", label: "Main wallet balance (high → low)" },
  { value: "wallet_balance_asc", label: "Main wallet balance (low → high)" },
  { value: "all_time_funding_desc", label: "All-time funded (high → low)" },
  { value: "all_time_funding_asc", label: "All-time funded (low → high)" },
  { value: "cashback_balance_desc", label: "Cashback balance (high → low)" },
  { value: "cashback_balance_asc", label: "Cashback balance (low → high)" },
  { value: "transaction_count_desc", label: "Total transactions (high → low)" },
  { value: "transaction_count_asc", label: "Total transactions (low → high)" },
];

export interface UserFilters {
  page: number;
  limit: number;
  search: string;
  role: string;
  account_status: string;
  tier: string;
  kyc_status: string;
  date_from: string;
  date_to: string;
  /** Inclusive min main wallet current balance (NGN). */
  min_wallet_balance: string;
  /** Inclusive max main wallet current balance (NGN). */
  max_wallet_balance: string;
  /** Inclusive min cashback current balance (NGN). */
  min_cashback_balance: string;
  /** Inclusive max cashback current balance (NGN). */
  max_cashback_balance: string;
  /** Preset list ordering (sent as `list_sort` query param). */
  list_sort: AdminUserListSort;
  sort_by: string;
  sort_order: string;
  /** Filter by wallet rollup integrity (`ok` / `fail`). Empty = no filter. Cohort must be ≤20k users. */
  wallet_integrity: "" | "ok" | "fail";
  email_verified: VerificationFlagFilter;
  phone_verified: VerificationFlagFilter;
  bvn_verified: VerificationFlagFilter;
  /** "true" excludes staff; the backend ignores it while a role filter is set. */
  customers_only: "" | "true";
}

// --- API Responses ---

export interface UserListResponse {
  success: boolean;
  message: string;
  data: {
    analytics: AdminUserAnalytics;
    users: AdminUser[];
    meta: UserListMeta;
  };
}

export interface UserDetailResponse {
  success: boolean;
  message: string;
  data: AdminUserDetail;
}

export interface UserMutationResponse {
  success: boolean;
  message: string;
  data: AdminUser;
}

export interface AdjustUserBalancesPayload {
  wallet_current_balance?: number;
  wallet_all_time_fuunding?: number;
  wallet_all_time_withdrawn?: number;
  cashback_current_balance?: number;
  cashback_all_time_earned?: number;
  cashback_all_time_withdrawn?: number;
  reason: string;
}

export interface WalletAggregateSnapshot {
  current_balance: number;
  all_time_fuunding: number;
  all_time_withdrawn: number;
}

export interface CashbackAggregateSnapshot {
  current_balance: number;
  all_time_earned: number;
  all_time_withdrawn: number;
}

export interface AdjustBalancesResult {
  user_id: string;
  wallet: { before: WalletAggregateSnapshot; after: WalletAggregateSnapshot } | null;
  cashback: { before: CashbackAggregateSnapshot; after: CashbackAggregateSnapshot } | null;
}

export interface AdjustBalancesResponse {
  success: boolean;
  message: string;
  data: AdjustBalancesResult;
}

// --- Views (phone verification is the minimum signal of a real customer) ---

export const USER_VIEWS = [
  {
    key: "phone",
    label: "Phone verified",
    description: "Customers who confirmed their phone number by SMS",
  },
  {
    key: "phone_bvn",
    label: "Phone + BVN",
    description: "Customers with both phone and BVN verified",
  },
  {
    key: "bvn",
    label: "BVN verified",
    description: "Customers with a verified BVN",
  },
  {
    key: "not_phone",
    label: "Not phone-verified",
    description: "Customers who never confirmed a phone number",
  },
  {
    key: "all",
    label: "All accounts",
    description: "Every account, including staff",
  },
] as const;

export type UserView = (typeof USER_VIEWS)[number]["key"];

export const DEFAULT_USER_VIEW: UserView = "phone";

export type UserViewFilters = Pick<
  UserFilters,
  "phone_verified" | "bvn_verified" | "email_verified" | "customers_only"
>;

export const USER_VIEW_FILTERS: Record<UserView, UserViewFilters> = {
  phone: { phone_verified: "true", bvn_verified: "", email_verified: "", customers_only: "true" },
  phone_bvn: { phone_verified: "true", bvn_verified: "true", email_verified: "", customers_only: "true" },
  bvn: { phone_verified: "", bvn_verified: "true", email_verified: "", customers_only: "true" },
  not_phone: { phone_verified: "false", bvn_verified: "", email_verified: "", customers_only: "true" },
  all: { phone_verified: "", bvn_verified: "", email_verified: "", customers_only: "" },
};

export function isUserView(value: string | null | undefined): value is UserView {
  return USER_VIEWS.some((v) => v.key === value);
}

export function viewFromFilters(f: UserViewFilters): UserView | null {
  const match = USER_VIEWS.find(({ key }) => {
    const v = USER_VIEW_FILTERS[key];
    return (
      v.phone_verified === f.phone_verified &&
      v.bvn_verified === f.bvn_verified &&
      v.email_verified === f.email_verified &&
      v.customers_only === f.customers_only
    );
  });
  return match?.key ?? null;
}

export function userViewCounts(
  overview: UserOverview,
): Partial<Record<UserView, number>> {
  const v = overview.verification;
  if (!v) return {};
  return {
    phone: v.phone_verified,
    phone_bvn: v.phone_and_bvn,
    bvn: v.bvn_verified,
    not_phone: Math.max(0, v.total - v.phone_verified),
    ...(typeof overview.cohort_all_users === "number"
      ? { all: overview.cohort_all_users }
      : {}),
  };
}
