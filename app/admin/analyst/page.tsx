"use client";

import {
  Users,
  UserCheck,
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
  UNVERIFIED_COLOR,
  VERIFIED_COLOR,
  fmtInt,
  fmtIntCompact,
  fmtMoney,
  fmtMoneyCompact,
  fmtRate,
} from "./_components/format";
import { METRIC_HELP } from "./_components/metric-glossary";
import { VerificationStrip } from "@/app/unified-admin/_components/VerificationStrip";
import { asVerificationBreakdown, formatPct, pct } from "@/types/admin/verification";

export default function AnalystOverviewPage() {
  const { period, setPreset, setCustom, data, loading, error, retry } = useAnalytics(
    "overview",
    (q) => analyticsApi.overview(q),
  );

  const k = data?.kpis;
  const verification = asVerificationBreakdown(k?.verification);
  const phonePct = verification ? pct(verification.phone_verified, verification.total) : 0;
  const hasTrendSplit = data?.trend.some((t) => t.signups_total !== undefined) ?? false;

  return (
    <SectionShell
      title="Overview"
      subtitle="Platform-wide KPIs and trends"
      icon={BarChart3}
      section="overview"
      period={period}
      onPreset={setPreset}
      onCustom={setCustom}
      rangeMeta={data?.range}
      loading={loading}
      error={error}
      onRetry={retry}
      exports={data ? [{ name: "overview-trend", rows: data.trend }] : []}
    >
      {k && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 min-[1800px]:grid-cols-6">
            {verification ? (
              <KpiCard
                title="Phone-verified"
                value={fmtInt(verification.phone_verified)}
                icon={UserCheck}
                hint={`${formatPct(phonePct)} of ${fmtInt(verification.total)} customers`}
                headlinePct={phonePct}
                tooltip={METRIC_HELP.phoneVerified}
              />
            ) : (
              <KpiCard title="Total users" value={fmtInt(k.total_users)} icon={Users} tooltip={METRIC_HELP.totalUsers} />
            )}
            {k.signups_phone_verified !== undefined ? (
              <KpiCard
                title="Verified sign-ups"
                value={fmtInt(k.signups_phone_verified)}
                delta={k.signups_phone_verified_delta_pct}
                icon={UserPlus}
                hint={`of ${fmtInt(k.signups_total)} sign-ups`}
                tooltip={METRIC_HELP.verifiedSignups}
              />
            ) : (
              <KpiCard
                title="New users"
                value={fmtInt(k.new_users)}
                delta={k.new_users_delta_pct}
                icon={UserPlus}
                tooltip={METRIC_HELP.newUsers}
              />
            )}
            {k.active_phone_verified !== undefined ? (
              <KpiCard
                title="Active (verified)"
                value={fmtInt(k.active_phone_verified)}
                icon={Activity}
                hint={`of ${fmtInt(k.active_customers)} active customers`}
                tooltip={METRIC_HELP.activeVerified}
              />
            ) : (
              <KpiCard title="Active users" value={fmtInt(k.active_users)} icon={Activity} tooltip={METRIC_HELP.activeUsers} />
            )}
            <KpiCard
              title="Tx volume"
              value={fmtMoney(k.transactions_volume)}
              delta={k.volume_delta_pct}
              icon={ArrowLeftRight}
              tooltip={METRIC_HELP.txVolume}
            />
            <KpiCard
              title="Success rate"
              value={fmtRate(k.success_rate)}
              icon={CheckCircle2}
              tooltip={METRIC_HELP.successRate}
            />
            <KpiCard
              title="Revenue"
              value={fmtMoney(k.revenue)}
              delta={k.revenue_delta_pct}
              icon={Wallet}
              tooltip={METRIC_HELP.revenue}
            />
          </div>

          {verification && (
            <VerificationStrip verification={verification} title="Verification · all time" />
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            {hasTrendSplit ? (
              <ChartCard
                title="Sign-ups"
                subtitle="Phone-verified vs not verified, per day"
                tooltip={METRIC_HELP.signupSplit}
              >
                <TrendChart
                  data={data.trend}
                  series={[
                    { key: "signups_phone_verified", label: "Phone-verified", color: VERIFIED_COLOR },
                    { key: "signups_unverified", label: "Not verified", color: UNVERIFIED_COLOR },
                  ]}
                  stacked
                  yTickFormatter={fmtIntCompact}
                  valueFormatter={fmtInt}
                />
              </ChartCard>
            ) : (
              <ChartCard title="New users" subtitle="Signups per day">
                <TrendChart
                  data={data.trend}
                  series={[{ key: "new_users", label: "New users", color: BRAND }]}
                  yTickFormatter={fmtIntCompact}
                  valueFormatter={fmtInt}
                />
              </ChartCard>
            )}
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
