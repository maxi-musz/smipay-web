"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useAdminUsersStore } from "@/store/admin/admin-users-store";
import type { UserFilters } from "@/types/admin/users";

const DEBOUNCE_MS = 400;

export function useAdminUsers() {
  const {
    users,
    analytics,
    meta,
    filters,
    isLoading,
    error,
    fetchUsers,
    setFilters,
    setPage,
    resetFilters,
    updateUser,
  } = useAdminUsersStore();

  const mounted = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      fetchUsers();
      return;
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.page,
    filters.search,
    filters.role,
    filters.account_status,
    filters.tier,
    filters.kyc_status,
    filters.date_from,
    filters.date_to,
    filters.min_wallet_balance,
    filters.max_wallet_balance,
    filters.min_cashback_balance,
    filters.max_cashback_balance,
    filters.sort_by,
    filters.sort_order,
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
    (patch: Partial<UserFilters>) => {
      setFilters(patch);
    },
    [setFilters],
  );

  const refetch = useCallback(() => fetchUsers(true), [fetchUsers]);

  return useMemo(
    () => ({
      users,
      analytics,
      meta,
      filters,
      isLoading,
      error,
      updateFilters,
      debouncedSearch,
      setPage,
      resetFilters,
      updateUser,
      refetch,
    }),
    [users, analytics, meta, filters, isLoading, error, updateFilters, debouncedSearch, setPage, resetFilters, updateUser, refetch],
  );
}
