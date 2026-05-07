"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Send,
  Lock,
  User,
  ShieldCheck,
  Clock,
  MessageCircle,
  Tag,
  Star,
  Smartphone,
  Globe,
  ExternalLink,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminSupportStore } from "@/store/admin/admin-support-store";
import { useAdminSupportNotifications } from "@/store/admin/admin-support-notifications-store";
import { useAdminSupportDetailSocket } from "@/hooks/admin/useAdminSupportSocket";
import { adminSupportApi } from "@/services/admin/support-api";
import { SUPPORT_STATUSES, SUPPORT_PRIORITIES } from "@/types/admin/support";
import type { SupportTicketDetail, SupportMessage } from "@/types/admin/support";

// --- Status / Priority badge maps ---

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  waiting_user: "bg-orange-50 text-orange-700 border-orange-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
  escalated: "bg-red-50 text-red-700 border-red-200",
};

const PRIORITY_BADGE: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
};

// --- Helpers ---

function formatLabel(str: string): string {
  return str
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ");
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function formatResponseTime(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return "<1m";
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.round((seconds % 86400) / 3600);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(val);
}

function fullDate(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Main page component ---

export default function SupportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user: currentAdmin } = useAuth();
  const ticketId = params.id;
  const dismissByTicket = useAdminSupportNotifications((s) => s.dismissByTicket);

  useEffect(() => {
    if (ticketId) dismissByTicket(ticketId);
  }, [ticketId, dismissByTicket]);

  const { fetchDetail, invalidateDetail, detailLoading, detailError } =
    useAdminSupportStore();

  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [resolveModal, setResolveModal] = useState(false);
  const [resolveNotes, setResolveNotes] = useState("");
  const [pendingStatus, setPendingStatus] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSocketNewMessage = useCallback(
    (msg: {
      id: string;
      message: string;
      is_from_user: boolean;
      is_internal: boolean;
      sender_name: string;
      sender_email: string;
      createdAt: string;
    }) => {
      setTicket((prev) => {
        if (!prev) return prev;
        const exists = prev.messages.some((m) => m.id === msg.id);
        if (exists) return prev;
        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              ...msg,
              user_id: null,
              sender_email: msg.sender_email,
              sender_name: msg.sender_name,
              attachments: null,
            } as SupportMessage,
          ],
          message_count: prev.message_count + 1,
        };
      });
    },
    [],
  );

  const handleSocketStatusChanged = useCallback(
    (data: { new_status: string; resolution_notes?: string }) => {
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              status: data.new_status,
              resolution_notes: data.resolution_notes ?? prev.resolution_notes,
            }
          : prev,
      );
    },
    [],
  );

  const handleSocketAssigned = useCallback(
    (data: { assigned_to: string; assigned_admin_name: string }) => {
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              assigned_to: data.assigned_to,
              assigned_admin: {
                id: data.assigned_to,
                first_name: data.assigned_admin_name.split(" ")[0] ?? "",
                last_name: data.assigned_admin_name.split(" ").slice(1).join(" ") ?? "",
                email: "",
              },
            }
          : prev,
      );
    },
    [],
  );

  const { userTyping, sendTyping, sendStopTyping } = useAdminSupportDetailSocket(
    ticketId,
    handleSocketNewMessage,
    handleSocketStatusChanged,
    handleSocketAssigned,
  );

  const load = useCallback(
    async (force = false) => {
      const data = await fetchDetail(ticketId, force);
      if (data) setTicket(data);
    },
    [fetchDetail, ticketId],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  // --- Mutations ---

  const handleReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    setActionError(null);
    sendStopTyping();
    try {
      await adminSupportApi.reply(ticketId, {
        message: replyText.trim(),
        is_internal: isInternal,
      });
      setReplyText("");
      invalidateDetail(ticketId);
      await load(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleReply();
      return;
    }
    sendTyping();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "resolved" || newStatus === "closed") {
      setPendingStatus(newStatus);
      setResolveModal(true);
      return;
    }
    setMutating(true);
    setActionError(null);
    try {
      await adminSupportApi.updateStatus(ticketId, { status: newStatus });
      invalidateDetail(ticketId);
      await load(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setMutating(false);
    }
  };

  const handleResolveConfirm = async () => {
    setMutating(true);
    setActionError(null);
    try {
      await adminSupportApi.updateStatus(ticketId, {
        status: pendingStatus,
        resolution_notes: resolveNotes.trim() || undefined,
      });
      setResolveModal(false);
      setResolveNotes("");
      setPendingStatus("");
      invalidateDetail(ticketId);
      await load(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setMutating(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    setMutating(true);
    setActionError(null);
    try {
      await adminSupportApi.updatePriority(ticketId, { priority: newPriority });
      invalidateDetail(ticketId);
      await load(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update priority");
    } finally {
      setMutating(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!currentAdmin?.id || mutating) return;
    setMutating(true);
    setActionError(null);
    try {
      await adminSupportApi.assign(ticketId, { assigned_to: currentAdmin.id });
      invalidateDetail(ticketId);
      await load(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to assign ticket");
    } finally {
      setMutating(false);
    }
  };

  const isAssignedToMe = ticket?.assigned_admin?.id === currentAdmin?.id;
  const canInteract = isAssignedToMe;

  // --- Loading / Error states ---

  if (detailLoading && !ticket) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-bg-primary" />
      </div>
    );
  }

  if (detailError && !ticket) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-600">{detailError}</p>
        <button
          type="button"
          onClick={() => load(true)}
          className="px-4 py-2 text-xs font-medium bg-brand-bg-primary text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!ticket) return null;

  const user = ticket.user;

  return (
    <div className="h-full bg-dashboard-bg flex flex-col">
      {/* Header */}
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.push("/unified-admin/support")}
            className="p-1.5 rounded-lg hover:bg-dashboard-bg transition-colors text-dashboard-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-semibold text-blue-600">
                {ticket.ticket_number}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${STATUS_BADGE[ticket.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
              >
                {formatLabel(ticket.status)}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${PRIORITY_BADGE[ticket.priority] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
              >
                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
              </span>
            </div>
            <p className="text-sm font-medium text-dashboard-heading truncate mt-0.5">
              {ticket.subject}
            </p>
          </div>
        </div>
      </header>

      {/* Action error */}
      <AnimatePresence>
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-4 mt-2 sm:mx-6 lg:mx-8 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 flex items-center justify-between"
          >
            {actionError}
            <button type="button" onClick={() => setActionError(null)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main: messages + reply */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8 space-y-3">
            {/* Original description */}
            {ticket.description && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-dashboard-surface border border-dashboard-border/60 rounded-xl px-4 py-3"
              >
                <p className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-1.5">
                  Original Description
                </p>
                <p className="text-xs text-dashboard-heading whitespace-pre-wrap leading-relaxed">
                  {ticket.description}
                </p>
                <p className="text-[10px] text-dashboard-muted mt-2">
                  {fullDate(ticket.createdAt)}
                </p>
              </motion.div>
            )}

            {/* Messages */}
            {ticket.messages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} index={i} />
            ))}

            {/* Typing indicator */}
            <AnimatePresence>
              {userTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="flex justify-start"
                >
                  <div className="bg-dashboard-surface border border-dashboard-border/60 rounded-xl px-3.5 py-2 inline-flex items-center gap-1.5">
                    <span className="flex gap-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-dashboard-muted animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-dashboard-muted animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-dashboard-muted animate-bounce [animation-delay:300ms]" />
                    </span>
                    <span className="text-[10px] text-dashboard-muted">User is typing...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Reply box / Claim prompt */}
          <div className="border-t border-dashboard-border/60 bg-dashboard-surface px-4 py-3 sm:px-6 lg:px-8">
            {canInteract ? (
              <div className="flex items-start gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isInternal ? "Write an internal note..." : "Type your reply..."}
                    rows={3}
                    className={`w-full px-3 py-2.5 text-xs rounded-lg border focus:outline-none focus:ring-2 resize-none ${
                      isInternal
                        ? "bg-amber-50/50 border-amber-200 focus:ring-amber-300/40 placeholder:text-amber-400"
                        : "bg-dashboard-bg border-dashboard-border/60 focus:ring-brand-bg-primary/20 placeholder:text-dashboard-muted/60"
                    } text-dashboard-heading`}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <button
                      type="button"
                      onClick={() => setIsInternal(!isInternal)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                        isInternal
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : "bg-dashboard-bg text-dashboard-muted border border-dashboard-border/60 hover:text-dashboard-heading"
                      }`}
                    >
                      <Lock className="h-3 w-3" />
                      {isInternal ? "Internal Note" : "Public Reply"}
                    </button>
                    <span className="text-[10px] text-dashboard-muted">
                      Ctrl+Enter to send
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={!replyText.trim() || sending}
                  className="flex-shrink-0 p-2.5 rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-dashboard-heading">
                    Assign this ticket to yourself to interact
                  </p>
                  <p className="text-[10px] text-dashboard-muted mt-0.5">
                    You must claim this ticket before you can reply, change status, or take any action.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAssignToMe}
                  disabled={mutating}
                  className="flex-shrink-0 px-4 py-2 text-xs font-medium bg-brand-bg-primary text-white rounded-lg hover:bg-brand-bg-primary/90 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                >
                  {mutating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                  Assign to me
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-dashboard-border/60 bg-dashboard-surface overflow-y-auto">
          <div className="px-4 py-4 space-y-4">
            {/* Assignment */}
            <SidebarSection title="Assignment">
              {ticket.assigned_admin ? (
                <div className="flex items-center gap-2 px-2.5 py-2 bg-dashboard-bg border border-dashboard-border/60 rounded-lg">
                  <div className="h-6 w-6 rounded-full bg-brand-bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-brand-bg-primary">
                      {`${(ticket.assigned_admin.first_name ?? "")[0] ?? ""}${(ticket.assigned_admin.last_name ?? "")[0] ?? ""}`.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-dashboard-heading truncate block">
                      {`${ticket.assigned_admin.first_name ?? ""} ${ticket.assigned_admin.last_name ?? ""}`.trim()}
                    </span>
                    {isAssignedToMe && (
                      <span className="text-[10px] text-emerald-600 font-medium">You are handling this ticket</span>
                    )}
                    {ticket.assigned_admin && !isAssignedToMe && (
                      <span className="text-[10px] text-dashboard-muted">Another admin is handling this</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] font-semibold text-amber-800 mb-0.5">Unassigned Ticket</p>
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      Claim this ticket to reply, change status, priority, or take any action.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAssignToMe}
                    disabled={mutating}
                    className="w-full px-3 py-2 text-xs font-medium bg-brand-bg-primary text-white rounded-lg hover:bg-brand-bg-primary/90 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    {mutating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <User className="h-3.5 w-3.5" />
                    )}
                    Assign to me
                  </button>
                </div>
              )}
            </SidebarSection>

            {/* Actions — locked behind assignment */}
            <SidebarSection title="Actions">
              {canInteract ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-medium text-dashboard-muted mb-1">
                      Status
                    </label>
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={mutating}
                      className="w-full px-2.5 py-1.5 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 appearance-none disabled:opacity-50"
                    >
                      {SUPPORT_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-dashboard-muted mb-1">
                      Priority
                    </label>
                    <select
                      value={ticket.priority}
                      onChange={(e) => handlePriorityChange(e.target.value)}
                      disabled={mutating}
                      className="w-full px-2.5 py-1.5 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 appearance-none disabled:opacity-50"
                    >
                      {SUPPORT_PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <Lock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Assign this ticket to yourself to change status, priority, or reply.
                  </p>
                </div>
              )}
            </SidebarSection>

            {/* Ticket info */}
            <SidebarSection title="Ticket Info">
              <div className="space-y-1.5">
                <InfoRow label="Type" value={formatLabel(ticket.support_type)} />
                <InfoRow
                  label="Messages"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {ticket.message_count}
                    </span>
                  }
                />
                <InfoRow label="Created" value={fullDate(ticket.createdAt)} />
                <InfoRow label="Updated" value={fullDate(ticket.updatedAt)} />
                <InfoRow
                  label="Response Time"
                  value={formatResponseTime(ticket.response_time_seconds)}
                />
                {ticket.satisfaction_rating !== null && (
                  <InfoRow
                    label="Rating"
                    value={
                      <span className="inline-flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < (ticket.satisfaction_rating ?? 0)
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                        <span className="text-[10px] ml-0.5">
                          {ticket.satisfaction_rating}/5
                        </span>
                      </span>
                    }
                  />
                )}
                {ticket.tags && ticket.tags.length > 0 && (
                  <div className="flex items-start gap-2 py-1">
                    <span className="text-[10px] text-dashboard-muted w-20 flex-shrink-0 pt-0.5">
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {ticket.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-dashboard-bg rounded text-[10px] text-dashboard-muted"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SidebarSection>

            {/* Customer */}
            {user && (
              <SidebarSection title="Customer">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-brand-bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {user.profile_image?.secure_url ? (
                        <img
                          src={user.profile_image.secure_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-brand-bg-primary">
                          {`${(user.first_name ?? "")[0] ?? ""}${(user.last_name ?? "")[0] ?? ""}`.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-dashboard-heading truncate">
                        {`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Unknown"}
                      </p>
                      {user.smipay_tag && (
                        <p className="text-[10px] text-brand-bg-primary font-medium">
                          @{user.smipay_tag}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {user.email && <InfoRow label="Email" value={user.email} />}
                    <InfoRow label="Phone" value={user.phone_number} />
                    {user.wallet && (
                      <InfoRow
                        label="Balance"
                        value={formatCurrency(user.wallet.current_balance)}
                      />
                    )}
                    {user.tier && <InfoRow label="Tier" value={user.tier.name} />}
                    {user.kyc_verification && (
                      <InfoRow
                        label="KYC"
                        value={
                          <span
                            className={`inline-flex items-center gap-1 ${
                              user.kyc_verification.is_verified
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            <ShieldCheck className="h-3 w-3" />
                            {formatLabel(user.kyc_verification.status)}
                          </span>
                        }
                      />
                    )}
                    <InfoRow
                      label="Status"
                      value={
                        <span
                          className={
                            user.account_status === "active"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }
                        >
                          {formatLabel(user.account_status)}
                        </span>
                      }
                    />
                  </div>
                </div>
              </SidebarSection>
            )}

            {/* Related transaction */}
            {ticket.related_transaction && (
              <SidebarSection title="Related Transaction">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/unified-admin/transactions/${ticket.related_transaction!.id}`,
                    )
                  }
                  className="w-full text-left bg-dashboard-bg rounded-lg border border-dashboard-border/60 px-3 py-2.5 hover:border-brand-bg-primary/40 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-semibold text-blue-600">
                      {ticket.related_transaction.transaction_reference}
                    </span>
                    <ExternalLink className="h-3 w-3 text-dashboard-muted group-hover:text-brand-bg-primary transition-colors" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-dashboard-heading">
                      {formatCurrency(ticket.related_transaction.amount)}
                    </span>
                    <span className="text-[10px] text-dashboard-muted">
                      {formatLabel(ticket.related_transaction.transaction_type)}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${
                        ticket.related_transaction.status === "success"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatLabel(ticket.related_transaction.status)}
                    </span>
                  </div>
                  <p className="text-[10px] text-dashboard-muted mt-1">
                    {fullDate(ticket.related_transaction.createdAt)}
                  </p>
                </button>
              </SidebarSection>
            )}

            {/* Technical info */}
            {(ticket.ip_address || ticket.device_metadata || ticket.user_agent) && (
              <SidebarSection title="Technical Info">
                <div className="space-y-1.5">
                  {ticket.ip_address && (
                    <InfoRow
                      label="IP"
                      value={
                        <span className="inline-flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {ticket.ip_address}
                        </span>
                      }
                    />
                  )}
                  {ticket.user_agent && (
                    <InfoRow
                      label="User Agent"
                      value={
                        <span className="block text-[10px] leading-relaxed break-all" title={ticket.user_agent}>
                          {ticket.user_agent}
                        </span>
                      }
                    />
                  )}
                  {ticket.device_metadata && (
                    <>
                      <InfoRow
                        label="Platform"
                        value={
                          <span className="inline-flex items-center gap-1">
                            <Smartphone className="h-3 w-3" />
                            {formatLabel(ticket.device_metadata.platform)}
                          </span>
                        }
                      />
                      <InfoRow label="Device" value={ticket.device_metadata.device_model} />
                      <InfoRow label="App Ver." value={ticket.device_metadata.app_version} />
                    </>
                  )}
                </div>
              </SidebarSection>
            )}

            {/* Resolution */}
            {ticket.resolved_at && (
              <SidebarSection title="Resolution">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[10px] font-semibold text-emerald-700">
                      Resolved
                    </span>
                  </div>
                  <InfoRow label="At" value={fullDate(ticket.resolved_at)} />
                  {ticket.resolved_by_admin && (
                    <InfoRow
                      label="By"
                      value={`${ticket.resolved_by_admin.first_name ?? ""} ${ticket.resolved_by_admin.last_name ?? ""}`.trim()}
                    />
                  )}
                  {ticket.resolution_notes && (
                    <div className="pt-1">
                      <p className="text-[10px] text-dashboard-muted mb-0.5">Notes</p>
                      <p className="text-xs text-emerald-800 whitespace-pre-wrap">
                        {ticket.resolution_notes}
                      </p>
                    </div>
                  )}
                </div>
              </SidebarSection>
            )}

            {/* User feedback */}
            {ticket.feedback && (
              <SidebarSection title="User Feedback">
                <p className="text-xs text-dashboard-heading whitespace-pre-wrap leading-relaxed">
                  {ticket.feedback}
                </p>
              </SidebarSection>
            )}
          </div>
        </aside>
      </div>

      {/* Resolve modal */}
      <AnimatePresence>
        {resolveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setResolveModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-dashboard-border/60">
                <h3 className="text-sm font-bold text-dashboard-heading">
                  {pendingStatus === "resolved" ? "Resolve Ticket" : "Close Ticket"}
                </h3>
                <p className="text-[10px] text-dashboard-muted mt-0.5">
                  Add resolution notes (optional)
                </p>
              </div>
              <div className="px-5 py-4">
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Describe how the issue was resolved..."
                  rows={4}
                  className="w-full px-3 py-2.5 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 resize-none"
                />
              </div>
              <div className="px-5 py-3 border-t border-dashboard-border/60 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setResolveModal(false);
                    setResolveNotes("");
                    setPendingStatus("");
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResolveConfirm}
                  disabled={mutating}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                >
                  {mutating && <Loader2 className="h-3 w-3 animate-spin" />}
                  {pendingStatus === "resolved" ? "Resolve" : "Close"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

function MessageBubble({
  message,
  index,
}: {
  message: SupportMessage;
  index: number;
}) {
  const isUser = message.is_from_user;
  const isNote = message.is_internal;

  if (isNote) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.03 * Math.min(index, 10) }}
        className="flex justify-center"
      >
        <div className="max-w-md w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Lock className="h-3 w-3 text-amber-600" />
            <span className="text-[10px] font-semibold text-amber-700">Internal Note</span>
            <span className="text-[10px] text-amber-500 ml-auto">
              {message.sender_name ?? "Admin"}
            </span>
          </div>
          <p className="text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">
            {message.message}
          </p>
          <p className="text-[10px] text-amber-500 mt-1.5">{relativeTime(message.createdAt)}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.03 * Math.min(index, 10) }}
      className={`flex ${isUser ? "justify-start" : "justify-end"}`}
    >
      <div className={`max-w-md ${isUser ? "mr-12" : "ml-12"}`}>
        <div className={`flex items-center gap-1.5 mb-1 ${isUser ? "" : "justify-end"}`}>
          {isUser ? (
            <User className="h-3 w-3 text-dashboard-muted" />
          ) : (
            <ShieldCheck className="h-3 w-3 text-white/70" />
          )}
          <span
            className={`text-[10px] font-medium ${isUser ? "text-dashboard-muted" : "text-dashboard-muted"}`}
          >
            {message.sender_name ?? (isUser ? "User" : "Admin")}
          </span>
          <span className="text-[10px] text-dashboard-muted/60">
            {relativeTime(message.createdAt)}
          </span>
        </div>
        <div
          className={`rounded-xl px-3.5 py-2.5 ${
            isUser
              ? "bg-dashboard-surface border border-dashboard-border/60 text-dashboard-heading"
              : "bg-brand-bg-primary text-white"
          }`}
        >
          <p className="text-xs whitespace-pre-wrap leading-relaxed">{message.message}</p>
        </div>
      </div>
    </motion.div>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[10px] text-dashboard-muted w-20 flex-shrink-0">{label}</span>
      <span className={`text-xs text-dashboard-heading truncate ${valueClassName ?? ""}`}>
        {value}
      </span>
    </div>
  );
}
