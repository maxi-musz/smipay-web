"use client";

import { motion } from "motion/react";

function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-dashboard-border/40 ${className ?? ""}`}
    />
  );
}

export function CashbackSkeleton() {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      <div className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Pulse className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5">
              <Pulse className="h-4 w-40" />
              <Pulse className="h-3 w-52" />
            </div>
          </div>
          <Pulse className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        <div className="flex gap-2">
          <Pulse className="h-8 w-24 rounded-full" />
          <Pulse className="h-8 w-36 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-3.5 py-3"
            >
              <Pulse className="h-3 w-20 mb-2" />
              <Pulse className="h-6 w-16" />
            </motion.div>
          ))}
        </div>

        <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 space-y-3">
          <Pulse className="h-4 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Pulse key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
          <Pulse className="h-9 w-36 rounded-lg mt-3" />
        </div>

        <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden">
          <div className="px-3.5 py-3 border-b border-dashboard-border/60">
            <Pulse className="h-4 w-32" />
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-3.5 py-3 border-b border-dashboard-border/40"
            >
              <Pulse className="h-3 w-20" />
              <Pulse className="h-5 w-10 rounded-full" />
              <Pulse className="h-3 w-10" />
              <Pulse className="h-3 w-14" />
              <Pulse className="h-3 w-14" />
              <Pulse className="h-6 w-14 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
