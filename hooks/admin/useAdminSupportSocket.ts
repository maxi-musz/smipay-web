"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  connectAdminSupportSocket,
  joinConversationRoom,
  leaveConversationRoom,
  joinTicketRoom,
  leaveTicketRoom,
  emitAdminTyping,
  emitAdminStopTyping,
} from "@/lib/admin-support-socket";
import { useAdminSupportStore } from "@/store/admin/admin-support-store";

// ─── Conversation socket events ─────────────────────────────────────

interface ConversationCreatedEvent {
  id: string;
  user_id: string;
  email: string;
  status: string;
  created_at: string;
  first_message: string;
}

interface ConversationUpdatedEvent {
  conversation_id: string;
  event:
    | "new_user_message"
    | "claimed"
    | "closed"
    | "handover_accepted"
    | "handover_rejected";
  message?: {
    id: string;
    preview: string;
    sender_name: string;
    created_at: string;
  };
  assigned_to?: string;
  assigned_admin_name?: string;
}

interface ConversationNewMessageEvent {
  conversation_id: string;
  message: {
    id: string;
    message: string;
    is_from_user: boolean;
    is_internal: boolean;
    sender_name: string;
    sender_email: string;
    createdAt: string;
  };
}

interface ConversationClaimedEvent {
  conversation_id: string;
  assigned_to: string;
  assigned_admin_name: string;
}

interface HandoverRequestedEvent {
  handover_id: string;
  conversation_id: string;
  from_admin_id: string;
  from_admin_name: string;
  reason: string | null;
}

interface HandoverResolvedEvent {
  handover_id: string;
  conversation_id: string;
  status: "accepted" | "rejected";
  to_admin_name: string;
}

interface TypingEvent {
  conversation_id: string;
  is_admin?: boolean;
}

/**
 * Socket hook for the admin conversation list page.
 * Listens for conversation_created and conversation_updated events.
 */
export function useAdminSupportListSocket(
  onConversationCreated?: (data: ConversationCreatedEvent) => void,
) {
  const { fetchTickets } = useAdminSupportStore();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (connectedRef.current) return;
    connectedRef.current = true;

    const socket = connectAdminSupportSocket();

    const handleConversationCreated = (data: ConversationCreatedEvent) => {
      onConversationCreated?.(data);
    };

    const handleConversationUpdated = (_data: ConversationUpdatedEvent) => {
      // trigger refetch on any conversation update
    };

    // Legacy ticket events (still used for the tickets tab)
    const handleTicketCreated = () => {
      fetchTickets(true);
    };
    const handleTicketUpdated = () => {
      fetchTickets(true);
    };

    socket.on("conversation_created", handleConversationCreated);
    socket.on("conversation_updated", handleConversationUpdated);
    socket.on("ticket_created", handleTicketCreated);
    socket.on("ticket_updated", handleTicketUpdated);

    return () => {
      socket.off("conversation_created", handleConversationCreated);
      socket.off("conversation_updated", handleConversationUpdated);
      socket.off("ticket_created", handleTicketCreated);
      socket.off("ticket_updated", handleTicketUpdated);
      connectedRef.current = false;
    };
  }, [fetchTickets, onConversationCreated]);
}

/**
 * Socket hook for viewing a specific conversation detail.
 */
