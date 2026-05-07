"use client";

import { motion } from "motion/react";

function Pulse({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={`bg-dashboard-border/50 rounded animate-pulse ${className}`} style={style} />;
}

export function AuditSkeleton() {
  return (
    <div className="space-y-3">
      {/* Row 1: Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 * i }}
            className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <Pulse className="h-2.5 w-14" />
                <Pulse className="h-5 w-16 bg-dashboard-border/70" />
                <Pulse className="h-2 w-20" />
              </div>
              <Pulse className="h-8 w-8 rounded-lg flex-shrink-0" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {[0.12, 0.16].map((delay, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay }}
            className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
          >
            <Pulse className="h-2.5 w-24 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: i === 0 ? 6 : 1 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <Pulse className="h-2 w-20 flex-shrink-0" />
                  <Pulse className="h-2 flex-1 rounded-full" />
                  <Pulse className="h-2 w-8 flex-shrink-0" />
                </div>
              ))}
              {i === 1 && (
                <>
                  <Pulse className="h-2.5 w-full rounded-full mt-1" />
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Pulse key={j} className="h-2.5 w-full" />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Row 3: Fraud indicators */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
      >
        <Pulse className="h-3 w-32 mb-3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Pulse className="h-2.5 w-24" />
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Pulse key={i} className="h-6 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Pulse className="h-2.5 w-28" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Pulse className="h-7 w-7 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <Pulse className="h-2.5 w-28" />
                  <Pulse className="h-2 w-16" />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Pulse className="h-2.5 w-28" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Pulse className="h-3 w-24" />
                <Pulse className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Filters skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        className="flex items-center gap-2.5"
      >
        <Pulse className="h-10 flex-1 min-w-[200px] rounded-lg" />
        <Pulse className="h-10 w-28 rounded-lg" />
      </motion.div>

      {/* Table skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden"
      >
        <div className="border-b border-dashboard-border/50 bg-dashboard-bg/50 px-4 py-3 flex gap-4">
          {[40, 70, 80, 60, 50, 60, 120, 60, 80, 30].map((w, i) => (
            <Pulse key={i} style={{ width: w }} className="h-3" />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 px-4 py-3.5 ${i > 0 ? "border-t border-dashboard-border/40" : ""}`}
          >
            <Pulse className="h-3 w-12" />
            <Pulse className="h-3 w-20" />
            <Pulse className="h-3 w-24" />
            <Pulse className="h-5 w-16 rounded-full" />
            <Pulse className="h-5 w-14 rounded-full" />
            <Pulse className="h-5 w-14 rounded-full" />
            <Pulse className="flex-1 h-3" />
            <Pulse className="h-3 w-16" />
            <Pulse className="h-3 w-20" />
            <Pulse className="h-3.5 w-3.5 rounded" />
          </div>
        ))}
      </motion.div>

      {/* Pagination skeleton */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="flex items-center justify-between"
      >
        <Pulse className="h-3 w-36" />
        <div className="flex gap-1.5">
          <Pulse className="h-8 w-20 rounded-lg" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Pulse key={i} className="h-8 w-8 rounded-lg" />
          ))}
          <Pulse className="h-8 w-16 rounded-lg" />
        </div>
      </motion.div>
    </div>
  );
}
