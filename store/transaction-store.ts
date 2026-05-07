import { create } from "zustand";
import { transactionApi } from "@/services/transaction-api";
import type {
  Transaction,
  PaginationMeta,
  CategoryCounts,
} from "@/types/transaction";

interface CachedPage {
  transactions: Transaction[];
  pagination: PaginationMeta;
  categories: CategoryCounts;
  fetchedAt: number;
}

interface TransactionStoreState {
  cache: Map<string, CachedPage>;
  isLoading: boolean;
  error: string | null;
  currentKey: string;

  fetchTransactions: (params: {
    page: number;
    limit: number;
    type: string;
    search: string;
  }) => Promise<void>;
  getCached: (key: string) => CachedPage | undefined;
  clearCache: () => void;
}

// 3-minute cache per page/filter combo
const CACHE_TTL = 3 * 60 * 1000;

function buildKey(p: number, type: string, search: string) {
  return `${p}|${type || "all"}|${search || ""}`;
}

export const useTransactionStore = create<TransactionStoreState>((set, get) => ({
  cache: new Map(),
  isLoading: false,
  error: null,
  currentKey: "",

  fetchTransactions: async ({ page, limit, type, search }) => {
    const key = buildKey(page, type, search);
    const state = get();
    const existing = state.cache.get(key);

    if (existing && Date.now() - existing.fetchedAt < CACHE_TTL) {
      set({ currentKey: key, error: null });
      return;
    }

    set({ isLoading: true, error: null, currentKey: key });

    try {
      const res = await transactionApi.getAllTransactions({
        page,
        limit,
        type: type !== "all" ? type : undefined,
        search: search || undefined,
      });

      if (res.success && res.data) {
        const next = new Map(get().cache);
        next.set(key, {
          transactions: res.data.transactions,
          pagination: res.data.pagination,
          categories: res.data.categories,
          fetchedAt: Date.now(),
        });
        set({ cache: next, isLoading: false, currentKey: key });
      } else {
        set({
          error: res.message || "Failed to load transactions",
          isLoading: false,
        });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Something went wrong",
        isLoading: false,
      });
    }
  },

  getCached: (key: string) => get().cache.get(key),

  clearCache: () => set({ cache: new Map() }),
}));
