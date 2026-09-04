"use client";

import { RotateCcw, Infinity as InfinityIcon } from "lucide-react";
import type {
  RateLimitBounds,
  RateLimitGroup,
  RateLimitRule,
  RateLimitValues,
} from "@/types/admin/rate-limits";

/** The editable slice of a rule. */
export interface RuleState extends RateLimitValues {
  enabled: boolean;
}

export const toRuleState = (r: RateLimitRule): RuleState => ({
  enabled: r.enabled,
  ip_limit: r.ip_limit,
  device_limit: r.device_limit,
  phone_limit: r.phone_limit,
  window_seconds: r.window_seconds,
});

export const ruleEqual = (a?: RuleState, b?: RuleState) =>
  !!a &&
  !!b &&
  a.enabled === b.enabled &&
  a.ip_limit === b.ip_limit &&
  a.device_limit === b.device_limit &&
  a.phone_limit === b.phone_limit &&
  a.window_seconds === b.window_seconds;

const WINDOW_PRESETS = [
  { seconds: 60, label: "1 min" },
  { seconds: 180, label: "3 min" },
  { seconds: 900, label: "15 min" },
  { seconds: 3600, label: "1 hour" },
];

export function humanWindow(seconds: number): string {
  if (seconds % 3600 === 0 && seconds >= 3600) {
    const h = seconds / 3600;
    return `${h} hour${h === 1 ? "" : "s"}`;
  }
  if (seconds % 60 === 0 && seconds >= 60) {
    const m = seconds / 60;
    return `${m} min`;
  }
  return `${seconds}s`;
}

/** Message key for one endpoint's override. Mirrors the backend helper. */
export const ruleMessageKey = (ruleKey: string) => `rate_limit.rule.${ruleKey}`;

export function RateLimitsPanel({
  group,
  draft,
  saved,
  pendingResets,
  bounds,
  messageDraft,
  messageSaved,
  messageMaxLength,
  onChange,
  onToggleReset,
  onMessageChange,
}: {
  group: RateLimitGroup;
  draft: Record<string, RuleState>;
  saved: Record<string, RuleState>;
  pendingResets: Set<string>;
  bounds: RateLimitBounds | null;
  messageDraft: Record<string, string>;
  messageSaved: Record<string, string>;
  messageMaxLength: number;
  onChange: (key: string, patch: Partial<RuleState>) => void;
  onToggleReset: (key: string) => void;
  onMessageChange: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-dashboard-muted px-0.5">
        {group.description} Each limit counts requests within the window, per
        dimension. The code&apos;s own values stay as the fallback — a limit only
        changes here once you save it.
      </p>

      {group.rules.map((rule) => (
        <RuleCard
          key={rule.key}
          rule={rule}
          state={draft[rule.key]}
          savedState={saved[rule.key]}
          resetPending={pendingResets.has(rule.key)}
          bounds={bounds}
          message={messageDraft[ruleMessageKey(rule.key)] ?? ""}
          savedMessage={messageSaved[ruleMessageKey(rule.key)] ?? ""}
          messageMaxLength={messageMaxLength}
          onChange={onChange}
          onToggleReset={onToggleReset}
          onMessageChange={onMessageChange}
        />
      ))}
    </div>
  );
}

