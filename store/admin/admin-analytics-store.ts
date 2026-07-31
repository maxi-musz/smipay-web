import { create } from "zustand";

import type { RangeValue } from "@/app/admin/analyst/_components/section";

interface AdminAnalyticsState {
  range: RangeValue;
  setRange: (range: RangeValue) => void;
}

export const useAdminAnalyticsStore = create<AdminAnalyticsState>((set) => ({
  range: "30d",
  setRange: (range) => set({ range }),
}));
