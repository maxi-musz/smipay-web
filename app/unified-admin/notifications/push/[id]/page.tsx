"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, RefreshCw, RotateCcw, Ban } from "lucide-react";
import { adminPushBroadcastsApi } from "@/services/admin/push-broadcasts-api";
import type { PushBroadcast, PushBroadcastLog } from "@/types/admin/push-broadcasts";
import { PushBroadcastStatusBadge } from "../../_components/PushBroadcastStatusBadge";

interface LogsMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function fmtDate(val?: string | null) {
  if (!val) return "\u2014";
  return new Date(val).toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function progressOf(b: PushBroadcast): number {
  if (!b.total_recipients) return 0;
  const done = b.sent_count + b.failed_count;
  return Math.min(100, Math.round((done / b.total_recipients) * 100));
}

export default function PushBroadcastDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [broadcast, setBroadcast] = useState<PushBroadcast | null>(null);
  const [logs, setLogs] = useState<PushBroadcastLog[]>([]);
  const [logsMeta, setLogsMeta] = useState<LogsMeta>({ total: 0, page: 1, limit: 50, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = async (logsPage = 1) => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [bRes, lRes] = await Promise.all([
        adminPushBroadcastsApi.getBroadcast(id),
        adminPushBroadcastsApi.getDeliveryLogs(id, logsPage),
      ]);
      setBroadcast(bRes.data);
      setLogs(lRes.data.logs);
      setLogsMeta({ total: lRes.data.total, page: lRes.data.page, limit: lRes.data.limit, pages: lRes.data.pages });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load broadcast");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!broadcast || broadcast.status !== "sending") return;
    const interval = setInterval(() => fetchAll(logsMeta.page), 5000);
    return () => clearInterval(interval);
  }, [broadcast?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await adminPushBroadcastsApi.cancelBroadcast(id);
      fetchAll(logsMeta.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResend = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await adminPushBroadcastsApi.resendFailed(id);
      fetchAll(logsMeta.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading && !broadcast) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-bg-primary" />
      </div>
    );
  }

  if (!broadcast) {
    return (
      <div className="min-h-screen bg-dashboard-bg p-8">
        <p className="text-red-600">{error || "Broadcast not found"}</p>
        <Link href="/unified-admin/notifications" className="text-brand-bg-primary text-sm mt-2 inline-block">
          Back to Notifications
        </Link>
      </div>
    );
  }

  const progress = progressOf(broadcast);
  const canCancel = broadcast.status === "scheduled";
  const canResend = (broadcast.status === "sent" || broadcast.status === "failed") && broadcast.failed_count > 0;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <Link
            href="/unified-admin/notifications"
            className="p-2 -ml-2 rounded-lg hover:bg-dashboard-bg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-dashboard-heading" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-dashboard-heading truncate">{broadcast.title}</h1>
            <p className="text-xs text-dashboard-muted">Push Broadcast Detail</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchAll(logsMeta.page)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            {canCancel && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                <Ban className="h-3.5 w-3.5" /> Cancel
              </button>
            )}
            {canResend && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleResend}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Resend Failed
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Overview */}
        <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <PushBroadcastStatusBadge status={broadcast.status} />
            <span className="text-xs text-dashboard-muted capitalize">Target: {broadcast.target_type}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-dashboard-heading">{broadcast.total_recipients.toLocaleString()}</p>
              <p className="text-xs text-dashboard-muted">Total Recipients</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{broadcast.sent_count.toLocaleString()}</p>
              <p className="text-xs text-dashboard-muted">Sent</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{broadcast.failed_count.toLocaleString()}</p>
              <p className="text-xs text-dashboard-muted">Failed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-bg-primary">{progress}%</p>
              <p className="text-xs text-dashboard-muted">Progress</p>
            </div>
          </div>

          <div className="h-2 rounded-full bg-dashboard-border/60 overflow-hidden">
            <div className="h-full bg-brand-bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-dashboard-muted">
            <p>Created: {fmtDate(broadcast.createdAt)}</p>
            <p>Sent: {fmtDate(broadcast.sent_at)}</p>
            {broadcast.scheduled_for && <p>Scheduled: {fmtDate(broadcast.scheduled_for)}</p>}
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-5 space-y-3">
          <h2 className="text-sm font-semibold text-dashboard-heading">Content</h2>
          <div className="rounded-lg bg-dashboard-bg p-4">
            <h3 className="font-semibold text-dashboard-heading text-sm">{broadcast.title}</h3>
            <p className="text-xs text-dashboard-muted mt-1">{broadcast.body}</p>
            {broadcast.message && (
              <div className="mt-3 pt-3 border-t border-dashboard-border/40 text-sm text-dashboard-heading whitespace-pre-wrap">
                {broadcast.message}
              </div>
            )}
          </div>
        </div>

        {/* Delivery Logs */}
        <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
          <div className="px-5 py-3 border-b border-dashboard-border/60">
            <h2 className="text-sm font-semibold text-dashboard-heading">
              Delivery Logs ({logsMeta.total.toLocaleString()})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-dashboard-bg/70 border-b border-dashboard-border/60">
                <tr className="text-left">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-dashboard-muted">User ID</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-dashboard-muted">Status</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-dashboard-muted">Error</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-dashboard-muted">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-dashboard-muted">
                      No delivery logs yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-t border-dashboard-border/40">
                      <td className="px-4 py-2.5 text-xs font-mono text-dashboard-heading">{log.user_id}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            log.status === "sent"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-dashboard-muted max-w-[300px] truncate">
                        {log.error_message || "\u2014"}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-dashboard-muted">{fmtDate(log.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {logsMeta.pages > 1 && (
            <div className="flex items-center justify-center gap-2 py-3 border-t border-dashboard-border/60">
              {Array.from({ length: logsMeta.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => fetchAll(p)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    p === logsMeta.page
                      ? "bg-brand-bg-primary text-white"
                      : "text-dashboard-muted hover:bg-dashboard-bg"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
