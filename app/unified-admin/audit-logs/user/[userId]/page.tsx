"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Shield,
  Activity,
  AlertTriangle,
  Globe,
  Clock,
  Search,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { adminAuditLogsApi } from "@/services/admin/audit-logs-api";
import type {
  AuditUserLogsResponse,
  AuditDetailUser,
  AuditUserSummary,
  AuditLogItem,
  AuditListMeta,
  AuditActionCount,
} from "@/types/admin/audit-logs";
import {
  AUDIT_CATEGORIES,
  AUDIT_STATUSES,
  AUDIT_SEVERITIES,
} from "@/types/admin/audit-logs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAction(str: string): string {
  return str
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number, currency?: string | null): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency ?? "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  SUCCESS: { bg: "bg-emerald-50", text: "text-emerald-700" },
  FAILURE: { bg: "bg-red-50", text: "text-red-700" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-700" },
  BLOCKED: { bg: "bg-slate-100", text: "text-slate-500" },
};

const severityStyles: Record<
  string,
  { bg: string; text: string; dot: string; pulse?: boolean }
> = {
  LOW: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" },
  MEDIUM: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  HIGH: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  CRITICAL: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    pulse: true,
  },
};

const accountStatusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  suspended: "bg-red-50 text-red-700",
  deactivated: "bg-slate-100 text-slate-500",
  pending: "bg-amber-50 text-amber-700",
  frozen: "bg-sky-50 text-sky-700",
};

const avatarColors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-rose-500",
];

function getAvatarColor(letter: string): string {
  const idx = letter.toUpperCase().charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
}

// ---------------------------------------------------------------------------
// Filters state
// ---------------------------------------------------------------------------

interface Filters {
  page: number;
  limit: number;
  search: string;
  category: string;
  severity: string;
  status: string;
}

