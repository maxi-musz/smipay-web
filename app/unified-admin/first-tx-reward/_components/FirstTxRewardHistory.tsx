"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import type {
  FirstTxRewardHistoryItem,
  FirstTxRewardHistoryMeta,
  FirstTxRewardHistoryFilters,
} from "@/types/admin/first-tx-reward";
import { FIRST_TX_TRANSACTION_TYPES } from "@/types/admin/first-tx-reward";

interface FirstTxRewardHistoryProps {
  history: FirstTxRewardHistoryItem[];
  meta: FirstTxRewardHistoryMeta | null;
  filters: FirstTxRewardHistoryFilters;
  loading: boolean;
  error: string | null;
  onFilterChange: (patch: Partial<FirstTxRewardHistoryFilters>) => void;
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

const SERVICE_BG: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
  indigo: "bg-indigo-50 text-indigo-700",
  orange: "bg-orange-50 text-orange-700",
  pink: "bg-pink-50 text-pink-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
};

function TxTypeBadge({ type }: { type: string }) {
  const meta = FIRST_TX_TRANSACTION_TYPES.find((t) => t.value === type);
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

export function FirstTxRewardHistory({
  history,
  meta,
  filters,
  loading,
  error,
  onFilterChange,
  onPageChange,
  onReset,
}: FirstTxRewardHistoryProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    !!filters.source_transaction_type ||
    !!filters.user_id ||
    !!filters.date_from ||
    !!filters.date_to;

  return (
    <div className="space-y-3">
      {/* Filters */}
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
              placeholder="Search by user ID..."
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
                Trigger Type
              </label>
              <select
                value={filters.source_transaction_type}
                onChange={(e) =>
                  onFilterChange({ source_transaction_type: e.target.value })
                }
                className="w-full bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-xs text-dashboard-heading py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
              >
                <option value="">All Types</option>
                {FIRST_TX_TRANSACTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
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
                onChange={(e) => onFilterChange({ date_from: e.target.value })}
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

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
              No reward history
            </p>
            <p className="text-xs text-dashboard-muted">
              First-tx reward entries will appear here once users start earning
              bonuses.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead>
                <tr className="bg-dashboard-bg/50 text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider">
                  <th className="text-left px-3.5 py-2.5">Date</th>
                  <th className="text-left px-3.5 py-2.5">User</th>
                  <th className="text-left px-3.5 py-2.5">Trigger Type</th>
                  <th className="text-right px-3.5 py-2.5">Purchase Amt</th>
                  <th className="text-right px-3.5 py-2.5">Bonus Given</th>
                  <th className="text-left px-3.5 py-2.5">Bonus Tx Ref</th>
                  <th className="text-left px-3.5 py-2.5">Source Tx Ref</th>
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
                    <td className="px-3.5 py-2.5">
                      <Link
                        href={`/unified-admin/users/${item.user_id}`}
                        className="font-mono text-dashboard-heading hover:text-brand-bg-primary truncate max-w-[120px] block transition-colors"
                      >
                        {item.user_id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <TxTypeBadge type={item.source_transaction_type} />
                    </td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-dashboard-heading">
                      {formatCurrency(item.source_amount)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums font-semibold text-emerald-600">
                      {formatCurrency(item.reward_amount)}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <Link
                        href={`/unified-admin/transactions/${item.transaction_ref}`}
                        className="font-mono text-dashboard-muted hover:text-brand-bg-primary truncate max-w-[140px] block transition-colors"
                      >
                        {item.transaction_ref.length > 20
                          ? item.transaction_ref.slice(0, 20) + "…"
                          : item.transaction_ref}
                      </Link>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <Link
                        href={`/unified-admin/transactions/${item.source_transaction_ref}`}
                        className="font-mono text-dashboard-muted hover:text-brand-bg-primary truncate max-w-[140px] block transition-colors"
                      >
                        {item.source_transaction_ref.length > 20
                          ? item.source_transaction_ref.slice(0, 20) + "…"
                          : item.source_transaction_ref}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {meta && meta.total_pages > 1 && (
        <Pagination meta={meta} onPageChange={onPageChange} />
      )}
    </div>
  );
}

function Pagination({
  meta,
  onPageChange,
}: {
  meta: FirstTxRewardHistoryMeta;
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
