"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

const WIDTHS = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
} as const;

export function GuardModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "lg",
  dismissOnBackdrop = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof WIDTHS;
  dismissOnBackdrop?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={dismissOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-dashboard-border/60 bg-dashboard-surface shadow-xl ${WIDTHS[size]}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="identity-guards-modal-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-dashboard-border/60 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="identity-guards-modal-title"
              className="text-base font-semibold text-dashboard-heading"
            >
              {title}
            </h2>
            {subtitle && (
              <div className="mt-0.5 text-xs text-dashboard-muted">{subtitle}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashboard-border/60 text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-dashboard-border/60 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
