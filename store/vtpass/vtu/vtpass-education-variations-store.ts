import { create } from "zustand";
import { persist } from "zustand/middleware";
import { vtpassEducationApi } from "@/services/vtpass/vtu/vtpass-education-api";
import type { VtpassEducationVariationsResponse } from "@/types/vtpass/vtu/vtpass-education";

type VariationData = VtpassEducationVariationsResponse["data"];

interface VariationCacheEntry {
  data: VariationData;
  timestamp: number;
}

interface VtpassEducationVariationsState {
  /** Cached variations keyed by serviceID. Persisted for 3 days. */
  cache: Record<string, VariationCacheEntry>;
  loadingServiceId: string | null;
  error: string | null;

  fetchVariations: (serviceID: string, forceRefresh?: boolean) => Promise<VariationData | null>;
  getCached: (serviceID: string) => VariationData | null;
  clearCache: () => void;
}

const CACHE_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

function isCacheFresh(entry: VariationCacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_DURATION_MS;
}

export const useVtpassEducationVariationsStore = create<VtpassEducationVariationsState>()(
  persist(
    (set, get) => ({
      cache: {},
      loadingServiceId: null,
      error: null,

      getCached: (serviceID: string) => {
        const entry = get().cache[serviceID];
        if (!entry || !isCacheFresh(entry)) return null;
        return entry.data;
      },

      fetchVariations: async (serviceID: string, forceRefresh = false) => {
        const state = get();

        if (!forceRefresh) {
          const cached = state.cache[serviceID];
          if (cached && isCacheFresh(cached)) {
            set({ error: null });
            return cached.data;
          }
        }

        if (state.loadingServiceId === serviceID) {
          return state.cache[serviceID]?.data ?? null;
        }

        set({ loadingServiceId: serviceID, error: null });

        try {
          const response = await vtpassEducationApi.getVariations(serviceID);
          if (response.success && response.data) {
            const entry: VariationCacheEntry = {
              data: response.data,
              timestamp: Date.now(),
            };
            set((s) => ({
              cache: { ...s.cache, [serviceID]: entry },
              loadingServiceId: null,
              error: null,
            }));
            return response.data;
          }
          set({ loadingServiceId: null, error: "Failed to load education plans" });
          return null;
        } catch (err) {
          const msg = err instanceof Error ? err.message : "An error occurred";
          set({ loadingServiceId: null, error: msg });
          return null;
        }
      },

      clearCache: () => set({ cache: {} }),
    }),
    {
      name: "smipay-vtpass-education-variations",
      partialize: (s) => ({ cache: s.cache }),
    }
  )
);
