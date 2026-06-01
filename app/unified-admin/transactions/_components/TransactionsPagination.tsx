"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TransactionListMeta } from "@/types/admin/transactions";

interface TransactionsPaginationProps {
  meta: TransactionListMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function TransactionsPagination({ meta, onPageChange, disabled = false }: TransactionsPaginationProps) {
  const { page, total_pages, total, limit, ledger_slots_total, ledger_slots_pagination } = meta;
  const paginationTotal =
    ledger_slots_pagination && ledger_slots_total != null ? ledger_slots_total : total;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, paginationTotal);

  if (total_pages <= 1) return null;

  const pages = getPageNumbers(page, total_pages);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 ${disabled ? "opacity-60" : ""}`}>
      <p className="text-[10px] text-dashboard-muted tabular-nums">
        Showing {from}–{to} of {paginationTotal.toLocaleString()}
        {ledger_slots_pagination ? (
          <span className="text-dashboard-muted/80">
            {" "}
            rows ({total.toLocaleString()} transactions)
          </span>
        ) : null}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          className="p-1.5 rounded-lg border border-dashboard-border/60 text-dashboard-muted hover:bg-dashboard-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dot-${i}`} className="px-1 text-[10px] text-dashboard-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p as number)}
              disabled={disabled}
              className={`min-w-[28px] h-7 rounded-lg text-[10px] font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none ${
                p === page
                  ? "bg-brand-bg-primary text-white"
                  : "text-dashboard-muted hover:bg-dashboard-bg border border-dashboard-border/60"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= total_pages}
          className="p-1.5 rounded-lg border border-dashboard-border/60 text-dashboard-muted hover:bg-dashboard-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}
