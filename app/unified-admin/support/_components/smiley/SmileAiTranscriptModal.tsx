"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Loader2, User, X } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
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
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Read-only viewer for the Smiley↔user transcript behind a support handoff. */
export function SmileAiTranscriptModal({
  conversationId,
  open,
  onClose,
}: {
  conversationId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<SmileAiConversationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (open) void load();
  }, [open, load]);

  if (!open) return null;

  // Only user/assistant turns are shown; system/tool rows are internal scaffolding.
  const turns = (detail?.messages ?? []).filter(
    (m: SmileAiConversationMessage) => m.role === "user" || m.role === "assistant",
  );

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Smiley transcript"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-dashboard-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-dashboard-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-bg-primary/10">
              <Bot className="h-4 w-4 text-brand-bg-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-dashboard-heading">
                Smiley transcript
              </p>
              <p className="text-[10px] text-dashboard-muted">
                Conversation with Smiley before handoff
              </p>
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

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {loading ? (
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
              No messages in this conversation.
            </p>
          ) : (
            turns.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex ${isUser ? "justify-start" : "justify-end"}`}
                >
                  <div className={`max-w-[85%] ${isUser ? "mr-6" : "ml-6"}`}>
                    <div
                      className={`mb-1 flex items-center gap-1.5 ${isUser ? "" : "justify-end"}`}
                    >
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
                      <p className="whitespace-pre-wrap text-xs leading-relaxed">
                        {m.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
