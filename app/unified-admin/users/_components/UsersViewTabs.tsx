"use client";

import { PhoneCall } from "lucide-react";
import {
  USER_VIEWS,
  userViewCounts,
  type UserOverview,
  type UserView,
} from "@/types/admin/users";
import { PctBar } from "@/app/unified-admin/_components/VerificationBreakdownList";
import { asVerificationBreakdown, formatPct, pct } from "@/types/admin/verification";

interface Props {
  overview: UserOverview | null;
  active: UserView | null;
  onChange: (view: UserView) => void;
  roleFiltered?: boolean;
  disabled?: boolean;
}

export function UsersViewTabs({
  overview,
  active,
  onChange,
  roleFiltered = false,
  disabled = false,
}: Props) {
  const counts = overview ? userViewCounts(overview) : {};
  const verification = asVerificationBreakdown(overview?.verification);
  const phonePct = verification ? pct(verification.phone_verified, verification.total) : 0;
  const activeView = USER_VIEWS.find((v) => v.key === active);

  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/40 overflow-hidden">
      <div
        role="tablist"
        aria-label="User views"
        className="flex overflow-x-auto border-b border-dashboard-border/40 [scrollbar-width:none]"
      >
        {USER_VIEWS.map(({ key, label, description }) => {
          const selected = key === active;
          const count = counts[key];
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              title={description}
              disabled={disabled}
              onClick={() => onChange(key)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 -mb-px transition-colors disabled:opacity-60 ${
                selected
                  ? "border-brand-bg-primary text-brand-bg-primary"
                  : "border-transparent text-dashboard-muted hover:text-dashboard-heading"
              }`}
            >
              {label}
              {count !== undefined && (
                <span
                  className={`tabular-nums rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    selected
                      ? "bg-brand-bg-primary/10 text-brand-bg-primary"
                      : "bg-dashboard-bg text-dashboard-muted"
                  }`}
                >
                  {count.toLocaleString()}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {verification && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <PhoneCall className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            <p className="text-xs text-dashboard-heading min-w-0">
              <span className="font-semibold tabular-nums">
                {verification.phone_verified.toLocaleString()}
              </span>{" "}
              of {verification.total.toLocaleString()} {roleFiltered ? "users" : "customers"} have
              verified a phone number
              <span className="text-dashboard-muted"> · {formatPct(phonePct)}</span>
            </p>
          </div>
          <PctBar value={phonePct} tone="positive" className="sm:max-w-[240px]" />
        </div>
      )}

      {activeView && (
        <p className="px-4 pb-3 -mt-1 text-[11px] text-dashboard-muted">
          {activeView.description}
          {active !== "all" && !roleFiltered ? " (staff excluded)" : ""}.
        </p>
      )}
    </div>
  );
}
