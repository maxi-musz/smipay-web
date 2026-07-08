import { create } from "zustand";
import { adminTransactionsApi } from "@/services/admin/transactions-api";
import type {
  TransactionItem,
  TransactionAnalytics,
  TransactionListMeta,
  TransactionFilters,
} from "@/types/admin/transactions";

const CACHE_TTL = 180_000;
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

/** Dedupe concurrent list calls for the same filter key (rapid tab switching). */
const inflightByKey = new Map<string, Promise<CacheEntry | null>>();

const DEFAULT_FILTERS: TransactionFilters = {
  page: 1,
  limit: 20,
  search: "",
  status: "success",
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
  /** Last full-list result (search="") — instant restore when clearing search */
  baselineCache: CacheEntry | null;
  baselineKey: string | null;

  fetchTransactions: (force?: boolean) => Promise<void>;
  invalidateListCache: () => void;
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
    const filtersSnapshot = { ...get().filters };
    const key = filtersKey(filtersSnapshot);
    const isNoSearch = !filtersSnapshot.search?.trim();
    const { cache, baselineCache, baselineKey } = get();

    const isCurrentKey = () => filtersKey(get().filters) === key;

    if (!force) {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        set({
          transactions: cached.data.transactions,
          analytics: cached.data.analytics,
          meta: cached.data.meta,
          error: null,
          isLoading: false,
        });
        return;
      }

      const inflight = inflightByKey.get(key);
      if (inflight) {
        const existing = cache.get(key);
        if (!existing) {
          set({ isLoading: true, error: null });
        }
        const entry = await inflight;
        if (entry && isCurrentKey()) {
          const newCache = new Map(get().cache);
          newCache.set(key, entry);
          set({
            transactions: entry.data.transactions,
            analytics: entry.data.analytics,
            meta: entry.data.meta,
            cache: newCache,
            baselineCache: isNoSearch ? entry : get().baselineCache,
            baselineKey: isNoSearch ? key : get().baselineKey,
            error: null,
            isLoading: false,
          });
        } else if (isCurrentKey()) {
          set({ isLoading: false });
        }
        return;
      }

      if (
        isNoSearch &&
        baselineCache &&
        baselineKey === key &&
        Date.now() - baselineCache.ts < CACHE_TTL
      ) {
        set({
          transactions: baselineCache.data.transactions,
          analytics: baselineCache.data.analytics,
          meta: baselineCache.data.meta,
          error: null,
          isLoading: false,
        });
        return;
      }
    }

    const staleEntry = !force ? cache.get(key) : undefined;
    if (staleEntry && isCurrentKey()) {
      set({
        transactions: staleEntry.data.transactions,
        analytics: staleEntry.data.analytics,
        meta: staleEntry.data.meta,
        error: null,
        isLoading: false,
      });
    }

    const fetchJob = (async (): Promise<CacheEntry | null> => {
      try {
        const res = await adminTransactionsApi.list(filtersSnapshot);
        if (!res.success || !res.data) {
          if (isCurrentKey()) {
            set({ error: res.message || "Failed to load transactions" });
          }
          return null;
        }
        return { data: res.data, ts: Date.now() };
      } catch (err) {
        if (isCurrentKey()) {
          set({
            error: err instanceof Error ? err.message : "Failed to load transactions",
          });
        }
        return null;
      }
    })();

    inflightByKey.set(key, fetchJob);

    if (!staleEntry && isCurrentKey()) {
      set({ isLoading: true, error: null });
    }

    try {
      const entry = await fetchJob;
      if (!entry) return;

      const newCache = new Map(get().cache);
      newCache.set(key, entry);
      if (newCache.size > MAX_CACHE) {
        const oldest = newCache.keys().next().value;
        if (oldest) newCache.delete(oldest);
      }

      if (!isCurrentKey()) {
        set({ cache: newCache });
        return;
      }

      set({
        transactions: entry.data.transactions,
        analytics: entry.data.analytics,
        meta: entry.data.meta,
        cache: newCache,
        baselineCache: isNoSearch ? entry : get().baselineCache,
        baselineKey: isNoSearch ? key : get().baselineKey,
        error: null,
      });
    } finally {
      inflightByKey.delete(key);
      if (isCurrentKey()) {
        set({ isLoading: false });
      }
    }
  },

  invalidateListCache: () => {
    set({ cache: new Map(), baselineCache: null, baselineKey: null });
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
