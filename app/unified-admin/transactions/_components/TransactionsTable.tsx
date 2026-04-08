"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  CornerDownRight,
} from "lucide-react";
import { useState } from "react";
import type { TransactionItem } from "@/types/admin/transactions";

function formatNGN(value: number | null): string {
  if (value == null) return "—";
  return `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const statusBadge: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

const typeBadge: Record<string, string> = {
  transfer: "bg-blue-50 text-blue-700",
  deposit: "bg-emerald-50 text-emerald-700",
  airtime: "bg-purple-50 text-purple-700",
  data: "bg-indigo-50 text-indigo-700",
  cable: "bg-pink-50 text-pink-700",
  education: "bg-teal-50 text-teal-700",
  betting: "bg-orange-50 text-orange-700",
};

function CopyRef({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 group"
      title={value}
    >
      <span className="font-mono whitespace-nowrap">{value}</span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
      )}
    </button>
  );
}

interface Props {
  transactions: TransactionItem[];
}

/** Same “retry streak” if user + status + type + amount match (current page only). */
function streakForward(
  list: TransactionItem[],
  i: number,
): { length: number; isStart: boolean; continuesUser: boolean } {
  const t = list[i];
  const uid = t.user?.id;
  const continuesUser = Boolean(uid && i > 0 && list[i - 1].user?.id === uid);

  if (!uid) {
    return { length: 1, isStart: true, continuesUser: false };
  }

  const sameShape = (a: TransactionItem, b: TransactionItem) =>
    a.user?.id === b.user?.id &&
    a.status === b.status &&
    a.transaction_type === b.transaction_type &&
    Number(a.amount) === Number(b.amount);

  let length = 1;
  for (let j = i + 1; j < list.length; j++) {
    if (!sameShape(t, list[j])) break;
    length++;
  }

  const prevMatches =
    i > 0 && sameShape(t, list[i - 1]);
  const isStart = length >= 2 && !prevMatches;

  return { length, isStart, continuesUser };
}

/** Tiny ₦ formatter for dense table cells */
function fmtCompact(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}m`;
  if (abs >= 10_000) return `${sign}${Math.round(abs / 1000)}k`;
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}k`;
  return `${sign}${Math.round(abs)}`;
}

function fmtSignedDrift(n: number): string {
  if (Number.isNaN(n)) return "—";
  if (Math.abs(n) < 0.01) return "0";
  const sign = n > 0 ? "+" : n < 0 ? "" : "";
  return `${sign}${fmtCompact(n)}`;
}

/** Compare stored wallet movement to amount + cashback_used (VT-style debits). */
function txnBalanceIntegrity(tx: TransactionItem): "ok" | "warn" | "na" {
  if (tx.amount == null || tx.credit_debit == null) return "na";
  const amt = Number(tx.amount);
  const bb = Number(tx.balance_before);
  const ba = Number(tx.balance_after);
  const d = ba - bb;
  const eps = 0.05;
  const cbUsed = Number(tx.cashback_used ?? 0);

  if (tx.credit_debit === "credit") {
    if (Math.abs(amt) < eps && Math.abs(d) < eps) return "ok";
    return Math.abs(d - amt) < eps ? "ok" : "warn";
  }
  if (tx.credit_debit === "debit") {
    const expected = -(amt - cbUsed);
    return Math.abs(d - expected) < eps ? "ok" : "warn";
  }
  return "na";
}

function WalletAnalysisCell({ tx }: { tx: TransactionItem }) {
  const bb = Number(tx.balance_before);
  const ba = Number(tx.balance_after);
  const curW = tx.user?.wallet?.current_balance;
  const driftW = curW != null && !Number.isNaN(curW) ? Number(curW) - ba : null;

  const cbb = tx.cashback_balance_before;
  const cba = tx.cashback_balance_after;
  const curC = tx.user?.cashbackWallet?.current_balance;
  const hasCb =
    cbb != null ||
    cba != null ||
    (tx.cashback_used != null && Number(tx.cashback_used) > 0);
  const driftC =
    curC != null && cba != null && !Number.isNaN(Number(cba)) ? Number(curC) - Number(cba) : null;

  const integrity = txnBalanceIntegrity(tx);
  const driftWLarge = driftW != null && Math.abs(driftW) > 0.5;
  const driftCLarge = driftC != null && Math.abs(driftC) > 0.5;

  const title = [
    "Main wallet snapshot at tx: before → after | live now (drift vs after)",
    `W ${fmtCompact(bb)} → ${fmtCompact(ba)} | now ${fmtCompact(curW)}${driftW != null ? ` (Δ ${fmtSignedDrift(driftW)})` : ""}`,
    hasCb || curC != null
      ? `Cashback: ${fmtCompact(cbb)} → ${fmtCompact(cba)} | now ${fmtCompact(curC)}${driftC != null ? ` (Δ ${fmtSignedDrift(driftC)})` : ""}`
      : "No cashback snapshot on this row.",
    integrity === "warn"
      ? "Check: wallet balance change vs (amount − cashback_used) looks inconsistent."
      : integrity === "ok"
        ? "Check: wallet delta matches amount/cashback split."
        : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div
      className="font-mono text-[9px] leading-snug text-dashboard-heading/90 max-w-[7.25rem] py-0.5"
      title={title}
    >
      <div className="flex flex-wrap items-baseline gap-x-0.5 gap-y-0">
        <span className="text-[8px] font-bold text-violet-600/90 shrink-0">W</span>
        <span className="tabular-nums text-[9px]">
          {fmtCompact(bb)}→{fmtCompact(ba)}|{fmtCompact(curW)}
          {driftW != null ? (
            <span className={driftWLarge ? "text-amber-700 font-semibold" : "text-dashboard-muted"}>
              ({fmtSignedDrift(driftW)})
            </span>
          ) : null}
        </span>
        {integrity === "warn" ? (
          <span className="text-[8px] font-bold text-amber-600 ml-0.5" title="Ledger check: unexpected wallet delta">
            ?
          </span>
        ) : integrity === "ok" ? (
          <span className="text-[8px] text-emerald-600/90 ml-0.5" title="Ledger check OK">
            ✓
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-0.5 mt-0.5">
        <span className="text-[8px] font-bold text-sky-600/90 shrink-0">C</span>
        {hasCb || curC != null ? (
          <span className="tabular-nums text-[9px]">
            {fmtCompact(cbb)}→{fmtCompact(cba)}|{fmtCompact(curC)}
            {driftC != null ? (
              <span className={driftCLarge ? "text-amber-700 font-semibold" : "text-dashboard-muted"}>
                ({fmtSignedDrift(driftC)})
              </span>
            ) : null}
          </span>
        ) : (
          <span className="text-dashboard-muted/80 text-[9px]">—</span>
        )}
      </div>
    </div>
  );
}

export function TransactionsTable({ transactions }: Props) {
  if (!transactions.length) {
    return (
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-12 text-center">
        <p className="text-sm text-dashboard-muted">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 overflow-hidden shadow-sm">
      <p className="px-4 py-2.5 text-[11px] text-dashboard-muted border-b border-dashboard-border/30 bg-dashboard-bg/30 leading-relaxed">
        <span className="font-medium text-dashboard-heading/80">Ledger view:</span> each row is one distinct
        reference (separate attempt). Consecutive attempts from the same user are visually grouped; we do not merge
        rows so audits and support stay traceable.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-xs">
          <thead>
            <tr className="border-b border-dashboard-border/40 bg-dashboard-bg/50">
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">User</th>
              <th className="text-right px-4 py-2.5 font-medium text-dashboard-muted">Amount</th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">Type</th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">Plan</th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">Status</th>
              <th className="text-center px-4 py-2.5 font-medium text-dashboard-muted">Dir</th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">Channel</th>
              <th className="text-right px-4 py-2.5 font-medium text-dashboard-muted">Revenue</th>
              <th className="text-right px-4 py-2.5 font-medium text-dashboard-muted" title="Commission (Smipay earned)">Commission</th>
              <th
                className="text-left px-2 py-2.5 font-medium text-dashboard-muted w-[7.5rem]"
                title="W = main wallet before→after|now (Δ vs after). C = cashback. ? = wallet delta vs amount looks off."
              >
                <span className="whitespace-nowrap">Balances</span>
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-dashboard-muted">Reference</th>
              <th className="text-right px-4 py-2.5 font-medium text-dashboard-muted">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, i) => {
              const userName = tx.user
                ? [tx.user.first_name, tx.user.last_name].filter(Boolean).join(" ") || tx.user.email || tx.user.phone_number
                : "—";
              const avatar = tx.user?.first_name?.[0]?.toUpperCase() ?? "?";
              const { length: streakLen, isStart: streakStart, continuesUser } = streakForward(transactions, i);
              const rowMuted = continuesUser;
              return (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  className={`border-b border-dashboard-border/20 hover:bg-dashboard-bg/40 transition-colors ${
                    continuesUser ? "bg-dashboard-bg/20" : ""
                  } ${streakStart ? "border-t border-dashboard-border/35" : ""}`}
                >
                  <td className={`px-4 py-2 align-middle ${continuesUser ? "border-l-2 border-l-brand-bg-primary/25" : ""}`}>
                    {continuesUser ? (
                      <div className="flex items-center gap-2 min-h-[2rem] pl-1">
                        <CornerDownRight className="h-3.5 w-3.5 text-dashboard-muted/70 shrink-0" aria-hidden />
                        <div className="min-w-0 flex flex-col gap-0.5">
                          <span className="text-[10px] text-dashboard-muted">Same user</span>
                          {tx.user?.id ? (
                            <Link
                              href={`/unified-admin/users/${tx.user.id}`}
                              className="text-[10px] font-medium text-brand-bg-primary hover:underline truncate max-w-[140px]"
                              title="Open user profile"
                            >
                              Profile
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {streakStart ? (
                          <span className="inline-flex items-center w-fit px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200/80">
                            {streakLen} similar {tx.status === "failed" ? "failures" : "attempts"}
                          </span>
                        ) : null}
                        <Link href={`/unified-admin/transactions/${tx.id}`} className="flex items-center gap-2 group/row">
                          {tx.user?.profile_image?.secure_url ? (
                            <img src={tx.user.profile_image.secure_url} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-dashboard-border/40" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-brand-bg-primary/10 text-brand-bg-primary flex items-center justify-center text-[10px] font-bold ring-1 ring-dashboard-border/40">
                              {avatar}
                            </div>
                          )}
                          <span className="text-dashboard-heading font-medium whitespace-nowrap group-hover/row:text-brand-bg-primary transition-colors">
                            {userName}
                          </span>
                        </Link>
                      </div>
                    )}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-semibold text-dashboard-heading whitespace-nowrap tabular-nums ${rowMuted ? "text-dashboard-heading/90" : ""}`}>
                    {formatNGN(tx.amount)}
                  </td>
                  <td className="px-4 py-2.5">
                    {tx.transaction_type && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${typeBadge[tx.transaction_type] ?? "bg-slate-100 text-slate-600"}`}>
                        {tx.transaction_type}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-dashboard-heading max-w-[140px]">
                    {tx.data_plan_name?.trim() ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {tx.status && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusBadge[tx.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {tx.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {tx.credit_debit === "credit" ? (
                      <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500 inline" />
                    ) : tx.credit_debit === "debit" ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-red-500 inline" />
                    ) : (
                      <span className="text-dashboard-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-dashboard-muted capitalize whitespace-nowrap">
                    {tx.payment_channel?.replace(/_/g, " ") ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {tx.markup_value != null ? (
                      <span className="text-emerald-600 font-medium">{formatNGN(tx.markup_value)}</span>
                    ) : (
                      <span className="text-dashboard-muted">—</span>
                    )}
                  </td>
                  <td
                    className="px-4 py-2.5 text-right whitespace-nowrap tabular-nums"
                    title={
                      tx.status === "failed"
                        ? "No commission on failed transactions"
                        : undefined
                    }
                  >
                    {tx.status === "failed" ? (
                      <span className="text-dashboard-muted">—</span>
                    ) : tx.commission_smipay_earned != null || tx.commission != null ? (
                      <span className="text-dashboard-heading font-medium">
                        {formatNGN(tx.commission_smipay_earned ?? tx.commission ?? 0)}
                      </span>
                    ) : (
                      <span className="text-dashboard-muted">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 align-top border-l border-dashboard-border/15 bg-dashboard-bg/10">
                    <WalletAnalysisCell tx={tx} />
                  </td>
                  <td className="px-4 py-2.5 text-dashboard-muted">
                    {tx.transaction_reference ? <CopyRef value={tx.transaction_reference} /> : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-dashboard-muted whitespace-nowrap" title={new Date(tx.createdAt).toLocaleString()}>
                    {relativeTime(tx.createdAt)}
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
