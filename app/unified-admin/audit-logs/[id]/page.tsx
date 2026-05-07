"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  User,
  Shield,
  Globe,
  Smartphone,
  Server,
  Banknote,
  ArrowRight,
  Flag,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Hash,
  ExternalLink,
  MapPin,
  Monitor,
  Fingerprint,
  RefreshCw,
} from "lucide-react";
import { adminAuditLogsApi } from "@/services/admin/audit-logs-api";
import type {
  AuditLogDetail,
  AuditSessionContextItem,
} from "@/types/admin/audit-logs";
import { FlagAuditModal } from "../_components/FlagAuditModal";
import { ReviewAuditModal } from "../_components/ReviewAuditModal";

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
    hour: "numeric",
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

const severityStyles: Record<string, { bg: string; text: string; dot: string; pulse?: boolean }> = {
  LOW: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" },
  MEDIUM: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  HIGH: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  CRITICAL: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", pulse: true },
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

const accountStatusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  suspended: "bg-red-50 text-red-700",
  deactivated: "bg-slate-100 text-slate-600",
  pending: "bg-amber-50 text-amber-700",
};

function getInitials(first: string | null, last: string | null): string {
  return [first?.[0], last?.[0]].filter(Boolean).join("").toUpperCase() || "?";
}

// ---------------------------------------------------------------------------
// Card wrapper
// ---------------------------------------------------------------------------

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-dashboard-muted mb-3">
      {children}
    </h3>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="text-[11px] text-dashboard-muted shrink-0 w-28">{label}</span>
      <span className="text-xs text-dashboard-heading break-all">{children}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="h-4 w-32 bg-dashboard-border/50 rounded animate-pulse" />
          <div className="h-6 w-64 mt-2 bg-dashboard-border/70 rounded animate-pulse" />
        </div>
      </header>
      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-5 space-y-3">
              <div className="h-3 w-20 bg-dashboard-border/50 rounded animate-pulse" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-dashboard-border/50 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-40 bg-dashboard-border/60 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-dashboard-border/40 rounded animate-pulse" />
                </div>
              </div>
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-3 w-full bg-dashboard-border/30 rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-5 space-y-3">
              <div className="h-3 w-20 bg-dashboard-border/50 rounded animate-pulse" />
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-3 w-full bg-dashboard-border/30 rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AuditLogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [log, setLog] = useState<AuditLogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [metadataOpen, setMetadataOpen] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAuditLogsApi.getById(id);
      setLog(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading && !log) return <DetailSkeleton />;

  if (error && !log) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <div className="text-center max-w-sm space-y-3">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={fetchDetail}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-dashboard-heading bg-dashboard-surface border border-dashboard-border/60 rounded-lg hover:bg-dashboard-bg"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!log) return null;

  const status = statusStyles[log.status] || statusStyles.BLOCKED;
  const severity = severityStyles[log.severity] || severityStyles.LOW;
  const user = log.user;
  const hasFinancial = log.amount !== null && log.amount !== undefined;
  const hasChanges = log.old_values || log.new_values;
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10"
      >
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <button
            type="button"
            onClick={() => router.push("/unified-admin/audit-logs")}
            className="inline-flex items-center gap-1.5 text-xs text-dashboard-muted hover:text-dashboard-heading transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Audit Logs
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-semibold text-dashboard-heading tracking-tight">
              {formatAction(log.action)}
            </h1>

            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.bg} ${status.text}`}>
              {formatAction(log.status)}
            </span>

            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${severity.bg} ${severity.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${severity.dot} ${severity.pulse ? "animate-pulse" : ""}`} />
              {formatAction(log.severity)}
            </span>

            {log.is_flagged && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                Flagged
              </span>
            )}
          </div>

          <p className="text-[11px] text-dashboard-muted mt-1">
            {formatDateTime(log.created_at)} &middot; {relativeTime(log.created_at)}
          </p>
        </div>
      </motion.header>

      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-4">
        {/* ── Row 1: Who + What ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {/* Who */}
          <Card>
            <SectionLabel>Who</SectionLabel>
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {getInitials(user.first_name, user.last_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-dashboard-heading truncate">
                      {[user.first_name, user.last_name].filter(Boolean).join(" ") || "Unknown"}
                    </p>
                    {user.email && (
                      <p className="text-[11px] text-dashboard-muted truncate">{user.email}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-0.5">
                  {user.phone_number && (
                    <InfoRow label="Phone">{user.phone_number}</InfoRow>
                  )}
                  {user.smipay_tag && (
                    <InfoRow label="Smipay Tag">@{user.smipay_tag}</InfoRow>
                  )}
                  <InfoRow label="Role">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 capitalize">
                      {user.role}
                    </span>
                  </InfoRow>
                  <InfoRow label="Account Status">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold capitalize ${accountStatusStyles[user.account_status] || "bg-slate-100 text-slate-600"}`}>
                      {user.account_status}
                    </span>
                  </InfoRow>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${actorTypeBadge[log.actor_type] || "bg-slate-100 text-slate-600"}`}>
                    {log.actor_type}
                  </span>
                  <Link
                    href={`/unified-admin/audit-logs/user/${log.user_id}`}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    View User Logs <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                  <Server className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dashboard-heading">
                    {log.actor_name || "System"}
                  </p>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${actorTypeBadge[log.actor_type] || "bg-slate-100 text-slate-600"}`}>
                    {log.actor_type}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* What */}
          <Card>
            <SectionLabel>What</SectionLabel>
            <div className="space-y-0.5">
              <InfoRow label="Action">
                <span className="font-semibold">{formatAction(log.action)}</span>
              </InfoRow>
              <InfoRow label="Category">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${categoryColors[log.category] || "bg-slate-100 text-slate-600"}`}>
                  {formatAction(log.category)}
                </span>
              </InfoRow>
              <InfoRow label="Status">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.bg} ${status.text}`}>
                  {formatAction(log.status)}
                </span>
              </InfoRow>
              <InfoRow label="Severity">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${severity.bg} ${severity.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${severity.dot} ${severity.pulse ? "animate-pulse" : ""}`} />
                  {formatAction(log.severity)}
                </span>
              </InfoRow>
              {log.description && (
                <InfoRow label="Description">
                  <span className="leading-relaxed">{log.description}</span>
                </InfoRow>
              )}
              {log.resource_type && (
                <InfoRow label="Resource">
                  {log.resource_type}
                  {log.resource_id && (
                    <span className="ml-1 font-mono text-[10px] text-dashboard-muted">
                      {log.resource_id}
                    </span>
                  )}
                </InfoRow>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── Row 2: Where + How ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {/* Where */}
          <Card>
            <SectionLabel>Where</SectionLabel>
            <div className="space-y-0.5">
              <InfoRow label="IP Address">
                {log.ip_address ? (
                  <Link
                    href={`/unified-admin/audit-logs/ip/${log.ip_address}`}
                    className="font-mono text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {log.ip_address}
                  </Link>
                ) : (
                  <span className="text-dashboard-muted">—</span>
                )}
              </InfoRow>
              {log.geo_location && (
                <InfoRow label="Location">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-dashboard-muted" />
                    {log.geo_location}
                  </span>
                </InfoRow>
              )}
              {(log.latitude !== null && log.longitude !== null) && (
                <InfoRow label="Coordinates">
                  {log.latitude}, {log.longitude}
                </InfoRow>
              )}
              {log.device_model && (
                <InfoRow label="Device">
                  <span className="inline-flex items-center gap-1">
                    <Smartphone className="h-3 w-3 text-dashboard-muted" />
                    {log.device_model}
                  </span>
                </InfoRow>
              )}
              {log.platform && (
                <InfoRow label="Platform">
                  <span className="inline-flex items-center gap-1 capitalize">
                    <Monitor className="h-3 w-3 text-dashboard-muted" />
                    {log.platform}
                  </span>
                </InfoRow>
              )}
              <InfoRow label="Device ID">
                {log.device_id ? (
                  <Link
                    href={`/unified-admin/audit-logs/device/${log.device_id}`}
                    className="font-mono text-blue-600 hover:text-blue-800 hover:underline text-[10px]"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Fingerprint className="h-3 w-3" />
                      {log.device_id}
                    </span>
                  </Link>
                ) : (
                  <span className="text-dashboard-muted">—</span>
                )}
              </InfoRow>
            </div>
          </Card>

          {/* How */}
          <Card>
            <SectionLabel>How</SectionLabel>
            <div className="space-y-0.5">
              {(log.http_method || log.endpoint) && (
                <InfoRow label="Endpoint">
                  <span className="font-mono text-[10px]">
                    {log.http_method && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 mr-1.5">
                        {log.http_method}
                      </span>
                    )}
                    {log.endpoint || "—"}
                  </span>
                </InfoRow>
              )}
              {log.request_id && (
                <InfoRow label="Request ID">
                  <span className="font-mono text-[10px] inline-flex items-center gap-1">
                    <Hash className="h-3 w-3 text-dashboard-muted" />
                    {log.request_id}
                  </span>
                </InfoRow>
              )}
              {log.user_agent && (
                <InfoRow label="User Agent">
                  <span className="text-[10px] leading-relaxed">{log.user_agent}</span>
                </InfoRow>
              )}
              <InfoRow label="Session ID">
                {log.session_id ? (
                  <Link
                    href={`/unified-admin/audit-logs/session/${log.session_id}`}
                    className="font-mono text-[10px] text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    {log.session_id}
                  </Link>
                ) : (
                  <span className="text-dashboard-muted">—</span>
                )}
              </InfoRow>
            </div>
          </Card>
        </motion.div>

        {/* ── Financial ── */}
        {hasFinancial && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <Card>
              <SectionLabel>Financial</SectionLabel>
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-[10px] text-dashboard-muted mb-0.5">Amount</p>
                  <p className="text-lg font-bold tabular-nums text-dashboard-heading">
                    {formatNGN(log.amount!)}
                    {log.currency && log.currency !== "NGN" && (
                      <span className="ml-1.5 text-xs font-normal text-dashboard-muted">{log.currency}</span>
                    )}
                  </p>
                </div>

                {(log.balance_before !== null || log.balance_after !== null) && (
                  <div className="flex items-center gap-2">
                    {log.balance_before !== null && (
                      <div className="text-center">
                        <p className="text-[10px] text-dashboard-muted mb-0.5">Before</p>
                        <p className="text-xs font-semibold tabular-nums text-dashboard-heading">
                          {formatNGN(log.balance_before)}
                        </p>
                      </div>
                    )}
                    <ArrowRight className="h-4 w-4 text-dashboard-muted mt-3" />
                    {log.balance_after !== null && (
                      <div className="text-center">
                        <p className="text-[10px] text-dashboard-muted mb-0.5">After</p>
                        <p className="text-xs font-semibold tabular-nums text-dashboard-heading">
                          {formatNGN(log.balance_after)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {log.transaction_ref && (
                  <div>
                    <p className="text-[10px] text-dashboard-muted mb-0.5">Transaction Ref</p>
                    <Link
                      href={`/unified-admin/transactions/${log.transaction_ref}`}
                      className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                    >
                      {log.transaction_ref}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Changes (diff) ── */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <Card>
              <SectionLabel>Changes</SectionLabel>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="rounded-lg bg-red-50/60 border border-red-200/40 p-3">
                  <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider mb-2">Before</p>
                  <pre className="text-[11px] text-red-800 font-mono whitespace-pre-wrap break-all leading-relaxed max-h-60 overflow-y-auto">
                    {log.old_values ? JSON.stringify(log.old_values, null, 2) : "—"}
                  </pre>
                </div>
                <div className="rounded-lg bg-emerald-50/60 border border-emerald-200/40 p-3">
                  <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-2">After</p>
                  <pre className="text-[11px] text-emerald-800 font-mono whitespace-pre-wrap break-all leading-relaxed max-h-60 overflow-y-auto">
                    {log.new_values ? JSON.stringify(log.new_values, null, 2) : "—"}
                  </pre>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Metadata ── */}
        {hasMetadata && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 }}
          >
            <Card>
              <button
                type="button"
                onClick={() => setMetadataOpen((v) => !v)}
                className="flex items-center justify-between w-full"
              >
                <SectionLabel>Metadata</SectionLabel>
                {metadataOpen ? (
                  <ChevronUp className="h-4 w-4 text-dashboard-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-dashboard-muted" />
                )}
              </button>
              {metadataOpen && (
                <pre className="mt-2 text-[11px] text-dashboard-heading font-mono whitespace-pre-wrap break-all leading-relaxed bg-dashboard-bg/60 rounded-lg p-3 max-h-80 overflow-y-auto border border-dashboard-border/40">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              )}
            </Card>
          </motion.div>
        )}

        {/* ── Error ── */}
        {log.error_message && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 }}
          >
            <div className="bg-red-50 rounded-xl border border-red-200/60 p-4 sm:p-5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider mb-1">Error</p>
                  <p className="text-xs text-red-800 leading-relaxed">{log.error_message}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Compliance ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
        >
          <Card>
            <SectionLabel>Compliance</SectionLabel>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Flag className={`h-4 w-4 ${log.is_flagged ? "text-red-500 fill-red-500" : "text-dashboard-border"}`} />
                  <span className="text-xs text-dashboard-heading font-medium">
                    {log.is_flagged ? "Flagged" : "Not Flagged"}
                  </span>
                </div>

                {!log.is_flagged && (
                  <button
                    type="button"
                    onClick={() => setFlagModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200/60 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Flag className="h-3 w-3" />
                    Flag
                  </button>
                )}

                {log.is_flagged && (
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200/60 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Review
                  </button>
                )}
              </div>

              {log.flagged_reason && (
                <div className="p-3 rounded-lg bg-red-50/70 border border-red-200/40">
                  <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider mb-1">Flagged Reason</p>
                  <p className="text-xs text-red-800 leading-relaxed">{log.flagged_reason}</p>
                </div>
              )}

              {log.reviewed_by_admin && (
                <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/40">
                  <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">Reviewed By</p>
                  <p className="text-xs text-emerald-800 font-medium">
                    {[log.reviewed_by_admin.first_name, log.reviewed_by_admin.last_name].filter(Boolean).join(" ")}
                  </p>
                  {log.reviewed_by_admin.email && (
                    <p className="text-[11px] text-emerald-700 mt-0.5">{log.reviewed_by_admin.email}</p>
                  )}
                  {log.review_notes && (
                    <p className="text-xs text-emerald-800 mt-2 leading-relaxed">{log.review_notes}</p>
                  )}
                  {log.reviewed_at && (
                    <p className="text-[10px] text-emerald-600 mt-1.5">{formatDateTime(log.reviewed_at)}</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── Session Context ── */}
        {log.session_context && log.session_context.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.35 }}
          >
            <Card>
              <SectionLabel>What else happened in this session?</SectionLabel>
              <div className="relative pl-5 space-y-0">
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-dashboard-border/60" />

                {log.session_context.map((item: AuditSessionContextItem) => {
                  const isCurrent = item.id === log.id;
                  const itemSev = severityStyles[item.severity] || severityStyles.LOW;
                  const itemStatus = statusStyles[item.status] || statusStyles.BLOCKED;

                  return (
                    <Link
                      key={item.id}
                      href={`/unified-admin/audit-logs/${item.id}`}
                      className={`relative flex items-start gap-3 py-2.5 px-3 -ml-5 rounded-lg transition-colors ${
                        isCurrent
                          ? "bg-blue-50/70 border border-blue-200/40"
                          : "hover:bg-dashboard-bg/50"
                      }`}
                    >
                      <div className={`relative z-10 mt-1 h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-dashboard-surface ${itemSev.dot} ${itemSev.pulse ? "animate-pulse" : ""}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium ${isCurrent ? "text-blue-700" : "text-dashboard-heading"}`}>
                            {formatAction(item.action)}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${itemStatus.bg} ${itemStatus.text}`}>
                            {formatAction(item.status)}
                          </span>
                          {isCurrent && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-700">
                              Current
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-dashboard-muted mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                        <p className="text-[10px] text-dashboard-muted mt-0.5">
                          {formatDateTime(item.created_at)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* ── Modals ── */}
      <FlagAuditModal
        isOpen={flagModalOpen}
        onClose={() => setFlagModalOpen(false)}
        description={log.description || formatAction(log.action)}
        onConfirm={async (reason) => {
          await adminAuditLogsApi.flag(id, { reason });
          setFlagModalOpen(false);
          fetchDetail();
        }}
      />

      <ReviewAuditModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        description={log.description || formatAction(log.action)}
        flaggedReason={log.flagged_reason}
        onConfirm={async (notes, resolve) => {
          await adminAuditLogsApi.review(id, { review_notes: notes, resolve });
          setReviewModalOpen(false);
          fetchDetail();
        }}
      />
    </div>
  );
}
