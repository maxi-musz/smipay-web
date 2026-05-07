"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useAdminMarkupStore } from "@/store/admin/admin-markup-store";

export function useAdminMarkup() {
  const {
    config,
    rules,
    configLoading,
    configError,
    fetchConfig,
    invalidateConfig,
  } = useAdminMarkupStore();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const refetchConfig = useCallback(() => {
    invalidateConfig();
    fetchConfig(true);
  }, [invalidateConfig, fetchConfig]);

  const refetchAll = useCallback(() => {
    invalidateConfig();
    fetchConfig(true);
  }, [invalidateConfig, fetchConfig]);

  return useMemo(
    () => ({
      config,
      rules,
      configLoading,
      configError,
      refetchConfig,
      refetchAll,
    }),
    [
      config,
      rules,
      configLoading,
      configError,
      refetchConfig,
      refetchAll,
    ],
  );
}
