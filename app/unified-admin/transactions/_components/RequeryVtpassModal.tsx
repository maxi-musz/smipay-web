"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  RefreshCw,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  HelpCircle,
  ChevronDown,
  CheckCheck,
} from "lucide-react";
import {
  parseVtpassRequeryPayload,
  canResolveVtpassTransaction,
  type VtpassDeliveryVerdict,
} from "@/lib/vtpass-requery-display";
import { adminTransactionsApi } from "@/services/admin/transactions-api";

interface Props {
  open: boolean;
  onClose: () => void;
  transactionId?: string | null;
  localStatus?: string | null;
  requestId?: string | null;
  loading?: boolean;
  error?: string | null;
  payload?: unknown;
  onResolved?: () => void;
}

const VERDICT_STYLES: Record<
  VtpassDeliveryVerdict,
  { bg: string; border: string; text: string; icon: typeof CheckCircle2 }
> = {
  delivered: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    icon: CheckCircle2,
  },
  processing: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-900",
    icon: Clock,
  },
  failed: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: XCircle,
  },
  reversed: {
    bg: "bg-slate-100",
    border: "border-slate-200",
    text: "text-slate-800",
    icon: RotateCcw,
  },
  unknown: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-900",
    icon: HelpCircle,
  },
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-dashboard-border/20 last:border-0">
      <span className="text-[11px] text-dashboard-muted shrink-0">{label}</span>
      <span className="text-[11px] text-dashboard-heading text-right font-medium break-all">
        {value}
      </span>
    </div>
  );
}

