"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useAdminPermissionsStore } from "@/store/admin/admin-permissions-store";
import type { AccessAction, EffectiveModule } from "@/types/admin/management";

/**
 * Current admin's effective permissions. Drives the sidebar and page gating.
 *
 * `can(key, action)` and `isSuperAdmin` are the primitives for step-2 gating.
 * Until `/me/permissions` loads (or if it errors — e.g. before the migration is
 * applied), `data` is null and callers should fall back to their defaults.
 */
export function useAdminPermissions() {
  const { data, loading, error, fetch, invalidate } = useAdminPermissionsStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  const isSuperAdmin = data?.is_super_admin ?? false;
  const modules: EffectiveModule[] = useMemo(() => data?.modules ?? [], [data]);
  const userTypes: string[] = useMemo(() => data?.user_types ?? [], [data]);

  const hasType = useCallback(
    (type: string): boolean => isSuperAdmin || userTypes.includes(type),
    [isSuperAdmin, userTypes],
  );

  const can = useCallback(
    (key: string, action: AccessAction): boolean => {
      if (isSuperAdmin) return true;
      const m = modules.find((x) => x.key === key);
      if (!m) return false;
      switch (action) {
        case "read":
          return m.can_read;
        case "write":
          return m.can_write;
        case "update":
          return m.can_update;
        case "delete":
          return m.can_delete;
      }
    },
    [isSuperAdmin, modules],
  );

  const refetch = useCallback(() => {
    invalidate();
    return fetch(true);
  }, [invalidate, fetch]);

  return {
    data,
    loading,
    error,
    isSuperAdmin,
    modules,
    userTypes,
    hasType,
    permissionLevel: data?.permission_level ?? 0,
    /** True once we have permissions data OR the fetch finished (success or error). */
    loaded: data != null || (fetched && !loading),
    /** True when GET /me/permissions returned usable data. */
    hasData: data != null,
    can,
    refetch,
  };
}

/** Alias for page-level gating readability. */
export const usePermissions = useAdminPermissions;
