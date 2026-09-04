"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Save,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Send,
  Check,
  AlertTriangle,
} from "lucide-react";
import { adminOpsAlertsApi } from "@/services/admin/ops-alerts-api";
import type {
  OpsAlertConfig,
  OpsAlertConfigPayload,
} from "@/types/admin/ops-alerts";

type ToggleKey =
  | "paystack_forgery_alerts"
  | "forgery_auto_suspend"
  | "vtpass_rejection_alerts"
  | "vtpass_silence_alerts"
  | "wallet_integrity_alerts";

const TOGGLES: { key: ToggleKey; label: string; help: string }[] = [
  {
    key: "paystack_forgery_alerts",
    label: "Paystack webhook forgery attempts",
    help: "Email the moment a Paystack webhook is rejected — unsigned, bad signature, a reference Paystack doesn't recognise, or a mismatched amount. Includes the exact payload sent, the attacker's IP & location, and the target account's profile & wallet.",
  },
  {
    key: "forgery_auto_suspend",
    label: "Auto-suspend forgery targets",
    help: "When a forged (unsigned or bad-signature) Paystack webhook names a customer code, suspend that SmiPay account immediately — in self-credit fraud it's the attacker's own account. Staff accounts are never auto-suspended, every suspension is audit-logged, and it's reversible from Users. Runs even while alert emails are muted or in cooldown.",
  },
  {
    key: "vtpass_rejection_alerts",
    label: "VTPass webhook rejected (bad/missing secret)",
    help: "Email when a VTPass webhook arrives without the correct ?secret=. Usually means the VTPass dashboard URL is misconfigured.",
  },
  {
    key: "vtpass_silence_alerts",
    label: "VTPass silence (sales but no webhooks)",
    help: "Email when VTU sales are happening but no VTPass webhook has been accepted within the window below — catches a webhook that silently stopped arriving.",
  },
  {
    key: "wallet_integrity_alerts",
    label: "Wallet-integrity auto-suspensions",
    help: "Email when an account is auto-suspended for a wallet ledger mismatch (funding − withdrawn ≠ balance).",
  },
];

export default function AlertsSettingsPage() {
  const [config, setConfig] = useState<OpsAlertConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminOpsAlertsApi.get();
      setConfig(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load alert settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const patch = (p: OpsAlertConfigPayload) => {
    setConfig((c) => (c ? { ...c, ...p } : c));
    setSuccess("");
  };

  const save = async () => {
    if (!config) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await adminOpsAlertsApi.update({
        alert_recipients: config.alert_recipients,
        paystack_forgery_alerts: config.paystack_forgery_alerts,
        vtpass_rejection_alerts: config.vtpass_rejection_alerts,
        vtpass_silence_alerts: config.vtpass_silence_alerts,
        vtpass_silence_hours: config.vtpass_silence_hours,
        wallet_integrity_alerts: config.wallet_integrity_alerts,
        forgery_auto_suspend: config.forgery_auto_suspend,
        alert_cooldown_minutes: config.alert_cooldown_minutes,
      });
      setConfig(res.data);
      setSuccess("Alert settings saved. Takes effect immediately — no redeploy.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    setError("");
    setSuccess("");
    try {
      const res = await adminOpsAlertsApi.sendTest();
      setSuccess(
        res.data.sent
          ? `Test alert dispatched to: ${res.data.recipients.join(", ") || "(none)"}. ${res.data.note}`
          : res.data.note,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send test");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-dashboard-heading">
                Security & Ops Alerts
              </h1>
              <p className="text-xs text-dashboard-muted">
                Choose which incidents email the developers, and where. Changes
                apply instantly.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={sendTest}
              disabled={testing || loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50 transition-colors"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send test
            </button>
            <button
              onClick={save}
              disabled={saving || loading || !config}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:bg-brand-bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 space-y-5">
        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        {success ? (
          <div className="flex items-start gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
            <Check className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        ) : null}

        {loading && !config ? (
          <div className="text-center py-16 text-sm text-dashboard-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
            Loading alert settings…
          </div>
        ) : config ? (
          <>
            {/* Recipients */}
            <section className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-5">
              <h2 className="text-sm font-semibold text-dashboard-heading mb-1">
                Alert recipients
              </h2>
              <p className="text-xs text-dashboard-muted mb-3">
                Comma, semicolon, or newline separated. Leave blank to fall back
                to the <code>DEV_EMAILS</code> environment list.
              </p>
              <textarea
                value={config.alert_recipients}
                onChange={(e) => patch({ alert_recipients: e.target.value })}
                rows={2}
                placeholder="dev1@example.com, dev2@example.com"
                className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 py-2 text-sm text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/40"
              />
              {config.resolved_recipients?.length ? (
                <p className="text-xs text-dashboard-muted mt-2">
                  Currently sending to:{" "}
                  <span className="font-medium text-dashboard-heading">
                    {config.resolved_recipients.join(", ")}
                  </span>
                </p>
              ) : (
                <p className="text-xs text-amber-600 mt-2">
                  No recipients resolved — alerts will have nowhere to go.
                </p>
              )}
            </section>

            {/* Toggles */}
            <section className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface divide-y divide-dashboard-border/40">
              {TOGGLES.map(({ key, label, help }) => (
                <div
                  key={key}
                  className="flex items-start justify-between gap-4 p-5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-brand-bg-primary shrink-0" />
                      <span className="text-sm font-medium text-dashboard-heading">
                        {label}
                      </span>
                    </div>
                    <p className="text-xs text-dashboard-muted mt-1">{help}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={config[key]}
                    onClick={() => patch({ [key]: !config[key] })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      config[key] ? "bg-brand-bg-primary" : "bg-dashboard-border"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config[key] ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </section>

            {/* Numeric tunables */}
            <section className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface p-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-dashboard-heading">
                  VTPass silence window (hours)
                </label>
                <p className="text-xs text-dashboard-muted mb-2">
                  Alert if sales happen but no webhook arrives within this many
                  hours.
                </p>
                <input
                  type="number"
                  min={1}
                  value={config.vtpass_silence_hours}
                  onChange={(e) =>
                    patch({ vtpass_silence_hours: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 py-2 text-sm text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/40"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-dashboard-heading">
                  Alert cooldown (minutes)
                </label>
                <p className="text-xs text-dashboard-muted mb-2">
                  Minimum gap between two emails of the same type, so an attacker
                  can&apos;t flood your inbox.
                </p>
                <input
                  type="number"
                  min={0}
                  value={config.alert_cooldown_minutes}
                  onChange={(e) =>
                    patch({ alert_cooldown_minutes: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 py-2 text-sm text-dashboard-heading focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/40"
                />
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
