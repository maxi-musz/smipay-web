"use client";

import { useCallback } from "react";
import { Wallet, TrendingUp, Percent, HandCoins, PiggyBank } from "lucide-react";

import { analyticsApi } from "@/services/admin/analytics-api";
import { SectionShell } from "../_components/section";
import { useAnalytics } from "../_components/use-analytics";
import { KpiCard, ChartCard } from "../_components/cards";
import { TrendChart, CategoryBars } from "../_components/charts";
import { BRAND, PALETTE, fmtMoney, fmtMoneyCompact } from "../_components/format";

export default function AnalystRevenuePage() {
  const fetcher = useCallback(
    (range: string) => analyticsApi.revenue({ range }),
    [],
  );
  const { range, setRange, data, loading, error, retry } = useAnalytics(fetcher);
  const k = data?.kpis;

  return (
    <SectionShell
      title="Revenue"
      subtitle="Margin, commission & payouts"
      icon={Wallet}
      range={range}
      onRangeChange={setRange}
      loading={loading}
      error={error}
      onRetry={retry}
    >
      {data && k && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <KpiCard
              title="Gross revenue"
              value={fmtMoney(k.gross_revenue)}
              delta={k.gross_delta_pct}
              icon={TrendingUp}
            />
            <KpiCard title="Markup" value={fmtMoney(k.markup_revenue)} icon={Percent} />
            <KpiCard title="Commission" value={fmtMoney(k.commission_revenue)} icon={Percent} />
            <KpiCard title="Funded" value={fmtMoney(k.funded_amount)} icon={Wallet} />
            <KpiCard title="Payouts" value={fmtMoney(k.payouts)} icon={HandCoins} deltaGoodWhenUp={false} />
            <KpiCard title="Net revenue" value={fmtMoney(k.net_revenue)} icon={PiggyBank} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="Revenue trend" subtitle="Markup vs commission per day" className="lg:col-span-2">
              <TrendChart
                data={data.trend}
                series={[
                  { key: "markup", label: "Markup", color: BRAND },
                  { key: "commission", label: "Commission", color: PALETTE[1] },
                ]}
                yTickFormatter={fmtMoneyCompact}
                valueFormatter={fmtMoney}
                height={260}
              />
            </ChartCard>
            <ChartCard title="Revenue by service" subtitle="Markup earned per service" className="lg:col-span-2">
              <CategoryBars
                data={data.by_type.map((t) => ({ label: t.label, value: t.revenue }))}
                valueFormatter={fmtMoney}
                height={Math.max(200, data.by_type.length * 40)}
              />
            </ChartCard>
          </div>
        </>
      )}
    </SectionShell>
  );
}
