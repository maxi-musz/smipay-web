"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Check,
} from "lucide-react";
import { adminApiDocsApi, type ApiDocsConfig } from "@/services/admin/api-docs-api";

const DOCS_URL = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/docs`;

export default function ApiDocsSettingsPage() {
  const [config, setConfig] = useState<ApiDocsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    adminApiDocsApi
      .get()
      .then(setConfig)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async () => {
    if (!config) return;
    const next = !config.is_enabled;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await adminApiDocsApi.setEnabled(next);
      setConfig(updated);
      setSuccess(
        updated.is_enabled
          ? "API docs are now ON and reachable."
          : "API docs are now OFF.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const enabled = config?.is_enabled ?? false;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-dashboard-heading">
              API Documentation
            </h1>
            <p className="text-xs text-dashboard-muted">
              Turn the OpenAPI/Swagger docs page on or off — takes effect
              immediately, no redeploy
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 max-w-2xl space-y-4">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-brand-bg-primary" />
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                <Check className="h-4 w-4" />
                {success}
              </div>
            )}

            <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-dashboard-heading">
                    Enable API documentation
                  </h2>
                  <p className="mt-1 text-xs text-dashboard-muted">
                    When on, the Swagger docs are served at{" "}
                    <code className="text-dashboard-heading">/api/v1/docs</code>.
                    When off, that route returns 404.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={toggle}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                    enabled ? "bg-brand-bg-primary" : "bg-dashboard-border"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    enabled
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-dashboard-bg text-dashboard-muted border border-dashboard-border/60"
                  }`}
                >
                  {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                  {enabled ? "ON" : "OFF"}
                </span>
                {enabled && (
                  <a
                    href={DOCS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-brand-bg-primary hover:underline"
                  >
                    Open docs <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                While enabled, the docs page is reachable by anyone with the link
                (it is not behind admin login). Turn it back off once you are
                done sharing it.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
