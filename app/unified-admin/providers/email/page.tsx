"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  HeartPulse,
  Search,
  Layers,
  BarChart3,
  Ban,
} from "lucide-react";
import { useAdminEmailProviders } from "@/hooks/admin/useAdminEmailProviders";
import { adminEmailProvidersApi } from "@/services/admin/email-providers-api";
import type {
  CreateEmailProviderPayload,
  EmailConfig,
  EmailDeliveryStatus,
  EmailMessagePurpose,
  EmailProviderConfig,
  UpdateEmailProviderPayload,
} from "@/types/admin/email-providers";
import { EmailAdminModal } from "./_components/EmailAdminModal";
import {
  ProviderEditor,
  buildProviderPayload,
  emptyProviderForm,
  providerToEditForm,
  type ProviderEditForm,
} from "./_components/ProviderForm";

const MESSAGE_STATUSES: {
  value: EmailDeliveryStatus;
  label: string;
  tone: "slate" | "sky" | "emerald" | "amber" | "rose" | "red";
}[] = [
  { value: "queued", label: "Queued", tone: "slate" },
  { value: "sent", label: "Sent", tone: "sky" },
  { value: "delivered", label: "Delivered", tone: "emerald" },
  { value: "failed", label: "Failed", tone: "red" },
  { value: "bounced", label: "Bounced", tone: "rose" },
  { value: "complained", label: "Complained", tone: "amber" },
];

const MESSAGE_PURPOSES: EmailMessagePurpose[] = [
  "otp",
  "transaction_alert",
  "support",
  "campaign",
  "ops_alert",
  "lifecycle",
  "test",
  "other",
];

const MESSAGE_PAGE_SIZE = 20;

const TONE_CHIP: Record<
  string,
  { active: string; idle: string }
> = {
  slate: {
    active: "bg-slate-600 text-white shadow-sm",
    idle: "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200",
  },
  sky: {
    active: "bg-sky-600 text-white shadow-sm",
    idle: "bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100",
  },
  emerald: {
    active: "bg-emerald-600 text-white shadow-sm",
    idle: "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100",
  },
  amber: {
    active: "bg-amber-500 text-white shadow-sm",
    idle: "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100",
  },
  rose: {
    active: "bg-rose-600 text-white shadow-sm",
    idle: "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100",
  },
  red: {
    active: "bg-red-600 text-white shadow-sm",
    idle: "bg-red-50 text-red-800 border border-red-200 hover:bg-red-100",
  },
  brand: {
    active: "bg-brand-bg-primary text-white shadow-sm",
    idle: "bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100",
  },
};

const STATUS_BADGE: Record<string, string> = {
  queued: "bg-slate-100 text-slate-700",
  sent: "bg-sky-100 text-sky-800",
  delivered: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  bounced: "bg-rose-100 text-rose-800",
  complained: "bg-amber-100 text-amber-900",
};

const DRIVER_BADGE: Record<string, string> = {
  sendgrid: "bg-indigo-50 text-indigo-700 border-indigo-200",
  resend: "bg-violet-50 text-violet-700 border-violet-200",
  smtp: "bg-teal-50 text-teal-700 border-teal-200",
  ses: "bg-amber-50 text-amber-800 border-amber-200",
};

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