export function RequeryVtpassModal({
  open,
  onClose,
  transactionId,
  localStatus,
  requestId,
  loading = false,
  error = null,
  payload,
  onResolved,
}: Props) {
  const [showRaw, setShowRaw] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [confirmReverse, setConfirmReverse] = useState(false);
  const [reversing, setReversing] = useState(false);
  const [reverseError, setReverseError] = useState<string | null>(null);
  const [reversed, setReversed] = useState(false);
  const [reverseSummary, setReverseSummary] = useState<string | null>(null);

  const parsed = useMemo(
    () => (payload != null ? parseVtpassRequeryPayload(payload) : null),
    [payload],
  );

  const canResolve = useMemo(
    () => canResolveVtpassTransaction(localStatus, parsed?.verdict),
    [localStatus, parsed?.verdict],
  );

  useEffect(() => {
    if (!open) return;
    setResolveError(null);
    setResolved(false);
    setResolving(false);
    setShowRaw(false);
    setConfirmReverse(false);
    setReverseError(null);
    setReversed(false);
    setReversing(false);
    setReverseSummary(null);
  }, [open, transactionId]);

  if (!open) return null;

  const style = parsed ? VERDICT_STYLES[parsed.verdict] : VERDICT_STYLES.unknown;
  const VerdictIcon = style.icon;

  const handleResolve = async () => {
    if (!transactionId || !canResolve || resolving || loading) return;
    setResolving(true);
    setResolveError(null);
    try {
      const res = await adminTransactionsApi.requeryVtpassAndResolve(transactionId);
      if (res.success) {
        setResolved(true);
        onResolved?.();
      } else {
        setResolveError(res.message || "Could not resolve transaction");
      }
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : "Resolve failed");
    } finally {
      setResolving(false);
    }
  };

  // Reverse & refund is offered only when VTPass itself reports the tx as
  // reversed and it isn't already reversed locally. The backend re-verifies.
  const canReverse =
    !!transactionId &&
    parsed?.verdict === "reversed" &&
    localStatus !== "reversed";

  const handleReverse = async () => {
    if (!canReverse || reversing || loading || reversed) return;
    // First click arms the confirmation; second click executes the refund.
    if (!confirmReverse) {
      setConfirmReverse(true);
      return;
    }
    setReversing(true);
    setReverseError(null);
    try {
      const res = await adminTransactionsApi.reverseTransaction(
        transactionId!,
        "VTPass requery reported this transaction as reversed — refunding customer",
      );
      if (res.success) {
        const d = res.data;
        setReversed(true);
        setConfirmReverse(false);
        setReverseSummary(
          `Refunded ₦${Number(d.total_refunded).toLocaleString("en-NG")} (wallet ₦${Number(
            d.wallet_refund,
          ).toLocaleString("en-NG")} + cashback ₦${Number(d.cashback_refund).toLocaleString(
            "en-NG",
          )}).`,
        );
        onResolved?.();
      } else {
        setReverseError(res.message || "Could not reverse transaction");
      }
    } catch (err) {
      setReverseError(err instanceof Error ? err.message : "Reverse failed");
    } finally {
      setReversing(false);
    }
  };

  const resolveDisabled = !canResolve || resolving || loading || resolved;
  const resolveTitle = resolved
    ? "Transaction marked successful"
    : canResolve
      ? "Requery VTPass and mark this transaction successful locally"
      : parsed?.verdict === "delivered"
        ? "Local status is already successful"
        : "Available when VTPass reports delivered and local status is pending or failed";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 shadow-2xl w-full max-w-full sm:max-w-lg max-h-[min(90vh,720px)] flex flex-col"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-dashboard-border/40">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                <RefreshCw
                  className={`h-4 w-4 text-violet-700 ${loading ? "animate-spin" : ""}`}
                />
              </div>
              <h3 className="text-sm font-bold text-dashboard-heading">VTPass requery</h3>
            </div>
            {(requestId || parsed?.requestId) && (
              <p className="text-[11px] text-dashboard-muted mt-1 font-mono truncate">
                {parsed?.requestId ?? requestId}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto min-h-0 flex-1 space-y-4">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
              {error}
            </div>
          ) : null}

          {resolveError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
              {resolveError}
            </div>
          ) : null}

          {reverseError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
              {reverseError}
            </div>
          ) : null}

          {resolved ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Transaction updated to successful. The table has been refreshed.</span>
            </div>
          ) : null}

          {reversed ? (
            <div className="bg-violet-50 border border-violet-200 rounded-lg px-3 py-2.5 text-xs text-violet-900 flex items-start gap-2">
              <RotateCcw className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Transaction reversed and the customer refunded.{" "}
                {reverseSummary} The table has been refreshed.
              </span>
            </div>
          ) : null}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-dashboard-muted">
              <RefreshCw className="h-6 w-6 animate-spin text-violet-600" />
              <p className="text-xs">Checking status with VTPass…</p>
            </div>
          ) : parsed ? (
            <>
              <div
                className={`rounded-xl border px-4 py-3.5 ${style.bg} ${style.border}`}
              >
                <div className="flex items-start gap-3">
                  <VerdictIcon className={`h-5 w-5 shrink-0 mt-0.5 ${style.text}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${style.text}`}>
                      {parsed.verdictLabel}
                    </p>
                    <p className={`text-xs mt-1 leading-relaxed ${style.text} opacity-90`}>
                      {parsed.verdictDetail}
                    </p>
                    {parsed.txStatus ? (
                      <p className="text-[10px] mt-2 font-medium uppercase tracking-wide opacity-80">
                        Provider status: {parsed.txStatus}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {(parsed.productName || parsed.serviceType) && (
                <div className="rounded-lg border border-dashboard-border/40 bg-dashboard-bg/40 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-dashboard-muted">
                    Service
                  </p>
                  <p className="text-sm font-semibold text-dashboard-heading mt-0.5">
                    {parsed.productName ?? "—"}
                  </p>
                  {parsed.serviceType ? (
                    <p className="text-[11px] text-dashboard-muted mt-0.5">
                      {parsed.serviceType}
                    </p>
                  ) : null}
                </div>
              )}

              {parsed.detailRows.length > 0 ? (
                <div className="rounded-lg border border-dashboard-border/40 bg-white/60 px-3 py-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-dashboard-muted pt-2 pb-1">
                    Details
                  </p>
                  {parsed.detailRows.map((row) => (
                    <DetailRow key={row.label} label={row.label} value={row.value} />
                  ))}
                </div>
              ) : null}

              <div>
                <button
                  type="button"
                  onClick={() => setShowRaw((v) => !v)}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-dashboard-muted hover:text-dashboard-heading"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${showRaw ? "rotate-180" : ""}`}
                  />
                  {showRaw ? "Hide" : "Show"} raw VTPass JSON
                </button>
                {showRaw ? (
                  <pre className="mt-2 text-[10px] leading-relaxed font-mono text-dashboard-heading bg-dashboard-bg border border-dashboard-border/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                ) : null}
              </div>
            </>
          ) : !error ? (
            <p className="text-xs text-dashboard-muted text-center py-8">
              No VTPass response to display.
            </p>
          ) : null}
        </div>

        <div className="px-5 py-3 border-t border-dashboard-border/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {localStatus !== "success" ? (
              <button
                type="button"
                onClick={handleResolve}
                disabled={resolveDisabled}
                title={resolveTitle}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  resolveDisabled
                    ? "border-dashboard-border/40 text-dashboard-muted/50 bg-dashboard-bg/40 cursor-not-allowed"
                    : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                <CheckCheck
                  className={`h-3.5 w-3.5 ${resolving ? "animate-pulse" : ""}`}
                />
                {resolved ? "Resolved" : resolving ? "Resolving…" : "Resolve"}
              </button>
            ) : null}
            {canReverse ? (
              <button
                type="button"
                onClick={handleReverse}
                disabled={reversing || loading || reversed}
                title="Reverse this transaction and refund the customer's wallet and cashback"
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  reversing || loading || reversed
                    ? "border-dashboard-border/40 text-dashboard-muted/50 bg-dashboard-bg/40 cursor-not-allowed"
                    : confirmReverse
                      ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                      : "border-violet-600 bg-violet-600 text-white hover:bg-violet-700"
                }`}
              >
                <RotateCcw
                  className={`h-3.5 w-3.5 ${reversing ? "animate-spin" : ""}`}
                />
                {reversed
                  ? "Reversed"
                  : reversing
                    ? "Reversing…"
                    : confirmReverse
                      ? "Confirm — refund customer"
                      : "Reverse & refund balance"}
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium border border-dashboard-border/60 rounded-lg hover:bg-dashboard-bg transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
