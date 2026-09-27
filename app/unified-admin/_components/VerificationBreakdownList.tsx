"use client";

import type { VerificationBreakdown } from "@/types/admin/verification";
import { formatPct, pct } from "@/types/admin/verification";

export type BreakdownTone = "brand" | "positive" | "warning";

export interface BreakdownRow {
  key?: string;
  label: string;
  value: number | string;
  pct?: number;
  muted?: boolean;
  hint?: string;
  tooltip?: string;
  tone?: BreakdownTone;
  onClick?: () => void;
  active?: boolean;
}

const BAR_TONE: Record<BreakdownTone, string> = {
  brand: "bg-brand-bg-primary",
  positive: "bg-emerald-500",
  warning: "bg-amber-500",
};

// Spans, not divs, so it stays valid inside a row <button>.
export function PctBar({
  value,
  tone = "brand",
  muted = false,
  className = "",
}: {
  value: number;
  tone?: BreakdownTone;
  muted?: boolean;
  className?: string;
}) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <span
      className={`block h-1 w-full overflow-hidden rounded-full bg-dashboard-border/60 ${className}`}
      aria-hidden
    >
      <span
        className={`block h-full rounded-full transition-all duration-500 ${
          muted ? "bg-dashboard-muted/35" : BAR_TONE[tone]
        }`}
        style={{ width: `${width}%` }}
      />
    </span>
  );
}

function RowContent({ row }: { row: BreakdownRow }) {
  const value =
    typeof row.value === "number" ? row.value.toLocaleString() : row.value;
  return (
    <>
      <span className="flex items-baseline justify-between gap-2 min-w-0">
        <span
          className={`min-w-0 truncate ${
            row.muted ? "text-dashboard-muted/70" : "text-dashboard-muted"
          }`}
        >
          {row.label}
          {row.hint && (
            <span className="text-dashboard-muted/60"> · {row.hint}</span>
          )}
        </span>
        <span className="shrink-0 tabular-nums whitespace-nowrap">
          <span
            className={`font-semibold ${
              row.muted ? "text-dashboard-muted" : "text-dashboard-heading"
            }`}
          >
            {value}
          </span>
          {row.pct !== undefined && (
            <span className="ml-1 text-dashboard-muted">
              {formatPct(row.pct)}
            </span>
          )}
        </span>
      </span>
      {row.pct !== undefined && (
        <PctBar
          value={row.pct}
          tone={row.tone}
          muted={row.muted}
          className="mt-1"
        />
      )}
    </>
  );
}

export function BreakdownList({
  rows,
  className = "",
}: {
  rows: BreakdownRow[];
  className?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <ul className={`space-y-1.5 text-[11px] leading-tight ${className}`}>
      {rows.map((row) => (
        <li key={row.key ?? row.label} title={row.tooltip ?? row.hint}>
          {row.onClick ? (
            <button
              type="button"
              onClick={row.onClick}
              aria-pressed={row.active ?? false}
              className={`block w-full text-left rounded-md px-1.5 py-1 -mx-1.5 transition-colors ${
                row.active
                  ? "bg-brand-bg-primary/10 ring-1 ring-brand-bg-primary/30"
                  : "hover:bg-dashboard-bg"
              }`}
            >
              <RowContent row={row} />
            </button>
          ) : (
            <div className="py-0.5">
              <RowContent row={row} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export type VerificationRowKey =
  | "phone_verified"
  | "email_verified"
  | "phone_and_bvn"
  | "unverified";

export function verificationBreakdownRows(
  v: VerificationBreakdown,
  opts: {
    onSelect?: (key: VerificationRowKey) => void;
    activeKey?: VerificationRowKey | null;
  } = {},
): BreakdownRow[] {
  const { onSelect, activeKey = null } = opts;
  const row = (
    key: VerificationRowKey,
    label: string,
    value: number,
    extra: Partial<BreakdownRow> = {},
  ): BreakdownRow => ({
    key,
    label,
    value,
    pct: pct(value, v.total),
    onClick: onSelect ? () => onSelect(key) : undefined,
    active: activeKey === key,
    ...extra,
  });
  return [
    row("phone_verified", "Phone verified", v.phone_verified, { tone: "positive" }),
    row("email_verified", "Email verified", v.email_verified, {
      muted: true,
      hint: "set at sign-up",
      tooltip: "Both sign-up flows mark email verified, so this is close to 100% by design",
    }),
    row("phone_and_bvn", "Phone + BVN", v.phone_and_bvn, {
      tone: "positive",
      tooltip: "Both phone and BVN verified",
    }),
    row("unverified", "Unverified", v.unverified, {
      tone: "warning",
      tooltip: "Neither phone nor BVN verified",
    }),
  ];
}
