import { create } from "zustand";
import { userApi } from "@/services/user-api";
import type { DashboardData } from "@/types/dashboard";

interface DashboardState {
  dashboardData: DashboardData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastFetched: number | null;
  
  // Actions
  fetchDashboardData: (forceRefresh?: boolean) => Promise<void>;
  setDashboardData: (data: DashboardData) => void;
  clearDashboardData: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Cache duration: 5 minutes.
// Balance/transactions only change after explicit actions (funding, purchases)
// which already call refetch() manually, so aggressive polling is unnecessary.
const CACHE_DURATION = 5 * 60 * 1000;

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboardData: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastFetched: null,

  fetchDashboardData: async (forceRefresh = false) => {
    const state = get();
    
    if (state.isLoading || state.isRefreshing) {
      return;
    }

    if (!forceRefresh && state.dashboardData && state.lastFetched) {
      const cacheAge = Date.now() - state.lastFetched;
      if (cacheAge < CACHE_DURATION) {
        return;
      }
    }

    const hasExistingData = !!state.dashboardData;

    try {
      // Only show full skeleton on initial load (no data yet).
      // When data already exists, use isRefreshing (silent background fetch).
      if (hasExistingData) {
        set({ isRefreshing: true, error: null });
      } else {
        set({ isLoading: true, error: null });
      }

      const response = await userApi.getAppHomepageDetails();
      
      if (response.success && response.data) {
        set({
          dashboardData: response.data,
          lastFetched: Date.now(),
          error: null,
          isLoading: false,
          isRefreshing: false,
        });
      } else {
        set({ 
          error: hasExistingData ? null : "Failed to load dashboard data",
          isLoading: false,
          isRefreshing: false,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      set({ 
        error: hasExistingData ? null : errorMessage,
        isLoading: false,
        isRefreshing: false,
      });
    }
  },

  setDashboardData: (data) => {
    set({
      dashboardData: data,
      lastFetched: Date.now(),
      error: null,
    });
  },

  clearDashboardData: () => {
    set({
      dashboardData: null,
      lastFetched: null,
      error: null,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
}));
