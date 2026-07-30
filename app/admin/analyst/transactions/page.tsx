"use client";

import { useCallback } from "react";
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

export default function AnalystTransactionsPage() {
  const fetcher = useCallback(
    (range: string) => analyticsApi.transactions({ range }),
    [],
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
