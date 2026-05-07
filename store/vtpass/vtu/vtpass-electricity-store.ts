import { create } from "zustand";
import { persist } from "zustand/middleware";
import { vtpassElectricityApi } from "@/services/vtpass/vtu/vtpass-electricity-api";
import type { VtpassElectricityService } from "@/types/vtpass/vtu/vtpass-electricity";

interface VtpassElectricityState {
  serviceIds: VtpassElectricityService[] | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  fetchServiceIds: (forceRefresh?: boolean) => Promise<void>;
  setServiceIds: (services: VtpassElectricityService[]) => void;
  clearServiceIds: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const CACHE_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export const useVtpassElectricityStore = create<VtpassElectricityState>()(
  persist(
    (set, get) => ({
  serviceIds: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchServiceIds: async (forceRefresh = false) => {
    const state = get();

    if (state.isLoading) return;

    if (!forceRefresh && state.serviceIds && state.lastFetched) {
      const cacheAge = Date.now() - state.lastFetched;
      if (cacheAge < CACHE_DURATION_MS) return;
    }

    try {
      set({ isLoading: true, error: null });
      const response = await vtpassElectricityApi.getServiceIds();

      if (response.success && response.data) {
        set({
          serviceIds: response.data,
          lastFetched: Date.now(),
          error: null,
          isLoading: false,
        });
      } else {
        set({
          error: "Failed to load electricity providers",
          isLoading: false,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  setServiceIds: (services) => {
    set({
      serviceIds: services,
      lastFetched: Date.now(),
      error: null,
    });
  },

  clearServiceIds: () => {
    set({
      serviceIds: null,
      lastFetched: null,
      error: null,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}),
    {
      name: "smipay-vtpass-electricity-service-ids",
      partialize: (s) => ({
        serviceIds: s.serviceIds,
        lastFetched: s.lastFetched,
      }),
    }
  )
);
