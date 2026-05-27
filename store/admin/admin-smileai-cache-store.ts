/**
 * SmileAI admin cache store.
 *
 * A small key/value cache that survives client-side navigation between the
 * many SmileAI admin pages (overview, conversations, analytics, personas,
 * KB, etc.) so we don't refetch every endpoint on every visit.
 *
 * Each entry is keyed by a stable string composed by the caller
 * (e.g. `smileai.providers:llm`). Reads hit the cache when the entry
 * is younger than `CACHE_TTL_MS`. Otherwise the provided fetcher runs
 * and its result is stored. Concurrent requests for the same key are
 * deduplicated via a shared in-flight promise.
 *
 * This is intentionally a thin wrapper, not a per-domain store, because
 * SmileAI's filter state stays local to each page and we don't need
 * cross-page state synchronisation (unlike, say, admin-support-store).
 * See `useAdminSmileAiCache` for the recommended page-level usage.
 */

import { create } from "zustand";

const CACHE_TTL_MS = 60_000;
const MAX_ENTRIES = 200;

interface CacheEntry {
  /** Result of the most recently completed fetch (undefined while pending). */
  data: unknown;
  /** Millisecond timestamp of the most recent successful fetch. */
  ts: number;
  /** Promise of an in-flight fetch, if any. */
  pending: Promise<unknown> | null;
}

interface AdminSmileAiCacheState {
  cache: Map<string, CacheEntry>;
  fetch: <T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { force?: boolean; ttlMs?: number },
  ) => Promise<T>;
  /** Drop a single key. */
  invalidate: (key: string) => void;
  /** Drop every key that starts with `prefix` followed by ":" (or equals the prefix). */
  invalidatePrefix: (prefix: string) => void;
  /** Drop every key. */
  clear: () => void;
}

function trim(cache: Map<string, CacheEntry>) {
  if (cache.size <= MAX_ENTRIES) return cache;
  const next = new Map(cache);
  while (next.size > MAX_ENTRIES) {
    const oldestKey = next.keys().next().value;
    if (!oldestKey) break;
    next.delete(oldestKey);
  }
  return next;
}

export const useAdminSmileAiCacheStore = create<AdminSmileAiCacheState>(
  (set, get) => ({
    cache: new Map(),

    fetch: async <T>(
      key: string,
      fetcher: () => Promise<T>,
      options: { force?: boolean; ttlMs?: number } = {},
    ): Promise<T> => {
      const ttl = options.ttlMs ?? CACHE_TTL_MS;
      const existing = get().cache.get(key);

      if (!options.force && existing) {
        if (existing.pending) {
          return existing.pending as Promise<T>;
        }
        if (Date.now() - existing.ts < ttl) {
          return existing.data as T;
        }
      }

      const promise = fetcher();

      const placeholder: CacheEntry = {
        data: existing?.data,
        ts: existing?.ts ?? 0,
        pending: promise,
      };
      const withPending = new Map(get().cache);
      withPending.set(key, placeholder);
      set({ cache: withPending });

      try {
        const data = await promise;
        const final = new Map(get().cache);
        final.set(key, { data, ts: Date.now(), pending: null });
        set({ cache: trim(final) });
        return data;
      } catch (err) {
        const final = new Map(get().cache);
        const prev = final.get(key);
        if (prev && prev.ts > 0) {
          final.set(key, { data: prev.data, ts: prev.ts, pending: null });
        } else {
          final.delete(key);
        }
        set({ cache: final });
        throw err;
      }
    },

    invalidate: (key) => {
      const next = new Map(get().cache);
      next.delete(key);
      set({ cache: next });
    },

    invalidatePrefix: (prefix) => {
      const next = new Map(get().cache);
      for (const k of Array.from(next.keys())) {
        if (k === prefix || k.startsWith(`${prefix}:`)) {
          next.delete(k);
        }
      }
      set({ cache: next });
    },

    clear: () => {
      set({ cache: new Map() });
    },
  }),
);
