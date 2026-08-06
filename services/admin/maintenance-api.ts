import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  MaintenanceListResponse,
  UpdateMaintenanceFlagPayload,
  UpdateMaintenanceFlagResponse,
} from "@/types/admin/maintenance";

export const adminMaintenanceApi = {
  list: async (): Promise<MaintenanceListResponse> => {
    try {
      const response = await backendApi.get<MaintenanceListResponse>(
        "/unified-admin/maintenance/flags",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  update: async (
    payload: UpdateMaintenanceFlagPayload,
  ): Promise<UpdateMaintenanceFlagResponse> => {
    try {
      const response = await backendApi.put<UpdateMaintenanceFlagResponse>(
        "/unified-admin/maintenance/flags",
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
