"use client";

import { useCallback, useState } from "react";
import { ArrowLeftRight, Coins, Gauge, TrendingUp } from "lucide-react";

import { analyticsApi } from "@/services/admin/analytics-api";
import { SectionShell } from "../_components/section";
import { useAnalytics } from "../_components/use-analytics";
import { KpiCard, ChartCard, BreakdownTable } from "../_components/cards";
import { TrendChart, CategoryBars, CategoryDonut } from "../_components/charts";
import {
  PALETTE,
  fmtInt,
  fmtIntCompact,
  fmtMoney,
  fmtMoneyCompact,
} from "../_components/format";

const TX_TYPES = [
  "transfer",
  "deposit",
  "airtime",
  "data",
  "cable",
  "electricity",
  "education",
  "betting",
  "referral_bonus",
  "first_tx_bonus",
];

export default function AnalystTransactionsPage() {
  const [txType, setTxType] = useState("");
  // Fetcher depends on txType, so changing it re-fetches (via the hook's load).
  const fetcher = useCallback(
    (range: string) =>
      analyticsApi.transactions({ range, type: txType || undefined }),
    [txType],
  );
  const { range, setRange, data, loading, error, retry } = useAnalytics(fetcher);
  const k = data?.kpis;

  return (
    <SectionShell
      title="Transactions"
      subtitle="Volume, mix & reliability"
      icon={ArrowLeftRight}
      range={range}
      onRangeChange={setRange}
      loading={loading}
      error={error}
      onRetry={retry}
      headerExtra={
        <select
          value={txType}
          onChange={(e) => setTxType(e.target.value)}
          className="rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-2.5 py-1.5 text-xs font-semibold text-dashboard-heading"
        >
          <option value="">All types</option>
          {TX_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      }
      exports={
        data
          ? [
              { name: "transactions-trend", rows: data.trend },
              { name: "by-type", rows: data.by_type },
              { name: "by-status", rows: data.by_status },
              { name: "by-provider", rows: data.by_provider },
              { name: "by-channel", rows: data.by_channel },
            ]
          : []
      }
    >
      {data && k && (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <KpiCard title="Transactions" value={fmtInt(k.count)} icon={ArrowLeftRight} />
            <KpiCard title="Volume" value={fmtMoney(k.volume)} icon={Coins} />
            <KpiCard title="Avg value" value={fmtMoney(k.avg_value)} icon={Gauge} />
            <KpiCard title="Markup revenue" value={fmtMoney(k.markup_revenue)} icon={TrendingUp} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="Volume trend" subtitle="Value per day">
              <TrendChart
                data={data.trend}
                series={[
                  { key: "transactions_volume", label: "Volume", color: PALETTE[1] },
                ]}
                yTickFormatter={fmtMoneyCompact}
                valueFormatter={fmtMoney}
              />
            </ChartCard>
            <ChartCard title="Success vs failed" subtitle="Count per day">
              <TrendChart
                data={data.trend}
                series={[
                  { key: "success", label: "Success", color: PALETTE[2] },
                  { key: "failed", label: "Failed", color: PALETTE[7] },
                ]}
                yTickFormatter={fmtIntCompact}
                valueFormatter={fmtInt}
              />
            </ChartCard>

            <ChartCard title="By type" subtitle="Volume by service">
              <CategoryBars
                data={data.by_type.map((t) => ({ label: t.label, value: t.volume }))}
                valueFormatter={fmtMoney}
              />
            </ChartCard>
            <ChartCard title="By status">
              <CategoryDonut
                data={data.by_status.map((c) => ({ label: c.label, value: c.count }))}
              />
            </ChartCard>
            <ChartCard title="Top providers" subtitle="By transaction count">
              <BreakdownTable
                rows={data.by_provider.map((p) => ({
                  label: p.label,
                  value: p.count,
                  sub: fmtMoney(p.volume),
                }))}
                valueHeader="Count"
                format={fmtInt}
              />
            </ChartCard>
            <ChartCard title="Payment channel">
              <CategoryDonut
                data={data.by_channel.map((c) => ({ label: c.label, value: c.count }))}
              />
            </ChartCard>
          </div>
        </>
      )}
    </SectionShell>
  );
}
