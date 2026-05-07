import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  ReferralListResponse,
  ReferralFilters,
  TopReferrersResponse,
  ReferralConfigResponse,
  ReferralConfigPayload,
  ReferralMutationResponse,
  ReferralRejectPayload,
} from "@/types/admin/referrals";

function buildParams(filters: Partial<ReferralFilters>): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.referrer_id) params.referrer_id = filters.referrer_id;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  return params;
}

export const adminReferralsApi = {
  list: async (filters: Partial<ReferralFilters>): Promise<ReferralListResponse> => {
    try {
      const response = await backendApi.get<ReferralListResponse>(
        "/unified-admin/referrals",
        { params: buildParams(filters) },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  topReferrers: async (limit = 20): Promise<TopReferrersResponse> => {
    try {
      const response = await backendApi.get<TopReferrersResponse>(
        `/unified-admin/referrals/top-referrers?limit=${limit}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getConfig: async (): Promise<ReferralConfigResponse> => {
    try {
      const response = await backendApi.get<ReferralConfigResponse>(
        "/unified-admin/referrals/config",
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateConfig: async (payload: ReferralConfigPayload): Promise<ReferralConfigResponse> => {
    try {
      const response = await backendApi.put<ReferralConfigResponse>(
        "/unified-admin/referrals/config",
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  approve: async (id: string): Promise<ReferralMutationResponse> => {
    try {
      const response = await backendApi.post<ReferralMutationResponse>(
        `/unified-admin/referrals/${id}/approve`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  reject: async (id: string, payload: ReferralRejectPayload): Promise<ReferralMutationResponse> => {
    try {
      const response = await backendApi.post<ReferralMutationResponse>(
        `/unified-admin/referrals/${id}/reject`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
