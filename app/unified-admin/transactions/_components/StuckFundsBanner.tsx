"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, ChevronDown, ShieldCheck, UserCog } from "lucide-react";
import { adminTransactionsApi } from "@/services/admin/transactions-api";
import type { StuckFundsResponse } from "@/types/admin/transactions";

type Exposure = StuckFundsResponse["data"];

function naira(value: number): string {
  return `₦${Number(value ?? 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function ageLabel(hours: number): string {
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/**
 * Utility purchases that debited a customer but never reached a terminal state
 * — the money is still held. Silence here is what let a classification bug run
 * for four months, so the exposure is shown even when it is zero-adjacent.
 */
export function StuckFundsBanner() {
  const [data, setData] = useState<Exposure | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await adminTransactionsApi.getStuckFunds(60);
      if (res.success) setData(res.data);
    } catch {
      // Non-critical panel — never block the transactions page on it.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !data) return null;

  if (data.count === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
        <p className="text-xs font-medium text-emerald-800">
          No customer funds held in unresolved utility purchases.
        </p>
      </div>
    );
  }

  const severe = data.by_age.overSevenDays > 0 || data.total_held >= 10000;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${
        severe ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <AlertTriangle
          className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${
            severe ? "text-red-600" : "text-amber-600"
          }`}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-bold ${
              severe ? "text-red-800" : "text-amber-900"
            }`}
          >
            {naira(data.total_held)} of customer money held in{" "}
            {data.count.toLocaleString()} unresolved{" "}
            {data.count === 1 ? "purchase" : "purchases"}
          </p>
          <p
            className={`text-xs mt-1 leading-relaxed ${
              severe ? "text-red-700" : "text-amber-800"
            }`}
          >
            {data.affected_users.toLocaleString()}{" "}
            {data.affected_users === 1 ? "customer" : "customers"} debited with
            no delivery confirmed.{" "}
            {data.by_age.overSevenDays > 0
              ? `${data.by_age.overSevenDays} older than 7 days. `
              : ""}
            {data.awaiting_manual_reversal > 0
              ? `${data.awaiting_manual_reversal} escalated for manual reversal. `
              : ""}
            The hourly sweep resolves these automatically; anything left here
            needs an admin.
          </p>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold ${
              severe
                ? "text-red-700 hover:text-red-900"
                : "text-amber-800 hover:text-amber-950"
            }`}
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
            {expanded ? "Hide" : "Show"} affected transactions
          </button>

          {expanded ? (
            <div className="mt-3 overflow-x-auto rounded-lg border border-white/60 bg-white/70">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-left text-dashboard-muted">
                    <th className="px-3 py-2 font-semibold">Reference</th>
                    <th className="px-3 py-2 font-semibold">Customer</th>
                    <th className="px-3 py-2 font-semibold">Type</th>
                    <th className="px-3 py-2 font-semibold text-right">Held</th>
                    <th className="px-3 py-2 font-semibold text-right">Age</th>
                    <th className="px-3 py-2 font-semibold">Last error</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.slice(0, 50).map((item) => (
                    <tr
                      key={item.transaction_id}
                      className="border-t border-dashboard-border/20 align-top"
                    >
                      <td className="px-3 py-2 font-mono text-[10px] text-dashboard-heading">
                        {item.transaction_reference ?? "—"}
                        {item.awaiting_manual_reversal ? (
                          <span
                            className="ml-1.5 inline-flex items-center gap-1 text-[9px] font-semibold text-violet-700"
                            title={
                              item.awaiting_manual_reversal_reason ?? undefined
                            }
                          >
                            <UserCog className="h-3 w-3" />
                            needs admin
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-dashboard-heading">
                        {item.customer ?? "—"}
                      </td>
                      <td className="px-3 py-2 capitalize text-dashboard-muted">
                        {item.transaction_type}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-dashboard-heading">
                        {naira(item.wallet_held + item.cashback_held)}
                      </td>
                      <td className="px-3 py-2 text-right text-dashboard-muted">
                        {ageLabel(item.age_hours)}
                      </td>
                      <td className="px-3 py-2 text-dashboard-muted max-w-[220px] truncate">
                        {item.last_provider_error ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.items.length > 50 ? (
                <p className="px-3 py-2 text-[10px] text-dashboard-muted">
                  Showing 50 of {data.items.length}.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
