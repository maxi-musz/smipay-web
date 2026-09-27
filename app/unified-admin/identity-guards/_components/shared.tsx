"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Info,
  Mail,
  Smartphone,
  UserRound,
  X,
} from "lucide-react";
import {
  GUARD_MODES,
  type GuardField,
  type GuardFieldInfo,
  type GuardMode,
  type GuardSurfaceInfo,
  type GuardVerdict,
  type IdentityGuardConfigResponse,
  type IdentityGuardRule,
  type ParamDescriptor,
  type RuleAction,
  type SurfaceMode,
} from "@/types/admin/identity-guards";

export interface GuardPerms {
  canWrite: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  locked: boolean;
}

export const FIELD_META: Record<
  GuardField,
  {
    label: string;
    noun: string;
    icon: LucideIcon;
    placeholder: string;
    batchPlaceholder: string;
    floor: string;
  }
> = {
  phone: {
    noun: "phone",
    label: "Phone",
    icon: Smartphone,
    placeholder: "0814 669 4787",
    batchPlaceholder: "08146694787\n+234 803 000 0000\n0700 123 4567",
    floor: "A real Nigerian mobile (070/071/080/081/090/091 + 8 digits), no letters.",
  },
  email: {
    noun: "email",
    label: "Email",
    icon: Mail,
    placeholder: "ada.obi@gmail.com",
    batchPlaceholder: "ada.obi@gmail.com\nkoxuxe2371@temp-mail.xyz\nfinance@company.com.ng",
    floor: "Valid syntax, at most 254 characters, local part at most 64.",
  },
  name: {
    noun: "name",
    label: "Names",
    icon: UserRound,
    placeholder: "Chiamaka",
    batchPlaceholder: "Chiamaka Ngozi Okafor\nAdebayo Ogunleye\nasdf qwerty",
    floor: "Each part has at least one letter.",
  },
  bvn: {
    noun: "BVN",
    label: "BVN",
    icon: Fingerprint,
    placeholder: "22123456789",
    batchPlaceholder: "22123456789\n08146694787\n12345678901",
    floor: "Exactly 11 digits.",
  },
};

export function fieldInfo(
  fields: GuardFieldInfo[] | undefined,
  field: GuardField,
): { label: string; description: string; floor: string } {
  const fromApi = fields?.find((f) => f.key === field);
  return {
    label: fromApi?.label || FIELD_META[field].label,
    description: fromApi?.description ?? "",
    floor: fromApi?.floor || FIELD_META[field].floor,
  };
}

export const MODE_META: Record<
  GuardMode,
  { label: string; help: string; active: string; badge: string; dot: string }
