"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import type { AuditLogItem } from "@/types/admin/audit-logs";

interface AuditTableProps {
  logs: AuditLogItem[];
  onFlag: (id: string) => void;
}

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

function formatNGN(value: number): string {
  return `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
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

const actorTypeBadge: Record<string, string> = {
  USER: "bg-blue-50 text-blue-700",
  ADMIN: "bg-purple-50 text-purple-700",
  SYSTEM: "bg-slate-100 text-slate-600",
  WEBHOOK: "bg-amber-50 text-amber-700",
  CRON: "bg-cyan-50 text-cyan-700",
};

const categoryColors: Record<string, string> = {
  AUTHENTICATION: "bg-indigo-50 text-indigo-700",
  REGISTRATION: "bg-teal-50 text-teal-700",
  USER_MANAGEMENT: "bg-purple-50 text-purple-700",
  KYC_VERIFICATION: "bg-sky-50 text-sky-700",
  BANKING: "bg-emerald-50 text-emerald-700",
  TRANSFER: "bg-blue-50 text-blue-700",
  WALLET: "bg-orange-50 text-orange-700",
  AIRTIME: "bg-pink-50 text-pink-700",
  DATA: "bg-cyan-50 text-cyan-700",
  CABLE: "bg-violet-50 text-violet-700",
  EDUCATION: "bg-yellow-50 text-yellow-700",
  ELECTRICITY: "bg-lime-50 text-lime-700",
  ADMIN: "bg-red-50 text-red-700",
  SYSTEM: "bg-slate-100 text-slate-600",
  WEBHOOK: "bg-amber-50 text-amber-700",
};

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export function AuditTable({ logs, onFlag }: AuditTableProps) {
  const router = useRouter();

  if (logs.length === 0) {
    return (
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-10 text-center">
        <p className="text-sm text-dashboard-muted">No audit logs found.</p>
      </div>
    );
  }

  const columns = [
    "Time",
    "Actor",
    "Action",
    "Category",
    "Status",
    "Severity",
    "Description",
    "Amount",
    "IP / Location",
    "",
  ];

  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-dashboard-border/50 bg-dashboard-bg/50">
              {columns.map((col) => (
                <th key={col || "flag"} className="text-left px-4 py-3">
                  <span className="text-xs font-semibold text-dashboard-muted">
                    {col}
                  </span>
                </th>
              ))}
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
              const actorBadge =
                actorTypeBadge[log.actor_type] ??
                "bg-slate-100 text-slate-600";
              const catColor =
                categoryColors[log.category] ??
                "bg-slate-100 text-slate-600";

              const actorName = log.user
                ? [log.user.first_name, log.user.last_name]
                    .filter(Boolean)
                    .join(" ") || log.actor_name || log.actor_type
                : log.actor_name || log.actor_type;

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

                  {/* Actor */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-dashboard-heading whitespace-nowrap truncate max-w-[120px]">
                        {actorName}
                      </span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold flex-shrink-0 ${actorBadge}`}
                      >
                        {log.actor_type}
                      </span>
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
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${catColor}`}
                    >
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
                  <td className="px-4 py-3 max-w-[200px]">
                    {log.description ? (
                      <p className="text-xs text-dashboard-muted truncate">
                        {truncate(log.description, 40)}
                      </p>
                    ) : (
                      <span className="text-xs text-dashboard-muted">—</span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.amount != null ? (
                      <span className="text-xs font-medium text-dashboard-heading tabular-nums">
                        {formatNGN(log.amount)}
                      </span>
                    ) : (
                      <span className="text-xs text-dashboard-muted">—</span>
                    )}
                  </td>

                  {/* IP / Location */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.ip_address ? (
                      <div className="flex flex-col">
                        <Link
                          href={`/unified-admin/audit-logs/ip/${encodeURIComponent(log.ip_address)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-mono text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {log.ip_address}
                        </Link>
                        {log.geo_location && (
                          <span className="text-[10px] text-dashboard-muted">
                            {log.geo_location}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-dashboard-muted">—</span>
                    )}
                  </td>

                  {/* Flagged */}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!log.is_flagged) onFlag(log.id);
                      }}
                      className={`transition-colors ${
                        log.is_flagged
                          ? "text-red-500"
                          : "text-dashboard-border hover:text-red-400"
                      }`}
                      title={log.is_flagged ? "Flagged" : "Flag this log"}
                    >
                      <Flag
                        className={`h-3.5 w-3.5 ${log.is_flagged ? "fill-red-500" : ""}`}
                      />
                    </button>
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