export function useAdminConversationDetailSocket(
  conversationId: string,
  onNewMessage?: (msg: ConversationNewMessageEvent["message"]) => void,
  onClaimed?: (data: ConversationClaimedEvent) => void,
  onClosed?: (data: { conversation_id: string }) => void,
  onHandoverRequested?: (data: HandoverRequestedEvent) => void,
  onHandoverResolved?: (data: HandoverResolvedEvent) => void,
) {
  const [userTyping, setUserTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const socket = connectAdminSupportSocket();
    joinConversationRoom(conversationId);

    const handleNewMessage = (data: ConversationNewMessageEvent) => {
      if (data.conversation_id === conversationId) {
        onNewMessage?.(data.message);
      }
    };

    const handleClaimed = (data: ConversationClaimedEvent) => {
      if (data.conversation_id === conversationId) {
        onClaimed?.(data);
      }
    };

    const handleClosed = (data: { conversation_id: string }) => {
      if (data.conversation_id === conversationId) {
        onClosed?.(data);
      }
    };

    const handleTyping = (data: TypingEvent) => {
      if (data.conversation_id === conversationId && !data.is_admin) {
        setUserTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(
          () => setUserTyping(false),
          3000,
        );
      }
    };

    const handleStopTyping = (data: TypingEvent) => {
      if (data.conversation_id === conversationId) {
        setUserTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    };

    const handleHandoverRequested = (data: HandoverRequestedEvent) => {
      onHandoverRequested?.(data);
    };

    const handleHandoverResolved = (data: HandoverResolvedEvent) => {
      if (data.conversation_id === conversationId) {
        onHandoverResolved?.(data);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("conversation_claimed", handleClaimed);
    socket.on("conversation_closed", handleClosed);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("handover_requested", handleHandoverRequested);
    socket.on("handover_resolved", handleHandoverResolved);

    return () => {
      leaveConversationRoom(conversationId);
      socket.off("new_message", handleNewMessage);
      socket.off("conversation_claimed", handleClaimed);
      socket.off("conversation_closed", handleClosed);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("handover_requested", handleHandoverRequested);
      socket.off("handover_resolved", handleHandoverResolved);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [
    conversationId,
    onNewMessage,
    onClaimed,
    onClosed,
    onHandoverRequested,
    onHandoverResolved,
  ]);

  const sendTyping = useCallback(() => {
    emitAdminTyping(conversationId);
  }, [conversationId]);

  const sendStopTyping = useCallback(() => {
    emitAdminStopTyping(conversationId);
  }, [conversationId]);

  return { userTyping, sendTyping, sendStopTyping };
}

// ─── Legacy ticket socket hooks (kept for backward compatibility) ───

interface TicketNewMessageEvent {
  ticket_id: string;
  message: {
    id: string;
    message: string;
    is_from_user: boolean;
    is_internal: boolean;
    sender_name: string;
    sender_email: string;
    createdAt: string;
  };
}

interface TicketStatusChangedEvent {
  ticket_id: string;
  old_status: string;
  new_status: string;
  ticket_number: string;
  resolution_notes?: string;
}

interface TicketAssignedEvent {
  ticket_id: string;
  ticket_number: string;
  assigned_to: string;
  assigned_admin_name: string;
}

export function useAdminSupportDetailSocket(
  ticketId: string,
  onNewMessage?: (msg: TicketNewMessageEvent["message"]) => void,
  onStatusChanged?: (data: TicketStatusChangedEvent) => void,
  onAssigned?: (data: TicketAssignedEvent) => void,
) {
  const [userTyping, setUserTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ticketId) return;

    const socket = connectAdminSupportSocket();
    joinTicketRoom(ticketId);

    const handleNewMessage = (data: TicketNewMessageEvent) => {
      if (data.ticket_id === ticketId) {
        onNewMessage?.(data.message);
      }
    };

    const handleStatusChanged = (data: TicketStatusChangedEvent) => {
      if (data.ticket_id === ticketId) {
        onStatusChanged?.(data);
      }
    };

    const handleAssigned = (data: TicketAssignedEvent) => {
      if (data.ticket_id === ticketId) {
        onAssigned?.(data);
      }
    };

    const handleTyping = (data: { ticket_id: string; is_admin?: boolean }) => {
      if (data.ticket_id === ticketId && !data.is_admin) {
        setUserTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(
          () => setUserTyping(false),
          3000,
        );
      }
    };

    const handleStopTyping = (data: { ticket_id: string }) => {
      if (data.ticket_id === ticketId) {
        setUserTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("status_changed", handleStatusChanged);
    socket.on("ticket_assigned", handleAssigned);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);

    return () => {
      leaveTicketRoom(ticketId);
      socket.off("new_message", handleNewMessage);
      socket.off("status_changed", handleStatusChanged);
      socket.off("ticket_assigned", handleAssigned);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [ticketId, onNewMessage, onStatusChanged, onAssigned]);

  const sendTyping = useCallback(() => {
    emitAdminTyping(ticketId);
  }, [ticketId]);

  const sendStopTyping = useCallback(() => {
    emitAdminStopTyping(ticketId);
  }, [ticketId]);

  return { userTyping, sendTyping, sendStopTyping };
}
