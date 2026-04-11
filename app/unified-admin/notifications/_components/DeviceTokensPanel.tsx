"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { motion } from "motion/react";
import {
  Smartphone,
  Monitor,
  ChevronDown,
  ChevronUp,
  Search,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { adminPushBroadcastsApi } from "@/services/admin/push-broadcasts-api";
import type {
  DeviceToken,
  DeviceTokenFilters,
  DeviceTokenStats,
} from "@/types/admin/push-broadcasts";
import { NotificationsPagination } from "./NotificationsPagination";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="bg-dashboard-surface border border-dashboard-border/60 rounded-xl p-3 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-lg font-bold text-dashboard-heading tabular-nums">{value.toLocaleString()}</p>
        <p className="text-[11px] text-dashboard-muted">{label}</p>
      </div>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: "ios" | "android" }) {
  const isIos = platform === "ios";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
        isIos
          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
          : "bg-green-50 text-green-700 ring-1 ring-green-200"
      }`}
    >
      {isIos ? "iOS" : "Android"}
    </span>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      <span className={`text-[11px] font-medium ${active ? "text-emerald-700" : "text-slate-500"}`}>
        {active ? "Active" : "Inactive"}
      </span>
    </span>
  );
}

function ExpandedDetails({ token }: { token: DeviceToken }) {
  return (
    <motion.tr
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <td colSpan={7} className="px-4 pb-3 pt-0">
        <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-dashboard-bg rounded-lg p-3 text-xs">
          <div>
            <p className="text-dashboard-muted mb-0.5">Push Token</p>
            <p className="font-mono text-dashboard-heading break-all text-[11px] leading-relaxed">
              {token.token.slice(0, 40)}...
            </p>
          </div>
          <div>
            <p className="text-dashboard-muted mb-0.5">Device ID</p>
            <p className="font-mono text-dashboard-heading text-[11px]">
              {token.device_id || "—"}
            </p>
          </div>
          <div>
            <p className="text-dashboard-muted mb-0.5">App Version</p>
            <p className="text-dashboard-heading">{token.app_version || "—"}</p>
          </div>
          <div>
            <p className="text-dashboard-muted mb-0.5">User Email</p>
            <p className="text-dashboard-heading">{token.user.email}</p>
          </div>
          <div>
            <p className="text-dashboard-muted mb-0.5">User Role</p>
            <p className="text-dashboard-heading capitalize">{token.user.role}</p>
          </div>
          <div>
            <p className="text-dashboard-muted mb-0.5">Account Status</p>
            <p className="text-dashboard-heading capitalize">{token.user.account_status}</p>
          </div>
          <div>
            <p className="text-dashboard-muted mb-0.5">Registered</p>
            <p className="text-dashboard-heading">
              {new Date(token.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-dashboard-muted mb-0.5">Last Updated</p>
            <p className="text-dashboard-heading">
              {new Date(token.updatedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div>
            <p className="text-dashboard-muted mb-0.5">User Joined</p>
            <p className="text-dashboard-heading">
              {new Date(token.user.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

export function DeviceTokensPanel() {
  const [tokens, setTokens] = useState<DeviceToken[]>([]);
  const [stats, setStats] = useState<DeviceTokenStats | null>(null);
  const [filters, setFilters] = useState<DeviceTokenFilters>({
    page: 1,
    limit: 20,
    platform: "",
    is_active: "",
    search: "",
  });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminPushBroadcastsApi.listDeviceTokens(filters);
      setTokens(res.data.tokens ?? []);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load device tokens");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminPushBroadcastsApi.getDeviceTokenStats();
      setStats(res.data);
    } catch {
      // stats are non-critical
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput.trim(), page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const userName = (t: DeviceToken) => {
    const parts = [t.user.first_name, t.user.last_name].filter(Boolean);
    return parts.length ? parts.join(" ") : t.user.email;
  };

  return (
    <div className="space-y-3">
      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <StatCard label="Total Tokens" value={stats.total} icon={Smartphone} color="bg-slate-600" />
          <StatCard label="Active" value={stats.active} icon={Wifi} color="bg-emerald-600" />
          <StatCard label="Inactive" value={stats.inactive} icon={WifiOff} color="bg-slate-400" />
          <StatCard label="iOS" value={stats.ios} icon={Monitor} color="bg-blue-600" />
          <StatCard label="Android" value={stats.android} icon={Smartphone} color="bg-green-600" />
          <StatCard label="Unique Users" value={stats.unique_users} icon={Users} color="bg-orange-600" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-3">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dashboard-muted" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email or device ID..."
              className="h-10 w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
            />
          </div>
          <select
            value={filters.platform}
            onChange={(e) => setFilters((f) => ({ ...f, platform: e.target.value, page: 1 }))}
            className="h-10 min-w-[140px] rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
          >
            <option value="">All platforms</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
          <select
            value={filters.is_active}
            onChange={(e) => setFilters((f) => ({ ...f, is_active: e.target.value, page: 1 }))}
            className="h-10 min-w-[140px] rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-dashboard-border/40 bg-dashboard-bg/50">
                <th className="px-4 py-2.5 text-left font-semibold text-dashboard-muted w-8" />
                <th className="px-4 py-2.5 text-left font-semibold text-dashboard-muted uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-dashboard-muted uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-dashboard-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-dashboard-muted uppercase tracking-wider">
                  App Version
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-dashboard-muted uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && tokens.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-dashboard-border/20">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 bg-dashboard-bg rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : tokens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-dashboard-muted">
                    No device tokens found.
                  </td>
                </tr>
              ) : (
                tokens.map((token) => {
                  const isExpanded = expandedId === token.id;
                  return (
                    <Fragment key={token.id}>
                      <tr
                        className={`border-b border-dashboard-border/20 cursor-pointer transition-colors hover:bg-dashboard-bg/50 ${
                          isExpanded ? "bg-dashboard-bg/30" : ""
                        }`}
                        onClick={() => toggleExpand(token.id)}
                      >
                        <td className="px-4 py-2.5 text-dashboard-muted w-8">
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <div>
                            <p className="font-semibold text-dashboard-heading">{userName(token)}</p>
                            <p className="text-[11px] text-dashboard-muted">{token.user.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <PlatformBadge platform={token.platform} />
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusDot active={token.is_active} />
                        </td>
                        <td className="px-4 py-2.5 text-dashboard-heading">
                          {token.app_version || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-dashboard-muted whitespace-nowrap">
                          {new Date(token.updatedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                      {isExpanded && <ExpandedDetails token={token} />}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-xs text-dashboard-muted">
          <span>
            Showing {((filters.page - 1) * filters.limit) + 1}–{Math.min(filters.page * filters.limit, total)} of{" "}
            {total.toLocaleString()} tokens
          </span>
          <NotificationsPagination
            page={filters.page}
            pages={pages}
            onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
          />
        </div>
      )}
    </div>
  );
}
