"use client";

import { useCallback } from "react";
import {
  Users,
  UserPlus,
  Activity,
  ArrowLeftRight,
  CheckCircle2,
  Wallet,
  BarChart3,
} from "lucide-react";

import { analyticsApi } from "@/services/admin/analytics-api";
import { SectionShell } from "./_components/section";
import { useAnalytics } from "./_components/use-analytics";
import { KpiCard, ChartCard } from "./_components/cards";
import { TrendChart } from "./_components/charts";
import {
  BRAND,
  PALETTE,
  fmtInt,
  fmtIntCompact,
  fmtMoney,
  fmtMoneyCompact,
  fmtRate,
} from "./_components/format";

export default function AnalystOverviewPage() {
  const fetcher = useCallback(
    (range: string) => analyticsApi.overview({ range }),
    [],
  );
  const { range, setRange, data, loading, error, retry } = useAnalytics(fetcher);

  const k = data?.kpis;

  return (
    <SectionShell
      title="Overview"
      subtitle="Platform-wide KPIs and trends"
      icon={BarChart3}
      range={range}
      onRangeChange={setRange}
      loading={loading}
      error={error}
      onRetry={retry}
    >
      {k && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <KpiCard title="Total users" value={fmtInt(k.total_users)} icon={Users} />
            <KpiCard
              title="New users"
              value={fmtInt(k.new_users)}
              delta={k.new_users_delta_pct}
              icon={UserPlus}
            />
            <KpiCard title="Active users" value={fmtInt(k.active_users)} icon={Activity} />
            <KpiCard
              title="Tx volume"
              value={fmtMoney(k.transactions_volume)}
              delta={k.volume_delta_pct}
              icon={ArrowLeftRight}
            />
            <KpiCard
              title="Success rate"
              value={fmtRate(k.success_rate)}
              icon={CheckCircle2}
            />
            <KpiCard
              title="Revenue"
              value={fmtMoney(k.revenue)}
              delta={k.revenue_delta_pct}
              icon={Wallet}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="New users" subtitle="Signups per day">
              <TrendChart
                data={data.trend}
                series={[{ key: "new_users", label: "New users", color: BRAND }]}
                yTickFormatter={fmtIntCompact}
                valueFormatter={fmtInt}
              />
            </ChartCard>
            <ChartCard title="Transaction volume" subtitle="Value processed per day">
              <TrendChart
                data={data.trend}
                series={[
                  { key: "transactions_volume", label: "Volume", color: PALETTE[1] },
                ]}
                yTickFormatter={fmtMoneyCompact}
                valueFormatter={fmtMoney}
              />
            </ChartCard>
            <ChartCard
              title="Revenue"
              subtitle="Markup + commission per day"
              className="lg:col-span-2"
            >
              <TrendChart
                data={data.trend}
                series={[{ key: "revenue", label: "Revenue", color: PALETTE[2] }]}
                yTickFormatter={fmtMoneyCompact}
                valueFormatter={fmtMoney}
                height={240}
              />
            </ChartCard>
          </div>
        </>
      )}
    </SectionShell>
  );
}
