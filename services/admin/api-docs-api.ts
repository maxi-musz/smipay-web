import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";

export interface ApiDocsConfig {
  id: string;
  is_enabled: boolean;
  updated_by?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

const BASE = "/unified-admin/api-docs";

export const adminApiDocsApi = {
  get: async (): Promise<ApiDocsConfig> => {
    try {
      const res = await backendApi.get<Envelope<ApiDocsConfig>>(BASE);
      return res.data.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  setEnabled: async (is_enabled: boolean): Promise<ApiDocsConfig> => {
    try {
      const res = await backendApi.put<Envelope<ApiDocsConfig>>(BASE, {
        is_enabled,
      });
      return res.data.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
