"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { connectAdminSupportSocket } from "@/lib/admin-support-socket";
import { useAdminSupportNotifications } from "@/store/admin/admin-support-notifications-store";

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
  event: "new_user_message" | "claimed" | "closed" | "handover_accepted" | "handover_rejected";
  message?: {
    id: string;
    preview: string;
    sender_name: string;
    created_at: string;
  };
}

interface HandoverRequestedEvent {
  handover_id: string;
  conversation_id: string;
  from_admin_id: string;
  from_admin_name: string;
  reason: string | null;
}

// Legacy ticket events
interface TicketUpdatedEvent {
  ticket_id: string;
  event: "new_user_message" | "assigned" | "status_changed" | "new_reply";
  ticket_number?: string;
  message?: {
    id: string;
    preview: string;
    sender_name: string;
    created_at: string;
  };
}

interface TicketCreatedEvent {
  id: string;
  ticket_number: string;
  subject: string;
  email: string;
}

export function useAdminSupportGlobalSocket() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const push = useAdminSupportNotifications((s) => s.push);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (connectedRef.current) return;
    connectedRef.current = true;

    const socket = connectAdminSupportSocket();

    // New conversation events
    const handleConversationCreated = (data: ConversationCreatedEvent) => {
      push({
        ticketId: data.id,
        ticketNumber: "New Chat",
        senderName: data.email ?? "User",
        preview: data.first_message ?? "New conversation started",
      });
    };

    const handleConversationUpdated = (data: ConversationUpdatedEvent) => {
      if (data.event !== "new_user_message") return;
      if (!data.message) return;

      const currentPath = pathnameRef.current;
      if (
        currentPath ===
        `/unified-admin/support/conversations/${data.conversation_id}`
      )
        return;

      push({
        ticketId: data.conversation_id,
        ticketNumber: "Chat",
        senderName: data.message.sender_name ?? "User",
        preview: data.message.preview ?? "New message",
      });
    };

    const handleHandoverRequested = (data: HandoverRequestedEvent) => {
      push({
        ticketId: data.conversation_id,
        ticketNumber: "Transfer Request",
        senderName: data.from_admin_name ?? "Admin",
        preview: data.reason ?? "A conversation transfer was requested",
      });
    };

    // Legacy ticket events
    const handleTicketUpdated = (data: TicketUpdatedEvent) => {
      if (
        data.event !== "new_user_message" &&
        data.event !== "new_reply"
      )
        return;
      if (!data.message) return;

      const currentPath = pathnameRef.current;
      if (currentPath === `/unified-admin/support/${data.ticket_id}`) return;

      push({
        ticketId: data.ticket_id,
        ticketNumber: data.ticket_number ?? "Ticket",
        senderName: data.message.sender_name ?? "User",
        preview: data.message.preview ?? "New message",
      });
    };

    const handleTicketCreated = (data: TicketCreatedEvent) => {
      push({
        ticketId: data.id,
        ticketNumber: data.ticket_number ?? "New Ticket",
        senderName: data.email ?? "User",
        preview: data.subject ?? "New support ticket created",
      });
    };

    socket.on("conversation_created", handleConversationCreated);
    socket.on("conversation_updated", handleConversationUpdated);
    socket.on("handover_requested", handleHandoverRequested);
    socket.on("ticket_updated", handleTicketUpdated);
    socket.on("ticket_created", handleTicketCreated);

    return () => {
      socket.off("conversation_created", handleConversationCreated);
      socket.off("conversation_updated", handleConversationUpdated);
      socket.off("handover_requested", handleHandoverRequested);
      socket.off("ticket_updated", handleTicketUpdated);
      socket.off("ticket_created", handleTicketCreated);
      connectedRef.current = false;
    };
  }, [push]);
}
