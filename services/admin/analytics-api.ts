import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  AnalyticsQuery,
  ApiResponse,
  DevicesData,
  EngagementData,
  OverviewData,
  RevenueData,
  TransactionsData,
  UsersData,
} from "@/types/admin/analytics";

const BASE = "/unified-admin/analytics";

async function get<T>(path: string, params?: AnalyticsQuery): Promise<T> {
  try {
    const res = await backendApi.get<ApiResponse<T>>(`${BASE}/${path}`, {
      params,
    });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Request failed");
    }
    return res.data.data;
  } catch (error) {
    throw new Error(formatErrorMessage(error));
  }
}

export const analyticsApi = {
  overview: (q?: AnalyticsQuery) => get<OverviewData>("overview", q),
  users: (q?: AnalyticsQuery) => get<UsersData>("users", q),
  transactions: (q?: AnalyticsQuery) => get<TransactionsData>("transactions", q),
  revenue: (q?: AnalyticsQuery) => get<RevenueData>("revenue", q),
  engagement: (q?: AnalyticsQuery) => get<EngagementData>("engagement", q),
  devices: (q?: AnalyticsQuery) => get<DevicesData>("devices", q),
};
