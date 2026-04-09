import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  UserListResponse,
  UserDetailResponse,
  UserMutationResponse,
  UserFilters,
  AdjustBalancesResponse,
  AdjustUserBalancesPayload,
} from "@/types/admin/users";

function buildParams(filters: Partial<UserFilters>): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.search) params.search = filters.search;
  if (filters.role) params.role = filters.role;
  if (filters.account_status) params.account_status = filters.account_status;
  if (filters.tier) params.tier = filters.tier;
  if (filters.kyc_status) params.kyc_status = filters.kyc_status;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.min_wallet_balance?.trim())
    params.min_wallet_balance = filters.min_wallet_balance.trim();
  if (filters.max_wallet_balance?.trim())
    params.max_wallet_balance = filters.max_wallet_balance.trim();
  if (filters.min_cashback_balance?.trim())
    params.min_cashback_balance = filters.min_cashback_balance.trim();
  if (filters.max_cashback_balance?.trim())
    params.max_cashback_balance = filters.max_cashback_balance.trim();
  if (filters.list_sort) params.list_sort = filters.list_sort;
  if (filters.sort_by) params.sort_by = filters.sort_by;
  if (filters.sort_order) params.sort_order = filters.sort_order;
  return params;
}

export const adminUsersApi = {
  list: async (filters: Partial<UserFilters>): Promise<UserListResponse> => {
    try {
      const response = await backendApi.get<UserListResponse>(
        "/unified-admin/users",
        { params: buildParams(filters) },
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getById: async (id: string): Promise<UserDetailResponse> => {
    try {
      const response = await backendApi.get<UserDetailResponse>(
        `/unified-admin/users/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateStatus: async (
    id: string,
    payload: { account_status: string; reason?: string },
  ): Promise<UserMutationResponse> => {
    try {
      const response = await backendApi.put<UserMutationResponse>(
        `/unified-admin/users/${id}/status`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateRole: async (
    id: string,
    payload: { role: string; reason?: string },
  ): Promise<UserMutationResponse> => {
    try {
      const response = await backendApi.put<UserMutationResponse>(
        `/unified-admin/users/${id}/role`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateTier: async (
    id: string,
    payload: { tier_id: string; reason?: string },
  ): Promise<UserMutationResponse> => {
    try {
      const response = await backendApi.put<UserMutationResponse>(
        `/unified-admin/users/${id}/tier`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  adjustBalances: async (
    id: string,
    payload: AdjustUserBalancesPayload,
  ): Promise<AdjustBalancesResponse> => {
    try {
      const response = await backendApi.post<AdjustBalancesResponse>(
        `/unified-admin/users/${id}/balances/adjust`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
