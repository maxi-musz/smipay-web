"use client";

import { cn } from "@/lib/utils";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  presetAmounts?: number[];
  required?: boolean;
  cashbackPercent?: number;
}

export function AmountInput({
  value,
  onChange,
  error,
  disabled = false,
  min = 50,
  max = 100000,
  presetAmounts = [100, 200, 500, 1000, 2000, 5000],
  cashbackPercent,
}: AmountInputProps) {
  const handlePresetClick = (amount: number) => {
    if (amount >= min && amount <= max) {
      onChange(amount.toString());
    }
  };

  const numericValue = parseFloat(value) || 0;
  const isValid = numericValue >= min && numericValue <= max && value !== "";
  const showCashback = cashbackPercent != null && cashbackPercent > 0;

  return (
    <div className="space-y-3">
      <div className="flex-1 min-w-0">
        <label className="text-[11px] font-medium text-dashboard-muted uppercase tracking-wider mb-1 block">
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-0 bottom-2.5 text-dashboard-heading font-bold text-[17px] sm:text-lg pointer-events-none select-none">
            ₦
          </span>
          <input
            id="amount"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={value}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              onChange(raw);
            }}
            disabled={disabled}
            className={cn(
              "w-full bg-transparent border-0 border-b-2 rounded-none pl-5 pr-0 py-2.5 text-[17px] sm:text-lg font-semibold text-dashboard-heading placeholder:text-dashboard-muted/40 placeholder:font-normal tabular-nums transition-colors duration-200",
              "focus:outline-none",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error
                ? "border-red-400"
                : isValid
                  ? "border-emerald-400"
                  : "border-dashboard-border focus:border-brand-bg-primary"
            )}
            aria-invalid={!!error}
          />
        </div>
        {error && (
          <p className="text-[12px] text-red-500 font-medium mt-1.5">{error}</p>
        )}
      </div>

      {presetAmounts.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {presetAmounts
            .filter((a) => a >= min && a <= max)
            .map((a) => {
              const isActive = value === a.toString();
              const cashback = showCashback ? (a * cashbackPercent!) / 100 : 0;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => handlePresetClick(a)}
                  disabled={disabled}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl py-2 px-2 transition-all duration-150",
                    "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] touch-manipulation",
                    isActive
                      ? "bg-brand-bg-primary/[0.06] ring-[1.5px] ring-brand-bg-primary"
                      : "bg-dashboard-bg ring-1 ring-dashboard-border/50 hover:ring-dashboard-border"
                  )}
                >
                  {showCashback && (
                    <span className={cn(
                      "text-[10px] sm:text-[11px] font-semibold leading-tight mb-0.5",
                      isActive ? "text-emerald-600" : "text-emerald-500"
                    )}>
                      ₦{cashback % 1 === 0 ? cashback : cashback.toFixed(1)} Cashback
                    </span>
                  )}
                  <span className={cn(
                    "text-sm sm:text-[15px] font-bold tabular-nums",
                    isActive ? "text-dashboard-heading" : "text-dashboard-heading/80"
                  )}>
                    ₦{a.toLocaleString()}
                  </span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
