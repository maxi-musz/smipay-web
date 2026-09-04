"use client";

import { HelpCircle } from "lucide-react";

export function HelpTooltip({ text }: { text: string }) {
  return (
    <span className="group/help relative inline-flex shrink-0">
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-dashboard-muted/80 transition-colors hover:text-dashboard-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bg-primary/40"
        aria-label="What does this mean?"
      >
        <HelpCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 w-52 -translate-x-1/2 rounded-lg border border-dashboard-border/60 bg-dashboard-surface px-2.5 py-2 text-left text-[11px] font-normal normal-case leading-snug tracking-normal text-dashboard-heading opacity-0 shadow-lg transition-opacity group-hover/help:opacity-100 group-focus-within/help:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
