"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  MessageSquare,
  RefreshCw,
  Save,
  Loader2,
  Plus,
  Send,
  Wallet,
  CheckCircle2,
  XCircle,
  BarChart3,
  Pencil,
  X,
} from "lucide-react";
import { useAdminSmsProviders } from "@/hooks/admin/useAdminSmsProviders";
import { adminSmsProvidersApi } from "@/services/admin/sms-providers-api";
import type {
  CreateSmsProviderPayload,
  SmsProviderConfig,
  SmsProviderDefaults,
  TermiiChannel,
  UpdateSmsProviderPayload,
} from "@/types/admin/sms-providers";

type ProviderEditForm = {
  name: string;
  base_url: string;
  api_key: string;
  sender_id: string;
  default_channel: TermiiChannel;
  otp_message_template: string;
  notes: string;
};

function providerToEditForm(p: SmsProviderConfig): ProviderEditForm {
  const defaults = p.defaults ?? {};
  return {
    name: p.name,
    base_url: p.base_url,
    api_key: "",
    sender_id: defaults.sender_id ?? "SmiPay",
    default_channel: defaults.default_channel ?? "dnd",
    otp_message_template:
      defaults.otp_message_template ??
      "Your SmiPay verification code is <otp>. Valid for 10 minutes.",
    notes: p.notes ?? "",
  };
}

function buildProviderUpdatePayload(
  original: ProviderEditForm,
  form: ProviderEditForm,
): UpdateSmsProviderPayload | null {
  const payload: UpdateSmsProviderPayload = {};

  if (form.name.trim() !== original.name.trim()) {
    payload.name = form.name.trim();
  }
  if (form.base_url.trim() !== original.base_url.trim()) {
    payload.base_url = form.base_url.trim();
  }
  if (form.notes.trim() !== original.notes.trim()) {
    payload.notes = form.notes.trim() || undefined;
  }
  if (form.api_key.trim()) {
    payload.credentials = { api_key: form.api_key.trim() };
  }

  const defaults: Partial<SmsProviderDefaults> = {};
  if (form.sender_id !== original.sender_id) {
    defaults.sender_id = form.sender_id;
  }
  if (form.default_channel !== original.default_channel) {
    defaults.default_channel = form.default_channel;
  }
  if (form.otp_message_template !== original.otp_message_template) {
    defaults.otp_message_template = form.otp_message_template;
  }
  if (Object.keys(defaults).length > 0) {
    payload.defaults = defaults;
  }

  return Object.keys(payload).length > 0 ? payload : null;
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4">
      <p className="text-xs text-dashboard-muted">{label}</p>
      <p className="text-xl font-bold text-dashboard-heading mt-1">{value}</p>
      {sub && <p className="text-[11px] text-dashboard-muted mt-0.5">{sub}</p>}
    </div>
  );
}

