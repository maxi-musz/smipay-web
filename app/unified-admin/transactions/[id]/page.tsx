"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  User,
  CreditCard,
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  Server,
  Clock,
  Hash,
  Flag,
  LayoutList,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Shield,
  Zap,
  Gift,
} from "lucide-react";
import { adminTransactionsApi } from "@/services/admin/transactions-api";
import type { TransactionDetail } from "@/types/admin/transactions";
import { FlagTransactionModal } from "../_components/FlagTransactionModal";

function metaNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * For wallet debits, show how much came from cashback vs main wallet.
 * Uses DB columns first, then meta_data.wallet_charged / cashback_used, then balance delta.
 */
function getWalletCashbackSplit(tx: TransactionDetail): {
  show: boolean;
  total: number;
  cashback: number;
  wallet: number;
  sumMismatch: boolean;
} {
  const total = Number(tx.amount) || 0;
  if (tx.credit_debit !== "debit" || total <= 0) {
    return { show: false, total, cashback: 0, wallet: 0, sumMismatch: false };
  }

  const meta =
    tx.meta_data && typeof tx.meta_data === "object"
      ? (tx.meta_data as Record<string, unknown>)
      : {};

  const fromColumn = metaNum(tx.cashback_used);
  const fromMetaCb = metaNum(meta.cashback_used);
  let cashback = fromColumn ?? fromMetaCb ?? 0;
  if (cashback < 0) cashback = 0;

  let wallet = metaNum(meta.wallet_charged);
  if (wallet == null && tx.balance_before != null && tx.balance_after != null) {
    wallet = Math.round((Number(tx.balance_before) - Number(tx.balance_after)) * 100) / 100;
  }
  if (wallet == null || wallet < 0) wallet = 0;

  if (cashback > 0 && wallet === 0) {
    wallet = Math.round((total - cashback) * 100) / 100;
  }

  const isWalletPayment = tx.payment_method === "wallet";
  if (isWalletPayment && cashback === 0 && wallet === 0) {
    wallet = total;
  }

  const sum = Math.round((cashback + wallet) * 100) / 100;
  const sumMismatch = Math.abs(sum - total) > 0.02;

  const show =
    isWalletPayment ||
    cashback > 0 ||
    (tx.cashback_balance_before != null && tx.cashback_used != null);

  return { show, total, cashback, wallet, sumMismatch };
}

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

const statusStyles: Record<string, { bg: string; text: string }> = {
  success: { bg: "bg-emerald-50", text: "text-emerald-700" },
  pending: { bg: "bg-amber-50", text: "text-amber-700" },
  failed: { bg: "bg-red-50", text: "text-red-700" },
  cancelled: { bg: "bg-slate-100", text: "text-slate-600" },
};

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-dashboard-border/20 last:border-0 min-w-0">
      <span className="text-xs text-dashboard-muted shrink-0">{label}</span>
      <span className={`text-xs text-dashboard-heading text-right min-w-0 break-all ${mono ? "font-mono" : ""}`}>{value ?? "—"}</span>
    </div>
  );
}

