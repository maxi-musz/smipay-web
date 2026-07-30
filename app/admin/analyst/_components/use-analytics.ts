"use client";

import { useCallback, useEffect, useState } from "react";
import type { RangeValue } from "./section";

/**
 * Fetch an analytics section whenever the range changes. Keeps the previous
 * data visible while refetching so the UI doesn't flash on range switches.
 */
export function useAnalytics<T>(
  fetcher: (range: RangeValue) => Promise<T>,
  initialRange: RangeValue = "30d",
) {
  const [range, setRange] = useState<RangeValue>(initialRange);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (r: RangeValue) => {
      setLoading(true);
      setError(null);
      try {
        setData(await fetcher(r));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    },
    [fetcher],
  );

  useEffect(() => {
    load(range);
  }, [range, load]);

  return {
    range,
    setRange,
    data,
    // Only show the full-page loader before the first successful load.
    loading: loading && !data,
    refreshing: loading,
    error,
    retry: () => load(range),
  };
}
