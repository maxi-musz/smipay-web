"use client";

import { useMemo, useState } from "react";
import {
  Coins,
  Sparkles,
  UserPlus,
  Wallet,
  Activity,
  TrendingUp,
  Fuel,
  ShieldAlert,
  Users,
  Gift,
  CalendarRange,
  ChevronDown,
  Eye,
  EyeOff,
  BarChart3,
} from "lucide-react";
import type { RewardsReport } from "@/types/admin/rewards-report";

const naira = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n ?? 0);

const count = (n: number) => new Intl.NumberFormat("en-NG").format(n ?? 0);

function PeriodBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dashboard-bg border border-dashboard-border/60 text-xs font-bold text-dashboard-heading whitespace-nowrap">
      <CalendarRange className="h-3 w-3" />
      {label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "danger" | "success" | "brand";
}) {
  const toneClasses: Record<string, string> = {
    default: "bg-dashboard-surface border-dashboard-border/60",
    brand: "bg-brand-bg-primary/5 border-brand-bg-primary/30",
    danger: "bg-red-50 border-red-200",
    success: "bg-emerald-50 border-emerald-200",
  };
  const iconTone: Record<string, string> = {
    default: "bg-dashboard-bg text-dashboard-heading",
    brand: "bg-brand-bg-primary text-white",
    danger: "bg-red-100 text-red-600",
    success: "bg-emerald-100 text-emerald-600",
  };
  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
      <div className="flex items-center gap-2.5">
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconTone[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs font-medium text-dashboard-muted">{label}</span>
      </div>
      <div className="mt-3 text-xl font-bold text-dashboard-heading tabular-nums">
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-dashboard-muted">{sub}</div>}
    </div>
  );
}

