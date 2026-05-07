"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

interface SectionRow {
  label: string;
  value: string | number;
  valueColor?: string;
}

interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  rows: SectionRow[];
  index?: number;
}

export function SectionCard({
  title,
  icon: Icon,
  rows,
  index = 0,
}: SectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 * index }}
      className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-dashboard-border/50 bg-dashboard-bg/50">
        <Icon className="h-4 w-4 text-dashboard-muted" />
        <h3 className="text-sm font-semibold text-dashboard-heading">{title}</h3>
      </div>
      <div className="divide-y divide-dashboard-border/40">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-3 px-4 py-2.5 min-w-0"
          >
            <span className="text-xs text-dashboard-muted min-w-0 shrink truncate">
              {row.label}
            </span>
            <span
              className={`text-sm font-semibold tabular-nums text-left sm:text-right shrink-0 sm:max-w-[55%] sm:truncate ${
                row.valueColor || "text-dashboard-heading"
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
