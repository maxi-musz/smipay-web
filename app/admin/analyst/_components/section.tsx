"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CalendarRange,
  Download,
  RefreshCw,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { downloadCsv, type ExportSet } from "./csv";
import { AnalystSectionSkeleton } from "./skeletons";
import type { RangeMeta } from "@/types/admin/analytics";
import type { AnalyticsPeriod } from "@/store/admin/admin-analytics-store";

export type RangeValue = "1d" | "7d" | "30d" | "90d" | "12m";

/** Presets are calendar windows in Africa/Lagos (WAT), not rolling clock hours. */
const RANGES: { value: RangeValue; label: string; title: string }[] = [
  {
    value: "1d",
    label: "Today",
    title:
      "Calendar today in Nigeria time (WAT) — from midnight to end of day, not the last 24 hours",
  },
  {
    value: "7d",
    label: "7D",
    title: "Last 7 calendar days including today (Africa/Lagos)",
  },
  {
    value: "30d",
    label: "30D",
    title: "Last 30 calendar days including today (Africa/Lagos)",
  },
  {
    value: "90d",
    label: "90D",
    title: "Last 90 calendar days including today (Africa/Lagos)",
  },
  {
    value: "12m",
    label: "12M",
    title: "Last 365 calendar days including today (Africa/Lagos)",
  },
];

const ANALYTICS_TZ = "Africa/Lagos";

