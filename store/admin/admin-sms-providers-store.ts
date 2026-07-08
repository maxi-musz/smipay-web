import { create } from "zustand";
import { adminSmsProvidersApi } from "@/services/admin/sms-providers-api";
import type {
  PaginatedMessages,
  SmsAnalyticsSummary,
  SmsBalance,
  SmsConfig,
  SmsDailyStat,
  SmsProviderConfig,
} from "@/types/admin/sms-providers";

const CACHE_TTL = 30_000;

interface AdminSmsProvidersState {
  config: SmsConfig | null;
  providers: SmsProviderConfig[];
  summary: SmsAnalyticsSummary | null;
  dailyStats: SmsDailyStat[];
  messages: PaginatedMessages | null;
  balance: SmsBalance | null;

  configLoading: boolean;
  providersLoading: boolean;
  summaryLoading: boolean;
  messagesLoading: boolean;
  balanceLoading: boolean;
  error: string | null;

  configTs: number;
  providersTs: number;

  fetchConfig: (force?: boolean) => Promise<void>;
  fetchProviders: (force?: boolean) => Promise<void>;
  fetchSummary: (force?: boolean) => Promise<void>;
  fetchDailyStats: () => Promise<void>;
  fetchMessages: (page?: number) => Promise<void>;
  fetchBalance: () => Promise<void>;
  invalidateAll: () => void;
}

export const useAdminSmsProvidersStore = create<AdminSmsProvidersState>(
  (set, get) => ({
    config: null,
    providers: [],
    summary: null,
    dailyStats: [],
    messages: null,
    balance: null,
    configLoading: false,
    providersLoading: false,
    summaryLoading: false,
    messagesLoading: false,
    balanceLoading: false,
    error: null,
    configTs: 0,
    providersTs: 0,

    fetchConfig: async (force = false) => {
      const { configTs } = get();
      if (!force && Date.now() - configTs < CACHE_TTL && get().config) return;
      set({ configLoading: true, error: null });
      try {
        const res = await adminSmsProvidersApi.getConfig();
        if (res.success && res.data) {
          set({ config: res.data, configTs: Date.now() });
        } else {
          set({ error: res.message || "Failed to load SMS config" });
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
        const res = await adminSmsProvidersApi.listProviders();
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
        const res = await adminSmsProvidersApi.getAnalyticsSummary();
        if (res.success && res.data) set({ summary: res.data });
      } finally {
        set({ summaryLoading: false });
      }
    },

    fetchDailyStats: async () => {
      try {
        const res = await adminSmsProvidersApi.getAnalyticsDaily();
        if (res.success && res.data) set({ dailyStats: res.data });
      } catch {
        /* non-fatal */
      }
    },

    fetchMessages: async (page = 1) => {
      set({ messagesLoading: true });
      try {
        const res = await adminSmsProvidersApi.listMessages({ page, limit: 15 });
        if (res.success && res.data) set({ messages: res.data });
      } finally {
        set({ messagesLoading: false });
      }
    },

    fetchBalance: async () => {
      set({ balanceLoading: true });
      try {
        const res = await adminSmsProvidersApi.getBalance();
        if (res.success && res.data) set({ balance: res.data });
      } catch {
        set({ balance: null });
      } finally {
        set({ balanceLoading: false });
      }
    },

    invalidateAll: () => {
      set({ configTs: 0, providersTs: 0, summary: null });
    },
  }),
);
