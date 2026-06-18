"use client";

function parseDigits(raw: string): number {
  const cleaned = raw.replace(/\D/g, "");
  if (!cleaned) return 0;
  const n = Number(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

export function formatAmountDisplay(value: number): string {
  if (!value) return "";
  return value.toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

export function formatAmountLabel(
  value: number,
  unit?: string | null,
): string {
  if (!value) return unit === "NGN" ? "₦0" : "0";
  const formatted = formatAmountDisplay(value);
  if (unit === "NGN") return `₦${formatted}`;
  return unit ? `${formatted} ${unit}` : formatted;
}

interface FormattedAmountInputProps {
  value: number;
  onChange: (value: number) => void;
  unit?: string | null;
  className?: string;
}

export function FormattedAmountInput({
  value,
  onChange,
  unit,
  className = "",
}: FormattedAmountInputProps) {
  const showNairaPrefix = unit === "NGN";

  return (
    <div className={`relative flex-1 min-w-[140px] ${className}`}>
      {showNairaPrefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-dashboard-muted pointer-events-none">
          ₦
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={formatAmountDisplay(value)}
        placeholder="0"
        onFocus={(e) => e.target.select()}
        onChange={(e) => onChange(parseDigits(e.target.value))}
        className={`w-full py-2 text-sm rounded-lg border border-dashboard-border/60 bg-white shadow-sm tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 focus:border-brand-bg-primary/40 ${
          showNairaPrefix ? "pl-8 pr-3" : "px-3"
        }`}
      />
    </div>
  );
}
