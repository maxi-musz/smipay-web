"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Download, RefreshCw } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import type {
  SmileAiActionAnalyticsRow,
  SmileAiCostBreakdown,
  SmileAiSparkline,
} from "@/types/admin/smileai";
import {
  Card,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  formatNumber,
  formatPercent,
  formatUsd,
} from "../_components/Helpers";
import Sparkline from "../_components/Sparkline";

type Range = "7d" | "30d";

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("7d");
  const [cost, setCost] = useState<SmileAiCostBreakdown | null>(null);
  const [convSpark, setConvSpark] = useState<SmileAiSparkline | null>(null);
  const [handoffSpark, setHandoffSpark] = useState<SmileAiSparkline | null>(
    null,
  );
  const [actionStats, setActionStats] = useState<
    SmileAiActionAnalyticsRow[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [c, cs, hs, a] = await Promise.all([
        smileAiApi.analytics.cost(range),
        smileAiApi.analytics.sparkline("conversations", range),
        smileAiApi.analytics.sparkline("handoffs", range),
        smileAiApi.analytics.actions("7d"),
      ]);
      setCost(c);
      setConvSpark(cs);
      setHandoffSpark(hs);
      setActionStats(a.items);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  const downloadCsv = () => {
    if (!cost) return;
    const rows = [
      "date,tokens_in,tokens_out,cost_usd",
      ...cost.by_day.map(
        (r) => `${r.date},${r.tokens_in},${r.tokens_out},${r.cost_usd}`,
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smileai-cost-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Analytics"
        description="Deflection, cost, and tool health"
        icon={<BarChart3 className="h-5 w-5" />}
        actions={
          <>
            <div className="flex items-center gap-0.5 bg-dashboard-bg rounded-lg p-0.5 border border-dashboard-border/60">
              {(["7d", "30d"] as Range[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    range === r
                      ? "bg-white text-dashboard-heading shadow-sm"
                      : "text-dashboard-muted hover:text-dashboard-heading"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={!cost}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={load}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </>
        }
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        <ErrorBanner error={error} onRetry={load} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                Conversations / day
              </h3>
              <span className="text-[11px] text-dashboard-muted">{range}</span>
            </div>
            {convSpark ? (
              <Sparkline
                values={convSpark.points.map((p) => p.value)}
                width={520}
                height={120}
              />
            ) : (
              <Skeleton height="6rem" />
            )}
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                Handoffs / day
              </h3>
              <span className="text-[11px] text-dashboard-muted">{range}</span>
            </div>
            {handoffSpark ? (
              <Sparkline
                values={handoffSpark.points.map((p) => p.value)}
                width={520}
                height={120}
                stroke="#ef4444"
                fill="rgba(239, 68, 68, 0.12)"
              />
            ) : (
              <Skeleton height="6rem" />
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted mb-2">
              Spend by provider
            </h3>
            {cost ? (
              cost.by_provider.length === 0 ? (
                <p className="text-xs text-dashboard-muted">No spend yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {cost.by_provider.map((r) => (
                    <div
                      key={r.key}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="text-dashboard-heading font-medium truncate">
                        {r.key}
                      </span>
                      <div className="flex items-center gap-3 text-dashboard-muted shrink-0">
                        <span>{formatNumber(r.tokens_in + r.tokens_out)} tok</span>
                        <span className="text-dashboard-heading font-semibold">
                          {formatUsd(r.cost_usd)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-dashboard-border/40 flex items-center justify-between text-sm">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">
                      {formatUsd(cost.total.cost_usd)}
                    </span>
                  </div>
                </div>
              )
            ) : (
              <Skeleton height="6rem" />
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted mb-2">
              Spend by category
            </h3>
            {cost ? (
              cost.by_category.length === 0 ? (
                <p className="text-xs text-dashboard-muted">No spend yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {cost.by_category.map((r) => (
                    <div
                      key={r.key}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="text-dashboard-heading font-medium">{r.key}</span>
                      <div className="flex items-center gap-3 text-dashboard-muted shrink-0">
                        <span>{formatNumber(r.tokens_in + r.tokens_out)} tok</span>
                        <span className="text-dashboard-heading font-semibold">
                          {formatUsd(r.cost_usd)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <Skeleton height="6rem" />
            )}
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="px-3 py-2 border-b border-dashboard-border/60">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
              Tool health (last 7 days)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-dashboard-bg">
                <tr className="text-left text-[11px] uppercase tracking-wider text-dashboard-muted">
                  <th className="px-3 py-2 font-medium">Action</th>
                  <th className="px-3 py-2 font-medium">Safety</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                  <th className="px-3 py-2 font-medium text-right">Success rate</th>
                  <th className="px-3 py-2 font-medium text-right">p50</th>
                  <th className="px-3 py-2 font-medium text-right">p95</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashboard-border/40">
                {actionStats === null ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-3 py-2">
                        <Skeleton height="1.5rem" />
                      </td>
                    </tr>
                  ))
                ) : actionStats.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-xs text-dashboard-muted"
                    >
                      No executions yet.
                    </td>
                  </tr>
                ) : (
                  actionStats.map((r) => (
                    <tr key={r.action_id}>
                      <td className="px-3 py-2">
                        <p className="text-xs font-medium text-dashboard-heading">
                          {r.display_name}
                        </p>
                        <p className="text-[11px] text-dashboard-muted font-mono">
                          {r.name}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-xs">{r.safety}</td>
                      <td className="px-3 py-2 text-right text-xs">
                        {formatNumber(r.total)}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-medium">
                        {formatPercent(r.success_rate)}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-dashboard-muted">
                        {r.p50_ms ? `${r.p50_ms}ms` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-dashboard-muted">
                        {r.p95_ms ? `${r.p95_ms}ms` : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
