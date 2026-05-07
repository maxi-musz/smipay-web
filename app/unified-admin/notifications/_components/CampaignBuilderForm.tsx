"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Eye, Send, CalendarClock } from "lucide-react";
import { adminNotificationsApi } from "@/services/admin/notifications-api";
import type {
  NotificationCampaignCreatePayload,
  NotificationTargetFilters,
  NotificationTargetType,
} from "@/types/admin/notifications";

interface CampaignBuilderFormProps {
  onCreated: (campaignId: string) => void;
  /** Pre-fill from an existing campaign ("Send again" from list). */
  cloneSourceCampaignId?: string;
}

function asTargetFilters(value: unknown): NotificationTargetFilters {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as NotificationTargetFilters) };
  }
  return {};
}

const DEFAULT_MARKDOWN = `# Hi {{first_name}}!

We have an important update for your account.

- This message supports **Markdown**
- You can personalize with variables

Thanks for using **SmiPay**.`;

function toLocalDateTimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const tzOffset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

function fromLocalDateTimeInput(input: string): string | null {
  if (!input) return null;
  return new Date(input).toISOString();
}

export function CampaignBuilderForm({
  onCreated,
  cloneSourceCampaignId,
}: CampaignBuilderFormProps) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState(() =>
    cloneSourceCampaignId ? "" : DEFAULT_MARKDOWN,
  );
  const [targetType, setTargetType] = useState<NotificationTargetType>("all");
  const [targetFilters, setTargetFilters] = useState<NotificationTargetFilters>({});
  const [targetEmailsRaw, setTargetEmailsRaw] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledForLocal, setScheduledForLocal] = useState(
    toLocalDateTimeInput(
      new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    ),
  );
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<{
    count: number;
    sample: string[];
  } | null>(null);
  const [cloneLoading, setCloneLoading] = useState(!!cloneSourceCampaignId);
  const [cloneError, setCloneError] = useState<string | null>(null);

  useEffect(() => {
    if (!cloneSourceCampaignId) {
      setCloneLoading(false);
      setCloneError(null);
      return;
    }

    let cancelled = false;
    setCloneLoading(true);
    setCloneError(null);

    void (async () => {
      try {
        const res = await adminNotificationsApi.getCampaign(cloneSourceCampaignId);
        const c = res.data;
        if (cancelled || !c) return;

        setTitle(c.title ?? "");
        setSubject(c.subject ?? "");
        setContentMarkdown(
          c.content_markdown?.trim() ? c.content_markdown : DEFAULT_MARKDOWN,
        );
        setTargetType(c.target_type);
        setTargetFilters(asTargetFilters(c.target_filters));
        setPreviewResult(null);

        const emails = c.target_emails;
        setTargetEmailsRaw(
          Array.isArray(emails) && emails.length > 0 ? emails.join(",\n") : "",
        );

        const alreadySent =
          c.status === "sent" || c.status === "failed" || c.status === "cancelled";
        if (alreadySent) {
          setScheduleEnabled(false);
        } else if (c.scheduled_for) {
          setScheduleEnabled(true);
          setScheduledForLocal(toLocalDateTimeInput(c.scheduled_for));
        }
      } catch {
        if (!cancelled) {
          setCloneError(
            "Could not load that campaign. You can still compose a new email below.",
          );
        }
      } finally {
        if (!cancelled) setCloneLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cloneSourceCampaignId]);

  const normalizedEmails = useMemo(() => {
    return targetEmailsRaw
      .split(/[,\n;]/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }, [targetEmailsRaw]);

  const personalizedPreview = useMemo(() => {
    return contentMarkdown
      .replaceAll("{{first_name}}", "Customer")
      .replaceAll("{{last_name}}", "User")
      .replaceAll("{{email}}", "customer@example.com");
  }, [contentMarkdown]);

  const payload = useMemo<NotificationCampaignCreatePayload>(() => {
    const base: NotificationCampaignCreatePayload = {
      title: title.trim(),
      subject: subject.trim(),
      content_markdown: contentMarkdown,
      target_type: targetType,
      target_filters: targetType === "filtered" ? targetFilters : null,
      target_emails: targetType === "individual" ? normalizedEmails : null,
      scheduled_for: scheduleEnabled ? fromLocalDateTimeInput(scheduledForLocal) : null,
    };
    return base;
  }, [
    title,
    subject,
    contentMarkdown,
    targetType,
    targetFilters,
    normalizedEmails,
    scheduleEnabled,
    scheduledForLocal,
  ]);

  const validate = () => {
    if (!payload.title) return "Campaign title is required";
    if (!payload.subject) return "Email subject is required";
    if (!payload.content_markdown.trim()) return "Email content is required";
    if (payload.target_type === "individual" && (!payload.target_emails || payload.target_emails.length === 0)) {
      return "Provide at least one recipient email";
    }
    if (payload.target_type === "filtered" && !payload.target_filters) {
      return "Choose at least one filter for filtered audience";
    }
    if (payload.target_type === "filtered" && Object.keys(payload.target_filters || {}).length === 0) {
      return "Choose at least one filter for filtered audience";
    }
    if (scheduleEnabled && !payload.scheduled_for) return "Select a valid schedule date/time";
    return null;
  };

  const handlePreview = async () => {
    setError(null);
    setSuccess(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await adminNotificationsApi.previewAudience(payload);
      setPreviewResult({
        count: res.data.count ?? 0,
        sample: res.data.sample ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview audience");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!previewResult) {
      setError("Run audience preview before sending/scheduling.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await adminNotificationsApi.createCampaign(payload);
      const campaignId = res.data.id;
      if (!campaignId) {
        throw new Error("Campaign created but no campaign ID was returned.");
      }
      setSuccess(scheduleEnabled ? "Campaign scheduled successfully." : "Campaign queued for delivery.");
      onCreated(campaignId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {cloneSourceCampaignId && cloneLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashboard-border/60 bg-dashboard-surface">
          <Loader2 className="h-10 w-10 animate-spin text-brand-bg-primary" />
          <p className="text-sm text-dashboard-muted">Loading campaign to copy…</p>
        </div>
      )}

      {cloneSourceCampaignId && !cloneLoading && cloneError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-4">
          {cloneError}
        </div>
      )}

      {cloneSourceCampaignId && !cloneLoading && !cloneError && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 mb-4">
          Title, subject, body, and audience were copied from a previous campaign. Run{" "}
          <strong>Preview audience</strong> to confirm recipients, edit anything you need, then send or
          schedule.
        </div>
      )}

      {!cloneLoading && (
        <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-dashboard-heading">Campaign Title</label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setPreviewResult(null);
              }}
              placeholder="March Maintenance Notice"
              className="mt-1 h-11 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-dashboard-heading">Email Subject</label>
            <input
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setPreviewResult(null);
              }}
              placeholder="Planned Maintenance — March 1st"
              className="mt-1 h-11 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-dashboard-heading">Audience</p>
          <div className="flex flex-wrap gap-2">
            {(["all", "filtered", "individual"] as NotificationTargetType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setTargetType(type);
                  setPreviewResult(null);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                  targetType === type
                    ? "bg-brand-bg-primary text-white"
                    : "bg-dashboard-bg border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {targetType === "individual" && (
          <div>
            <label className="text-xs font-semibold text-dashboard-heading">
              Recipient Emails (comma/newline separated)
            </label>
            <textarea
              value={targetEmailsRaw}
              onChange={(e) => {
                setTargetEmailsRaw(e.target.value);
                setPreviewResult(null);
              }}
              rows={3}
              placeholder="john@example.com, jane@example.com"
              className="mt-1 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
            />
            <p className="mt-1 text-[11px] text-dashboard-muted">
              Parsed recipients: {normalizedEmails.length}
            </p>
          </div>
        )}

        {targetType === "filtered" && (
          <div className="space-y-3">
            <p className="text-[11px] text-dashboard-muted">
              All filters are AND-combined — users must match every filter you set.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-dashboard-muted mb-1 block">Role</label>
                <select
                  value={targetFilters.role ?? ""}
                  onChange={(e) => {
                    setTargetFilters((prev) => ({ ...prev, role: e.target.value || undefined }));
                    setPreviewResult(null);
                  }}
                  className="h-10 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                >
                  <option value="">Any role</option>
                  <option value="user">User</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-dashboard-muted mb-1 block">Tier</label>
                <select
                  value={targetFilters.tier ?? ""}
                  onChange={(e) => {
                    setTargetFilters((prev) => ({ ...prev, tier: e.target.value || undefined }));
                    setPreviewResult(null);
                  }}
                  className="h-10 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                >
                  <option value="">Any tier</option>
                  <option value="BASIC">Basic</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-dashboard-muted mb-1 block">Account Status</label>
                <select
                  value={targetFilters.account_status ?? ""}
                  onChange={(e) => {
                    setTargetFilters((prev) => ({ ...prev, account_status: e.target.value || undefined }));
                    setPreviewResult(null);
                  }}
                  className="h-10 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                >
                  <option value="">Any status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-dashboard-muted mb-1 block">Gender</label>
                <select
                  value={targetFilters.gender ?? ""}
                  onChange={(e) => {
                    setTargetFilters((prev) => ({ ...prev, gender: e.target.value || undefined }));
                    setPreviewResult(null);
                  }}
                  className="h-10 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                >
                  <option value="">Any gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-dashboard-muted mb-1 block">Platform</label>
                <select
                  value={targetFilters.platform ?? ""}
                  onChange={(e) => {
                    setTargetFilters((prev) => ({ ...prev, platform: e.target.value || undefined }));
                    setPreviewResult(null);
                  }}
                  className="h-10 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                >
                  <option value="">Any platform</option>
                  <option value="ios">iOS</option>
                  <option value="android">Android</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-dashboard-muted mb-1 block">Completed Onboarding</label>
                <select
                  value={targetFilters.has_completed_onboarding === undefined ? "" : String(targetFilters.has_completed_onboarding)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTargetFilters((prev) => ({
                      ...prev,
                      has_completed_onboarding: v === "" ? undefined : v === "true",
                    }));
                    setPreviewResult(null);
                  }}
                  className="h-10 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-dashboard-muted mb-1 block">Email Verified</label>
                <select
                  value={targetFilters.is_email_verified === undefined ? "" : String(targetFilters.is_email_verified)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTargetFilters((prev) => ({
                      ...prev,
                      is_email_verified: v === "" ? undefined : v === "true",
                    }));
                    setPreviewResult(null);
                  }}
                  className="h-10 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-dashboard-muted mb-1 block">Min Balance (₦)</label>
                <input
                  type="number"
                  min={0}
                  value={targetFilters.min_balance ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTargetFilters((prev) => ({
                      ...prev,
                      min_balance: value ? Number(value) : undefined,
                    }));
                    setPreviewResult(null);
                  }}
                  placeholder="0"
                  className="h-10 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                />
              </div>
              <div>
                <label className="text-[11px] text-dashboard-muted mb-1 block">Max Balance (₦)</label>
                <input
                  type="number"
                  min={0}
                  value={targetFilters.max_balance ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTargetFilters((prev) => ({
                      ...prev,
                      max_balance: value ? Number(value) : undefined,
                    }));
                    setPreviewResult(null);
                  }}
                  placeholder="No limit"
                  className="h-10 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                />
              </div>
              <div>
                <label className="text-[11px] text-dashboard-muted mb-1 block">Min Total Transactions</label>
                <input
                  type="number"
                  min={0}
                  value={targetFilters.min_total_transactions ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTargetFilters((prev) => ({
                      ...prev,
                      min_total_transactions: value ? Number(value) : undefined,
                    }));
                    setPreviewResult(null);
                  }}
                  placeholder="0"
                  className="h-10 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                />
              </div>
              <div>
                <label className="text-[11px] text-dashboard-muted mb-1 block">Max Total Transactions</label>
                <input
                  type="number"
                  min={0}
                  value={targetFilters.max_total_transactions ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTargetFilters((prev) => ({
                      ...prev,
                      max_total_transactions: value ? Number(value) : undefined,
                    }));
                    setPreviewResult(null);
                  }}
                  placeholder="No limit"
                  className="h-10 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                />
              </div>
              <div>
                <label className="text-[11px] text-dashboard-muted mb-1 block">Registered After</label>
                <input
                  type="date"
                  value={targetFilters.registered_after ?? ""}
                  onChange={(e) => {
                    setTargetFilters((prev) => ({
                      ...prev,
                      registered_after: e.target.value || undefined,
                    }));
                    setPreviewResult(null);
                  }}
                  className="h-10 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                />
              </div>
              <div>
                <label className="text-[11px] text-dashboard-muted mb-1 block">Registered Before</label>
                <input
                  type="date"
                  value={targetFilters.registered_before ?? ""}
                  onChange={(e) => {
                    setTargetFilters((prev) => ({
                      ...prev,
                      registered_before: e.target.value || undefined,
                    }));
                    setPreviewResult(null);
                  }}
                  className="h-10 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-dashboard-heading">Email Content (Markdown)</label>
            <button
              type="button"
              onClick={() => setPreviewMode((m) => (m === "edit" ? "preview" : "edit"))}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              {previewMode === "edit" ? "Preview" : "Edit"}
            </button>
          </div>
          {previewMode === "edit" ? (
            <textarea
              rows={12}
              value={contentMarkdown}
              onChange={(e) => {
                setContentMarkdown(e.target.value);
                setPreviewResult(null);
              }}
              className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
            />
          ) : (
            <div className="rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-4 py-3 prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {personalizedPreview}
              </ReactMarkdown>
            </div>
          )}
          <p className="text-[11px] text-dashboard-muted">
            Variables: <code>{"{{first_name}}"}</code>, <code>{"{{last_name}}"}</code>,{" "}
            <code>{"{{email}}"}</code>
          </p>
        </div>

        <div className="rounded-lg border border-dashboard-border/60 bg-dashboard-bg/60 p-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-dashboard-heading">
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={(e) => {
                setScheduleEnabled(e.target.checked);
                setPreviewResult(null);
              }}
            />
            Schedule for later
          </label>
          {scheduleEnabled && (
            <div className="mt-2 max-w-sm">
              <input
                type="datetime-local"
                value={scheduledForLocal}
                onChange={(e) => {
                  setScheduledForLocal(e.target.value);
                  setPreviewResult(null);
                }}
                className="h-10 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-surface px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
              />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewLoading || submitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
          >
            {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Preview Audience
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || previewLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-brand-bg-primary text-white hover:bg-brand-bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : scheduleEnabled ? <CalendarClock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {scheduleEnabled ? "Schedule Campaign" : "Send Campaign"}
          </button>
        </div>

        <div className="mt-3 rounded-lg bg-dashboard-bg/70 border border-dashboard-border/50 px-3 py-2.5">
          {previewResult ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-dashboard-heading">
                Audience size: {previewResult.count.toLocaleString()} users
              </p>
              <p className="text-xs text-dashboard-muted">
                Sample: {previewResult.sample.length ? previewResult.sample.join(", ") : "No sample emails returned"}
              </p>
            </div>
          ) : (
            <p className="text-xs text-dashboard-muted">
              Run preview to see recipient count before sending.
            </p>
          )}
        </div>
      </div>
    </div>
      )}
    </>
  );
}
