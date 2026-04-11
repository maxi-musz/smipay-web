"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { BellRing, RefreshCw, Plus, Mail, Smartphone, Send, KeyRound } from "lucide-react";
import { useAdminNotifications } from "@/hooks/admin/useAdminNotifications";
import { adminNotificationsApi } from "@/services/admin/notifications-api";
import { adminPushBroadcastsApi } from "@/services/admin/push-broadcasts-api";
import { NOTIFICATION_CAMPAIGN_STATUSES } from "@/types/admin/notifications";
import { PUSH_BROADCAST_STATUSES } from "@/types/admin/push-broadcasts";
import type { PushBroadcast, PushBroadcastFilters, PushBroadcastListMeta } from "@/types/admin/push-broadcasts";
import { NotificationsSkeleton } from "./_components/NotificationsSkeleton";
import { NotificationsTable } from "./_components/NotificationsTable";
import { NotificationsPagination } from "./_components/NotificationsPagination";
import { PushBroadcastsTable } from "./_components/PushBroadcastsTable";
import { DeviceTokensPanel } from "./_components/DeviceTokensPanel";
import { useAdminDeviceTokensStore } from "@/store/admin/admin-device-tokens-store";

type Tab = "email" | "push";
type PushSubTab = "broadcasts" | "tokens";

