"use client";

import { motion } from "motion/react";
import { Check, X, Loader2 } from "lucide-react";
import { REFERRAL_STATUSES } from "@/types/admin/referrals";
import type { ReferralItem } from "@/types/admin/referrals";

interface ReferralsTableProps {
  referrals: ReferralItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return "—";
  return `₦${amount.toLocaleString()}`;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  eligible: "bg-blue-50 text-blue-700 border-blue-200",
  rewarded: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partially_rewarded: "bg-orange-50 text-orange-700 border-orange-200",
  expired: "bg-slate-100 text-slate-600 border-slate-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const ACTIONABLE_STATUSES: string[] = ["pending", "eligible", "expired"];

export function ReferralsTable({
  referrals,
  onApprove,
  onReject,
}: ReferralsTableProps) {
  if (referrals.length === 0) {
    return (
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 px-6 py-12 text-center">
        <p className="text-sm text-dashboard-muted">No referrals found</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-xs">
          <thead>
            <tr className="border-b border-dashboard-border/60">
              {[
                "Date",
                "Referrer",
                "Referee",
                "Code",
                "Status",
                "Registered",
                "First Tx",
                "Referrer Reward",
                "Referee Reward",
                "Actions",
              ].map((label) => (
                <th
                  key={label}
                  className="px-3 py-2.5 text-left font-semibold text-dashboard-muted uppercase tracking-wider whitespace-nowrap"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dashboard-border/40">
            {referrals.map((ref) => {
              const statusMeta = REFERRAL_STATUSES.find((s) => s.value === ref.status);
              const canAct = ACTIONABLE_STATUSES.includes(ref.status);

              return (
                <tr
                  key={ref.id}
                  className="hover:bg-dashboard-bg/50 transition-colors"
                >
                  {/* Date */}
                  <td className="px-3 py-2.5 whitespace-nowrap text-dashboard-muted" title={new Date(ref.createdAt).toLocaleString()}>
                    {relativeTime(ref.createdAt)}
                  </td>

                  {/* Referrer */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={ref.referrer} />
                      <div className="min-w-0">
                        <span className="text-dashboard-heading font-medium block truncate max-w-[100px]">
                          {`${ref.referrer.first_name ?? ""} ${ref.referrer.last_name ?? ""}`.trim() || "Unknown"}
                        </span>
                        {ref.referrer.smipay_tag && (
                          <span className="text-[10px] text-dashboard-muted">
                            @{ref.referrer.smipay_tag}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Referee */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {ref.referee ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar user={ref.referee} />
                        <span className="text-dashboard-heading font-medium truncate max-w-[100px]">
                          {`${ref.referee.first_name ?? ""} ${ref.referee.last_name ?? ""}`.trim() || ref.referee_phone_number || "Unknown"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-dashboard-muted/50">
                        {ref.referee_phone_number || "Not registered"}
                      </span>
                    )}
                  </td>

                  {/* Code */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="font-mono text-[10px] text-dashboard-heading">
                      {ref.referral_code_used}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${STATUS_BADGE[ref.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {statusMeta?.label ?? ref.status}
                    </span>
                  </td>

                  {/* Registered */}
                  <td className="px-3 py-2.5 whitespace-nowrap text-dashboard-muted">
                    {ref.referee_registered ? (
                      <span title={ref.referee_registered_at ?? undefined}>
                        {relativeTime(ref.referee_registered_at)}
                      </span>
                    ) : (
                      <span className="text-dashboard-muted/50">No</span>
                    )}
                  </td>

                  {/* First Tx */}
                  <td className="px-3 py-2.5 whitespace-nowrap text-dashboard-muted">
                    {ref.referee_first_tx ? (
                      <span title={ref.referee_first_tx_at ?? undefined}>
                        {relativeTime(ref.referee_first_tx_at)}
                      </span>
                    ) : (
                      <span className="text-dashboard-muted/50">No</span>
                    )}
                  </td>

                  {/* Referrer Reward */}
                  <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                    {ref.referrer_reward_given ? (
                      <span className="text-emerald-600 font-medium">
                        {formatCurrency(ref.referrer_reward_amount)}
                      </span>
                    ) : (
                      <span className="text-dashboard-muted">—</span>
                    )}
                  </td>

                  {/* Referee Reward */}
                  <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                    {ref.referee_reward_given ? (
                      <span className="text-emerald-600 font-medium">
                        {formatCurrency(ref.referee_reward_amount)}
                      </span>
                    ) : (
                      <span className="text-dashboard-muted">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {canAct ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onApprove(ref.id)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Approve & Issue Reward"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onReject(ref.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Reject"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-dashboard-muted/50">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function UserAvatar({ user }: { user: { first_name: string | null; last_name: string | null; profile_image: { secure_url: string } | null } }) {
  const initials = `${(user.first_name ?? "")[0] ?? ""}${(user.last_name ?? "")[0] ?? ""}`.toUpperCase() || "?";
  const img = user.profile_image?.secure_url;

  return (
    <div className="h-7 w-7 rounded-full bg-brand-bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
      {img ? (
        <img src={img} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-[10px] font-bold text-brand-bg-primary">{initials}</span>
      )}
    </div>
  );
}
