"use client";

/**
 * Connects to the backend `/webhook-events` namespace and forwards
 * webhook-driven realtime updates into the dashboard store. The web
 * counterpart of mobile's `WebhookEventsSocketProvider`.
 *
 * Currently handles:
 *  - `wallet_credited` — successful deposit (DVA bank transfer or card).
 *    Triggers a silent dashboard refetch so the wallet card and recent
 *    transactions update without a manual reload.
 *
 * Side-effect-only — no public context value. Mount it once inside the
 * authenticated dashboard tree.
 */

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

import { useAuthStore } from "@/store/auth-store-backend";
import { useDashboardStore } from "@/store/dashboard-store";

interface WalletCreditedPayload {
  transaction_id: string;
  reference: string;
  amount: number;
  new_balance: number;
  source?: "dva_transfer" | "card" | "other";
  currency?: string;
  occurred_at?: string;
}

const TOKEN_KEY = "smipay-access-token";

/**
 * The socket gateway is mounted at the API origin (without the `/api/v1`
 * prefix). This mirrors mobile and matches NestJS's `@WebSocketGateway`
 * which is HTTP-version-agnostic.
 */
function getSocketOrigin(): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;
  try {
    return new URL(base).origin;
  } catch {
    return base;
  }
}

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function WebhookEventsSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const socketRef = useRef<Socket | null>(null);
  // In-memory dedupe — a socket reconnect / duplicate webhook should never
  // trigger two refetches for the same deposit.
  const handledRefsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const origin = getSocketOrigin();
    const token = readToken();
    if (!origin || !token) return;

    const s = io(`${origin}/webhook-events`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    s.on("wallet_credited", (payload: WalletCreditedPayload) => {
      if (!payload?.reference) return;
      if (handledRefsRef.current.has(payload.reference)) return;
      handledRefsRef.current.add(payload.reference);

      // Force-refresh so the wallet balance + recent transactions update
      // immediately. The store's cache (30s TTL) would otherwise hold stale
      // data right after a fresh deposit.
      void useDashboardStore.getState().fetchDashboardData(true);
    });

    socketRef.current = s;
    return () => {
      s.removeAllListeners();
      s.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
