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
  MessageCircle,
  Star,
  Smartphone,
  Globe,
  X,
  Loader2,
  UserCheck,
  ArrowRightLeft,
  Ticket,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminConversationDetailSocket } from "@/hooks/admin/useAdminSupportSocket";
import { adminSupportApi } from "@/services/admin/support-api";
import { useAdminSupportNotifications } from "@/store/admin/admin-support-notifications-store";
import type {
  AdminConversationDetail,
  AdminConversationMessage,
} from "@/types/admin/support";
import { SUPPORT_TYPES } from "@/types/admin/support";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
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

function formatLabel(str: string): string {
  return str
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ");
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(val);
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  waiting_support: "bg-amber-50 text-amber-700 border-amber-200",
  waiting_user: "bg-blue-50 text-blue-700 border-blue-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function AdminConversationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user: currentAdmin } = useAuth();
  const conversationId = params.id;
  const dismissByTicket = useAdminSupportNotifications((s) => s.dismissByTicket);

  useEffect(() => {
    if (conversationId) dismissByTicket(conversationId);
  }, [conversationId, dismissByTicket]);

  const [conversation, setConversation] = useState<AdminConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [createTicketModal, setCreateTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketType, setTicketType] = useState("GENERAL_INQUIRY");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Socket handlers ──────────────────────────────────────────────

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
      setConversation((prev) => {
        if (!prev) return prev;
        const exists = prev.messages.some((m) => m.id === msg.id);
        if (exists) return prev;
        const fullMsg: AdminConversationMessage = {
          ...msg,
          user_id: null,
          attachments: null,
        };
        return { ...prev, messages: [...prev.messages, fullMsg] };
      });
    },
    [],
  );

  const handleSocketClaimed = useCallback(
    (data: { assigned_to: string; assigned_admin_name: string }) => {
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              assigned_to: data.assigned_to,
              status: "active",
              assigned_admin: {
                id: data.assigned_to,
                first_name: data.assigned_admin_name.split(" ")[0] ?? "",
                last_name: data.assigned_admin_name.split(" ").slice(1).join(" ") ?? "",
                email: null,
              },
            }
          : prev,
      );
    },
    [],
  );

  const handleSocketClosed = useCallback(() => {
    setConversation((prev) => (prev ? { ...prev, status: "closed" } : prev));
  }, []);

  const { userTyping, sendTyping, sendStopTyping } =
    useAdminConversationDetailSocket(
      conversationId,
      handleSocketNewMessage,
      handleSocketClaimed,
      handleSocketClosed,
    );

  // ─── Load conversation ────────────────────────────────────────────

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminSupportApi.getConversation(conversationId);
      if (res.success && res.data) {
        setConversation(res.data);
      } else {
        setError(res.message ?? "Failed to load conversation");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversation");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  // ─── Actions ──────────────────────────────────────────────────────

  const isAssignedToMe = conversation?.assigned_admin?.id === currentAdmin?.id;
  const canInteract = isAssignedToMe;
  const isClosed = conversation?.status === "closed";

  const handleClaim = async () => {
    if (mutating) return;
    setMutating(true);
    setActionError(null);
    try {
      await adminSupportApi.claimConversation(conversationId);
      await load(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to claim conversation");
    } finally {
      setMutating(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    setActionError(null);
    sendStopTyping();
    try {
      await adminSupportApi.replyToConversation(conversationId, {
        message: replyText.trim(),
        is_internal: isInternal,
      });
      setReplyText("");
      await load(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (mutating) return;
    setMutating(true);
    setActionError(null);
    try {
      await adminSupportApi.closeConversation(conversationId);
      await load(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to close conversation");
    } finally {
      setMutating(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketSubject.trim() || !ticketDescription.trim() || mutating) return;
    setMutating(true);
    setActionError(null);
    try {
      await adminSupportApi.createTicketFromConversation(conversationId, {
        subject: ticketSubject.trim(),
        description: ticketDescription.trim(),
        support_type: ticketType,
      });
      setCreateTicketModal(false);
      setTicketSubject("");
      setTicketDescription("");
      await load(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setMutating(false);
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

  // ─── Loading / Error ──────────────────────────────────────────────

  if (loading && !conversation) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-bg-primary" />
      </div>
    );
  }

  if (error && !conversation) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-600">{error}</p>
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

  if (!conversation) return null;

  const user = conversation.user;

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
              <span className="text-xs font-semibold text-dashboard-heading">
                {user
                  ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || conversation.email
                  : conversation.email ?? "User"}
              </span>
              {user?.smipay_tag && (
                <span className="text-[10px] text-brand-bg-primary font-medium">
                  @{user.smipay_tag}
                </span>
              )}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${STATUS_BADGE[conversation.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
              >
                {formatLabel(conversation.status)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-dashboard-muted">
              {conversation.assigned_admin ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <UserCheck className="h-3 w-3" />
                  {`${conversation.assigned_admin.first_name ?? ""} ${conversation.assigned_admin.last_name ?? ""}`.trim()}
                  {isAssignedToMe && " (you)"}
                </span>
              ) : (
                <span className="text-amber-600 font-medium">Unassigned</span>
              )}
              {conversation.ticket && (
                <span className="inline-flex items-center gap-0.5 text-blue-600 font-medium">
                  <Ticket className="h-3 w-3" />
                  {conversation.ticket.ticket_number}
                </span>
              )}
            </div>
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
            {conversation.messages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} index={i} />
            ))}

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
          {!isClosed && (
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
                      <span className="text-[10px] text-dashboard-muted">Ctrl+Enter to send</span>
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
                      {conversation.assigned_to
                        ? "Another agent is handling this conversation"
                        : "Claim this conversation to start replying"}
                    </p>
                  </div>
                  {!conversation.assigned_to && (
                    <button
                      type="button"
                      onClick={handleClaim}
                      disabled={mutating}
                      className="flex-shrink-0 px-4 py-2 text-xs font-medium bg-brand-bg-primary text-white rounded-lg hover:bg-brand-bg-primary/90 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                    >
                      {mutating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <User className="h-3.5 w-3.5" />
                      )}
                      Claim
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {isClosed && (
            <div className="border-t border-dashboard-border/60 bg-dashboard-surface px-4 py-3 sm:px-6 lg:px-8">
              <p className="text-xs text-dashboard-muted text-center">
                This conversation has been closed
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-dashboard-border/60 bg-dashboard-surface overflow-y-auto">
          <div className="px-4 py-4 space-y-4">
            {/* Actions */}
            {canInteract && !isClosed && (
              <SidebarSection title="Actions">
                <div className="space-y-1.5">
                  {!conversation.ticket && (
                    <button
                      type="button"
                      onClick={() => setCreateTicketModal(true)}
                      disabled={mutating}
                      className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Ticket className="h-3.5 w-3.5" />
                      Create Ticket
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={mutating}
                    className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                  >
                    {mutating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    Close Conversation
                  </button>
                </div>
              </SidebarSection>
            )}

            {/* Assignment */}
            <SidebarSection title="Assignment">
              {conversation.assigned_admin ? (
                <div className="flex items-center gap-2 px-2.5 py-2 bg-dashboard-bg border border-dashboard-border/60 rounded-lg">
                  <div className="h-6 w-6 rounded-full bg-brand-bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-brand-bg-primary">
                      {`${(conversation.assigned_admin.first_name ?? "")[0] ?? ""}${(conversation.assigned_admin.last_name ?? "")[0] ?? ""}`.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-dashboard-heading truncate block">
                      {`${conversation.assigned_admin.first_name ?? ""} ${conversation.assigned_admin.last_name ?? ""}`.trim()}
                    </span>
                    {isAssignedToMe && (
                      <span className="text-[10px] text-emerald-600 font-medium">You</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] font-semibold text-amber-800 mb-0.5">Unassigned</p>
                    <p className="text-[10px] text-amber-700">Claim to start replying.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClaim}
                    disabled={mutating}
                    className="w-full px-3 py-2 text-xs font-medium bg-brand-bg-primary text-white rounded-lg hover:bg-brand-bg-primary/90 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    {mutating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <User className="h-3.5 w-3.5" />
                    )}
                    Claim
                  </button>
                </div>
              )}
            </SidebarSection>

            {/* Conversation info */}
            <SidebarSection title="Info">
              <div className="space-y-1.5">
                <InfoRow label="Messages" value={conversation.messages.length} />
                <InfoRow label="Created" value={fullDate(conversation.createdAt)} />
                <InfoRow label="Updated" value={fullDate(conversation.updatedAt)} />
                {conversation.satisfaction_rating !== null && (
                  <InfoRow
                    label="Rating"
                    value={
                      <span className="inline-flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < (conversation.satisfaction_rating ?? 0)
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </span>
                    }
                  />
                )}
              </div>
            </SidebarSection>

            {/* Ticket */}
            {conversation.ticket && (
              <SidebarSection title="Linked Ticket">
                <button
                  type="button"
                  onClick={() => router.push(`/unified-admin/support/${conversation.ticket!.id}`)}
                  className="w-full text-left bg-dashboard-bg rounded-lg border border-dashboard-border/60 px-3 py-2.5 hover:border-brand-bg-primary/40 transition-colors"
                >
                  <span className="font-mono text-[10px] font-semibold text-blue-600">
                    {conversation.ticket.ticket_number}
                  </span>
                  <p className="text-xs font-medium text-dashboard-heading truncate mt-0.5">
                    {conversation.ticket.subject}
                  </p>
                  <span className="text-[10px] text-dashboard-muted">
                    {formatLabel(conversation.ticket.status)} / {formatLabel(conversation.ticket.priority)}
                  </span>
                </button>
              </SidebarSection>
            )}

            {/* Customer */}
            {user && (
              <SidebarSection title="Customer">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-brand-bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {user.profile_image?.secure_url ? (
                        <img src={user.profile_image.secure_url} alt="" className="h-full w-full object-cover" />
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
                        <p className="text-[10px] text-brand-bg-primary font-medium">@{user.smipay_tag}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {user.email && <InfoRow label="Email" value={user.email} />}
                    <InfoRow label="Phone" value={user.phone_number} />
                    {user.wallet && <InfoRow label="Balance" value={formatCurrency(user.wallet.current_balance)} />}
                    {user.tier && <InfoRow label="Tier" value={user.tier.name} />}
                    {user.kyc_verification && (
                      <InfoRow
                        label="KYC"
                        value={
                          <span className={`inline-flex items-center gap-1 ${user.kyc_verification.is_verified ? "text-emerald-600" : "text-amber-600"}`}>
                            <ShieldCheck className="h-3 w-3" />
                            {formatLabel(user.kyc_verification.status)}
                          </span>
                        }
                      />
                    )}
                  </div>
                </div>
              </SidebarSection>
            )}

            {/* Handover history */}
            {conversation.handovers && conversation.handovers.length > 0 && (
              <SidebarSection title="Transfer History">
                <div className="space-y-1.5">
                  {conversation.handovers.map((h) => (
                    <div
                      key={h.id}
                      className="bg-dashboard-bg border border-dashboard-border/60 rounded-lg px-3 py-2 text-[10px]"
                    >
                      <div className="flex items-center gap-1">
                        <ArrowRightLeft className="h-3 w-3 text-dashboard-muted" />
                        <span className="font-medium text-dashboard-heading">
                          {h.from_admin_name} → {h.to_admin_name}
                        </span>
                      </div>
                      {h.reason && (
                        <p className="text-dashboard-muted mt-0.5">{h.reason}</p>
                      )}
                      <span
                        className={`mt-1 inline-block font-medium ${
                          h.status === "accepted"
                            ? "text-emerald-600"
                            : h.status === "rejected"
                              ? "text-red-600"
                              : "text-amber-600"
                        }`}
                      >
                        {formatLabel(h.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </SidebarSection>
            )}

            {/* Technical info */}
            {(conversation.ip_address || conversation.device_metadata || conversation.user_agent) && (
              <SidebarSection title="Technical">
                <div className="space-y-1.5">
                  {conversation.ip_address && (
                    <InfoRow
                      label="IP"
                      value={
                        <span className="inline-flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {conversation.ip_address}
                        </span>
                      }
                    />
                  )}
                  {conversation.device_metadata && (
                    <>
                      <InfoRow
                        label="Platform"
                        value={
                          <span className="inline-flex items-center gap-1">
                            <Smartphone className="h-3 w-3" />
                            {formatLabel(conversation.device_metadata.platform)}
                          </span>
                        }
                      />
                      <InfoRow label="Device" value={conversation.device_metadata.device_model} />
                    </>
                  )}
                </div>
              </SidebarSection>
            )}
          </div>
        </aside>
      </div>

      {/* Create ticket modal */}
      <AnimatePresence>
        {createTicketModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setCreateTicketModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-dashboard-border/60">
                <h3 className="text-sm font-bold text-dashboard-heading">Create Ticket from Chat</h3>
                <p className="text-[10px] text-dashboard-muted mt-0.5">
                  This creates a formal ticket linked to the conversation.
                </p>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-dashboard-muted mb-1">Subject</label>
                  <input
                    type="text"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Ticket subject..."
                    className="w-full px-3 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-dashboard-muted mb-1">Description</label>
                  <textarea
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    placeholder="Describe the issue..."
                    rows={3}
                    className="w-full px-3 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-dashboard-muted mb-1">Type</label>
                  <select
                    value={ticketType}
                    onChange={(e) => setTicketType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                  >
                    {SUPPORT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="px-5 py-3 border-t border-dashboard-border/60 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateTicketModal(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateTicket}
                  disabled={!ticketSubject.trim() || !ticketDescription.trim() || mutating}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-brand-bg-primary text-white hover:bg-brand-bg-primary/90 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                >
                  {mutating && <Loader2 className="h-3 w-3 animate-spin" />}
                  Create Ticket
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function MessageBubble({ message, index }: { message: AdminConversationMessage; index: number }) {
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
            <span className="text-[10px] text-amber-500 ml-auto">{message.sender_name ?? "Admin"}</span>
          </div>
          <p className="text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">{message.message}</p>
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
            <ShieldCheck className="h-3 w-3 text-dashboard-muted" />
          )}
          <span className="text-[10px] font-medium text-dashboard-muted">
            {message.sender_name ?? (isUser ? "User" : "Admin")}
          </span>
          <span className="text-[10px] text-dashboard-muted/60">{relativeTime(message.createdAt)}</span>
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

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[10px] text-dashboard-muted w-20 flex-shrink-0">{label}</span>
      <span className="text-xs text-dashboard-heading truncate">{value}</span>
    </div>
  );
}
