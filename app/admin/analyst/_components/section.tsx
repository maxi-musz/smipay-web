"use client";

import type { LucideIcon } from "lucide-react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

export type RangeValue = "7d" | "30d" | "90d" | "12m";

const RANGES: { value: RangeValue; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "12m", label: "12M" },
];

export function DateRange({
  value,
  onChange,
}: {
  value: RangeValue;
  onChange: (v: RangeValue) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-dashboard-border/60 bg-dashboard-bg p-0.5">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            value === r.value
              ? "bg-brand-bg-primary text-white shadow-sm"
              : "text-dashboard-muted hover:text-dashboard-heading"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Standard shell for an analytics section: sticky header with title + range
 * picker, then loading / error / content states.
 */
export function SectionShell({
  title,
  subtitle,
  icon: Icon,
  range,
  onRangeChange,
  loading,
  error,
  onRetry,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  range: RangeValue;
  onRangeChange: (v: RangeValue) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-dashboard-bg">
      <header className="sticky top-0 z-10 border-b border-dashboard-border/60 bg-dashboard-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 pr-12 lg:pr-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-bg-primary text-white">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-dashboard-heading">
                {title}
              </h1>
              {subtitle && (
                <p className="truncate text-xs text-dashboard-muted">{subtitle}</p>
              )}
            </div>
          </div>
          <DateRange value={range} onChange={onRangeChange} />
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-dashboard-muted" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <AlertCircle className="h-9 w-9 text-red-500" />
            <p className="max-w-sm text-sm text-dashboard-muted">{error}</p>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-lg border border-dashboard-border/60 px-3 py-1.5 text-sm text-dashboard-heading hover:bg-dashboard-bg"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
}
