export function NotificationsSkeleton() {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-dashboard-border/60 animate-pulse" />
            <div className="space-y-1">
              <div className="h-4 w-36 bg-dashboard-border/60 rounded animate-pulse" />
              <div className="h-3 w-56 bg-dashboard-border/40 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-9 w-28 bg-dashboard-border/60 rounded-lg animate-pulse" />
        </div>
      </header>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-3">
        <div className="h-12 rounded-xl bg-dashboard-surface border border-dashboard-border/60 animate-pulse" />
        <div className="h-12 rounded-xl bg-dashboard-surface border border-dashboard-border/60 animate-pulse" />
        <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`h-14 ${i > 0 ? "border-t border-dashboard-border/40" : ""} bg-dashboard-surface`}
            >
              <div className="h-full mx-3 my-3 rounded bg-dashboard-border/30 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
