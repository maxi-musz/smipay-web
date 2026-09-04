"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Shield, X } from "lucide-react";
import { adminManagementApi } from "@/services/admin/management-api";
import type { AdminUser } from "@/types/admin/management";

interface Props {
  admin: AdminUser;
  canManage: boolean;
  onUpdated: (admin: AdminUser) => void;
}

export function AdminSignInSecurityPanel({
  admin,
  canManage,
  onUpdated,
}: Props) {
  const [mode, setMode] = useState<"any" | "allowlist">(
    admin.admin_sign_in_ip_mode === "allowlist" ? "allowlist" : "any",
  );
  const [ips, setIps] = useState<string[]>(admin.admin_allowed_ips ?? []);
  const [newIp, setNewIp] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(admin.admin_sign_in_ip_mode === "allowlist" ? "allowlist" : "any");
    setIps(admin.admin_allowed_ips ?? []);
  }, [admin]);

  const last = admin.last_sign_in;

  const addIp = (value: string) => {
    const ip = value.trim();
    if (!ip || ips.includes(ip)) return;
    setIps((prev) => [...prev, ip]);
  };

  const removeIp = (ip: string) => {
    setIps((prev) => prev.filter((x) => x !== ip));
  };

  const addLastIp = () => {
    if (last?.ip_address) addIp(last.ip_address);
  };

  const savedMode: "any" | "allowlist" =
    admin.admin_sign_in_ip_mode === "allowlist" ? "allowlist" : "any";
  const savedIps = admin.admin_allowed_ips ?? [];

  const isDirty =
    mode !== savedMode ||
    (mode === "allowlist" && !ipsEqual(ips, savedIps));

  const save = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminManagementApi.setAdminSignInIpPolicy(admin.id, {
        mode,
        allowed_ips: mode === "allowlist" ? ips : [],
      });
      if (res.data) onUpdated(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-dashboard-border/50 bg-dashboard-bg/60 p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-dashboard-heading">
        <Shield className="h-4 w-4 text-dashboard-accent" />
        Sign-in security
      </div>

      {last ? (
        <div className="rounded-lg border border-dashboard-border/40 bg-dashboard-surface p-3 text-xs space-y-1">
          <p className="font-medium text-dashboard-heading">Last sign-in</p>
          <p className="text-dashboard-muted">
            {new Date(last.created_at).toLocaleString()}
          </p>
          <p>
            <span className="text-dashboard-muted">IP:</span>{" "}
            {last.ip_address ?? "—"}
          </p>
          <p>
            <span className="text-dashboard-muted">Device:</span>{" "}
            {[last.platform, last.device_model].filter(Boolean).join(" · ") ||
              "—"}
          </p>
          {last.geo_location && (
            <p>
              <span className="text-dashboard-muted">Location:</span>{" "}
              {last.geo_location}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-dashboard-muted">No successful sign-in recorded yet.</p>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium text-dashboard-heading">IP policy</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name={`ip-mode-${admin.id}`}
              checked={mode === "any"}
              disabled={!canManage}
              onChange={() => setMode("any")}
            />
            Allow anywhere
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name={`ip-mode-${admin.id}`}
              checked={mode === "allowlist"}
              disabled={!canManage}
              onChange={() => setMode("allowlist")}
            />
            Restricted to listed IPs
          </label>
        </div>
      </div>

      {mode === "allowlist" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {ips.map((ip) => (
              <span
                key={ip}
                className="inline-flex items-center gap-1 rounded-full bg-dashboard-surface border border-dashboard-border/60 px-2.5 py-0.5 text-xs font-mono"
              >
                {ip}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => removeIp(ip)}
                    className="text-dashboard-muted hover:text-red-600"
                    aria-label={`Remove ${ip}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
            {ips.length === 0 && (
              <span className="text-xs text-dashboard-muted">
                No IPs configured — sign-in will be blocked until you add one.
              </span>
            )}
          </div>

          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="Add IP address"
                className="rounded-lg border border-dashboard-border/60 bg-dashboard-surface px-2.5 py-1.5 text-xs font-mono min-w-[140px]"
              />
              <button
                type="button"
                onClick={() => {
                  addIp(newIp);
                  setNewIp("");
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-dashboard-border/60 px-2.5 py-1.5 text-xs hover:bg-dashboard-surface"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
              {last?.ip_address && !ips.includes(last.ip_address) && (
                <button
                  type="button"
                  onClick={addLastIp}
                  className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs text-orange-800 hover:bg-orange-100"
                >
                  Add last IP ({last.ip_address})
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {canManage && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || !isDirty}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            Save policy
          </button>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}

function ipsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((ip) => setB.has(ip));
}
