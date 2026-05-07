"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Users,
  Activity,
  AlertTriangle,
  Clock,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";
import { adminAuditLogsApi } from "@/services/admin/audit-logs-api";
import type {
  AuditIPResponse,
  AuditAssociatedUser,
  AuditActionCount,
  AuditLogItem,
  AuditListMeta,
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
// Page
// ---------------------------------------------------------------------------

export default function IPInvestigationPage() {
  const params = useParams();
  const router = useRouter();
  const address = params.address as string;

  const [data, setData] = useState<AuditIPResponse["data"] | null>(null);
  const [meta, setMeta] = useState<AuditListMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 20;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminAuditLogsApi.ipInvestigation(address, page, limit);
      setData(res.data);
      setMeta(res.data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load IP data");
    } finally {
      setIsLoading(false);
    }
  }, [address, page]);

  useEffect(() => {
    if (address) fetchData();
  }, [address, fetchData]);

  // --- Loading ---
  if (isLoading && !data) {
    return <IPSkeleton />;
  }

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

  const { summary, associated_users, top_actions, logs, ip_address, geo_location } = data;
  const maxActionCount = Math.max(...top_actions.map((a) => a.count), 1);

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
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-dashboard-heading tracking-tight font-mono">
                {decodeURIComponent(ip_address)}
              </h1>
              {geo_location && (
                <p className="text-xs sm:text-sm text-dashboard-muted mt-0.5">
                  {geo_location}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-6">
        {/* Multi-account alert */}
        {summary.is_multi_account && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5"
          >
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                Multi-Account Alert
              </p>
              <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                This IP address is associated with{" "}
                <span className="font-bold">{summary.distinct_users}</span>{" "}
                different accounts. This may indicate fraudulent activity.
              </p>
            </div>
          </motion.div>
        )}

        {/* Summary cards */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <SummaryCard
            icon={<Activity className="h-4.5 w-4.5 text-blue-600" />}
            iconBg="bg-blue-50"
            label="Total Actions"
            value={summary.total_actions.toLocaleString()}
          />
          <SummaryCard
            icon={<Users className="h-4.5 w-4.5 text-purple-600" />}
            iconBg="bg-purple-50"
            label="Distinct Users"
            value={summary.distinct_users.toLocaleString()}
            valueClassName={summary.distinct_users > 1 ? "text-red-600" : undefined}
          />
          <SummaryCard
            icon={<Clock className="h-4.5 w-4.5 text-emerald-600" />}
            iconBg="bg-emerald-50"
            label="First Seen"
            value={formatDateTime(summary.first_seen)}
            small
          />
          <SummaryCard
            icon={<Shield className="h-4.5 w-4.5 text-amber-600" />}
            iconBg="bg-amber-50"
            label="Last Seen"
            value={formatDateTime(summary.last_seen)}
            small
          />
        </motion.div>

        {/* Associated Users */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <h2 className="text-sm font-semibold text-dashboard-heading mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-dashboard-muted" />
            Associated Users
            <span className="text-xs font-normal text-dashboard-muted">
              ({associated_users.length})
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {associated_users.map((entry) => (
              <UserCard key={entry.user.id} entry={entry} />
            ))}
          </div>
        </motion.div>

        {/* Top Actions */}
        {top_actions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 }}
            className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4"
          >
            <h2 className="text-sm font-semibold text-dashboard-heading mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-dashboard-muted" />
              Top Actions
            </h2>
            <div className="space-y-2.5">
              {top_actions.map((action) => {
                const pct = Math.round((action.count / maxActionCount) * 100);
                return (
                  <div key={action.action} className="flex items-center gap-3">
                    <span className="text-xs text-dashboard-heading font-medium w-40 truncate flex-shrink-0">
                      {formatAction(action.action)}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-dashboard-bg overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-dashboard-muted w-10 text-right flex-shrink-0">
                      {action.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Activity Log Table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
        >
          <h2 className="text-sm font-semibold text-dashboard-heading mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-dashboard-muted" />
            Activity Log
          </h2>
          <ActivityTable logs={logs} />
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-dashboard-surface border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= meta.total_pages}
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
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({
  icon,
  iconBg,
  label,
  value,
  valueClassName,
  small,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueClassName?: string;
  small?: boolean;
}) {
  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium text-dashboard-muted uppercase tracking-wider">
            {label}
          </p>
          <p
            className={`mt-1 font-semibold text-dashboard-heading ${small ? "text-sm" : "text-lg"} ${valueClassName ?? ""}`}
          >
            {value}
          </p>
        </div>
        <div
          className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function UserCard({ entry }: { entry: AuditAssociatedUser }) {
  const { user, action_count } = entry;
  const firstName = user.first_name ?? "";
  const lastName = user.last_name ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
  const avatarBg = getAvatarColor(initials.charAt(0) || "A");
  const statusCls =
    accountStatusStyles[user.account_status?.toLowerCase() ?? ""] ??
    "bg-slate-100 text-slate-600";

  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 flex items-start gap-3.5">
      <div
        className={`h-10 w-10 rounded-full ${avatarBg} flex items-center justify-center flex-shrink-0`}
      >
        <span className="text-sm font-semibold text-white">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-dashboard-heading truncate">
            {fullName}
          </p>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${statusCls}`}
          >
            {formatAction(user.account_status ?? "unknown")}
          </span>
        </div>
        {user.email && (
          <p className="text-xs text-dashboard-muted truncate mt-0.5">
            {user.email}
          </p>
        )}
        {user.phone_number && (
          <p className="text-xs text-dashboard-muted mt-0.5">
            {user.phone_number}
          </p>
        )}
        {user.smipay_tag && (
          <p className="text-xs text-blue-600 font-medium mt-0.5">
            @{user.smipay_tag}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <span className="text-[10px] font-semibold text-dashboard-muted bg-dashboard-bg px-2 py-1 rounded-md">
            {action_count} action{action_count !== 1 ? "s" : ""}
          </span>
          <Link
            href={`/unified-admin/audit-logs/user/${user.id}`}
            className="text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            Audit Trail →
          </Link>
          <Link
            href={`/unified-admin/users/${user.id}`}
            className="text-[10px] font-medium text-purple-600 hover:text-purple-800 hover:underline transition-colors"
          >
            User Profile →
          </Link>
        </div>
      </div>
    </div>
  );
}

function ActivityTable({ logs }: { logs: AuditLogItem[] }) {
  const router = useRouter();

  if (logs.length === 0) {
    return (
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-10 text-center">
        <p className="text-sm text-dashboard-muted">No activity logs found.</p>
      </div>
    );
  }

  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dashboard-border/50 bg-dashboard-bg/50">
              <th className="text-left px-4 py-3">
                <span className="text-xs font-semibold text-dashboard-muted">
                  Time
                </span>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-xs font-semibold text-dashboard-muted">
                  Action
                </span>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-xs font-semibold text-dashboard-muted">
                  Status
                </span>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-xs font-semibold text-dashboard-muted">
                  Severity
                </span>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-xs font-semibold text-dashboard-muted">
                  Description
                </span>
              </th>
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
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-dashboard-heading whitespace-nowrap">
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.bg} ${status.text}`}
                    >
                      {formatAction(log.status)}
                    </span>
                  </td>
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
                  <td className="px-4 py-3 max-w-[280px]">
                    {log.description ? (
                      <p className="text-xs text-dashboard-muted truncate">
                        {log.description}
                      </p>
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

function IPSkeleton() {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="h-3 w-28 bg-dashboard-border/50 rounded animate-pulse mb-3" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-dashboard-border/50 animate-pulse" />
            <div>
              <div className="h-5 w-40 bg-dashboard-border/70 rounded animate-pulse" />
              <div className="h-3 w-28 mt-2 bg-dashboard-border/50 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-6">
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

        {/* User cards */}
        <div>
          <div className="h-3.5 w-32 bg-dashboard-border/50 rounded animate-pulse mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 flex items-start gap-3.5"
              >
                <div className="h-10 w-10 rounded-full bg-dashboard-border/50 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 bg-dashboard-border/70 rounded animate-pulse" />
                  <div className="h-2.5 w-44 bg-dashboard-border/40 rounded animate-pulse" />
                  <div className="h-2.5 w-24 bg-dashboard-border/40 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top actions */}
        <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 space-y-3">
          <div className="h-3.5 w-24 bg-dashboard-border/50 rounded animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-2.5 w-32 bg-dashboard-border/40 rounded animate-pulse flex-shrink-0" />
              <div className="flex-1 h-2 bg-dashboard-border/30 rounded-full animate-pulse" />
              <div className="h-2.5 w-8 bg-dashboard-border/40 rounded animate-pulse flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* Table */}
        <div>
          <div className="h-3.5 w-24 bg-dashboard-border/50 rounded animate-pulse mb-3" />
          <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden">
            <div className="border-b border-dashboard-border/50 bg-dashboard-bg/50 px-4 py-3 flex gap-6">
              {[50, 80, 50, 50, 140].map((w, i) => (
                <div
                  key={i}
                  style={{ width: w }}
                  className="h-3 bg-dashboard-border/50 rounded animate-pulse"
                />
              ))}
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 px-4 py-3 ${i > 0 ? "border-t border-dashboard-border/40" : ""}`}
              >
                <div className="h-3 w-14 bg-dashboard-border/40 rounded animate-pulse" />
                <div className="h-3 w-24 bg-dashboard-border/50 rounded animate-pulse" />
                <div className="h-5 w-16 bg-dashboard-border/50 rounded-full animate-pulse" />
                <div className="h-5 w-14 bg-dashboard-border/50 rounded-full animate-pulse" />
                <div className="flex-1 h-3 bg-dashboard-border/30 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
