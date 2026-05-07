"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAdminAuditLogsStore } from "@/store/admin/admin-audit-logs-store";
import type { AuditFilters } from "@/types/admin/audit-logs";

const SEARCH_DEBOUNCE_MS = 400;

export function useAdminAuditLogs() {
  const {
    logs,
    meta,
    analytics,
    filters,
    isLoading,
    error,
    fetchLogs,
    setFilters,
    setPage,
    resetFilters,
  } = useAdminAuditLogsStore();

  const hasFetched = useRef(false);
  const prevFiltersRef = useRef(filters);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchLogs();
    }
  }, [fetchLogs]);

  useEffect(() => {
    if (prevFiltersRef.current !== filters && hasFetched.current) {
      prevFiltersRef.current = filters;
      fetchLogs();
    }
  }, [filters, fetchLogs]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const updateFilters = useCallback(
    (patch: Partial<AuditFilters>) => {
      setFilters(patch);
    },
    [setFilters],
  );

  const debouncedSearch = useCallback(
    (search: string) => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        setFilters({ search });
      }, SEARCH_DEBOUNCE_MS);
    },
    [setFilters],
  );

  const refetch = useCallback(() => {
    fetchLogs(true);
  }, [fetchLogs]);

  return {
    logs,
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
  };
}
