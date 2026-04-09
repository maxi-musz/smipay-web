"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { UserListMeta } from "@/types/admin/users";

interface Props {
  meta: UserListMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

export function UsersPagination({ meta, onPageChange, className = "" }: Props) {
  const { page, total_pages, total, limit } = meta;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  if (total_pages <= 1) {
    return (
      <div className={`flex items-center text-xs text-dashboard-muted ${className}`.trim()}>
        <span>
          {start}–{end} of {total.toLocaleString()}
        </span>
      </div>
    );
  }

  const pages: (number | "...")[] = [];
  if (total_pages <= 7) {
    for (let i = 1; i <= total_pages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(total_pages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < total_pages - 2) pages.push("...");
    pages.push(total_pages);
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 text-xs min-w-0 ${className}`.trim()}
    >
      <span className="text-dashboard-muted">
        {start}–{end} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="px-1 text-dashboard-muted">...</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-[28px] h-7 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? "bg-brand-bg-primary text-white"
                  : "text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-bg"
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
          className="p-1.5 rounded-lg border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
