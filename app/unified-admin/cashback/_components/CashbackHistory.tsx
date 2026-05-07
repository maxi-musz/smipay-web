"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import type {
  CashbackHistoryItem,
  CashbackHistoryMeta,
  CashbackHistoryFilters,
} from "@/types/admin/cashback";
import {
  CASHBACK_SERVICE_TYPES,
  CASHBACK_STATUS_COLORS,
} from "@/types/admin/cashback";

interface CashbackHistoryProps {
  history: CashbackHistoryItem[];
  meta: CashbackHistoryMeta | null;
  filters: CashbackHistoryFilters;
  loading: boolean;
  error: string | null;
  onFilterChange: (patch: Partial<CashbackHistoryFilters>) => void;
  onPageChange: (page: number) => void;
  onReset: () => void;
}

function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_BG: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red: "bg-red-50 text-red-700 border-red-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
};

const SERVICE_BG: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
  pink: "bg-pink-50 text-pink-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  cyan: "bg-cyan-50 text-cyan-700",
};

export function CashbackHistory({
  history,
  meta,
  filters,
  loading,
  error,
  onFilterChange,
  onPageChange,
  onReset,
}: CashbackHistoryProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    !!filters.service_type ||
    !!filters.user_id ||
    !!filters.date_from ||
    !!filters.date_to;

  return (
    <div className="space-y-3">
      {/* Filters bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-2.5"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dashboard-muted" />
            <input
              type="text"
              placeholder="Search by user ID or tx ref..."
              value={filters.user_id}
              onChange={(e) => onFilterChange({ user_id: e.target.value })}
              className="w-full bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-xs text-dashboard-heading py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 placeholder:text-dashboard-muted/60"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              hasActiveFilters
                ? "border-brand-bg-primary/40 bg-brand-bg-primary/5 text-brand-bg-primary"
                : "border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-bg"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="h-4 w-4 rounded-full bg-brand-bg-primary text-white text-[9px] flex items-center justify-center font-bold">
                !
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mt-2.5 pt-2.5 border-t border-dashboard-border/60 grid grid-cols-1 sm:grid-cols-3 gap-2"
          >
            <div>
              <label className="block text-[10px] font-medium text-dashboard-muted mb-1">
                Service
              </label>
              <select
                value={filters.service_type}
                onChange={(e) =>
                  onFilterChange({ service_type: e.target.value })
                }
                className="w-full bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-xs text-dashboard-heading py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
              >
                <option value="">All Services</option>
                {CASHBACK_SERVICE_TYPES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-dashboard-muted mb-1">
                From
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) =>
                  onFilterChange({ date_from: e.target.value })
                }
                className="w-full bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-xs text-dashboard-heading py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
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
                className="w-full bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-xs text-dashboard-heading py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Pagination top */}
      {meta && meta.total_pages > 1 && (
        <Pagination meta={meta} onPageChange={onPageChange} />
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden"
      >
        {loading && history.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="h-6 w-6 border-2 border-brand-bg-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-dashboard-muted">Loading history…</p>
          </div>
        ) : history.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-dashboard-heading mb-1">
              No cashback history
            </p>
            <p className="text-xs text-dashboard-muted">
              Cashback entries will appear here once users start earning rewards.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead>
                <tr className="bg-dashboard-bg/50 text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider">
                  <th className="text-left px-3.5 py-2.5">Date</th>
                  <th className="text-left px-3.5 py-2.5">User</th>
                  <th className="text-left px-3.5 py-2.5">Service</th>
                  <th className="text-right px-3.5 py-2.5">Purchase</th>
                  <th className="text-right px-3.5 py-2.5">%</th>
                  <th className="text-right px-3.5 py-2.5">Cashback</th>
                  <th className="text-left px-3.5 py-2.5">Tx Ref</th>
                  <th className="text-left px-3.5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashboard-border/40">
                {history.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-dashboard-bg/30 transition-colors"
                  >
                    <td className="px-3.5 py-2.5 text-dashboard-muted whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-dashboard-heading truncate max-w-[120px]">
                      {item.user_id.slice(0, 8)}…
                    </td>
                    <td className="px-3.5 py-2.5">
                      <ServiceBadge type={item.service_type} />
                    </td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-dashboard-heading">
                      {formatCurrency(item.source_amount)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-dashboard-muted">
                      {item.percentage_applied}%
                    </td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums font-semibold text-emerald-600">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-dashboard-muted truncate max-w-[140px]">
                      {item.transaction_ref}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination bottom */}
      {meta && meta.total_pages > 1 && (
        <Pagination meta={meta} onPageChange={onPageChange} />
      )}
    </div>
  );
}

function ServiceBadge({ type }: { type: string }) {
  const meta = CASHBACK_SERVICE_TYPES.find((s) => s.value === type);
  const color = meta?.color ?? "slate";
  const bg = SERVICE_BG[color] ?? "bg-slate-100 text-slate-600";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${bg}`}
    >
      {meta?.label ?? type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = CASHBACK_STATUS_COLORS[status] ?? "slate";
  const bg = STATUS_BG[color] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${bg}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function Pagination({
  meta,
  onPageChange,
}: {
  meta: CashbackHistoryMeta;
  onPageChange: (page: number) => void;
}) {
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex items-center justify-between">
      <p className="text-[10px] text-dashboard-muted tabular-nums">
        {from}–{to} of {meta.total.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={meta.page <= 1}
          className="p-1.5 rounded-md border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-[10px] font-medium text-dashboard-heading tabular-nums px-2">
          {meta.page} / {meta.total_pages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={meta.page >= meta.total_pages}
          className="p-1.5 rounded-md border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-40 transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
