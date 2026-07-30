"use client";

import { X } from "lucide-react";

export function SmsAdminModal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`bg-dashboard-surface rounded-2xl shadow-xl w-full max-h-[90vh] overflow-y-auto border border-dashboard-border/60 ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sms-admin-modal-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-dashboard-border/60 bg-dashboard-surface px-5 py-4">
          <h2
            id="sms-admin-modal-title"
            className="text-base font-semibold text-dashboard-heading"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dashboard-border/60 text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
