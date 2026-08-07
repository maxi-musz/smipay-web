import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  ApiResponse,
  CreateEmailProviderPayload,
  EmailAnalyticsSummary,
  EmailConfig,
  EmailConfigPayload,
  EmailDailyStat,
  EmailProviderConfig,
  EmailSuppressionItem,
  PaginatedEmailMessages,
  UpdateEmailProviderPayload,
} from "@/types/admin/email-providers";

const BASE = "/unified-admin/providers/email";

export const adminEmailProvidersApi = {
  getConfig: async (): Promise<ApiResponse<EmailConfig>> => {
    try {
      const response = await backendApi.get<ApiResponse<EmailConfig>>(
        `${BASE}/config`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateConfig: async (
    payload: EmailConfigPayload,
  ): Promise<ApiResponse<EmailConfig>> => {
    try {
      const response = await backendApi.put<ApiResponse<EmailConfig>>(
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
  ): Promise<ApiResponse<EmailProviderConfig[]>> => {
    try {
      const response = await backendApi.get<ApiResponse<EmailProviderConfig[]>>(
        `${BASE}/providers`,
        { params: { includeArchived: includeArchived ? "true" : undefined } },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  createProvider: async (
    payload: CreateEmailProviderPayload,
  ): Promise<ApiResponse<EmailProviderConfig>> => {
    try {
      const response = await backendApi.post<ApiResponse<EmailProviderConfig>>(
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
    payload: UpdateEmailProviderPayload,
  ): Promise<ApiResponse<EmailProviderConfig>> => {
    try {
      const response = await backendApi.put<ApiResponse<EmailProviderConfig>>(
        `${BASE}/providers/${id}`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  reorderProviders: async (
    orderedIds: string[],
  ): Promise<ApiResponse<EmailProviderConfig[]>> => {
    try {
      const response = await backendApi.post<ApiResponse<EmailProviderConfig[]>>(
        `${BASE}/providers/reorder`,
        { ordered_ids: orderedIds },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  toggleProvider: async (
    id: string,
  ): Promise<ApiResponse<EmailProviderConfig>> => {
    try {
      const response = await backendApi.post<ApiResponse<EmailProviderConfig>>(
        `${BASE}/providers/${id}/toggle`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  archiveProvider: async (
    id: string,
  ): Promise<ApiResponse<EmailProviderConfig>> => {
    try {
      const response = await backendApi.post<ApiResponse<EmailProviderConfig>>(
        `${BASE}/providers/${id}/archive`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  testProvider: async (
    id: string,
    payload: { to: string; subject?: string; message?: string },
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

  getAnalyticsSummary: async (
    month?: string,
  ): Promise<ApiResponse<EmailAnalyticsSummary>> => {
    try {
      const response = await backendApi.get<ApiResponse<EmailAnalyticsSummary>>(
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
  ): Promise<ApiResponse<EmailDailyStat[]>> => {
    try {
      const response = await backendApi.get<ApiResponse<EmailDailyStat[]>>(
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
  }): Promise<ApiResponse<PaginatedEmailMessages>> => {
    try {
      const response = await backendApi.get<ApiResponse<PaginatedEmailMessages>>(
        `${BASE}/messages`,
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  listSuppressions: async (): Promise<ApiResponse<EmailSuppressionItem[]>> => {
    try {
      const response = await backendApi.get<ApiResponse<EmailSuppressionItem[]>>(
        `${BASE}/suppressions`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  clearSuppression: async (
    email: string,
  ): Promise<ApiResponse<unknown>> => {
    try {
      const response = await backendApi.delete<ApiResponse<unknown>>(
        `${BASE}/suppressions/${encodeURIComponent(email)}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
