"use client";

import { Wallet, TrendingUp, Percent, HandCoins, PiggyBank } from "lucide-react";

import { analyticsApi } from "@/services/admin/analytics-api";
import { SectionShell } from "../_components/section";
import { useAnalytics } from "../_components/use-analytics";
import { KpiCard, ChartCard } from "../_components/cards";
import { TrendChart, CategoryBars } from "../_components/charts";
import { BRAND, PALETTE, fmtMoney, fmtMoneyCompact } from "../_components/format";
import { METRIC_HELP } from "../_components/metric-glossary";

export default function AnalystRevenuePage() {
  const { period, setPreset, setCustom, data, loading, error, retry } = useAnalytics(
    "revenue",
    (q) => analyticsApi.revenue(q),
  );
  const k = data?.kpis;

  return (
    <SectionShell
      title="Revenue"
      subtitle="Margin, commission & payouts"
      icon={Wallet}
      section="revenue"
      period={period}
      onPreset={setPreset}
      onCustom={setCustom}
      rangeMeta={data?.range}
      loading={loading}
      error={error}
      onRetry={retry}
      exports={
        data
          ? [
              { name: "revenue-trend", rows: data.trend },
              { name: "revenue-by-service", rows: data.by_type },
            ]
          : []
      }
    >
      {data && k && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <KpiCard
              title="Gross revenue"
              value={fmtMoney(k.gross_revenue)}
              delta={k.gross_delta_pct}
              icon={TrendingUp}
              tooltip={METRIC_HELP.grossRevenue}
            />
            <KpiCard title="Markup" value={fmtMoney(k.markup_revenue)} icon={Percent} tooltip={METRIC_HELP.markup} />
            <KpiCard title="Commission" value={fmtMoney(k.commission_revenue)} icon={Percent} tooltip={METRIC_HELP.commission} />
            <KpiCard title="Funded" value={fmtMoney(k.funded_amount)} icon={Wallet} tooltip={METRIC_HELP.funded} />
            <KpiCard title="Payouts" value={fmtMoney(k.payouts)} icon={HandCoins} deltaGoodWhenUp={false} tooltip={METRIC_HELP.payouts} />
            <KpiCard title="Net revenue" value={fmtMoney(k.net_revenue)} icon={PiggyBank} tooltip={METRIC_HELP.netRevenue} />
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
            <ChartCard title="Revenue by service" subtitle="Markup earned per service" className="lg:col-span-2" tooltip={METRIC_HELP.revenueByService}>
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
