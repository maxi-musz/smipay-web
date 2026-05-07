"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  ArrowLeft,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";
import { transactionApi } from "@/services/transaction-api";
import type {
  TransactionDetail,
  ElectricityMeta,
  CableMeta,
  DataMeta,
  AirtimeMeta,
  EducationMeta,
  EducationCard,
} from "@/types/transaction";
import { getNetworkLogo } from "@/lib/network-logos";

export default function TransactionDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const transactionId = params.id as string;
  const providerFromQuery =
    (searchParams.get("provider") as string | null) || null;

  const [transaction, setTransaction] = useState<TransactionDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const getTransactionLogo = (tx: TransactionDetail): string | null => {
    const providerKey = (tx.provider || providerFromQuery || "").toLowerCase();
    if (providerKey) {
      const logo = getNetworkLogo(providerKey);
      if (logo) return logo;
    }
    if (tx.icon) return tx.icon;
    return null;
  };

  const getProviderDisplayName = (tx: TransactionDetail): string => {
    if (tx.type === "electricity" && tx.meta && "disco" in tx.meta && (tx.meta as ElectricityMeta).disco) {
      return (tx.meta as ElectricityMeta).disco;
    }
    if (tx.type === "cable" && tx.meta && "bouquet" in tx.meta && (tx.meta as CableMeta).bouquet) {
      return (tx.meta as CableMeta).bouquet;
    }
    if (tx.type === "data" && tx.meta && "network" in tx.meta && (tx.meta as DataMeta).network) {
      return (tx.meta as DataMeta).network.replace(/-data/i, "").replace(/-/g, " ").trim().toUpperCase();
    }
    if (tx.type === "airtime" && tx.meta && "network" in tx.meta && (tx.meta as AirtimeMeta).network) {
      return (tx.meta as AirtimeMeta).network.replace(/-/g, " ").trim().toUpperCase();
    }
    if (tx.type === "education" && tx.meta && "product_name" in tx.meta && (tx.meta as EducationMeta).product_name) {
      return (tx.meta as EducationMeta).product_name;
    }
    if (tx.provider) {
      return tx.provider.replace(/-/g, " ").replace(/electric$/i, "Electricity");
    }
    return "";
  };

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        setError(null);
        const response =
          await transactionApi.getTransactionById(transactionId);
        if (response.success && response.data) {
          setTransaction(response.data);
        } else {
          setError("Transaction not found");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    if (transactionId) fetchTransaction();
  }, [transactionId]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const statusConfig: Record<
    string,
    { icon: typeof CheckCircle2; color: string; label: string }
  > = {
    success: { icon: CheckCircle2, color: "text-emerald-500", label: "Successful" },
    pending: { icon: Clock, color: "text-amber-500", label: "Pending" },
    failed: { icon: XCircle, color: "text-red-500", label: "Failed" },
    cancelled: { icon: Ban, color: "text-slate-400", label: "Cancelled" },
  };

  const getStatus = (status: string) =>
    statusConfig[status] ?? statusConfig.cancelled;

  const parseAmount = (amount: string | number): string => {
    if (typeof amount === "number") return amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });
    const num = Number(String(amount).replace(/[₦,]/g, ""));
    return isNaN(num) ? "0.00" : num.toLocaleString("en-NG", { minimumFractionDigits: 2 });
  };

  /* ── Loading ─────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-bg-primary mx-auto mb-3" />
          <p className="text-sm text-dashboard-muted">Loading details…</p>
        </div>
      </div>
    );
  }

  /* ── Error ───────────────────────────────── */
  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-dashboard-bg">
        <div className="px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-dashboard-muted hover:text-dashboard-heading transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex flex-col items-center py-16">
            <XCircle className="h-10 w-10 text-red-400/60 mb-3" />
            <p className="text-sm text-red-500 mb-4">
              {error || "Transaction not found"}
            </p>
            <button
              onClick={() => router.push("/dashboard/transactions")}
              className="text-sm font-medium text-brand-bg-primary hover:underline"
            >
              View all transactions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status = getStatus(transaction.status);
  const StatusIcon = status.icon;
  const logo = getTransactionLogo(transaction);
  const providerName = getProviderDisplayName(transaction);
  const meta = transaction.meta || {};
  const isElectricity = transaction.type === "electricity";
  const isCable = transaction.type === "cable";
  const isData = transaction.type === "data";
  const isAirtime = transaction.type === "airtime";
  const isEducation = transaction.type === "education";

  const hasToken = isElectricity && "electricity_token" in meta && !!(meta as ElectricityMeta).electricity_token;
  const shouldShowTokenFallback =
    isElectricity &&
    transaction.status === "success" &&
    !hasToken;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* ── Header ─────────────────────────── */}
      <header className="sticky top-0 z-30 bg-dashboard-surface border-b border-dashboard-border/50">
        <div className="flex items-center justify-between px-4 h-12 max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
            className="p-1 -ml-1 touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5 text-dashboard-heading" />
          </button>
          <h1 className="text-[15px] font-semibold text-dashboard-heading">
            Transaction Details
          </h1>
          <div className="w-6" />
        </div>
      </header>

      {/* ── Scrollable content ─────────────── */}
      <div className="pb-24">
        <div className="max-w-lg mx-auto">

          {/* ── Hero ───────────────────────── */}
          <div className="bg-dashboard-surface pt-6 pb-5 px-4 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-3">
              {transaction.credit_debit === "credit" ? (
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                  <ArrowDownLeft className="h-7 w-7 text-blue-500" />
                </div>
              ) : logo ? (
                <div className="relative w-14 h-14 rounded-full overflow-hidden ring-1 ring-dashboard-border/30">
                  <Image
                    src={logo}
                    alt={providerName || transaction.description}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-dashboard-bg flex items-center justify-center">
                  <span className="text-lg font-bold text-dashboard-muted">
                    {(transaction.type || "T")[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Provider name */}
            {providerName && (
              <p className="text-sm text-dashboard-muted mb-1">{providerName}</p>
            )}

            {/* Amount */}
            <p className="text-[28px] sm:text-[32px] font-bold text-dashboard-heading leading-none">
              ₦{parseAmount(transaction.amount)}
            </p>

            {/* Status */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <StatusIcon className={`h-4.5 w-4.5 ${status.color}`} />
              <span className={`text-sm font-semibold ${status.color}`}>
                {status.label}
              </span>
            </div>
          </div>

          {/* ── Education credentials card ── */}
          {isEducation && "pin" in meta && (meta as EducationMeta).pin && (
            <div className="mx-4 mt-3 space-y-2">
              {/* WAEC Result Checker: cards with Serial + PIN */}
              {(meta as EducationMeta).cards && (meta as EducationMeta).cards!.length > 0
                ? (meta as EducationMeta).cards!.map((card: EducationCard, idx: number) => (
                    <div key={idx} className="bg-dashboard-surface rounded-xl border border-dashboard-border/50 px-4 py-3.5 space-y-2">
                      {(meta as EducationMeta).cards!.length > 1 && (
                        <p className="text-[10px] text-dashboard-muted font-semibold uppercase tracking-wider">Card {idx + 1}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dashboard-muted">Serial</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-dashboard-heading font-mono tracking-wide">{card.Serial}</span>
                          <button onClick={() => copyToClipboard(card.Serial, `serial-${idx}`)} className="p-1 rounded-md hover:bg-dashboard-bg transition-colors touch-manipulation">
                            {copiedField === `serial-${idx}` ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-dashboard-muted/50" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dashboard-muted">PIN</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-dashboard-heading font-mono tracking-wide">{card.Pin}</span>
                          <button onClick={() => copyToClipboard(card.Pin, `pin-${idx}`)} className="p-1 rounded-md hover:bg-dashboard-bg transition-colors touch-manipulation">
                            {copiedField === `pin-${idx}` ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-dashboard-muted/50" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                : (
                    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/50 px-4 py-3.5 space-y-2">
                      {(meta as EducationMeta).serial && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-dashboard-muted">Serial</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-dashboard-heading font-mono tracking-wide">{(meta as EducationMeta).serial}</span>
                            <button onClick={() => copyToClipboard((meta as EducationMeta).serial!, "serial")} className="p-1 rounded-md hover:bg-dashboard-bg transition-colors touch-manipulation">
                              {copiedField === "serial" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-dashboard-muted/50" />}
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dashboard-muted">
                          {(meta as EducationMeta).product_name?.includes("JAMB") ? "JAMB PIN" : "PIN"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-dashboard-heading font-mono tracking-wide">{(meta as EducationMeta).pin}</span>
                          <button onClick={() => copyToClipboard((meta as EducationMeta).pin!, "edu-pin")} className="p-1 rounded-md hover:bg-dashboard-bg transition-colors touch-manipulation">
                            {copiedField === "edu-pin" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-dashboard-muted/50" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
            </div>
          )}

          {/* ── Token card (electricity prepaid) ── */}
          {hasToken && (
            <div className="mx-4 mt-3">
              <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/50 px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dashboard-muted">Token</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-dashboard-heading font-mono tracking-wide">
                      {(meta as ElectricityMeta).electricity_token}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          (meta as ElectricityMeta).electricity_token,
                          "token"
                        )
                      }
                      className="p-1 rounded-md hover:bg-dashboard-bg transition-colors touch-manipulation"
                    >
                      {copiedField === "token" ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-dashboard-muted/50" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Token fallback (electricity, success but no token) ── */}
          {shouldShowTokenFallback && (
            <div className="mx-4 mt-3">
              <div className="bg-dashboard-surface rounded-xl border border-amber-200/80 px-4 py-3.5 space-y-2">
                <p className="text-sm font-semibold text-amber-800">
                  Token not available
                </p>
                <p className="text-[11px] sm:text-xs text-amber-900 leading-relaxed">
                  This electricity purchase was marked as successful, but we couldn&apos;t retrieve your
                  token automatically. Please contact support with your transaction number so we can
                  help you resolve this.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/support/new")}
                  className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-brand-bg-primary hover:text-brand-bg-primary/90 hover:underline underline-offset-4"
                >
                  Contact support
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* ── Transaction Details card ──────── */}
          <div className="mx-4 mt-3 mb-4">
            <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/50 overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-[15px] font-semibold text-dashboard-heading">
                  Transaction Details
                </h2>
              </div>

              <div className="divide-y divide-dashboard-border/40">
                {/* ── Type-specific rows ──── */}

                {/* Electricity */}
                {isElectricity && "meter_type" in meta && (
                  <Row label="Meter Type" value={(meta as ElectricityMeta).meter_type} capitalize />
                )}
                {isElectricity && "meter_number" in meta && (
                  <Row label="Meter Number" value={(meta as ElectricityMeta).meter_number} mono />
                )}
                {isElectricity && "customer_name" in meta && (
                  <Row label="Customer Name" value={(meta as ElectricityMeta).customer_name} />
                )}
                {isElectricity && "customer_address" in meta && (meta as ElectricityMeta).customer_address && (
                  <Row label="Service Address" value={(meta as ElectricityMeta).customer_address} />
                )}
                {isElectricity && "units" in meta && (meta as ElectricityMeta).units && (
                  <Row label="Units Purchased" value={(meta as ElectricityMeta).units} />
                )}

                {/* Cable */}
                {isCable && "customer_name" in meta && (
                  <Row label="Customer Name" value={(meta as CableMeta).customer_name} />
                )}
                {isCable && "bouquet" in meta && (
                  <Row label="Bouquet" value={(meta as CableMeta).bouquet} />
                )}
                {isCable && "smartcard_number" in meta && (
                  <Row label="Smartcard Number" value={(meta as CableMeta).smartcard_number} mono />
                )}
                {isCable && "subscription_type" in meta && (
                  <Row label="Subscription Type" value={(meta as CableMeta).subscription_type} capitalize />
                )}

                {/* Data / VTU plan name (from API) */}
                {transaction.data_plan_name?.trim() && (
                  <Row label="Plan" value={transaction.data_plan_name} />
                )}
                {/* Data */}
                {isData && "phone" in meta && (
                  <Row label="Recipient Mobile" value={(meta as DataMeta).phone} mono />
                )}
                {isData && "plan" in meta && (meta as DataMeta).plan && (
                  <Row label="Data Bundle" value={(meta as DataMeta).plan} />
                )}

                {/* Airtime */}
                {isAirtime && "phone" in meta && (
                  <Row label="Recipient Mobile" value={(meta as AirtimeMeta).phone} mono />
                )}

                {/* Education */}
                {isEducation && "product_name" in meta && (meta as EducationMeta).product_name && (
                  <Row label="Product" value={(meta as EducationMeta).product_name} />
                )}
                {isEducation && "phone" in meta && (meta as EducationMeta).phone && (
                  <Row label="Phone" value={(meta as EducationMeta).phone} mono />
                )}
                {isEducation && "profile_id" in meta && (meta as EducationMeta).profile_id && (
                  <Row label="JAMB Profile ID" value={(meta as EducationMeta).profile_id!} mono />
                )}
                {isEducation && "quantity" in meta && (meta as EducationMeta).quantity > 1 && (
                  <Row label="Quantity" value={String((meta as EducationMeta).quantity)} />
                )}

                {/* ── Common rows ──────── */}
                <Row
                  label="Transaction Type"
                  value={formatType(transaction.type)}
                />
                {transaction.payment_method && (
                  <Row
                    label="Payment Method"
                    value={transaction.payment_method}
                    capitalize
                    chevron
                  />
                )}
                {transaction.transaction_number && (
                  <CopyRow
                    label="Transaction No."
                    value={transaction.transaction_number}
                    copiedField={copiedField}
                    copyKey="txno"
                    onCopy={copyToClipboard}
                  />
                )}
                {!transaction.transaction_number && transaction.tx_reference && (
                  <CopyRow
                    label="Transaction No."
                    value={transaction.tx_reference}
                    copiedField={copiedField}
                    copyKey="txref"
                    onCopy={copyToClipboard}
                  />
                )}
                <Row label="Transaction Date" value={transaction.created_on} />
              </div>
            </div>
          </div>

          {/* ── Cashback (compact; VTpass used or earned) ── */}
          {(transaction.cashback_balance_before != null ||
            transaction.cashback_used != null ||
            transaction.cashback_balance_after != null ||
            transaction.cashback_earned != null) && (
            <div className="mx-4 mb-4">
              <CashbackCompactCard transaction={transaction} parseAmount={parseAmount} />
            </div>
          )}
        </div>
      </div>

      {/* ── Fixed bottom actions ──────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-dashboard-surface border-t border-dashboard-border/50 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={() => router.push("/dashboard/transactions")}
            className="flex-1 h-12 rounded-xl border border-dashboard-border text-sm font-semibold text-dashboard-heading hover:bg-dashboard-bg/60 transition-colors touch-manipulation"
          >
            All Transactions
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 h-12 rounded-xl bg-brand-bg-primary text-sm font-semibold text-white hover:bg-brand-bg-primary/90 transition-colors touch-manipulation"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════ */

function formatType(type: string): string {
  const map: Record<string, string> = {
    electricity: "Electricity",
    cable: "Cable TV",
    data: "Mobile Data",
    airtime: "Airtime",
    transfer: "Transfer",
    deposit: "Deposit",
    education: "Education",
    betting: "Betting",
    withdrawal: "Withdrawal",
    referral_bonus: "Referral Bonus",
  };
  return map[type] || type.replace(/_/g, " ");
}

/* ═══════════════════════════════════════════════
   Row Components
   ═══════════════════════════════════════════════ */

function Row({
  label,
  value,
  mono,
  capitalize: cap,
  chevron,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
  chevron?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 min-h-[44px]">
      <span className="text-[13px] text-dashboard-muted shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`text-[13px] font-medium text-dashboard-heading text-right leading-snug ${
            mono ? "font-mono" : ""
          } ${cap ? "capitalize" : ""}`}
        >
          {value}
        </span>
        {chevron && (
          <ChevronRight className="h-3.5 w-3.5 text-dashboard-muted/40 shrink-0" />
        )}
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copiedField,
  copyKey,
  onCopy,
}: {
  label: string;
  value: string;
  copiedField: string | null;
  copyKey: string;
  onCopy: (text: string, field: string) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 min-h-[44px]">
      <span className="text-[13px] text-dashboard-muted shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[13px] font-medium font-mono text-dashboard-heading text-right break-all leading-snug">
          {value}
        </span>
        <button
          onClick={() => onCopy(value, copyKey)}
          className="p-0.5 rounded hover:bg-dashboard-bg transition-colors shrink-0 touch-manipulation"
        >
          {copiedField === copyKey ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-dashboard-muted/40" />
          )}
        </button>
      </div>
    </div>
  );
}

function CashbackCompactCard({
  transaction,
  parseAmount,
}: {
  transaction: TransactionDetail;
  parseAmount: (amount: string | number) => string;
}) {
  const before = transaction.cashback_balance_before;
  const after = transaction.cashback_balance_after;
  const used = transaction.cashback_used ?? 0;
  const earned = transaction.cashback_earned ?? 0;

  const showCashbackWalletTrail =
    before != null && after != null && before !== after;

  const hasEarnedOrUsedLine = earned > 0 || used > 0;

  return (
    <div className="bg-dashboard-surface rounded-lg border border-dashboard-border/50 px-3 py-2 flex items-start justify-between gap-3">
      <span className="text-[11px] font-semibold text-dashboard-heading shrink-0 pt-0.5">
        Cashback
      </span>
      <div className="text-right min-w-0 space-y-0.5">
        {used > 0 && (
          <p className="text-[11px] text-dashboard-muted leading-snug">
            Used ₦{parseAmount(used)}
            {transaction.balance_before != null &&
              transaction.balance_after != null && (
                <>
                  {" "}
                  · Wallet ₦{parseAmount(transaction.balance_before)}→₦
                  {parseAmount(transaction.balance_after)}
                </>
              )}
          </p>
        )}
        {earned > 0 && (
          <p className="text-[11px] font-semibold text-emerald-600 leading-snug">
            Earned ₦{parseAmount(earned)}
          </p>
        )}
        {showCashbackWalletTrail && (
          <p className="text-[11px] text-dashboard-muted leading-snug">
            Balance ₦{parseAmount(before)} → ₦{parseAmount(after)}
          </p>
        )}
        {!hasEarnedOrUsedLine && !showCashbackWalletTrail && (
          <p className="text-[11px] text-dashboard-muted leading-snug">
            {[
              before != null && `Before ₦${parseAmount(before)}`,
              after != null && `After ₦${parseAmount(after)}`,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        )}
      </div>
    </div>
  );
}
