"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { FailedLoginWatchlistRow } from "@/types/admin/analytics";
import { fmtDelta, fmtInt } from "./format";
import { HelpTooltip } from "./help-tooltip";

export function KpiCard({
  title,
  value,
  delta,
  deltaGoodWhenUp = true,
  icon: Icon,
  hint,
  tooltip,
}: {
  title: string;
  value: string;
  delta?: number;
  deltaGoodWhenUp?: boolean;
  icon?: LucideIcon;
  hint?: string;
  tooltip?: string;
}) {
  const up = (delta ?? 0) >= 0;
  const good = up === deltaGoodWhenUp;
  return (
    <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <p className="text-xs font-medium text-dashboard-muted">{title}</p>
          {tooltip && <HelpTooltip text={tooltip} />}
        </div>
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
  tooltip,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  tooltip?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-4 sm:p-5 ${className}`}
    >
      <div className="mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-dashboard-heading">{title}</h3>
          {tooltip && <HelpTooltip text={tooltip} />}
        </div>
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

const WATCHLIST_PAGE_SIZE = 10;

/** Paginated failed-login watchlist with masked user identity. */
export function FailedLoginWatchlist({
  rows,
}: {
  rows: FailedLoginWatchlistRow[];
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(rows.length / WATCHLIST_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const slice = rows.slice(
    safePage * WATCHLIST_PAGE_SIZE,
    safePage * WATCHLIST_PAGE_SIZE + WATCHLIST_PAGE_SIZE,
  );

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[720px] table-fixed border-separate border-spacing-0 text-sm">
        <colgroup>
          <col style={{ width: "28%" }} />
          <col style={{ width: "11%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "19%" }} />
        </colgroup>
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-dashboard-muted">
            <th className="pb-2 pr-3 font-semibold">User</th>
            <th className="px-3 pb-2 text-right font-semibold">Failures</th>
            <th className="px-3 pb-2 font-semibold">Last IP</th>
            <th className="px-3 pb-2 font-semibold">Location</th>
            <th className="pb-2 pl-3 font-semibold">Reason</th>
          </tr>
        </thead>
        <tbody>
          {slice.map((r, i) => (
            <tr
              key={`${r.label}-${r.last_ip ?? i}`}
              className="border-t border-dashboard-border/40"
            >
              <td className="py-2.5 pr-3 align-top">
                <div
                  className="truncate font-medium text-dashboard-heading"
                  title={r.label}
                >
                  {r.label}
                </div>
                {(r.display_name || r.smipay_tag) && (
                  <div className="truncate text-xs text-dashboard-muted">
                    {[r.display_name, r.smipay_tag ? `@${r.smipay_tag}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                )}
              </td>
              <td className="px-3 py-2.5 text-right align-top font-semibold tabular-nums text-dashboard-heading">
                {fmtInt(r.failure_count)}
              </td>
              <td className="px-3 py-2.5 align-top font-mono text-xs text-dashboard-muted">
                {r.last_ip ?? "—"}
              </td>
              <td className="px-3 py-2.5 align-top text-xs text-dashboard-muted">
                <span className="line-clamp-2">
                  {[r.geo, r.platform].filter(Boolean).join(" · ") || "—"}
                </span>
              </td>
              <td className="py-2.5 pl-3 align-top text-xs capitalize text-dashboard-muted">
                {r.top_reason || "—"}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-dashboard-muted">
                No failed logins in this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {rows.length > WATCHLIST_PAGE_SIZE && (
        <div className="mt-3 flex items-center justify-between border-t border-dashboard-border/40 pt-3 text-xs text-dashboard-muted">
          <span>
            {safePage * WATCHLIST_PAGE_SIZE + 1}–
            {Math.min((safePage + 1) * WATCHLIST_PAGE_SIZE, rows.length)} of{" "}
            {rows.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-md border border-dashboard-border/60 px-2 py-1 font-semibold text-dashboard-heading disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded-md border border-dashboard-border/60 px-2 py-1 font-semibold text-dashboard-heading disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
