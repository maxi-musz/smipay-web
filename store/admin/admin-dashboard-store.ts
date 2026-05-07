import { create } from "zustand";
import { adminDashboardApi } from "@/services/admin/dashboard-api";
import type { AdminDashboardData } from "@/types/admin/dashboard";

const CACHE_TTL = 60_000;

interface AdminDashboardState {
  data: AdminDashboardData | null;
  isLoading: boolean;
  isRecalculating: boolean;
  error: string | null;
  lastFetched: number;

  fetchDashboard: (force?: boolean) => Promise<void>;
  recalculate: () => Promise<void>;
}

export const useAdminDashboardStore = create<AdminDashboardState>((set, get) => ({
  data: null,
  isLoading: false,
  isRecalculating: false,
  error: null,
  lastFetched: 0,

  fetchDashboard: async (force = false) => {
    const { lastFetched, isLoading } = get();
    if (isLoading) return;
    if (!force && lastFetched && Date.now() - lastFetched < CACHE_TTL) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const res = await adminDashboardApi.getStats();
      if (res.success && res.data) {
        set({ data: res.data, lastFetched: Date.now(), error: null });
      } else {
        set({ error: res.message || "Failed to load dashboard" });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load dashboard" });
    } finally {
      set({ isLoading: false });
    }
  },

  recalculate: async () => {
    set({ isRecalculating: true });
    try {
      const res = await adminDashboardApi.recalculateStats();
      if (res.success && res.data) {
        set({ data: res.data, lastFetched: Date.now() });
      }
    } catch {
      // Non-critical; user can retry
    } finally {
      set({ isRecalculating: false });
    }
  },
}));
