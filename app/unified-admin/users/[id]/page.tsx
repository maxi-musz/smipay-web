"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  Wallet,
  MapPin,
  Fingerprint,
  CreditCard,
  Headphones,
  ScrollText,
  Calendar,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  UserCog,
  ShieldAlert,
  Award,
  Gift,
} from "lucide-react";
import { adminUsersApi } from "@/services/admin/users-api";
import type { AdminUserDetail, AdminUser } from "@/types/admin/users";
import { UserRoleModal } from "../_components/UserRoleModal";
import { UserStatusModal } from "../_components/UserStatusModal";
import { UserTierModal } from "../_components/UserTierModal";
import { UserBalanceAdjustModal } from "../_components/UserBalanceAdjustModal";

function formatNGN(value: number | null | undefined): string {
  if (value == null) return "—";
  return `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-dashboard-border/20 last:border-0 min-w-0">
      <span className="text-xs text-dashboard-muted shrink-0">{label}</span>
      <span className="text-xs text-dashboard-heading text-right min-w-0 break-all">{value ?? "—"}</span>
    </div>
  );
}

function VerifyIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 inline" />
  ) : (
    <XCircle className="h-3.5 w-3.5 text-red-400 inline" />
  );
}

const statusBadge: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700" },
  suspended: { bg: "bg-red-50", text: "text-red-700" },
};

const kycStatusBadge: Record<string, { bg: string; text: string }> = {
  approved: { bg: "bg-emerald-50", text: "text-emerald-700" },
  pending: { bg: "bg-amber-50", text: "text-amber-700" },
  rejected: { bg: "bg-red-50", text: "text-red-700" },
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleOpen, setRoleOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [tierOpen, setTierOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminUsersApi.getById(id);
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setError(res.message || "User not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const handleUpdated = (_updated: AdminUser) => {
    fetchUser();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard-bg animate-pulse">
        <div className="bg-dashboard-surface border-b border-dashboard-border/60 px-4 py-4 sm:px-6 lg:px-8">
          <div className="h-6 w-48 bg-dashboard-border/40 rounded" />
        </div>
        <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-40 bg-dashboard-surface rounded-xl border border-dashboard-border/40" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-3">{error || "User not found"}</p>
          <button type="button" onClick={() => router.back()} className="text-xs text-brand-bg-primary underline">Go back</button>
        </div>
      </div>
    );
  }

  const userName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || user.phone_number;
  const sStyle = statusBadge[user.account_status] ?? statusBadge.active;

  const asAdminUser: AdminUser = {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    middle_name: user.middle_name,
    email: user.email,
    phone_number: user.phone_number,
    smipay_tag: user.smipay_tag,
    role: user.role,
    gender: user.gender,
    date_of_birth: user.date_of_birth,
    account_status: user.account_status,
    is_email_verified: user.is_email_verified,
    is_phone_verified: user.is_phone_verified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    tier: user.tier,
    profile_image: user.profile_image,
    kyc_verification: user.kyc_verification
      ? {
          status: user.kyc_verification.status,
          is_verified: user.kyc_verification.is_verified,
          bvn_verified: user.kyc_verification.bvn_verified,
          id_type: user.kyc_verification.id_type,
        }
      : null,
    wallet: user.wallet
      ? {
          current_balance: user.wallet.current_balance,
          all_time_fuunding: user.wallet.all_time_fuunding,
        }
      : null,
    last_activity: null,
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-dashboard-bg transition-colors">
              <ArrowLeft className="h-4 w-4 text-dashboard-muted" />
            </button>
            <div className="flex items-center gap-3">
              {user.profile_image?.secure_url ? (
                <img src={user.profile_image.secure_url} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-brand-bg-primary/10 text-brand-bg-primary flex items-center justify-center font-bold text-sm">
                  {user.first_name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div>
                <h1 className="text-base font-bold text-dashboard-heading">{userName}</h1>
                {user.smipay_tag && <p className="text-xs text-dashboard-muted">@{user.smipay_tag}</p>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={fetchUser} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg transition-colors">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <button type="button" onClick={() => setRoleOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">
              <UserCog className="h-3.5 w-3.5" /> Role
            </button>
            <button type="button" onClick={() => setTierOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors">
              <Award className="h-3.5 w-3.5" /> Tier
            </button>
            <button
              type="button"
              onClick={() => setStatusOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                user.account_status === "active"
                  ? "border border-red-200 text-red-600 hover:bg-red-50"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {user.account_status === "active" ? "Suspend" : "Activate"}
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 max-w-5xl space-y-4">
        {/* Profile */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-brand-bg-primary" />
            <h2 className="text-sm font-bold text-dashboard-heading">Profile</h2>
            <span className={`ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-medium capitalize ${sStyle.bg} ${sStyle.text}`}>
              {user.account_status}
            </span>
          </div>
          <InfoRow label="Full Name" value={[user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ") || "—"} />
          <InfoRow label="Email" value={<span className="inline-flex items-center gap-1">{user.email ?? "—"} <VerifyIcon ok={user.is_email_verified} /></span>} />
          <InfoRow label="Phone" value={<span className="inline-flex items-center gap-1">{user.phone_number} <VerifyIcon ok={user.is_phone_verified} /></span>} />
          <InfoRow label="Smipay Tag" value={user.smipay_tag ? `@${user.smipay_tag}` : "—"} />
          <InfoRow label="Role" value={<span className="capitalize">{user.role.replace(/_/g, " ")}</span>} />
          <InfoRow label="Gender" value={<span className="capitalize">{user.gender ?? "—"}</span>} />
          <InfoRow label="Date of Birth" value={user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : "—"} />
          <InfoRow label="Tier" value={user.tier ? user.tier.name : <span className="text-dashboard-muted">No tier</span>} />
          <InfoRow label="Referral Code" value={user.referral_code} />
          <InfoRow label="Joined" value={`${formatDateTime(user.createdAt)} (${relativeTime(user.createdAt)})`} />
          <InfoRow label="Updated" value={formatDateTime(user.updatedAt)} />
        </motion.section>

        {/* Wallet & cashback */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-5"
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Wallet className="h-4 w-4 text-emerald-600 shrink-0" />
            <h2 className="text-sm font-bold text-dashboard-heading">Wallet & cashback</h2>
            <button
              type="button"
              onClick={() => setBalanceOpen(true)}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-violet-200 text-violet-700 hover:bg-violet-50 transition-colors"
            >
              <Gift className="h-3.5 w-3.5" />
              Adjust balances
            </button>
          </div>

          {user.wallet ? (
            <>
              {!user.wallet.isActive && (
                <p className="text-[11px] text-red-600 mb-2">Main wallet is marked inactive.</p>
              )}
              <InfoRow
                label="Main balance"
                value={<span className="font-semibold text-emerald-600">{formatNGN(user.wallet.current_balance)}</span>}
              />
              <InfoRow label="All-time funding" value={formatNGN(user.wallet.all_time_fuunding)} />
              <InfoRow label="All-time withdrawn" value={formatNGN(user.wallet.all_time_withdrawn)} />
            </>
          ) : (
            <p className="text-xs text-dashboard-muted mb-3">No main wallet record — only cashback adjustments are available.</p>
          )}

          <div className="mt-4 pt-3 border-t border-dashboard-border/20">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-3.5 w-3.5 text-violet-600" />
              <span className="text-[11px] font-semibold text-dashboard-heading">Cashback wallet</span>
              {user.cashbackWallet && !user.cashbackWallet.isActive && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700">Inactive</span>
              )}
            </div>
            <InfoRow
              label="Cashback balance"
              value={
                <span className="font-semibold text-violet-700">
                  {formatNGN(user.cashbackWallet?.current_balance ?? 0)}
                </span>
              }
            />
            {user.cashbackWallet && (
              <>
                <InfoRow label="Cashback all-time earned" value={formatNGN(user.cashbackWallet.all_time_earned)} />
                <InfoRow label="Cashback all-time withdrawn" value={formatNGN(user.cashbackWallet.all_time_withdrawn)} />
              </>
            )}
          </div>
        </motion.section>

        {/* KYC */}
        {user.kyc_verification && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Fingerprint className="h-4 w-4 text-sky-600" />
              <h2 className="text-sm font-bold text-dashboard-heading">KYC Verification</h2>
              {(() => {
                const ks = kycStatusBadge[user.kyc_verification!.status] ?? { bg: "bg-slate-100", text: "text-slate-600" };
                return (
                  <span className={`ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-medium capitalize ${ks.bg} ${ks.text}`}>
                    {user.kyc_verification!.status}
                  </span>
                );
              })()}
            </div>
            <InfoRow label="KYC Name" value={[user.kyc_verification.first_name, user.kyc_verification.middle_name, user.kyc_verification.last_name].filter(Boolean).join(" ") || "—"} />
            <InfoRow label="ID Type" value={user.kyc_verification.id_type?.replace(/_/g, " ") ?? "—"} />
            <InfoRow label="ID Number" value={user.kyc_verification.id_no ? `***${user.kyc_verification.id_no.slice(-4)}` : "—"} />
            <InfoRow label="BVN" value={<span className="inline-flex items-center gap-1">{user.kyc_verification.bvn ? `***${user.kyc_verification.bvn.slice(-4)}` : "—"} <VerifyIcon ok={user.kyc_verification.bvn_verified} /></span>} />
            <InfoRow label="NIN" value={user.kyc_verification.nin ? `***${user.kyc_verification.nin.slice(-4)}` : "—"} />
            <InfoRow label="Watchlisted" value={user.kyc_verification.watchlisted ? <span className="text-red-600 font-medium">Yes</span> : "No"} />
            <InfoRow label="State of Origin" value={user.kyc_verification.state_of_origin} />
            <InfoRow label="State of Residence" value={user.kyc_verification.state_of_residence} />
            <InfoRow label="Initiated" value={user.kyc_verification.initiated_at ? formatDateTime(user.kyc_verification.initiated_at) : "—"} />
            <InfoRow label="Approved" value={user.kyc_verification.approved_at ? formatDateTime(user.kyc_verification.approved_at) : "—"} />
            {user.kyc_verification.failure_reason && (
              <InfoRow label="Failure Reason" value={<span className="text-red-600">{user.kyc_verification.failure_reason}</span>} />
            )}
          </motion.section>
        )}

        {/* Address */}
        {user.address && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-orange-600" />
              <h2 className="text-sm font-bold text-dashboard-heading">Address</h2>
            </div>
            <InfoRow label="Address" value={user.address.home_address} />
            <InfoRow label="House Number" value={user.address.house_number} />
            <InfoRow label="City" value={user.address.city} />
            <InfoRow label="State" value={user.address.state} />
            <InfoRow label="Country" value={user.address.country} />
            <InfoRow label="Postal Code" value={user.address.postal_code} />
          </motion.section>
        )}

        {/* Counts / Quick Links */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href={`/unified-admin/transactions?user_id=${user.id}`}
            className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-4 hover:border-brand-bg-primary/30 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span className="text-[11px] font-medium text-dashboard-muted">Transactions</span>
              <ExternalLink className="h-3 w-3 ml-auto text-dashboard-muted/40 group-hover:text-brand-bg-primary transition-colors" />
            </div>
            <p className="text-lg font-bold text-dashboard-heading">View</p>
          </Link>
          <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Headphones className="h-4 w-4 text-purple-600" />
              <span className="text-[11px] font-medium text-dashboard-muted">Support Tickets</span>
            </div>
            <p className="text-lg font-bold text-dashboard-heading">{user._count.supportTickets}</p>
          </div>
          <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-4">
            <div className="flex items-center gap-2 mb-1">
              <ScrollText className="h-4 w-4 text-slate-500" />
              <span className="text-[11px] font-medium text-dashboard-muted">Audit Logs</span>
            </div>
            <p className="text-lg font-bold text-dashboard-heading">{user._count.auditLogs}</p>
          </div>
        </motion.section>
      </div>

      {roleOpen && (
        <UserRoleModal user={asAdminUser} open={roleOpen} onClose={() => setRoleOpen(false)} onUpdated={handleUpdated} />
      )}
      {statusOpen && (
        <UserStatusModal user={asAdminUser} open={statusOpen} onClose={() => setStatusOpen(false)} onUpdated={handleUpdated} />
      )}
      {tierOpen && (
        <UserTierModal user={asAdminUser} open={tierOpen} onClose={() => setTierOpen(false)} onUpdated={handleUpdated} />
      )}
      {balanceOpen && (
        <UserBalanceAdjustModal
          user={asAdminUser}
          open={balanceOpen}
          onClose={() => setBalanceOpen(false)}
          onSuccess={fetchUser}
          wallet={user.wallet}
          cashbackWallet={user.cashbackWallet ?? null}
        />
      )}
    </div>
  );
}
