import { create } from "zustand";
import { adminKycApi } from "@/services/admin/kyc-api";
import type { KycTier, TierPropertyDefinition } from "@/types/admin/kyc";

const CACHE_TTL = 60_000;

interface AdminKycState {
  tiers: KycTier[];
  properties: TierPropertyDefinition[];
  loading: boolean;
  error: string | null;
  fetched: boolean;
  fetchedAt: number;

  fetchOverview: (force?: boolean) => Promise<void>;
  invalidate: () => void;
}

export const useAdminKycStore = create<AdminKycState>((set, get) => ({
  tiers: [],
  properties: [],
  loading: false,
  error: null,
  fetched: false,
  fetchedAt: 0,

  fetchOverview: async (force = false) => {
    const { fetched, fetchedAt } = get();
    if (!force && fetched && Date.now() - fetchedAt < CACHE_TTL) return;

    set({ loading: true, error: null });
    try {
      const res = await adminKycApi.getOverview();
      if (res.success && res.data) {
        set({
          tiers: res.data.tiers,
          properties: res.data.properties,
          fetched: true,
          fetchedAt: Date.now(),
          error: null,
        });
      } else {
        set({ error: res.message || "Failed to load KYC config" });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load KYC config",
      });
    } finally {
      set({ loading: false });
    }
  },

  invalidate: () => {
    set({ fetched: false, fetchedAt: 0 });
  },
}));
