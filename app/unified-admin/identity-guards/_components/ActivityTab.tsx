"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { RefreshCw, Search, X } from "lucide-react";
import { adminIdentityGuardsApi } from "@/services/admin/identity-guards-api";
import {
  GUARD_FIELDS,
  type ActivityResponse,
  type GuardField,
  type GuardFieldInfo,
  type GuardSurface,
  type GuardSurfaceInfo,
  type GuardVerdict,
  type IdentityGuardRule,
} from "@/types/admin/identity-guards";
import {
  Banner,
  FIELD_META,
  Pagination,
  VerdictBadge,
  errorMessage,
  fieldClass,
  fieldInfo,
  fmtDateTime,
  fmtNumber,
  inputClass,
  secondaryButtonClass,
  surfaceLabel,
} from "./shared";

const PAGE_SIZES = [25, 50, 100] as const;
type VerdictFilter = "" | Exclude<GuardVerdict, "pass">;

export function ActivityTab({
  fields,
  rules,
  surfaces,
}: {
  fields?: GuardFieldInfo[];
  rules: IdentityGuardRule[];
  surfaces?: GuardSurfaceInfo[];
}) {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [field, setField] = useState<GuardField | "">("");
  const [verdict, setVerdict] = useState<VerdictFilter>("");
  const [surface, setSurface] = useState<GuardSurface | "">("");
  const [sourceInput, setSourceInput] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadSeq = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setSource(sourceInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [sourceInput]);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setError(null);
    try {
      const next = await adminIdentityGuardsApi.getActivity({
        page,
        limit,
        field: field || undefined,
        verdict: verdict || undefined,
        source: source || undefined,
        surface: surface || undefined,
      });
      if (seq === loadSeq.current) setData(next);
    } catch (e) {
      if (seq === loadSeq.current) setError(errorMessage(e, "Could not load activity"));
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [page, limit, field, verdict, source, surface]);

  useEffect(() => {
    void load();
  }, [load]);

  const ruleLabel = useMemo(() => {
    const map = new Map(rules.map((r) => [r.key, r.label]));
    return (key: string) => map.get(key) ?? key;
  }, [rules]);

  const pickField = (next: GuardField | "") => {
    setField(next);
    setPage(1);
  };

  const pickSurface = (next: GuardSurface | "") => {
    setSurface(next);
    setPage(1);
  };

  const surfaceOptions: GuardSurface[] = (surfaces ?? []).map((s) => s.key);
  if (surface && !surfaceOptions.includes(surface)) surfaceOptions.push(surface);

  const summary = data?.summary;
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const start = total === 0 ? 0 : ((meta?.page ?? page) - 1) * (meta?.limit ?? limit) + 1;
  const end = Math.min((meta?.page ?? page) * (meta?.limit ?? limit), total);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-dashboard-heading">Last 7 days</p>
            <span className="text-[11px] text-dashboard-muted">click a field to filter</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GUARD_FIELDS.map((f) => {
              const s = summary?.by_field?.[f];
              const Icon = FIELD_META[f].icon;
              const selected = field === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => pickField(selected ? "" : f)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    selected
                      ? "border-brand-bg-primary bg-brand-bg-primary/5"
                      : "border-dashboard-border/60 hover:bg-dashboard-bg/60"
                  }`}
                >
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-dashboard-heading">
                    <Icon className="h-3.5 w-3.5 text-dashboard-muted" />
                    {fieldInfo(fields, f).label}
                  </p>
                  {s ? (
                    <dl className="mt-1.5 space-y-0.5 text-[11px]">
                      <Stat label="Blocked" value={s.block} tone="text-red-700" />
                      <Stat label="Would block" value={s.would_block} tone="text-violet-700" />
                      <Stat label="Flagged" value={s.flag} tone="text-amber-700" />
                    </dl>
                  ) : loading ? (
                    <div className="mt-2 h-10 animate-pulse rounded bg-dashboard-bg" />
                  ) : (
                    <p className="mt-1.5 text-[11px] text-dashboard-muted">Not available</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-4">
          <p className="text-sm font-semibold text-dashboard-heading">Top flagged email domains</p>
          <p className="text-[11px] text-dashboard-muted">Last 7 days, any verdict</p>
          {summary && summary.top_email_domains.length > 0 ? (
            <ol className="mt-2 space-y-1">
              {summary.top_email_domains.slice(0, 8).map((d) => (
                <li key={d.domain} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-mono text-dashboard-heading">{d.domain}</span>
                  <span className="shrink-0 tabular-nums text-dashboard-muted">
                    {fmtNumber(d.count)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-xs text-dashboard-muted">
              {summary
                ? "No email hits this week."
                : loading
                  ? "Loading…"
                  : "Not available"}
            </p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
        <div className="space-y-3 border-b border-dashboard-border/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-dashboard-heading">Recent hits</p>
            <button type="button" onClick={load} disabled={loading} className={secondaryButtonClass}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={field}
              onChange={(e) => pickField(e.target.value as GuardField | "")}
              aria-label="Field"
              className={`${fieldClass} py-1.5 text-xs`}
            >
              <option value="">All fields</option>
              {GUARD_FIELDS.map((f) => (
                <option key={f} value={f}>
                  {fieldInfo(fields, f).label}
                </option>
              ))}
            </select>
            <select
              value={verdict}
              onChange={(e) => {
                setVerdict(e.target.value as VerdictFilter);
                setPage(1);
              }}
              aria-label="Verdict"
              className={`${fieldClass} py-1.5 text-xs`}
            >
              <option value="">All verdicts</option>
              <option value="block">Blocked</option>
              <option value="would_block">Would block</option>
              <option value="flag">Flagged</option>
            </select>
            {surfaceOptions.length > 0 && (
              <select
                value={surface}
                onChange={(e) => pickSurface(e.target.value as GuardSurface | "")}
                aria-label="Surface"
                className={`${fieldClass} py-1.5 text-xs`}
              >
                <option value="">All surfaces</option>
                {surfaceOptions.map((key) => (
                  <option key={key} value={key}>
                    {surfaceLabel(surfaces, key)}
                  </option>
                ))}
              </select>
            )}
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dashboard-muted" />
              <input
                value={sourceInput}
                onChange={(e) => {
                  setSourceInput(e.target.value);
                  setPage(1);
                }}
                placeholder="Source, e.g. new_auth.request_phone_verification"
                className={`${inputClass} py-1.5 pl-8 pr-7 font-mono text-xs`}
              />
              {sourceInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSourceInput("");
                    setPage(1);
                  }}
                  aria-label="Clear source"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5 text-dashboard-muted hover:text-dashboard-heading" />
                </button>
              )}
            </div>
            <label className="inline-flex items-center gap-1.5 text-xs text-dashboard-muted">
              Per page
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className={`${fieldClass} py-1.5 text-xs`}
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

        {error && (
          <div className="px-4 pt-3">
            <Banner tone="error">{error}</Banner>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-dashboard-border/60 bg-dashboard-bg">
              <tr className="text-left text-[11px] uppercase tracking-wider text-dashboard-muted">
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Time</th>
                <th className="px-4 py-2.5 font-medium">Field</th>
                <th className="px-4 py-2.5 font-medium">Verdict</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Surface</th>
                <th className="px-4 py-2.5 font-medium">Source</th>
                <th className="min-w-[180px] px-4 py-2.5 font-medium">Rules</th>
                <th className="px-4 py-2.5 font-medium">Value</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Who</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashboard-border/40">
              {loading && !data ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-dashboard-bg" />
                    </td>
                  </tr>
                ))
              ) : data && data.items.length > 0 ? (
                data.items.map((item) => (
                  <tr key={item.id} className="align-top hover:bg-dashboard-bg/60">
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-dashboard-muted">
                      {fmtDateTime(item.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs font-medium text-dashboard-heading">
                      {item.field ? fieldInfo(fields, item.field).label : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {item.verdict ? <VerdictBadge verdict={item.verdict} /> : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-dashboard-heading">
                      {item.surface ? (
                        <button
                          type="button"
                          onClick={() => pickSurface(item.surface as GuardSurface)}
                          title="Filter by this surface"
                          className="text-left hover:underline"
                        >
                          {surfaceLabel(surfaces, item.surface)}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-dashboard-muted">
                      {item.source ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSourceInput(item.source ?? "");
                            setPage(1);
                          }}
                          title="Filter by this source"
                          className="text-left hover:text-dashboard-heading hover:underline"
                        >
                          {item.source}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {item.rule_keys.length > 0
                          ? item.rule_keys.map((k) => (
                              <span
                                key={k}
                                title={k}
                                className="rounded bg-dashboard-bg px-1.5 py-0.5 text-[10px] text-dashboard-heading"
                              >
                                {ruleLabel(k)}
                              </span>
                            ))
                          : "—"}
                      </div>
                    </td>
                    <td className="max-w-[220px] break-all px-4 py-2.5 font-mono text-xs text-dashboard-heading">
                      {item.value ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-dashboard-muted">
                      <div className="space-y-0.5">
                        {item.user_id && (
                          <Link
                            href={`/unified-admin/users/${encodeURIComponent(item.user_id)}`}
                            className="block font-medium text-brand-bg-primary hover:underline"
                          >
                            View user
                          </Link>
                        )}
                        {item.phone_number && <p className="font-mono">{item.phone_number}</p>}
                        {item.ip_address && <p>IP {item.ip_address}</p>}
                        {item.device_id && (
                          <p title={item.device_id}>Device {item.device_id.slice(0, 10)}…</p>
                        )}
                        {!item.user_id &&
                          !item.phone_number &&
                          !item.ip_address &&
                          !item.device_id &&
                          "—"}
                      </div>
                    </td>
                  </tr>
                ))
              ) : error && !data ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <p className="text-sm font-medium text-dashboard-heading">
                      Couldn&apos;t load hits
                    </p>
                    <p className="mt-1 text-xs text-dashboard-muted">
                      Use Refresh to try again.
                    </p>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <p className="text-sm font-medium text-dashboard-heading">Nothing here yet</p>
                    <p className="mt-1 text-xs text-dashboard-muted">
                      Hits appear as users submit numbers, emails, names and BVNs,
                      and when stored details are checked before a provider call.
                      Try another filter if you expected something.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashboard-border/40 px-4 py-3">
          <span className="text-xs text-dashboard-muted">
            {total === 0
              ? "0 results"
              : `${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()}`}
          </span>
          <Pagination
            page={meta?.page ?? page}
            totalPages={meta?.pages ?? 1}
            disabled={loading}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-dashboard-muted">{label}</dt>
      <dd className={`font-semibold tabular-nums ${value > 0 ? tone : "text-dashboard-muted"}`}>
        {fmtNumber(value)}
      </dd>
    </div>
  );
}
