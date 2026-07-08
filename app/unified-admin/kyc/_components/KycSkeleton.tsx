export function KycSkeleton() {
  return (
    <div className="min-h-screen bg-dashboard-bg animate-pulse">
      <div className="bg-dashboard-surface border-b border-dashboard-border/60 px-4 py-4 sm:px-6 lg:px-8">
        <div className="h-9 w-9 rounded-lg bg-dashboard-border/40" />
        <div className="mt-3 h-5 w-48 bg-dashboard-border/40 rounded" />
        <div className="mt-2 h-3 w-72 bg-dashboard-border/30 rounded" />
      </div>
      <div className="px-4 py-4 sm:px-6 lg:px-8 space-y-4">
        <div className="h-40 bg-dashboard-surface rounded-xl border border-dashboard-border/40" />
        <div className="h-64 bg-dashboard-surface rounded-xl border border-dashboard-border/40" />
      </div>
    </div>
  );
}
