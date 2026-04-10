"use client";

import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  BarChart3,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { TransactionAnalytics } from "@/types/admin/transactions";
import { useAuth } from "@/hooks/useAuth";
import { isDevAdminEmail } from "@/lib/dev-admin";
import { DevOnlyBadge } from "@/components/DevOnlyBadge";

function formatNGN(value: number): string {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(1)}K`;
  return `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function formatCount(n: number): string {
  return n.toLocaleString();
}

interface Props {
  analytics: TransactionAnalytics;
  walletIntegrityFilter: "" | "ok" | "fail";
  onWalletIntegrityFilterChange: (value: "" | "ok" | "fail") => void;
}

export function TransactionsAnalytics({
  analytics,
  walletIntegrityFilter,
  onWalletIntegrityFilterChange,
}: Props) {
  const { user: authUser } = useAuth();
  const showRowWalletDevCard = isDevAdminEmail(authUser?.email);
  const { overview, activity } = analytics;
  const growth = activity.volume_growth_percent;
  const isPositive = growth >= 0;

  const rollupsHeader = (
    <p className="text-[9px] font-semibold text-dashboard-muted uppercase tracking-wide flex items-center gap-1">
      Wallet rollups
      <DevOnlyBadge />
    </p>
  );

  const rowWalletSub =
    showRowWalletDevCard && analytics.row_wallet_rollups ? (
      <div className="mt-1 min-w-0 space-y-1.5">
        {rollupsHeader}
        <p className="text-[9px] text-dashboard-muted leading-snug -mt-0.5">
          Per-row main balance vs amount (same as the Balance column check).
        </p>
        <button
          type="button"
          onClick={() =>
            onWalletIntegrityFilterChange(walletIntegrityFilter === "ok" ? "" : "ok")
          }
          title="Rows where main balance movement matches amount and cashback used (same as green check in the table)."
          className={`w-full text-left text-[10px] font-medium tabular-nums rounded-md px-1.5 py-1 -mx-1.5 transition-colors flex items-center gap-1.5 ${
            walletIntegrityFilter === "ok"
              ? "bg-emerald-100/80 text-emerald-900"
              : "text-emerald-800/90 hover:bg-emerald-50/80"
          }`}
        >
          <CheckCircle2 className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
          Wallet checks out — {analytics.row_wallet_rollups.checks_out.toLocaleString()}
        </button>
        <button
          type="button"
          onClick={() =>
            onWalletIntegrityFilterChange(walletIntegrityFilter === "fail" ? "" : "fail")
          }
          title="Rows with a mismatch or not enough fields to verify (warn / N/A in the table)."
          className={`w-full text-left text-[10px] font-medium tabular-nums rounded-md px-1.5 py-1 -mx-1.5 transition-colors flex items-center gap-1.5 ${
            walletIntegrityFilter === "fail"
              ? "bg-amber-100/90 text-amber-950"
              : "text-amber-900/85 hover:bg-amber-50/80"
          }`}
        >
          <AlertTriangle className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
          Doesn&apos;t check out — {analytics.row_wallet_rollups.doesnt_check.toLocaleString()}
        </button>
      </div>
    ) : showRowWalletDevCard && analytics.row_wallet_rollups_capped ? (
      <div className="mt-1 space-y-1">
        {rollupsHeader}
        <p className="text-[10px] text-dashboard-muted leading-snug">
          Counts need a smaller cohort (server limit 20k transactions). Narrow filters or date range.
        </p>
      </div>
    ) : showRowWalletDevCard ? (
      <div className="mt-1 space-y-1">
        {rollupsHeader}
        <p className="text-[10px] text-amber-900/90 leading-snug">
          The API did not return rollup counts. Add your admin email to{" "}
          <span className="font-mono text-[9px]">DEV_EMAILS</span> in the{" "}
          <span className="font-mono text-[9px]">backend .env</span> (same list as the web app), restart the
          API, then refresh.
        </p>
      </div>
    ) : null;

  const cards = [
    {
      label: "Total Volume",
      value: formatNGN(overview.total_volume),
      sub: `${formatCount(overview.total_transactions)} txns`,
      icon: DollarSign,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Today's Volume",
      value: formatNGN(activity.today_volume),
      sub: `${formatCount(activity.today_count)} txns`,
      icon: Zap,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Revenue",
      value: formatNGN(overview.total_revenue_including_commission ?? overview.total_revenue),
      sub:
        overview.vtpass_commission != null || overview.total_revenue_including_commission != null ? (
          <span className="block mt-0.5">
            <span className="text-dashboard-muted">markup </span>
            <span className="font-medium text-dashboard-heading">{formatNGN(overview.total_revenue)}</span>
            {overview.vtpass_commission != null && (
              <>
                <span className="text-dashboard-muted"> · commission </span>
                <span className="font-medium text-dashboard-heading">{formatNGN(overview.vtpass_commission)}</span>
              </>
            )}
          </span>
        ) : (
          "from markups"
        ),
      icon: BarChart3,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Avg Transaction",
      value: formatNGN(overview.avg_amount),
      sub: (
        <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(growth)}% MoM
        </span>
      ),
      icon: Activity,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    ...(showRowWalletDevCard
      ? [
          {
            label: "Wallet rollups",
            value: analytics.row_wallet_rollups
              ? formatCount(
                  analytics.row_wallet_rollups.checks_out + analytics.row_wallet_rollups.doesnt_check,
                )
              : "—",
            sub: rowWalletSub,
            cardTitle:
              "Dev-only: rollup of row-level wallet checks for the current filters (same logic as the Balance column). Click the lines below to filter the table when counts are loaded.",
            icon: ShieldCheck,
            iconBg: "bg-violet-50",
            iconColor: "text-violet-700",
          },
        ]
      : []),
  ];

  const gridCols = showRowWalletDevCard
    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={`grid ${gridCols} gap-3 items-start`}>
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          title={"cardTitle" in card && card.cardTitle ? card.cardTitle : undefined}
          className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-4 w-full h-fit"
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
          <div className="text-xs text-dashboard-muted mt-0.5 min-w-0">{card.sub}</div>
        </motion.div>
      ))}
    </div>
  );
}
