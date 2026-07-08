"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  RefreshCw,
  X,
  CheckCheck,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Ban,
} from "lucide-react";
import { adminTransactionsApi } from "@/services/admin/transactions-api";
import type { PaystackRequeryResponse } from "@/types/admin/transactions";

type PaystackData = PaystackRequeryResponse["data"];

interface Props {
  open: boolean;
  onClose: () => void;
  transactionId?: string | null;
  localStatus?: string | null;
  reference?: string | null;
  loading?: boolean;
  error?: string | null;
  payload?: PaystackData | null;
  onResolved?: () => void;
}

function formatNGN(value: number): string {
  return `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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

export function RequeryPaystackModal({
  open,
  onClose,
  transactionId,
  localStatus,
  reference,
  loading = false,
  error = null,
  payload,
  onResolved,
}: Props) {
  const [confirmAction, setConfirmAction] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setConfirmAction(false);
    setResolving(false);
    setResolveError(null);
    setDoneMessage(null);
  }, [open, transactionId]);

  if (!open) return null;

  const found = payload?.found;
  const pStatus = payload?.paystack_status ?? null;
  const isPending = localStatus === "pending";
  const amountNgn =
    payload?.amount_kobo != null ? payload.amount_kobo / 100 : null;

  // Which action (if any) the admin can take from here.
  const action: "resolve" | "cancel" | null = !isPending
    ? null
    : found === false
      ? "cancel"
      : found === true && pStatus === "success"
        ? "resolve"
        : null;

  // Verdict styling.
  const verdict = !payload
    ? { label: "—", detail: "", bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-900", icon: HelpCircle }
    : found === false
      ? { label: "Not found on Paystack", detail: "No record on the current Paystack account — likely a deposit from a previous account. Marking it cancelled keeps the record for manual reconciliation.", bg: "bg-slate-100", border: "border-slate-200", text: "text-slate-800", icon: Ban }
      : pStatus === "success"
        ? { label: "Payment successful", detail: "Paystack confirms this payment. You can resolve it and credit the user's wallet.", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: CheckCircle2 }
        : pStatus === "failed" || pStatus === "abandoned"
          ? { label: `Payment ${pStatus}`, detail: "Paystack did not receive a successful payment. Nothing to credit.", bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: XCircle }
          : { label: `Paystack status: ${pStatus ?? "unknown"}`, detail: "Payment is not in a final successful state yet.", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", icon: Clock };

  const VerdictIcon = verdict.icon;

  const runResolve = async () => {
    if (!transactionId || !action || resolving || loading) return;
    if (!confirmAction) {
      setConfirmAction(true);
      return;
    }
    setResolving(true);
    setResolveError(null);
    try {
      const res = await adminTransactionsApi.requeryPaystackAndResolve(transactionId);
      const d = res.data;
      if (d.not_found) {
        setDoneMessage("Marked as cancelled — not found on Paystack. Kept for reconciliation.");
      } else if (d.resolved) {
        setDoneMessage(
          `Resolved to successful. Wallet credited ${
            d.amount_credited != null ? formatNGN(Number(d.amount_credited)) : ""
          }.`.trim(),
        );
      } else {
        setDoneMessage(res.message || "No change was made.");
      }
      setConfirmAction(false);
      onResolved?.();
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : "Resolve failed");
    } finally {
      setResolving(false);
    }
  };

  const actionLabel =
    action === "resolve"
      ? confirmAction
        ? "Confirm — credit wallet"
        : "Resolve & credit wallet"
      : action === "cancel"
        ? confirmAction
          ? "Confirm — mark cancelled"
          : "Mark as cancelled"
        : "";

  const actionClasses =
    action === "resolve"
      ? confirmAction
        ? "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800"
        : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
      : "border-slate-500 bg-slate-500 text-white hover:bg-slate-600";

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
              <div className="h-8 w-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                <RefreshCw className={`h-4 w-4 text-sky-700 ${loading ? "animate-spin" : ""}`} />
              </div>
              <h3 className="text-sm font-bold text-dashboard-heading">Paystack requery</h3>
            </div>
            {reference ? (
              <p className="text-[11px] text-dashboard-muted mt-1 font-mono truncate">
                {reference}
              </p>
            ) : null}
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
          {doneMessage ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{doneMessage} The table has been refreshed.</span>
            </div>
          ) : null}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-dashboard-muted">
              <RefreshCw className="h-6 w-6 animate-spin text-sky-600" />
              <p className="text-xs">Checking status with Paystack…</p>
            </div>
          ) : payload ? (
            <>
              <div className={`rounded-xl border px-4 py-3.5 ${verdict.bg} ${verdict.border}`}>
                <div className="flex items-start gap-3">
                  <VerdictIcon className={`h-5 w-5 shrink-0 mt-0.5 ${verdict.text}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${verdict.text}`}>{verdict.label}</p>
                    <p className={`text-xs mt-1 leading-relaxed ${verdict.text} opacity-90`}>
                      {verdict.detail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-dashboard-border/40 bg-white/60 px-3 py-1">
                <DetailRow label="Local status" value={localStatus ?? "—"} />
                <DetailRow label="Paystack status" value={pStatus ?? (found === false ? "not found" : "—")} />
                {payload.gateway_response ? (
                  <DetailRow label="Gateway response" value={payload.gateway_response} />
                ) : null}
                {amountNgn != null ? (
                  <DetailRow label="Amount (Paystack)" value={formatNGN(amountNgn)} />
                ) : null}
                {payload.channel ? <DetailRow label="Channel" value={payload.channel} /> : null}
                {payload.paid_at ? (
                  <DetailRow label="Paid at" value={new Date(payload.paid_at).toLocaleString()} />
                ) : null}
              </div>
            </>
          ) : !error ? (
            <p className="text-xs text-dashboard-muted text-center py-8">
              No Paystack response to display.
            </p>
          ) : null}
        </div>

        <div className="px-5 py-3 border-t border-dashboard-border/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {action && !doneMessage ? (
              <button
                type="button"
                onClick={runResolve}
                disabled={resolving || loading}
                title={
                  action === "resolve"
                    ? "Mark this deposit successful and credit the user's wallet"
                    : "Mark this deposit cancelled (not found on Paystack)"
                }
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  resolving || loading
                    ? "border-dashboard-border/40 text-dashboard-muted/50 bg-dashboard-bg/40 cursor-not-allowed"
                    : actionClasses
                }`}
              >
                {action === "resolve" ? (
                  <CheckCheck className={`h-3.5 w-3.5 ${resolving ? "animate-pulse" : ""}`} />
                ) : (
                  <Ban className={`h-3.5 w-3.5 ${resolving ? "animate-pulse" : ""}`} />
                )}
                {resolving ? "Working…" : actionLabel}
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
