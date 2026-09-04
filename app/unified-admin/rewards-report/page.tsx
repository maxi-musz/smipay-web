"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarRange,
  Download,
  FileSpreadsheet,
  Loader2,
  CheckSquare,
  Square,
} from "lucide-react";
import { adminRewardsReportApi } from "@/services/admin/rewards-report-api";
import type {
  MetricDefinition,
  RewardsReport,
} from "@/types/admin/rewards-report";
import { ReportResults } from "./_components/ReportResults";
import { PartnerLoadingManager } from "./_components/PartnerLoadingManager";

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

function monthStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

const DEFAULT_METRICS = [
  "cashback_earned",
  "first_tx_rewards",
  "referral_bonuses",
  "user_deposits",
];

export default function RewardsReportPage() {
  const [catalog, setCatalog] = useState<MetricDefinition[]>([]);
  const [dateFrom, setDateFrom] = useState(isoDate(monthStart()));
  const [dateTo, setDateTo] = useState(isoDate(new Date()));
  const [selected, setSelected] = useState<string[]>(DEFAULT_METRICS);

  const [report, setReport] = useState<RewardsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminRewardsReportApi
      .getMetricsCatalog()
      .then(setCatalog)
      .catch((e) => setError((e as Error).message));
  }, []);

  const grouped = useMemo(() => {
    const g: Record<string, MetricDefinition[]> = {};
    for (const m of catalog) {
      (g[m.group] ??= []).push(m);
    }
    return g;
  }, [catalog]);

  const toggle = (key: string) =>
    setSelected((s) =>
      s.includes(key) ? s.filter((k) => k !== key) : [...s, key],
    );

  const setPreset = (from: Date, to: Date) => {
    setDateFrom(isoDate(from));
    setDateTo(isoDate(to));
  };

  const presets = useMemo(() => {
    const now = new Date();
    const lastMonthEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0),
    );
    const lastMonthStart = monthStart(lastMonthEnd);
    const last30 = new Date(now);
    last30.setUTCDate(last30.getUTCDate() - 30);
    return [
      { label: "This month", from: monthStart(now), to: now },
      { label: "Last month", from: lastMonthStart, to: lastMonthEnd },
      { label: "Last 30 days", from: last30, to: now },
      {
        label: "This year",
        from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)),
        to: now,
      },
    ];
  }, []);

  const canRun = selected.length > 0 && !!dateFrom && !!dateTo;
  const payload = { date_from: dateFrom, date_to: dateTo, metrics: selected };

  const generate = async () => {
    if (!canRun) return;
    setLoading(true);
    setError("");
    try {
      setReport(await adminRewardsReportApi.generate(payload));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const doExport = async (format: "csv" | "xlsx") => {
    if (!canRun) return;
    setExporting(format);
    setError("");
    try {
      await adminRewardsReportApi.exportFile(payload, format);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-dashboard-heading">
                Rewards &amp; Finance Report
              </h1>
              <p className="text-xs text-dashboard-muted">
                Pick a period and the figures you need, then export for the deck
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        {/* Controls */}
        <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-4 space-y-4">
          {/* Date range */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarRange className="h-4 w-4 text-brand-bg-primary" />
              <span className="text-sm font-semibold text-dashboard-heading">
                Reporting period
              </span>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-[11px] text-dashboard-muted mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 py-2 text-sm text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/30"
                />
              </div>
              <div>
                <label className="block text-[11px] text-dashboard-muted mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 py-2 text-sm text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/30"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setPreset(p.from, p.to)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-bg transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Metric checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-dashboard-heading">
                Include in report
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(catalog.map((c) => c.key))}
                  className="text-xs text-brand-bg-primary hover:underline"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="text-xs text-dashboard-muted hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
              {Object.entries(grouped).map(([group, items]) => (
                <div key={group} className="py-1">
                  <p className="text-[11px] uppercase tracking-wide text-dashboard-muted mb-1">
                    {group}
                  </p>
                  {items.map((mDef) => {
                    const on = selected.includes(mDef.key);
                    return (
                      <button
                        key={mDef.key}
                        type="button"
                        onClick={() => toggle(mDef.key)}
                        title={mDef.description}
                        className="flex items-start gap-2 w-full text-left py-1.5 group"
                      >
                        {on ? (
                          <CheckSquare className="h-4 w-4 mt-0.5 text-brand-bg-primary shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 mt-0.5 text-dashboard-muted shrink-0" />
                        )}
                        <span
                          className={`text-sm ${on ? "text-dashboard-heading font-medium" : "text-dashboard-muted"}`}
                        >
                          {mDef.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* VTpass loading manager (only when reconciliation selected) */}
          {selected.includes("vtpass_reconciliation") && (
            <PartnerLoadingManager
              partner="vtpass"
              dateFrom={dateFrom}
              dateTo={dateTo}
              onChanged={() => report && generate()}
            />
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={generate}
              disabled={!canRun || loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
              Generate report
            </button>
            <button
              type="button"
              onClick={() => doExport("xlsx")}
              disabled={!canRun || !!exporting}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition"
            >
              {exporting === "xlsx" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Excel
            </button>
            <button
              type="button"
              onClick={() => doExport("csv")}
              disabled={!canRun || !!exporting}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition"
            >
              {exporting === "csv" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              CSV
            </button>
            {!canRun && (
              <span className="text-xs text-dashboard-muted">
                Pick a period and at least one metric.
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {report ? (
          <ReportResults report={report} />
        ) : (
          !loading && (
            <div className="rounded-xl border border-dashed border-dashboard-border/60 bg-dashboard-surface py-16 text-center">
              <BarChart3 className="h-8 w-8 mx-auto text-dashboard-muted/60" />
              <p className="mt-3 text-sm text-dashboard-muted">
                Choose your period and metrics, then generate the report.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
