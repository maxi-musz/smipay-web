"use client";

import { motion } from "motion/react";

function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-dashboard-border/40 ${className ?? ""}`} />;
}

export function TransactionsSkeleton() {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header skeleton */}
      <div className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Pulse className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5">
              <Pulse className="h-4 w-36" />
              <Pulse className="h-3 w-48" />
            </div>
          </div>
          <Pulse className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-3">
        {/* Analytics cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
            >
              <Pulse className="h-3 w-20 mb-2" />
              <Pulse className="h-6 w-28 mb-1" />
              <Pulse className="h-2.5 w-16" />
            </motion.div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
            >
              <Pulse className="h-3 w-28 mb-3" />
              <Pulse className="h-2.5 w-full mb-3 rounded-full" />
              <div className="space-y-1.5">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Pulse key={j} className="h-2.5 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Filters skeleton */}
        <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3 py-2.5">
          <Pulse className="h-8 w-full rounded-lg" />
        </div>

        {/* Table skeleton */}
        <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-dashboard-border/60">
            <div className="flex gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Pulse key={i} className="h-3 w-16" />
              ))}
            </div>
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-3 py-3 border-b border-dashboard-border/40"
            >
              <Pulse className="h-7 w-7 rounded-full flex-shrink-0" />
              <Pulse className="h-3 w-24" />
              <Pulse className="h-3 w-16" />
              <Pulse className="h-4 w-14 rounded-md" />
              <Pulse className="h-4 w-14 rounded-md" />
              <Pulse className="h-3 w-12" />
              <Pulse className="h-3 w-16" />
              <Pulse className="h-3 w-14" />
              <Pulse className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
