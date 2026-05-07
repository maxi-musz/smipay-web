import { create } from "zustand";
import { persist } from "zustand/middleware";
import { vtpassDataApi } from "@/services/vtpass/vtu/vtpass-data-api";
import type { VtpassDataVariationCodesResponse } from "@/types/vtpass/vtu/vtpass-data";

type VariationData = VtpassDataVariationCodesResponse["data"];

interface VariationCacheEntry {
  data: VariationData;
  timestamp: number;
}

interface VtpassDataVariationsState {
  /** Cached variation codes keyed by serviceID. Persisted for 3 days. */
  cache: Record<string, VariationCacheEntry>;
  loadingServiceId: string | null;
  error: string | null;

  fetchVariationCodes: (serviceID: string, forceRefresh?: boolean) => Promise<VariationData | null>;
  getCached: (serviceID: string) => VariationData | null;
  clearCache: () => void;
}

const CACHE_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

function isCacheFresh(entry: VariationCacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_DURATION_MS;
}

export const useVtpassDataVariationsStore = create<VtpassDataVariationsState>()(
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

      fetchVariationCodes: async (serviceID: string, forceRefresh = false) => {
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
          const response = await vtpassDataApi.getVariationCodes(serviceID);
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
          set({ loadingServiceId: null, error: "Failed to load data plans" });
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
      name: "smipay-vtpass-data-variations",
      partialize: (s) => ({ cache: s.cache }),
    }
  )
);
