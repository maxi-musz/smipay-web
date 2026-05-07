"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAdminDashboardStore } from "@/store/admin/admin-dashboard-store";

export function useAdminDashboard() {
  const { data, isLoading, isRecalculating, error, fetchDashboard, recalculate } =
    useAdminDashboardStore();

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchDashboard();
    }
  }, [fetchDashboard]);

  const refetch = useCallback(() => {
    fetchDashboard(true);
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    isRecalculating,
    refetch,
    recalculate,
  };
}
