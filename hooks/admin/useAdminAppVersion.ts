"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useAdminAppVersionStore } from "@/store/admin/admin-app-version-store";

export function useAdminAppVersion() {
  const {
    config,
    configLoading,
    configError,
    fetchConfig,
    invalidateConfig,
  } = useAdminAppVersionStore();

  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    fetchConfig();
  }, [fetchConfig]);

  const refetchConfig = useCallback(() => {
    invalidateConfig();
    fetchConfig(true);
  }, [invalidateConfig, fetchConfig]);

  return useMemo(
    () => ({ config, configLoading, configError, refetchConfig }),
    [config, configLoading, configError, refetchConfig],
  );
}
