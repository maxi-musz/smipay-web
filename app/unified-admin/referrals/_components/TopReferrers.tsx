"use client";

import { motion } from "motion/react";
import { Trophy, Loader2 } from "lucide-react";
import type { TopReferrerEntry } from "@/types/admin/referrals";

interface TopReferrersProps {
  leaderboard: TopReferrerEntry[];
  loading: boolean;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount.toLocaleString()}`;
}

const RANK_COLORS: string[] = [
  "bg-amber-500 text-white",
  "bg-slate-400 text-white",
  "bg-orange-600 text-white",
];

export function TopReferrers({ leaderboard, loading }: TopReferrersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 }}
      className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
    >
      <h3 className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Trophy className="h-3 w-3 text-amber-500" />
        Top Referrers
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 text-dashboard-muted animate-spin" />
        </div>
      ) : leaderboard.length === 0 ? (
        <p className="text-[10px] text-dashboard-muted py-4 text-center">
          No referrer data
        </p>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, idx) => (
            <div
              key={entry.user.id}
              className="flex items-center gap-2"
            >
              {/* Rank */}
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold ${
                  idx < 3 ? RANK_COLORS[idx] : "bg-dashboard-bg text-dashboard-muted"
                }`}
              >
                {idx + 1}
              </div>

              {/* Avatar */}
              <div className="h-7 w-7 rounded-full bg-brand-bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {entry.user.profile_image?.secure_url ? (
                  <img
                    src={entry.user.profile_image.secure_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-brand-bg-primary">
                    {`${(entry.user.first_name ?? "")[0] ?? ""}${(entry.user.last_name ?? "")[0] ?? ""}`.toUpperCase() || "?"}
                  </span>
                )}
              </div>

              {/* Name + tag */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-dashboard-heading truncate">
                  {`${entry.user.first_name ?? ""} ${entry.user.last_name ?? ""}`.trim() || "Unknown"}
                </p>
                {entry.user.smipay_tag && (
                  <p className="text-[10px] text-dashboard-muted truncate">
                    @{entry.user.smipay_tag}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="text-right flex-shrink-0">
                <p className="text-[11px] font-bold text-dashboard-heading tabular-nums">
                  {entry.referral_count}
                </p>
                <p className="text-[10px] text-emerald-600 font-medium tabular-nums">
                  {formatCurrency(entry.total_earned)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
