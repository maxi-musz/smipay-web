import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type { BvnConfigResponse, BvnConfigValues } from "@/types/admin/bvn";

export const adminBvnConfigApi = {
  getConfig: async (): Promise<BvnConfigResponse> => {
    try {
      const res = await backendApi.get<BvnConfigResponse>(
        "/unified-admin/providers/kyc/config",
      );
      return res.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateConfig: async (
    // Config values plus optional write-only credential fields
    // (dojah_app_id, dojah_secret_key) handled server-side.
    patch: Partial<BvnConfigValues> & Record<string, unknown>,
  ): Promise<BvnConfigResponse> => {
    try {
      const res = await backendApi.put<BvnConfigResponse>(
        "/unified-admin/providers/kyc/config",
        patch,
      );
      return res.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },



  getBalance: async (): Promise<{
    success: boolean;
    message: string;
    data?: { provider?: string; balance: number | null; currency: string };
  }> => {
    try {
      const res = await backendApi.get("/unified-admin/providers/kyc/balance");
      return res.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getAnalytics: async (): Promise<{
    success: boolean;
    message: string;
    data?: {
      total: number;
      verified: number;
      failed: number;
      pending: number;
      success_rate: number;
      paid_lookups: number;
    };
  }> => {
    try {
      const res = await backendApi.get("/unified-admin/providers/kyc/analytics");
      return res.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  testConnection: async (): Promise<{
    success: boolean;
    message: string;
    data?: { ok: boolean; balance?: number | null; currency?: string };
  }> => {
    try {
      const res = await backendApi.post("/unified-admin/providers/kyc/test", {});
      return res.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
