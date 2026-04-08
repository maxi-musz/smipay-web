import { create } from "zustand";
import { adminUsersApi } from "@/services/admin/users-api";
import type {
  AdminUser,
  AdminUserAnalytics,
  UserListMeta,
  UserFilters,
} from "@/types/admin/users";

const CACHE_TTL = 60_000;
const MAX_CACHE = 20;

interface CacheEntry {
  data: {
    analytics: AdminUserAnalytics;
    users: AdminUser[];
    meta: UserListMeta;
  };
  ts: number;
}

function filtersKey(f: UserFilters): string {
  return JSON.stringify(f);
}

const DEFAULT_FILTERS: UserFilters = {
  page: 1,
  limit: 20,
  search: "",
  role: "",
  account_status: "",
  tier: "",
  kyc_status: "",
  date_from: "",
  date_to: "",
  min_wallet_balance: "",
  max_wallet_balance: "",
  min_cashback_balance: "",
  max_cashback_balance: "",
  sort_by: "createdAt",
  sort_order: "desc",
};

interface AdminUsersState {
  users: AdminUser[];
  analytics: AdminUserAnalytics | null;
  meta: UserListMeta | null;
  filters: UserFilters;
  isLoading: boolean;
  error: string | null;
  cache: Map<string, CacheEntry>;

  fetchUsers: (force?: boolean) => Promise<void>;
  setFilters: (patch: Partial<UserFilters>) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  updateUser: (updated: AdminUser) => void;
}

export const useAdminUsersStore = create<AdminUsersState>((set, get) => ({
  users: [],
  analytics: null,
  meta: null,
  filters: { ...DEFAULT_FILTERS },
  isLoading: false,
  error: null,
  cache: new Map(),

  fetchUsers: async (force = false) => {
    const { filters, cache } = get();
    const key = filtersKey(filters);

    if (!force) {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        set({
          users: cached.data.users,
          analytics: cached.data.analytics,
          meta: cached.data.meta,
          error: null,
        });
        return;
      }
    }

    set({ isLoading: true, error: null });
    try {
      const res = await adminUsersApi.list(filters);
      if (res.success && res.data) {
        const entry: CacheEntry = { data: res.data, ts: Date.now() };
        const newCache = new Map(get().cache);
        newCache.set(key, entry);
        if (newCache.size > MAX_CACHE) {
          const oldest = newCache.keys().next().value;
          if (oldest) newCache.delete(oldest);
        }
        set({
          users: res.data.users,
          analytics: res.data.analytics,
          meta: res.data.meta,
          cache: newCache,
          error: null,
        });
      } else {
        set({ error: res.message || "Failed to load users" });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load users" });
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

  updateUser: (updated) => {
    set((s) => ({
      users: s.users.map((u) => (u.id === updated.id ? updated : u)),
      cache: new Map(),
    }));
  },
}));
