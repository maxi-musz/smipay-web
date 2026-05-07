import { create } from "zustand";
import { adminAuditLogsApi } from "@/services/admin/audit-logs-api";
import type {
  AuditLogDetail,
  AuditIPResponse,
  AuditSessionResponse,
  AuditDeviceResponse,
  AuditUserLogsResponse,
} from "@/types/admin/audit-logs";

const CACHE_TTL = 60_000;
const MAX_CACHE_ENTRIES = 30;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function pruneCache<T>(
  source: Map<string, CacheEntry<T>>,
  max: number,
): Map<string, CacheEntry<T>> {
  if (source.size < max) return source;
  const copy = new Map(source);
  const oldestKey = copy.keys().next().value;
  if (oldestKey !== undefined) copy.delete(oldestKey);
  return copy;
}

interface AuditDetailsState {
  detailCache: Map<string, CacheEntry<AuditLogDetail>>;
  ipCache: Map<string, CacheEntry<AuditIPResponse["data"]>>;
  sessionCache: Map<string, CacheEntry<AuditSessionResponse["data"]>>;
  deviceCache: Map<string, CacheEntry<AuditDeviceResponse["data"]>>;
  userLogsCache: Map<string, CacheEntry<AuditUserLogsResponse["data"]>>;

  detailLoading: boolean;
  ipLoading: boolean;
  sessionLoading: boolean;
  deviceLoading: boolean;
  userLogsLoading: boolean;

  detailError: string | null;
  ipError: string | null;
  sessionError: string | null;
  deviceError: string | null;
  userLogsError: string | null;

  fetchDetail: (
    id: string,
    force?: boolean,
  ) => Promise<AuditLogDetail | null>;
  fetchIP: (
    ip: string,
    force?: boolean,
  ) => Promise<AuditIPResponse["data"] | null>;
  fetchSession: (
    sessionId: string,
    force?: boolean,
  ) => Promise<AuditSessionResponse["data"] | null>;
  fetchDevice: (
    deviceId: string,
    force?: boolean,
  ) => Promise<AuditDeviceResponse["data"] | null>;
  fetchUserLogs: (
    userId: string,
    force?: boolean,
  ) => Promise<AuditUserLogsResponse["data"] | null>;
  invalidateDetail: (id: string) => void;
}

export const useAuditDetailsStore = create<AuditDetailsState>((set, get) => ({
  detailCache: new Map(),
  ipCache: new Map(),
  sessionCache: new Map(),
  deviceCache: new Map(),
  userLogsCache: new Map(),

  detailLoading: false,
  ipLoading: false,
  sessionLoading: false,
  deviceLoading: false,
  userLogsLoading: false,

  detailError: null,
  ipError: null,
  sessionError: null,
  deviceError: null,
  userLogsError: null,

  fetchDetail: async (id, force = false) => {
    const state = get();
    if (!force) {
      const cached = state.detailCache.get(id);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    set({ detailLoading: true, detailError: null });
    try {
      const res = await adminAuditLogsApi.getById(id);
      const detail = res.data;
      const cache = pruneCache(new Map(state.detailCache), MAX_CACHE_ENTRIES);
      cache.set(id, { data: detail, timestamp: Date.now() });
      set({ detailCache: cache, detailLoading: false });
      return detail;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load audit detail";
      set({ detailError: msg, detailLoading: false });
      return null;
    }
  },

  fetchIP: async (ip, force = false) => {
    const state = get();
    if (!force) {
      const cached = state.ipCache.get(ip);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    set({ ipLoading: true, ipError: null });
    try {
      const res = await adminAuditLogsApi.ipInvestigation(ip);
      const data = res.data;
      const cache = pruneCache(new Map(state.ipCache), MAX_CACHE_ENTRIES);
      cache.set(ip, { data, timestamp: Date.now() });
      set({ ipCache: cache, ipLoading: false });
      return data;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load IP data";
      set({ ipError: msg, ipLoading: false });
      return null;
    }
  },

  fetchSession: async (sessionId, force = false) => {
    const state = get();
    if (!force) {
      const cached = state.sessionCache.get(sessionId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    set({ sessionLoading: true, sessionError: null });
    try {
      const res = await adminAuditLogsApi.sessionTrace(sessionId);
      const data = res.data;
      const cache = pruneCache(
        new Map(state.sessionCache),
        MAX_CACHE_ENTRIES,
      );
      cache.set(sessionId, { data, timestamp: Date.now() });
      set({ sessionCache: cache, sessionLoading: false });
      return data;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load session data";
      set({ sessionError: msg, sessionLoading: false });
      return null;
    }
  },

  fetchDevice: async (deviceId, force = false) => {
    const state = get();
    if (!force) {
      const cached = state.deviceCache.get(deviceId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    set({ deviceLoading: true, deviceError: null });
    try {
      const res = await adminAuditLogsApi.deviceInvestigation(deviceId);
      const data = res.data;
      const cache = pruneCache(new Map(state.deviceCache), MAX_CACHE_ENTRIES);
      cache.set(deviceId, { data, timestamp: Date.now() });
      set({ deviceCache: cache, deviceLoading: false });
      return data;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load device data";
      set({ deviceError: msg, deviceLoading: false });
      return null;
    }
  },

  fetchUserLogs: async (userId, force = false) => {
    const state = get();
    if (!force) {
      const cached = state.userLogsCache.get(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    set({ userLogsLoading: true, userLogsError: null });
    try {
      const res = await adminAuditLogsApi.userLogs(userId);
      const data = res.data;
      const cache = pruneCache(
        new Map(state.userLogsCache),
        MAX_CACHE_ENTRIES,
      );
      cache.set(userId, { data, timestamp: Date.now() });
      set({ userLogsCache: cache, userLogsLoading: false });
      return data;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load user logs";
      set({ userLogsError: msg, userLogsLoading: false });
      return null;
    }
  },

  invalidateDetail: (id) => {
    const cache = new Map(get().detailCache);
    cache.delete(id);
    set({ detailCache: cache });
  },
}));
