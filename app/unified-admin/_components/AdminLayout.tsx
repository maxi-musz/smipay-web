"use client";

import { useEffect, Suspense, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  NO_ACCESS_HOME,
  resolveAdminHomePath,
  shouldBlockUnifiedAdminAccess,
} from "@/lib/admin-home";
import { resolveRouteAccess } from "@/lib/admin-access";
import { customerHome } from "@/lib/web-access";
import { hasIntentionalLogout } from "@/lib/auth-storage";
import { Loader2 } from "lucide-react";

function AdminAuthGuard({
  children,
  sessionExpired,
}: {
  children: React.ReactNode;
  sessionExpired: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const {
    data,
    userTypes,
    modules,
    hasData,
    loaded,
    loading: permissionsLoading,
  } = useAdminPermissions();

  // Only decided once /me/permissions returns; if it fails we render and let
  // the API refuse, rather than wrongly locking the panel.
  const { blocked, fallbackHref } = useMemo(() => {
    if (!hasData) return { blocked: false, fallbackHref: null as string | null };

    const access = resolveRouteAccess(modules, pathname);
    if (access.allowed) {
      return { blocked: false, fallbackHref: null as string | null };
    }

    const home = resolveAdminHomePath(data);
    return {
      blocked: true,
      // Never bounce to the current page, or we loop.
      fallbackHref: home === pathname ? NO_ACCESS_HOME : home,
    };
  }, [hasData, modules, pathname, data]);

  useEffect(() => {
    if (sessionExpired) return;
    if (isLoading) return;

    if (!isAuthenticated) {
      // Sidebar logout navigates itself — don't overwrite with a "please sign in" bounce.
      if (hasIntentionalLogout()) return;
      router.push("/auth/signin?callbackUrl=/unified-admin/dashboard");
      return;
    }

    if (user?.role === "user" || !user?.role) {
      router.push(customerHome(user?.role));
      return;
    }

    if (loaded && shouldBlockUnifiedAdminAccess(userTypes)) {
      router.replace(ANALYST_HOME);
      return;
    }

    if (blocked && fallbackHref) {
      router.replace(fallbackHref);
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    router,
    sessionExpired,
    loaded,
    userTypes,
    blocked,
    fallbackHref,
  ]);

  if (sessionExpired) {
    return <>{children}</>;
  }

  // Hold the first paint until permissions resolve, or a forbidden page flashes.
  if (isLoading || permissionsLoading || !loaded) {
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

  if (blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent" />
      </div>
    );
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
