/**
 * Transaction Types
 * Matches backend API response structure
 */

export type TransactionType =
  | "deposit"
  | "transfer"
  | "airtime"
  | "data"
  | "cable"
  | "electricity"
  | "education"
  | "betting"
  | "referral_bonus"
  | "withdrawal";

export type TransactionStatus = "pending" | "success" | "failed" | "cancelled";

export type CreditDebit = "credit" | "debit";

export interface Transaction {
  id: string;
  amount: string;
  raw_amount: number;
  type: TransactionType;
  credit_debit: CreditDebit;
  transaction_type: TransactionType;
  description: string;
  status: TransactionStatus;
  data_plan_name?: string | null;
  date: string;
  reference: string;
  sender: string | null;
  icon?: string | null;
  provider?: string | null;
  payment_channel?: string | null;
  payment_method?: string | null;
}

export interface ElectricityMeta {
  electricity_token: string;
  units: string;
  meter_number: string;
  meter_type: "prepaid" | "postpaid";
  customer_name: string;
  customer_address: string;
  disco: string;
}

export interface CableMeta {
  smartcard_number: string;
  subscription_type: string;
  bouquet: string;
  customer_name: string;
}

export interface DataMeta {
  phone: string;
  network: string;
  plan: string;
}

export interface AirtimeMeta {
  phone: string;
  network: string;
}

export interface EducationCard {
  Serial: string;
  Pin: string;
}

export interface EducationMeta {
  service_id: string;
  variation_code: string;
  product_name: string;
  phone: string;
  quantity: number;
  profile_id: string | null;
  pin: string | null;
  serial: string | null;
  tokens: string[] | null;
  cards: EducationCard[] | null;
  purchased_code: string | null;
}

export type TransactionMeta =
  | ElectricityMeta
  | CableMeta
  | DataMeta
  | AirtimeMeta
  | EducationMeta
  | Record<string, never>;

export interface TransactionDetail {
  id: string;
  amount: string;
  raw_amount?: number;
  type: TransactionType;
  credit_debit: CreditDebit;
  description: string;
  status: TransactionStatus;
  data_plan_name?: string | null;
  recipient_mobile: string | null;
  tx_reference: string;
  transaction_number?: string;
  payment_method?: string;
  payment_channel?: string;
  fee?: number;
  balance_before?: number;
  balance_after?: number;
  cashback_balance_before?: number | null;
  cashback_used?: number | null;
  cashback_balance_after?: number | null;
  cashback_earned?: number | null;
  created_on: string;
  updated_on: string;
  sender: string | null;
  icon: string;
  provider?: string | null;
  meta?: TransactionMeta;
}

export interface PaginationMeta {
  currentPage: number;
  totalItems: number;
  totalPages: number;
  activeFilter?: string;
}

export type CategoryCounts = Record<string, number>;

export interface TransactionHistoryResponse {
  success: boolean;
  message: string;
  data: {
    categories: CategoryCounts;
    pagination: PaginationMeta;
    transactions: Transaction[];
  };
}

export interface TransactionDetailResponse {
  success: boolean;
  message: string;
  data: TransactionDetail;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: TransactionStatus;
  credit_debit?: CreditDebit;
  search?: string;
}
