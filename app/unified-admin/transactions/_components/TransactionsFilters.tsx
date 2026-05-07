"use client";

import { useState, useEffect } from "react";
import { Search, X, SlidersHorizontal, RotateCcw, Loader2 } from "lucide-react";
import {
  TRANSACTION_TYPES,
  CREDIT_DEBIT,
  PAYMENT_CHANNELS,
} from "@/types/admin/transactions";
import type { TransactionFilters } from "@/types/admin/transactions";

interface Props {
  filters: TransactionFilters;
  onSearch: (value: string) => void;
  onFilterChange: (patch: Partial<TransactionFilters>) => void;
  onReset: () => void;
  total: number;
  isLoading?: boolean;
  /** Disable filter controls while list is refetching (avoids overlapping requests). */
  filtersDisabled?: boolean;
}

export function TransactionsFilters({
  filters,
  onSearch,
  onFilterChange,
  onReset,
  total,
  isLoading,
  filtersDisabled = false,
}: Props) {
  const [searchValue, setSearchValue] = useState(filters.search);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  const hasActiveFilters =
    !!filters.user_id ||
    !!filters.transaction_type ||
    !!filters.credit_debit ||
    !!filters.payment_channel ||
    !!filters.min_amount ||
    !!filters.max_amount ||
    !!filters.date_from ||
    !!filters.date_to ||
    !!filters.wallet_integrity;

  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dashboard-muted" />
          <input
            type="text"
            value={searchValue}
            disabled={filtersDisabled}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search reference, description, mobile..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          {isLoading && (
            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-bg-primary animate-spin" />
          )}
          {!isLoading && searchValue && (
            <button
              type="button"
              onClick={() => handleSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-dashboard-muted hover:text-dashboard-heading" />
            </button>
          )}
        </div>

        <button
          type="button"
          disabled={filtersDisabled}
          onClick={() => setExpanded(!expanded)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            expanded || hasActiveFilters
              ? "border-brand-bg-primary/40 text-brand-bg-primary bg-brand-bg-primary/5"
              : "border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters{hasActiveFilters ? " (active)" : ""}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            disabled={filtersDisabled}
            onClick={() => { onReset(); setSearchValue(""); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </button>
        )}

        <span className="text-[11px] text-dashboard-muted ml-auto">
          {total.toLocaleString()} transactions
        </span>
      </div>

      {expanded && (
        <div className="border-t border-dashboard-border/40 p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          <select
            value={filters.transaction_type}
            disabled={filtersDisabled}
            onChange={(e) => onFilterChange({ transaction_type: e.target.value })}
            className="px-2.5 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">All Types</option>
            {TRANSACTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            value={filters.credit_debit}
            disabled={filtersDisabled}
            onChange={(e) => onFilterChange({ credit_debit: e.target.value })}
            className="px-2.5 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">All Directions</option>
            {CREDIT_DEBIT.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          <select
            value={filters.payment_channel}
            disabled={filtersDisabled}
            onChange={(e) => onFilterChange({ payment_channel: e.target.value })}
            className="px-2.5 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">All Channels</option>
            {PAYMENT_CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <input
            type="number"
            value={filters.min_amount}
            disabled={filtersDisabled}
            onChange={(e) => onFilterChange({ min_amount: e.target.value })}
            placeholder="Min amount"
            className="px-2.5 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
          />

          <input
            type="date"
            value={filters.date_from}
            disabled={filtersDisabled}
            onChange={(e) => onFilterChange({ date_from: e.target.value })}
            className="px-2.5 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
          />

          <input
            type="date"
            value={filters.date_to}
            disabled={filtersDisabled}
            onChange={(e) => onFilterChange({ date_to: e.target.value })}
            className="px-2.5 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      )}
    </div>
  );
}
