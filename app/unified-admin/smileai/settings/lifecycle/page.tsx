"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Eye, Pencil, RefreshCw, Save } from "lucide-react";
import { smileAiApi } from "@/services/admin/smileai-api";
import { useAdminSmileAiCache } from "@/hooks/admin/useAdminSmileAiCache";
import type { SmileAiLifecycle } from "@/types/admin/smileai";
import {
  Card,
  ErrorBanner,
  SectionHeader,
  Skeleton,
  formatDateTime,
} from "../../_components/Helpers";

export default function LifecycleSettingsPage() {
  const [lifecycle, setLifecycle] = useState<SmileAiLifecycle | null>(null);
  const [defaults, setDefaults] = useState<SmileAiLifecycle | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const { run, invalidate } = useAdminSmileAiCache();

  const loadPreview = useCallback(async (config: SmileAiLifecycle) => {
    if (!config.send_email_on_nudge) {
      setPreviewHtml(null);
      setPreviewSubject(null);
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const data = await smileAiApi.settings.previewNudgeEmail({
        first_name: "Ada",
        close_after_nudge_minutes: config.close_after_nudge_minutes,
        subject: config.nudge_email_subject,
        use_branded: config.use_branded_nudge_email !== false,
        body_html: config.nudge_email_body_html,
      });
      setPreviewHtml(data.html);
      setPreviewSubject(data.subject);
    } catch (err) {
      setPreviewError((err as Error).message);
      setPreviewHtml(null);
      setPreviewSubject(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const load = useCallback(
    async (force = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await run(
          "smileai.settings.lifecycle",
          () => smileAiApi.settings.getLifecycle(),
          { force },
        );
        setLifecycle(data.value);
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

  useEffect(() => {
    if (lifecycle?.send_email_on_nudge) {
      const t = setTimeout(() => void loadPreview(lifecycle), 400);
      return () => clearTimeout(t);
    }
    setPreviewHtml(null);
    setPreviewSubject(null);
  }, [lifecycle, loadPreview]);

  const refresh = useCallback(() => {
    void load(true);
  }, [load]);

  const save = async () => {
    if (!lifecycle) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await smileAiApi.settings.setLifecycle(lifecycle);
      setUpdatedAt(res.updatedAt);
      setSaved(true);
      invalidate("smileai.settings.lifecycle");
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
        title="Conversation lifecycle"
        description="Idle nudges, auto-close, and stale session cleanup"
        icon={<Clock className="h-5 w-5" />}
        actions={
          <>
            <button
              type="button"
              onClick={save}
              disabled={saving || !lifecycle}
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

        {lifecycle === null ? (
          <Card className="p-4 space-y-2">
            <Skeleton height="2rem" />
            <Skeleton height="2rem" />
          </Card>
        ) : (
          <>
            <Card className="p-4 space-y-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={lifecycle.enabled}
                  onChange={(e) =>
                    setLifecycle({ ...lifecycle, enabled: e.target.checked })
                  }
                />
                <span>
                  <strong>Enable lifecycle automation</strong> — nudge idle
                  users and auto-close quiet sessions
                </span>
              </label>
              <NumberField
                label="Nudge after user idle (minutes)"
                value={lifecycle.nudge_after_minutes}
                defaultValue={defaults?.nudge_after_minutes}
                onChange={(v) =>
                  setLifecycle({ ...lifecycle, nudge_after_minutes: v })
                }
              />
              <NumberField
                label="Close after nudge with no reply (minutes)"
                value={lifecycle.close_after_nudge_minutes}
                defaultValue={defaults?.close_after_nudge_minutes}
                onChange={(v) =>
                  setLifecycle({
                    ...lifecycle,
                    close_after_nudge_minutes: v,
                  })
                }
              />
              <NumberField
                label="Silent close — idle longer than (minutes), no email"
                value={lifecycle.silent_close_after_minutes ?? 60}
                defaultValue={defaults?.silent_close_after_minutes ?? 60}
                onChange={(v) =>
                  setLifecycle({
                    ...lifecycle,
                    silent_close_after_minutes: v,
                  })
                }
              />
              <p className="text-[11px] text-dashboard-muted -mt-1">
                Open chats idle past this window are closed quietly (including
                pre-lifecycle backlog). No nudge email — users can still rate
                feedback. Max one nudge email per user per minute.
              </p>
              <NumberField
                label="Stale close — no activity for (days)"
                value={lifecycle.stale_close_days}
                defaultValue={defaults?.stale_close_days}
                onChange={(v) =>
                  setLifecycle({ ...lifecycle, stale_close_days: v })
                }
              />
              <label className="inline-flex items-center gap-2 text-sm pt-2">
                <input
                  type="checkbox"
                  checked={lifecycle.send_email_on_nudge}
                  onChange={(e) =>
                    setLifecycle({
                      ...lifecycle,
                      send_email_on_nudge: e.target.checked,
                    })
                  }
                />
                <span>Send email when nudging idle users</span>
              </label>
            </Card>

            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-dashboard-heading">
                In-chat nudge message
              </h3>
              <textarea
                rows={4}
                value={lifecycle.nudge_message}
                onChange={(e) =>
                  setLifecycle({ ...lifecycle, nudge_message: e.target.value })
                }
                className="w-full text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </Card>

            <Card className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-dashboard-heading">
                  Nudge email
                </h3>
                {lifecycle.send_email_on_nudge && (
                  <button
                    type="button"
                    onClick={() => void loadPreview(lifecycle)}
                    disabled={previewLoading}
                    className="inline-flex items-center gap-1.5 text-xs text-dashboard-muted hover:text-dashboard-heading"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Refresh preview
                  </button>
                )}
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={lifecycle.use_branded_nudge_email !== false}
                  onChange={(e) =>
                    setLifecycle({
                      ...lifecycle,
                      use_branded_nudge_email: e.target.checked,
                    })
                  }
                />
                <span>
                  Use SmiPay branded email template (same style as OTP and
                  support emails)
                </span>
              </label>
              <div>
                <label className="text-xs text-dashboard-muted block mb-1">
                  Subject line
                </label>
                <input
                  type="text"
                  value={lifecycle.nudge_email_subject}
                  onChange={(e) =>
                    setLifecycle({
                      ...lifecycle,
                      nudge_email_subject: e.target.value,
                    })
                  }
                  placeholder="Subject — {{first_name}} supported"
                  className="w-full text-sm border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>

              {lifecycle.use_branded_nudge_email === false ? (
                <>
                  <div>
                    <label className="text-xs text-dashboard-muted block mb-1">
                      Email body (HTML)
                    </label>
                    <textarea
                      rows={10}
                      value={lifecycle.nudge_email_body_html}
                      onChange={(e) =>
                        setLifecycle({
                          ...lifecycle,
                          nudge_email_body_html: e.target.value,
                        })
                      }
                      placeholder="Custom HTML body — use {{first_name}} and {{conversation_id}}"
                      className="w-full text-sm font-mono border border-dashboard-border/60 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                  <p className="text-[11px] text-dashboard-muted">
                    Variables: {"{{first_name}}"}, {"{{conversation_id}}"}
                  </p>
                </>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <p className="text-[11px] text-dashboard-muted">
                    Body uses the shared SmiPay email layout (logo, footer,
                    orange accent). Preview updates when you change close timing
                    or subject.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      let seed = lifecycle.nudge_email_body_html;
                      if (!seed && previewHtml) seed = previewHtml;
                      if (!seed) {
                        try {
                          const data =
                            await smileAiApi.settings.previewNudgeEmail({
                              first_name: "Ada",
                              close_after_nudge_minutes:
                                lifecycle.close_after_nudge_minutes,
                              use_branded: true,
                            });
                          seed = data.html;
                        } catch {
                          seed = "";
                        }
                      }
                      setLifecycle({
                        ...lifecycle,
                        use_branded_nudge_email: false,
                        nudge_email_body_html: seed,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-bg-primary hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Customize HTML body
                  </button>
                </div>
              )}

              {lifecycle.send_email_on_nudge && (
                <div className="pt-2 border-t border-dashboard-border/40 space-y-2">
                  <p className="text-xs font-semibold text-dashboard-heading flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Email preview
                    {previewSubject ? (
                      <span className="font-normal text-dashboard-muted">
                        — {previewSubject}
                      </span>
                    ) : null}
                  </p>
                  {previewLoading && (
                    <p className="text-[11px] text-dashboard-muted">
                      Loading preview…
                    </p>
                  )}
                  {previewError && (
                    <p className="text-[11px] text-rose-600">{previewError}</p>
                  )}
                  {previewHtml && !previewLoading && (
                    <div className="rounded-lg border border-dashboard-border/60 overflow-hidden bg-white">
                      <iframe
                        title="Nudge email preview"
                        srcDoc={previewHtml}
                        className="w-full min-h-[420px] border-0"
                        sandbox=""
                      />
                    </div>
                  )}
                </div>
              )}
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

function NumberField({
  label,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  value: number;
  defaultValue?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-dashboard-heading flex-1">{label}</label>
      <input
        type="number"
        min={1}
        step={1}
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
