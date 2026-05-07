"use client";

import { motion } from "motion/react";
import {
  TicketCheck,
  Clock3,
  UserX,
  Timer,
  Star,
} from "lucide-react";
import type { SupportAnalytics as SupportAnalyticsType } from "@/types/admin/support";

interface SupportAnalyticsProps {
  analytics: SupportAnalyticsType;
}

// --- Helpers ---

function formatResponseTime(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return "<1m";
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.round((seconds % 86400) / 3600);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

function formatType(str: string): string {
  return str
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ");
}

// --- Status & Priority order + colors ---

const STATUS_ORDER = [
  "pending",
  "in_progress",
  "waiting_user",
  "escalated",
  "resolved",
  "closed",
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500",
  in_progress: "bg-blue-500",
  waiting_user: "bg-orange-500",
  resolved: "bg-emerald-500",
  closed: "bg-slate-400",
  escalated: "bg-red-500",
};

const PRIORITY_ORDER = ["urgent", "high", "medium", "low"] as const;

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-400",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

export function SupportAnalytics({ analytics }: SupportAnalyticsProps) {
  const { overview, performance } = analytics;

  const responseTime = performance.avg_response_time_seconds;
  const responseColor =
    responseTime === null
      ? "text-dashboard-muted"
      : responseTime < 3600
        ? "text-emerald-600"
        : responseTime <= 14400
          ? "text-amber-600"
          : "text-red-600";

  const rating = performance.avg_satisfaction_rating;
  const ratingColor =
    rating === null
      ? "text-dashboard-muted"
      : rating >= 4
        ? "text-emerald-600"
        : rating >= 3
          ? "text-amber-600"
          : "text-red-600";

  return (
    <div className="space-y-3">
      {/* Row 1: Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <OverviewCard
          title="Open Tickets"
          value={overview.open}
          icon={TicketCheck}
          iconBg="bg-brand-bg-primary"
          iconColor="text-dashboard-heading"
          subtitle={
            overview.escalated > 0 ? (
              <span className="text-red-600 font-medium">
                {overview.escalated} escalated
              </span>
            ) : (
              <span className="text-dashboard-muted">
                {overview.escalated} escalated
              </span>
            )
          }
          badge={overview.escalated > 0 ? overview.escalated : undefined}
          badgeColor="bg-red-500"
          index={0}
        />
        <OverviewCard
          title="Pending"
          value={overview.pending}
          icon={Clock3}
          iconBg="bg-dashboard-surface"
          iconColor="text-dashboard-muted"
          subtitle={
            overview.pending > 10 ? (
              <span className="text-orange-600 font-medium">needs attention</span>
            ) : (
              <span className="text-dashboard-muted">needs attention</span>
            )
          }
          index={1}
        />
        <OverviewCard
          title="Unassigned"
          value={overview.unassigned}
          icon={UserX}
          iconBg="bg-dashboard-surface"
          iconColor="text-dashboard-muted"
          subtitle={
            overview.unassigned > 5 ? (
              <span className="text-red-600 font-medium">needs assignment</span>
            ) : (
              <span className="text-dashboard-muted">needs assignment</span>
            )
          }
          badge={overview.unassigned > 0 ? overview.unassigned : undefined}
          badgeColor="bg-red-500"
          index={2}
        />
        <OverviewCard
          title="Avg Response"
          value={formatResponseTime(responseTime)}
          icon={Timer}
          iconBg="bg-dashboard-surface"
          iconColor="text-dashboard-muted"
          valueClassName={responseColor}
          index={3}
        />
        <OverviewCard
          title="Satisfaction"
          value={
            rating !== null ? `${rating.toFixed(1)}/5` : "—"
          }
          icon={Star}
          iconBg="bg-dashboard-surface"
          iconColor="text-dashboard-muted"
          subtitle={`${performance.total_rated} rated`}
          valueClassName={ratingColor}
          index={4}
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
        >
          <h3 className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-2">
            Status Breakdown
          </h3>
          <StatusStackedBar byStatus={analytics.by_status} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
          className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
        >
          <h3 className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-2">
            Priority Breakdown
          </h3>
          <PriorityStackedBar byPriority={analytics.by_priority} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
        >
          <h3 className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-2">
            Type Breakdown
          </h3>
          <TypeBars byType={analytics.by_type} />
        </motion.div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function OverviewCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  subtitle,
  badge,
  badgeColor,
  valueClassName = "text-dashboard-heading",
  index = 0,
}: {
  title: string;
  value: number | string;
  icon: typeof TicketCheck;
  iconBg: string;
  iconColor: string;
  subtitle?: React.ReactNode;
  badge?: number;
  badgeColor?: string;
  valueClassName?: string;
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
            <p className={`text-lg font-bold tabular-nums leading-tight ${valueClassName}`}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {badge !== undefined && badge > 0 && (
              <span
                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white ${badgeColor ?? "bg-red-500"}`}
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

function StatusStackedBar({ byStatus }: { byStatus: Record<string, number> }) {
  const order: string[] = [...STATUS_ORDER];
  const entries = order
    .filter((key) => (byStatus[key] ?? 0) > 0)
    .map((key) => ({
      key,
      label:
        key === "in_progress"
          ? "In Progress"
          : key === "waiting_user"
            ? "Waiting User"
            : key.charAt(0).toUpperCase() + key.slice(1),
      count: byStatus[key] ?? 0,
      color: STATUS_COLORS[key] ?? "bg-slate-400",
    }));

  const otherKeys = Object.keys(byStatus).filter((k) => !order.includes(k));
  for (const k of otherKeys) {
    const c = byStatus[k];
    if (c > 0) {
      entries.push({
        key: k,
        label: k.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()),
        count: c,
        color: STATUS_COLORS[k] ?? "bg-slate-400",
      });
    }
  }

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
              <div className={`h-2 w-2 rounded-sm flex-shrink-0 ${color}`} />
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

function PriorityStackedBar({
  byPriority,
}: {
  byPriority: Record<string, number>;
}) {
  const order: string[] = [...PRIORITY_ORDER];
  const entries = order
    .filter((key) => (byPriority[key] ?? 0) > 0)
    .map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      count: byPriority[key] ?? 0,
      color: PRIORITY_COLORS[key] ?? "bg-slate-400",
    }));

  const otherKeys = Object.keys(byPriority).filter((k) => !order.includes(k));
  for (const k of otherKeys) {
    const c = byPriority[k];
    if (c > 0) {
      entries.push({
        key: k,
        label: k.charAt(0).toUpperCase() + k.slice(1),
        count: c,
        color: PRIORITY_COLORS[k] ?? "bg-slate-400",
      });
    }
  }

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
              <div className={`h-2 w-2 rounded-sm flex-shrink-0 ${color}`} />
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

function TypeBars({ byType }: { byType: Record<string, number> }) {
  const entries = Object.entries(byType)
    .map(([key, count]) => ({ key, count, label: formatType(key) }))
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
            <span className="text-[10px] font-semibold text-dashboard-heading tabular-nums w-8 text-right">
              {count.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
