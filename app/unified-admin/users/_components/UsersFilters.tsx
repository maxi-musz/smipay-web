"use client";

import { useState, useEffect } from "react";
import { Search, X, SlidersHorizontal, RotateCcw } from "lucide-react";
import { USER_ROLES, ACCOUNT_STATUSES, KYC_STATUSES } from "@/types/admin/users";
import type { UserFilters } from "@/types/admin/users";

interface Props {
  filters: UserFilters;
  onSearch: (value: string) => void;
  onFilterChange: (patch: Partial<UserFilters>) => void;
  onReset: () => void;
  total: number;
}

export function UsersFilters({ filters, onSearch, onFilterChange, onReset, total }: Props) {
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
    filters.role ||
    filters.account_status ||
    filters.tier ||
    filters.kyc_status ||
    filters.date_from ||
    filters.date_to ||
    filters.min_wallet_balance?.trim() ||
    filters.max_wallet_balance?.trim() ||
    filters.min_cashback_balance?.trim() ||
    filters.max_cashback_balance?.trim();

  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dashboard-muted" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search name, email, phone, tag..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
          />
          {searchValue && (
            <button type="button" onClick={() => handleSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-dashboard-muted hover:text-dashboard-heading" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
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
            onClick={() => { onReset(); setSearchValue(""); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </button>
        )}

        <span className="text-[11px] text-dashboard-muted ml-auto">
          {total.toLocaleString()} users
        </span>
      </div>

      {expanded && (
        <div className="border-t border-dashboard-border/40 p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          <select
            value={filters.role}
            onChange={(e) => onFilterChange({ role: e.target.value })}
            className="px-2.5 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
          >
            <option value="">All Roles</option>
            {USER_ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <select
            value={filters.account_status}
            onChange={(e) => onFilterChange({ account_status: e.target.value })}
            className="px-2.5 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
          >
            <option value="">All Statuses</option>
            {ACCOUNT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={filters.kyc_status}
            onChange={(e) => onFilterChange({ kyc_status: e.target.value })}
            className="px-2.5 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
          >
            <option value="">All KYC</option>
            {KYC_STATUSES.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>

          <select
            value={filters.tier}
            onChange={(e) => onFilterChange({ tier: e.target.value })}
            className="px-2.5 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
          >
            <option value="">All Tiers</option>
            <option value="UNVERIFIED">Unverified</option>
            <option value="VERIFIED">Verified</option>
            <option value="PREMIUM">Premium</option>
          </select>

          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => onFilterChange({ date_from: e.target.value })}
            className="px-2.5 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
          />

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => onFilterChange({ date_to: e.target.value })}
            className="px-2.5 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
          />
        </div>
      )}

      {expanded && (
        <div className="border-t border-dashboard-border/40 px-3 pb-3 pt-2">
          <p className="text-[10px] font-medium text-dashboard-muted mb-2">Balance filters (NGN)</p>
          <p className="text-[10px] text-dashboard-muted/90 mb-2">
            Applies to users who have a main wallet and/or cashback wallet row. Ranges are inclusive.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <input
              type="number"
              step="any"
              value={filters.min_wallet_balance}
              onChange={(e) => onFilterChange({ min_wallet_balance: e.target.value })}
              placeholder="Min wallet balance"
              className="px-2.5 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
            />
            <input
              type="number"
              step="any"
              min={0}
              value={filters.max_wallet_balance}
              onChange={(e) => onFilterChange({ max_wallet_balance: e.target.value })}
              placeholder="Max wallet balance"
              className="px-2.5 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
            />
            <input
              type="number"
              step="any"
              value={filters.min_cashback_balance}
              onChange={(e) => onFilterChange({ min_cashback_balance: e.target.value })}
              placeholder="Min cashback balance"
              className="px-2.5 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
            />
            <input
              type="number"
              step="any"
              value={filters.max_cashback_balance}
              onChange={(e) => onFilterChange({ max_cashback_balance: e.target.value })}
              placeholder="Max cashback balance"
              className="px-2.5 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
            />
          </div>
        </div>
      )}
    </div>
  );
}
