"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Save, Sliders } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import { useAdminSmileAiCache } from "@/hooks/admin/useAdminSmileAiCache";
import type { SmileAiLimits } from "@/types/admin/smileai";
import {
  Card,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  formatDateTime,
} from "../../_components/Helpers";

export default function LimitsSettingsPage() {
  const [limits, setLimits] = useState<SmileAiLimits | null>(null);
  const [defaults, setDefaults] = useState<SmileAiLimits | null>(null);
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
          "smileai.settings.limits",
          () => smileAiApi.settings.getLimits(),
          { force },
        );
        setLimits(data.value);
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

  const refresh = useCallback(() => {
    void load(true);
  }, [load]);

  const save = async () => {
    if (!limits) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await smileAiApi.settings.setLimits(limits);
      setUpdatedAt(res.updatedAt);
      setSaved(true);
      invalidate("smileai.settings.limits");
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Cost & rate limits"
        description="Per-turn, per-conversation, per-user-day, and global daily caps"
        icon={<Sliders className="h-5 w-5" />}
        actions={
          <>
            <button
              type="button"
              onClick={save}
              disabled={saving || !limits}
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

        {limits?.emergency_switch_off && (
          <Card className="p-3 border-rose-200 bg-rose-50">
            <p className="text-xs text-rose-700 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <strong>Emergency switch is ON.</strong> The engine refuses all new
              turns until this is unchecked.
            </p>
          </Card>
        )}

        {limits === null ? (
          <Card className="p-4 space-y-2">
            <Skeleton height="2rem" />
            <Skeleton height="2rem" />
          </Card>
        ) : (
          <Card className="p-4 space-y-3">
            <NumberField
              label="Per-user requests / minute"
              value={limits.per_user_per_minute}
              defaultValue={defaults?.per_user_per_minute}
              onChange={(v) => setLimits({ ...limits, per_user_per_minute: v })}
            />
            <NumberField
              label="Per-conversation max messages"
              value={limits.per_conversation_max_messages}
              defaultValue={defaults?.per_conversation_max_messages}
              onChange={(v) =>
                setLimits({ ...limits, per_conversation_max_messages: v })
              }
            />
            <NumberField
              label="Per-user messages / day"
              value={limits.per_user_per_day_messages}
              defaultValue={defaults?.per_user_per_day_messages}
              onChange={(v) =>
                setLimits({ ...limits, per_user_per_day_messages: v })
              }
            />
            <NumberField
              label="Per-turn max tokens"
              value={limits.per_turn_max_tokens}
              defaultValue={defaults?.per_turn_max_tokens}
              onChange={(v) => setLimits({ ...limits, per_turn_max_tokens: v })}
            />
            <NumberField
              label="Per-conversation max cost ($)"
              step={0.01}
              value={limits.per_conversation_max_cost_usd}
              defaultValue={defaults?.per_conversation_max_cost_usd}
              onChange={(v) =>
                setLimits({ ...limits, per_conversation_max_cost_usd: v })
              }
            />
            <NumberField
              label="Per-user cost / day ($)"
              step={0.01}
              value={limits.per_user_per_day_cost_usd}
              defaultValue={defaults?.per_user_per_day_cost_usd}
              onChange={(v) =>
                setLimits({ ...limits, per_user_per_day_cost_usd: v })
              }
            />
            <NumberField
              label="Global daily cost ($)"
              step={0.01}
              value={limits.global_daily_cost_usd}
              defaultValue={defaults?.global_daily_cost_usd}
              onChange={(v) =>
                setLimits({ ...limits, global_daily_cost_usd: v })
              }
            />
            <div className="pt-3 border-t border-dashboard-border/40">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={limits.emergency_switch_off}
                  onChange={(e) =>
                    setLimits({
                      ...limits,
                      emergency_switch_off: e.target.checked,
                    })
                  }
                />
                <span>
                  <strong className="text-rose-700">Emergency switch:</strong>{" "}
                  turn the assistant OFF for everyone
                </span>
              </label>
            </div>
            {updatedAt && (
              <p className="text-[11px] text-dashboard-muted pt-2 border-t border-dashboard-border/40">
                Last updated {formatDateTime(updatedAt)}
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  defaultValue,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  defaultValue?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-dashboard-heading flex-1">{label}</label>
      <input
        type="number"
        min={0}
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
