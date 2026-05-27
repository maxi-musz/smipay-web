"use client";

/**
 * Page-level helper around the SmileAI admin cache store.
 *
 * Typical usage:
 *
 *   const { run, invalidatePrefix } = useAdminSmileAiCache();
 *
 *   const load = useCallback(async (force = false) => {
 *     setLoading(true);
 *     try {
 *       const data = await run(
 *         `smileai.providers:${kind}`,
 *         () => smileAiApi.providers.list({ kind }),
 *         { force },
 *       );
 *       setProviders(data);
 *     } catch (err) {
 *       setError(formatErrorMessage(err));
 *     } finally {
 *       setLoading(false);
 *     }
 *   }, [kind, run]);
 *
 *   useEffect(() => { void load(); }, [load]);
 *
 * Re-visiting the page within the TTL window will read from cache and
 * skip the network call entirely. Mutations (create / update / delete /
 * activate / etc.) should call `invalidatePrefix("smileai.providers")`
 * so the next read fetches fresh data.
 */

import { useCallback, useMemo } from "react";

import { useAdminSmileAiCacheStore } from "@/store/admin/admin-smileai-cache-store";

export type SmileAiCacheRun = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { force?: boolean; ttlMs?: number },
) => Promise<T>;

export function useAdminSmileAiCache() {
  const fetchFromCache = useAdminSmileAiCacheStore((s) => s.fetch);
  const invalidate = useAdminSmileAiCacheStore((s) => s.invalidate);
  const invalidatePrefix = useAdminSmileAiCacheStore((s) => s.invalidatePrefix);
  const clear = useAdminSmileAiCacheStore((s) => s.clear);

  const run = useCallback<SmileAiCacheRun>(
    (key, fetcher, options) => fetchFromCache(key, fetcher, options),
    [fetchFromCache],
  );

  return useMemo(
    () => ({ run, invalidate, invalidatePrefix, clear }),
    [run, invalidate, invalidatePrefix, clear],
  );
}