function StatCard({
  label,
  value,
  sub,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "sky" | "emerald" | "red" | "amber" | "slate";
}) {
  const tones = {
    sky: "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white",
    emerald: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white",
    red: "border-red-200/80 bg-gradient-to-br from-red-50 to-white",
    amber: "border-amber-200/80 bg-gradient-to-br from-amber-50 to-white",
    slate: "border-dashboard-border/60 bg-dashboard-surface",
  };
  const valueTone = {
    sky: "text-sky-700",
    emerald: "text-emerald-700",
    red: "text-red-700",
    amber: "text-amber-700",
    slate: "text-dashboard-heading",
  };
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${tones[tone]}`}>
      <p className="text-xs font-medium text-dashboard-muted">{label}</p>
      <p className={`text-2xl font-bold tabular-nums mt-1 ${valueTone[tone]}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
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

function formatProviderTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const [healthCheckingId, setHealthCheckingId] = useState<string | null>(null);
  const [checkingAllHealth, setCheckingAllHealth] = useState(false);
  const [healthResults, setHealthResults] = useState<
    Record<string, { ok: boolean; message: string; at: number }>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
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
  const [providerForm, setProviderForm] = useState(emptyProviderForm);
  const [testForm, setTestForm] = useState({ to: "", subject: "", message: "" });
  const [testProviderId, setTestProviderId] = useState<string>("");
  const [msgPage, setMsgPage] = useState(1);
  const [msgSearch, setMsgSearch] = useState("");
  const [msgSearchDebounced, setMsgSearchDebounced] = useState("");
  const [msgStatus, setMsgStatus] = useState<EmailDeliveryStatus | "">("");
  const [msgPurpose, setMsgPurpose] = useState<EmailMessagePurpose | "">("");
  const [msgProvider, setMsgProvider] = useState("");
  const [openPanel, setOpenPanel] = useState<
    "settings" | "chain" | "volume" | "suppression" | null
  >(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    if (openPanel !== "settings") setGlobalForm(configToGlobalForm(config));
  }, [config, openPanel]);

  useEffect(() => {
    if (primaryProvider && !testProviderId) {
      setTestProviderId(primaryProvider.id);
    }
  }, [primaryProvider, testProviderId]);

  useEffect(() => {
    const t = setTimeout(() => setMsgSearchDebounced(msgSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [msgSearch]);

  useEffect(() => {
    setMsgPage(1);
  }, [msgSearchDebounced, msgStatus, msgPurpose, msgProvider]);

  useEffect(() => {
    void fetchMessages({
      page: msgPage,
      limit: MESSAGE_PAGE_SIZE,
      status: msgStatus || undefined,
      purpose: msgPurpose || undefined,
      provider_name: msgProvider || undefined,
      q: msgSearchDebounced || undefined,
    });
  }, [
    fetchMessages,
    msgPage,
    msgSearchDebounced,
    msgStatus,
    msgPurpose,
    msgProvider,
  ]);

  const enabledProviders = useMemo(
    () =>
      providers
        .filter((p) => !p.archived_at)
        .sort((a, b) => a.priority - b.priority),
    [providers],
  );

  const msgPagination = messages?.pagination;
  const msgTotalPages = msgPagination?.totalPages ?? 1;
  const msgTotal = msgPagination?.total ?? 0;
  const statusFacets = messages?.facets?.by_status ?? {};
  const providerFacets = messages?.facets?.by_provider ?? {};
  const statusFacetTotal = Object.values(statusFacets).reduce(
    (sum, n) => sum + n,
    0,
  );

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    setSettingsError(null);
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
        setOpenPanel(null);
        refetchAll();
      } else {
        setSettingsError(res.message);
      }
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCreateProvider = async () => {
    if (!providerForm.driver) return;
    setSavingProvider(true);
    setModalError(null);
    try {
      const payload: CreateEmailProviderPayload = {
        ...buildProviderPayload(providerForm),
        driver: providerForm.driver,
        is_enabled: true,
      };
      const res = await adminEmailProvidersApi.createProvider(payload);
      if (res.success) {
        setFormSuccess(`${payload.name} added to the provider chain.`);
        setShowAddModal(false);
        setProviderForm(emptyProviderForm());
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
      const { credentials, ...rest } = buildProviderPayload(editForm);
      const payload: UpdateEmailProviderPayload = rest;
      if (Object.keys(credentials).length > 0) payload.credentials = credentials;

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

  const handleHealthCheck = async (p: EmailProviderConfig) => {
    setHealthCheckingId(p.id);
    setFormError(null);
    try {
      const res = await adminEmailProvidersApi.checkProviderHealth(p.id);
      const payload = res.data;
      const ok = payload?.ok ?? res.success;
      const message =
        payload?.message || res.message || (ok ? "Healthy" : "Unhealthy");
      setHealthResults((prev) => ({
        ...prev,
        [p.id]: { ok, message, at: Date.now() },
      }));
      if (ok) {
        setFormSuccess(`${p.name}: ${message}`);
      } else {
        setFormError(`${p.name}: ${message}`);
      }
      refetchAll();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Health check failed";
      setHealthResults((prev) => ({
        ...prev,
        [p.id]: { ok: false, message, at: Date.now() },
      }));
      setFormError(`${p.name}: ${message}`);
    } finally {
      setHealthCheckingId(null);
    }
  };

  const handleCheckAllHealth = async () => {
    if (enabledProviders.length === 0) return;
    setCheckingAllHealth(true);
    setFormError(null);
    setFormSuccess(null);
    const failures: string[] = [];
    let passed = 0;
    for (const p of enabledProviders) {
      setHealthCheckingId(p.id);
      try {
        const res = await adminEmailProvidersApi.checkProviderHealth(p.id);
        const payload = res.data;
        const ok = payload?.ok ?? res.success;
        const message =
          payload?.message || res.message || (ok ? "Healthy" : "Unhealthy");
        setHealthResults((prev) => ({
          ...prev,
          [p.id]: { ok, message, at: Date.now() },
        }));
        if (ok) passed += 1;
        else failures.push(`${p.name}: ${message}`);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Health check failed";
        setHealthResults((prev) => ({
          ...prev,
          [p.id]: { ok: false, message, at: Date.now() },
        }));
        failures.push(`${p.name}: ${message}`);
      }
    }
    setHealthCheckingId(null);
    setCheckingAllHealth(false);
    refetchAll();
    if (failures.length === 0) {
      setFormSuccess(
        `All ${passed} provider${passed === 1 ? "" : "s"} passed health check.`,
      );
    } else {
      setFormError(
        `${passed} passed, ${failures.length} failed. ${failures[0]}`,
      );
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
        void fetchMessages({
          page: msgPage,
          limit: MESSAGE_PAGE_SIZE,
          status: msgStatus || undefined,
          purpose: msgPurpose || undefined,
          provider_name: msgProvider || undefined,
          q: msgSearchDebounced || undefined,
        });
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
                tone="sky"
              />
              <StatCard
                label="Delivered (this month)"
                value={summary?.monthly.messages_delivered ?? 0}
                tone="emerald"
              />
              <StatCard
                label="Failed (this month)"
                value={summary?.monthly.messages_failed ?? 0}
                tone="red"
              />
              <StatCard
                label="Bounced (this month)"
                value={summary?.monthly.messages_bounced ?? 0}
                sub={`Complained: ${summary?.monthly.messages_complained ?? 0}`}
                tone="amber"
              />
            </div>

            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <PanelToggle
                  open={openPanel === "settings"}
                  onToggle={() => {
                    if (openPanel !== "settings" && config) {
                      setGlobalForm(configToGlobalForm(config));
                    }
                    setSettingsError(null);
                    setOpenPanel((v) => (v === "settings" ? null : "settings"));
                  }}
                  icon={<Settings className="h-4 w-4" />}
                  title="Global email settings"
                  summary={
                    <>
                      <StatusPill tone={config?.is_enabled ? "emerald" : "slate"}>
                        {config?.is_enabled ? "Sending on" : "Sending off"}
                      </StatusPill>
                      <StatusPill tone={config?.failover_enabled ? "sky" : "slate"}>
                        {config?.failover_enabled ? "Failover on" : "Failover off"}
                      </StatusPill>
                      {config?.sandbox_mode ? (
                        <StatusPill tone="amber">Sandbox</StatusPill>
                      ) : null}
                    </>
                  }
                />
                <PanelToggle
                  open={openPanel === "chain"}
                  onToggle={() =>
                    setOpenPanel((v) => (v === "chain" ? null : "chain"))
                  }
                  icon={<Layers className="h-4 w-4" />}
                  title="Provider chain"
                  summary={
                    <span>
                      {enabledProviders.length} provider
                      {enabledProviders.length === 1 ? "" : "s"}
                      {primaryProvider ? (
                        <>
                          {" · Primary: "}
                          <span className="font-medium text-dashboard-heading">
                            {primaryProvider.name}
                          </span>
                        </>
                      ) : null}
                    </span>
                  }
                />
                <PanelToggle
                  open={openPanel === "volume"}
                  onToggle={() =>
                    setOpenPanel((v) => (v === "volume" ? null : "volume"))
                  }
                  icon={<BarChart3 className="h-4 w-4" />}
                  title="Daily volume"
                  summary={
                    <span>
                      <span className="font-medium text-dashboard-heading">
                        {dailyStats
                          .reduce((n, r) => n + r.messages_sent, 0)
                          .toLocaleString()}
                      </span>{" "}
                      sent in the last 30 days
                    </span>
                  }
                />
                <PanelToggle
                  open={openPanel === "suppression"}
                  onToggle={() =>
                    setOpenPanel((v) =>
                      v === "suppression" ? null : "suppression",
                    )
                  }
                  icon={<Ban className="h-4 w-4" />}
                  title="Suppression list"
                  summary={
                    suppressions.length > 0 ? (
                      <StatusPill tone="amber">
                        {suppressions.length.toLocaleString()} blocked
                      </StatusPill>
                    ) : (
                      <span>No blocked addresses</span>
                    )
                  }
                />
              </div>

              {openPanel === "settings" && (
                <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface shadow-sm">
                  <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-2">
                    <div className="space-y-1">
                      <p className="pb-1 text-[11px] font-semibold uppercase tracking-wide text-dashboard-muted">
                        Sending
                      </p>
                      <SettingSwitch
                        label="Email sending"
                        description="Turn off to stop all outgoing email."
                        checked={globalForm.is_enabled}
                        onChange={(v) => setGlobalForm((f) => ({ ...f, is_enabled: v }))}
                      />
                      <SettingSwitch
                        label="Failover"
                        description="If a provider fails, try the next one in the chain."
                        checked={globalForm.failover_enabled}
                        onChange={(v) => setGlobalForm((f) => ({ ...f, failover_enabled: v }))}
                      />
                      <SettingSwitch
                        label="Enforce suppression list"
                        description="Skip addresses that hard-bounced or complained."
                        checked={globalForm.enforce_suppression}
                        onChange={(v) => setGlobalForm((f) => ({ ...f, enforce_suppression: v }))}
                      />
                      <SettingSwitch
                        label="Sandbox mode"
                        description="Redirect every email to one test inbox."
                        checked={globalForm.sandbox_mode}
                        onChange={(v) => setGlobalForm((f) => ({ ...f, sandbox_mode: v }))}
                      />
                    </div>
                    <div className="space-y-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-dashboard-muted">
                        Defaults
                      </p>
                      <SettingInput
                        id="global-from-email"
                        label="Default from email"
                        hint="Overrides every provider's own sender when set. It must be verified on each provider."
                        type="email"
                        placeholder="Leave blank to use each provider's sender"
                        value={globalForm.default_from_email}
                        onChange={(v) => setGlobalForm((f) => ({ ...f, default_from_email: v }))}
                      />
                      <SettingInput
                        id="global-from-name"
                        label="Default from name"
                        placeholder="SmiPay"
                        value={globalForm.default_from_name}
                        onChange={(v) => setGlobalForm((f) => ({ ...f, default_from_name: v }))}
                      />
                      <SettingInput
                        id="global-sandbox-to"
                        label="Sandbox inbox"
                        hint="Where email goes while sandbox mode is on."
                        type="email"
                        placeholder="qa@smipay.ng"
                        value={globalForm.sandbox_redirect_to}
                        onChange={(v) => setGlobalForm((f) => ({ ...f, sandbox_redirect_to: v }))}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 border-t border-dashboard-border/60 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                    {settingsError ? (
                      <p className="flex items-start gap-1.5 text-sm text-red-600">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {settingsError}
                      </p>
                    ) : null}
                    <div className="flex justify-end gap-2 sm:ml-auto">
                      <button
                        type="button"
                        disabled={savingConfig}
                        onClick={() => setOpenPanel(null)}
                        className="rounded-lg border border-dashboard-border px-4 py-2 text-sm font-medium text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={savingConfig}
                        onClick={handleSaveConfig}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {savingConfig ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save settings
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {openPanel === "chain" && (
                <div className="overflow-hidden rounded-xl border border-dashboard-border/60 bg-dashboard-surface shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashboard-border/60 bg-slate-50/60 px-4 py-3">
                    <p className="text-xs text-dashboard-muted">
                      Emails go to the first enabled provider. If it fails, the next one takes over.
                    </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCheckAllHealth()}
                    disabled={
                      checkingAllHealth || enabledProviders.length === 0
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-dashboard-border/60 disabled:opacity-50"
                    title="Check credentials without sending mail"
                  >
                    {checkingAllHealth ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <HeartPulse className="h-3.5 w-3.5" />
                    )}
                    Check health
                  </button>
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
                      setProviderForm(emptyProviderForm());
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
                          {healthResults[p.id]?.ok === true && (
                            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Healthy
                            </span>
                          )}
                          {healthResults[p.id]?.ok === false && (
                            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                              Check failed
                            </span>
                          )}
                          {p.driver === "ses" &&
                            (p.defaults?.sns_topic_arn ? (
                              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-sky-50 text-sky-800">
                                Tracking on
                              </span>
                            ) : (
                              <span
                                className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-50 text-amber-800"
                                title="Add an SNS topic ARN to record deliveries and bounces"
                              >
                                Tracking off
                              </span>
                            ))}
                        </div>
                        <p className="text-xs text-dashboard-muted mt-1">
                          {p.driver}
                          {p.base_url ? ` · ${p.base_url}` : ""}
                          {p.defaults?.from_email ? ` · ${p.defaults.from_email}` : ""}
                        </p>
                        <p className="text-[11px] text-dashboard-muted mt-1 tabular-nums">
                          <span className="text-dashboard-heading font-medium">
                            {(p.stats?.attempts ?? 0).toLocaleString()}
                          </span>{" "}
                          attempts
                          <span className="mx-1.5 text-dashboard-border">·</span>
                          <span className="text-emerald-700 font-medium">
                            {(p.stats?.successful ?? 0).toLocaleString()}
                          </span>{" "}
                          ok
                          <span className="mx-1.5 text-dashboard-border">·</span>
                          <span className="text-red-700 font-medium">
                            {(p.stats?.failed ?? 0).toLocaleString()}
                          </span>{" "}
                          failed
                        </p>
                        <p className="text-[11px] text-dashboard-muted mt-0.5">
                          {[
                            formatProviderTime(p.last_success_at)
                              ? `Last success ${formatProviderTime(p.last_success_at)}`
                              : null,
                            formatProviderTime(p.last_failure_at)
                              ? `Last failure ${formatProviderTime(p.last_failure_at)}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "No send history yet"}
                        </p>
                        {healthResults[p.id] && (
                          <p
                            className={`text-[11px] mt-0.5 ${
                              healthResults[p.id].ok
                                ? "text-emerald-700"
                                : "text-red-700"
                            }`}
                          >
                            Last check: {healthResults[p.id].message}
                          </p>
                        )}
                        {p.notes && (
                          <p className="text-xs text-dashboard-muted mt-0.5">{p.notes}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleHealthCheck(p)}
                          disabled={
                            healthCheckingId === p.id || checkingAllHealth
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded border border-dashboard-border/60 disabled:opacity-50"
                          title="Check credentials without sending mail"
                        >
                          {healthCheckingId === p.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <HeartPulse className="h-3.5 w-3.5" />
                          )}
                          Health
                        </button>
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
              )}

              {openPanel === "volume" && (
                <div className="overflow-hidden rounded-xl border border-dashboard-border/60 bg-dashboard-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-sky-100 bg-slate-50/80 text-dashboard-muted">
                      <th className="text-left px-4 py-2.5 font-medium">Date</th>
                      <th className="text-right px-4 py-2.5 font-medium text-sky-700">Sent</th>
                      <th className="text-right px-4 py-2.5 font-medium text-emerald-700">Delivered</th>
                      <th className="text-right px-4 py-2.5 font-medium text-red-700">Failed</th>
                      <th className="text-right px-4 py-2.5 font-medium text-amber-700">Bounced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStats.slice(-14).map((row) => (
                      <tr key={row.date} className="border-b border-dashboard-border/40 hover:bg-slate-50/80">
                        <td className="px-4 py-2 font-medium text-dashboard-heading">
                          {new Date(row.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-sky-700">{row.messages_sent}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-emerald-700">{row.messages_delivered}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-red-700">{row.messages_failed}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-amber-700">{row.messages_bounced}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                </div>
              )}

              {openPanel === "suppression" && (
                <div className="overflow-hidden rounded-xl border border-dashboard-border/60 bg-dashboard-surface shadow-sm">
                  <p className="border-b border-dashboard-border/60 bg-slate-50/60 px-4 py-3 text-xs text-dashboard-muted">
                    Addresses we skip because they hard-bounced, complained or were blocked by a provider.
                  </p>
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
              )}
            </div>

            <div className="bg-dashboard-surface rounded-xl border border-dashboard-border/60 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-dashboard-border/60 space-y-3 bg-gradient-to-r from-orange-50/70 via-white to-sky-50/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-dashboard-heading">
                      Recent messages
                    </h2>
                    <p className="text-[11px] text-dashboard-muted mt-0.5">
                      {msgTotal.toLocaleString()} result{msgTotal === 1 ? "" : "s"}
                      {messagesLoading ? " · Updating…" : ""}
                    </p>
                  </div>
                  <div className="relative min-w-[220px] w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dashboard-muted" />
                    <input
                      type="search"
                      value={msgSearch}
                      onChange={(e) => setMsgSearch(e.target.value)}
                      placeholder="Search recipient, subject, provider…"
                      className="w-full rounded-lg border border-orange-200/80 bg-white py-2 pl-8 pr-3 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wide font-semibold text-dashboard-muted mr-1">
                      Status
                    </span>
                    <button
                      type="button"
                      onClick={() => setMsgStatus("")}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        !msgStatus
                          ? TONE_CHIP.brand.active
                          : "bg-white text-dashboard-muted border border-dashboard-border/60 hover:text-dashboard-heading"
                      }`}
                    >
                      All ({statusFacetTotal.toLocaleString()})
                    </button>
                    {MESSAGE_STATUSES.map(({ value, label, tone }) => {
                      const count = statusFacets[value] ?? 0;
                      const active = msgStatus === value;
                      const chip = TONE_CHIP[tone];
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setMsgStatus(active ? "" : value)
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            active ? chip.active : chip.idle
                          }`}
                        >
                          {label} ({count.toLocaleString()})
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wide font-semibold text-dashboard-muted mr-1">
                      Provider
                    </span>
                    <button
                      type="button"
                      onClick={() => setMsgProvider("")}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        !msgProvider
                          ? TONE_CHIP.brand.active
                          : "bg-white text-dashboard-muted border border-dashboard-border/60 hover:text-dashboard-heading"
                      }`}
                    >
                      All
                    </button>
                    {enabledProviders.map((p) => {
                      const count = providerFacets[p.name] ?? 0;
                      const active = msgProvider === p.name;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            setMsgProvider(active ? "" : p.name)
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            active
                              ? TONE_CHIP.brand.active
                              : "bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100"
                          }`}
                        >
                          {p.name} ({count.toLocaleString()})
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wide font-semibold text-dashboard-muted">
                      Purpose
                    </span>
                    <select
                      value={msgPurpose}
                      onChange={(e) =>
                        setMsgPurpose(e.target.value as EmailMessagePurpose | "")
                      }
                      className="rounded-lg border border-dashboard-border/60 bg-white px-2.5 py-1.5 text-xs shadow-sm"
                    >
                      <option value="">All purposes</option>
                      {MESSAGE_PURPOSES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {messagesLoading && !messages ? (
                <div className="p-6 text-center text-sm text-dashboard-muted">
                  Loading…
                </div>
              ) : (messages?.items ?? []).length === 0 ? (
                <div className="p-8 text-center text-sm text-dashboard-muted">
                  No messages match these filters.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-orange-100/80 bg-slate-50/90 text-dashboard-muted">
                          <th className="text-left px-4 py-2.5 font-medium">Time</th>
                          <th className="text-left px-4 py-2.5 font-medium">Provider</th>
                          <th className="text-left px-4 py-2.5 font-medium">Purpose</th>
                          <th className="text-left px-4 py-2.5 font-medium">To</th>
                          <th className="text-left px-4 py-2.5 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(messages?.items ?? []).map((m) => (
                          <tr
                            key={m.id}
                            className="border-b border-dashboard-border/40 hover:bg-orange-50/40 transition-colors"
                          >
                            <td className="px-4 py-2.5 whitespace-nowrap text-dashboard-muted">
                              {new Date(m.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-medium text-dashboard-heading">
                                  {m.provider_name}
                                </span>
                                {m.driver ? (
                                  <span
                                    className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                                      DRIVER_BADGE[m.driver] ??
                                      "bg-slate-50 text-slate-600 border-slate-200"
                                    }`}
                                  >
                                    {m.driver}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                                {m.purpose}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-dashboard-heading">
                              {m.to_masked}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                                  STATUS_BADGE[m.status] ?? "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {statusIcon(m.status)}
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-dashboard-border/40 bg-slate-50/50">
                    <span className="text-xs text-dashboard-muted">
                      Page {msgPagination?.page ?? msgPage} of {msgTotalPages}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMsgPage((p) => Math.max(1, p - 1))}
                        disabled={msgPage <= 1 || messagesLoading}
                        className="text-xs px-2.5 py-1 rounded-lg border border-dashboard-border/60 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-50"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setMsgPage((p) => Math.min(msgTotalPages, p + 1))
                        }
                        disabled={msgPage >= msgTotalPages || messagesLoading}
                        className="text-xs px-2.5 py-1 rounded-lg border border-dashboard-border/60 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {showAddModal && (
        <ProviderEditor
          mode="create"
          title="Add email provider"
          form={providerForm}
          setForm={setProviderForm}
          takenNames={providers.filter((p) => !p.archived_at).map((p) => p.name)}
          saving={savingProvider}
          error={modalError}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateProvider}
        />
      )}

      {editProvider && editForm && (
        <ProviderEditor
          mode="edit"
          title={editProvider?.name ?? "Provider"}
          form={editForm}
          setForm={(updater) =>
            setEditForm((prev) => (prev ? updater(prev) : prev))
          }
          takenNames={providers
            .filter((p) => !p.archived_at && p.id !== editProvider?.id)
            .map((p) => p.name)}
          saving={savingEdit}
          error={modalError}
          onClose={() => {
            setEditProvider(null);
            setEditForm(null);
          }}
          onSubmit={handleSaveEdit}
        />
      )}

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

function PanelToggle({
  open,
  onToggle,
  icon,
  title,
  summary,
}: {
  open: boolean;
  onToggle: () => void;
  icon: ReactNode;
  title: string;
  summary: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`flex w-full items-center gap-3 rounded-xl border bg-dashboard-surface px-4 py-3 text-left shadow-sm transition ${
        open
          ? "border-brand-bg-primary/50 ring-2 ring-brand-bg-primary/10"
          : "border-dashboard-border/60 hover:border-dashboard-border"
      }`}
    >
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          open ? "bg-brand-bg-primary text-white" : "bg-slate-100 text-slate-600"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-dashboard-heading">
          {title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-dashboard-muted">
          {summary}
        </span>
      </span>
      <ChevronDown
        className={`h-4 w-4 shrink-0 text-dashboard-muted transition-transform ${
          open ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

const PILL_TONE = {
  emerald: "bg-emerald-100 text-emerald-800",
  sky: "bg-sky-100 text-sky-800",
  amber: "bg-amber-100 text-amber-800",
  slate: "bg-slate-100 text-slate-600",
} as const;

function StatusPill({
  tone,
  children,
}: {
  tone: keyof typeof PILL_TONE;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PILL_TONE[tone]}`}
    >
      {children}
    </span>
  );
}

function SettingSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg px-1 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-dashboard-heading">{label}</p>
        <p className="text-xs text-dashboard-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-brand-bg-primary" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function SettingInput({
  id,
  label,
  hint,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-dashboard-heading">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-dashboard-border bg-dashboard-surface px-3 py-2 text-sm text-dashboard-heading placeholder:text-slate-400 focus:border-brand-bg-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20"
      />
      {hint ? <p className="text-xs text-dashboard-muted">{hint}</p> : null}
    </div>
  );
}
