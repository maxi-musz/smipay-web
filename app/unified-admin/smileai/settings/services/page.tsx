"use client";

import { useCallback, useEffect, useState } from "react";
import { PlugZap, RefreshCw, Save } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import { useAdminSmileAiCache } from "@/hooks/admin/useAdminSmileAiCache";
import type { SmileAiServiceItem } from "@/types/admin/smileai";
import {
  Card,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  formatDateTime,
} from "../../_components/Helpers";

export default function ServicesSettingsPage() {
  const [items, setItems] = useState<SmileAiServiceItem[] | null>(null);
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
          "smileai.settings.services",
          () => smileAiApi.settings.getServices(),
          { force },
        );
        setItems(data.items);
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

  const toggle = (id: string) => {
    setItems((prev) =>
      prev
        ? prev.map((it) =>
            it.id === id ? { ...it, available: !it.available } : it,
          )
        : prev,
    );
  };

  const save = async () => {
    if (!items) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const availability = Object.fromEntries(
        items.map((it) => [it.id, it.available]),
      );
      const res = await smileAiApi.settings.setServices({ availability });
      setItems(res.items);
      setUpdatedAt(res.updatedAt);
      setSaved(true);
      invalidate("smileai.settings.services");
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const availableCount = items?.filter((i) => i.available).length ?? 0;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Service availability"
        description="Toggle which services Smiley may tell users are live — this overrides the knowledge base"
        icon={<PlugZap className="h-5 w-5" />}
        actions={
          <>
            <button
              type="button"
              onClick={save}
              disabled={saving || !items}
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
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </>
        }
      />

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
        <ErrorBanner error={error} onRetry={refresh} />

        {items === null ? (
          <Card className="p-4 space-y-2">
            <Skeleton height="2rem" />
            <Skeleton height="2rem" />
            <Skeleton height="2rem" />
          </Card>
        ) : (
          <>
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
                    Services
                  </h3>
                  <p className="mt-1 text-[11px] text-dashboard-muted">
                    Turn a service OFF and Smiley treats it as “coming soon” — it
                    won’t list it as available or explain how to use it, even if
                    the knowledge base describes it. Changes take effect on the
                    next message; no redeploy needed.
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-medium text-dashboard-muted">
                  {availableCount}/{items.length} live
                </span>
              </div>

              <div className="mt-3 divide-y divide-dashboard-border/50">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-dashboard-heading">
                        {it.label}
                      </p>
                      <p className="truncate text-[11px] text-dashboard-muted">
                        {it.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={it.available}
                      aria-label={`${it.label} — ${it.available ? "available now" : "coming soon"}`}
                      onClick={() => toggle(it.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                        it.available ? "bg-emerald-500" : "bg-dashboard-border"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          it.available ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {updatedAt ? (
              <p className="text-[11px] text-dashboard-muted">
                Last updated {formatDateTime(updatedAt)}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
