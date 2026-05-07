import { create } from "zustand";
import { adminMarkupApi } from "@/services/admin/markup-api";
import type { MarkupConfig, MarkupRule } from "@/types/admin/markup";

const CACHE_TTL = 60_000;

interface AdminMarkupState {
  config: MarkupConfig | null;
  rules: MarkupRule[];
  configLoading: boolean;
  configError: string | null;
  configFetched: boolean;
  configTs: number;

  fetchConfig: (force?: boolean) => Promise<void>;
  invalidateConfig: () => void;
}

export const useAdminMarkupStore = create<AdminMarkupState>((set, get) => ({
  config: null,
  rules: [],
  configLoading: false,
  configError: null,
  configFetched: false,
  configTs: 0,

  fetchConfig: async (force = false) => {
    const { configFetched, configTs } = get();
    if (!force && configFetched && Date.now() - configTs < CACHE_TTL) return;

    set({ configLoading: true, configError: null });
    try {
      const res = await adminMarkupApi.getConfig();
      if (res.success && res.data) {
        set({
          config: res.data.config,
          rules: res.data.rules,
          configFetched: true,
          configTs: Date.now(),
          configError: null,
        });
      } else {
        set({ configError: res.message || "Failed to load markup config" });
      }
    } catch (err) {
      set({
        configError:
          err instanceof Error ? err.message : "Failed to load markup config",
      });
    } finally {
      set({ configLoading: false });
    }
  },

  invalidateConfig: () => {
    set({ configFetched: false, configTs: 0 });
  },
}));
