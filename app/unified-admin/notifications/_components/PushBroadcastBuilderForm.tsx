"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Eye, Send, CalendarClock, Users } from "lucide-react";
import { adminPushBroadcastsApi } from "@/services/admin/push-broadcasts-api";
import type {
  PushBroadcastCreatePayload,
  PushBroadcastTargetFilters,
  PushBroadcastTargetType,
} from "@/types/admin/push-broadcasts";

interface PushBroadcastBuilderFormProps {
  onCreated: (broadcastId: string) => void;
}

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

export function PushBroadcastBuilderForm({ onCreated }: PushBroadcastBuilderFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<PushBroadcastTargetType>("all");
  const [targetFilters, setTargetFilters] = useState<PushBroadcastTargetFilters>({});
  const [targetUserIdsRaw, setTargetUserIdsRaw] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledForLocal, setScheduledForLocal] = useState(
    toLocalDateTimeInput(new Date(Date.now() + 60 * 60 * 1000).toISOString()),
  );
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<{ count: number; sample: string[] } | null>(null);

  const normalizedUserIds = useMemo(() => {
    return targetUserIdsRaw
      .split(/[,\n;]/)
      .map((id) => id.trim())
      .filter(Boolean);
  }, [targetUserIdsRaw]);

  const payload = useMemo<PushBroadcastCreatePayload>(() => {
    const base: PushBroadcastCreatePayload = {
      title: title.trim(),
      body: body.trim(),
      message: message.trim() || null,
      target_type: targetType,
    };
    if (targetType === "filtered") base.target_filters = targetFilters;
    if (targetType === "individual") base.target_user_ids = normalizedUserIds;
    if (scheduleEnabled) base.scheduled_for = fromLocalDateTimeInput(scheduledForLocal);
    return base;
  }, [title, body, message, targetType, targetFilters, normalizedUserIds, scheduleEnabled, scheduledForLocal]);

  const canSubmit = title.trim() && body.trim() && (targetType !== "individual" || normalizedUserIds.length > 0);

  const handlePreviewAudience = async () => {
    setPreviewLoading(true);
    setError(null);
    try {
      const res = await adminPushBroadcastsApi.previewAudience(payload);
      setPreviewResult(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await adminPushBroadcastsApi.createBroadcast(payload);
      setSuccess("Push broadcast created!");
      onCreated(res.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create broadcast");
    } finally {
      setSubmitting(false);
    }
  };

  const updateFilter = (key: keyof PushBroadcastTargetFilters, value: any) => {
    setTargetFilters((prev) => {
      const next = { ...prev };
      if (value === "" || value === undefined || value === null) {
        delete (next as any)[key];
      } else {
        (next as any)[key] = value;
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <button
            type="button"
            onClick={() => router.push("/unified-admin/notifications")}
            className="p-2 -ml-2 rounded-lg hover:bg-dashboard-bg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-dashboard-heading" />
          </button>
          <div>
            <h1 className="text-base font-bold text-dashboard-heading">New Push Broadcast</h1>
            <p className="text-xs text-dashboard-muted">Send push notifications to mobile app users</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">{success}</div>
        )}

        {/* Title & Body */}
        <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-dashboard-heading">Notification Content</h2>

          <div>
            <label className="text-xs font-medium text-dashboard-muted block mb-1">Title (push headline)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New Feature Available!"
              maxLength={100}
              className="w-full h-10 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-dashboard-muted block mb-1">Body (push preview text)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Short message shown in the push notification..."
              maxLength={256}
              rows={2}
              className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20 resize-none"
            />
            <p className="text-[11px] text-dashboard-muted mt-1">{body.length}/256 characters</p>
          </div>

          <div>
            <label className="text-xs font-medium text-dashboard-muted block mb-1">
              Full Message (shown when user taps notification)
              <span className="text-dashboard-muted/60 ml-1">— optional</span>
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setPreviewMode("edit")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  previewMode === "edit"
                    ? "bg-brand-bg-primary text-white"
                    : "bg-dashboard-bg text-dashboard-muted border border-dashboard-border/60 hover:text-dashboard-heading"
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("preview")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 ${
                  previewMode === "preview"
                    ? "bg-brand-bg-primary text-white"
                    : "bg-dashboard-bg text-dashboard-muted border border-dashboard-border/60 hover:text-dashboard-heading"
                }`}
              >
                <Eye className="h-3 w-3" /> Preview
              </button>
            </div>
            {previewMode === "edit" ? (
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Longer message content. This is what users see when they open the notification in the app..."
                rows={6}
                className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20 resize-none font-mono"
              />
            ) : (
              <div className="rounded-lg border border-dashboard-border/60 bg-white p-4 min-h-[120px]">
                <h3 className="font-semibold text-dashboard-heading text-sm">{title || "Notification Title"}</h3>
                <p className="text-xs text-dashboard-muted mt-1">{body || "Push notification body"}</p>
                {message && (
                  <div className="mt-3 pt-3 border-t border-dashboard-border/40 text-sm text-dashboard-heading whitespace-pre-wrap">
                    {message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Audience */}
        <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-dashboard-heading">Audience</h2>

          <div className="flex gap-2">
            {(["all", "filtered", "individual"] as PushBroadcastTargetType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => { setTargetType(type); setPreviewResult(null); }}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors capitalize ${
                  targetType === type
                    ? "bg-brand-bg-primary text-white"
                    : "bg-dashboard-bg text-dashboard-muted border border-dashboard-border/60 hover:text-dashboard-heading"
                }`}
              >
                {type === "all" ? "All Users with Push" : type === "filtered" ? "Filtered" : "Individual"}
              </button>
            ))}
          </div>

          {targetType === "individual" && (
            <div>
              <label className="text-xs font-medium text-dashboard-muted block mb-1">User IDs (comma or newline separated)</label>
              <textarea
                value={targetUserIdsRaw}
                onChange={(e) => setTargetUserIdsRaw(e.target.value)}
                placeholder="user-uuid-1, user-uuid-2..."
                rows={3}
                className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20 resize-none font-mono"
              />
              <p className="text-[11px] text-dashboard-muted mt-1">{normalizedUserIds.length} user(s)</p>
            </div>
          )}

          {targetType === "filtered" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-dashboard-muted block mb-1">Role</label>
                <select
                  value={targetFilters.role || ""}
                  onChange={(e) => updateFilter("role", e.target.value || undefined)}
                  className="w-full h-9 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm"
                >
                  <option value="">Any role</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-dashboard-muted block mb-1">Tier</label>
                <select
                  value={targetFilters.tier || ""}
                  onChange={(e) => updateFilter("tier", e.target.value || undefined)}
                  className="w-full h-9 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm"
                >
                  <option value="">Any tier</option>
                  <option value="UNVERIFIED">Unverified</option>
                  <option value="VERIFIED">Verified</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-dashboard-muted block mb-1">Account Status</label>
                <select
                  value={targetFilters.account_status || ""}
                  onChange={(e) => updateFilter("account_status", e.target.value || undefined)}
                  className="w-full h-9 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm"
                >
                  <option value="">Any</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-dashboard-muted block mb-1">Platform</label>
                <select
                  value={targetFilters.platform || ""}
                  onChange={(e) => updateFilter("platform", e.target.value || undefined)}
                  className="w-full h-9 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm"
                >
                  <option value="">Any platform</option>
                  <option value="ios">iOS</option>
                  <option value="android">Android</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-dashboard-muted block mb-1">Gender</label>
                <select
                  value={targetFilters.gender || ""}
                  onChange={(e) => updateFilter("gender", e.target.value || undefined)}
                  className="w-full h-9 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm"
                >
                  <option value="">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-dashboard-muted block mb-1">Onboarding Complete</label>
                <select
                  value={targetFilters.has_completed_onboarding === undefined ? "" : String(targetFilters.has_completed_onboarding)}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateFilter("has_completed_onboarding", v === "" ? undefined : v === "true");
                  }}
                  className="w-full h-9 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm"
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-dashboard-muted block mb-1">Min Balance (&#x20A6;)</label>
                <input
                  type="number"
                  min={0}
                  value={targetFilters.min_balance ?? ""}
                  onChange={(e) => updateFilter("min_balance", e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full h-9 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-dashboard-muted block mb-1">Max Balance (&#x20A6;)</label>
                <input
                  type="number"
                  min={0}
                  value={targetFilters.max_balance ?? ""}
                  onChange={(e) => updateFilter("max_balance", e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full h-9 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-dashboard-muted block mb-1">Registered After</label>
                <input
                  type="date"
                  value={targetFilters.registered_after?.slice(0, 10) ?? ""}
                  onChange={(e) => updateFilter("registered_after", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  className="w-full h-9 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-dashboard-muted block mb-1">Registered Before</label>
                <input
                  type="date"
                  value={targetFilters.registered_before?.slice(0, 10) ?? ""}
                  onChange={(e) => updateFilter("registered_before", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  className="w-full h-9 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-dashboard-muted block mb-1">Min Total Transactions</label>
                <input
                  type="number"
                  min={0}
                  value={targetFilters.min_total_transactions ?? ""}
                  onChange={(e) => updateFilter("min_total_transactions", e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full h-9 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-dashboard-muted block mb-1">Max Total Transactions</label>
                <input
                  type="number"
                  min={0}
                  value={targetFilters.max_total_transactions ?? ""}
                  onChange={(e) => updateFilter("max_total_transactions", e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full h-9 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handlePreviewAudience}
            disabled={previewLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
          >
            {previewLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
            Preview Audience
          </button>

          {previewResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
              <strong>{previewResult.count.toLocaleString()}</strong> users with active push tokens
              {previewResult.sample.length > 0 && (
                <span className="text-xs block mt-1 text-blue-600">
                  Sample: {previewResult.sample.join(", ")}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-5 space-y-4">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-4 w-4 text-dashboard-muted" />
            <h2 className="text-sm font-semibold text-dashboard-heading">Schedule</h2>
          </div>

          <label className="inline-flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={(e) => setScheduleEnabled(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-dashboard-heading">Schedule for later</span>
          </label>

          {scheduleEnabled && (
            <input
              type="datetime-local"
              value={scheduledForLocal}
              onChange={(e) => setScheduledForLocal(e.target.value)}
              className="w-full h-10 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
            />
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/unified-admin/notifications")}
            className="px-4 py-2.5 text-sm font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-brand-bg-primary text-white hover:bg-brand-bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {scheduleEnabled ? "Schedule Broadcast" : "Send Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
