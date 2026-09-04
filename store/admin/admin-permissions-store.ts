import { create } from "zustand";
import { adminManagementApi } from "@/services/admin/management-api";
import type { MePermissions } from "@/types/admin/management";

const CACHE_TTL = 60_000;

interface AdminPermissionsState {
  data: MePermissions | null;
  loading: boolean;
  error: string | null;
  fetched: boolean;
  ts: number;

  fetch: (force?: boolean) => Promise<void>;
  invalidate: () => void;
}

/**
 * Current admin's effective permissions (from GET /me/permissions), cached so
 * the sidebar and pages share one fetch. Fails soft: on error `data` stays null
 * and consumers fall back to their default behavior.
 */
export const useAdminPermissionsStore = create<AdminPermissionsState>(
  (set, get) => ({
    data: null,
    loading: false,
    error: null,
    fetched: false,
    ts: 0,

    fetch: async (force = false) => {
      const { fetched, ts, loading } = get();
      if (loading) return;
      if (!force && fetched && Date.now() - ts < CACHE_TTL) return;

      set({ loading: true, error: null });
      try {
        const res = await adminManagementApi.getMyPermissions();
        if (res.success && res.data) {
          set({ data: res.data, fetched: true, ts: Date.now(), error: null });
        } else {
          set({
            error: res.message || "Failed to load permissions",
            fetched: true,
          });
        }
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : "Failed to load permissions",
          fetched: true,
        });
      } finally {
        set({ loading: false });
      }
    },

    invalidate: () => set({ fetched: false, ts: 0 }),
  }),
);
