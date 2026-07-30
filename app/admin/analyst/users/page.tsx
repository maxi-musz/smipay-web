"use client";

import { useCallback } from "react";
import { Users, UserPlus, Activity, Repeat } from "lucide-react";

import { analyticsApi } from "@/services/admin/analytics-api";
import { SectionShell } from "../_components/section";
import { useAnalytics } from "../_components/use-analytics";
import { KpiCard, ChartCard, BreakdownTable } from "../_components/cards";
import { TrendChart, CategoryDonut } from "../_components/charts";
import {
  BRAND,
  PALETTE,
  fmtInt,
  fmtIntCompact,
  fmtRate,
} from "../_components/format";

export default function AnalystUsersPage() {
  const fetcher = useCallback((range: string) => analyticsApi.users({ range }), []);
  const { range, setRange, data, loading, error, retry } = useAnalytics(fetcher);
  const k = data?.kpis;

  return (
    <SectionShell
      title="Users"
      subtitle="Growth, activity & composition"
      icon={Users}
      range={range}
      onRangeChange={setRange}
      loading={loading}
      error={error}
      onRetry={retry}
    >
      {data && k && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <KpiCard title="Total users" value={fmtInt(k.total_users)} icon={Users} />
            <KpiCard
              title="New users"
              value={fmtInt(k.new_users)}
              delta={k.new_users_delta_pct}
              icon={UserPlus}
            />
            <KpiCard title="DAU" value={fmtInt(k.active_dau)} icon={Activity} />
            <KpiCard title="WAU" value={fmtInt(k.active_wau)} icon={Activity} />
            <KpiCard title="MAU" value={fmtInt(k.active_mau)} icon={Activity} />
            <KpiCard title="Stickiness" value={fmtRate(k.stickiness)} icon={Repeat} hint="DAU/MAU" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="Signups" subtitle="New users per day" className="lg:col-span-2">
              <TrendChart
                data={data.signups}
                series={[{ key: "new_users", label: "New users", color: BRAND }]}
                yTickFormatter={fmtIntCompact}
                valueFormatter={fmtInt}
              />
            </ChartCard>
            <ChartCard title="Cumulative users" subtitle="Total accounts over time" className="lg:col-span-2">
              <TrendChart
                data={data.signups}
                series={[{ key: "cumulative", label: "Cumulative", color: PALETTE[1] }]}
                yTickFormatter={fmtIntCompact}
                valueFormatter={fmtInt}
                height={220}
              />
            </ChartCard>

            <ChartCard title="Verification funnel" subtitle="Registered → verified">
              <BreakdownTable
                rows={data.funnel.map((f) => ({ label: f.step, value: f.count }))}
                valueHeader="Users"
                format={fmtInt}
              />
            </ChartCard>
            <ChartCard title="By tier">
              <CategoryDonut
                data={data.by_tier.map((c) => ({ label: c.label, value: c.count }))}
              />
            </ChartCard>
            <ChartCard title="By account status">
              <CategoryDonut
                data={data.by_status.map((c) => ({ label: c.label, value: c.count }))}
              />
            </ChartCard>
            <ChartCard title="By gender">
              <CategoryDonut
                data={data.by_gender.map((c) => ({ label: c.label, value: c.count }))}
              />
            </ChartCard>
            <ChartCard title="Top locations" subtitle="From login activity" className="lg:col-span-2">
              <BreakdownTable
                rows={data.by_location.map((c) => ({ label: c.label, value: c.count }))}
                valueHeader="Logins"
                format={fmtInt}
              />
            </ChartCard>
          </div>
        </>
      )}
    </SectionShell>
  );
}
