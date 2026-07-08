"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useAdminKycStore } from "@/store/admin/admin-kyc-store";

export function useAdminKyc() {
  const {
    tiers,
    properties,
    loading,
    error,
    fetchOverview,
    invalidate,
  } = useAdminKycStore();

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const refetch = useCallback(() => {
    invalidate();
    fetchOverview(true);
  }, [invalidate, fetchOverview]);

  return useMemo(
    () => ({
      tiers,
      properties,
      loading,
      error,
      refetch,
    }),
    [tiers, properties, loading, error, refetch],
  );
}
