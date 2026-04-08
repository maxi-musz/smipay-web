"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Scale, Loader2 } from "lucide-react";
import { adminUsersApi } from "@/services/admin/users-api";
import type { AdminUser } from "@/types/admin/users";

function formatNGN(value: number): string {
  return `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseDelta(raw: string): number | "invalid" {
  const t = raw.trim();
  if (!t) return 0;
  const n = Number(t);
  if (!Number.isFinite(n)) return "invalid";
  return Math.round(n * 100) / 100;
}

interface Props {
  user: AdminUser;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hasMainWallet: boolean;
  mainBalanceDisplay: number | null;
  cashbackBalanceDisplay: number;
}

export function UserBalanceAdjustModal({
  user,
  open,
  onClose,
  onSuccess,
  hasMainWallet,
  mainBalanceDisplay,
  cashbackBalanceDisplay,
}: Props) {
  const [walletRaw, setWalletRaw] = useState("");
  const [cashbackRaw, setCashbackRaw] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setWalletRaw("");
    setCashbackRaw("");
    setReason("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!open) return null;

  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || user.phone_number;

  const handleSubmit = async () => {
    setError(null);

    const walletDelta = hasMainWallet ? parseDelta(walletRaw) : 0;
    const cashbackDelta = parseDelta(cashbackRaw);

    if (walletDelta === "invalid" || cashbackDelta === "invalid") {
      setError("Enter valid numbers for adjustments (or leave blank for no change).");
      return;
    }

    if (walletDelta === 0 && cashbackDelta === 0) {
      setError("Enter a non-zero main wallet and/or cashback adjustment.");
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      setError("Reason must be at least 3 characters.");
      return;
    }

    if (!hasMainWallet && walletDelta !== 0) {
      setError("This user has no main wallet; only cashback can be adjusted.");
      return;
    }

    const payload: { reason: string; wallet_delta?: number; cashback_delta?: number } = {
      reason: reason.trim(),
    };
    if (walletDelta !== 0) payload.wallet_delta = walletDelta;
    if (cashbackDelta !== 0) payload.cashback_delta = cashbackDelta;

    setSubmitting(true);
    try {
      const res = await adminUsersApi.adjustBalances(user.id, payload);
      if (res.success && res.data) {
        resetForm();
        onSuccess();
        onClose();
      } else {
        setError(res.message || "Failed to adjust balances");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adjust balances");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 shadow-2xl w-full max-w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-violet-50">
            <Scale className="h-4 w-4 text-violet-600" />
          </div>
          <h3 className="text-sm font-bold text-dashboard-heading">Adjust balances</h3>
        </div>
        <p className="text-xs text-dashboard-muted mb-4">
          {displayName} — positive amounts credit, negative debit. Balances cannot go below zero.
        </p>

        <div className="rounded-lg border border-dashboard-border/40 bg-dashboard-bg/50 px-3 py-2.5 mb-4 space-y-1.5 text-[11px] text-dashboard-muted">
          <div className="flex justify-between gap-2">
            <span>Main wallet (now)</span>
            <span className="font-medium text-dashboard-heading tabular-nums">
              {hasMainWallet ? formatNGN(mainBalanceDisplay ?? 0) : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Cashback (now)</span>
            <span className="font-medium text-dashboard-heading tabular-nums">
              {formatNGN(cashbackBalanceDisplay)}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 mb-3">
            {error}
          </div>
        )}

        <label className="block text-xs text-dashboard-muted mb-1">Main wallet delta (₦)</label>
        <input
          type="text"
          inputMode="decimal"
          value={walletRaw}
          onChange={(e) => setWalletRaw(e.target.value)}
          disabled={!hasMainWallet}
          placeholder={hasMainWallet ? "e.g. 500 or -200" : "No main wallet"}
          className="w-full px-3 py-2.5 text-sm bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 mb-3 disabled:opacity-50"
        />

        <label className="block text-xs text-dashboard-muted mb-1">Cashback delta (₦)</label>
        <input
          type="text"
          inputMode="decimal"
          value={cashbackRaw}
          onChange={(e) => setCashbackRaw(e.target.value)}
          placeholder="e.g. 100 or -50"
          className="w-full px-3 py-2.5 text-sm bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 mb-3"
        />

        <label className="block text-xs text-dashboard-muted mb-1">Reason (required)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this adjustment being made?"
          rows={2}
          className="w-full px-3 py-2.5 text-sm bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 resize-none mb-4"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-medium border border-dashboard-border/60 rounded-lg hover:bg-dashboard-bg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-white rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Apply adjustment
          </button>
        </div>
      </motion.div>
    </div>
  );
}
