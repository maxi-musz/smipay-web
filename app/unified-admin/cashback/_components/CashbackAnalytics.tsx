"use client";

import { motion } from "motion/react";
import {
  Coins,
  TrendingUp,
  ArrowLeftRight,
  CalendarDays,
  Users,
} from "lucide-react";
import type {
  CashbackAnalyticsData,
  CashbackConfig,
} from "@/types/admin/cashback";
import { CASHBACK_SERVICE_TYPES } from "@/types/admin/cashback";

interface CashbackAnalyticsProps {
  analytics: CashbackAnalyticsData;
  config: CashbackConfig;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount.toLocaleString()}`;
}

const SERVICE_COLORS: Record<string, string> = {
  airtime: "bg-blue-500",
  data: "bg-purple-500",
  cable: "bg-pink-500",
  electricity: "bg-amber-500",
  education: "bg-emerald-500",
  betting: "bg-red-500",
  international_airtime: "bg-cyan-500",
};

export function CashbackAnalytics({ analytics, config }: CashbackAnalyticsProps) {
  const totalByService = analytics.by_service.reduce(
    (s, b) => s + b.total_amount,
    0,
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <StatCard
          title="Total Given"
          value={formatCurrency(analytics.total_cashback_given)}
          icon={Coins}
          iconBg="bg-brand-bg-primary"
          iconColor="text-white"
          index={0}
        />
        <StatCard
          title="Today"
          value={formatCurrency(analytics.today_cashback_given)}
          icon={CalendarDays}
          iconBg="bg-dashboard-surface"
          iconColor="text-dashboard-muted"
          index={1}
        />
        <StatCard
          title="Total Txns"
          value={analytics.total_transactions.toLocaleString()}
          icon={ArrowLeftRight}
          iconBg="bg-dashboard-surface"
          iconColor="text-dashboard-muted"
          index={2}
        />
        <StatCard
          title="Today Txns"
          value={analytics.today_transactions.toLocaleString()}
          icon={TrendingUp}
          iconBg="bg-dashboard-surface"
          iconColor="text-emerald-500"
          index={3}
        />
        <StatCard
          title="Unique Users"
          value={analytics.unique_users.toLocaleString()}
          icon={Users}
          iconBg="bg-dashboard-surface"
          iconColor="text-dashboard-muted"
          index={4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* Service breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
        >
          <h3 className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-2.5">
            Cashback by Service
          </h3>
          {analytics.by_service.length === 0 ? (
            <p className="text-xs text-dashboard-muted py-4 text-center">
              No cashback data yet
            </p>
          ) : (
            <div className="space-y-2">
              <div className="h-2.5 rounded-full overflow-hidden flex bg-dashboard-bg">
                {analytics.by_service.map((b) => {
                  const pct =
                    totalByService > 0
                      ? (b.total_amount / totalByService) * 100
                      : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={b.service_type}
                      className={`h-full ${SERVICE_COLORS[b.service_type] ?? "bg-slate-400"} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {analytics.by_service.map((b) => {
                  const meta = CASHBACK_SERVICE_TYPES.find(
                    (s) => s.value === b.service_type,
                  );
                  const pct =
                    totalByService > 0
                      ? ((b.total_amount / totalByService) * 100).toFixed(0)
                      : "0";
                  return (
                    <div
                      key={b.service_type}
                      className="flex items-center gap-1.5"
                    >
                      <div
                        className={`h-2 w-2 rounded-sm flex-shrink-0 ${SERVICE_COLORS[b.service_type] ?? "bg-slate-400"}`}
                      />
                      <span className="text-[10px] text-dashboard-muted flex-1 truncate">
                        {meta?.label ?? b.service_type}
                      </span>
                      <span className="text-[10px] font-semibold text-dashboard-heading tabular-nums">
                        {formatCurrency(b.total_amount)}
                      </span>
                      <span className="text-[10px] text-dashboard-muted tabular-nums">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Config quick summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
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
                label: "Default %",
                value: `${config.default_percentage}%`,
              },
              {
                label: "Max / Transaction",
                value: formatCurrency(config.max_cashback_per_transaction),
              },
              {
                label: "Max / Day",
                value: formatCurrency(config.max_cashback_per_day),
              },
              {
                label: "Min Tx Amount",
                value: formatCurrency(config.min_transaction_amount),
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
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  index = 0,
}: {
  title: string;
  value: string;
  icon: typeof Coins;
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
