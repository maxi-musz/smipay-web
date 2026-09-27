"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import {
  BreakdownList,
  PctBar,
  type BreakdownRow,
  type BreakdownTone,
} from "@/app/unified-admin/_components/VerificationBreakdownList";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
  subtitleColor?: string;
  subtitleHint?: string;
  index?: number;
  headlinePct?: number;
  headlineTone?: BreakdownTone;
  breakdown?: BreakdownRow[];
  footer?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  subtitle,
  subtitleColor = "text-dashboard-muted",
  subtitleHint,
  index = 0,
  headlinePct,
  headlineTone = "brand",
  breakdown,
  footer,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.06 * index }}
      className="relative h-full flex flex-col bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 sm:p-5 pt-11 sm:pt-12"
    >
      <div
        className="absolute top-3 right-3 sm:top-4 sm:right-4 h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center pointer-events-none"
        style={{ backgroundColor: iconBg, color: iconColor }}
        aria-hidden
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 pr-1">
        <p className="text-xs font-medium text-dashboard-muted leading-snug line-clamp-2 break-words">
          {title}
        </p>
        <p className="text-lg sm:text-xl xl:text-2xl font-bold text-dashboard-heading mt-1 tabular-nums tracking-tight break-words overflow-hidden">
          {value}
        </p>
        {subtitle && (
          <p
            title={subtitleHint}
            className={`text-[11px] sm:text-xs mt-1 font-medium leading-snug line-clamp-2 break-words ${subtitleColor}`}
          >
            {subtitle}
          </p>
        )}
        {headlinePct !== undefined && (
          <PctBar value={headlinePct} tone={headlineTone} className="mt-2" />
        )}
      </div>
      {breakdown && breakdown.length > 0 && (
        <BreakdownList
          rows={breakdown}
          className="mt-3 pt-3 border-t border-dashboard-border/40"
        />
      )}
      {footer && (
        <p className="mt-auto pt-3 text-[11px] text-dashboard-muted leading-snug break-words">
          {footer}
        </p>
      )}
    </motion.div>
  );
}
