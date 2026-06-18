import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  AppVersionGateConfigResponse,
  AppVersionGateConfigPayload,
} from "@/types/admin/app-version";

export const adminAppVersionApi = {
  getConfig: async (): Promise<AppVersionGateConfigResponse> => {
    try {
      const response = await backendApi.get<AppVersionGateConfigResponse>(
        "/unified-admin/app-version/config",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateConfig: async (
    payload: AppVersionGateConfigPayload,
  ): Promise<AppVersionGateConfigResponse> => {
    try {
      const response = await backendApi.put<AppVersionGateConfigResponse>(
        "/unified-admin/app-version/config",
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
