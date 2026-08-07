"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  RefreshCw,
  Save,
  Loader2,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Pencil,
  Settings,
  ChevronUp,
  ChevronDown,
  Power,
} from "lucide-react";
import { useAdminEmailProviders } from "@/hooks/admin/useAdminEmailProviders";
import { adminEmailProvidersApi } from "@/services/admin/email-providers-api";
import type {
  CreateEmailProviderPayload,
  EmailConfig,
  EmailDriver,
  EmailProviderConfig,
  EmailProviderDefaults,
  UpdateEmailProviderPayload,
} from "@/types/admin/email-providers";
import { EmailAdminModal } from "./_components/EmailAdminModal";

type GlobalSettingsForm = {
  is_enabled: boolean;
  failover_enabled: boolean;
  default_from_email: string;
  default_from_name: string;
  default_reply_to: string;
  enforce_suppression: boolean;
  sandbox_mode: boolean;
  sandbox_redirect_to: string;
  monthly_send_cap: string;
};

function configToGlobalForm(config: EmailConfig): GlobalSettingsForm {
  return {
    is_enabled: config.is_enabled,
    failover_enabled: config.failover_enabled,
    default_from_email: config.default_from_email ?? "",
    default_from_name: config.default_from_name ?? "",
    default_reply_to: config.default_reply_to ?? "",
    enforce_suppression: config.enforce_suppression,
    sandbox_mode: config.sandbox_mode,
    sandbox_redirect_to: config.sandbox_redirect_to ?? "",
    monthly_send_cap:
      config.monthly_send_cap != null ? String(config.monthly_send_cap) : "",
  };
}

function driverPreset(driver: EmailDriver) {
  switch (driver) {
    case "sendgrid":
      return { name: "SendGrid Production", base_url: "https://api.sendgrid.com" };
    case "smtp":
      return {
        name: "Gmail SMTP",
        base_url: "smtp.gmail.com",
        defaults: {
          smtp_host: "smtp.gmail.com",
          smtp_port: 587,
          smtp_secure: false,
        },
      };
    default:
      return { name: "Resend Production", base_url: "https://api.resend.com" };
  }
}

function createInitialProviderForm() {
  return {
    name: "Resend Production",
    driver: "resend" as EmailDriver,
    base_url: "https://api.resend.com",
    api_key: "",
    password: "",
    webhook_secret: "",
    from_email: "noreply@smipay.ng",
    from_name: "SmiPay",
    reply_to: "",
    smtp_host: "smtp.gmail.com",
    smtp_port: "587",
    smtp_user: "",
    notes: "",
  };
}

type ProviderEditForm = ReturnType<typeof createInitialProviderForm>;

function providerToEditForm(p: EmailProviderConfig): ProviderEditForm {
  const d = p.defaults ?? {};
  return {
    name: p.name,
    driver: p.driver as EmailDriver,
    base_url: p.base_url ?? "",
    api_key: "",
    password: "",
    webhook_secret: "",
    from_email: d.from_email ?? "",
    from_name: d.from_name ?? "SmiPay",
    reply_to: d.reply_to ?? "",
    smtp_host: d.smtp_host ?? "smtp.gmail.com",
    smtp_port: String(d.smtp_port ?? 587),
    smtp_user: d.smtp_user ?? "",
    notes: p.notes ?? "",
  };
}

function buildDefaults(form: ProviderEditForm): EmailProviderDefaults {
  return {
    from_email: form.from_email || undefined,
    from_name: form.from_name || undefined,
    reply_to: form.reply_to || undefined,
    ...(form.driver === "smtp"
      ? {
          smtp_host: form.smtp_host,
          smtp_port: Number(form.smtp_port) || 587,
          smtp_secure: Number(form.smtp_port) === 465,
          smtp_user: form.smtp_user || undefined,
        }
      : {}),
  };
}

