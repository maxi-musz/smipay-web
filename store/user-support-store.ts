import { create } from "zustand";
import { supportApi } from "@/services/support-api";
import type {
  ConversationListItem,
  ConversationDetail,
} from "@/types/support";

const CACHE_TTL = 60_000;
const MAX_DETAIL_CACHE = 10;

interface DetailCacheEntry {
  data: ConversationDetail;
  ts: number;
}

interface UserSupportState {
  conversations: ConversationListItem[];
  listLoading: boolean;
  listError: string | null;
  listFetchedAt: number;

  detailCache: Map<string, DetailCacheEntry>;
  detailLoading: boolean;
  detailError: string | null;

  fetchConversations: (force?: boolean) => Promise<void>;
  invalidateList: () => void;

  fetchDetail: (
    conversationId: string,
    force?: boolean,
  ) => Promise<ConversationDetail | null>;
  invalidateDetail: (conversationId: string) => void;
  updateDetailInCache: (conversationId: string, partial: Partial<ConversationDetail>) => void;
}

export const useUserSupportStore = create<UserSupportState>((set, get) => ({
  conversations: [],
  listLoading: false,
  listError: null,
  listFetchedAt: 0,

  detailCache: new Map(),
  detailLoading: false,
  detailError: null,

  fetchConversations: async (force = false) => {
    const { listFetchedAt } = get();

    if (!force && listFetchedAt && Date.now() - listFetchedAt < CACHE_TTL) {
      return;
    }

    set({ listLoading: true, listError: null });
    try {
      const res = await supportApi.getConversations();
      if (res.success && res.data?.conversations) {
        set({
          conversations: res.data.conversations,
          listFetchedAt: Date.now(),
          listError: null,
        });
      } else {
        set({ listError: res.message ?? "Failed to load conversations" });
      }
    } catch (err) {
      set({
        listError:
          err instanceof Error ? err.message : "Failed to load conversations",
      });
    } finally {
      set({ listLoading: false });
    }
  },

  invalidateList: () => {
    set({ listFetchedAt: 0 });
  },

  fetchDetail: async (conversationId, force = false) => {
    const { detailCache } = get();

    if (!force) {
      const cached = detailCache.get(conversationId);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return cached.data;
      }
    }

    set({ detailLoading: true, detailError: null });
    try {
      const res = await supportApi.getConversation(conversationId);
      if (res.success && res.data?.conversation) {
        const conversation = res.data.conversation;
        const cache = new Map(get().detailCache);
        cache.set(conversationId, { data: conversation, ts: Date.now() });
        if (cache.size > MAX_DETAIL_CACHE) {
          const oldest = cache.keys().next().value;
          if (oldest) cache.delete(oldest);
        }
        set({ detailCache: cache, detailLoading: false });
        return conversation;
      }
      set({
        detailError: res.message ?? "Failed to load conversation",
        detailLoading: false,
      });
      return null;
    } catch (err) {
      set({
        detailError:
          err instanceof Error ? err.message : "Failed to load conversation",
        detailLoading: false,
      });
      return null;
    }
  },

  invalidateDetail: (conversationId) => {
    const cache = new Map(get().detailCache);
    cache.delete(conversationId);
    set({ detailCache: cache });
  },

  updateDetailInCache: (conversationId, partial) => {
    const cache = new Map(get().detailCache);
    const entry = cache.get(conversationId);
    if (entry) {
      cache.set(conversationId, {
        data: { ...entry.data, ...partial },
        ts: entry.ts,
      });
      set({ detailCache: cache });
    }
  },
}));
