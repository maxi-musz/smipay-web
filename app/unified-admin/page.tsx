"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAdminPermissions } from "@/hooks/admin/useAdminPermissions";
import { resolveAdminHomePath, SUPER_ADMIN_HOME } from "@/lib/admin-home";

/** Sends each admin to the first page they can open. */
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
