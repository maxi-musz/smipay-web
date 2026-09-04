"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { adminSecurityApi } from "@/services/admin/security-api";
import type {
  SecurityEvent,
  SecurityEventSummaryRow,
  SecurityEventsResponse,
} from "@/types/admin/security";

const WINDOWS = [
  { days: 1, label: "24 hours" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
] as const;

const PAGE_SIZES = [10, 25, 50, 100] as const;

type StatusFilter = "all" | "blocked" | "allowed";

const fmt = (v: string) =>
  new Date(v).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

/**
 * Monitor log — what tripped, and whether it actually blocked.
 * Reads its own data; stays outside the page draft/save cycle.
 */
export function MonitorLogPanel({ enforcing }: { enforcing: boolean }) {
  const [data, setData] = useState<SecurityEventsResponse["data"] | null>(null);
  const [days, setDays] = useState(7);
  const [rule, setRule] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(25);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminSecurityApi.listEvents({
        days,
        rule: rule ?? undefined,
        page,
        limit,
        search: search || undefined,
        blocked:
          statusFilter === "blocked"
            ? true
            : statusFilter === "allowed"
              ? false
              : undefined,
      });
      setData(res.data);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [days, rule, page, limit, search, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const summaryByRule = useMemo(() => {
    const map = new Map<string, SecurityEventSummaryRow>();
    for (const row of data?.summary ?? []) map.set(row.rule, row);
    return map;
  }, [data?.summary]);

  const selectRule = (next: string | null) => {
    setRule(next);
    setPage(1);
  };

  const selectDays = (next: number) => {
    setDays(next);
    setPage(1);
  };

  const selectStatus = (next: StatusFilter) => {
    setStatusFilter(next);
    setPage(1);
  };

  const selectLimit = (next: number) => {
    setLimit(next);
    setPage(1);
  };

  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;
  const currentPage = data?.page ?? page;
  const pageLimit = data?.limit ?? limit;
  const start = total === 0 ? 0 : (currentPage - 1) * pageLimit + 1;
  const end = Math.min(currentPage * pageLimit, total);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-dashboard-heading">
              Monitor log
            </p>
            <p className="text-xs text-dashboard-muted mt-0.5">
              Every time a rule tripped, and whether it actually blocked.
              {!enforcing &&
                " While you're in Monitor only, everything here was allowed through."}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {WINDOWS.map((w) => (
              <button
                key={w.days}
                type="button"
                onClick={() => selectDays(w.days)}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${
                  days === w.days
                    ? "bg-brand-bg-primary text-white"
                    : "text-dashboard-muted hover:bg-dashboard-bg"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {err && (
          <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {err}
          </p>
        )}

        {loading && !data ? (
          <div className="mt-4 h-20 rounded-lg bg-dashboard-bg animate-pulse" />
        ) : data && data.summary.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {data.summary.map((row) => {
              const selected = rule === row.rule;
              return (
                <button
                  key={row.rule}
                  type="button"
                  onClick={() => selectRule(selected ? null : row.rule)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    selected
                      ? "border-brand-bg-primary bg-brand-bg-primary/5"
                      : "border-dashboard-border/60 hover:border-dashboard-border hover:bg-dashboard-bg/60"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold truncate ${
                      selected
                        ? "text-brand-bg-primary"
                        : "text-dashboard-heading"
                    }`}
                  >
                    {row.label}
                  </p>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <p className="text-[11px] text-dashboard-muted">
                      {row.last_seen ? `Last ${fmt(row.last_seen)}` : "No recent"}
                    </p>
                    <span className="text-lg font-bold text-dashboard-heading tabular-nums">
                      {row.count.toLocaleString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-dashboard-border/60 px-4 py-6 text-center">
            <p className="text-sm text-dashboard-heading font-medium">
              Nothing tripped in this window
            </p>
            <p className="text-xs text-dashboard-muted mt-1">
              Rules record here automatically once they are wired into a flow.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-dashboard-border/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-dashboard-heading">
              Event log
            </p>
            <span className="text-[11px] text-dashboard-muted">
              {total.toLocaleString()} event{total === 1 ? "" : "s"}
              {rule ? " in category" : ""}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryTab
              active={!rule}
              label="All categories"
              count={data?.summary.reduce((s, r) => s + r.count, 0)}
              onClick={() => selectRule(null)}
            />
            {(data?.summary ?? []).map((row) => (
              <CategoryTab
                key={row.rule}
                active={rule === row.rule}
                label={row.label}
                count={row.count}
                onClick={() => selectRule(row.rule)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dashboard-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                placeholder="Search description, IP, or device…"
                className="w-full pl-9 pr-8 py-2 text-xs bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5 text-dashboard-muted hover:text-dashboard-heading" />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => selectStatus(e.target.value as StatusFilter)}
              className="text-xs border border-dashboard-border/60 rounded-lg px-2.5 py-2 bg-dashboard-bg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
            >
              <option value="all">All outcomes</option>
              <option value="blocked">Blocked only</option>
              <option value="allowed">Allowed only</option>
            </select>

            <label className="inline-flex items-center gap-1.5 text-xs text-dashboard-muted">
              <span className="whitespace-nowrap">Per page</span>
              <select
                value={limit}
                onChange={(e) => selectLimit(Number(e.target.value))}
                className="border border-dashboard-border/60 rounded-lg px-2 py-1.5 bg-dashboard-bg text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-dashboard-bg border-b border-dashboard-border/60">
              <tr className="text-left text-[11px] uppercase tracking-wider text-dashboard-muted">
                <th className="px-4 py-2.5 font-medium whitespace-nowrap">Time</th>
                <th className="px-4 py-2.5 font-medium whitespace-nowrap">Rule</th>
                <th className="px-4 py-2.5 font-medium min-w-[280px]">Description</th>
                <th className="px-4 py-2.5 font-medium whitespace-nowrap">Context</th>
                <th className="px-4 py-2.5 font-medium whitespace-nowrap text-right">
                  Outcome
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashboard-border/40">
              {loading && !data ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-4 rounded bg-dashboard-bg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : data && data.events.length > 0 ? (
                data.events.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    ruleLabel={summaryByRule.get(event.rule)?.label ?? event.rule}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <p className="text-sm font-medium text-dashboard-heading">
                      No events match
                    </p>
                    <p className="text-xs text-dashboard-muted mt-1">
                      Try another category, widen the time window, or clear your filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-dashboard-border/40 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-dashboard-muted">
            {total === 0
              ? "0 results"
              : `${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()}`}
          </span>
          <MonitorPagination
            page={currentPage}
            totalPages={totalPages}
            disabled={loading}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}

function CategoryTab({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
        active
          ? "bg-brand-bg-primary text-white"
          : "bg-dashboard-bg border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading"
      }`}
    >
      {label}
      {typeof count === "number" && (
        <span
          className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${
            active ? "bg-white/20 text-white" : "bg-dashboard-surface text-dashboard-muted"
          }`}
        >
          {count.toLocaleString()}
        </span>
      )}
    </button>
  );
}

function EventRow({
  event,
  ruleLabel,
}: {
  event: SecurityEvent;
  ruleLabel: string;
}) {
  const blocked = event.metadata?.blocked === true;
  const context = [
    event.ip_address ? `IP ${event.ip_address}` : null,
    event.device_id ? `Device ${event.device_id.slice(0, 12)}…` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <tr className="hover:bg-dashboard-bg/60 transition-colors">
      <td className="px-4 py-3 text-xs text-dashboard-muted whitespace-nowrap align-top">
        {fmt(event.createdAt)}
      </td>
      <td className="px-4 py-3 text-xs font-medium text-dashboard-heading whitespace-nowrap align-top">
        {ruleLabel}
      </td>
      <td className="px-4 py-3 text-xs text-dashboard-heading leading-relaxed align-top">
        {event.description}
      </td>
      <td className="px-4 py-3 text-[11px] text-dashboard-muted align-top">
        {context || "—"}
      </td>
      <td className="px-4 py-3 text-right align-top">
        <span
          className={`inline-flex text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
            blocked
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {blocked ? "Blocked" : "Allowed"}
        </span>
      </td>
    </tr>
  );
}

function MonitorPagination({
  page,
  totalPages,
  disabled,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return (
      <span className="text-xs text-dashboard-muted">
        Page {page} of {totalPages}
      </span>
    );
  }

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page <= 1}
        className="p-1.5 rounded-lg border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading disabled:opacity-30 transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="px-1 text-dashboard-muted text-xs">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            disabled={disabled}
            className={`min-w-[28px] h-7 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${
              p === page
                ? "bg-brand-bg-primary text-white"
                : "text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-bg"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= totalPages}
        className="p-1.5 rounded-lg border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading disabled:opacity-30 transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
