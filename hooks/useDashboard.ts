"use client";

import { useEffect, useRef } from "react";
import { useDashboardStore } from "@/store/dashboard-store";

/**
 * Custom hook for dashboard data.
 * Initial load shows skeletons via isLoading.
 * Subsequent refreshes are silent (isRefreshing) — no skeleton flash.
 */
export function useDashboard(forceRefresh = false) {
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const isLoading = useDashboardStore((state) => state.isLoading);
  const isRefreshing = useDashboardStore((state) => state.isRefreshing);
  const error = useDashboardStore((state) => state.error);
  const fetchDashboardData = useDashboardStore((state) => state.fetchDashboardData);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchDashboardData(forceRefresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    dashboardData,
    isLoading,
    isRefreshing,
    error,
    refetch: () => {
      hasFetched.current = false;
      return fetchDashboardData(true);
    },
  };
}
