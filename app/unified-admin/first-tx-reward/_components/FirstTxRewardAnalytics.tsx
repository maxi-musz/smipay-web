"use client";

import { motion } from "motion/react";
import {
  Users,
  Coins,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  TrendingUp,
} from "lucide-react";
import type {
  FirstTxRewardAnalytics,
  FirstTxRewardConfig,
} from "@/types/admin/first-tx-reward";
import { FIRST_TX_TRANSACTION_TYPES } from "@/types/admin/first-tx-reward";

interface FirstTxRewardAnalyticsProps {
  analytics: FirstTxRewardAnalytics;
  config: FirstTxRewardConfig;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount.toLocaleString()}`;
}

const SERVICE_COLORS: Record<string, string> = {
  airtime: "bg-blue-500",
  data: "bg-purple-500",
  transfer: "bg-indigo-500",
  deposit: "bg-orange-500",
  cable: "bg-pink-500",
  electricity: "bg-amber-500",
  education: "bg-emerald-500",
  betting: "bg-red-500",
};

const SERVICE_BG: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
  indigo: "bg-indigo-50 text-indigo-700",
  orange: "bg-orange-50 text-orange-700",
  pink: "bg-pink-50 text-pink-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
};

export function FirstTxRewardAnalytics({
  analytics,
  config,
}: FirstTxRewardAnalyticsProps) {
  const overview = analytics.overview;
  const totalByType = analytics.by_trigger_type.reduce(
    (s, b) => s + b.total_amount,
    0,
  );

  const budgetUsed =
    config.budget_limit !== null && config.budget_limit > 0
      ? Math.min(100, (overview.total_given / config.budget_limit) * 100)
      : null;
  const recipientUsed =
    config.max_recipients !== null && config.max_recipients > 0
      ? Math.min(
          100,
          (overview.total_recipients / config.max_recipients) * 100,
        )
      : null;

  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard
          title="Total Recipients"
          value={overview.total_recipients.toLocaleString()}
          subtitle={
            config.max_recipients !== null
              ? `of ${config.max_recipients.toLocaleString()}`
              : undefined
          }
          icon={Users}
          iconBg="bg-brand-bg-primary"
          iconColor="text-white"
          index={0}
        />
        <StatCard
          title="Total Given"
          value={formatCurrency(overview.total_given)}
          icon={Coins}
          iconBg="bg-dashboard-surface"
          iconColor="text-dashboard-muted"
          index={1}
        />
        <StatCard
          title="Budget Remaining"
          value={
            overview.budget_remaining !== null
              ? formatCurrency(overview.budget_remaining)
              : "Unlimited"
          }
          icon={TrendingUp}
          iconBg="bg-dashboard-surface"
          iconColor="text-emerald-500"
          index={2}
        />
        <StatCard
          title="Slots Remaining"
          value={
            overview.recipient_slots_remaining !== null
              ? overview.recipient_slots_remaining.toLocaleString()
              : "Unlimited"
          }
          icon={Users}
          iconBg="bg-dashboard-surface"
          iconColor="text-dashboard-muted"
          index={3}
        />
      </div>

      {/* Period Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-3.5 w-3.5 text-dashboard-muted" />
            <span className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider">
              Today
            </span>
          </div>
          <p className="text-lg font-bold tabular-nums text-dashboard-heading">
            {analytics.today.recipients}
          </p>
          {analytics.today.amount_given !== undefined && (
            <p className="text-[10px] text-dashboard-muted tabular-nums">
              {formatCurrency(analytics.today.amount_given)} given
            </p>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <CalendarRange className="h-3.5 w-3.5 text-dashboard-muted" />
            <span className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider">
              This Week
            </span>
          </div>
          <p className="text-lg font-bold tabular-nums text-dashboard-heading">
            {analytics.this_week.recipients}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck className="h-3.5 w-3.5 text-dashboard-muted" />
            <span className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider">
              This Month
            </span>
          </div>
          <p className="text-lg font-bold tabular-nums text-dashboard-heading">
            {analytics.this_month.recipients}
          </p>
        </motion.div>
      </div>

      {/* Progress Bars (when limits are set) */}
      {(budgetUsed !== null || recipientUsed !== null) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3 space-y-3"
        >
          <h3 className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider">
            Campaign Progress
          </h3>
          {budgetUsed !== null && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-dashboard-muted">
                  Budget Used
                </span>
                <span className="text-[10px] font-semibold text-dashboard-heading tabular-nums">
                  {formatCurrency(overview.total_given)} /{" "}
                  {formatCurrency(config.budget_limit!)} ({budgetUsed.toFixed(1)}
                  %)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-dashboard-bg overflow-hidden">
                <div
                  className="h-full bg-brand-bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${budgetUsed}%` }}
                />
              </div>
            </div>
          )}
          {recipientUsed !== null && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-dashboard-muted">
                  Recipients Used
                </span>
                <span className="text-[10px] font-semibold text-dashboard-heading tabular-nums">
                  {overview.total_recipients.toLocaleString()} /{" "}
                  {config.max_recipients!.toLocaleString()} (
                  {recipientUsed.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-dashboard-bg overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${recipientUsed}%` }}
                />
              </div>
            </div>
          )}
          {config.start_date && config.end_date && (
            <p className="text-[10px] text-dashboard-muted">
              Campaign Window:{" "}
              {new Date(config.start_date).toLocaleDateString("en-NG", {
                month: "short",
                day: "numeric",
              })}{" "}
              –{" "}
              {new Date(config.end_date).toLocaleDateString("en-NG", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </motion.div>
      )}

      {/* Trigger Type Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
      >
        <h3 className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-2.5">
          What Triggered the First Transaction?
        </h3>
        {analytics.by_trigger_type.length === 0 ? (
          <p className="text-xs text-dashboard-muted py-4 text-center">
            No data yet
          </p>
        ) : (
          <div className="space-y-2">
            <div className="h-2.5 rounded-full overflow-hidden flex bg-dashboard-bg">
              {analytics.by_trigger_type.map((b) => {
                const pct =
                  totalByType > 0 ? (b.total_amount / totalByType) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={b.transaction_type}
                    className={`h-full ${SERVICE_COLORS[b.transaction_type] ?? "bg-slate-400"} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                );
              })}
            </div>
            <div className="space-y-1.5">
              {analytics.by_trigger_type.map((b) => {
                const meta = FIRST_TX_TRANSACTION_TYPES.find(
                  (t) => t.value === b.transaction_type,
                );
                const pct =
                  totalByType > 0
                    ? ((b.total_amount / totalByType) * 100).toFixed(0)
                    : "0";
                const totalRecipients = analytics.by_trigger_type.reduce(
                  (s, x) => s + x.count,
                  0,
                );
                const userPct =
                  totalRecipients > 0
                    ? ((b.count / totalRecipients) * 100).toFixed(0)
                    : "0";
                const barWidth =
                  totalRecipients > 0
                    ? (b.count / totalRecipients) * 100
                    : 0;
                const bg =
                  SERVICE_BG[meta?.color ?? ""] ?? "bg-slate-100 text-slate-600";

                return (
                  <div key={b.transaction_type} className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium min-w-[70px] justify-center ${bg}`}
                    >
                      {meta?.label ?? b.transaction_type}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-dashboard-bg overflow-hidden">
                      <div
                        className={`h-full rounded-full ${SERVICE_COLORS[b.transaction_type] ?? "bg-slate-400"} transition-all duration-500`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-dashboard-heading tabular-nums min-w-[60px] text-right">
                      {b.count} users
                    </span>
                    <span className="text-[10px] text-dashboard-muted tabular-nums min-w-[30px] text-right">
                      {userPct}%
                    </span>
                    <span className="text-[10px] font-semibold text-dashboard-heading tabular-nums min-w-[70px] text-right">
                      {formatCurrency(b.total_amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* Config Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
      >
        <h3 className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-2.5">
          Active Config
        </h3>
        <div className="space-y-1.5">
          {[
            {
              label: "Program Status",
              value: config.is_active ? "Active" : "Inactive",
              color: config.is_active ? "text-emerald-600" : "text-red-600",
            },
            {
              label: "Reward Amount",
              value: formatCurrency(config.reward_amount),
            },
            {
              label: "Min Tx Amount",
              value: formatCurrency(config.min_transaction_amount),
            },
            {
              label: "Require KYC",
              value: config.require_kyc ? "Yes" : "No",
            },
            {
              label: "Eligible Types",
              value: config.eligible_transaction_types.join(", "),
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[10px] text-dashboard-muted">{label}</span>
              <span
                className={`text-[10px] font-semibold tabular-nums ${color ?? "text-dashboard-heading"}`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  index = 0,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: typeof Users;
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
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] text-dashboard-muted">{subtitle}</p>
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
