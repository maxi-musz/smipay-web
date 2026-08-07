import { create } from "zustand";
import { adminEmailProvidersApi } from "@/services/admin/email-providers-api";
import type {
  EmailAnalyticsSummary,
  EmailConfig,
  EmailDailyStat,
  EmailProviderConfig,
  EmailSuppressionItem,
  PaginatedEmailMessages,
} from "@/types/admin/email-providers";

const CACHE_TTL = 30_000;

interface AdminEmailProvidersState {
  config: EmailConfig | null;
  providers: EmailProviderConfig[];
  summary: EmailAnalyticsSummary | null;
  dailyStats: EmailDailyStat[];
  messages: PaginatedEmailMessages | null;
  suppressions: EmailSuppressionItem[];

  configLoading: boolean;
  providersLoading: boolean;
  summaryLoading: boolean;
  messagesLoading: boolean;
  suppressionsLoading: boolean;
  error: string | null;

  configTs: number;
  providersTs: number;

  fetchConfig: (force?: boolean) => Promise<void>;
  fetchProviders: (force?: boolean) => Promise<void>;
  fetchSummary: (force?: boolean) => Promise<void>;
  fetchDailyStats: () => Promise<void>;
  fetchMessages: (page?: number) => Promise<void>;
  fetchSuppressions: () => Promise<void>;
  invalidateAll: () => void;
}

export const useAdminEmailProvidersStore = create<AdminEmailProvidersState>(
  (set, get) => ({
    config: null,
    providers: [],
    summary: null,
    dailyStats: [],
    messages: null,
    suppressions: [],
    configLoading: false,
    providersLoading: false,
    summaryLoading: false,
    messagesLoading: false,
    suppressionsLoading: false,
    error: null,
    configTs: 0,
    providersTs: 0,

    fetchConfig: async (force = false) => {
      const { configTs } = get();
      if (!force && Date.now() - configTs < CACHE_TTL && get().config) return;
      set({ configLoading: true, error: null });
      try {
        const res = await adminEmailProvidersApi.getConfig();
        if (res.success && res.data) {
          set({ config: res.data, configTs: Date.now() });
        } else {
          set({ error: res.message || "Failed to load email config" });
        }
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : "Failed to load config",
        });
      } finally {
        set({ configLoading: false });
      }
    },

    fetchProviders: async (force = false) => {
      const { providersTs } = get();
      if (!force && Date.now() - providersTs < CACHE_TTL && get().providers.length) {
        return;
      }
      set({ providersLoading: true, error: null });
      try {
        const res = await adminEmailProvidersApi.listProviders();
        if (res.success && res.data) {
          set({ providers: res.data, providersTs: Date.now() });
        }
      } catch (err) {
        set({
          error:
            err instanceof Error ? err.message : "Failed to load providers",
        });
      } finally {
        set({ providersLoading: false });
      }
    },

    fetchSummary: async (force = false) => {
      if (!force && get().summary) return;
      set({ summaryLoading: true });
      try {
        const res = await adminEmailProvidersApi.getAnalyticsSummary();
        if (res.success && res.data) set({ summary: res.data });
      } finally {
        set({ summaryLoading: false });
      }
    },

    fetchDailyStats: async () => {
      try {
        const res = await adminEmailProvidersApi.getAnalyticsDaily();
        if (res.success && res.data) set({ dailyStats: res.data });
      } catch {
        /* non-fatal */
      }
    },

    fetchMessages: async (page = 1) => {
      set({ messagesLoading: true });
      try {
        const res = await adminEmailProvidersApi.listMessages({ page, limit: 15 });
        if (res.success && res.data) set({ messages: res.data });
      } finally {
        set({ messagesLoading: false });
      }
    },

    fetchSuppressions: async () => {
      set({ suppressionsLoading: true });
      try {
        const res = await adminEmailProvidersApi.listSuppressions();
        if (res.success && res.data) set({ suppressions: res.data });
      } finally {
        set({ suppressionsLoading: false });
      }
    },

    invalidateAll: () => {
      set({ configTs: 0, providersTs: 0, summary: null });
    },
  }),
);
