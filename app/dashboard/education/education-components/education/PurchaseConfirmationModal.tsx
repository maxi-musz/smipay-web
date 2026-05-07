"use client";

import { useState, useEffect } from "react";
import { X, Wallet, CheckCircle2, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

function parseCurrencyString(val: string | undefined): number {
  if (!val) return 0;
  return parseFloat(val.replace(/[₦,]/g, "")) || 0;
}

interface PurchaseConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (useCashback: boolean) => void;
  productName: string;
  variationName: string;
  phone: string;
  amount: number;
  quantity: number;
  profileId?: string;
  customerName?: string;
  walletBalance?: number;
  cashbackBalance?: string;
  cashbackPercent?: number;
  isLoading?: boolean;
}

export function PurchaseConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  productName,
  variationName,
  phone,
  amount,
  quantity,
  profileId,
  customerName,
  walletBalance,
  cashbackBalance,
  cashbackPercent,
  isLoading = false,
}: PurchaseConfirmationModalProps) {
  const [useCashback, setUseCashback] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  const totalAmount = amount * quantity;
  const cbBalanceNum = parseCurrencyString(cashbackBalance);
  const hasCashback = cbBalanceNum > 0;
  const cbDeduction = hasCashback ? Math.min(cbBalanceNum, totalAmount) : 0;
  const bonusToEarn =
    cashbackPercent && cashbackPercent > 0
      ? (totalAmount * cashbackPercent) / 100
      : 0;
  const finalFromWallet = useCashback ? totalAmount - cbDeduction : totalAmount;

  useEffect(() => {
    if (!isOpen) {
      setUseCashback(false);
      setShowCancelPrompt(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={!isLoading ? () => setShowCancelPrompt(true) : undefined}
      />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden">
        <button
          onClick={() => setShowCancelPrompt(true)}
          disabled={isLoading}
          className="absolute top-3.5 left-3.5 z-10 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>

        {showCancelPrompt && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 rounded-t-2xl sm:rounded-2xl">
            <div className="bg-white rounded-2xl shadow-xl mx-6 w-full max-w-xs p-6 text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-1.5">Reminder</h3>
              <p className="text-sm text-slate-500 mb-6">Do you want to cancel this payment?</p>
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(false)}
                  className="w-full h-12 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white font-semibold text-sm transition-colors active:scale-[0.99] touch-manipulation"
                >
                  Continue to pay
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full h-12 rounded-xl bg-orange-50 hover:bg-orange-100 text-brand-text-primary font-semibold text-sm transition-colors active:scale-[0.99] touch-manipulation"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Amount header */}
        <div className="pt-12 pb-5 px-5 text-center border-b border-slate-100">
          <p className="text-3xl sm:text-[32px] font-bold text-slate-900 tabular-nums tracking-tight">
            ₦
            {(useCashback && cbDeduction > 0 ? finalFromWallet : totalAmount).toLocaleString(
              "en-NG",
              { minimumFractionDigits: 2 }
            )}
          </p>
          {useCashback && cbDeduction > 0 && (
            <p className="text-sm text-slate-400 line-through mt-1 tabular-nums">
              ₦{totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <span className="text-sm text-slate-500">Product</span>
            <span className="text-sm font-semibold text-slate-900">{productName}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <span className="text-sm text-slate-500">Plan</span>
            <span className="text-sm font-semibold text-slate-900 text-right max-w-[60%] truncate">
              {variationName}
            </span>
          </div>

          {profileId && (
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">JAMB Profile ID</span>
              <div className="text-right">
                <span className="text-sm font-semibold text-slate-900 font-mono">{profileId}</span>
                {customerName && (
                  <p className="text-xs text-slate-500 mt-0.5">{customerName}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <span className="text-sm text-slate-500">Phone Number</span>
            <span className="text-sm font-semibold text-slate-900 font-mono">{phone}</span>
          </div>

          {quantity > 1 && (
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">Quantity</span>
              <span className="text-sm font-semibold text-slate-900">
                {quantity} × ₦{amount.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <span className="text-sm text-slate-500">Total Amount</span>
            <span className="text-sm font-semibold text-slate-900 tabular-nums">
              ₦{totalAmount.toLocaleString()}
            </span>
          </div>

          {hasCashback && (
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">
                Use Cashback
                <span className="text-slate-400">
                  (₦{cbBalanceNum.toLocaleString("en-NG", { minimumFractionDigits: 2 })})
                </span>
              </span>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold text-slate-900 tabular-nums">
                  -₦{cbDeduction.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={useCashback}
                  onClick={() => setUseCashback((v) => !v)}
                  disabled={isLoading}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bg-primary/40 disabled:opacity-50",
                    useCashback ? "bg-brand-bg-primary" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform duration-200",
                      useCashback ? "translate-x-[22px]" : "translate-x-[3px]"
                    )}
                  />
                </button>
              </div>
            </div>
          )}

          {bonusToEarn > 0 && (
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">Bonus to Earn</span>
              <span className="text-xs font-bold text-brand-text-primary bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full tabular-nums">
                +₦
                {bonusToEarn % 1 === 0 ? bonusToEarn : bonusToEarn.toFixed(2)} Cashback
              </span>
            </div>
          )}

          <div className="pt-4 pb-2">
            <span className="text-sm font-semibold text-slate-700">Payment Method</span>
          </div>
          <div className="flex items-center justify-between py-3 rounded-xl bg-slate-50 px-3.5 -mx-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-slate-700 font-medium">
                Available Balance
                {walletBalance != null && (
                  <span className="text-slate-400 ml-0.5">
                    (₦{walletBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })})
                  </span>
                )}
              </span>
            </div>
            {walletBalance != null && walletBalance >= finalFromWallet ? (
              <svg
                className="h-5 w-5 text-brand-text-primary shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <span className="text-xs text-red-500 font-medium">Insufficient</span>
            )}
          </div>
          {useCashback && cbDeduction > 0 && (
            <div className="flex items-center justify-between py-2 px-3.5 -mx-0.5 mt-1 text-xs text-slate-500">
              <span>Cashback wallet</span>
              <span className="font-medium text-brand-text-primary tabular-nums">
                -₦{cbDeduction.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        <div className="px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-5">
          <button
            type="button"
            onClick={() => onConfirm(useCashback)}
            disabled={
              isLoading ||
              (walletBalance != null && walletBalance < finalFromWallet)
            }
            className="w-full h-13 sm:h-14 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white text-base font-semibold transition-colors shadow-lg shadow-brand-bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] touch-manipulation"
          >
            {isLoading ? "Processing…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