const defaultFilters: Filters = {
  page: 1,
  limit: 20,
  search: "",
  category: "",
  severity: "",
  status: "",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UserAuditLogsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [data, setData] = useState<AuditUserLogsResponse["data"] | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminAuditLogsApi.userLogs(userId, {
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        category: filters.category || undefined,
        severity: filters.severity || undefined,
        status: filters.status || undefined,
      });
      setData(res.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load user audit logs",
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId, filters]);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId, fetchData]);

  const updateFilter = (patch: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, page: 1, ...patch }));
  };

  const handleSearch = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      updateFilter({ search: value });
    }, 400);
  };

  // --- Loading ---
  if (isLoading && !data) return <UserAuditSkeleton />;

  // --- Error ---
  if (error && !data) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-red-600 mb-4 text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-dashboard-surface border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, user_summary, data: logs, meta } = data;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10"
      >
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <button
            onClick={() => router.push("/unified-admin/audit-logs")}
            className="flex items-center gap-1.5 text-xs text-dashboard-muted hover:text-dashboard-heading transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Audit Logs
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-dashboard-heading tracking-tight">
            User Audit Trail
          </h1>
        </div>
      </motion.header>

      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-6">
        {/* User Profile Card */}
        <UserProfileCard user={user} />

        {/* User Summary */}
        <UserSummarySection summary={user_summary} />

        {/* Filters */}
        <FilterBar
          filters={filters}
          onSearch={handleSearch}
          onFilterChange={updateFilter}
        />

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className={isLoading ? "opacity-60 pointer-events-none" : ""}
        >
          <UserLogTable logs={logs} />
        </motion.div>

        {/* Pagination */}
        {meta && meta.total_pages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="flex items-center justify-between"
          >
            <p className="text-xs text-dashboard-muted">
              Page {meta.page} of {meta.total_pages} &middot;{" "}
              {meta.total.toLocaleString()} total logs
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={meta.page <= 1}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-dashboard-surface border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                disabled={meta.page >= meta.total_pages}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-dashboard-surface border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// User Profile Card
// ---------------------------------------------------------------------------

function UserProfileCard({ user }: { user: AuditDetailUser }) {
  const firstName = user.first_name ?? "";
  const lastName = user.last_name ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
  const avatarBg = getAvatarColor(initials.charAt(0) || "A");
  const statusCls =
    accountStatusStyles[user.account_status?.toLowerCase()] ??
    "bg-slate-100 text-slate-600";
  const roleCls = "bg-indigo-50 text-indigo-700";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-5"
    >
      <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
        {/* Avatar */}
        {user.profile_image?.secure_url ? (
          <img
            src={user.profile_image.secure_url}
            alt={fullName}
            className="h-14 w-14 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            className={`h-14 w-14 rounded-full ${avatarBg} flex items-center justify-center flex-shrink-0`}
          >
            <span className="text-lg font-bold text-white">{initials}</span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-dashboard-heading">
              {fullName}
            </h2>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${roleCls}`}
            >
              {formatAction(user.role)}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${statusCls}`}
            >
              {formatAction(user.account_status)}
            </span>
          </div>

          <div className="mt-1.5 space-y-0.5">
            {user.email && (
              <p className="text-xs text-dashboard-muted">{user.email}</p>
            )}
            {user.phone_number && (
              <p className="text-xs text-dashboard-muted">
                {user.phone_number}
              </p>
            )}
            {user.smipay_tag && (
              <p className="text-xs text-blue-600 font-medium">
                @{user.smipay_tag}
              </p>
            )}
          </div>

          <Link
            href={`/unified-admin/users/${user.id}`}
            className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            <User className="h-3 w-3" />
            View User Profile →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// User Summary Section
// ---------------------------------------------------------------------------

function UserSummarySection({ summary }: { summary: AuditUserSummary }) {
  const failureRate =
    summary.total_actions > 0
      ? ((summary.failure_count / summary.total_actions) * 100).toFixed(1)
      : "0.0";
  const highFailures = summary.failure_count > 10;
  const maxActionCount = Math.max(
    ...summary.top_actions.map((a) => a.count),
    1,
  );
  const manyIPs = summary.ip_addresses.length > 3;

  const severityChips: { key: string; label: string; colorCls: string }[] = [
    { key: "LOW", label: "Low", colorCls: "bg-slate-100 text-slate-600" },
    { key: "MEDIUM", label: "Medium", colorCls: "bg-blue-50 text-blue-700" },
    { key: "HIGH", label: "High", colorCls: "bg-orange-50 text-orange-700" },
    { key: "CRITICAL", label: "Critical", colorCls: "bg-red-50 text-red-700" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {/* Total Actions */}
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium text-dashboard-muted uppercase tracking-wider">
              Total Actions
            </p>
            <p className="mt-1 text-lg font-semibold text-dashboard-heading">
              {summary.total_actions.toLocaleString()}
            </p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Activity className="h-4.5 w-4.5 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Failures */}
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium text-dashboard-muted uppercase tracking-wider">
              Failures
            </p>
            <p
              className={`mt-1 text-lg font-semibold ${highFailures ? "text-red-600" : "text-dashboard-heading"}`}
            >
              {summary.failure_count.toLocaleString()}
            </p>
            <p className="text-[10px] text-dashboard-muted mt-0.5">
              {failureRate}% failure rate
            </p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
          </div>
        </div>
      </div>

      {/* Top Actions - mini bar chart */}
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-3.5 col-span-2 lg:col-span-1">
        <p className="text-[11px] font-medium text-dashboard-muted uppercase tracking-wider mb-2">
          Top Actions
        </p>
        {summary.top_actions.length === 0 ? (
          <p className="text-xs text-dashboard-muted">No data</p>
        ) : (
          <div className="space-y-1.5">
            {summary.top_actions.slice(0, 5).map((action) => {
              const pct = Math.round(
                (action.count / maxActionCount) * 100,
              );
              return (
                <div key={action.action} className="flex items-center gap-2">
                  <span className="text-[10px] text-dashboard-heading font-medium w-24 truncate flex-shrink-0">
                    {formatAction(action.action)}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-dashboard-bg overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-dashboard-muted w-7 text-right flex-shrink-0">
                    {action.count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Severity + IPs combined */}
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-3.5 col-span-2 lg:col-span-1">
        {/* Severity Breakdown */}
        <p className="text-[11px] font-medium text-dashboard-muted uppercase tracking-wider mb-2">
          Severity
        </p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {severityChips.map((chip) => {
            const count = summary.by_severity[chip.key] ?? 0;
            if (count === 0) return null;
            return (
              <span
                key={chip.key}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${chip.colorCls}`}
              >
                {chip.label}
                <span className="font-bold">{count}</span>
              </span>
            );
          })}
          {Object.values(summary.by_severity).every((v) => !v) && (
            <span className="text-xs text-dashboard-muted">No data</span>
          )}
        </div>

        {/* IP Addresses */}
        <p className="text-[11px] font-medium text-dashboard-muted uppercase tracking-wider mb-1.5">
          IP Addresses
        </p>
        {manyIPs && (
          <p className="text-[10px] text-orange-600 font-medium mb-1">
            Multiple IPs detected ({summary.ip_addresses.length})
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {summary.ip_addresses.slice(0, 8).map((entry) => (
            <Link
              key={entry.ip_address}
              href={`/unified-admin/audit-logs/ip/${encodeURIComponent(entry.ip_address)}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-dashboard-bg text-[10px] font-mono text-dashboard-heading hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <Globe className="h-2.5 w-2.5" />
              {entry.ip_address}
              <span className="text-dashboard-muted">({entry.count})</span>
            </Link>
          ))}
          {summary.ip_addresses.length === 0 && (
            <span className="text-xs text-dashboard-muted">None</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Filter Bar
// ---------------------------------------------------------------------------

function FilterBar({
  filters,
  onSearch,
  onFilterChange,
}: {
  filters: Filters;
  onSearch: (value: string) => void;
  onFilterChange: (patch: Partial<Filters>) => void;
}) {
  const [searchValue, setSearchValue] = useState(filters.search);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  const selectCls =
    "bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-sm text-dashboard-heading px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/30";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25 }}
      className="flex flex-wrap items-center gap-2.5"
    >
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dashboard-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search actions, descriptions..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-dashboard-bg border border-dashboard-border/60 text-dashboard-heading placeholder:text-dashboard-muted outline-none focus:ring-1 focus:ring-blue-500/30"
        />
        {searchValue && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dashboard-muted hover:text-dashboard-heading transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Category */}
      <select
        value={filters.category}
        onChange={(e) => onFilterChange({ category: e.target.value })}
        className={selectCls}
      >
        <option value="">All Categories</option>
        {AUDIT_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      {/* Severity */}
      <select
        value={filters.severity}
        onChange={(e) => onFilterChange({ severity: e.target.value })}
        className={selectCls}
      >
        <option value="">All Severities</option>
        {AUDIT_SEVERITIES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Status */}
      <select
        value={filters.status}
        onChange={(e) => onFilterChange({ status: e.target.value })}
        className={selectCls}
      >
        <option value="">All Statuses</option>
        {AUDIT_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// User Log Table
// ---------------------------------------------------------------------------

function UserLogTable({ logs }: { logs: AuditLogItem[] }) {
  const router = useRouter();

  if (logs.length === 0) {
    return (
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-10 text-center">
        <p className="text-sm text-dashboard-muted">
          No audit logs found for this user.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dashboard-border/50 bg-dashboard-bg/50">
              {["Time", "Action", "Category", "Status", "Severity", "Description", "Amount", "IP"].map(
                (col) => (
                  <th key={col} className="text-left px-4 py-3">
                    <span className="text-xs font-semibold text-dashboard-muted">
                      {col}
                    </span>
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-dashboard-border/40">
            {logs.map((log) => {
              const status =
                statusStyles[log.status] ?? {
                  bg: "bg-slate-100",
                  text: "text-slate-500",
                };
              const severity =
                severityStyles[log.severity] ?? severityStyles.LOW;

              return (
                <tr
                  key={log.id}
                  onClick={() =>
                    router.push(`/unified-admin/audit-logs/${log.id}`)
                  }
                  className="hover:bg-dashboard-bg/50 transition-colors cursor-pointer"
                >
                  {/* Time */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="group/tip relative">
                      <p className="text-xs text-dashboard-muted">
                        {relativeTime(log.created_at)}
                      </p>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tip:block z-50 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-[11px] shadow-xl whitespace-nowrap pointer-events-none">
                        {formatDateTime(log.created_at)}
                      </div>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-dashboard-heading whitespace-nowrap">
                      {formatAction(log.action)}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-dashboard-muted whitespace-nowrap">
                      {formatAction(log.category)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.bg} ${status.text}`}
                    >
                      {formatAction(log.status)}
                    </span>
                  </td>

                  {/* Severity */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${severity.bg} ${severity.text}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${severity.dot} ${severity.pulse ? "animate-pulse" : ""}`}
                      />
                      {formatAction(log.severity)}
                    </span>
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3 max-w-[220px]">
                    {log.description ? (
                      <p className="text-xs text-dashboard-muted truncate">
                        {log.description}
                      </p>
                    ) : (
                      <span className="text-xs text-dashboard-muted">—</span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.amount != null ? (
                      <span className="text-xs font-medium text-dashboard-heading tabular-nums">
                        {formatCurrency(log.amount, log.currency)}
                      </span>
                    ) : (
                      <span className="text-xs text-dashboard-muted">—</span>
                    )}
                  </td>

                  {/* IP */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.ip_address ? (
                      <span className="text-[11px] font-mono text-dashboard-muted">
                        {log.ip_address}
                      </span>
                    ) : (
                      <span className="text-xs text-dashboard-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function UserAuditSkeleton() {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="h-3 w-28 bg-dashboard-border/50 rounded animate-pulse mb-3" />
          <div className="h-5 w-40 bg-dashboard-border/70 rounded animate-pulse" />
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-6">
        {/* Profile card */}
        <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-5 flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-dashboard-border/50 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 bg-dashboard-border/70 rounded animate-pulse" />
            <div className="h-3 w-52 bg-dashboard-border/40 rounded animate-pulse" />
            <div className="h-3 w-32 bg-dashboard-border/40 rounded animate-pulse" />
            <div className="h-3 w-24 bg-dashboard-border/40 rounded animate-pulse mt-3" />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 w-16 bg-dashboard-border/50 rounded animate-pulse" />
                  <div className="h-5 w-20 bg-dashboard-border/70 rounded animate-pulse" />
                </div>
                <div className="h-9 w-9 rounded-lg bg-dashboard-border/50 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2.5">
          <div className="flex-1 min-w-[200px] h-10 bg-dashboard-surface border border-dashboard-border/60 rounded-lg animate-pulse" />
          <div className="h-10 w-28 bg-dashboard-surface border border-dashboard-border/60 rounded-lg animate-pulse" />
          <div className="h-10 w-28 bg-dashboard-surface border border-dashboard-border/60 rounded-lg animate-pulse" />
          <div className="h-10 w-28 bg-dashboard-surface border border-dashboard-border/60 rounded-lg animate-pulse" />
        </div>

        {/* Table */}
        <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden">
          <div className="border-b border-dashboard-border/50 bg-dashboard-bg/50 px-4 py-3 flex gap-6">
            {[50, 80, 70, 50, 50, 140, 60, 80].map((w, i) => (
              <div
                key={i}
                style={{ width: w }}
                className="h-3 bg-dashboard-border/50 rounded animate-pulse"
              />
            ))}
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 px-4 py-3 ${i > 0 ? "border-t border-dashboard-border/40" : ""}`}
            >
              <div className="h-3 w-14 bg-dashboard-border/40 rounded animate-pulse" />
              <div className="h-3 w-24 bg-dashboard-border/50 rounded animate-pulse" />
              <div className="h-3 w-20 bg-dashboard-border/40 rounded animate-pulse" />
              <div className="h-5 w-16 bg-dashboard-border/50 rounded-full animate-pulse" />
              <div className="h-5 w-14 bg-dashboard-border/50 rounded-full animate-pulse" />
              <div className="flex-1 h-3 bg-dashboard-border/30 rounded animate-pulse" />
              <div className="h-3 w-16 bg-dashboard-border/40 rounded animate-pulse" />
              <div className="h-3 w-20 bg-dashboard-border/40 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
