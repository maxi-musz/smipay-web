"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Save, ShieldAlert, X } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import { useAdminSmileAiCache } from "@/hooks/admin/useAdminSmileAiCache";
import type { SmileAiSafety } from "@/types/admin/smileai";
import {
  Card,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  formatDateTime,
} from "../../_components/Helpers";

export default function SafetySettingsPage() {
  const [safety, setSafety] = useState<SmileAiSafety | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newPattern, setNewPattern] = useState("");
  const { run, invalidate } = useAdminSmileAiCache();

  const load = useCallback(
    async (force = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await run(
          "smileai.settings.safety",
          () => smileAiApi.settings.getSafety(),
          { force },
        );
        setSafety(data.value);
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
    if (!safety) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await smileAiApi.settings.setSafety(safety);
      setUpdatedAt(res.updatedAt);
      setSaved(true);
      invalidate("smileai.settings.safety");
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addPattern = () => {
    if (!safety || !newPattern.trim()) return;
    try {
      new RegExp(newPattern);
    } catch (err) {
      setError(`Invalid regex: ${(err as Error).message}`);
      return;
    }
    setSafety({
      ...safety,
      never_disclose_patterns: [
        ...safety.never_disclose_patterns,
        newPattern.trim(),
      ],
    });
    setNewPattern("");
  };

  const removePattern = (idx: number) => {
    if (!safety) return;
    setSafety({
      ...safety,
      never_disclose_patterns: safety.never_disclose_patterns.filter(
        (_, i) => i !== idx,
      ),
    });
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Safety settings"
        description="Never-disclose regex patterns, refusal copy, persona policy"
        icon={<ShieldAlert className="h-5 w-5" />}
        actions={
          <>
            <button
              type="button"
              onClick={save}
              disabled={saving || !safety}
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

        {safety === null ? (
          <Card className="p-4 space-y-2">
            <Skeleton height="2rem" />
          </Card>
        ) : (
          <>
            <Card className="p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                Never-disclose patterns
              </h3>
              <p className="text-[11px] text-dashboard-muted">
                Regex patterns the engine refuses to repeat back. Add at least
                patterns for PIN, OTP, password, card number, BVN, NIN.
              </p>
              <div className="space-y-1.5">
                {safety.never_disclose_patterns.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-dashboard-bg rounded-lg px-2.5 py-1.5"
                  >
                    <code className="text-xs font-mono text-dashboard-heading flex-1 break-all">
                      {p}
                    </code>
                    <button
                      type="button"
                      onClick={() => removePattern(i)}
                      className="text-dashboard-muted hover:text-rose-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPattern}
                  onChange={(e) => setNewPattern(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPattern()}
                  placeholder="(?i)\\bcvv\\b"
                  className="flex-1 text-xs border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                <button
                  type="button"
                  onClick={addPattern}
                  disabled={!newPattern.trim()}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
            </Card>

            <Card className="p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                Refusal copy
              </h3>
              <p className="text-[11px] text-dashboard-muted">
                Shown to users when a request is denied for safety reasons.
              </p>
              <textarea
                value={safety.refusal_copy}
                onChange={(e) =>
                  setSafety({ ...safety, refusal_copy: e.target.value })
                }
                rows={3}
                className="w-full text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </Card>

            <Card className="p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                Persona policy bullets
              </h3>
              <p className="text-[11px] text-dashboard-muted">
                Appended to every persona&apos;s system prompt by the engine.
              </p>
              <textarea
                value={safety.persona_policy.join("\n")}
                onChange={(e) =>
                  setSafety({
                    ...safety,
                    persona_policy: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                rows={6}
                className="w-full text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </Card>

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
