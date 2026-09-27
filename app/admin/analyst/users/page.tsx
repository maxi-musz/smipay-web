"use client";

import { Users, UserCheck, UserPlus, Activity, Repeat } from "lucide-react";

import { analyticsApi } from "@/services/admin/analytics-api";
import { SectionShell } from "../_components/section";
import { useAnalytics } from "../_components/use-analytics";
import { KpiCard, ChartCard, BreakdownTable } from "../_components/cards";
import { TrendChart, CategoryDonut } from "../_components/charts";
import {
  BRAND,
  PALETTE,
  UNVERIFIED_COLOR,
  VERIFIED_COLOR,
  fmtInt,
  fmtIntCompact,
  fmtRate,
} from "../_components/format";
import { METRIC_HELP } from "../_components/metric-glossary";
import { asVerificationBreakdown, formatPct, pct } from "@/types/admin/verification";

export default function AnalystUsersPage() {
  const { period, setPreset, setCustom, data, loading, error, retry } = useAnalytics(
    "users",
    (q) => analyticsApi.users(q),
  );
  const k = data?.kpis;
  const verification = asVerificationBreakdown(k?.verification);
  const phonePct = verification ? pct(verification.phone_verified, verification.total) : 0;
  const funnelBase = data?.funnel[0]?.count ?? 0;
  const hasSignupSplit = data?.signups.some((s) => s.phone_verified !== undefined) ?? false;
  const verifiedMau = k?.active_mau_phone_verified;
  const stickiness =
    verifiedMau === undefined
      ? k?.stickiness ?? 0
      : verifiedMau
        ? (k?.active_dau_phone_verified ?? 0) / verifiedMau
        : 0;

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
            {(
              [
                ["DAU", k.active_dau, k.active_dau_phone_verified, METRIC_HELP.dau],
                ["WAU", k.active_wau, k.active_wau_phone_verified, METRIC_HELP.wau],
                ["MAU", k.active_mau, k.active_mau_phone_verified, METRIC_HELP.mau],
              ] as const
            ).map(([label, all, verified, tooltip]) => (
              <KpiCard
                key={label}
                title={verified === undefined ? label : `${label} (verified)`}
                value={fmtInt(verified ?? all)}
                icon={Activity}
                hint={verified === undefined ? undefined : `of ${fmtInt(all)} logged in`}
                tooltip={tooltip}
              />
            ))}
            <KpiCard title="Stickiness" value={fmtRate(stickiness)} icon={Repeat} tooltip={METRIC_HELP.stickiness} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {hasSignupSplit ? (
              <ChartCard
                title="Sign-ups"
                subtitle="Phone-verified vs not verified, per day"
                tooltip={METRIC_HELP.signupSplit}
                className="lg:col-span-2"
              >
                <TrendChart
                  data={data.signups}
                  series={[
                    { key: "phone_verified", label: "Phone-verified", color: VERIFIED_COLOR },
                    { key: "unverified", label: "Not verified", color: UNVERIFIED_COLOR },
                  ]}
                  stacked
                  yTickFormatter={fmtIntCompact}
                  valueFormatter={fmtInt}
                />
              </ChartCard>
            ) : (
              <ChartCard title="Signups" subtitle="New users per day" className="lg:col-span-2">
                <TrendChart
                  data={data.signups}
                  series={[{ key: "new_users", label: "New users", color: BRAND }]}
                  yTickFormatter={fmtIntCompact}
                  valueFormatter={fmtInt}
                />
              </ChartCard>
            )}
            <ChartCard
              title="Cumulative users"
              subtitle={
                hasSignupSplit
                  ? "All accounts vs phone-verified customers"
                  : "Total accounts over time"
              }
              tooltip={hasSignupSplit ? METRIC_HELP.cumulativeSplit : undefined}
              className="lg:col-span-2"
            >
              <TrendChart
                data={data.signups}
                series={[
                  { key: "cumulative", label: "All accounts", color: PALETTE[1] },
                  ...(hasSignupSplit
                    ? [
                        {
                          key: "cumulative_phone_verified",
                          label: "Phone-verified customers",
                          color: VERIFIED_COLOR,
                        },
                      ]
                    : []),
                ]}
                yTickFormatter={fmtIntCompact}
                valueFormatter={fmtInt}
                height={220}
              />
            </ChartCard>

            <ChartCard
              title="Verification funnel"
              subtitle="Customers · each step is a subset of the one before"
              tooltip={METRIC_HELP.verificationFunnel}
            >
              <BreakdownTable
                rows={data.funnel.map((f, i) => ({
                  label: f.step,
                  value: f.count,
                  sub: i > 0 ? `${formatPct(pct(f.count, funnelBase))} of registered` : undefined,
                }))}
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
