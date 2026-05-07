import { create } from "zustand";
import { adminAuditLogsApi } from "@/services/admin/audit-logs-api";
import type {
  AuditLogItem,
  AuditListMeta,
  AuditAnalytics,
  AuditFilters,
} from "@/types/admin/audit-logs";

const CACHE_TTL = 60_000;
const MAX_CACHE_ENTRIES = 20;

const DEFAULT_FILTERS: AuditFilters = {
  page: 1,
  limit: 20,
  search: "",
  user_id: "",
  action: "",
  category: "",
  status: "",
  severity: "",
  actor_type: "",
  resource_type: "",
  ip_address: "",
  is_flagged: "",
  date_from: "",
  date_to: "",
};

interface CacheEntry {
  logs: AuditLogItem[];
  meta: AuditListMeta;
  analytics: AuditAnalytics;
  timestamp: number;
}

interface AdminAuditLogsState {
  logs: AuditLogItem[];
  meta: AuditListMeta | null;
  analytics: AuditAnalytics | null;
  filters: AuditFilters;
  isLoading: boolean;
  error: string | null;
  cache: Map<string, CacheEntry>;

  fetchLogs: (forceRefresh?: boolean) => Promise<void>;
  setFilters: (patch: Partial<AuditFilters>) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

export const useAdminAuditLogsStore = create<AdminAuditLogsState>(
  (set, get) => ({
    logs: [],
    meta: null,
    analytics: null,
    filters: { ...DEFAULT_FILTERS },
    isLoading: false,
    error: null,
    cache: new Map(),

    fetchLogs: async (forceRefresh = false) => {
      const state = get();
      if (state.isLoading) return;

      const filtersKey = JSON.stringify(state.filters);

      if (!forceRefresh) {
        const cached = state.cache.get(filtersKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          set({
            logs: cached.logs,
            meta: cached.meta,
            analytics: cached.analytics,
            error: null,
          });
          return;
        }
      }

      set({ isLoading: true, error: null });

      try {
        const res = await adminAuditLogsApi.list(state.filters);
        const { logs, meta, analytics } = res.data;

        const cache = new Map(get().cache);
        if (cache.size >= MAX_CACHE_ENTRIES) {
          const oldestKey = cache.keys().next().value;
          if (oldestKey !== undefined) cache.delete(oldestKey);
        }
        cache.set(filtersKey, {
          logs,
          meta,
          analytics,
          timestamp: Date.now(),
        });

        set({
          logs,
          meta,
          analytics,
          cache,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        set({
          error:
            err instanceof Error
              ? err.message
              : "Failed to load audit logs",
          isLoading: false,
        });
      }
    },

    setFilters: (patch) => {
      set((state) => ({
        filters: { ...state.filters, page: 1, ...patch },
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
