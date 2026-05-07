"use client";

import { motion } from "motion/react";
import {
  UserPlus,
  CalendarDays,
  CalendarRange,
  Gift,
  DollarSign,
  Settings,
} from "lucide-react";
import type { ReferralAnalytics } from "@/types/admin/referrals";
import { REFERRAL_STATUSES } from "@/types/admin/referrals";

interface ReferralsAnalyticsProps {
  analytics: ReferralAnalytics;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount.toLocaleString()}`;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500",
  eligible: "bg-blue-500",
  rewarded: "bg-emerald-500",
  partially_rewarded: "bg-orange-500",
  expired: "bg-slate-400",
  rejected: "bg-red-500",
};

const STATUS_ORDER: string[] = REFERRAL_STATUSES.map((s) => s.value);

export function ReferralsAnalytics({ analytics }: ReferralsAnalyticsProps) {
  const { overview, config } = analytics;

  return (
    <div className="space-y-3">
      {/* Row 1: Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <OverviewCard
          title="Total Referrals"
          value={overview.total_referrals}
          icon={UserPlus}
          iconBg="bg-brand-bg-primary"
          iconColor="text-white"
          index={0}
        />
        <OverviewCard
          title="Today"
          value={overview.today}
          icon={CalendarDays}
          iconBg="bg-dashboard-surface"
          iconColor="text-dashboard-muted"
          index={1}
        />
        <OverviewCard
          title="This Month"
          value={overview.this_month}
          icon={CalendarRange}
          iconBg="bg-dashboard-surface"
          iconColor="text-dashboard-muted"
          index={2}
        />
        <OverviewCard
          title="Rewarded"
          value={overview.total_rewarded}
          icon={Gift}
          iconBg="bg-dashboard-surface"
          iconColor="text-emerald-500"
          index={3}
        />
        <OverviewCard
          title="Total Paid"
          value={formatCurrency(overview.total_paid_out)}
          icon={DollarSign}
          iconBg="bg-dashboard-surface"
          iconColor="text-dashboard-muted"
          index={4}
        />
      </div>

      {/* Row 2: Status breakdown + Config summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
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
          <h3 className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Settings className="h-3 w-3" />
            Config Summary
          </h3>
          <ConfigSummary config={config} />
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
  index = 0,
}: {
  title: string;
  value: number | string;
  icon: typeof UserPlus;
  iconBg: string;
  iconColor: string;
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
          <p className="text-lg font-bold tabular-nums leading-tight text-dashboard-heading mt-0.5">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
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
  const entries = STATUS_ORDER
    .filter((key) => (byStatus[key] ?? 0) > 0)
    .map((key) => {
      const meta = REFERRAL_STATUSES.find((s) => s.value === key);
      return {
        key,
        label: meta?.label ?? key.charAt(0).toUpperCase() + key.slice(1),
        count: byStatus[key] ?? 0,
        color: STATUS_COLORS[key] ?? "bg-slate-400",
      };
    });

  const otherKeys = Object.keys(byStatus).filter((k) => !STATUS_ORDER.includes(k));
  for (const k of otherKeys) {
    const c = byStatus[k] ?? 0;
    if (c > 0) {
      entries.push({
        key: k,
        label: k.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()),
        count: c,
        color: "bg-slate-400",
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

function ConfigSummary({ config }: { config: ReferralAnalytics["config"] }) {
  const triggerLabel = config.reward_trigger
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");

  const items = [
    {
      label: "Status",
      value: config.is_active ? "Active" : "Inactive",
      valueColor: config.is_active ? "text-emerald-600" : "text-red-600",
    },
    { label: "Referrer Reward", value: `₦${config.referrer_reward.toLocaleString()}` },
    { label: "Referee Reward", value: `₦${config.referee_reward.toLocaleString()}` },
    { label: "Trigger", value: triggerLabel },
    { label: "Max / User", value: config.max_per_user.toString() },
    { label: "Expiry", value: `${config.expiry_days} days` },
    { label: "Min Tx Amount", value: `₦${config.min_tx_amount.toLocaleString()}` },
  ];

  return (
    <div className="space-y-1.5">
      {items.map(({ label, value, valueColor }) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-[10px] text-dashboard-muted">{label}</span>
          <span className={`text-[10px] font-semibold tabular-nums ${valueColor ?? "text-dashboard-heading"}`}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
