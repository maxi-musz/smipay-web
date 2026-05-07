"use client";

import { useState } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowLeft,
  MapPin,
  Shield,
  Wallet,
  Crown,
  Zap,
  Lock,
  ChevronRight,
  TrendingUp,
  Check,
  X,
  Gift,
  Copy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { AvailableTier } from "@/types/user";

function formatNaira(value: number): string {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
  return `₦${value.toLocaleString()}`;
}

const TIER_STYLES: Record<string, { gradient: string; badge: string; icon: typeof Crown }> = {
  UNVERIFIED: { gradient: "from-slate-500 to-slate-600", badge: "bg-slate-100 text-slate-700", icon: Shield },
  VERIFIED: { gradient: "from-blue-500 to-blue-700", badge: "bg-blue-50 text-blue-700", icon: CheckCircle },
  PREMIUM: { gradient: "from-amber-500 to-orange-600", badge: "bg-amber-50 text-amber-700", icon: Crown },
};

function getTierStyle(tier: string) {
  return TIER_STYLES[tier] ?? TIER_STYLES.UNVERIFIED;
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-dashboard-border/50 animate-pulse shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-5 w-24 bg-dashboard-border/60 rounded animate-pulse" />
            <div className="h-3.5 w-32 bg-dashboard-border/40 rounded animate-pulse" />
          </div>
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 max-w-2xl mx-auto space-y-4">
        {/* Profile card skeleton */}
        <div className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface p-4 sm:p-5">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-dashboard-border/50 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 bg-dashboard-border/60 rounded animate-pulse" />
              <div className="h-3 w-48 bg-dashboard-border/40 rounded animate-pulse" />
              <div className="flex gap-2 mt-2">
                <div className="h-5 w-16 bg-dashboard-border/40 rounded-full animate-pulse" />
                <div className="h-5 w-14 bg-dashboard-border/40 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4 pb-0.5">
          {[1, 2].map((i) => (
            <div key={i} className="h-9 w-24 rounded-full bg-dashboard-border/50 animate-pulse shrink-0" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
            <div className="px-4 py-3 sm:px-5 border-b border-dashboard-border/40">
              <div className="h-4 w-40 bg-dashboard-border/50 rounded animate-pulse" />
            </div>
            <div className="p-4 sm:p-5 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="h-4 w-4 rounded bg-dashboard-border/40 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-20 bg-dashboard-border/40 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-dashboard-border/50 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
            <div className="px-4 py-3 sm:px-5 border-b border-dashboard-border/40">
              <div className="h-4 w-24 bg-dashboard-border/50 rounded animate-pulse" />
            </div>
            <div className="p-4 sm:p-5 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="h-4 w-4 rounded bg-dashboard-border/40 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-16 bg-dashboard-border/40 rounded animate-pulse" />
                    <div className="h-4 w-28 bg-dashboard-border/50 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "personal", label: "Personal Info" },
  { id: "wallet", label: "Wallet" },
  { id: "referral", label: "Referral" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ProfilePage() {
  const { profile, isLoading, error } = useUserProfile();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("personal");

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center px-4">
        <div className="bg-dashboard-surface rounded-xl shadow-sm p-4 sm:p-6 border border-red-200 max-w-md w-full">
          <p className="text-red-600 text-center text-sm">{error}</p>
          <Button onClick={() => router.push("/dashboard")} className="w-full mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const { user, address, kyc_verification, wallet_card, current_tier, available_tiers, referral_analysis } = profile;

  const sortedTiers = available_tiers
    ? [...available_tiers].sort((a, b) => a.order - b.order)
    : [];
  const currentTierOrder = sortedTiers.find((t) => t.is_current)?.order ?? 0;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header */}
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
            className="h-9 w-9 shrink-0 rounded-xl text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-border/50 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-dashboard-heading tracking-tight">
              Profile
            </h1>
            <p className="text-xs sm:text-sm text-dashboard-muted mt-0.5 truncate">
              Manage your account
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 max-w-2xl mx-auto space-y-4">
        {/* Profile Card — always visible */}
        <div className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface p-4 sm:p-5">
          <div className="flex items-center gap-3.5 sm:gap-4">
            {user.profile_image ? (
              <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden shrink-0 ring-2 ring-dashboard-border/40">
                <Image
                  src={user.profile_image}
                  alt={user.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ) : (
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-brand-bg-primary to-indigo-700 text-white flex items-center justify-center text-lg sm:text-xl font-bold shrink-0 ring-2 ring-dashboard-border/40">
                {user.first_name[0]}{user.last_name[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-dashboard-heading truncate">
                {user.name}
              </h2>
              <p className="text-xs sm:text-sm text-dashboard-muted truncate">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {user.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </span>
                )}
                {current_tier && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold ${getTierStyle(current_tier.tier).badge}`}>
                    {(() => { const TIcon = getTierStyle(current_tier.tier).icon; return <TIcon className="h-3 w-3" />; })()}
                    {current_tier.name}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-dashboard-bg text-dashboard-muted">
                  Since {new Date(user.joined).getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4 pb-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                activeTab === tab.id
                  ? "bg-brand-bg-primary text-white shadow-sm"
                  : "bg-dashboard-surface text-dashboard-muted ring-1 ring-dashboard-border/50 hover:ring-brand-bg-primary/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Danger zone entry point */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/profile/delete-account")}
            className="text-[11px] sm:text-xs font-medium text-red-600 hover:text-red-700 hover:underline underline-offset-4"
          >
            Delete my account
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "personal" && (
          <div className="space-y-4">
            {/* Personal Information */}
            <div className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
              <div className="px-4 py-3 sm:px-5 border-b border-dashboard-border/40">
                <h3 className="text-sm sm:text-base font-semibold text-dashboard-heading">Personal Information</h3>
              </div>
              <div className="p-4 sm:p-5 space-y-3">
                <InfoRow icon={User} label="Full Name" value={user.name} />
                <InfoRow icon={Mail} label="Email" value={user.email} />
                <InfoRow icon={Phone} label="Phone" value={user.phone_number} />
                <InfoRow icon={User} label="Gender" value={user.gender} capitalize />
                <InfoRow
                  icon={Calendar}
                  label="Date of Birth"
                  value={
                    user.date_of_birth
                      ? new Date(user.date_of_birth).toLocaleDateString("en-US", {
                          year: "numeric", month: "long", day: "numeric",
                        })
                      : ""
                  }
                />
              </div>
            </div>

            {/* Address */}
            <div className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
              <div className="px-4 py-3 sm:px-5 border-b border-dashboard-border/40">
                <h3 className="text-sm sm:text-base font-semibold text-dashboard-heading">Address</h3>
              </div>
              <div className="p-4 sm:p-5 space-y-3">
                {address ? (
                  <>
                    <InfoRow icon={MapPin} label="Street" value={address.house_address} />
                    <InfoRow icon={MapPin} label="City" value={address.city} />
                    <InfoRow icon={MapPin} label="State" value={address.state} />
                    <InfoRow icon={MapPin} label="Country" value={address.country} />
                    <InfoRow icon={CreditCard} label="Postal Code" value={address.postal_code} />
                  </>
                ) : (
                  <p className="text-xs sm:text-sm text-dashboard-muted py-3 text-center">
                    No address on file
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Verification tab — commented out for now
        {activeTab === "verification" && (
          <div className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
            <div className="px-4 py-3 sm:px-5 border-b border-dashboard-border/40">
              <h3 className="text-sm sm:text-base font-semibold text-dashboard-heading">KYC Verification</h3>
            </div>
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-dashboard-bg/60">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
                    <Shield className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-dashboard-muted">Status</p>
                    <p className="text-sm sm:text-base font-semibold text-dashboard-heading capitalize">
                      {kyc_verification.status}
                    </p>
                  </div>
                </div>
                {kyc_verification.is_active ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                )}
              </div>
              <InfoRow icon={CreditCard} label="ID Type" value={kyc_verification.id_type.replace(/_/g, " ")} capitalize />
              <InfoRow icon={CreditCard} label="ID Number" value={kyc_verification.id_number} mono />
            </div>
          </div>
        )}
        */}

        {activeTab === "referral" && (
          <div className="space-y-4">
            {/* Referral Code Card */}
            <div className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
              <div className="px-4 py-3 sm:px-5 border-b border-dashboard-border/40">
                <h3 className="text-sm sm:text-base font-semibold text-dashboard-heading">Your Referral Code</h3>
                <p className="text-[10px] sm:text-xs text-dashboard-muted mt-0.5">
                  Share this code with friends — you both earn when they sign up and transact
                </p>
              </div>
              <div className="p-4 sm:p-5">
                <ReferralCodeDisplay
                  code={user.referral_code || user.smipay_tag || ""}
                />
              </div>
            </div>

            {/* Referral Analysis */}
            {referral_analysis && (
              <div className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
                <div className="px-4 py-3 sm:px-5 border-b border-dashboard-border/40">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-brand-bg-primary shrink-0" />
                    <h3 className="text-sm sm:text-base font-semibold text-dashboard-heading">Referral Stats</h3>
                  </div>
                </div>
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-2.5">
                    <StatCard
                      label="Total Referred"
                      value={String(referral_analysis.total_referred)}
                      bg="bg-brand-bg-primary/10"
                      color="text-brand-bg-primary"
                    />
                    <StatCard
                      label="Slots Remaining"
                      value={String(referral_analysis.slots_remaining)}
                      bg="bg-emerald-50"
                      color="text-emerald-600"
                    />
                    <StatCard
                      label="You Earned"
                      value={`₦${referral_analysis.referrer_rewards_total_amount.toLocaleString()}`}
                      bg="bg-amber-50"
                      color="text-amber-700"
                    />
                    <StatCard
                      label="Friends Earned"
                      value={`₦${referral_analysis.referee_rewards_total_amount.toLocaleString()}`}
                      bg="bg-blue-50"
                      color="text-blue-600"
                    />
                  </div>

                  {referral_analysis.by_status && Object.keys(referral_analysis.by_status).length > 0 && (
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold text-dashboard-muted uppercase tracking-wider mb-2">
                        Status Breakdown
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(referral_analysis.by_status).map(([status, count]) =>
                          (count ?? 0) > 0 ? (
                            <span
                              key={status}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-dashboard-bg text-[11px] font-medium text-dashboard-heading"
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}: {count}
                            </span>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  {referral_analysis.program_config && (
                    <div className="pt-3 border-t border-dashboard-border/40">
                      <p className="text-[10px] sm:text-xs font-semibold text-dashboard-muted uppercase tracking-wider mb-2">
                        Program Details
                      </p>
                      <div className="space-y-1.5 text-xs sm:text-sm text-dashboard-muted">
                        <p>
                          You earn ₦{referral_analysis.program_config.referrer_reward_amount?.toLocaleString() ?? "—"} per referral;
                          friends earn ₦{referral_analysis.program_config.referee_reward_amount?.toLocaleString() ?? "—"}.
                        </p>
                        <p>
                          Trigger: {referral_analysis.program_config.reward_trigger?.replace(/_/g, " ") ?? "—"} · Max{" "}
                          {referral_analysis.program_config.max_referrals_per_user ?? "—"} referrals per user.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!referral_analysis && (
              <div className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface p-6 text-center">
                <p className="text-sm text-dashboard-muted">Referral stats will appear here once you start referring friends.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "wallet" && (
          <div className="space-y-4">
            {/* Wallet Summary */}
            <div
              className="rounded-2xl text-white overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}
            >
              <div className="p-4 sm:p-5 space-y-4">
                <div>
                  <p className="text-[11px] sm:text-xs text-slate-400 uppercase tracking-wider mb-0.5">
                    Current Balance
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {wallet_card.current_balance}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-0.5">All Time Funding</p>
                    <p className="text-sm sm:text-base font-bold">{wallet_card.all_time_fuunding}</p>
                  </div>
                  <div className="bg-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-0.5">All Time Withdrawn</p>
                    <p className="text-sm sm:text-base font-bold">{wallet_card.all_time_withdrawn}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-xs text-slate-400">Wallet Status</span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    wallet_card.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {wallet_card.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Stats */}
            <div className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
              <div className="px-4 py-3 sm:px-5 border-b border-dashboard-border/40">
                <h3 className="text-sm sm:text-base font-semibold text-dashboard-heading">Account Stats</h3>
              </div>
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-2.5">
                  <StatCard label="Total Cards" value={String(user.totalCards)} bg="bg-blue-50" color="text-blue-600" />
                  <StatCard label="Total Accounts" value={String(user.totalAccounts)} bg="bg-emerald-50" color="text-emerald-600" />
                  <StatCard
                    label="Wallet Balance"
                    value={`₦${user.wallet_balance >= 1000 ? `${(user.wallet_balance / 1000).toFixed(1)}K` : user.wallet_balance.toLocaleString()}`}
                    bg="bg-purple-50"
                    color="text-purple-600"
                  />
                  <StatCard
                    label="Joined"
                    value={String(new Date(user.joined).getFullYear())}
                    bg="bg-orange-50"
                    color="text-orange-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tiers & Limits tab — commented out for now
        {activeTab === "tiers" && (
          <div className="space-y-4">
            {current_tier && (
              <div className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
                <div className={`bg-gradient-to-r ${getTierStyle(current_tier.tier).gradient} px-4 py-3 sm:px-5 sm:py-4 text-white`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 bg-white/20 rounded-lg shrink-0">
                        {(() => { const TIcon = getTierStyle(current_tier.tier).icon; return <TIcon className="h-4 w-4 sm:h-5 sm:w-5" />; })()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold truncate">{current_tier.name}</h3>
                        <p className="text-[11px] sm:text-xs text-white/80 line-clamp-1">{current_tier.description}</p>
                      </div>
                    </div>
                    {current_tier.is_active && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 shrink-0">Active</span>
                    )}
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <p className="text-[10px] sm:text-xs font-semibold text-dashboard-muted uppercase tracking-wider mb-2.5">
                    Transaction Limits
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <LimitCard label="Per Transaction" value={current_tier.limits.singleTransaction} />
                    <LimitCard label="Daily" value={current_tier.limits.daily} />
                    <LimitCard label="Monthly" value={current_tier.limits.monthly} />
                    <LimitCard label="Airtime Daily" value={current_tier.limits.airtimeDaily} />
                  </div>
                </div>
              </div>
            )}
            {sortedTiers.length > 0 && (
              <div className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
                <div className="px-4 py-3 sm:px-5 border-b border-dashboard-border/40">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-brand-bg-primary shrink-0" />
                    <h3 className="text-sm sm:text-base font-semibold text-dashboard-heading">Upgrade Path</h3>
                  </div>
                </div>
                <div className="p-4 sm:p-5 space-y-3">
                  {sortedTiers.map((tier, idx) => (
                    <TierCard
                      key={tier.id}
                      tier={tier}
                      currentTierOrder={currentTierOrder}
                      isLast={idx === sortedTiers.length - 1}
                      kycStatus={kyc_verification.status}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        */}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function ReferralCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!code) {
    return (
      <p className="text-sm text-dashboard-muted">No referral code available</p>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-dashboard-bg/60 border border-dashboard-border/40">
      <span className="text-lg sm:text-xl font-bold font-mono text-dashboard-heading tracking-wider flex-1 truncate">
        {code}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-brand-bg-primary hover:bg-brand-bg-primary/90 rounded-lg transition-colors shrink-0"
      >
        {copied ? (
          <>
            <CheckCircle className="h-4 w-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy
          </>
        )}
      </button>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  capitalize: cap,
  mono,
}: {
  icon: typeof User;
  label: string;
  value: string;
  capitalize?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-dashboard-border/30 last:border-0">
      <Icon className="h-4 w-4 text-dashboard-muted shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-xs text-dashboard-muted">{label}</p>
        <p className={`text-sm sm:text-base font-medium text-dashboard-heading truncate ${cap ? "capitalize" : ""} ${mono ? "font-mono" : ""}`}>
          {value || ""}
        </p>
      </div>
    </div>
  );
}

function LimitCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-dashboard-bg/60 rounded-xl p-2.5 sm:p-3 text-center">
      <p className="text-sm sm:text-base font-bold text-dashboard-heading mb-0.5">
        {formatNaira(value)}
      </p>
      <p className="text-[10px] sm:text-xs text-dashboard-muted font-medium leading-tight">
        {label}
      </p>
    </div>
  );
}

function StatCard({ label, value, bg, color }: { label: string; value: string; bg: string; color: string }) {
  return (
    <div className={`text-center p-3 sm:p-4 ${bg} rounded-xl`}>
      <p className={`text-lg sm:text-xl font-bold ${color} mb-0.5`}>{value}</p>
      <p className="text-[10px] sm:text-xs font-medium text-dashboard-muted leading-tight">{label}</p>
    </div>
  );
}

function TierCard({
  tier,
  currentTierOrder,
  isLast,
  kycStatus,
}: {
  tier: AvailableTier;
  currentTierOrder: number;
  isLast: boolean;
  kycStatus: string;
}) {
  const style = getTierStyle(tier.tier);
  const Icon = style.icon;
  const isCurrent = tier.is_current;
  const isCompleted = tier.order < currentTierOrder;
  const isNext = tier.order === currentTierOrder + 1;
  const isLocked = tier.order > currentTierOrder + 1;

  const kycApproved = kycStatus === "approved";

  const requirementMet = (req: string): boolean => {
    const lower = req.toLowerCase();
    if (lower.includes("phone")) return true;
    if (lower.includes("email")) return true;
    if (lower.includes("kyc") || lower.includes("bvn") || lower.includes("nin")) return kycApproved;
    if (lower.includes("face")) return kycApproved;
    if (lower.includes("address")) return kycApproved;
    return false;
  };

  return (
    <div className="relative">
      <div
        className={`rounded-xl border overflow-hidden transition-all ${
          isCurrent
            ? "border-brand-bg-primary shadow-sm"
            : isCompleted
              ? "border-emerald-200 bg-emerald-50/20"
              : isLocked
                ? "border-dashboard-border/40 opacity-60"
                : "border-dashboard-border/60"
        }`}
      >
        <div className={`px-3 py-2.5 sm:px-4 sm:py-3 ${
          isCurrent ? `bg-gradient-to-r ${style.gradient} text-white` : "bg-dashboard-surface"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg shrink-0 ${
              isCurrent ? "bg-white/20" : isCompleted ? "bg-emerald-100" : "bg-dashboard-bg/60"
            }`}>
              {isLocked ? (
                <Lock className={`h-4 w-4 ${isCurrent ? "text-white" : "text-dashboard-muted/50"}`} />
              ) : isCompleted ? (
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              ) : (
                <Icon className={`h-4 w-4 ${isCurrent ? "text-white" : "text-dashboard-heading"}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className={`font-semibold text-xs sm:text-sm ${isCurrent ? "text-white" : "text-dashboard-heading"}`}>
                  {tier.name}
                </h4>
                {isCurrent && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/25">Current</span>
                )}
                {isCompleted && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">Done</span>
                )}
              </div>
              <div className={`flex items-center gap-2 mt-0.5 text-[10px] sm:text-xs ${isCurrent ? "text-white/80" : "text-dashboard-muted"}`}>
                <span>{formatNaira(tier.limits.singleTransaction)}/tx</span>
                <span>·</span>
                <span>{formatNaira(tier.limits.daily)}/day</span>
              </div>
            </div>
            {(isNext || isCurrent) && tier.requirements.length > 0 && (
              <ChevronRight className={`h-4 w-4 shrink-0 ${isCurrent ? "text-white/60" : "text-dashboard-muted/40"}`} />
            )}
          </div>
        </div>

        {(isNext || (isCurrent && tier.requirements.length > 0)) && (
          <div className="px-3 py-2.5 sm:px-4 sm:py-3 bg-dashboard-bg/40 border-t border-dashboard-border/30">
            <p className="text-[9px] sm:text-[10px] font-semibold text-dashboard-muted uppercase tracking-wider mb-1.5">
              Requirements
            </p>
            <div className="space-y-1">
              {tier.requirements.map((req) => {
                const met = isCurrent || isCompleted || requirementMet(req);
                return (
                  <div key={req} className="flex items-center gap-1.5">
                    {met ? (
                      <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="h-3 w-3 text-red-400 shrink-0" />
                    )}
                    <span className={`text-[11px] sm:text-xs ${met ? "text-dashboard-heading" : "text-dashboard-muted"}`}>
                      {req}
                    </span>
                  </div>
                );
              })}
            </div>
            {isNext && !isCurrent && (
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-white bg-brand-bg-primary hover:bg-brand-bg-primary/90 rounded-lg transition-colors"
              >
                <Zap className="h-3 w-3" />
                Start Upgrade
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {isLocked && (
          <div className="px-3 py-2 bg-dashboard-bg/30 border-t border-dashboard-border/30 flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-dashboard-muted/50 shrink-0" />
            <span className="text-[11px] text-dashboard-muted">Complete previous tier to unlock</span>
          </div>
        )}
      </div>

      {!isLast && (
        <div className="flex justify-center py-0.5">
          <div className="w-0.5 h-3 bg-dashboard-border/40" />
        </div>
      )}
    </div>
  );
}
