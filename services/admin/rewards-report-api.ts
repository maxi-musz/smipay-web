import { backendApi } from "@/lib/api-client-backend";
import { formatErrorMessage } from "@/lib/error-handler";
import type {
  ApiEnvelope,
  CreatePartnerLoadingPayload,
  GenerateReportPayload,
  MetricDefinition,
  PartnerLoadingEntry,
  PartnerLoadingList,
  RewardsReport,
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
