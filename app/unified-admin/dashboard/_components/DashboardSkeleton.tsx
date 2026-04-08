"use client";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header skeleton */}
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="min-w-0 pr-12 lg:pr-0">
            <div className="h-5 w-32 bg-dashboard-border/70 rounded animate-pulse" />
            <div className="h-3.5 w-44 mt-2 bg-dashboard-border/50 rounded animate-pulse" />
          </div>
          <div className="h-9 w-28 bg-dashboard-border/60 rounded-lg animate-pulse" />
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-6">
        {/* Top stats row skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="relative bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 sm:p-5 pt-11 sm:pt-12 animate-pulse"
            >
              <div className="absolute top-3 right-3 h-9 w-9 sm:h-10 sm:w-10 bg-dashboard-border/50 rounded-lg" />
              <div className="space-y-2 min-w-0 pr-1">
                <div className="h-3 w-24 max-w-full bg-dashboard-border/50 rounded" />
                <div className="h-7 w-28 max-w-full bg-dashboard-border/60 rounded" />
                <div className="h-3 w-32 max-w-full bg-dashboard-border/40 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Second stats row skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="relative bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 sm:p-5 pt-11 sm:pt-12 animate-pulse"
            >
              <div className="absolute top-3 right-3 h-9 w-9 sm:h-10 sm:w-10 bg-dashboard-border/50 rounded-lg" />
              <div className="space-y-2 min-w-0 pr-1">
                <div className="h-3 w-20 max-w-full bg-dashboard-border/50 rounded" />
                <div className="h-7 w-16 max-w-full bg-dashboard-border/60 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Section cards skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 animate-pulse"
            >
              <div className="px-4 py-3 border-b border-dashboard-border/50 bg-dashboard-bg/50">
                <div className="h-4 w-24 bg-dashboard-border/50 rounded" />
              </div>
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex justify-between">
                    <div className="h-3 w-24 bg-dashboard-border/40 rounded" />
                    <div className="h-3 w-12 bg-dashboard-border/50 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
