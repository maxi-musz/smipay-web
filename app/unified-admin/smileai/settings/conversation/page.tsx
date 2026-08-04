"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle, RefreshCw, Save } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import { useAdminSmileAiCache } from "@/hooks/admin/useAdminSmileAiCache";
import type { SmileAiConversationBehaviour } from "@/types/admin/smileai";
import {
  Card,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  formatDateTime,
} from "../../_components/Helpers";

type Cfg = SmileAiConversationBehaviour;

export default function ConversationSettingsPage() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [defaults, setDefaults] = useState<Cfg | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { run, invalidate } = useAdminSmileAiCache();

  const load = useCallback(
    async (force = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await run(
          "smileai.settings.conversation",
          () => smileAiApi.settings.getConversation(),
          { force },
        );
        setCfg(data.value);
        setDefaults(data.defaults);
        setUpdatedAt(data.updatedAt);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [run],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => void load(true), [load]);

  const patch = (p: Partial<Cfg>) => setCfg((c) => (c ? { ...c, ...p } : c));

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await smileAiApi.settings.setConversation(cfg);
      setUpdatedAt(res.updatedAt);
      setSaved(true);
      invalidate("smileai.settings.conversation");
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const delayRangeInvalid =
    !!cfg &&
    cfg.reply_delay_enabled &&
    cfg.reply_delay_max_seconds < cfg.reply_delay_min_seconds;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Chat behaviour"
        description="How human Smiley feels — reply length & tone, pacing, and anti-misuse"
        icon={<MessageCircle className="h-5 w-5" />}
        actions={
          <>
            <button
              type="button"
              onClick={save}
              disabled={saving || !cfg || delayRangeInvalid}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Save className="h-3.5 w-3.5" />
              {saved ? "Saved!" : "Save"}
            </button>
            <button
              type="button"
              onClick={refresh}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </>
        }
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        <ErrorBanner error={error} onRetry={refresh} />

        {cfg === null ? (
          <Card className="p-4 space-y-2">
            <Skeleton height="2rem" />
            <Skeleton height="2rem" />
            <Skeleton height="2rem" />
          </Card>
        ) : (
          <>
            {/* ── Reply style ─────────────────────────────── */}
            <Group
              title="Reply style"
              hint="Stops Smiley writing 20–30 line walls of text. Enforced in the prompt on every reply."
            >
              <SelectField
                label="Length & tone"
                value={cfg.reply_style}
                options={[
                  { value: "concise", label: "Concise — 2–4 sentences (recommended)" },
                  { value: "balanced", label: "Balanced — a short paragraph" },
                  { value: "detailed", label: "Detailed — full explanations" },
                ]}
                onChange={(v) => patch({ reply_style: v as Cfg["reply_style"] })}
              />
              <SelectField
                label="Emoji"
                value={cfg.emoji_level}
                options={[
                  { value: "none", label: "None" },
                  { value: "light", label: "Light — at most one" },
                  { value: "expressive", label: "Expressive" },
                ]}
                onChange={(v) => patch({ emoji_level: v as Cfg["emoji_level"] })}
              />
              <ToggleField
                label="Answer short first, expand only if asked"
                checked={cfg.brevity_directive_enabled}
                onChange={(v) => patch({ brevity_directive_enabled: v })}
              />
              <NumberField
                label="Max reply length (tokens, 0 = model default)"
                value={cfg.max_reply_tokens}
                defaultValue={defaults?.max_reply_tokens}
                onChange={(v) => patch({ max_reply_tokens: v })}
              />
            </Group>

            {/* ── Reply pacing ────────────────────────────── */}
            <Group
              title="Reply pacing"
              hint="Hold each reply for a RANDOM time inside the range below, so answers never land at a fixed interval — it feels like a person, and a slow reply removes the reward of spamming. Range is in seconds (600 = 10 min, 3600 = 1 hr)."
            >
              <ToggleField
                label="Delay replies (don't answer instantly)"
                checked={cfg.reply_delay_enabled}
                onChange={(v) => patch({ reply_delay_enabled: v })}
              />
              {cfg.reply_delay_enabled && (
                <>
                  <NumberField
                    label="Minimum delay (seconds)"
                    value={cfg.reply_delay_min_seconds}
                    defaultValue={defaults?.reply_delay_min_seconds}
                    onChange={(v) => patch({ reply_delay_min_seconds: v })}
                  />
                  <NumberField
                    label="Maximum delay (seconds)"
                    value={cfg.reply_delay_max_seconds}
                    defaultValue={defaults?.reply_delay_max_seconds}
                    onChange={(v) => patch({ reply_delay_max_seconds: v })}
                  />
                  {delayRangeInvalid && (
                    <p className="text-[11px] text-rose-600">
                      Maximum must be greater than or equal to the minimum.
                    </p>
                  )}
                  <NumberField
                    label="Show 'typing…' for the last N seconds (0 = never)"
                    value={cfg.typing_indicator_lead_seconds}
                    defaultValue={defaults?.typing_indicator_lead_seconds}
                    onChange={(v) => patch({ typing_indicator_lead_seconds: v })}
                  />
                  <p className="text-[11px] text-dashboard-muted">
                    Each reply waits a random time between{" "}
                    <strong>{fmtDuration(cfg.reply_delay_min_seconds)}</strong> and{" "}
                    <strong>{fmtDuration(cfg.reply_delay_max_seconds)}</strong>.
                  </p>
                </>
              )}
            </Group>

            {/* ── Anti-misuse ─────────────────────────────── */}
            <Group
              title="Anti-misuse throttle"
              hint="Curbs rapid-fire and repeated / one-word spam. A throttled message gets the nudge below instead of a full answer — no AI call is spent. Set any value to 0 to turn that rule off."
            >
              <NumberField
                label="Minimum seconds between messages"
                value={cfg.min_seconds_between_messages}
                defaultValue={defaults?.min_seconds_between_messages}
                onChange={(v) => patch({ min_seconds_between_messages: v })}
              />
              <NumberField
                label="Duplicate-message cooldown (seconds)"
                value={cfg.duplicate_message_cooldown_seconds}
                defaultValue={defaults?.duplicate_message_cooldown_seconds}
                onChange={(v) =>
                  patch({ duplicate_message_cooldown_seconds: v })
                }
              />
              <NumberField
                label="Duplicate similarity threshold (0–1)"
                step={0.05}
                max={1}
                value={cfg.duplicate_similarity_threshold}
                defaultValue={defaults?.duplicate_similarity_threshold}
                onChange={(v) => patch({ duplicate_similarity_threshold: v })}
              />
              <NumberField
                label="Nudge one-word messages shorter than N chars (0 = off)"
                value={cfg.low_effort_min_chars}
                defaultValue={defaults?.low_effort_min_chars}
                onChange={(v) => patch({ low_effort_min_chars: v })}
              />
              <TextAreaField
                label="Throttle nudge message"
                value={cfg.throttle_message}
                onChange={(v) => patch({ throttle_message: v })}
              />
            </Group>

            {/* ── Daily cap ───────────────────────────────── */}
            <Group
              title="Daily cap (silent)"
              hint="Past this many messages a day, Smiley goes quiet — the user can still send, and their messages are accepted, but they get no reply until the count resets at midnight (UTC). Nothing tells them it's a limit; it reads like a busy human. 0 = no cap (defer to the Limits page)."
            >
              <NumberField
                label="Messages / user / day (0 = no cap)"
                value={cfg.daily_message_cap}
                defaultValue={defaults?.daily_message_cap}
                onChange={(v) => patch({ daily_message_cap: v })}
              />
            </Group>

            {updatedAt && (
              <p className="text-[11px] text-dashboard-muted">
                Last updated {formatDateTime(updatedAt)}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-dashboard-heading">{title}</p>
        <p className="text-[11px] text-dashboard-muted mt-0.5">{hint}</p>
      </div>
      <div className="space-y-3 pt-1">{children}</div>
    </Card>
  );
}

function NumberField({
  label,
  value,
  defaultValue,
  step = 1,
  max,
  onChange,
}: {
  label: string;
  value: number;
  defaultValue?: number;
  step?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-dashboard-heading flex-1">{label}</label>
      <input
        type="number"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 text-sm border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-orange-200"
      />
      {defaultValue !== undefined && (
        <span className="text-[11px] text-dashboard-muted w-20 text-right">
          default {defaultValue}
        </span>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-dashboard-heading flex-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-64 max-w-[60%] text-sm border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-200 bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-dashboard-heading">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-dashboard-heading">{label}</label>
      <textarea
        value={value}
        rows={2}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-200"
      />
    </div>
  );
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}
