"use client";

import { cn } from "@/lib/utils";
import { isAirtimePhoneValidationRelaxed } from "@/lib/dev-phone-validation";
import { X } from "lucide-react";

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  /** When true, renders only the input (no label, no error). Use when embedding in a custom layout. */
  inline?: boolean;
}

export function PhoneNumberInput({
  value,
  onChange,
  error,
  disabled = false,
  inline = false,
}: PhoneNumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, "");
    const formatted = input.slice(0, 11);
    onChange(formatted);
  };

  const formatDisplay = (phone: string) => {
    if (!phone) return "";
    if (phone.length <= 4) return phone;
    if (phone.length <= 7) return `${phone.slice(0, 4)} ${phone.slice(4)}`;
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  };

  const relaxed = isAirtimePhoneValidationRelaxed();
  const isValid = relaxed
    ? value.length >= 10 && value.length <= 11
    : value.length === 11 && value.startsWith("0");

  const inputField = (
    <div className="relative">
      <input
        id="phone"
        type="tel"
        inputMode="numeric"
        placeholder="0801 234 5678"
        value={formatDisplay(value)}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          "w-full bg-transparent border-0 border-b-2 rounded-none px-0 py-2.5 text-[17px] sm:text-lg font-semibold text-dashboard-heading placeholder:text-dashboard-muted/40 placeholder:font-normal transition-colors duration-200",
          "focus:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          value ? "pr-8" : "",
          error
            ? "border-red-400"
            : isValid
              ? "border-emerald-400"
              : "border-dashboard-border focus:border-brand-bg-primary"
        )}
        maxLength={13}
        aria-invalid={!!error}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-dashboard-border/40 text-dashboard-muted hover:text-dashboard-heading transition-colors touch-manipulation"
          aria-label="Clear number"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {isValid && !error && !value?.length && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="h-4.5 w-4.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );

  if (inline) {
    return <div className="flex-1 min-w-0">{inputField}</div>;
  }

  return (
    <div className="flex-1 min-w-0">
      <label className="text-[11px] font-medium text-dashboard-muted uppercase tracking-wider mb-1 block">
        Phone number
      </label>
      {inputField}
      {error && (
        <p className="text-[12px] text-red-500 font-medium mt-1.5">{error}</p>
      )}
    </div>
  );
}
