import { create } from "zustand";
import { adminCashbackApi } from "@/services/admin/cashback-api";
import type {
  CashbackConfig,
  CashbackRule,
  CashbackAnalyticsData,
  CashbackHistoryItem,
  CashbackHistoryMeta,
  CashbackHistoryFilters,
} from "@/types/admin/cashback";

const CACHE_TTL = 60_000;
const MAX_HISTORY_CACHE = 20;

interface HistoryCacheEntry {
  data: {
    history: CashbackHistoryItem[];
    meta: CashbackHistoryMeta;
  };
  ts: number;
}

function filtersKey(f: CashbackHistoryFilters): string {
  return JSON.stringify(f);
}

const DEFAULT_HISTORY_FILTERS: CashbackHistoryFilters = {
  page: 1,
  limit: 20,
  user_id: "",
  service_type: "",
  date_from: "",
  date_to: "",
};

interface AdminCashbackState {
  config: CashbackConfig | null;
  rules: CashbackRule[];
  configLoading: boolean;
  configError: string | null;
  configFetched: boolean;
  configTs: number;

  analytics: CashbackAnalyticsData | null;
  analyticsLoading: boolean;
  analyticsError: string | null;
  analyticsFetched: boolean;
  analyticsTs: number;

  history: CashbackHistoryItem[];
  historyMeta: CashbackHistoryMeta | null;
  historyFilters: CashbackHistoryFilters;
  historyLoading: boolean;
  historyError: string | null;
  historyCache: Map<string, HistoryCacheEntry>;

  fetchConfig: (force?: boolean) => Promise<void>;
  fetchAnalytics: (force?: boolean) => Promise<void>;
  fetchHistory: (force?: boolean) => Promise<void>;

  setHistoryFilters: (patch: Partial<CashbackHistoryFilters>) => void;
  setHistoryPage: (page: number) => void;
  resetHistoryFilters: () => void;

  invalidateConfig: () => void;
}

export const useAdminCashbackStore = create<AdminCashbackState>((set, get) => ({
  config: null,
  rules: [],
  configLoading: false,
  configError: null,
  configFetched: false,
  configTs: 0,

  analytics: null,
  analyticsLoading: false,
  analyticsError: null,
  analyticsFetched: false,
  analyticsTs: 0,

  history: [],
  historyMeta: null,
  historyFilters: { ...DEFAULT_HISTORY_FILTERS },
  historyLoading: false,
  historyError: null,
  historyCache: new Map(),

  fetchConfig: async (force = false) => {
    const { configFetched, configTs } = get();
    if (!force && configFetched && Date.now() - configTs < CACHE_TTL) return;

    set({ configLoading: true, configError: null });
    try {
      const res = await adminCashbackApi.getConfig();
      if (res.success && res.data) {
        set({
          config: res.data.config,
          rules: res.data.rules,
          configFetched: true,
          configTs: Date.now(),
          configError: null,
        });
      } else {
        set({ configError: res.message || "Failed to load cashback config" });
      }
    } catch (err) {
      set({
        configError:
          err instanceof Error ? err.message : "Failed to load cashback config",
      });
    } finally {
      set({ configLoading: false });
    }
  },

  fetchAnalytics: async (force = false) => {
    const { analyticsFetched, analyticsTs } = get();
    if (!force && analyticsFetched && Date.now() - analyticsTs < CACHE_TTL) return;

    set({ analyticsLoading: true, analyticsError: null });
    try {
      const res = await adminCashbackApi.getAnalytics();
      if (res.success && res.data) {
        set({
          config: res.data.config,
          rules: res.data.rules,
          analytics: res.data.analytics,
          analyticsFetched: true,
          analyticsTs: Date.now(),
          configFetched: true,
          configTs: Date.now(),
          analyticsError: null,
        });
      } else {
        set({
          analyticsError: res.message || "Failed to load analytics",
        });
      }
    } catch (err) {
      set({
        analyticsError:
          err instanceof Error ? err.message : "Failed to load analytics",
      });
    } finally {
      set({ analyticsLoading: false });
    }
  },

  fetchHistory: async (force = false) => {
    const { historyFilters, historyCache } = get();
    const key = filtersKey(historyFilters);

    if (!force) {
      const cached = historyCache.get(key);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        set({
          history: cached.data.history,
          historyMeta: cached.data.meta,
          historyError: null,
        });
        return;
      }
    }

    set({ historyLoading: true, historyError: null });
    try {
      const res = await adminCashbackApi.getHistory(historyFilters);
      if (res.success && res.data) {
        const entry: HistoryCacheEntry = { data: res.data, ts: Date.now() };
        const newCache = new Map(get().historyCache);
        newCache.set(key, entry);
        if (newCache.size > MAX_HISTORY_CACHE) {
          const oldest = newCache.keys().next().value;
          if (oldest) newCache.delete(oldest);
        }
        set({
          history: res.data.history,
          historyMeta: res.data.meta,
          historyCache: newCache,
          historyError: null,
        });
      } else {
        set({ historyError: res.message || "Failed to load history" });
      }
    } catch (err) {
      set({
        historyError:
          err instanceof Error ? err.message : "Failed to load history",
      });
    } finally {
      set({ historyLoading: false });
    }
  },

  setHistoryFilters: (patch) => {
    set((s) => ({
      historyFilters: { ...s.historyFilters, ...patch, page: 1 },
    }));
  },

  setHistoryPage: (page) => {
    set((s) => ({
      historyFilters: { ...s.historyFilters, page },
    }));
  },

  resetHistoryFilters: () => {
    set({ historyFilters: { ...DEFAULT_HISTORY_FILTERS } });
  },

  invalidateConfig: () => {
    set({ configFetched: false, configTs: 0, analyticsFetched: false, analyticsTs: 0 });
  },
}));
