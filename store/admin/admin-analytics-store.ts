import { create } from "zustand";

import type { AnalyticsQuery } from "@/types/admin/analytics";
import type { RangeValue } from "@/app/admin/analyst/_components/section";

export type AnalyticsPeriod =
  | { mode: "preset"; range: RangeValue }
  | { mode: "custom"; from: string; to: string };

interface AdminAnalyticsState {
  period: AnalyticsPeriod;
  setPreset: (range: RangeValue) => void;
  setCustom: (from: string, to: string) => void;
  /** Query params for analytics API calls. */
  toQuery: () => AnalyticsQuery;
  /** Stable cache key fragment for the current period. */
  cacheKeyPart: () => string;
}

export const useAdminAnalyticsStore = create<AdminAnalyticsState>((set, get) => ({
  period: { mode: "preset", range: "30d" },

  setPreset: (range) => set({ period: { mode: "preset", range } }),

  setCustom: (from, to) => set({ period: { mode: "custom", from, to } }),

  toQuery: () => {
    const { period } = get();
    if (period.mode === "custom") {
      return { from: period.from, to: period.to };
    }
    return { range: period.range };
  },

  cacheKeyPart: () => {
    const { period } = get();
    if (period.mode === "custom") {
      return `custom:${period.from}|${period.to}`;
    }
    return period.range;
  },
}));
