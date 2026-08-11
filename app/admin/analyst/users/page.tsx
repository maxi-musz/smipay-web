"use client";

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
import { METRIC_HELP } from "../_components/metric-glossary";

export default function AnalystUsersPage() {
  const { period, setPreset, setCustom, data, loading, error, retry } = useAnalytics(
    "users",
    (q) => analyticsApi.users(q),
  );
  const k = data?.kpis;

  return (
    <SectionShell
      title="Users"
      subtitle="Growth, activity & composition"
      icon={Users}
      section="users"
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
              { name: "signups", rows: data.signups },
              { name: "verification-funnel", rows: data.funnel },
              { name: "by-tier", rows: data.by_tier },
              { name: "by-status", rows: data.by_status },
              { name: "by-gender", rows: data.by_gender },
              { name: "by-location", rows: data.by_location },
            ]
          : []
      }
    >
      {data && k && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <KpiCard title="Total users" value={fmtInt(k.total_users)} icon={Users} tooltip={METRIC_HELP.totalUsers} />
            <KpiCard
              title="New users"
              value={fmtInt(k.new_users)}
              delta={k.new_users_delta_pct}
              icon={UserPlus}
              tooltip={METRIC_HELP.newUsers}
            />
            <KpiCard title="DAU" value={fmtInt(k.active_dau)} icon={Activity} tooltip={METRIC_HELP.dau} />
            <KpiCard title="WAU" value={fmtInt(k.active_wau)} icon={Activity} tooltip={METRIC_HELP.wau} />
            <KpiCard title="MAU" value={fmtInt(k.active_mau)} icon={Activity} tooltip={METRIC_HELP.mau} />
            <KpiCard title="Stickiness" value={fmtRate(k.stickiness)} icon={Repeat} tooltip={METRIC_HELP.stickiness} />
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

            <ChartCard title="Verification funnel" subtitle="Registered → verified" tooltip={METRIC_HELP.verificationFunnel}>
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
