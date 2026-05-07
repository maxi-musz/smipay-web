"use client";

import {
  Users,
  ArrowLeftRight,
  Wallet,
  ShieldCheck,
  Headphones,
  CreditCard,
  UserPlus,
  TrendingUp,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { useAdminDashboard } from "@/hooks/admin/useAdminDashboard";
import { StatsCard } from "./_components/StatsCard";
import { SectionCard } from "./_components/SectionCard";
// import { ActionItems } from "./_components/ActionItems";
import { TierDistribution } from "./_components/TierDistribution";
import { RevenueBreakdown } from "./_components/RevenueBreakdown";
import { DashboardSkeleton } from "./_components/DashboardSkeleton";
import { Button } from "@/components/ui/button";

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminDashboardPage() {
  const { data, isLoading, error, isRecalculating, refetch, recalculate } =
    useAdminDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-red-600 mb-4 text-sm">
            {error || "Failed to load dashboard"}
          </p>
          <Button onClick={refetch} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="min-w-0 pr-12 lg:pr-0">
            <h1 className="text-lg sm:text-xl font-semibold text-dashboard-heading tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-dashboard-muted mt-0.5">
              Overview of platform activity and stats
            </p>
          </div>
          <button
            type="button"
            onClick={recalculate}
            disabled={isRecalculating}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-dashboard-muted hover:text-dashboard-heading bg-dashboard-bg hover:bg-dashboard-border/50 rounded-lg border border-dashboard-border/60 transition-colors disabled:opacity-50"
          >
            {isRecalculating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {isRecalculating ? "Syncing..." : "Recalculate"}
          </button>
        </div>
      </motion.header>

      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Action Items */}
        {/* <ActionItems items={data.action_items} /> */}

        {/* Primary Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            title="Total Users"
            value={data.users.total.toLocaleString()}
            icon={Users}
            iconBg="var(--quick-action-1-bg)"
            iconColor="var(--quick-action-1)"
            subtitle={`+${data.users.new_today} today`}
            subtitleColor="text-emerald-600"
            index={0}
          />
          <StatsCard
            title="Transactions Today"
            value={data.transactions.total_today.toLocaleString()}
            icon={ArrowLeftRight}
            iconBg="var(--quick-action-2-bg)"
            iconColor="var(--quick-action-2)"
            subtitle={formatNaira(data.transactions.total_volume_today)}
            subtitleColor="text-dashboard-muted"
            index={1}
          />
          <StatsCard
            title="Total Wallet Balance"
            value={formatNaira(data.wallets.total_balance_all_users)}
            icon={Wallet}
            iconBg="var(--quick-action-4-bg)"
            iconColor="var(--quick-action-4)"
            subtitle={`${formatNaira(data.wallets.total_funded_today)} funded today`}
            subtitleColor="text-emerald-600"
            index={2}
          />
          <StatsCard
            title="Revenue Today"
            value={formatNaira(
              data.revenue.total_revenue_today ?? data.revenue.markup_today
            )}
            icon={TrendingUp}
            iconBg="var(--quick-action-3-bg)"
            iconColor="var(--quick-action-3)"
            subtitle={
              data.revenue.vtpass_commission_today != null
                ? `Markup ${formatNaira(data.revenue.markup_today)} · Commission ${formatNaira(data.revenue.vtpass_commission_today)}`
                : `${formatNaira(data.revenue.markup_this_week)} this week`
            }
            subtitleColor="text-dashboard-muted"
            index={3}
          />
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            title="Pending KYC"
            value={data.kyc.pending.toLocaleString()}
            icon={ShieldCheck}
            iconBg="var(--quick-action-3-bg)"
            iconColor="var(--quick-action-3)"
            subtitle={`${data.kyc.approved_today} approved today`}
            subtitleColor="text-emerald-600"
            index={4}
          />
          <StatsCard
            title="Support Tickets"
            value={(
              data.support.open_tickets +
              data.support.pending_tickets +
              data.support.escalated_tickets
            ).toLocaleString()}
            icon={Headphones}
            iconBg="var(--quick-action-5-bg)"
            iconColor="var(--quick-action-5)"
            subtitle={`${data.support.escalated_tickets} escalated`}
            subtitleColor={
              data.support.escalated_tickets > 0
                ? "text-red-600"
                : "text-dashboard-muted"
            }
            index={5}
          />
          <StatsCard
            title="Active Cards"
            value={data.cards.total_active.toLocaleString()}
            icon={CreditCard}
            iconBg="var(--quick-action-6-bg)"
            iconColor="var(--quick-action-6)"
            subtitle={`+${data.cards.issued_today} issued today`}
            subtitleColor="text-dashboard-muted"
            index={6}
          />
          <StatsCard
            title="Referrals"
            value={data.referrals.this_week.toLocaleString()}
            icon={UserPlus}
            iconBg="var(--quick-action-2-bg)"
            iconColor="var(--quick-action-2)"
            subtitle={`${data.referrals.today} today`}
            subtitleColor="text-dashboard-muted"
            index={7}
          />
        </div>

        {/* Detailed Section Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SectionCard
            title="Users"
            icon={Users}
            index={0}
            rows={[
              { label: "Total Registered", value: data.users.total.toLocaleString() },
              {
                label: "New Today",
                value: `+${data.users.new_today}`,
                valueColor: "text-emerald-600",
              },
              {
                label: "New This Week",
                value: `+${data.users.new_this_week}`,
                valueColor: "text-emerald-600",
              },
              { label: "Active", value: data.users.active.toLocaleString() },
              {
                label: "Suspended",
                value: data.users.suspended.toLocaleString(),
                valueColor:
                  data.users.suspended > 0
                    ? "text-red-600"
                    : "text-dashboard-heading",
              },
            ]}
          />

          <SectionCard
            title="Transactions"
            icon={ArrowLeftRight}
            index={1}
            rows={[
              {
                label: "Total Today",
                value: data.transactions.total_today.toLocaleString(),
              },
              {
                label: "Volume Today",
                value: formatNaira(data.transactions.total_volume_today),
              },
              {
                label: "Successful",
                value: data.transactions.success_count.toLocaleString(),
                valueColor: "text-emerald-600",
              },
              {
                label: "Pending",
                value: data.transactions.pending_count.toLocaleString(),
                valueColor:
                  data.transactions.pending_count > 0
                    ? "text-amber-600"
                    : "text-dashboard-heading",
              },
              {
                label: "Failed",
                value: data.transactions.failed_count.toLocaleString(),
                valueColor:
                  data.transactions.failed_count > 0
                    ? "text-red-600"
                    : "text-dashboard-heading",
              },
            ]}
          />

          <SectionCard
            title="KYC Verification"
            icon={ShieldCheck}
            index={2}
            rows={[
              {
                label: "Pending Review",
                value: data.kyc.pending.toLocaleString(),
                valueColor:
                  data.kyc.pending > 0
                    ? "text-amber-600"
                    : "text-dashboard-heading",
              },
              {
                label: "Approved Today",
                value: data.kyc.approved_today.toLocaleString(),
                valueColor: "text-emerald-600",
              },
              {
                label: "Approved This Week",
                value: data.kyc.approved_this_week.toLocaleString(),
              },
              {
                label: "Rejected",
                value: data.kyc.rejected.toLocaleString(),
                valueColor:
                  data.kyc.rejected > 0
                    ? "text-red-600"
                    : "text-dashboard-heading",
              },
            ]}
          />

          <SectionCard
            title="Support"
            icon={Headphones}
            index={3}
            rows={[
              {
                label: "Open Tickets",
                value: data.support.open_tickets.toLocaleString(),
              },
              {
                label: "Pending (Awaiting Response)",
                value: data.support.pending_tickets.toLocaleString(),
                valueColor:
                  data.support.pending_tickets > 0
                    ? "text-amber-600"
                    : "text-dashboard-heading",
              },
              {
                label: "Escalated",
                value: data.support.escalated_tickets.toLocaleString(),
                valueColor:
                  data.support.escalated_tickets > 0
                    ? "text-red-600"
                    : "text-dashboard-heading",
              },
            ]}
          />

          <SectionCard
            title="Compliance & Security"
            icon={ShieldCheck}
            index={4}
            rows={[
              {
                label: "Flagged Audit Logs",
                value: data.compliance.flagged_audit_logs.toLocaleString(),
                valueColor:
                  data.compliance.flagged_audit_logs > 0
                    ? "text-amber-600"
                    : "text-dashboard-heading",
              },
              {
                label: "Security Events Today",
                value: data.compliance.security_events_today.toLocaleString(),
                valueColor:
                  data.compliance.security_events_today > 0
                    ? "text-red-600"
                    : "text-dashboard-heading",
              },
            ]}
          />

          <TierDistribution tiers={data.tier_distribution} />
          <RevenueBreakdown revenue={data.revenue} index={5} />
        </div>
      </div>
    </div>
  );
}
