import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  ApiEnvelope,
  CreatePartnerLoadingPayload,
  ForgedIncidentEvents,
  GenerateReportPayload,
  MetricDefinition,
  PartnerBalances,
  PartnerBalancesConfig,
  PartnerLoadingEntry,
  PartnerLoadingList,
  RewardsReport,
  VtpassBalance,
} from "@/types/admin/rewards-report";

const BASE = "/unified-admin/rewards-report";

export const adminRewardsReportApi = {
  getMetricsCatalog: async (): Promise<MetricDefinition[]> => {
    try {
      const res = await backendApi.get<ApiEnvelope<MetricDefinition[]>>(
        `${BASE}/metrics-catalog`,
      );
      return res.data.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  generate: async (payload: GenerateReportPayload): Promise<RewardsReport> => {
    try {
      const res = await backendApi.post<ApiEnvelope<RewardsReport>>(
        `${BASE}/generate`,
        payload,
      );
      return res.data.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  /** Downloads the report as a file and triggers a browser save. */
  exportFile: async (
    payload: GenerateReportPayload,
    format: "csv" | "xlsx",
  ): Promise<void> => {
    try {
      const res = await backendApi.post(`${BASE}/export`, payload, {
        params: { format },
        responseType: "blob",
      });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `rewards-report-${stamp}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getPartnerBalances: async (force = false): Promise<PartnerBalances> => {
    try {
      const res = await backendApi.get<ApiEnvelope<PartnerBalances>>(
        `${BASE}/partner-balances`,
        { params: force ? { force: 1 } : undefined },
      );
      return res.data.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getPartnerBalancesConfig: async (): Promise<PartnerBalancesConfig> => {
    try {
      const res = await backendApi.get<ApiEnvelope<PartnerBalancesConfig>>(
        "/unified-admin/partner-balances-config",
      );
      return res.data.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updatePartnerBalancesConfig: async (payload: {
    refresh_interval_seconds?: number;
    funding_accounts?: Record<
      string,
      { bank_name?: string; account_number?: string; account_name?: string }
    >;
  }): Promise<PartnerBalancesConfig> => {
    try {
      const res = await backendApi.put<ApiEnvelope<PartnerBalancesConfig>>(
        "/unified-admin/partner-balances-config",
        payload,
      );
      return res.data.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getVtpassBalance: async (force = false): Promise<VtpassBalance> => {
    try {
      const res = await backendApi.get<ApiEnvelope<VtpassBalance>>(
        `${BASE}/vtpass-balance`,
        { params: force ? { force: 1 } : undefined },
      );
      return res.data.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  getForgedIncidentEvents: async (): Promise<ForgedIncidentEvents> => {
    try {
      const res = await backendApi.get<ApiEnvelope<ForgedIncidentEvents>>(
        `${BASE}/forged-incident-events`,
      );
      return res.data.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  listPartnerLoading: async (params?: {
    partner?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<PartnerLoadingList> => {
    try {
      const res = await backendApi.get<ApiEnvelope<PartnerLoadingList>>(
        `${BASE}/partner-loading`,
        { params },
      );
      return res.data.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  createPartnerLoading: async (
    payload: CreatePartnerLoadingPayload,
  ): Promise<PartnerLoadingEntry> => {
    try {
      const res = await backendApi.post<ApiEnvelope<PartnerLoadingEntry>>(
        `${BASE}/partner-loading`,
        payload,
      );
      return res.data.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  deletePartnerLoading: async (id: string): Promise<void> => {
    try {
      await backendApi.delete(`${BASE}/partner-loading/${id}`);
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },
};
