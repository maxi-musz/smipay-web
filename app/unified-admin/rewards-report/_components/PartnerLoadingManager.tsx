"use client";

import { useCallback, useEffect, useState } from "react";
import { Fuel, Plus, Trash2, Loader2 } from "lucide-react";
import { adminRewardsReportApi } from "@/services/admin/rewards-report-api";
import type { PartnerLoadingEntry } from "@/types/admin/rewards-report";

const naira = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(n ?? 0);

export function PartnerLoadingManager({
  partner = "vtpass",
  dateFrom,
  dateTo,
  onChanged,
}: {
  partner?: string;
  dateFrom: string;
  dateTo: string;
  onChanged?: () => void;
}) {
  const [entries, setEntries] = useState<PartnerLoadingEntry[]>([]);
  const [totalLoaded, setTotalLoaded] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [amount, setAmount] = useState("");
  const [loadedAt, setLoadedAt] = useState(dateFrom);
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminRewardsReportApi.listPartnerLoading({
        partner,
        date_from: dateFrom,
        date_to: dateTo,
      });
      setEntries(res.entries);
      setTotalLoaded(res.total_loaded);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [partner, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setLoadedAt(dateFrom);
  }, [dateFrom]);

  const add = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !loadedAt) {
      setError("Enter a positive amount and a date.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await adminRewardsReportApi.createPartnerLoading({
        partner,
        amount: amt,
        loaded_at: loadedAt,
        reference: reference || undefined,
      });
      setAmount("");
      setReference("");
      await load();
      onChanged?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await adminRewardsReportApi.deletePartnerLoading(id);
      await load();
      onChanged?.();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-bg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Fuel className="h-4 w-4 text-brand-bg-primary" />
          <span className="text-sm font-semibold text-dashboard-heading">
            {partner.toUpperCase()} loading (this period)
          </span>
        </div>
        <span className="text-sm font-bold text-dashboard-heading tabular-nums">
          {naira(totalLoaded)}
        </span>
      </div>

      {error && (
        <div className="mb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Add form */}
      <div className="flex flex-wrap items-end gap-2 mb-3">
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[11px] text-dashboard-muted mb-1">
            Amount loaded (₦)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500000"
            className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-surface px-3 py-2 text-sm text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/30"
          />
        </div>
        <div className="min-w-[140px]">
          <label className="block text-[11px] text-dashboard-muted mb-1">
            Date loaded
          </label>
          <input
            type="date"
            value={loadedAt}
            onChange={(e) => setLoadedAt(e.target.value)}
            className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-surface px-3 py-2 text-sm text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/30"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[11px] text-dashboard-muted mb-1">
            Reference (optional)
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Bank ref / note"
            className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-surface px-3 py-2 text-sm text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/30"
          />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Add
        </button>
      </div>

      {/* Entries list */}
      {loading ? (
        <div className="py-4 text-center text-xs text-dashboard-muted">
          Loading…
        </div>
      ) : entries.length === 0 ? (
        <div className="py-3 text-center text-xs text-dashboard-muted">
          No loading entries recorded for this period.
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-dashboard-surface border border-dashboard-border/40 px-3 py-2"
            >
              <div className="min-w-0">
                <span className="text-sm font-medium text-dashboard-heading tabular-nums">
                  {naira(e.amount)}
                </span>
                <span className="ml-2 text-xs text-dashboard-muted">
                  {new Date(e.loaded_at).toLocaleDateString("en-NG", {
                    dateStyle: "medium",
                  })}
                  {e.reference ? ` · ${e.reference}` : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => remove(e.id)}
                className="text-dashboard-muted hover:text-red-600 transition"
                aria-label="Delete entry"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
