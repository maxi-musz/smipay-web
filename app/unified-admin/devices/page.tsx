"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  MonitorSmartphone,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  ShieldBan,
  ShieldCheck,
  Trash2,
  Wifi,
  WifiOff,
  Users,
  Smartphone,
  Monitor,
  Eye,
  ShieldAlert,
} from "lucide-react";
import { adminDevicesApi } from "@/services/admin/devices-api";
import type { AdminDevice, DeviceFilters, DeviceStats } from "@/types/admin/devices";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="bg-dashboard-surface border border-dashboard-border/60 rounded-xl p-3 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color}`}><Icon className="h-4 w-4 text-white" /></div>
      <div>
        <p className="text-lg font-bold text-dashboard-heading tabular-nums">{value.toLocaleString()}</p>
        <p className="text-[11px] text-dashboard-muted">{label}</p>
      </div>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: "ios" | "android" }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${platform === "ios" ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "bg-green-50 text-green-700 ring-1 ring-green-200"}`}>
      {platform === "ios" ? "iOS" : "Android"}
    </span>
  );
}

function DeviceStatusBadge({ device }: { device: AdminDevice }) {
  if (device.is_restricted)
    return <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600"><ShieldAlert className="h-3 w-3" /> Restricted</span>;
  if (!device.is_active)
    return <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500"><WifiOff className="h-3 w-3" /> Inactive</span>;
  return <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600"><Wifi className="h-3 w-3" /> Active</span>;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function userName(device: AdminDevice) {
  const parts = [device.user.first_name, device.user.last_name].filter(Boolean);
  return parts.length ? parts.join(" ") : device.user.email;
}

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState<AdminDevice[]>([]);
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [filters, setFilters] = useState<DeviceFilters>({
    page: 1, limit: 20, platform: "", status: "", search: "", os_name: "", sort_by: "last_seen_at", sort_order: "desc",
  });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: "suspend" | "reactivate" | "remove" } | null>(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminDevicesApi.list(filters);
      setDevices(res.data.devices ?? []);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminDevicesApi.stats();
      setStats(res.data);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search: searchInput.trim(), page: 1 })), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleAction = async (id: string, type: "suspend" | "reactivate" | "remove") => {
    setActionLoading(id);
    setError(null);
    try {
      if (type === "suspend") await adminDevicesApi.suspend(id);
      else if (type === "reactivate") await adminDevicesApi.reactivate(id);
      else await adminDevicesApi.remove(id);
      fetchDevices();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleBulkAction = async (type: "suspend" | "reactivate") => {
    if (selected.size === 0) return;
    setActionLoading("bulk");
    setError(null);
    try {
      if (type === "suspend") await adminDevicesApi.bulkSuspend([...selected]);
      else await adminDevicesApi.bulkReactivate([...selected]);
      setSelected(new Set());
      fetchDevices();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === devices.length) setSelected(new Set());
    else setSelected(new Set(devices.map((d) => d.id)));
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header */}
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <MonitorSmartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-dashboard-heading">Device Management</h1>
              <p className="text-xs text-dashboard-muted">Monitor, manage, and control user devices</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { fetchDevices(); fetchStats(); }}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-3">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <StatCard label="Total Devices" value={stats.total} icon={MonitorSmartphone} color="bg-slate-600" />
            <StatCard label="Active" value={stats.active} icon={Wifi} color="bg-emerald-600" />
            <StatCard label="Restricted" value={stats.restricted} icon={ShieldBan} color="bg-red-600" />
            <StatCard label="Inactive" value={stats.inactive} icon={WifiOff} color="bg-slate-400" />
            <StatCard label="iOS" value={stats.ios} icon={Monitor} color="bg-blue-600" />
            <StatCard label="Android" value={stats.android} icon={Smartphone} color="bg-green-600" />
            <StatCard label="Unique Users" value={stats.unique_users} icon={Users} color="bg-orange-600" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Filters */}
        <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dashboard-muted" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by user, device model, IP..."
                className="h-10 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
              />
            </div>
            <select
              value={filters.platform}
              onChange={(e) => setFilters((f) => ({ ...f, platform: e.target.value, page: 1 }))}
              className="h-10 min-w-[130px] rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none"
            >
              <option value="">All platforms</option>
              <option value="ios">iOS</option>
              <option value="android">Android</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
              className="h-10 min-w-[130px] rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="restricted">Restricted</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={filters.sort_by}
              onChange={(e) => setFilters((f) => ({ ...f, sort_by: e.target.value, page: 1 }))}
              className="h-10 min-w-[130px] rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none"
            >
              <option value="last_seen_at">Last Seen</option>
              <option value="first_seen_at">First Seen</option>
              <option value="createdAt">Created</option>
            </select>
          </div>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs"
          >
            <span className="font-semibold text-blue-800">{selected.size} selected</span>
            <button
              type="button"
              onClick={() => handleBulkAction("suspend")}
              disabled={actionLoading === "bulk"}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              <ShieldBan className="h-3 w-3" /> Suspend
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction("reactivate")}
              disabled={actionLoading === "bulk"}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              <ShieldCheck className="h-3 w-3" /> Reactivate
            </button>
            <button type="button" onClick={() => setSelected(new Set())} className="text-blue-700 hover:underline ml-auto">
              Clear
            </button>
          </motion.div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1020px] text-xs">
              <thead>
                <tr className="border-b border-dashboard-border/40 bg-dashboard-bg/50">
                  <th className="px-3 py-2.5 w-8">
                    <input
                      type="checkbox"
                      checked={devices.length > 0 && selected.size === devices.length}
                      onChange={toggleSelectAll}
                      className="rounded border-dashboard-border"
                    />
                  </th>
                  <th className="px-3 py-2.5 w-8" />
                  <th className="px-4 py-2.5 text-left font-medium text-dashboard-muted">User</th>
                  <th className="px-4 py-2.5 text-left font-medium text-dashboard-muted">Device</th>
                  <th className="px-4 py-2.5 text-left font-medium text-dashboard-muted">Platform</th>
                  <th className="px-4 py-2.5 text-left font-medium text-dashboard-muted">OS</th>
                  <th className="px-4 py-2.5 text-left font-medium text-dashboard-muted">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-dashboard-muted">Last Seen</th>
                  <th className="px-4 py-2.5 text-left font-medium text-dashboard-muted">Last IP</th>
                  <th className="px-4 py-2.5 text-right font-medium text-dashboard-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && devices.length === 0
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-dashboard-border/20">
                        {Array.from({ length: 10 }).map((__, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 w-16 bg-dashboard-bg rounded animate-pulse" /></td>
                        ))}
                      </tr>
                    ))
                  : devices.length === 0
                    ? (
                        <tr>
                          <td colSpan={10} className="px-4 py-14 text-center text-sm text-dashboard-muted">No devices found.</td>
                        </tr>
                      )
                    : devices.map((device) => {
                        const isExpanded = expandedId === device.id;
                        return (
                          <Fragment key={device.id}>
                            <tr
                              className={`border-b border-dashboard-border/20 transition-colors hover:bg-dashboard-bg/50 ${isExpanded ? "bg-dashboard-bg/30" : ""}`}
                            >
                              <td className="px-3 py-2.5">
                                <input
                                  type="checkbox"
                                  checked={selected.has(device.id)}
                                  onChange={() => toggleSelect(device.id)}
                                  className="rounded border-dashboard-border"
                                />
                              </td>
                              <td className="px-3 py-2.5 cursor-pointer text-dashboard-muted" onClick={() => setExpandedId(isExpanded ? null : device.id)}>
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </td>
                              <td className="px-4 py-2.5">
                                <Link href={`/unified-admin/users/${device.user_id}`} className="hover:underline">
                                  <p className="font-semibold text-dashboard-heading">{userName(device)}</p>
                                  <p className="text-[11px] text-dashboard-muted">{device.user.email}</p>
                                </Link>
                              </td>
                              <td className="px-4 py-2.5">
                                <p className="text-dashboard-heading">{device.device_model || device.device_name || "—"}</p>
                              </td>
                              <td className="px-4 py-2.5"><PlatformBadge platform={device.platform} /></td>
                              <td className="px-4 py-2.5 text-dashboard-heading whitespace-nowrap">
                                {device.os_name ?? "—"} {device.os_version ?? ""}
                              </td>
                              <td className="px-4 py-2.5"><DeviceStatusBadge device={device} /></td>
                              <td className="px-4 py-2.5 text-dashboard-muted whitespace-nowrap">{formatDate(device.last_seen_at)}</td>
                              <td className="px-4 py-2.5 text-dashboard-muted font-mono text-[11px]">{device.last_ip_address || "—"}</td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Link
                                    href={`/unified-admin/devices/${device.id}`}
                                    className="p-1.5 rounded-lg text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-bg transition-colors"
                                    title="View details"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Link>
                                  {device.is_restricted ? (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmAction({ id: device.id, type: "reactivate" })}
                                      disabled={actionLoading === device.id}
                                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                                      title="Reactivate"
                                    >
                                      <ShieldCheck className="h-3.5 w-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmAction({ id: device.id, type: "suspend" })}
                                      disabled={actionLoading === device.id}
                                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                      title="Suspend"
                                    >
                                      <ShieldBan className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setConfirmAction({ id: device.id, type: "remove" })}
                                    disabled={actionLoading === device.id}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                    title="Remove"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={10} className="px-4 pb-3 pt-0">
                                  <div className="ml-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-dashboard-bg rounded-lg p-3 text-xs">
                                    <div><p className="text-dashboard-muted mb-0.5">Device ID</p><p className="font-mono text-dashboard-heading text-[11px] break-all">{device.device_id}</p></div>
                                    <div><p className="text-dashboard-muted mb-0.5">Device Name</p><p className="text-dashboard-heading">{device.device_name || "—"}</p></div>
                                    <div><p className="text-dashboard-muted mb-0.5">App Version</p><p className="text-dashboard-heading">{device.app_version || "—"}</p></div>
                                    <div><p className="text-dashboard-muted mb-0.5">Last Location</p><p className="text-dashboard-heading">{device.last_location || "—"}</p></div>
                                    <div><p className="text-dashboard-muted mb-0.5">First Seen</p><p className="text-dashboard-heading">{formatDateTime(device.first_seen_at)}</p></div>
                                    <div><p className="text-dashboard-muted mb-0.5">Last Seen</p><p className="text-dashboard-heading">{formatDateTime(device.last_seen_at)}</p></div>
                                    <div><p className="text-dashboard-muted mb-0.5">User Role</p><p className="text-dashboard-heading capitalize">{device.user.role}</p></div>
                                    <div><p className="text-dashboard-muted mb-0.5">Account Status</p><p className="text-dashboard-heading capitalize">{device.user.account_status}</p></div>
                                    {device.restricted_at && (
                                      <div><p className="text-dashboard-muted mb-0.5">Restricted At</p><p className="text-red-600">{formatDateTime(device.restricted_at)}</p></div>
                                    )}
                                    <div><p className="text-dashboard-muted mb-0.5">Current Device</p><p className="text-dashboard-heading">{device.is_current_device ? "Yes" : "No"}</p></div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between text-xs text-dashboard-muted">
            <span>
              Showing {(filters.page - 1) * filters.limit + 1}–{Math.min(filters.page * filters.limit, total)} of {total.toLocaleString()} devices
            </span>
            <div className="flex items-center gap-1">
              <button type="button" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} className="px-2.5 py-1.5 rounded-lg border border-dashboard-border/60 disabled:opacity-40 hover:bg-dashboard-bg transition-colors">Prev</button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                const p = filters.page <= 3 ? i + 1 : filters.page - 2 + i;
                if (p > pages || p < 1) return null;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, page: p }))}
                    className={`px-2.5 py-1.5 rounded-lg border transition-colors ${p === filters.page ? "bg-brand-bg-primary text-white border-brand-bg-primary" : "border-dashboard-border/60 hover:bg-dashboard-bg"}`}
                  >{p}</button>
                );
              })}
              <button type="button" disabled={filters.page >= pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} className="px-2.5 py-1.5 rounded-lg border border-dashboard-border/60 disabled:opacity-40 hover:bg-dashboard-bg transition-colors">Next</button>
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
              {confirmAction.type === "suspend" ? "Suspend Device" : confirmAction.type === "reactivate" ? "Reactivate Device" : "Remove Device"}
            </h3>
            <p className="text-sm text-slate-600">
              {confirmAction.type === "suspend"
                ? "This will restrict the device and prevent it from being used. The user will need admin approval to use this device again."
                : confirmAction.type === "reactivate"
                  ? "This will lift the restriction and allow the device to be used again."
                  : "This will permanently delete the device record. This action cannot be undone."}
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(confirmAction.id, confirmAction.type)}
                disabled={actionLoading === confirmAction.id}
                className={`px-3 py-2 text-xs font-semibold rounded-lg text-white disabled:opacity-50 ${
                  confirmAction.type === "reactivate" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionLoading === confirmAction.id ? "Processing..." : "Confirm"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
