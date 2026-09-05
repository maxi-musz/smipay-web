import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  BlockedIpsResponse,
  SecurityEventsResponse,
  SecurityPolicy,
  SecurityPolicyResponse,
  UpdateSecurityPolicyResponse,
} from "@/types/admin/security";
import type { MessagesResponse } from "@/types/admin/messages";

export const adminSecurityApi = {
  getPolicy: async (): Promise<SecurityPolicyResponse> => {
    try {
      const response = await backendApi.get<SecurityPolicyResponse>(
        "/unified-admin/security/policy",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updatePolicy: async (
    payload: Partial<SecurityPolicy>,
  ): Promise<UpdateSecurityPolicyResponse> => {
    try {
      const response = await backendApi.put<UpdateSecurityPolicyResponse>(
        "/unified-admin/security/policy",
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  listMessages: async (): Promise<MessagesResponse> => {
    try {
      const response = await backendApi.get<MessagesResponse>(
        "/unified-admin/security/messages",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /** An empty `message` resets that key back to its built-in default. */
  setMessage: async (key: string, message: string): Promise<void> => {
    try {
      await backendApi.put("/unified-admin/security/messages", { key, message });
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  listEvents: async (params: {
    days?: number;
    rule?: string;
    limit?: number;
    page?: number;
    search?: string;
    blocked?: boolean;
  } = {}): Promise<SecurityEventsResponse> => {
    try {
      const response = await backendApi.get<SecurityEventsResponse>(
        "/unified-admin/security/events",
        {
          params: {
            ...params,
            ...(params.blocked === true
              ? { blocked: "true" }
              : params.blocked === false
                ? { blocked: "false" }
                : {}),
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  // ── IP blocklist ─────────────────────────────────────────

  listBlockedIps: async (): Promise<BlockedIpsResponse> => {
    try {
      const response = await backendApi.get<BlockedIpsResponse>(
        "/unified-admin/security/blocked-ips",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  blockIp: async (payload: {
    ip: string;
    reason?: string;
    notes?: string;
  }): Promise<BlockedIpsResponse> => {
    try {
      const response = await backendApi.post<BlockedIpsResponse>(
        "/unified-admin/security/blocked-ips",
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  unblockIp: async (id: string): Promise<BlockedIpsResponse> => {
    try {
      const response = await backendApi.delete<BlockedIpsResponse>(
        `/unified-admin/security/blocked-ips/${encodeURIComponent(id)}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
