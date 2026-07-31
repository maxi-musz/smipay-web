"use client";

import { Activity, LogIn, ShieldAlert, KeyRound, Repeat } from "lucide-react";

import { analyticsApi } from "@/services/admin/analytics-api";
import { SectionShell } from "../_components/section";
import { useAnalytics } from "../_components/use-analytics";
import { KpiCard, ChartCard, FailedLoginWatchlist } from "../_components/cards";
import { TrendChart } from "../_components/charts";
import { PALETTE, fmtInt, fmtIntCompact, fmtRate } from "../_components/format";
import { METRIC_HELP } from "../_components/metric-glossary";

export default function AnalystEngagementPage() {
  const { range, setRange, data, loading, error, retry } = useAnalytics(
    "engagement",
    (r) => analyticsApi.engagement({ range: r }),
    "v2",
  );
  const k = data?.kpis;

  return (
    <SectionShell
      title="Engagement & Logins"
      subtitle="Sign-in activity & auth signals"
      icon={Activity}
      section="engagement"
      range={range}
      onRangeChange={setRange}
      loading={loading}
      error={error}
      onRetry={retry}
      exports={
        data
          ? [
              { name: "login-trend", rows: data.login_trend },
              { name: "failed-login-watchlist", rows: data.failed_login_watchlist },
            ]
          : []
      }
    >
      {data && k && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <KpiCard title="Logins" value={fmtInt(k.login_success)} icon={LogIn} tooltip={METRIC_HELP.logins} />
            <KpiCard title="Failed logins" value={fmtInt(k.login_failed)} icon={ShieldAlert} deltaGoodWhenUp={false} tooltip={METRIC_HELP.failedLogins} />
            <KpiCard title="Success rate" value={fmtRate(k.login_success_rate)} icon={LogIn} tooltip={METRIC_HELP.loginSuccessRate} />
            <KpiCard title="MAU" value={fmtInt(k.active_mau)} icon={Activity} tooltip={METRIC_HELP.mau} />
            <KpiCard title="Stickiness" value={fmtRate(k.stickiness)} icon={Repeat} tooltip={METRIC_HELP.stickiness} />
            <KpiCard title="OTP requests" value={fmtInt(k.otp_requests)} icon={KeyRound} tooltip={METRIC_HELP.otpRequests} />
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
              title="Failed-login watchlist"
              subtitle="Users and sign-in identifiers with the most failures"
              className="lg:col-span-2"
              tooltip={METRIC_HELP.failedLoginWatchlist}
            >
              <FailedLoginWatchlist rows={data.failed_login_watchlist} />
            </ChartCard>
          </div>
        </>
      )}
    </SectionShell>
  );
}