function buildCredentials(form: ProviderEditForm) {
  const creds: Record<string, string> = {};
  if (form.api_key.trim()) creds.api_key = form.api_key.trim();
  if (form.password.trim()) creds.password = form.password.trim();
  if (form.webhook_secret.trim()) creds.webhook_secret = form.webhook_secret.trim();
  return creds;
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

function statusIcon(status: string) {
  if (status === "delivered" || status === "sent") {
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
  }
  if (status === "failed" || status === "bounced" || status === "complained") {
    return <XCircle className="h-3.5 w-3.5 text-red-600" />;
  }
  return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
}

export default function EmailProvidersPage() {
  const {
    config,
    providers,
    summary,
    dailyStats,
    messages,
    suppressions,
    configLoading,
    providersLoading,
    summaryLoading,
    messagesLoading,
    suppressionsLoading,
    error,
    primaryProvider,
    refetchAll,
    fetchMessages,
    fetchSuppressions,
  } = useAdminEmailProviders();

  const [savingConfig, setSavingConfig] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editProvider, setEditProvider] = useState<EmailProviderConfig | null>(null);
  const [editForm, setEditForm] = useState<ProviderEditForm | null>(null);
  const [globalForm, setGlobalForm] = useState<GlobalSettingsForm>({
    is_enabled: true,
    failover_enabled: true,
    default_from_email: "",
    default_from_name: "",
    default_reply_to: "",
    enforce_suppression: true,
    sandbox_mode: false,
    sandbox_redirect_to: "",
    monthly_send_cap: "",
  });
  const [providerForm, setProviderForm] = useState(createInitialProviderForm);
  const [testForm, setTestForm] = useState({ to: "", subject: "", message: "" });
  const [testProviderId, setTestProviderId] = useState<string>("");

  useEffect(() => {
    if (!config) return;
    if (!showSettingsModal) setGlobalForm(configToGlobalForm(config));
  }, [config, showSettingsModal]);

  useEffect(() => {
    if (primaryProvider && !testProviderId) {
      setTestProviderId(primaryProvider.id);
    }
  }, [primaryProvider, testProviderId]);

  const enabledProviders = useMemo(
    () =>
      providers
        .filter((p) => !p.archived_at)
        .sort((a, b) => a.priority - b.priority),
    [providers],
  );

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    setModalError(null);
    try {
      const res = await adminEmailProvidersApi.updateConfig({
        is_enabled: globalForm.is_enabled,
        failover_enabled: globalForm.failover_enabled,
        default_from_email: globalForm.default_from_email || undefined,
        default_from_name: globalForm.default_from_name || undefined,
        default_reply_to: globalForm.default_reply_to || undefined,
        enforce_suppression: globalForm.enforce_suppression,
        sandbox_mode: globalForm.sandbox_mode,
        sandbox_redirect_to: globalForm.sandbox_redirect_to || undefined,
        monthly_send_cap: globalForm.monthly_send_cap
          ? Number(globalForm.monthly_send_cap)
          : undefined,
      });
      if (res.success) {
        setFormSuccess("Global email settings saved.");
        setShowSettingsModal(false);
        refetchAll();
      } else {
        setModalError(res.message);
      }
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCreateProvider = async () => {
    setSavingProvider(true);
    setModalError(null);
    try {
      const payload: CreateEmailProviderPayload = {
        name: providerForm.name,
        driver: providerForm.driver,
        base_url: providerForm.base_url || undefined,
        credentials: buildCredentials(providerForm),
        defaults: buildDefaults(providerForm),
        notes: providerForm.notes || undefined,
        is_enabled: true,
      };
      const res = await adminEmailProvidersApi.createProvider(payload);
      if (res.success) {
        setFormSuccess("Email provider created.");
        setShowAddModal(false);
        setProviderForm(createInitialProviderForm());
        refetchAll();
      } else {
        setModalError(res.message);
      }
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSavingProvider(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editProvider || !editForm) return;
    setSavingEdit(true);
    setModalError(null);
    try {
      const payload: UpdateEmailProviderPayload = {
        name: editForm.name,
        base_url: editForm.base_url || undefined,
        defaults: buildDefaults(editForm),
        notes: editForm.notes || undefined,
      };
      const creds = buildCredentials(editForm);
      if (Object.keys(creds).length > 0) payload.credentials = creds;

      const res = await adminEmailProvidersApi.updateProvider(
        editProvider.id,
        payload,
      );
      if (res.success) {
        setFormSuccess(`Provider "${editProvider.name}" updated.`);
        setEditProvider(null);
        setEditForm(null);
        refetchAll();
      } else {
        setModalError(res.message);
      }
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const ids = enabledProviders.map((p) => p.id);
    const idx = ids.indexOf(id);
    if (idx < 0) return;
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= ids.length) return;
    [ids[idx], ids[swap]] = [ids[swap], ids[idx]];
    try {
      await adminEmailProvidersApi.reorderProviders(ids);
      refetchAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Reorder failed");
    }
  };

  const handleToggle = async (p: EmailProviderConfig) => {
    try {
      await adminEmailProvidersApi.toggleProvider(p.id);
      refetchAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Toggle failed");
    }
  };

  const handleArchive = async (p: EmailProviderConfig) => {
    if (!confirm(`Archive provider "${p.name}"?`)) return;
    try {
      await adminEmailProvidersApi.archiveProvider(p.id);
      refetchAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Archive failed");
    }
  };

  const handleTestSend = async () => {
    const targetId = testProviderId || primaryProvider?.id;
    if (!targetId) {
      setModalError("Create a provider first.");
      return;
    }
    setTestSending(true);
    setModalError(null);
    try {
      const res = await adminEmailProvidersApi.testProvider(targetId, {
        to: testForm.to,
        subject: testForm.subject || undefined,
        message: testForm.message || undefined,
      });
      if (res.success) {
        setFormSuccess("Test email sent.");
        setShowTestModal(false);
        setTestForm({ to: "", subject: "", message: "" });
        void fetchMessages();
        refetchAll();
      } else {
        setModalError(res.message);
      }
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Test send failed");
    } finally {
      setTestSending(false);
    }
  };

  const handleClearSuppression = async (email: string) => {
    try {
      await adminEmailProvidersApi.clearSuppression(email);
      void fetchSuppressions();
      setFormSuccess(`Suppression cleared for ${email}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Clear failed");
    }
  };

  const loading = configLoading && !config;

  return (
    <div className="min-h-screen bg-dashboard-bg pb-10">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2 py-3.5 sm:py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-brand-bg-primary flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-dashboard-heading">
                Email Providers
              </h1>
              <p className="text-xs text-dashboard-muted">
                Resend, SendGrid, SMTP failover chain, delivery tracking
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
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
            {formSuccess}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand-bg-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Sent (this month)"
                value={summary?.monthly.messages_sent ?? 0}
                sub={summary?.month ?? undefined}
              />
              <StatCard
                label="Delivered (this month)"
                value={summary?.monthly.messages_delivered ?? 0}
              />
              <StatCard
                label="Failed (this month)"
                value={summary?.monthly.messages_failed ?? 0}
              />
              <StatCard
                label="Bounced (this month)"
                value={summary?.monthly.messages_bounced ?? 0}
                sub={`Complained: ${summary?.monthly.messages_complained ?? 0}`}
              />
            </div>

            <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-dashboard-heading">
                  Global email settings
                </p>
                <p className="text-xs text-dashboard-muted mt-0.5">
                  {config?.is_enabled ? "Enabled" : "Disabled"}
                  {config?.failover_enabled ? " · Failover on" : " · Failover off"}
                  {config?.sandbox_mode ? " · Sandbox" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (config) setGlobalForm(configToGlobalForm(config));
                  setModalError(null);
                  setShowSettingsModal(true);
                }}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </button>
            </div>

            <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-dashboard-border/60">
                <h2 className="text-sm font-semibold text-dashboard-heading">
                  Provider chain
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalError(null);
                      setShowTestModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-dashboard-border/60"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Test send
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProviderForm(createInitialProviderForm());
                      setModalError(null);
                      setShowAddModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-bg-primary text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add provider
                  </button>
                </div>
              </div>

              {providersLoading && enabledProviders.length === 0 ? (
                <div className="p-8 text-center text-sm text-dashboard-muted">
                  Loading providers…
                </div>
              ) : enabledProviders.length === 0 ? (
                <div className="p-8 text-center text-sm text-dashboard-muted">
                  No email providers configured. Add one or run the env migration seed.
                </div>
              ) : (
                <ul className="divide-y divide-dashboard-border/60">
                  {enabledProviders.map((p, idx) => (
                    <li
                      key={p.id}
                      className="px-4 py-3 flex flex-wrap items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-dashboard-heading">
                            {p.name}
                          </span>
                          {idx === 0 && p.is_enabled && (
                            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Primary
                            </span>
                          )}
                          {!p.is_enabled && (
                            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              Disabled
                            </span>
                          )}
                          {p.consecutive_failures >= 3 && (
                            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Unhealthy
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-dashboard-muted mt-1">
                          {p.driver}
                          {p.base_url ? ` · ${p.base_url}` : ""}
                          {p.defaults?.from_email ? ` · ${p.defaults.from_email}` : ""}
                        </p>
                        {p.notes && (
                          <p className="text-xs text-dashboard-muted mt-0.5">{p.notes}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleReorder(p.id, "up")}
                          disabled={idx === 0}
                          className="p-1.5 rounded border border-dashboard-border/60 disabled:opacity-40"
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorder(p.id, "down")}
                          disabled={idx === enabledProviders.length - 1}
                          className="p-1.5 rounded border border-dashboard-border/60 disabled:opacity-40"
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggle(p)}
                          className="p-1.5 rounded border border-dashboard-border/60"
                          aria-label="Toggle enabled"
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditProvider(p);
                            setEditForm(providerToEditForm(p));
                            setModalError(null);
                          }}
                          className="px-2.5 py-1.5 text-xs rounded border border-dashboard-border/60"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchive(p)}
                          className="px-2.5 py-1.5 text-xs rounded border border-dashboard-border/60 text-red-700"
                        >
                          Archive
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-dashboard-border/60">
                <h2 className="text-sm font-semibold text-dashboard-heading">
                  Daily volume (last 30 days)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-dashboard-border/60 text-dashboard-muted">
                      <th className="text-left px-4 py-2 font-medium">Date</th>
                      <th className="text-right px-4 py-2 font-medium">Sent</th>
                      <th className="text-right px-4 py-2 font-medium">Delivered</th>
                      <th className="text-right px-4 py-2 font-medium">Failed</th>
                      <th className="text-right px-4 py-2 font-medium">Bounced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStats.slice(-14).map((row) => (
                      <tr key={row.date} className="border-b border-dashboard-border/40">
                        <td className="px-4 py-2">
                          {new Date(row.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-right">{row.messages_sent}</td>
                        <td className="px-4 py-2 text-right">{row.messages_delivered}</td>
                        <td className="px-4 py-2 text-right">{row.messages_failed}</td>
                        <td className="px-4 py-2 text-right">{row.messages_bounced}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-dashboard-border/60">
                <h2 className="text-sm font-semibold text-dashboard-heading">
                  Recent messages
                </h2>
              </div>
              {messagesLoading && !messages ? (
                <div className="p-6 text-center text-sm text-dashboard-muted">Loading…</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-dashboard-border/60 text-dashboard-muted">
                        <th className="text-left px-4 py-2 font-medium">Time</th>
                        <th className="text-left px-4 py-2 font-medium">Purpose</th>
                        <th className="text-left px-4 py-2 font-medium">To</th>
                        <th className="text-left px-4 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(messages?.items ?? []).map((m) => (
                        <tr key={m.id} className="border-b border-dashboard-border/40">
                          <td className="px-4 py-2 whitespace-nowrap">
                            {new Date(m.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-2">{m.purpose}</td>
                          <td className="px-4 py-2 font-mono">{m.to_masked}</td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center gap-1">
                              {statusIcon(m.status)}
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-dashboard-border/60">
                <h2 className="text-sm font-semibold text-dashboard-heading">
                  Suppression list
                </h2>
              </div>
              {suppressionsLoading ? (
                <div className="p-6 text-center text-sm text-dashboard-muted">Loading…</div>
              ) : suppressions.length === 0 ? (
                <div className="p-6 text-center text-sm text-dashboard-muted">
                  No active suppressions
                </div>
              ) : (
                <ul className="divide-y divide-dashboard-border/60">
                  {suppressions.map((s) => (
                    <li
                      key={s.id}
                      className="px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-mono">{s.email}</span>
                        <span className="text-dashboard-muted ml-2">{s.reason}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleClearSuppression(s.email)}
                        className="px-2 py-1 rounded border border-dashboard-border/60"
                      >
                        Unsuppress
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      <EmailAdminModal
        open={showSettingsModal}
        onClose={() => !savingConfig && setShowSettingsModal(false)}
        title="Global email settings"
        wide
      >
        {modalError && (
          <p className="text-sm text-red-600 mb-3">{modalError}</p>
        )}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={globalForm.is_enabled}
              onChange={(e) =>
                setGlobalForm((f) => ({ ...f, is_enabled: e.target.checked }))
              }
            />
            Email sending enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={globalForm.failover_enabled}
              onChange={(e) =>
                setGlobalForm((f) => ({ ...f, failover_enabled: e.target.checked }))
              }
            />
            Failover chain enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={globalForm.enforce_suppression}
              onChange={(e) =>
                setGlobalForm((f) => ({
                  ...f,
                  enforce_suppression: e.target.checked,
                }))
              }
            />
            Enforce suppression list before send
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={globalForm.sandbox_mode}
              onChange={(e) =>
                setGlobalForm((f) => ({ ...f, sandbox_mode: e.target.checked }))
              }
            />
            Sandbox mode (redirect all mail)
          </label>
          <input
            className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
            placeholder="Default from email"
            value={globalForm.default_from_email}
            onChange={(e) =>
              setGlobalForm((f) => ({ ...f, default_from_email: e.target.value }))
            }
          />
          <input
            className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
            placeholder="Default from name"
            value={globalForm.default_from_name}
            onChange={(e) =>
              setGlobalForm((f) => ({ ...f, default_from_name: e.target.value }))
            }
          />
          <input
            className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
            placeholder="Sandbox redirect to"
            value={globalForm.sandbox_redirect_to}
            onChange={(e) =>
              setGlobalForm((f) => ({
                ...f,
                sandbox_redirect_to: e.target.value,
              }))
            }
          />
          <button
            type="button"
            disabled={savingConfig}
            onClick={handleSaveConfig}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-bg-primary text-white disabled:opacity-50"
          >
            {savingConfig ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save settings
          </button>
        </div>
      </EmailAdminModal>

      <EmailAdminModal
        open={showAddModal}
        onClose={() => !savingProvider && setShowAddModal(false)}
        title="Add email provider"
        wide
      >
        {modalError && <p className="text-sm text-red-600 mb-3">{modalError}</p>}
        <ProviderFormFields
          form={providerForm}
          setForm={setProviderForm}
          onDriverChange={(driver) => {
            const preset = driverPreset(driver);
            setProviderForm((f) => ({
              ...f,
              driver,
              name: preset.name,
              base_url: preset.base_url ?? f.base_url,
              ...(preset.defaults
                ? {
                    smtp_host: preset.defaults.smtp_host ?? f.smtp_host,
                    smtp_port: String(preset.defaults.smtp_port ?? f.smtp_port),
                  }
                : {}),
            }));
          }}
        />
        <button
          type="button"
          disabled={savingProvider}
          onClick={handleCreateProvider}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-bg-primary text-white disabled:opacity-50"
        >
          {savingProvider ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Create provider
        </button>
      </EmailAdminModal>

      <EmailAdminModal
        open={!!editProvider}
        onClose={() => !savingEdit && (setEditProvider(null), setEditForm(null))}
        title={`Edit ${editProvider?.name ?? "provider"}`}
        wide
      >
        {modalError && <p className="text-sm text-red-600 mb-3">{modalError}</p>}
        {editForm && (
          <>
            <ProviderFormFields
              form={editForm}
              setForm={(updater) =>
                setEditForm((prev) => (prev ? updater(prev) : prev))
              }
              isEdit
              onDriverChange={() => {}}
            />
            <button
              type="button"
              disabled={savingEdit}
              onClick={handleSaveEdit}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-bg-primary text-white disabled:opacity-50"
            >
              {savingEdit ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
          </>
        )}
      </EmailAdminModal>

      <EmailAdminModal
        open={showTestModal}
        onClose={() => !testSending && setShowTestModal(false)}
        title="Test send email"
      >
        {modalError && <p className="text-sm text-red-600 mb-3">{modalError}</p>}
        <div className="space-y-3">
          <select
            className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
            value={testProviderId}
            onChange={(e) => setTestProviderId(e.target.value)}
          >
            {enabledProviders.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.driver})
              </option>
            ))}
          </select>
          <input
            className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
            placeholder="Recipient email"
            value={testForm.to}
            onChange={(e) => setTestForm((f) => ({ ...f, to: e.target.value }))}
          />
          <input
            className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
            placeholder="Subject (optional)"
            value={testForm.subject}
            onChange={(e) =>
              setTestForm((f) => ({ ...f, subject: e.target.value }))
            }
          />
          <textarea
            className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm min-h-[80px]"
            placeholder="Message (optional)"
            value={testForm.message}
            onChange={(e) =>
              setTestForm((f) => ({ ...f, message: e.target.value }))
            }
          />
          <button
            type="button"
            disabled={testSending || !testForm.to}
            onClick={handleTestSend}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-bg-primary text-white disabled:opacity-50"
          >
            {testSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send test
          </button>
        </div>
      </EmailAdminModal>
    </div>
  );
}

function ProviderFormFields({
  form,
  setForm,
  isEdit = false,
  onDriverChange,
}: {
  form: ProviderEditForm;
  setForm: (
    updater: (prev: ProviderEditForm) => ProviderEditForm,
  ) => void;
  isEdit?: boolean;
  onDriverChange: (driver: EmailDriver) => void;
}) {
  return (
    <div className="space-y-3">
      {!isEdit && (
        <select
          className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
          value={form.driver}
          onChange={(e) => onDriverChange(e.target.value as EmailDriver)}
        >
          <option value="resend">Resend</option>
          <option value="sendgrid">SendGrid</option>
          <option value="smtp">SMTP (Gmail / custom)</option>
        </select>
      )}
      <input
        className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
        placeholder="Provider name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />
      <input
        className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
        placeholder="Base URL (optional)"
        value={form.base_url}
        onChange={(e) => setForm((f) => ({ ...f, base_url: e.target.value }))}
      />
      {form.driver !== "smtp" ? (
        <input
          className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
          placeholder={isEdit ? "API key (leave blank to keep)" : "API key"}
          value={form.api_key}
          onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
        />
      ) : (
        <>
          <input
            className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
            placeholder="SMTP host"
            value={form.smtp_host}
            onChange={(e) => setForm((f) => ({ ...f, smtp_host: e.target.value }))}
          />
          <input
            className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
            placeholder="SMTP port"
            value={form.smtp_port}
            onChange={(e) => setForm((f) => ({ ...f, smtp_port: e.target.value }))}
          />
          <input
            className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
            placeholder="SMTP username"
            value={form.smtp_user}
            onChange={(e) => setForm((f) => ({ ...f, smtp_user: e.target.value }))}
          />
          <input
            className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
            placeholder={isEdit ? "Password (leave blank to keep)" : "SMTP password"}
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
        </>
      )}
      <input
        className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
        placeholder="From email"
        value={form.from_email}
        onChange={(e) => setForm((f) => ({ ...f, from_email: e.target.value }))}
      />
      <input
        className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
        placeholder="From name"
        value={form.from_name}
        onChange={(e) => setForm((f) => ({ ...f, from_name: e.target.value }))}
      />
      <input
        className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm"
        placeholder={isEdit ? "Webhook secret (leave blank to keep)" : "Webhook secret"}
        type="password"
        value={form.webhook_secret}
        onChange={(e) =>
          setForm((f) => ({ ...f, webhook_secret: e.target.value }))
        }
      />
      <textarea
        className="w-full rounded-lg border border-dashboard-border/60 px-3 py-2 text-sm min-h-[60px]"
        placeholder="Notes"
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
      />
    </div>
  );
}
