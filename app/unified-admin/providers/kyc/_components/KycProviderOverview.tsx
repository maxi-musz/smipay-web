"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  RefreshCw,
  Loader2,
  Fingerprint,
  Plug,
} from "lucide-react";
import { adminBvnConfigApi } from "@/services/admin/bvn-config-api";
import { usePermissions } from "@/hooks/admin/useAdminPermissions";

interface Analytics {
  total: number;
  verified: number;
  failed: number;
  pending: number;
  success_rate: number;
  paid_lookups: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Wallet;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-4">
      <div className="flex items-center gap-2 text-dashboard-muted">
        <Icon className="h-4 w-4" />
        <p className="text-xs">{label}</p>
      </div>
      <p className="mt-1 text-xl font-bold text-dashboard-heading">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-dashboard-muted">{sub}</p>}
    </div>
  );
}

/**
 * The provider overview for KYC — mirrors the SMS/Email pages: live wallet
 * balance, verification analytics (from our own data), and a connection test.
 * So you never have to open the Dojah dashboard to see health.
 */
export function KycProviderOverview({
  providerConfigured,
}: {
  providerConfigured: boolean;
}) {
  const { can, isSuperAdmin } = usePermissions();
  const canTest = isSuperAdmin || can("kyc-providers", "read");

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [balance, setBalance] = useState<{ balance: number | null; currency: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        adminBvnConfigApi.getAnalytics(),
        providerConfigured
          ? adminBvnConfigApi.getBalance()
          : Promise.resolve(null),
      ]);
      if (a.success && a.data) setAnalytics(a.data);
      if (b && b.data) setBalance({ balance: b.data.balance, currency: b.data.currency });
    } catch {
      /* soft-fail; tiles show placeholders */
    } finally {
      setLoading(false);
    }
  }, [providerConfigured]);

  useEffect(() => {
    void load();
  }, [load]);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await adminBvnConfigApi.testConnection();
      setTestResult(
        res.data?.ok
          ? `Connected${res.data.balance != null ? ` · balance ${res.data.currency ?? ""} ${res.data.balance}` : ""}`
          : res.message || "Connection failed",
      );
      if (res.data?.ok) void load();
    } catch (e) {
      setTestResult(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setTesting(false);
    }
  };

  const balanceDisplay =
    balance?.balance != null
      ? `${balance.currency} ${balance.balance.toLocaleString()}`
      : "—";

  return (
    <div className="space-y-4">
      {/* Active provider card */}
      <section className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-bg-primary">
              <Fingerprint className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-dashboard-heading">Dojah</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    providerConfigured
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {providerConfigured ? "Active" : "Not configured"}
                </span>
              </div>
              <p className="text-xs text-dashboard-muted">
                Identity / BVN verification provider
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashboard-border/60 px-3 py-2 text-xs font-medium text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void runTest()}
              disabled={!canTest || testing || !providerConfigured}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-bg-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              {testing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plug className="h-3.5 w-3.5" />
              )}
              Test connection
            </button>
          </div>
        </div>
        {testResult && (
          <p className="mt-3 text-xs text-dashboard-muted">{testResult}</p>
        )}
      </section>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Provider balance"
          value={loading ? "…" : balanceDisplay}
          sub={providerConfigured ? "Live from Dojah" : "Configure to see"}
        />
        <StatCard
          icon={CheckCircle2}
          label="Verified"
          value={loading ? "…" : (analytics?.verified ?? 0).toLocaleString()}
          sub={analytics ? `${analytics.success_rate}% success` : undefined}
        />
        <StatCard
          icon={XCircle}
          label="Failed"
          value={loading ? "…" : (analytics?.failed ?? 0).toLocaleString()}
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={loading ? "…" : (analytics?.pending ?? 0).toLocaleString()}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Coins}
          label="Paid lookups"
          value={loading ? "…" : (analytics?.paid_lookups ?? 0).toLocaleString()}
          sub="Cost proxy"
        />
        <StatCard
          icon={Fingerprint}
          label="Total attempts"
          value={loading ? "…" : (analytics?.total ?? 0).toLocaleString()}
        />
      </div>
    </div>
  );
}
