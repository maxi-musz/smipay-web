"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { useAdminNotificationsStore } from "@/store/admin/admin-notifications-store";
import type { NotificationCampaign } from "@/types/admin/notifications";

export function useAdminNotifications() {
  const {
    campaigns,
    meta,
    filters,
    isLoading,
    error,
    fetchCampaigns,
    setFilters,
    setPage,
    resetFilters,
  } = useAdminNotificationsStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.status]);

  const updateFilters = useCallback(
    (patch: Partial<typeof filters>) => {
      setFilters(patch);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setFilters],
  );

  const refetch = useCallback(() => fetchCampaigns(true), [fetchCampaigns]);

  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return campaigns;
    return campaigns.filter((campaign: NotificationCampaign) => {
      return (
        campaign.title.toLowerCase().includes(query) ||
        campaign.subject.toLowerCase().includes(query) ||
        campaign.id.toLowerCase().includes(query)
      );
    });
  }, [campaigns, search]);

  return useMemo(
    () => ({
      campaigns: filteredCampaigns,
      rawCampaigns: campaigns,
      meta,
      filters,
      isLoading,
      error,
      updateFilters,
      setPage,
      resetFilters,
      refetch,
      search,
      setSearch,
    }),
    [
      filteredCampaigns,
      campaigns,
      meta,
      filters,
      isLoading,
      error,
      updateFilters,
      setPage,
      resetFilters,
      refetch,
      search,
    ],
  );
}
