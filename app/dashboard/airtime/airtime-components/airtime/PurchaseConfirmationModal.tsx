"use client";

import { useState, useEffect } from "react";
import { X, Phone } from "lucide-react";
import { getNetworkLogo } from "@/lib/network-logos";
import type { VtpassService } from "@/services/vtpass/vtu/vtpass-airtime-api";
import { cn } from "@/lib/utils";

interface PurchaseConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (useCashback: boolean) => void;
  network: VtpassService | null;
  phoneNumber: string;
  amount: number;
  walletBalance?: number;
  cashbackBalance?: string;
  cashbackPercent?: number;
  isLoading?: boolean;
}

function parseCurrencyString(val: string | undefined): number {
  if (!val) return 0;
  return parseFloat(val.replace(/[₦,]/g, "")) || 0;
}

export function PurchaseConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  network,
  phoneNumber,
  amount,
  walletBalance,
  cashbackBalance,
  cashbackPercent,
  isLoading = false,
}: PurchaseConfirmationModalProps) {
  const [useCashback, setUseCashback] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  const cbBalanceNum = parseCurrencyString(cashbackBalance);
  const hasCashback = cbBalanceNum > 0;
  const cbDeduction = hasCashback ? Math.min(cbBalanceNum, amount) : 0;
  const bonusToEarn = cashbackPercent && cashbackPercent > 0 ? (amount * cashbackPercent) / 100 : 0;

  useEffect(() => {
    if (!isOpen) {
      setUseCashback(false);
      setShowCancelPrompt(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const logo = network ? getNetworkLogo(network.serviceID) || network.image : null;
  const networkName = network?.name.replace(" Airtime", "") || "N/A";

  const finalFromWallet = useCashback ? amount - cbDeduction : amount;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={!isLoading ? () => setShowCancelPrompt(true) : undefined} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden">
        {/* Close button */}
        <button
          onClick={() => setShowCancelPrompt(true)}
          disabled={isLoading}
          className="absolute top-3.5 left-3.5 z-10 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>

        {/* Cancel confirmation prompt */}
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
            ₦{(useCashback && cbDeduction > 0 ? finalFromWallet : amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </p>
          {useCashback && cbDeduction > 0 && (
            <p className="text-sm text-slate-400 line-through mt-1 tabular-nums">
              ₦{amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0">
          {/* Product Name */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <span className="text-sm text-slate-500">Product Name</span>
            <div className="flex items-center gap-2">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={networkName} className="h-5 w-5 rounded-full object-contain" />
              ) : (
                <Phone className="h-4 w-4 text-slate-400" />
              )}
              <span className="text-sm font-semibold text-slate-900">Airtime</span>
            </div>
          </div>

          {/* Recipient Mobile */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <span className="text-sm text-slate-500">Recipient Mobile</span>
            <span className="text-sm font-semibold text-slate-900 font-mono tracking-wide">
              {phoneNumber}
            </span>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <span className="text-sm text-slate-500">Amount</span>
            <span className="text-sm font-semibold text-slate-900 tabular-nums">
              ₦{amount.toLocaleString()}
            </span>
          </div>

          {/* Use Cashback */}
          {hasCashback && (
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">
                Use Cashback
                <span className="text-slate-400">(₦{cbBalanceNum.toLocaleString("en-NG", { minimumFractionDigits: 2 })})</span>
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

          {/* Bonus to Earn */}
          {bonusToEarn > 0 && (
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">Bonus to Earn</span>
              <span className="text-xs font-bold text-brand-text-primary bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full tabular-nums">
                +₦{bonusToEarn % 1 === 0 ? bonusToEarn : bonusToEarn.toFixed(2)} Cashback
              </span>
            </div>
          )}

          {/* Payment Method */}
          <div className="pt-4 pb-2">
            <span className="text-sm font-semibold text-slate-700">Payment Method</span>
          </div>

          <div className="flex items-center justify-between py-3 rounded-xl bg-slate-50 px-3.5 -mx-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-slate-700 font-medium">
                Available Balance
                {walletBalance != null && (
                  <span className="text-slate-400 ml-0.5">(₦{walletBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })})</span>
                )}
              </span>
            </div>
            {walletBalance != null && walletBalance >= finalFromWallet ? (
              <svg className="h-5 w-5 text-brand-text-primary shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
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

        {/* Pay button */}
        <div className="px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-5">
          <button
            type="button"
            onClick={() => onConfirm(useCashback)}
            disabled={isLoading || (walletBalance != null && walletBalance < finalFromWallet)}
            className="w-full h-13 sm:h-14 rounded-xl bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white text-base font-semibold transition-colors shadow-lg shadow-brand-bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] touch-manipulation"
          >
            {isLoading ? "Processing…" : "Pay"}
          </button>
        </div>
      </div>
    </div>
  );
}