function DetailRow({
  label,
  value,
  strong,
  hint,
  valueClass,
}: {
  label: string;
  value: string;
  strong?: boolean;
  hint?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-dashboard-border/40 last:border-0">
      <div className="min-w-0">
        <span
          className={`text-sm ${strong ? "font-semibold text-dashboard-heading" : "text-dashboard-muted"}`}
        >
          {label}
        </span>
        {hint && (
          <span className="block text-[11px] text-dashboard-muted">{hint}</span>
        )}
      </div>
      <span
        className={`text-sm tabular-nums shrink-0 ${valueClass ?? (strong ? "font-bold text-dashboard-heading" : "text-dashboard-heading")}`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * A section that is collapsed by default. The header always shows the title and
 * a bold reporting-period badge, so a screenshot of any single expanded section
 * still carries the period.
 */
function CollapsibleSection({
  id,
  title,
  icon: Icon,
  periodLabel,
  open,
  onToggle,
  tone = "default",
  children,
}: {
  id: string;
  title: string;
  icon: typeof Coins;
  periodLabel: string;
  open: boolean;
  onToggle: (id: string) => void;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border ${tone === "danger" ? "border-red-200 bg-red-50/40" : "border-dashboard-border/60 bg-dashboard-surface"}`}
    >
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon
            className={`h-4 w-4 shrink-0 ${tone === "danger" ? "text-red-600" : "text-brand-bg-primary"}`}
          />
          <h3 className="text-sm font-semibold text-dashboard-heading truncate">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="hidden sm:block">
            <PeriodBadge label={periodLabel} />
          </span>
          <ChevronDown
            className={`h-4 w-4 text-dashboard-muted transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4">
          {/* Repeat the period on small screens where the header badge is hidden */}
          <div className="sm:hidden mb-3">
            <PeriodBadge label={periodLabel} />
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

export function ReportResults({ report }: { report: RewardsReport }) {
  const m = report.metrics;
  const periodLabel = report.period.label;
  const hasRewardMetric =
    m.cashback_earned || m.first_tx_rewards || m.referral_bonuses;

  // Which collapsible sections exist for this report (in display order).
  const sectionIds = useMemo(() => {
    const ids: string[] = ["key-figures"];
    if (hasRewardMetric) ids.push("rewards");
    if (m.user_deposits) ids.push("deposits");
    if (m.vtpass_reconciliation) ids.push("vtpass");
    if (m.forged_webhook_summary) ids.push("forged");
    if (m.total_transactions) ids.push("transactions");
    return ids;
  }, [m, hasRewardMetric]);

  // Collapsed by default.
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [showFakeDeposits, setShowFakeDeposits] = useState(false);
  const toggle = (id: string) =>
    setOpenMap((s) => ({ ...s, [id]: !s[id] }));
  const setAll = (v: boolean) =>
    setOpenMap(Object.fromEntries(sectionIds.map((id) => [id, v])));

  return (
    <div className="space-y-3">
      {/* Reporting period header — always visible anchor */}
      <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface px-5 py-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-dashboard-muted">
              Reporting period
            </p>
            <h2 className="text-lg font-bold text-dashboard-heading">
              {periodLabel}
            </h2>
          </div>
          <p className="text-xs text-dashboard-muted">
            Generated{" "}
            {new Date(report.generated_at).toLocaleString("en-NG", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setAll(true)}
            className="text-xs text-brand-bg-primary hover:underline"
          >
            Expand all
          </button>
          <span className="text-dashboard-border">·</span>
          <button
            type="button"
            onClick={() => setAll(false)}
            className="text-xs text-dashboard-muted hover:underline"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Key figures (KPI cards) */}
      <CollapsibleSection
        id="key-figures"
        title="Key figures"
        icon={BarChart3}
        periodLabel={periodLabel}
        open={!!openMap["key-figures"]}
        onToggle={toggle}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {hasRewardMetric && (
            <StatCard
              icon={Gift}
              tone="brand"
              label="Total rewards paid out"
              value={naira(report.rewards_paid_out)}
              sub="Sum of selected reward types"
            />
          )}
          {m.user_deposits && (
            <StatCard
              icon={Wallet}
              label="User deposits (real)"
              value={naira(m.user_deposits.total)}
              sub={`${count(m.user_deposits.count)} deposits · fakes excluded`}
            />
          )}
          {m.cashback_earned && (
            <StatCard
              icon={Coins}
              label="Cashback paid"
              value={naira(m.cashback_earned.total)}
              sub={`${count(m.cashback_earned.count)} credits`}
            />
          )}
          {m.first_tx_rewards && (
            <StatCard
              icon={Sparkles}
              label="First-tx rewards"
              value={naira(m.first_tx_rewards.total)}
              sub={`${count(m.first_tx_rewards.count)} users`}
            />
          )}
          {m.referral_bonuses && (
            <StatCard
              icon={UserPlus}
              label="Referral bonuses"
              value={naira(m.referral_bonuses.total)}
              sub={`${count(m.referral_bonuses.count)} payouts`}
            />
          )}
          {m.markup_revenue && (
            <StatCard
              icon={TrendingUp}
              tone="success"
              label="Markup revenue"
              value={naira(m.markup_revenue.total)}
              sub={`+ ${naira(m.markup_revenue.vtpass_commission)} commission`}
            />
          )}
          {m.total_transactions && (
            <StatCard
              icon={Activity}
              label="Successful volume"
              value={naira(m.total_transactions.success_volume)}
              sub={`${count(m.total_transactions.success_count)} of ${count(m.total_transactions.count)} tx`}
            />
          )}
          {m.new_users && (
            <StatCard
              icon={Users}
              label="New users"
              value={count(m.new_users.count)}
              sub="Signed up in this period"
            />
          )}
          {m.forged_webhook_summary && (
            <StatCard
              icon={ShieldAlert}
              tone="danger"
              label="Forged-webhook net loss"
              value={naira(m.forged_webhook_summary.net_lost)}
              sub={`${count(m.forged_webhook_summary.accounts)} accounts`}
            />
          )}
        </div>
      </CollapsibleSection>

      {/* Rewards breakdown */}
      {hasRewardMetric && (
        <CollapsibleSection
          id="rewards"
          title="Rewards paid out — breakdown"
          icon={Gift}
          periodLabel={periodLabel}
          open={!!openMap["rewards"]}
          onToggle={toggle}
        >
          {m.cashback_earned && (
            <DetailRow label="Cashback" value={naira(m.cashback_earned.total)} />
          )}
          {m.first_tx_rewards && (
            <DetailRow
              label="First-transaction bonus"
              value={naira(m.first_tx_rewards.total)}
            />
          )}
          {m.referral_bonuses && (
            <DetailRow
              label="Referral bonus — referrer"
              value={naira(m.referral_bonuses.referrer_total)}
            />
          )}
          {m.referral_bonuses && (
            <DetailRow
              label="Referral bonus — referee"
              value={naira(m.referral_bonuses.referee_total)}
            />
          )}
          <DetailRow
            label="Total rewards paid out"
            value={naira(report.rewards_paid_out)}
            strong
          />
        </CollapsibleSection>
      )}

      {/* Deposits — real vs forged (with show/hide) */}
      {m.user_deposits && (
        <CollapsibleSection
          id="deposits"
          title="Deposits"
          icon={Wallet}
          periodLabel={periodLabel}
          open={!!openMap["deposits"]}
          onToggle={toggle}
        >
          <DetailRow
            label="User deposits (real)"
            value={naira(m.user_deposits.total)}
            hint={`${count(m.user_deposits.count)} deposits · forged-webhook credits are NOT included`}
            strong
          />
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowFakeDeposits((s) => !s)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-bg-primary hover:underline"
            >
              {showFakeDeposits ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              {showFakeDeposits ? "Hide" : "Show"} forged (fake) deposits
            </button>
          </div>
          {showFakeDeposits && (
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50/60 px-3 py-1">
              <DetailRow
                label="Forged / fake deposits"
                value={naira(m.user_deposits.fake_total)}
                hint={`${count(m.user_deposits.fake_count)} transactions from the forged-webhook incident — excluded from the real figure above`}
                valueClass="font-bold text-red-600"
              />
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* Partner reconciliation */}
      {m.vtpass_reconciliation && (
        <CollapsibleSection
          id="vtpass"
          title={`Partner reconciliation — ${m.vtpass_reconciliation.partner.toUpperCase()}`}
          icon={Fuel}
          periodLabel={periodLabel}
          open={!!openMap["vtpass"]}
          onToggle={toggle}
        >
          {(() => {
            const v = m.vtpass_reconciliation!;
            const overdrawn = v.remaining < 0;
            return (
              <>
                <DetailRow
                  label="Loaded onto partner"
                  value={naira(v.loaded)}
                  hint={`${count(v.loaded_entries)} top-up${v.loaded_entries === 1 ? "" : "s"} recorded in this period`}
                />
                <DetailRow
                  label="Used (VTpass cost)"
                  value={naira(v.used)}
                  hint={
                    v.usage_estimated
                      ? "Estimated — VTpass cost wasn't stored on every row, so the transaction amount is used for those"
                      : undefined
                  }
                />
                <DetailRow
                  label="Est. remaining (loaded − used)"
                  value={
                    overdrawn
                      ? `− ${naira(Math.abs(v.remaining))}`
                      : naira(v.remaining)
                  }
                  strong
                  valueClass={
                    overdrawn
                      ? "font-bold text-red-600"
                      : "font-bold text-dashboard-heading"
                  }
                  hint={
                    overdrawn
                      ? "Overdrawn — used more than the recorded top-ups"
                      : undefined
                  }
                />
                <DetailRow
                  label="Charged to customers"
                  value={naira(v.smipay_charged)}
                />
                <DetailRow
                  label="Markup earned on usage"
                  value={naira(v.markup_revenue)}
                />
                <DetailRow
                  label="Utility transactions"
                  value={count(v.transactions)}
                />
                <p className="mt-2 text-[11px] leading-relaxed text-dashboard-muted">
                  This is an estimate from the top-ups you recorded minus VAS
                  spend for the period — <strong>not</strong> a live VTpass
                  balance. Check the VTpass dashboard for the actual balance.
                </p>
              </>
            );
          })()}
        </CollapsibleSection>
      )}

      {/* Forged incident */}
      {m.forged_webhook_summary && (
        <CollapsibleSection
          id="forged"
          title="Forged Paystack-webhook incident"
          icon={ShieldAlert}
          periodLabel={periodLabel}
          open={!!openMap["forged"]}
          onToggle={toggle}
          tone="danger"
        >
          <DetailRow
            label="Total forged / credited"
            value={naira(m.forged_webhook_summary.forged_total)}
          />
          <DetailRow
            label="Clawed back"
            value={naira(m.forged_webhook_summary.clawed_back)}
          />
          <DetailRow
            label="Net lost"
            value={naira(m.forged_webhook_summary.net_lost)}
            strong
          />
          <DetailRow
            label="Accounts involved"
            value={count(m.forged_webhook_summary.accounts)}
          />
        </CollapsibleSection>
      )}

      {/* Transactions */}
      {m.total_transactions && (
        <CollapsibleSection
          id="transactions"
          title="Transactions"
          icon={Activity}
          periodLabel={periodLabel}
          open={!!openMap["transactions"]}
          onToggle={toggle}
        >
          <DetailRow
            label="All transactions"
            value={count(m.total_transactions.count)}
          />
          <DetailRow
            label="Successful"
            value={count(m.total_transactions.success_count)}
          />
          <DetailRow
            label="Successful volume"
            value={naira(m.total_transactions.success_volume)}
            strong
          />
        </CollapsibleSection>
      )}
    </div>
  );
}
