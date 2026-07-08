import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  ApiResponse,
  CreateSmsProviderPayload,
  PaginatedMessages,
  SmsAnalyticsSummary,
  SmsBalance,
  SmsConfig,
  SmsConfigPayload,
  SmsDailyStat,
  SmsProviderConfig,
  UpdateSmsProviderPayload,
} from "@/types/admin/sms-providers";

const BASE = "/unified-admin/providers/sms";

export const adminSmsProvidersApi = {
  getConfig: async (): Promise<ApiResponse<SmsConfig>> => {
    try {
      const response = await backendApi.get<ApiResponse<SmsConfig>>(
        `${BASE}/config`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateConfig: async (
    payload: SmsConfigPayload,
  ): Promise<ApiResponse<SmsConfig>> => {
    try {
      const response = await backendApi.put<ApiResponse<SmsConfig>>(
        `${BASE}/config`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  listProviders: async (
    includeArchived = false,
  ): Promise<ApiResponse<SmsProviderConfig[]>> => {
    try {
      const response = await backendApi.get<ApiResponse<SmsProviderConfig[]>>(
        `${BASE}/providers`,
        { params: { includeArchived: includeArchived ? "true" : undefined } },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  createProvider: async (
    payload: CreateSmsProviderPayload,
  ): Promise<ApiResponse<SmsProviderConfig>> => {
    try {
      const response = await backendApi.post<ApiResponse<SmsProviderConfig>>(
        `${BASE}/providers`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateProvider: async (
    id: string,
    payload: UpdateSmsProviderPayload,
  ): Promise<ApiResponse<SmsProviderConfig>> => {
    try {
      const response = await backendApi.put<ApiResponse<SmsProviderConfig>>(
        `${BASE}/providers/${id}`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  activateProvider: async (
    id: string,
  ): Promise<ApiResponse<SmsProviderConfig>> => {
    try {
      const response = await backendApi.post<ApiResponse<SmsProviderConfig>>(
        `${BASE}/providers/${id}/activate`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  archiveProvider: async (
    id: string,
  ): Promise<ApiResponse<SmsProviderConfig>> => {
    try {
      const response = await backendApi.post<ApiResponse<SmsProviderConfig>>(
        `${BASE}/providers/${id}/archive`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  testProvider: async (
    id: string,
    payload: { to: string; message?: string },
  ): Promise<ApiResponse<unknown>> => {
    try {
      const response = await backendApi.post<ApiResponse<unknown>>(
        `${BASE}/providers/${id}/test`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getBalance: async (): Promise<ApiResponse<SmsBalance>> => {
    try {
      const response = await backendApi.get<ApiResponse<SmsBalance>>(
        `${BASE}/balance`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getAnalyticsSummary: async (
    month?: string,
  ): Promise<ApiResponse<SmsAnalyticsSummary>> => {
    try {
      const response = await backendApi.get<ApiResponse<SmsAnalyticsSummary>>(
        `${BASE}/analytics/summary`,
        { params: month ? { month } : undefined },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getAnalyticsDaily: async (
    from?: string,
    to?: string,
  ): Promise<ApiResponse<SmsDailyStat[]>> => {
    try {
      const response = await backendApi.get<ApiResponse<SmsDailyStat[]>>(
        `${BASE}/analytics/daily`,
        { params: { from, to } },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  listMessages: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    purpose?: string;
  }): Promise<ApiResponse<PaginatedMessages>> => {
    try {
      const response = await backendApi.get<ApiResponse<PaginatedMessages>>(
        `${BASE}/messages`,
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  reconcile: async (): Promise<ApiResponse<{ count: number }>> => {
    try {
      const response = await backendApi.post<ApiResponse<{ count: number }>>(
        `${BASE}/reconcile`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
