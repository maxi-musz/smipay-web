"use client";

import { useCallback } from "react";
import { Activity, LogIn, ShieldAlert, KeyRound, Repeat } from "lucide-react";

import { analyticsApi } from "@/services/admin/analytics-api";
import { SectionShell } from "../_components/section";
import { useAnalytics } from "../_components/use-analytics";
import { KpiCard, ChartCard, BreakdownTable } from "../_components/cards";
import { TrendChart } from "../_components/charts";
import { PALETTE, fmtInt, fmtIntCompact, fmtRate } from "../_components/format";

export default function AnalystEngagementPage() {
  const fetcher = useCallback(
    (range: string) => analyticsApi.engagement({ range }),
    [],
  );
  const { range, setRange, data, loading, error, retry } = useAnalytics(fetcher);
  const k = data?.kpis;

  return (
    <SectionShell
      title="Engagement & Logins"
      subtitle="Sign-in activity & auth signals"
      icon={Activity}
      range={range}
      onRangeChange={setRange}
      loading={loading}
      error={error}
      onRetry={retry}
    >
      {data && k && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <KpiCard title="Logins" value={fmtInt(k.login_success)} icon={LogIn} />
            <KpiCard title="Failed logins" value={fmtInt(k.login_failed)} icon={ShieldAlert} deltaGoodWhenUp={false} />
            <KpiCard title="Success rate" value={fmtRate(k.login_success_rate)} icon={LogIn} />
            <KpiCard title="MAU" value={fmtInt(k.active_mau)} icon={Activity} />
            <KpiCard title="Stickiness" value={fmtRate(k.stickiness)} icon={Repeat} hint="DAU/MAU" />
            <KpiCard title="OTP requests" value={fmtInt(k.otp_requests)} icon={KeyRound} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="Login attempts" subtitle="Success vs failed per day" className="lg:col-span-2">
              <TrendChart
                data={data.login_trend}
                series={[
                  { key: "success", label: "Success", color: PALETTE[2] },
                  { key: "failed", label: "Failed", color: PALETTE[7] },
                ]}
                yTickFormatter={fmtIntCompact}
                valueFormatter={fmtInt}
                height={260}
              />
            </ChartCard>
            <ChartCard
              title="Failed-login hotspots"
              subtitle="Top source IPs (potential abuse)"
              className="lg:col-span-2"
            >
              <BreakdownTable
                rows={data.failed_login_hotspots.map((h) => ({
                  label: h.ip,
                  value: h.count,
                }))}
                valueHeader="Failures"
                format={fmtInt}
              />
            </ChartCard>
          </div>
        </>
      )}
    </SectionShell>
  );
}
