"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRightLeft,
  Bot,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { smileAiApi } from "@/services/admin/smileai-api";
import { connectAdminSmileAiSocket } from "@/lib/admin-smileai-socket";
import type { SmileAiConversationListItem } from "@/types/admin/smileai";
import { SmileyConversationModal } from "./SmileyConversationModal";

// Sub-filters map to a single AIConversation status (or all). Active is default.
const SUB_FILTERS: { key: string; label: string; status: string }[] = [
  { key: "all", label: "All", status: "" },
  { key: "active", label: "Active", status: "active" },
  { key: "handed_off", label: "Handed Off", status: "handed_off" },
  { key: "closed", label: "Closed", status: "closed" },
];

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  awaiting_user: "bg-blue-500",
  handoff_pending: "bg-amber-500",
  handed_off: "bg-amber-500",
  resolved: "bg-slate-400",
  closed: "bg-slate-400",
  abandoned: "bg-slate-400",
};

function relativeTime(iso: string | null): string {
  if (!iso) return "";
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

export function SmileyQueue() {
  const [status, setStatus] = useState("active"); // Active selected by default
  const [items, setItems] = useState<SmileAiConversationListItem[]>([]);
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [totalAll, setTotalAll] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await smileAiApi.conversations.list({
        status: status || undefined,
        limit: 50,
      });
      setItems(res.items);
      setByStatus(res.by_status ?? {});
      setTotalAll(res.total_all ?? 0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live: refresh the list when any Smiley conversation changes (debounced).
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const socket = connectAdminSmileAiSocket();
    const onEvent = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => void load(), 600);
    };
    socket.on("admin.smileai.conversation.event", onEvent);
    return () => {
      socket.off("admin.smileai.conversation.event", onEvent);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [load]);

  const countFor = (f: { status: string }) =>
    f.status === "" ? totalAll : (byStatus[f.status] ?? 0);

  return (
    <div className="space-y-3">
      {/* Sub-filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        {SUB_FILTERS.map((f) => {
          const active = status === f.status;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatus(f.status)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all ${
                active
                  ? "bg-brand-bg-primary text-white shadow-sm ring-2 ring-offset-1 ring-brand-bg-primary/50 font-semibold"
                  : "bg-dashboard-surface border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading font-medium"
              }`}
            >
              {f.label}
              <span
                className={`ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  active ? "bg-white/20" : "bg-dashboard-bg text-dashboard-muted"
                }`}
              >
                {countFor(f)}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-dashboard-muted hover:text-dashboard-heading"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
          <button
            type="button"
            onClick={() => void load()}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-bg-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center">
          <Bot className="mx-auto mb-2 h-8 w-8 text-dashboard-muted" />
          <p className="text-sm font-medium text-dashboard-heading">
            No Smiley conversations
          </p>
          <p className="mt-1 text-xs text-dashboard-muted">
            Conversations handled by Smiley appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {items.map((c, i) => {
              const name = c.user?.name || c.user_email || "Unknown";
              const dot = STATUS_DOT[c.status] ?? "bg-slate-400";
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedId(c.id)}
                  className="w-full rounded-xl border border-dashboard-border/60 bg-dashboard-surface px-3 py-2.5 text-left transition-colors hover:border-brand-bg-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bg-primary/30 sm:px-4 sm:py-3"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-bg-primary/10">
                      <span className="text-[10px] font-bold text-brand-bg-primary">
                        {name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                          <span className="truncate text-xs font-semibold text-dashboard-heading">
                            {name}
                          </span>
                        </div>
                        <span className="shrink-0 text-[10px] text-dashboard-muted">
                          {relativeTime(c.last_message_at || c.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] capitalize text-dashboard-muted">
                          {c.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-dashboard-muted">
                          {c.message_count} msgs
                        </span>
                        {c.support_conversation_id && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600">
                            <ArrowRightLeft className="h-2.5 w-2.5" />
                            Handed off
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

      {selectedId && (
        <SmileyConversationModal
          conversationId={selectedId}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
          onTakenOver={() => void load()}
        />
      )}
    </div>
  );
}
