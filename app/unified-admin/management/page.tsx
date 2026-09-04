"use client";

import { useState } from "react";
import {
  SlidersHorizontal,
  Users,
  ShieldCheck,
  Tags,
  Loader2,
  Lock,
} from "lucide-react";
import { useAdminPermissions } from "@/hooks/admin/useAdminPermissions";
import { AdminUsersTab } from "./_components/AdminUsersTab";
import { AccessLevelTab } from "./_components/AccessLevelTab";
import { UserTypesTab } from "./_components/UserTypesTab";

type Tab = "admins" | "access" | "types";

export default function ManagementPage() {
  const { isSuperAdmin, can, loaded, loading } = useAdminPermissions();
  const [tab, setTab] = useState<Tab>("admins");

  if (loading && !loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent" />
      </div>
    );
  }

  const allowed = isSuperAdmin || can("management", "read");
  if (loaded && !allowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-dashboard-bg px-6 text-center">
        <Lock className="h-10 w-10 text-dashboard-muted" />
        <h1 className="text-lg font-bold text-dashboard-heading">No access</h1>
        <p className="max-w-sm text-sm text-dashboard-muted">
          You don&apos;t have permission to view Management. Ask a super-admin to
          grant you access.
        </p>
      </div>
    );
  }

  const canManage = isSuperAdmin;

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "admins", label: "Admin Users", icon: Users },
    { id: "access", label: "Access Level", icon: ShieldCheck },
    { id: "types", label: "User Types", icon: Tags },
  ];

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <SlidersHorizontal className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-dashboard-heading">
                Management
              </h1>
              <p className="text-xs text-dashboard-muted">
                Admin users, permission levels &amp; module access
              </p>
            </div>
          </div>
          {!canManage && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700">
              <Lock className="h-3.5 w-3.5" /> Read only
            </span>
          )}
        </div>

        <div className="flex gap-1 px-4 sm:px-6 lg:px-8">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-brand-bg-primary text-brand-bg-primary"
                    : "border-transparent text-dashboard-muted hover:text-dashboard-heading"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6 lg:px-8">
        {tab === "admins" ? (
          <AdminUsersTab canManage={canManage} />
        ) : tab === "access" ? (
          <AccessLevelTab canManage={canManage} />
        ) : (
          <UserTypesTab canManage={canManage} />
        )}
      </div>
    </div>
  );
}
