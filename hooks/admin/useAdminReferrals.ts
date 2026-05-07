"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useAdminReferralsStore } from "@/store/admin/admin-referrals-store";
import type { ReferralFilters } from "@/types/admin/referrals";

const DEBOUNCE_MS = 400;

export function useAdminReferrals() {
  const {
    referrals,
    analytics,
    meta,
    filters,
    isLoading,
    error,
    fetchReferrals,
    setFilters,
    setPage,
    resetFilters,
    leaderboard,
    leaderboardLoading,
    fetchLeaderboard,
  } = useAdminReferralsStore();

  const mounted = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      fetchReferrals();
      fetchLeaderboard();
      return;
    }
    fetchReferrals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.page,
    filters.status,
    filters.referrer_id,
    filters.date_from,
    filters.date_to,
  ]);

  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        setFilters({ search: value });
      }, DEBOUNCE_MS);
    },
    [setFilters],
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const updateFilters = useCallback(
    (patch: Partial<ReferralFilters>) => {
      setFilters(patch);
    },
    [setFilters],
  );

  const refetch = useCallback(() => {
    fetchReferrals(true);
    fetchLeaderboard(true);
  }, [fetchReferrals, fetchLeaderboard]);

  return useMemo(
    () => ({
      referrals,
      meta,
      analytics,
      filters,
      isLoading,
      error,
      updateFilters,
      debouncedSearch,
      setPage,
      resetFilters,
      leaderboard,
      leaderboardLoading,
      refetch,
    }),
    [referrals, meta, analytics, filters, isLoading, error, updateFilters, debouncedSearch, setPage, resetFilters, leaderboard, leaderboardLoading, refetch],
  );
}
