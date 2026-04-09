"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Users, RefreshCw } from "lucide-react";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import { ACCOUNT_STATUSES } from "@/types/admin/users";
import type { AdminUser } from "@/types/admin/users";
import { UsersAnalytics } from "./_components/UsersAnalytics";
import { UsersFilters } from "./_components/UsersFilters";
import { UsersTable } from "./_components/UsersTable";
import { UsersPagination } from "./_components/UsersPagination";
import { UsersListSort } from "./_components/UsersListSort";
import { UsersSkeleton } from "./_components/UsersSkeleton";
import { UserRoleModal } from "./_components/UserRoleModal";
import { UserStatusModal } from "./_components/UserStatusModal";
import { UserTierModal } from "./_components/UserTierModal";

export default function UsersPage() {
  const {
    users,
    meta,
    analytics,
    filters,
    isLoading,
    error,
    updateFilters,
    debouncedSearch,
    setPage,
    resetFilters,
    updateUser,
    refetch,
  } = useAdminUsers();

  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null);
  const [tierTarget, setTierTarget] = useState<AdminUser | null>(null);

  const handleUpdated = (updated: AdminUser) => {
    updateUser(updated);
  };

  if (isLoading && !analytics) return <UsersSkeleton />;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-dashboard-heading">User Management</h1>
              <p className="text-xs text-dashboard-muted">View and manage all users</p>
            </div>
          </div>
          <button
            type="button"
            onClick={refetch}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-3">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"
          >
            {error}
            <button type="button" onClick={refetch} className="ml-2 underline font-medium">Retry</button>
          </motion.div>
        )}

        {analytics && <UsersAnalytics analytics={analytics} />}

        {/* Status pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => updateFilters({ account_status: "" })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !filters.account_status
                ? "bg-brand-bg-primary text-white"
                : "bg-dashboard-surface border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading"
            }`}
          >
            All{analytics ? ` (${analytics.overview.total_users.toLocaleString()})` : ""}
          </button>
          {ACCOUNT_STATUSES.map(({ value, label, color }) => {
            const count = value === "active" ? analytics?.overview.active_users : analytics?.overview.suspended_users;
            const active = filters.account_status === value;
            const colorMap: Record<string, string> = {
              emerald: active ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200",
              red: active ? "bg-red-500 text-white" : "bg-red-50 text-red-700 border border-red-200",
            };
            return (
              <button
                key={value}
                type="button"
                onClick={() => updateFilters({ account_status: active ? "" : value })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${colorMap[color] ?? ""}`}
              >
                {label} ({(count ?? 0).toLocaleString()})
              </button>
            );
          })}
        </div>

        <UsersFilters
          filters={filters}
          onSearch={debouncedSearch}
          onFilterChange={updateFilters}
          onReset={resetFilters}
          total={meta?.total ?? 0}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          {meta ? (
            <UsersPagination meta={meta} onPageChange={setPage} className="sm:flex-1 sm:min-w-0" />
          ) : (
            <span className="text-xs text-dashboard-muted sm:flex-1" aria-hidden />
          )}
          <UsersListSort
            listSort={filters.list_sort}
            onChange={(list_sort) => updateFilters({ list_sort })}
            className="sm:justify-end"
          />
        </div>

        <UsersTable
          users={users}
          onEditRole={(u) => setRoleTarget(u)}
          onEditStatus={(u) => setStatusTarget(u)}
          onEditTier={(u) => setTierTarget(u)}
        />
      </div>

      {roleTarget && (
        <UserRoleModal
          user={roleTarget}
          open={!!roleTarget}
          onClose={() => setRoleTarget(null)}
          onUpdated={handleUpdated}
        />
      )}

      {statusTarget && (
        <UserStatusModal
          user={statusTarget}
          open={!!statusTarget}
          onClose={() => setStatusTarget(null)}
          onUpdated={handleUpdated}
        />
      )}

      {tierTarget && (
        <UserTierModal
          user={tierTarget}
          open={!!tierTarget}
          onClose={() => setTierTarget(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
