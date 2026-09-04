"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  useAdminAnalyticsStore,
  type AnalyticsPeriod,
} from "@/store/admin/admin-analytics-store";
import { useAdminSmileAiCacheStore } from "@/store/admin/admin-smileai-cache-store";
import type { AnalyticsQuery } from "@/types/admin/analytics";

/** Match backend analytics memo TTL (60s). */
const CACHE_TTL_MS = 60_000;

function cacheKey(section: string, periodKey: string, extra?: string) {
  return extra
    ? `analytics.${section}:${periodKey}:${extra}`
    : `analytics.${section}:${periodKey}`;
}

function readCached<T>(key: string): T | null {
  const entry = useAdminSmileAiCacheStore.getState().cache.get(key);
  if (!entry?.data || entry.pending) return null;
  if (Date.now() - entry.ts >= CACHE_TTL_MS) return null;
  return entry.data as T;
}

/**
 * Fetch an analytics section whenever the period (or `extra` filter) changes.
 * Period is shared across all analyst tabs via admin-analytics-store.
 */
export function useAnalytics<T>(
  section: string,
  fetcher: (query: AnalyticsQuery) => Promise<T>,
  extra?: string,
) {
  const fetchFromCache = useAdminSmileAiCacheStore((s) => s.fetch);
  const period = useAdminAnalyticsStore((s) => s.period);
  const setPreset = useAdminAnalyticsStore((s) => s.setPreset);
  const setCustom = useAdminAnalyticsStore((s) => s.setCustom);
  const periodKey = useAdminAnalyticsStore((s) => s.cacheKeyPart());
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState<T | null>(() =>
    readCached<T>(cacheKey(section, periodKey, extra)),
  );
  const [loading, setLoading] = useState(
    () => !readCached<T>(cacheKey(section, periodKey, extra)),
  );
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(
    async (force = false) => {
      const keyPart = useAdminAnalyticsStore.getState().cacheKeyPart();
      const key = cacheKey(section, keyPart, extra);
      const id = ++requestId.current;

      const cached = !force ? readCached<T>(key) : null;
      if (cached) {
        setData(cached);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const query = useAdminAnalyticsStore.getState().toQuery();
        const result = await fetchFromCache(
          key,
          () => fetcherRef.current(query),
          { force, ttlMs: CACHE_TTL_MS },
        );
        if (id === requestId.current) {
          setData(result);
        }
      } catch (err) {
        if (id === requestId.current) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
      } finally {
        if (id === requestId.current) {
          setLoading(false);
        }
      }
    },
    [section, extra, fetchFromCache],
  );

  useEffect(() => {
    void load();
  }, [periodKey, load]);

  return {
    period,
    setPreset,
    setCustom,
    data,
    loading: loading && !data,
    refreshing: loading,
    error,
    retry: () => load(true),
  };
}

export type { AnalyticsPeriod };
