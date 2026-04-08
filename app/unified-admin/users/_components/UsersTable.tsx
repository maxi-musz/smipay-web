"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Eye, ShieldAlert, UserCog } from "lucide-react";
import type { AdminUser } from "@/types/admin/users";

function formatNGN(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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

const statusBadge: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  suspended: "bg-red-50 text-red-700",
};

const kycBadge: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700",
  verified: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  rejected: "bg-red-50 text-red-700",
  none: "bg-slate-100 text-slate-500",
};

interface Props {
  users: AdminUser[];
  onEditRole: (user: AdminUser) => void;
  onEditStatus: (user: AdminUser) => void;
  onEditTier: (user: AdminUser) => void;
}

export function UsersTable({ users, onEditRole, onEditStatus, onEditTier }: Props) {
  if (!users.length) {
    return (
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-12 text-center">
        <p className="text-sm text-dashboard-muted">No users found</p>
      </div>
    );
  }

  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-xs">
          <thead>
            <tr className="border-b border-dashboard-border/40 bg-dashboard-bg/50">
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">User</th>
              <th className="text-right px-4 py-2.5 font-medium text-dashboard-muted min-w-[120px]">
                Balance
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">Role</th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">Status</th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">KYC</th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">Tier</th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">Last Activity</th>
              <th className="text-right px-4 py-2.5 font-medium text-dashboard-muted">Joined</th>
              <th className="text-right px-4 py-2.5 font-medium text-dashboard-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => {
              const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || user.phone_number;
              const avatar = user.first_name?.[0]?.toUpperCase() ?? "?";
              const kycStatus = user.kyc_verification?.status ?? "none";
              return (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-dashboard-border/20 hover:bg-dashboard-bg/40 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <Link href={`/unified-admin/users/${user.id}`} className="flex items-center gap-2">
                      {user.profile_image?.secure_url ? (
                        <img src={user.profile_image.secure_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-brand-bg-primary/10 text-brand-bg-primary flex items-center justify-center text-[10px] font-bold">
                          {avatar}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-dashboard-heading truncate max-w-[140px]">{name}</p>
                        {user.smipay_tag && (
                          <p className="text-[10px] text-dashboard-muted">@{user.smipay_tag}</p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right align-top">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs font-semibold tabular-nums text-emerald-700">
                        {formatNGN(user.wallet?.current_balance ?? 0)}
                      </span>
                      <span className="text-[10px] text-dashboard-muted tabular-nums">
                        All-time funded {formatNGN(user.wallet?.all_time_fuunding ?? 0)}
                      </span>
                      <span className="text-[10px] text-violet-700/90 tabular-nums">
                        Cashback {formatNGN(user.cashbackWallet?.current_balance ?? 0)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs capitalize text-dashboard-heading">{user.role.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusBadge[user.account_status] ?? "bg-slate-100 text-slate-600"}`}>
                      {user.account_status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${kycBadge[kycStatus] ?? kycBadge.none}`}>
                      {kycStatus === "approved" ? "verified" : kycStatus}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {user.tier ? (
                      <span className="text-xs text-dashboard-heading">{user.tier.name}</span>
                    ) : (
                      <span className="text-xs text-dashboard-muted">No tier</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 max-w-[180px]">
                    {user.last_activity ? (
                      <span className="text-[11px] text-dashboard-muted truncate block" title={user.last_activity.description}>
                        {user.last_activity.description.length > 30
                          ? user.last_activity.description.slice(0, 30) + "..."
                          : user.last_activity.description}
                        <span className="ml-1 text-dashboard-muted/60">{relativeTime(user.last_activity.timestamp)}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-dashboard-muted/50">No activity</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-dashboard-muted whitespace-nowrap" title={new Date(user.createdAt).toLocaleString()}>
                    {relativeTime(user.createdAt)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        href={`/unified-admin/users/${user.id}`}
                        className="p-1.5 rounded-lg hover:bg-dashboard-bg text-dashboard-muted hover:text-dashboard-heading transition-colors"
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEditRole(user); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-dashboard-muted hover:text-blue-600 transition-colors"
                        title="Edit Role"
                      >
                        <UserCog className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEditStatus(user); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-dashboard-muted hover:text-red-600 transition-colors"
                        title={user.account_status === "active" ? "Suspend" : "Activate"}
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
