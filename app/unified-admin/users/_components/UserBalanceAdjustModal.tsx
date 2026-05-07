"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Scale, Loader2 } from "lucide-react";
import { adminUsersApi } from "@/services/admin/users-api";
import type {
  AdminUser,
  AdminUserCashbackWallet,
  AdminUserWallet,
  AdjustUserBalancesPayload,
} from "@/types/admin/users";

function cents(n: number): number {
  return Math.round(n * 100);
}

/** Stable decimal string for inputs (avoids long float noise). */
function numToInput(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const r = Math.round(n * 100) / 100;
  return String(r);
}

function parseMoney(raw: string): number | "invalid" | "empty" {
  const t = raw.trim();
  if (!t) return "empty";
  const n = Number(t.replace(/,/g, ""));
  if (!Number.isFinite(n)) return "invalid";
  return Math.round(n * 100) / 100;
}

interface Props {
  user: AdminUser;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  wallet: AdminUserWallet | null;
  cashbackWallet: AdminUserCashbackWallet | null;
}

export function UserBalanceAdjustModal({
  user,
  open,
  onClose,
  onSuccess,
  wallet,
  cashbackWallet,
}: Props) {
  const hasMainWallet = !!wallet;

  const [mainBalStr, setMainBalStr] = useState("");
  const [mainFundingStr, setMainFundingStr] = useState("");
  const [mainWithdrawnStr, setMainWithdrawnStr] = useState("");
  const [cbBalStr, setCbBalStr] = useState("");
  const [cbEarnedStr, setCbEarnedStr] = useState("");
  const [cbWithdrawnStr, setCbWithdrawnStr] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setReason("");
    if (wallet) {
      setMainBalStr(numToInput(wallet.current_balance));
      setMainFundingStr(numToInput(wallet.all_time_fuunding));
      setMainWithdrawnStr(numToInput(wallet.all_time_withdrawn));
    } else {
      setMainBalStr("");
      setMainFundingStr("");
      setMainWithdrawnStr("");
    }
    const cb = cashbackWallet;
    setCbBalStr(numToInput(cb?.current_balance ?? 0));
    setCbEarnedStr(numToInput(cb?.all_time_earned ?? 0));
    setCbWithdrawnStr(numToInput(cb?.all_time_withdrawn ?? 0));
  }, [open, user.id, wallet, cashbackWallet]);

  const validation = useMemo(() => {
    const reasonOk = reason.trim().length >= 3;
    let invalid = false;
    let changed = false;

    const icbBal = cashbackWallet?.current_balance ?? 0;
    const icbEarned = cashbackWallet?.all_time_earned ?? 0;
    const icbWithdrawn = cashbackWallet?.all_time_withdrawn ?? 0;

    if (hasMainWallet && wallet) {
      for (const [raw, init] of [
        [mainBalStr, wallet.current_balance],
        [mainFundingStr, wallet.all_time_fuunding],
        [mainWithdrawnStr, wallet.all_time_withdrawn],
      ] as const) {
        const p = parseMoney(raw);
        if (p === "invalid" || p === "empty") invalid = true;
        else if (cents(p) !== cents(init)) changed = true;
      }
    }

    for (const [raw, init] of [
      [cbBalStr, icbBal],
      [cbEarnedStr, icbEarned],
      [cbWithdrawnStr, icbWithdrawn],
    ] as const) {
      const p = parseMoney(raw);
      if (p === "invalid" || p === "empty") invalid = true;
      else if (cents(p) !== cents(init)) changed = true;
    }

    const mainBalParsed = hasMainWallet ? parseMoney(mainBalStr) : "empty";
    const cbBalParsed = parseMoney(cbBalStr);
    if (
      mainBalParsed !== "invalid" &&
      mainBalParsed !== "empty" &&
      mainBalParsed < 0
    ) {
      invalid = true;
    }
    if (cbBalParsed !== "invalid" && cbBalParsed !== "empty" && cbBalParsed < 0) {
      invalid = true;
    }

    const canSubmit = reasonOk && changed && !invalid && !submitting;

    return { reasonOk, invalid, changed, canSubmit };
  }, [
    reason,
    hasMainWallet,
    wallet,
    cashbackWallet,
    mainBalStr,
    mainFundingStr,
    mainWithdrawnStr,
    cbBalStr,
    cbEarnedStr,
    cbWithdrawnStr,
    submitting,
  ]);

  const resetForm = () => {
    setError(null);
    setReason("");
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
    if (!validation.canSubmit) return;

    const payload: AdjustUserBalancesPayload = { reason: reason.trim() };

    const icbBal = cashbackWallet?.current_balance ?? 0;
    const icbEarned = cashbackWallet?.all_time_earned ?? 0;
    const icbWithdrawn = cashbackWallet?.all_time_withdrawn ?? 0;

    if (hasMainWallet && wallet) {
      const b = parseMoney(mainBalStr);
      const f = parseMoney(mainFundingStr);
      const w = parseMoney(mainWithdrawnStr);
      if (b === "invalid" || b === "empty" || f === "invalid" || f === "empty" || w === "invalid" || w === "empty") {
        setError("Fill all main wallet fields with valid numbers.");
        return;
      }
      if (cents(b) !== cents(wallet.current_balance)) payload.wallet_current_balance = b;
      if (cents(f) !== cents(wallet.all_time_fuunding)) payload.wallet_all_time_fuunding = f;
      if (cents(w) !== cents(wallet.all_time_withdrawn)) payload.wallet_all_time_withdrawn = w;
    }

    const cbB = parseMoney(cbBalStr);
    const cbE = parseMoney(cbEarnedStr);
    const cbW = parseMoney(cbWithdrawnStr);
    if (cbB === "invalid" || cbB === "empty" || cbE === "invalid" || cbE === "empty" || cbW === "invalid" || cbW === "empty") {
      setError("Fill all cashback fields with valid numbers.");
      return;
    }
    if (cents(cbB) !== cents(icbBal)) payload.cashback_current_balance = cbB;
    if (cents(cbE) !== cents(icbEarned)) payload.cashback_all_time_earned = cbE;
    if (cents(cbW) !== cents(icbWithdrawn)) payload.cashback_all_time_withdrawn = cbW;

    const keys = Object.keys(payload).filter((k) => k !== "reason");
    if (keys.length === 0) {
      setError("Change at least one value.");
      return;
    }

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

  const inputClass =
    "w-full px-3 py-2.5 text-sm bg-dashboard-bg border border-dashboard-border/60 rounded-lg text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 shadow-2xl w-full max-w-full sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-violet-50">
            <Scale className="h-4 w-4 text-violet-600" />
          </div>
          <h3 className="text-sm font-bold text-dashboard-heading">Edit wallet & cashback</h3>
        </div>
        <p className="text-xs text-dashboard-muted mb-4">
          {displayName} — values are saved exactly as entered. Main and cashback balances must be zero or
          greater. Change any field you need, add a reason, then apply.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 mb-3">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h4 className="text-[11px] font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
              Main wallet
            </h4>
            {!hasMainWallet ? (
              <p className="text-xs text-dashboard-muted">No main wallet record — only cashback can be edited.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] text-dashboard-muted mb-1">Current balance (₦)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={mainBalStr}
                    onChange={(e) => setMainBalStr(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-dashboard-muted mb-1">All-time funding (₦)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={mainFundingStr}
                    onChange={(e) => setMainFundingStr(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-dashboard-muted mb-1">All-time withdrawn (₦)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={mainWithdrawnStr}
                    onChange={(e) => setMainWithdrawnStr(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-dashboard-border/30">
            <h4 className="text-[11px] font-semibold text-violet-700 mb-2">Cashback wallet</h4>
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] text-dashboard-muted mb-1">Current balance (₦)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={cbBalStr}
                  onChange={(e) => setCbBalStr(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[11px] text-dashboard-muted mb-1">All-time earned (₦)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={cbEarnedStr}
                  onChange={(e) => setCbEarnedStr(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[11px] text-dashboard-muted mb-1">All-time withdrawn (₦)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={cbWithdrawnStr}
                  onChange={(e) => setCbWithdrawnStr(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            {!cashbackWallet && (
              <p className="text-[10px] text-dashboard-muted mt-2">
                No cashback row yet — saving will create one with these values.
              </p>
            )}
          </div>
        </div>

        <label className="block text-xs text-dashboard-muted mb-1 mt-4">Reason (required, min 3 characters)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are these values being changed?"
          rows={2}
          className={`${inputClass} resize-none mb-1`}
        />
        {!validation.reasonOk && reason.length > 0 && (
          <p className="text-[10px] text-amber-700 mb-2">Reason must be at least 3 characters.</p>
        )}
        {!validation.changed && validation.reasonOk && !validation.invalid && (
          <p className="text-[10px] text-dashboard-muted mb-2">Change at least one number to enable apply.</p>
        )}

        <div className="flex justify-end gap-2 mt-4">
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
            disabled={!validation.canSubmit}
            className="px-4 py-2 text-xs font-medium text-white rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:pointer-events-none transition-colors inline-flex items-center gap-1.5"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
