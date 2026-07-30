"use client";

import { BarChart3, LineChart, PieChart } from "lucide-react";
import { motion } from "motion/react";

export default function AnalystDashboardPage() {
  return (
    <div className="min-h-full bg-dashboard-bg">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="min-w-0 pr-12 lg:pr-0">
            <h1 className="text-lg sm:text-xl font-semibold text-dashboard-heading tracking-tight">
              Analyst Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-dashboard-muted mt-0.5">
              Read-only analytics and reporting workspace
            </p>
          </div>
        </div>
      </motion.header>

      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-dashboard-heading">
                Welcome to your analyst workspace
              </h2>
              <p className="mt-2 text-sm leading-6 text-dashboard-muted max-w-2xl">
                Charts, reports, and read-only analytics will live here —
                separate from the main admin panel. Use the sidebar to navigate
                as new sections are added.
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-dashboard-muted">
                Placeholder · v1
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              title: "Overview metrics",
              description: "High-level KPIs and trend summaries.",
              icon: BarChart3,
            },
            {
              title: "Transaction reports",
              description: "Volume, success rates, and category breakdowns.",
              icon: LineChart,
            },
            {
              title: "User insights",
              description: "Growth, retention, and tier distribution.",
              icon: PieChart,
            },
          ].map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + index * 0.05 }}
              className="rounded-xl border border-dashed border-dashboard-border/80 bg-dashboard-surface/70 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dashboard-bg text-dashboard-muted">
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-dashboard-heading">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-dashboard-muted">
                    {card.description}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-dashboard-muted">
                Coming soon
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
