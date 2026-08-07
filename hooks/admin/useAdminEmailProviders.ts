"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAdminEmailProvidersStore } from "@/store/admin/admin-email-providers-store";

export function useAdminEmailProviders() {
  const store = useAdminEmailProvidersStore();
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    void store.fetchConfig();
    void store.fetchProviders();
    void store.fetchSummary();
    void store.fetchDailyStats();
    void store.fetchMessages();
    void store.fetchSuppressions();
  }, [store]);

  const refetchAll = useCallback(() => {
    store.invalidateAll();
    void store.fetchConfig(true);
    void store.fetchProviders(true);
    void store.fetchSummary(true);
    void store.fetchDailyStats();
    void store.fetchMessages();
    void store.fetchSuppressions();
  }, [store]);

  const primaryProvider = useMemo(
    () =>
      store.providers
        .filter((p) => p.is_enabled && !p.archived_at)
        .sort((a, b) => a.priority - b.priority)[0] ?? null,
    [store.providers],
  );

  return useMemo(
    () => ({
      ...store,
      primaryProvider,
      refetchAll,
    }),
    [store, primaryProvider, refetchAll],
  );
}
