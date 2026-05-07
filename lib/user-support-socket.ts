"use client";

import { io, Socket } from "socket.io-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

let socket: Socket | null = null;
let currentConversationId: string | null = null;

export function getUserSupportSocket(): Socket | null {
  return socket;
}

export function connectUserSupportSocket(): Socket {
  if (socket && (socket.connected || socket.active)) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("smipay-access-token")
      : null;

  socket = io(`${API_BASE_URL}/support`, {
    auth: { token: token ?? "" },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    if (currentConversationId) {
      socket?.emit("join_conversation", { conversation_id: currentConversationId });
    }
  });

  socket.on("connect_error", (err) => {
    console.error("[SupportSocket] connection error:", err.message);
  });

  return socket;
}

export function disconnectUserSupportSocket() {
  currentConversationId = null;
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function joinConversationRoom(conversationId: string) {
  currentConversationId = conversationId;
  socket?.emit("join_conversation", { conversation_id: conversationId });
}

export function leaveConversationRoom(conversationId: string) {
  if (currentConversationId === conversationId) currentConversationId = null;
  socket?.emit("leave_conversation", { conversation_id: conversationId });
}

// Legacy ticket room helpers (for backward compatibility with admin socket events)
export function joinTicketRoom(ticketId: string) {
  socket?.emit("join_ticket", { ticket_id: ticketId });
}

export function leaveTicketRoom(ticketId: string) {
  socket?.emit("leave_ticket", { ticket_id: ticketId });
}

// ─── Typing indicators ──────────────────────────────────────────────

let typingTimer: ReturnType<typeof setTimeout> | null = null;
let isCurrentlyTyping = false;

export function emitUserTyping(conversationId: string) {
  if (!isCurrentlyTyping) {
    isCurrentlyTyping = true;
    socket?.emit("typing", { conversation_id: conversationId });
  }
  if (typingTimer) clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    isCurrentlyTyping = false;
    socket?.emit("stop_typing", { conversation_id: conversationId });
  }, 3000);
}

export function emitUserStopTyping(conversationId: string) {
  if (typingTimer) clearTimeout(typingTimer);
  isCurrentlyTyping = false;
  socket?.emit("stop_typing", { conversation_id: conversationId });
}
