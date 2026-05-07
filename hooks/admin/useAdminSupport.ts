"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useAdminSupportStore } from "@/store/admin/admin-support-store";
import type { SupportFilters } from "@/types/admin/support";

const DEBOUNCE_MS = 400;

export function useAdminSupport() {
  const {
    tickets,
    analytics,
    meta,
    filters,
    isLoading,
    error,
    fetchTickets,
    setFilters,
    setPage,
    resetFilters,
  } = useAdminSupportStore();

  const mounted = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      fetchTickets();
      return;
    }
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.page,
    filters.status,
    filters.priority,
    filters.support_type,
    filters.assigned_to,
    filters.user_id,
    filters.date_from,
    filters.date_to,
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
    (patch: Partial<SupportFilters>) => {
      setFilters(patch);
    },
    [setFilters],
  );

  const refetch = useCallback(() => fetchTickets(true), [fetchTickets]);

  return useMemo(
    () => ({
      tickets,
      meta,
      analytics,
      filters,
      isLoading,
      error,
      updateFilters,
      debouncedSearch,
      setPage,
      resetFilters,
      refetch,
    }),
    [tickets, meta, analytics, filters, isLoading, error, updateFilters, debouncedSearch, setPage, resetFilters, refetch],
  );
}
