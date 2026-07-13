"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  User,
  UserX,
  Ticket,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { adminSupportApi } from "@/services/admin/support-api";
import { connectAdminSupportSocket } from "@/lib/admin-support-socket";
import { useAuth } from "@/hooks/useAuth";
import type {
  AdminConversationListItem,
  AdminConversationAnalytics,
  AdminConversationFilters,
  SupportListMeta,
} from "@/types/admin/support";
import { CONVERSATION_STATUS_OPTIONS } from "@/types/admin/support";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  waiting_support: "bg-amber-500",
  waiting_user: "bg-blue-500",
  closed: "bg-slate-400",
};

// Only the SELECTED pill carries colour (solid fill + ring + shadow); every
// inactive pill is neutral so the current selection is the one coloured chip in
// the row and never competes with the others.
const INACTIVE_PILL =
  "bg-dashboard-surface border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading";
const STATUS_PILL_COLORS: Record<string, { active: string; inactive: string }> = {
  green: {
    active: "bg-emerald-500 text-white shadow-sm ring-2 ring-offset-1 ring-emerald-400",
    inactive: INACTIVE_PILL,
  },
  amber: {
    active: "bg-amber-500 text-white shadow-sm ring-2 ring-offset-1 ring-amber-400",
    inactive: INACTIVE_PILL,
  },
  blue: {
    active: "bg-blue-500 text-white shadow-sm ring-2 ring-offset-1 ring-blue-400",
    inactive: INACTIVE_PILL,
  },
  slate: {
    active: "bg-slate-600 text-white shadow-sm ring-2 ring-offset-1 ring-slate-400",
    inactive: INACTIVE_PILL,
  },
};

const DEFAULT_FILTERS: AdminConversationFilters = {
  page: 1,
  limit: 20,
  search: "",
  status: "",
  assigned_to: "",
  user_id: "",
  has_ticket: "",
  date_from: "",
  date_to: "",
  sort_by: "last_message_at",
  sort_order: "desc",
};