function formatWindowInstant(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    timeZone: ANALYTICS_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** e.g. "11 Aug 2026, 00:00 – 11 Aug 2026, 23:59 WAT" */
export function formatRangeWindow(meta: RangeMeta): string {
  return `${formatWindowInstant(meta.from)} – ${formatWindowInstant(meta.to)} WAT`;
}

/** ISO → `YYYY-MM-DDTHH:mm` in Africa/Lagos for datetime-local inputs. */
export function isoToLagosInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ANALYTICS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  // en-CA can yield hour "24" at midnight in some engines — normalise.
  let hour = get("hour");
  if (hour === "24") hour = "00";
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/** `datetime-local` value interpreted as Africa/Lagos → ISO UTC. */
export function lagosInputToIso(value: string): string | null {
  if (!value) return null;
  // Append seconds; Lagos is UTC+1 year-round.
  const d = new Date(`${value}:00+01:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function defaultCustomDraft(): { from: string; to: string } {
  const now = new Date();
  const to = isoToLagosInput(now.toISOString());
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const from = isoToLagosInput(start.toISOString());
  return { from, to };
}

export function DateRange({
  period,
  onPreset,
  onCustom,
}: {
  period: AnalyticsPeriod;
  onPreset: (v: RangeValue) => void;
  onCustom: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [draftError, setDraftError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (period.mode === "custom") {
      setDraftFrom(isoToLagosInput(period.from));
      setDraftTo(isoToLagosInput(period.to));
    } else {
      const d = defaultCustomDraft();
      setDraftFrom(d.from);
      setDraftTo(d.to);
    }
    setDraftError("");
  }, [open, period]);

  const applyCustom = () => {
    const fromIso = lagosInputToIso(draftFrom);
    const toIso = lagosInputToIso(draftTo);
    if (!fromIso || !toIso) {
      setDraftError("Enter a valid start and end date & time.");
      return;
    }
    if (new Date(fromIso).getTime() >= new Date(toIso).getTime()) {
      setDraftError("Start must be before end.");
      return;
    }
    onCustom(fromIso, toIso);
    setOpen(false);
  };

  const customActive = period.mode === "custom";

  return (
    <div className="relative inline-flex flex-wrap items-center gap-1">
      <div className="inline-flex rounded-lg border border-dashboard-border/60 bg-dashboard-bg p-0.5">
        {RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            title={r.title}
            onClick={() => {
              setOpen(false);
              onPreset(r.value);
            }}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              period.mode === "preset" && period.range === r.value
                ? "bg-brand-bg-primary text-white shadow-sm"
                : "text-dashboard-muted hover:text-dashboard-heading"
            }`}
          >
            {r.label}
          </button>
        ))}
        <button
          type="button"
          title="Pick an exact start and end in Nigeria time (WAT)"
          onClick={() => setOpen((o) => !o)}
          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            customActive
              ? "bg-brand-bg-primary text-white shadow-sm"
              : "text-dashboard-muted hover:text-dashboard-heading"
          }`}
        >
          <CalendarRange className="h-3.5 w-3.5" />
          Custom
        </button>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full z-30 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-dashboard-heading">
                Custom range
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mb-3 text-[11px] leading-snug text-dashboard-muted">
              Times are Africa/Lagos (WAT). Use this for a specific hour window
              or any span the presets do not cover.
            </p>
            <div className="space-y-2.5">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-dashboard-muted">
                  From
                </span>
                <input
                  type="datetime-local"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="w-full rounded-lg border border-dashboard-border/60 bg-white px-2.5 py-1.5 text-sm text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-dashboard-muted">
                  To
                </span>
                <input
                  type="datetime-local"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="w-full rounded-lg border border-dashboard-border/60 bg-white px-2.5 py-1.5 text-sm text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </label>
            </div>
            {draftError ? (
              <p className="mt-2 text-[11px] text-red-600">{draftError}</p>
            ) : null}
            <button
              type="button"
              onClick={applyCustom}
              className="mt-3 w-full rounded-lg bg-brand-bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-brand-bg-primary/90"
            >
              Apply custom range
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ExportMenu({
  exports: sets,
  section,
  rangeLabel,
}: {
  exports: ExportSet[];
  section: string;
  rangeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const usable = sets.filter((e) => e.rows.length > 0);
  if (usable.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-2.5 py-1.5 text-xs font-semibold text-dashboard-heading hover:bg-dashboard-surface"
      >
        <Download className="h-3.5 w-3.5" /> Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-lg border border-dashboard-border/60 bg-dashboard-surface py-1 shadow-lg">
            {usable.map((e) => (
              <button
                key={e.name}
                type="button"
                onClick={() => {
                  downloadCsv(e.name, e.rows, {
                    section,
                    range: rangeLabel,
                  });
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-dashboard-heading hover:bg-dashboard-bg"
              >
                <Download className="h-3.5 w-3.5 text-dashboard-muted" />
                <span className="capitalize">{e.name.replace(/[-_]/g, " ")}</span>
                <span className="ml-auto text-dashboard-muted">
                  {e.rows.length}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function periodLabel(period: AnalyticsPeriod): string {
  if (period.mode === "custom") {
    return `custom:${period.from}|${period.to}`;
  }
  return period.range;
}

/**
 * Standard shell for an analytics section: sticky header with title, optional
 * inline control (`headerExtra`), CSV export, and range picker; then loading /
 * error / content states.
 */
export function SectionShell({
  title,
  subtitle,
  icon: Icon,
  section,
  period,
  onPreset,
  onCustom,
  rangeMeta,
  loading,
  error,
  onRetry,
  headerExtra,
  exports,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  section: string;
  period: AnalyticsPeriod;
  onPreset: (v: RangeValue) => void;
  onCustom: (from: string, to: string) => void;
  /** Resolved window from the API — shown so analysts know the exact bounds. */
  rangeMeta?: RangeMeta | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  headerExtra?: ReactNode;
  exports?: ExportSet[];
  children: ReactNode;
}) {
  const presetHint =
    period.mode === "custom"
      ? "Custom window in Africa/Lagos (WAT)"
      : (RANGES.find((r) => r.value === period.range)?.title ??
        "Calendar window in Africa/Lagos (WAT)");

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
          <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {headerExtra}
              {exports && exports.length > 0 && (
                <ExportMenu
                  exports={exports}
                  section={section}
                  rangeLabel={periodLabel(period)}
                />
              )}
              <DateRange
                period={period}
                onPreset={onPreset}
                onCustom={onCustom}
              />
            </div>
            <p
              className="max-w-xl text-right text-[11px] leading-snug text-dashboard-muted"
              title={presetHint}
            >
              {rangeMeta ? (
                <>
                  Showing{" "}
                  <span className="font-medium text-dashboard-heading">
                    {formatRangeWindow(rangeMeta)}
                  </span>
                  {period.mode === "preset" && period.range === "1d" ? (
                    <span> · calendar today, not last 24 hours</span>
                  ) : null}
                  {period.mode === "custom" ? (
                    <span> · custom selection</span>
                  ) : null}
                </>
              ) : (
                <span>{presetHint}</span>
              )}
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6 lg:px-8">
        {loading ? (
          <AnalystSectionSkeleton />
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
