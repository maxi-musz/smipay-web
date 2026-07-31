"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAdminAnalyticsStore } from "@/store/admin/admin-analytics-store";
import { useAdminSmileAiCacheStore } from "@/store/admin/admin-smileai-cache-store";
import type { RangeValue } from "./section";

/** Match backend analytics memo TTL (60s). */
const CACHE_TTL_MS = 60_000;

function cacheKey(section: string, range: RangeValue, extra?: string) {
  return extra
    ? `analytics.${section}:${range}:${extra}`
    : `analytics.${section}:${range}`;
}

function readCached<T>(key: string): T | null {
  const entry = useAdminSmileAiCacheStore.getState().cache.get(key);
  if (!entry?.data || entry.pending) return null;
  if (Date.now() - entry.ts >= CACHE_TTL_MS) return null;
  return entry.data as T;
}

/**
 * Fetch an analytics section whenever the range (or `extra` filter) changes.
 * Results are cached in the shared admin fetch-cache store so tab switches
 * and React Strict Mode double-mounts don't hammer the backend.
 * Date range is shared across all analyst tabs via admin-analytics-store.
 */
export function useAnalytics<T>(
  section: string,
  fetcher: (range: RangeValue) => Promise<T>,
  extra?: string,
) {
  const fetchFromCache = useAdminSmileAiCacheStore((s) => s.fetch);
  const range = useAdminAnalyticsStore((s) => s.range);
  const setRange = useAdminAnalyticsStore((s) => s.setRange);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const [data, setData] = useState<T | null>(() =>
    readCached<T>(cacheKey(section, range, extra)),
  );
  const [loading, setLoading] = useState(
    () => !readCached<T>(cacheKey(section, range, extra)),
  );
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(
    async (r: RangeValue, force = false) => {
      const key = cacheKey(section, r, extra);
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
        const result = await fetchFromCache(
          key,
          () => fetcherRef.current(r),
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
    load(range);
  }, [range, load]);

  return {
    range,
    setRange,
    data,
    loading: loading && !data,
    refreshing: loading,
    error,
    retry: () => load(range, true),
  };
}
