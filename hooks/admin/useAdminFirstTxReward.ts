"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useAdminFirstTxRewardStore } from "@/store/admin/admin-first-tx-reward-store";
import type { FirstTxRewardHistoryFilters } from "@/types/admin/first-tx-reward";

export function useAdminFirstTxReward() {
  const {
    config,
    stats,
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
  } = useAdminFirstTxRewardStore();

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
    historyFilters.source_transaction_type,
    historyFilters.user_id,
    historyFilters.date_from,
    historyFilters.date_to,
  ]);

  const updateHistoryFilters = useCallback(
    (patch: Partial<FirstTxRewardHistoryFilters>) => {
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
      stats,
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
      stats,
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
