"use client";

/** Loading placeholders matching the analyst section layout. */
export function AnalystSectionSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[88px] rounded-xl border border-dashboard-border/40 bg-dashboard-surface"
          />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-[280px] rounded-xl border border-dashboard-border/40 bg-dashboard-surface lg:col-span-2" />
        <div className="h-[240px] rounded-xl border border-dashboard-border/40 bg-dashboard-surface" />
        <div className="h-[240px] rounded-xl border border-dashboard-border/40 bg-dashboard-surface" />
      </div>
    </div>
  );
}
