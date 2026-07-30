"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { fmtDelta } from "./format";

export function KpiCard({
  title,
  value,
  delta,
  deltaGoodWhenUp = true,
  icon: Icon,
  hint,
}: {
  title: string;
  value: string;
  delta?: number;
  deltaGoodWhenUp?: boolean;
  icon?: LucideIcon;
  hint?: string;
}) {
  const up = (delta ?? 0) >= 0;
  const good = up === deltaGoodWhenUp;
  return (
    <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-dashboard-muted">{title}</p>
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-dashboard-heading">
        {value}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {delta !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              good ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {up ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {fmtDelta(delta)}
          </span>
        )}
        {hint && <span className="text-xs text-dashboard-muted">{hint}</span>}
      </div>
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-4 sm:p-5 ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-dashboard-heading">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-dashboard-muted">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

/** Simple two-column table for a labelled breakdown. */
export function BreakdownTable({
  rows,
  valueHeader = "Count",
  format,
}: {
  rows: { label: string; value: number; sub?: string }[];
  valueHeader?: string;
  format: (n: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-dashboard-muted">
            <th className="pb-2 font-semibold">Name</th>
            <th className="pb-2 text-right font-semibold">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-dashboard-border/40">
              <td className="py-2 pr-3">
                <div className="font-medium capitalize text-dashboard-heading">
                  {r.label}
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-dashboard-bg">
                  <div
                    className="h-full rounded-full bg-brand-bg-primary"
                    style={{ width: `${(r.value / max) * 100}%` }}
                  />
                </div>
              </td>
              <td className="py-2 text-right align-top font-semibold tabular-nums text-dashboard-heading">
                {format(r.value)}
                {r.sub && (
                  <div className="text-xs font-normal text-dashboard-muted">
                    {r.sub}
                  </div>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={2} className="py-6 text-center text-dashboard-muted">
                No data in this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
