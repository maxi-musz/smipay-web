import { create } from "zustand";
import { adminAppVersionApi } from "@/services/admin/app-version-api";
import type { AppVersionGateConfig } from "@/types/admin/app-version";

const CACHE_TTL = 60_000;

interface AdminAppVersionState {
  config: AppVersionGateConfig | null;
  configLoading: boolean;
  configError: string | null;
  configFetched: boolean;
  configTs: number;

  fetchConfig: (force?: boolean) => Promise<void>;
  invalidateConfig: () => void;
}

export const useAdminAppVersionStore = create<AdminAppVersionState>(
  (set, get) => ({
    config: null,
    configLoading: false,
    configError: null,
    configFetched: false,
    configTs: 0,

    fetchConfig: async (force = false) => {
      const { configFetched, configTs } = get();
      if (!force && configFetched && Date.now() - configTs < CACHE_TTL) return;

      set({ configLoading: true, configError: null });
      try {
        const res = await adminAppVersionApi.getConfig();
        if (res.success && res.data) {
          set({
            config: res.data,
            configFetched: true,
            configTs: Date.now(),
            configError: null,
          });
        } else {
          set({ configError: res.message || "Failed to load config" });
        }
      } catch (err) {
        set({
          configError:
            err instanceof Error ? err.message : "Failed to load config",
        });
      } finally {
        set({ configLoading: false });
      }
    },

    invalidateConfig: () => {
      set({ configFetched: false, configTs: 0 });
    },
  }),
);
