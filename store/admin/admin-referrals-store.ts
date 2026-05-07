import { create } from "zustand";
import { adminReferralsApi } from "@/services/admin/referrals-api";
import type {
  ReferralItem,
  ReferralAnalytics,
  ReferralListMeta,
  ReferralFilters,
  TopReferrerEntry,
} from "@/types/admin/referrals";

const CACHE_TTL = 60_000;
const MAX_CACHE = 20;

interface ListCacheEntry {
  data: {
    analytics: ReferralAnalytics;
    referrals: ReferralItem[];
    meta: ReferralListMeta;
  };
  ts: number;
}

function filtersKey(f: ReferralFilters): string {
  return JSON.stringify(f);
}

const DEFAULT_FILTERS: ReferralFilters = {
  page: 1,
  limit: 20,
  search: "",
  status: "",
  referrer_id: "",
  date_from: "",
  date_to: "",
};

interface AdminReferralsState {
  referrals: ReferralItem[];
  analytics: ReferralAnalytics | null;
  meta: ReferralListMeta | null;
  filters: ReferralFilters;
  isLoading: boolean;
  error: string | null;
  listCache: Map<string, ListCacheEntry>;

  leaderboard: TopReferrerEntry[];
  leaderboardLoading: boolean;
  leaderboardFetched: boolean;

  fetchReferrals: (force?: boolean) => Promise<void>;
  setFilters: (patch: Partial<ReferralFilters>) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  fetchLeaderboard: (force?: boolean) => Promise<void>;
}

export const useAdminReferralsStore = create<AdminReferralsState>((set, get) => ({
  referrals: [],
  analytics: null,
  meta: null,
  filters: { ...DEFAULT_FILTERS },
  isLoading: false,
  error: null,
  listCache: new Map(),

  leaderboard: [],
  leaderboardLoading: false,
  leaderboardFetched: false,

  fetchReferrals: async (force = false) => {
    const { filters, listCache } = get();
    const key = filtersKey(filters);

    if (!force) {
      const cached = listCache.get(key);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        set({
          referrals: cached.data.referrals,
          analytics: cached.data.analytics,
          meta: cached.data.meta,
          error: null,
        });
        return;
      }
    }

    set({ isLoading: true, error: null });
    try {
      const res = await adminReferralsApi.list(filters);
      if (res.success && res.data) {
        const entry: ListCacheEntry = { data: res.data, ts: Date.now() };
        const newCache = new Map(get().listCache);
        newCache.set(key, entry);
        if (newCache.size > MAX_CACHE) {
          const oldest = newCache.keys().next().value;
          if (oldest) newCache.delete(oldest);
        }
        set({
          referrals: res.data.referrals,
          analytics: res.data.analytics,
          meta: res.data.meta,
          listCache: newCache,
          error: null,
        });
      } else {
        set({ error: res.message || "Failed to load referrals" });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load referrals" });
    } finally {
      set({ isLoading: false });
    }
  },

  setFilters: (patch) => {
    set((s) => ({ filters: { ...s.filters, ...patch, page: 1 } }));
  },

  setPage: (page) => {
    set((s) => ({ filters: { ...s.filters, page } }));
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } });
  },

  fetchLeaderboard: async (force = false) => {
    const { leaderboardFetched } = get();
    if (!force && leaderboardFetched) return;

    set({ leaderboardLoading: true });
    try {
      const res = await adminReferralsApi.topReferrers();
      if (res.success && res.data) {
        set({
          leaderboard: res.data.leaderboard,
          leaderboardFetched: true,
        });
      }
    } catch {
      // Leaderboard failure is non-critical; list data remains usable
    } finally {
      set({ leaderboardLoading: false });
    }
  },
}));
