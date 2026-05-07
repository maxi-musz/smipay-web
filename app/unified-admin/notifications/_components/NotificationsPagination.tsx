interface NotificationsPaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export function NotificationsPagination({
  page,
  pages,
  onPageChange,
}: NotificationsPaginationProps) {
  if (!pages || pages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= pages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashboard-border/60 bg-dashboard-surface px-3 py-2.5">
      <button
        type="button"
        disabled={prevDisabled}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading disabled:opacity-40 hover:bg-dashboard-bg transition-colors"
      >
        Previous
      </button>

      <p className="text-xs text-dashboard-muted">
        Page <span className="font-semibold text-dashboard-heading">{page}</span> of{" "}
        <span className="font-semibold text-dashboard-heading">{pages}</span>
      </p>

      <button
        type="button"
        disabled={nextDisabled}
        onClick={() => onPageChange(Math.min(pages, page + 1))}
        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading disabled:opacity-40 hover:bg-dashboard-bg transition-colors"
      >
        Next
      </button>
    </div>
  );
}
