import { create } from "zustand";
import { adminTransactionsApi } from "@/services/admin/transactions-api";
import type {
  TransactionItem,
  TransactionAnalytics,
  TransactionListMeta,
  TransactionFilters,
} from "@/types/admin/transactions";

const CACHE_TTL = 60_000;
const MAX_CACHE = 20;

interface CacheEntry {
  data: {
    analytics: TransactionAnalytics;
    transactions: TransactionItem[];
    meta: TransactionListMeta;
  };
  ts: number;
}

function filtersKey(f: TransactionFilters): string {
  return JSON.stringify(f);
}

const DEFAULT_FILTERS: TransactionFilters = {
  page: 1,
  limit: 20,
  search: "",
  status: "",
  transaction_type: "",
  credit_debit: "",
  payment_channel: "",
  user_id: "",
  min_amount: "",
  max_amount: "",
  date_from: "",
  date_to: "",
  sort_by: "createdAt",
  sort_order: "desc",
  wallet_integrity: "",
};

interface AdminTransactionsState {
  transactions: TransactionItem[];
  analytics: TransactionAnalytics | null;
  meta: TransactionListMeta | null;
  filters: TransactionFilters;
  isLoading: boolean;
  error: string | null;
  cache: Map<string, CacheEntry>;
  /** Last full-list result (search="") — used for instant restore when clearing search */
  baselineCache: CacheEntry | null;
  baselineKey: string | null;

  fetchTransactions: (force?: boolean) => Promise<void>;
  setFilters: (patch: Partial<TransactionFilters>) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

export const useAdminTransactionsStore = create<AdminTransactionsState>((set, get) => ({
  transactions: [],
  analytics: null,
  meta: null,
  filters: { ...DEFAULT_FILTERS },
  isLoading: false,
  error: null,
  cache: new Map(),
  baselineCache: null,
  baselineKey: null,

  fetchTransactions: async (force = false) => {
    const { filters, cache, baselineCache, baselineKey } = get();
    const key = filtersKey(filters);
    const isNoSearch = !filters.search?.trim();

    set({ isLoading: true, error: null });

    if (!force) {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        set({
          transactions: cached.data.transactions,
          analytics: cached.data.analytics,
          meta: cached.data.meta,
          error: null,
          isLoading: false,
        });
        return;
      }
      if (
        isNoSearch &&
        baselineCache &&
        baselineKey === key &&
        Date.now() - baselineCache.ts < CACHE_TTL
      ) {
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        set({
          transactions: baselineCache.data.transactions,
          analytics: baselineCache.data.analytics,
          meta: baselineCache.data.meta,
          error: null,
          isLoading: false,
        });
        try {
          const res = await adminTransactionsApi.list(filters);
          if (res.success && res.data) {
            const entry: CacheEntry = { data: res.data, ts: Date.now() };
            const newCache = new Map(get().cache);
            newCache.set(key, entry);
            if (newCache.size > MAX_CACHE) {
              const oldest = newCache.keys().next().value;
              if (oldest) newCache.delete(oldest);
            }
            set({
              transactions: res.data.transactions,
              analytics: res.data.analytics,
              meta: res.data.meta,
              cache: newCache,
              baselineCache: entry,
              baselineKey: key,
            });
          }
        } catch {
          // Keep baseline data on background refresh failure
        }
        return;
      }
    }

    try {
      const res = await adminTransactionsApi.list(filters);
      if (res.success && res.data) {
        const entry: CacheEntry = { data: res.data, ts: Date.now() };
        const newCache = new Map(get().cache);
        newCache.set(key, entry);
        if (newCache.size > MAX_CACHE) {
          const oldest = newCache.keys().next().value;
          if (oldest) newCache.delete(oldest);
        }
        set({
          transactions: res.data.transactions,
          analytics: res.data.analytics,
          meta: res.data.meta,
          cache: newCache,
          baselineCache: isNoSearch ? entry : get().baselineCache,
          baselineKey: isNoSearch ? key : get().baselineKey,
          error: null,
        });
      } else {
        set({ error: res.message || "Failed to load transactions" });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load transactions" });
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
}));
