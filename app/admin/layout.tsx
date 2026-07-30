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

export default function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { userTypes, loaded, loading } = useAdminPermissions();

  useEffect(() => {
    if (isLoading || loading) return;

    if (!isAuthenticated) {
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(ANALYST_HOME)}`);
      return;
    }

    if (!user?.role || user.role === "user") {
      router.replace("/dashboard");
      return;
    }

    if (!loaded) return;

    // Master admins (role) can view the analyst area too — e.g. via the
    // unified-admin "Analytics" sidebar tab — alongside tagged analysts.
    const allowed =
      user?.role === "admin" ||
      hasSuperAdminUserType(userTypes) ||
      hasAnalystUserType(userTypes);
    if (!allowed) {
      router.replace(resolveAdminHomePath({ user_types: userTypes }));
    }
  }, [
    isAuthenticated,
    isLoading,
    loaded,
    loading,
    router,
    user,
    userTypes,
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
