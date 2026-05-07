"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertCircle, ShieldCheck } from "lucide-react";

interface CardFundingAmountProps {
  onContinue: (amount: number) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 1000000;

function formatQuickLabel(n: number) {
  return n >= 1000 ? `₦${n / 1000}k` : `₦${n}`;
}

export function CardFundingAmount({
  onContinue,
  onCancel,
  isLoading = false,
}: CardFundingAmountProps) {
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");

  const numericAmount = parseInt(amount.replace(/,/g, ""), 10) || 0;
  const isValid = numericAmount >= MIN_AMOUNT && numericAmount <= MAX_AMOUNT;

  const displayAmount = amount
    ? numericAmount.toLocaleString()
    : "";

  const handleAmountChange = (value: string) => {
    const raw = value.replace(/[^0-9]/g, "");
    setAmount(raw);
    if (error) setError("");
  };

  const handleQuickAmountClick = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    if (error) setError("");
  };

  const validateAndContinue = () => {
    if (!amount || isNaN(numericAmount)) {
      setError("Please enter a valid amount");
      return;
    }
    if (numericAmount < MIN_AMOUNT) {
      setError(`Minimum amount is ₦${MIN_AMOUNT.toLocaleString()}`);
      return;
    }
    if (numericAmount > MAX_AMOUNT) {
      setError(`Maximum amount is ₦${MAX_AMOUNT.toLocaleString()}`);
      return;
    }
    onContinue(numericAmount);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isValid) validateAndContinue();
  };

  return (
    <div className="space-y-4">
      {/* Compact header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-xl shrink-0">
          <CreditCard className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-dashboard-heading leading-tight">
            Enter Amount
          </h3>
          <p className="text-[11px] text-dashboard-muted mt-0.5">
            Fund instantly with debit or credit card
          </p>
        </div>
      </div>

      {/* Amount input */}
      <div>
        <label className="block text-[11px] font-medium text-dashboard-muted uppercase tracking-wider mb-1.5">
          Amount (₦)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dashboard-muted text-sm font-semibold pointer-events-none">
            ₦
          </span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0.00"
            value={displayAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className={`w-full pl-8 pr-3 h-11 text-lg font-semibold rounded-xl border bg-dashboard-bg/40 text-dashboard-heading placeholder:text-dashboard-muted/40 outline-none transition-colors ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
                : "border-dashboard-border/60 focus:border-brand-bg-primary focus:ring-1 focus:ring-brand-bg-primary/30"
            } disabled:opacity-50`}
          />
        </div>
        {error && (
          <div className="mt-1.5 flex items-center gap-1.5 text-red-500 text-[11px]">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Quick amount pills */}
      <div>
        <p className="text-[11px] font-medium text-dashboard-muted uppercase tracking-wider mb-2">
          Quick select
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {QUICK_AMOUNTS.map((q) => {
            const active = amount === q.toString();
            return (
              <button
                key={q}
                type="button"
                onClick={() => handleQuickAmountClick(q)}
                disabled={isLoading}
                className={`py-2 rounded-xl text-[13px] font-semibold transition-all touch-manipulation active:scale-[0.97] ${
                  active
                    ? "bg-brand-bg-primary text-white shadow-sm shadow-brand-bg-primary/25"
                    : "bg-dashboard-bg/60 text-dashboard-heading ring-1 ring-dashboard-border/50 hover:ring-brand-bg-primary/40"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {formatQuickLabel(q)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compact info strip */}
      <div className="flex items-start gap-2 rounded-xl bg-blue-50/70 border border-blue-100 px-3 py-2.5">
        <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-700 leading-relaxed">
          Min ₦{MIN_AMOUNT.toLocaleString()} · Max ₦{MAX_AMOUNT.toLocaleString()} · Instant credit · Secured
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2.5 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 h-10 rounded-xl text-[13px] font-semibold border-dashboard-border/60 text-dashboard-muted hover:bg-dashboard-bg/60"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={validateAndContinue}
          disabled={isLoading || !amount}
          className="flex-1 h-10 rounded-xl text-[13px] font-semibold bg-brand-bg-primary hover:bg-brand-bg-primary/90 text-white shadow-sm shadow-brand-bg-primary/20 disabled:opacity-50 disabled:shadow-none"
        >
          {isLoading ? "Processing…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
