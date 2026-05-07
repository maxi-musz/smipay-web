"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { SessionWarning } from "@/components/auth/SessionWarning";
import { WebhookEventsSocketProvider } from "@/components/providers/WebhookEventsSocketProvider";
import { isPaymentInProgress } from "@/lib/auth-storage";
import Sidebar from "./Sidebar";
import { Loader2 } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Component that uses useSearchParams - wrapped in Suspense
function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  // Check if this is a payment callback
  const isPaymentCallback = searchParams.get("payment") === "callback";

  useEffect(() => {
    // Don't redirect if payment is in progress or this is a payment callback
    if (isPaymentCallback || isPaymentInProgress()) {
      return;
    }
    
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/signin?callbackUrl=/dashboard");
    }
  }, [isLoading, isAuthenticated, router, isPaymentCallback]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-bg-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { showWarning, timeRemaining, extendSession, handleLogout } = useActivityTracker();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-bg-primary" />
      </div>
    }>
      <DashboardAuthGuard>
        {/* Webhook-driven realtime updates (wallet credits, etc.). Lives only
            inside the authenticated dashboard tree so unauthenticated visitors
            never open a socket. */}
        <WebhookEventsSocketProvider>
          <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>

          {/* Session Warning Modal */}
          <SessionWarning
            showWarning={showWarning}
            timeRemaining={timeRemaining}
            onExtend={extendSession}
            onLogout={() => handleLogout("You have been logged out.")}
          />
        </WebhookEventsSocketProvider>
      </DashboardAuthGuard>
    </Suspense>
  );
}


