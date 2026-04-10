import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  TransactionListResponse,
  TransactionDetailResponse,
  TransactionFlagResponse,
  TransactionFilters,
} from "@/types/admin/transactions";

function buildParams(filters: Partial<TransactionFilters>): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.transaction_type) params.transaction_type = filters.transaction_type;
  if (filters.credit_debit) params.credit_debit = filters.credit_debit;
  if (filters.payment_channel) params.payment_channel = filters.payment_channel;
  if (filters.user_id) params.user_id = filters.user_id;
  if (filters.min_amount) params.min_amount = filters.min_amount;
  if (filters.max_amount) params.max_amount = filters.max_amount;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.sort_by) params.sort_by = filters.sort_by;
  if (filters.sort_order) params.sort_order = filters.sort_order;
  if (filters.wallet_integrity === "ok" || filters.wallet_integrity === "fail") {
    params.wallet_integrity = filters.wallet_integrity;
  }
  return params;
}

export const adminTransactionsApi = {
  list: async (filters: Partial<TransactionFilters>): Promise<TransactionListResponse> => {
    try {
      const response = await backendApi.get<TransactionListResponse>(
        "/unified-admin/transactions",
        { params: buildParams(filters) },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getById: async (id: string): Promise<TransactionDetailResponse> => {
    try {
      const response = await backendApi.get<TransactionDetailResponse>(
        `/unified-admin/transactions/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  flag: async (id: string, reason: string): Promise<TransactionFlagResponse> => {
    try {
      const response = await backendApi.post<TransactionFlagResponse>(
        `/unified-admin/transactions/${id}/flag`,
        { reason },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
