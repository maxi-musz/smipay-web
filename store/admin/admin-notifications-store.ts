import { create } from "zustand";
import { adminNotificationsApi } from "@/services/admin/notifications-api";
import type {
  NotificationCampaign,
  NotificationCampaignFilters,
  NotificationCampaignListMeta,
} from "@/types/admin/notifications";

const CACHE_TTL = 45_000;
const MAX_CACHE = 20;

interface CacheEntry {
  data: {
    campaigns: NotificationCampaign[];
    meta: NotificationCampaignListMeta;
  };
  ts: number;
}

function filtersKey(filters: NotificationCampaignFilters): string {
  return JSON.stringify(filters);
}

const DEFAULT_FILTERS: NotificationCampaignFilters = {
  page: 1,
  limit: 20,
  status: "",
};

interface AdminNotificationsState {
  campaigns: NotificationCampaign[];
  meta: NotificationCampaignListMeta | null;
  filters: NotificationCampaignFilters;
  isLoading: boolean;
  error: string | null;
  cache: Map<string, CacheEntry>;

  fetchCampaigns: (force?: boolean) => Promise<void>;
  setFilters: (patch: Partial<NotificationCampaignFilters>) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

export const useAdminNotificationsStore = create<AdminNotificationsState>(
  (set, get) => ({
    campaigns: [],
    meta: null,
    filters: { ...DEFAULT_FILTERS },
    isLoading: false,
    error: null,
    cache: new Map(),

    fetchCampaigns: async (force = false) => {
      const { filters, cache } = get();
      const key = filtersKey(filters);

      if (!force) {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          set({
            campaigns: cached.data.campaigns,
            meta: cached.data.meta,
            error: null,
          });
          return;
        }
      }

      set({ isLoading: true, error: null });
      try {
        const res = await adminNotificationsApi.listCampaigns(filters);
        const payload = res.data;
        const normalized = {
          campaigns: payload.campaigns ?? [],
          meta: {
            total: payload.total ?? 0,
            page: payload.page ?? filters.page,
            limit: payload.limit ?? filters.limit,
            pages: payload.pages ?? 0,
          },
        };

        const entry: CacheEntry = { data: normalized, ts: Date.now() };
        const newCache = new Map(get().cache);
        newCache.set(key, entry);
        if (newCache.size > MAX_CACHE) {
          const oldest = newCache.keys().next().value;
          if (oldest) newCache.delete(oldest);
        }

        set({
          campaigns: normalized.campaigns,
          meta: normalized.meta,
          cache: newCache,
          error: null,
        });
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : "Failed to load campaigns",
        });
      } finally {
        set({ isLoading: false });
      }
    },

    setFilters: (patch) => {
      set((state) => ({
        filters: { ...state.filters, ...patch, page: 1 },
      }));
    },

    setPage: (page) => {
      set((state) => ({
        filters: { ...state.filters, page },
      }));
    },

    resetFilters: () => {
      set({ filters: { ...DEFAULT_FILTERS } });
    },
  }),
);