const PUSH_LIST_STALE_MS = 90_000;

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("email");

  // ─── Email campaigns (existing) ────────────────────────────
  const {
    campaigns,
    rawCampaigns,
    meta,
    filters,
    isLoading,
    error,
    updateFilters,
    setPage,
    refetch,
    search,
    setSearch,
  } = useAdminNotifications();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const hasSendingCampaign = useMemo(
    () => rawCampaigns.some((c) => c.status === "sending"),
    [rawCampaigns],
  );

  useEffect(() => {
    if (!hasSendingCampaign || activeTab !== "email") return;
    const id = setInterval(() => refetch(), 6000);
    return () => clearInterval(id);
  }, [hasSendingCampaign, refetch, activeTab]);

  const handleCancel = async (id: string) => {
    setActionError(null);
    setActionLoadingId(id);
    try {
      await adminNotificationsApi.cancelCampaign(id);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to cancel campaign");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResendFailed = async (id: string) => {
    setActionError(null);
    setActionLoadingId(id);
    try {
      await adminNotificationsApi.resendFailed(id);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to resend failed deliveries");
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── Push broadcasts ──────────────────────────────────────
  const [pushBroadcasts, setPushBroadcasts] = useState<PushBroadcast[]>([]);
  const [pushMeta, setPushMeta] = useState<PushBroadcastListMeta | null>(null);
  const [pushFilters, setPushFilters] = useState<PushBroadcastFilters>({ page: 1, limit: 20, status: "" });
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushSearch, setPushSearch] = useState("");
  const [pushActionLoadingId, setPushActionLoadingId] = useState<string | null>(null);
  const [pushActionError, setPushActionError] = useState<string | null>(null);
  const [pushSubTab, setPushSubTab] = useState<PushSubTab>("broadcasts");

  const deviceTokensLoading = useAdminDeviceTokensStore((s) => s.isLoading);

  const pushListCacheRef = useRef<{ key: string; fetchedAt: number } | null>(null);

  const fetchPushBroadcasts = useCallback(
    async (options?: { force?: boolean }) => {
      const filterKey = `${pushFilters.page}|${pushFilters.status}`;
      const now = Date.now();
      if (
        !options?.force &&
        pushListCacheRef.current?.key === filterKey &&
        now - pushListCacheRef.current.fetchedAt < PUSH_LIST_STALE_MS
      ) {
        return;
      }
      setPushLoading(true);
      setPushError(null);
      try {
        const res = await adminPushBroadcastsApi.listBroadcasts(pushFilters);
        setPushBroadcasts(res.data.broadcasts ?? []);
        setPushMeta({
          total: res.data.total,
          page: res.data.page,
          limit: res.data.limit,
          pages: res.data.pages,
        });
        pushListCacheRef.current = { key: filterKey, fetchedAt: Date.now() };
      } catch (err) {
        setPushError(err instanceof Error ? err.message : "Failed to load push broadcasts");
      } finally {
        setPushLoading(false);
      }
    },
    [pushFilters],
  );

  useEffect(() => {
    if (activeTab !== "push") return;
    void fetchPushBroadcasts();
  }, [activeTab, fetchPushBroadcasts]);

  const hasSendingBroadcast = useMemo(
    () => pushBroadcasts.some((b) => b.status === "sending"),
    [pushBroadcasts],
  );

  useEffect(() => {
    if (!hasSendingBroadcast || activeTab !== "push") return;
    const id = setInterval(() => void fetchPushBroadcasts({ force: true }), 6000);
    return () => clearInterval(id);
  }, [hasSendingBroadcast, activeTab, fetchPushBroadcasts]);

  const filteredPushBroadcasts = useMemo(() => {
    const q = pushSearch.trim().toLowerCase();
    if (!q) return pushBroadcasts;
    return pushBroadcasts.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.body.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q),
    );
  }, [pushBroadcasts, pushSearch]);

  const handlePushCancel = async (id: string) => {
    setPushActionError(null);
    setPushActionLoadingId(id);
    try {
      await adminPushBroadcastsApi.cancelBroadcast(id);
      void fetchPushBroadcasts({ force: true });
    } catch (err) {
      setPushActionError(err instanceof Error ? err.message : "Failed to cancel broadcast");
    } finally {
      setPushActionLoadingId(null);
    }
  };

  const handlePushResendFailed = async (id: string) => {
    setPushActionError(null);
    setPushActionLoadingId(id);
    try {
      await adminPushBroadcastsApi.resendFailed(id);
      void fetchPushBroadcasts({ force: true });
    } catch (err) {
      setPushActionError(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setPushActionLoadingId(null);
    }
  };

  const handleHeaderRefresh = () => {
    if (activeTab === "email") {
      void refetch();
      return;
    }
    if (pushSubTab === "broadcasts") {
      void fetchPushBroadcasts({ force: true });
      return;
    }
    void useAdminDeviceTokensStore.getState().refreshAll(true);
  };

  const headerRefreshLoading =
    activeTab === "email"
      ? isLoading
      : pushSubTab === "broadcasts"
        ? pushLoading
        : deviceTokensLoading;

  if (activeTab === "email" && isLoading && !meta) return <NotificationsSkeleton />;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <BellRing className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-dashboard-heading">Notifications</h1>
              <p className="text-xs text-dashboard-muted">
                Email campaigns & push broadcasts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleHeaderRefresh}
              disabled={headerRefreshLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${headerRefreshLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            {activeTab === "email" && (
              <Link
                href="/unified-admin/notifications/new"
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:bg-brand-bg-primary/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                New Campaign
              </Link>
            )}
            {activeTab === "push" && pushSubTab === "broadcasts" && (
              <Link
                href="/unified-admin/notifications/push/new"
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:bg-brand-bg-primary/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                New Push Broadcast
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 px-4 sm:px-6 lg:px-8 border-t border-dashboard-border/30">
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`relative px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === "email"
                ? "text-brand-bg-primary"
                : "text-dashboard-muted hover:text-dashboard-heading"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Email Campaigns
            </span>
            {activeTab === "email" && (
              <motion.div
                layoutId="notifications-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-bg-primary rounded-full"
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("push")}
            className={`relative px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === "push"
                ? "text-brand-bg-primary"
                : "text-dashboard-muted hover:text-dashboard-heading"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5" />
              Push Broadcasts
            </span>
            {activeTab === "push" && (
              <motion.div
                layoutId="notifications-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-bg-primary rounded-full"
              />
            )}
          </button>
        </div>
      </header>

      {/* ─── Email campaigns tab ─── */}
      {activeTab === "email" && (
        <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-3">
          {(error || actionError) && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {actionError || error}
            </div>
          )}

          <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-3">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, subject or campaign ID..."
                className="h-10 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
              />
              <select
                value={filters.status}
                onChange={(e) => updateFilters({ status: e.target.value })}
                className="h-10 min-w-[180px] rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
              >
                <option value="">All statuses</option>
                {NOTIFICATION_CAMPAIGN_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <NotificationsTable
            campaigns={campaigns}
            actionLoadingId={actionLoadingId}
            onCancel={handleCancel}
            onResendFailed={handleResendFailed}
          />

          {meta && (
            <NotificationsPagination
              page={meta.page}
              pages={meta.pages}
              onPageChange={setPage}
            />
          )}
        </div>
      )}

      {/* ─── Push broadcasts tab ─── */}
      {activeTab === "push" && (
        <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 space-y-3">
          <div className="flex flex-wrap gap-1 border-b border-dashboard-border/40 pb-0">
            <button
              type="button"
              onClick={() => setPushSubTab("broadcasts")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border border-b-0 transition-colors ${
                pushSubTab === "broadcasts"
                  ? "border-dashboard-border/60 bg-dashboard-surface text-brand-bg-primary"
                  : "border-transparent text-dashboard-muted hover:text-dashboard-heading"
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              Broadcasts
            </button>
            <button
              type="button"
              onClick={() => setPushSubTab("tokens")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border border-b-0 transition-colors ${
                pushSubTab === "tokens"
                  ? "border-dashboard-border/60 bg-dashboard-surface text-brand-bg-primary"
                  : "border-transparent text-dashboard-muted hover:text-dashboard-heading"
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Push tokens (DeviceToken)
            </button>
          </div>

          {pushSubTab === "broadcasts" && (
            <>
              {(pushError || pushActionError) && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  {pushActionError || pushError}
                </div>
              )}

              <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-3">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                  <input
                    value={pushSearch}
                    onChange={(e) => setPushSearch(e.target.value)}
                    placeholder="Search by title, body or broadcast ID..."
                    className="h-10 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                  />
                  <select
                    value={pushFilters.status}
                    onChange={(e) => setPushFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
                    className="h-10 min-w-[180px] rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
                  >
                    <option value="">All statuses</option>
                    {PUSH_BROADCAST_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <PushBroadcastsTable
                broadcasts={filteredPushBroadcasts}
                actionLoadingId={pushActionLoadingId}
                onCancel={handlePushCancel}
                onResendFailed={handlePushResendFailed}
              />

              {pushMeta && pushMeta.pages > 1 && (
                <NotificationsPagination
                  page={pushMeta.page}
                  pages={pushMeta.pages}
                  onPageChange={(p) => setPushFilters((f) => ({ ...f, page: p }))}
                />
              )}
            </>
          )}

          {pushSubTab === "tokens" && (
            <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-3 sm:p-4">
              <p className="text-xs text-dashboard-muted mb-3">
                Expo push tokens from the DeviceToken model (active/inactive, platform breakdown). For session/device
                fingerprinting, use{" "}
                <Link href="/unified-admin/devices" className="text-brand-bg-primary font-medium hover:underline">
                  Device Management
                </Link>
                .
              </p>
              <DeviceTokensPanel />
            </div>
          )}
        </div>
      )}

    </div>
  );
}
