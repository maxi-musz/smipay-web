"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquarePlus,
  Headphones,
  MessageCircle,
  Loader2,
  RefreshCw,
  Ticket,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { useUserSupportStore } from "@/store/user-support-store";
import { connectUserSupportSocket } from "@/lib/user-support-socket";
import type { ConversationListItem } from "@/types/support";
import { CONVERSATION_STATUS_DISPLAY } from "@/types/support";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

const STATUS_COLOR_CLASSES: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-800 border-emerald-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

function ConversationCard({ conversation: c }: { conversation: ConversationListItem }) {
  const router = useRouter();
  const statusInfo = CONVERSATION_STATUS_DISPLAY[c.status] ?? {
    label: c.status,
    color: "slate",
  };
  const statusClasses =
    STATUS_COLOR_CLASSES[statusInfo.color] ?? STATUS_COLOR_CLASSES.slate;

  const lastPreview = c.last_message?.message ?? "No messages yet";
  const isFromSupport = c.last_message?.is_from_user === false;

  return (
    <button
      type="button"
      onClick={() => router.push(`/dashboard/support/${c.id}`)}
      className="w-full text-left rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-3 sm:p-4 hover:bg-dashboard-surface/90 hover:border-dashboard-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bg-primary/30"
    >
      <div className="flex gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          {/* Agent name / waiting */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-dashboard-heading text-xs sm:text-sm truncate">
              {c.assigned_admin_name ?? "Waiting for support..."}
            </h3>
            {c.has_unread && (
              <span className="shrink-0 h-2 w-2 rounded-full bg-blue-500" />
            )}
          </div>

          {/* Status + ticket badge */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium border ${statusClasses}`}
            >
              {statusInfo.label}
            </span>
            {c.ticket && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium bg-dashboard-bg text-dashboard-muted border border-dashboard-border/50">
                <Ticket className="h-2.5 w-2.5" />
                {c.ticket.ticket_number}
              </span>
            )}
          </div>

          {/* Last message preview */}
          <p
            className={`text-[11px] sm:text-xs text-dashboard-muted truncate ${
              isFromSupport ? "italic" : ""
            }`}
          >
            {isFromSupport && c.last_message?.sender_name
              ? `${c.last_message.sender_name}: ${lastPreview}`
              : lastPreview}
          </p>

          {/* Time + message count */}
          <div className="flex items-center gap-2 mt-2 text-[10px] sm:text-xs text-dashboard-muted">
            <span>{relativeTime(c.last_message_at || c.updated_at)}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {c.message_count}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-3 sm:p-4 animate-pulse">
      <div className="h-3.5 w-3/4 bg-dashboard-border/50 rounded mb-2" />
      <div className="flex gap-2 mb-2">
        <div className="h-5 w-20 bg-dashboard-border/40 rounded" />
        <div className="h-5 w-24 bg-dashboard-border/40 rounded" />
      </div>
      <div className="h-3 w-full bg-dashboard-border/40 rounded mb-2" />
      <div className="h-2.5 w-16 bg-dashboard-border/40 rounded" />
    </div>
  );
}

export default function SupportPage() {
  const router = useRouter();
  const {
    conversations,
    listLoading: loading,
    listError: error,
    fetchConversations,
    invalidateList,
  } = useUserSupportStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleRetry = useCallback(() => {
    fetchConversations(true);
  }, [fetchConversations]);

  // Socket.IO: listen for real-time conversation updates
  const socketConnected = useRef(false);
  useEffect(() => {
    if (socketConnected.current) return;
    socketConnected.current = true;

    const socket = connectUserSupportSocket();

    const handleConversationUpdated = (data: {
      conversation_id: string;
      event: string;
    }) => {
      if (
        data.event === "new_reply" ||
        data.event === "claimed" ||
        data.event === "closed" ||
        data.event === "ticket_created" ||
        data.event === "handover_completed"
      ) {
        invalidateList();
        fetchConversations(true);
      }
    };

    socket.on("conversation_updated", handleConversationUpdated);

    return () => {
      socket.off("conversation_updated", handleConversationUpdated);
      socketConnected.current = false;
    };
  }, [fetchConversations, invalidateList]);

  const handleStartChat = () => {
    router.push("/dashboard/support/new");
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border sticky top-0 z-10">
        <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="p-1.5 -m-1.5 rounded-lg hover:bg-dashboard-bg text-dashboard-muted hover:text-dashboard-heading transition-colors shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-base sm:text-lg font-semibold text-dashboard-heading truncate">
              Help & Support
            </h1>
          </div>
          <Button
            onClick={handleStartChat}
            className="shrink-0 bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-xs sm:text-sm gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2"
          >
            <MessageSquarePlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Start Chat
          </Button>
        </div>
      </header>

      <main className="px-3 py-4 sm:px-4 sm:py-6">
        {loading ? (
          <div className="space-y-2 sm:space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 mb-3">
              <RefreshCw className="h-6 w-6" />
            </div>
            <p className="text-sm sm:text-base font-medium text-dashboard-heading mb-2">
              Something went wrong
            </p>
            <p className="text-xs sm:text-sm text-dashboard-muted mb-4 max-w-[240px]">
              {error}
            </p>
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : conversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 sm:py-16 text-center"
          >
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-dashboard-surface border border-dashboard-border/60 text-dashboard-muted mb-4">
              <Headphones className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <p className="text-sm sm:text-base font-semibold text-dashboard-heading mb-1">
              Need help?
            </p>
            <p className="text-xs sm:text-sm text-dashboard-muted mb-4 max-w-[260px]">
              Start a chat and our team will respond. No forms needed.
            </p>
            <Button
              onClick={handleStartChat}
              className="bg-brand-bg-primary hover:bg-brand-bg-primary/90 gap-2"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Start Chat
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2 sm:space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {conversations.map((conv, i) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <ConversationCard conversation={conv} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
