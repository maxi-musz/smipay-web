"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReferralListMeta } from "@/types/admin/referrals";

interface ReferralsPaginationProps {
  meta: ReferralListMeta;
  onPageChange: (page: number) => void;
}

export function ReferralsPagination({ meta, onPageChange }: ReferralsPaginationProps) {
  const { page, total_pages, total, limit } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (total_pages <= 1) return null;

  const pages = getPageNumbers(page, total_pages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-[10px] text-dashboard-muted tabular-nums">
        Showing {from}–{to} of {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
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
              className={`min-w-[28px] h-7 rounded-lg text-[10px] font-medium transition-colors ${
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
          disabled={page >= total_pages}
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