export function ConversationsQueue() {
  const router = useRouter();
  const { user: currentAdmin } = useAuth();

  const [conversations, setConversations] = useState<AdminConversationListItem[]>([]);
  const [analytics, setAnalytics] = useState<AdminConversationAnalytics | null>(null);
  const [meta, setMeta] = useState<SupportListMeta | null>(null);
  // Default the Live Chats view to the admin's own chats.
  const [filters, setFilters] = useState<AdminConversationFilters>(() => ({
    ...DEFAULT_FILTERS,
    assigned_to: currentAdmin?.id ?? "",
  }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchConversations = useCallback(
    // `silent` skips the loading skeleton — used for background socket refreshes
    // so the list updates in place instead of flashing the skeleton.
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        const res = await adminSupportApi.listConversations(filters);
        if (res.success && res.data) {
          setConversations(res.data.conversations);
          setAnalytics(res.data.analytics);
          setMeta(res.data.meta);
        } else {
          setError(res.message ?? "Failed to load conversations");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load conversations");
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    fetchConversations();
  }, [filters.page, filters.status, filters.assigned_to, filters.sort_by, filters.sort_order]);

  // Socket: auto-refresh on conversation events
  const socketRef = useRef(false);
  useEffect(() => {
    if (socketRef.current) return;
    socketRef.current = true;

    const socket = connectAdminSupportSocket();
    const handleRefresh = () => fetchConversations({ silent: true });
    socket.on("conversation_created", handleRefresh);
    socket.on("conversation_updated", handleRefresh);

    return () => {
      socket.off("conversation_created", handleRefresh);
      socket.off("conversation_updated", handleRefresh);
      socketRef.current = false;
    };
  }, [fetchConversations]);

  // If the admin id resolves after mount, apply the "My Chats" default once —
  // but never override a choice the admin has already made.
  const defaultAppliedRef = useRef(!!currentAdmin?.id);
  useEffect(() => {
    if (defaultAppliedRef.current || !currentAdmin?.id) return;
    defaultAppliedRef.current = true;
    setFilters((prev) =>
      prev.assigned_to === "" ? { ...prev, assigned_to: currentAdmin.id } : prev,
    );
  }, [currentAdmin?.id]);

  const handleSearch = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    }, 400);
  };

  const updateFilter = (patch: Partial<AdminConversationFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
  };

  const activeQuickFilter =
    filters.assigned_to === currentAdmin?.id
      ? "my_chats"
      : filters.assigned_to === "unassigned"
        ? "unassigned"
        : null;

  const handleQuickFilter = (key: string) => {
    if (key === "my_chats") {
      updateFilter({
        assigned_to: activeQuickFilter === "my_chats" ? "" : (currentAdmin?.id ?? ""),
      });
    } else if (key === "unassigned") {
      updateFilter({
        assigned_to: activeQuickFilter === "unassigned" ? "" : "unassigned",
      });
    }
  };

  const getUserDisplayName = (c: AdminConversationListItem) => {
    if (c.user) {
      return `${c.user.first_name ?? ""} ${c.user.last_name ?? ""}`.trim() || c.email || "Unknown";
    }
    return c.email || "Unknown";
  };

  const getAdminDisplay = (c: AdminConversationListItem) => {
    if (c.assigned_admin) {
      return `${c.assigned_admin.first_name ?? ""} ${c.assigned_admin.last_name ?? ""}`.trim();
    }
    return null;
  };

  return (
    <div className="space-y-3">
      {/* Analytics cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-dashboard-surface border border-dashboard-border/60 rounded-xl px-3 py-3 sm:px-4">
            <p className="text-[10px] font-medium text-dashboard-muted uppercase tracking-wider">Active</p>
            <p className="text-lg sm:text-xl font-bold text-dashboard-heading mt-0.5">
              {analytics.active}
            </p>
          </div>
          <div className="bg-dashboard-surface border border-dashboard-border/60 rounded-xl px-3 py-3 sm:px-4">
            <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wider">Unassigned</p>
            <p className="text-lg sm:text-xl font-bold text-amber-600 mt-0.5">
              {analytics.unassigned}
            </p>
          </div>
          <div className="bg-dashboard-surface border border-dashboard-border/60 rounded-xl px-3 py-3 sm:px-4">
            <p className="text-[10px] font-medium text-dashboard-muted uppercase tracking-wider">Total</p>
            <p className="text-lg sm:text-xl font-bold text-dashboard-heading mt-0.5">
              {analytics.total_conversations}
            </p>
          </div>
        </div>
      )}

      {/* Quick filters + search */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleQuickFilter("unassigned")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
            activeQuickFilter === "unassigned"
              ? "bg-amber-500 text-white shadow-sm ring-2 ring-offset-1 ring-amber-400 font-semibold"
              : "bg-dashboard-surface border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading font-medium"
          }`}
        >
          <UserX className="h-3 w-3" />
          Unassigned
          {analytics && analytics.unassigned > 0 && (
            <span
              className={`ml-0.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold ${
                activeQuickFilter === "unassigned"
                  ? "bg-white/20"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {analytics.unassigned}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => handleQuickFilter("my_chats")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
            activeQuickFilter === "my_chats"
              ? "bg-brand-bg-primary text-white shadow-sm ring-2 ring-offset-1 ring-brand-bg-primary/50 font-semibold"
              : "bg-dashboard-surface border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading font-medium"
          }`}
        >
          <User className="h-3 w-3" />
          My Chats
          {analytics && (
            <span
              className={`ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                activeQuickFilter === "my_chats"
                  ? "bg-white/20"
                  : "bg-dashboard-bg text-dashboard-muted"
              }`}
            >
              {analytics.mine}
            </span>
          )}
        </button>

        {/* "All" = no filter at all. It highlights only when nothing else is
            selected (no status AND no assignment), and clicking it clears
            everything — so selecting any other pill deselects "All". */}
        <button
          type="button"
          onClick={() => updateFilter({ status: "", assigned_to: "" })}
          className={`px-3 py-1.5 rounded-full text-xs transition-all ${
            !filters.status && !filters.assigned_to
              ? "bg-slate-700 text-white shadow-sm ring-2 ring-offset-1 ring-slate-400 font-semibold"
              : "bg-dashboard-surface border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading font-medium"
          }`}
        >
          All{analytics ? ` (${analytics.total_conversations})` : ""}
        </button>

        {CONVERSATION_STATUS_OPTIONS.map(({ value, label, color }) => {
          const count = analytics?.by_status[value] ?? 0;
          const active = filters.status === value;
          const colors = STATUS_PILL_COLORS[color] ?? STATUS_PILL_COLORS.slate;
          return (
            <button
              key={value}
              type="button"
              onClick={() => updateFilter({ status: active ? "" : value })}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                active
                  ? `${colors.active} font-semibold`
                  : `${colors.inactive} font-medium`
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dashboard-muted" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, email, phone, tag..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-dashboard-surface border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 flex items-center justify-between">
          {error}
          <button
            type="button"
            onClick={() => fetchConversations()}
            className="underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Conversation list — skeleton on any non-silent load (e.g. switching
          filters) so the admin gets feedback instead of stale/empty content. */}
      {loading ? (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse items-start gap-2.5 rounded-xl border border-dashboard-border/60 bg-dashboard-surface px-3 py-3"
            >
              <div className="h-9 w-9 shrink-0 rounded-full bg-dashboard-border/50" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded bg-dashboard-border/50" />
                <div className="h-2.5 w-2/3 rounded bg-dashboard-border/40" />
                <div className="h-2 w-1/4 rounded bg-dashboard-border/30" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-8 w-8 text-dashboard-muted mx-auto mb-2" />
          <p className="text-sm font-medium text-dashboard-heading">No conversations</p>
          <p className="text-xs text-dashboard-muted mt-1">
            Conversations will appear here when users start chats.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {conversations.map((c, i) => {
              const userName = getUserDisplayName(c);
              const adminName = getAdminDisplay(c);
              const dot = STATUS_DOT[c.status] ?? "bg-slate-400";
              const preview =
                c.last_message?.message ?? "No messages";

              return (
                <motion.button
                  key={c.id}
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() =>
                    router.push(`/unified-admin/support/conversations/${c.id}`)
                  }
                  className="w-full text-left bg-dashboard-surface border border-dashboard-border/60 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 hover:border-brand-bg-primary/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bg-primary/30"
                >
                  <div className="flex items-start gap-2.5">
                    {/* User avatar */}
                    <div className="h-9 w-9 rounded-full bg-brand-bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {c.user?.profile_image?.secure_url ? (
                        <img
                          src={c.user.profile_image.secure_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-brand-bg-primary">
                          {userName.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
                          <span className="text-xs font-semibold text-dashboard-heading truncate">
                            {userName}
                          </span>
                          {c.has_unread && (
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-dashboard-muted shrink-0">
                          {relativeTime(c.last_message_at || c.updatedAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-dashboard-muted truncate mt-0.5">
                        {c.last_message?.is_from_user === false && c.last_message?.sender_name
                          ? `${c.last_message.sender_name}: ${preview}`
                          : preview}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {adminName ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                            <User className="h-2.5 w-2.5" />
                            {adminName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                            <UserX className="h-2.5 w-2.5" />
                            Unassigned
                          </span>
                        )}
                        <span className="text-[10px] text-dashboard-muted">
                          {c.message_count} msgs
                        </span>
                        {c.ticket && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-medium">
                            <Ticket className="h-2.5 w-2.5" />
                            {c.ticket.ticket_number}
                          </span>
                        )}
                        {c.user?.smipay_tag && (
                          <span className="text-[10px] text-brand-bg-primary font-medium">
                            @{c.user.smipay_tag}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-dashboard-muted">
            Page {meta.page} of {meta.total_pages} ({meta.total} total)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={meta.page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-40 transition-colors"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={meta.page >= meta.total_pages}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
