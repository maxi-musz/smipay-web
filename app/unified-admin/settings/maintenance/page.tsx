"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Wrench,
  RefreshCw,
  Save,
  AlertTriangle,
  Loader2,
  Check,
} from "lucide-react";
import { adminMaintenanceApi } from "@/services/admin/maintenance-api";
import type {
  MaintenanceFlag,
  MaintenanceScope,
} from "@/types/admin/maintenance";

export default function MaintenanceSettingsPage() {
  const [items, setItems] = useState<MaintenanceFlag[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminMaintenanceApi.list();
      setItems(res.data.items);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patchLocal = (area: string, p: Partial<MaintenanceFlag>) =>
    setItems((prev) =>
      prev ? prev.map((i) => (i.area === area ? { ...i, ...p } : i)) : prev,
    );

  const anyActive = items?.some((i) => i.is_active);

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-dashboard-heading">
                Maintenance
              </h1>
              <p className="text-xs text-dashboard-muted">
                Put parts of the app under maintenance instantly — no rebuild
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-4 max-w-3xl">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
            <button type="button" onClick={load} className="ml-2 underline font-medium">
              Retry
            </button>
          </div>
        )}

        {anyActive && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            One or more areas are under maintenance right now. Users are being
            blocked from those flows.
          </div>
        )}

        {loading && !items ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl border border-dashboard-border/60 bg-dashboard-surface animate-pulse"
              />
            ))}
          </div>
        ) : (
          items?.map((item) => (
            <AreaCard key={item.area} item={item} onPatch={patchLocal} onError={setError} />
          ))
        )}
      </div>
    </div>
  );
}

function AreaCard({
  item,
  onPatch,
  onError,
}: {
  item: MaintenanceFlag;
  onPatch: (area: string, p: Partial<MaintenanceFlag>) => void;
  onError: (msg: string) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savedDetails, setSavedDetails] = useState(false);

  const toggleActive = async () => {
    const next = !item.is_active;
    setToggling(true);
    try {
      await adminMaintenanceApi.update({ area: item.area, is_active: next });
      onPatch(item.area, { is_active: next });
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setToggling(false);
    }
  };

  const saveDetails = async () => {
    setSavingDetails(true);
    setSavedDetails(false);
    try {
      await adminMaintenanceApi.update({
        area: item.area,
        scope: item.scope,
        message: item.message ?? "",
      });
      setSavedDetails(true);
      setTimeout(() => setSavedDetails(false), 2000);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSavingDetails(false);
    }
  };

  return (
    <div
      className={`rounded-xl border bg-dashboard-surface p-4 sm:p-5 space-y-4 transition-colors ${
        item.is_active ? "border-amber-300" : "border-dashboard-border/60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-dashboard-heading">
              {item.label}
            </p>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                item.is_active
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {item.is_active ? "Under maintenance" : "Live"}
            </span>
          </div>
          <p className="text-xs text-dashboard-muted mt-1">{item.description}</p>
        </div>
        <Toggle on={item.is_active} busy={toggling} onClick={toggleActive} />
      </div>

      {item.is_active && (
        <div className="space-y-3 pt-3 border-t border-dashboard-border/40">
          <div className="flex items-center gap-3">
            <label className="text-xs text-dashboard-heading flex-1">
              Who it blocks
            </label>
            <select
              value={item.scope}
              onChange={(e) =>
                onPatch(item.area, { scope: e.target.value as MaintenanceScope })
              }
              className="text-sm border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="users">Users only (admins still pass)</option>
              <option value="all">Everyone (including admins)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-dashboard-heading">
              Message shown to users (optional)
            </label>
            <textarea
              rows={2}
              value={item.message ?? ""}
              placeholder={item.default_message}
              onChange={(e) => onPatch(item.area, { message: e.target.value })}
              className="w-full text-sm border border-dashboard-border/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveDetails}
              disabled={savingDetails}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {savingDetails ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : savedDetails ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {savedDetails ? "Saved" : "Save details"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({
  on,
  busy,
  onClick,
}: {
  on: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={busy}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
        on ? "bg-amber-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transform transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      >
        {busy && <Loader2 className="h-3 w-3 animate-spin text-gray-500" />}
      </span>
    </button>
  );
}
