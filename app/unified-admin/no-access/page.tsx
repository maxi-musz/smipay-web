"use client";

import { ShieldOff, RefreshCw } from "lucide-react";
import { useAdminPermissions } from "@/hooks/admin/useAdminPermissions";
import { Button } from "@/components/ui/button";

/**
 * Landing page for a staff account that has been granted no modules.
 *
 * Reached when the permission resolver finds nothing this admin can read, so
 * there is no page to send them to. Deliberately a real page rather than a
 * redirect loop back to the dashboard — it tells the person what happened
 * instead of bouncing them between screens they cannot open.
 */
export default function AdminNoAccessPage() {
  const { refetch, loading } = useAdminPermissions();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-dashboard-accent/10">
          <ShieldOff className="h-7 w-7 text-dashboard-accent" />
        </div>

        <h1 className="text-xl font-semibold text-dashboard-text">
          No sections assigned yet
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-dashboard-muted">
          Your account is signed in, but it hasn&apos;t been given access to any
          part of the admin panel. Ask a full-access admin to assign your
          permissions from Management → Permissions.
        </p>

        <Button
          variant="outline"
          className="mt-6"
          onClick={() => void refetch()}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Check again
        </Button>
      </div>
    </div>
  );
}
