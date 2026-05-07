import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  FirstTxRewardConfigResponse,
  FirstTxRewardConfigPayload,
  FirstTxRewardUpdateResponse,
  FirstTxRewardAnalyticsResponse,
  FirstTxRewardHistoryResponse,
  FirstTxRewardHistoryFilters,
} from "@/types/admin/first-tx-reward";

function buildHistoryParams(
  filters: Partial<FirstTxRewardHistoryFilters>,
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.user_id) params.user_id = filters.user_id;
  if (filters.source_transaction_type)
    params.source_transaction_type = filters.source_transaction_type;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  return params;
}

export const adminFirstTxRewardApi = {
  getConfig: async (): Promise<FirstTxRewardConfigResponse> => {
    try {
      const response = await backendApi.get<FirstTxRewardConfigResponse>(
        "/unified-admin/first-tx-reward/config",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateConfig: async (
    payload: FirstTxRewardConfigPayload,
  ): Promise<FirstTxRewardUpdateResponse> => {
    try {
      const response = await backendApi.put<FirstTxRewardUpdateResponse>(
        "/unified-admin/first-tx-reward/config",
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getAnalytics: async (): Promise<FirstTxRewardAnalyticsResponse> => {
    try {
      const response = await backendApi.get<FirstTxRewardAnalyticsResponse>(
        "/unified-admin/first-tx-reward/analytics",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getHistory: async (
    filters: Partial<FirstTxRewardHistoryFilters>,
  ): Promise<FirstTxRewardHistoryResponse> => {
    try {
      const response = await backendApi.get<FirstTxRewardHistoryResponse>(
        "/unified-admin/first-tx-reward/history",
        { params: buildHistoryParams(filters) },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
