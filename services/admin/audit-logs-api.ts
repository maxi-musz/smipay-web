import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  AuditFilters,
  AuditListResponse,
  AuditDetailResponse,
  AuditTimelineResponse,
  AuditIPResponse,
  AuditSessionResponse,
  AuditDeviceResponse,
  AuditUserLogsResponse,
  AuditFlaggedResponse,
  AuditActionResponse,
} from "@/types/admin/audit-logs";

const BASE = "/unified-admin/audit-logs";

function buildQS(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      qs.append(key, String(value));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export const adminAuditLogsApi = {
  list: async (
    filters: Partial<AuditFilters>,
  ): Promise<AuditListResponse> => {
    try {
      const response = await backendApi.get<AuditListResponse>(
        `${BASE}${buildQS(filters)}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getById: async (id: string): Promise<AuditDetailResponse> => {
    try {
      const response = await backendApi.get<AuditDetailResponse>(
        `${BASE}/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  timeline: async (params: {
    date_from?: string;
    date_to?: string;
  }): Promise<AuditTimelineResponse> => {
    try {
      const response = await backendApi.get<AuditTimelineResponse>(
        `${BASE}/timeline${buildQS(params)}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  ipInvestigation: async (
    ip: string,
    page?: number,
    limit?: number,
  ): Promise<AuditIPResponse> => {
    try {
      const response = await backendApi.get<AuditIPResponse>(
        `${BASE}/ip/${encodeURIComponent(ip)}${buildQS({ page, limit })}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  sessionTrace: async (
    sessionId: string,
  ): Promise<AuditSessionResponse> => {
    try {
      const response = await backendApi.get<AuditSessionResponse>(
        `${BASE}/session/${encodeURIComponent(sessionId)}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  deviceInvestigation: async (
    deviceId: string,
    page?: number,
    limit?: number,
  ): Promise<AuditDeviceResponse> => {
    try {
      const response = await backendApi.get<AuditDeviceResponse>(
        `${BASE}/device/${encodeURIComponent(deviceId)}${buildQS({ page, limit })}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  userLogs: async (
    userId: string,
    params?: Partial<AuditFilters>,
  ): Promise<AuditUserLogsResponse> => {
    try {
      const response = await backendApi.get<AuditUserLogsResponse>(
        `${BASE}/user/${encodeURIComponent(userId)}${buildQS(params ?? {})}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  flagged: async (
    params?: Partial<AuditFilters>,
  ): Promise<AuditFlaggedResponse> => {
    try {
      const response = await backendApi.get<AuditFlaggedResponse>(
        `${BASE}/flagged${buildQS(params ?? {})}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  flag: async (
    id: string,
    payload: { reason: string },
  ): Promise<AuditActionResponse> => {
    try {
      const response = await backendApi.post<AuditActionResponse>(
        `${BASE}/${id}/flag`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  review: async (
    id: string,
    payload: { review_notes: string; resolve: boolean },
  ): Promise<AuditActionResponse> => {
    try {
      const response = await backendApi.post<AuditActionResponse>(
        `${BASE}/${id}/review`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
