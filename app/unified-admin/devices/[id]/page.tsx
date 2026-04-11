"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  MonitorSmartphone,
  ShieldBan,
  ShieldCheck,
  Trash2,
  Wifi,
  WifiOff,
  ShieldAlert,
  RefreshCw,
  Smartphone,
  User,
  MapPin,
  Globe,
  Calendar,
  Key,
  Bell,
} from "lucide-react";
import { adminDevicesApi } from "@/services/admin/devices-api";
import type { AdminDeviceDetail } from "@/types/admin/devices";

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-dashboard-border/20 last:border-0">
      <Icon className="h-4 w-4 text-dashboard-muted mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-dashboard-muted">{label}</p>
        <p className={`text-sm text-dashboard-heading ${mono ? "font-mono text-[12px] break-all" : ""}`}>{value || "—"}</p>
      </div>
    </div>
  );
}

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [device, setDevice] = useState<AdminDeviceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"suspend" | "reactivate" | "remove" | null>(null);

  const fetchDevice = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminDevicesApi.getDevice(id);
      setDevice(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load device");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDevice(); }, [fetchDevice]);

  const handleAction = async (type: "suspend" | "reactivate" | "remove") => {
    setActionLoading(true);
    setError(null);
    try {
      if (type === "suspend") await adminDevicesApi.suspend(id);
      else if (type === "reactivate") await adminDevicesApi.reactivate(id);
      else { await adminDevicesApi.remove(id); router.push("/unified-admin/devices"); return; }
      fetchDevice();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-dashboard-muted" />
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="min-h-screen bg-dashboard-bg p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error || "Device not found"}</div>
        <Link href="/unified-admin/devices" className="mt-4 inline-flex items-center gap-2 text-sm text-brand-bg-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Back to devices</Link>
      </div>
    );
  }

  const userName = [device.user.first_name, device.user.last_name].filter(Boolean).join(" ") || device.user.email;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/unified-admin/devices" className="p-1.5 rounded-lg hover:bg-dashboard-bg transition-colors">
              <ArrowLeft className="h-4 w-4 text-dashboard-muted" />
            </Link>
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <MonitorSmartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-dashboard-heading">{device.device_model || device.device_name || "Unknown Device"}</h1>
              <p className="text-xs text-dashboard-muted">{device.platform === "ios" ? "iOS" : "Android"} — {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={fetchDevice} disabled={loading} className="p-2 rounded-lg border border-dashboard-border/60 hover:bg-dashboard-bg text-dashboard-muted"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /></button>
            {device.is_restricted ? (
              <button type="button" onClick={() => setConfirmAction("reactivate")} disabled={actionLoading} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"><ShieldCheck className="h-3.5 w-3.5" /> Reactivate</button>
            ) : (
              <button type="button" onClick={() => setConfirmAction("suspend")} disabled={actionLoading} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"><ShieldBan className="h-3.5 w-3.5" /> Suspend</button>
            )}
            <button type="button" onClick={() => setConfirmAction("remove")} disabled={actionLoading} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
          </div>
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6 lg:px-8 space-y-4">
        {/* Status Banner */}
        <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${device.is_restricted ? "bg-red-50 border border-red-200" : !device.is_active ? "bg-slate-50 border border-slate-200" : "bg-emerald-50 border border-emerald-200"}`}>
          {device.is_restricted ? <ShieldAlert className="h-5 w-5 text-red-600" /> : device.is_active ? <Wifi className="h-5 w-5 text-emerald-600" /> : <WifiOff className="h-5 w-5 text-slate-500" />}
          <div>
            <p className={`text-sm font-semibold ${device.is_restricted ? "text-red-800" : device.is_active ? "text-emerald-800" : "text-slate-700"}`}>
              {device.is_restricted ? "Device Restricted" : device.is_active ? "Device Active" : "Device Inactive"}
            </p>
            {device.restricted_at && <p className="text-xs text-red-600">Restricted on {formatDateTime(device.restricted_at)}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Device Info */}
          <div className="bg-dashboard-surface border border-dashboard-border/60 rounded-xl p-4">
            <h2 className="text-sm font-bold text-dashboard-heading mb-3 flex items-center gap-2">
              <Smartphone className="h-4 w-4" /> Device Information
            </h2>
            <InfoRow icon={MonitorSmartphone} label="Device Model" value={device.device_model} />
            <InfoRow icon={Smartphone} label="Device Name" value={device.device_name} />
            <InfoRow icon={Globe} label="Platform" value={device.platform === "ios" ? "iOS" : "Android"} />
            <InfoRow icon={Globe} label="OS" value={`${device.os_name ?? "—"} ${device.os_version ?? ""}`} />
            <InfoRow icon={Key} label="App Version" value={device.app_version} />
            <InfoRow icon={Key} label="Device ID" value={device.device_id} mono />
            <InfoRow icon={Key} label="Device Fingerprint" value={device.device_fingerprint} mono />
            <InfoRow icon={Globe} label="Last IP Address" value={device.last_ip_address} mono />
            <InfoRow icon={MapPin} label="Last Location" value={device.last_location} />
          </div>

          {/* User Info */}
          <div className="bg-dashboard-surface border border-dashboard-border/60 rounded-xl p-4">
            <h2 className="text-sm font-bold text-dashboard-heading mb-3 flex items-center gap-2">
              <User className="h-4 w-4" /> User Information
            </h2>
            <InfoRow icon={User} label="Name" value={userName} />
            <InfoRow icon={Globe} label="Email" value={device.user.email} />
            <InfoRow icon={Key} label="User ID" value={device.user.id} mono />
            <InfoRow icon={ShieldCheck} label="Role" value={device.user.role} />
            <InfoRow icon={ShieldAlert} label="Account Status" value={device.user.account_status} />
            <InfoRow icon={Calendar} label="User Joined" value={formatDate(device.user.createdAt)} />
            <div className="mt-3">
              <Link href={`/unified-admin/users/${device.user.id}`} className="text-xs font-semibold text-brand-bg-primary hover:underline">
                View full user profile →
              </Link>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-dashboard-surface border border-dashboard-border/60 rounded-xl p-4">
          <h2 className="text-sm font-bold text-dashboard-heading mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Activity Timeline
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div><p className="text-dashboard-muted">First Seen</p><p className="font-semibold text-dashboard-heading mt-0.5">{formatDateTime(device.first_seen_at)}</p></div>
            <div><p className="text-dashboard-muted">Last Seen</p><p className="font-semibold text-dashboard-heading mt-0.5">{formatDateTime(device.last_seen_at)}</p></div>
            <div><p className="text-dashboard-muted">Created</p><p className="font-semibold text-dashboard-heading mt-0.5">{formatDateTime(device.createdAt)}</p></div>
            <div><p className="text-dashboard-muted">Updated</p><p className="font-semibold text-dashboard-heading mt-0.5">{formatDateTime(device.updatedAt)}</p></div>
          </div>
        </div>

        {/* Push Tokens */}
        {device.user.deviceTokens && device.user.deviceTokens.length > 0 && (
          <div className="bg-dashboard-surface border border-dashboard-border/60 rounded-xl p-4">
            <h2 className="text-sm font-bold text-dashboard-heading mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4" /> Push Notification Tokens ({device.user.deviceTokens.length})
            </h2>
            <div className="space-y-2">
              {device.user.deviceTokens.map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-dashboard-bg rounded-lg px-3 py-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[11px] text-dashboard-heading truncate">{t.token.slice(0, 50)}...</p>
                    <p className="text-dashboard-muted mt-0.5">{t.platform === "ios" ? "iOS" : "Android"} · v{t.app_version ?? "?"} · Updated {formatDate(t.updatedAt)}</p>
                  </div>
                  <span className={`ml-3 inline-flex items-center gap-1 text-[10px] font-semibold ${t.is_active ? "text-emerald-600" : "text-slate-500"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${t.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {t.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmAction(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900">
              {confirmAction === "suspend" ? "Suspend Device" : confirmAction === "reactivate" ? "Reactivate Device" : "Remove Device"}
            </h3>
            <p className="text-sm text-slate-600">
              {confirmAction === "suspend" ? "This will restrict the device and prevent it from being used."
                : confirmAction === "reactivate" ? "This will lift the restriction and allow the device to be used again."
                  : "This will permanently delete the device record. This cannot be undone."}
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button type="button" onClick={() => setConfirmAction(null)} className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Cancel</button>
              <button
                type="button"
                onClick={() => handleAction(confirmAction)}
                disabled={actionLoading}
                className={`px-3 py-2 text-xs font-semibold rounded-lg text-white disabled:opacity-50 ${confirmAction === "reactivate" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {actionLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
