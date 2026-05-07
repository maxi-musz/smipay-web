"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useAdminCashbackStore } from "@/store/admin/admin-cashback-store";
import type { CashbackHistoryFilters } from "@/types/admin/cashback";

export function useAdminCashback() {
  const {
    config,
    rules,
    configLoading,
    configError,
    analytics,
    analyticsLoading,
    analyticsError,
    history,
    historyMeta,
    historyFilters,
    historyLoading,
    historyError,
    fetchConfig,
    fetchAnalytics,
    fetchHistory,
    setHistoryFilters,
    setHistoryPage,
    resetHistoryFilters,
    invalidateConfig,
  } = useAdminCashbackStore();

  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      fetchConfig();
      fetchAnalytics();
      fetchHistory();
      return;
    }
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    historyFilters.page,
    historyFilters.service_type,
    historyFilters.user_id,
    historyFilters.date_from,
    historyFilters.date_to,
  ]);

  const updateHistoryFilters = useCallback(
    (patch: Partial<CashbackHistoryFilters>) => {
      setHistoryFilters(patch);
    },
    [setHistoryFilters],
  );

  const refetchAll = useCallback(() => {
    fetchConfig(true);
    fetchAnalytics(true);
    fetchHistory(true);
  }, [fetchConfig, fetchAnalytics, fetchHistory]);

  const refetchConfig = useCallback(() => {
    invalidateConfig();
    fetchConfig(true);
  }, [invalidateConfig, fetchConfig]);

  return useMemo(
    () => ({
      config,
      rules,
      configLoading,
      configError,
      analytics,
      analyticsLoading,
      analyticsError,
      history,
      historyMeta,
      historyFilters,
      historyLoading,
      historyError,
      updateHistoryFilters,
      setHistoryPage,
      resetHistoryFilters,
      refetchAll,
      refetchConfig,
    }),
    [
      config,
      rules,
      configLoading,
      configError,
      analytics,
      analyticsLoading,
      analyticsError,
      history,
      historyMeta,
      historyFilters,
      historyLoading,
      historyError,
      updateHistoryFilters,
      setHistoryPage,
      resetHistoryFilters,
      refetchAll,
      refetchConfig,
    ],
  );
}
