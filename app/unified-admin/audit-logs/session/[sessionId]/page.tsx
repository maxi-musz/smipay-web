"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Globe,
  Smartphone,
  Activity,
  AlertTriangle,
  DollarSign,
  Route,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { adminAuditLogsApi } from "@/services/admin/audit-logs-api";
import type {
  AuditSessionResponse,
  AuditSessionSummary,
  AuditSessionLogItem,
  AuditUserBrief,
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

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatNGN(value: number): string {
  return `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  SUCCESS: { bg: "bg-emerald-50", text: "text-emerald-700" },
  FAILURE: { bg: "bg-red-50", text: "text-red-700" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-700" },
  BLOCKED: { bg: "bg-slate-100", text: "text-slate-500" },
};

const severityDot: Record<string, { color: string; pulse?: boolean }> = {
  LOW: { color: "bg-slate-400" },
  MEDIUM: { color: "bg-blue-500" },
  HIGH: { color: "bg-orange-500" },
  CRITICAL: { color: "bg-red-500", pulse: true },
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

function getInitials(user: AuditUserBrief): string {
  return [user.first_name?.[0], user.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "?";
}

function getFullName(user: AuditUserBrief): string {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || "Unknown";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SessionTracePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [data, setData] = useState<AuditSessionResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminAuditLogsApi.sessionTrace(sessionId);
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session trace");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) fetchData();
  }, [sessionId, fetchData]);

  if (isLoading && !data) return <SessionSkeleton />;

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

  const { user, summary, logs } = data;

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
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Route className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-dashboard-heading tracking-tight">
                Session Trace
              </h1>
              <p className="text-xs text-dashboard-muted mt-0.5 font-mono">
                {sessionId}
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-6">
        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <UserCard user={user} />
        </motion.div>

        {/* Session Summary */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <SessionSummaryGrid summary={summary} />
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <h2 className="text-sm font-semibold text-dashboard-heading mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-dashboard-muted" />
            Timeline
            <span className="text-xs font-normal text-dashboard-muted">
              ({logs.length} action{logs.length !== 1 ? "s" : ""})
            </span>
          </h2>
          <Timeline logs={logs} />
        </motion.div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// User Card
// ---------------------------------------------------------------------------

function UserCard({ user }: { user: AuditUserBrief }) {
  const initials = getInitials(user);
  const fullName = getFullName(user);
  const avatarBg = getAvatarColor(initials.charAt(0) || "A");

  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 flex items-start gap-3.5">
      <div
        className={`h-11 w-11 rounded-full ${avatarBg} flex items-center justify-center flex-shrink-0`}
      >
        <span className="text-sm font-bold text-white">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-dashboard-heading truncate">
          {fullName}
        </p>
        {user.email && (
          <p className="text-xs text-dashboard-muted truncate mt-0.5">
            {user.email}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <Link
            href={`/unified-admin/audit-logs/user/${user.id}`}
            className="text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            View User Logs →
          </Link>
          <Link
            href={`/unified-admin/users/${user.id}`}
            className="text-[10px] font-medium text-purple-600 hover:text-purple-800 hover:underline transition-colors"
          >
            View Profile →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session Summary Grid
// ---------------------------------------------------------------------------

function SessionSummaryGrid({ summary }: { summary: AuditSessionSummary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <SummaryCard
        icon={<Clock className="h-4 w-4 text-blue-600" />}
        iconBg="bg-blue-50"
        label="Duration"
        value={formatDuration(summary.duration_seconds)}
      />
      <SummaryCard
        icon={<Activity className="h-4 w-4 text-indigo-600" />}
        iconBg="bg-indigo-50"
        label="Total Actions"
        value={summary.total_actions.toLocaleString()}
      />
      <SummaryCard
        icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
        iconBg="bg-red-50"
        label="Failures"
        value={summary.failure_count.toLocaleString()}
        valueClassName={summary.failure_count > 0 ? "text-red-600" : undefined}
      />
      <SummaryCard
        icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
        iconBg="bg-emerald-50"
        label="Financial Volume"
        value={summary.total_financial_amount > 0 ? formatNGN(summary.total_financial_amount) : "—"}
        small={summary.total_financial_amount > 0}
      />
      <SummaryCard
        icon={<Smartphone className="h-4 w-4 text-purple-600" />}
        iconBg="bg-purple-50"
        label="Device"
        value={[summary.device_model, summary.platform].filter(Boolean).join(" · ") || "—"}
        small
      />
      <SummaryCard
        icon={<Globe className="h-4 w-4 text-teal-600" />}
        iconBg="bg-teal-50"
        label="Location"
        value={summary.geo_location || "—"}
        small
        sub={
          summary.ip_address ? (
            <Link
              href={`/unified-admin/audit-logs/ip/${summary.ip_address}`}
              className="text-[10px] font-mono text-blue-600 hover:text-blue-800 hover:underline mt-0.5 inline-block"
            >
              {summary.ip_address}
            </Link>
          ) : undefined
        }
      />
      <SummaryCard
        icon={<Route className="h-4 w-4 text-orange-600" />}
        iconBg="bg-orange-50"
        label="Unique Endpoints"
        value={summary.unique_endpoints.toLocaleString()}
      />
      <SummaryCard
        icon={<Clock className="h-4 w-4 text-slate-600" />}
        iconBg="bg-slate-100"
        label="Time Range"
        value={`${formatTime(summary.started_at)} — ${formatTime(summary.ended_at)}`}
        small
      />
    </div>
  );
}

function SummaryCard({
  icon,
  iconBg,
  label,
  value,
  valueClassName,
  small,
  sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueClassName?: string;
  small?: boolean;
  sub?: React.ReactNode;
}) {
  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-dashboard-muted uppercase tracking-wider">
            {label}
          </p>
          <p
            className={`mt-1 font-semibold text-dashboard-heading truncate ${small ? "text-sm" : "text-lg"} ${valueClassName ?? ""}`}
          >
            {value}
          </p>
          {sub}
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

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

function Timeline({ logs }: { logs: AuditSessionLogItem[] }) {
  if (logs.length === 0) {
    return (
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-10 text-center">
        <p className="text-sm text-dashboard-muted">No actions in this session.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-4">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-dashboard-border" />

      <div className="space-y-3">
        {logs.map((log, idx) => {
          const dot = severityDot[log.severity] ?? severityDot.LOW;
          const status = statusStyles[log.status] ?? statusStyles.BLOCKED;
          const isFailure = log.status === "FAILURE";

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 1.2) }}
            >
              <Link
                href={`/unified-admin/audit-logs/${log.id}`}
                className={`block bg-dashboard-surface rounded-xl border p-3 ml-6 relative transition-colors hover:bg-dashboard-bg/50 ${
                  isFailure
                    ? "border-red-200 border-l-[3px] border-l-red-400"
                    : "border-dashboard-border/60"
                }`}
              >
                {/* Connector dot */}
                <div
                  className={`absolute -left-[26.5px] top-4 h-2.5 w-2.5 rounded-full ring-2 ring-dashboard-surface ${dot.color} ${dot.pulse ? "animate-pulse" : ""}`}
                />

                {/* Connector horizontal line */}
                <div className="absolute -left-[14px] top-[21px] w-[14px] h-px bg-dashboard-border" />

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-dashboard-heading">
                        {formatAction(log.action)}
                      </span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${status.bg} ${status.text}`}
                      >
                        {formatAction(log.status)}
                      </span>
                    </div>
                    {log.description && (
                      <p className="text-[11px] text-dashboard-muted mt-1 line-clamp-2 leading-relaxed">
                        {log.description}
                      </p>
                    )}
                    {log.amount != null && (
                      <p className="text-xs font-semibold text-emerald-700 mt-1">
                        {formatNGN(log.amount)}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-dashboard-muted whitespace-nowrap flex-shrink-0">
                    {formatTime(log.created_at)}
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SessionSkeleton() {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="h-3 w-28 bg-dashboard-border/50 rounded animate-pulse mb-3" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-dashboard-border/50 animate-pulse" />
            <div>
              <div className="h-5 w-32 bg-dashboard-border/70 rounded animate-pulse" />
              <div className="h-3 w-48 mt-2 bg-dashboard-border/50 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-6">
        {/* User card skeleton */}
        <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 flex items-start gap-3.5">
          <div className="h-11 w-11 rounded-full bg-dashboard-border/50 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 bg-dashboard-border/70 rounded animate-pulse" />
            <div className="h-3 w-48 bg-dashboard-border/40 rounded animate-pulse" />
            <div className="h-3 w-28 bg-dashboard-border/40 rounded animate-pulse" />
          </div>
        </div>

        {/* Summary grid skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
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

        {/* Timeline skeleton */}
        <div>
          <div className="h-4 w-24 bg-dashboard-border/50 rounded animate-pulse mb-4" />
          <div className="relative pl-4">
            <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-dashboard-border/40" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="ml-6 relative">
                  <div className="absolute -left-[26.5px] top-4 h-2.5 w-2.5 rounded-full bg-dashboard-border/50 animate-pulse ring-2 ring-dashboard-surface" />
                  <div className="absolute -left-[14px] top-[21px] w-[14px] h-px bg-dashboard-border/40" />
                  <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-3.5 w-28 bg-dashboard-border/60 rounded animate-pulse" />
                        <div className="h-4 w-14 bg-dashboard-border/50 rounded animate-pulse" />
                      </div>
                      <div className="h-3 w-16 bg-dashboard-border/40 rounded animate-pulse" />
                    </div>
                    <div className="h-3 w-3/4 bg-dashboard-border/30 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
