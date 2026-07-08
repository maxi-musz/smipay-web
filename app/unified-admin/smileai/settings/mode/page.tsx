"use client";

import { useCallback, useEffect, useState } from "react";
import { Power, RefreshCw, Save } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import {
  Card,
  ErrorBanner,
  SectionHeader,
  Skeleton,
} from "../../_components/Helpers";

type EffectiveMode = "read_only" | "read_write" | "paused";

export default function ModeSettingsPage() {
  const [mode, setMode] = useState<{
    effective: EffectiveMode;
    admin_mode: "read_only" | "read_write";
    user_mode: "read_only" | "read_write";
    paused: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await smileAiApi.settings.getMode();
      setMode(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (next: "read_only" | "read_write") => {
    if (!mode) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await smileAiApi.settings.setMode(next);
      setMode(updated);
      setSaved(true);
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
        title="Read/Write mode"
        description="Force Smile into read-only mode for all users (overrides per-user choice)"
        icon={<Power className="h-5 w-5" />}
        actions={
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        <ErrorBanner error={error} onRetry={load} />

        {!mode ? (
          <Card className="p-4 space-y-2">
            <Skeleton height="2rem" />
          </Card>
        ) : (
          <>
            <Card className="p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                Global Smile mode
              </h3>
              <p className="text-sm text-dashboard-muted">
                When set to <b>read-only</b>, write actions (transfers, top-ups,
                changing PIN, etc.) are hidden from the LLM for every user.
                Users still see their personal toggle, but it is disabled with
                an &ldquo;Disabled by admin&rdquo; helper.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => void save("read_write")}
                  disabled={saving || mode.admin_mode === "read_write"}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg ${
                    mode.admin_mode === "read_write"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-brand-bg-primary text-white hover:opacity-90"
                  } disabled:opacity-60 transition-colors`}
                >
                  <Save className="h-3.5 w-3.5" />
                  {mode.admin_mode === "read_write" ? "Read/Write active" : "Allow writes"}
                </button>
                <button
                  type="button"
                  onClick={() => void save("read_only")}
                  disabled={saving || mode.admin_mode === "read_only"}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg ${
                    mode.admin_mode === "read_only"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-white border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg"
                  } disabled:opacity-60 transition-colors`}
                >
                  <Save className="h-3.5 w-3.5" />
                  {mode.admin_mode === "read_only" ? "Read-only active" : "Force read-only"}
                </button>
              </div>
              {saved && (
                <p className="text-[11px] text-emerald-700">Saved.</p>
              )}
            </Card>

            <Card className="p-4 space-y-1.5 text-xs text-dashboard-muted">
              <p>
                Effective mode for a logged-out preview:{" "}
                <b className="text-dashboard-heading">{mode.effective}</b>
              </p>
              <p>
                Admin mode: <b>{mode.admin_mode}</b>
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
