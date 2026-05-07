import { create } from "zustand";
import { adminSupportApi } from "@/services/admin/support-api";
import type {
  SupportTicketItem,
  SupportTicketDetail,
  SupportAnalytics,
  SupportListMeta,
  SupportFilters,
} from "@/types/admin/support";

const CACHE_TTL = 60_000;
const MAX_CACHE = 20;

interface ListCacheEntry {
  data: {
    analytics: SupportAnalytics;
    tickets: SupportTicketItem[];
    meta: SupportListMeta;
  };
  ts: number;
}

interface DetailCacheEntry {
  data: SupportTicketDetail;
  ts: number;
}

function filtersKey(f: SupportFilters): string {
  return JSON.stringify(f);
}

const DEFAULT_FILTERS: SupportFilters = {
  page: 1,
  limit: 20,
  search: "",
  status: "",
  priority: "",
  support_type: "",
  assigned_to: "",
  user_id: "",
  date_from: "",
  date_to: "",
  sort_by: "createdAt",
  sort_order: "desc",
};

interface AdminSupportState {
  tickets: SupportTicketItem[];
  analytics: SupportAnalytics | null;
  meta: SupportListMeta | null;
  filters: SupportFilters;
  isLoading: boolean;
  error: string | null;
  listCache: Map<string, ListCacheEntry>;

  detailCache: Map<string, DetailCacheEntry>;
  detailLoading: boolean;
  detailError: string | null;

  fetchTickets: (force?: boolean) => Promise<void>;
  setFilters: (patch: Partial<SupportFilters>) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  fetchDetail: (id: string, force?: boolean) => Promise<SupportTicketDetail | null>;
  invalidateDetail: (id: string) => void;
}

export const useAdminSupportStore = create<AdminSupportState>((set, get) => ({
  tickets: [],
  analytics: null,
  meta: null,
  filters: { ...DEFAULT_FILTERS },
  isLoading: false,
  error: null,
  listCache: new Map(),

  detailCache: new Map(),
  detailLoading: false,
  detailError: null,

  fetchTickets: async (force = false) => {
    const { filters, listCache } = get();
    const key = filtersKey(filters);

    if (!force) {
      const cached = listCache.get(key);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        set({
          tickets: cached.data.tickets,
          analytics: cached.data.analytics,
          meta: cached.data.meta,
          error: null,
        });
        return;
      }
    }

    set({ isLoading: true, error: null });
    try {
      const res = await adminSupportApi.list(filters);
      if (res.success && res.data) {
        const entry: ListCacheEntry = { data: res.data, ts: Date.now() };
        const newCache = new Map(get().listCache);
        newCache.set(key, entry);
        if (newCache.size > MAX_CACHE) {
          const oldest = newCache.keys().next().value;
          if (oldest) newCache.delete(oldest);
        }
        set({
          tickets: res.data.tickets,
          analytics: res.data.analytics,
          meta: res.data.meta,
          listCache: newCache,
          error: null,
        });
      } else {
        set({ error: res.message || "Failed to load tickets" });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load tickets" });
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

  fetchDetail: async (id, force = false) => {
    const state = get();
    if (!force) {
      const cached = state.detailCache.get(id);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return cached.data;
      }
    }

    set({ detailLoading: true, detailError: null });
    try {
      const res = await adminSupportApi.getById(id);
      const ticket = res.data;
      const cache = new Map(state.detailCache);
      cache.set(id, { data: ticket, ts: Date.now() });
      if (cache.size > MAX_CACHE) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
      }
      set({ detailCache: cache, detailLoading: false });
      return ticket;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load ticket detail";
      set({ detailError: msg, detailLoading: false });
      return null;
    }
  },

  invalidateDetail: (id) => {
    const cache = new Map(get().detailCache);
    cache.delete(id);
    set({ detailCache: cache });
  },
}));
