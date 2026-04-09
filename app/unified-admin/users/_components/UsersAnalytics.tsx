"use client";

import { motion } from "motion/react";
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Wallet,
} from "lucide-react";
import type { AdminUserAnalytics } from "@/types/admin/users";

function formatNGN(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

interface Props {
  analytics: AdminUserAnalytics;
}

export function UsersAnalytics({ analytics }: Props) {
  const { overview, growth } = analytics;
  const isPositive = growth.month_over_month_percent >= 0;

  const cards = [
    {
      label: "Total Users",
      value: overview.total_users.toLocaleString(),
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Active Users",
      value: overview.active_users.toLocaleString(),
      icon: UserCheck,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Suspended",
      value: overview.suspended_users.toLocaleString(),
      icon: UserX,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      label: "New Today",
      value: growth.new_today.toLocaleString(),
      sub: (
        <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(growth.month_over_month_percent)}% MoM
        </span>
      ),
      icon: UserPlus,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Wallet total",
      value: formatNGN(overview.total_main_wallet_balance ?? 0),
      sub: (
        <p
          className="text-[10px] text-violet-700/90 font-medium tabular-nums truncate"
          title={`Cashback for the same filtered list: ${formatNGN(overview.total_cashback_balance ?? 0)}`}
        >
          Cashback {formatNGN(overview.total_cashback_balance ?? 0)}
        </p>
      ),
      cardTitle:
        "Main wallet sum for users matching your current search and filters. Cashback line uses the same cohort.",
      icon: Wallet,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 items-stretch">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          title={"cardTitle" in card && card.cardTitle ? card.cardTitle : undefined}
          className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-4 flex flex-col min-h-[100px]"
        >
          <div className="flex items-center gap-3 mb-2 min-w-0">
            <div className={`h-8 w-8 rounded-lg shrink-0 ${card.iconBg} flex items-center justify-center`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
            <span className="text-[11px] font-medium text-dashboard-muted uppercase tracking-wide leading-tight min-w-0">
              {card.label}
            </span>
          </div>
          <p className="text-lg font-bold text-dashboard-heading tabular-nums leading-tight">{card.value}</p>
          {"sub" in card && card.sub && <div className="mt-1 min-w-0">{card.sub}</div>}
        </motion.div>
      ))}
    </div>
  );
}
