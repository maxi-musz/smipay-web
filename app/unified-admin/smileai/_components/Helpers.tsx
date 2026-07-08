"use client";

import { ReactNode } from "react";

export function SectionHeader({
  title,
  description,
  actions,
  icon,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center text-white shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-base font-bold text-dashboard-heading">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-dashboard-muted truncate">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function EmptyState({
  title,
  description,
  cta,
  icon,
}: {
  title: string;
  description?: string;
  cta?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && (
        <div className="h-12 w-12 rounded-full bg-dashboard-bg flex items-center justify-center text-dashboard-muted mb-3">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-dashboard-heading">{title}</h3>
      {description && (
        <p className="text-xs text-dashboard-muted mt-1 max-w-md">
          {description}
        </p>
      )}
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

export function Skeleton({
  className = "",
  height = "1rem",
}: {
  className?: string;
  height?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded bg-dashboard-bg ${className}`}
      style={{ height }}
    />
  );
}

export function ErrorBanner({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry?: () => void;
}) {
  if (!error) return null;
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
      <span>{error}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="underline font-medium ml-2 shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function StatusPill({
  status,
}: {
  status: string;
}) {
  const tone = STATUS_TONES[status] ?? "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${tone}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

const STATUS_TONES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  awaiting_user: "bg-amber-100 text-amber-700",
  handoff_pending: "bg-orange-100 text-orange-700",
  handed_off: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-700",
  abandoned: "bg-rose-100 text-rose-700",
  indexed: "bg-emerald-100 text-emerald-700",
  uploaded: "bg-slate-100 text-slate-700",
  parsing: "bg-amber-100 text-amber-700",
  chunking: "bg-amber-100 text-amber-700",
  embedding: "bg-amber-100 text-amber-700",
  failed: "bg-rose-100 text-rose-700",
  archived: "bg-slate-100 text-slate-600",
  read: "bg-slate-100 text-slate-700",
  write: "bg-amber-100 text-amber-700",
  sensitive: "bg-rose-100 text-rose-700",
  thumbs_up: "bg-emerald-100 text-emerald-700",
  thumbs_down: "bg-rose-100 text-rose-700",
  rating: "bg-slate-100 text-slate-700",
  flag: "bg-amber-100 text-amber-700",
};

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-dashboard-surface border border-dashboard-border/60 rounded-xl ${className}`}
    >
      {children}
    </div>
  );
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatPercent(
  n: number | null | undefined,
  fractionDigits = 1,
): string {
  if (n === null || n === undefined) return "—";
  return `${(n * 100).toFixed(fractionDigits)}%`;
}

export function formatUsd(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const num = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(num)) return "—";
  if (num >= 100) return `$${num.toFixed(0)}`;
  if (num >= 1) return `$${num.toFixed(2)}`;
  return `$${num.toFixed(4)}`;
}

export function formatRelative(input: string | null | undefined): string {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function formatDateTime(input: string | null | undefined): string {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString();
}