function CopyText({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="inline-flex items-center gap-1 hover:text-brand-bg-primary transition-colors"
    >
      <span className="font-mono">{value}</span>
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 opacity-50" />}
    </button>
  );
}

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tx, setTx] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flagOpen, setFlagOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminTransactionsApi.getById(id);
      if (res.success && res.data) {
        setTx(res.data);
      } else {
        setError(res.message || "Transaction not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transaction");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard-bg animate-pulse">
        <div className="bg-dashboard-surface border-b border-dashboard-border/60 px-4 py-4 sm:px-6 lg:px-8">
          <div className="h-6 w-48 bg-dashboard-border/40 rounded" />
        </div>
        <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-dashboard-surface rounded-xl border border-dashboard-border/40" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-3">{error || "Transaction not found"}</p>
          <button type="button" onClick={() => router.back()} className="text-xs text-brand-bg-primary underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const sStyle = statusStyles[tx.status ?? ""] ?? statusStyles.pending;
  const userName = tx.user
    ? [tx.user.first_name, tx.user.last_name].filter(Boolean).join(" ") || tx.user.email || tx.user.phone_number
    : null;

  const isElectricityTx = tx.transaction_type === "electricity";
  const rawMeta = tx.meta_data && typeof tx.meta_data === "object" ? (tx.meta_data as any) : null;
  const vtpassResponse = rawMeta?.vtpass_response as any | undefined;
  const vtpassTx = vtpassResponse?.content?.transactions as any | undefined;

  const electricityToken: string | null = isElectricityTx
    ? (
        tx.electricity_token ??
        rawMeta?.electricity_token ??
        vtpassResponse?.Token ??
        vtpassResponse?.token ??
        (typeof vtpassResponse?.purchased_code === "string"
          ? vtpassResponse.purchased_code.replace(/^Token\s*:\s*/i, "")
          : null)
      ) ?? null
    : null;

  const electricityMeta: {
    units: string | null;
    meterNumber: string | null;
    customerName: string | null;
    customerAddress: string | null;
    disco: string | null;
  } | null = isElectricityTx && rawMeta
    ? {
        units: (rawMeta.units ?? vtpassResponse?.units ?? null) as string | null,
        meterNumber: (rawMeta.meterNumber ?? rawMeta.billersCode ?? vtpassResponse?.meterNumber ?? null) as string | null,
        customerName: (rawMeta.customerName ?? vtpassResponse?.customerName ?? null) as string | null,
        customerAddress: (rawMeta.customerAddress ?? vtpassResponse?.customerAddress ?? null) as string | null,
        disco: (rawMeta.disco ?? vtpassTx?.product_name ?? null) as string | null,
      }
    : null;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-dashboard-bg transition-colors shrink-0">
              <ArrowLeft className="h-4 w-4 text-dashboard-muted" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-dashboard-heading truncate">Transaction Detail</h1>
              <p className="text-xs text-dashboard-muted font-mono">{tx.transaction_reference || tx.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDetail}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            {tx.user_id && (
              <Link
                href={`/unified-admin/transactions?user_id=${encodeURIComponent(tx.user_id)}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg transition-colors"
              >
                <LayoutList className="h-3.5 w-3.5" />
                User transactions
              </Link>
            )}
            <button
              type="button"
              onClick={() => setFlagOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <Flag className="h-3.5 w-3.5" />
              Flag
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4 max-w-5xl">
        {/* Wallet analysis (ledger vs stored) */}
        {tx.wallet_analysis && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 text-xs ${
              tx.wallet_analysis.main.ok && (tx.wallet_analysis.cashback?.ok ?? true)
                ? "bg-slate-50/90 border-dashboard-border/50"
                : "bg-amber-50/95 border-amber-200/90"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-dashboard-muted shrink-0" />
                <h2 className="text-[11px] font-bold uppercase tracking-wide text-dashboard-heading">
                  Wallet analysis
                </h2>
              </div>
              <span className="text-[10px] text-dashboard-muted tabular-nums">
                ±₦{tx.wallet_analysis.tolerance_ngn} tol · success-only ledger
              </span>
            </div>
            {tx.wallet_analysis.enforcement_skipped && (
              <p className="text-[11px] text-sky-800 bg-sky-50 border border-sky-200/80 rounded-md px-2 py-1.5 mb-2">
                {tx.wallet_analysis.enforcement_skip_reason}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/70 border border-dashboard-border/30 p-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-dashboard-muted uppercase">Main wallet</p>
                <div className="flex justify-between gap-2">
                  <span className="text-dashboard-muted">Current balance</span>
                  <span className="font-mono tabular-nums font-medium">{formatNGN(tx.wallet_analysis.main.current_balance)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-dashboard-muted">All-time funded (stored)</span>
                  <span className="font-mono tabular-nums">{formatNGN(tx.wallet_analysis.main.all_time_fuunding)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-dashboard-muted">All-time out (stored)</span>
                  <span className="font-mono tabular-nums">{formatNGN(tx.wallet_analysis.main.all_time_withdrawn)}</span>
                </div>
                <div className="flex justify-between gap-2 border-t border-dashboard-border/20 pt-1.5 mt-1">
                  <span className="text-dashboard-muted">Ledger credits (success)</span>
                  <span className="font-mono tabular-nums">{formatNGN(tx.wallet_analysis.main.ledger_credits_total)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-dashboard-muted">Ledger debits (success)</span>
                  <span className="font-mono tabular-nums">{formatNGN(tx.wallet_analysis.main.ledger_debits_total)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-dashboard-muted">Expected balance</span>
                  <span className="font-mono tabular-nums">{formatNGN(tx.wallet_analysis.main.expected_balance)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-dashboard-muted">Referral bonuses (ledger)</span>
                  <span className="font-mono tabular-nums text-emerald-700">{formatNGN(tx.wallet_analysis.main.referral_bonus_total)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-dashboard-muted">First-tx bonus (ledger)</span>
                  <span className="font-mono tabular-nums text-emerald-700">{formatNGN(tx.wallet_analysis.main.first_tx_bonus_total)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-dashboard-muted">Deposits (ledger)</span>
                  <span className="font-mono tabular-nums">{formatNGN(tx.wallet_analysis.main.deposit_credits_total)}</span>
                </div>
                <p className={`text-[10px] font-medium pt-1 ${tx.wallet_analysis.main.ok ? "text-emerald-700" : "text-amber-800"}`}>
                  {tx.wallet_analysis.main.ok ? "Stored fields match ledger." : "Mismatch — investigate or run aggregate reconcile."}
                </p>
              </div>
              {tx.wallet_analysis.cashback ? (
                <div className="rounded-lg bg-white/70 border border-dashboard-border/30 p-3 space-y-1.5">
                  <p className="text-[10px] font-semibold text-dashboard-muted uppercase">Cashback wallet</p>
                  <div className="flex justify-between gap-2">
                    <span className="text-dashboard-muted">Current balance</span>
                    <span className="font-mono tabular-nums font-medium">{formatNGN(tx.wallet_analysis.cashback.current_balance)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-dashboard-muted">All-time earned</span>
                    <span className="font-mono tabular-nums">{formatNGN(tx.wallet_analysis.cashback.all_time_earned)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-dashboard-muted">All-time withdrawn</span>
                    <span className="font-mono tabular-nums">{formatNGN(tx.wallet_analysis.cashback.all_time_withdrawn)}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-t border-dashboard-border/20 pt-1.5 mt-1">
                    <span className="text-dashboard-muted">Earned (history net)</span>
                    <span className="font-mono tabular-nums">{formatNGN(tx.wallet_analysis.cashback.earned_net)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-dashboard-muted">Used on success txs</span>
                    <span className="font-mono tabular-nums">{formatNGN(tx.wallet_analysis.cashback.withdrawn_from_success_tx)}</span>
                  </div>
                  <p className={`text-[10px] font-medium pt-1 ${tx.wallet_analysis.cashback.ok ? "text-emerald-700" : "text-amber-800"}`}>
                    {tx.wallet_analysis.cashback.ok
                      ? "Cashback aggregates OK."
                      : tx.wallet_analysis.cashback.tx_anomaly
                        ? "Cashback used exceeds earned — anomaly."
                        : "Cashback mismatch — investigate."}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-white/40 border border-dashed border-dashboard-border/40 p-3 flex items-center text-dashboard-muted text-[11px]">
                  No cashback wallet for this user.
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Transaction Info */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-brand-bg-primary" />
            <h2 className="text-sm font-bold text-dashboard-heading">Transaction Info</h2>
            <span className={`ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-medium capitalize ${sStyle.bg} ${sStyle.text}`}>
              {tx.status}
            </span>
          </div>
          <InfoRow label="ID" value={<CopyText value={tx.id} />} />
          <InfoRow label="Reference" value={tx.transaction_reference ? <CopyText value={tx.transaction_reference} /> : "—"} />
          <InfoRow label="Type" value={<span className="capitalize">{tx.transaction_type ?? "—"}</span>} />
          <InfoRow label="Direction" value={
            tx.credit_debit === "credit" ? (
              <span className="inline-flex items-center gap-1 text-emerald-600"><ArrowDownLeft className="h-3 w-3" /> Credit</span>
            ) : tx.credit_debit === "debit" ? (
              <span className="inline-flex items-center gap-1 text-red-600"><ArrowUpRight className="h-3 w-3" /> Debit</span>
            ) : "—"
          } />
          <InfoRow label="Description" value={tx.description} />
          <InfoRow label="Channel" value={<span className="capitalize">{tx.payment_channel?.replace(/_/g, " ") ?? "—"}</span>} />
          <InfoRow label="Payment Method" value={<span className="capitalize">{tx.payment_method?.replace(/_/g, " ") ?? "—"}</span>} />
          <InfoRow label="Session ID" value={tx.session_id ? <CopyText value={tx.session_id} /> : "—"} />
          <InfoRow label="Created" value={`${formatDateTime(tx.createdAt)} (${relativeTime(tx.createdAt)})`} />
          <InfoRow label="Updated" value={formatDateTime(tx.updatedAt)} />
        </motion.section>

        {/* User Info */}
        {tx.user && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-dashboard-heading">User Info</h2>
              <Link
                href={`/unified-admin/users/${tx.user.id}`}
                className="ml-auto inline-flex items-center gap-1 text-[11px] text-brand-bg-primary hover:underline"
              >
                View profile <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex items-center gap-3 mb-3">
              {tx.user.profile_image?.secure_url ? (
                <img src={tx.user.profile_image.secure_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-brand-bg-primary/10 text-brand-bg-primary flex items-center justify-center font-bold text-sm">
                  {tx.user.first_name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-dashboard-heading">{userName}</p>
                {tx.user.smipay_tag && <p className="text-xs text-dashboard-muted">@{tx.user.smipay_tag}</p>}
              </div>
            </div>
            <InfoRow label="Email" value={tx.user.email} />
            <InfoRow label="Phone" value={tx.user.phone_number} />
            <InfoRow label="Role" value={<span className="capitalize">{tx.user.role}</span>} />
            <InfoRow label="Status" value={<span className="capitalize">{tx.user.account_status}</span>} />
            {tx.user.wallet && <InfoRow label="Wallet Balance" value={formatNGN(tx.user.wallet.current_balance)} />}
            {tx.user.tier && <InfoRow label="Tier" value={tx.user.tier.name} />}
          </motion.section>
        )}

        {/* Financial Details */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Banknote className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-dashboard-heading">Financial Details</h2>
          </div>
          <InfoRow label="Amount" value={<span className="font-semibold">{formatNGN(tx.amount)}</span>} />
          {(() => {
            const split = getWalletCashbackSplit(tx);
            if (!split.show) return null;
            return (
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-3 mb-3 mt-1">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-xs font-bold text-amber-900">Payment source (wallet + cashback)</p>
                </div>
                <p className="text-[11px] text-amber-900/80 leading-snug mb-3">
                  <span className="font-semibold text-amber-950">Why balance before/after may match:</span> those fields are the{" "}
                  <span className="font-medium">main NGN wallet only</span>. If the user paid with cashback, the main wallet may not move.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between gap-3">
                    <span className="text-dashboard-muted">Total charged</span>
                    <span className="font-semibold tabular-nums text-dashboard-heading">{formatNGN(split.total)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-dashboard-muted">From cashback wallet</span>
                    <span className="font-semibold tabular-nums text-amber-800">{formatNGN(split.cashback)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-dashboard-muted">From main wallet</span>
                    <span className="font-semibold tabular-nums text-emerald-800">{formatNGN(split.wallet)}</span>
                  </div>
                  {split.cashback <= 0 && split.wallet >= split.total && (
                    <p className="text-[11px] text-amber-900/75 pt-1 border-t border-amber-200/60">
                      Paid entirely from the main wallet (no cashback applied on this transaction).
                    </p>
                  )}
                  {split.cashback >= split.total && split.total > 0 && (
                    <p className="text-[11px] text-amber-900/75 pt-1 border-t border-amber-200/60">
                      Paid entirely from cashback — main wallet unchanged for this purchase.
                    </p>
                  )}
                  {split.cashback > 0 && split.wallet > 0 && (
                    <p className="text-[11px] text-amber-900/75 pt-1 border-t border-amber-200/60">
                      Split payment: part from cashback, part from main wallet.
                    </p>
                  )}
                  {split.sumMismatch && (
                    <p className="text-[11px] text-amber-950 font-medium pt-1">
                      Parts sum to {formatNGN(split.cashback + split.wallet)} vs amount {formatNGN(split.total)} — check metadata or raw
                      logs if needed.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
          <InfoRow label="Fee" value={formatNGN(tx.fee)} />
          {(tx.commission_smipay_earned != null || tx.commission != null) && (
            <InfoRow
              label="Commission (Smipay earned)"
              value={formatNGN(tx.commission_smipay_earned ?? tx.commission ?? 0)}
            />
          )}
          <InfoRow label="Currency" value={tx.currency_type?.toUpperCase() ?? "NGN"} />
          <InfoRow
            label="Main wallet balance before"
            value={formatNGN(tx.balance_before)}
          />
          <InfoRow
            label="Main wallet balance after"
            value={formatNGN(tx.balance_after)}
          />
          {(tx.markup_value != null || tx.vtpass_amount != null) && (
            <>
              <div className="border-t border-dashboard-border/40 mt-2 pt-2">
                <p className="text-[11px] font-medium text-dashboard-muted uppercase tracking-wide mb-1">Revenue / Markup</p>
              </div>
              <InfoRow label="VTPass Amount" value={formatNGN(tx.vtpass_amount)} />
              <InfoRow label="Smipay Amount" value={formatNGN(tx.smipay_amount)} />
              <InfoRow label="Markup %" value={tx.markup_percent != null ? `${tx.markup_percent}%` : "—"} />
              <InfoRow label="Markup Value" value={<span className="text-emerald-600 font-medium">{formatNGN(tx.markup_value)}</span>} />
            </>
          )}
        </motion.section>

        {/* Cashback wallet snapshot (VTpass / split payments) */}
        {(tx.cashback_balance_before != null ||
          tx.cashback_used != null ||
          tx.cashback_balance_after != null ||
          tx.cashback_earned != null) && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-dashboard-surface rounded-xl border border-amber-200/70 p-5"
          >
            <div className="flex items-center gap-2 mb-1">
              <Gift className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold text-dashboard-heading">Cashback wallet</h2>
            </div>
            <p className="text-[11px] text-dashboard-muted mb-3">
              Separate balance from the main NGN wallet. “Used on purchase” is the amount that funded this transaction from cashback.
            </p>
            <InfoRow label="Cashback balance before" value={formatNGN(tx.cashback_balance_before)} />
            <InfoRow label="Used on this transaction" value={formatNGN(tx.cashback_used)} />
            <InfoRow label="Cashback balance after" value={formatNGN(tx.cashback_balance_after)} />
            <InfoRow
              label="Earned"
              value={
                tx.cashback_earned != null ? (
                  <span className="text-emerald-600 font-medium">{formatNGN(tx.cashback_earned)}</span>
                ) : (
                  "—"
                )
              }
            />
          </motion.section>
        )}

        {/* Provider Details */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-dashboard-heading">Provider Details</h2>
          </div>
          <InfoRow label="Provider" value={<span className="capitalize">{tx.provider ?? "—"}</span>} />
          {tx.data_plan_name != null && tx.data_plan_name !== "" && (
            <InfoRow label="Plan" value={tx.data_plan_name} />
          )}
          <InfoRow label="Transaction Number" value={tx.transaction_number ? <CopyText value={tx.transaction_number} /> : "—"} />
          <InfoRow label="Recipient Mobile" value={tx.recipient_mobile} />
          {tx.sender_details && (
            <>
              <InfoRow label="Sender Name" value={tx.sender_details.sender_name} />
              <InfoRow label="Sender Bank" value={tx.sender_details.sender_bank} />
              <InfoRow label="Sender Account" value={tx.sender_details.sender_account_number} />
            </>
          )}
          {tx.authorization_url && (
            <InfoRow
              label="Auth URL"
              value={
                <a href={tx.authorization_url} target="_blank" rel="noopener noreferrer" className="text-brand-bg-primary hover:underline inline-flex items-center gap-1">
                  Open <ExternalLink className="h-3 w-3" />
                </a>
              }
            />
          )}
        </motion.section>

        {/* Electricity Details (for electricity VTU) */}
        {isElectricityTx && electricityMeta && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-bold text-dashboard-heading">Electricity Details</h2>
            </div>
            <InfoRow
              label="Token"
              value={
                electricityToken ? <CopyText value={electricityToken} /> : "—"
              }
            />
            {electricityMeta.units && (
              <InfoRow label="Units" value={electricityMeta.units} />
            )}
            {electricityMeta.meterNumber && (
              <InfoRow label="Meter Number" value={electricityMeta.meterNumber} mono />
            )}
            {electricityMeta.customerName && (
              <InfoRow label="Customer Name" value={electricityMeta.customerName} />
            )}
            {electricityMeta.customerAddress && (
              <InfoRow label="Service Address" value={electricityMeta.customerAddress} />
            )}
            {electricityMeta.disco && <InfoRow label="Disco" value={electricityMeta.disco} />}
          </motion.section>
        )}

        {/* Counterpart (P2P transfers) */}
        {tx.counterpart && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-purple-600" />
              <h2 className="text-sm font-bold text-dashboard-heading">Counterpart Transaction</h2>
              <Link
                href={`/unified-admin/transactions/${tx.counterpart.id}`}
                className="ml-auto inline-flex items-center gap-1 text-[11px] text-brand-bg-primary hover:underline"
              >
                View <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <InfoRow label="Recipient" value={[tx.counterpart.user.first_name, tx.counterpart.user.last_name].filter(Boolean).join(" ") || "—"} />
            {tx.counterpart.user.smipay_tag && <InfoRow label="Tag" value={`@${tx.counterpart.user.smipay_tag}`} />}
            <InfoRow label="Amount" value={formatNGN(tx.counterpart.amount)} />
            <InfoRow label="Direction" value={<span className="capitalize">{tx.counterpart.credit_debit}</span>} />
            <InfoRow label="Status" value={<span className="capitalize">{tx.counterpart.status}</span>} />
            <InfoRow label="Balance Before" value={formatNGN(tx.counterpart.balance_before)} />
            <InfoRow label="Balance After" value={formatNGN(tx.counterpart.balance_after)} />
          </motion.section>
        )}

        {/* Metadata */}
        {tx.meta_data && Object.keys(tx.meta_data).length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-5">
            <button
              type="button"
              onClick={() => setMetaOpen(!metaOpen)}
              className="flex items-center gap-2 w-full"
            >
              <Hash className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-bold text-dashboard-heading">Metadata</h2>
              {metaOpen ? <ChevronUp className="h-4 w-4 ml-auto text-dashboard-muted" /> : <ChevronDown className="h-4 w-4 ml-auto text-dashboard-muted" />}
            </button>
            {metaOpen && (
              <pre className="mt-3 p-3 bg-dashboard-bg rounded-lg text-xs text-dashboard-heading overflow-x-auto font-mono">
                {JSON.stringify(tx.meta_data, null, 2)}
              </pre>
            )}
          </motion.section>
        )}

        {/* Timeline */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-bold text-dashboard-heading">Timeline</h2>
          </div>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-1 bottom-1 w-px bg-dashboard-border/40" />
            <div className="relative">
              <div className="absolute -left-[17px] top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-dashboard-surface" />
              <p className="text-xs font-medium text-dashboard-heading">Created</p>
              <p className="text-[11px] text-dashboard-muted">{formatDateTime(tx.createdAt)}</p>
            </div>
            {tx.updatedAt !== tx.createdAt && (
              <div className="relative">
                <div className={`absolute -left-[17px] top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-dashboard-surface ${tx.status === "success" ? "bg-emerald-500" : tx.status === "failed" ? "bg-red-500" : "bg-amber-500"}`} />
                <p className="text-xs font-medium text-dashboard-heading capitalize">
                  {tx.status === "success" ? "Completed" : tx.status === "failed" ? "Failed" : "Updated"}
                </p>
                <p className="text-[11px] text-dashboard-muted">{formatDateTime(tx.updatedAt)}</p>
              </div>
            )}
          </div>
        </motion.section>
      </div>

      <FlagTransactionModal
        transactionId={tx.id}
        open={flagOpen}
        onClose={() => setFlagOpen(false)}
        onFlagged={fetchDetail}
      />
    </div>
  );
}
