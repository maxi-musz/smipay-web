import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  MarkupConfigResponse,
  MarkupConfigPayload,
  MarkupRulesResponse,
  MarkupRulePayload,
  MarkupRuleResponse,
  MarkupSeedResponse,
  MarkupServiceType,
} from "@/types/admin/markup";

export const adminMarkupApi = {
  getConfig: async (): Promise<MarkupConfigResponse> => {
    try {
      const response = await backendApi.get<MarkupConfigResponse>(
        "/unified-admin/markup/config",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateConfig: async (
    payload: MarkupConfigPayload,
  ): Promise<MarkupConfigResponse> => {
    try {
      const response = await backendApi.put<MarkupConfigResponse>(
        "/unified-admin/markup/config",
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  listRules: async (): Promise<MarkupRulesResponse> => {
    try {
      const response = await backendApi.get<MarkupRulesResponse>(
        "/unified-admin/markup/rules",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  createRule: async (
    payload: MarkupRulePayload & {
      service_type: MarkupServiceType;
      percentage: number;
    },
  ): Promise<MarkupRuleResponse> => {
    try {
      const response = await backendApi.post<MarkupRuleResponse>(
        "/unified-admin/markup/rules",
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  seedRules: async (): Promise<MarkupSeedResponse> => {
    try {
      const response = await backendApi.post<MarkupSeedResponse>(
        "/unified-admin/markup/rules/seed",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateRule: async (
    id: string,
    payload: MarkupRulePayload,
  ): Promise<MarkupRuleResponse> => {
    try {
      const response = await backendApi.put<MarkupRuleResponse>(
        `/unified-admin/markup/rules/${id}`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  deleteRule: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await backendApi.delete<{ success: boolean; message: string }>(
        `/unified-admin/markup/rules/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
