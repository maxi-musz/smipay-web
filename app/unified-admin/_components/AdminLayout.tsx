"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { SessionWarning } from "@/components/auth/SessionWarning";
import { SessionExpired } from "@/components/auth/SessionExpired";
import AdminSidebar from "./AdminSidebar";
import {
  AdminPanelTabs,
  type AdminPanelId,
} from "./AdminPanelTabs";
import SupportNotificationBanner from "./SupportNotificationBanner";
import { useAdminSupportGlobalSocket } from "@/hooks/admin/useAdminSupportGlobalSocket";
import { useAdminPermissions } from "@/hooks/admin/useAdminPermissions";
import {
  ANALYST_HOME,
  shouldBlockUnifiedAdminAccess,
} from "@/lib/admin-home";
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
  const { userTypes, loaded, loading: permissionsLoading } = useAdminPermissions();

  useEffect(() => {
    if (sessionExpired) return;
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/auth/signin?callbackUrl=/unified-admin/dashboard");
      return;
    }

    if (user?.role === "user" || !user?.role) {
      router.push("/dashboard");
      return;
    }

    if (loaded && shouldBlockUnifiedAdminAccess(userTypes)) {
      router.replace(ANALYST_HOME);
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    router,
    sessionExpired,
    loaded,
    userTypes,
  ]);

  if (sessionExpired) {
    return <>{children}</>;
  }

  if (isLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent" />
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role === "user") {
    return null;
  }

  if (loaded && shouldBlockUnifiedAdminAccess(userTypes)) {
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
  const [activePanel, setActivePanel] = useState<AdminPanelId>("general");
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
        <div className="flex h-screen flex-col overflow-hidden bg-dashboard-bg">
          <SupportNotificationBanner />
          <AdminPanelTabs active={activePanel} onChange={setActivePanel} />

          {activePanel === "general" ? (
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <AdminSidebar />
              <main className="admin-content-area min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto pt-4 pr-14 lg:pt-0 lg:pr-0">
                {children}
              </main>
            </div>
          ) : null}
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
