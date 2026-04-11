import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  PushBroadcastListResponse,
  PushBroadcastResponse,
  PushBroadcastCreatePayload,
  PushBroadcastFilters,
  PushBroadcastLogsResponse,
  PushBroadcastPreviewResponse,
  DeviceTokenFilters,
  DeviceTokenListResponse,
  DeviceTokenStatsResponse,
} from "@/types/admin/push-broadcasts";

function buildListParams(
  filters: Partial<PushBroadcastFilters>,
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (filters.status) params.status = filters.status;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  return params;
}

export const adminPushBroadcastsApi = {
  listBroadcasts: async (
    filters: Partial<PushBroadcastFilters>,
  ): Promise<PushBroadcastListResponse> => {
    try {
      const response = await backendApi.get<PushBroadcastListResponse>(
        "/unified-admin/notifications/push/broadcasts",
        { params: buildListParams(filters) },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  createBroadcast: async (
    payload: PushBroadcastCreatePayload,
  ): Promise<PushBroadcastResponse> => {
    try {
      const response = await backendApi.post<PushBroadcastResponse>(
        "/unified-admin/notifications/push/broadcasts",
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  previewAudience: async (
    payload: PushBroadcastCreatePayload,
  ): Promise<PushBroadcastPreviewResponse> => {
    try {
      const response = await backendApi.post<PushBroadcastPreviewResponse>(
        "/unified-admin/notifications/push/broadcasts/preview",
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getBroadcast: async (id: string): Promise<PushBroadcastResponse> => {
    try {
      const response = await backendApi.get<PushBroadcastResponse>(
        `/unified-admin/notifications/push/broadcasts/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getDeliveryLogs: async (
    id: string,
    page = 1,
    limit = 50,
  ): Promise<PushBroadcastLogsResponse> => {
    try {
      const response = await backendApi.get<PushBroadcastLogsResponse>(
        `/unified-admin/notifications/push/broadcasts/${id}/logs`,
        { params: { page, limit } },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  cancelBroadcast: async (id: string): Promise<PushBroadcastResponse> => {
    try {
      const response = await backendApi.post<PushBroadcastResponse>(
        `/unified-admin/notifications/push/broadcasts/${id}/cancel`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  resendFailed: async (id: string): Promise<{ success: boolean; message: string; data: { message: string; count: number } }> => {
    try {
      const response = await backendApi.post(
        `/unified-admin/notifications/push/broadcasts/${id}/resend-failed`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  listDeviceTokens: async (
    filters: Partial<DeviceTokenFilters>,
  ): Promise<DeviceTokenListResponse> => {
    try {
      const params: Record<string, string | number> = {};
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.platform) params.platform = filters.platform;
      if (filters.is_active) params.is_active = filters.is_active;
      if (filters.search) params.search = filters.search;
      const response = await backendApi.get<DeviceTokenListResponse>(
        "/unified-admin/notifications/push/device-tokens",
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getDeviceTokenStats: async (): Promise<DeviceTokenStatsResponse> => {
    try {
      const response = await backendApi.get<DeviceTokenStatsResponse>(
        "/unified-admin/notifications/push/device-tokens/stats",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
