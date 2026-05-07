import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  TransactionHistoryResponse,
  TransactionDetailResponse,
  TransactionFilters,
} from "@/types/transaction";

export const transactionApi = {
  getAllTransactions: async (
    filters: TransactionFilters = {}
  ): Promise<TransactionHistoryResponse> => {
    try {
      const params: Record<string, string | number> = {};
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.credit_debit) params.credit_debit = filters.credit_debit;
      if (filters.search) params.search = filters.search;

      const response = await backendApi.get<TransactionHistoryResponse>(
        "/history/fetch-all-history",
        { params }
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getTransactionById: async (
    transactionId: string
  ): Promise<TransactionDetailResponse> => {
    try {
      const response = await backendApi.get<TransactionDetailResponse>(
        `/history/${transactionId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
