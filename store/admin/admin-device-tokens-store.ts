import { create } from "zustand";
import { adminPushBroadcastsApi } from "@/services/admin/push-broadcasts-api";
import type {
  DeviceToken,
  DeviceTokenFilters,
  DeviceTokenStats,
} from "@/types/admin/push-broadcasts";

const CACHE_TTL_MS = 90_000;
const MAX_LIST_CACHE = 20;

function filtersKey(filters: DeviceTokenFilters): string {
  return JSON.stringify(filters);
}

const DEFAULT_FILTERS: DeviceTokenFilters = {
  page: 1,
  limit: 20,
  platform: "",
  is_active: "",
  search: "",
};

interface ListCacheEntry {
  data: { tokens: DeviceToken[]; total: number; pages: number };
  ts: number;
}

interface AdminDeviceTokensState {
  tokens: DeviceToken[];
  total: number;
  pages: number;
  stats: DeviceTokenStats | null;
  statsFetchedAt: number | null;
  filters: DeviceTokenFilters;
  isLoading: boolean;
  error: string | null;
  listCache: Map<string, ListCacheEntry>;

  fetchTokens: (force?: boolean) => Promise<void>;
  fetchStats: (force?: boolean) => Promise<void>;
  refreshAll: (force?: boolean) => Promise<void>;
  setFilters: (patch: Partial<DeviceTokenFilters>) => void;
}

export const useAdminDeviceTokensStore = create<AdminDeviceTokensState>((set, get) => ({
  tokens: [],
  total: 0,
  pages: 0,
  stats: null,
  statsFetchedAt: null,
  filters: { ...DEFAULT_FILTERS },
  isLoading: false,
  error: null,
  listCache: new Map(),

  fetchTokens: async (force = false) => {
    const { filters, listCache } = get();
    const key = filtersKey(filters);

    if (!force) {
      const cached = listCache.get(key);
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        set({
          tokens: cached.data.tokens,
          total: cached.data.total,
          pages: cached.data.pages,
          error: null,
        });
        return;
      }
    }

    set({ isLoading: true, error: null });
    try {
      const res = await adminPushBroadcastsApi.listDeviceTokens(filters);
      const tokens = res.data.tokens ?? [];
      const total = res.data.total ?? 0;
      const pages = res.data.pages ?? 0;

      const entry: ListCacheEntry = {
        data: { tokens, total, pages },
        ts: Date.now(),
      };
      const nextCache = new Map(get().listCache);
      nextCache.set(key, entry);
      while (nextCache.size > MAX_LIST_CACHE) {
        const first = nextCache.keys().next().value;
        if (first) nextCache.delete(first);
        else break;
      }

      set({
        tokens,
        total,
        pages,
        listCache: nextCache,
        error: null,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load device tokens",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async (force = false) => {
    const { stats, statsFetchedAt } = get();
    if (
      !force &&
      stats != null &&
      statsFetchedAt != null &&
      Date.now() - statsFetchedAt < CACHE_TTL_MS
    ) {
      return;
    }

    try {
      const res = await adminPushBroadcastsApi.getDeviceTokenStats();
      set({ stats: res.data, statsFetchedAt: Date.now() });
    } catch {
      // stats are non-critical; keep previous stats if any
    }
  },

  refreshAll: async (force = true) => {
    await Promise.all([get().fetchTokens(force), get().fetchStats(force)]);
  },

  setFilters: (patch) => {
    set((state) => ({
      filters: { ...state.filters, ...patch },
    }));
  },
}));
