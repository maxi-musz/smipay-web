"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Eye, ShieldAlert, UserCog, ChevronDown, Wallet, Gift, ShieldCheck, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
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

function BreakdownRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="py-2 border-b border-dashboard-border/40 last:border-b-0">
      <p className="text-[10px] font-medium text-dashboard-muted uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-dashboard-heading mt-0.5">{value}</p>
      {hint ? <p className="text-[11px] text-dashboard-muted mt-1 leading-relaxed">{hint}</p> : null}
    </div>
  );
}

/** Main + cashback summary; chevron opens the same portal pattern as Transactions table balance column. */
function UserWalletBalanceCell({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const w = user.wallet;
  const mainBal = w?.current_balance ?? 0;
  const funding = w?.all_time_fuunding ?? 0;
  const withdrawnMain = w?.all_time_withdrawn ?? 0;
  const cb = user.cashbackWallet;
  const cbBal = cb?.current_balance ?? 0;

  const eps = 0.05;
  const mainInvariant = w != null ? mainBal + withdrawnMain - funding : 0;
  const mainIntegrityOk = w == null || Math.abs(mainInvariant) < eps;

  const earned = cb?.all_time_earned ?? 0;
  const withdrawnCb = cb?.all_time_withdrawn ?? 0;
  const cbInvariant = cb != null ? cbBal + withdrawnCb - earned : 0;
  const cbIntegrityOk = cb == null || Math.abs(cbInvariant) < eps;

  const integrityWarn = !mainIntegrityOk || !cbIntegrityOk;

  const updatePosition = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const panelW = 300;
    const left = Math.max(8, Math.min(r.right - panelW, window.innerWidth - panelW - 8));
    setPanelPos({ top: r.bottom + 8, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const panel =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={panelRef}
        className="fixed z-[200] w-[min(300px,calc(100vw-16px))] rounded-xl border border-dashboard-border/60 bg-dashboard-surface shadow-xl shadow-black/10 overflow-hidden"
        style={{ top: panelPos.top, left: panelPos.left }}
        role="dialog"
        aria-label="Wallet breakdown for this user"
      >
        <div className="px-3 py-2.5 border-b border-dashboard-border/40 bg-dashboard-bg/50">
          <p className="text-xs font-bold text-dashboard-heading">Wallet breakdown</p>
          <p className="text-[10px] text-dashboard-muted mt-0.5 leading-snug">
            Live aggregates for this customer (main NGN wallet + cashback).
          </p>
        </div>

        <div className="px-3 py-2 max-h-[min(70vh,480px)] overflow-y-auto">
          {w ? (
            <>
              <div className="flex items-center gap-2 mb-1 text-violet-700">
                <Wallet className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[11px] font-bold">Main wallet (NGN)</span>
              </div>
              <BreakdownRow
                label="Current balance"
                value={formatNGN(mainBal)}
                hint="Available to spend or withdraw per ledger-aligned aggregates."
              />
              <BreakdownRow
                label="All-time funded"
                value={formatNGN(funding)}
                hint="Deposits, rewards, and money received into this wallet (success credits on the ledger)."
              />
              <BreakdownRow
                label="All-time outflows"
                value={formatNGN(withdrawnMain)}
                hint="Wallet spends (airtime, data, bills), transfers out, and bank payouts debited from this wallet."
              />
            </>
          ) : (
            <p className="text-[11px] text-dashboard-muted py-2">No main wallet row for this user.</p>
          )}

          {cb ? (
            <>
              <div className="flex items-center gap-2 mt-3 mb-1 text-amber-800">
                <Gift className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[11px] font-bold">Cashback wallet</span>
              </div>
              <BreakdownRow label="Current cashback balance" value={formatNGN(cbBal)} />
              <BreakdownRow
                label="All-time earned"
                value={formatNGN(earned)}
                hint="Total cashback credited from successful purchases (minus reversals in history)."
              />
              <BreakdownRow
                label="All-time used"
                value={formatNGN(withdrawnCb)}
                hint="Cashback applied toward purchases (tracked on the cashback wallet)."
              />
            </>
          ) : (
            <p className="text-[10px] text-dashboard-muted mt-3 py-1">No cashback wallet row yet.</p>
          )}

          <div
            className={`mt-3 rounded-lg px-2.5 py-2 flex gap-2 ${
              integrityWarn ? "bg-amber-50 border border-amber-200/80" : "bg-emerald-50/80 border border-emerald-200/60"
            }`}
          >
            {integrityWarn ? (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-[11px] font-semibold text-dashboard-heading">
                {integrityWarn ? "Review suggested" : "Aggregates align"}
              </p>
              <p className="text-[10px] text-dashboard-muted mt-0.5 leading-relaxed">
                {integrityWarn
                  ? "Main or cashback totals do not match the usual identity (balance + outflows ≈ funding / earned). Reconcile or open the user profile for detail."
                  : "Main: current + all-time outflows ≈ all-time funded. Cashback: current + used ≈ all-time earned (within rounding)."}
              </p>
            </div>
          </div>

          <Link
            href={`/unified-admin/users/${user.id}`}
            className="mt-3 block text-center text-[11px] font-semibold text-brand-bg-primary hover:underline py-2"
            onClick={() => setOpen(false)}
          >
            Open full user profile →
          </Link>
        </div>
      </div>,
      document.body,
    );

  return (
    <div ref={wrapRef} className="flex items-center justify-end gap-0.5 min-w-0">
      <div className="text-right min-w-0">
        <p className="text-[11px] font-semibold tabular-nums text-emerald-800 leading-tight">{formatNGN(mainBal)}</p>
        <p className="text-[9px] text-dashboard-muted leading-tight">Main balance</p>
        <p className="text-[9px] text-violet-700/90 tabular-nums leading-tight mt-0.5">
          Cashback {formatNGN(cbBal)}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!open) updatePosition();
          setOpen((v) => !v);
        }}
        className={`shrink-0 p-1 rounded-md border transition-colors ${
          integrityWarn
            ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
            : "border-dashboard-border/60 bg-dashboard-surface text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
        } ${open ? "ring-2 ring-brand-bg-primary/25 border-brand-bg-primary/40" : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Show wallet breakdown"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {panel}
    </div>
  );
}

interface Props {
  users: AdminUser[];
  onEditRole: (user: AdminUser) => void;
  onEditStatus: (user: AdminUser) => void;
  onEditTier: (user: AdminUser) => void;
}

export function UsersTable({ users, onEditRole, onEditStatus, onEditTier: _onEditTier }: Props) {
  void _onEditTier;
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
              <th
                className="text-right px-2 py-2.5 font-medium text-dashboard-muted min-w-[7.5rem]"
                title="Main and cashback balances shown here; chevron opens full funded / outflows / earned breakdown (same pattern as Transactions table)."
              >
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
                  <td className="px-2 py-2 align-middle border-l border-dashboard-border/15 bg-dashboard-bg/10 w-0 whitespace-nowrap">
                    <UserWalletBalanceCell user={user} />
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditRole(user);
                        }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-dashboard-muted hover:text-blue-600 transition-colors"
                        title="Edit Role"
                      >
                        <UserCog className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditStatus(user);
                        }}
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