export default function SmsProvidersPage() {
  const {
    config,
    providers,
    summary,
    dailyStats,
    messages,
    balance,
    configLoading,
    providersLoading,
    summaryLoading,
    messagesLoading,
    balanceLoading,
    error,
    activeProvider,
    refetchAll,
    fetchBalance,
    fetchMessages,
  } = useAdminSmsProviders();

  const [savingConfig, setSavingConfig] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(
    null,
  );
  const [editForm, setEditForm] = useState<ProviderEditForm | null>(null);
  const [editOriginal, setEditOriginal] = useState<ProviderEditForm | null>(
    null,
  );

  const [globalForm, setGlobalForm] = useState({
    is_enabled: false,
    monthly_budget_ngn: "",
    daily_cap_per_user: "10",
    webhook_secret: "",
  });

  const [providerForm, setProviderForm] = useState({
    name: "Termii Production",
    driver: "termii",
    base_url: "https://api.termii.com",
    api_key: "",
    sender_id: "SmiPay",
    default_channel: "dnd" as TermiiChannel,
    otp_message_template:
      "Your SmiPay verification code is <otp>. Valid for 10 minutes.",
    notes: "",
  });

  const [testForm, setTestForm] = useState({ to: "", message: "" });

  useEffect(() => {
    if (!config) return;
    setGlobalForm({
      is_enabled: config.is_enabled,
      monthly_budget_ngn:
        config.monthly_budget_ngn != null
          ? String(config.monthly_budget_ngn)
          : "",
      daily_cap_per_user: String(config.daily_cap_per_user),
      webhook_secret: "",
    });
  }, [config]);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const res = await adminSmsProvidersApi.updateConfig({
        is_enabled: globalForm.is_enabled,
        monthly_budget_ngn: globalForm.monthly_budget_ngn
          ? Number(globalForm.monthly_budget_ngn)
          : undefined,
        daily_cap_per_user: Number(globalForm.daily_cap_per_user),
        webhook_secret: globalForm.webhook_secret || undefined,
      });
      if (res.success) {
        setFormSuccess("Global SMS settings saved.");
        refetchAll();
      } else {
        setFormError(res.message);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCreateProvider = async () => {
    setSavingProvider(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const payload: CreateSmsProviderPayload = {
        name: providerForm.name,
        driver: providerForm.driver,
        base_url: providerForm.base_url,
        credentials: { api_key: providerForm.api_key },
        defaults: {
          sender_id: providerForm.sender_id,
          default_channel: providerForm.default_channel,
          default_type: "plain",
          otp_message_template: providerForm.otp_message_template,
        },
        notes: providerForm.notes || undefined,
        is_active: providers.length === 0,
      };
      const res = await adminSmsProvidersApi.createProvider(payload);
      if (res.success) {
        setFormSuccess("SMS provider created.");
        setProviderForm((f) => ({ ...f, api_key: "" }));
        refetchAll();
      } else {
        setFormError(res.message);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSavingProvider(false);
    }
  };

  const handleActivate = async (p: SmsProviderConfig) => {
    try {
      await adminSmsProvidersApi.activateProvider(p.id);
      refetchAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Activate failed");
    }
  };

  const handleArchive = async (p: SmsProviderConfig) => {
    if (!confirm(`Archive provider "${p.name}"?`)) return;
    try {
      await adminSmsProvidersApi.archiveProvider(p.id);
      if (editingProviderId === p.id) {
        setEditingProviderId(null);
        setEditForm(null);
        setEditOriginal(null);
      }
      refetchAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Archive failed");
    }
  };

  const handleStartEdit = (p: SmsProviderConfig) => {
    const snapshot = providerToEditForm(p);
    setEditingProviderId(p.id);
    setEditForm(snapshot);
    setEditOriginal(snapshot);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingProviderId(null);
    setEditForm(null);
    setEditOriginal(null);
  };

  const handleSaveEdit = async (p: SmsProviderConfig) => {
    if (!editForm || !editOriginal) return;

    const payload = buildProviderUpdatePayload(editOriginal, editForm);
    if (!payload) {
      setFormError("No changes to save.");
      return;
    }

    setSavingEdit(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const res = await adminSmsProvidersApi.updateProvider(p.id, payload);
      if (res.success) {
        setFormSuccess(`Provider "${p.name}" updated.`);
        handleCancelEdit();
        refetchAll();
      } else {
        setFormError(res.message);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleTestSend = async () => {
    const target = activeProvider ?? providers[0];
    if (!target) {
      setFormError("Create and activate a provider first.");
      return;
    }
    setTestSending(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const res = await adminSmsProvidersApi.testProvider(target.id, {
        to: testForm.to,
        message: testForm.message || undefined,
      });
      if (res.success) {
        setFormSuccess("Test SMS sent.");
        void fetchMessages();
        refetchAll();
      } else {
        setFormError(res.message);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Test send failed");
    } finally {
      setTestSending(false);
    }
  };

  const loading = configLoading && !config;

  return (
    <div className="min-h-screen bg-dashboard-bg pb-10">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2 py-3.5 sm:py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-dashboard-heading">
                SMS Providers
              </h1>
              <p className="text-xs text-dashboard-muted">
                Termii integration, delivery tracking, and spend analytics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={refetchAll}
            disabled={configLoading || providersLoading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${configLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </header>

      <div className="space-y-4 pt-4">
        {(error || formError) && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {formError || error}
          </div>
        )}
        {formSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700"
          >
            {formSuccess}
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-dashboard-muted">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading…
          </div>
        ) : (
          <>
            {/* Analytics */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Sent (this month)"
                value={summary?.monthly.messages_sent ?? "—"}
                sub={summaryLoading ? "Loading…" : summary?.month}
              />
              <StatCard
                label="Delivered (this month)"
                value={summary?.monthly.messages_delivered ?? "—"}
              />
              <StatCard
                label="Failed (this month)"
                value={summary?.monthly.messages_failed ?? "—"}
              />
              <StatCard
                label="Spend (this month)"
                value={
                  summary
                    ? `₦${summary.monthly.spend_ngn.toFixed(2)}`
                    : "—"
                }
                sub={
                  summary
                    ? `All time: ₦${summary.all_time.spend_ngn.toFixed(2)}`
                    : undefined
                }
              />
            </section>

            {/* Wallet balance */}
            <section className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-brand-bg-primary" />
                <div>
                  <p className="text-sm font-medium text-dashboard-heading">
                    Termii wallet
                  </p>
                  <p className="text-xs text-dashboard-muted">
                    Live balance from active provider
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold text-dashboard-heading">
                  {balanceLoading
                    ? "…"
                    : balance
                      ? `${balance.currency} ${balance.balance.toFixed(2)}`
                      : "—"}
                </p>
                <button
                  type="button"
                  onClick={() => void fetchBalance()}
                  className="text-xs px-3 py-1.5 rounded-lg border border-dashboard-border/60 hover:bg-dashboard-bg"
                >
                  Refresh
                </button>
              </div>
            </section>

            {/* Global settings */}
            <section className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 space-y-4">
              <h2 className="text-sm font-semibold text-dashboard-heading">
                Global SMS settings
              </h2>
              {config && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={
                        globalForm.is_enabled !== undefined
                          ? globalForm.is_enabled
                          : config.is_enabled
                      }
                      onChange={(e) =>
                        setGlobalForm((f) => ({
                          ...f,
                          is_enabled: e.target.checked,
                        }))
                      }
                    />
                    SMS enabled
                  </label>
                  <label className="text-xs">
                    <span className="text-dashboard-muted">Monthly budget (NGN)</span>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
                      placeholder={String(config.monthly_budget_ngn ?? "")}
                      value={globalForm.monthly_budget_ngn}
                      onChange={(e) =>
                        setGlobalForm((f) => ({
                          ...f,
                          monthly_budget_ngn: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="text-xs">
                    <span className="text-dashboard-muted">Daily cap per user</span>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
                      value={
                        globalForm.daily_cap_per_user ||
                        String(config.daily_cap_per_user)
                      }
                      onChange={(e) =>
                        setGlobalForm((f) => ({
                          ...f,
                          daily_cap_per_user: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="text-xs">
                    <span className="text-dashboard-muted">
                      Webhook secret {config.has_webhook_secret && "(set)"}
                    </span>
                    <input
                      type="password"
                      className="mt-1 w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
                      placeholder="Leave blank to keep existing"
                      value={globalForm.webhook_secret}
                      onChange={(e) =>
                        setGlobalForm((f) => ({
                          ...f,
                          webhook_secret: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              )}
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50"
              >
                {savingConfig ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save settings
              </button>
            </section>

            {/* Add provider */}
            <section className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 space-y-4">
              <h2 className="text-sm font-semibold text-dashboard-heading flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Termii provider
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  className="rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
                  placeholder="Name"
                  value={providerForm.name}
                  onChange={(e) =>
                    setProviderForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
                <input
                  className="rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
                  placeholder="Base URL (from Termii dashboard)"
                  value={providerForm.base_url}
                  onChange={(e) =>
                    setProviderForm((f) => ({ ...f, base_url: e.target.value }))
                  }
                />
                <input
                  type="password"
                  className="rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm sm:col-span-2"
                  placeholder="API key"
                  value={providerForm.api_key}
                  onChange={(e) =>
                    setProviderForm((f) => ({ ...f, api_key: e.target.value }))
                  }
                />
                <input
                  className="rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
                  placeholder="Sender ID"
                  value={providerForm.sender_id}
                  onChange={(e) =>
                    setProviderForm((f) => ({ ...f, sender_id: e.target.value }))
                  }
                />
                <select
                  className="rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
                  value={providerForm.default_channel}
                  onChange={(e) =>
                    setProviderForm((f) => ({
                      ...f,
                      default_channel: e.target.value as TermiiChannel,
                    }))
                  }
                >
                  <option value="dnd">dnd (transactional)</option>
                  <option value="generic">generic (promotional)</option>
                </select>
                <textarea
                  className="rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm sm:col-span-2"
                  rows={2}
                  placeholder="OTP template — use <otp> placeholder"
                  value={providerForm.otp_message_template}
                  onChange={(e) =>
                    setProviderForm((f) => ({
                      ...f,
                      otp_message_template: e.target.value,
                    }))
                  }
                />
              </div>
              <button
                type="button"
                onClick={handleCreateProvider}
                disabled={savingProvider || !providerForm.api_key}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50"
              >
                {savingProvider ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Create provider
              </button>
            </section>

            {/* Provider list */}
            <section className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-dashboard-border/60">
                <h2 className="text-sm font-semibold text-dashboard-heading">
                  Configured providers
                </h2>
              </div>
              {providers.length === 0 ? (
                <p className="px-4 py-6 text-sm text-dashboard-muted">
                  No providers yet. Add Termii above.
                </p>
              ) : (
                <ul className="divide-y divide-dashboard-border/40">
                  {providers.map((p) => {
                    const isEditing = editingProviderId === p.id;
                    return (
                      <li key={p.id} className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-dashboard-heading flex items-center gap-2">
                              {p.name}
                              {p.is_active && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                                  Active
                                </span>
                              )}
                              {p.archived_at && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                  Archived
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-dashboard-muted">
                              {p.driver} · {p.base_url}
                            </p>
                            {p.defaults && (
                              <p className="text-[11px] text-dashboard-muted mt-0.5">
                                {p.defaults.sender_id ?? "SmiPay"} ·{" "}
                                {p.defaults.default_channel ?? "dnd"} route
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!p.archived_at && (
                              <button
                                type="button"
                                onClick={() =>
                                  isEditing ? handleCancelEdit() : handleStartEdit(p)
                                }
                                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-dashboard-border/60 hover:bg-dashboard-bg"
                              >
                                {isEditing ? (
                                  <>
                                    <X className="h-3 w-3" />
                                    Cancel
                                  </>
                                ) : (
                                  <>
                                    <Pencil className="h-3 w-3" />
                                    Edit
                                  </>
                                )}
                              </button>
                            )}
                            {!p.is_active && !p.archived_at && (
                              <button
                                type="button"
                                onClick={() => handleActivate(p)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-dashboard-border/60 hover:bg-dashboard-bg"
                              >
                                Activate
                              </button>
                            )}
                            {!p.archived_at && (
                              <button
                                type="button"
                                onClick={() => handleArchive(p)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                              >
                                Archive
                              </button>
                            )}
                          </div>
                        </div>

                        {isEditing && editForm && (
                          <div className="mt-4 pt-4 border-t border-dashboard-border/40 space-y-3">
                            <p className="text-xs text-dashboard-muted">
                              Only changed fields are sent. Leave API key blank to
                              keep the existing key.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3">
                              <input
                                className="rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
                                placeholder="Name"
                                value={editForm.name}
                                onChange={(e) =>
                                  setEditForm((f) =>
                                    f ? { ...f, name: e.target.value } : f,
                                  )
                                }
                              />
                              <input
                                className="rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
                                placeholder="Base URL"
                                value={editForm.base_url}
                                onChange={(e) =>
                                  setEditForm((f) =>
                                    f ? { ...f, base_url: e.target.value } : f,
                                  )
                                }
                              />
                              <input
                                type="password"
                                className="rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm sm:col-span-2"
                                placeholder="New API key (optional)"
                                value={editForm.api_key}
                                onChange={(e) =>
                                  setEditForm((f) =>
                                    f ? { ...f, api_key: e.target.value } : f,
                                  )
                                }
                              />
                              <input
                                className="rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
                                placeholder="Sender ID"
                                value={editForm.sender_id}
                                onChange={(e) =>
                                  setEditForm((f) =>
                                    f ? { ...f, sender_id: e.target.value } : f,
                                  )
                                }
                              />
                              <select
                                className="rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
                                value={editForm.default_channel}
                                onChange={(e) =>
                                  setEditForm((f) =>
                                    f
                                      ? {
                                          ...f,
                                          default_channel: e.target
                                            .value as TermiiChannel,
                                        }
                                      : f,
                                  )
                                }
                              >
                                <option value="dnd">dnd (transactional)</option>
                                <option value="generic">
                                  generic (promotional)
                                </option>
                              </select>
                              <textarea
                                className="rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm sm:col-span-2"
                                rows={2}
                                placeholder="OTP template — use <otp> placeholder"
                                value={editForm.otp_message_template}
                                onChange={(e) =>
                                  setEditForm((f) =>
                                    f
                                      ? {
                                          ...f,
                                          otp_message_template: e.target.value,
                                        }
                                      : f,
                                  )
                                }
                              />
                              <input
                                className="rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm sm:col-span-2"
                                placeholder="Notes (optional)"
                                value={editForm.notes}
                                onChange={(e) =>
                                  setEditForm((f) =>
                                    f ? { ...f, notes: e.target.value } : f,
                                  )
                                }
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleSaveEdit(p)}
                              disabled={savingEdit}
                              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-brand-bg-primary text-white hover:opacity-90 disabled:opacity-50"
                            >
                              {savingEdit ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                              Save changes
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Test send */}
            <section className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-dashboard-heading flex items-center gap-2">
                <Send className="h-4 w-4" />
                Test send
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  className="rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
                  placeholder="Phone (2348012345678)"
                  value={testForm.to}
                  onChange={(e) =>
                    setTestForm((f) => ({ ...f, to: e.target.value }))
                  }
                />
                <input
                  className="rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
                  placeholder="Optional custom message"
                  value={testForm.message}
                  onChange={(e) =>
                    setTestForm((f) => ({ ...f, message: e.target.value }))
                  }
                />
              </div>
              <button
                type="button"
                onClick={handleTestSend}
                disabled={testSending || !testForm.to}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60 hover:bg-dashboard-bg disabled:opacity-50"
              >
                {testSending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Send test SMS
              </button>
            </section>

            {/* Daily spend chart (simple table) */}
            {dailyStats.length > 0 && (
              <section className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4">
                <h2 className="text-sm font-semibold text-dashboard-heading flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4" />
                  Daily spend (last 30 days)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-dashboard-muted border-b border-dashboard-border/40">
                        <th className="text-left py-2 pr-4">Date</th>
                        <th className="text-right py-2 px-2">Sent</th>
                        <th className="text-right py-2 px-2">Delivered</th>
                        <th className="text-right py-2 px-2">Failed</th>
                        <th className="text-right py-2 pl-2">Spend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyStats.slice(-14).map((d) => (
                        <tr
                          key={d.date}
                          className="border-b border-dashboard-border/20"
                        >
                          <td className="py-2 pr-4 text-dashboard-heading">
                            {String(d.date).slice(0, 10)}
                          </td>
                          <td className="text-right py-2 px-2">
                            {d.messages_sent}
                          </td>
                          <td className="text-right py-2 px-2">
                            {d.messages_delivered}
                          </td>
                          <td className="text-right py-2 px-2">
                            {d.messages_failed}
                          </td>
                          <td className="text-right py-2 pl-2">
                            ₦{d.spend_ngn.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Messages ledger */}
            <section className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-dashboard-border/60 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-dashboard-heading">
                  Recent messages
                </h2>
                {messagesLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-dashboard-muted" />
                )}
              </div>
              {!messages?.items.length ? (
                <p className="px-4 py-6 text-sm text-dashboard-muted">
                  No messages yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-dashboard-muted border-b border-dashboard-border/40 bg-dashboard-bg/50">
                        <th className="text-left py-2 px-4">Time</th>
                        <th className="text-left py-2 px-2">Purpose</th>
                        <th className="text-left py-2 px-2">To</th>
                        <th className="text-left py-2 px-2">Status</th>
                        <th className="text-right py-2 px-4">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.items.map((m) => (
                        <tr
                          key={m.id}
                          className="border-b border-dashboard-border/20"
                        >
                          <td className="py-2 px-4 text-dashboard-muted">
                            {new Date(m.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2 px-2">{m.purpose}</td>
                          <td className="py-2 px-2">****{m.to_last4}</td>
                          <td className="py-2 px-2">
                            <span className="inline-flex items-center gap-1">
                              {m.status === "delivered" ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : m.status === "failed" ? (
                                <XCircle className="h-3 w-3 text-red-600" />
                              ) : null}
                              {m.status}
                            </span>
                          </td>
                          <td className="text-right py-2 px-4">
                            {m.cost_ngn != null
                              ? `₦${m.cost_ngn.toFixed(2)}`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
