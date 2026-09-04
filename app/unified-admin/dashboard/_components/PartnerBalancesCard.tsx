"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Fuel,
  MessageSquare,
  Wallet,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { adminRewardsReportApi } from "@/services/admin/rewards-report-api";
import type {
  PartnerBalance,
  PartnerBalances,
} from "@/types/admin/rewards-report";

const naira = (n: number) =>
  `₦${Number(n ?? 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const ICONS: Record<string, LucideIcon> = {
  vtpass: Fuel,
  sms: MessageSquare,
};

function PartnerTile({ p }: { p: PartnerBalance }) {
  const Icon = ICONS[p.key] ?? Wallet;
  const ok = p.error == null && p.balance != null;
  const acct = p.funding_account;
  const hasAcct = !!(acct && (acct.account_number || acct.bank_name));
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!acct?.account_number) return;
    try {
      await navigator.clipboard.writeText(acct.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-bg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "var(--quick-action-2-bg)",
              color: "var(--quick-action-2)",
            }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-dashboard-heading truncate">
            {p.label}
          </span>
        </div>
        {ok && (
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${p.stale ? "bg-amber-500" : "bg-emerald-500"}`}
            title={p.stale ? "Last known value" : "Live"}
          />
        )}
      </div>

      <div className="mt-3 text-xl font-bold text-dashboard-heading tabular-nums tracking-tight">
        {ok ? (
          naira(p.balance as number)
        ) : (
          <span className="text-sm text-red-600 font-medium inline-flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Unavailable
          </span>
        )}
      </div>
      <div className="mt-1 text-[11px] text-dashboard-muted">
        {ok
          ? `${p.environment === "sandbox" ? "Sandbox · " : ""}${p.stale ? "cached" : "live"}`
          : (p.error ?? "Could not fetch")}
      </div>

      {hasAcct && (
        <div className="mt-3 pt-3 border-t border-dashboard-border/50">
          <div className="text-[10px] uppercase tracking-wide text-dashboard-muted mb-1">
            Fund via
          </div>
          {acct?.bank_name && (
            <div className="text-xs font-medium text-dashboard-heading">
              {acct.bank_name}
            </div>
          )}
          {acct?.account_number && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-semibold text-dashboard-heading tabular-nums">
                {acct.account_number}
              </span>
              <button
                type="button"
                onClick={copy}
                title="Copy account number"
                className="text-dashboard-muted hover:text-dashboard-heading transition-colors"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}
          {acct?.account_name && (
            <div className="text-[11px] text-dashboard-muted mt-0.5">
              {acct.account_name}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PartnerBalancesCard() {
  const [data, setData] = useState<PartnerBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState<{ type: "ok" | "err"; msg?: string } | null>(
    null,
  );

  const load = useCallback(async (force = false) => {
    setLoading(true);
    if (force) setFlash(null);
    try {
      const d = await adminRewardsReportApi.getPartnerBalances(force);
      setData(d);
      setError("");
      if (force) setFlash({ type: "ok" });
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      if (force) setFlash({ type: "err", msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-dismiss the "Updated" confirmation after a couple of seconds.
  useEffect(() => {
    if (flash?.type === "ok") {
      const t = setTimeout(() => setFlash(null), 2500);
      return () => clearTimeout(t);
    }
  }, [flash]);

  // Auto-refresh at the admin-configured interval (no redeploy to change it).
  const intervalSec = data?.refresh_interval_seconds ?? 300;
  useEffect(() => {
    if (!intervalSec) return;
    const id = setInterval(() => load(false), intervalSec * 1000);
    return () => clearInterval(id);
  }, [intervalSec, load]);

  const updated = data
    ? new Date(data.fetched_at).toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const intervalLabel =
    intervalSec % 60 === 0
      ? `${intervalSec / 60} min`
      : `${intervalSec}s`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-dashboard-heading">
            Partner balances
          </h2>
          <p className="text-xs text-dashboard-muted mt-0.5">
            Live upstream wallet balances
            {updated ? ` · updated ${updated}` : ""}
            {` · auto every ${intervalLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {flash?.type === "ok" && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <Check className="h-3.5 w-3.5" /> Updated
            </span>
          )}
          {flash?.type === "err" && (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 max-w-[160px] truncate"
              title={flash.msg}
            >
              <AlertTriangle className="h-3.5 w-3.5" /> Refresh failed
            </span>
          )}
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading}
            aria-busy={loading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="py-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-dashboard-muted" />
        </div>
      ) : error && !data ? (
        <div className="py-6 text-center text-sm text-red-600">{error}</div>
      ) : (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 transition-opacity duration-200 ${loading ? "opacity-50" : "opacity-100"}`}
          aria-busy={loading}
        >
          {data?.partners.map((p) => (
            <PartnerTile key={p.key} p={p} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
