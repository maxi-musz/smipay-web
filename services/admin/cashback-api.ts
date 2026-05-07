import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  CashbackConfigResponse,
  CashbackConfigPayload,
  CashbackRulesResponse,
  CashbackRulePayload,
  CashbackRuleResponse,
  CashbackSeedResponse,
  CashbackAnalyticsResponse,
  CashbackHistoryResponse,
  CashbackHistoryFilters,
} from "@/types/admin/cashback";

function buildHistoryParams(
  filters: Partial<CashbackHistoryFilters>,
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.user_id) params.user_id = filters.user_id;
  if (filters.service_type) params.service_type = filters.service_type;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  return params;
}

export const adminCashbackApi = {
  getConfig: async (): Promise<CashbackConfigResponse> => {
    try {
      const response = await backendApi.get<CashbackConfigResponse>(
        "/unified-admin/cashback/config",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateConfig: async (
    payload: CashbackConfigPayload,
  ): Promise<CashbackConfigResponse> => {
    try {
      const response = await backendApi.put<CashbackConfigResponse>(
        "/unified-admin/cashback/config",
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  listRules: async (): Promise<CashbackRulesResponse> => {
    try {
      const response = await backendApi.get<CashbackRulesResponse>(
        "/unified-admin/cashback/rules",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  createRule: async (
    payload: CashbackRulePayload,
  ): Promise<CashbackRuleResponse> => {
    try {
      const response = await backendApi.post<CashbackRuleResponse>(
        "/unified-admin/cashback/rules",
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  seedRules: async (): Promise<CashbackSeedResponse> => {
    try {
      const response = await backendApi.post<CashbackSeedResponse>(
        "/unified-admin/cashback/rules/seed",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateRule: async (
    id: string,
    payload: CashbackRulePayload,
  ): Promise<CashbackRuleResponse> => {
    try {
      const response = await backendApi.put<CashbackRuleResponse>(
        `/unified-admin/cashback/rules/${id}`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  deleteRule: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await backendApi.delete<{ success: boolean; message: string }>(
        `/unified-admin/cashback/rules/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getAnalytics: async (): Promise<CashbackAnalyticsResponse> => {
    try {
      const response = await backendApi.get<CashbackAnalyticsResponse>(
        "/unified-admin/cashback/analytics",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getHistory: async (
    filters: Partial<CashbackHistoryFilters>,
  ): Promise<CashbackHistoryResponse> => {
    try {
      const response = await backendApi.get<CashbackHistoryResponse>(
        "/unified-admin/cashback/history",
        { params: buildHistoryParams(filters) },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
