import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  DeviceListResponse,
  DeviceStatsResponse,
  DeviceDetailResponse,
  DeviceActionResponse,
  DeviceFilters,
} from "@/types/admin/devices";

function buildParams(filters: Partial<DeviceFilters>): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.platform) params.platform = filters.platform;
  if (filters.status) params.status = filters.status;
  if (filters.search) params.search = filters.search;
  if (filters.os_name) params.os_name = filters.os_name;
  if (filters.sort_by) params.sort_by = filters.sort_by;
  if (filters.sort_order) params.sort_order = filters.sort_order;
  return params;
}

export const adminDevicesApi = {
  list: async (filters: Partial<DeviceFilters>): Promise<DeviceListResponse> => {
    try {
      const response = await backendApi.get<DeviceListResponse>(
        "/unified-admin/devices",
        { params: buildParams(filters) },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  stats: async (): Promise<DeviceStatsResponse> => {
    try {
      const response = await backendApi.get<DeviceStatsResponse>(
        "/unified-admin/devices/stats",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getDevice: async (id: string): Promise<DeviceDetailResponse> => {
    try {
      const response = await backendApi.get<DeviceDetailResponse>(
        `/unified-admin/devices/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  suspend: async (id: string): Promise<DeviceActionResponse> => {
    try {
      const response = await backendApi.post<DeviceActionResponse>(
        `/unified-admin/devices/${id}/suspend`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  reactivate: async (id: string): Promise<DeviceActionResponse> => {
    try {
      const response = await backendApi.post<DeviceActionResponse>(
        `/unified-admin/devices/${id}/reactivate`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  remove: async (id: string): Promise<DeviceActionResponse> => {
    try {
      const response = await backendApi.delete<DeviceActionResponse>(
        `/unified-admin/devices/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  bulkSuspend: async (deviceIds: string[]): Promise<DeviceActionResponse> => {
    try {
      const response = await backendApi.post<DeviceActionResponse>(
        "/unified-admin/devices/bulk/suspend",
        { device_ids: deviceIds },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  bulkReactivate: async (deviceIds: string[]): Promise<DeviceActionResponse> => {
    try {
      const response = await backendApi.post<DeviceActionResponse>(
        "/unified-admin/devices/bulk/reactivate",
        { device_ids: deviceIds },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