> = {
  off: {
    label: "Off",
    help: "Rules don't run. The floor still applies.",
    active: "bg-slate-600 text-white shadow-sm",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
  monitor: {
    label: "Monitor",
    help: "Block rules only log “would block”. Nobody is stopped by a rule.",
    active: "bg-blue-600 text-white shadow-sm",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  enforce: {
    label: "Enforce",
    help: "Block rules stop the request before any provider is paid.",
    active: "bg-emerald-600 text-white shadow-sm",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

export function modeOf(
  config: Pick<IdentityGuardConfigResponse, "modes" | "default_modes">,
  field: GuardField,
): GuardMode {
  return config.modes?.[field] ?? config.default_modes?.[field] ?? "enforce";
}

export function effectiveSurfaceMode(
  surfaceMode: SurfaceMode,
  fieldMode: GuardMode,
): GuardMode {
  if (fieldMode === "off") return "off";
  return surfaceMode === "inherit" ? fieldMode : surfaceMode;
}

export function surfaceLabel(
  surfaces: GuardSurfaceInfo[] | undefined,
  key: string,
): string {
  const label = surfaces?.find((s) => s.key === key)?.label;
  if (label) return label;
  const words = key.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export const VERDICT_META: Record<
  GuardVerdict,
  { label: string; className: string }
> = {
  pass: { label: "Pass", className: "bg-emerald-100 text-emerald-700" },
  flag: { label: "Flag", className: "bg-amber-100 text-amber-800" },
  would_block: { label: "Would block", className: "bg-violet-100 text-violet-700" },
  block: { label: "Block", className: "bg-red-100 text-red-700" },
};

export const SKIP_LABEL: Record<string, string> = {
  disabled: "Rule is disabled",
  mode_off: "Field is Off",
  sandbox: "Skipped — BVN sandbox",
  domain_allowed: "Skipped — domain is on the ALLOW list",
  dns_not_run: "Needs DNS — tick “Check DNS/MX”",
  no_data: "No data to compare against",
  error: "Rule errored (counts as pass)",
  timeout: "Pattern timed out (counts as pass)",
};

export const PART_LABEL: Record<string, string> = {
  first_name: "First",
  middle_name: "Middle",
  last_name: "Last",
  full_name: "Full name",
};

export const fmtDateTime = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

export const fmtNumber = (n: number | null | undefined): string =>
  typeof n === "number" && Number.isFinite(n) ? n.toLocaleString() : "0";

export const pct = (part: number, whole: number): string =>
  whole > 0 ? `${((part / whole) * 100).toFixed(part === whole || part === 0 ? 0 : 1)}%` : "—";

export const errorMessage = (e: unknown, fallback: string): string =>
  e instanceof Error && e.message ? e.message : fallback;

export function rulesFor(
  rules: IdentityGuardRule[],
  field: GuardField,
): IdentityGuardRule[] {
  return rules
    .filter((r) => r.field === field)
    .sort(
      (a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label),
    );
}

export function isRuleRunning(rule: IdentityGuardRule): boolean {
  return rule.enabled && !rule.problem;
}

export function summarizeParams(
  params: Record<string, unknown>,
  descriptors: ParamDescriptor[] | undefined,
): string[] {
  const labelOf = (key: string) =>
    descriptors?.find((d) => d.key === key)?.label ?? key.replace(/_/g, " ");
  const out: string[] = [];
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === null || value === undefined || value === "") continue;
    const label = labelOf(key);
    if (Array.isArray(value)) {
      out.push(
        value.length <= 3 && value.every((v) => String(v).length <= 12)
          ? `${label}: ${value.map(String).join(", ") || "none"}`
          : `${label}: ${value.length}`,
      );
    } else if (typeof value === "boolean") {
      out.push(`${label}: ${value ? "yes" : "no"}`);
    } else if (typeof value === "number" || typeof value === "string") {
      const text = String(value);
      out.push(`${label}: ${text.length > 28 ? `${text.slice(0, 27)}…` : text}`);
    } else {
      out.push(`${label}: …`);
    }
  }
  return out;
}

export function VerdictBadge({ verdict }: { verdict: GuardVerdict }) {
  const meta = VERDICT_META[verdict] ?? VERDICT_META.pass;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

export function ActionBadge({ action }: { action: RuleAction }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        action === "block"
          ? "bg-red-50 text-red-700 border border-red-200"
          : "bg-amber-50 text-amber-800 border border-amber-200"
      }`}
    >
      {action === "block" ? "Block" : "Flag"}
    </span>
  );
}

export function ModeBadge({ mode }: { mode: GuardMode }) {
  const meta = MODE_META[mode] ?? MODE_META.enforce;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.badge}`}
    >
      {meta.label}
    </span>
  );
}

const BANNER_TONES = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  warn: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  neutral: "border-dashboard-border/60 bg-dashboard-bg text-dashboard-muted",
} as const;

export function Banner({
  tone,
  icon: Icon = tone === "info" || tone === "neutral" ? Info : AlertTriangle,
  children,
  action,
  onDismiss,
}: {
  tone: keyof typeof BANNER_TONES;
  icon?: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${BANNER_TONES[tone]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function Switch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-brand-bg-primary" : "bg-dashboard-border"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

export function ModeControl({
  value,
  disabled,
  busy,
  defaultMode,
  onChange,
}: {
  value: GuardMode;
  disabled?: boolean;
  busy?: boolean;
  defaultMode?: GuardMode;
  onChange: (next: GuardMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Mode"
      className={`inline-flex rounded-lg border border-dashboard-border/60 bg-dashboard-bg p-0.5 ${
        busy ? "opacity-60" : ""
      }`}
    >
      {GUARD_MODES.map((m) => {
        const active = value === m;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled || busy}
            title={`${MODE_META[m].help}${defaultMode === m ? " (default)" : ""}`}
            onClick={() => !active && onChange(m)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
              active
                ? MODE_META[m].active
                : "text-dashboard-muted hover:text-dashboard-heading disabled:hover:text-dashboard-muted"
            }`}
          >
            {MODE_META[m].label}
          </button>
        );
      })}
    </div>
  );
}

export const fieldClass =
  "rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-2.5 py-2 text-sm text-dashboard-heading placeholder:text-dashboard-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 disabled:opacity-50";

export const inputClass = `w-full ${fieldClass}`;

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-brand-bg-primary px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-dashboard-border/60 px-3 py-2 text-xs font-medium text-dashboard-heading transition-colors hover:bg-dashboard-bg disabled:cursor-not-allowed disabled:opacity-50";

export function Pagination({
  page,
  totalPages,
  disabled,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return (
      <span className="text-xs text-dashboard-muted">
        Page {page} of {Math.max(totalPages, 1)}
      </span>
    );
  }

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page <= 1}
        className="rounded-lg border border-dashboard-border/60 p-1.5 text-dashboard-muted transition-colors hover:text-dashboard-heading disabled:opacity-30"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="px-1 text-xs text-dashboard-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            disabled={disabled}
            className={`h-7 min-w-[28px] rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${
              p === page
                ? "bg-brand-bg-primary text-white"
                : "text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= totalPages}
        className="rounded-lg border border-dashboard-border/60 p-1.5 text-dashboard-muted transition-colors hover:text-dashboard-heading disabled:opacity-30"
        aria-label="Next page"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
