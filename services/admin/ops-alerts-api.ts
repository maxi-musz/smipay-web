import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  OpsAlertConfigPayload,
  OpsAlertConfigResponse,
  OpsAlertTestResponse,
} from "@/types/admin/ops-alerts";

export const adminOpsAlertsApi = {
  get: async (): Promise<OpsAlertConfigResponse> => {
    try {
      const response = await backendApi.get<OpsAlertConfigResponse>(
        "/unified-admin/ops-alerts/config",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  update: async (
    payload: OpsAlertConfigPayload,
  ): Promise<OpsAlertConfigResponse> => {
    try {
      const response = await backendApi.put<OpsAlertConfigResponse>(
        "/unified-admin/ops-alerts/config",
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  sendTest: async (): Promise<OpsAlertTestResponse> => {
    try {
      const response = await backendApi.put<OpsAlertTestResponse>(
        "/unified-admin/ops-alerts/test",
        {},
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
