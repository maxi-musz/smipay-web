"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AuditListMeta } from "@/types/admin/audit-logs";

interface AuditPaginationProps {
  meta: AuditListMeta;
  onPageChange: (page: number) => void;
}

export function AuditPagination({ meta, onPageChange }: AuditPaginationProps) {
  const { page, total_pages, total, limit } = meta;
  if (total_pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages = buildPageNumbers(page, total_pages);

  const btnBase =
    "inline-flex items-center justify-center h-8 min-w-[32px] px-2 text-xs font-medium rounded-lg border transition-colors";
  const btnDefault = `${btnBase} bg-dashboard-surface border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg`;
  const btnActive = `${btnBase} bg-brand-bg-primary border-transparent text-dashboard-heading font-bold`;
  const btnDisabled = `${btnBase} bg-dashboard-surface border-dashboard-border/60 text-dashboard-muted opacity-40 cursor-not-allowed`;

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <p className="text-xs text-dashboard-muted tabular-nums">
        Showing {from.toLocaleString()}–{to.toLocaleString()} of{" "}
        {total.toLocaleString()}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={page <= 1 ? btnDisabled : btnDefault}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="ml-0.5 hidden sm:inline">Prev</span>
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="text-xs text-dashboard-muted px-1 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={p === page ? btnActive : btnDefault}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= total_pages}
          className={page >= total_pages ? btnDisabled : btnDefault}
        >
          <span className="mr-0.5 hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function buildPageNumbers(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}
