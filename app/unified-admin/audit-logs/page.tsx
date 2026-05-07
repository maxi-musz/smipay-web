"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { RefreshCw, ScrollText } from "lucide-react";
import { useAdminAuditLogs } from "@/hooks/admin/useAdminAuditLogs";
import { adminAuditLogsApi } from "@/services/admin/audit-logs-api";
import { AUDIT_STATUSES, AUDIT_SEVERITIES } from "@/types/admin/audit-logs";
import { AuditAnalytics } from "./_components/AuditAnalytics";
import { AuditFilters } from "./_components/AuditFilters";
import { AuditTable } from "./_components/AuditTable";
import { AuditPagination } from "./_components/AuditPagination";
import { AuditSkeleton } from "./_components/AuditSkeleton";
import { FlagAuditModal } from "./_components/FlagAuditModal";
import { ReviewAuditModal } from "./_components/ReviewAuditModal";

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "emerald",
  FAILURE: "red",
  PENDING: "amber",
  BLOCKED: "slate",
};

const SEVERITY_COLORS: Record<string, string> = {
  LOW: "slate",
  MEDIUM: "blue",
  HIGH: "orange",
  CRITICAL: "red",
};

function pillClasses(color: string, active: boolean): string {
  if (active) return "bg-brand-bg-primary text-white";
  return `bg-${color}-50 text-${color}-700 hover:bg-${color}-100`;
}

export default function AuditLogsPage() {
  const {
    logs: rawLogs,
    meta,
    analytics,
    filters,
    isLoading,
    error,
    updateFilters,
    debouncedSearch,
    setPage,
    resetFilters,
    refetch,
  } = useAdminAuditLogs();

  const logs = rawLogs ?? [];
  const safeMeta = meta ?? { total: 0, page: 1, limit: 20, total_pages: 0, has_next: false, has_previous: false };

  const [flagTarget, setFlagTarget] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<string | null>(null);

  const flaggedLog = flagTarget
    ? logs.find((l) => l.id === flagTarget)
    : null;
  const reviewedLog = reviewTarget
    ? logs.find((l) => l.id === reviewTarget)
    : null;

  const handleFlagConfirm = async (reason: string) => {
    if (!flagTarget) return;
    await adminAuditLogsApi.flag(flagTarget, { reason });
    refetch();
    setFlagTarget(null);
  };

  const handleReviewConfirm = async (notes: string, resolve: boolean) => {
    if (!reviewTarget) return;
    await adminAuditLogsApi.review(reviewTarget, {
      review_notes: notes,
      resolve,
    });
    refetch();
    setReviewTarget(null);
  };

  if (isLoading && !analytics) {
    return <AuditSkeleton />;
  }

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-dashboard-surface border-b border-dashboard-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <ScrollText className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-dashboard-heading">
                Audit Logs
              </h1>
              <p className="text-xs text-dashboard-muted">
                System activity trail &amp; compliance records
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={refetch}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-dashboard-bg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-surface transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-5">
        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-red-50 border border-red-200/60 px-4 py-3 flex items-center justify-between"
          >
            <p className="text-xs text-red-700">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="text-xs font-medium text-red-700 hover:text-red-800 underline underline-offset-2"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Analytics */}
        {analytics && <AuditAnalytics analytics={analytics} />}

        {/* Status pills */}
        {analytics && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => updateFilters({ status: "" })}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                !filters.status
                  ? "bg-brand-bg-primary text-white"
                  : "bg-dashboard-bg text-dashboard-muted hover:bg-dashboard-surface"
              }`}
            >
              All ({safeMeta.total})
            </button>
            {AUDIT_STATUSES.map((s) => {
              const count = analytics.by_status[s.value] ?? 0;
              const active = filters.status === s.value;
              const color = STATUS_COLORS[s.value] ?? "slate";
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() =>
                    updateFilters({ status: active ? "" : s.value })
                  }
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${pillClasses(color, active)}`}
                >
                  {s.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Severity pills */}
        {analytics && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-dashboard-muted mr-1">
              Severity:
            </span>
            <button
              type="button"
              onClick={() => updateFilters({ severity: "" })}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                !filters.severity
                  ? "bg-brand-bg-primary text-white"
                  : "bg-dashboard-bg text-dashboard-muted hover:bg-dashboard-surface"
              }`}
            >
              All
            </button>
            {AUDIT_SEVERITIES.map((s) => {
              const count = analytics.by_severity[s.value] ?? 0;
              const active = filters.severity === s.value;
              const color = SEVERITY_COLORS[s.value] ?? "slate";
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() =>
                    updateFilters({ severity: active ? "" : s.value })
                  }
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${pillClasses(color, active)}`}
                >
                  {s.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <AuditFilters
          filters={filters}
          onSearch={debouncedSearch}
          onFilterChange={updateFilters}
          onReset={resetFilters}
          total={safeMeta.total}
        />

        {/* Pagination above table */}
        <AuditPagination meta={safeMeta} onPageChange={setPage} />

        {/* Table */}
        <AuditTable logs={logs} onFlag={setFlagTarget} />
      </div>

      {/* Flag modal */}
      <FlagAuditModal
        isOpen={!!flagTarget}
        onClose={() => setFlagTarget(null)}
        description={flaggedLog?.description ?? ""}
        onConfirm={handleFlagConfirm}
      />

      {/* Review modal */}
      <ReviewAuditModal
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        description={reviewedLog?.description ?? ""}
        flaggedReason={reviewedLog?.flagged_reason}
        onConfirm={handleReviewConfirm}
      />
    </div>
  );
}
