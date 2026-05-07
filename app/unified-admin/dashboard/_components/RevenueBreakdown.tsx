"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { TrendingUp } from "lucide-react";
import type { AdminDashboardRevenue } from "@/types/admin/dashboard";

function formatNGN(value: number): string {
  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const PERIODS: { key: "this_month" | "last_month" | "all_time"; label: string }[] = [
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "all_time", label: "All time" },
];

interface Props {
  revenue: AdminDashboardRevenue;
  index?: number;
}

const PERIOD_KEYS: ("this_month" | "last_month" | "all_time")[] = ["this_month", "last_month", "all_time"];

export function RevenueBreakdown({ revenue, index = 0 }: Props) {
  const availablePeriods = PERIOD_KEYS.filter((k) => revenue[k] != null);
  const defaultKey = availablePeriods[0] ?? "this_month";
  const [periodKey, setPeriodKey] = useState<"this_month" | "last_month" | "all_time">(defaultKey);

  const period = revenue[periodKey];
  const hasPeriods = availablePeriods.length > 0;

  if (!hasPeriods) {
    return null;
  }

  const currentPeriod = period ?? revenue[defaultKey];
  if (!currentPeriod) return null;

  const rows: { label: string; value: string; valueColor?: string }[] = [
    { label: "Markup", value: formatNGN(currentPeriod.markup), valueColor: "text-dashboard-heading" },
    {
      label: "VTpass commission",
      value: formatNGN(currentPeriod.vtpass_commission),
      valueColor: "text-dashboard-muted",
    },
    {
      label: "Total revenue",
      value: formatNGN(currentPeriod.total),
      valueColor: "text-emerald-600 font-semibold",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 * index }}
      className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-dashboard-border/50 bg-dashboard-bg/50">
        <TrendingUp className="h-4 w-4 text-dashboard-muted" />
        <h3 className="text-sm font-semibold text-dashboard-heading">Revenue breakdown</h3>
      </div>
      <div className="p-3 border-b border-dashboard-border/40">
        <div className="flex gap-1 p-0.5 rounded-lg bg-dashboard-bg/80">
          {PERIODS.filter((p) => revenue[p.key] != null).map((p) => {
            const isActive = periodKey === p.key;
            return (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriodKey(p.key)}
              className={`flex-1 min-w-0 py-1.5 px-2 rounded-md text-[11px] font-medium transition-colors ${
                isActive
                  ? "bg-dashboard-surface text-dashboard-heading shadow-sm border border-dashboard-border/50"
                  : "text-dashboard-muted hover:text-dashboard-heading"
              }`}
            >
              {p.label}
            </button>
          );
          })}
        </div>
      </div>
      <div className="divide-y divide-dashboard-border/40">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-4 py-2.5"
          >
            <span className="text-xs text-dashboard-muted">{row.label}</span>
            <span className={`text-sm font-semibold tabular-nums ${row.valueColor ?? "text-dashboard-heading"}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
