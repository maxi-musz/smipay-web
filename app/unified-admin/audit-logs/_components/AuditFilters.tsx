"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { AuditFilters as AuditFiltersType } from "@/types/admin/audit-logs";
import {
  AUDIT_CATEGORIES,
  AUDIT_SEVERITIES,
  AUDIT_ACTOR_TYPES,
} from "@/types/admin/audit-logs";

interface AuditFiltersProps {
  filters: AuditFiltersType;
  onSearch: (value: string) => void;
  onFilterChange: (patch: Partial<AuditFiltersType>) => void;
  onReset: () => void;
  total: number;
}

export function AuditFilters({
  filters,
  onSearch,
  onFilterChange,
  onReset,
  total,
}: AuditFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search);
  const [expanded, setExpanded] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  const activeCount = [
    filters.severity,
    filters.category,
    filters.actor_type,
    filters.ip_address,
    filters.is_flagged,
    filters.date_from,
    filters.date_to,
  ].filter(Boolean).length;

  const selectCls =
    "bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-xs text-dashboard-heading px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/30 w-full";
  const inputCls =
    "bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-xs text-dashboard-heading px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/30 w-full placeholder:text-dashboard-muted";

  return (
    <div className="space-y-2.5">
      {/* Search bar + toggle */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dashboard-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search actions, descriptions, actors..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-dashboard-bg border border-dashboard-border/60 text-dashboard-heading placeholder:text-dashboard-muted outline-none focus:ring-1 focus:ring-blue-500/30"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dashboard-muted hover:text-dashboard-heading transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
            expanded || activeCount > 0
              ? "bg-blue-50 border-blue-200/60 text-blue-700"
              : "bg-dashboard-surface border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold">
              {activeCount}
            </span>
          )}
        </button>

        {total > 0 && (
          <span className="text-[11px] text-dashboard-muted tabular-nums hidden sm:block">
            {total.toLocaleString()} results
          </span>
        )}
      </div>

      {/* Expanded filter panel */}
      {expanded && (
        <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Severity */}
            <div>
              <label className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider block mb-1">
                Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) =>
                  onFilterChange({ severity: e.target.value })
                }
                className={selectCls}
              >
                <option value="">All Severities</option>
                {AUDIT_SEVERITIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider block mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  onFilterChange({ category: e.target.value })
                }
                className={selectCls}
              >
                <option value="">All Categories</option>
                {AUDIT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Actor Type */}
            <div>
              <label className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider block mb-1">
                Actor Type
              </label>
              <select
                value={filters.actor_type}
                onChange={(e) =>
                  onFilterChange({ actor_type: e.target.value })
                }
                className={selectCls}
              >
                <option value="">All Actor Types</option>
                {AUDIT_ACTOR_TYPES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            {/* IP Address */}
            <div>
              <label className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider block mb-1">
                IP Address
              </label>
              <input
                type="text"
                placeholder="e.g. 105.112.45.67"
                value={filters.ip_address}
                onChange={(e) =>
                  onFilterChange({ ip_address: e.target.value })
                }
                className={inputCls}
              />
            </div>

            {/* Flagged */}
            <div>
              <label className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider block mb-1">
                Flagged
              </label>
              <select
                value={filters.is_flagged}
                onChange={(e) =>
                  onFilterChange({ is_flagged: e.target.value })
                }
                className={selectCls}
              >
                <option value="">All</option>
                <option value="true">Flagged Only</option>
                <option value="false">Not Flagged</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider block mb-1">
                Date From
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) =>
                  onFilterChange({ date_from: e.target.value })
                }
                className={inputCls}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider block mb-1">
                Date To
              </label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) =>
                  onFilterChange({ date_to: e.target.value })
                }
                className={inputCls}
              />
            </div>
          </div>

          {/* Reset */}
          {activeCount > 0 && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-3 w-3" />
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