function RuleCard({
  rule,
  state,
  savedState,
  resetPending,
  bounds,
  message,
  savedMessage,
  messageMaxLength,
  onChange,
  onToggleReset,
  onMessageChange,
}: {
  rule: RateLimitRule;
  state: RuleState | undefined;
  savedState: RuleState | undefined;
  resetPending: boolean;
  bounds: RateLimitBounds | null;
  message: string;
  savedMessage: string;
  messageMaxLength: number;
  onChange: (key: string, patch: Partial<RuleState>) => void;
  onToggleReset: (key: string) => void;
  onMessageChange: (key: string, value: string) => void;
}) {
  if (!state) return null;
  const messageChanged = message !== savedMessage;
  const changed =
    resetPending || !ruleEqual(state, savedState) || messageChanged;
  const matchesDefaults = ruleEqual(state, {
    enabled: true,
    ...rule.defaults,
  });

  return (
    <div
      className={`rounded-xl border bg-dashboard-surface p-4 sm:p-5 space-y-3 transition-colors ${
        state.enabled ? "border-dashboard-border/60" : "border-gray-200 bg-gray-50/50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-dashboard-heading">
              {rule.label}
            </p>
            {changed && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                {resetPending ? "Will reset" : "Changed"}
              </span>
            )}
            {!changed && rule.overridden && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                Custom
              </span>
            )}
          </div>
          <code className="text-[11px] text-dashboard-muted font-mono block mt-1 break-all">
            {rule.endpoint}
          </code>
          <p className="text-xs text-dashboard-muted mt-1 leading-relaxed">
            {rule.description}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <Switch
            on={state.enabled}
            onClick={() => onChange(rule.key, { enabled: !state.enabled })}
          />
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide ${
              state.enabled ? "text-emerald-600" : "text-gray-400"
            }`}
          >
            {state.enabled ? "On" : "Off"}
          </span>
        </div>
      </div>

      {state.enabled && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <LimitInput
              label="Per IP"
              value={state.ip_limit}
              bounds={bounds}
              onChange={(v) => onChange(rule.key, { ip_limit: v })}
            />
            <LimitInput
              label="Per device"
              value={state.device_limit}
              bounds={bounds}
              onChange={(v) => onChange(rule.key, { device_limit: v })}
            />
            <LimitInput
              label="Per phone"
              value={state.phone_limit}
              bounds={bounds}
              onChange={(v) => onChange(rule.key, { phone_limit: v })}
            />
            <div className="space-y-1">
              <label className="text-[11px] text-dashboard-muted block">
                Window
              </label>
              <input
                type="number"
                min={bounds?.window_seconds.min}
                max={bounds?.window_seconds.max}
                value={state.window_seconds}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  onChange(rule.key, {
                    window_seconds: Number.isFinite(n) ? n : 60,
                  });
                }}
                className="w-full text-sm text-right border border-dashboard-border/60 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <span className="text-[10px] text-dashboard-muted block text-right">
                {humanWindow(state.window_seconds)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-dashboard-muted">
            Blank means that dimension isn&apos;t checked. Code default:{" "}
            {describeDefaults(rule.defaults)}.
            {!matchesDefaults && rule.overridden && !resetPending && (
              <button
                type="button"
                onClick={() => onToggleReset(rule.key)}
                className="ml-1.5 inline-flex items-center gap-1 underline hover:text-dashboard-heading"
              >
                <RotateCcw className="h-3 w-3" />
                Reset to code default
              </button>
            )}
            {resetPending && (
              <button
                type="button"
                onClick={() => onToggleReset(rule.key)}
                className="ml-1.5 underline hover:text-dashboard-heading"
              >
                Cancel reset
              </button>
            )}
          </p>

          <div className="pt-2 border-t border-dashboard-border/40 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] text-dashboard-muted">
                Custom message for this endpoint{" "}
                <span className="italic">(optional)</span>
              </label>
              {message !== "" && (
                <button
                  type="button"
                  onClick={() => onMessageChange(ruleMessageKey(rule.key), "")}
                  className="text-[11px] text-dashboard-muted hover:text-dashboard-heading underline shrink-0"
                >
                  Use shared message
                </button>
              )}
            </div>
            <input
              type="text"
              value={message}
              maxLength={messageMaxLength}
              placeholder="Leave empty to use the shared message above"
              onChange={(e) =>
                onMessageChange(ruleMessageKey(rule.key), e.target.value)
              }
              className="w-full text-sm border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        </>
      )}
    </div>
  );
}

function describeDefaults(d: RateLimitValues): string {
  const parts: string[] = [];
  if (d.ip_limit != null) parts.push(`${d.ip_limit}/IP`);
  if (d.device_limit != null) parts.push(`${d.device_limit}/device`);
  if (d.phone_limit != null) parts.push(`${d.phone_limit}/phone`);
  if (parts.length === 0) return "no limits";
  return `${parts.join(", ")} per ${humanWindow(d.window_seconds)}`;
}

function LimitInput({
  label,
  value,
  bounds,
  onChange,
}: {
  label: string;
  value: number | null;
  bounds: RateLimitBounds | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-dashboard-muted block">{label}</label>
      <input
        type="number"
        min={bounds?.limit.min}
        max={bounds?.limit.max}
        value={value ?? ""}
        placeholder="—"
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(null);
          const n = Number(raw);
          onChange(Number.isFinite(n) ? n : null);
        }}
        className="w-full text-sm text-right border border-dashboard-border/60 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
      />
      <span className="text-[10px] text-dashboard-muted flex items-center justify-end gap-0.5 h-3">
        {value == null && (
          <>
            <InfinityIcon className="h-2.5 w-2.5" />
            unchecked
          </>
        )}
      </span>
    </div>
  );
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-emerald-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
