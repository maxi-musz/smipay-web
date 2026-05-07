"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ScrollText,
  Activity,
  Flag,
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { AuditAnalytics as AuditAnalyticsType } from "@/types/admin/audit-logs";

interface AuditAnalyticsProps {
  analytics: AuditAnalyticsType;
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

function formatNGN(value: number): string {
  if (value >= 1_000_000)
    return `₦${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(1)}K`;
  return `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

function getInitials(first: string | null, last: string | null): string {
  return [first?.[0], last?.[0]].filter(Boolean).join("").toUpperCase() || "?";
}

const avatarColors = [
  "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
];

function getAvatarColor(letter: string): string {
  return avatarColors[letter.toUpperCase().charCodeAt(0) % avatarColors.length];
}

const accountStatusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  suspended: "bg-red-50 text-red-700",
  deactivated: "bg-slate-100 text-slate-600",
  pending: "bg-amber-50 text-amber-700",
  frozen: "bg-sky-50 text-sky-700",
};

const SEVERITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-red-500",
};

const SEVERITY_DOT: Record<string, { color: string; pulse?: boolean }> = {
  LOW: { color: "bg-slate-400" },
  MEDIUM: { color: "bg-blue-500" },
  HIGH: { color: "bg-orange-500" },
  CRITICAL: { color: "bg-red-500", pulse: true },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuditAnalytics({ analytics }: AuditAnalyticsProps) {
  const { overview, financial, fraud_indicators, recent_high_severity } =
    analytics;
  const [fraudOpen, setFraudOpen] = useState(true);
  const [highSevExpanded, setHighSevExpanded] = useState(false);
  const HIGH_SEV_PREVIEW = 5;

  return (
    <div className="space-y-3">
      {/* ── Row 1: Overview cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {/* Total Logs */}
        <OverviewCard
          title="Total Logs"
          value={overview.total_logs}
          icon={ScrollText}
          iconBg="bg-brand-bg-primary"
          iconColor="text-dashboard-heading"
          subtitle={
            <span className="text-dashboard-muted">
              {overview.blocked.toLocaleString()} blocked
            </span>
          }
          index={0}
        />

        {/* Activity */}
        <OverviewCard
          title="Activity"
          value={`${overview.today.toLocaleString()} / ${overview.yesterday.toLocaleString()}`}
          icon={Activity}
          iconBg="bg-dashboard-surface"
          iconColor="text-dashboard-muted"
          subtitle={
            <span
              className={
                overview.week_over_week_percent >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              }
            >
              {overview.week_over_week_percent >= 0 ? "+" : ""}
              {overview.week_over_week_percent}% WoW
            </span>
          }
          index={1}
        />

        {/* Flagged */}
        <OverviewCard
          title="Flagged"
          value={overview.flagged}
          icon={Flag}
          iconBg="bg-dashboard-surface"
          iconColor="text-dashboard-muted"
          badge={
            overview.unreviewed_flagged > 0
              ? overview.unreviewed_flagged
              : undefined
          }
          badgeColor="bg-red-500"
          badgePulse
          subtitle={
            <span className="text-dashboard-muted">
              {formatNGN(financial.flagged_transaction_volume)} flagged vol.
            </span>
          }
          index={2}
        />

        {/* Failures */}
        <OverviewCard
          title="Failures"
          value={overview.failures}
          icon={AlertTriangle}
          iconBg="bg-dashboard-surface"
          iconColor="text-dashboard-muted"
          subtitle={
            <span className="text-dashboard-muted">
              {overview.failures_today.toLocaleString()} today
            </span>
          }
          index={3}
        />

        {/* High Severity */}
        <OverviewCard
          title="High Severity"
          value={overview.high_severity}
          icon={ShieldAlert}
          iconBg="bg-dashboard-surface"
          iconColor="text-dashboard-muted"
          subtitle={
            <span className="text-dashboard-muted">
              {overview.high_severity_today.toLocaleString()} today
            </span>
          }
          index={4}
        />
      </div>

      {/* ── Row 2: Category + Severity + Fraud side-by-side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 items-start">
        {/* Category breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3 max-h-64 overflow-y-auto flex flex-col"
        >
          <h3 className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-2 shrink-0">
            Category Breakdown
          </h3>
          <CategoryBars byCategory={analytics.by_category} />
        </motion.div>

        {/* Severity breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
          className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3 max-h-64 overflow-y-auto flex flex-col"
        >
          <h3 className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-2 shrink-0">
            Severity Breakdown
          </h3>
          <SeverityStackedBar bySeverity={analytics.by_severity} />
        </motion.div>

        {/* Fraud Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3 max-h-64 overflow-hidden flex flex-col"
        >
          <button
            type="button"
            onClick={() => setFraudOpen((v) => !v)}
            className="flex items-center justify-between w-full shrink-0"
          >
            <h3 className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider">
              Fraud Indicators
            </h3>
            {fraudOpen ? (
              <ChevronUp className="h-4 w-4 text-dashboard-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-dashboard-muted" />
            )}
          </button>

          {fraudOpen && (
            <div className="mt-3 space-y-3 min-h-0 flex-1 overflow-y-auto max-h-48">
              {fraud_indicators.top_failed_actions.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-1.5">
                    Top Failed Actions
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {fraud_indicators.top_failed_actions.map((item) => (
                      <span
                        key={item.action}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-[10px] font-semibold text-red-700"
                      >
                        {formatAction(item.action)}
                        <span className="bg-red-200 text-red-800 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                          {item.failure_count.toLocaleString()}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {fraud_indicators.top_failed_users.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-1.5">
                    Suspicious Users
                  </p>
                  <div className="space-y-1.5">
                    {fraud_indicators.top_failed_users.map((entry) => {
                      const { user } = entry;
                      const initials = getInitials(
                        user.first_name,
                        user.last_name,
                      );
                      const fullName =
                        [user.first_name, user.last_name]
                          .filter(Boolean)
                          .join(" ") || "Unknown";
                      const avatarBg = getAvatarColor(initials[0] || "A");
                      const statusCls =
                        accountStatusStyles[
                          user.account_status?.toLowerCase()
                        ] ?? "bg-slate-100 text-slate-600";

                      return (
                        <Link
                          key={user.id}
                          href={`/unified-admin/audit-logs/user/${user.id}`}
                          className="flex items-center gap-2 rounded-lg p-1.5 -mx-1.5 hover:bg-dashboard-bg/50 transition-colors"
                        >
                          <div
                            className={`h-6 w-6 rounded-full ${avatarBg} flex items-center justify-center flex-shrink-0`}
                          >
                            <span className="text-[9px] font-bold text-white">
                              {initials}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-dashboard-heading truncate">
                              {fullName}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-red-600 font-semibold">
                                {entry.failure_count} failures
                              </span>
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${statusCls}`}
                              >
                                {formatAction(user.account_status)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {fraud_indicators.suspicious_ips.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-1.5">
                    Multi-Account IPs
                  </p>
                  <div className="space-y-1">
                    {fraud_indicators.suspicious_ips.map((ip) => (
                      <Link
                        key={ip.ip_address}
                        href={`/unified-admin/audit-logs/ip/${encodeURIComponent(ip.ip_address)}`}
                        className="flex items-center gap-2 rounded-lg p-1 -mx-1 hover:bg-dashboard-bg/50 transition-colors"
                      >
                        <span className="text-[10px] font-mono text-blue-600 hover:text-blue-800">
                          {ip.ip_address}
                        </span>
                        <span className="text-[10px] text-dashboard-muted">
                          {ip.distinct_users}u &middot; {ip.total_actions.toLocaleString()}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Row 4: Recent High-Severity (collapsed by default) ── */}
      {recent_high_severity.length > 0 && (() => {
        const visibleEvents = highSevExpanded
          ? recent_high_severity
          : recent_high_severity.slice(0, HIGH_SEV_PREVIEW);
        const hasMore = recent_high_severity.length > HIGH_SEV_PREVIEW;

        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 }}
            className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider">
                Recent High-Severity Events
              </h3>
              <span className="text-[10px] text-dashboard-muted tabular-nums">
                {recent_high_severity.length} events
              </span>
            </div>
            <div className={`space-y-1 ${highSevExpanded ? "max-h-60 overflow-y-auto" : ""}`}>
              {visibleEvents.map((event) => {
                const dot = SEVERITY_DOT[event.severity] ?? SEVERITY_DOT.HIGH;
                return (
                  <Link
                    key={event.id}
                    href={`/unified-admin/audit-logs/${event.id}`}
                    className="flex items-center gap-2.5 rounded-lg p-1.5 -mx-1.5 hover:bg-dashboard-bg/50 transition-colors"
                  >
                    <span
                      className={`h-2 w-2 rounded-full flex-shrink-0 ${dot.color} ${dot.pulse ? "animate-pulse" : ""}`}
                    />
                    <span className="text-xs font-medium text-dashboard-heading whitespace-nowrap">
                      {formatAction(event.action)}
                    </span>
                    {event.description && (
                      <span className="text-[11px] text-dashboard-muted truncate flex-1 min-w-0">
                        {event.description}
                      </span>
                    )}
                    <span className="text-[10px] text-dashboard-muted whitespace-nowrap flex-shrink-0">
                      {relativeTime(event.created_at)}
                    </span>
                  </Link>
                );
              })}
            </div>
            {hasMore && (
              <button
                type="button"
                onClick={() => setHighSevExpanded((v) => !v)}
                className="mt-2 text-[11px] font-medium text-brand-bg-primary hover:underline"
              >
                {highSevExpanded
                  ? "Show less"
                  : `Show all ${recent_high_severity.length} events`}
              </button>
            )}
          </motion.div>
        );
      })()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Card
// ---------------------------------------------------------------------------

function OverviewCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  subtitle,
  badge,
  badgeColor,
  badgePulse,
  index = 0,
}: {
  title: string;
  value: number | string;
  icon: typeof ScrollText;
  iconBg: string;
  iconColor: string;
  subtitle?: React.ReactNode;
  badge?: number;
  badgeColor?: string;
  badgePulse?: boolean;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 * index }}
      className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-dashboard-muted truncate">
            {title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-lg font-bold tabular-nums leading-tight text-dashboard-heading">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {badge !== undefined && badge > 0 && (
              <span
                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white ${badgeColor ?? "bg-red-500"} ${badgePulse ? "animate-pulse" : ""}`}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <div className="text-[10px] mt-0.5 font-medium">{subtitle}</div>
          )}
        </div>
        <div
          className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Category Bars (horizontal, sorted desc, top 8)
// ---------------------------------------------------------------------------

function CategoryBars({
  byCategory,
}: {
  byCategory: Record<string, number>;
}) {
  const entries = Object.entries(byCategory)
    .map(([key, count]) => ({ key, count, label: formatAction(key) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const max = entries.length > 0 ? entries[0].count : 1;

  return (
    <div className="space-y-1.5">
      {entries.map(({ key, label, count }) => {
        const pct = max > 0 ? (count / max) * 100 : 0;
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className="text-[10px] text-dashboard-muted w-24 truncate flex-shrink-0">
              {label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-dashboard-bg overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-dashboard-heading tabular-nums w-10 text-right">
              {count.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Severity Stacked Bar + Legend
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: string[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function SeverityStackedBar({
  bySeverity,
}: {
  bySeverity: Record<string, number>;
}) {
  const entries = SEVERITY_ORDER.filter(
    (key) => (bySeverity[key] ?? 0) > 0,
  ).map((key) => ({
    key,
    label: key.charAt(0) + key.slice(1).toLowerCase(),
    count: bySeverity[key] ?? 0,
    color: SEVERITY_COLORS[key] ?? "bg-slate-400",
  }));

  const total = entries.reduce((s, e) => s + e.count, 0);

  return (
    <div className="space-y-2">
      <div className="h-2.5 rounded-full overflow-hidden flex bg-dashboard-bg">
        {entries.map(({ key, count, color }) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              className={`h-full ${color} transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        {entries.map(({ key, label, count, color }) => {
          const pct = total > 0 ? ((count / total) * 100).toFixed(0) : "0";
          return (
            <div key={key} className="flex items-center gap-1.5">
              <div
                className={`h-2 w-2 rounded-sm flex-shrink-0 ${color}`}
              />
              <span className="text-[10px] text-dashboard-muted flex-1 truncate">
                {label}
              </span>
              <span className="text-[10px] font-semibold text-dashboard-heading tabular-nums">
                {count.toLocaleString()}
              </span>
              <span className="text-[10px] text-dashboard-muted tabular-nums">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
