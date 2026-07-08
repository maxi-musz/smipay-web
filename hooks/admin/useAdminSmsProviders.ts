"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAdminSmsProvidersStore } from "@/store/admin/admin-sms-providers-store";

export function useAdminSmsProviders() {
  const store = useAdminSmsProvidersStore();
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    void store.fetchConfig();
    void store.fetchProviders();
    void store.fetchSummary();
    void store.fetchDailyStats();
    void store.fetchMessages();
  }, [store]);

  const refetchAll = useCallback(() => {
    store.invalidateAll();
    void store.fetchConfig(true);
    void store.fetchProviders(true);
    void store.fetchSummary(true);
    void store.fetchDailyStats();
    void store.fetchMessages();
  }, [store]);

  const activeProvider = useMemo(
    () => store.providers.find((p) => p.is_active && !p.archived_at) ?? null,
    [store.providers],
  );

  return useMemo(
    () => ({
      ...store,
      activeProvider,
      refetchAll,
    }),
    [store, activeProvider, refetchAll],
  );
}
