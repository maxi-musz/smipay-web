"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useAdminPermissions } from "@/hooks/admin/useAdminPermissions";
import {
  ANALYST_HOME,
  hasAnalystUserType,
  hasSuperAdminUserType,
  resolveAdminHomePath,
} from "@/lib/admin-home";
import { customerHome } from "@/lib/web-access";

export default function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { data, userTypes, loaded, loading, can, isSuperAdmin } =
    useAdminPermissions();

  useEffect(() => {
    if (isLoading || loading) return;

    if (!isAuthenticated) {
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(ANALYST_HOME)}`);
      return;
    }

    if (!user?.role || user.role === "user") {
      router.replace(customerHome(user?.role));
      return;
    }

    if (!loaded) return;

    // Full-access admins and tagged analysts can view the analyst area, as can
    // anyone holding read on the `analytics` module — which is what the API
    // itself now enforces. A restricted admin no longer gets in on role alone.
    const allowed =
      isSuperAdmin ||
      hasSuperAdminUserType(userTypes) ||
      hasAnalystUserType(userTypes) ||
      can("analytics", "read");
    if (!allowed) {
      router.replace(resolveAdminHomePath(data));
    }
  }, [
    isAuthenticated,
    isLoading,
    loaded,
    loading,
    router,
    user,
    userTypes,
    data,
    can,
    isSuperAdmin,
  ]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent" />
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role === "user") {
    return null;
  }

  if (
    user.role !== "admin" &&
    !hasSuperAdminUserType(userTypes) &&
    !hasAnalystUserType(userTypes)
  ) {
    return null;
  }

  return <>{children}</>;
}
