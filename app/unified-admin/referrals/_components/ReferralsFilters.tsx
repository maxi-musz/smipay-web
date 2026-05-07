"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { ReferralFilters } from "@/types/admin/referrals";

interface ReferralsFiltersProps {
  filters: ReferralFilters;
  onSearch: (value: string) => void;
  onFilterChange: (updates: Partial<ReferralFilters>) => void;
  onReset: () => void;
  total: number;
}

export function ReferralsFilters({
  filters,
  onSearch,
  onFilterChange,
  onReset,
  total,
}: ReferralsFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const hasActiveFilters = filters.date_from || filters.date_to;

  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60">
      {/* Search + toggle row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dashboard-muted" />
          <input
            type="text"
            placeholder="Search code, email, phone, tag..."
            defaultValue={filters.search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
          />
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
            expanded || hasActiveFilters
              ? "bg-brand-bg-primary text-white border-brand-bg-primary"
              : "border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-bg"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Dates
          {hasActiveFilters && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-white/20 text-[10px] font-bold">
              !
            </span>
          )}
        </button>
        <span className="text-[10px] text-dashboard-muted tabular-nums whitespace-nowrap">
          {total.toLocaleString()} referrals
        </span>
      </div>

      {/* Expanded date filters */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-dashboard-border/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-dashboard-muted mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => onFilterChange({ date_from: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-dashboard-muted mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => onFilterChange({ date_to: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onReset}
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  <X className="h-3 w-3" />
                  Clear date filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
