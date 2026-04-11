"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { SessionWarning } from "@/components/auth/SessionWarning";
import { SessionExpired } from "@/components/auth/SessionExpired";
import AdminSidebar from "./AdminSidebar";
import SupportNotificationBanner from "./SupportNotificationBanner";
import { useAdminSupportGlobalSocket } from "@/hooks/admin/useAdminSupportGlobalSocket";
import { Loader2 } from "lucide-react";

function AdminAuthGuard({
  children,
  sessionExpired,
}: {
  children: React.ReactNode;
  sessionExpired: boolean;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (sessionExpired) return;
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/auth/signin?callbackUrl=/unified-admin/dashboard");
      return;
    }

    if (user?.role === "user" || !user?.role) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router, sessionExpired]);

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

  if (!isAuthenticated || !user || user.role === "user") {
    return null;
  }

  return <>{children}</>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAdminSupportGlobalSocket();
  const {
    showWarning,
    sessionExpired,
    timeRemaining,
    extendSession,
    handleLogout,
    acknowledgeExpiry,
  } = useActivityTracker();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
          <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent" />
        </div>
      }
    >
      <AdminAuthGuard sessionExpired={sessionExpired}>
        <SupportNotificationBanner />
        <div className="flex min-h-screen bg-dashboard-bg">
          <AdminSidebar />
          <main className="flex-1 flex flex-col min-h-0 min-w-0 max-w-full overflow-y-auto overflow-x-hidden admin-content-area pt-4 pr-14 lg:pt-0 lg:pr-0">
            {children}
          </main>
        </div>

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
      </AdminAuthGuard>
    </Suspense>
  );
}
