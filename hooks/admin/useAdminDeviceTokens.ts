"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminDeviceTokensStore } from "@/store/admin/admin-device-tokens-store";

export function useAdminDeviceTokens() {
  const tokens = useAdminDeviceTokensStore((s) => s.tokens);
  const total = useAdminDeviceTokensStore((s) => s.total);
  const pages = useAdminDeviceTokensStore((s) => s.pages);
  const stats = useAdminDeviceTokensStore((s) => s.stats);
  const filters = useAdminDeviceTokensStore((s) => s.filters);
  const isLoading = useAdminDeviceTokensStore((s) => s.isLoading);
  const error = useAdminDeviceTokensStore((s) => s.error);
  const fetchTokens = useAdminDeviceTokensStore((s) => s.fetchTokens);
  const fetchStats = useAdminDeviceTokensStore((s) => s.fetchStats);
  const setFilters = useAdminDeviceTokensStore((s) => s.setFilters);

  const [searchInput, setSearchInput] = useState(
    () => useAdminDeviceTokensStore.getState().filters.search,
  );

  useEffect(() => {
    void fetchTokens(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.platform, filters.is_active, filters.search]);

  useEffect(() => {
    void fetchStats(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      if (next === filters.search) return;
      setFilters({ search: next, page: 1 });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setFilters]);

  const updateFilters = useCallback(
    (patch: Partial<typeof filters>) => {
      setFilters(patch);
    },
    [setFilters],
  );

  return {
    tokens,
    stats,
    total,
    pages,
    filters,
    isLoading,
    error,
    updateFilters,
    searchInput,
    setSearchInput,
  };
}
