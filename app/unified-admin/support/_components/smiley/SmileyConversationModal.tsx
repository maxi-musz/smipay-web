"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Loader2, User, UserCheck, X } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import {
  connectAdminSmileAiSocket,
  observeSmileAiConversation,
  unobserveSmileAiConversation,
} from "@/lib/admin-smileai-socket";
import type {
  SmileAiConversationDetail,
  SmileAiConversationMessage,
} from "@/types/admin/smileai";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  awaiting_user: "bg-blue-100 text-blue-700",
  handoff_pending: "bg-amber-100 text-amber-700",
  handed_off: "bg-amber-100 text-amber-700",
  resolved: "bg-slate-100 text-slate-600",
  closed: "bg-slate-100 text-slate-600",
  abandoned: "bg-slate-100 text-slate-600",
};

const TERMINAL = new Set(["closed", "resolved", "abandoned"]);

export function SmileyConversationModal({
  conversationId,
  open,
  onClose,
  onTakenOver,
}: {
  conversationId: string;
  open: boolean;
  onClose: () => void;
  onTakenOver?: () => void;
}) {
  const [detail, setDetail] = useState<SmileAiConversationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takingOver, setTakingOver] = useState(false);
  const [takenOver, setTakenOver] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDetail(await smileAiApi.conversations.get(conversationId));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (open) {
      setTakenOver(false);
      void load();
    }
  }, [open, load]);

  // Live: while observing, refresh the transcript/status when a turn completes,
  // the chat is handed off, or it closes — so the admin sees the live exchange.
  useEffect(() => {
    if (!open) return;
    const socket = connectAdminSmileAiSocket();
    observeSmileAiConversation(conversationId);
    const refresh = (p?: { conversation_id?: string }) => {
      if (p?.conversation_id && p.conversation_id !== conversationId) return;
      void load();
    };
    socket.on("admin.ai.message.complete", refresh);
    socket.on("admin.ai.conversation.closed", refresh);
    socket.on("admin.ai.handoff.completed", refresh);
    return () => {
      socket.off("admin.ai.message.complete", refresh);
      socket.off("admin.ai.conversation.closed", refresh);
      socket.off("admin.ai.handoff.completed", refresh);
      unobserveSmileAiConversation(conversationId);
    };
  }, [open, conversationId, load]);

  const takeover = async () => {
    setTakingOver(true);
    setError(null);
    try {
      await smileAiApi.conversations.takeover(conversationId);
      setTakenOver(true);
      onTakenOver?.();
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setTakingOver(false);
    }
  };

  if (!open) return null;

  const turns = (detail?.messages ?? []).filter(
    (m: SmileAiConversationMessage) => m.role === "user" || m.role === "assistant",
  );
  const userName =
    `${detail?.user?.first_name ?? ""} ${detail?.user?.last_name ?? ""}`.trim() ||
    detail?.user_email ||
    "User";
  const status = detail?.status ?? "";
  const canTakeOver = !!detail && !TERMINAL.has(status) && !takenOver;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Smiley conversation"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(88vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-dashboard-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-dashboard-border/60 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-bg-primary/10">
              <Bot className="h-4 w-4 text-brand-bg-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-dashboard-heading">
                {userName}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-dashboard-muted">
                  Smiley conversation
                </span>
                {status && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${STATUS_BADGE[status] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {status.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* min-h-0 is required so flex children can shrink and overflow-y scrolls */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
          {loading && !detail ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-brand-bg-primary" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
              <button
                type="button"
                onClick={() => void load()}
                className="ml-2 font-medium underline"
              >
                Retry
              </button>
            </div>
          ) : turns.length === 0 ? (
            <p className="py-10 text-center text-xs text-dashboard-muted">
              No messages yet.
            </p>
          ) : (
            turns.map((m) => {
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] ${isUser ? "mr-6" : "ml-6"}`}>
                    <div className={`mb-1 flex items-center gap-1.5 ${isUser ? "" : "justify-end"}`}>
                      {isUser ? (
                        <User className="h-3 w-3 text-dashboard-muted" />
                      ) : (
                        <Bot className="h-3 w-3 text-brand-bg-primary" />
                      )}
                      <span className="text-[10px] font-medium text-dashboard-muted">
                        {isUser ? "User" : "Smiley"}
                      </span>
                      <span className="text-[10px] text-dashboard-muted/60">
                        {relativeTime(m.createdAt)}
                      </span>
                    </div>
                    <div
                      className={`rounded-xl px-3.5 py-2.5 ${
                        isUser
                          ? "border border-dashboard-border/60 bg-dashboard-bg text-dashboard-heading"
                          : "bg-brand-bg-primary/10 text-dashboard-heading"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-xs leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="shrink-0 border-t border-dashboard-border/60 px-4 py-3">
          {takenOver ? (
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2 text-xs font-semibold text-emerald-700">
              <UserCheck className="h-3.5 w-3.5" />
              You&rsquo;re now handling this chat
            </div>
          ) : canTakeOver ? (
            <button
              type="button"
              onClick={takeover}
              disabled={takingOver}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-bg-primary py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {takingOver ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserCheck className="h-3.5 w-3.5" />
              )}
              Take over this conversation
            </button>
          ) : (
            <p className="text-center text-[11px] text-dashboard-muted">
              {TERMINAL.has(status)
                ? "This conversation has ended."
                : "Handing over…"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
