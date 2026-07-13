"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { SessionWarning } from "@/components/auth/SessionWarning";
import { SessionExpired } from "@/components/auth/SessionExpired";
import { WebhookEventsSocketProvider } from "@/components/providers/WebhookEventsSocketProvider";
import { isPaymentInProgress, getToken, clearAuth } from "@/lib/auth-storage";
import Sidebar from "./Sidebar";
import SupportFAB from "./SupportFAB";
import { UtilitiesPurchaseGuard } from "./UtilitiesPurchaseGuard";
import { Loader2 } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardAuthGuard({
  children,
  sessionExpired,
}: {
  children: React.ReactNode;
  sessionExpired: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, initializeAuth } = useAuth();
  const hasAttemptedReinit = useRef(false);

  const isPaymentCallback = searchParams.get("payment") === "callback";

  useEffect(() => {
    if (sessionExpired) return;
    if (isPaymentCallback || isPaymentInProgress()) return;

    if (!isLoading && !isAuthenticated) {
      // On pull-to-refresh (especially mobile), localStorage may be briefly unavailable.
      // If a token exists, re-run auth init instead of redirecting.
      if (typeof window !== "undefined" && getToken()) {
        if (!hasAttemptedReinit.current) {
          hasAttemptedReinit.current = true;
          initializeAuth();
        }
        return;
      }
      clearAuth();
      router.push("/auth/signin?callbackUrl=/dashboard");
    }
  }, [isLoading, isAuthenticated, router, isPaymentCallback, sessionExpired, initializeAuth]);

  if (sessionExpired) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Token exists but store not yet hydrated — show loading instead of redirecting
    if (typeof window !== "undefined" && getToken()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
          <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent" />
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const {
    showWarning,
    sessionExpired,
    timeRemaining,
    extendSession,
    handleLogout,
    acknowledgeExpiry,
  } = useActivityTracker();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent" />
      </div>
    }>
      <DashboardAuthGuard sessionExpired={sessionExpired}>
        {/* Webhook-driven realtime updates (wallet credits, etc.). Lives only
            inside the authenticated dashboard tree so unauthenticated visitors
            never open a socket. */}
        <WebhookEventsSocketProvider>
          <UtilitiesPurchaseGuard />
          <div className="flex min-h-screen bg-dashboard-bg">
            <Sidebar />
            <main className="flex-1 min-w-0 w-full overflow-auto">
              {children}
            </main>
          </div>

          {!sessionExpired && <SupportFAB />}

          <SessionWarning
            showWarning={showWarning && !sessionExpired}
            timeRemaining={timeRemaining}
            onExtend={extendSession}
            onLogout={() => handleLogout("You have been logged out.")}
          />

          <SessionExpired
            show={sessionExpired}
            onAcknowledge={acknowledgeExpiry}
          />
        </WebhookEventsSocketProvider>
      </DashboardAuthGuard>
    </Suspense>
  );
}


