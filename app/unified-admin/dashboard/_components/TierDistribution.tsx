"use client";

import { motion } from "motion/react";
import { PieChart } from "lucide-react";
import type { AdminDashboardTierDistribution } from "@/types/admin/dashboard";

const TIER_COLORS: Record<string, string> = {
  UNVERIFIED: "#94a3b8",
  VERIFIED: "#0ea5e9",
  PREMIUM: "#f59e0b",
};

function getTierColor(tier: string): string {
  return TIER_COLORS[tier.toUpperCase()] || "#8b5cf6";
}

interface TierDistributionProps {
  tiers: AdminDashboardTierDistribution;
}

export function TierDistribution({ tiers }: TierDistributionProps) {
  const entries = Object.entries(tiers);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-dashboard-border/50 bg-dashboard-bg/50">
        <PieChart className="h-4 w-4 text-dashboard-muted" />
        <h3 className="text-sm font-semibold text-dashboard-heading">
          User Tier Distribution
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Stacked bar */}
        <div className="h-4 rounded-full overflow-hidden flex bg-dashboard-bg">
          {entries.map(([tier, count]) => {
            const pct = (count / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={tier}
                className="h-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: getTierColor(tier),
                }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {entries.map(([tier, count]) => {
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
            return (
              <div key={tier} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: getTierColor(tier) }}
                  />
                  <span className="text-xs text-dashboard-muted capitalize">
                    {tier.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-dashboard-muted tabular-nums">
                    {pct}%
                  </span>
                  <span className="text-sm font-semibold text-dashboard-heading tabular-nums min-w-[3rem] text-right">
                    {count.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
