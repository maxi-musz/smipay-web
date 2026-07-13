"use client";

import { io, Socket } from "socket.io-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Admin socket for OBSERVING live SmileAI conversations (the `/smileai`
 * namespace's admin observer rooms). Separate from the `/support` admin socket
 * so the two systems stay decoupled. Admins call `admin.smileai.observe` to
 * join a conversation room and then receive `admin.ai.*` mirror events.
 */
let socket: Socket | null = null;

export function connectAdminSmileAiSocket(): Socket {
  if (socket && (socket.connected || socket.active)) return socket;
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("smipay-access-token")
      : null;

  socket = io(`${API_BASE_URL}/smileai`, {
    auth: { token: token ?? "" },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function getAdminSmileAiSocket(): Socket | null {
  return socket;
}

export function observeSmileAiConversation(conversationId: string): void {
  connectAdminSmileAiSocket().emit("admin.smileai.observe", {
    conversation_id: conversationId,
  });
}

export function unobserveSmileAiConversation(conversationId: string): void {
  socket?.emit("admin.smileai.unobserve", {
    conversation_id: conversationId,
  });
}
