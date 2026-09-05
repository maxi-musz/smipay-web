"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, Loader2, RefreshCw, ShieldOff, Undo2 } from "lucide-react";
import { adminSecurityApi } from "@/services/admin/security-api";
import type { BlockedIp } from "@/types/admin/security";

export function BlockedIpsPanel() {
  const [rows, setRows] = useState<BlockedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminSecurityApi.listBlockedIps();
      setRows(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load blocked IPs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const block = async () => {
    if (!ip.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await adminSecurityApi.blockIp({
        ip: ip.trim(),
        reason: reason.trim() || undefined,
      });
      setRows(res.data ?? []);
      setIp("");
      setReason("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to block IP");
    } finally {
      setSaving(false);
    }
  };

  const unblock = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      const res = await adminSecurityApi.unblockIp(id);
      setRows(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to unblock IP");
    } finally {
      setBusyId(null);
    }
  };

  const active = rows.filter((r) => r.is_active);
  const inactive = rows.filter((r) => !r.is_active);

  return (
    <section className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Ban className="h-4 w-4 text-brand-bg-primary" />
          <h2 className="text-sm font-semibold text-dashboard-heading">
            Blocked IPs
          </h2>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashboard-border/60 px-2.5 py-1.5 text-xs text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
      <p className="mb-4 text-xs text-dashboard-muted">
        Blocked IPs are refused on <strong>every</strong> endpoint, webhooks
        included, with a generic &quot;Access denied&quot;. Careful with
        Nigerian mobile IPs — carriers put thousands of users behind one
        address (CGNAT), so a block can hit innocent users too. Paystack&apos;s
        webhook IPs and internal ranges can never be blocked.
      </p>

      {error ? (
        <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      {/* Add */}
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[160px] flex-1">
          <label className="text-xs font-medium text-dashboard-heading">
            IP address
          </label>
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="102.88.104.74"
            className="mt-1 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 py-2 font-mono text-sm text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/40"
          />
        </div>
        <div className="min-w-[200px] flex-[2]">
          <label className="text-xs font-medium text-dashboard-heading">
            Reason (optional)
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Paystack webhook forgery on Sep 4"
            className="mt-1 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 py-2 text-sm text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/40"
          />
        </div>
        <button
          onClick={() => void block()}
          disabled={!ip.trim() || saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-bg-primary px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ShieldOff className="h-3.5 w-3.5" />
          )}
          Block IP
        </button>
      </div>

      {/* List */}
      {loading && rows.length === 0 ? (
        <div className="py-8 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-dashboard-muted" />
        </div>
      ) : active.length === 0 && inactive.length === 0 ? (
        <p className="py-6 text-center text-sm text-dashboard-muted">
          No IPs blocked. Auto-blocks from webhook forgeries land here when
          enabled in Settings → Alerts.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-dashboard-border/60">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-dashboard-border/60 text-left text-xs uppercase tracking-wider text-dashboard-muted">
                <th className="px-3 py-2 font-semibold">IP</th>
                <th className="px-3 py-2 font-semibold">Reason</th>
                <th className="px-3 py-2 font-semibold">Source</th>
                <th className="px-3 py-2 font-semibold">Hits</th>
                <th className="px-3 py-2 font-semibold">Last hit</th>
                <th className="px-3 py-2 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {[...active, ...inactive].map((r) => (
                <tr
                  key={r.id}
                  className={`border-b border-dashboard-border/40 last:border-0 ${
                    r.is_active ? "" : "opacity-50"
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-dashboard-heading">
                    {r.ip}
                    {!r.is_active && (
                      <span className="ml-2 rounded bg-dashboard-bg px-1.5 py-0.5 text-[10px] uppercase text-dashboard-muted">
                        unblocked
                      </span>
                    )}
                  </td>
                  <td className="max-w-[260px] truncate px-3 py-2 text-dashboard-muted">
                    {r.reason}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        r.source === "auto_forgery"
                          ? "bg-red-50 text-red-700"
                          : "bg-dashboard-bg text-dashboard-muted"
                      }`}
                    >
                      {r.source === "auto_forgery" ? "auto" : "manual"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-dashboard-muted">{r.hit_count}</td>
                  <td className="px-3 py-2 text-xs text-dashboard-muted">
                    {r.last_hit_at
                      ? new Date(r.last_hit_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.is_active && (
                      <button
                        onClick={() => void unblock(r.id)}
                        disabled={busyId === r.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-dashboard-border/60 px-2 py-1 text-xs text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50"
                      >
                        {busyId === r.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Undo2 className="h-3 w-3" />
                        )}
                        Unblock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
