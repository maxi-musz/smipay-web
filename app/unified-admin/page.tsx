"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAdminPermissions } from "@/hooks/admin/useAdminPermissions";
import { resolveAdminHomePath, SUPER_ADMIN_HOME } from "@/lib/admin-home";

/**
 * Panel entry point.
 *
 * Sends each admin to the first page they can actually open rather than
 * hard-redirecting everyone to the dashboard — which used to drop a restricted
 * admin onto a module they had no grant for.
 */
export default function UnifiedAdminIndexPage() {
  const router = useRouter();
  const { data, loaded } = useAdminPermissions();

  useEffect(() => {
    if (!loaded) return;
    router.replace(data ? resolveAdminHomePath(data) : SUPER_ADMIN_HOME);
  }, [loaded, data, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent" />
    </div>
  );
}
