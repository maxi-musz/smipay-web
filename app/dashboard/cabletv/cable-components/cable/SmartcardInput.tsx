"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, X } from "lucide-react";

interface SmartcardInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  maxLength?: number;
}

export function SmartcardInput({
  value,
  onChange,
  error,
  disabled = false,
  required = true,
  label = "Smartcard Number",
  placeholder = "1212121212",
  maxLength = 10,
}: SmartcardInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, "");
    const formatted = input.slice(0, maxLength);
    onChange(formatted);
  };

  const isValid = value.length === maxLength;

  return (
    <div className="space-y-2">
      <label htmlFor="smartcard" className="text-xs sm:text-sm font-semibold text-dashboard-heading">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          id="smartcard"
          type="tel"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "w-full bg-transparent text-sm sm:text-base py-2 border-0 border-b-2 focus:outline-none focus:ring-0 transition-colors",
            "placeholder:text-dashboard-muted/50 text-dashboard-heading",
            value && !disabled ? "pr-8" : "",
            error
              ? "border-red-500 focus:border-red-500"
              : isValid && !error
              ? "border-green-500 focus:border-green-500"
              : "border-dashboard-border focus:border-brand-bg-primary"
          )}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={error ? "smartcard-error" : undefined}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-dashboard-border/40 text-dashboard-muted hover:text-dashboard-heading transition-colors touch-manipulation"
            aria-label="Clear input"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {error && (
        <div id="smartcard-error" className="flex items-center gap-2 text-xs sm:text-sm text-red-600">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {!error && value && !isValid && (
        <p className="text-[10px] sm:text-xs text-dashboard-muted">
          Enter a valid {maxLength}-digit {label.toLowerCase()}
        </p>
      )}
    </div>
  );
}
