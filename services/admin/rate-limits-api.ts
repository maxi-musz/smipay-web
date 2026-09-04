import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  RateLimitsResponse,
  UpdateRateLimitPayload,
} from "@/types/admin/rate-limits";

export const adminRateLimitsApi = {
  list: async (): Promise<RateLimitsResponse> => {
    try {
      const response = await backendApi.get<RateLimitsResponse>(
        "/unified-admin/security/rate-limits",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  update: async (payload: UpdateRateLimitPayload): Promise<void> => {
    try {
      await backendApi.put("/unified-admin/security/rate-limits", payload);
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /** Drop the override so the endpoint's decorator values apply again. */
  reset: async (key: string): Promise<void> => {
    try {
      await backendApi.delete(
        `/unified-admin/security/rate-limits/${encodeURIComponent(key)}`,
      );
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
