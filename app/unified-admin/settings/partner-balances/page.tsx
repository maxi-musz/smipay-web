"use client";

import { useEffect, useState } from "react";
import { Fuel, MessageSquare, Save, Loader2, Check, Clock } from "lucide-react";
import { adminRewardsReportApi } from "@/services/admin/rewards-report-api";
import type { FundingAccount } from "@/types/admin/rewards-report";

type PartnerKey = "vtpass" | "sms";

const PARTNERS: { key: PartnerKey; label: string; icon: typeof Fuel }[] = [
  { key: "vtpass", label: "VTpass", icon: Fuel },
  { key: "sms", label: "SMS provider (Termii)", icon: MessageSquare },
];

const INTERVAL_OPTIONS = [
  { label: "1 minute", value: 60 },
  { label: "2 minutes", value: 120 },
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "15 minutes", value: 900 },
  { label: "30 minutes", value: 1800 },
  { label: "1 hour", value: 3600 },
];

const emptyAcct: FundingAccount = {
  bank_name: "",
  account_number: "",
  account_name: "",
};

export default function PartnerBalancesSettingsPage() {
  const [interval, setInterval] = useState(300);
  const [accounts, setAccounts] = useState<Record<string, FundingAccount>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    adminRewardsReportApi
      .getPartnerBalancesConfig()
      .then((cfg) => {
        setInterval(cfg.refresh_interval_seconds ?? 300);
        setAccounts(cfg.funding_accounts ?? {});
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const setField = (
    key: PartnerKey,
    field: keyof FundingAccount,
    value: string,
  ) =>
    setAccounts((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? emptyAcct), [field]: value },
    }));

  const save = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const cfg = await adminRewardsReportApi.updatePartnerBalancesConfig({
        refresh_interval_seconds: interval,
        funding_accounts: accounts,
      });
      setInterval(cfg.refresh_interval_seconds);
      setAccounts(cfg.funding_accounts ?? {});
      setSuccess("Saved. The dashboard will pick this up within a minute.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 py-2 text-sm text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/30";

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
            <Fuel className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-dashboard-heading">
              Partner Balances
            </h1>
            <p className="text-xs text-dashboard-muted">
              Auto-refresh interval and funding accounts shown on the dashboard
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 max-w-3xl space-y-4">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-brand-bg-primary" />
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                <Check className="h-4 w-4" />
                {success}
              </div>
            )}

            {/* Refresh interval */}
            <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-brand-bg-primary" />
                <h2 className="text-sm font-semibold text-dashboard-heading">
                  Dashboard auto-refresh
                </h2>
              </div>
              <p className="text-xs text-dashboard-muted mb-3">
                How often the Partner balances card re-fetches live balances.
              </p>
              <select
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className={`${inputClass} max-w-xs`}
              >
                {INTERVAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Funding accounts */}
            {PARTNERS.map(({ key, label, icon: Icon }) => {
              const a = accounts[key] ?? emptyAcct;
              return (
                <div
                  key={key}
                  className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-brand-bg-primary" />
                    <h2 className="text-sm font-semibold text-dashboard-heading">
                      {label} — funding account
                    </h2>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-dashboard-muted mb-1">
                        Bank name
                      </label>
                      <input
                        className={inputClass}
                        value={a.bank_name ?? ""}
                        onChange={(e) =>
                          setField(key, "bank_name", e.target.value)
                        }
                        placeholder="e.g. Moniepoint MFB"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-dashboard-muted mb-1">
                        Account number
                      </label>
                      <input
                        className={inputClass}
                        value={a.account_number ?? ""}
                        onChange={(e) =>
                          setField(key, "account_number", e.target.value)
                        }
                        placeholder="e.g. 6615387100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-dashboard-muted mb-1">
                        Account name
                      </label>
                      <input
                        className={inputClass}
                        value={a.account_name ?? ""}
                        onChange={(e) =>
                          setField(key, "account_name", e.target.value)
                        }
                        placeholder="e.g. Smipay Technologies Ltd"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50 transition"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
