import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type { AdminDashboardResponse } from "@/types/admin/dashboard";

export const adminDashboardApi = {
  getStats: async (): Promise<AdminDashboardResponse> => {
    try {
      const response =
        await backendApi.get<AdminDashboardResponse>("/unified-admin/dashboard");
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  recalculateStats: async (): Promise<AdminDashboardResponse> => {
    try {
      const response = await backendApi.post<AdminDashboardResponse>(
        "/unified-admin/dashboard/recalculate",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
